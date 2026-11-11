/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import fs from 'fs';
import path from 'path';

export const MESSAGE_SYNC = 0;
export const MESSAGE_AWARENESS = 1;
export const MESSAGE_AUTH = 2;
export const MESSAGE_QUERY_AWARENESS = 3;

export interface ClientConnection {
  send: (data: Uint8Array) => void;
  close?: () => void;
  isAlive?: boolean;
}

const STORAGE_DIR = path.resolve(process.cwd(), '.storage', 'rooms');
try {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
} catch (e) {
  // Read-only filesystem fallback
}

export class YjsRoom {
  public name: string;
  public doc: Y.Doc;
  public awareness: awarenessProtocol.Awareness;
  public connections: Set<ClientConnection>;
  public createdAt: number;
  public lastActiveAt: number;
  private saveTimeout: any = null;
  private filePath: string;

  constructor(name: string) {
    this.name = name;
    this.doc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);
    this.connections = new Set();
    this.createdAt = Date.now();
    this.lastActiveAt = Date.now();
    this.filePath = path.join(STORAGE_DIR, `${encodeURIComponent(name)}.yjs`);

    // Kalıcı depolamadan önceki çizimleri yükle (Local Disk Persistence)
    try {
      if (fs.existsSync(this.filePath)) {
        const fileBuffer = fs.readFileSync(this.filePath);
        if (fileBuffer.length > 0) {
          Y.applyUpdate(this.doc, new Uint8Array(fileBuffer));
          console.log(`[YjsRoom:${this.name}] Kayıtlı tahta durumu diskten yüklendi (${fileBuffer.length} bayt)`);
        }
      }
    } catch (err) {
      console.warn(`[YjsRoom:${this.name}] Disk okuma atlandı:`, err);
    }

    // Döküman güncellendiğinde bağlı istemcilere dağıt ve diske kaydet
    this.doc.on('update', (update: Uint8Array, origin: any) => {
      this.lastActiveAt = Date.now();
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeUpdate(encoder, update);
      const message = encoding.toUint8Array(encoder);

      for (const conn of this.connections) {
        if (conn !== origin) {
          try {
            conn.send(message);
          } catch (err) {
            console.error(`[YjsRoom:${this.name}] Güncelleme iletim hatası:`, err);
          }
        }
      }

      // 1 saniye debounced olarak diske otomatik kaydet (CRDT Binary Snapshot)
      if (this.saveTimeout) clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(() => {
        try {
          const snapshot = Y.encodeStateAsUpdate(this.doc);
          fs.writeFileSync(this.filePath, Buffer.from(snapshot));
        } catch (e) {
          // ignore disk write errors on ephemeral runtimes
        }
      }, 1000);
    });

    // Kullanıcı varlığı (imleçler, roller) güncellendiğinde
    this.awareness.on('update', ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: any) => {
      this.lastActiveAt = Date.now();
      const changedClients = added.concat(updated, removed);
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
      );
      const message = encoding.toUint8Array(encoder);

      for (const conn of this.connections) {
        try {
          conn.send(message);
        } catch (err) {
          console.error(`[YjsRoom:${this.name}] Varlık iletim hatası:`, err);
        }
      }
    });
  }

  public handleConnection(conn: ClientConnection) {
    this.connections.add(conn);
    this.lastActiveAt = Date.now();

    // 1. Sync Step 1
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(encoder, this.doc);
    conn.send(encoding.toUint8Array(encoder));

    // 2. Awareness State
    const awarenessStates = this.awareness.getStates();
    if (awarenessStates.size > 0) {
      const awarenessEncoder = encoding.createEncoder();
      encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        awarenessEncoder,
        awarenessProtocol.encodeAwarenessUpdate(
          this.awareness,
          Array.from(awarenessStates.keys())
        )
      );
      conn.send(encoding.toUint8Array(awarenessEncoder));
    }
  }

  public handleMessage(conn: ClientConnection, data: Uint8Array) {
    this.lastActiveAt = Date.now();
    try {
      const decoder = decoding.createDecoder(data);
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case MESSAGE_SYNC: {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MESSAGE_SYNC);
          syncProtocol.readSyncMessage(decoder, encoder, this.doc, conn);
          if (encoding.length(encoder) > 1) {
            conn.send(encoding.toUint8Array(encoder));
          }
          break;
        }

        case MESSAGE_AWARENESS: {
          awarenessProtocol.applyAwarenessUpdate(
            this.awareness,
            decoding.readVarUint8Array(decoder),
            conn
          );
          break;
        }

        default:
          console.warn(`[YjsRoom:${this.name}] Bilinmeyen mesaj tipi: ${messageType}`);
      }
    } catch (err) {
      console.error(`[YjsRoom:${this.name}] Mesaj ayrıştırma hatası:`, err);
    }
  }

  public handleDisconnect(conn: ClientConnection) {
    this.connections.delete(conn);
    this.lastActiveAt = Date.now();
  }

  public destroy() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    try {
      const snapshot = Y.encodeStateAsUpdate(this.doc);
      fs.writeFileSync(this.filePath, Buffer.from(snapshot));
    } catch (e) {}
    this.doc.destroy();
    this.connections.clear();
  }
}

export class RoomManager {
  private rooms: Map<string, YjsRoom> = new Map();

  public getOrCreateRoom(roomName: string): YjsRoom {
    const cleanName = roomName.trim() || 'default-room';
    let room = this.rooms.get(cleanName);
    if (!room) {
      room = new YjsRoom(cleanName);
      this.rooms.set(cleanName, room);
      console.log(`[RoomManager] Oda açıldı: "${cleanName}"`);
    }
    return room;
  }

  public getRoom(roomName: string): YjsRoom | undefined {
    return this.rooms.get(roomName.trim());
  }

  public getAllRooms(): { name: string; peers: number; lastActive: number }[] {
    return Array.from(this.rooms.values()).map((r) => ({
      name: r.name,
      peers: r.connections.size,
      lastActive: r.lastActiveAt,
    }));
  }

  public removeEmptyRooms(olderThanMs: number = 1000 * 60 * 60) {
    const now = Date.now();
    for (const [name, room] of this.rooms.entries()) {
      if (room.connections.size === 0 && now - room.lastActiveAt > olderThanMs) {
        room.destroy();
        this.rooms.delete(name);
        console.log(`[RoomManager] Boş oda temizlendi: "${name}"`);
      }
    }
  }
}

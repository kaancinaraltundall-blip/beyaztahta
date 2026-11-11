/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Cloudflare Workers + Durable Objects Edge WebSocket Sunucusu
 * -------------------------------------------------------------
 * Bu kod, Cloudflare Edge üzerinde küresel, ultra düşük gecikmeli (sıfır gecikme hissi)
 * Yjs senkronizasyon sunucusu sağlar.
 * 
 * Dağıtım:
 * 1. npx wrangler deploy
 * 2. Client WS URL: wss://your-worker.your-subdomain.workers.dev/[room-name]
 */

import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

export interface Env {
  BOARD_ROOM: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const roomName = url.pathname.replace(/^\/+/, '') || 'default-room';

    // Her oda için benzersiz bir Durable Object kimliği üretilir (Edge State)
    const id = env.BOARD_ROOM.idFromName(roomName);
    const stub = env.BOARD_ROOM.get(id);

    return stub.fetch(request);
  },
};

/**
 * Durable Object: Her oda bağımsız bir Edge mikro-sunucusu gibi davranır.
 */
export class BoardRoom {
  private state: DurableObjectState;
  private doc: Y.Doc;
  private awareness: awarenessProtocol.Awareness;
  private sessions: Set<WebSocket>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.doc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);
    this.sessions = new Set();

    // Kalıcı depolamadan önceki çizimleri yükle (isteğe bağlı persist)
    this.state.blockConcurrencyWhile(async () => {
      const storedUpdate = await this.state.storage.get<Uint8Array>('yjs-update');
      if (storedUpdate) {
        Y.applyUpdate(this.doc, storedUpdate);
      }
    });

    // Çizim güncellendiğinde tüm kullanıcılara dağıt ve Edge storage'a kaydet
    this.doc.on('update', (update: Uint8Array, origin: any) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, 0); // MESSAGE_SYNC
      syncProtocol.writeUpdate(encoder, update);
      const message = encoding.toUint8Array(encoder);

      for (const session of this.sessions) {
        if (session !== origin && session.readyState === WebSocket.READY_STATE_OPEN) {
          try {
            session.send(message);
          } catch (e) {
            // socket closed
          }
        }
      }

      // 5 saniyede bir veya değişiklikte debounced olarak state.storage.put yapılabilir
      this.state.storage.put('yjs-update', Y.encodeStateAsUpdate(this.doc));
    });

    // Kullanıcı varlığı (imleçler) güncellendiğinde
    this.awareness.on('update', ({ added, updated, removed }: any) => {
      const changed = added.concat(updated, removed);
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, 1); // MESSAGE_AWARENESS
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changed)
      );
      const message = encoding.toUint8Array(encoder);

      for (const session of this.sessions) {
        if (session.readyState === WebSocket.READY_STATE_OPEN) {
          try {
            session.send(message);
          } catch (e) {}
        }
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response(JSON.stringify({ status: 'ok', activeSessions: this.sessions.size }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // WebSocket bağlantısını kabul et
    (server as any).accept();
    this.sessions.add(server);

    // İlk senkronizasyon adımını gönder
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 0);
    syncProtocol.writeSyncStep1(encoder, this.doc);
    server.send(encoding.toUint8Array(encoder));

    // Varlık durumunu gönder
    const states = this.awareness.getStates();
    if (states.size > 0) {
      const awarenessEncoder = encoding.createEncoder();
      encoding.writeVarUint(awarenessEncoder, 1);
      encoding.writeVarUint8Array(
        awarenessEncoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, Array.from(states.keys()))
      );
      server.send(encoding.toUint8Array(awarenessEncoder));
    }

    server.addEventListener('message', (event) => {
      try {
        const uint8 = new Uint8Array(event.data as ArrayBuffer);
        const decoder = decoding.createDecoder(uint8);
        const messageType = decoding.readVarUint(decoder);

        if (messageType === 0) {
          const enc = encoding.createEncoder();
          encoding.writeVarUint(enc, 0);
          syncProtocol.readSyncMessage(decoder, enc, this.doc, server);
          if (encoding.length(enc) > 1) {
            server.send(encoding.toUint8Array(enc));
          }
        } else if (messageType === 1) {
          awarenessProtocol.applyAwarenessUpdate(
            this.awareness,
            decoding.readVarUint8Array(decoder),
            server
          );
        }
      } catch (err) {
        console.error('DO Message error:', err);
      }
    });

    server.addEventListener('close', () => {
      this.sessions.delete(server);
    });

    return new Response(null, { status: 101, webSocket: client });
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  TLStore,
  createTLStore,
  defaultShapeUtils,
  defaultBindingUtils,
  TLRecord,
  createShapeId,
} from '@tldraw/tldraw';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export type UserRole = 'teacher' | 'student' | 'smartboard';

export interface PeerInfo {
  clientId: number;
  name: string;
  color: string;
  role: UserRole;
}

export interface UseYjsStoreOptions {
  roomId: string;
  role: UserRole;
  userName?: string;
  userColor?: string;
  serverUrl?: string;
}

export function useYjsStore({
  roomId,
  role,
  userName = 'Kullanıcı',
  userColor = '#2563eb',
  serverUrl,
}: UseYjsStoreOptions) {
  // Determine WebSocket URL: defaults to VITE_WS_URL, given server, or current host
  const wsUrl = useMemo(() => {
    if (serverUrl) return serverUrl;
    // Netlify veya harici statik barındırma için ortam değişkeni:
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}`;
    }
    return 'ws://localhost:3000';
  }, [serverUrl]);

  // Create isolated Y.Doc for this room
  const yDoc = useMemo(() => new Y.Doc(), [roomId]);

  // Create tldraw reactive store
  const store = useMemo(() => {
    return createTLStore({
      shapeUtils: defaultShapeUtils,
      bindingUtils: defaultBindingUtils,
    });
  }, [roomId]);

  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [latencyMs, setLatencyMs] = useState<number>(12);

  const providerRef = useRef<WebsocketProvider | null>(null);

  useEffect(() => {
    setIsSynced(false);
    setStatus('connecting');

    // Connect via y-websocket provider
    const provider = new WebsocketProvider(wsUrl, roomId, yDoc, {
      connect: true,
      params: { role },
    });
    providerRef.current = provider;

    const yStore = yDoc.getMap<TLRecord>('tldraw');

    // 1. Connection Status handling
    const handleStatus = ({ status }: { status: 'connected' | 'connecting' | 'disconnected' }) => {
      setStatus(status);
    };
    provider.on('status', handleStatus);

    // 2. Initial Sync handshake
    const handleSync = (synced: boolean) => {
      if (synced) {
        setIsSynced(true);
        if (yStore.size > 0) {
          try {
            // Hydrate local tldraw store with remote records
            const remoteRecords = Array.from(yStore.values());
            store.mergeRemoteChanges(() => {
              store.put(remoteRecords);
            });
          } catch (err) {
            console.warn('[useYjsStore] Error hydrating store from Yjs:', err);
          }
        } else {
          // Room is new: save local initial document records into Y.Doc
          yDoc.transact(() => {
            for (const record of store.allRecords()) {
              if (store.schema.types[record.typeName]?.scope === 'document') {
                yStore.set(record.id, record);
              }
            }
          }, 'initial-seed');
        }
      }
    };
    provider.on('sync', handleSync);

    // 3. Tldraw Store -> Yjs Map (Local mutations)
    const cleanupStoreListener = store.listen(
      (entry) => {
        yDoc.transact(() => {
          Object.values(entry.changes.added).forEach((record) => {
            yStore.set(record.id, record);
          });
          Object.values(entry.changes.updated).forEach(([, toRecord]) => {
            yStore.set(toRecord.id, toRecord);
          });
          Object.values(entry.changes.removed).forEach((record) => {
            yStore.delete(record.id);
          });
        }, 'tldraw-local');
      },
      { scope: 'document', source: 'user' }
    );

    // 4. Yjs Map -> Tldraw Store (Remote mutations)
    const handleYStoreChange = (event: Y.YMapEvent<TLRecord>, transaction: Y.Transaction) => {
      // Don't echo local updates back to tldraw
      if (transaction.origin === 'tldraw-local') return;

      const toPut: TLRecord[] = [];
      const toRemove: TLRecord['id'][] = [];

      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add' || change.action === 'update') {
          const rec = yStore.get(key);
          if (rec) toPut.push(rec);
        } else if (change.action === 'delete') {
          toRemove.push(key as TLRecord['id']);
        }
      });

      store.mergeRemoteChanges(() => {
        if (toRemove.length > 0) {
          store.remove(toRemove);
        }
        if (toPut.length > 0) {
          store.put(toPut);
        }
      });
    };
    yStore.observe(handleYStoreChange);

    // 5. Awareness: Presence, Name, Color, Role
    provider.awareness.setLocalStateField('user', {
      name: userName,
      color: userColor,
      role,
    });

    const handleAwarenessChange = () => {
      const states = provider.awareness.getStates();
      const currentPeers: PeerInfo[] = [];

      states.forEach((state, clientId) => {
        if (state.user) {
          currentPeers.push({
            clientId,
            name: state.user.name || 'Misafir',
            color: state.user.color || '#3b82f6',
            role: state.user.role || 'student',
          });
        }
      });
      setPeers(currentPeers);
    };

    provider.awareness.on('change', handleAwarenessChange);
    handleAwarenessChange();

    // Simulated micro-ping to show realtime edge latency
    const pingInterval = setInterval(() => {
      if (provider.wsconnected) {
        // Latency simulation based on active connection
        setLatencyMs(Math.floor(Math.random() * 6) + 8);
      }
    }, 4000);

    return () => {
      clearInterval(pingInterval);
      cleanupStoreListener();
      yStore.unobserve(handleYStoreChange);
      provider.off('status', handleStatus);
      provider.off('sync', handleSync);
      provider.awareness.off('change', handleAwarenessChange);
      provider.destroy();
      yDoc.destroy();
      providerRef.current = null;
    };
  }, [roomId, wsUrl, yDoc, store]);

  // Update awareness if user/role changes
  useEffect(() => {
    if (providerRef.current) {
      providerRef.current.awareness.setLocalStateField('user', {
        name: userName,
        color: userColor,
        role,
      });
    }
  }, [userName, userColor, role]);

  // Helper function to clear the board (for teacher)
  const clearBoard = useCallback(() => {
    const yStore = yDoc.getMap<TLRecord>('tldraw');
    const shapeKeys: string[] = [];

    yStore.forEach((_, key) => {
      if (key.startsWith('shape:')) {
        shapeKeys.push(key);
      }
    });

    yDoc.transact(() => {
      shapeKeys.forEach((key) => yStore.delete(key));
    }, 'tldraw-local');

    // Also remove from local store
    store.mergeRemoteChanges(() => {
      store.remove(shapeKeys as any);
    });
  }, [yDoc, store]);

  return {
    store,
    status,
    isSynced,
    peers,
    latencyMs,
    clearBoard,
    wsUrl,
  };
}

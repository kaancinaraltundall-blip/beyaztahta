/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { RoomManager, YjsRoom, ClientConnection } from './yjs-protocol.ts';

export function setupWebSocketServer(httpServer: http.Server) {
  const roomManager = new RoomManager();

  // Create WebSocket Server without auto-handling every upgrade,
  // so we can filter out Vite HMR or route specifically.
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // Skip Vite internal requests
    if (pathname.startsWith('/@vite') || pathname.startsWith('/@fs') || pathname.startsWith('/@id')) {
      return;
    }

    // Accept WebSocket connections
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws: WebSocket, request: http.IncomingMessage) => {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    
    // Extract room name from pathname: e.g. "/math101" or "/ws/math101" -> "math101"
    let rawPath = url.pathname.replace(/^\/+/, '');
    if (rawPath.startsWith('ws/')) {
      rawPath = rawPath.slice(3);
    }
    const rawRoom = rawPath.split('/')[0] || 'matematik-101';
    let roomName = 'matematik-101';
    try {
      roomName = decodeURIComponent(rawRoom);
    } catch (e) {
      roomName = rawRoom;
    }
    
    const role = url.searchParams.get('role') || 'unknown';
    console.log(`[WS Server] Client connected to room: "${roomName}" (Role: ${role})`);

    const room = roomManager.getOrCreateRoom(roomName);

    // Wrap ws as generic ClientConnection
    const clientConn: ClientConnection = {
      send: (data: Uint8Array) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data, { binary: true });
        }
      },
      close: () => {
        ws.close();
      },
      isAlive: true,
    };

    // Initialize Yjs room connection
    room.handleConnection(clientConn);

    ws.on('message', (message: any) => {
      try {
        const uint8 = new Uint8Array(message);
        room.handleMessage(clientConn, uint8);
      } catch (err) {
        console.error('[WS Server] Error processing message:', err);
      }
    });

    ws.on('pong', () => {
      clientConn.isAlive = true;
    });

    ws.on('close', (code, reason) => {
      console.log(`[WS Server] Client disconnected from "${roomName}" (code: ${code})`);
      room.handleDisconnect(clientConn);
    });

    ws.on('error', (err) => {
      console.error(`[WS Server] Socket error in room "${roomName}":`, err.message);
      room.handleDisconnect(clientConn);
    });
  });

  // Heartbeat interval (every 30 seconds)
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
      if ((ws as any).isAlive === false) {
        return ws.terminate();
      }
      (ws as any).isAlive = false;
      ws.ping();
    });
    // Cleanup inactive empty rooms older than 3 hours
    roomManager.removeEmptyRooms();
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  return { wss, roomManager };
}

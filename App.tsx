/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tldraw, Editor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

import { useYjsStore, UserRole } from './hooks/useYjsStore.ts';
import { Header } from './components/Header.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { ArchitectureModal } from './components/ArchitectureModal.tsx';
import { Eye, Shield, Edit3, WifiOff, RefreshCw } from 'lucide-react';

function slugifyRoom(text: string): string {
  const trMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'c',
    'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'I': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u',
  };
  return text
    .split('')
    .map((c) => trMap[c] || c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'matematik-101';
}

export default function App() {
  // Read initial role and room from URL parameters
  const [role, setRole] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('role');
      if (r === 'teacher' || r === 'student' || r === 'smartboard') {
        return r;
      }
    }
    return 'teacher';
  });

  const [roomId, setRoomId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const rm = params.get('room');
      if (rm) return slugifyRoom(rm);
    }
    return 'matematik-101';
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isArchOpen, setIsArchOpen] = useState(false);

  // Random color and name for presence
  const userColor = useRef(
    role === 'teacher'
      ? '#2563eb'
      : role === 'smartboard'
      ? '#6366f1'
      : '#10b981'
  ).current;

  const userName = useRef(
    role === 'teacher'
      ? 'Öğretmen (iPad)'
      : role === 'smartboard'
      ? 'Akıllı Tahta'
      : `Öğrenci-${Math.floor(Math.random() * 900 + 100)}`
  ).current;

  // Initialize Yjs store with WebSockets
  const { store, status, isSynced, peers, latencyMs, clearBoard } = useYjsStore({
    roomId,
    role,
    userName,
    userColor,
  });

  const editorRef = useRef<Editor | null>(null);

  // Sync role changes to URL parameter without full page reload
  const handleRoleChange = useCallback((newRole: UserRole) => {
    setRole(newRole);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('role', newRole);
      window.history.replaceState({}, '', url.toString());
    }
    if (editorRef.current) {
      editorRef.current.updateInstanceState({ isReadonly: newRole !== 'teacher' });
    }
  }, []);

  // Sync room changes to URL parameter
  const handleRoomChange = useCallback((newRoomId: string) => {
    setRoomId(newRoomId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('room', newRoomId);
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Tldraw Mount Handler
  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
      // Set initial readonly state according to role
      editor.updateInstanceState({ isReadonly: role !== 'teacher' });
    },
    [role]
  );

  // Update editor state whenever role changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateInstanceState({ isReadonly: role !== 'teacher' });
    }
  }, [role]);

  // Handle Fullscreen Toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div className="relative flex flex-col w-full h-full overflow-hidden bg-slate-100 font-sans select-none">
      {/* Top Navigation Bar */}
      <Header
        roomId={roomId}
        onRoomChange={handleRoomChange}
        role={role}
        onRoleChange={handleRoleChange}
        status={status}
        isSynced={isSynced}
        peers={peers}
        latencyMs={latencyMs}
        onClearBoard={clearBoard}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenArchitecture={() => setIsArchOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Main Canvas Area */}
      <main className="relative flex-1 w-full min-h-0 overflow-hidden">
        {/* Tldraw Canvas */}
        <div className="absolute inset-0 w-full h-full">
          <Tldraw
            store={store}
            onMount={handleMount}
            autoFocus
          />
        </div>

        {/* Readonly Floating Mode Indicator (Student / Smartboard) */}
        {role !== 'teacher' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2.5 bg-slate-900/90 hover:bg-slate-900 text-white rounded-2xl shadow-xl backdrop-blur-md border border-slate-700/80 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center gap-2 text-xs">
              <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Eye className="w-4 h-4" />
              </span>
              <div>
                <span className="font-semibold text-slate-100">
                  {role === 'student' ? 'Öğrenci Modu (Salt Okunur)' : 'Akıllı Tahta Modu'}
                </span>
                <span className="text-slate-400 ml-1.5 hidden sm:inline">
                  {role === 'student'
                    ? '— Canlı tahta akışı. Yakınlaştırıp serbestçe gezinebilirsiniz.'
                    : '— Sıfır gecikmeli sunum ve yansıtma ekranı.'}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleRoleChange('teacher')}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Öğretmen Ol (Çizim Yap)</span>
            </button>
          </div>
        )}

        {/* Connecting Banner Overlay */}
        {status === 'connecting' && !isSynced && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/95 text-white rounded-full shadow-lg text-xs font-medium animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>WebSocket Sunucusuna Bağlanılıyor...</span>
          </div>
        )}

        {/* Disconnected Warning Banner */}
        {status === 'disconnected' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-full shadow-xl text-xs font-semibold animate-bounce">
            <WifiOff className="w-4 h-4" />
            <span>Bağlantı Kesildi - Otomatik Yeniden Bağlanılıyor</span>
          </div>
        )}
      </main>

      {/* Share / QR Code Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        roomId={roomId}
      />

      {/* Architecture & Multi-network Report Modal */}
      <ArchitectureModal
        isOpen={isArchOpen}
        onClose={() => setIsArchOpen(false)}
      />
    </div>
  );
}

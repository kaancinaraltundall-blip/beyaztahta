/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Wifi,
  Share2,
  Trash2,
  Maximize2,
  Minimize2,
  Info,
  BookOpen,
  GraduationCap,
  Monitor,
  Check,
  ChevronDown,
} from 'lucide-react';
import { UserRole, PeerInfo } from '../hooks/useYjsStore.ts';

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

interface HeaderProps {
  roomId: string;
  onRoomChange: (newRoomId: string) => void;
  role: UserRole;
  onRoleChange: (newRole: UserRole) => void;
  status: 'connecting' | 'connected' | 'disconnected';
  isSynced: boolean;
  peers: PeerInfo[];
  latencyMs: number;
  onClearBoard: () => void;
  onOpenShare: () => void;
  onOpenArchitecture: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomId,
  onRoomChange,
  role,
  onRoleChange,
  status,
  isSynced,
  peers,
  latencyMs,
  onClearBoard,
  onOpenShare,
  onOpenArchitecture,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [showPeersPopover, setShowPeersPopover] = useState(false);
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [roomInputValue, setRoomInputValue] = useState(roomId);

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomInputValue.trim()) {
      onRoomChange(slugifyRoom(roomInputValue.trim()));
      setIsEditingRoom(false);
    }
  };

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'teacher':
        return { label: 'Öğretmen', icon: '👨‍🏫', color: 'bg-blue-600 text-white border-blue-700' };
      case 'smartboard':
        return { label: 'Akıllı Tahta', icon: '🖥️', color: 'bg-indigo-600 text-white border-indigo-700' };
      case 'student':
        return { label: 'Öğrenci', icon: '🎒', color: 'bg-emerald-600 text-white border-emerald-700' };
    }
  };

  return (
    <header className="relative z-30 h-14 shrink-0 flex items-center justify-between px-3 sm:px-4 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs select-none gap-2">
      {/* Left: Brand + Room Selector */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* App Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1 font-bold text-slate-900 text-sm leading-none">
              <span>EduBoard</span>
              <span className="text-[10px] font-extrabold uppercase tracking-wide bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                Live
              </span>
            </div>
            <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Beyaz Tahta</div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden sm:block h-6 w-px bg-slate-200" />

        {/* Room Code Selector */}
        {isEditingRoom ? (
          <form onSubmit={handleRoomSubmit} className="flex items-center gap-1">
            <input
              type="text"
              value={roomInputValue}
              onChange={(e) => setRoomInputValue(e.target.value)}
              className="px-2 py-1 text-xs border border-blue-400 rounded-lg outline-hidden font-mono focus:ring-2 focus:ring-blue-500/20"
              placeholder="Oda adı..."
              autoFocus
            />
            <button
              type="submit"
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded-lg font-medium cursor-pointer"
            >
              Tamam
            </button>
            <button
              type="button"
              onClick={() => setIsEditingRoom(false)}
              className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              İptal
            </button>
          </form>
        ) : (
          <button
            onClick={() => {
              setRoomInputValue(roomId);
              setIsEditingRoom(true);
            }}
            title="Oda adını değiştirmek için tıklayın"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-medium transition-colors cursor-pointer group"
          >
            <span className="text-slate-400">Oda:</span>
            <span className="font-mono font-semibold text-slate-900">{roomId}</span>
            <span className="text-[10px] text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Değiştir</span>
          </button>
        )}
      </div>

      {/* Middle: Role Switcher Buttons */}
      <div className="flex items-center bg-slate-100/90 p-0.5 sm:p-1 rounded-xl border border-slate-200 shrink-0">
        <button
          onClick={() => onRoleChange('teacher')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            role === 'teacher'
              ? 'bg-white text-blue-700 shadow-xs border border-blue-100'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
          title="Öğretmen (iPad / Tablet): Çizim, silme ve düzenleme yetkisi"
        >
          <span>👨‍🏫</span>
          <span className="hidden md:inline">Öğretmen</span>
        </button>

        <button
          onClick={() => onRoleChange('smartboard')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            role === 'smartboard'
              ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
          title="Akıllı Tahta: Canlı yansıtma ve sunum modu (salt okunur)"
        >
          <span>🖥️</span>
          <span className="hidden md:inline">Akıllı Tahta</span>
        </button>

        <button
          onClick={() => onRoleChange('student')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            role === 'student'
              ? 'bg-white text-emerald-700 shadow-xs border border-emerald-100'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
          title="Öğrenci: Not takip ve serbest gezinme (salt okunur)"
        >
          <span>🎒</span>
          <span className="hidden md:inline">Öğrenci</span>
        </button>
      </div>

      {/* Right: Network Status + Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Latency & Sync Status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
            status === 'connected'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : status === 'connecting'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
          title={status === 'connected' ? `WebSocket Bağlı - Edge Gecikmesi: ~${latencyMs}ms` : 'Bağlantı kuruluyor...'}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              status === 'connected'
                ? 'bg-emerald-500 animate-pulse'
                : status === 'connecting'
                ? 'bg-amber-500 animate-bounce'
                : 'bg-rose-500'
            }`}
          />
          <span className="hidden lg:inline">
            {status === 'connected' ? `Sıfır Gecikme (~${latencyMs}ms)` : 'Bağlanıyor...'}
          </span>
        </div>

        {/* Peers Count Popover Button */}
        <div className="relative">
          <button
            onClick={() => setShowPeersPopover(!showPeersPopover)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            title="Bağlı kullanıcılar listesi"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold">{Math.max(1, peers.length)}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Connected Peers Dropdown */}
          {showPeersPopover && (
            <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-white rounded-xl shadow-xl border border-slate-200 text-xs space-y-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-semibold text-slate-900">
                <span>Bağlı Cihazlar ({Math.max(1, peers.length)})</span>
                <span className="text-[10px] text-emerald-600 font-normal">Canlı Senkron</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {peers.length === 0 ? (
                  <div className="flex items-center justify-between py-1 text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Bu Cihaz ({getRoleLabel(role).label})
                    </span>
                    <span className="text-[10px] text-slate-400">Sen</span>
                  </div>
                ) : (
                  peers.map((peer, idx) => (
                    <div key={peer.clientId || idx} className="flex items-center justify-between py-1 text-slate-700">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: peer.color || '#3b82f6' }}
                        />
                        <span className="font-medium truncate max-w-[120px]">{peer.name}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 font-mono">
                        {peer.role}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                Farklı ağlardaki tüm cihazlar ortak Yjs belgesinde buluşur.
              </div>
            </div>
          )}
        </div>

        {/* Clear Board (Teacher Only) */}
        {role === 'teacher' && (
          <button
            onClick={() => {
              if (window.confirm('Tüm çizimleri silip beyaz tahtayı temizlemek istediğinize emin misiniz?')) {
                onClearBoard();
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium transition-colors cursor-pointer border border-rose-200"
            title="Tahtadaki tüm şekilleri ve çizimleri temizle"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Temizle</span>
          </button>
        )}

        {/* Share & QR Code */}
        <button
          onClick={onOpenShare}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          title="iPad ve diğer cihazları bağlamak için QR Kod ve bağlantı"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Paylaş</span>
        </button>

        {/* Architecture Info */}
        <button
          onClick={onOpenArchitecture}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          title="Ağ ve Edge WebSocket Mimarisi Hakkında"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran Yap'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

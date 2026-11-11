/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Server, Zap, Globe, Layers, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Ağ Mimarisi & Teknoloji Raporu</h2>
              <p className="text-xs text-slate-400">P2P yerine Neden Edge WebSocket & Yjs CRDT?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* P2P Problem */}
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4" />
                P2P (WebRTC) Neden Okulda Çalışmaz?
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li><strong className="text-slate-800">Symmetric NAT & CGNAT:</strong> Hücresel (4G/5G) ve okul ağlarında cihazlar birbirini doğrudan göremez.</li>
                <li><strong className="text-slate-800">Güvenlik Duvarı (MEB / Okul):</strong> P2P UDP portları okul filtreleri tarafından sıklıkla engellenir.</li>
                <li><strong className="text-slate-800">Yüksek Maliyetli TURN:</strong> Pahalı röle sunucuları kurulmazsa bağlantı oranı %40'ın altına düşer.</li>
              </ul>
            </div>

            {/* Edge WebSocket Solution */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4" />
                Edge WebSocket & Yjs Çözümü
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li><strong className="text-slate-800">Standart 443/WSS Portu:</strong> Herhangi bir web sayfası gibi açılır, hiçbir okul duvarına takılmaz.</li>
                <li><strong className="text-slate-800">Sıfır Gecikme Hissiyatı:</strong> CRDT (Yjs) sayesinde yerel çizim 0ms'de çizilir, delta paketleri 8-20ms içinde diğer cihazlara dağıtılır.</li>
                <li><strong className="text-slate-800">Çoklu Cihaz Ölçeği:</strong> 1 öğretmen çizerken 100+ öğrenci ve akıllı tahta eşzamanlı izleyebilir.</li>
              </ul>
            </div>
          </div>

          {/* Architecture Diagram Box */}
          <div className="p-4 bg-slate-900 rounded-xl text-slate-300 font-mono text-xs space-y-3">
            <div className="text-blue-400 font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4" /> Veri Akış Şeması
            </div>
            <pre className="text-[11px] leading-relaxed overflow-x-auto text-emerald-400">
{`[Öğretmen iPad] (Hücresel 5G)
      │  Y.Doc Update (Delta CRDT)
      ▼
┌──────────────────────────────────────────────┐
│  Merkezi Edge WebSocket Sunucusu             │
│  (Node.js / Cloudflare Durable Objects)      │
│  - Oda Bazlı Y.Doc Dağıtımı                  │
│  - Awareness (Canlı İmleç / Rol Yönetimi)   │
└──────────────────────────────────────────────┘
      │                           │
      ▼                           ▼
[Akıllı Tahta]              [Öğrenci Tabletleri]
(Okul LAN - Readonly)       (Ev/Okul Wi-Fi - Readonly)`}
            </pre>
          </div>

          {/* Cloudflare Workers Migration */}
          <div className="p-4 border border-indigo-200 bg-indigo-50/70 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs">
              <Globe className="w-4 h-4 text-indigo-600" />
              Cloudflare Workers + Durable Objects Taşıma
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Projede oluşturduğumuz <code className="bg-indigo-100 text-indigo-800 px-1 py-0.5 rounded font-mono">/cloudflare-worker/worker.ts</code> ve <code className="bg-indigo-100 text-indigo-800 px-1 py-0.5 rounded font-mono">wrangler.toml</code> dosyaları hazırdır. Terminalden <code className="bg-slate-800 text-white px-1.5 py-0.5 rounded font-mono">npx wrangler deploy</code> komutu verilerek tek tuşla 300+ Edge lokasyonunda çalışan sunucusuz Yjs kümesine geçiş yapılabilir.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
};

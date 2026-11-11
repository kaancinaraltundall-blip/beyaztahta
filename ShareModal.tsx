/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  QrCode,
  Smartphone,
  Monitor,
  GraduationCap,
  Database,
  Wifi,
  HelpCircle,
  ExternalLink,
  Download,
} from 'lucide-react';
import { UserRole } from '../hooks/useYjsStore.ts';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, roomId }) => {
  const [copiedRole, setCopiedRole] = useState<string | null>(null);
  const [qrRole, setQrRole] = useState<UserRole>('student');
  const [activeTab, setActiveTab] = useState<'share' | 'howto' | 'database' | 'netlify' | 'render'>('share');

  if (!isOpen) return null;

  const rawOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  // Varsayılan olarak doğrudan bu sunucunun aktif adresini kullan (telefon ile bilgisayarın aynı sunucuda buluşması için):
  const origin = rawOrigin;

  const getUrlForRole = (role: UserRole) => {
    return `${origin}/?room=${encodeURIComponent(roomId)}&role=${role}`;
  };

  const copyToClipboard = (text: string, role: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRole(role);
    setTimeout(() => setCopiedRole(null), 2500);
  };

  const selectedUrl = getUrlForRole(qrRole);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(selectedUrl)}&color=0f172a`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">2 Cihazla Test & Paylaşım Merkezi</h2>
              <p className="text-xs text-blue-100">
                Oda: <span className="font-semibold underline">{roomId}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/api/download-zip"
              download="eduboard-project.zip"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Tüm proje dosyalarını tek tıkla bilgisayarınıza ZIP olarak indirin"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Projeyi ZIP İndir</span>
              <span className="sm:hidden">ZIP</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('share')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'share'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📱 QR & Linkler
          </button>
          <button
            onClick={() => setActiveTab('render')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'render'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🚀 Render.com'a Yükleme (Sıfırdan)
          </button>
          <button
            onClick={() => setActiveTab('howto')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'howto'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🧪 2 Cihaz Testi
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'database'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            💾 Veritabanı Mantığı
          </button>
          <button
            onClick={() => setActiveTab('netlify')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'netlify'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ⚡ Netlify Bilgisi
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs">
          {activeTab === 'share' && (
            <>
              {/* AI Studio Permission Alert */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-amber-900">
                <div className="font-bold flex items-center gap-1.5 text-xs text-amber-800">
                  <span>⚠️</span> Arkadaşlarınız "Üzgünüz Bu Sayfaya Erişiminiz Yok" Hatası Alıyorsa:
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Google AI Studio projeleri varsayılan olarak <strong>yalnızca proje sahibinin Google hesabına</strong> açıktır. Arkadaşlarınızın bağlanabilmesi için:
                </p>
                <ol className="list-decimal list-inside text-[11px] text-amber-900 font-medium space-y-1 pt-0.5">
                  <li>Ekranın en sağ üst köşesindeki mavi <span className="bg-amber-200/80 px-1 py-0.5 rounded font-bold">Share (Paylaş)</span> butonuna tıklayın.</li>
                  <li>Erişimi <span className="bg-amber-200/80 px-1 py-0.5 rounded font-bold">"Anyone with the link can view"</span> (Bağlantıya sahip herkes) olarak değiştirin.</li>
                  <li>Aşağıdaki <strong>Öğrenci / Tahta</strong> bağlantısını veya QR kodunu gönderin.</li>
                </ol>
              </div>

              {/* QR Code Role Selector */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center shrink-0">
                  <img
                    src={qrCodeUrl}
                    alt="Bağlantı QR Kodu"
                    className="w-36 h-36 rounded-lg object-contain"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">
                    {qrRole === 'teacher' ? 'Öğretmen Girişi' : qrRole === 'smartboard' ? 'Akıllı Tahta Girişi' : 'Öğrenci Girişi'}
                  </span>
                </div>

                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm">QR Kod Hedef Rolü</h3>
                    <p className="text-slate-500 leading-relaxed">
                      iPad veya telefon kamerasından okutulduğunda hangi modda açılacağını seçin:
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setQrRole('student')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        qrRole === 'student'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      🎒 Öğrenci (Readonly)
                    </button>
                    <button
                      onClick={() => setQrRole('smartboard')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        qrRole === 'smartboard'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      🖥️ Akıllı Tahta (Sunum)
                    </button>
                    <button
                      onClick={() => setQrRole('teacher')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        qrRole === 'teacher'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      👨‍🏫 Öğretmen (Çizim)
                    </button>
                  </div>

                  <div className="pt-1">
                    <span className="text-[11px] text-slate-500">Seçili URL: </span>
                    <span className="font-mono text-[11px] text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 break-all select-all">
                      {selectedUrl}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Role Links */}
              <div className="space-y-2.5">
                <h4 className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
                  Role Göre Doğrudan Bağlantılar
                </h4>

                {/* Teacher */}
                <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      👨‍🏫
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        Öğretmen (iPad / Tablet)
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                          ?role=teacher
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px]">Çizim, silme, düzenleme ve tahta yönetimi</div>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(getUrlForRole('teacher'), 'teacher')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    {copiedRole === 'teacher' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedRole === 'teacher' ? 'Kopyalandı' : 'Kopyala'}
                  </button>
                </div>

                {/* Smartboard */}
                <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      🖥️
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        Akıllı Tahta (Sınıf Ekranı)
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono">
                          ?role=smartboard
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px]">Salt okunur, arayüzsüz temiz canlı gösterim</div>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(getUrlForRole('smartboard'), 'smartboard')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    {copiedRole === 'smartboard' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedRole === 'smartboard' ? 'Kopyalandı' : 'Kopyala'}
                  </button>
                </div>

                {/* Student */}
                <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      🎒
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        Öğrenci (Tablet / Telefon)
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono">
                          ?role=student
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px]">Salt okunur, serbest yakınlaştırma ve canlı takip</div>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(getUrlForRole('student'), 'student')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    {copiedRole === 'student' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedRole === 'student' ? 'Kopyalandı' : 'Kopyala'}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'howto' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  2 Farklı Cihazı Test Etmenin 3 Kolay Yolu
                </h4>
                <p className="text-blue-800 leading-relaxed">
                  Aşağıdaki senaryolardan size en uygun olanı seçerek sistemin anlık çizim senkronizasyonunu test edebilirsiniz:
                </p>
              </div>

              {/* Method 1: Current Live Cloud App */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 font-bold rounded text-[10px]">
                  YÖNTEM 1 (ŞU AN - EN KOLAY)
                </span>
                <h5 className="font-bold text-slate-900">Doğrudan Cloud Run / AI Studio Üzerinden Test</h5>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                  <li>Bu tarayıcı ekranındaki <strong>Paylaş</strong> butonuna tıklayın.</li>
                  <li>Telefonunuzun veya iPad'inizin kamerasını açıp ekrandaki <strong>QR Kodu</strong> taratın.</li>
                  <li>Telefonunuzda tahta açılacaktır. Bilgisayarınızdan bir çizgi çizin veya bir kare ekleyin.</li>
                  <li>Telefonunuzun ekranında <strong>0 saniye gecikmeyle</strong> çizimin belirdiğini görün!</li>
                </ol>
              </div>

              {/* Method 2: Localhost 2 Tabs */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded text-[10px]">
                  YÖNTEM 2 (5 SANİYELİK TEST)
                </span>
                <h5 className="font-bold text-slate-900">Aynı Bilgisayarda Yan Yana İki Sekme Açmak</h5>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                  <li>Sol ekranda bir sekme açın: <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">http://localhost:3000/?role=teacher</code></li>
                  <li>Sağ ekranda gizli sekme açın: <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">http://localhost:3000/?role=student</code></li>
                  <li>Soldaki öğretmen sekmesinde çizdiğiniz her kalem darbesi, sağdaki öğrenci sekmesinde canlı olarak akar.</li>
                </ol>
              </div>

              {/* Method 3: Local Network (Wi-Fi) */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 font-bold rounded text-[10px]">
                  YÖNTEM 3 (EV / OFİS Wİ-Fİ)
                </span>
                <h5 className="font-bold text-slate-900">Kendi Bilgisayarınızın Yerel IP'si ile Gerçek iPad Bağlantısı</h5>
                <p className="text-slate-600 leading-relaxed">
                  Sunucumuz <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">0.0.0.0</code> dinlediği için aynı Wi-Fi ağındaki iPad'inizden bilgisayarınızın yerel IP'siyle bağlanabilirsiniz:
                </p>
                <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px]">
                  # Terminalde yerel IP'nizi öğrenin (örn: 192.168.1.35):<br/>
                  ipconfig (Windows) veya ifconfig (Mac/Linux)<br/><br/>
                  # iPad Safari'de şu adresi açın:<br/>
                  http://192.168.1.35:3000/?role=teacher
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  Veritabanı Kurulumu Yaptık mı? Nasıl Çalışıyor?
                </h4>
                <p className="text-indigo-900 leading-relaxed">
                  Kısa cevap: <strong>Geleneksel ağır bir SQL/MongoDB kurmanıza gerek kalmadan CRDT (Yjs) mimarisiyle çalışır!</strong>
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                  <h5 className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span>
                    Neden SQL/NoSQL Yerine Yjs CRDT?
                  </h5>
                  <p className="text-slate-600 leading-relaxed">
                    Beyaz tahtada öğretmen saniyede 60 çizgi koordinatı üretir. Bunu geleneksel bir veritabanına <code className="font-mono bg-slate-100 px-1">INSERT INTO lines...</code> şeklinde yazmak sunucuyu kilitler ve gecikme (lag) yaratır.
                    Bunun yerine <strong>Yjs</strong>, tüm çizimleri ikili (binary) bir bellek ağacında tutar ve sadece delta farklarını (fark baytlarını) iletir. Bu sayede <strong>sıfır gecikme</strong> hissi elde edilir.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                  <h5 className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">2</span>
                    Kalıcılık (Persistence): Sunucu Kapanınca Çizimler Silinir mi?
                  </h5>
                  <p className="text-slate-600 leading-relaxed">
                    <strong>Hayır, silinmez!</strong> Sunucumuza otomatik dosya tabanlı ikili depolama ekledik (<code className="font-mono bg-slate-100 px-1">.storage/rooms/[oda-adi].yjs</code>). Öğretmen çizim yaptıkça sunucu tahtanın son durumunu otomatik olarak diske kaydeder. Sunucuyu kapatsanız bile yeniden açıldığında çizimler aynen geri gelir.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                  <h5 className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">3</span>
                    Cloudflare Workers'a Geçildiğinde Ne Olur?
                  </h5>
                  <p className="text-slate-600 leading-relaxed">
                    Hazırladığımız <code className="font-mono bg-slate-100 px-1">cloudflare-worker/worker.ts</code> kodunda <strong>Cloudflare Durable Objects Storage</strong> entegre edilmiştir. Cloudflare'ın küresel diskine (<code className="font-mono bg-slate-100 px-1">state.storage.put</code>) doğrudan yazar. Yani production ortamında da ayrı bir PostgreSQL/Redis sunucusu kiralamanıza gerek kalmaz!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'netlify' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  Netlify Tek Başına Neden Yetmez? (Çok Önemli Teknik Kural)
                </h4>
                <p className="text-amber-800 leading-relaxed">
                  Netlify harika bir <strong>statik web sitesi (HTML/CSS/JS)</strong> platformudur. Ancak <strong>sürekli açık kalan canlı WebSocket (WS/WSS) sunucusu barındıramaz</strong>. Serverless fonksiyonları birkaç saniyede kapanır.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                  <h5 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">A</span>
                    Cloudflare Bağlantısı Yapmam Gerekiyor mu?
                  </h5>
                  <p className="text-slate-600 leading-relaxed">
                    Eğer arayüzü <strong>kesinlikle Netlify'a</strong> yüklemek istiyorsanız: <strong>Evet, arka planda bir WebSocket sunucusuna ihtiyacınız vardır.</strong>
                    Bunun için en iyi ve ücretsiz çözüm, projenizde hazırladığımız <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">cloudflare-worker/worker.ts</code> kodudur. Dünyanın 300 noktasında ücretsiz Yjs WebSocket sağlar.
                  </p>
                  <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] leading-relaxed">
                    # 1. Cloudflare Worker'ı yayına alın:<br/>
                    cd cloudflare-worker && npx wrangler deploy<br/><br/>
                    # 2. Netlify &gt; Site settings &gt; Environment variables:<br/>
                    VITE_WS_URL = "wss://eduboard-yjs-edge.your-subdomain.workers.dev"
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-emerald-200 bg-emerald-50/40 rounded-xl space-y-2">
                  <h5 className="font-bold text-emerald-900 text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">B</span>
                    Alternatif: Cloudflare İle Hiç Uğraşmak İstemiyorsanız (En Kolay Yol)
                  </h5>
                  <p className="text-slate-600 leading-relaxed">
                    Netlify yerine projeyi doğrudan <strong>Render.com</strong> veya <strong>Railway.app</strong> üzerine yükleyin. Projedeki <code className="bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-mono">server.ts</code> hem web arayüzünü hem de WebSocket'i tek bir adreste (<code className="font-mono">https://eduboard.onrender.com</code>) tek tıkla çalıştırır. Sıfır Cloudflare, sıfır karmaşa!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'render' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-600" />
                    Adım 1: Projeyi Bilgisayarınıza İndirin
                  </h4>
                  <a
                    href="/api/download-zip"
                    download="eduboard-project.zip"
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors"
                  >
                    ZIP İndir (77 KB)
                  </a>
                </div>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  Şu anda Google AI Studio üzerinde olduğunuz için dosyalar henüz bilgisayarınızda değil. Yukarıdaki yeşil <strong>"ZIP İndir"</strong> butonuna basın; tüm kaynak kodlar <code className="bg-emerald-100 font-mono px-1">eduboard-project.zip</code> olarak bilgisayarınıza inecektir.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                  <h5 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">2</span>
                    ZIP'i Klasöre Çıkartın
                  </h5>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    İndirilen ZIP dosyasına sağ tıklayıp <strong>"Klasöre Ayıkla / Çıkart"</strong> deyin. İçinde <code className="font-mono bg-slate-100 px-1">server.ts</code>, <code className="font-mono bg-slate-100 px-1">Dockerfile</code> ve tüm bileşenler hazır olacaktır.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                  <h5 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">3</span>
                    GitHub'a Dosyaları Sürükleyin (Hiç Kod Yazmadan!)
                  </h5>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    1. <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline">github.com/new</a> adresine gidin.<br/>
                    2. Depo adını <code className="font-mono bg-slate-100 px-1">eduboard-live</code> yapıp <strong>"Create repository"</strong> deyin.<br/>
                    3. Açılan boş sayfadaki <strong className="text-slate-800">"uploading an existing file"</strong> bağlantısına tıklayın.<br/>
                    4. Çıkarttığınız klasördeki tüm dosyaları tarayıcının içine sürükleyip bırakın ve alttaki yeşil <strong>"Commit changes"</strong> butonuna basın.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                  <h5 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">4</span>
                    Render.com'a Bağlayıp Canlıya Alın
                  </h5>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    1. <a href="https://render.com" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline">render.com</a>'a GitHub ile giriş yapın.<br/>
                    2. <strong>New + &gt; Web Service</strong> seçip oluşturduğunuz depoyu bağlayın.<br/>
                    3. Build Command: <code className="font-mono bg-slate-100 px-1">npm install &amp;&amp; npm run build</code><br/>
                    4. Start Command: <code className="font-mono bg-slate-100 px-1">npm start</code><br/>
                    5. <strong>"Create Web Service"</strong> butonuna bastığınız anda 2 dakikada siteniz canlıya geçer!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

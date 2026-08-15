import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Download,
  QrCode,
  Sparkles,
  Wifi,
  Gamepad2,
  HandPlatter,
  Gift,
  Tv,
  Camera,
  Layers,
  Palette,
  Eye,
  CheckCircle2,
  Store,
  Flame,
  Printer,
  ChevronRight,
  Star
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { api } from '../../../services/api';
import { Cafe, TableEntity } from '../../../types';
import coffeeBg from '../../../assets/cafe-qr-bg-coffee.jpg';
import foodBg from '../../../assets/cafe-qr-bg-food.jpg';
import loungeChocolate from '../../../assets/lounge-chocolate-premium.png';

interface QrPdfGeneratorProps {
  cafeSlug: string;
  cafeName: string;
}

type QrStyleTheme = 'coffee-lounge' | 'gourmet-night' | 'luxury-gold';
type LayoutFormat = 'stands-a4' | 'stickers-a4' | 'poster-single';

interface LandscapeTentFaceProps {
  tableNum: number;
  qrUrl: string;
  cafeLogo: string;
  cafeName: string;
  upsideDown?: boolean;
}

const LandscapeTentFace: React.FC<LandscapeTentFaceProps> = ({
  tableNum,
  qrUrl,
  cafeLogo,
  cafeName,
  upsideDown = false,
}) => {
  const tableLabel = tableNum < 10 ? `0${tableNum}` : `${tableNum}`;
  const normalizedCafeName = cafeName.trim();
  const cafeNameFontSize = Math.max(8.5, Math.min(14.5, 270 / Math.max(normalizedCafeName.length, 1)));

  return (
    <div
      data-testid="qr-tent-face"
      className="relative h-full w-full overflow-hidden bg-[#080a0d] text-white"
      style={{
        transform: upsideDown ? 'rotate(180deg)' : undefined,
        fontFamily: '"Arial Narrow", "Roboto Condensed", Impact, sans-serif',
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_24%,rgba(245,158,11,0.14),transparent_29%),linear-gradient(135deg,#101216_0%,#07090c_68%,#020304_100%)]" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(rgba(255,255,255,0.7)_0.6px,transparent_0.6px)] [background-size:4px_4px]" />
      <img
        src={loungeChocolate}
        alt=""
        className="absolute right-[1.5%] top-[6%] z-[5] h-[82%] w-[17.5%] object-contain object-center drop-shadow-[0_12px_20px_rgba(245,158,11,0.22)]"
      />

      <div className="relative z-10 grid h-full grid-cols-[44%_38%_18%]">
        <div className="flex items-center justify-center p-[4%]">
          <div className="aspect-square w-[88%] max-w-[270px] rounded-[18px] border-[3px] border-amber-500 bg-white p-[4.5%] shadow-[0_16px_36px_rgba(0,0,0,0.45)]">
            <QRCodeSVG value={qrUrl} size={220} level="H" includeMargin={false} className="h-full w-full" />
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-center py-[6%] pr-[7%]">
          <div className="mb-[5%] flex items-center gap-2.5 pr-1">
            <div className="shrink-0 rounded-full border border-amber-400/80 bg-black/80 p-1 shadow-[0_0_18px_rgba(245,158,11,0.22)]">
              <img
                src={cafeLogo}
                alt={cafeName}
                className="h-11 w-11 rounded-full border border-white/20 object-cover saturate-75 contrast-125"
              />
            </div>
            <div className="min-w-0">
              <p
                className="whitespace-nowrap font-black uppercase leading-[0.95] tracking-[0.01em] text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.65)]"
                style={{ fontSize: `${cafeNameFontSize}px` }}
                title={normalizedCafeName}
              >
                {normalizedCafeName}
              </p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-amber-400">
                Lounge & Café
              </p>
            </div>
          </div>

          <div className="mb-[6%] border-y border-amber-500/80 py-[4.5%] text-center">
            <p className="text-[29px] font-black uppercase leading-none tracking-[0.09em] text-amber-400 [text-shadow:0_3px_12px_rgba(245,158,11,0.16)]">
              Table {tableLabel}
            </p>
          </div>

          <p className="mb-[4%] text-center text-[22px] font-black uppercase leading-none tracking-[0.025em] text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.7)]">
            Scannez pour
          </p>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <HandPlatter className="h-8 w-8 text-amber-400" strokeWidth={1.7} />
              <span className="text-[9px] font-black uppercase tracking-wide text-white">Commander</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Gamepad2 className="h-8 w-8 text-amber-400" strokeWidth={1.7} />
              <span className="text-[9px] font-black uppercase tracking-wide text-white">Jouer</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Gift className="h-8 w-8 text-amber-400" strokeWidth={1.7} />
              <span className="text-[9px] font-black uppercase tracking-wide text-white">Gagner</span>
            </div>
          </div>

          <p className="mt-[5%] text-center font-sans text-[11px] font-medium tracking-wide text-gray-200">
            Sans téléchargement
          </p>
        </div>
      </div>
    </div>
  );
};

export const QrPdfGenerator: React.FC<QrPdfGeneratorProps> = ({ cafeSlug, cafeName: initialCafeName }) => {
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [tableCount, setTableCount] = useState<number>(12);
  const [theme, setTheme] = useState<QrStyleTheme>('coffee-lounge');
  const [layoutFormat, setLayoutFormat] = useState<LayoutFormat>('stands-a4');
  const [wifiSsid, setWifiSsid] = useState<string>('');
  const [wifiPassword, setWifiPassword] = useState<string>('');
  const discountBadgeText = '';
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  const [tableEntities, setTableEntities] = useState<TableEntity[]>([]);

  useEffect(() => {
    const fetchCafeAndTables = async () => {
      try {
        const [data, tablesData] = await Promise.all([
          api.getCafeBySlug(cafeSlug),
          api.getTablesByCafe(cafeSlug).catch(() => []),
        ]);
        if (data) {
          setCafe(data);
          if (!wifiSsid) setWifiSsid(`${data.name} Guest`);
        }
        if (tablesData && tablesData.length > 0) {
          setTableEntities(tablesData);
          setTableCount(tablesData.length);
        }
      } catch {
        // Ignore fallback
      }
    };
    fetchCafeAndTables();
  }, [cafeSlug]);

  const effectiveCafeName = cafe?.name || initialCafeName || 'Monastir Lounge';
  const cafeLogo = cafe?.logoUrl || coffeeBg;

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  const getTableQrUrl = (tableNum: number) => {
    const foundTable = tableEntities.find((t) => Number(t.tableNumber) === Number(tableNum));
    const tokenParam = foundTable?.sessionToken ? `?token=${foundTable.sessionToken}` : '';
    const tableLabel = tableNum < 10 ? `0${tableNum}` : `${tableNum}`;
    return `${window.location.origin}/m/${cafeSlug}/t/${tableLabel}${tokenParam}`;
  };

  // Group tables into pages according to layout
  const itemsPerPage = layoutFormat === 'stands-a4' ? 2 : layoutFormat === 'stickers-a4' ? 6 : 1;
  const pages: number[][] = [];
  for (let i = 0; i < tables.length; i += itemsPerPage) {
    pages.push(tables.slice(i, i + itemsPerPage));
  }

  const handleExportPDF = async () => {
    if (!containerRef.current) return;
    setIsGenerating(true);
    setProgressText('Initialisation du PDF…');

    try {
      const pageElements = containerRef.current.querySelectorAll<HTMLElement>('.pdf-sheet-page');
      if (pageElements.length === 0) return;

      const isLandscapeTent = layoutFormat === 'stands-a4';
      const orientation = isLandscapeTent ? 'l' : 'p';
      const pdf = new jsPDF(orientation, 'mm', 'a4');
      const pdfWidth = isLandscapeTent ? 297 : 210;
      const pdfHeight = isLandscapeTent ? 210 : 297;

      for (let i = 0; i < pageElements.length; i++) {
        setProgressText(`Capture de la page ${i + 1} sur ${pageElements.length}…`);
        const el = pageElements[i];

        const canvas = await html2canvas(el, {
          scale: 2.5,
          useCORS: true,
          backgroundColor: '#0a0d16',
          logging: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage('a4', orientation);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      setProgressText('Téléchargement du document…');
      pdf.save(`TakTak_QRCodes_${effectiveCafeName.replace(/\s+/g, '_')}_${tableCount}Tables.pdf`);
    } catch (err) {
      console.error('Erreur exportation PDF', err);
      alert('Erreur lors de la création du document PDF.');
    } finally {
      setIsGenerating(false);
      setProgressText('');
    }
  };

  const getThemeBg = () => {
    if (theme === 'coffee-lounge') return coffeeBg;
    if (theme === 'gourmet-night') return foodBg;
    return coffeeBg;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Studio Header & Configuration Controls */}
      <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl shadow-lg shadow-orange-500/25 text-white">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight">Studio Table Tents & QR Code</h2>
                <span className="text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                  Design Lounge
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Table tents paysage avec deux faces, QR dynamique et repères de pliage prêts à imprimer.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={isGenerating}
              onClick={handleExportPDF}
              className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-orange-500/25 flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? (progressText || 'Génération…') : `Télécharger Toutes les ${tableCount} Tables (PDF)`}</span>
            </button>
          </div>
        </div>

        {/* Option Selectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Nombre de Tables */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Nombre de Tables à Générer :
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="60"
                value={tableCount}
                onChange={(e) => setTableCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white/[0.04] text-lg font-black text-amber-400 px-4 py-2.5 rounded-2xl border border-white/[0.08] focus:border-amber-400 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-gray-500 font-medium">
              👉 Les {tableCount} tables apparaissent toutes ci-dessous et dans le PDF ({pages.length} page(s) A4).
            </p>
          </div>

          {/* 2. Format de Support */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Format de Planche</span>
            </label>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setLayoutFormat('stands-a4')}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-bold border transition-all flex items-center justify-between ${
                  layoutFormat === 'stands-a4'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                    : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:text-white'
                }`}
              >
                <span>Table tents paysage A4 (2 / page)</span>
                {layoutFormat === 'stands-a4' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </button>

              <button
                type="button"
                onClick={() => setLayoutFormat('stickers-a4')}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-bold border transition-all flex items-center justify-between ${
                  layoutFormat === 'stickers-a4'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                    : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:text-white'
                }`}
              >
                <span>Stickers Tables A4 (6 / page)</span>
                {layoutFormat === 'stickers-a4' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </button>

              <button
                type="button"
                onClick={() => setLayoutFormat('poster-single')}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-bold border transition-all flex items-center justify-between ${
                  layoutFormat === 'poster-single'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                    : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:text-white'
                }`}
              >
                <span>Grandes Affiches A4 (1 / page)</span>
                {layoutFormat === 'poster-single' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </button>
            </div>
          </div>

          {/* 3. Ambiance Visuelle */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-orange-400" />
              <span>Ambiance & Visuel Café</span>
            </label>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setTheme('coffee-lounge')}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-bold border transition-all flex items-center justify-between ${
                  theme === 'coffee-lounge'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                    : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:text-white'
                }`}
              >
                <span>Lounge café & ambre</span>
                {theme === 'coffee-lounge' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </button>

              <button
                type="button"
                onClick={() => setTheme('gourmet-night')}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-bold border transition-all flex items-center justify-between ${
                  theme === 'gourmet-night'
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-md'
                    : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:text-white'
                }`}
              >
                <span>Lounge nuit & cocktails</span>
                {theme === 'gourmet-night' && <CheckCircle2 className="w-4 h-4 text-orange-400" />}
              </button>
            </div>
          </div>

          {/* 4. WiFi invité */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>WiFi invité</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nom WiFi"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                className="w-full bg-white/[0.04] text-xs text-white px-3 py-2 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Mot de passe"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                className="w-full bg-white/[0.04] text-xs text-white px-3 py-2 rounded-xl border border-white/[0.08] focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {layoutFormat === 'stands-a4' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-amber-400" />
              <span className="font-bold text-white">Aperçu des faces visibles ({tableCount} tables)</span>
            </div>
            <span className="font-mono text-[11px] text-gray-500">Le verso retourné est ajouté uniquement au PDF</span>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {tables.map((tableNum) => {
              const qrUrl = getTableQrUrl(tableNum);
              return (
                <div
                  key={tableNum}
                  className="mx-auto aspect-[1.58/1] w-full max-w-[720px] overflow-hidden rounded-2xl border border-amber-500/25 shadow-2xl shadow-black/40"
                >
                  <LandscapeTentFace
                    tableNum={tableNum}
                    qrUrl={qrUrl}
                    cafeLogo={cafeLogo}
                    cafeName={effectiveCafeName}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Full print sheets stay off-screen for table tents and are captured only during PDF export. */}
      <div
        className={layoutFormat === 'stands-a4' ? 'fixed left-[-20000px] top-0 w-max space-y-8' : 'space-y-8'}
        ref={containerRef}
        aria-hidden={layoutFormat === 'stands-a4'}
      >
        <div className="flex items-center justify-between text-xs text-gray-400 px-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white">
              Aperçu Complet des {tableCount} Tables ({pages.length} planche{pages.length > 1 ? 's' : ''} A4) :
            </span>
          </div>
          <span className="text-gray-500 font-mono text-[11px]">Prêt à imprimer • 300 DPI</span>
        </div>

        {pages.map((pageTables, pageIdx) => (
          <div key={pageIdx} className="overflow-x-auto pb-4">
            {/* Standard A4 Target Canvas Sheet */}
            <div
              className={`pdf-sheet-page relative mx-auto flex flex-col justify-between rounded-sm text-white shadow-2xl ${
                layoutFormat === 'stands-a4' ? 'bg-[#eee9df] p-[4mm]' : 'bg-[#08090e] p-7'
              }`}
              style={{
                width: layoutFormat === 'stands-a4' ? '297mm' : '210mm',
                height: layoutFormat === 'stands-a4' ? '210mm' : '297mm',
                minWidth: layoutFormat === 'stands-a4' ? '297mm' : '210mm',
                minHeight: layoutFormat === 'stands-a4' ? '210mm' : '297mm',
                boxSizing: 'border-box',
              }}
            >
              {/* LAYOUT 1: 2 TABLE TENTS COMPLETS PAR PAGE A4 PAYSAGE */}
              {layoutFormat === 'stands-a4' && (
                <div className="grid h-full grid-cols-2 gap-[4mm]">
                  {pageTables.map((tableNum) => {
                    const qrUrl = getTableQrUrl(tableNum);
                    return (
                      <div
                        key={tableNum}
                        className="flex h-full min-w-0 flex-col overflow-hidden border border-dashed border-stone-500 bg-[#0b0d11] shadow-xl"
                      >
                        <div className="h-[90mm] shrink-0 border-b border-dashed border-white/40">
                          <LandscapeTentFace
                            tableNum={tableNum}
                            qrUrl={qrUrl}
                            cafeLogo={cafeLogo}
                            cafeName={effectiveCafeName}
                          />
                        </div>

                        <div className="h-[90mm] shrink-0 border-b border-dashed border-white/40">
                          <LandscapeTentFace
                            tableNum={tableNum}
                            qrUrl={qrUrl}
                            cafeLogo={cafeLogo}
                            cafeName={effectiveCafeName}
                            upsideDown
                          />
                        </div>

                        <div className="flex min-h-0 flex-1 items-center justify-center bg-[#15171b] px-4 text-center text-[9px] font-bold uppercase tracking-[0.18em] text-stone-400">
                          Base de collage • Plier sur les pointillés
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Ancien chevalet conservÃ© hors rendu pour les formats historiques. */}
              {false && layoutFormat === 'stands-a4' && (
                <div className="grid grid-cols-2 gap-5 h-full">
                  {pageTables.map((tableNum) => {
                    const qrUrl = getTableQrUrl(tableNum);
                    return (
                      <div
                        key={tableNum}
                        className="rounded-[32px] border-2 border-amber-500/40 relative overflow-hidden flex flex-col justify-between p-5 shadow-2xl bg-[#0c0f18]"
                        style={{
                          backgroundImage: `linear-gradient(180deg, rgba(12, 15, 24, 0.82) 0%, rgba(8, 10, 16, 0.94) 100%), url(${getThemeBg()})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        {/* Top Branding Bar */}
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center space-x-2.5">
                            <img
                              src={cafeLogo}
                              alt={effectiveCafeName}
                              className="w-11 h-11 rounded-2xl object-cover ring-2 ring-amber-400/60 shadow-lg"
                            />
                            <div>
                              <h3 className="text-sm font-black text-white tracking-tight uppercase leading-tight">
                                {effectiveCafeName}
                              </h3>
                              <p className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">
                                Lounge & Café
                              </p>
                            </div>
                          </div>

                          {/* Starburst Discount Stamp */}
                          {discountBadgeText && (
                            <div className="relative flex items-center justify-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-full flex flex-col items-center justify-center font-black shadow-lg border-2 border-white/40 rotate-12">
                                <span className="text-[7px] uppercase leading-none font-bold">Jusqu'à</span>
                                <span className="text-[12px] leading-tight">{discountBadgeText}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Catchy Hero Calligraphy & Table Number */}
                        <div className="text-center my-1 relative z-10 space-y-1">
                          <div className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white text-[12px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/30">
                            TABLE {tableNum < 10 ? `0${tableNum}` : tableNum}
                          </div>
                          <div>
                            <p className="text-lg font-serif italic font-extrabold text-amber-300 tracking-wide drop-shadow-md">
                              Scan & Enjoy ✨
                            </p>
                            <p className="text-[9px] text-gray-300 font-bold uppercase tracking-wider">
                              Commandez • Jouez • Gagnez
                            </p>
                          </div>
                        </div>

                        {/* Center High-Contrast QR Code */}
                        <div className="flex flex-col items-center justify-center relative z-10 my-2">
                          <div className="p-3 bg-white rounded-3xl shadow-2xl border-4 border-amber-400/90 relative">
                            {/* Corner Target Brackets */}
                            <div className="absolute -top-2 -left-2 w-5 h-5 border-t-4 border-l-4 border-amber-500 rounded-tl-lg" />
                            <div className="absolute -top-2 -right-2 w-5 h-5 border-t-4 border-r-4 border-amber-500 rounded-tr-lg" />
                            <div className="absolute -bottom-2 -left-2 w-5 h-4 border-b-4 border-l-4 border-amber-500 rounded-bl-lg" />
                            <div className="absolute -bottom-2 -right-2 w-5 h-4 border-b-4 border-r-4 border-amber-500 rounded-br-lg" />

                            <QRCodeSVG
                              value={qrUrl}
                              size={128}
                              level="H"
                              includeMargin={false}
                              imageSettings={{
                                src: cafeLogo,
                                x: undefined,
                                y: undefined,
                                height: 28,
                                width: 28,
                                excavate: true,
                              }}
                            />
                          </div>

                          <div className="mt-2.5 inline-flex items-center space-x-1.5 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/40 text-[10px] font-black text-amber-300 shadow-md">
                            <Camera className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                            <span>SCANNEZ AVEC VOTRE MOBILE</span>
                          </div>
                        </div>

                        {/* Experience Highlights */}
                        <div className="grid grid-cols-2 gap-1.5 text-left relative z-10 text-[9px] font-bold text-gray-200">
                          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded-xl flex items-center space-x-1.5">
                            <span className="text-orange-400 text-xs">☕</span>
                            <span className="truncate">Menu Digital & Commande</span>
                          </div>
                          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded-xl flex items-center space-x-1.5">
                            <span className="text-amber-400 text-xs">🎴</span>
                            <span className="truncate">Chkobba, Rami & Ludo</span>
                          </div>
                          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded-xl flex items-center space-x-1.5">
                            <span className="text-pink-400 text-xs">🎁</span>
                            <span className="truncate">Cadeaux & Avis Google</span>
                          </div>
                          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded-xl flex items-center space-x-1.5">
                            <span className="text-emerald-400 text-xs">⚽</span>
                            <span className="truncate">Pronostics Matchs TV</span>
                          </div>
                        </div>

                        {/* WiFi Footer */}
                        {wifiSsid && (
                          <div className="bg-black/80 border border-white/10 rounded-xl p-2 flex items-center justify-between text-[9px] relative z-10 mt-1">
                            <div className="flex items-center space-x-1 text-gray-300">
                              <Wifi className="w-3 h-3 text-emerald-400" />
                              <span>WiFi: <strong className="text-white">{wifiSsid}</strong></span>
                            </div>
                            {wifiPassword && (
                              <span className="text-amber-300 font-bold">Pass: {wifiPassword}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* LAYOUT 2: 6 STICKERS PAR PAGE A4 */}
              {layoutFormat === 'stickers-a4' && (
                <div className="grid grid-cols-2 grid-rows-3 gap-4 h-full">
                  {pageTables.map((tableNum) => {
                    const qrUrl = getTableQrUrl(tableNum);
                    return (
                      <div
                        key={tableNum}
                        className="rounded-2xl border border-amber-500/40 p-4 flex flex-col justify-between text-center relative overflow-hidden bg-[#0c0f18] shadow-lg"
                        style={{
                          backgroundImage: `linear-gradient(180deg, rgba(12, 15, 24, 0.85) 0%, rgba(8, 10, 16, 0.95) 100%), url(${getThemeBg()})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <img src={cafeLogo} alt="" className="w-8 h-8 rounded-lg object-cover ring-1 ring-amber-400/50" />
                            <div className="text-left">
                              <h4 className="text-xs font-black text-white truncate max-w-[100px]">{effectiveCafeName}</h4>
                              <span className="text-[8px] text-amber-400 font-bold uppercase">Table {tableNum < 10 ? `0${tableNum}` : tableNum}</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white font-black text-[9px]">
                            SCAN ME
                          </span>
                        </div>

                        <div className="my-1.5 p-2 bg-white rounded-2xl mx-auto shadow-md border-2 border-amber-400">
                          <QRCodeSVG
                            value={qrUrl}
                            size={92}
                            level="H"
                            includeMargin={false}
                            imageSettings={{
                              src: cafeLogo,
                              x: undefined,
                              y: undefined,
                              height: 20,
                              width: 20,
                              excavate: true,
                            }}
                          />
                        </div>

                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-amber-300 uppercase">Menu • Jeux • Cadeaux</p>
                          {wifiSsid && (
                            <p className="text-[8px] text-gray-400">WiFi: {wifiSsid} {wifiPassword ? `• ${wifiPassword}` : ''}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* LAYOUT 3: 1 GRANDE AFFICHE POSTER PAR PAGE A4 */}
              {layoutFormat === 'poster-single' && (
                <div className="h-full flex items-center justify-center">
                  {pageTables.map((tableNum) => {
                    const qrUrl = getTableQrUrl(tableNum);
                    return (
                      <div
                        key={tableNum}
                        className="w-full h-full rounded-[36px] border-3 border-amber-500/50 relative overflow-hidden flex flex-col justify-between p-8 shadow-2xl bg-[#0c0f18]"
                        style={{
                          backgroundImage: `linear-gradient(180deg, rgba(12, 15, 24, 0.82) 0%, rgba(8, 10, 16, 0.94) 100%), url(${getThemeBg()})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        {/* Header Branding */}
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center space-x-3.5">
                            <img
                              src={cafeLogo}
                              alt={effectiveCafeName}
                              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-400/60 shadow-xl"
                            />
                            <div>
                              <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-tight">
                                {effectiveCafeName}
                              </h2>
                              <p className="text-xs text-amber-400 font-extrabold uppercase tracking-widest mt-0.5">
                                Lounge & Café Restaurant
                              </p>
                            </div>
                          </div>

                          {discountBadgeText && (
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-full flex flex-col items-center justify-center font-black shadow-2xl border-2 border-white/50 rotate-12">
                              <span className="text-[9px] uppercase leading-none font-bold">Jusqu'à</span>
                              <span className="text-base leading-tight">{discountBadgeText}</span>
                            </div>
                          )}
                        </div>

                        {/* Middle Headline */}
                        <div className="text-center my-3 relative z-10 space-y-2">
                          <div className="inline-block px-6 py-1.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white text-base font-black uppercase tracking-widest shadow-xl shadow-orange-500/40">
                            TABLE {tableNum < 10 ? `0${tableNum}` : tableNum}
                          </div>
                          <div>
                            <h3 className="text-3xl font-serif italic font-black text-amber-300 drop-shadow-lg">
                              Vivez l'expérience TakTak ✨
                            </h3>
                            <p className="text-xs text-gray-300 font-bold uppercase tracking-widest mt-1">
                              Scannez le QR Code pour commander sans attendre
                            </p>
                          </div>
                        </div>

                        {/* Large Center QR Code */}
                        <div className="flex flex-col items-center justify-center relative z-10 my-4">
                          <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-amber-400 relative">
                            <div className="absolute -top-3 -left-3 w-7 h-7 border-t-4 border-l-4 border-amber-500 rounded-tl-xl" />
                            <div className="absolute -top-3 -right-3 w-7 h-7 border-t-4 border-r-4 border-amber-500 rounded-tr-xl" />
                            <div className="absolute -bottom-3 -left-3 w-7 h-7 border-b-4 border-l-4 border-amber-500 rounded-bl-xl" />
                            <div className="absolute -bottom-3 -right-3 w-7 h-7 border-b-4 border-r-4 border-amber-500 rounded-br-xl" />

                            <QRCodeSVG
                              value={qrUrl}
                              size={180}
                              level="H"
                              includeMargin={false}
                              imageSettings={{
                                src: cafeLogo,
                                x: undefined,
                                y: undefined,
                                height: 40,
                                width: 40,
                                excavate: true,
                              }}
                            />
                          </div>

                          <div className="mt-4 inline-flex items-center space-x-2 bg-black/80 backdrop-blur-md px-5 py-2 rounded-full border border-amber-400/50 text-xs font-black text-amber-300 shadow-xl">
                            <Camera className="w-4 h-4 text-amber-400 animate-bounce" />
                            <span className="tracking-wider">OUVREZ VOTRE APPAREIL PHOTO & SCANNEZ</span>
                          </div>
                        </div>

                        {/* 4 Feature Badges */}
                        <div className="grid grid-cols-2 gap-3 text-left relative z-10 text-xs font-bold text-gray-200">
                          <div className="bg-black/70 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center space-x-2.5">
                            <span className="text-lg">🥐</span>
                            <div>
                              <p className="text-white font-black">Menu & Commande Directe</p>
                              <p className="text-[10px] text-gray-400">Sans attente à table</p>
                            </div>
                          </div>
                          <div className="bg-black/70 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center space-x-2.5">
                            <span className="text-lg">🎴</span>
                            <div>
                              <p className="text-white font-black">Jeux Chkobba & Rami</p>
                              <p className="text-[10px] text-gray-400">Défiez vos amis à table</p>
                            </div>
                          </div>
                          <div className="bg-black/70 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center space-x-2.5">
                            <span className="text-lg">🎁</span>
                            <div>
                              <p className="text-white font-black">Roue Cadeaux & Remises</p>
                              <p className="text-[10px] text-gray-400">Notez sur Google & Gagnez</p>
                            </div>
                          </div>
                          <div className="bg-black/70 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center space-x-2.5">
                            <span className="text-lg">⚽</span>
                            <div>
                              <p className="text-white font-black">Matchs TV & Pronostics</p>
                              <p className="text-[10px] text-gray-400">Votes en direct sur les écrans</p>
                            </div>
                          </div>
                        </div>

                        {/* WiFi Banner */}
                        {wifiSsid && (
                          <div className="bg-black/80 border border-white/10 rounded-2xl p-3 flex items-center justify-between text-xs relative z-10 mt-2">
                            <div className="flex items-center space-x-2 text-gray-300">
                              <Wifi className="w-4 h-4 text-emerald-400" />
                              <span>Réseau WiFi: <strong className="text-white">{wifiSsid}</strong></span>
                            </div>
                            {wifiPassword && (
                              <span className="text-amber-300 font-bold">Mot de passe: {wifiPassword}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, QrCode, Sparkles, Layers } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface QrPdfGeneratorProps {
  cafeSlug: string;
  cafeName: string;
}

export const QrPdfGenerator: React.FC<QrPdfGeneratorProps> = ({ cafeSlug, cafeName }) => {
  const [tableCount, setTableCount] = useState<number>(15);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  const handleExportPDF = async () => {
    if (!sheetRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(sheetRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`TakTak_QRCodes_${cafeSlug}.pdf`);
    } catch (err) {
      console.error('Erreur lors de l\'exportation PDF', err);
      alert('Erreur lors de la création du document PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="glass-panel p-5 rounded-3xl border border-gray-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-orange-400" />
            <span>Générateur de QR Codes A4 Prêt à Imprimer</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Sélectionnez le nombre de tables et téléchargez la planche A4 avec logo et URLs scellées.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-gray-300">Nombre de Tables :</label>
            <input
              type="number"
              min="1"
              max="50"
              value={tableCount}
              onChange={(e) => setTableCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 bg-gray-800 text-sm font-extrabold text-orange-400 px-3 py-1.5 rounded-xl border border-gray-700 focus:outline-none"
            />
          </div>

          <button
            disabled={isGenerating}
            onClick={handleExportPDF}
            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-orange-500/25 flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Génération du PDF...' : 'Télécharger Planche A4 (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Preview */}
      <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800 overflow-x-auto flex justify-center">
        {/* A4 Container Target */}
        <div
          ref={sheetRef}
          className="w-[210mm] min-h-[297mm] bg-white text-gray-900 p-8 shadow-2xl rounded-sm font-sans flex flex-col justify-between"
        >
          {/* Printable Header */}
          <div className="border-b-2 border-orange-500 pb-4 mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md">
                TT
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Tak Tak</h1>
                <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">
                  Planche de QR Codes • {cafeName}
                </p>
              </div>
            </div>
            <div className="text-right text-[10px] text-gray-500">
              <span>Scannez pour commander sans attendre</span>
              <br />
              <span className="font-mono text-gray-700">taktak.tn/m/{cafeSlug}/t/[XX]</span>
            </div>
          </div>

          {/* QR Cards Grid (A4 layout - 3 columns) */}
          <div className="grid grid-cols-3 gap-6 flex-1">
            {tables.map((tableNum) => {
              const qrUrl = `${window.location.origin}/m/${cafeSlug}/t/${tableNum < 10 ? `0${tableNum}` : tableNum}`;
              return (
                <div
                  key={tableNum}
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-4 flex flex-col items-center justify-between text-center bg-gray-50/50 shadow-xs"
                >
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                      {cafeName}
                    </span>
                    <span className="text-sm font-black text-orange-600 uppercase">
                      TABLE {tableNum < 10 ? `0${tableNum}` : tableNum}
                    </span>
                  </div>

                  {/* QR Code Container */}
                  <div className="my-2 p-2 bg-white rounded-xl shadow-sm border border-gray-200">
                    <QRCodeSVG
                      value={qrUrl}
                      size={110}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold text-gray-700">SCANNEZ MOI</p>
                    <p className="text-[8px] text-gray-400">Commandez & Payez sur votre mobile</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Printable Footer */}
          <div className="border-t border-gray-200 pt-3 mt-6 text-center text-[9px] text-gray-400">
            Propulsé par Tak Tak Tunisia • Solution de commande 100% digitale sans papier
          </div>
        </div>
      </div>
    </div>
  );
};

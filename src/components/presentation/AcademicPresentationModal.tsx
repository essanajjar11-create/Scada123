import React, { useState, useRef } from 'react';
import { X, Maximize2, ExternalLink, Presentation, Download, Printer } from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

interface AcademicPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AcademicPresentationModal: React.FC<AcademicPresentationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, lang } = useScada();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrintingPdf, setIsPrintingPdf] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!isOpen) return null;

  const toggleModalFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const openInNewTab = () => {
    window.open('/presentation_ar.html', '_blank');
  };

  const handleDownloadPptx = () => {
    setIsExporting(true);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'EXPORT_PPTX' }, '*');
    }
    setTimeout(() => {
      setIsExporting(false);
    }, 3000);
  };

  const handleDownloadPdf = () => {
    setIsPrintingPdf(true);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({ type: 'PRINT_PDF' }, '*');
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
      } catch (e) {
        console.warn('Direct print fallback:', e);
        window.open('/presentation_ar.html', '_blank');
      }
    } else {
      window.open('/presentation_ar.html', '_blank');
    }
    setTimeout(() => {
      setIsPrintingPdf(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 md:p-4">
      <div
        className={`bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[92vh]'
        }`}
      >
        {/* Modal Header */}
        <div className="bg-zinc-900/90 border-b border-zinc-800 px-5 py-3 flex items-center justify-between text-white flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
              <Presentation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base text-zinc-100 flex items-center gap-2">
                <span>{t('academic_pres_title')}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  132/13.8 kV SAS
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                {lang === 'ar'
                  ? 'عرض تقديمي أكاديمي وعلمي شامل مع لقطات ومخططات تفصيلية للمنظومة'
                  : 'Comprehensive academic & scientific slide deck explaining all substation SAS digital twin modules'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadPdf}
              disabled={isPrintingPdf}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-emerald-500/50 shadow cursor-pointer disabled:opacity-50"
              title="طباعة أو تحميل العرض كملف PDF عالي الدقة"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isPrintingPdf ? (lang === 'ar' ? 'جاري التحضير...' : 'Preparing...') : (lang === 'ar' ? 'تحميل PDF' : 'Download PDF')}</span>
            </button>

            <button
              onClick={handleDownloadPptx}
              disabled={isExporting}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-amber-500/50 shadow cursor-pointer disabled:opacity-50"
              title="تحميل العرض كملف PowerPoint PPTX"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? (lang === 'ar' ? 'جاري التصدير...' : 'Exporting...') : (lang === 'ar' ? 'تحميل PPTX' : 'Download PPTX')}</span>
            </button>

            <button
              onClick={openInNewTab}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
              title="فتح في نافذة مستقلة جديدة"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'نافذة جديدة' : 'New Tab'}</span>
            </button>

            <button
              onClick={toggleModalFullscreen}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition border border-zinc-700 cursor-pointer"
              title="تكبير / تصغير"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg transition border border-rose-800/80 cursor-pointer"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Embedded Iframe of the Slide Deck */}
        <div className="flex-1 w-full bg-zinc-950 relative">
          <iframe
            ref={iframeRef}
            src="/presentation_ar.html"
            title="Academic Presentation"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};

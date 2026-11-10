import React from 'react';
import { Tv, ExternalLink, X, Monitor, Cpu } from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

interface PopoutWindowModalProps {
  onClose: () => void;
}

export const PopoutWindowModal: React.FC<PopoutWindowModalProps> = ({ onClose }) => {
  const { lang } = useScada();
  const isAr = lang === 'ar';

  const popoutViews = [
    {
      name: isAr ? 'مخطط الخط الأحادي (SLD) المباشر' : 'Single Line Diagram (SLD) Live Wall',
      icon: Cpu,
      desc: isAr
        ? 'مخطط القواطع والمحولات المباشر عالي الدقة لجدار الشاشات العلوي'
        : 'Full-screen animated SLD switchgear diagram for overhead video wall',
    },
    {
      name: isAr ? 'لوحة إنذارات المحطة القياسية ISA-18.2' : 'ISA-18.2 Alarm Annunciator Board',
      icon: Tv,
      desc: isAr
        ? 'شبكة وميض الإنذارات عالية الوضوح لمشغلي الورديات'
        : 'Dedicated high-visibility alarm grid display for shift operators',
    },
    {
      name: isAr ? 'القياسات اللحظية ومخطط المتجهات الطورية' : 'Real-Time Telemetry & Phasor Waveforms',
      icon: Monitor,
      desc: isAr
        ? 'رسم متحرك للجهد والتيار ومخطط المتجهات 120°'
        : 'Live voltage/current sliding trend and 120° vector phasor plot',
    },
    {
      name: isAr ? 'خريطة الشبكة الجغرافية ومحدد مسافة العطل' : 'GIS Substation Grid & Fault Locator Map',
      icon: ExternalLink,
      desc: isAr
        ? 'خريطة تفاعلية لخطوط النقل مع رادار الطقس وخوارزمية تاكاجي'
        : 'Interactive geographic grid layout with satellite radar overlay',
    },
  ];

  const handlePopout = (viewName: string) => {
    // Open popout window
    const win = window.open(
      '',
      `_blank_${Date.now()}`,
      'width=1280,height=800,menubar=no,toolbar=no,location=no,status=no'
    );
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html dir="${isAr ? 'rtl' : 'ltr'}">
        <head>
          <title>SCADA RTU-01 | ${viewName}</title>
          <style>
            body { background: #020617; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; padding: 24px; margin: 0; }
            h1 { color: #38bdf8; font-size: 20px; border-bottom: 1px solid #1e293b; padding-bottom: 12px; }
            .card { background: #0f172a; border: 1px solid #334155; padding: 20px; border-radius: 8px; margin-top: 20px; }
            .badge { background: #064e3b; color: #34d399; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>⚡ ${isAr ? 'نافذة تحكم SCADA المنبثقة:' : 'SCADA Popout Control Window:'} ${viewName}</h1>
          <p>${isAr ? 'مزامنة جدار شاشات غرفة التحكم المتعددة مع محطة التحويل الرئيسية RTU-01.' : 'Multi-Display Control Room Mirroring Synchronized with RTU-01 Primary Substation.'}</p>
          <div class="card">
            <span class="badge">${isAr ? 'الاتصال المباشر نشط' : 'LIVE LINK ACTIVE'}</span>
            <p>${isAr ? 'استقبال تدفق القياسات المباشر عبر BroadcastChannel بمعدل مسح 1000ms.' : 'Receiving real-time telemetry stream via BroadcastChannel at 1000ms scan interval.'}</p>
          </div>
        </body>
        </html>
      `);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 rtl:space-x-reverse mb-5 border-b border-slate-800 pb-3">
          <div className="p-2.5 bg-cyan-950 border border-cyan-700/50 rounded-lg text-cyan-400">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 uppercase">
              {isAr ? 'جدار شاشات غرفة التحكم المنبثقة' : 'Multi-Display Video Wall Popout'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'توسيع شاشات المراقبة والتحكم لمحطة التحويل' : 'Substation Control Room Screen Extension'}
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          {popoutViews.map((pv, idx) => {
            const IconComp = pv.icon;
            return (
              <div
                key={idx}
                className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg hover:border-cyan-500/50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded text-cyan-400 group-hover:text-cyan-300">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">{pv.name}</h3>
                    <p className="text-[11px] text-slate-400">{pv.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => handlePopout(pv.name)}
                  className="px-3 py-1.5 bg-cyan-950 border border-cyan-700 hover:bg-cyan-900 text-cyan-300 text-xs font-bold rounded flex items-center space-x-1 rtl:space-x-reverse shrink-0 transition-all cursor-pointer"
                >
                  <span>{isAr ? 'فتح النافذة' : 'Launch'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end border-t border-slate-800 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

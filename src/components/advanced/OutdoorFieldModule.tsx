import React, { useState } from 'react';
import { Sun, Tv, ExternalLink, Monitor, Eye, Sparkles } from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { PopoutWindowModal } from '../common/PopoutWindowModal';

export const OutdoorFieldModule: React.FC = () => {
  const { lang, outdoorTheme, setOutdoorTheme } = useScada();
  const isAr = lang === 'ar';
  const [showPopoutModal, setShowPopoutModal] = useState<boolean>(false);

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-2.5 bg-amber-950/80 border border-amber-700/60 rounded-lg text-amber-400">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-tight">
              {isAr
                ? 'جدار الشاشات المنبثق لغرفة التحكم ووضع العمل الميداني النهاري عالي التباين'
                : 'Control Room Multi-Display Video Wall Popout & Outdoor Field Mode Configurator'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'مزامنة شاشات غرف التحكم عبر قنوات البث وواجهة لمسية نهارية فائقة السطوع (+1000 Nits)'
                : 'BroadcastChannel Control Room Synchronization & High-Contrast 1000+ Nits Daylight Touch Interface'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowPopoutModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs shadow-lg flex items-center space-x-2 rtl:space-x-reverse cursor-pointer transition-all"
        >
          <Tv className="w-4 h-4" />
          <span>{isAr ? 'فتح جدار الشاشات المنبثقة' : 'Launch Multi-Display Popouts'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Daylight Outdoor Field Theme Configurator */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase text-amber-400 flex items-center space-x-2 rtl:space-x-reverse">
              <Sun className="w-4 h-4" />
              <span>
                {isAr
                  ? 'وضع الأجهزة اللوحية الميدانية (سطوع فائق تحت أشعة الشمس المباشرة)'
                  : 'Ruggedized Field Tablet Mode (1000+ Nits Direct Sunlight)'}
              </span>
            </h4>
          </div>

          <p className="text-xs text-slate-300">
            {isAr
              ? 'تكبير أهداف اللمس وتحويل ألوان لوحة التحكم إلى نمط کهرماني عالي التباين لتسهيل قراءة العدادات أثناء الفحص الميداني لساحة المفاتيح.'
              : 'Enlarges touch targets and converts the dark control canvas into an ultra-high-contrast amber daylight display palette for outdoor substation switchyard technicians.'}
          </p>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-xs font-bold text-slate-400 block">{isAr ? 'النمط اللوني الحالي:' : 'Current Theme Mode:'}</span>
              <span className={`text-sm font-black ${outdoorTheme ? 'text-amber-400' : 'text-cyan-400'}`}>
                {outdoorTheme
                  ? isAr
                    ? 'وضع التباين العالي لضوء النهار'
                    : 'DAYLIGHT HIGH-CONTRAST MODE'
                  : isAr
                  ? 'الوضع الليلي لغرفة التحكم'
                  : 'CONTROL ROOM DARK MODE'}
              </span>
            </div>

            <button
              onClick={() => setOutdoorTheme(!outdoorTheme)}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl border cursor-pointer shadow-lg transition-all flex items-center space-x-2 rtl:space-x-reverse ${
                outdoorTheme
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>{isAr ? 'تبديل النمط' : 'Toggle Mode'}</span>
            </button>
          </div>
        </div>

        {/* Video Wall Popout Controls */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase text-purple-400 flex items-center space-x-2 rtl:space-x-reverse">
              <Tv className="w-4 h-4" />
              <span>{isAr ? 'بث ومطابقة جدار الشاشات (BroadcastChannel)' : 'BroadcastChannel Video Wall Mirroring'}</span>
            </h4>
          </div>

          <p className="text-xs text-slate-300">
            {isAr
              ? 'إنشاء نوافذ مستقلة ومفتوحة على شاشات متعددة في غرفة التحكم دون التأثير على أداء الشاشة الرئيسية، مع مزامنة فورية للقياسات.'
              : 'Spawns independent, non-blocking browser windows across multi-monitor control room setups. Live telemetry syncs automatically.'}
          </p>

          <button
            onClick={() => setShowPopoutModal(true)}
            className="w-full py-3 bg-purple-950 border border-purple-700 hover:bg-purple-900 text-purple-300 font-bold rounded-xl text-xs shadow-lg flex items-center justify-center space-x-2 rtl:space-x-reverse cursor-pointer transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>{isAr ? 'فتح مدير نوافذ جدار الشاشات' : 'Open Substation Video Wall Window Manager'}</span>
          </button>
        </div>
      </div>

      {showPopoutModal && <PopoutWindowModal onClose={() => setShowPopoutModal(false)} />}
    </div>
  );
};

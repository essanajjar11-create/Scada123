import React, { useState } from 'react';
import { Play, ShieldAlert, CheckCircle2, X, RefreshCw, Layers } from 'lucide-react';
import { useScada } from '../../../context/ScadaContext';

interface MacroPreviewModalProps {
  macroType: 'ATS_TRANSFER' | 'TR1_ISOLATION' | 'UFLS_LOAD_SHED';
  onClose: () => void;
}

export const MacroPreviewModal: React.FC<MacroPreviewModalProps> = ({ macroType, onClose }) => {
  const { lang, toggleSwitch, addAuditLog } = useScada();
  const isAr = lang === 'ar';
  const [executing, setExecuting] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [completed, setCompleted] = useState(false);

  const macroConfigs = {
    ATS_TRANSFER: {
      title: isAr ? 'التحويل الأوتوماتيكي للأحمال (ATS) إلى المحول TR-2' : 'Auto Transfer Switch (ATS) to TR-2',
      desc: isAr
        ? 'تحويل أحمال قسم الجهد المتوسط MV-1 بسلاسة إلى المحول TR-2 عبر قاطع ربط القضبان 52-6 دون انقطاع.'
        : 'Seamlessly transfers MV Section-1 loads to TR-2 transformer bay via Bus Sectionalizer 52-6.',
      steps: [
        {
          label: isAr ? 'الخطوة 1: فتح قاطع الجهد المتوسط 52-2 للمحول TR-1' : 'Step 1: Open MV Breaker 52-2 on TR-1',
          action: () => toggleSwitch('TR-1', 'mvBreaker52_2'),
        },
        {
          label: isAr ? 'الخطوة 2: إغلاق قاطع ربط قضبان التوزيع 52-6' : 'Step 2: Close MV Bus Sectionalizer 52-6',
          action: () => toggleSwitch('TR-1', 'busSectionalizer52_6'),
        },
        {
          label: isAr ? 'الخطوة 3: التحقق من تقاسم الأحمال واستقرار التردد على TR-2' : 'Step 3: Verify TR-2 Load Sharing & Frequency Stability',
          action: () => {},
        },
      ],
    },
    TR1_ISOLATION: {
      title: isAr ? 'تسلسل العزل الآمن والتأريض للمحول TR-1' : 'TR-1 Transformer Safety Isolation Sequence',
      desc: isAr
        ? 'عزل المحول TR-1 كهربائياً بالكامل وتأريضه لأخذ عينات الزيت أو استبدال العوازل بأمان.'
        : 'Isolates TR-1 for scheduled oil sampling or bushing replacement.',
      steps: [
        {
          label: isAr ? 'الخطوة 1: فتح قاطع الجهد المتوسط 52-2' : 'Step 1: Open MV Breaker 52-2',
          action: () => toggleSwitch('TR-1', 'mvBreaker52_2'),
        },
        {
          label: isAr ? 'الخطوة 2: فتح قاطع الجهد العالي 52-1' : 'Step 2: Open HV Breaker 52-1',
          action: () => toggleSwitch('TR-1', 'hvBreaker52_1'),
        },
        {
          label: isAr ? 'الخطوة 3: فتح سكين العزل للجهد العالي 89-1A' : 'Step 3: Open HV Disconnector 89-1A',
          action: () => toggleSwitch('TR-1', 'hvDisconnect89_1A'),
        },
        {
          label: isAr ? 'الخطوة 4: إغلاق سكين التأريض الوقائي 84-1' : 'Step 4: Close Safety Earth Switch 84-1',
          action: () => toggleSwitch('TR-1', 'earthSwitch84_1'),
        },
      ],
    },
    UFLS_LOAD_SHED: {
      title: isAr ? 'تخفيف الأحمال عند هبوط التردد (UFLS - المرحلة 1)' : 'Under-Frequency Load Shedding (UFLS) Stage 1',
      desc: isAr
        ? 'فصل فوري للمغذيات التجارية غير الحرجة لمنع انهيار تردد الشبكة (< 49.2 هرتز).'
        : 'Rapidly sheds non-critical commercial feeder loads to arrest grid frequency decay (< 49.2 Hz).',
      steps: [
        {
          label: isAr ? 'الخطوة 1: فصل قاطع المغذي التجاري 52-9' : 'Step 1: Trip Commercial Feeder 52-9',
          action: () => toggleSwitch('TR-1', 'feederComm52_9'),
        },
        {
          label: isAr ? 'الخطوة 2: أمر منظومة بطاريات BESS بالتفريغ الفوري الكامل 100%' : 'Step 2: Command BESS Bay 52-B into 100% Active Discharge (FFR)',
          action: () => {},
        },
      ],
    },
  };

  const currentMacro = macroConfigs[macroType];

  const handleExecuteMacro = () => {
    setExecuting(true);
    let currentStep = 0;

    const interval = setInterval(() => {
      if (currentStep < currentMacro.steps.length) {
        setStepIndex(currentStep);
        currentMacro.steps[currentStep].action();
        currentStep++;
      } else {
        clearInterval(interval);
        setExecuting(false);
        setCompleted(true);
        addAuditLog('SWITCHING', `Executed Macro: ${currentMacro.title}`);
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-xl p-6 shadow-2xl relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 rtl:space-x-reverse border-b border-slate-800 pb-3">
          <div className="p-2.5 bg-yellow-950 border border-yellow-700/60 rounded-lg text-amber-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 uppercase">
              {isAr ? 'تنفيذ تسلسل الماكرو التلقائي' : 'Automated Macro Sequence Execution'}
            </h2>
            <p className="text-xs text-slate-400">{currentMacro.title}</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <p className="text-xs text-slate-300">{currentMacro.desc}</p>

          <div className="space-y-2 border-t border-slate-800 pt-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              {isAr ? 'خطة خطوات التسلسل:' : 'Sequence Action Plan:'}
            </span>
            {currentMacro.steps.map((st, idx) => {
              const isDone = idx <= stepIndex;
              const isCurrent = idx === stepIndex && executing;

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                    isDone
                      ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                      : isCurrent
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300 animate-pulse'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span>{st.label}</span>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                  ) : (
                    <span className="text-[10px] text-slate-600 font-bold font-mono">
                      {isAr ? 'قيد الانتظار' : 'PENDING'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800 flex-wrap gap-2">
          {completed ? (
            <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1 rtl:space-x-reverse">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAr ? 'اكتمل تنفيذ الماكرو وتم التحقق بنجاح' : 'Macro Execution Complete & Verified'}</span>
            </span>
          ) : (
            <span className="text-xs text-slate-400">
              {isAr ? 'تم التحقق من شروط القفل البيني - جاهز للتنفيذ' : 'Interlocks Verified - Ready to Execute'}
            </span>
          )}

          <div className="flex space-x-2 rtl:space-x-reverse">
            {!completed && (
              <button
                onClick={handleExecuteMacro}
                disabled={executing}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1.5 rtl:space-x-reverse transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>
                  {executing
                    ? isAr
                      ? 'جاري التنفيذ...'
                      : 'Executing...'
                    : isAr
                    ? 'تأكيد وتنفيذ الماكرو'
                    : 'Confirm & Execute Macro'}
                </span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

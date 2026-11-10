import React from 'react';
import { Cpu, Network, ShieldCheck, X, Zap } from 'lucide-react';
import { useScada } from '../../../context/ScadaContext';

interface MergingUnitModalProps {
  muId: string;
  associatedDevice: string;
  onClose: () => void;
}

export const MergingUnitModal: React.FC<MergingUnitModalProps> = ({
  muId,
  associatedDevice,
  onClose,
}) => {
  const { lang } = useScada();
  const isAr = lang === 'ar';

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
          <div className="p-2.5 bg-cyan-950 border border-cyan-700/60 rounded-lg text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 uppercase">
              {isAr
                ? `وحدة الدمج الرقمية لمسار العمليات IEC 61850-9-2LE (${muId})`
                : `IEC 61850-9-2LE Process Bus Merging Unit (${muId})`}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'مرقمن الإشارات التناظرية لمحولات القياس CT/PT عبر الألياف الضوئية'
                : 'Optical Process Bus Digital CT/PT Digitizer'}
            </p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
          <div className="flex justify-between items-center bg-slate-900 p-2.5 rounded border border-slate-800">
            <span className="text-slate-400">
              {isAr ? 'محول القياس المرتبط:' : 'Primary Instrument Transformer:'}
            </span>
            <span className="font-bold text-cyan-300 font-mono">{associatedDevice}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 p-3 rounded border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                {isAr ? 'معدل بث العينات (SV)' : 'Sampled Values (SV) Rate'}
              </span>
              <div className="text-base font-bold text-emerald-400 font-mono">4,000 Hz</div>
              <p className="text-[10px] text-slate-500 font-mono">
                {isAr ? '80 عينة/دورة (IEC 61850-9-2LE)' : '80 Samples/Cycle (IEC 61850-9-2LE)'}
              </p>
            </div>

            <div className="bg-slate-900 p-3 rounded border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                {isAr ? 'تزامن الساعة الرئيسية PTP' : 'PTP Grandmaster Sync'}
              </span>
              <div className="text-base font-bold text-cyan-400 font-mono">IEEE 1588 v2 LOCKED</div>
              <p className="text-[10px] text-slate-500 font-mono">
                {isAr ? 'الانحراف الزمني: < 34 نانوثانية' : 'Time Offset: < 34 ns'}
              </p>
            </div>
          </div>

          <div className="bg-slate-900 p-3 rounded border border-slate-800 space-y-1.5 font-sans">
            <div className="flex justify-between text-slate-400">
              <span>{isAr ? 'تدفق إيثرنت متعدد الوجهات:' : 'Multicast Ethernet Stream:'}</span>
              <span className="text-cyan-400 font-bold font-mono">EtherType 0x88BA</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>{isAr ? 'معرف التطبيق والشبكة الافتراضية:' : 'AppID Destination:'}</span>
              <span className="font-bold font-mono">0x4000 (VLAN 101)</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>{isAr ? 'زمن انتقال إشارات الفصل GOOSE:' : 'GOOSE Inter-Tripping Latency:'}</span>
              <span className="font-bold text-emerald-400 font-mono">2.14 ms (&lt; 4 ms IEEE C37.90)</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق فاحص ناقل العمليات' : 'Close Process Bus Inspector'}
          </button>
        </div>
      </div>
    </div>
  );
};

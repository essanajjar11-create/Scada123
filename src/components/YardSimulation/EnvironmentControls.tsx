import React from 'react';
import { Sliders, AlertTriangle, Flame, Droplets, ZapOff, CheckCircle2, Thermometer, ShieldAlert } from 'lucide-react';

interface EnvironmentControlsProps {
  gridVoltage: number;
  setGridVoltage: (v: number) => void;
  ambientTemp: number;
  setAmbientTemp: (t: number) => void;
  powerFactor: number;
  setPowerFactor: (pf: number) => void;
  lineLoads: Record<string, { pMW: number; qMVAr: number }>;
  setLineLoads: React.Dispatch<React.SetStateAction<Record<string, { pMW: number; qMVAr: number }>>>;
  faultActive: boolean;
  faultType: 'NONE' | '3PH_FAULT' | 'SF6_LEAK' | 'TX_OVERHEAT';
  onInjectFault: (type: '3PH_FAULT' | 'SF6_LEAK' | 'TX_OVERHEAT') => void;
  onClearFaults: () => void;
}

const calcReactiveQ = (pMW: number, pf: number): number => {
  const clampedPf = Math.min(1.0, Math.max(0.5, pf));
  if (clampedPf >= 0.9999) return 0;
  return Number((pMW * Math.tan(Math.acos(clampedPf))).toFixed(2));
};

export const EnvironmentControls: React.FC<EnvironmentControlsProps> = ({
  gridVoltage,
  setGridVoltage,
  ambientTemp,
  setAmbientTemp,
  powerFactor,
  setPowerFactor,
  lineLoads,
  setLineLoads,
  faultActive,
  faultType,
  onInjectFault,
  onClearFaults,
}) => {
  const updateTransformerLoad = (bay: 'BAY_T1' | 'BAY_T2', pMW: number) => {
    setLineLoads(prev => ({
      ...prev,
      [bay]: {
        pMW,
        qMVAr: calcReactiveQ(pMW, powerFactor),
      },
    }));
  };

  const handlePowerFactorChange = (newPf: number) => {
    setPowerFactor(newPf);
    setLineLoads(prev => ({
      ...prev,
      BAY_T1: {
        pMW: prev.BAY_T1?.pMW ?? 70.0,
        qMVAr: calcReactiveQ(prev.BAY_T1?.pMW ?? 70.0, newPf),
      },
      BAY_T2: {
        pMW: prev.BAY_T2?.pMW ?? 65.0,
        qMVAr: calcReactiveQ(prev.BAY_T2?.pMW ?? 65.0, newPf),
      },
    }));
  };

  const t1P = lineLoads['BAY_T1']?.pMW ?? 70;
  const t1Q = lineLoads['BAY_T1']?.qMVAr ?? calcReactiveQ(t1P, powerFactor);
  const t1S = Math.hypot(t1P, t1Q);

  const t2P = lineLoads['BAY_T2']?.pMW ?? 65;
  const t2Q = lineLoads['BAY_T2']?.qMVAr ?? calcReactiveQ(t2P, powerFactor);
  const t2S = Math.hypot(t2P, t2Q);

  return (
    <div className="bg-[#181c24] border border-[#2e3543] rounded-2xl p-4 shadow-xl text-slate-100 font-sans space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#2e3646] pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm tracking-wide">
            لوحة محاكاة المعطيات الفيزيائية والميدانية (Physical Environment & Fault Injection)
          </h3>
        </div>
        {faultActive && (
          <span className="bg-red-950 text-red-400 border border-red-700 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            عطل ميداني نشط: {faultType}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1: Grid Voltage & Climate */}
        <div className="bg-[#12151b] p-3.5 rounded-xl border border-[#2b3341] space-y-3">
          <span className="text-xs font-bold text-slate-300 block border-b border-slate-700/60 pb-1">
            جهد الشبكة والمناخ الخارجي
          </span>
          
          {/* Grid Voltage Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">جهد التغذية المغذي للشبكة (HV Grid):</span>
              <span className="font-mono font-bold text-amber-400">{gridVoltage.toFixed(1)} kV</span>
            </div>
            <input
              type="range"
              min="190"
              max="245"
              step="0.5"
              value={gridVoltage}
              onChange={(e) => setGridVoltage(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
              <span>190 kV (-17%)</span>
              <span>230 kV (اسمي)</span>
              <span>245 kV (Um Max)</span>
            </div>
          </div>

          {/* Ambient Temp Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-blue-400" />
                درجة الحرارة المحيطة بالمحطة (&theta;a):
              </span>
              <span className={`font-mono font-bold ${ambientTemp >= 40 ? 'text-red-400' : ambientTemp <= 0 ? 'text-cyan-300' : 'text-blue-400'}`}>
                {ambientTemp.toFixed(1)} °C
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="55"
              step="1"
              value={ambientTemp}
              onChange={(e) => setAmbientTemp(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
              <span>-10 °C (صقيع)</span>
              <span>20 °C (معياري)</span>
              <span>40 °C (IEC Max)</span>
              <span>55 °C (قاسٍ)</span>
            </div>
          </div>
        </div>

        {/* Column 2: Line & Transformer Loads (P / Q) */}
        <div className="bg-[#12151b] p-3.5 rounded-xl border border-[#2b3341] space-y-2.5">
          <span className="text-xs font-bold text-slate-300 block border-b border-slate-700/60 pb-1">
            أحمال الاستجرار للمحولات (125 MVA Load Control)
          </span>

          {/* Transformer T1 Load Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">حمل محول T1 (P / Q / S):</span>
              <span className="font-mono text-amber-400 text-[11px] font-bold">
                {t1P} MW • {t1Q.toFixed(1)} MVAr ({((t1S / 125) * 100).toFixed(0)}%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="155"
              step="1"
              value={t1P}
              onChange={(e) => updateTransformerLoad('BAY_T1', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>0% (لا حمل)</span>
              <span>62.5 MW (ONAN)</span>
              <span>125 MW (100%)</span>
              <span>150 MW (120% زائد)</span>
            </div>
          </div>

          {/* Transformer T2 Load Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">حمل محول T2 (P / Q / S):</span>
              <span className="font-mono text-cyan-400 text-[11px] font-bold">
                {t2P} MW • {t2Q.toFixed(1)} MVAr ({((t2S / 125) * 100).toFixed(0)}%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="155"
              step="1"
              value={t2P}
              onChange={(e) => updateTransformerLoad('BAY_T2', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>0% (لا حمل)</span>
              <span>62.5 MW (ONAN)</span>
              <span>125 MW (100%)</span>
              <span>150 MW (120% زائد)</span>
            </div>
          </div>

          {/* Interactive Power Factor (cos phi) -> Dynamically Governs Q = P * tan(phi) */}
          <div className="space-y-1 pt-1.5 border-t border-slate-800">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">عامل استطاعة الأحمال (cos &phi;):</span>
              <span className="font-mono text-emerald-400 text-[11px] font-bold">
                {powerFactor.toFixed(2)} {powerFactor >= 0.999 ? '(مقاومي صرف Unity)' : '(تأخري Inductive)'}
              </span>
            </div>
            <input
              type="range"
              min="0.80"
              max="1.00"
              step="0.01"
              value={powerFactor}
              onChange={(e) => handlePowerFactorChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>0.80 (Q عالٍ / هبوط جهد أكبر)</span>
              <span>0.90 (معياري)</span>
              <span>1.00 (Q = 0)</span>
            </div>
          </div>
        </div>

        {/* Column 3: Fault Injections */}
        <div className="bg-[#12151b] p-3.5 rounded-xl border border-[#2b3341] space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-1">
            <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              حقن الأعطال الفيزيائية (Fault Scenarios)
            </span>
            {faultActive && (
              <button
                onClick={onClearFaults}
                className="text-[10px] bg-emerald-800 hover:bg-emerald-700 text-white px-2 py-0.5 rounded font-bold transition flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                تصفير الأعطال
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 pt-1 text-xs">
            {/* SF6 Leak Button */}
            <button
              onClick={() => onInjectFault('SF6_LEAK')}
              className={`p-2 rounded-lg border text-right transition flex items-center justify-between ${
                faultType === 'SF6_LEAK'
                  ? 'bg-amber-950/80 border-amber-600 text-amber-200'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="font-bold block text-[11px]">تسريب غاز SF6 في القاطع CB1</span>
                  <span className="text-[10px] text-slate-400">انخفاض لـ 4.8 bar مع تفعيل حظر الفتح/الغلق</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-900 rounded text-slate-400">
                Lockout
              </span>
            </button>

            {/* 3-Phase Short Circuit */}
            <button
              onClick={() => onInjectFault('3PH_FAULT')}
              className={`p-2 rounded-lg border text-right transition flex items-center justify-between ${
                faultType === '3PH_FAULT'
                  ? 'bg-red-950/90 border-red-600 text-red-200 animate-pulse'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <ZapOff className="w-4 h-4 text-red-500" />
                <div>
                  <span className="font-bold block text-[11px]">قصر ثلاثي الأطوار (3-Ph Fault 38.5 kA)</span>
                  <span className="text-[10px] text-slate-400">إثارة ريليه SEL-487E ورحلة GOOSE سريعة</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-red-900/60 rounded text-red-300">
                Trip 50/51
              </span>
            </button>

            {/* Transformer Overheat */}
            <button
              onClick={() => onInjectFault('TX_OVERHEAT')}
              className={`p-2 rounded-lg border text-right transition flex items-center justify-between ${
                faultType === 'TX_OVERHEAT'
                  ? 'bg-amber-950/80 border-amber-600 text-amber-200'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <div>
                  <span className="font-bold block text-[11px]">ارتفاع حرارة زيت محول T1</span>
                  <span className="text-[10px] text-slate-400">توقف مراوح ONAF وصعود الحرارة لـ 95°C</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-orange-950 rounded text-orange-300">
                Alarm 49
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { Zap, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { EquationCard } from '../common/EquationCard';
import {
  calculateShortCircuit,
  voltageFactors,
} from '../../lib/engineering/faultCalculation';
import { solveShuntFault, FaultType } from '../../lib/engineering/symmetricalComponents';
import { SYSTEM_FREQUENCY_HZ } from '../../lib/engineering/systemConstants';

const VOLTAGE_LEVELS = [132, 33, 13.8, 0.4];

export const ShortCircuitAnalyzerModule: React.FC = () => {
  const { lang } = useScada();
  const isAr = lang === 'ar';

  const [unKv, setUnKv] = useState<number>(132);
  const [gridSkMva, setGridSkMva] = useState<number>(2500);
  const [gridRxRatio, setGridRxRatio] = useState<number>(10);
  const [txEnabled, setTxEnabled] = useState<boolean>(true);
  const [txRatedMva, setTxRatedMva] = useState<number>(40);
  const [txUkPct, setTxUkPct] = useState<number>(12.35);
  const [lineLengthKm, setLineLengthKm] = useState<number>(0);
  const [lineRPerKm, setLineRPerKm] = useState<number>(0.12);
  const [lineXPerKm, setLineXPerKm] = useState<number>(0.4);
  const [z0Ratio, setZ0Ratio] = useState<number>(3.0);

  const result = useMemo(
    () =>
      calculateShortCircuit({
        unKv,
        gridSkMva,
        gridRxRatio,
        zeroSequenceRatio: z0Ratio,
        transformer: txEnabled
          ? { ratedPowerMva: txRatedMva, shortCircuitVoltagePct: txUkPct, xrRatio: 15 }
          : undefined,
        line:
          lineLengthKm > 0
            ? { rPerKmOhm: lineRPerKm, xPerKmOhm: lineXPerKm, lengthKm: lineLengthKm }
            : undefined,
      }),
    [unKv, gridSkMva, gridRxRatio, z0Ratio, txEnabled, txRatedMva, txUkPct, lineLengthKm, lineRPerKm, lineXPerKm]
  );

  // Sequence-domain comparison on a 100 MVA / Un base
  const sequenceComparison = useMemo(() => {
    const baseMva = 100;
    const zBase = (unKv * unKv) / baseMva;
    const networks = {
      z1: { re: result.z1.re / zBase, im: result.z1.im / zBase },
      z2: { re: result.z1.re / zBase, im: result.z1.im / zBase },
      z0: { re: result.z0.re / zBase, im: result.z0.im / zBase },
    };

    const types: FaultType[] = ['THREE_PHASE', 'SLG', 'LINE_LINE', 'LLG'];
    return types.map((type) => {
      const sol = solveShuntFault(type, { ...networks });
      // pu current -> kA at Un
      const ka = sol.worstPhaseKaEquivalent * (baseMva / (Math.sqrt(3) * unKv));
      return { type, ka };
    });
  }, [result, unKv]);

  const fmt = (v: number, d: number = 2) => v.toFixed(d);

  const sliderRow = (
    label: string,
    value: number,
    setter: (v: number) => void,
    min: number,
    max: number,
    step: number,
    unit: string
  ) => (
    <div>
      <div className="flex justify-between text-[11px] font-mono mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="text-cyan-300 font-bold">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setter(Number(e.target.value))}
        className="w-full accent-cyan-500 cursor-pointer"
      />
    </div>
  );

  return (
    <div className="space-y-6 font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-950 to-zinc-950 border border-emerald-800/40 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-950 border border-emerald-700/50 rounded-xl">
            <Zap className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight font-mono">
              {isAr ? 'محلل الأعطال القصيرة IEC 60909' : 'IEC 60909 Short-Circuit Analyzer'}
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              {isAr
                ? 'حساب تيارات القصر الابتدائية وذروتها وفق الطريقة القياسية لمصدر الجهد المكافئ'
                : 'Initial, peak & earth-fault currents via the equivalent voltage source method'}
            </p>
          </div>
        </div>
        <div className="px-3 py-1.5 bg-emerald-950 border border-emerald-700/50 rounded-lg text-[10px] font-bold text-emerald-300 font-mono uppercase">
          IEC 60909-0 • {SYSTEM_FREQUENCY_HZ} Hz
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Input Panel */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wide border-b border-zinc-800 pb-2">
            {isAr ? 'بيانات الشبكة' : 'Network Data'}
          </h3>

          <div>
            <div className="text-[11px] font-mono text-zinc-400 mb-1">{isAr ? 'جهد الاسمي Un' : 'Nominal Voltage Un'}</div>
            <div className="grid grid-cols-4 gap-1.5">
              {VOLTAGE_LEVELS.map((kv) => (
                <button
                  key={kv}
                  onClick={() => setUnKv(kv)}
                  className={`py-1.5 rounded-lg text-[11px] font-bold font-mono transition ${
                    unKv === kv
                      ? 'bg-emerald-600 text-white shadow shadow-emerald-600/40'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-emerald-700'
                  }`}
                >
                  {kv} kV
                </button>
              ))}
            </div>
          </div>

          {sliderRow(isAr ? 'قدرة قصر الشبكة Sk"' : 'Grid Sk" (source)', gridSkMva, setGridSkMva, 250, 10000, 50, 'MVA')}
          {sliderRow('R/X', gridRxRatio, setGridRxRatio, 1, 20, 0.5, '')}
          {sliderRow(isAr ? 'نسبة Z0/Z1' : 'Z0/Z1 Ratio', z0Ratio, setZ0Ratio, 0.5, 5, 0.1, 'pu')}

          <div className="pt-2 border-t border-zinc-800 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={txEnabled} onChange={(e) => setTxEnabled(e.target.checked)} className="accent-emerald-500 w-3.5 h-3.5" />
              <span className="text-[11px] font-mono text-zinc-300">
                {isAr ? 'تضمين محول ربط' : 'Include interposed transformer'}
              </span>
            </label>
            {txEnabled && (
              <>
                {sliderRow('SrT', txRatedMva, setTxRatedMva, 5, 100, 5, 'MVA')}
                {sliderRow('uk', txUkPct, setTxUkPct, 4, 25, 0.05, '%')}
              </>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-800 space-y-3">
            {sliderRow(isAr ? 'طول الخط حتى نقطة العطل' : 'Line length to fault', lineLengthKm, setLineLengthKm, 0, 120, 1, 'km')}
            {(lineLengthKm > 0) && (
              <>
                {sliderRow("r'", lineRPerKm, setLineRPerKm, 0.02, 0.6, 0.01, 'Ω/km')}
                {sliderRow("x'", lineXPerKm, setLineXPerKm, 0.1, 1.2, 0.01, 'Ω/km')}
              </>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Ik''max (3φ)", value: `${fmt(result.ik3phMaxKa)} kA`, color: 'text-rose-400' },
              { label: "Ik''min", value: `${fmt(result.ik3phMinKa)} kA`, color: 'text-amber-300' },
              { label: 'Ik1 (L-E)', value: `${fmt(result.ik1phMaxKa)} kA`, color: 'text-orange-300' },
              { label: 'ip Peak', value: `${fmt(result.ipPeakKa)} kA`, color: 'text-fuchsia-300' },
            ].map((card) => (
              <div key={card.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5">
                <div className="text-[10px] text-zinc-500 font-mono uppercase">{card.label}</div>
                <div className={`text-xl font-black font-mono mt-1 ${card.color}`}>{card.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 font-mono text-[11px] space-y-1.5">
              <div className="flex justify-between"><span className="text-zinc-500">c_max / c_min</span><span className="text-zinc-200">{result.cMax} / {result.cMin}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">κ (peak factor)</span><span className="text-cyan-300">{fmt(result.kappa, 3)}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Ta (DC decay)</span><span className="text-zinc-200">{result.taMs === Infinity ? '∞' : `${fmt(result.taMs, 1)} ms`}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">S_k''</span><span className="text-emerald-300">{fmt(result.skMva, 0)} MVA</span></div>
            </div>
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 font-mono text-[11px] space-y-1.5">
              <div className="flex justify-between"><span className="text-zinc-500">Z1 = R + jX</span><span className="text-zinc-200">{fmt(result.z1.re, 3)} + j{fmt(result.z1.im, 3)} Ω</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">|Z1|</span><span className="text-zinc-200">{fmt(result.z1MagnitudeOhm, 3)} Ω</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Z0 (k₀·Z1)</span><span className="text-zinc-200">k₀ = {z0Ratio.toFixed(1)}</span></div>
              <div className="flex items-center gap-1.5">
                {result.kappa <= 1.8 && result.ik3phMaxKa < 40 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span className={result.kappa <= 1.8 && result.ik3phMaxKa < 40 ? 'text-emerald-300' : 'text-rose-300'}>
                  {result.kappa <= 1.8 && result.ik3phMaxKa < 40
                    ? isAr ? 'ضمن قدرة تحمل المعدات القياسية' : 'Within standard equipment withstand'
                    : isAr ? 'تجاوز حدود التحمل النموذجية - مراجعة مطلوبة' : 'Beyond typical withstand — review required'}
                </span>
              </div>
            </div>
          </div>

          {/* Sequence-domain fault comparison */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wide">
                {isAr ? 'مقارنة أنواع الأعطال (المركبات التماثلية)' : 'Fault-Type Comparison (Symmetrical Components)'}
              </h3>
            </div>
            <table className="w-full text-left font-mono text-[11px]">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="pb-2">{isAr ? 'نوع العطل' : 'Fault Type'}</th>
                  <th className="pb-2">{isAr ? 'التيار الأسوأ' : 'Worst Phase Current'}</th>
                  <th className="pb-2">{isAr ? 'الشبكة المتسلسلة' : 'Sequence Network'}</th>
                </tr>
              </thead>
              <tbody>
                {sequenceComparison.map(({ type, ka }) => (
                  <tr key={type} className="border-b border-zinc-900 last:border-0">
                    <td className="py-2 text-zinc-300">
                      {type === 'THREE_PHASE' ? '3-Phase (LLL)' : type === 'SLG' ? 'Single Line-to-Ground (L-G)' : type === 'LINE_LINE' ? 'Line-to-Line (L-L)' : 'Double Line-to-Ground (L-L-G)'}
                    </td>
                    <td className="py-2">
                      <span className={`${type === 'THREE_PHASE' ? 'text-rose-400' : 'text-amber-300'} font-bold`}>
                        {ka.toFixed(2)} kA
                      </span>
                    </td>
                    <td className="py-2 text-zinc-500">
                      {type === 'THREE_PHASE' ? 'Z₁' : type === 'SLG' ? 'Z₁+Z₂+Z₀' : type === 'LINE_LINE' ? 'Z₁+Z₂' : 'Z₁+(Z₂∥Z₀)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <EquationCard
            title={isAr ? 'المعادلات القياسية IEC 60909' : 'IEC 60909 Governing Equations'}
            standard="IEC 60909-0"
            equation="Ik'' = c·Un / (√3·Zk)   |   ip = κ·√2·Ik''   |   κ = 1.02 + 0.98·e^(−3R/X)"
            description={
              isAr
                ? 'طريقة مصدر الجهد المكافئ لأعطال بعيدة عن المولدات، مع معامل تصحيح المحولة K_T ومعاملات الجهد c وفق الجدول 1.'
                : 'Equivalent voltage source method for far-from-generator faults with transformer correction K_T and Table 1 voltage factors c.'
            }
          />
        </div>
      </div>
    </div>
  );
};

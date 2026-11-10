import React, { useMemo, useState } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, Gauge, Waves } from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { EquationCard } from '../common/EquationCard';
import {
  criticalClearingAngleEqualArea,
  criticalClearingTime,
  initialRotorAngle,
  simulateSwing,
  unstableEquilibriumAngle,
} from '../../lib/engineering/transientStability';
import { SYSTEM_FREQUENCY_HZ } from '../../lib/engineering/systemConstants';

export const TransientStabilityModule: React.FC = () => {
  const { lang } = useScada();
  const isAr = lang === 'ar';

  const [hSeconds, setHSeconds] = useState<number>(5);
  const [pMechPn, setPMechPn] = useState<number>(0.5);
  const [pMaxPn, setPMaxPn] = useState<number>(1.5);
  const [clearTimeSec, setClearTimeSec] = useState<number>(0.12);
  const [postFaultFactor, setPostFaultFactor] = useState<number>(1.0);
  const [dampingD, setDampingD] = useState<number>(2);

  // Time-domain swing solution (RK4)
  const swing = useMemo(
    () =>
      simulateSwing({
        hSeconds,
        pMechPn,
        pMaxPn,
        postFaultPmaxPn: pMaxPn * postFaultFactor,
        clearTimeSec,
        dampingD,
        simTimeSec: 5,
        dtSec: 0.001,
      }),
    [hSeconds, pMechPn, pMaxPn, postFaultFactor, clearTimeSec, dampingD]
  );

  const deltaCrRad = useMemo(() => criticalClearingAngleEqualArea(pMechPn, pMaxPn), [pMechPn, pMaxPn]);

  const cctSec = useMemo(
    () =>
      criticalClearingTime(
        {
          hSeconds,
          pMechPn,
          pMaxPn,
          postFaultPmaxPn: pMaxPn * postFaultFactor,
          dampingD,
          simTimeSec: 5,
          dtSec: 0.001,
        },
        2,
        0.002
      ),
    [hSeconds, pMechPn, pMaxPn, postFaultFactor, dampingD]
  );

  // SVG plot geometry for the rotor angle trajectory
  const PLOT_W = 640;
  const PLOT_H = 260;
  const tEnd = swing.samples[swing.samples.length - 1]?.tSec ?? 5;
  const dUdeg = (unstableEquilibriumAngle(pMechPn, pMaxPn * postFaultFactor) * 180) / Math.PI;
  const yMax = Math.min(200, Math.max(120, dUdeg + 40));
  const xOf = (t: number) => (t / tEnd) * PLOT_W;
  const yOf = (deg: number) => PLOT_H - ((deg + 20) / (yMax + 20)) * PLOT_H;

  const pathDelta = swing.samples
    .filter((_, i) => i % 4 === 0)
    .map((smpl) => `${xOf(smpl.tSec).toFixed(1)},${yOf(Math.min(smpl.deltaDeg, 400)).toFixed(1)}`)
    .join(' ');

  const stable = swing.stable;
  const marginPct = cctSec && cctSec > 0 ? ((cctSec - clearTimeSec) / cctSec) * 100 : null;

  const slider = (
    label: string,
    unit: string,
    value: number,
    setter: (v: number) => void,
    min: number,
    max: number,
    step: number,
    decimals: number = 2
  ) => (
    <div>
      <div className="flex justify-between text-[11px] font-mono mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="text-cyan-300 font-bold">
          {value.toFixed(decimals)} {unit}
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
      <div className="bg-gradient-to-r from-indigo-950/60 via-zinc-950 to-zinc-950 border border-indigo-800/40 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-950 border border-indigo-700/50 rounded-xl">
            <Waves className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight font-mono">
              {isAr ? 'محاكي الاستقرار اللحظي (معادلة التأرجح)' : 'Transient Stability Simulator (Swing Equation)'}
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              {isAr
                ? 'انتقال عطل ثلاثي الأطوار على آلة مزامنة موصولة بشبكة لانهائية — معيار المساحتين المتساويتين وتكامل RK4'
                : 'Three-phase fault on a machine tied to an infinite bus — equal-area criterion & RK4 time-domain integration'}
            </p>
          </div>
        </div>
        <div
          className={`px-4 py-2 rounded-xl border font-mono text-sm font-black flex items-center gap-2 ${
            stable ? 'bg-emerald-950 border-emerald-700 text-emerald-300' : 'bg-rose-950 border-rose-700 text-rose-300 animate-pulse'
          }`}
        >
          {stable ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {stable ? (isAr ? 'مستقر لحظياً' : 'STABLE') : isAr ? 'فقدان التزامن' : 'POLE SLIP / UNSTABLE'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Inputs */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wide border-b border-zinc-800 pb-2 flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5 text-indigo-400" />
            {isAr ? 'معطيات الآلة والشبكة' : 'Machine & Network Data'}
          </h3>
          {slider(isAr ? 'ثابت القصور H' : 'Inertia constant H', 's', hSeconds, setHSeconds, 0.5, 12, 0.25)}
          {slider('Pm', 'pu', pMechPn, setPMechPn, 0.05, 0.95, 0.01)}
          {slider("Pmax = E'V/X", 'pu', pMaxPn, setPMaxPn, 0.5, 2.5, 0.01)}
          {slider(isAr ? 'زمن إزالة العطل' : 'Fault clearing time', 's', clearTimeSec, setClearTimeSec, 0, 1, 0.005, 3)}
          {slider(isAr ? 'معامل Pmax بعد العطل' : 'Post-fault Pmax factor', '×', postFaultFactor, setPostFaultFactor, 0.5, 1, 0.01)}
          {slider(isAr ? 'معامل التخميد D' : 'Damping D', '', dampingD, setDampingD, 0, 20, 0.5, 1)}

          <div className="pt-3 border-t border-zinc-800 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between"><span className="text-zinc-500">δ₀ {isAr ? '(اتزان قبل العطل)' : '(pre-fault eq.)'}</span><span className="text-zinc-200">{((initialRotorAngle(pMechPn, pMaxPn) * 180) / Math.PI).toFixed(1)}°</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">δ_u {isAr ? '(اتزان غير مستقر)' : '(unstable eq.)'}</span><span className="text-zinc-200">{dUdeg.toFixed(1)}°</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">f</span><span className="text-zinc-200">{SYSTEM_FREQUENCY_HZ} Hz</span></div>
          </div>
        </div>

        {/* Plot + results */}
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: isAr ? 'زاوية الفصل الحرجة δcr' : 'Critical angle δcr', value: deltaCrRad ? `${((deltaCrRad * 180) / Math.PI).toFixed(1)}°` : '—', color: 'text-amber-300' },
              { label: isAr ? 'الزمن الحرج CCT' : 'CCT (bisection)', value: cctSec === null ? '> 2 s' : `${cctSec.toFixed(3)} s`, color: 'text-cyan-300' },
              { label: isAr ? 'أقصى زاوية بلغت' : 'Peak swing angle', value: `${swing.maxDeltaDeg.toFixed(1)}°`, color: stable ? 'text-emerald-400' : 'text-rose-400' },
              {
                label: isAr ? 'هامش الأمان الزمني' : 'Clearing-time margin',
                value: marginPct === null ? '—' : `${marginPct.toFixed(0)}%`,
                color: marginPct !== null && marginPct < 15 ? 'text-rose-400' : 'text-emerald-400',
              },
            ].map((card) => (
              <div key={card.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5">
                <div className="text-[10px] text-zinc-500 font-mono uppercase">{card.label}</div>
                <div className={`text-xl font-black font-mono mt-1 ${card.color}`}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Rotor angle trajectory */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span className="font-mono text-xs font-bold text-zinc-300 uppercase">{isAr ? 'منحنى زاوية الموتور δ(t)' : 'Rotor Angle Trajectory δ(t)'}</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                RK4 • dt = 1 ms • {swing.samples.length} {isAr ? 'نقطة' : 'samples'}
              </span>
            </div>
            <svg viewBox={`0 0 ${PLOT_W} ${PLOT_H}`} className="w-full">
              <line x1={0} y1={yOf(dUdeg)} x2={PLOT_W} y2={yOf(dUdeg)} stroke="#f43f5e" strokeWidth="1" strokeDasharray="6 4" opacity="0.7" />
              <text x={6} y={yOf(dUdeg) - 4} fill="#f43f5e" fontSize="9" fontFamily="monospace">δu = {dUdeg.toFixed(0)}°</text>
              {deltaCrRad !== null && (
                <>
                  <line x1={0} y1={yOf((deltaCrRad * 180) / Math.PI)} x2={PLOT_W} y2={yOf((deltaCrRad * 180) / Math.PI)} stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
                  <text x={6} y={yOf((deltaCrRad * 180) / Math.PI) - 4} fill="#fbbf24" fontSize="9" fontFamily="monospace">
                    δcr = {((deltaCrRad * 180) / Math.PI).toFixed(0)}°
                  </text>
                </>
              )}
              <polyline points={pathDelta} fill="none" stroke="#38bdf8" strokeWidth="1.8" />
              {clearTimeSec > 0 && clearTimeSec <= tEnd && (
                <line x1={xOf(clearTimeSec)} y1={0} x2={xOf(clearTimeSec)} y2={PLOT_H} stroke="#a78bfa" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />
              )}
            </svg>
            <div className="flex justify-between text-[10px] font-mono text-zinc-600 mt-1">
              <span>t = 0 s</span>
              <span>{isAr ? 'خط بنفسجي: لحظة الإزالة • خط أحمر: حد فقدان التزامن' : 'purple: fault clearing • red: pole-slip boundary'}</span>
              <span>t = {tEnd.toFixed(0)} s</span>
            </div>
          </div>

          <EquationCard
            title={isAr ? 'معادلة التأرجح ومعيار المساحتين' : 'Swing Equation & Equal-Area Criterion'}
            standard="Classical Model"
            equation="(2H/ωs)·d²δ/dt² = Pm − Pe − (D/ωs)·dδ/dt ,   Pe = (E′V/X)·sin δ"
            description={
              isAr
                ? 'يُكامل النموذج الكلاسيكي عددياً بـ RK4 أثناء وأ بعد العطل، ويُشتق زمن الفصل الحرج بالتنصيف مع مقارنة زاوية الحد بميزان المساحتين المتساويتين.'
                : 'The classical model is integrated with RK4 through the fault-on and post-fault networks; CCT is obtained by bisection and cross-checked against the equal-area critical angle.'
            }
            variables={[
              { symbol: 'H', label: isAr ? 'ثابت القصور الذاتي' : 'Inertia constant', value: hSeconds.toFixed(2), unit: 's' },
              { symbol: 'δcr', label: isAr ? 'زاوية الفصل الحرجة (مساحتان)' : 'Equal-area critical angle', value: deltaCrRad ? `${((deltaCrRad * 180) / Math.PI).toFixed(1)}°` : '—' },
              { symbol: 'CCT', label: isAr ? 'الزمن الحرج للفصل' : 'Critical clearing time', value: cctSec === null ? '> 2 s' : `${cctSec.toFixed(3)} s` },
              { symbol: 'D', label: isAr ? 'التخميد' : 'Damping', value: dampingD.toFixed(1) }
            ]}
            result={{
              label: isAr ? 'حكم الاستقرار اللحظي' : 'First-Swing Verdict',
              value: stable ? (isAr ? 'مستقر' : 'STABLE') : isAr ? 'غير مستقر' : 'UNSTABLE',
              status: stable ? (isAr ? 'متزامن' : 'IN-SYNCH') : isAr ? 'انزلاق قطبي' : 'POLE SLIP',
              statusColor: stable ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-rose-950 text-rose-300 border-rose-700'
            }}
          />
        </div>
      </div>
    </div>
  );
};

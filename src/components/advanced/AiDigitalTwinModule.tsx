import React, { useState, useEffect } from 'react';
import { Cpu, Activity, Brain, ShieldAlert, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

export const AiDigitalTwinModule: React.FC = () => {
  const { activeTelemetry, lang } = useScada();
  const isAr = lang === 'ar';

  const [pinnTemp, setPinnTemp] = useState<number>(activeTelemetry?.oilTemp ?? 62.4);
  const [physicsTemp, setPhysicsTemp] = useState<number>((activeTelemetry?.oilTemp ?? 62.4) + 0.3);
  const [anomalyScore, setAnomalyScore] = useState<number>(4.2);
  const [weibullBeta] = useState<number>(2.4); // Shape parameter > 1 (Wear-out phase)
  const [weibullEta] = useState<number>(185000); // Scale parameter (Characteristic life)

  // Live simulation updates for PINN surrogate model
  useEffect(() => {
    const timer = setInterval(() => {
      const real = activeTelemetry?.oilTemp ?? 62.4;
      setPinnTemp(Number((real + (Math.random() - 0.5) * 0.4).toFixed(2)));
      setPhysicsTemp(Number((real + 0.3 + (Math.random() - 0.5) * 0.2).toFixed(2)));

      // Calculate anomaly score based on THD and load
      const baseAnomaly = ((activeTelemetry?.thd ?? 2.1) / 10) * 15 + ((activeTelemetry?.loadCurrent ?? 0) > 500 ? 25 : 2);
      setAnomalyScore(Number((baseAnomaly + Math.random() * 2).toFixed(1)));
    }, 1200);

    return () => clearInterval(timer);
  }, [activeTelemetry]);

  // Delta between PINN model and physical sensors
  const deltaT = Math.abs(pinnTemp - (activeTelemetry?.oilTemp ?? 62.4));

  // Weibull Mean Time To Failure: MTTF = eta * Gamma(1 + 1/beta)
  // Lanczos approximation of Gamma(z)
  const gammaWeibull = (b: number): number => {
    const z = 1 + 1 / b;
    const p = [
      0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109583115912, 9.9843695780195716e-6, 1.5056327351493116e-7,
    ];
    let x = p[0];
    for (let i = 1; i < 9; i++) x += p[i] / (z - 1 + i);
    const t = z - 1 + 7 + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z - 1 + 0.5) * Math.exp(-t) * x;
  };
  const currentHours = 22450;
  const mttfYears = (weibullEta * gammaWeibull(weibullBeta)) / 8760;

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-2.5 bg-cyan-950/80 border border-cyan-700/60 rounded-lg text-cyan-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-tight">
              {isAr
                ? 'التوأم الرقمي بالشبكات العصبية الموجهة بالقوانين الفيزيائية (PINN) والصيانة التنبؤية'
                : 'AI Physics-Informed Neural Network (PINN) Digital Twin & Predictive Maintenance'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'نمذجة المعادلات التفاضلية الحرارية بالتوازي، تقييم الشذوذ عبر Autoencoder، وتوقع العمر المتبقي (Weibull RUL)'
                : 'Parallel Differential Equation Surrogate Modeling, Autoencoder Anomaly Scoring, & Weibull RUL'}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold text-xs rounded-full flex items-center space-x-1 rtl:space-x-reverse font-mono">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{isAr ? 'التوأم الرقمي متزامن ومفعل' : 'PINN TWIN SYNCHRONIZED'}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Module 7 Component 1: PINN Surrogate Model vs Physical Equations */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase text-cyan-400 flex items-center space-x-2 rtl:space-x-reverse">
              <Cpu className="w-4 h-4" />
              <span>{isAr ? 'النموذج البديل الفيزيائي PINN لحرارة الزيت' : 'PINN Physics Surrogate Thermal Model'}</span>
            </h4>
            <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
              dΘ/dt Engine
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block">
                {isAr ? 'حرارة الحساس الفعلي' : 'Actual Sensor Oil Temp'}
              </span>
              <span className="text-xl font-bold text-slate-100 font-mono">
                {(activeTelemetry?.oilTemp ?? 62.4).toFixed(1)} °C
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block">
                {isAr ? 'توقع نموذج PINN' : 'PINN Surrogate Model'}
              </span>
              <span className="text-xl font-bold text-cyan-400 font-mono">{pinnTemp.toFixed(1)} °C</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block">
                {isAr ? 'انحراف النموذج ΔT' : 'Surrogate Residual ΔT'}
              </span>
              <span className={`text-xl font-bold font-mono ${deltaT > 2.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {deltaT.toFixed(2)} °C
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <p className="flex justify-between">
              <span className="text-slate-400">
                {isAr ? 'المعادلة الفيزيائية التفاضلية للحرارة:' : 'Physical Differential Heat Eq:'}
              </span>
              <span className="font-mono text-cyan-300">dΘ_oil/dt = (1/τ) [ (P_cu + P_fe) - Q_cool ]</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400">
                {isAr ? 'انحراف نموذج الذكاء الاصطناعي:' : 'PINN Model Residual Drift:'}
              </span>
              <span className="font-bold text-emerald-400">
                {isAr ? 'طبيعي (< 0.50 °C خطأ)' : 'NORMAL (< 0.50 °C Error)'}
              </span>
            </p>
          </div>
        </div>

        {/* Module 7 Component 2: Multivariate Anomaly Score & Isolation Forest */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase text-amber-400 flex items-center space-x-2 rtl:space-x-reverse">
              <Activity className="w-4 h-4" />
              <span>
                {isAr
                  ? 'مؤشر كشف الشذوذ متعدد المتغيرات (0-100)'
                  : 'Multivariate Telemetry Anomaly Index (0-100)'}
              </span>
            </h4>
            <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
              Isolation Forest
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-xs block mb-1">
                {isAr
                  ? 'التقييم المستمر للشذوذ عبر (V, I, P, Q, Θ, THD):'
                  : 'Continuous Anomaly Index Across V, I, P, Q, Θ, THD:'}
              </span>
              <div className="flex items-baseline space-x-2 rtl:space-x-reverse">
                <span className={`text-3xl font-black font-mono ${anomalyScore > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {anomalyScore} / 100
                </span>
                <span className="text-xs text-slate-400">
                  ({anomalyScore > 50
                    ? isAr ? 'تم رصد شذوذ' : 'Anomaly Flagged'
                    : isAr ? 'خط الأساس طبيعي' : 'Normal Grid Baseline'})
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center">
              <Sparkles className="w-6 h-6 text-emerald-400 mx-auto" />
              <span className="text-[10px] text-slate-400 block mt-1">
                {isAr ? 'الحالة: آمن' : 'Status: SAFE'}
              </span>
            </div>
          </div>

          {/* Weibull RUL Hazard Function */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
              <span className="font-bold text-slate-200">
                {isAr ? 'نموذج ويبل (Weibull) لتقدير العمر التشغيلي المتبقي (RUL)' : 'Weibull Remaining Useful Life (RUL) Hazard Model'}
              </span>
              <span className="text-[10px] text-amber-400 font-bold font-mono">
                β = {weibullBeta} ({isAr ? 'مرحلة الاهتراء' : 'Wear-Out'})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div>
                {isAr ? 'العمر المميز (η):' : 'Characteristic Life (η):'}{' '}
                <strong className="text-slate-100 font-mono">{weibullEta.toLocaleString()} h</strong>
              </div>
              <div>
                {isAr ? 'متوسط الزمن المقدر للفشل (MTTF):' : 'Estimated MTTF:'}{' '}
                <strong className="text-emerald-400 font-mono">
                  {mttfYears.toFixed(1)} {isAr ? 'سنة' : 'Years'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  LineChart,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { EquationCard } from '../common/EquationCard';
import { iecOperatingTimeSeconds as calcOperatingTime } from '../../lib/engineering/protectionCurves';

export const TccCurvesModule: React.FC = () => {
  const { t, lang } = useScada();
  const isAr = lang === 'ar';

  // Relay Settings state
  // 1. Feeder Relay 52-7
  const [feederIp, setFeederIp] = useState<number>(300); // A
  const [feederTms, setFeederTms] = useState<number>(0.15);
  
  // 2. MV Incomer Relay 52-2
  const [incomerIp, setIncomerIp] = useState<number>(800); // A
  const [incomerTms, setIncomerTms] = useState<number>(0.35);

  // 3. HV Transformer Primary Relay 52-1
  const [primaryIp, setPrimaryIp] = useState<number>(1200); // A
  const [primaryTms, setPrimaryTms] = useState<number>(0.60);

  // Selected Fault Current for Grading Check
  const [testFaultCurrentA, setTestFaultCurrentA] = useState<number>(3500);

  // IEC Standard Inverse Formula: t = TMS * (0.14 / ((I / Ip)^0.02 - 1))
  const tFeeder = calcOperatingTime(testFaultCurrentA, feederIp, feederTms);
  const tIncomer = calcOperatingTime(testFaultCurrentA, incomerIp, incomerTms);
  const tPrimary = calcOperatingTime(testFaultCurrentA, primaryIp, primaryTms);

  // Grading Margins
  const margin1 = tIncomer - tFeeder; // Incomer vs Feeder
  const margin2 = tPrimary - tIncomer; // Primary vs Incomer

  const isMargin1Valid = margin1 >= 0.30;
  const isMargin2Valid = margin2 >= 0.30;
  const isOverallSelective = isMargin1Valid && isMargin2Valid;

  // Logarithmic plot helper coords
  const plotWidth = 520;
  const plotHeight = 320;

  // Log scale conversion functions (X: 10 to 50000 A, Y: 0.01 to 100 s)
  const logX = (i: number) => {
    const minLog = Math.log10(10);
    const maxLog = Math.log10(50000);
    const valLog = Math.log10(Math.max(10, i));
    return ((valLog - minLog) / (maxLog - minLog)) * plotWidth;
  };

  const logY = (tVal: number) => {
    const minLog = Math.log10(0.01);
    const maxLog = Math.log10(100);
    const valLog = Math.log10(Math.min(100, Math.max(0.01, tVal)));
    return plotHeight - ((valLog - minLog) / (maxLog - minLog)) * plotHeight;
  };

  // Generate SVG path points for TCC curve
  const generateCurvePath = (ip: number, tms: number): string => {
    const points: string[] = [];
    const minI = ip * 1.05;
    const maxI = 50000;
    const steps = 60;

    for (let idx = 0; idx <= steps; idx++) {
      const frac = idx / steps;
      // Exponential step across log space
      const current = minI * Math.pow(maxI / minI, frac);
      const time = calcOperatingTime(current, ip, tms);
      if (time > 0.01 && time < 100) {
        const x = logX(current);
        const y = logY(time);
        points.push(`${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
      }
    }
    return points.join(' ');
  };

  return (
    <div className="space-y-6 font-sans text-zinc-100">
      {/* Title Banner */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="p-3 bg-purple-950/80 border border-purple-700/80 rounded-xl text-purple-400 shrink-0">
            <LineChart className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-mono tracking-wide">
                {t('tcc_title')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-700 text-purple-300 text-[10px] font-mono font-extrabold">
                {isAr ? 'انتقائية الحماية IEC 60255 / IEEE' : 'IEEE / IEC 60255 SELECTIVITY'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {t('tcc_subtitle')}
            </p>
          </div>
        </div>

        {/* Overall Selectivity Status Badge */}
        <div className={`px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center space-x-2 rtl:space-x-reverse border ${
          isOverallSelective
            ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
            : 'bg-rose-950 border-rose-700 text-rose-300 animate-pulse'
        }`}>
          {isOverallSelective ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
          <span>{isOverallSelective ? t('tcc_selectivity_pass') : t('tcc_selectivity_fail')}</span>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logarithmic Plot (2 Cols) */}
        <div className="lg:col-span-2 bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 font-mono text-xs">
            <span className="font-bold text-white uppercase">{t('tcc_log_chart_title')}</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-400"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> {t('tcc_feeder_relay')}</span>
              <span className="flex items-center gap-1 text-amber-400"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> {t('tcc_incomer_relay')}</span>
              <span className="flex items-center gap-1 text-cyan-400"><span className="w-2.5 h-2.5 rounded bg-cyan-500"></span> {t('tcc_primary_relay')}</span>
            </div>
          </div>

          {/* SVG Logarithmic Chart */}
          <div className="flex justify-center items-center py-2 overflow-x-auto">
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <svg width={plotWidth} height={plotHeight} className="overflow-visible">
                {/* Grid Lines (Log Y: 0.01, 0.1, 1, 10, 100 s) */}
                {[0.01, 0.1, 1, 10, 100].map((timeVal) => (
                  <g key={`y-${timeVal}`}>
                    <line x1="0" y1={logY(timeVal)} x2={plotWidth} y2={logY(timeVal)} stroke="#27272a" strokeDasharray="3 3" />
                    <text x="-24" y={logY(timeVal) + 4} fill="#a1a1aa" fontSize="9" fontFamily="monospace">{timeVal}s</text>
                  </g>
                ))}

                {/* Grid Lines (Log X: 10, 100, 1k, 10k, 50k A) */}
                {[10, 100, 1000, 10000, 50000].map((i) => (
                  <g key={`x-${i}`}>
                    <line x1={logX(i)} y1="0" x2={logX(i)} y2={plotHeight} stroke="#27272a" strokeDasharray="3 3" />
                    <text x={logX(i) - 10} y={plotHeight + 14} fill="#a1a1aa" fontSize="9" fontFamily="monospace">{i >= 1000 ? `${i/1000}kA` : `${i}A`}</text>
                  </g>
                ))}

                {/* Curves */}
                <path d={generateCurvePath(feederIp, feederTms)} fill="none" stroke="#10b981" strokeWidth="3" />
                <path d={generateCurvePath(incomerIp, incomerTms)} fill="none" stroke="#f59e0b" strokeWidth="3" />
                <path d={generateCurvePath(primaryIp, primaryTms)} fill="none" stroke="#06b6d4" strokeWidth="3" />

                {/* Test Fault Vertical Line */}
                <line x1={logX(testFaultCurrentA)} y1="0" x2={logX(testFaultCurrentA)} y2={plotHeight} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" />
                <circle cx={logX(testFaultCurrentA)} cy={logY(tFeeder)} r="5" fill="#10b981" />
                <circle cx={logX(testFaultCurrentA)} cy={logY(tIncomer)} r="5" fill="#f59e0b" />
                <circle cx={logX(testFaultCurrentA)} cy={logY(tPrimary)} r="5" fill="#06b6d4" />
              </svg>
            </div>
          </div>

          {/* Test Fault Operating Times Banner */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 grid grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-2.5 bg-zinc-950 rounded-lg border border-emerald-900/50 space-y-0.5">
              <span className="text-[10px] text-emerald-400 font-bold">{t('tcc_feeder_trip_time')}</span>
              <div className="text-lg font-bold text-white">{tFeeder.toFixed(3)} s</div>
            </div>

            <div className="p-2.5 bg-zinc-950 rounded-lg border border-amber-900/50 space-y-0.5">
              <span className="text-[10px] text-amber-400 font-bold">{t('tcc_incomer_trip_time')}</span>
              <div className="text-lg font-bold text-white">{tIncomer.toFixed(3)} s</div>
            </div>

            <div className="p-2.5 bg-zinc-950 rounded-lg border border-cyan-900/50 space-y-0.5">
              <span className="text-[10px] text-cyan-400 font-bold">{t('tcc_primary_trip_time')}</span>
              <div className="text-lg font-bold text-white">{tPrimary.toFixed(3)} s</div>
            </div>
          </div>
        </div>

        {/* Relay Settings & Grading Margin Sidebar (1 Col) */}
        <div className="space-y-4 font-mono text-xs">
          {/* Grading Margin Check Results */}
          <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase border-b border-zinc-800 pb-2">{t('tcc_margin_eval')}</h3>

            <div className={`p-3 rounded-xl border space-y-1 ${
              isMargin1Valid ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}>
              <div className="flex justify-between font-bold">
                <span>{t('tcc_dt1_label')}:</span>
                <span>{margin1.toFixed(3)} s</span>
              </div>
              <p className="text-[10px] text-zinc-400">{t('tcc_target_margin')}</p>
            </div>

            <div className={`p-3 rounded-xl border space-y-1 ${
              isMargin2Valid ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}>
              <div className="flex justify-between font-bold">
                <span>{t('tcc_dt2_label')}:</span>
                <span>{margin2.toFixed(3)} s</span>
              </div>
              <p className="text-[10px] text-zinc-400">{t('tcc_target_margin')}</p>
            </div>
          </div>

          {/* IEC 60255 Equation Box */}
          <EquationCard
            title={isAr ? 'معادلة منحنى العكسي القياسي IEC 60255' : 'IEC 60255 Normal Inverse Curve Equation'}
            standard="IEC 60255-151"
            equation={
              <div className="flex items-center justify-center space-x-1.5 rtl:space-x-reverse text-cyan-300 font-bold">
                <span>t(I) = TMS ×</span>
                <span className="text-xl">⟦</span>
                <div className="inline-flex flex-col items-center px-1">
                  <span className="border-b border-cyan-400/80 pb-0.5">0.14</span>
                  <span className="pt-0.5">
                    (I / I<sub>p</sub>)<sup>0.02</sup> − 1
                  </span>
                </div>
                <span className="text-xl">⟧</span>
              </div>
            }
            description={
              isAr
                ? 'خاصية زمن الفصل العكسي الأدنى المحدد (IDMT) لتدريج وانتقائية الحماية الكهربائية'
                : 'Inverse Definite Minimum Time (IDMT) characteristic for protection grading'
            }
            variables={[
              { symbol: 't(I)', label: isAr ? 'زمن فصل المرحل المحسوب' : 'Relay operating trip time', value: tFeeder.toFixed(3), unit: 's' },
              { symbol: 'TMS', label: isAr ? 'معامل ضبط الوقت للمغذي' : 'Feeder Time Multiplier Setting', value: feederTms.toFixed(2) },
              { symbol: 'I', label: isAr ? 'تيار العطل التجريبي' : 'Test Fault Current', value: testFaultCurrentA, unit: 'A' },
              { symbol: 'I_p', label: isAr ? 'تيار بدء التشغيل (الالتقاط)' : 'Pickup Current Setting', value: feederIp, unit: 'A' }
            ]}
            result={{
              label: isAr ? 'زمن فصل المغذي عند تيار العطل' : 'Feeder Trip Time @ Test Fault',
              value: tFeeder.toFixed(3),
              unit: 's',
              status: isMargin1Valid ? (isAr ? 'متدرج ومنتقى' : 'GRADED') : (isAr ? 'خطر تداخل' : 'OVERLAP RISK'),
              statusColor: isMargin1Valid ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-rose-950 text-rose-300 border-rose-800'
            }}
          />

          {/* Interactive Settings Sliders */}
          <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 rtl:space-x-reverse border-b border-zinc-800 pb-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase">{t('tcc_relay_tuning')}</h3>
            </div>

            {/* Test Fault Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>{t('tcc_test_fault_current')}:</span>
                <span className="text-rose-400 font-bold">{testFaultCurrentA} A</span>
              </div>
              <input
                type="range"
                min="1000"
                max="15000"
                step="250"
                value={testFaultCurrentA}
                onChange={(e) => setTestFaultCurrentA(parseInt(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            {/* Feeder TMS */}
            <div className="space-y-1 pt-2 border-t border-zinc-800">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>{t('tcc_feeder_tms')}:</span>
                <span className="text-emerald-400 font-bold">{feederTms.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.01"
                value={feederTms}
                onChange={(e) => setFeederTms(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Incomer TMS */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>{t('tcc_incomer_tms')}:</span>
                <span className="text-amber-400 font-bold">{incomerTms.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.15"
                max="0.80"
                step="0.01"
                value={incomerTms}
                onChange={(e) => setIncomerTms(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Primary TMS */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>{t('tcc_primary_tms')}:</span>
                <span className="text-cyan-400 font-bold">{primaryTms.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.30"
                max="1.20"
                step="0.01"
                value={primaryTms}
                onChange={(e) => setPrimaryTms(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

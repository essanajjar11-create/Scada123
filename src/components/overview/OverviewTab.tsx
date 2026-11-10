import React from 'react';
import { useScada } from '../../context/ScadaContext';
import {
  Activity,
  Zap,
  Gauge,
  Thermometer,
  Layers,
  ChevronUp,
  ChevronDown,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Wind
} from 'lucide-react';

export const OverviewTab: React.FC = () => {
  const {
    activeTr,
    setActiveTr,
    tr1State,
    tr2State,
    activeTelemetry,
    changeTap,
    setTapMode,
    t,
    lang
  } = useScada();

  const getLoadBarColor = (loadPct: number) => {
    if (loadPct < 70) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
    if (loadPct < 85) return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
    return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]';
  };

  const tr1LoadPct = ((tr1State?.loadCurrent ?? 0) / 600) * 100;
  const tr2LoadPct = ((tr2State?.loadCurrent ?? 0) / 600) * 100;

  // Power Factor Gauge Angle calculation
  // Angle range: -120 deg (PF 0.5) to +120 deg (PF 1.0)
  const pfAngle = - (1.0 - (activeTelemetry?.pf ?? 0.98)) * 240;

  return (
    <div className="space-y-6 text-[#fafafa]">
      {/* Hero Welcome & Transformer Selector Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Hero Card */}
        <div className="lg:col-span-6 bg-[#18181b] border border-zinc-800 rounded-[28px] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em]">
                {t('primary_node')}
              </span>
              <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  {t('substation_online')}
                </span>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-3">
              {lang === 'ar' ? (
                <>
                  {t('transformer_monitoring_arch')}
                </>
              ) : (
                <>
                  Transformer <br /><span className="text-indigo-400 font-extrabold">Monitoring Architecture</span>
                </>
              )}
            </h1>
            <p className="text-zinc-400 text-sm max-w-lg leading-relaxed">
              {t('telemetry_stream_desc')} <span className="text-zinc-200 font-bold font-mono">{((activeTelemetry?.activePower ?? 0) / 1000).toFixed(2)} MW</span>.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 mt-6 relative z-10">
            <div className="px-5 py-2.5 bg-white text-black rounded-full font-bold text-xs tracking-tight hover:scale-105 transition-transform cursor-pointer shadow-lg">
              {t('active_node')} TR-{activeTr === 'TR-1' ? '1' : '2'}
            </div>
            <div className="px-5 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-full font-bold text-xs tracking-tight hover:bg-zinc-700 transition-colors cursor-pointer">
              {t('tap_position')}: {activeTelemetry?.tapPosition ?? 9} / 17
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none"></div>
        </div>

        {/* Transformer Cards */}
        {[tr1State, tr2State].map((tr) => {
          const loadPct = ((tr?.loadCurrent ?? 0) / 600) * 100;
          const isSelected = activeTr === tr?.id;
          const trDisplayName = tr?.id === 'TR-1' ? (lang === 'ar' ? 'محول القدرة TR-1' : 'Power Transformer TR-1') : (lang === 'ar' ? 'محول القدرة TR-2' : 'Power Transformer TR-2');
          return (
            <div
              key={tr?.id ?? 'tr'}
              onClick={() => tr?.id && setActiveTr(tr.id as 'TR-1' | 'TR-2')}
              className={`lg:col-span-3 bg-[#18181b] border rounded-[28px] p-6 flex flex-col justify-between shadow-xl transition-all cursor-pointer relative overflow-hidden group ${
                isSelected
                  ? 'border-indigo-500 shadow-indigo-500/10 shadow-2xl ring-2 ring-indigo-500/30'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em]">{tr?.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    isSelected ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {tr?.ratingMVA ?? 50} MVA
                  </span>
                </div>

                <h2 className="text-xl font-bold tracking-tight text-white mb-1">{trDisplayName}</h2>
                <div className="text-xs text-zinc-400 font-mono mb-4">{tr?.primarykV ?? 132}/{tr?.secondarykV ?? 13.8}kV Substation Bay</div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-4 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                  <div>
                    <span className="text-zinc-500 text-[10px] block font-sans uppercase tracking-wider font-bold">{t('load_percentage')}</span>
                    <span className="text-sm font-bold text-zinc-100">{(tr?.loadCurrent ?? 0).toFixed(1)} A</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block font-sans uppercase tracking-wider font-bold">{t('top_oil_temp')}</span>
                    <span className="text-sm font-bold text-amber-400">{(tr?.oilTemp ?? 0).toFixed(1)} °C</span>
                  </div>
                </div>
              </div>

              {/* Load Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-sans">
                  <span className="text-zinc-400 font-medium">{t('load_percentage')}</span>
                  <span className="font-bold font-mono text-zinc-100">{loadPct.toFixed(1)} %</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${getLoadBarColor(loadPct)}`}
                    style={{ width: `${Math.min(100, loadPct)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Main Instrumentation Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Voltage Panel */}
        <div className="lg:col-span-4 bg-[#18181b] border border-zinc-800 rounded-[28px] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-indigo-400">
              <Zap className="w-5 h-5" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-200">
                {lang === 'ar' ? 'الجهد ثلاثي الطور' : '3-Phase Voltage'}
              </h3>
            </div>
            <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-800 font-mono">
              PT-1 (132kV)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-center">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-1">
                {lang === 'ar' ? 'الطور A' : 'Phase A'}
              </span>
              <span className="text-lg font-bold font-mono text-white">{(activeTelemetry?.phaseA_Voltage ?? 0).toFixed(2)}</span>
              <span className="text-[10px] text-zinc-500 block font-mono">kV</span>
            </div>
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-center">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                {lang === 'ar' ? 'الطور B' : 'Phase B'}
              </span>
              <span className="text-lg font-bold font-mono text-white">{(activeTelemetry?.phaseB_Voltage ?? 0).toFixed(2)}</span>
              <span className="text-[10px] text-zinc-500 block font-mono">kV</span>
            </div>
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-center">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-1">
                {lang === 'ar' ? 'الطور C' : 'Phase C'}
              </span>
              <span className="text-lg font-bold font-mono text-white">{(activeTelemetry?.phaseC_Voltage ?? 0).toFixed(2)}</span>
              <span className="text-[10px] text-zinc-500 block font-mono">kV</span>
            </div>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">
                {lang === 'ar' ? 'متوسط الجهد' : 'Avg Line V'}
              </span>
              <span className="font-bold font-mono text-indigo-300 text-sm">{(activeTelemetry?.gridVoltage ?? 0).toFixed(1)} kV</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">
                {lang === 'ar' ? 'عدم الاتزان' : 'Unbalance'}
              </span>
              <span className="font-bold font-mono text-amber-300 text-sm">{(activeTelemetry?.voltageUnbalance ?? 0).toFixed(2)} %</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">
                {lang === 'ar' ? 'التردد' : 'Freq'}
              </span>
              <span className="font-bold font-mono text-emerald-300 text-sm">{(activeTelemetry?.frequency ?? 0).toFixed(2)} Hz</span>
            </div>
          </div>
        </div>

        {/* Current & CT Secondary Panel */}
        <div className="lg:col-span-4 bg-[#18181b] border border-zinc-800 rounded-[28px] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-indigo-400">
              <Activity className="w-5 h-5" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-200">
                {t('ct_secondary_a')}
              </h3>
            </div>
            <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-800 font-mono">
              {activeTelemetry?.primaryRatio ?? 600}/{activeTelemetry?.secondaryRatio ?? 5}A
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-center">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-1">
                {lang === 'ar' ? 'تيار ث. A' : 'I_Sec A'}
              </span>
              <span className="text-lg font-bold font-mono text-white">{(activeTelemetry?.ctSecA ?? 0).toFixed(3)}</span>
              <span className="text-[10px] text-zinc-500 block font-mono">A</span>
            </div>
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-center">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                {lang === 'ar' ? 'تيار ث. B' : 'I_Sec B'}
              </span>
              <span className="text-lg font-bold font-mono text-white">{(activeTelemetry?.ctSecB ?? 0).toFixed(3)}</span>
              <span className="text-[10px] text-zinc-500 block font-mono">A</span>
            </div>
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-center">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-1">
                {lang === 'ar' ? 'تيار ث. C' : 'I_Sec C'}
              </span>
              <span className="text-lg font-bold font-mono text-white">{(activeTelemetry?.ctSecC ?? 0).toFixed(3)}</span>
              <span className="text-[10px] text-zinc-500 block font-mono">A</span>
            </div>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-400 font-medium">{lang === 'ar' ? 'التيار الابتدائي' : 'Primary Current'}</span>
              <span className="font-bold font-mono text-emerald-400">{(activeTelemetry?.loadCurrent ?? 0).toFixed(1)} A</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-400">{lang === 'ar' ? 'حمل دائرة القياس (Burden)' : 'Burden Load'}</span>
              <span className="text-indigo-300 font-bold font-mono">{(activeTelemetry?.ctBurdenVA ?? 0).toFixed(1)} VA (42%)</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full w-[42%] shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
            </div>
          </div>
        </div>

        {/* Analog Power Factor Gauge */}
        <div className="lg:col-span-4 bg-[#18181b] border border-zinc-800 rounded-[28px] p-6 shadow-xl flex flex-col justify-between items-center">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-indigo-400 border-b border-zinc-800 pb-3 w-full">
            <Gauge className="w-5 h-5" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-200">
              {t('power_factor')}
            </h3>
          </div>

          {/* SVG Circular Gauge */}
          <div className="relative w-48 h-28 my-3 flex items-center justify-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 200 120">
              {/* Arc background */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#27272a"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Arc active gradient */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#pf-gradient-bento)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray="251"
                strokeDashoffset="30"
              />
              <defs>
                <linearGradient id="pf-gradient-bento" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>

              {/* Ticks */}
              <text x="15" y="115" fill="#f43f5e" fontSize="10" fontFamily="sans-serif" fontWeight="bold">0.5</text>
              <text x="95" y="15" fill="#fbbf24" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">0.85</text>
              <text x="180" y="115" fill="#6366f1" fontSize="10" fontFamily="sans-serif" fontWeight="bold">1.0</text>

              {/* Needle */}
              <g transform={`rotate(${pfAngle}, 100, 100)`}>
                <line x1="100" y1="100" x2="100" y2="30" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" />
                <circle cx="100" cy="100" r="7" fill="#6366f1" />
              </g>
            </svg>
          </div>

          <div className="text-center bg-zinc-950 px-5 py-2 rounded-2xl border border-zinc-800 w-full">
            <span className="text-3xl font-bold text-indigo-400 font-mono tracking-widest">
              {(activeTelemetry?.pf ?? 0.98).toFixed(2)}
            </span>
            <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-wider mt-0.5">
              {activeTelemetry?.isLagging ? (lang === 'ar' ? 'حثي متأخر (Lagging)' : 'Lagging (Inductive)') : (lang === 'ar' ? 'سعوي متقدم (Leading)' : 'Leading (Capacitive)')}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Digital Power Metrics Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#18181b] border border-zinc-800 rounded-[28px] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <span className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em] block mb-2">
            {lang === 'ar' ? 'القدرة الفعالة (P)' : 'Active Power (P)'}
          </span>
          <div className="text-3xl lg:text-4xl font-mono font-bold text-emerald-400 tracking-tight">
            {((activeTelemetry?.activePower ?? 0) / 1000).toFixed(2)}
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">MW</div>
        </div>

        <div className="bg-[#18181b] border border-zinc-800 rounded-[28px] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <span className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em] block mb-2">
            {lang === 'ar' ? 'القدرة غير الفعالة (Q)' : 'Reactive Power (Q)'}
          </span>
          <div className="text-3xl lg:text-4xl font-mono font-bold text-indigo-400 tracking-tight">
            {((activeTelemetry?.reactivePower ?? 0) / 1000).toFixed(2)}
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">MVar</div>
        </div>

        <div className="bg-[#18181b] border border-zinc-800 rounded-[28px] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <span className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em] block mb-2">
            {lang === 'ar' ? 'القدرة الظاهرية (S)' : 'Apparent Power (S)'}
          </span>
          <div className="text-3xl lg:text-4xl font-mono font-bold text-purple-400 tracking-tight">
            {((activeTelemetry?.apparentPower ?? 0) / 1000).toFixed(2)}
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">MVA</div>
        </div>

        <div className="bg-[#18181b] border border-zinc-800 rounded-[28px] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <span className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em] block mb-2">
            {lang === 'ar' ? 'الطاقة التراكمية' : 'Cumulative Energy'}
          </span>
          <div className="text-3xl lg:text-4xl font-mono font-bold text-amber-400 tracking-tight">
            {((activeTelemetry?.fwdEnergy ?? 0) / 1000).toFixed(1)}
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">MWh</div>
        </div>
      </div>

      {/* 4. Thermal Telemetry & OLTC Controls Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Thermal Heatbars */}
        <div className="lg:col-span-6 bg-[#18181b] border border-zinc-800 rounded-[28px] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-amber-400">
              <Thermometer className="w-5 h-5" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-200">
                {lang === 'ar' ? 'القياسات الحرارية للمحول' : 'Thermal Telemetry'}
              </h3>
            </div>
            <span className="text-[10px] text-zinc-400 font-sans uppercase font-bold tracking-wider">IEEE C57.91</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" /> {t('top_oil_temp')}
                </span>
                <span className="font-bold font-mono text-amber-400 text-sm">{(activeTelemetry?.oilTemp ?? 0).toFixed(1)} °C</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, ((activeTelemetry?.oilTemp ?? 0) / 110) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-zinc-300 font-medium">{t('winding_temp')}</span>
                <span className="font-bold font-mono text-rose-400 text-sm">{(activeTelemetry?.windingTemp ?? 0).toFixed(1)} °C</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-rose-500 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, ((activeTelemetry?.windingTemp ?? 0) / 120) * 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <span className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider block mb-0.5">
                  {t('bushing_temp')}
                </span>
                <span className="font-bold font-mono text-zinc-200">{(activeTelemetry?.bushingTemp ?? 0).toFixed(1)} °C</span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <span className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider block mb-0.5">
                  {t('ambient_temp')}
                </span>
                <span className="font-bold font-mono text-zinc-200">{(activeTelemetry?.ambientTemp ?? 0).toFixed(1)} °C</span>
              </div>
            </div>
          </div>

          {/* Fan / Pump Hysteretic Indicators */}
          <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-zinc-400 font-semibold flex items-center gap-2">
              <Wind className="w-4 h-4 text-indigo-400" /> {t('cooling_fans')}
            </span>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${activeTelemetry?.fans?.fan1 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-zinc-900 text-zinc-600'}`}>
                {t('fan_1')}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${activeTelemetry?.fans?.fan2 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-zinc-900 text-zinc-600'}`}>
                {t('fan_2')}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${activeTelemetry?.fans?.pump1 ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-zinc-900 text-zinc-600'}`}>
                {t('pump_1')}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${activeTelemetry?.fans?.pump2 ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-zinc-900 text-zinc-600'}`}>
                {t('pump_2')}
              </span>
            </div>
          </div>
        </div>

        {/* Conservator Oil & OLTC 17-Step Controls */}
        <div className="lg:col-span-6 bg-[#18181b] border border-zinc-800 rounded-[28px] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-indigo-400">
              <Layers className="w-5 h-5" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-200">
                {lang === 'ar' ? 'خزان الزيت ومغير الجهد 17 خطوة' : 'Conservator & 17-Step OLTC'}
              </h3>
            </div>
            <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-800 font-mono">
              IEC 60076
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Oil Level Meter 1 */}
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1 text-center">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                {t('oil_level_main')}
              </span>
              <span className="text-xl font-bold font-mono text-indigo-400">{(activeTelemetry?.oilLevel1 ?? 0).toFixed(1)} %</span>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1.5">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${activeTelemetry?.oilLevel1 ?? 0}%` }} />
              </div>
            </div>

            {/* Oil Level Meter 2 */}
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1 text-center">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                {t('oil_level_oltc')}
              </span>
              <span className="text-xl font-bold font-mono text-indigo-400">{(activeTelemetry?.oilLevel2 ?? 0).toFixed(1)} %</span>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1.5">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${activeTelemetry?.oilLevel2 ?? 0}%` }} />
              </div>
            </div>
          </div>

          {/* OLTC Controls */}
          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs text-zinc-400 font-medium block">{t('oltc_stepper')}</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">
                  {lang === 'ar' ? `الخطوة ${activeTelemetry?.tapPosition ?? 9} من 17` : `Tap ${activeTelemetry?.tapPosition ?? 9} / 17`}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono block">{lang === 'ar' ? `عدد العمليات: ${activeTelemetry?.tapOps ?? 0}` : `Operations: ${activeTelemetry?.tapOps ?? 0}`}</span>
              </div>

              {/* AVR Mode Toggle */}
              <button
                onClick={() => setTapMode(activeTr, activeTelemetry?.tapMode === 'AUTO' ? 'MANUAL' : 'AUTO')}
                className={`px-4 py-2 rounded-full font-bold text-xs border transition-all cursor-pointer ${
                  activeTelemetry?.tapMode === 'AUTO'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-amber-950/80 text-amber-300 border-amber-700 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                }`}
              >
                {lang === 'ar' ? `نمط AVR: ${activeTelemetry?.tapMode === 'AUTO' ? t('mode_auto') : t('mode_manual')}` : `AVR Mode: ${activeTelemetry?.tapMode ?? 'AUTO'}`}
              </button>
            </div>

            {/* Step Up / Down Buttons */}
            <div className="flex space-x-3 rtl:space-x-reverse pt-1">
              <button
                onClick={() => changeTap(activeTr, 'UP')}
                disabled={(activeTelemetry?.tapPosition ?? 9) >= 17}
                className="flex-1 py-2.5 bg-zinc-900 border border-zinc-700 hover:bg-indigo-950 hover:border-indigo-500 text-indigo-300 font-bold rounded-full flex items-center justify-center space-x-1.5 rtl:space-x-reverse transition-all disabled:opacity-40 cursor-pointer text-xs"
              >
                <ChevronUp className="w-4 h-4" />
                <span>{lang === 'ar' ? 'رفع الجهد (+1.25%)' : 'Raise Voltage (+1.25%)'}</span>
              </button>
              <button
                onClick={() => changeTap(activeTr, 'DOWN')}
                disabled={(activeTelemetry?.tapPosition ?? 9) <= 1}
                className="flex-1 py-2.5 bg-zinc-900 border border-zinc-700 hover:bg-indigo-950 hover:border-indigo-500 text-indigo-300 font-bold rounded-full flex items-center justify-center space-x-1.5 rtl:space-x-reverse transition-all disabled:opacity-40 cursor-pointer text-xs"
              >
                <ChevronDown className="w-4 h-4" />
                <span>{lang === 'ar' ? 'خفض الجهد (-1.25%)' : 'Lower Voltage (-1.25%)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


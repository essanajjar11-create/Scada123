import React, { useState } from 'react';
import {
  Activity,
  Zap,
  Flame,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Sparkles,
  BarChart3,
  TrendingDown,
  Info,
  Layers,
  AlertTriangle,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { useScada } from '../../context/ScadaContext';
import { HarmonicOrderData, CbemaEvent } from '../../types/scada';
import { EquationCard } from '../common/EquationCard';

export const PowerQualityHarmonicsModule: React.FC = () => {
  const { tr1Telemetry, addAuditLog, t, lang } = useScada();
  const isAr = lang === 'ar';

  const [activeSubTab, setActiveSubTab] = useState<'spectrum' | 'kfactor' | 'cbema_curve'>('spectrum');
  const [filterActive, setFilterActive] = useState<boolean>(false);
  const [nonLinearLoadPct, setNonLinearLoadPct] = useState<number>(35); // 35% non-linear load

  // Compute 1st to 50th harmonic spectrum based on non-linear load and filter
  const getHarmonicSpectrum = (): HarmonicOrderData[] => {
    const orders = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 29, 31, 35, 37, 41, 47, 49];
    const filterFactor = filterActive ? 0.22 : 1.0;
    const mult = (nonLinearLoadPct / 35.0) * filterFactor;
    const baseLoadA = tr1Telemetry?.loadCurrent ?? 122.5;

    return orders.map((h) => {
      if (h === 1) {
        return {
          order: 1,
          frequencyHz: 50,
          voltagePct: 100,
          currentPct: 100,
          vMagKV: 76.21,
          iMagA: baseLoadA,
          ieeeLimitPct: 100,
          isExceeded: false
        };
      }

      // Typical 6-pulse / 12-pulse converter harmonic decay (1/h)
      let vPct = Number(((12.0 / h) * mult * 0.4).toFixed(2));
      let iPct = Number(((35.0 / h) * mult).toFixed(2));

      // 5th and 7th harmonics are dominant in 6-pulse converters
      if (h === 5) {
        vPct = Number((3.2 * mult).toFixed(2));
        iPct = Number((18.5 * mult).toFixed(2));
      } else if (h === 7) {
        vPct = Number((2.4 * mult).toFixed(2));
        iPct = Number((11.2 * mult).toFixed(2));
      } else if (h === 11) {
        vPct = Number((1.6 * mult).toFixed(2));
        iPct = Number((6.8 * mult).toFixed(2));
      } else if (h === 13) {
        vPct = Number((1.2 * mult).toFixed(2));
        iPct = Number((4.5 * mult).toFixed(2));
      }

      const ieeeLimit = h <= 11 ? 3.0 : h <= 17 ? 1.5 : h <= 23 ? 1.15 : 0.75;
      const isExceeded = vPct > ieeeLimit;

      return {
        order: h,
        frequencyHz: h * 50,
        voltagePct: vPct,
        currentPct: iPct,
        vMagKV: Number(((76.21 * vPct) / 100).toFixed(3)),
        iMagA: Number(((baseLoadA * iPct) / 100).toFixed(2)),
        ieeeLimitPct: ieeeLimit,
        isExceeded
      };
    });
  };

  const spectrumData = getHarmonicSpectrum();

  // Compute Total Harmonic Distortion (THD)
  const thdV = Math.sqrt(
    spectrumData.filter((d) => d.order > 1).reduce((sum, d) => sum + Math.pow(d.voltagePct, 2), 0)
  );

  const thdI = Math.sqrt(
    spectrumData.filter((d) => d.order > 1).reduce((sum, d) => sum + Math.pow(d.currentPct, 2), 0)
  );

  // Compute IEEE C57.110 K-Factor: K = sum( I_h(pu)^2 * h^2 ) normalized to total RMS current
  const sumIh2 = 1.0 + Math.pow(thdI / 100.0, 2);
  const sumWeighted =
    1.0 +
    spectrumData
      .filter((d) => d.order > 1)
      .reduce((sum, d) => sum + Math.pow(d.currentPct / 100.0, 2) * Math.pow(d.order, 2), 0);
  const kFactor = Number((sumWeighted / sumIh2).toFixed(2));

  // Transformer Derating Factor: Pec-r = 0.15 for standard 40MVA core
  const pecR = 0.15;
  const ratingMva = tr1Telemetry?.ratingMVA ?? 40.0;
  const deratingFactorPct = Number((Math.sqrt((1 + pecR) / (1 + kFactor * pecR)) * 100).toFixed(1));
  const effectiveMva = Number(((ratingMva * deratingFactorPct) / 100).toFixed(1));

  // CBEMA / ITIC Curve Events
  const cbemaEvents: CbemaEvent[] = [
    { id: 'EV-01', timestamp: '14:12:05', eventType: 'VOLTAGE_SAG', durationMs: 80, magnitudePct: 74, classification: 'ACCEPTABLE', affectedPhase: 'A' },
    { id: 'EV-02', timestamp: '11:05:40', eventType: 'VOLTAGE_SWELL', durationMs: 120, magnitudePct: 118, classification: 'ACCEPTABLE', affectedPhase: 'B' },
    { id: 'EV-03', timestamp: '08:44:12', eventType: 'TRANSIENT', durationMs: 1.5, magnitudePct: 145, classification: 'NO_DAMAGE', affectedPhase: '3-PHASE' },
    { id: 'EV-04', timestamp: 'Yesterday', eventType: 'VOLTAGE_SAG', durationMs: 250, magnitudePct: 58, classification: 'EQUIPMENT_TRIP', affectedPhase: 'C' }
  ];

  return (
    <div className="bg-[#0c0d12] border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                {t('pq_title')}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                IEEE 519-2022 / IEEE C57.110 / IEC 61000-4-30 Class A
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {t('pq_subtitle')}
            </p>
          </div>
        </div>

        {/* Active Harmonic Filter (AHF) Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setFilterActive(!filterActive);
              addAuditLog('SETTINGS', `Active Harmonic Filter (AHF 400A) set to: ${!filterActive ? 'ACTIVE' : 'BYPASSED'}`);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-sans flex items-center gap-2 transition-all cursor-pointer ${
              filterActive
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{filterActive ? t('pq_ahf_active') : t('pq_ahf_enable')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        {/* THD Voltage */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
          <div className="flex justify-between text-zinc-400">
            <span>{t('pq_thd_v_label')}:</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-extrabold ${
                thdV > 5.0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
              }`}
            >
              {thdV.toFixed(2)}%
            </span>
            <span className="text-[10px] text-zinc-500">Limit: 5.0%</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-sans block">
            {thdV <= 5.0 ? t('pq_compliant_ieee') : t('pq_exceeds_ieee')}
          </span>
        </div>

        {/* THD Current */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
          <div className="flex justify-between text-zinc-400">
            <span>{t('pq_thd_i_label')}:</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-extrabold ${
                thdI > 8.0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {thdI.toFixed(2)}%
            </span>
            <span className="text-[10px] text-zinc-500">I_sc/I_L &gt; 50</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-sans block">
            {thdI <= 8.0 ? t('pq_current_clean') : t('pq_current_distorted')}
          </span>
        </div>

        {/* K-Factor */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
          <div className="flex justify-between text-zinc-400">
            <span>{t('pq_kfactor_label')}:</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-extrabold ${
                kFactor > 4.0 ? 'text-rose-400' : 'text-indigo-400'
              }`}
            >
              K-{kFactor.toFixed(1)}
            </span>
            <span className="text-[10px] text-zinc-500">{t('pq_nominal_k')}</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-sans block">
            {t('pq_eddy_desc')}
          </span>
        </div>

        {/* Transformer Dynamic Derating */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
          <div className="flex justify-between text-zinc-400">
            <span>{t('pq_derated_capacity')}:</span>
            <TrendingDown className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{effectiveMva.toFixed(1)} MVA</span>
            <span className="text-[10px] text-zinc-500">({deratingFactorPct}%)</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-sans block">
            {t('pq_from_nameplate')}
          </span>
        </div>
      </div>

      {/* Interactive Controls & Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950/80 p-4 rounded-xl border border-zinc-800">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('spectrum')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'spectrum'
                ? 'bg-amber-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {t('pq_tab_spectrum')}
          </button>
          <button
            onClick={() => setActiveSubTab('kfactor')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'kfactor'
                ? 'bg-amber-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {t('pq_tab_kfactor')}
          </button>
          <button
            onClick={() => setActiveSubTab('cbema_curve')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'cbema_curve'
                ? 'bg-amber-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {t('pq_tab_cbema')}
          </button>
        </div>

        {/* Non-linear load slider */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-zinc-400">{t('pq_nonlinear_load')}:</span>
          <input
            type="range"
            min="5"
            max="80"
            step="5"
            value={nonLinearLoadPct}
            onChange={(e) => setNonLinearLoadPct(Number(e.target.value))}
            className="w-32 accent-amber-500 cursor-pointer"
          />
          <span className="font-bold text-amber-300 w-10">{nonLinearLoadPct}%</span>
        </div>
      </div>

      {/* Sub-Tab 1: Harmonic Spectrum Bar Chart */}
      {activeSubTab === 'spectrum' && (
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                {t('pq_spectrum_chart_title')}
              </h3>
              <p className="text-xs text-zinc-400">
                {t('pq_spectrum_chart_desc')}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1 text-cyan-400 font-bold">
                <span className="w-3 h-3 bg-cyan-500 inline-block rounded-sm"></span> V_h (% Fundamental)
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <span className="w-3 h-3 bg-amber-500 inline-block rounded-sm"></span> I_h (% Fundamental)
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={spectrumData.filter((d) => d.order > 1)}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="order" stroke="#71717a" fontSize={11} fontFamily="monospace" tickFormatter={(v) => `h${v}`} />
                <YAxis stroke="#71717a" fontSize={11} fontFamily="monospace" unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <ReferenceLine y={3.0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'IEEE 519 Limit (3.0%)', fill: '#ef4444', fontSize: 10 }} />
                <Bar dataKey="voltagePct" name="V_h Voltage Distortion (%)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="currentPct" name="I_h Current Distortion (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: K-Factor & Transformer Derating Equation */}
      {activeSubTab === 'kfactor' && (
        <div className="space-y-4">
          <EquationCard
            title={isAr ? 'نموذج معامل التوافقيات K-Factor وخفض قدرة المحول' : 'Transformer Harmonic K-Factor & Derating Model'}
            standard="IEEE C57.110 / ANSI / UL 1561"
            equation={
              <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-amber-300 font-bold">
                <span>K = </span>
                <span className="text-xl">∑</span>
                <div className="inline-flex flex-col items-center px-1">
                  <span>I<sub>h</sub><sup>2</sup> · h<sup>2</sup></span>
                  <span className="border-t border-amber-400/80 pt-0.5">I<sub>1</sub><sup>2</sup></span>
                </div>
                <span className="px-3">|</span>
                <span>MVA<sub>derated</sub> = MVA<sub>rated</sub> × </span>
                <span className="text-xl">√</span>
                <span className="border-t border-amber-400/80 px-1">
                  (1 + P<sub>EC-R</sub>) / (1 + K · P<sub>EC-R</sub>)
                </span>
              </div>
            }
            description={
              isAr
                ? 'تقييم خسائر التيارات الدوامية في الملفات والخسائر الشاردة في جدران الخزان الناتجة عن التيارات التوافقية'
                : 'Evaluates eddy current losses in windings and stray load losses in tank walls caused by harmonic currents'
            }
            variables={[
              { symbol: 'K', label: isAr ? 'معامل التوافقيات المحسوب K' : 'Calculated Harmonic K-Factor', value: kFactor.toFixed(2), unit: '' },
              { symbol: 'P_EC-R', label: isAr ? 'معامل خسائر التيارات الدوامية النسبي' : 'Per-Unit Eddy Current Loss Factor', value: '0.15', unit: 'pu' },
              { symbol: 'MVA_rated', label: isAr ? 'القدرة الاسمية على لوحة المحول' : 'Nameplate Rating', value: ratingMva.toFixed(1), unit: 'MVA' },
              { symbol: 'THD_I', label: isAr ? 'التشوه التوافقي الكلي للتيار' : 'Total Current Distortion', value: thdI.toFixed(1), unit: '%' }
            ]}
            result={{
              label: isAr ? 'القدرة الآمنة المستمرة بعد الخفض' : 'Safe Continuous Capacity (Derated)',
              value: effectiveMva.toFixed(1),
              unit: 'MVA',
              status: kFactor <= 4.0 ? (isAr ? 'آمن للنواة القياسية' : 'SAFE FOR STANDARD CORE') : (isAr ? 'يتطلب محول مصنف K-Rated' : 'REQUIRES K-RATED TRANSFORMER'),
              statusColor: kFactor <= 4.0 ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-rose-950 text-rose-300 border-rose-800'
            }}
          />
        </div>
      )}

      {/* Sub-Tab 3: CBEMA / ITIC Power Quality Curve */}
      {activeSubTab === 'cbema_curve' && (
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                {t('pq_cbema_title')}
              </h3>
              <p className="text-xs text-zinc-400">
                {t('pq_cbema_desc')}
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400">{t('pq_logged_events')}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                  <th className="pb-2.5">{t('pq_th_event_id')}</th>
                  <th className="pb-2.5">{t('pq_th_timestamp')}</th>
                  <th className="pb-2.5">{t('pq_th_type')}</th>
                  <th className="pb-2.5">{t('pq_th_phase')}</th>
                  <th className="pb-2.5">{t('pq_th_duration')}</th>
                  <th className="pb-2.5">{t('pq_th_magnitude')}</th>
                  <th className="pb-2.5">{t('pq_th_classification')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                {cbemaEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-zinc-900/60">
                    <td className="py-2.5 font-bold text-indigo-400">{ev.id}</td>
                    <td className="py-2.5 text-zinc-400">{ev.timestamp}</td>
                    <td className="py-2.5 font-bold text-white">{ev.eventType}</td>
                    <td className="py-2.5 text-zinc-300">{ev.affectedPhase}</td>
                    <td className="py-2.5 text-cyan-300">{ev.durationMs} ms</td>
                    <td className="py-2.5 font-bold text-amber-300">{ev.magnitudePct}%</td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ev.classification === 'ACCEPTABLE'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : ev.classification === 'NO_DAMAGE'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {ev.classification === 'ACCEPTABLE'
                          ? (isAr ? 'مقبول' : 'ACCEPTABLE')
                          : ev.classification === 'NO_DAMAGE'
                          ? (isAr ? 'بدون أضرار' : 'NO_DAMAGE')
                          : (isAr ? 'فصل معدات' : 'EQUIPMENT_TRIP')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

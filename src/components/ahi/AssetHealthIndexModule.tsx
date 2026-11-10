import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Thermometer,
  Zap,
  Droplets,
  Sliders,
  Sparkles,
  Info,
  FileText,
  Download,
  RefreshCw,
  Flame,
  ShieldAlert,
  Wrench,
  Check,
  Radio
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { AssetHealthDetails } from '../../types/scada';
import { realtimeSync } from '../../lib/realtimeSync';

export const AssetHealthIndexModule: React.FC = () => {
  const { tr1Telemetry, tr2Telemetry, dgaData, addAuditLog, t } = useScada();
  const [selectedTr, setSelectedTr] = useState<'TR-1' | 'TR-2'>('TR-1');
  const [activeTab, setActiveTab] = useState<'overview' | 'simulation' | 'matrix' | 'predictive'>('overview');

  // "What-If" Simulation Sandbox state
  const [simEnabled, setSimEnabled] = useState(false);
  const [simHotspot, setSimHotspot] = useState<number>(75);
  const [simC2H2, setSimC2H2] = useState<number>(2.0);
  const [simMoisture, setSimMoisture] = useState<number>(18.0);
  const [simBdv, setSimBdv] = useState<number>(60.0);
  const [simTapOps, setSimTapOps] = useState<number>(22000);

  // Work order modal state
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [workOrderSubmitted, setWorkOrderSubmitted] = useState(false);

  // Compute AHI for TR-1 and TR-2
  const computeAhi = (trId: 'TR-1' | 'TR-2'): AssetHealthDetails => {
    const isTr1 = trId === 'TR-1';
    const telemetry = isTr1 ? tr1Telemetry : tr2Telemetry;

    // Determine values (either live telemetry or simulation override)
    const c2h2Val = simEnabled ? simC2H2 : (isTr1 ? (dgaData?.c2h2 ?? 1.5) : 0.8);
    const ch4Val = isTr1 ? (dgaData?.ch4 ?? 25) : 18;
    const c2h4Val = isTr1 ? (dgaData?.c2h4 ?? 30) : 20;
    const h2Val = isTr1 ? (dgaData?.h2 ?? 40) : 25;

    const hotspotVal = simEnabled ? simHotspot : (telemetry?.windingTemp ?? 72);
    const oilTempVal = telemetry?.oilTemp ?? 62;
    const overTempFault = telemetry?.faults?.overTemp ?? false;

    const moistureVal = simEnabled ? simMoisture : (isTr1 ? (dgaData?.moistureInOilPPM ?? 18) : 12);
    const bdvVal = simEnabled ? simBdv : (isTr1 ? (dgaData?.bdvKV ?? 62) : 68);

    const tapOpsVal = simEnabled ? simTapOps : (telemetry?.tapOps ?? 22000);
    const bushingTempVal = telemetry?.bushingTemp ?? 52;
    const buchholzFault = telemetry?.faults?.buchholz ?? false;

    // 1. DGA Gas Concentration & Duval Ratio score (30% weight)
    let dgaScore = 98;
    if (c2h2Val > 5) dgaScore -= 45; // High acetylene arc
    else if (c2h2Val > 2) dgaScore -= 20;
    if (ch4Val > 120 || c2h4Val > 100) dgaScore -= 25; // Thermal fault
    if (h2Val > 100) dgaScore -= 15;
    dgaScore = Math.max(10, Math.min(100, dgaScore));

    // 2. Thermal Loss of Life & Winding Temp score (25% weight)
    let thermalScore = 100;
    if (hotspotVal > 110) thermalScore -= 50;
    else if (hotspotVal > 90) thermalScore -= 25;
    else if (oilTempVal > 75) thermalScore -= 15;
    if (overTempFault) thermalScore -= 30;
    thermalScore = Math.max(10, Math.min(100, thermalScore));

    // 3. Oil Moisture & BDV score (20% weight)
    let moistureBdvScore = 96;
    if (moistureVal > 30) moistureBdvScore -= 35;
    else if (moistureVal > 20) moistureBdvScore -= 15;
    if (bdvVal < 40) moistureBdvScore -= 30;
    else if (bdvVal < 55) moistureBdvScore -= 10;
    moistureBdvScore = Math.max(10, Math.min(100, moistureBdvScore));

    // 4. Mechanical OLTC Tap Ops, Bushing Temp, Buchholz score (25% weight)
    let mechScore = 95;
    const tapPenalty = Math.min(40, (tapOpsVal / 50000) * 30);
    mechScore -= tapPenalty;
    if (bushingTempVal > 80) mechScore -= 25;
    if (buchholzFault) mechScore -= 35;
    mechScore = Math.max(10, Math.min(100, mechScore));

    // Weighted Composite Score
    const compositeScore = Math.round(
      dgaScore * 0.3 + thermalScore * 0.25 + moistureBdvScore * 0.2 + mechScore * 0.25
    );

    let statusCategory: 'GOOD' | 'MODERATE' | 'POOR';
    let recommendation: string;

    if (compositeScore >= 85) {
      statusCategory = 'GOOD';
      recommendation = `${trId}: Operating nominal. Next scheduled oil DGA sampling in 180 days. All dielectric and thermal parameters within IEEE bounds.`;
    } else if (compositeScore >= 60) {
      statusCategory = 'MODERATE';
      recommendation = `${trId}: Moisture/DGA elevated. Oil degasification/filtering recommended within 45 operating days. Monitor hotspot closely.`;
    } else {
      statusCategory = 'POOR';
      recommendation = `${trId}: CRITICAL DEGRADATION! High fault gases / thermal loss of life. Immediate outage & internal inspection required!`;
    }

    return {
      trId,
      compositeScore,
      dgaScore,
      thermalLossOfLifeScore: thermalScore,
      moistureBdvScore,
      mechanicalOltcScore: Math.round(mechScore),
      statusCategory,
      recommendation
    };
  };

  const tr1Health = computeAhi('TR-1');
  const tr2Health = computeAhi('TR-2');

  // Network sync: publish computed indices and receive peer-station results
  const [peerAhi, setPeerAhi] = useState<{ data: AssetHealthDetails[]; at: number } | null>(null);
  const healthSignature = `${tr1Health.compositeScore}|${tr2Health.compositeScore}`;
  useEffect(() => {
    const payload: AssetHealthDetails[] = [tr1Health, tr2Health];
    realtimeSync.broadcast({ type: 'AHI_UPDATE', ahiData: payload });
    const throttle = setTimeout(() => {
      realtimeSync.broadcast({ type: 'AHI_UPDATE', ahiData: payload });
    }, 500);
    return () => clearTimeout(throttle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthSignature]);
  useEffect(() => {
    const unsubscribe = realtimeSync.subscribe((msg) => {
      if (msg.type === 'AHI_UPDATE' && msg.ahiData) {
        setPeerAhi({ data: msg.ahiData, at: Date.now() });
      }
    });
    return unsubscribe;
  }, []);
  const activeHealth = selectedTr === 'TR-1' ? tr1Health : tr2Health;

  // Gauge SVG Math (Fixed 160x160 viewBox)
  const radius = 64;
  const stroke = 12;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (activeHealth.compositeScore / 100) * circumference;

  let gaugeColor = 'stroke-emerald-500';
  let badgeBg = 'bg-emerald-950 text-emerald-300 border-emerald-800';
  if (activeHealth.compositeScore < 60) {
    gaugeColor = 'stroke-rose-500';
    badgeBg = 'bg-rose-950 text-rose-300 border-rose-800';
  } else if (activeHealth.compositeScore < 85) {
    gaugeColor = 'stroke-amber-500';
    badgeBg = 'bg-amber-950 text-amber-300 border-amber-800';
  }

  // IEEE FAA Calculation for simulation
  const hotspotTemp = simEnabled ? simHotspot : (selectedTr === 'TR-1' ? (tr1Telemetry?.windingTemp ?? 72) : (tr2Telemetry?.windingTemp ?? 72));
  const faa = Math.exp((15000 / 383.15) - (15000 / (hotspotTemp + 273.15)));

  const peerFresh = peerAhi && Date.now() - peerAhi.at < 60000 ? peerAhi : null;
  const handleGenerateWorkOrder = () => {
    addAuditLog('MAINTENANCE', `Generated AHI Work Order for ${selectedTr} (Health Index: ${activeHealth.compositeScore}%)`);
    setWorkOrderSubmitted(true);
    setTimeout(() => {
      setWorkOrderSubmitted(false);
      setShowWorkOrderModal(false);
    }, 2000);
  };

  return (
    <div className="bg-[#0c0d12] border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
      {peerFresh && (
        <div className="px-3 py-1.5 bg-cyan-950/70 border border-cyan-800/60 rounded-lg font-mono text-[10px] text-cyan-300 flex items-center gap-2 w-fit">
          <Radio className="w-3 h-3" aria-hidden="true" />
          Network-synced: {peerFresh.data.length} asset indices received from a peer workstation
        </div>
      )}
      {/* Header & Asset Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-800 text-purple-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">{t('ahi_title')}</h2>
            <p className="text-xs text-zinc-400">
              {t('ahi_subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Tabs */}
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t('ahi_overview')}
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'matrix' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t('ahi_matrix')}
            </button>
            <button
              onClick={() => setActiveTab('simulation')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'simulation' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t('ahi_simulation')}
            </button>
            <button
              onClick={() => setActiveTab('predictive')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'predictive' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              🔮 {t('ahi_predictive') || '48h Forecast'}
            </button>
          </div>

          {/* Asset Selector */}
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setSelectedTr('TR-1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedTr === 'TR-1'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              TR-1 (40MVA)
            </button>
            <button
              onClick={() => setSelectedTr('TR-2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedTr === 'TR-2'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              TR-2 (40MVA)
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Circular Health Index Gauge */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              {selectedTr} {t('ahi_composite_index')}
            </span>

            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg viewBox="0 0 160 160" className="w-full h-full rotate-[-90deg]">
                <circle
                  stroke="currentColor"
                  className="text-zinc-800"
                  fill="transparent"
                  strokeWidth={stroke}
                  r={radius}
                  cx={80}
                  cy={80}
                />
                <circle
                  stroke="currentColor"
                  className={`${gaugeColor} transition-all duration-1000 ease-out`}
                  fill="transparent"
                  strokeWidth={stroke}
                  strokeDasharray={`${circumference} ${circumference}`}
                  style={{ strokeDashoffset }}
                  strokeLinecap="round"
                  r={radius}
                  cx={80}
                  cy={80}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
                  {activeHealth.compositeScore}%
                </span>
                <span className={`mt-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${badgeBg}`}>
                  {activeHealth.statusCategory}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
              {t('ahi_overall_condition')}
            </p>

            <button
              onClick={() => setShowWorkOrderModal(true)}
              className="mt-2 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <Wrench className="w-4 h-4" />
              <span>{t('ahi_generate_work_order')}</span>
            </button>
          </div>

          {/* Middle & Right Column: 4 Sub-criteria Breakdown */}
          <div className="lg:col-span-2 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 space-y-5">
            <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
              <span>{t('ahi_criteria_breakdown')}</span>
              <span className="text-indigo-400">{t('ahi_ieee_standards')}</span>
            </h3>

            <div className="space-y-4">
              {/* 1. DGA Score */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-purple-400" /> {t('ahi_dga_title')}
                  </span>
                  <span className="font-mono font-bold text-purple-300">{activeHealth.dgaScore}%</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${activeHealth.dgaScore}%` }}
                  ></div>
                </div>
              </div>

              {/* 2. Thermal & Loss of Life */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-amber-400" /> {t('ahi_thermal_title')}
                  </span>
                  <span className="font-mono font-bold text-amber-300">{activeHealth.thermalLossOfLifeScore}%</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${activeHealth.thermalLossOfLifeScore}%` }}
                  ></div>
                </div>
              </div>

              {/* 3. Oil Moisture & BDV */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-cyan-400" /> {t('ahi_moisture_title')}
                  </span>
                  <span className="font-mono font-bold text-cyan-300">{activeHealth.moistureBdvScore}%</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${activeHealth.moistureBdvScore}%` }}
                  ></div>
                </div>
              </div>

              {/* 4. OLTC & Bushing */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-emerald-400" /> {t('ahi_oltc_title')}
                  </span>
                  <span className="font-mono font-bold text-emerald-300">{activeHealth.mechanicalOltcScore}%</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${activeHealth.mechanicalOltcScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Diagnostic Recommendation Banner */}
            <div className="mt-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-white block">{t('ahi_diagnostic_callout')}</span>
                <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                  {activeHealth.recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Matrix Tab */}
      {activeTab === 'matrix' && (
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-wide">
              {t('ahi_matrix_title')} • {selectedTr}
            </h3>
            <span className="text-xs text-zinc-400 font-mono">{t('ahi_matrix_criteria')}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase">
                  <th className="pb-3 font-bold">{t('ahi_col_indicator')}</th>
                  <th className="pb-3 font-bold">{t('ahi_col_measured')}</th>
                  <th className="pb-3 font-bold">{t('ahi_col_threshold')}</th>
                  <th className="pb-3 font-bold">{t('ahi_col_weight')}</th>
                  <th className="pb-3 font-bold">{t('ahi_col_status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                <tr>
                  <td className="py-3 font-bold flex items-center gap-2 text-purple-300">
                    <Activity className="w-4 h-4" /> Acetylene (C₂H₂)
                  </td>
                  <td className="py-3 font-extrabold">{dgaData?.c2h2 ?? 1.5} PPM</td>
                  <td className="py-3 text-zinc-400">&lt; 2.0 PPM (Normal)</td>
                  <td className="py-3 text-zinc-400">15% DGA</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {t('ahi_status_good')}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-bold flex items-center gap-2 text-purple-300">
                    <Activity className="w-4 h-4" /> Methane (CH₄) & Ethylene (C₂H₄)
                  </td>
                  <td className="py-3 font-extrabold">{dgaData?.ch4 ?? 25} / {dgaData?.c2h4 ?? 30} PPM</td>
                  <td className="py-3 text-zinc-400">&lt; 120 / 100 PPM</td>
                  <td className="py-3 text-zinc-400">15% DGA</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {t('ahi_status_good')}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-bold flex items-center gap-2 text-amber-300">
                    <Thermometer className="w-4 h-4" /> Winding Hotspot Temp
                  </td>
                  <td className="py-3 font-extrabold">{hotspotTemp.toFixed(1)} °C</td>
                  <td className="py-3 text-zinc-400">&lt; 90.0 °C Continuous</td>
                  <td className="py-3 text-zinc-400">25% Thermal</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      hotspotTemp > 110 ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    }`}>
                      {hotspotTemp > 110 ? t('ahi_status_poor') : t('ahi_status_good')}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-bold flex items-center gap-2 text-cyan-300">
                    <Droplets className="w-4 h-4" /> Oil Breakdown Voltage (BDV)
                  </td>
                  <td className="py-3 font-extrabold">{dgaData?.bdvKV ?? 62} kV</td>
                  <td className="py-3 text-zinc-400">&gt; 55 kV (Min Dielectric)</td>
                  <td className="py-3 text-zinc-400">10% Dielectric</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {t('ahi_status_good')}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-bold flex items-center gap-2 text-cyan-300">
                    <Droplets className="w-4 h-4" /> Moisture Content in Oil
                  </td>
                  <td className="py-3 font-extrabold">{dgaData?.moistureInOilPPM ?? 18} PPM</td>
                  <td className="py-3 text-zinc-400">&lt; 20 PPM (Dry Oil)</td>
                  <td className="py-3 text-zinc-400">10% Moisture</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {t('ahi_status_good')}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-bold flex items-center gap-2 text-emerald-300">
                    <Sliders className="w-4 h-4" /> OLTC Tap Operations Counter
                  </td>
                  <td className="py-3 font-extrabold">{(selectedTr === 'TR-1' ? tr1Telemetry?.tapOps : tr2Telemetry?.tapOps) ?? 22000} Ops</td>
                  <td className="py-3 text-zinc-400">&lt; 50,000 Ops Major Overhaul</td>
                  <td className="py-3 text-zinc-400">15% Mechanical</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {t('ahi_status_good')}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* What-If Sandbox Tab */}
      {activeTab === 'simulation' && (
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> {t('ahi_sandbox_title')}
              </h3>
              <p className="text-xs text-zinc-400">
                {t('ahi_sandbox_desc')}
              </p>
            </div>

            <button
              onClick={() => setSimEnabled(!simEnabled)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                simEnabled
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <span>{simEnabled ? t('ahi_sim_active') : t('ahi_sim_enable')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sliders */}
            <div className="space-y-4 font-mono text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-zinc-300 font-bold">{t('ahi_hotspot_label')}</span>
                  <span className="text-amber-400 font-bold">{simHotspot.toFixed(1)} °C</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="140"
                  step="1"
                  value={simHotspot}
                  onChange={(e) => {
                    setSimHotspot(Number(e.target.value));
                    setSimEnabled(true);
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-zinc-300 font-bold">{t('ahi_c2h2_label')}</span>
                  <span className="text-purple-400 font-bold">{simC2H2.toFixed(1)} PPM</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={simC2H2}
                  onChange={(e) => {
                    setSimC2H2(Number(e.target.value));
                    setSimEnabled(true);
                  }}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-zinc-300 font-bold">{t('ahi_moisture_label')}</span>
                  <span className="text-cyan-400 font-bold">{simMoisture.toFixed(1)} PPM</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={simMoisture}
                  onChange={(e) => {
                    setSimMoisture(Number(e.target.value));
                    setSimEnabled(true);
                  }}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-zinc-300 font-bold">{t('ahi_bdv_label')}</span>
                  <span className="text-emerald-400 font-bold">{simBdv.toFixed(1)} kV</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="1"
                  value={simBdv}
                  onChange={(e) => {
                    setSimBdv(Number(e.target.value));
                    setSimEnabled(true);
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-zinc-300 font-bold">{t('ahi_oltc_ops_label')}</span>
                  <span className="text-indigo-400 font-bold">{simTapOps.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="60000"
                  step="1000"
                  value={simTapOps}
                  onChange={(e) => {
                    setSimTapOps(Number(e.target.value));
                    setSimEnabled(true);
                  }}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <button
                onClick={() => {
                  setSimHotspot(72);
                  setSimC2H2(1.5);
                  setSimMoisture(18);
                  setSimBdv(62);
                  setSimTapOps(22000);
                  setSimEnabled(false);
                }}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> {t('ahi_reset_baseline')}
              </button>
            </div>

            {/* Calculated Simulation Results */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-xl space-y-3 font-mono text-xs">
              <span className="text-zinc-400 uppercase text-[10px] font-bold block">{t('ahi_sim_output')}</span>
              
              <div className="flex justify-between items-baseline">
                <span className="text-zinc-300">{t('ahi_recalc_index')}</span>
                <span className={`text-2xl font-extrabold ${activeHealth.compositeScore < 60 ? 'text-rose-400' : activeHealth.compositeScore < 85 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {activeHealth.compositeScore}%
                </span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-zinc-300">{t('ahi_aging_factor')}</span>
                <span className={`text-sm font-bold ${faa > 2 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {faa.toFixed(3)}x
                </span>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans border-t border-zinc-800 pt-2">
                {faa > 1.0 ? `⚠️ Hotspot causes insulation aging ${faa.toFixed(1)}x faster than reference 110°C normal rate.` : '✅ Insulation aging rate is within normal operating design limits.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 48-Hour AI Predictive Fault & Hotspot Forecasting View */}
      {activeTab === 'predictive' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm uppercase">
                  {t('predictive_ai_title') || '48-Hour AI Transformer Fault & Hotspot Forecasting Engine'}
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                NEURAL ARMA + IEEE C57.91 THERMAL MODEL
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
              <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Hotspot 48h Peak</span>
                <div className="text-xl font-black text-amber-400">84.6 °C</div>
                <div className="text-[10px] text-emerald-400 font-bold">Within Safe Margin (&lt; 110°C)</div>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Paper DP Degree</span>
                <div className="text-xl font-black text-cyan-400">742 / 1000</div>
                <div className="text-[10px] text-zinc-400">Est. Remaining Life: 18.4 Years</div>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Acetylene Rate dC₂H₂/dt</span>
                <div className="text-xl font-black text-emerald-400">+0.02 ppm/month</div>
                <div className="text-[10px] text-zinc-400">No active arcing detected</div>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Breakdown Risk</span>
                <div className="text-xl font-black text-emerald-400">0.08%</div>
                <div className="text-[10px] text-emerald-400 font-bold">LOW RISK CLASSIFICATION</div>
              </div>
            </div>

            {/* 48-Hour Forecast Horizon Table */}
            <div className="space-y-2 font-mono text-xs pt-2">
              <span className="text-zinc-400 font-bold uppercase text-[11px]">48-Hour Sequential Prediction Horizon (6-Hour Intervals)</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-center">
                {[
                  { hour: '+0h (Now)', temp: '72.0°C', load: '68%', risk: 'Nominal', color: 'text-emerald-400 border-zinc-800' },
                  { hour: '+6h', temp: '74.2°C', load: '72%', risk: 'Nominal', color: 'text-emerald-400 border-zinc-800' },
                  { hour: '+12h', temp: '78.5°C', load: '84%', risk: 'Nominal', color: 'text-amber-400 border-zinc-800' },
                  { hour: '+18h (Peak)', temp: '84.6°C', load: '92%', risk: 'Elevated', color: 'text-amber-400 border-amber-800 bg-amber-950/20' },
                  { hour: '+24h', temp: '76.1°C', load: '75%', risk: 'Nominal', color: 'text-emerald-400 border-zinc-800' },
                  { hour: '+30h', temp: '71.4°C', load: '62%', risk: 'Nominal', color: 'text-emerald-400 border-zinc-800' },
                  { hour: '+36h', temp: '79.2°C', load: '86%', risk: 'Nominal', color: 'text-amber-400 border-zinc-800' },
                  { hour: '+48h', temp: '73.0°C', load: '70%', risk: 'Nominal', color: 'text-emerald-400 border-zinc-800' },
                ].map((pt, idx) => (
                  <div key={idx} className={`p-2.5 rounded-xl border bg-zinc-900/60 ${pt.color} space-y-1`}>
                    <div className="text-[10px] text-zinc-400 font-bold">{pt.hour}</div>
                    <div className="text-xs font-black">{pt.temp}</div>
                    <div className="text-[9px] text-zinc-500">{pt.load} Load</div>
                    <div className="text-[9px] font-bold uppercase">{pt.risk}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Work Order Modal */}
      {showWorkOrderModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12131a] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">{t('ahi_wo_modal_title')}</h3>
              </div>
              <button
                onClick={() => setShowWorkOrderModal(false)}
                className="text-zinc-400 hover:text-white text-xs font-mono font-bold"
              >
                {t('ahi_wo_close')}
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-500">Work Order ID:</span>
                <span className="font-bold text-white">WO-AHI-2026-8912</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">{t('ahi_wo_target_asset')}</span>
                <span className="font-bold text-indigo-300">{selectedTr} Main Substation Transformer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">{t('ahi_wo_health_idx')}</span>
                <span className="font-bold text-amber-400">{activeHealth.compositeScore}% ({activeHealth.statusCategory})</span>
              </div>
              <div className="border-t border-zinc-800 pt-2 space-y-1">
                <span className="text-zinc-500 block">{t('ahi_wo_scope')}</span>
                <p className="text-zinc-200 leading-relaxed font-sans text-xs">
                  • Perform online vacuum oil filtering & degasification<br />
                  • Execute DGA Gas Chromatography re-test (IEC 60567)<br />
                  • Inspect OLTC diverter switch contacts and tap mechanism<br />
                  • Check silica gel breather moisture absorption
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowWorkOrderModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                {t('ahi_wo_cancel')}
              </button>
              <button
                onClick={handleGenerateWorkOrder}
                disabled={workOrderSubmitted}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-indigo-600/30"
              >
                {workOrderSubmitted ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{t('ahi_wo_success')}</span>
                  </>
                ) : (
                  <>
                    <Wrench className="w-4 h-4" />
                    <span>{t('ahi_wo_submit')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Zap, AlertOctagon, Info, ShieldCheck, Thermometer, 
  ChevronUp, ChevronDown, Activity, Gauge, Flame, Wind
} from 'lucide-react';
import { SubstationState, SwitchgearItem, TransformerData } from '../../types/substation';
import { EquipmentCard } from './EquipmentCard';
import { EnvironmentControls } from './EnvironmentControls';

interface YardViewProps {
  state: SubstationState;
  onToggleSwitchgear: (id: string) => void;
  onTapChange: (txId: 'T1' | 'T2', direction: 'UP' | 'DOWN') => void;
  gridVoltage: number;
  setGridVoltage: (v: number) => void;
  ambientTemp: number;
  setAmbientTemp: (t: number) => void;
  powerFactor: number;
  setPowerFactor: (pf: number) => void;
  lineLoads: Record<string, { pMW: number; qMVAr: number }>;
  setLineLoads: React.Dispatch<React.SetStateAction<Record<string, { pMW: number; qMVAr: number }>>>;
  onInjectFault: (type: '3PH_FAULT' | 'SF6_LEAK' | 'TX_OVERHEAT') => void;
  onClearFaults: () => void;
  lastInterlockError: string | null;
  onDismissError: () => void;
}

export const YardView: React.FC<YardViewProps> = ({
  state,
  onToggleSwitchgear,
  onTapChange,
  gridVoltage,
  setGridVoltage,
  ambientTemp,
  setAmbientTemp,
  powerFactor,
  setPowerFactor,
  lineLoads,
  setLineLoads,
  onInjectFault,
  onClearFaults,
  lastInterlockError,
  onDismissError,
}) => {
  const [selectedItem, setSelectedItem] = useState<SwitchgearItem | undefined>(undefined);
  const [selectedTx, setSelectedTx] = useState<TransformerData | undefined>(undefined);

  const { switchgears, transformers, measurements } = state;

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto font-sans">
      {/* Interlock Rejection Modal / Banner */}
      {lastInterlockError && (
        <div className="bg-red-950/95 border-2 border-red-500 text-red-100 p-4 rounded-2xl shadow-2xl flex items-start justify-between gap-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-start gap-3">
            <AlertOctagon className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-red-200">
                مخالفة نظام التشابك الميكانيكي والكهربائي (IEC 62271 Interlock Violation)
              </h4>
              <p className="text-xs text-red-100 mt-1 leading-relaxed">
                {lastInterlockError}
              </p>
            </div>
          </div>
          <button
            onClick={onDismissError}
            className="px-4 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-bold shrink-0 transition shadow-lg"
          >
            إقرار وفهم التحذير
          </button>
        </div>
      )}

      {/* Top Environment & Fault Controls */}
      <EnvironmentControls
        gridVoltage={gridVoltage}
        setGridVoltage={setGridVoltage}
        ambientTemp={ambientTemp}
        setAmbientTemp={setAmbientTemp}
        powerFactor={powerFactor}
        setPowerFactor={setPowerFactor}
        lineLoads={lineLoads}
        setLineLoads={setLineLoads}
        faultActive={state.faultActive}
        faultType={state.faultType}
        onInjectFault={onInjectFault}
        onClearFaults={onClearFaults}
      />

      {/* Main Yard Bays Layout */}
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-100">
              حقول المحطة وتجهيزات الفصل والوصل الميدانية (Substation Bays & Switchgears)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-sans">
            تحكم مباشر في القواطع والفواصل مع فحص الإنترلوك اللحظي
          </span>
        </div>

        {/* =========================================================================
            3 TRANSMISSION LINE BAYS (W1', W2, W1'')
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* BAY W1' */}
          <BayColumnCard
            title="حقل خط النقل W1 الأول"
            subtitle="220 kV ACSR Zebra • 25 km"
            voltage={measurements['BAY_W1_1']?.voltageLL_kV || 0}
            current={measurements['BAY_W1_1']?.currentL1_A || 0}
            activeMW={measurements['BAY_W1_1']?.activePowerMW || 0}
            mainBreaker={switchgears['CB1']}
            disconnectors={[switchgears['DS1'], switchgears['DS2']]}
            earthingSwitches={[switchgears['ES1'], switchgears['ES2']]}
            onToggle={onToggleSwitchgear}
            onShowNameplate={setSelectedItem}
          />

          {/* BAY W2 */}
          <BayColumnCard
            title="حقل خط النقل W2"
            subtitle="220 kV ACSR Zebra • 40 km"
            voltage={measurements['BAY_W2']?.voltageLL_kV || 0}
            current={measurements['BAY_W2']?.currentL1_A || 0}
            activeMW={measurements['BAY_W2']?.activePowerMW || 0}
            mainBreaker={switchgears['CB2']}
            disconnectors={[switchgears['DS4'], switchgears['DS5']]}
            earthingSwitches={[switchgears['ES3'], switchgears['ES4']]}
            onToggle={onToggleSwitchgear}
            onShowNameplate={setSelectedItem}
          />

          {/* BAY W1'' */}
          <BayColumnCard
            title="حقل خط النقل W1 الثاني"
            subtitle="220 kV ACSR Zebra • 18 km"
            voltage={measurements['BAY_W1_2']?.voltageLL_kV || 0}
            current={measurements['BAY_W1_2']?.currentL1_A || 0}
            activeMW={measurements['BAY_W1_2']?.activePowerMW || 0}
            mainBreaker={switchgears['CB3']}
            disconnectors={[switchgears['DS3'], switchgears['DS6']]}
            earthingSwitches={[switchgears['ES5'], switchgears['ES6']]}
            onToggle={onToggleSwitchgear}
            onShowNameplate={setSelectedItem}
          />
        </div>

        {/* =========================================================================
            BUS COUPLER BAY (Linking Bus 1 and Bus 2)
           ========================================================================= */}
        <div className="bg-[#141822] border-2 border-[#2f394a] rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-md shadow-cyan-500/50" />
              <div>
                <h3 className="font-bold text-sm text-slate-100">
                  حقل قاطع رابط القضبان (Bus Coupler Bay CB4 • Bus 1 / Bus 2)
                </h3>
                <span className="text-xs text-slate-400">
                  تأمين التغذية التبادلية ونقل الأحمال ومناورات الصيانة بين القضيبين
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 font-mono-numbers">
              <div className="bg-[#0f1218] px-3 py-1 rounded-xl border border-slate-800 text-xs flex items-center gap-2">
                <span className="text-slate-400 font-sans">السريان العابر:</span>
                <span className="font-bold text-cyan-400">
                  {measurements['BAY_COUPLER']?.currentL1_A.toFixed(1)} A ({measurements['BAY_COUPLER']?.activePowerMW.toFixed(1)} MW)
                </span>
                {measurements['BAY_COUPLER']?.flowDirection === 'BUS1_TO_BUS2' && (
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-sans">
                    قضيب 1 ◄ قضيب 2
                  </span>
                )}
                {measurements['BAY_COUPLER']?.flowDirection === 'BUS2_TO_BUS1' && (
                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-sans">
                    قضيب 2 ◄ قضيب 1
                  </span>
                )}
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-bold font-sans ${
                switchgears['CB4']?.state === 'CLOSED'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {switchgears['CB4']?.state === 'CLOSED' ? 'القضيبان مربوطان (COUPLED)' : 'القضيبان مفصولان (ISOLATED)'}
              </span>
            </div>
          </div>

          {/* Coupler Switchgears Horizontal Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SwitchgearCard
              item={switchgears['DS7']}
              onToggle={() => onToggleSwitchgear('DS7')}
              onShowNameplate={() => setSelectedItem(switchgears['DS7'])}
            />
            <BreakerFeaturedCard
              item={switchgears['CB4']}
              onToggle={() => onToggleSwitchgear('CB4')}
              onShowNameplate={() => setSelectedItem(switchgears['CB4'])}
            />
            <SwitchgearCard
              item={switchgears['DS8']}
              onToggle={() => onToggleSwitchgear('DS8')}
              onShowNameplate={() => setSelectedItem(switchgears['DS8'])}
            />
          </div>
        </div>

        {/* =========================================================================
            POWER TRANSFORMERS BAYS T1 & T2 (220/110 kV ZTR)
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Transformer T1 */}
          <TransformerBayPanel
            transformer={transformers.T1}
            cbItem={switchgears['CB5']}
            dsBusItem={switchgears['DS9']}
            dsTxItem={switchgears['DS10']}
            esItem={switchgears['ES9']}
            measurements={measurements['BAY_T1']}
            onToggle={onToggleSwitchgear}
            onTapChange={(dir) => onTapChange('T1', dir)}
            onShowNameplateItem={setSelectedItem}
            onShowNameplateTx={setSelectedTx}
          />

          {/* Transformer T2 */}
          <TransformerBayPanel
            transformer={transformers.T2}
            cbItem={switchgears['CB6']}
            dsBusItem={switchgears['DS11']}
            dsTxItem={switchgears['DS12']}
            esItem={switchgears['ES11']}
            measurements={measurements['BAY_T2']}
            onToggle={onToggleSwitchgear}
            onTapChange={(dir) => onTapChange('T2', dir)}
            onShowNameplateItem={setSelectedItem}
            onShowNameplateTx={setSelectedTx}
          />

        </div>
      </div>

      {/* Equipment Nameplate Technical Modal */}
      {(selectedItem || selectedTx) && (
        <EquipmentCard
          item={selectedItem}
          transformer={selectedTx}
          onClose={() => {
            setSelectedItem(undefined);
            setSelectedTx(undefined);
          }}
        />
      )}
    </div>
  );
};

// =========================================================================
// SUB-COMPONENTS
// =========================================================================

// 1. Column Card for Transmission Line Bays
const BayColumnCard: React.FC<{
  title: string;
  subtitle: string;
  voltage: number;
  current: number;
  activeMW: number;
  mainBreaker: SwitchgearItem;
  disconnectors: SwitchgearItem[];
  earthingSwitches: SwitchgearItem[];
  onToggle: (id: string) => void;
  onShowNameplate: (item: SwitchgearItem) => void;
}> = ({
  title,
  subtitle,
  voltage,
  current,
  activeMW,
  mainBreaker,
  disconnectors,
  earthingSwitches,
  onToggle,
  onShowNameplate,
}) => {
  return (
    <div className="bg-[#161a23] border border-[#2c3444] rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-4">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#283140] pb-2.5 mb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-100">{title}</h3>
            <span className="text-[11px] font-mono text-slate-400 block" dir="ltr">{subtitle}</span>
          </div>
          <span className="bg-red-950/80 text-red-300 border border-red-800 text-xs font-mono font-bold px-2 py-0.5 rounded-lg" dir="ltr">
            {voltage.toFixed(1)} kV
          </span>
        </div>

        {/* Featured Main Circuit Breaker */}
        <div className="mb-3">
          <BreakerFeaturedCard
            item={mainBreaker}
            onToggle={() => onToggle(mainBreaker.id)}
            onShowNameplate={() => onShowNameplate(mainBreaker)}
          />
        </div>

        {/* Disconnectors Section */}
        <div className="space-y-2 mb-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1">
            فواصل العزل (Disconnectors)
          </span>
          {disconnectors.map(ds => (
            <SwitchgearCard
              key={ds.id}
              item={ds}
              onToggle={() => onToggle(ds.id)}
              onShowNameplate={() => onShowNameplate(ds)}
            />
          ))}
        </div>

        {/* Earthing Switches Section */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1">
            سكاكين التأريض (Earthing Switches)
          </span>
          {earthingSwitches.map(es => (
            <SwitchgearCard
              key={es.id}
              item={es}
              onToggle={() => onToggle(es.id)}
              onShowNameplate={() => onShowNameplate(es)}
            />
          ))}
        </div>
      </div>

      {/* Footer Readouts */}
      <div className="pt-3 border-t border-[#262f3e] flex justify-between text-xs font-mono-numbers">
        <span className="text-slate-400 font-sans">
          التيار: <strong className="text-emerald-400 font-mono" dir="ltr">{current.toFixed(1)} A</strong>
        </span>
        <span className="text-slate-400 font-sans">
          الحمل الفعال: <strong className="text-amber-400 font-mono" dir="ltr">{activeMW.toFixed(1)} MW</strong>
        </span>
      </div>
    </div>
  );
};

// 2. Featured Circuit Breaker Card
const BreakerFeaturedCard: React.FC<{
  item: SwitchgearItem;
  onToggle: () => void;
  onShowNameplate: () => void;
}> = ({ item, onToggle, onShowNameplate }) => {
  if (!item) return null;
  const isClosed = item.state === 'CLOSED';

  return (
    <div className={`p-3 rounded-xl border transition-all ${
      isClosed
        ? 'bg-[#1b171c] border-red-900/60 shadow-lg shadow-red-950/20'
        : 'bg-[#131b17] border-emerald-900/60 shadow-lg shadow-emerald-950/20'
    }`}>
      {/* Top row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full shrink-0 ${
            isClosed ? 'bg-red-500 shadow-md shadow-red-500' : 'bg-emerald-500 shadow-md shadow-emerald-500'
          }`} />
          <span className="font-mono font-bold text-sm text-white" dir="ltr">{item.id}</span>
          <span className="text-xs text-slate-300 font-semibold">{item.name}</span>
        </div>
        <button
          onClick={onShowNameplate}
          title="عرض لوحة الصانع الفنية"
          className="text-slate-400 hover:text-amber-400 p-1 hover:bg-slate-800 rounded-lg transition"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* SF6 & Status Specs */}
      <div className="grid grid-cols-2 gap-2 text-[11px] mb-2.5 font-mono-numbers">
        <div className="bg-[#0e1117] p-1.5 rounded-lg border border-slate-800 flex justify-between items-center">
          <span className="text-slate-400 font-sans text-[10px]">ضغط غاز SF6:</span>
          <span className={`font-bold ${item.sf6PressureBar! < 5.0 ? 'text-red-400 animate-pulse' : 'text-cyan-300'}`} dir="ltr">
            {item.sf6PressureBar?.toFixed(2)} bar
          </span>
        </div>
        <div className="bg-[#0e1117] p-1.5 rounded-lg border border-slate-800 flex justify-between items-center">
          <span className="text-slate-400 font-sans text-[10px]">المناورات:</span>
          <span className="text-slate-200 font-bold" dir="ltr">{item.operationsCount} ops</span>
        </div>
      </div>

      {/* Big Action Toggle Button */}
      <button
        onClick={onToggle}
        className={`w-full py-2 px-3 rounded-xl text-xs font-bold font-mono transition flex items-center justify-center gap-2 shadow-md ${
          isClosed
            ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/60'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60'
        }`}
      >
        <span>{isClosed ? '🔴 فتح القاطع (OPEN TRIP)' : '🟢 غلق القاطع (CLOSE)'}</span>
      </button>
    </div>
  );
};

// 3. Compact Switchgear Card (for DS & ES)
const SwitchgearCard: React.FC<{
  item: SwitchgearItem;
  onToggle: () => void;
  onShowNameplate: () => void;
}> = ({ item, onToggle, onShowNameplate }) => {
  if (!item) return null;
  const isClosed = item.state === 'CLOSED';
  const isES = item.type === 'ES';

  return (
    <div className="bg-[#12151c] border border-[#27303f] rounded-xl p-2.5 flex items-center justify-between gap-3 hover:border-slate-600 transition">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          isClosed
            ? (isES ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-red-500 shadow-sm shadow-red-500')
            : (isES ? 'bg-slate-600' : 'bg-emerald-500 shadow-sm shadow-emerald-500')
        }`} />
        
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-amber-400" dir="ltr">{item.id}</span>
            <span className="text-xs text-slate-200 font-medium truncate">{item.name}</span>
          </div>
          <span className={`text-[10px] font-mono font-bold block ${
            isClosed ? (isES ? 'text-emerald-400' : 'text-red-400') : (isES ? 'text-slate-500' : 'text-emerald-400')
          }`}>
            {isClosed ? 'مغلق (CLOSED)' : 'مفتوح (OPEN)'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onShowNameplate}
          title="اللوحة الفنية الصانعة"
          className="text-slate-500 hover:text-amber-400 p-1 hover:bg-slate-800 rounded transition"
        >
          <Info className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggle}
          className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition ${
            isClosed
              ? 'bg-slate-800 hover:bg-red-950 text-red-300 border border-red-900/60'
              : 'bg-slate-800 hover:bg-emerald-950 text-emerald-300 border border-emerald-900/60'
          }`}
        >
          {isClosed ? 'فتح' : 'غلق'}
        </button>
      </div>
    </div>
  );
};

// 4. Detailed Transformer Bay Panel (T1 / T2)
const TransformerBayPanel: React.FC<{
  transformer: TransformerData;
  cbItem: SwitchgearItem;
  dsBusItem: SwitchgearItem;
  dsTxItem: SwitchgearItem;
  esItem: SwitchgearItem;
  measurements?: any;
  onToggle: (id: string) => void;
  onTapChange: (dir: 'UP' | 'DOWN') => void;
  onShowNameplateItem: (item: SwitchgearItem) => void;
  onShowNameplateTx: (tx: TransformerData) => void;
}> = ({
  transformer,
  cbItem,
  dsBusItem,
  dsTxItem,
  esItem,
  measurements,
  onToggle,
  onTapChange,
  onShowNameplateItem,
  onShowNameplateTx,
}) => {
  return (
    <div className="bg-[#161a23] border border-[#2b3342] rounded-2xl p-5 shadow-xl space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#283140] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-100">
              محول القدرة الذاتي {transformer.id} ({transformer.mvaRating} MVA)
            </h3>
            <button
              onClick={() => onShowNameplateTx(transformer)}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-2 py-0.5 rounded font-mono"
            >
              اللوحة الفنية
            </button>
          </div>
          <span className="text-[11px] font-mono text-slate-400 block mt-0.5" dir="ltr">
            230 / 121 / 11 kV • Vector Group: YNa0d11 (IEC 60076)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-1 rounded-xl block">
            مردود: {transformer.efficiencyPercent?.toFixed(2) || '99.8'}%
          </span>
          <span className="text-xs font-mono text-amber-400 font-bold bg-amber-950/80 border border-amber-800/80 px-2.5 py-1 rounded-xl block">
            تحميل: {transformer.loadingPercent}%
          </span>
        </div>
      </div>

      {/* Main Transformer Breaker */}
      <BreakerFeaturedCard
        item={cbItem}
        onToggle={() => onToggle(cbItem.id)}
        onShowNameplate={() => onShowNameplateItem(cbItem)}
      />

      {/* Disconnectors & Earthing in clean 2-column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <SwitchgearCard
          item={dsBusItem}
          onToggle={() => onToggle(dsBusItem.id)}
          onShowNameplate={() => onShowNameplateItem(dsBusItem)}
        />
        <SwitchgearCard
          item={dsTxItem}
          onToggle={() => onToggle(dsTxItem.id)}
          onShowNameplate={() => onShowNameplateItem(dsTxItem)}
        />
        <SwitchgearCard
          item={esItem}
          onToggle={() => onToggle(esItem.id)}
          onShowNameplate={() => onShowNameplateItem(esItem)}
        />
      </div>

      {/* OLTC & Thermal Controls Split */}
      <div className="bg-[#10131a] p-4 rounded-xl border border-[#242b38] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
        
        {/* OLTC Tap Changer Box */}
        <div className="bg-[#151922] p-3 rounded-xl border border-[#2b3342] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 text-[11px]">
              مغير التفريع MR VACUTAP®
            </span>
            <span className="text-[10px] font-mono text-slate-400">19 Steps (±9 × 1.78%)</span>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="bg-[#0c0e14] px-3 py-2 rounded-xl border border-slate-800 text-center flex-1">
              <span className="text-[10px] text-slate-500 block">الوضعية الحالية:</span>
              <span className="font-mono text-base font-bold text-amber-400">
                وضع {transformer.tapPosition} / 19 
                <span className="text-xs text-slate-300 ml-1">
                  ({transformer.tapPosition - 10 >= 0 ? `+${transformer.tapPosition - 10}` : transformer.tapPosition - 10})
                </span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 block" dir="ltr">
                {transformer.mvVoltageKV.toFixed(1)} kV MV ({((transformer.tapPosition - 10) * 1.78 >= 0 ? '+' : '')}{((transformer.tapPosition - 10) * 1.78).toFixed(2)}%)
              </span>
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={() => onTapChange('UP')}
                title="رفع التفريعة Tap Up (+1.78%)"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-amber-600 text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow"
              >
                <ChevronUp className="w-4 h-4 text-amber-400" />
                <span>رفع (+)</span>
              </button>
              <button
                onClick={() => onTapChange('DOWN')}
                title="خفض التفريعة Tap Down (-1.78%)"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-amber-600 text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow"
              >
                <ChevronDown className="w-4 h-4 text-amber-400" />
                <span>خفض (-)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Thermal & ONAF Cooling Status */}
        <div className="bg-[#151922] p-3 rounded-xl border border-[#2b3342] space-y-1.5 font-mono-numbers">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="font-bold text-slate-300 font-sans text-[11px] flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-blue-400" />
              الحرارة والتقادم والتهوية
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-sans font-bold border ${
              transformer.coolingStatus === 'ONAF_STAGE_2' 
                ? 'bg-red-950 text-red-300 border-red-700' 
                : transformer.coolingStatus === 'ONAF_STAGE_1'
                ? 'bg-amber-950 text-amber-300 border-amber-700'
                : 'bg-cyan-950 text-cyan-300 border-cyan-800'
            }`}>
              {transformer.coolingStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400 font-sans text-[10.5px]">حرارة الزيت (Top Oil):</span>
              <span className={`font-bold font-mono ${transformer.topOilTempC > 75 ? 'text-red-400' : 'text-emerald-400'}`} dir="ltr">
                {transformer.topOilTempC.toFixed(1)} °C
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400 font-sans text-[10.5px]">حرارة الملفات (Winding):</span>
              <span className="text-slate-200 font-bold font-mono" dir="ltr">
                {transformer.windingTempC.toFixed(1)} °C
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400 font-sans text-[10.5px]">النقطة الأسخن (Hot-Spot):</span>
              <span className={`font-bold font-mono ${(transformer.hotSpotTempC || 0) > 98 ? 'text-amber-400' : 'text-cyan-300'}`} dir="ltr">
                {(transformer.hotSpotTempC || transformer.windingTempC).toFixed(1)} °C
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400 font-sans text-[10.5px]">معدل التقادم (V Aging):</span>
              <span className={`font-bold font-mono ${(transformer.agingRate || 1) > 2 ? 'text-red-400 animate-pulse' : 'text-slate-200'}`} dir="ltr">
                {(transformer.agingRate || 0.01).toFixed(2)}x
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5 col-span-2 border-t border-slate-800/80 pt-1">
              <span className="text-slate-400 font-sans text-[10.5px]">المفاقيد الكلية (Fe + Cu + Aux):</span>
              <span className="text-amber-400 font-bold font-mono" dir="ltr">
                {transformer.activeLossKW.toFixed(1)} kW (Fe: {transformer.coreLossKW?.toFixed(0) || 55} kW, Cu: {transformer.copperLossKW?.toFixed(0) || 100} kW)
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

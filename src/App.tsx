import React, { useState, lazy, Suspense, useEffect } from 'react';
import { ScadaProvider, useScada } from './context/ScadaContext';
import { realtimeSync } from './lib/realtimeSync';
import { Header } from './components/common/Header';
import { Navbar, TabId } from './components/common/Navbar';
import { ScadaAuthPortal } from './components/common/ScadaAuthPortal';
import { ToastContainer } from './components/common/ToastContainer';
import { OverviewTab } from './components/overview/OverviewTab';
import { PowerEnergyTab } from './components/power/PowerEnergyTab';
import { RtsStatusTab } from './components/rts/RtsStatusTab';
import { SingleLineDiagramTab } from './components/sld/SingleLineDiagramTab';
import { AlarmSystemTab } from './components/alarms/AlarmSystemTab';
import { TrendChartsTab } from './components/trends/TrendChartsTab';
import { SettingsFaultsTab } from './components/settings/SettingsFaultsTab';
import { AdvancedSuiteTab } from './components/advanced/AdvancedSuiteTab';

import { WamsPmuModule } from './components/pmu/WamsPmuModule';
import { DynamicRatingModule } from './components/dtr/DynamicRatingModule';
import { TccCurvesModule } from './components/tcc/TccCurvesModule';
import { LossEconomicsModule } from './components/economics/LossEconomicsModule';
import { AssetHealthIndexModule } from './components/ahi/AssetHealthIndexModule';
import { BessForecastModule } from './components/bess/BessForecastModule';
import { SwitchingSequenceManagerModule } from './components/switching/SwitchingSequenceManagerModule';
import { PowerQualityHarmonicsModule } from './components/pq/PowerQualityHarmonicsModule';
import { SolarPvMicrogridModule } from './components/solar/SolarPvMicrogridModule';
import { BlackStartRestorationModule } from './components/restoration/BlackStartRestorationModule';
import { LotoPermitModule } from './components/loto/LotoPermitModule';
import { ProtocolEmulatorModule } from './components/protocols/ProtocolEmulatorModule';
import { DistanceProtectionModule } from './components/protection/DistanceProtectionModule';
import { DifferentialProtectionModule } from './components/protection/DifferentialProtectionModule';
import { ShortCircuitAnalyzerModule } from './components/fault/ShortCircuitAnalyzerModule';
import { TransientStabilityModule } from './components/stability/TransientStabilityModule';
import { ComtradeGeneratorModule } from './components/comtrade/ComtradeGeneratorModule';
import { SoeRecorderModal } from './components/soe/SoeRecorderModal';

import { HvdcSmartIntertieModule } from './components/hvdc/HvdcSmartIntertieModule';
import { Iec61850SclEditorModule } from './components/scl/Iec61850SclEditorModule';
import { GreenHydrogenMicrogridModule } from './components/hydrogen/GreenHydrogenMicrogridModule';
import { TdrCableFaultLocatorModule } from './components/tdr/TdrCableFaultLocatorModule';
import { Sf6GasWatchdogModule } from './components/sf6/Sf6GasWatchdogModule';
import { BlockchainAuditLedgerModule } from './components/blockchain/BlockchainAuditLedgerModule';
import { TransformerThermalAgingModule } from './components/thermal/TransformerThermalAgingModule';

// Code-split heavy modules with large dependencies (Three.js, Recharts, PPTXGenJS, etc.)
const Substation3dModule = lazy(() =>
  import('./components/threed/Substation3dModule').then((m) => ({ default: m.Substation3dModule }))
);
const RegionalGridTopologyModule = lazy(() =>
  import('./components/regional/RegionalGridTopologyModule').then((m) => ({ default: m.RegionalGridTopologyModule }))
);
const CyberAttackRangeModule = lazy(() =>
  import('./components/cyber/CyberAttackRangeModule').then((m) => ({ default: m.CyberAttackRangeModule }))
);
const OperatorTrainingSimulatorModule = lazy(() =>
  import('./components/ots/OperatorTrainingSimulatorModule').then((m) => ({ default: m.OperatorTrainingSimulatorModule }))
);
const EngineeringReportsModule = lazy(() =>
  import('./components/reports/EngineeringReportsModule').then((m) => ({ default: m.EngineeringReportsModule }))
);

const ModuleFallback: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center min-h-[420px] bg-[#09090b] border border-zinc-800/80 rounded-2xl p-12 space-y-4 shadow-xl">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-indigo-400 font-bold">
        SAS
      </div>
    </div>
    <div className="text-center space-y-1">
      <div className="text-sm font-bold text-white font-mono">{label || 'Loading Digital Twin Engine...'}</div>
      <div className="text-xs text-zinc-500 font-mono">IEC 61850 / SCADA WebAssembly & Graphics Subsystem</div>
    </div>
  </div>
);

const ScadaMainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isWorkspaceInitialized, setIsWorkspaceInitialized] = useState<boolean>(false);
  const { outdoorTheme, isSoeModalOpen, setSoeModalOpen, t } = useScada();

  useEffect(() => {
    realtimeSync.setActiveScreen(activeTab);
    realtimeSync.broadcastPresence(activeTab);
  }, [activeTab]);

  return (
    <div className="relative min-h-screen">
      {/* SOE Microsecond Recorder Modal */}
      <SoeRecorderModal isOpen={isSoeModalOpen} onClose={() => setSoeModalOpen(false)} />

      {/* SCADA Auth Portal Overlay */}
      {!isWorkspaceInitialized && (
        <ScadaAuthPortal onInitialize={() => setIsWorkspaceInitialized(true)} />
      )}

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Main SCADA Workspace - Blurred & Gated until initialized */}
      <div
        className={`min-h-screen transition-all duration-500 ${
          outdoorTheme ? 'bg-amber-50 text-zinc-900' : 'bg-[#09090b] text-[#fafafa]'
        } ${
          !isWorkspaceInitialized
            ? 'filter blur-md pointer-events-none select-none opacity-40'
            : 'filter-none opacity-100 pointer-events-auto'
        }`}
      >
        {/* SCADA Top Navigation & Header */}
        <Header onOpenSearch={() => setIsSearchOpen(true)} />
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
        />

        {/* Main Content Area */}
        <main className="p-4 md:p-6 max-w-[1680px] mx-auto space-y-6">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'sld' && <SingleLineDiagramTab />}
          {activeTab === 'hvdc_intertie' && <HvdcSmartIntertieModule />}
          {activeTab === 'iec61850_scl' && <Iec61850SclEditorModule />}
          {activeTab === 'green_hydrogen' && <GreenHydrogenMicrogridModule />}
          {activeTab === 'tdr_fault_locator' && <TdrCableFaultLocatorModule />}
          {activeTab === 'sf6_watchdog' && <Sf6GasWatchdogModule />}
          {activeTab === 'blockchain_ledger' && <BlockchainAuditLedgerModule />}
          {activeTab === 'transformer_thermal' && <TransformerThermalAgingModule />}
          {activeTab === 'solar_pv' && <SolarPvMicrogridModule />}
          {activeTab === 'protocols' && <ProtocolEmulatorModule />}
          {activeTab === 'distance_21' && <DistanceProtectionModule />}
          {activeTab === 'diff_87t' && <DifferentialProtectionModule />}
          {activeTab === 'sc_60909' && <ShortCircuitAnalyzerModule />}
          {activeTab === 'transient_stability' && <TransientStabilityModule />}
          {activeTab === 'comtrade_gen' && <ComtradeGeneratorModule />}
          {activeTab === 'black_start' && <BlackStartRestorationModule />}
          {activeTab === 'loto_ptw' && <LotoPermitModule />}
          {activeTab === 'engineering_reports' && (
            <Suspense fallback={<ModuleFallback label="Generating Engineering Compliance Report..." />}>
              <EngineeringReportsModule />
            </Suspense>
          )}
          {activeTab === 'wams_pmu' && <WamsPmuModule />}
          {activeTab === 'threed_twin' && (
            <Suspense fallback={<ModuleFallback label="Initializing Three.js PBR Substation 3D Twin..." />}>
              <Substation3dModule />
            </Suspense>
          )}
          {activeTab === 'dtr_rating' && <DynamicRatingModule />}
          {activeTab === 'tcc_protection' && <TccCurvesModule />}
          {activeTab === 'ot_cyber_range' && (
            <Suspense fallback={<ModuleFallback label="Booting OT Cyber Attack Range Simulator..." />}>
              <CyberAttackRangeModule />
            </Suspense>
          )}
          {activeTab === 'switching_seq' && <SwitchingSequenceManagerModule />}
          {activeTab === 'pq_harmonics' && <PowerQualityHarmonicsModule />}
          {activeTab === 'regional_grid' && (
            <Suspense fallback={<ModuleFallback label="Solving Regional Grid Newton-Raphson Power Flow..." />}>
              <RegionalGridTopologyModule />
            </Suspense>
          )}
          {activeTab === 'loss_economics' && <LossEconomicsModule />}
          {activeTab === 'ahi_dashboard' && <AssetHealthIndexModule />}
          {activeTab === 'ots_simulator' && (
            <Suspense fallback={<ModuleFallback label="Loading Operator Training Simulator Engine..." />}>
              <OperatorTrainingSimulatorModule />
            </Suspense>
          )}
          {activeTab === 'bess_scheduler' && <BessForecastModule />}
          {activeTab === 'power' && <PowerEnergyTab />}
          {activeTab === 'rts' && <RtsStatusTab />}
          {activeTab === 'alarms' && <AlarmSystemTab />}
          {activeTab === 'trends' && <TrendChartsTab />}
          {activeTab === 'settings' && <SettingsFaultsTab />}
          {activeTab === 'advanced' && <AdvancedSuiteTab />}
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-800/80 py-4 px-6 text-center text-xs text-zinc-500 font-sans flex flex-wrap items-center justify-between gap-2 max-w-[1680px] mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-bold tracking-tight text-zinc-400">{t('substation_rtu')}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-500 text-[11px]">IEC 60076 / IEC 61869 / ISA-18.2 / IEEE C57.91</span>
          </div>
          <div className="text-zinc-400 text-[11px] font-medium">
            {t('architects')} <span className="text-indigo-400 font-bold">Eng. Haedara Deeb</span> & <span className="text-indigo-400 font-bold">Eng. Essa Najjar</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ScadaProvider>
      <ScadaMainContent />
    </ScadaProvider>
  );
}

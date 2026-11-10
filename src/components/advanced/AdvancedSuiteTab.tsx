import React, { useState } from 'react';
import {
  Flame,
  Activity,
  Download,
  Radio,
  FileText,
  Lock,
  Cpu,
  MapPin,
  Camera,
  BatteryCharging,
  Play,
  Sun,
  Sparkles,
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

import { DgaDuvalModule } from './DgaDuvalModule';
import { InsulationAgingModule } from './InsulationAgingModule';
import { ComtradeModule } from './ComtradeModule';
import { Iec61850Module } from './Iec61850Module';
import { ShiftHandoverModule } from './ShiftHandoverModule';
import { NercCipModule } from './NercCipModule';
import { AiDigitalTwinModule } from './AiDigitalTwinModule';
import { GisFaultLocatorModule } from './GisFaultLocatorModule';
import { AcousticThermalModule } from './AcousticThermalModule';
import { BessControlModule } from './BessControlModule';
import { SwitchingMacrosModule } from './SwitchingMacrosModule';
import { OutdoorFieldModule } from './OutdoorFieldModule';
import { MatlabCosimBridgeModule } from './MatlabCosimBridgeModule';

export const AdvancedSuiteTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<number>(1);
  const { t } = useScada();

  const subTabs = [
    { id: 1, labelKey: 'subtab_dga', icon: Flame },
    { id: 2, labelKey: 'subtab_insulation', icon: Activity },
    { id: 3, labelKey: 'subtab_comtrade', icon: Download },
    { id: 4, labelKey: 'subtab_iec61850', icon: Radio },
    { id: 5, labelKey: 'subtab_handover', icon: FileText },
    { id: 6, labelKey: 'subtab_nerc_cip', icon: Lock },
    { id: 7, labelKey: 'subtab_ai_twin', icon: Cpu },
    { id: 8, labelKey: 'subtab_gis_takagi', icon: MapPin },
    { id: 9, labelKey: 'subtab_acoustic_pd', icon: Camera },
    { id: 10, labelKey: 'subtab_bess', icon: BatteryCharging },
    { id: 11, labelKey: 'subtab_macros', icon: Play },
    { id: 12, labelKey: 'subtab_outdoor', icon: Sun },
    { id: 13, labelKey: 'subtab_matlab_bridge', customLabel: 'MATLAB / Simulink Co-Sim', icon: Sparkles },
  ];

  return (
    <div className="space-y-4 font-mono text-slate-100">
      {/* Module Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg flex items-center space-x-2 rtl:space-x-reverse overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
        {subTabs.map((st) => {
          const Icon = st.icon;
          const isActive = activeSubTab === st.id;
          return (
            <button
              key={st.id}
              onClick={() => setActiveSubTab(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white border border-indigo-500 shadow-md shadow-indigo-500/25 scale-[1.02]'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-current" />
              <span>{st.customLabel || t(st.labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* Render Active Subtab Component */}
      {activeSubTab === 1 && <DgaDuvalModule />}
      {activeSubTab === 2 && <InsulationAgingModule />}
      {activeSubTab === 3 && <ComtradeModule />}
      {activeSubTab === 4 && <Iec61850Module />}
      {activeSubTab === 5 && <ShiftHandoverModule />}
      {activeSubTab === 6 && <NercCipModule />}
      {activeSubTab === 7 && <AiDigitalTwinModule />}
      {activeSubTab === 8 && <GisFaultLocatorModule />}
      {activeSubTab === 9 && <AcousticThermalModule />}
      {activeSubTab === 10 && <BessControlModule />}
      {activeSubTab === 11 && <SwitchingMacrosModule />}
      {activeSubTab === 12 && <OutdoorFieldModule />}
      {activeSubTab === 13 && <MatlabCosimBridgeModule />}
    </div>
  );
};

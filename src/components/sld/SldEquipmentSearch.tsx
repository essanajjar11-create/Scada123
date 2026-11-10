import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Zap, Shield, Radio, Check, X, Compass, Cpu, Layers } from 'lucide-react';

export interface EquipmentTarget {
  id: string;
  name: string;
  ansiCode: string;
  bay: string;
  voltage: string;
  x: number; // canvas X coord
  y: number; // canvas Y coord
  type: 'breaker' | 'disconnector' | 'transformer' | 'busbar' | 'feeder' | 'instrument' | 'earthSwitch';
}

export const SUBSTATION_EQUIPMENT_REGISTRY: EquipmentTarget[] = [
  // 132kV Switchyard & Busbars
  { id: 'BUS-A', name: '132kV Busbar Alpha (Main Bus A)', ansiCode: 'BUS', bay: '132kV Yard', voltage: '132.0 kV', x: 490, y: 70, type: 'busbar' },
  { id: 'BUS-B', name: '132kV Busbar Bravo (Reserve Bus B)', ansiCode: 'BUS', bay: '132kV Yard', voltage: '132.0 kV', x: 490, y: 115, type: 'busbar' },
  { id: '52-0', name: '132kV Bus Coupler Circuit Breaker (52-0)', ansiCode: 'ANSI 52', bay: 'Coupler Bay 02', voltage: '132.0 kV', x: 490, y: 92, type: 'breaker' },
  { id: '89-0A', name: 'Coupler Disconnector to Bus A (89-0A)', ansiCode: 'ANSI 89', bay: 'Coupler Bay 02', voltage: '132.0 kV', x: 440, y: 70, type: 'disconnector' },
  { id: '89-0B', name: 'Coupler Disconnector to Bus B (89-0B)', ansiCode: 'ANSI 89', bay: 'Coupler Bay 02', voltage: '132.0 kV', x: 540, y: 115, type: 'disconnector' },

  // TR-1 Bay
  { id: '89-1A', name: 'TR-1 Busbar A Disconnector (89-1A)', ansiCode: 'ANSI 89', bay: 'TR-1 Bay 01', voltage: '132.0 kV', x: 230, y: 70, type: 'disconnector' },
  { id: '89-1B', name: 'TR-1 Busbar B Disconnector (89-1B)', ansiCode: 'ANSI 89', bay: 'TR-1 Bay 01', voltage: '132.0 kV', x: 280, y: 115, type: 'disconnector' },
  { id: '52-1', name: 'TR-1 Primary HV Circuit Breaker (52-1)', ansiCode: 'ANSI 52', bay: 'TR-1 Bay 01', voltage: '132.0 kV', x: 255, y: 175, type: 'breaker' },
  { id: 'CT-1', name: 'TR-1 HV 3-Phase Optical CT (600/5A)', ansiCode: 'CT', bay: 'TR-1 Bay 01', voltage: '132.0 kV', x: 255, y: 205, type: 'instrument' },
  { id: 'TR-1', name: 'Power Transformer TR-1 (50MVA Dyn11)', ansiCode: 'ANSI 87T', bay: 'TR-1 Bay 01', voltage: '132/13.8 kV', x: 255, y: 275, type: 'transformer' },
  { id: '52-2', name: 'TR-1 Incomer MV Circuit Breaker (52-2)', ansiCode: 'ANSI 52', bay: 'TR-1 Bay 01', voltage: '13.8 kV', x: 255, y: 355, type: 'breaker' },
  { id: '89-2', name: 'TR-1 Incomer MV Disconnector (89-2)', ansiCode: 'ANSI 89', bay: 'TR-1 Bay 01', voltage: '13.8 kV', x: 255, y: 385, type: 'disconnector' },

  // TR-2 Bay
  { id: '89-2A', name: 'TR-2 Busbar A Disconnector (89-2A)', ansiCode: 'ANSI 89', bay: 'TR-2 Bay 03', voltage: '132.0 kV', x: 720, y: 70, type: 'disconnector' },
  { id: '89-2B', name: 'TR-2 Busbar B Disconnector (89-2B)', ansiCode: 'ANSI 89', bay: 'TR-2 Bay 03', voltage: '132.0 kV', x: 770, y: 115, type: 'disconnector' },
  { id: '52-4', name: 'TR-2 Primary HV Circuit Breaker (52-4)', ansiCode: 'ANSI 52', bay: 'TR-2 Bay 03', voltage: '132.0 kV', x: 745, y: 175, type: 'breaker' },
  { id: 'CT-2', name: 'TR-2 HV 3-Phase Optical CT (600/5A)', ansiCode: 'CT', bay: 'TR-2 Bay 03', voltage: '132.0 kV', x: 745, y: 205, type: 'instrument' },
  { id: 'TR-2', name: 'Power Transformer TR-2 (50MVA Dyn11)', ansiCode: 'ANSI 87T', bay: 'TR-2 Bay 03', voltage: '132/13.8 kV', x: 745, y: 275, type: 'transformer' },
  { id: '52-5', name: 'TR-2 Incomer MV Circuit Breaker (52-5)', ansiCode: 'ANSI 52', bay: 'TR-2 Bay 03', voltage: '13.8 kV', x: 745, y: 355, type: 'breaker' },
  { id: '89-5', name: 'TR-2 Incomer MV Disconnector (89-5)', ansiCode: 'ANSI 89', bay: 'TR-2 Bay 03', voltage: '13.8 kV', x: 745, y: 385, type: 'disconnector' },

  // 13.8kV Medium Voltage Bus & Sectionalizer
  { id: 'MV-BUS-1', name: '13.8kV MV Busbar Section 1', ansiCode: 'BUS', bay: 'MV Switchgear', voltage: '13.8 kV', x: 300, y: 430, type: 'busbar' },
  { id: 'MV-BUS-2', name: '13.8kV MV Busbar Section 2', ansiCode: 'BUS', bay: 'MV Switchgear', voltage: '13.8 kV', x: 700, y: 430, type: 'busbar' },
  { id: '52-6', name: '13.8kV Bus Sectionalizer Breaker (52-6)', ansiCode: 'ANSI 52', bay: 'MV Switchgear', voltage: '13.8 kV', x: 500, y: 430, type: 'breaker' },
  { id: '84-1', name: 'MV Busbar 1 Earthing Switch (84-1)', ansiCode: 'ANSI 84', bay: 'MV Switchgear', voltage: '13.8 kV', x: 170, y: 430, type: 'earthSwitch' },
  { id: '84-2', name: 'MV Busbar 2 Earthing Switch (84-2)', ansiCode: 'ANSI 84', bay: 'MV Switchgear', voltage: '13.8 kV', x: 830, y: 430, type: 'earthSwitch' },

  // Outgoing Feeders
  { id: '52-7', name: 'Feeder 1: City Metro Grid (12MW) (52-7)', ansiCode: 'ANSI 52', bay: 'Feeder Bay 01', voltage: '13.8 kV', x: 190, y: 500, type: 'feeder' },
  { id: '52-8', name: 'Feeder 2: Industrial Park (18MW) (52-8)', ansiCode: 'ANSI 52', bay: 'Feeder Bay 02', voltage: '13.8 kV', x: 290, y: 500, type: 'feeder' },
  { id: '52-9', name: 'Feeder 3: Financial Center (8MW) (52-9)', ansiCode: 'ANSI 52', bay: 'Feeder Bay 03', voltage: '13.8 kV', x: 670, y: 500, type: 'feeder' },
  { id: '52-B', name: 'Feeder 4: 20MW Solar PV & 40MWh BESS (52-B)', ansiCode: 'ANSI 52', bay: 'BESS Infeed', voltage: '13.8 kV', x: 770, y: 500, type: 'feeder' },
  { id: '52-T', name: 'Feeder 5: Station Aux Transformer (33/0.4kV)', ansiCode: 'ANSI 52', bay: 'Station Aux', voltage: '13.8 kV', x: 860, y: 500, type: 'feeder' },

  // VSC-HVDC ±320kV Intertie Bay (IEC 62501 / CIGRE B4)
  { id: '89-HVDC-A', name: 'HVDC Infeed Bus A Disconnector (89-HVDC-A)', ansiCode: 'ANSI 89', bay: 'HVDC Bay 07', voltage: '132.0 kV', x: 960, y: 70, type: 'disconnector' },
  { id: '89-HVDC-B', name: 'HVDC Infeed Bus B Disconnector (89-HVDC-B)', ansiCode: 'ANSI 89', bay: 'HVDC Bay 07', voltage: '132.0 kV', x: 1010, y: 115, type: 'disconnector' },
  { id: '52-HVDC', name: 'HVDC AC PCC Circuit Breaker (52-HVDC)', ansiCode: 'ANSI 52', bay: 'HVDC Bay 07', voltage: '132.0 kV', x: 985, y: 175, type: 'breaker' },
  { id: 'VSC-MMC', name: 'VSC-MMC Converter Station (200 SM/arm, ±320kV)', ansiCode: 'MMC', bay: 'HVDC Bay 07', voltage: '132kV/±320kV', x: 985, y: 275, type: 'transformer' },
  { id: '52-DC1', name: 'High-Speed DCCB Positive Pole +320kV (52-DC1)', ansiCode: 'DCCB', bay: 'HVDC Bay 07', voltage: '+320.0 kV DC', x: 955, y: 360, type: 'breaker' },
  { id: '52-DC2', name: 'High-Speed DCCB Negative Pole -320kV (52-DC2)', ansiCode: 'DCCB', bay: 'HVDC Bay 07', voltage: '-320.0 kV DC', x: 1015, y: 360, type: 'breaker' },
  { id: '89-DCE1', name: 'Positive Pole DC Earth Switch (89-DCE1)', ansiCode: 'ANSI 89E', bay: 'HVDC Bay 07', voltage: '+320.0 kV DC', x: 935, y: 400, type: 'earthSwitch' },
  { id: '89-DCE2', name: 'Negative Pole DC Earth Switch (89-DCE2)', ansiCode: 'ANSI 89E', bay: 'HVDC Bay 07', voltage: '-320.0 kV DC', x: 1035, y: 400, type: 'earthSwitch' },
];

interface SldEquipmentSearchProps {
  onSelectEquipment: (eq: EquipmentTarget) => void;
  spotlightTarget: EquipmentTarget | null;
  onClearSpotlight: () => void;
}

export const SldEquipmentSearch: React.FC<SldEquipmentSearchProps> = ({
  onSelectEquipment,
  spotlightTarget,
  onClearSpotlight
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Global '/' keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filtered = query.trim() === ''
    ? SUBSTATION_EQUIPMENT_REGISTRY.slice(0, 8)
    : SUBSTATION_EQUIPMENT_REGISTRY.filter((eq) =>
        eq.id.toLowerCase().includes(query.toLowerCase()) ||
        eq.name.toLowerCase().includes(query.toLowerCase()) ||
        eq.bay.toLowerCase().includes(query.toLowerCase()) ||
        eq.ansiCode.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search equipment (Press '/' to focus)..."
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            className="w-full pl-8 pr-8 py-1.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono shadow-inner"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {spotlightTarget && (
          <button
            onClick={onClearSpotlight}
            className="px-2.5 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer animate-pulse"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Spotlight: {spotlightTarget.id} (Clear)</span>
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1.5 w-80 md:w-96 max-h-80 overflow-y-auto bg-zinc-900/95 border border-zinc-700/90 rounded-2xl shadow-2xl z-40 p-2 space-y-1 backdrop-blur-xl font-mono text-xs scrollbar-thin">
            <div className="px-2.5 py-1 text-[10px] text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800 flex justify-between items-center">
              <span>Matching Switchgear & Bays ({filtered.length})</span>
              <span className="text-cyan-400">ESC to Close</span>
            </div>

            {filtered.length === 0 ? (
              <div className="p-3 text-center text-zinc-500 text-xs">No equipment matching query</div>
            ) : (
              filtered.map((eq) => (
                <div
                  key={eq.id}
                  onClick={() => {
                    onSelectEquipment(eq);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="p-2 hover:bg-zinc-800/90 rounded-xl cursor-pointer transition-colors flex items-center justify-between group border border-transparent hover:border-zinc-700"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 bg-cyan-950 border border-cyan-700/60 text-cyan-300 rounded text-[10px] font-bold">
                        {eq.id}
                      </span>
                      <span className="text-zinc-200 font-bold group-hover:text-cyan-300 transition-colors">
                        {eq.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {eq.bay} • <span className="text-amber-400 font-bold">{eq.voltage}</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-[9px] font-bold rounded bg-zinc-800 text-zinc-400 group-hover:bg-cyan-500 group-hover:text-zinc-950 transition-colors">
                    LOCATE
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

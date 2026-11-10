import React, { useState } from 'react';
import { Shield, Activity, Zap, CheckCircle2, Info, X } from 'lucide-react';

interface ZoneDetailModalData {
  zoneCode: string;
  name: string;
  type: string;
  iDiff: string;
  iBias: string;
  status: string;
  trippingTime: string;
  description: string;
}

interface SldProtectionZoneOverlayProps {
  visible: boolean;
}

const SldProtectionZoneOverlayImpl: React.FC<SldProtectionZoneOverlayProps> = ({ visible }) => {
  const [selectedZone, setSelectedZone] = useState<ZoneDetailModalData | null>(null);

  if (!visible) return null;

  return (
    <g id="protection-zones-layer" className="font-mono select-none">
      {/* 1. ANSI 87B 132kV Busbar Differential Zone */}
      <g
        className="cursor-pointer group"
        onClick={() =>
          setSelectedZone({
            zoneCode: 'ANSI 87B',
            name: '132kV Busbar Differential Protection Zone',
            type: 'Low-Impedance Busbar Differential (IEC 60255-187-1)',
            iDiff: '0.04 A',
            iBias: '2.10 A',
            status: 'NORMAL (IN-SERVICE)',
            trippingTime: '12 ms',
            description: 'Monitors Kirchhoff current sum across 132kV Main Bus A & Reserve Bus B CTs. High-speed tripping within 12ms upon internal phase fault.',
          })
        }
      >
        <rect
          x="65"
          y="35"
          width="870"
          height="115"
          rx="10"
          fill="#06b6d4"
          fillOpacity="0.08"
          stroke="#06b6d4"
          strokeWidth="1.8"
          strokeDasharray="6 4"
          className="transition-all group-hover:fill-opacity-15 group-hover:stroke-width-2.5"
        />
        <rect x="75" y="40" width="190" height="16" rx="4" fill="#083344" stroke="#0891b2" strokeWidth="1" />
        <text x="82" y="52" fill="#67e8f9" fontSize="8.5" fontWeight="extrabold">
          🛡️ ANSI 87B BUSBAR DIFF ZONE
        </text>
      </g>

      {/* 2. ANSI 87T TR-1 Transformer Differential Zone */}
      <g
        className="cursor-pointer group"
        onClick={() =>
          setSelectedZone({
            zoneCode: 'ANSI 87T-1',
            name: 'TR-1 40MVA Transformer Differential Zone',
            type: 'Biased Percentage Differential (Dyn11 Compensation)',
            iDiff: '0.02 A',
            iBias: '1.45 A',
            status: 'NORMAL (STABLE)',
            trippingTime: '18 ms',
            description: 'Encloses TR-1 HV 132kV CT-1 and MV 13.8kV Incomer CT. Includes 2nd harmonic inrush restraint (15%) and 5th harmonic overexcitation blocking.',
          })
        }
      >
        <polygon
          points="260,160 380,160 380,395 260,395"
          fill="#8b5cf6"
          fillOpacity="0.10"
          stroke="#8b5cf6"
          strokeWidth="1.8"
          strokeDasharray="6 4"
          className="transition-all group-hover:fill-opacity-18 group-hover:stroke-width-2.5"
        />
        <rect x="265" y="145" width="165" height="16" rx="4" fill="#2e1065" stroke="#7c3aed" strokeWidth="1" />
        <text x="271" y="157" fill="#ddd6fe" fontSize="8.5" fontWeight="extrabold">
          🛡️ ANSI 87T TR-1 DIFF ZONE
        </text>
      </g>

      {/* 3. ANSI 87T TR-2 Transformer Differential Zone */}
      <g
        className="cursor-pointer group"
        onClick={() =>
          setSelectedZone({
            zoneCode: 'ANSI 87T-2',
            name: 'TR-2 40MVA Transformer Differential Zone',
            type: 'Biased Percentage Differential (Dyn11 Compensation)',
            iDiff: '0.03 A',
            iBias: '1.48 A',
            status: 'NORMAL (STABLE)',
            trippingTime: '18 ms',
            description: 'Encloses TR-2 HV 132kV CT-2 and MV 13.8kV Incomer CT. High-speed protection with vector group software phase compensation.',
          })
        }
      >
        <polygon
          points="620,160 740,160 740,395 620,395"
          fill="#8b5cf6"
          fillOpacity="0.10"
          stroke="#8b5cf6"
          strokeWidth="1.8"
          strokeDasharray="6 4"
          className="transition-all group-hover:fill-opacity-18 group-hover:stroke-width-2.5"
        />
        <rect x="625" y="145" width="165" height="16" rx="4" fill="#2e1065" stroke="#7c3aed" strokeWidth="1" />
        <text x="631" y="157" fill="#ddd6fe" fontSize="8.5" fontWeight="extrabold">
          🛡️ ANSI 87T TR-2 DIFF ZONE
        </text>
      </g>

      {/* 4. ANSI 21 Feeder Distance Protection Zone 1 & 2 */}
      <g
        className="cursor-pointer group"
        onClick={() =>
          setSelectedZone({
            zoneCode: 'ANSI 21/21N',
            name: 'Feeder Distance Protection Zone 1 & 2 Reach',
            type: 'Full-Scheme Quad Mho Distance Relay',
            iDiff: 'Z1: 1.24 Ω',
            iBias: 'Z2: 2.15 Ω',
            status: 'ARMED (HEALTHY)',
            trippingTime: 'Z1: 0 ms / Z2: 300 ms',
            description: 'Zone 1 covers 80% line reach instantaneously (0ms). Zone 2 covers 120% line reach with 300ms time delay for remote backup.',
          })
        }
      >
        <rect
          x="160"
          y="470"
          width="730"
          height="80"
          rx="8"
          fill="#3b82f6"
          fillOpacity="0.08"
          stroke="#3b82f6"
          strokeWidth="1.8"
          strokeDasharray="6 4"
          className="transition-all group-hover:fill-opacity-15 group-hover:stroke-width-2.5"
        />
        <rect x="170" y="475" width="230" height="16" rx="4" fill="#1e3a8a" stroke="#2563eb" strokeWidth="1" />
        <text x="176" y="487" fill="#bfdbfe" fontSize="8.5" fontWeight="extrabold">
          🛡️ ANSI 21 DISTANCE ZONE 1 & 2 (80% REACH)
        </text>
      </g>

      {/* Zone Details Modal Portal (DOM Overlay via foreignObject or HTML Modal) */}
      {selectedZone && (
        <foreignObject x="350" y="180" width="500" height="280">
          <div className="bg-[#090d16]/95 border-2 border-indigo-500 p-4 rounded-2xl shadow-2xl text-xs font-sans text-zinc-100 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <div>
                  <span className="font-extrabold text-sm text-white font-mono">{selectedZone.zoneCode}</span>
                  <span className="text-[10px] text-zinc-400 block font-mono">{selectedZone.name}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedZone(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px] mb-3">
              <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-400 text-[10px] block">Relay Algorithm:</span>
                <span className="font-bold text-indigo-300">{selectedZone.type}</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-400 text-[10px] block">Operating Status:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {selectedZone.status}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-400 text-[10px] block">Differential / Reach:</span>
                <span className="font-bold text-cyan-400">{selectedZone.iDiff}</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-400 text-[10px] block">Trip Time Target:</span>
                <span className="font-bold text-amber-400">{selectedZone.trippingTime}</span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-300 bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800">
              <span className="font-bold text-zinc-400 block mb-1">Protection Strategy Overview:</span>
              {selectedZone.description}
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  );
};

export const SldProtectionZoneOverlay = React.memo(SldProtectionZoneOverlayImpl);

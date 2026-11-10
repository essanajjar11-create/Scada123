import React, { useMemo } from 'react';
import { Activity, Radio, Zap, Cpu, Waves } from 'lucide-react';

export interface ProcessBusTelemetry {
  assetId: string;
  name: string;
  bay: string;
  voltageRating: string;
  currentRating: string;
  vRmsA: number;
  vRmsB: number;
  vRmsC: number;
  iRmsA: number;
  iRmsB: number;
  iRmsC: number;
  frequency: number;
  thdPct: number;
  harmonics: number[]; // e.g. [100, 0.4, 1.8, 0.9, 0.5, 0.2]
}

interface SldProcessBusHoverScopeProps {
  telemetry: ProcessBusTelemetry | null;
  position: { x: number; y: number } | null;
  onClose?: () => void;
}

const SldProcessBusHoverScopeImpl: React.FC<SldProcessBusHoverScopeProps> = ({
  telemetry,
  position,
}) => {
  // Generate 3-Phase Sine Wave points for SVG (2 cycles)
  const wavePoints = useMemo(() => {
    const pointsA: string[] = [];
    const pointsB: string[] = [];
    const pointsC: string[] = [];
    const width = 240;
    const height = 48;
    const midY = height / 2;
    const amp = 18;

    for (let x = 0; x <= width; x += 3) {
      const angle = (x / width) * 4 * Math.PI; // 2 cycles
      const yA = midY - amp * Math.sin(angle);
      const yB = midY - amp * Math.sin(angle - (2 * Math.PI) / 3);
      const yC = midY - amp * Math.sin(angle - (4 * Math.PI) / 3);
      pointsA.push(`${x},${yA.toFixed(1)}`);
      pointsB.push(`${x},${yB.toFixed(1)}`);
      pointsC.push(`${x},${yC.toFixed(1)}`);
    }

    return {
      pathA: `M ${pointsA.join(' L ')}`,
      pathB: `M ${pointsB.join(' L ')}`,
      pathC: `M ${pointsC.join(' L ')}`,
    };
  }, []);

  if (!telemetry || !position) return null;

  // Window bounds calculation
  const clampedX = Math.min(window.innerWidth - 320, Math.max(16, position.x + 16));
  const clampedY = Math.min(window.innerHeight - 280, Math.max(16, position.y - 120));

  return (
    <div
      style={{ left: clampedX, top: clampedY }}
      className="fixed z-50 pointer-events-none w-72 bg-zinc-950/95 border border-cyan-500/70 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl font-mono text-xs text-zinc-100 space-y-2.5 shadow-cyan-950/40"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-cyan-300 text-xs">{telemetry.assetId}</span>
              <span className="px-1.5 py-0.2 bg-emerald-950 border border-emerald-500/50 text-emerald-300 rounded text-[9px] font-bold">
                IEC 61850-9-2LE
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 block truncate max-w-[170px]">{telemetry.name}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-zinc-500 block">SV RATE</span>
          <span className="text-[11px] font-bold text-emerald-400">4,000 Hz</span>
        </div>
      </div>

      {/* 3-Phase Instantaneous Waveform Canvas */}
      <div className="bg-zinc-900/90 rounded-xl p-2 border border-zinc-800 space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-zinc-400 font-bold flex items-center gap-1">
            <Waves className="w-3 h-3 text-cyan-400" />
            <span>Process Bus Waveform (2 Cycles)</span>
          </span>
          <div className="flex items-center gap-2 text-[9px]">
            <span className="text-rose-400 font-bold">● A</span>
            <span className="text-amber-400 font-bold">● B</span>
            <span className="text-blue-400 font-bold">● C</span>
          </div>
        </div>

        <svg viewBox="0 0 240 48" className="w-full h-12 overflow-visible">
          {/* Zero grid line */}
          <line x1="0" y1="24" x2="240" y2="24" stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
          <path d={wavePoints.pathA} fill="none" stroke="#f43f5e" strokeWidth="1.5" />
          <path d={wavePoints.pathB} fill="none" stroke="#eab308" strokeWidth="1.5" />
          <path d={wavePoints.pathC} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
        </svg>
      </div>

      {/* 3-Phase RMS Magnitudes & THD */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800 space-y-0.5">
          <span className="text-[9px] text-zinc-400 font-bold uppercase block">Voltage (RMS)</span>
          <div className="text-zinc-200 font-bold">
            <span className="text-rose-400">{telemetry.vRmsA.toFixed(1)}</span> /{' '}
            <span className="text-amber-400">{telemetry.vRmsB.toFixed(1)}</span> /{' '}
            <span className="text-blue-400">{telemetry.vRmsC.toFixed(1)}</span> kV
          </div>
        </div>

        <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800 space-y-0.5">
          <span className="text-[9px] text-zinc-400 font-bold uppercase block">Current (RMS)</span>
          <div className="text-zinc-200 font-bold">
            <span className="text-rose-400">{telemetry.iRmsA.toFixed(0)}</span> /{' '}
            <span className="text-amber-400">{telemetry.iRmsB.toFixed(0)}</span> /{' '}
            <span className="text-blue-400">{telemetry.iRmsC.toFixed(0)}</span> A
          </div>
        </div>
      </div>

      {/* Harmonic Spectrum Bar Graph */}
      <div className="bg-zinc-900/70 p-2 rounded-xl border border-zinc-800/80 space-y-1">
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-zinc-400 font-bold">Harmonic Spectrum (IEEE 519)</span>
          <span className="text-emerald-400 font-bold">THD: {telemetry.thdPct.toFixed(2)}%</span>
        </div>
        <div className="flex items-end gap-1.5 h-6 pt-1">
          {['H1', 'H3', 'H5', 'H7', 'H9', 'H11'].map((h, i) => {
            const val = telemetry.harmonics[i] ?? 1;
            const barH = i === 0 ? 100 : Math.min(100, val * 25);
            return (
              <div key={h} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-t bg-cyan-400"
                  style={{
                    height: `${Math.max(4, barH)}%`,
                    backgroundColor: i === 0 ? '#38bdf8' : barH > 50 ? '#f43f5e' : '#a855f7',
                  }}
                />
                <span className="text-[8px] text-zinc-500">{h}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const SldProcessBusHoverScope = React.memo(SldProcessBusHoverScopeImpl);

import React, { useState, useEffect } from 'react';
import { Compass, CheckCircle2, AlertTriangle, Zap, Sliders, X, Radio } from 'lucide-react';

export interface SldSynchroscopeHudProps {
  busAVoltage: number; // in kV (e.g. 132.0)
  busBVoltage: number; // in kV (e.g. 131.6)
  busAFrequency?: number; // in Hz (e.g. 50.0)
  busBFrequency?: number; // in Hz (e.g. 50.02)
  gridFreq?: number; // fallback in Hz (e.g. 50.0)
  phaseAngleDeltaDeg?: number; // initial phase angle
  onClose: () => void;
  onExecuteSyncClose?: () => void;
  onPermissiveClose?: () => void;
  isBreakerClosed?: boolean;
}

const SldSynchroscopeHudImpl: React.FC<SldSynchroscopeHudProps> = ({
  busAVoltage,
  busBVoltage,
  busAFrequency = 50.0,
  busBFrequency = 50.02,
  gridFreq = 50.0,
  phaseAngleDeltaDeg = 2.4,
  onClose,
  onExecuteSyncClose,
  onPermissiveClose,
  isBreakerClosed = false,
}) => {
  const handleExecute = onExecuteSyncClose || onPermissiveClose;
  const activeFreq = busAFrequency || gridFreq || 50.0;
  const [phaseAngle, setPhaseAngle] = useState(phaseAngleDeltaDeg); // degrees
  const [slipFreq, setSlipFreq] = useState(Math.abs(busAFrequency - busBFrequency) || 0.015); // Hz
  const [simRunning, setSimRunning] = useState(true);

  useEffect(() => {
    if (!simRunning || isBreakerClosed) return;
    const interval = setInterval(() => {
      setPhaseAngle((prev) => {
        const next = (prev + slipFreq * 360 * 0.05) % 360;
        return next > 180 ? next - 360 : next < -180 ? next + 360 : next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [simRunning, slipFreq, isBreakerClosed]);

  const deltaV = Math.abs(busAVoltage - busBVoltage);
  const deltaVPct = ((deltaV / (busAVoltage || 132)) * 100);
  const deltaF = Math.abs(slipFreq);

  // Permissive criteria: angle within +/- 10 deg, deltaV < 5%, deltaF < 0.1 Hz
  const isAnglePermissive = Math.abs(phaseAngle) <= 10.0;
  const isVoltagePermissive = deltaVPct <= 5.0;
  const isFrequencyPermissive = deltaF <= 0.1;
  const isPermissiveActive = isAnglePermissive && isVoltagePermissive && isFrequencyPermissive && !isBreakerClosed;

  // Calculate needle coordinates
  const radius = 60;
  const rad = (phaseAngle - 90) * (Math.PI / 180);
  const needleX = 80 + radius * Math.cos(rad);
  const needleY = 80 + radius * Math.sin(rad);

  return (
    <div className="bg-zinc-950/95 border border-zinc-700/90 rounded-2xl p-4 shadow-2xl backdrop-blur-xl font-mono text-xs w-80 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <div>
            <span className="font-bold text-zinc-100 text-xs block">ANSI 25 Synchroscope</span>
            <span className="text-[10px] text-zinc-400">132kV Bus A ⟷ Bus B Coupler (52-0)</span>
          </div>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Synchroscope Circular Dial */}
      <div className="flex flex-col items-center justify-center relative">
        <svg viewBox="0 0 160 160" className="w-44 h-44">
          {/* Dial Face */}
          <circle cx="80" cy="80" r="70" fill="#09090b" stroke="#27272a" strokeWidth="3" />
          <circle cx="80" cy="80" r="62" fill="none" stroke="#18181b" strokeWidth="1" />

          {/* Sync Target Window (+/- 10 deg) at Top */}
          <path
            d="M 68 18 A 62 62 0 0 1 92 18 L 80 80 Z"
            fill="#10b981"
            fillOpacity="0.25"
            stroke="#10b981"
            strokeWidth="1.5"
          />

          {/* Tick marks */}
          {[-90, -60, -30, 0, 30, 60, 90, 120, 150, 180, 210, 240].map((deg) => {
            const r1 = 62;
            const r2 = deg === 0 ? 50 : deg % 90 === 0 ? 54 : 58;
            const a = (deg - 90) * (Math.PI / 180);
            const x1 = 80 + r1 * Math.cos(a);
            const y1 = 80 + r1 * Math.sin(a);
            const x2 = 80 + r2 * Math.cos(a);
            const y2 = 80 + r2 * Math.sin(a);
            return (
              <line
                key={deg}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={deg === 0 ? '#10b981' : '#52525b'}
                strokeWidth={deg === 0 ? '2.5' : '1.5'}
              />
            );
          })}

          {/* Labels: SLOW (Left), FAST (Right), 12 o'clock SYNC */}
          <text x="32" y="75" fill="#eab308" fontSize="8" fontWeight="bold">SLOW ⟲</text>
          <text x="100" y="75" fill="#06b6d4" fontSize="8" fontWeight="bold">⟳ FAST</text>
          <text x="80" y="32" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle">12:00 SYNC</text>

          {/* Rotating Synchroscope Needle */}
          <line
            x1="80"
            y1="80"
            x2={needleX}
            y2={needleY}
            stroke={isPermissiveActive ? '#10b981' : '#f43f5e'}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="80" cy="80" r="5" fill={isPermissiveActive ? '#10b981' : '#f43f5e'} />
        </svg>

        {/* Status Pill Badge */}
        <div className={`mt-1 px-3 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 shadow-md ${
          isPermissiveActive
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 animate-pulse'
            : isBreakerClosed
            ? 'bg-zinc-900 border-zinc-700 text-zinc-400'
            : 'bg-rose-950/90 border-rose-500 text-rose-300'
        }`}>
          {isPermissiveActive ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>PERMISSIVE: READY TO CLOSE</span>
            </>
          ) : isBreakerClosed ? (
            <>
              <Zap className="w-3.5 h-3.5 text-zinc-400" />
              <span>52-0 IN SERVICE (CLOSED)</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>OUT OF SYNC (INTERLOCKED)</span>
            </>
          )}
        </div>
      </div>

      {/* Vector Verification Telemetry */}
      <div className="space-y-1.5 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 text-[11px]">
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">Phase Angle Difference (|Δθ|):</span>
          <span className={`font-bold ${Math.abs(phaseAngle) <= 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {phaseAngle >= 0 ? `+${phaseAngle.toFixed(1)}°` : `${phaseAngle.toFixed(1)}°`} (Lim: ±10°)
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">Voltage Differential (|ΔV|):</span>
          <span className={`font-bold ${deltaVPct <= 5 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {deltaV.toFixed(2)} kV ({deltaVPct.toFixed(1)}% &lt; 5%)
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">Slip Frequency (Δf):</span>
          <span className={`font-bold ${deltaF <= 0.1 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {slipFreq >= 0 ? `+${slipFreq.toFixed(3)} Hz` : `${slipFreq.toFixed(3)} Hz`}
          </span>
        </div>
        <div className="flex justify-between items-center border-t border-zinc-800/80 pt-1 text-[10px]">
          <span className="text-zinc-500">Bus A: {busAVoltage.toFixed(1)} kV</span>
          <span className="text-zinc-500">Bus B: {busBVoltage.toFixed(1)} kV</span>
          <span className="text-zinc-500">Freq: {activeFreq.toFixed(2)} Hz</span>
        </div>
      </div>

      {/* Arm & Execute Permissive Action */}
      {!isBreakerClosed && handleExecute && (
        <button
          onClick={handleExecute}
          disabled={!isPermissiveActive}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-950"
        >
          <Zap className="w-4 h-4" />
          <span>PERMISSIVE CLOSE BUS COUPLER (52-0)</span>
        </button>
      )}
    </div>
  );
};

export const SldSynchroscopeHud = React.memo(SldSynchroscopeHudImpl);

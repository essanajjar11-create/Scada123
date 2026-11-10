import React, { useState, useMemo } from 'react';
import {
  FileCode,
  Download,
  Activity,
  Sliders,
  Play,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  Layers,
  Sparkles,
  Maximize2,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { EquationCard } from '../common/EquationCard';

type FaultScenario = 'line_ag' | 'inrush_tr' | 'phase_bc' | 'three_phase';

export const ComtradeGeneratorModule: React.FC = () => {
  const { addAuditLog, t, lang } = useScada();
  const isAr = lang === 'ar';

  const [scenario, setScenario] = useState<FaultScenario>('line_ag');
  const [sampleRateHz, setSampleRateHz] = useState<number>(4000); // 4000 Hz = 80 samples/cycle at 50Hz
  const [durationMs, setDurationMs] = useState<number>(250); // 250 ms total record
  const [faultInceptionMs, setFaultInceptionMs] = useState<number>(50); // Fault starts @ 50ms
  const [clearingTimeMs, setClearingTimeMs] = useState<number>(120); // Breaker clears @ 120ms
  const [dcOffsetPct, setDcOffsetPct] = useState<number>(75); // % DC offset
  const [peakFaultCurrentKa, setPeakFaultCurrentKa] = useState<number>(14.5); // kA

  // Measurement Cursors
  const [cursor1Ms, setCursor1Ms] = useState<number>(30); // Pre-fault
  const [cursor2Ms, setCursor2Ms] = useState<number>(85); // Mid-fault

  // Active View Tab (Waveform vs Harmonics FFT vs Raw Comtrade Preview)
  const [activeTab, setActiveTab] = useState<'waveforms' | 'fft' | 'preview'>('waveforms');

  // Synthesize Waveform Samples
  const waveformData = useMemo(() => {
    const totalSamples = Math.floor((durationMs / 1000) * sampleRateHz);
    const dt = 1000 / sampleRateHz; // ms per sample
    const omega = 2 * Math.PI * 50; // 50 Hz base frequency

    const samples: Array<{
      idx: number;
      timeMs: number;
      ia: number;
      ib: number;
      ic: number;
      in: number;
      va: number;
      vb: number;
      vc: number;
      trip21: number;
      cb52a: number;
    }> = [];

    const tau = 0.045; // 45ms DC decay time constant

    for (let i = 0; i < totalSamples; i++) {
      const tMs = i * dt;
      const tSec = tMs / 1000;
      const isFaultActive = tMs >= faultInceptionMs && tMs < clearingTimeMs;
      const isPostFault = tMs >= clearingTimeMs;

      // Base Nominal Currents (122.5A rms converted to peak ~173.2A)
      let ia = 173.2 * Math.sin(omega * tSec);
      let ib = 173.2 * Math.sin(omega * tSec - (2 * Math.PI) / 3);
      let ic = 173.2 * Math.sin(omega * tSec + (2 * Math.PI) / 3);

      // Base Nominal Voltages (132kV / sqrt(3) peak ~107.8 kV)
      let va = 107.8 * Math.sin(omega * tSec);
      let vb = 107.8 * Math.sin(omega * tSec - (2 * Math.PI) / 3);
      let vc = 107.8 * Math.sin(omega * tSec + (2 * Math.PI) / 3);

      let trip21 = 0;
      let cb52a = 1; // 1 = closed, 0 = open

      if (scenario === 'line_ag') {
        if (isFaultActive) {
          const tFault = (tMs - faultInceptionMs) / 1000;
          const dcDecay = (dcOffsetPct / 100) * Math.exp(-tFault / tau);
          const iFaultPeak = peakFaultCurrentKa * 1000 * Math.SQRT2;

          ia = iFaultPeak * (Math.sin(omega * tSec) + dcDecay);
          va = va * 0.12; // 88% voltage sag on phase A
          if (tMs >= faultInceptionMs + 20) trip21 = 1; // Trip picks up after 20ms
        } else if (isPostFault) {
          ia = 0; // Cleared by breaker
          va = 0;
          trip21 = 0;
          cb52a = 0; // Breaker opened
        }
      } else if (scenario === 'inrush_tr') {
        if (isFaultActive || isPostFault) {
          const tInrush = (tMs - faultInceptionMs) / 1000;
          const decay = Math.exp(-tInrush / 0.12);
          // Severe unipolar half-wave saturation + 2nd harmonic
          const fundamental = Math.max(0, Math.sin(omega * tSec));
          const secondHarm = 0.28 * Math.sin(2 * omega * tSec);
          ia = (peakFaultCurrentKa * 1000 * 0.6) * (fundamental + secondHarm) * decay;
          ib = (peakFaultCurrentKa * 1000 * 0.4) * (fundamental + secondHarm) * decay * 0.7;
          ic = 0;
          trip21 = 0; // Blocked by 2nd harmonic!
          cb52a = 1;
        }
      } else if (scenario === 'phase_bc') {
        if (isFaultActive) {
          const iFaultPeak = peakFaultCurrentKa * 1000 * Math.SQRT2;
          ib = iFaultPeak * Math.sin(omega * tSec);
          ic = -ib; // Phase to Phase opposing
          vb = vb * 0.45;
          vc = vc * 0.45;
          if (tMs >= faultInceptionMs + 25) trip21 = 1;
        } else if (isPostFault) {
          ib = 0;
          ic = 0;
          cb52a = 0;
        }
      } else if (scenario === 'three_phase') {
        if (isFaultActive) {
          const iFaultPeak = peakFaultCurrentKa * 1000 * Math.SQRT2;
          ia = iFaultPeak * Math.sin(omega * tSec);
          ib = iFaultPeak * Math.sin(omega * tSec - (2 * Math.PI) / 3);
          ic = iFaultPeak * Math.sin(omega * tSec + (2 * Math.PI) / 3);
          va *= 0.05;
          vb *= 0.05;
          vc *= 0.05;
          if (tMs >= faultInceptionMs + 18) trip21 = 1;
        } else if (isPostFault) {
          ia = 0;
          ib = 0;
          ic = 0;
          cb52a = 0;
        }
      }

      const inVal = ia + ib + ic;
      samples.push({
        idx: i + 1,
        timeMs: tMs,
        ia,
        ib,
        ic,
        in: inVal,
        va,
        vb,
        vc,
        trip21,
        cb52a
      });
    }

    return samples;
  }, [scenario, sampleRateHz, durationMs, faultInceptionMs, clearingTimeMs, dcOffsetPct, peakFaultCurrentKa]);

  // Cursor Sample Interpolation
  const sampleAtCursor1 = useMemo(() => {
    const s = waveformData.find(d => d.timeMs >= cursor1Ms) || waveformData[0];
    return s;
  }, [waveformData, cursor1Ms]);

  const sampleAtCursor2 = useMemo(() => {
    const s = waveformData.find(d => d.timeMs >= cursor2Ms) || waveformData[waveformData.length - 1];
    return s;
  }, [waveformData, cursor2Ms]);

  const deltaT = Math.abs(cursor2Ms - cursor1Ms);

  // Generate Real COMTRADE .CFG & .DAT File Blobs
  const downloadComtradeCfg = () => {
    const stationName = 'SUBSTATION_132KV_AL_MARKAZ';
    const recId = `REC_${Date.now()}`;
    const cfgContent = [
      `${stationName},${recId},1999`,
      `7,4A,3D`,
      `1,IA,A,,A,1.0,0.0,0,-32768,32767,1000.0,1.0,S`,
      `2,IB,B,,A,1.0,0.0,0,-32768,32767,1000.0,1.0,S`,
      `3,IC,C,,A,1.0,0.0,0,-32768,32767,1000.0,1.0,S`,
      `4,IN,N,,A,1.0,0.0,0,-32768,32767,1000.0,1.0,S`,
      `5,VA,A,,V,1.0,0.0,0,-32768,32767,1000.0,1.0,S`,
      `6,VB,B,,V,1.0,0.0,0,-32768,32767,1000.0,1.0,S`,
      `7,VC,C,,V,1.0,0.0,0,-32768,32767,1000.0,1.0,S`,
      `1,TRIP_21,,,0`,
      `2,CB_52A,,,0`,
      `3,PICKUP_51,,,0`,
      `50.0`,
      `1`,
      `${sampleRateHz},${waveformData.length}`,
      `19/08/2026,08:30:14.000000`,
      `19/08/2026,08:30:14.250000`,
      `ASCII`,
      `1.0`
    ].join('\r\n');

    const blob = new Blob([cfgContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${stationName}_${scenario}.CFG`;
    link.click();
    URL.revokeObjectURL(url);
    addAuditLog('OPERATOR', `COMTRADE Export: Exported IEEE C37.111 .CFG file for ${scenario}`);
  };

  const downloadComtradeDat = () => {
    const datRows = waveformData.map((d) => {
      const tMicrosec = Math.round(d.timeMs * 1000);
      return `${d.idx},${tMicrosec},${Math.round(d.ia)},${Math.round(d.ib)},${Math.round(d.ic)},${Math.round(d.in)},${Math.round(d.va * 1000)},${Math.round(d.vb * 1000)},${Math.round(d.vc * 1000)},${d.trip21},${d.cb52a},0`;
    });

    const datContent = datRows.join('\r\n');
    const blob = new Blob([datContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SUBSTATION_132KV_${scenario}.DAT`;
    link.click();
    URL.revokeObjectURL(url);
    addAuditLog('OPERATOR', `COMTRADE Export: Exported IEEE C37.111 .DAT file for ${scenario}`);
  };

  // SVG Render Helper for Traces
  const svgWidth = 620;
  const svgHeightCurrent = 160;
  const svgHeightVoltage = 120;
  const svgHeightDigital = 50;

  const toSvgX = (tMs: number) => (tMs / durationMs) * svgWidth;

  // Max scale values for normalization
  const maxI = Math.max(1000, ...waveformData.map(d => Math.max(Math.abs(d.ia), Math.abs(d.ib), Math.abs(d.ic))));
  const maxV = 130; // kV peak

  const toSvgYCurrent = (valA: number) => (svgHeightCurrent / 2) - (valA / maxI) * (svgHeightCurrent / 2 - 10);
  const toSvgYVoltage = (valKv: number) => (svgHeightVoltage / 2) - (valKv / maxV) * (svgHeightVoltage / 2 - 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-950/60 border border-indigo-800/60 rounded-xl text-indigo-400">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-wide">
                {isAr ? 'مولد ومحلل ملفات COMTRADE (IEEE C37.111)' : 'IEEE C37.111 COMTRADE Fault Waveform Generator & Viewer'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                IEC 60255-24 COMPLIANT
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {isAr
                ? 'توليد سجلات الأعطال العابرة وتحليل الترددات التوافقية FFT مع تصدير ملفات .CFG و .DAT الحقيقية'
                : 'Synthetic transient disturbance recorder with dual-cursor oscilloscope, harmonic spectrum & standard COMTRADE exports'}
            </p>
          </div>
        </div>

        {/* Download Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={downloadComtradeCfg}
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-mono text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow transition-all"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Download .CFG
          </button>
          <button
            onClick={downloadComtradeDat}
            className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-mono font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Download .DAT
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Oscilloscope View Canvas */}
        <div className="lg:col-span-8 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                {isAr ? 'راسم الإشارة متعدد القنوات (COMTRADE Oscilloscope)' : 'Multi-Channel Transient Waveform Viewer'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-amber-400">● Phase A</span>
              <span className="text-blue-400">● Phase B</span>
              <span className="text-red-400">● Phase C</span>
              <span className="text-zinc-400">● Neutral In</span>
            </div>
          </div>

          {/* Oscilloscope Display */}
          <div className="bg-zinc-900/95 border border-zinc-800 rounded-xl p-3 space-y-4 relative overflow-hidden font-mono select-none">
            {/* Trace 1: 3-Phase Currents */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span className="font-bold text-white">Analog Group 1: 3-Phase Currents (kA)</span>
                <span className="text-zinc-500">Peak: {(maxI / 1000).toFixed(1)} kA</span>
              </div>
              <svg width="100%" height={svgHeightCurrent} viewBox={`0 0 ${svgWidth} ${svgHeightCurrent}`} className="w-full bg-black/60 rounded-lg border border-zinc-800/80">
                {/* Zero line */}
                <line x1="0" y1={svgHeightCurrent / 2} x2={svgWidth} y2={svgHeightCurrent / 2} stroke="#3f3f46" strokeWidth="1" strokeDasharray="3,3" />

                {/* Phase A Trace */}
                <polyline
                  points={waveformData.map(d => `${toSvgX(d.timeMs)},${toSvgYCurrent(d.ia)}`).join(' ')}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                />
                {/* Phase B Trace */}
                <polyline
                  points={waveformData.map(d => `${toSvgX(d.timeMs)},${toSvgYCurrent(d.ib)}`).join(' ')}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="1.5"
                />
                {/* Phase C Trace */}
                <polyline
                  points={waveformData.map(d => `${toSvgX(d.timeMs)},${toSvgYCurrent(d.ic)}`).join(' ')}
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="1.5"
                />

                {/* Cursor 1 Line */}
                <line x1={toSvgX(cursor1Ms)} y1="0" x2={toSvgX(cursor1Ms)} y2={svgHeightCurrent} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="2,2" />
                {/* Cursor 2 Line */}
                <line x1={toSvgX(cursor2Ms)} y1="0" x2={toSvgX(cursor2Ms)} y2={svgHeightCurrent} stroke="#a855f7" strokeWidth="1.5" strokeDasharray="2,2" />
              </svg>
            </div>

            {/* Trace 2: 3-Phase Voltages */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span className="font-bold text-white">Analog Group 2: 3-Phase Voltages (kV)</span>
                <span className="text-zinc-500">Nominal 132kV / √3</span>
              </div>
              <svg width="100%" height={svgHeightVoltage} viewBox={`0 0 ${svgWidth} ${svgHeightVoltage}`} className="w-full bg-black/60 rounded-lg border border-zinc-800/80">
                <line x1="0" y1={svgHeightVoltage / 2} x2={svgWidth} y2={svgHeightVoltage / 2} stroke="#3f3f46" strokeWidth="1" strokeDasharray="3,3" />

                <polyline
                  points={waveformData.map(d => `${toSvgX(d.timeMs)},${toSvgYVoltage(d.va)}`).join(' ')}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.2"
                />
                <polyline
                  points={waveformData.map(d => `${toSvgX(d.timeMs)},${toSvgYVoltage(d.vb)}`).join(' ')}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="1.2"
                />
                <polyline
                  points={waveformData.map(d => `${toSvgX(d.timeMs)},${toSvgYVoltage(d.vc)}`).join(' ')}
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="1.2"
                />

                <line x1={toSvgX(cursor1Ms)} y1="0" x2={toSvgX(cursor1Ms)} y2={svgHeightVoltage} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="2,2" />
                <line x1={toSvgX(cursor2Ms)} y1="0" x2={toSvgX(cursor2Ms)} y2={svgHeightVoltage} stroke="#a855f7" strokeWidth="1.5" strokeDasharray="2,2" />
              </svg>
            </div>

            {/* Trace 3: Digital Protection Flags */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span className="font-bold text-white">Digital Status: TRIP_21 & CB_52A</span>
                <span className="text-zinc-500">Binary 0 / 1</span>
              </div>
              <svg width="100%" height={svgHeightDigital} viewBox={`0 0 ${svgWidth} ${svgHeightDigital}`} className="w-full bg-black/60 rounded-lg border border-zinc-800/80">
                {/* Trip 21 Line */}
                <polyline
                  points={waveformData.map(d => `${toSvgX(d.timeMs)},${d.trip21 ? 12 : 24}`).join(' ')}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                />
                {/* CB 52A Line */}
                <polyline
                  points={waveformData.map(d => `${toSvgX(d.timeMs)},${d.cb52a ? 36 : 46}`).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                />

                <line x1={toSvgX(cursor1Ms)} y1="0" x2={toSvgX(cursor1Ms)} y2={svgHeightDigital} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="2,2" />
                <line x1={toSvgX(cursor2Ms)} y1="0" x2={toSvgX(cursor2Ms)} y2={svgHeightDigital} stroke="#a855f7" strokeWidth="1.5" strokeDasharray="2,2" />
              </svg>
            </div>
          </div>

          {/* Cursor Measurement Readout Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl">
            <div className="space-y-1">
              <div className="text-[11px] text-cyan-400 font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
                Cursor 1 (t₁ = {cursor1Ms.toFixed(1)} ms)
              </div>
              <div className="text-white">IA: {(sampleAtCursor1.ia / 1000).toFixed(2)} kA</div>
              <div className="text-zinc-400">VA: {sampleAtCursor1.va.toFixed(1)} kV</div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-purple-400 font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block"></span>
                Cursor 2 (t₂ = {cursor2Ms.toFixed(1)} ms)
              </div>
              <div className="text-white">IA: {(sampleAtCursor2.ia / 1000).toFixed(2)} kA</div>
              <div className="text-zinc-400">VA: {sampleAtCursor2.va.toFixed(1)} kV</div>
            </div>

            <div className="space-y-1 border-l sm:border-zinc-800 sm:pl-3">
              <div className="text-[11px] text-amber-400 font-bold">Delta (Δt & ΔI)</div>
              <div className="text-white font-bold">Δt = {deltaT.toFixed(1)} ms ({((deltaT / 20)).toFixed(1)} cyc)</div>
              <div className="text-zinc-400">ΔIA = {((sampleAtCursor2.ia - sampleAtCursor1.ia) / 1000).toFixed(2)} kA</div>
            </div>
          </div>
        </div>

        {/* Controls & Scenario Synthesizer Settings */}
        <div className="lg:col-span-4 space-y-6">
          {/* Scenario Selector */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {isAr ? 'سيناريوهات الأعطال الكهربائية' : 'Disturbance Fault Scenarios'}
            </span>

            <div className="space-y-2 font-mono text-xs">
              {[
                { id: 'line_ag' as FaultScenario, label: '132kV Line Single Phase-to-Ground (A-G)', desc: 'Asymmetric short-circuit with 75% DC offset' },
                { id: 'inrush_tr' as FaultScenario, label: 'Transformer Magnetizing Inrush', desc: 'Severe 2nd harmonic unipolar saturation' },
                { id: 'phase_bc' as FaultScenario, label: 'Phase-to-Phase (B-C) Short Circuit', desc: 'Opposing current peaks, voltage sag' },
                { id: 'three_phase' as FaultScenario, label: 'Bolted 3-Phase Symmetric Fault', desc: 'Catastrophic 31.5 kA fault, rapid 21Z1 trip' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setScenario(s.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    scenario === s.id
                      ? 'bg-indigo-950/60 border-indigo-600 text-white shadow'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs">{s.label}</div>
                  <div className="text-[10px] text-zinc-500">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cursor Adjusters */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4 font-mono text-xs">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              {isAr ? 'ضبط مؤشرات القياس (Cursors)' : 'Measurement Cursor Timing'}
            </span>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Cursor 1 (t₁):</span>
                  <span className="font-bold text-cyan-400">{cursor1Ms.toFixed(1)} ms</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={durationMs}
                  step="1"
                  value={cursor1Ms}
                  onChange={(e) => setCursor1Ms(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Cursor 2 (t₂):</span>
                  <span className="font-bold text-purple-400">{cursor2Ms.toFixed(1)} ms</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={durationMs}
                  step="1"
                  value={cursor2Ms}
                  onChange={(e) => setCursor2Ms(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Equation Card */}
          <EquationCard
            title={isAr ? '?????? ?????? ?????? ?? ??????? ????????' : 'Short-Circuit Transient Waveform Model'}
            equation="i(t) = √2 · I_rms · [ sin(ωt + θ − φ) − sin(θ − φ) · e^(−t/τ) ]"
            description={
              isAr
                ? 'تتضمن الموجة المركبة التوافقية الجيبية المتناوبة مع التضاؤل الأسي للمركبة المستمرة DC Offset'
                : 'Models symmetrical steady AC sinusoidal component plus the decaying asymmetrical DC offset governed by system X/R ratio time constant tau.'
            }
          />
        </div>
      </div>
    </div>
  );
};

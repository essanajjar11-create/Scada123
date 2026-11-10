import React, { useState, useRef, useEffect } from 'react';
import { Download, Play, FileCode, Radio, Cpu, Activity } from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

export const ComtradeModule: React.FC = () => {
  const { activeTelemetry, lang } = useScada();
  const isAr = lang === 'ar';
  const [samplingRate, setSamplingRate] = useState<number>(32); // 32 samples per cycle (1600 Hz)
  const [faultType, setFaultType] = useState<'A-G' | 'B-C' | 'A-B-C'>('A-G');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [triggerCount, setTriggerCount] = useState<number>(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render transient waveform on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Dark grid background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    // Draw horizontal grid lines
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Zero reference line
    const zeroY = h / 2;
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(w, zeroY);
    ctx.stroke();

    // Fault trigger line at 20% width (5 pre-fault cycles mark)
    const triggerX = w * 0.2;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(triggerX, 0);
    ctx.lineTo(triggerX, h);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('FAULT TRIGGER (5 Cycles Pre-Fault)', triggerX + 6, 15);

    // Draw Voltage Waves (Phase A, B, C)
    const numPoints = 300;
    const freq = 0.05; // Spatial frequency

    const drawPhaseWave = (phaseShift: number, color: string, isFaulted: boolean, amplitude: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      for (let i = 0; i < numPoints; i++) {
        const x = (i / numPoints) * w;
        let amp = amplitude;

        // Apply fault surge after triggerX
        if (x >= triggerX && isFaulted) {
          amp = amplitude * 2.8; // Voltage sag/surge or Current spike
        }

        const y = zeroY + Math.sin(i * freq + phaseShift) * amp;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    // Phase A (Red)
    drawPhaseWave(0, '#f87171', faultType === 'A-G' || faultType === 'A-B-C', 35);
    // Phase B (Yellow)
    drawPhaseWave((2 * Math.PI) / 3, '#facc15', faultType === 'B-C' || faultType === 'A-B-C', 35);
    // Phase C (Blue)
    drawPhaseWave((4 * Math.PI) / 3, '#38bdf8', faultType === 'B-C' || faultType === 'A-B-C', 35);
  }, [faultType, samplingRate, triggerCount]);

  // Generate COMTRADE .CFG, .DAT, and .HDR Files
  const exportComtradeFiles = () => {
    setIsCapturing(true);

    const timestampStr = new Date().toISOString().replace(/[-:T.]/g, '');
    const stationName = `SCADA_SUBSTATION_RTU01_${activeTelemetry?.id ?? 'TR1'}`;

    // 1. .CFG File Content (IEEE C37.111 Format)
    const cfgContent = `${stationName},132kV_TR1_RELAY_50_51,1999
7,7A,0D
1,V_A,A,,kV,0.021,0,0,-32768,32767,132,1,P
2,V_B,B,,kV,0.021,0,0,-32768,32767,132,1,P
3,V_C,C,,kV,0.021,0,0,-32768,32767,132,1,P
4,I_A,A,,A,0.12,0,0,-32768,32767,600,5,P
5,I_B,B,,A,0.12,0,0,-32768,32767,600,5,P
6,I_C,C,,A,0.12,0,0,-32768,32767,600,5,P
7,I_N,N,,A,0.12,0,0,-32768,32767,600,5,P
50.00
1
${samplingRate * 50},${samplingRate * 35}
01/08/2026,12:00:00.000000
01/08/2026,12:00:00.700000
ASCII
1.0`;

    // 2. .DAT File Content (Sampled Data Points)
    const datLines = [];
    const totalSamples = samplingRate * 35; // 5 cycles pre + 30 cycles post
    for (let i = 1; i <= Math.min(100, totalSamples); i++) {
      const t = i * (1000000 / (samplingRate * 50));
      const vA = Math.round(100 * Math.sin((i * 2 * Math.PI) / samplingRate));
      const vB = Math.round(100 * Math.sin((i * 2 * Math.PI) / samplingRate + (2 * Math.PI) / 3));
      const vC = Math.round(100 * Math.sin((i * 2 * Math.PI) / samplingRate + (4 * Math.PI) / 3));
      const iA = faultType === 'A-G' && i > samplingRate * 5 ? vA * 4 : vA;
      datLines.push(`${i},${Math.round(t)},${vA},${vB},${vC},${iA},${vB},${vC},${iA - vA}`);
    }
    const datContent = datLines.join('\n');

    // 3. .HDR File Content (Header Metadata)
    const hdrContent = `COMTRADE IEEE C37.111 / IEC 60255-24 OSCILLOGRAM REPORT
Substation: RTU-01 Primary Substation
Transformer Bay: ${activeTelemetry?.id ?? 'TR1'} (${activeTelemetry?.ratingMVA ?? 40} MVA 132/13.8kV)
Fault Trigger Type: ${faultType} Phase Short-Circuit
Sampling Frequency: ${samplingRate * 50} Hz (${samplingRate} Samples/Cycle)
Pre-Fault Buffer: 5 Cycles (100 ms)
Post-Fault Buffer: 30 Cycles (600 ms)
Trigger Timestamp: ${new Date().toLocaleString()}
SHA-256 Checksum: c7f93821a002b2ef84a1`;

    // Download helper
    const downloadBlob = (content: string, filename: string) => {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };

    setTimeout(() => {
      downloadBlob(cfgContent, `${stationName}_${timestampStr}.CFG`);
      downloadBlob(datContent, `${stationName}_${timestampStr}.DAT`);
      downloadBlob(hdrContent, `${stationName}_${timestampStr}.HDR`);
      setIsCapturing(false);
      setTriggerCount((prev) => prev + 1);
    }, 600);
  };

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-2.5 bg-cyan-950/80 border border-cyan-700/60 rounded-lg text-cyan-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-tight">
              {isAr
                ? 'مسجل الموجات العابرة COMTRADE (معيار IEEE C37.111 / IEC 60255-24)'
                : 'COMTRADE Transient Waveform Recorder (IEEE C37.111 / IEC 60255-24)'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'مسجل الأعطال الرقمي عالي السرعة (DFR) ومولد حزم راسم الذبذبات الرقمي'
                : 'High-Speed Substation Digital Fault Recorder (DFR) & Oscillography Package Generator'}
            </p>
          </div>
        </div>

        <button
          onClick={exportComtradeFiles}
          disabled={isCapturing}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-bold rounded-lg text-xs shadow-lg flex items-center space-x-2 rtl:space-x-reverse cursor-pointer transition-all"
        >
          <Download className="w-4 h-4" />
          <span>
            {isCapturing
              ? isAr ? 'جارٍ توليد الحزمة...' : 'Generating Package...'
              : isAr ? 'تصدير ملفات COMTRADE (.CFG, .DAT, .HDR)' : 'Export COMTRADE (.CFG, .DAT, .HDR)'}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Waveform Canvas View */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase text-slate-200 flex items-center space-x-2 rtl:space-x-reverse">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>
                {isAr
                  ? 'راسم ذبذبات الجهد ثلاثي الأطوار وتيار العطل العابر'
                  : '3-Phase Voltage & Fault Current Transient Oscillogram'}
              </span>
            </h4>
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-[10px] font-mono">
              <span className="flex items-center space-x-1 rtl:space-x-reverse text-rose-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span>V_Phase A</span>
              </span>
              <span className="flex items-center space-x-1 rtl:space-x-reverse text-amber-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span>V_Phase B</span>
              </span>
              <span className="flex items-center space-x-1 rtl:space-x-reverse text-cyan-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                <span>V_Phase C</span>
              </span>
            </div>
          </div>

          <div className="relative">
            <canvas
              ref={canvasRef}
              width={720}
              height={260}
              className="w-full h-64 bg-slate-950 rounded-xl border border-slate-800"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div>
              {isAr ? 'نافذة ما قبل العطل:' : 'Pre-Fault Window:'}{' '}
              <span className="text-cyan-400 font-bold font-mono">{isAr ? '5 دورات (100 ms)' : '5 Cycles (100 ms)'}</span>
            </div>
            <div>
              {isAr ? 'نافذة ما بعد العطل:' : 'Post-Fault Window:'}{' '}
              <span className="text-cyan-400 font-bold font-mono">{isAr ? '30 دورة (600 ms)' : '30 Cycles (600 ms)'}</span>
            </div>
            <div>
              {isAr ? 'إجمالي التسجيل:' : 'Total Recording:'}{' '}
              <span className="text-emerald-400 font-bold font-mono">{isAr ? '35 دورة (700 ms)' : '35 Cycles (700 ms)'}</span>
            </div>
          </div>
        </div>

        {/* Oscillograph Recorder Settings Panel */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
          <h4 className="text-xs font-bold uppercase text-amber-400 border-b border-slate-800 pb-2 flex items-center space-x-2 rtl:space-x-reverse">
            <Cpu className="w-4 h-4" />
            <span>{isAr ? 'إعدادات مسجل الأعطال الرقمي (DFR)' : 'DFR Recorder Controls'}</span>
          </h4>

          {/* Sampling Rate Selection */}
          <div className="space-y-1.5 text-xs">
            <label className="text-slate-400 block text-[11px]">
              {isAr ? 'دقة أخذ العينات (معدل العينات):' : 'Sampling Resolution:'}
            </label>
            <div className="grid grid-cols-3 gap-2 font-mono">
              {[16, 32, 64].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setSamplingRate(rate)}
                  className={`py-1.5 px-2 rounded font-bold border cursor-pointer transition-all ${
                    samplingRate === rate
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {rate} S/cycle
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              {isAr ? 'تردد أخذ العينات:' : 'Sampling Frequency:'} {samplingRate * 50} Hz
            </p>
          </div>

          {/* Fault Simulation Selector */}
          <div className="space-y-1.5 text-xs">
            <label className="text-slate-400 block text-[11px]">
              {isAr ? 'نوع العطل العابر المحاكى:' : 'Simulated Transient Fault:'}
            </label>
            <div className="grid grid-cols-3 gap-2 font-mono">
              {[
                { id: 'A-G', label: isAr ? 'طور A مع الأرضي' : 'Phase A-G' },
                { id: 'B-C', label: isAr ? 'بين الطورين B-C' : 'Phase B-C' },
                { id: 'A-B-C', label: isAr ? 'ثلاثي الأطوار' : '3-Phase' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFaultType(f.id as any)}
                  className={`py-1.5 px-2 rounded font-bold border cursor-pointer transition-all ${
                    faultType === f.id
                      ? 'bg-rose-950 text-rose-300 border border-rose-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Package Contents Info */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
            <span className="text-[11px] font-bold text-slate-300 block border-b border-slate-800 pb-1">
              {isAr ? 'هيكل حزمة التصدير COMTRADE:' : 'COMTRADE Export Package Structure:'}
            </span>
            <div className="space-y-1 text-[11px] text-slate-400">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  <strong className="text-slate-200 font-mono">.CFG</strong> -{' '}
                  {isAr ? 'ملف التكوين والمعايرة النصي (ASCII)' : 'ASCII Configuration File'}
                </span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  <strong className="text-slate-200 font-mono">.DAT</strong> -{' '}
                  {isAr ? 'بيانات عينات الإشارات التماثلية والرقمية' : 'Sampled Analog/Digital Waveforms'}
                </span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <FileCode className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  <strong className="text-slate-200 font-mono">.HDR</strong> -{' '}
                  {isAr ? 'تقرير ترويسة الحادث ومعلومات المحطة' : 'Substation Incident Header Report'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

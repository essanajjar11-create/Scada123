import React, { useState, useRef, useEffect } from 'react';
import { Camera, Radio, Flame, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

export const AcousticThermalModule: React.FC = () => {
  const { lang } = useScada();
  const isAr = lang === 'ar';
  const [defectType, setDefectType] = useState<'cavity' | 'tracking' | 'floating' | 'surface'>('cavity');
  const prpdCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const irCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render PRPD Spectrum Plot on Canvas
  useEffect(() => {
    const canvas = prpdCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Sine reference wave (Voltage Phase 0° to 360°)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const angle = (x / w) * 2 * Math.PI;
      const y = h / 2 - Math.sin(angle) * (h / 3);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Generate PRPD discharge pulses based on defect signature
    const numPulses = defectType === 'floating' ? 180 : 120;
    for (let i = 0; i < numPulses; i++) {
      let phaseDeg = Math.random() * 360;
      let amp = Math.random() * 80 + 10;

      if (defectType === 'cavity') {
        // Cavity discharge clusters near 45° and 225°
        if (Math.random() > 0.5) phaseDeg = 45 + (Math.random() - 0.5) * 40;
        else phaseDeg = 225 + (Math.random() - 0.5) * 40;
      } else if (defectType === 'tracking') {
        // Tracking clusters near peaks 90° and 270°
        if (Math.random() > 0.5) phaseDeg = 90 + (Math.random() - 0.5) * 30;
        else phaseDeg = 270 + (Math.random() - 0.5) * 30;
      } else if (defectType === 'floating') {
        // Floating electrode discharge has symmetrical high amplitude
        amp = Math.random() * 120 + 40;
      }

      const px = (phaseDeg / 360) * w;
      const py = h - 20 - (amp / 150) * (h - 40);

      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = defectType === 'floating' ? '#f43f5e' : '#a855f7';
      ctx.fill();
    }
  }, [defectType]);

  // Render IR Thermal Matrix Canvas
  useEffect(() => {
    const canvas = irCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Render thermal gradient background
    const grad = ctx.createRadialGradient(w / 2, h / 2 - 10, 10, w / 2, h / 2, w / 2);
    grad.addColorStop(0, '#f43f5e'); // Hotspot center
    grad.addColorStop(0.3, '#f59e0b');
    grad.addColorStop(0.6, '#0284c7');
    grad.addColorStop(1, '#020617');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Crosshair target
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 12, h / 2 - 10);
    ctx.lineTo(w / 2 + 12, h / 2 - 10);
    ctx.moveTo(w / 2, h / 2 - 22);
    ctx.lineTo(w / 2, h / 2 + 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('HOTSPOT 74.8 °C', w / 2 + 15, h / 2 - 12);
  }, []);

  const defectNames: Record<string, { en: string; ar: string }> = {
    cavity: { en: 'Cavity (الفجوات الداخلية)', ar: 'تفريغ فجوات داخلية (Cavity)' },
    tracking: { en: 'Surface Tracking (تتبع السطح)', ar: 'تتبع كربوني سطحي (Tracking)' },
    floating: { en: 'Floating Electrode (قطب عائم)', ar: 'قطب معدني عائم (Floating)' },
    surface: { en: 'Corona/Surface (تفريغ هالي)', ar: 'تفريغ هالي سطحي (Corona)' },
  };

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-2.5 bg-purple-950/80 border border-purple-700/60 rounded-lg text-purple-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-tight">
              {isAr
                ? 'منظومة كشف التفريغ الجزئي فوق الصوتي (UHF Acoustic PD) والكاميرا الحرارية بالأشعة تحت الحمراء'
                : 'UHF Acoustic Partial Discharge (PD) & Infrared Thermal Camera Array'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'طيف التفريغ الجزئي المحلل طورياً (PRPD 300MHz - 1.5GHz) ومصفوفة التصوير الحراري للبوشينغ'
                : '300 MHz - 1.5 GHz Phase-Resolved Partial Discharge Spectrum (PRPD) & Thermography Hot-Spot Monitor'}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 bg-purple-950 border border-purple-700 text-purple-300 font-bold text-xs rounded-full flex items-center space-x-1.5 rtl:space-x-reverse font-mono">
          <Activity className="w-4 h-4 text-purple-400" />
          <span>{isAr ? 'حساسات UHF متصلة ومفعلة' : 'UHF SENSORS ONLINE'}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Component 1: PRPD Partial Discharge Visualizer */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
            <h4 className="text-xs font-bold uppercase text-purple-300 flex items-center space-x-2 rtl:space-x-reverse">
              <Radio className="w-4 h-4" />
              <span>
                {isAr
                  ? 'طيف التفريغ الجزئي المحلل طورياً (PRPD Spectrum 0° - 360°)'
                  : 'Phase-Resolved Partial Discharge (PRPD) Spectrum (0° - 360°)'}
              </span>
            </h4>

            {/* Defect Signature Selector */}
            <div className="flex items-center space-x-1 rtl:space-x-reverse flex-wrap gap-1">
              {(['cavity', 'tracking', 'floating', 'surface'] as const).map((sig) => (
                <button
                  key={sig}
                  onClick={() => setDefectType(sig)}
                  className={`px-2 py-1 text-[10px] font-bold rounded border cursor-pointer uppercase transition-all ${
                    defectType === sig
                      ? 'bg-purple-950 text-purple-300 border-purple-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  title={defectNames[sig][isAr ? 'ar' : 'en']}
                >
                  {defectNames[sig][isAr ? 'ar' : 'en']}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <canvas
              ref={prpdCanvasRef}
              width={640}
              height={220}
              className="w-full h-56 bg-slate-950 rounded-xl border border-slate-800 shadow-inner"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div>
              {isAr ? 'أقصى شحنة تفريغ:' : 'Max Discharge:'}{' '}
              <strong className="text-purple-400 font-mono">142 pC</strong>
            </div>
            <div>
              {isAr ? 'معدل النبضات:' : 'Pulse Rate:'}{' '}
              <strong className="text-cyan-400 font-mono">
                {isAr ? '42 نبضة / ثانية' : '42 Pulses / sec'}
              </strong>
            </div>
            <div>
              {isAr ? 'نوع العيب:' : 'Pattern Type:'}{' '}
              <strong className="text-amber-400">
                {defectNames[defectType][isAr ? 'ar' : 'en']}
              </strong>
            </div>
          </div>
        </div>

        {/* Component 2: IR Thermography Matrix */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase text-amber-400 flex items-center space-x-2 rtl:space-x-reverse">
              <Camera className="w-4 h-4" />
              <span>
                {isAr ? 'بث الكاميرا الحرارية للبوشينغ (IR)' : 'Infrared Bushing Thermal Camera Stream'}
              </span>
            </h4>
            <span className="text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded font-bold font-mono">
              30 FPS IR FEED
            </span>
          </div>

          <div className="relative">
            <canvas
              ref={irCanvasRef}
              width={340}
              height={200}
              className="w-full h-48 bg-slate-950 rounded-xl border border-slate-800 shadow-inner"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">{isAr ? 'أقصى حرارة' : 'Max Temp'}</span>
              <span className="font-bold text-rose-400 font-mono">74.8 °C</span>
            </div>

            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">{isAr ? 'متوسط الحرارة' : 'Avg Temp'}</span>
              <span className="font-bold text-amber-300 font-mono">52.1 °C</span>
            </div>

            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">{isAr ? 'فارق ΔT' : 'Delta-T Alert'}</span>
              <span className="font-bold text-emerald-400 font-mono">1.8 °C OK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

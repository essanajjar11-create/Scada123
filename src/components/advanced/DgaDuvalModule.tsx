import React, { useState, useRef, useEffect } from 'react';
import { Flame, AlertTriangle, ShieldAlert, BarChart2, Droplets, Activity, RefreshCw } from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

export const DgaDuvalModule: React.FC = () => {
  const { dgaData, setDgaData, lang } = useScada();
  const isAr = lang === 'ar';
  const [plotType, setPlotType] = useState<'triangle' | 'pentagon'>('triangle');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculate Duval Triangle percentages (CH4, C2H4, C2H2)
  const sumTri = dgaData.ch4 + dgaData.c2h4 + dgaData.c2h2 || 1;
  const pctCH4 = (dgaData.ch4 / sumTri) * 100;
  const pctC2H4 = (dgaData.c2h4 / sumTri) * 100;
  const pctC2H2 = (dgaData.c2h2 / sumTri) * 100;

  // Calculate Duval Pentagon percentages (H2, CH4, C2H6, C2H4, C2H2)
  const sumPent = dgaData.h2 + dgaData.ch4 + dgaData.c2h6 + dgaData.c2h4 + dgaData.c2h2 || 1;
  const pentH2 = (dgaData.h2 / sumPent) * 100;
  const pentCH4 = (dgaData.ch4 / sumPent) * 100;
  const pentC2H6 = (dgaData.c2h6 / sumPent) * 100;
  const pentC2H4 = (dgaData.c2h4 / sumPent) * 100;
  const pentC2H2 = (dgaData.c2h2 / sumPent) * 100;

  // Duval Triangle 1 Fault Diagnosis
  let faultZone = isAr ? 'PD (تفريغ جزئي)' : 'PD (Partial Discharge)';
  let faultColor = 'text-emerald-400';
  let faultDesc = isAr
    ? 'انهيار هالي منخفض الطاقة داخل فقاعات الغاز أو الورق العازل المشبع بالزيت.'
    : 'Low energy corona breakdown in gas bubbles or oil impregnated paper.';

  if (pctC2H2 > 15) {
    faultZone = isAr ? 'D2 (قوس كهربائي عالي الطاقة)' : 'D2 (High Energy Arcing)';
    faultColor = 'text-rose-400';
    faultDesc = isAr
      ? 'تفريغ عالي الطاقة / وميض شراري بين الملفات أو مغير التفريعات.'
      : 'High energy discharge / flashover between windings or tap changer selector.';
  } else if (pctC2H2 > 4) {
    faultZone = isAr ? 'D1 (شرارة منخفضة الطاقة)' : 'D1 (Low Energy Sparking)';
    faultColor = 'text-amber-400';
    faultDesc = isAr
      ? 'قوس كهربائي أو مسارات تفريغ منخفضة الطاقة في الزيت العازل.'
      : 'Low energy arcing or tracking in oil insulation.';
  } else if (pctC2H4 > 50) {
    faultZone = isAr ? 'T3 (عطل حراري شديد > 700°C)' : 'T3 (Thermal Fault > 700°C)';
    faultColor = 'text-rose-500';
    faultDesc = isAr
      ? 'تدهور شديد للبقع الساخنة، فرط حرارة القلب الحديدي أو تيارات دوامية.'
      : 'Severe hot-spot degradation, core overheating, or circulating currents.';
  } else if (pctC2H4 > 20) {
    faultZone = isAr ? 'T2 (عطل حراري متوسط 300°C - 700°C)' : 'T2 (Thermal Fault 300°C - 700°C)';
    faultColor = 'text-amber-300';
    faultDesc = isAr
      ? 'بقعة حرارية ساخنة معتدلة على موصلات النحاس أو وصلات القلب الحديدي.'
      : 'Moderate thermal hotspot on copper conductors or iron core joints.';
  } else if (pctCH4 > 80) {
    faultZone = isAr ? 'T1 (عطل حراري خفيف < 300°C)' : 'T1 (Thermal Fault < 300°C)';
    faultColor = 'text-yellow-400';
    faultDesc = isAr
      ? 'إجهاد حراري موضعي طفيف أو انبعاث غازات طائشة في زيت المحول.'
      : 'Mild localized thermal stress or stray gassing in transformer oil.';
  } else if (pctCH4 > 60 && pctC2H4 < 20) {
    faultZone = isAr ? 'S (انبعاث غازات طائشة / تسخين معتدل)' : 'S (Stray Gassing / Overheating)';
    faultColor = 'text-cyan-400';
    faultDesc = isAr
      ? 'انبعاث غازات طائشة من الزيت المعدني تحت حرارة معتدلة (< 200°C).'
      : 'Stray gassing of mineral oil under moderate temperature (< 200°C).';
  }

  // Draw Triangle or Pentagon on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;

    if (plotType === 'triangle') {
      // Duval Triangle Geometry
      const topX = w / 2;
      const topY = 30;
      const leftX = 40;
      const leftY = h - 40;
      const rightX = w - 40;
      const rightY = h - 40;

      // Draw background fill zones
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(leftX, leftY);
      ctx.lineTo(rightX, rightY);
      ctx.closePath();
      ctx.fillStyle = '#090d16';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Zone Dividers
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Arcing Zone boundary
      ctx.moveTo(topX, topY);
      ctx.lineTo(leftX + (rightX - leftX) * 0.15, leftY);
      ctx.stroke();

      // Thermal Zone boundary
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(leftX + (rightX - leftX) * 0.6, leftY);
      ctx.stroke();

      // Axis Labels
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('% CH4 (Top)', topX, topY - 10);
      ctx.textAlign = 'right';
      ctx.fillText('% C2H2', leftX - 5, leftY + 15);
      ctx.textAlign = 'left';
      ctx.fillText('% C2H4', rightX + 5, rightY + 15);

      // Plot Barycentric Point
      const px = (pctCH4 / 100) * topX + (pctC2H2 / 100) * leftX + (pctC2H4 / 100) * rightX;
      const py = (pctCH4 / 100) * topY + (pctC2H2 / 100) * leftY + (pctC2H4 / 100) * rightY;

      // Pulse glow ring
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
      ctx.fill();

      // Solid Point
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#f43f5e';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fecdd3';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`(${pctCH4.toFixed(1)}%, ${pctC2H2.toFixed(1)}%, ${pctC2H4.toFixed(1)}%)`, px, py - 10);
    } else {
      // Duval Pentagon Geometry (5 Axes)
      const cx = w / 2;
      const cy = h / 2 + 5;
      const r = Math.min(w, h) / 2 - 45;

      const axes = ['H2', 'CH4', 'C2H6', 'C2H4', 'C2H2'];
      const values = [pentH2, pentCH4, pentC2H6, pentC2H4, pentC2H2];

      // Draw Grid Rings
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let level = 1; level <= 4; level++) {
        const ringR = (r / 4) * level;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          const x = cx + ringR * Math.cos(angle);
          const y = cy + ringR * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Draw Axis Rays
      ctx.strokeStyle = '#334155';
      const points: { x: number; y: number }[] = [];

      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px monospace';
        const lx = cx + (r + 18) * Math.cos(angle);
        const ly = cy + (r + 18) * Math.sin(angle);
        ctx.textAlign = 'center';
        ctx.fillText(axes[i], lx, ly);

        // Data point coordinates
        const valR = (values[i] / 100) * r;
        points.push({
          x: cx + valR * Math.cos(angle),
          y: cy + valR * Math.sin(angle),
        });
      }

      // Draw Pentagon Data Polygon
      ctx.beginPath();
      points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.fill();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.stroke();

      points.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#e879f9';
        ctx.fill();
      });
    }
  }, [plotType, pctCH4, pctC2H2, pctC2H4, pentH2, pentCH4, pentC2H6, pentC2H4, pentC2H2]);

  // Preset fault simulator
  const loadPreset = (preset: 'normal' | 'arcing' | 'thermal' | 'sparking') => {
    if (preset === 'normal') {
      setDgaData({
        h2: 12,
        ch4: 8,
        c2h2: 0,
        c2h4: 5,
        c2h6: 10,
        co: 150,
        co2: 1200,
        generationRatePPMPerDay: 0.2,
        moistureInOilPPM: 11.2,
        bdvKV: 72.0,
      });
    } else if (preset === 'arcing') {
      setDgaData({
        h2: 120,
        ch4: 85,
        c2h2: 185,
        c2h4: 210,
        c2h6: 30,
        co: 380,
        co2: 2100,
        generationRatePPMPerDay: 18.5,
        moistureInOilPPM: 28.4,
        bdvKV: 38.5,
      });
    } else if (preset === 'thermal') {
      setDgaData({
        h2: 60,
        ch4: 180,
        c2h2: 2,
        c2h4: 420,
        c2h6: 120,
        co: 450,
        co2: 3200,
        generationRatePPMPerDay: 12.0,
        moistureInOilPPM: 22.0,
        bdvKV: 46.0,
      });
    } else if (preset === 'sparking') {
      setDgaData({
        h2: 95,
        ch4: 65,
        c2h2: 32,
        c2h4: 48,
        c2h6: 25,
        co: 290,
        co2: 1800,
        generationRatePPMPerDay: 8.4,
        moistureInOilPPM: 19.5,
        bdvKV: 51.2,
      });
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-2.5 bg-amber-950/80 border border-amber-700/60 rounded-lg text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-tight">
              {isAr
                ? 'تحليل الغازات الذائبة (DGA) ومحرك تشخيص مثلث وخماسي دوفال'
                : 'Dissolved Gas Analysis (DGA) & Duval Diagnostic Engine'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'تتبع تركيز الغازات الهيدروكربونية الذائبة وفق معايير IEC 60599 / IEEE C57.104'
                : 'IEC 60599 / IEEE C57.104 Hydrocarbon Dissolved Gas Tracking'}
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="text-[11px] text-slate-400">
            {isAr ? 'حقن سيناريو تجريبي:' : 'Inject Scenario:'}
          </span>
          <button
            onClick={() => loadPreset('normal')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs rounded border border-slate-700 cursor-pointer font-bold"
          >
            {isAr ? 'طبيعي' : 'Normal'}
          </button>
          <button
            onClick={() => loadPreset('arcing')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs rounded border border-slate-700 cursor-pointer font-bold"
          >
            {isAr ? 'D2 تفريغ قوسي' : 'D2 High Arcing'}
          </button>
          <button
            onClick={() => loadPreset('thermal')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs rounded border border-slate-700 cursor-pointer font-bold"
          >
            {isAr ? 'T3 فرط حرارة' : 'T3 Overheating'}
          </button>
          <button
            onClick={() => loadPreset('sparking')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs rounded border border-slate-700 cursor-pointer font-bold"
          >
            {isAr ? 'D1 شرارة' : 'D1 Sparking'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Gas Input Panel (7 Gases) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase text-amber-400 flex items-center space-x-1.5 rtl:space-x-reverse">
              <BarChart2 className="w-4 h-4" />
              <span>
                {isAr ? 'مستويات الغازات الهيدروكربونية السبعة (PPM)' : '7 Hydrocarbon Fault Gas Levels (PPM)'}
              </span>
            </h4>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
              {isAr ? 'حساس كروماتوجرافي متصل' : 'GC Online Sensor'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <label className="text-slate-400 block text-[10px] mb-1">
                {isAr ? 'هيدروجين (H₂)' : 'Hydrogen (H₂)'}
              </label>
              <div className="flex items-center space-x-1 rtl:space-x-reverse font-mono">
                <input
                  type="number"
                  value={dgaData.h2}
                  onChange={(e) => setDgaData({ ...dgaData, h2: Math.max(0, Number(e.target.value)) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-500">PPM</span>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <label className="text-slate-400 block text-[10px] mb-1">
                {isAr ? 'ميثان (CH₄)' : 'Methane (CH₄)'}
              </label>
              <div className="flex items-center space-x-1 rtl:space-x-reverse font-mono">
                <input
                  type="number"
                  value={dgaData.ch4}
                  onChange={(e) => setDgaData({ ...dgaData, ch4: Math.max(0, Number(e.target.value)) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-500">PPM</span>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <label className="text-slate-400 block text-[10px] mb-1">
                {isAr ? 'أسيتيلين (C₂H₂)' : 'Acetylene (C₂H₂)'}
              </label>
              <div className="flex items-center space-x-1 rtl:space-x-reverse font-mono">
                <input
                  type="number"
                  value={dgaData.c2h2}
                  onChange={(e) => setDgaData({ ...dgaData, c2h2: Math.max(0, Number(e.target.value)) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-rose-300 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-500">PPM</span>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <label className="text-slate-400 block text-[10px] mb-1">
                {isAr ? 'إيثيلين (C₂H₄)' : 'Ethylene (C₂H₄)'}
              </label>
              <div className="flex items-center space-x-1 rtl:space-x-reverse font-mono">
                <input
                  type="number"
                  value={dgaData.c2h4}
                  onChange={(e) => setDgaData({ ...dgaData, c2h4: Math.max(0, Number(e.target.value)) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-500">PPM</span>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <label className="text-slate-400 block text-[10px] mb-1">
                {isAr ? 'إيثان (C₂H₆)' : 'Ethane (C₂H₆)'}
              </label>
              <div className="flex items-center space-x-1 rtl:space-x-reverse font-mono">
                <input
                  type="number"
                  value={dgaData.c2h6}
                  onChange={(e) => setDgaData({ ...dgaData, c2h6: Math.max(0, Number(e.target.value)) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-500">PPM</span>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <label className="text-slate-400 block text-[10px] mb-1">
                {isAr ? 'أول أكسيد الكربون (CO)' : 'Carbon Monoxide (CO)'}
              </label>
              <div className="flex items-center space-x-1 rtl:space-x-reverse font-mono">
                <input
                  type="number"
                  value={dgaData.co}
                  onChange={(e) => setDgaData({ ...dgaData, co: Math.max(0, Number(e.target.value)) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-500">PPM</span>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
              <label className="text-slate-400 block text-[10px] mb-1">
                {isAr ? 'ثاني أكسيد الكربون (CO₂)' : 'Carbon Dioxide (CO₂)'}
              </label>
              <div className="flex items-center space-x-1 rtl:space-x-reverse font-mono">
                <input
                  type="number"
                  value={dgaData.co2}
                  onChange={(e) => setDgaData({ ...dgaData, co2: Math.max(0, Number(e.target.value)) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-bold text-xs"
                />
                <span className="text-[10px] text-slate-500">PPM</span>
              </div>
            </div>
          </div>

          {/* Oil Dielectric & Moisture Gauges */}
          <div className="border-t border-slate-800 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] block flex items-center justify-between">
                <span>{isAr ? 'معدل نمو الغازات' : 'Gas Rate of Growth'}</span>
                <Activity className="w-3 h-3 text-amber-400" />
              </span>
              <div className="flex items-baseline space-x-1 rtl:space-x-reverse font-mono">
                <span className="text-lg font-bold text-amber-400">{dgaData.generationRatePPMPerDay.toFixed(1)}</span>
                <span className="text-[10px] text-slate-500">{isAr ? 'جزء بالمليون/يوم' : 'PPM/day'}</span>
              </div>
              <p className="text-[9px] text-slate-500">
                {isAr ? 'حد IEEE الأقصى: 5.0 PPM/يوم' : 'IEEE Threshold: 5.0 PPM/day'}
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] block flex items-center justify-between">
                <span>{isAr ? 'نسبة الرطوبة في الزيت' : 'Moisture-in-Oil'}</span>
                <Droplets className="w-3 h-3 text-cyan-400" />
              </span>
              <div className="flex items-baseline space-x-1 rtl:space-x-reverse font-mono">
                <span className={`text-lg font-bold ${dgaData.moistureInOilPPM > 25 ? 'text-rose-400' : 'text-cyan-400'}`}>
                  {dgaData.moistureInOilPPM.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-500">PPM</span>
              </div>
              <p className="text-[9px] text-slate-500">
                {isAr ? 'الحد الأقصى: 30 PPM عند 60°C' : 'Max Limit: 30 PPM @ 60°C'}
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] block flex items-center justify-between">
                <span>{isAr ? 'جهد انهيار العازلية (BDV)' : 'Breakdown Voltage'}</span>
                <ShieldAlert className="w-3 h-3 text-emerald-400" />
              </span>
              <div className="flex items-baseline space-x-1 rtl:space-x-reverse font-mono">
                <span className={`text-lg font-bold ${dgaData.bdvKV < 45 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {dgaData.bdvKV.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-500">kV</span>
              </div>
              <p className="text-[9px] text-slate-500">
                {isAr ? 'الحد الأدنى: 50 kV (IEC 60156)' : 'Min Standard: 50 kV (IEC 60156)'}
              </p>
            </div>
          </div>

          {/* Fault Diagnosis Result */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-bold uppercase">
                {isAr ? 'التشخيص التحليلي لدوفال (Duval Diagnosis):' : 'Duval Diagnostic Diagnosis:'}
              </span>
              <span className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800 font-mono">
                IEC 60599
              </span>
            </div>
            <div className={`text-sm font-extrabold ${faultColor} flex items-center space-x-2 rtl:space-x-reverse`}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{faultZone}</span>
            </div>
            <p className="text-xs text-slate-300">{faultDesc}</p>
          </div>
        </div>

        {/* Duval Plot Canvas Display (Triangle vs Pentagon) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <h4 className="text-xs font-bold uppercase text-slate-300">
              {isAr ? 'الراسم البياني لدوفال' : 'Duval Visualizer'}
            </h4>
            <div className="flex items-center space-x-1 rtl:space-x-reverse bg-slate-950 p-1 rounded border border-slate-800">
              <button
                onClick={() => setPlotType('triangle')}
                className={`px-3 py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${
                  plotType === 'triangle'
                    ? 'bg-purple-900 text-purple-200 border border-purple-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isAr ? 'مثلث دوفال 1' : 'Duval Triangle 1'}
              </button>
              <button
                onClick={() => setPlotType('pentagon')}
                className={`px-3 py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${
                  plotType === 'pentagon'
                    ? 'bg-purple-900 text-purple-200 border border-purple-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isAr ? 'خماسي دوفال 1' : 'Duval Pentagon 1'}
              </button>
            </div>
          </div>

          <div className="relative my-auto">
            <canvas
              ref={canvasRef}
              width={320}
              height={270}
              className="bg-slate-950 rounded-xl border border-slate-800 shadow-inner"
            />
          </div>

          <div className="w-full mt-3 p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] flex justify-between text-slate-400">
            <span>
              {plotType === 'triangle'
                ? isAr ? 'محاور المثلث: CH4, C2H4, C2H2' : 'Triangle Axes: CH4, C2H4, C2H2'
                : isAr ? 'محاور الخماسي: H2, CH4, C2H6, C2H4, C2H2' : 'Pentagon Axes: H2, CH4, C2H6, C2H4, C2H2'}
            </span>
            <span className="text-purple-400 font-bold">IEC 60599 Method</span>
          </div>
        </div>
      </div>
    </div>
  );
};

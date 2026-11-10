import React, { useRef, useEffect, useState } from 'react';
import { Flame, AlertTriangle, X, RefreshCw, BarChart2, ShieldAlert, Droplets, Activity } from 'lucide-react';
import { useScada } from '../../../context/ScadaContext';
import { EquationCard } from '../../common/EquationCard';

interface DuvalTriangleModalProps {
  trId: 'TR-1' | 'TR-2';
  onClose: () => void;
}

export const DuvalTriangleModal: React.FC<DuvalTriangleModalProps> = ({ trId, onClose }) => {
  const { lang, dgaData, setDgaData } = useScada();
  const isAr = lang === 'ar';
  const [plotType, setPlotType] = useState<'triangle' | 'pentagon'>('triangle');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const safeDga = dgaData || {
    h2: 42,
    ch4: 65,
    c2h6: 28,
    c2h4: 110,
    c2h2: 4,
    co: 320,
    co2: 2400,
    moistureInOilPPM: 14.5,
    bdvKV: 68.2,
    generationRatePPMPerDay: 0.8,
  };

  // Percentages calculation
  const sumTri = (safeDga.ch4 ?? 65) + (safeDga.c2h4 ?? 110) + (safeDga.c2h2 ?? 4) || 1;
  const pctCH4 = ((safeDga.ch4 ?? 65) / sumTri) * 100;
  const pctC2H4 = ((safeDga.c2h4 ?? 110) / sumTri) * 100;
  const pctC2H2 = ((safeDga.c2h2 ?? 4) / sumTri) * 100;

  const sumPent = (safeDga.h2 ?? 42) + (safeDga.ch4 ?? 65) + (safeDga.c2h6 ?? 28) + (safeDga.c2h4 ?? 110) + (safeDga.c2h2 ?? 4) || 1;
  const pentH2 = ((safeDga.h2 ?? 42) / sumPent) * 100;
  const pentCH4 = ((safeDga.ch4 ?? 65) / sumPent) * 100;
  const pentC2H6 = ((safeDga.c2h6 ?? 28) / sumPent) * 100;
  const pentC2H4 = ((safeDga.c2h4 ?? 110) / sumPent) * 100;
  const pentC2H2 = ((safeDga.c2h2 ?? 4) / sumPent) * 100;

  let faultZone = isAr ? 'PD (تفريغ جزئي)' : 'PD (Partial Discharge)';
  let faultColor = 'text-emerald-400';
  let faultDesc = isAr
    ? 'تفريغ هالي منخفض الطاقة في فقاعات الغاز أو العازل الورقي المشبع بالزيت.'
    : 'Low energy corona breakdown in gas bubbles or oil impregnated paper.';

  if (pctC2H2 > 15) {
    faultZone = isAr ? 'D2 (قوس كهربائي عالي الطاقة)' : 'D2 (High Energy Arcing)';
    faultColor = 'text-rose-400';
    faultDesc = isAr
      ? 'تفريغ كهربائي عالي الشدة / وميض قوسي بين الملفات أو مغير التفريعات.'
      : 'High energy discharge / flashover between windings or tap changer selector.';
  } else if (pctC2H2 > 4) {
    faultZone = isAr ? 'D1 (شرر كهربائي منخفض الطاقة)' : 'D1 (Low Energy Sparking)';
    faultColor = 'text-amber-400';
    faultDesc = isAr
      ? 'قوس كهربائي منخفض الطاقة أو تتبع كربوني في الزيت العازل.'
      : 'Low energy arcing or tracking in oil insulation.';
  } else if (pctC2H4 > 50) {
    faultZone = isAr ? 'T3 (عطل حراري شديد > 700°م)' : 'T3 (Thermal Fault > 700°C)';
    faultColor = 'text-rose-500';
    faultDesc = isAr
      ? 'تدهور حراري شديد في النقاط الساخنة، سخونة قلب المحول، أو تيارات دوامية.'
      : 'Severe hot-spot degradation, core overheating, or circulating currents.';
  } else if (pctC2H4 > 20) {
    faultZone = isAr ? 'T2 (عطل حراري متوسط 300°م - 700°م)' : 'T2 (Thermal Fault 300°C - 700°C)';
    faultColor = 'text-amber-300';
    faultDesc = isAr
      ? 'نقطة ساخنة متوسطة الحرارة على موصلات النحاس أو وصلات القلب الحديدي.'
      : 'Moderate thermal hotspot on copper conductors or iron core joints.';
  } else if (pctCH4 > 80) {
    faultZone = isAr ? 'T1 (عطل حراري طفيف < 300°م)' : 'T1 (Thermal Fault < 300°C)';
    faultColor = 'text-yellow-400';
    faultDesc = isAr
      ? 'إجهاد حراري موضعي طفيف أو غازات شاردة في زيت المحول.'
      : 'Mild localized thermal stress or stray gassing in transformer oil.';
  } else if (pctCH4 > 60 && pctC2H4 < 20) {
    faultZone = isAr ? 'S (توليد غازات شاردة / تسخين طفيف)' : 'S (Stray Gassing / Overheating)';
    faultColor = 'text-cyan-400';
    faultDesc = isAr
      ? 'تطاير غازات شاردة من الزيت المعدني تحت درجات حرارة معتدلة (< 200°م).'
      : 'Stray gassing of mineral oil under moderate temperature (< 200°C).';
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;

    if (plotType === 'triangle') {
      const topX = w / 2;
      const topY = 25;
      const leftX = 35;
      const leftY = h - 35;
      const rightX = w - 35;
      const rightY = h - 35;

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

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(leftX + (rightX - leftX) * 0.15, leftY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(leftX + (rightX - leftX) * 0.6, leftY);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('% CH4 (Top)', topX, topY - 8);
      ctx.textAlign = 'right';
      ctx.fillText('% C2H2', leftX - 5, leftY + 12);
      ctx.textAlign = 'left';
      ctx.fillText('% C2H4', rightX + 5, rightY + 12);

      const px = (pctCH4 / 100) * topX + (pctC2H2 / 100) * leftX + (pctC2H4 / 100) * rightX;
      const py = (pctCH4 / 100) * topY + (pctC2H2 / 100) * leftY + (pctC2H4 / 100) * rightY;

      ctx.beginPath();
      ctx.arc(px, py, 12, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
      ctx.fill();

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
      const cx = w / 2;
      const cy = h / 2 + 5;
      const r = Math.min(w, h) / 2 - 40;

      const axes = ['H2', 'CH4', 'C2H6', 'C2H4', 'C2H2'];
      const values = [pentH2, pentCH4, pentC2H6, pentC2H4, pentC2H2];

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

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px monospace';
        const lx = cx + (r + 18) * Math.cos(angle);
        const ly = cy + (r + 18) * Math.sin(angle);
        ctx.textAlign = 'center';
        ctx.fillText(axes[i], lx, ly);

        const valR = (values[i] / 100) * r;
        points.push({
          x: cx + valR * Math.cos(angle),
          y: cy + valR * Math.sin(angle),
        });
      }

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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 rtl:space-x-reverse border-b border-slate-800 pb-3">
          <div className="p-2.5 bg-amber-950 border border-amber-700/60 rounded-lg text-amber-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 uppercase">
              {isAr
                ? `تحليل الغازات الذائبة (DGA) ومثلث دوفال لمحول ${trId}`
                : `${trId} DGA Duval Triangle Diagnostic Callout`}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'تحليل الغازات الذائبة وفق معياري IEC 60599 و IEEE C57.104'
                : 'IEC 60599 & IEEE C57.104 Dissolved Gas Analysis'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-amber-400 uppercase flex items-center space-x-2 rtl:space-x-reverse">
                <BarChart2 className="w-4 h-4" />
                <span>{isAr ? 'تركيزات الغازات (PPM)' : 'Gas PPM Concentrations'}</span>
              </h3>
              <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-mono">
                {isAr ? 'كروماتوغرافيا فورية' : 'Online Chromatograph'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">{isAr ? 'الهيدروجين (H₂)' : 'Hydrogen (H₂)'}</span>
                <span className="font-bold text-slate-200 font-mono">{safeDga.h2} PPM</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">{isAr ? 'الميثان (CH₄)' : 'Methane (CH₄)'}</span>
                <span className="font-bold text-slate-200 font-mono">{safeDga.ch4} PPM</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">{isAr ? 'الأسيتيلين (C₂H₂)' : 'Acetylene (C₂H₂)'}</span>
                <span className="font-bold text-rose-300 font-mono">{safeDga.c2h2} PPM</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">{isAr ? 'الإيثيلين (C₂H₄)' : 'Ethylene (C₂H₄)'}</span>
                <span className="font-bold text-slate-200 font-mono">{safeDga.c2h4} PPM</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">{isAr ? 'الإيثان (C₂H₆)' : 'Ethane (C₂H₆)'}</span>
                <span className="font-bold text-slate-200 font-mono">{safeDga.c2h6} PPM</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">{isAr ? 'أول أكسيد الكربون (CO)' : 'Carbon Monoxide (CO)'}</span>
                <span className="font-bold text-slate-200 font-mono">{safeDga.co} PPM</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">
                {isAr ? 'منطقة تشخيص دوفال:' : 'Duval Diagnostic Zone:'}
              </span>
              <div className={`text-sm font-extrabold ${faultColor} flex items-center space-x-2 rtl:space-x-reverse`}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{faultZone}</span>
              </div>
              <p className="text-xs text-slate-300 pt-1">{faultDesc}</p>
            </div>

            {/* Duval Gas Percentage Equation Box */}
            <EquationCard
              title={isAr ? 'معادلات نسب الغازات لمثلث دوفال 1' : 'Duval Triangle 1 Gas Ratio Equations'}
              standard="IEC 60599 / IEEE C57.104"
              equation={
                <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-cyan-300 font-bold text-xs ltr font-mono">
                  <span>% C<sub>2</sub>H<sub>4</sub> =</span>
                  <div className="inline-flex flex-col items-center px-1">
                    <span className="border-b border-cyan-400/80 pb-0.5">C<sub>2</sub>H<sub>4</sub></span>
                    <span className="pt-0.5">CH<sub>4</sub> + C<sub>2</sub>H<sub>4</sub> + C<sub>2</sub>H<sub>2</sub></span>
                  </div>
                  <span>× 100%</span>
                </div>
              }
              description={
                isAr
                  ? 'إحداثيات مثلّثية محسوبة من تركيزات الغازات الهيدروكربونية الحرجة'
                  : 'Triangular coordinates calculated from key hydrocarbon dissolved gases'
              }
              variables={[
                { symbol: '% CH4', label: isAr ? 'نسبة الميثان' : 'Methane Fraction', value: pctCH4.toFixed(1), unit: '%' },
                { symbol: '% C2H4', label: isAr ? 'نسبة الإيثيلين' : 'Ethylene Fraction', value: pctC2H4.toFixed(1), unit: '%' },
                { symbol: '% C2H2', label: isAr ? 'نسبة الأسيتيلين' : 'Acetylene Fraction', value: pctC2H2.toFixed(1), unit: '%' }
              ]}
              result={{
                label: isAr ? 'منطقة العطل المشخّصة' : 'Diagnosed Fault Zone',
                value: faultZone.split(' ')[0],
                status: faultZone.includes('D2') || faultZone.includes('T3')
                  ? isAr ? 'عطل حرج' : 'CRITICAL FAULT'
                  : isAr ? 'طبيعي / طاقة منخفضة' : 'NORMAL / LOW ENERGY',
                statusColor: faultZone.includes('D2') || faultZone.includes('T3') ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }}
            />
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-between">
            <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase">
                {isAr ? 'مخطط دوفال التفاعلي' : 'Interactive Duval Plot'}
              </h3>
              <div className="flex space-x-1 rtl:space-x-reverse">
                <button
                  onClick={() => setPlotType('triangle')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                    plotType === 'triangle' ? 'bg-purple-900 text-purple-200' : 'text-slate-400'
                  }`}
                >
                  {isAr ? 'مثلث' : 'Triangle'}
                </button>
                <button
                  onClick={() => setPlotType('pentagon')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                    plotType === 'pentagon' ? 'bg-purple-900 text-purple-200' : 'text-slate-400'
                  }`}
                >
                  {isAr ? 'مخمس' : 'Pentagon'}
                </button>
              </div>
            </div>

            <canvas ref={canvasRef} width={280} height={240} className="bg-slate-900 rounded-lg border border-slate-800" />

            <div className="w-full mt-2 text-[10px] text-slate-400 flex justify-between font-mono">
              <span>{isAr ? 'الرطوبة:' : 'Moisture:'} {(safeDga.moistureInOilPPM ?? 14.5).toFixed(1)} PPM</span>
              <span>{isAr ? 'جهد الانهيار BDV:' : 'BDV:'} {(safeDga.bdvKV ?? 68.2).toFixed(1)} kV</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق التشخيص' : 'Close Diagnostics'}
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { AlertOctagon, X, Zap } from 'lucide-react';
import { SwitchgearItem, TransformerData } from '../../types/substation';

interface EquipmentCardProps {
  item?: SwitchgearItem;
  transformer?: TransformerData;
  onClose: () => void;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({ item, transformer, onClose }) => {
  if (!item && !transformer) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#181c24] border-2 border-[#3d4554] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden font-sans text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Nameplate Metal Header */}
        <div className="bg-gradient-to-r from-[#232936] via-[#2f3747] to-[#232936] border-b border-[#414b5c] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold">
                TECHNICAL NAMEPLATE • لوحة الصانع الفنية الرسمية
              </span>
              <h2 className="text-base font-bold text-white tracking-wide">
                {item ? `${item.name} (${item.id})` : `محول القدرة ${transformer?.id} (${transformer?.model})`}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {item && (
            <>
              {/* Manufacturer & Model Banner */}
              <div className="grid grid-cols-2 gap-3 bg-[#11141a] p-3.5 rounded-xl border border-[#2b3240] text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">الشركة الصانعة (Manufacturer):</span>
                  <span className="font-bold text-slate-200">{item.manufacturer}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">الطراز / النوع (Model):</span>
                  <span className="font-mono font-bold text-amber-400">{item.model}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">المعيار المعتمد (Standard):</span>
                  <span className="font-mono text-slate-300">
                    {item.type === 'CB' ? 'IEC 62271-100' : 'IEC 62271-102'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">عدد المناورات المنفذة:</span>
                  <span className="font-mono text-emerald-400 font-bold">{item.operationsCount} ops</span>
                </div>
              </div>

              {/* Detailed Nameplate specs */}
              <div className="space-y-2 text-xs">
                <h3 className="font-bold text-slate-300 text-[11px] uppercase tracking-wider border-b border-slate-700 pb-1">
                  البيانات الكهروميكانيكية الاسمية (Rated Ratings)
                </h3>
                <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono-numbers">
                  <div className="bg-[#1b202a] p-2 rounded border border-[#2d3646] flex justify-between">
                    <span className="text-slate-400 font-sans text-[11px]">الجهد الاسمي (Ur):</span>
                    <span className="font-bold text-amber-400">245 kV</span>
                  </div>
                  <div className="bg-[#1b202a] p-2 rounded border border-[#2d3646] flex justify-between">
                    <span className="text-slate-400 font-sans text-[11px]">التيار الاسمي (Ir):</span>
                    <span className="font-bold text-emerald-400">{item.ratedCurrentA || 2000} A</span>
                  </div>
                  <div className="bg-[#1b202a] p-2 rounded border border-[#2d3646] flex justify-between">
                    <span className="text-slate-400 font-sans text-[11px]">التردد الاسمي (fr):</span>
                    <span className="text-slate-200">50 / 60 Hz</span>
                  </div>
                  <div className="bg-[#1b202a] p-2 rounded border border-[#2d3646] flex justify-between">
                    <span className="text-slate-400 font-sans text-[11px]">صدمة الصاعقة (BIL):</span>
                    <span className="text-slate-200">{item.type === 'CB' ? '900 kV' : '1050 kV'}</span>
                  </div>

                  {item.type === 'CB' && (
                    <>
                      <div className="bg-[#1b202a] p-2 rounded border border-[#2d3646] flex justify-between">
                        <span className="text-slate-400 font-sans text-[11px]">تيار كسر القصر (Isc):</span>
                        <span className="font-bold text-red-400">40 kA</span>
                      </div>
                      <div className="bg-[#1b202a] p-2 rounded border border-[#2d3646] flex justify-between">
                        <span className="text-slate-400 font-sans text-[11px]">وسط الإخماد والعزل:</span>
                        <span className="text-cyan-400 font-bold">غاز SF6</span>
                      </div>
                      <div className="col-span-2 bg-[#1b202a] p-2 rounded border border-[#2d3646] flex justify-between items-center">
                        <span className="text-slate-400 font-sans text-[11px]">ضغط غاز SF6 الفعلي:</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold font-mono ${
                            item.sf6PressureBar! < 5.0 ? 'text-red-400 animate-pulse' : 'text-cyan-300'
                          }`}>
                            {item.sf6PressureBar?.toFixed(2)} bar ({((item.sf6PressureBar || 6) * 0.1).toFixed(2)} MPa)
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans ${
                            item.sf6PressureBar! < 5.0 ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}>
                            {item.sf6PressureBar! < 5.0 ? 'LOCKOUT BLOCKED' : 'NOMINAL (0.60 MPa)'}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2 bg-[#1b202a] p-2 rounded border border-[#2d3646] text-[11px]">
                        <span className="text-slate-400 font-sans">تسلسل المناورة الاسمي: </span>
                        <span className="font-mono text-slate-200 font-bold">O - 0.3s - CO - 3min - CO</span>
                      </div>
                    </>
                  )}

                  {item.type === 'DS' && (
                    <div className="col-span-2 bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/60 text-amber-200 text-xs flex items-center gap-2">
                      <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>
                        <strong>تحذير تشغيلي صارم (IEC 62271-102):</strong> الفاصل مخصص للعزل المرئي دون حمل (No-load operation only).
                        محظور فتحه أو غلقه تحت مرور أي تيار!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {transformer && (
            <>
              {/* Transformer Manufacturer & General Details */}
              <div className="grid grid-cols-2 gap-3 bg-[#11141a] p-3.5 rounded-xl border border-[#2b3240] text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">الشركة الصانعة / المرجعية:</span>
                  <span className="font-bold text-slate-200">{transformer.manufacturer}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">الطراز المعتمد (Model):</span>
                  <span className="font-mono font-bold text-amber-400">{transformer.model}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">الاستطاعة الاسمية (Rated Power):</span>
                  <span className="font-mono font-bold text-emerald-400">{transformer.mvaRating} MVA (HV-MV)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">مجموعة التوصيل المعيارية:</span>
                  <span className="font-mono font-bold text-cyan-400">YNa0d11 (مؤرض مباشرة)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">المعيار الدولي المعتمد:</span>
                  <span className="font-mono text-slate-300">IEC 60076-1 ... 60076-10</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">الاستطاعة الذاتية الداخلية:</span>
                  <span className="font-mono text-amber-300 font-bold">59.24 MVA (Series)</span>
                </div>
              </div>

              {/* Technical Ratings Grid */}
              <div className="space-y-2 text-xs font-mono-numbers">
                <h3 className="font-bold text-slate-300 text-[11px] uppercase tracking-wider border-b border-slate-700 pb-1 font-sans">
                  بيانات الملفات والجهود والتيارات (Windings & Ratings)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="bg-[#1b202a] p-2 rounded border border-[#2d3646]">
                    <span className="text-slate-400 font-sans text-[10.5px] block">الملف العالي (HV):</span>
                    <span className="font-bold text-red-400 block text-xs">230 kV • 314 A</span>
                    <span className="text-[10px] text-slate-400">125 MVA (Um: 245 kV)</span>
                  </div>
                  <div className="bg-[#1b202a] p-2 rounded border border-[#2d3646]">
                    <span className="text-slate-400 font-sans text-[10.5px] block">الملف المتوسط (MV):</span>
                    <span className="font-bold text-amber-400 block text-xs">121 kV • 597 A</span>
                    <span className="text-[10px] text-slate-400">125 MVA (Um: 123 kV)</span>
                  </div>
                  <div className="bg-[#1b202a] p-2 rounded border border-[#2d3646]">
                    <span className="text-slate-400 font-sans text-[10.5px] block">الملف الثالثي (LV Δ):</span>
                    <span className="font-bold text-blue-400 block text-xs">11 kV • 2187 A</span>
                    <span className="text-[10px] text-slate-400">41.7 MVA (33.3%)</span>
                  </div>
                </div>

                <h3 className="font-bold text-slate-300 text-[11px] uppercase tracking-wider border-b border-slate-700 pb-1 font-sans pt-1">
                  الممانعات والمفاقيد والتبريد (Impedance, Losses & Cooling)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#1b202a] p-2 rounded border border-[#2d3646] flex justify-between">
                    <span className="text-slate-400 font-sans text-[11px]">ممانعة القصر uk(HM):</span>
                    <span className="font-bold text-slate-200">12.0% (ZH: 11%, ZM: 1%, ZL: 19%)</span>
                  </div>
                  <div className="bg-[#1b202a] p-2 rounded border border-[#2d3646] flex justify-between">
                    <span className="text-slate-400 font-sans text-[11px]">ممانعة القصر uk(HL / ML):</span>
                    <span className="text-slate-200">30.0% / 20.0%</span>
                  </div>
                  <div className="bg-[#1b202a] p-2 rounded border border-[#2d3646] flex justify-between">
                    <span className="text-slate-400 font-sans text-[11px]">مفاقيد اللاحمل P0:</span>
                    <span className="text-slate-200">55.0 kW (I0 = 0.3%)</span>
                  </div>
                  <div className="bg-[#1b202a] p-2 rounded border border-[#2d3646] flex justify-between">
                    <span className="text-slate-400 font-sans text-[11px]">مفاقيد الحمل Pk (75°C):</span>
                    <span className="text-slate-200">260.0 kW (at 125 MVA)</span>
                  </div>
                  <div className="bg-[#1b202a] p-2 rounded border border-[#2d3646] flex justify-between">
                    <span className="text-slate-400 font-sans text-[11px]">مغير التفريع (OLTC):</span>
                    <span className="font-bold text-amber-300 font-sans">MR VACUTAP® 19 Steps</span>
                  </div>
                  <div className="bg-[#1b202a] p-2 rounded border border-[#2d3646] flex justify-between">
                    <span className="text-slate-400 font-sans text-[11px]">نطاق تنظيم الجهد:</span>
                    <span className="font-bold text-emerald-400 font-mono">± 9 × 1.78% (101.6 - 140.4 kV)</span>
                  </div>
                  <div className="bg-[#1b202a] p-2 rounded border border-[#2d3646] flex justify-between">
                    <span className="text-slate-400 font-sans text-[11px]">أنماط التبريد المعتمدة:</span>
                    <span className="text-cyan-300 font-bold">ONAN (50%) / ONAF1 (75%) / ONAF2</span>
                  </div>
                  <div className="bg-[#1b202a] p-2 rounded border border-[#2d3646] flex justify-between">
                    <span className="text-slate-400 font-sans text-[11px]">حدود الارتفاع الحراري:</span>
                    <span className="text-slate-200">زيت: 60 K • ملف: 65 K • أسخن: 78 K</span>
                  </div>
                  <div className="bg-[#1b202a] p-2 rounded border border-[#2d3646] flex justify-between">
                    <span className="text-slate-400 font-sans text-[11px]">الأوزان المعيارية:</span>
                    <span className="text-slate-200">فعال: 70 t • زيت: 30 t • كلي: 135 t</span>
                  </div>
                  <div className="bg-[#1b202a] p-2 rounded border border-[#2d3646] flex justify-between">
                    <span className="text-slate-400 font-sans text-[11px]">عزل الصواعق (BIL):</span>
                    <span className="text-slate-200">HV: 1050 kV • MV: 550 kV</span>
                  </div>
                </div>

                <div className="bg-[#12161f] p-2.5 rounded-xl border border-slate-700/80 flex justify-between items-center text-xs">
                  <span className="text-slate-400">الحالة التشغيلية اللحظية للمحولة:</span>
                  <span className="font-mono font-bold text-amber-400">
                    مفقودات {transformer.activeLossKW} kW | مردود {transformer.efficiencyPercent?.toFixed(2) || '99.8'}%
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Action button */}
          <div className="pt-3 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg text-xs font-semibold transition"
            >
              إغلاق اللوحة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

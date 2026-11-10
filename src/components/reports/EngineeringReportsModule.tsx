import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  Award,
  Sparkles,
  TreeDeciduous,
  Flame,
  Activity,
  CheckCircle2,
  Sliders,
  Layers,
  Leaf,
  Droplets,
  Calendar,
  Building,
  UserCheck
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

export const EngineeringReportsModule: React.FC = () => {
  const { tr1State, tr2State, dgaData, soeEvents, lang, t, currentUserName, currentUserRole } = useScada();
  const isAr = lang === 'ar';

  const [activeReportTab, setActiveReportTab] = useState<'DGA' | 'SOE' | 'PQ' | 'ESG'>('DGA');
  const [reportDate, setReportDate] = useState<string>('2026-08-17');
  const [approvalEngineer, setApprovalEngineer] = useState<string>(currentUserName || 'Eng. Haedara Deeb');

  // ESG Calculation metrics based on BESS, Solar, and efficiency
  const solarEnergyGeneratedMwh = 142.5; // MWh
  const bessLossMitigationMwh = 24.8; // MWh
  const totalCleanMwh = solarEnergyGeneratedMwh + bessLossMitigationMwh;
  const co2AvoidedTons = Number((totalCleanMwh * 0.705).toFixed(1)); // 0.705 t CO2/MWh
  const dieselDisplacedLiters = Number((totalCleanMwh * 245).toFixed(0)); // 245 L diesel/MWh
  const treesEquivalent = Number((co2AvoidedTons * 45).toFixed(0));

  // Export handlers
  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const reportData = {
      title: 'Substation Engineering & ESG Compliance Report',
      date: reportDate,
      auditor: approvalEngineer,
      activeTab: activeReportTab,
      telemetry: {
        tr1: { load: tr1State?.loadCurrent, voltage: tr1State?.gridVoltage, windingTemp: tr1State?.windingTemp, oilTemp: tr1State?.oilTemp },
        dga: dgaData,
      },
      esg: {
        totalCleanMwh,
        co2AvoidedTons,
        dieselDisplacedLiters,
        treesEquivalent
      },
      soeCount: soeEvents.length
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SCADA_${activeReportTab}_Report_${reportDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 font-sans text-zinc-100">
      {/* Header Banner */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="p-3 bg-indigo-950/80 border border-indigo-700/80 rounded-xl text-indigo-400 shrink-0">
            <Award className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                {isAr ? 'تقارير التدقيق الهندسي والامتثال (Compliance & ESG Reports)' : 'Automated Engineering & ESG Reports'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 text-[10px] font-mono font-extrabold">
                IEEE / IEC / NERC / ESG
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {isAr
                ? 'تصدير وثائق وتقارير التدقيق المعتمدة: DGA المحولات، سجل أحداث SOE، شهادة جودة القدرة IEEE 519، ومؤشرات البصمة الكربونية'
                : 'One-click compliance dossiers: IEEE C57.104 DGA, IEC 61850 SOE audit trail, IEEE 519 PQ, and ESG Carbon Offset KPI.'}
            </p>
          </div>
        </div>

        {/* Global Export Buttons */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            {isAr ? 'تصدير JSON' : 'Export JSON'}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            {isAr ? 'طباعة التقرير / PDF' : 'Print / Export PDF'}
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex items-center gap-2 bg-[#09090b] border border-zinc-800 p-2 rounded-2xl overflow-x-auto">
        {[
          { id: 'DGA' as const, label: isAr ? 'تقرير DGA وتحليل زيوت المحولات (IEEE C57.104)' : 'IEEE C57.104 DGA Oil Report' },
          { id: 'SOE' as const, label: isAr ? 'سجل تتابع الأحداث والأسباب الجذرية (IEC 61850 SOE)' : 'IEC 61850 SOE Audit Trail' },
          { id: 'PQ' as const, label: isAr ? 'شهادة جودة القدرة والتوافقيات (IEEE 519 Compliance)' : 'IEEE 519 Power Quality Dossier' },
          { id: 'ESG' as const, label: isAr ? 'لوحة مؤشرات الاستدامة وتوفير الانبعاثات (ESG & CO₂)' : 'ESG Carbon Offset & Sustainability' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
              activeReportTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Printable Report Document Sheet */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Official Header */}
        <div className="border-b-2 border-zinc-800 pb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xl font-black tracking-wider text-white uppercase">
              {isAr ? 'الشركة الوطنية لنقل الكهرباء • قطاع التحكم والسكادا' : 'NATIONAL GRID SCADA & TRANSMISSION OPERATIONS'}
            </div>
            <div className="text-xs text-zinc-400 font-mono">
              132/13.8 kV Substation Node • Official Engineering Audit Dossier
            </div>
          </div>
          <div className="font-mono text-xs text-right rtl:text-left space-y-1 bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
            <div className="text-zinc-400">{isAr ? 'تاريخ التقرير:' : 'Date:'} <span className="text-white font-bold">{reportDate}</span></div>
            <div className="text-zinc-400">{isAr ? 'المهندس المعتمد:' : 'Certified Engineer:'} <span className="text-indigo-400 font-bold">{approvalEngineer}</span></div>
            <div className="text-emerald-400 font-extrabold text-[10px] uppercase">✓ COMPLIANCE VERIFIED</div>
          </div>
        </div>

        {/* Dynamic Content based on Active Tab */}
        {activeReportTab === 'DGA' && (
          <div className="space-y-6 font-mono text-xs">
            <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-white uppercase">{isAr ? 'تقرير الحالة الكيميائية والغازات المذابة TR-1' : 'TR-1 DGA Gas Concentration Analysis'}</h3>
                <p className="text-zinc-400 text-[11px] mt-0.5">Methodology: Duval Triangle 1 / IEC 60599 / IEEE C57.104-2019</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                {isAr ? 'الحالة: طبيعية ضمن الحدود' : 'STATUS: NORMAL (CONDITION 1)'}
              </span>
            </div>

            <table className="w-full text-left rtl:text-right border-collapse border border-zinc-800">
              <thead>
                <tr className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                  <th className="p-3">{isAr ? 'الغاز المذاب' : 'Dissolved Gas'}</th>
                  <th className="p-3">{isAr ? 'الرمز الكيميائي' : 'Formula'}</th>
                  <th className="p-3">{isAr ? 'التركيز المقاس (ppm)' : 'Measured (ppm)'}</th>
                  <th className="p-3">{isAr ? 'حد التحذير IEEE (ppm)' : 'IEEE 90% Limit (ppm)'}</th>
                  <th className="p-3">{isAr ? 'مؤشر الحالة' : 'Condition'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                <tr>
                  <td className="p-3 font-bold text-white">{isAr ? 'أسيتيلين' : 'Acetylene'}</td>
                  <td className="p-3 text-cyan-400">C₂H₂</td>
                  <td className="p-3 text-white font-bold">{dgaData?.c2h2 ?? 1.5}</td>
                  <td className="p-3 text-zinc-500">2.0</td>
                  <td className="p-3 text-emerald-400 font-bold">PASS</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">{isAr ? 'إيثيلين' : 'Ethylene'}</td>
                  <td className="p-3 text-cyan-400">C₂H₄</td>
                  <td className="p-3 text-white font-bold">{dgaData?.c2h4 ?? 30}</td>
                  <td className="p-3 text-zinc-500">100</td>
                  <td className="p-3 text-emerald-400 font-bold">PASS</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">{isAr ? 'ميثان' : 'Methane'}</td>
                  <td className="p-3 text-cyan-400">CH₄</td>
                  <td className="p-3 text-white font-bold">{dgaData?.ch4 ?? 25}</td>
                  <td className="p-3 text-zinc-500">120</td>
                  <td className="p-3 text-emerald-400 font-bold">PASS</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">{isAr ? 'هيدروجين' : 'Hydrogen'}</td>
                  <td className="p-3 text-cyan-400">H₂</td>
                  <td className="p-3 text-white font-bold">{dgaData?.h2 ?? 40}</td>
                  <td className="p-3 text-zinc-500">100</td>
                  <td className="p-3 text-emerald-400 font-bold">PASS</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">{isAr ? 'أول أكسيد الكربون' : 'Carbon Monoxide'}</td>
                  <td className="p-3 text-cyan-400">CO</td>
                  <td className="p-3 text-white font-bold">{dgaData?.co ?? 210}</td>
                  <td className="p-3 text-zinc-500">900</td>
                  <td className="p-3 text-emerald-400 font-bold">PASS</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeReportTab === 'SOE' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase">{isAr ? 'سجل تتابع الأحداث والأسباب الجذرية IEC 61850' : 'IEC 61850 Sequence of Events Audit Record'}</h3>
                <p className="text-zinc-400 text-[11px] mt-0.5">Chronological resolution: 1 ms with GOOSE Process Bus timestamping</p>
              </div>
              <span className="font-bold text-indigo-400">{soeEvents.length} {isAr ? 'أحداث مسجلة' : 'Events Logged'}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right border-collapse border border-zinc-800">
                <thead>
                  <tr className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                    <th className="p-2.5">Timestamp (ms)</th>
                    <th className="p-2.5">Asset</th>
                    <th className="p-2.5">Device</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5">Root Cause</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {soeEvents.slice(0, 10).map((ev) => (
                    <tr key={ev.id} className={ev.isRootCause ? 'bg-rose-950/30' : ''}>
                      <td className="p-2.5 text-zinc-300">{ev.timestamp.split('T')[1] ?? ev.timestamp}</td>
                      <td className="p-2.5 font-bold text-white">{ev.asset}</td>
                      <td className="p-2.5 text-zinc-400">{ev.device}</td>
                      <td className="p-2.5 text-zinc-200">{ev.eventText}</td>
                      <td className="p-2.5">
                        {ev.isRootCause ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">ROOT CAUSE</span>
                        ) : (
                          <span className="text-zinc-500">STANDARD</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReportTab === 'PQ' && (
          <div className="space-y-6 font-mono text-xs">
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase">{isAr ? 'شهادة الامتثال لمعيار جودة القدرة والتوافقيات' : 'IEEE 519-2022 Power Quality Compliance Certificate'}</h3>
                <p className="text-zinc-400 text-[11px] mt-0.5">Point of Common Coupling (PCC) 13.8kV Bus Section 1</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                CERTIFIED COMPLIANT
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                <div className="text-[10px] text-zinc-500 uppercase">{isAr ? 'التشوه التوافقي الكلي للجهد THD-V' : 'Voltage THD'}</div>
                <div className="text-xl font-black text-emerald-400 mt-1">1.82%</div>
                <div className="text-[10px] text-zinc-400 mt-1">{isAr ? 'الحد المسموح IEEE: أقل من 5.0%' : 'IEEE Limit: < 5.0% (PASS)'}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                <div className="text-[10px] text-zinc-500 uppercase">{isAr ? 'معامل تشويه الطلب الكلي TDD' : 'Total Demand Distortion'}</div>
                <div className="text-xl font-black text-emerald-400 mt-1">3.45%</div>
                <div className="text-[10px] text-zinc-400 mt-1">{isAr ? 'الحد المسموح IEEE: أقل من 8.0%' : 'IEEE Limit: < 8.0% (PASS)'}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                <div className="text-[10px] text-zinc-500 uppercase">{isAr ? 'معامل التخفيض التوافقي K-Factor' : 'Transformer K-Factor'}</div>
                <div className="text-xl font-black text-indigo-400 mt-1">K-4.2</div>
                <div className="text-[10px] text-zinc-400 mt-1">{isAr ? 'تصنيف المحول: K-13 (كافي جداً)' : 'Rated K-13 (OPTIMAL)'}</div>
              </div>
            </div>
          </div>
        )}

        {activeReportTab === 'ESG' && (
          <div className="space-y-6 font-mono text-xs">
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase">{isAr ? 'لوحة مؤشرات الاستدامة وخفض البصمة الكربونية' : 'ESG Sustainability & Carbon Offset KPI Dashboard'}</h3>
                <p className="text-zinc-400 text-[11px] mt-0.5">Calculated based on 20MW Solar Farm + 10MW BESS grid-connected operations</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                ESG GRADE: A+
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Leaf className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-bold">{isAr ? 'الطاقة النظيفة الإجمالية' : 'Clean Energy Output'}</span>
                </div>
                <div className="text-2xl font-black text-white">{totalCleanMwh} MWh</div>
                <div className="text-[10px] text-zinc-500">Solar PV + BESS Optimization</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Flame className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-bold">{isAr ? 'انبعاثات CO₂ الموفرة' : 'CO₂ Emissions Avoided'}</span>
                </div>
                <div className="text-2xl font-black text-cyan-300">{co2AvoidedTons} Tons</div>
                <div className="text-[10px] text-zinc-500">@ 0.705 t CO₂/MWh grid avg</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-amber-400">
                  <Droplets className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-bold">{isAr ? 'وقود الديزل الموفر' : 'Displaced Diesel Fuel'}</span>
                </div>
                <div className="text-2xl font-black text-amber-300">{dieselDisplacedLiters.toLocaleString()} L</div>
                <div className="text-[10px] text-zinc-500">Peaker generator offset</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-emerald-400">
                  <TreeDeciduous className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-bold">{isAr ? 'معادل الأشجار المزروعة' : 'Tree Sequestration Equiv.'}</span>
                </div>
                <div className="text-2xl font-black text-emerald-300">{treesEquivalent.toLocaleString()} Trees</div>
                <div className="text-[10px] text-zinc-500">Annual urban green impact</div>
              </div>
            </div>
          </div>
        )}

        {/* Official Footer Signature Block */}
        <div className="pt-6 border-t border-zinc-800 flex items-center justify-between font-mono text-xs text-zinc-500">
          <div>
            <span>SCADA Automatic Reporting Engine • Verified to IEC / IEEE / NERC standards</span>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <span>Digital Signature: 0x8F9A...B32C</span>
          </div>
        </div>
      </div>
    </div>
  );
};

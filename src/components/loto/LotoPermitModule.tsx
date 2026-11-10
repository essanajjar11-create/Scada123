import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  FileCheck2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Users,
  HardHat,
  Sliders,
  Sparkles,
  ClipboardList,
  Eye,
  XCircle
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { SwitchgearState } from '../../types/scada';

export const LotoPermitModule: React.FC = () => {
  const { lang, t, addAuditLog, currentUserRole, currentUserName, setMaintenanceMode, maintenanceMode } = useScada();
  const isAr = lang === 'ar';

  // Electronic PTW State
  const [permitNumber, setPermitNumber] = useState<string>('PTW-2026-0814');
  const [workArea, setWorkArea] = useState<string>('TR-1 Transformer Bay 132/13.8kV');
  const [jobDescription, setJobDescription] = useState<string>('Periodic Bushing C1/C2 Tan Delta Testing & OLTC Diverter Switch Inspection');
  const [leadEngineer, setLeadEngineer] = useState<string>('Eng. Tariq Al-Mansoor');
  const [safetyOfficer, setSafetyOfficer] = useState<string>('HSE Officer Salem Al-Harthi');
  const [permitStatus, setPermitStatus] = useState<'DRAFT' | 'ISSUED' | 'ISOLATED' | 'CLOSED'>('ISSUED');

  // Interactive 4-Step Isolation Sequence
  const [isolationSteps, setIsolationSteps] = useState({
    step1_cbTripped: true,        // Step 1: Trip 52-1 & 52-2 CB
    step2_isolatorsOpened: true,   // Step 2: Open 89-1 & 89-2 disconnectors
    step3_earthClosed: false,      // Step 3: Close Earth Switch ES-1
    step4_padlocked: false,        // Step 4: Apply Physical Padlock & Danger Tag
  });

  const [padlockKeyNumber, setPadlockKeyNumber] = useState<string>('LOCK-RED-4402');
  const [showInterlockWarning, setShowInterlockWarning] = useState<boolean>(false);

  // Check if fully isolated
  const isFullyIsolated = isolationSteps.step1_cbTripped &&
    isolationSteps.step2_isolatorsOpened &&
    isolationSteps.step3_earthClosed &&
    isolationSteps.step4_padlocked;

  // Toggle Isolation Steps
  const handleToggleStep = (stepKey: keyof typeof isolationSteps) => {
    const updated = { ...isolationSteps, [stepKey]: !isolationSteps[stepKey] };
    setIsolationSteps(updated);

    if (stepKey === 'step4_padlocked') {
      if (updated.step4_padlocked) {
        setPermitStatus('ISOLATED');
        setMaintenanceMode(true);
        addAuditLog('SECURITY', isAr ? `تم تفعيل قفل LOTO رقم ${padlockKeyNumber} وعزل خلية المحول TR-1 بنجاح` : `LOTO Padlock ${padlockKeyNumber} applied to TR-1 Bay. Maintenance mode active.`);
      } else {
        setPermitStatus('ISSUED');
        setMaintenanceMode(false);
        addAuditLog('SECURITY', isAr ? `تم فك قفل LOTO وإلغاء العزل لخلية TR-1` : `LOTO Padlock removed from TR-1 Bay.`);
      }
    }
  };

  // Attempt Illegal Close Action to demonstrate Safety Interlock
  const handleAttemptIllegalClose = () => {
    setShowInterlockWarning(true);
    addAuditLog('SECURITY', isAr ? 'محاولة إغلاق قاطع مرفوضة برمجياً وميكانيكياً بسبب وجود قفل LOTO نشط' : 'Illegal close command rejected by Safety Clearance Interlock.');
  };

  return (
    <div className="space-y-6 font-sans text-zinc-100">
      {/* Header Banner */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="p-3 bg-amber-950/80 border border-amber-600/80 rounded-xl text-amber-400 shrink-0">
            <Lock className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                {isAr ? 'نظام تصاريح العمل والعزل الآمن (LOTO & Permit To Work)' : 'Lockout/Tagout (LOTO) & Permit To Work'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-700 text-amber-300 text-[10px] font-mono font-extrabold">
                OSHA 1910.147 / NFPA 70E
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {isAr
                ? 'إصدار تصاريح العمل الإلكترونية PTW، خطوات العزل الميداني الأربع، تطبيق أقفال السلامة وبطاقات التحذير، وتأمين فرق الصيانة'
                : 'Digital PTW clearance, 4-step electrical isolation sequence, physical padlocking, and crew safety interlocks.'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold ${
            isFullyIsolated
              ? 'bg-rose-950 border-rose-700 text-rose-300 animate-pulse'
              : 'bg-emerald-950 border-emerald-700 text-emerald-300'
          }`}>
            {isFullyIsolated ? <Lock className="w-4 h-4 text-rose-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
            <span>{isFullyIsolated ? (isAr ? 'الخلية معزولة بقفل LOTO' : 'LOTO ISOLATION ACTIVE') : (isAr ? 'الخلية في الخدمة العادية' : 'NORMAL SERVICE')}</span>
          </div>
        </div>
      </div>

      {/* Safety Interlock Modal Warning */}
      {showInterlockWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-950 border-2 border-rose-600 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-rose-950 border border-rose-700 mx-auto flex items-center justify-center text-rose-400 animate-bounce">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-rose-400 uppercase">
              {isAr ? 'تم رفض أمر التوصيل! (LOTO INTERLOCK BLOCKED)' : 'SAFETY CLEARANCE INTERLOCK ACTIVATED!'}
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed font-mono">
              {isAr
                ? `لا يمكن تنفيذ أي أوامر تحكم عن بعد أو إغلاق قواطع! توجد فرق صيانة مسجلة ميدانياً بتصريح (${permitNumber}) مع قفل أمان (${padlockKeyNumber}).`
                : `SCADA Remote Close command blocked! Field crew is actively working under Permit (${permitNumber}) with physical Master Lock (${padlockKeyNumber}).`}
            </p>
            <button
              onClick={() => setShowInterlockWarning(false)}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition cursor-pointer"
            >
              {isAr ? 'فهمت وتأكيد شروط السلامة' : 'Acknowledge Safety Interlock'}
            </button>
          </div>
        </div>
      )}

      {/* Main Layout: Electronic PTW Document (Left 1 Col) + 4-Step Isolation Sequence (Right 2 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Electronic Permit Form */}
        <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <FileCheck2 className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white uppercase text-sm">
                {isAr ? 'تصريح العمل الإلكتروني PTW' : 'Digital Permit To Work (PTW)'}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-700 text-amber-300 font-bold">
              {permitNumber}
            </span>
          </div>

          {/* PTW Fields */}
          <div className="space-y-3">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase">{isAr ? 'منطقة العمل والعزل' : 'Work Area / Equipment'}:</span>
              <input
                type="text"
                value={workArea}
                onChange={(e) => setWorkArea(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 mt-1"
              />
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 uppercase">{isAr ? 'وصف طبيعة العمل المطلوب' : 'Job Scope Description'}:</span>
              <textarea
                rows={2}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase">{isAr ? 'مهندس الصيانة المسؤول' : 'Lead Maintenance Eng.'}:</span>
                <input
                  type="text"
                  value={leadEngineer}
                  onChange={(e) => setLeadEngineer(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-amber-500 mt-1"
                />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase">{isAr ? 'ضابط السلامة والصحة HSE' : 'HSE Safety Officer'}:</span>
                <input
                  type="text"
                  value={safetyOfficer}
                  onChange={(e) => setSafetyOfficer(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-amber-500 mt-1"
                />
              </div>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 uppercase">{isAr ? 'رقم القفل الفيزيائي Master Lock' : 'Padlock Tag Serial'}:</span>
              <input
                type="text"
                value={padlockKeyNumber}
                onChange={(e) => setPadlockKeyNumber(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-rose-400 font-bold focus:outline-none focus:border-rose-500 mt-1"
              />
            </div>
          </div>

          {/* Test Interlock Button */}
          <div className="pt-3 border-t border-zinc-800/80">
            <button
              onClick={handleAttemptIllegalClose}
              className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-700 text-zinc-300 hover:text-rose-300 font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              {isAr ? 'اختبار محاولة توصيل غير مصرح (Interlock Test)' : 'Test Illegal Remote Reclose'}
            </button>
          </div>
        </div>

        {/* Right 2 Columns: 4-Step Interactive Isolation Sequence */}
        <div className="lg:col-span-2 bg-[#09090b] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <HardHat className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white uppercase text-sm">
                {isAr ? 'خطوات العزل الميداني الأربع (4-Step Isolation Sequence)' : '4-Step Electrical Isolation Workflow'}
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
              OSHA ZERO ENERGY STATE
            </span>
          </div>

          {/* Steps List */}
          <div className="space-y-4 font-mono text-xs">
            {/* Step 1 */}
            <div className={`p-4 rounded-xl border transition flex items-center justify-between ${
              isolationSteps.step1_cbTripped ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300' : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center font-bold text-white">
                  1
                </div>
                <div>
                  <div className="font-bold text-white text-sm">
                    {isAr ? 'فصل قواطع الدورة الرئيسية 52-1 و 52-2 (Circuit Breakers Open & Racked Out)' : 'Open & Rack-Out Circuit Breakers 52-1 & 52-2'}
                  </div>
                  <p className="text-zinc-500 text-[11px] mt-0.5">
                    {isAr ? 'قطع التيار وسحب شاحن زنبرك التشغيل' : 'Interrupts load current and discharges operating spring mechanism.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggleStep('step1_cbTripped')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  isolationSteps.step1_cbTripped ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {isolationSteps.step1_cbTripped ? (isAr ? '✓ مفصول' : '✓ OPENED') : (isAr ? 'فصل القاطع' : 'OPEN CB')}
              </button>
            </div>

            {/* Step 2 */}
            <div className={`p-4 rounded-xl border transition flex items-center justify-between ${
              isolationSteps.step2_isolatorsOpened ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300' : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center font-bold text-white">
                  2
                </div>
                <div>
                  <div className="font-bold text-white text-sm">
                    {isAr ? 'فتح سكاكين الفصل والتحقق البصري من الفجوة الهوائية (Open Disconnectors 89-1 / 89-2)' : 'Open Disconnectors 89-1 & 89-2 with Visual Gap Verification'}
                  </div>
                  <p className="text-zinc-500 text-[11px] mt-0.5">
                    {isAr ? 'إنشاء عزل ميكانيكي مرئي يمنع تفريغ القوس الكهربائي' : 'Establishes visible air break isolation complying with IEC 62271.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggleStep('step2_isolatorsOpened')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  isolationSteps.step2_isolatorsOpened ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {isolationSteps.step2_isolatorsOpened ? (isAr ? '✓ مفصول' : '✓ OPENED') : (isAr ? 'فتح السكاكين' : 'OPEN ISOLATOR')}
              </button>
            </div>

            {/* Step 3 */}
            <div className={`p-4 rounded-xl border transition flex items-center justify-between ${
              isolationSteps.step3_earthClosed ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300' : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center font-bold text-white">
                  3
                </div>
                <div>
                  <div className="font-bold text-white text-sm">
                    {isAr ? 'إغلاق سكاكين التأريض الوقائي ES-1 لتفريغ الشحنات (Close Earth Switch ES-1)' : 'Close Earth Switch ES-1 for Capacitive Residual Discharge'}
                  </div>
                  <p className="text-zinc-500 text-[11px] mt-0.5">
                    {isAr ? 'تأريض القضبان والأطوار لحماية العاملين من الجهد الحثي المتردد' : 'Grounds the isolated busbar to prevent induced voltage buildup.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggleStep('step3_earthClosed')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  isolationSteps.step3_earthClosed ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {isolationSteps.step3_earthClosed ? (isAr ? '✓ مؤرض' : '✓ GROUNDED') : (isAr ? 'إغلاق التأريض' : 'CLOSE EARTH')}
              </button>
            </div>

            {/* Step 4 */}
            <div className={`p-4 rounded-xl border transition flex items-center justify-between ${
              isolationSteps.step4_padlocked ? 'bg-rose-950/50 border-rose-600 text-rose-300 ring-2 ring-rose-500/40' : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-950 border border-rose-700 flex items-center justify-center font-bold text-rose-300">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">
                    {isAr ? 'تثبيت قفل السلامة الفيزيائي Master Lock وبطاقة التحذير (Apply Physical Padlock & Danger Tag)' : 'Attach Physical Safety Padlock & Danger Warning Tag'}
                  </div>
                  <p className="text-zinc-500 text-[11px] mt-0.5">
                    {isAr ? `بطاقة: (خطر! رجال يعملون على الخط) - القفل رقم: ${padlockKeyNumber}` : `Tag: "DANGER - DO NOT OPERATE" • Lock Serial: ${padlockKeyNumber}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggleStep('step4_padlocked')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  isolationSteps.step4_padlocked ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {isolationSteps.step4_padlocked ? (isAr ? '🔒 مقفل بـ LOTO' : '🔒 LOCKED') : (isAr ? 'تثبيت القفل' : 'APPLY LOTO')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

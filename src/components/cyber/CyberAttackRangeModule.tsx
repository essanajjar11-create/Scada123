import React, { useState, useEffect } from 'react';
import { useScada } from '../../context/ScadaContext';
import {
  ShieldAlert,
  ShieldCheck,
  Radio,
  Clock,
  Cpu,
  Zap,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Terminal
} from 'lucide-react';

export const CyberAttackRangeModule: React.FC = () => {
  const { addAuditLog, t, lang } = useScada();
  const isAr = lang === 'ar';

  // Attack States
  const [gooseSpoofingActive, setGooseSpoofingActive] = useState<boolean>(false);
  const [fdiActive, setFdiActive] = useState<boolean>(false);
  const [ptpDriftActive, setPtpDriftActive] = useState<boolean>(false);

  // Defense Inspection Telemetry
  const [gooseStNum, setGooseStNum] = useState<number>(1042);
  const [pinnResidual, setPinnResidual] = useState<number>(0.012); // ||z - h(x)||
  const [ptpOffsetNs, setPtpOffsetNs] = useState<number>(42); // nanoseconds offset
  const [logs, setLogs] = useState<Array<{ time: string; type: 'ATTACK' | 'DEFENSE' | 'INFO'; msg: string }>>([
    {
      time: new Date().toLocaleTimeString(),
      type: 'INFO',
      msg: isAr
        ? 'ميدان اختبار الأمن السيبراني لأنظمة التحكم OT/ICS جاهز • مراقبة IEC 61850، ومقدر الحالة PINN، ومزامنة PTP IEEE 1588'
        : 'OT/ICS Cyber Security Range Ready • Monitoring IEC 61850, PINN State Estimator & PTP IEEE 1588'
    }
  ]);

  const addRangeLog = (type: 'ATTACK' | 'DEFENSE' | 'INFO', msg: string) => {
    setLogs((prev) => [{ time: new Date().toLocaleTimeString(), type, msg }, ...prev.slice(0, 15)]);
  };

  // 1. GOOSE Spoofing Attack Handler
  const toggleGooseSpoofing = () => {
    if (!gooseSpoofingActive) {
      setGooseSpoofingActive(true);
      setGooseStNum((prev) => prev + 150); // Out-of-order StNum jump!
      addRangeLog(
        'ATTACK',
        isAr
          ? 'حقن هجوم انتحال GOOSE: حزمة فصل خبيثة (MAC: 01-0C-CD-01-00-01، قفزة في رقم الحالة StNum=1192)'
          : 'INJECTED GOOSE SPOOFING: Malicious Trip Packet (MAC: 01-0C-CD-01-00-01, Jumped StNum=1192)'
      );
      addAuditLog('CYBER_ATTACK', 'GOOSE Spoofing Attack Triggered');

      // Defense reaction after 600ms
      setTimeout(() => {
        addRangeLog(
          'DEFENSE',
          isAr
            ? 'اكتشاف دفاع GOOSE: انقطاع في تسلسل StNum وتوقيع غير صالح لمجموعة البيانات! تم إسقاط الحزمة بنجاح.'
            : 'GOOSE DEFENSE DETECTED: Discontinuity in StNum Sequence & Invalid Dataset Signature! Packet DROPPED.'
        );
      }, 600);
    } else {
      setGooseSpoofingActive(false);
      addRangeLog(
        'INFO',
        isAr ? 'إيقاف هجوم انتحال GOOSE. تمت إعادة مزامنة التسلسل بنجاح.' : 'GOOSE Spoofing Attack Stopped. Sequence Re-synchronized.'
      );
    }
  };

  // 2. False Data Injection (FDI) Handler
  const toggleFdi = () => {
    if (!fdiActive) {
      setFdiActive(true);
      setPinnResidual(4.82); // High state estimator residual!
      addRangeLog(
        'ATTACK',
        isAr
          ? 'حقن بيانات كاذبة (FDI): تزييف جهد 132kV بقيمة انحراف وهمية (+28kV Fake Offset)'
          : 'INJECTED FALSE DATA INJECTION (FDI): Corrupted 132kV Voltage (+28kV Fake Offset)'
      );
      addAuditLog('CYBER_ATTACK', 'FDI Telemetry Attack Triggered');

      setTimeout(() => {
        addRangeLog(
          'DEFENSE',
          isAr
            ? 'مرشح مقدر الحالة القائم على القوانين الفيزيائية (PINN): البواقي ||z - h(x)|| = 4.82 تجاوزت عتبة 0.15. تم عزل الحساس المصاب.'
            : 'PINN STATE ESTIMATOR FILTER: Residual ||z - h(x)|| = 4.82 exceeds tau = 0.15 threshold. Corrupted sensor ISOLATED.'
        );
      }, 700);
    } else {
      setFdiActive(false);
      setPinnResidual(0.014);
      addRangeLog(
        'INFO',
        isAr
          ? 'تم إنهاء هجوم حقن البيانات الكاذبة FDI. عودة مقدر الحالة الفيزيائي للوضع الاسمي الطبيعي.'
          : 'FDI Attack Cleared. Physics-Informed State Estimator Nominal.'
      );
    }
  };

  // 3. PTP Clock Drift Attack Handler
  const togglePtpDrift = () => {
    if (!ptpDriftActive) {
      setPtpDriftActive(true);
      addRangeLog(
        'ATTACK',
        isAr
          ? 'حقن هجوم انحراف ساعة PTP: التلاعب بإزاحة الساعة الرئيسية (+125,000 µs/s)'
          : 'INJECTED PTP CLOCK DRIFT ATTACK: Grandmaster Offset Manipulated (+125,000 µs/s)'
      );
      addAuditLog('CYBER_ATTACK', 'PTP Clock Hijack Triggered');

      setTimeout(() => {
        addRangeLog(
          'DEFENSE',
          isAr
            ? 'مراقب جودة توقيت IEEE 1588 PTP: تدهور مؤشر جودة الطور التزامني. تم التحويل الاحتياطي لساعة OCXO الذرية الداخلية.'
            : 'IEEE 1588 PTP TIME QUALITY MONITOR: Synchrophasor Quality Flag degraded. Switched to Internal Atomic OCXO Clock.'
        );
      }, 800);
    } else {
      setPtpDriftActive(false);
      setPtpOffsetNs(42);
      addRangeLog(
        'INFO',
        isAr
          ? 'تم إنهاء انحراف ساعة PTP. إعادة الإغلاق على ساعة IEEE 1588 Grandmaster.'
          : 'PTP Clock Drift Cleared. Locked back to IEEE 1588 Grandmaster.'
      );
    }
  };

  // Animate PTP Offset when attack active
  useEffect(() => {
    if (!ptpDriftActive) return;
    const interval = setInterval(() => {
      setPtpOffsetNs((prev) => prev + Math.floor(Math.random() * 50000 + 20000));
    }, 500);
    return () => clearInterval(interval);
  }, [ptpDriftActive]);

  return (
    <div className="space-y-6 font-sans text-zinc-100">
      {/* Header Banner */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="p-3 bg-rose-950/80 border border-rose-700/80 rounded-xl text-rose-400 shrink-0">
            <ShieldAlert className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-mono tracking-wide">
                {t('cyber_title')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-700 text-rose-300 text-[10px] font-mono font-extrabold">
                {t('cyber_hardened')}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {t('cyber_subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setGooseSpoofingActive(false);
            setFdiActive(false);
            setPtpDriftActive(false);
            setPinnResidual(0.012);
            setPtpOffsetNs(42);
            addRangeLog('INFO', isAr ? 'إعادة تعيين جميع الهجمات السيبرانية إلى الحالة الأساسية الاسمية' : 'Reset All OT Cyber Attacks to Nominal Baseline');
          }}
          className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white font-mono text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t('cyber_reset_btn')}</span>
        </button>
      </div>

      {/* Main 3 Attack Vector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
        {/* Vector 1: GOOSE Spoofing */}
        <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Radio className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase">{t('cyber_v1_title')}</h3>
              </div>
              <span className="text-[10px] text-zinc-500 font-bold">IEC 61850-8-1</span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {t('cyber_v1_desc')}
            </p>

            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>{t('cyber_v1_stnum')}</span>
                <span className={`font-bold ${gooseSpoofingActive ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                  {gooseStNum} {gooseSpoofingActive ? (isAr ? '[قفزة غير متسلسلة]' : '[JUMP DISCONTINUITY]') : (isAr ? '[سليم]' : '[OK]')}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>{t('cyber_v1_defense')}</span>
                <span className="text-white font-bold">
                  {gooseSpoofingActive ? (isAr ? 'تم رفض الحزمة' : 'PACKET REJECTED') : (isAr ? 'قيد المراقبة' : 'MONITORING')}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={toggleGooseSpoofing}
            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 rtl:space-x-reverse transition-all cursor-pointer shadow-lg ${
              gooseSpoofingActive
                ? 'bg-rose-600 text-white hover:bg-rose-500 animate-pulse'
                : 'bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{gooseSpoofingActive ? t('cyber_v1_stop') : t('cyber_v1_inject')}</span>
          </button>
        </div>

        {/* Vector 2: False Data Injection (FDI) */}
        <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Cpu className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase">{t('cyber_v2_title')}</h3>
              </div>
              <span className="text-[10px] text-zinc-500 font-bold font-mono">PINN FILTER</span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {t('cyber_v2_desc')}
            </p>

            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>{t('cyber_v2_residual')}</span>
                <span className={`font-bold ${fdiActive ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                  {pinnResidual.toFixed(3)} {fdiActive ? (isAr ? '[شذوذ > 0.15]' : '[ANOMALY > 0.15]') : (isAr ? '[مطابق]' : '[PASS]')}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>{t('cyber_v2_sanitization')}</span>
                <span className="text-white font-bold">
                  {fdiActive ? (isAr ? 'عزل عبر PINN' : 'PINN ISOLATED') : (isAr ? 'تم التحقق' : 'VALIDATED')}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={toggleFdi}
            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 rtl:space-x-reverse transition-all cursor-pointer shadow-lg ${
              fdiActive
                ? 'bg-rose-600 text-white hover:bg-rose-500 animate-pulse'
                : 'bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{fdiActive ? t('cyber_v2_stop') : t('cyber_v2_inject')}</span>
          </button>
        </div>

        {/* Vector 3: PTP Clock Drift Attack */}
        <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Clock className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase">{t('cyber_v3_title')}</h3>
              </div>
              <span className="text-[10px] text-zinc-500 font-bold">IEEE 1588</span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {t('cyber_v3_desc')}
            </p>

            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>{t('cyber_v3_offset')}</span>
                <span className={`font-bold ${ptpDriftActive ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                  {(ptpOffsetNs / 1000).toFixed(1)} µs {ptpDriftActive ? (isAr ? '[مخترق]' : '[HIJACKED]') : (isAr ? '[مقفل <1µs]' : '[LOCKED <1µs]')}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>{t('cyber_v3_source')}</span>
                <span className="text-white font-bold">
                  {ptpDriftActive ? (isAr ? 'احتياطي ساعة OCXO الذرية' : 'ATOMIC OCXO FALLBACK') : (isAr ? 'ساعة PTP الرئيسية' : 'PTP GRANDMASTER')}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={togglePtpDrift}
            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 rtl:space-x-reverse transition-all cursor-pointer shadow-lg ${
              ptpDriftActive
                ? 'bg-rose-600 text-white hover:bg-rose-500 animate-pulse'
                : 'bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{ptpDriftActive ? t('cyber_v3_stop') : t('cyber_v3_inject')}</span>
          </button>
        </div>
      </div>

      {/* Cyber Range Terminal Log Inspector */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-2xl font-mono">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase">
              {isAr ? 'وحدة سجلات أحداث الأمن السيبراني لأنظمة التحكم OT' : 'OT Cyber Range Security Event Console'}
            </h3>
          </div>
          <span className="text-[10px] text-zinc-500">IEEE 61850 / NERC CIP LOG STREAM</span>
        </div>

        <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800/80 h-48 overflow-y-auto space-y-2 text-xs">
          {logs.map((log, i) => (
            <div key={i} className="flex items-start space-x-3 rtl:space-x-reverse text-[11px] font-mono leading-relaxed border-b border-zinc-900/80 pb-1">
              <span className="text-zinc-500 font-bold shrink-0">{log.time}</span>
              <span className={`px-1.5 py-0.2 rounded font-extrabold text-[9px] uppercase shrink-0 ${
                log.type === 'ATTACK'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : log.type === 'DEFENSE'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {log.type === 'ATTACK' ? (isAr ? 'هجوم' : 'ATTACK') : log.type === 'DEFENSE' ? (isAr ? 'دفاع' : 'DEFENSE') : (isAr ? 'معلومات' : 'INFO')}
              </span>
              <span className={log.type === 'ATTACK' ? 'text-rose-300' : log.type === 'DEFENSE' ? 'text-emerald-300' : 'text-zinc-300'}>
                {log.msg}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

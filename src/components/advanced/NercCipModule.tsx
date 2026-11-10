import React, { useState } from 'react';
import { Lock, ShieldCheck, ShieldAlert, Key, Server, AlertTriangle, FileCode } from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

interface SecurityEvent {
  id: string;
  time: string;
  type: string;
  sourceIp: string;
  desc: { en: string; ar: string };
  severity: 'high' | 'medium' | 'info';
}

export const NercCipModule: React.FC = () => {
  const { lang } = useScada();
  const isAr = lang === 'ar';

  const [securityLogs] = useState<SecurityEvent[]>([
    {
      id: 'sec-101',
      time: new Date().toLocaleTimeString(),
      type: 'CIP-007 SIEM Audit',
      sourceIp: '192.168.10.42 (HMI Station)',
      desc: {
        en: 'DNP3-SA v5 Session Re-Authentication Succeeded (Key Exchange 2048-bit)',
        ar: 'نجاح إعادة المصادقة لجلسة DNP3-SA v5 (تبادل مفاتيح 2048-bit)',
      },
      severity: 'info',
    },
    {
      id: 'sec-102',
      time: new Date(Date.now() - 300000).toLocaleTimeString(),
      type: 'CIP-005 Perimeter Firewall',
      sourceIp: '10.200.4.18 (External IP)',
      desc: {
        en: 'BLOCKED Unauthorized Inbound SSH Port 22 Connection Attempt',
        ar: 'تم حظر محاولة اتصال SSH واردة غير مصرح بها على المنفذ 22',
      },
      severity: 'high',
    },
    {
      id: 'sec-103',
      time: new Date(Date.now() - 900000).toLocaleTimeString(),
      type: 'CIP-010 Config Tamper',
      sourceIp: 'RTU-01 Controller',
      desc: {
        en: 'Logic Baseline Checksum Verification Matches Signed Certificate',
        ar: 'مطابقة البصمة الرقمية للبرمجيات مع الشهادة الرقمية المعتمدة بنجاح',
      },
      severity: 'info',
    },
  ]);

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-2.5 bg-purple-950/80 border border-purple-700/60 rounded-lg text-purple-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-tight">
              {isAr
                ? 'لوحة الأمن السيبراني والتدقيق الأمني لمعايير NERC CIP & SIEM'
                : 'NERC CIP Cyber Security & SIEM Audit Dashboard'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'معايير حماية البنية التحتية الحرجة (مطابقة CIP-005 و CIP-007 و CIP-010)'
                : 'Critical Infrastructure Protection Standards (CIP-005, CIP-007, CIP-010 Compliance)'}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 bg-emerald-950 border border-emerald-700 text-emerald-400 font-bold text-xs rounded-full flex items-center space-x-1.5 rtl:space-x-reverse font-mono">
          <ShieldCheck className="w-4 h-4" />
          <span>{isAr ? 'اجتياز تدقيق NERC CIP بنجاح' : 'NERC CIP AUDIT PASSED'}</span>
        </span>
      </div>

      {/* 3 Core Compliance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CIP-005 Perimeter */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase text-purple-400 flex items-center space-x-2 rtl:space-x-reverse">
              <Server className="w-4 h-4" />
              <span>{isAr ? 'محيط الحماية CIP-005' : 'CIP-005 Security Perimeter'}</span>
            </h4>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-bold font-mono">
              {isAr ? 'مشفّر' : 'ENCRYPTED'}
            </span>
          </div>
          <div className="space-y-1 text-xs text-slate-300">
            <p className="flex justify-between">
              <span>{isAr ? 'نفق IPsec VPN:' : 'IPsec VPN Tunnel:'}</span>
              <strong className="text-emerald-400 font-mono">AES-256 ACTIVE</strong>
            </p>
            <p className="flex justify-between">
              <span>{isAr ? 'المصادقة الآمنة DNP3:' : 'DNP3 Secure Auth:'}</span>
              <strong className="text-purple-300 font-mono">DNP3-SA v5</strong>
            </p>
            <p className="flex justify-between">
              <span>{isAr ? 'جدار الحماية المحيطي:' : 'Perimeter Firewall:'}</span>
              <strong className="text-emerald-400 font-mono">STRICT REJECT</strong>
            </p>
          </div>
        </div>

        {/* CIP-007 SIEM Log */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase text-cyan-400 flex items-center space-x-2 rtl:space-x-reverse">
              <Key className="w-4 h-4" />
              <span>{isAr ? 'سجلات المراقبة CIP-007 SIEM' : 'CIP-007 Systems & Log SIEM'}</span>
            </h4>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded font-bold font-mono">
              {isAr ? 'مراقبة نشطة' : 'MONITORING'}
            </span>
          </div>
          <div className="space-y-1 text-xs text-slate-300">
            <p className="flex justify-between">
              <span>{isAr ? 'محاولات الدخول الفاشلة (24س):' : 'Failed Logins (24h):'}</span>
              <strong className="text-emerald-400 font-mono">{isAr ? '0 محاولات' : '0 Attempts'}</strong>
            </p>
            <p className="flex justify-between">
              <span>{isAr ? 'عناوين MAC غير معروفة:' : 'Unrecognized MACs:'}</span>
              <strong className="text-emerald-400 font-mono">{isAr ? '0 مكتشفة' : '0 Detected'}</strong>
            </p>
            <p className="flex justify-between">
              <span>{isAr ? 'حالة المنافذ غير المصرحة:' : 'Rogue Ports Status:'}</span>
              <strong className="text-emerald-400 font-mono">{isAr ? 'مغلقة بالكامل' : 'ALL LOCKED'}</strong>
            </p>
          </div>
        </div>

        {/* CIP-010 Config Tamper */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase text-amber-400 flex items-center space-x-2 rtl:space-x-reverse">
              <FileCode className="w-4 h-4" />
              <span>{isAr ? 'سلامة البرمجيات CIP-010' : 'CIP-010 Config Baseline'}</span>
            </h4>
            <span className="text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded font-bold font-mono">
              {isAr ? 'متحقق منه' : 'VERIFIED'}
            </span>
          </div>
          <div className="space-y-1 text-xs text-slate-300">
            <p className="flex justify-between">
              <span>{isAr ? 'بصمة برنامج RTU الأساسي:' : 'RTU Firmware Hash:'}</span>
              <strong className="text-slate-200 font-mono">MATCH (v4.2.1)</strong>
            </p>
            <p className="flex justify-between">
              <span>{isAr ? 'بصمة منطق الحماية:' : 'Protection Logic Hash:'}</span>
              <strong className="text-slate-200 font-mono">{isAr ? 'لم تُعدل' : 'UNMODIFIED'}</strong>
            </p>
            <p className="flex justify-between">
              <span>{isAr ? 'حساس العبث الفيزيائي:' : 'Tamper Sensor Loop:'}</span>
              <strong className="text-emerald-400 font-mono">{isAr ? 'سليم' : 'INTACT'}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* SIEM Security Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <h4 className="text-xs font-bold uppercase text-slate-200 flex items-center space-x-2 rtl:space-x-reverse">
          <ShieldAlert className="w-4 h-4 text-purple-400" />
          <span>{isAr ? 'سجل التدقيق الأمني الفوري SIEM' : 'Real-time SIEM Security Audit Logs'}</span>
        </h4>

        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs font-sans">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 text-[10px] bg-slate-900/60">
                <th className="p-2.5">{isAr ? 'الوقت' : 'Time'}</th>
                <th className="p-2.5">{isAr ? 'التصنيف' : 'Category'}</th>
                <th className="p-2.5">{isAr ? 'عنوان IP / الجهاز المصدر' : 'Source IP / Node'}</th>
                <th className="p-2.5">{isAr ? 'تفاصيل التدقيق' : 'Audit Description'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {securityLogs.map((log) => (
                <tr key={log.id} className="text-slate-300">
                  <td className="p-2.5 text-slate-400 font-mono">{log.time}</td>
                  <td className="p-2.5 text-purple-400 font-bold font-mono">{log.type}</td>
                  <td className="p-2.5 text-slate-200 font-mono">{log.sourceIp}</td>
                  <td className="p-2.5 flex items-center space-x-2 rtl:space-x-reverse">
                    {log.severity === 'high' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    <span className={log.severity === 'high' ? 'text-rose-300 font-bold' : 'text-slate-300'}>
                      {log.desc[isAr ? 'ar' : 'en']}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

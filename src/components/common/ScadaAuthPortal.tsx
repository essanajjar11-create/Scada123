import React, { useState } from 'react';
import { useScada } from '../../context/ScadaContext';
import { UserRole } from '../../types/scada';
import { Shield, Key, Lock, Radio, Activity, AlertTriangle, Volume2, CheckCircle2 } from 'lucide-react';

interface ScadaAuthPortalProps {
  onInitialize: () => void;
}

export const ScadaAuthPortal: React.FC<ScadaAuthPortalProps> = ({ onInitialize }) => {
  const { rbacLogin, initializeAudioContext, t, lang, setLang } = useScada();
  const [selectedRole, setSelectedRole] = useState<UserRole>('operator');
  const [operatorName, setOperatorName] = useState<string>('Grid Operator');
  const [passcode, setPasscode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg('');
    if (role === 'engineer') {
      setOperatorName('Eng. Essa Najjar');
      setPasscode('engineer123');
    } else if (role === 'manager') {
      setOperatorName('Eng. Haedara Deeb');
      setPasscode('manager123');
    } else {
      setOperatorName('Grid Operator');
      setPasscode('');
    }
  };

  const handleInitialize = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Trigger Web Audio API initialization synchronously on user click gesture
    initializeAudioContext();

    if (selectedRole === 'engineer') {
      if (passcode !== 'engineer123') {
        setErrorMsg(lang === 'ar' ? 'رمز الأمان غير صالح لمهندس النظم' : 'Invalid Security Passcode for Systems Engineer');
        return;
      }
    } else if (selectedRole === 'manager') {
      if (passcode !== 'manager123') {
        setErrorMsg(lang === 'ar' ? 'رمز الأمان غير صالح لمدير المحطة' : 'Invalid Security Passcode for Substation Manager');
        return;
      }
    }

    const nameToUse = operatorName.trim() || (selectedRole === 'engineer' ? 'Eng. Essa Najjar' : selectedRole === 'manager' ? 'Eng. Haedara Deeb' : 'Grid Operator');
    const success = rbacLogin(selectedRole, passcode, nameToUse);
    if (success) {
      onInitialize();
    } else {
      setErrorMsg(lang === 'ar' ? `رمز الأمان غير صالح لـ ${selectedRole === 'engineer' ? 'مهندس النظم' : 'مدير المحطة'}` : `Invalid Security Passcode for ${selectedRole === 'engineer' ? 'Systems Engineer' : 'Substation Manager'}`);
    }
  };

  return (
    <div
      id="scada-auth-portal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div className="w-full max-w-xl bg-[#09090b] border border-zinc-800 rounded-2xl shadow-[0_0_50px_rgba(79,70,229,0.25)] p-6 md:p-8 relative overflow-hidden font-sans">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header / Substation Identifier */}
        <div className="flex items-start justify-between border-b border-zinc-800/80 pb-5 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-950/80 border border-indigo-700/60 rounded-xl text-indigo-400 shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold tracking-tight text-white uppercase font-mono">
                  {lang === 'ar' ? 'بوابة صلاحيات وتشغيل SCADA' : 'SCADA Gate Authorization'}
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> RTU-01
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {lang === 'ar' ? 'عقدة محطة التحويل 132/13.8 ك.ف • بوابة القياسات والإنذارات ISA-18.2' : '132/13.8kV Substation Node • ISA-18.2 Telemetry Gateway'}
              </p>
            </div>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-full p-1 text-xs">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                lang === 'en' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('ar')}
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                lang === 'ar' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              عربي
            </button>
          </div>
        </div>

        {/* Portal Form */}
        <form onSubmit={handleInitialize} className="space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-xs font-mono font-bold text-zinc-400 mb-3 uppercase tracking-wider">
              {lang === 'ar' ? 'حدد مستوى صلاحية المشغل / المهندس:' : 'Select Operator Clearance Level:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Field Operator (Default) */}
              <button
                type="button"
                onClick={() => handleRoleSelect('operator')}
                className={`p-3.5 rounded-xl border text-left rtl:text-right transition-all cursor-pointer relative ${
                  selectedRole === 'operator'
                    ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs capitalize text-indigo-300">
                    {lang === 'ar' ? 'مشغل محطة (ميداني)' : 'Field Operator'}
                  </span>
                  {selectedRole === 'operator' && <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />}
                </div>
                <span className="text-[10px] text-zinc-400 block leading-tight">
                  {lang === 'ar' ? 'قراءة القياسات ومراقبة الإنذارات فقط' : 'Read-Only Telemetry & Alarm Monitoring'}
                </span>
                <div className="mt-2 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-1.5 py-0.5 rounded w-max">
                  {lang === 'ar' ? 'بدون كلمة مرور' : 'NO PASSWORD REQUIRED'}
                </div>
              </button>

              {/* Systems Engineer */}
              <button
                type="button"
                onClick={() => handleRoleSelect('engineer')}
                className={`p-3.5 rounded-xl border text-left rtl:text-right transition-all cursor-pointer relative ${
                  selectedRole === 'engineer'
                    ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs capitalize text-cyan-300">
                    {lang === 'ar' ? 'مهندس نظم وقواطع' : 'Systems Engineer'}
                  </span>
                  {selectedRole === 'engineer' && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                </div>
                <span className="text-[10px] text-zinc-400 block leading-tight">
                  {lang === 'ar' ? 'التحكم بالقواطع، المحاكاة وتعديل الأوضاع' : 'Switchgear Control, Overrides & Faults'}
                </span>
                <div className="mt-2 text-[9px] font-mono text-amber-400 bg-amber-950/80 border border-amber-800/50 px-1.5 py-0.5 rounded w-max">
                  {lang === 'ar' ? 'يتطلب كلمة مرور' : 'PASSWORD REQUIRED'}
                </div>
              </button>

              {/* Substation Manager */}
              <button
                type="button"
                onClick={() => handleRoleSelect('manager')}
                className={`p-3.5 rounded-xl border text-left rtl:text-right transition-all cursor-pointer relative ${
                  selectedRole === 'manager'
                    ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs capitalize text-purple-300">
                    {lang === 'ar' ? 'مدير المحطة والشبكة' : 'Substation Manager'}
                  </span>
                  {selectedRole === 'manager' && <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />}
                </div>
                <span className="text-[10px] text-zinc-400 block leading-tight">
                  {lang === 'ar' ? 'صلاحيات إدارية كاملة وضبط الحدود والتقارير' : 'Full System Admin & Threshold Tuning'}
                </span>
                <div className="mt-2 text-[9px] font-mono text-purple-400 bg-purple-950/80 border border-purple-800/50 px-1.5 py-0.5 rounded w-max">
                  {lang === 'ar' ? 'يتطلب كلمة مرور' : 'PASSWORD REQUIRED'}
                </div>
              </button>
            </div>
          </div>

          {/* Operator Display Name Input */}
          <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1.5">
            <label className="text-xs font-mono font-bold text-zinc-300 flex items-center justify-between">
              <span>{lang === 'ar' ? 'اسم المشغل أو معرف محطة العمل:' : 'Operator Workstation Identifier / Name:'}</span>
              <span className="text-[10px] text-zinc-500 font-normal">{lang === 'ar' ? 'للتزامن عبر الشبكة والمشغلين' : 'Broadcasting in Multi-User Sync'}</span>
            </label>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder={lang === 'ar' ? 'أدخل اسم المشغل أو المهندس...' : 'Enter operator name...'}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 font-mono shadow-inner"
            />
          </div>

          {/* Password Field when privileged role is selected */}
          {selectedRole !== 'operator' && (
            <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {lang === 'ar'
                      ? `رمز الأمان (${selectedRole === 'engineer' ? 'مهندس النظم' : 'مدير المحطة'}):`
                      : `Security Passcode (${selectedRole === 'engineer' ? 'Systems Engineer' : 'Substation Manager'}):`}
                  </span>
                </label>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                  {lang === 'ar' ? 'الرمز التجريبي: ' : 'Demo Passcode: '}
                  <span className="font-bold text-white">{selectedRole === 'engineer' ? 'engineer123' : 'manager123'}</span>
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 rtl:left-auto rtl:right-3 top-3" />
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder={
                    lang === 'ar'
                      ? `أدخل رمز ${selectedRole === 'engineer' ? 'مهندس النظم' : 'مدير المحطة'}...`
                      : `Enter ${selectedRole === 'engineer' ? 'Systems Engineer' : 'Substation Manager'} passcode...`
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 font-mono shadow-inner"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-700/80 rounded-xl text-rose-300 text-xs flex items-center gap-2.5 shadow-lg">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* Web Audio API Subsystem Notice */}
          <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-xs text-zinc-400 flex items-start gap-2.5">
            <Volume2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-zinc-200 text-[11px] block uppercase font-mono">
                {lang === 'ar' ? 'نظام الصوت التنبيهي ISA-18.2 (Web Audio)' : 'ISA-18.2 Web Audio API Subsystem'}
              </span>
              <p className="text-[11px] text-zinc-400 leading-snug">
                {lang === 'ar'
                  ? 'يؤدي بدء التشغيل إلى تنشيط إشارات التنبيه الصوتية عند حدوث أعطال أو تجاوز حدود الحماية.'
                  : 'Clicking initialize below triggers AudioContext.resume(), ensuring unacknowledged sirens play without browser autoplay blocks.'}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-mono font-bold text-sm md:text-base rounded-xl shadow-[0_0_25px_rgba(79,70,229,0.4)] flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Activity className="w-5 h-5 text-cyan-200 animate-pulse" />
            <span className="tracking-wider uppercase">
              {lang === 'ar' ? 'بدء تشغيل وتأكيد بيئة SCADA' : 'INITIALIZE SCADA WORKSPACE'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};


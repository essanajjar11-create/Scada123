import React, { useState, useEffect } from 'react';
import { Activity, Radio, Clock, RefreshCw, Zap, ShieldCheck, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  activeTab: 'YARD' | 'SCADA';
  setActiveTab: (tab: 'YARD' | 'SCADA') => void;
  bus1Energized: boolean;
  bus2Energized: boolean;
  bus1VoltageKV: number;
  bus2VoltageKV: number;
  gridVoltage: number;
  criticalAlarmsCount: number;
  interlockBypass: boolean;
  setInterlockBypass: (v: boolean) => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  bus1Energized,
  bus2Energized,
  bus1VoltageKV,
  bus2VoltageKV,
  gridVoltage,
  criticalAlarmsCount,
  interlockBypass,
  setInterlockBypass,
  onReset,
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      setTimeStr(`${now.toLocaleTimeString('en-GB')} .${ms}`);
    };
    update();
    const interval = setInterval(update, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-[#15181e] border-b border-[#2d3340] px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-900/40 border border-red-500/40">
          <Zap className="w-6 h-6 text-white stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-100 tracking-wide font-sans">
              محاكي محطة التحويل 220/110 ك.ف
            </h1>
            <span className="bg-red-950/80 text-red-400 border border-red-800/60 text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold">
              220/110 kV DIGITAL TWIN
            </span>
            <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono px-1.5 py-0.5 rounded">
              ISA-101 / IEC 61850
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            نظام التوأم الرقمي المزدوج والمراقبة والتحكم بالإسكادا (Decoupled Dual-View HMI)
          </p>
        </div>
      </div>

      {/* View Switcher Tabs (ISA-101 Decoupled Dual-View) */}
      <div className="flex items-center bg-[#0d0f13] p-1 rounded-xl border border-[#2b313d] shadow-inner">
        <button
          onClick={() => setActiveTab('YARD')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
            activeTab === 'YARD'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-900/50 border border-amber-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>ساحة المحطة والنمذجة الفيزيائية (Yard View)</span>
        </button>

        <button
          onClick={() => setActiveTab('SCADA')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
            activeTab === 'SCADA'
              ? 'bg-red-600 text-white shadow-md shadow-red-900/50 border border-red-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>مركز التحكم والمراقبة (SCADA HMI)</span>
          {criticalAlarmsCount > 0 && (
            <span className="bg-white text-red-600 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
              {criticalAlarmsCount}
            </span>
          )}
        </button>
      </div>

      {/* Telemetry Status Bar & Interlock Switch */}
      <div className="flex items-center gap-3 text-xs font-mono-numbers">
        {/* Interlock Safety Toggle (Lockout Protection vs Emergency Bypass) */}
        <button
          onClick={() => setInterlockBypass(!interlockBypass)}
          title="تبديل وضع أقفال الأمان والإنترلوك (IEC 62271 Interlocking Key Switch)"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition border ${
            interlockBypass
              ? 'bg-amber-950 text-amber-300 border-amber-600 animate-pulse'
              : 'bg-[#1b2029] text-emerald-400 border-emerald-800/60 hover:bg-slate-800'
          }`}
        >
          {interlockBypass ? <ShieldAlert className="w-4 h-4 text-amber-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
          <span>{interlockBypass ? 'تجاوز الأمان (OVERRIDE)' : 'أقفال الأمان: نشطة'}</span>
        </button>

        {/* Bus 1 Status */}
        <div
          title={`جهد المصدر المغذي: ${gridVoltage.toFixed(1)} kV`}
          className="flex items-center gap-2 bg-[#1b2029] border border-[#2d3544] px-2.5 py-1.5 rounded-lg"
        >
          <span className="text-[11px] text-slate-400 font-sans">قضيب 1:</span>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              bus1Energized ? 'bg-red-500 animate-pulse shadow-sm shadow-red-500' : 'bg-slate-600'
            }`}
          />
          <span className={`font-bold ${bus1Energized ? 'text-red-400' : 'text-slate-500'}`}>
            {bus1Energized ? `${bus1VoltageKV.toFixed(1)} kV` : '0.0 kV'}
          </span>
        </div>

        {/* Bus 2 Status */}
        <div
          title={`جهد المصدر المغذي: ${gridVoltage.toFixed(1)} kV`}
          className="flex items-center gap-2 bg-[#1b2029] border border-[#2d3544] px-2.5 py-1.5 rounded-lg"
        >
          <span className="text-[11px] text-slate-400 font-sans">قضيب 2:</span>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              bus2Energized ? 'bg-red-500 animate-pulse shadow-sm shadow-red-500' : 'bg-slate-600'
            }`}
          />
          <span className={`font-bold ${bus2Energized ? 'text-red-400' : 'text-slate-500'}`}>
            {bus2Energized ? `${bus2VoltageKV.toFixed(1)} kV` : '0.0 kV'}
          </span>
        </div>

        {/* High precision clock */}
        <div className="flex items-center gap-1.5 bg-[#0f1217] border border-[#2b313d] text-amber-400 px-3 py-1.5 rounded-lg font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-amber-400/80" />
          <span>{timeStr || '00:00:00.000'}</span>
        </div>

        {/* Reset button */}
        <button
          onClick={onReset}
          title="إعادة ضبط المحطة للحالة الابتدائية"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-sans font-medium">إعادة ضبط</span>
        </button>
      </div>
    </header>
  );
};

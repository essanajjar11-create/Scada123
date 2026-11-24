import React, { useState } from 'react';
import { Radio, AlertTriangle, PowerOff } from 'lucide-react';
import { SubstationState } from '../../types/substation';
import { SingleLineDiagram } from './SingleLineDiagram';
import { AlarmBanner } from './AlarmBanner';
import { SoeLogTable } from './SoeLogTable';
import { ProtocolSniffer } from './ProtocolSniffer';

interface ScadaViewProps {
  state: SubstationState;
  onToggleSwitchgear: (id: string) => void;
  onAcknowledgeAlarms: (id?: string) => void;
  onResetAlarms: () => void;
  onClearSoeLogs: () => void;
  onClearSniffer: () => void;
  onEmergencyStationTrip: () => void;
}

export const ScadaView: React.FC<ScadaViewProps> = ({
  state,
  onToggleSwitchgear,
  onAcknowledgeAlarms,
  onResetAlarms,
  onClearSoeLogs,
  onClearSniffer,
  onEmergencyStationTrip,
}) => {
  const [isSilenced, setIsSilenced] = useState(false);
  const [showConfirmTrip, setShowConfirmTrip] = useState(false);

  const { measurements, alarms, soeLogs, snifferPackets, transformers } = state;

  // Calculate total station power
  const totalActiveMW = (
    (measurements['BAY_W1_1']?.activePowerMW || 0) +
    (measurements['BAY_W2']?.activePowerMW || 0) +
    (measurements['BAY_W1_2']?.activePowerMW || 0)
  ).toFixed(1);

  const totalReactiveMVAr = (
    (measurements['BAY_W1_1']?.reactivePowerMVAr || 0) +
    (measurements['BAY_W2']?.reactivePowerMVAr || 0) +
    (measurements['BAY_W1_2']?.reactivePowerMVAr || 0)
  ).toFixed(1);

  return (
    <div className="space-y-5 p-4 max-w-7xl mx-auto font-sans">
      
      {/* Top SCADA Control Banner & Quick Stats */}
      <div className="bg-[#151921] border border-[#2b3341] rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">
                مركز التحكم والمراقبة الرئيسي بالإسكادا (SCADA Master Dispatcher HMI)
              </h2>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                IEC 60870-5-104 ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              مراقبة وتحكم بالزمن الحقيقي لمحطة تحويل 220/110 ك.ف حسب المعيار الأمريكي ANSI/ISA-101
            </p>
          </div>
        </div>

        {/* Global Dispatch Telemetry Badges */}
        <div className="flex items-center gap-4 text-xs font-mono-numbers">
          <div className="bg-[#101318] px-3 py-1.5 rounded-xl border border-[#242b36]">
            <span className="text-slate-400 block text-[10px] font-sans">إجمالي التوليد الفعال:</span>
            <span className="font-bold text-amber-400 text-sm">{totalActiveMW} MW</span>
          </div>

          <div className="bg-[#101318] px-3 py-1.5 rounded-xl border border-[#242b36]">
            <span className="text-slate-400 block text-[10px] font-sans">إجمالي الاستطاعة الردية:</span>
            <span className="font-bold text-cyan-400 text-sm">{totalReactiveMVAr} MVAr</span>
          </div>

          <div className="bg-[#101318] px-3 py-1.5 rounded-xl border border-[#242b36]">
            <span className="text-slate-400 block text-[10px] font-sans">التردد الشبكي:</span>
            <span className="font-bold text-emerald-400 text-sm">
              {measurements['BAY_W1_1']?.frequencyHz || '50.000'} Hz
            </span>
          </div>

          {/* Emergency Trip Button */}
          <button
            onClick={() => setShowConfirmTrip(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-950 hover:bg-red-900 text-red-300 border border-red-700 rounded-xl text-xs font-bold transition shadow-lg shadow-red-950/50"
          >
            <PowerOff className="w-4 h-4 text-red-400" />
            <span className="font-sans">فصل طوارئ المحطة (Trip All)</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Emergency Station Trip */}
      {showConfirmTrip && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1c1417] border-2 border-red-600 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-red-600/20 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/40">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-base text-red-200">
                تأكيد أمر فصل الطوارئ الشامل للمحطة (Emergency Station Trip)
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                هل أنت متأكد من إرسال أمر رحلة طوارئ IEC 61850 GOOSE Trip لفتح جميع القواطع الستة (CB1 إلى CB6)؟ سيؤدي ذلك لإطفاء المحطة بالكامل!
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirmTrip(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
              >
                إلغاء الأمر
              </button>
              <button
                onClick={() => {
                  setShowConfirmTrip(false);
                  onEmergencyStationTrip();
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-900"
              >
                تأكيد الفصل الفوري (TRIP)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ISA-18.2 Alarm Banner */}
      <AlarmBanner
        alarms={alarms}
        onAcknowledge={onAcknowledgeAlarms}
        onReset={onResetAlarms}
        isSilenced={isSilenced}
        onToggleSilence={() => setIsSilenced(!isSilenced)}
      />

      {/* Main Single Line Diagram (Dynamic Process View) */}
      <SingleLineDiagram
        state={state}
        onToggleSwitchgear={onToggleSwitchgear}
      />

      {/* Real-time Bay Telemetry Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 font-mono-numbers">
        <BayTelemetryCard
          title="خط W1 الأول (Bay W1')"
          voltage={measurements['BAY_W1_1']?.voltageLL_kV || 0}
          current={measurements['BAY_W1_1']?.currentL1_A || 0}
          pMW={measurements['BAY_W1_1']?.activePowerMW || 0}
          qMVAr={measurements['BAY_W1_1']?.reactivePowerMVAr || 0}
          cosPhi={measurements['BAY_W1_1']?.powerFactor || 1.0}
        />
        <BayTelemetryCard
          title="خط W2 (Bay W2)"
          voltage={measurements['BAY_W2']?.voltageLL_kV || 0}
          current={measurements['BAY_W2']?.currentL1_A || 0}
          pMW={measurements['BAY_W2']?.activePowerMW || 0}
          qMVAr={measurements['BAY_W2']?.reactivePowerMVAr || 0}
          cosPhi={measurements['BAY_W2']?.powerFactor || 1.0}
        />
        <BayTelemetryCard
          title="خط W1 الثاني (Bay W1'')"
          voltage={measurements['BAY_W1_2']?.voltageLL_kV || 0}
          current={measurements['BAY_W1_2']?.currentL1_A || 0}
          pMW={measurements['BAY_W1_2']?.activePowerMW || 0}
          qMVAr={measurements['BAY_W1_2']?.reactivePowerMVAr || 0}
          cosPhi={measurements['BAY_W1_2']?.powerFactor || 1.0}
        />
        <BayTelemetryCard
          title={`رابط القضبان (CB4)${
            measurements['BAY_COUPLER']?.flowDirection === 'BUS1_TO_BUS2'
              ? ' • B1 → B2'
              : measurements['BAY_COUPLER']?.flowDirection === 'BUS2_TO_BUS1'
              ? ' • B2 → B1'
              : ''
          }`}
          voltage={measurements['BAY_COUPLER']?.voltageLL_kV || 0}
          current={measurements['BAY_COUPLER']?.currentL1_A || 0}
          pMW={measurements['BAY_COUPLER']?.activePowerMW || 0}
          qMVAr={measurements['BAY_COUPLER']?.reactivePowerMVAr || 0}
          cosPhi={measurements['BAY_COUPLER']?.powerFactor || 1.0}
          subtext={
            measurements['BAY_COUPLER']?.flowDirection === 'BUS1_TO_BUS2'
              ? 'اتجاه السريان: قضيب 1 ◄ قضيب 2'
              : measurements['BAY_COUPLER']?.flowDirection === 'BUS2_TO_BUS1'
              ? 'اتجاه السريان: قضيب 2 ◄ قضيب 1'
              : 'بدون تدفق عابر'
          }
        />
        <BayTelemetryCard
          title="محول T1 (110 kV)"
          voltage={transformers.T1.mvVoltageKV}
          current={measurements['BAY_T1']?.currentL1_A || 0}
          pMW={measurements['BAY_T1']?.activePowerMW || 0}
          qMVAr={measurements['BAY_T1']?.reactivePowerMVAr || 0}
          cosPhi={measurements['BAY_T1']?.powerFactor || 1.0}
          subtext={`وضع ${transformers.T1.tapPosition} (${transformers.T1.loadingPercent}%)`}
        />
        <BayTelemetryCard
          title="محول T2 (110 kV)"
          voltage={transformers.T2.mvVoltageKV}
          current={measurements['BAY_T2']?.currentL1_A || 0}
          pMW={measurements['BAY_T2']?.activePowerMW || 0}
          qMVAr={measurements['BAY_T2']?.reactivePowerMVAr || 0}
          cosPhi={measurements['BAY_T2']?.powerFactor || 1.0}
          subtext={`وضع ${transformers.T2.tapPosition} (${transformers.T2.loadingPercent}%)`}
        />
      </div>

      {/* Bottom Split: SOE Log Table & Protocol Sniffer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SoeLogTable
          logs={soeLogs}
          onClearLogs={onClearSoeLogs}
        />

        <ProtocolSniffer
          packets={snifferPackets}
          onClear={onClearSniffer}
        />
      </div>

    </div>
  );
};

// Sub-component for individual bay telemetry card
const BayTelemetryCard: React.FC<{
  title: string;
  voltage: number;
  current: number;
  pMW: number;
  qMVAr: number;
  cosPhi: number;
  subtext?: string;
}> = ({ title, voltage, current, pMW, qMVAr, cosPhi, subtext }) => {
  return (
    <div className="bg-[#12151c] border border-[#262e3d] rounded-xl p-2.5 text-xs space-y-1">
      <span className="font-sans font-bold text-slate-300 block truncate text-[11px]">{title}</span>
      <div className="flex justify-between">
        <span className="text-slate-500 font-sans text-[10px]">الجهد U:</span>
        <span className="font-bold text-amber-400">{voltage.toFixed(1)} kV</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500 font-sans text-[10px]">التيار I:</span>
        <span className="font-bold text-emerald-400">{current.toFixed(1)} A</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500 font-sans text-[10px]">الاستطاعة P / Q:</span>
        <span className="font-bold text-slate-200">{pMW.toFixed(1)} MW | {qMVAr.toFixed(1)} MVAr</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500 font-sans text-[10px]">عامل الاستطاعة:</span>
        <span className="text-cyan-400">{cosPhi.toFixed(2)}</span>
      </div>
      {subtext && (
        <div className="pt-1 border-t border-slate-800 text-[10px] text-amber-500/90 font-mono text-center">
          {subtext}
        </div>
      )}
    </div>
  );
};

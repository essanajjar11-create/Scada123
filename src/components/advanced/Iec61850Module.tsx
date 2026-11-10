import React, { useState, useEffect } from 'react';
import { Radio, Activity, CheckCircle2, Clock, AlertCircle, ShieldCheck, Layers } from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

interface GoosePacket {
  id: string;
  time: string;
  appid: string;
  stNum: number;
  sqNum: number;
  latencyMs: number;
  gocbRef: string;
  status: 'NORMAL' | 'TRIP' | 'TEST';
}

export const Iec61850Module: React.FC = () => {
  const { lang } = useScada();
  const isAr = lang === 'ar';
  const [svMode, setSvMode] = useState<'80' | '256'>('80');
  const [goosePackets, setGoosePackets] = useState<GoosePacket[]>([
    {
      id: 'g-1',
      time: new Date().toLocaleTimeString(),
      appid: '0x0001 (Trip Relay IED)',
      stNum: 14,
      sqNum: 1042,
      latencyMs: 1.8,
      gocbRef: 'RTU01/LLN0$GO$gcb_Trip',
      status: 'NORMAL',
    },
    {
      id: 'g-2',
      time: new Date(Date.now() - 1000).toLocaleTimeString(),
      appid: '0x0002 (Interlock IED)',
      stNum: 8,
      sqNum: 582,
      latencyMs: 2.1,
      gocbRef: 'RTU01/LLN0$GO$gcb_Interlock',
      status: 'NORMAL',
    },
  ]);

  const [ptpOffsetNs, setPtpOffsetNs] = useState<number>(34);
  const [packetLossCount, setPacketLossCount] = useState<number>(0);

  // Live simulation packet stream
  useEffect(() => {
    const timer = setInterval(() => {
      // Fluctuate PTP offset around 30-45 ns
      setPtpOffsetNs(Math.round(25 + Math.random() * 20));

      // Append GOOSE packet
      const newPkt: GoosePacket = {
        id: `g-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        appid: '0x0001 (Trip Relay IED)',
        stNum: 14,
        sqNum: Math.floor(1000 + Math.random() * 5000),
        latencyMs: Number((1.2 + Math.random() * 1.5).toFixed(2)),
        gocbRef: 'RTU01/LLN0$GO$gcb_Trip',
        status: 'NORMAL',
      };

      setGoosePackets((prev) => [newPkt, ...prev.slice(0, 7)]);
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-2.5 bg-purple-950/80 border border-purple-700/60 rounded-lg text-purple-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-tight">
              {isAr
                ? 'فاحص بروتوكول المحطات الرقمية IEC 61850 (رسائل GOOSE والقيم المقاسة SV)'
                : 'IEC 61850 Substation Protocol Inspector (GOOSE & Sampled Values)'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'محلل ناقل العمليات Layer 2 Process Bus المتزامن بساعة IEEE 1588 PTP Grandmaster'
                : 'Layer 2 Ethernet Process Bus Inspector with IEEE 1588 PTP Grandmaster Clock Synchronization'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-xs font-bold rounded-full flex items-center space-x-1.5 rtl:space-x-reverse font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'تزامن PTP IEEE 1588: مؤمّن بدقة' : 'PTP IEEE 1588: SYNCHRONIZED'}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* GOOSE Multicast Protocol Inspector */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase text-purple-300 flex items-center space-x-2 rtl:space-x-reverse">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>
                {isAr
                  ? 'حركة رسائل GOOSE متعددة البث (IEC 61850-8-1)'
                  : 'GOOSE Layer-2 Multicast Traffic (IEC 61850-8-1)'}
              </span>
            </h4>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
              EtherType: 0x88B8
            </span>
          </div>

          {/* GOOSE Live Table */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs font-sans">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-[10px] bg-slate-900/60">
                  <th className="p-2">{isAr ? 'الوقت' : 'Timestamp'}</th>
                  <th className="p-2">{isAr ? 'معرّف الجهاز / IED' : 'APPID / IED'}</th>
                  <th className="p-2">{isAr ? 'رقم الحالة / التسلسل' : 'StNum / SqNum'}</th>
                  <th className="p-2">{isAr ? 'زمن الوصول' : 'Latency'}</th>
                  <th className="p-2">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {goosePackets.map((pkt) => (
                  <tr key={pkt.id} className="text-slate-300 hover:bg-slate-900/40">
                    <td className="p-2 text-slate-400 font-mono">{pkt.time}</td>
                    <td className="p-2 text-slate-200 font-mono">{pkt.appid}</td>
                    <td className="p-2 font-bold text-cyan-400 font-mono">
                      {pkt.stNum} / {pkt.sqNum}
                    </td>
                    <td className="p-2 font-mono">
                      <span className={`font-bold ${pkt.latencyMs < 4.0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pkt.latencyMs} ms
                      </span>
                    </td>
                    <td className="p-2">
                      <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold rounded font-mono">
                        {pkt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between text-[11px] text-slate-400 flex-wrap gap-2">
            <span>
              {isAr ? 'الحد الأقصى لزمن الفصل:' : 'Trip Command Latency Target:'}{' '}
              <strong className="text-emerald-400 font-mono">&lt; 4.0 ms</strong>
            </span>
            <span>
              {isAr ? 'معرف الشبكة الافتراضية VLAN:' : 'VLAN ID:'}{' '}
              <strong className="text-purple-400 font-mono">100 (Process Bus)</strong>
            </span>
          </div>
        </div>

        {/* Sampled Values (SV) & PTP Grandmaster Section */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase text-cyan-400 flex items-center space-x-2 rtl:space-x-reverse">
              <Activity className="w-4 h-4" />
              <span>{isAr ? 'القيم المقاسة (IEC 61850-9-2LE SV)' : 'Sampled Values (IEC 61850-9-2LE)'}</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
              EtherType: 0x88BA
            </span>
          </div>

          {/* SV Sampling Rate Selector */}
          <div className="space-y-1.5 text-xs">
            <label className="text-slate-400 text-[11px] block">
              {isAr ? 'معدل أخذ العينات لوحدة الدمج (Merging Unit):' : 'Merging Unit Sampling Profile:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSvMode('80')}
                className={`p-2.5 rounded-lg border font-bold text-left rtl:text-right cursor-pointer transition-all ${
                  svMode === '80'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="text-xs">{isAr ? '80 عينة / دورة' : '80 Samples / Cycle'}</div>
                <div className="text-[10px] text-slate-400 font-normal">
                  {isAr ? 'أجهزة الحماية (4000 Hz)' : 'Protection (4000 Hz)'}
                </div>
              </button>

              <button
                onClick={() => setSvMode('256')}
                className={`p-2.5 rounded-lg border font-bold text-left rtl:text-right cursor-pointer transition-all ${
                  svMode === '256'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="text-xs">{isAr ? '256 عينة / دورة' : '256 Samples / Cycle'}</div>
                <div className="text-[10px] text-slate-400 font-normal">
                  {isAr ? 'جودة القدرة (12.8 kHz)' : 'Power Quality (12.8 kHz)'}
                </div>
              </button>
            </div>
          </div>

          {/* PTP Clock Status & Packet Loss Cards */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block flex items-center justify-between">
                <span>{isAr ? 'فارق زمن PTP' : 'PTP Time Offset'}</span>
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
              </span>
              <span className="text-xl font-bold text-emerald-400 font-mono">{ptpOffsetNs} ns</span>
              <p className="text-[9px] text-slate-500">{isAr ? 'هدف المعيار IEEE 1588 < 100 ns' : 'IEEE 1588 Target < 100 ns'}</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block flex items-center justify-between">
                <span>{isAr ? 'فقدان حزم MU' : 'MU Packet Loss'}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              </span>
              <span className="text-xl font-bold text-cyan-400 font-mono">
                {packetLossCount} {isAr ? 'حزم' : 'Packets'}
              </span>
              <p className="text-[9px] text-slate-500">{isAr ? 'نسبة الفقد 0.00%' : '0.00% Lost Packets'}</p>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">{isAr ? 'معرف وحدة الدمج:' : 'Merging Unit ID:'}</span>
              <span className="font-bold text-slate-100 font-mono">MU-132kV-TR1-BAY01</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{isAr ? 'حالة البث الحي:' : 'Stream Status:'}</span>
              <span className="font-bold text-emerald-400 font-mono">
                {isAr ? 'البث نشط ومستقر' : 'STREAMING ACTIVE'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

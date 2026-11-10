import React, { useState, useEffect } from 'react';
import { X, Activity, Radio, CheckCircle2, Cpu, ShieldCheck, Terminal, Layers, RefreshCw } from 'lucide-react';
import { useScada } from '../../../context/ScadaContext';

interface Iec61850PacketInspectorModalProps {
  onClose: () => void;
}

export const Iec61850PacketInspectorModal: React.FC<Iec61850PacketInspectorModalProps> = ({ onClose }) => {
  const { lang } = useScada();
  const isAr = lang === 'ar';

  const [activeSubTab, setActiveSubTab] = useState<'goose' | 'sv' | 'ptp'>('goose');
  const [packetCount, setPacketCount] = useState(148209);
  const [ptpJitterNs, setPtpJitterNs] = useState(24);

  useEffect(() => {
    const interval = setInterval(() => {
      setPacketCount((p) => p + 80);
      setPtpJitterNs(20 + Math.floor(Math.random() * 12));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const gooseStreams = [
    {
      appId: '0x0001',
      gocbRef: 'BAY01_TR1/LLN0$GO$gcbTrip',
      dataset: 'dsTripSignals',
      stNum: 4,
      sqNum: 142,
      timeAllowedToLive: 2000,
      latencyMs: 2.8,
      status: isAr ? 'سليم' : 'HEALTHY',
    },
    {
      appId: '0x0002',
      gocbRef: 'BAY02_COUPLER/LLN0$GO$gcbInterlock',
      dataset: 'dsInterlockMatrix',
      stNum: 12,
      sqNum: 890,
      timeAllowedToLive: 2000,
      latencyMs: 3.2,
      status: isAr ? 'سليم' : 'HEALTHY',
    },
    {
      appId: '0x0003',
      gocbRef: 'BAY03_TR2/LLN0$GO$gcbTrip',
      dataset: 'dsTripSignals',
      stNum: 2,
      sqNum: 95,
      timeAllowedToLive: 2000,
      latencyMs: 3.0,
      status: isAr ? 'سليم' : 'HEALTHY',
    },
    {
      appId: '0x0004',
      gocbRef: 'BAY04_BESS/LLN0$GO$gcbFfrDispatch',
      dataset: 'dsBessDroop',
      stNum: 88,
      sqNum: 4512,
      timeAllowedToLive: 1000,
      latencyMs: 1.9,
      status: isAr ? 'سليم' : 'HEALTHY',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className="text-xs font-bold px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-mono">
                  IEC 61850-8-1 GOOSE & 9-2LE SV
                </span>
                <h3 className="text-base font-bold text-zinc-100">
                  {isAr
                    ? 'محلل حزم ناقل العمليات ومحطة المحولات الرقمية'
                    : 'Substation Process Bus & Station Bus Traffic Analyzer'}
                </h3>
              </div>
              <p className="text-xs text-zinc-400">
                {isAr
                  ? `الشبكة: حلقة ألياف بصرية 1Gbps (تكرارية PRP / HSR) • إجمالي الإطارات: `
                  : `Network: 1Gbps Fiber Optic Ring (PRP / HSR Redundancy) • Total Frames: `}
                <span className="font-mono text-zinc-200">{packetCount.toLocaleString()}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-4 text-xs font-bold font-mono">
          <button
            onClick={() => setActiveSubTab('goose')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeSubTab === 'goose' ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isAr ? 'تدفقات تحكم GOOSE (IEC 61850-8-1)' : 'IEC 61850-8-1 GOOSE Control Streams'}
          </button>
          <button
            onClick={() => setActiveSubTab('sv')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeSubTab === 'sv' ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isAr ? 'القيم المقاسة رقمياً SV (4kHz / 9-2LE)' : 'IEC 61869-9 / 9-2LE Sampled Values (4kHz)'}
          </button>
          <button
            onClick={() => setActiveSubTab('ptp')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeSubTab === 'ptp' ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isAr ? 'تزامن التوقيت الدقيق PTP IEEE 1588' : 'IEEE 1588 PTP Grandmaster Clock & Timing'}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 space-y-4">
          {activeSubTab === 'goose' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block font-sans">
                    {isAr ? 'أقصى تأخير GOOSE' : 'MAX GOOSE LATENCY'}
                  </span>
                  <span className="text-lg font-bold text-emerald-400">3.2 ms</span>
                  <span className="text-[10px] text-zinc-400 block font-sans">
                    {isAr ? '< 4.0ms (فئة P1 سريعة)' : '< 4.0ms (Class P1 Fast)'}
                  </span>
                </div>
                <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block font-sans">
                    {isAr ? 'الحزم المفقودة' : 'PACKET LOSS / DROPS'}
                  </span>
                  <span className="text-lg font-bold text-zinc-100">{isAr ? '0 إطار' : '0 Frames'}</span>
                  <span className="text-[10px] text-emerald-400 block font-sans">
                    {isAr ? 'حلقة PRP المزدوجة نشطة' : 'PRP Dual Ring Active'}
                  </span>
                </div>
                <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block font-sans">
                    {isAr ? 'الأجهزة الباثة النشطة' : 'ACTIVE PUBLISHERS'}
                  </span>
                  <span className="text-lg font-bold text-cyan-300">{isAr ? '8 أجهزة IED' : '8 Bay IEDs'}</span>
                  <span className="text-[10px] text-zinc-400 block font-sans">
                    {isAr ? 'نبضات الحياة سليمة' : 'All Heartbeats Valid'}
                  </span>
                </div>
                <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block font-sans">
                    {isAr ? 'فترة إعادة الإرسال T0' : 'RETRANSMISSION T0'}
                  </span>
                  <span className="text-lg font-bold text-purple-300">2000 ms</span>
                  <span className="text-[10px] text-zinc-400 block font-sans">
                    {isAr ? 'معيار IEC 61850' : 'IEC 61850 Standard'}
                  </span>
                </div>
              </div>

              {/* Stream Table */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden font-mono text-xs">
                <table className="w-full text-left rtl:text-right">
                  <thead className="bg-zinc-950/80 text-[10px] text-zinc-400 border-b border-zinc-800 uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5">APPID</th>
                      <th className="p-2.5">{isAr ? 'مرجع GoCB' : 'GoCB Reference'}</th>
                      <th className="p-2.5">{isAr ? 'مجموعة البيانات' : 'Dataset'}</th>
                      <th className="p-2.5">StNum / SqNum</th>
                      <th className="p-2.5">{isAr ? 'زمن فصل الحماية' : 'Trip Latency'}</th>
                      <th className="p-2.5">{isAr ? 'الحالة' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {gooseStreams.map((s, idx) => (
                      <tr key={idx} className="hover:bg-zinc-800/40">
                        <td className="p-2.5 text-cyan-400 font-bold">{s.appId}</td>
                        <td className="p-2.5 font-bold text-zinc-200">{s.gocbRef}</td>
                        <td className="p-2.5 text-zinc-400">{s.dataset}</td>
                        <td className="p-2.5 text-zinc-300">{s.stNum} / {s.sqNum}</td>
                        <td className="p-2.5 text-emerald-400 font-bold">{s.latencyMs} ms</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[10px] font-bold">
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'sv' && (
            <div className="space-y-3 font-sans text-xs">
              <div className="p-3.5 bg-zinc-900/90 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-zinc-200">
                    {isAr
                      ? 'بروتوكول تدفق الألياف الضوئية للقيم المقاسة رقمياً (SV)'
                      : 'Sampled Values (SV) Digital Fiber Stream Protocol'}
                  </h4>
                  <p className="text-zinc-400 text-xs">
                    IEC 61869-9 / IEC 61850-9-2LE • 80 Samples/Cycle (4,000 Hz at 50Hz nominal)
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-700 rounded-lg font-mono font-bold">
                  {isAr ? 'التدفق متزامن' : 'STREAM SYNCHRONIZED'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-sans block">
                    {isAr ? 'معدل تدفق الحزم' : 'STREAM RATE'}
                  </span>
                  <span className="text-base font-bold text-cyan-300">4,000 pkts/sec</span>
                </div>
                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-sans block">
                    {isAr ? 'عينات لكل دورة' : 'SAMPLES / CYCLE'}
                  </span>
                  <span className="text-base font-bold text-emerald-400">{isAr ? '80 عينة (12.5ms)' : '80 Samples (12.5ms)'}</span>
                </div>
                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-sans block">
                    {isAr ? 'وحدات الدمج MU' : 'MERGING UNITS'}
                  </span>
                  <span className="text-base font-bold text-purple-300">{isAr ? '3 متصلة (MU-01, 02, 03)' : '3 Online (MU-01, 02, 03)'}</span>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'ptp' && (
            <div className="space-y-3 font-sans text-xs">
              <div className="p-3.5 bg-zinc-900/90 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-zinc-200">
                    {isAr
                      ? 'بروتوكول التوقيت الدقيق PTP v2 (IEEE 1588-2008)'
                      : 'IEEE 1588-2008 Precision Time Protocol (PTP v2)'}
                  </h4>
                  <p className="text-zinc-400 text-xs">
                    Power Utility Profile IEC/IEEE 61850-9-3 • GNSS Master Clock Synchronization
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-700 rounded-lg font-mono font-bold">
                  {isAr ? 'مقفول (GPS + GLONASS)' : 'LOCKED (GPS + GLONASS)'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-sans block">
                    {isAr ? 'تفاوت التوقيت الحالي' : 'CURRENT JITTER'}
                  </span>
                  <span className="text-base font-bold text-emerald-400">±{ptpJitterNs} ns (&lt; 1µs Limit)</span>
                </div>
                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-sans block">
                    {isAr ? 'معرّف الساعة الرئيسية' : 'GRANDMASTER CLOCK ID'}
                  </span>
                  <span className="text-base font-bold text-zinc-200">00:1A:E8:FF:FE:9B:44</span>
                </div>
                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-sans block">
                    {isAr ? 'فئة جودة التوقيت' : 'TIME QUALITY CLASS'}
                  </span>
                  <span className="text-base font-bold text-cyan-300">
                    {isAr ? 'الفئة 6 (ساعة ذرية Stratum-1)' : 'Class 6 (Stratum-1 Atomic)'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 flex justify-between items-center text-xs">
          <span className="text-zinc-400 font-mono text-[11px]">
            {isAr
              ? 'متوافق مع إرشادات هندسة المحطات الكهربائية الرقمية IEC 61850 الإصدار 2.1'
              : 'Compliant with IEC 61850 Edition 2.1 Substation Engineering Guidelines'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق محلل الحزم' : 'Close Packet Inspector'}
          </button>
        </div>
      </div>
    </div>
  );
};

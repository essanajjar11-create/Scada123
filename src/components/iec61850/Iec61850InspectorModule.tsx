import React, { useState, useEffect, useRef } from 'react';
import {
  Network,
  Activity,
  Radio,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Send,
  Download,
  Play,
  Pause,
  RefreshCw,
  Layers,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Cpu,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { useScada } from '../../context/ScadaContext';
import { GooseMessage, SvStreamSample, Iec61850PtpStatus } from '../../types/scada';

export const Iec61850InspectorModule: React.FC = () => {
  const { tr1Telemetry, addAuditLog, t } = useScada();

  const [activeTab, setActiveTab] = useState<'goose_traffic' | 'matrix' | 'sampled_values' | 'ptp_sync'>('goose_traffic');
  const [isCapturing, setIsCapturing] = useState<boolean>(true);
  const [selectedGoose, setSelectedGoose] = useState<GooseMessage | null>(null);
  const [injectedTrip, setInjectedTrip] = useState<boolean>(false);
  const [selectedSvPhase, setSelectedSvPhase] = useState<'ALL' | 'VOLTAGE' | 'CURRENT'>('ALL');

  // Live GOOSE messages buffer
  const [gooseMessages, setGooseMessages] = useState<GooseMessage[]>([
    {
      id: 'GOOSE-01',
      appId: '0x0001',
      gocbRef: 'Substation/TR1_PROT/LLN0$GO$gcbTrip',
      datSet: 'Substation/TR1_PROT/LLN0$dsTrip',
      sqNum: 1420,
      stNum: 3,
      timeString: new Date().toISOString().substring(11, 23),
      timeEpochMs: Date.now(),
      confRev: 1,
      ndsCom: false,
      numDatSetEntries: 4,
      dataSummary: 'TR1_87T:FALSE | 50/51P:FALSE | BKR_52_1:CLOSED | BLK_REC:FALSE',
      allData: [
        { signal: 'TR1_87T_DiffTrip', value: false, quality: 'GOOD' },
        { signal: 'TR1_50_51_Overcurrent', value: false, quality: 'GOOD' },
        { signal: 'TR1_52_1_PosClose', value: true, quality: 'GOOD' },
        { signal: 'TR1_BlockReclose', value: false, quality: 'GOOD' }
      ],
      latencyMs: 1.8,
      quality: 'GOOD',
      status: 'TRANSMITTING',
      sourceIed: 'IED-TR1-PROT (SEL-487E)',
      targetIeds: ['IED-BAY-52_1', 'IED-BUS-87B', 'RTU-01']
    },
    {
      id: 'GOOSE-02',
      appId: '0x0002',
      gocbRef: 'Substation/BUS132_A/LLN0$GO$gcbInterlock',
      datSet: 'Substation/BUS132_A/LLN0$dsInterlock',
      sqNum: 3891,
      stNum: 12,
      timeString: new Date().toISOString().substring(11, 23),
      timeEpochMs: Date.now() - 100,
      confRev: 2,
      ndsCom: false,
      numDatSetEntries: 3,
      dataSummary: 'DS_89_1A:CLOSED | DS_89_1B:OPEN | ES_84_1:OPEN',
      allData: [
        { signal: 'DS_89_1A_Pos', value: 'CLOSED', quality: 'GOOD' },
        { signal: 'DS_89_1B_Pos', value: 'OPEN', quality: 'GOOD' },
        { signal: 'ES_84_1_InterlockStatus', value: 'UNBLOCKED', quality: 'GOOD' }
      ],
      latencyMs: 2.2,
      quality: 'GOOD',
      status: 'TRANSMITTING',
      sourceIed: 'IED-BAY-52_1 (ABB REC670)',
      targetIeds: ['IED-BUS-COUPLER', 'IED-TR2-BAY', 'RTU-01']
    },
    {
      id: 'GOOSE-03',
      appId: '0x0003',
      gocbRef: 'Substation/BUS132_BC/LLN0$GO$gcbBusTrip',
      datSet: 'Substation/BUS132_BC/LLN0$dsBusFault',
      sqNum: 512,
      stNum: 1,
      timeString: new Date().toISOString().substring(11, 23),
      timeEpochMs: Date.now() - 400,
      confRev: 1,
      ndsCom: false,
      numDatSetEntries: 2,
      dataSummary: 'BUS_A_87B:HEALTHY | TRIP_ALL_FEEDERS:FALSE',
      allData: [
        { signal: 'BUS_87B_DiffZoneA', value: false, quality: 'GOOD' },
        { signal: 'BUS_87B_LockoutTrip', value: false, quality: 'GOOD' }
      ],
      latencyMs: 1.4,
      quality: 'GOOD',
      status: 'STANDBY',
      sourceIed: 'IED-BUS-87B (Siemens 7SS85)',
      targetIeds: ['IED-TR1-PROT', 'IED-TR2-PROT', 'IED-BAY-52_1', 'IED-BAY-52_4']
    },
    {
      id: 'GOOSE-04',
      appId: '0x0004',
      gocbRef: 'Substation/BESS_BAY/LLN0$GO$gcbFastTrip',
      datSet: 'Substation/BESS_BAY/LLN0$dsBessTrip',
      sqNum: 204,
      stNum: 2,
      timeString: new Date().toISOString().substring(11, 23),
      timeEpochMs: Date.now() - 800,
      confRev: 1,
      ndsCom: false,
      numDatSetEntries: 2,
      dataSummary: 'BESS_52_B:CLOSED | BESS_ISLAND_DETECT:FALSE',
      allData: [
        { signal: 'BESS_CB_Closed', value: true, quality: 'GOOD' },
        { signal: 'BESS_AntiIslandingTrip', value: false, quality: 'GOOD' }
      ],
      latencyMs: 3.1,
      quality: 'GOOD',
      status: 'TRANSMITTING',
      sourceIed: 'IED-BESS-CTRL (Ingeteam)',
      targetIeds: ['IED-TR1-PROT', 'RTU-01']
    }
  ]);

  // PTP IEEE 1588 Precision Clock Status
  const [ptpStatus, setPtpStatus] = useState<Iec61850PtpStatus>({
    ptpGrandmasterId: '00:1E:C0:FF:FE:84:92:10 (Rubidium GNSS GPS-01)',
    clockClass: 6,
    offsetToMasterNs: 18,
    meanPathDelayNs: 240,
    ptpState: 'LOCKED',
    packetsPerSec: 8420,
    gooseLostCount: 0,
    svCorruptedCount: 0
  });

  // Live SV Waveform Sample generator
  const [svSamples, setSvSamples] = useState<any[]>([]);

  useEffect(() => {
    // Generate initial 80 samples for 1 full 50Hz cycle (20ms)
    const samples: any[] = [];
    const vPeak = (tr1Telemetry?.phaseA_Voltage ?? 76.2) * 1.414;
    const iPeak = (tr1Telemetry?.loadCurrent ?? 220) * 1.414;

    for (let i = 0; i < 80; i++) {
      const theta = (i / 80) * 2 * Math.PI;
      const tMs = ((i * 20) / 80).toFixed(2);
      samples.push({
        sampleId: i,
        timeMs: `${tMs} ms`,
        vA: Number((vPeak * Math.sin(theta)).toFixed(2)),
        vB: Number((vPeak * Math.sin(theta - (2 * Math.PI) / 3)).toFixed(2)),
        vC: Number((vPeak * Math.sin(theta + (2 * Math.PI) / 3)).toFixed(2)),
        iA: Number((iPeak * Math.sin(theta - 0.25)).toFixed(1)),
        iB: Number((iPeak * Math.sin(theta - (2 * Math.PI) / 3 - 0.25)).toFixed(1)),
        iC: Number((iPeak * Math.sin(theta + (2 * Math.PI) / 3 - 0.25)).toFixed(1)),
        jitterUs: Number((0.8 + Math.sin(i * 0.5) * 0.4).toFixed(2))
      });
    }
    setSvSamples(samples);
  }, [tr1Telemetry]);

  // Live packet generator interval
  useEffect(() => {
    if (!isCapturing) return;

    const timer = setInterval(() => {
      const nowStr = new Date().toISOString().substring(11, 23);
      setGooseMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          sqNum: msg.sqNum + 1,
          timeString: nowStr,
          timeEpochMs: Date.now(),
          latencyMs: Number((1.2 + Math.random() * 1.6).toFixed(2))
        }))
      );

      setPtpStatus((prev) => ({
        ...prev,
        offsetToMasterNs: Math.round(14 + Math.random() * 10),
        packetsPerSec: Math.round(8350 + Math.random() * 150)
      }));
    }, 1200);

    return () => clearInterval(timer);
  }, [isCapturing]);

  // Handle manual GOOSE Trip injection
  const handleInjectTrip = () => {
    setInjectedTrip(true);
    addAuditLog('FAULT_INJECT', 'IEC 61850 GOOSE Injection: Injected 87T Fast Trip Multicast message (AppID 0x0001, stNum++).');

    setGooseMessages((prev) =>
      prev.map((msg) => {
        if (msg.appId === '0x0001') {
          return {
            ...msg,
            stNum: msg.stNum + 1,
            sqNum: 0,
            status: 'TRIPPED',
            latencyMs: 1.1,
            dataSummary: '⚡ TR1_87T:TRIPPED (TRUE) | 50/51P:PICKUP | BKR_52_1:TRIP_CMD',
            allData: [
              { signal: 'TR1_87T_DiffTrip', value: true, quality: 'GOOD' },
              { signal: 'TR1_50_51_Overcurrent', value: true, quality: 'GOOD' },
              { signal: 'TR1_52_1_PosClose', value: false, quality: 'GOOD' },
              { signal: 'TR1_BlockReclose', value: true, quality: 'GOOD' }
            ]
          };
        }
        return msg;
      })
    );

    setTimeout(() => {
      setInjectedTrip(false);
      setGooseMessages((prev) =>
        prev.map((msg) => {
          if (msg.appId === '0x0001') {
            return {
              ...msg,
              status: 'TRANSMITTING',
              dataSummary: 'TR1_87T:FALSE | 50/51P:FALSE | BKR_52_1:CLOSED | BLK_REC:FALSE',
              allData: [
                { signal: 'TR1_87T_DiffTrip', value: false, quality: 'GOOD' },
                { signal: 'TR1_50_51_Overcurrent', value: false, quality: 'GOOD' },
                { signal: 'TR1_52_1_PosClose', value: true, quality: 'GOOD' },
                { signal: 'TR1_BlockReclose', value: false, quality: 'GOOD' }
              ]
            };
          }
          return msg;
        })
      );
    }, 4000);
  };

  // Export PCAP simulation
  const handleExportPcap = () => {
    const pcapHeader = `PCAP-IEC61850-CAPTURE\nGrandmaster: ${ptpStatus.ptpGrandmasterId}\nCapture Timestamp: ${new Date().toISOString()}\nTotal Packets: 124,890\nProtocols: IEC 61850-8-1 GOOSE (EtherType 0x88B8), IEC 61850-9-2LE SV (EtherType 0x88BA), IEEE 1588 PTP (0x88F7)\n\nCaptured GOOSE Data:\n` +
      gooseMessages.map((m) => `[${m.timeString}] AppID:${m.appId} GocbRef:${m.gocbRef} SqNum:${m.sqNum} StNum:${m.stNum} Latency:${m.latencyMs}ms Data:(${m.dataSummary})`).join('\n');

    const blob = new Blob([pcapHeader], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IEC61850_Substation_Capture_${Date.now()}.pcap.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addAuditLog('SYSTEM', 'Exported IEC 61850 GOOSE/SV Protocol Capture Analysis Report.');
  };

  return (
    <div className="bg-[#0c0d12] border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
      {/* Header & Substation Process Bus Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                IEC 61850 GOOSE & Sampled Values (SV) Station Bus Inspector
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                IEC 61850-8-1 / IEC 61869-9 / IEEE 1588 PTP
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              High-Speed Sub-4ms Protection Multicast Messages, Optical Merging Unit SV Waveforms & Clock Diagnostics
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsCapturing(!isCapturing)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              isCapturing
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}
          >
            {isCapturing ? (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                <span>CAPTURING (8.4 kpps)</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>CAPTURE PAUSED</span>
              </>
            )}
          </button>

          <button
            onClick={handleInjectTrip}
            disabled={injectedTrip}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              injectedTrip
                ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/40'
                : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{injectedTrip ? 'GOOSE 87T TRIP INJECTED!' : 'INJECT 87T GOOSE TRIP'}</span>
          </button>

          <button
            onClick={handleExportPcap}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT PCAP</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/80 pb-3">
        <button
          onClick={() => setActiveTab('goose_traffic')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
            activeTab === 'goose_traffic'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-zinc-800'
          }`}
        >
          GOOSE Packet Stream
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
            activeTab === 'matrix'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-zinc-800'
          }`}
        >
          Publisher / Subscriber Matrix
        </button>
        <button
          onClick={() => setActiveTab('sampled_values')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
            activeTab === 'sampled_values'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-zinc-800'
          }`}
        >
          Sampled Values (SV Waveforms)
        </button>
        <button
          onClick={() => setActiveTab('ptp_sync')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
            activeTab === 'ptp_sync'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-zinc-800'
          }`}
        >
          IEEE 1588 PTP Clock Diagnostics
        </button>
      </div>

      {/* Tab 1: GOOSE Traffic & Decoded Packet Inspector */}
      {activeTab === 'goose_traffic' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Live Packet Table */}
          <div className="lg:col-span-2 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Station Bus Multicast GOOSE Live Buffer</span>
              </h3>
              <span className="text-[11px] text-zinc-500 font-mono">EtherType: 0x88B8 • Priority 4 (VLAN 100)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                    <th className="pb-2.5">AppID</th>
                    <th className="pb-2.5">Source IED</th>
                    <th className="pb-2.5">SqNum / StNum</th>
                    <th className="pb-2.5">Timestamp</th>
                    <th className="pb-2.5">Latency</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                  {gooseMessages.map((msg) => (
                    <tr
                      key={msg.id}
                      onClick={() => setSelectedGoose(msg)}
                      className={`cursor-pointer transition-colors ${
                        selectedGoose?.id === msg.id
                          ? 'bg-cyan-950/40 text-cyan-200'
                          : 'hover:bg-zinc-900/60'
                      }`}
                    >
                      <td className="py-2.5 font-bold text-cyan-400">{msg.appId}</td>
                      <td className="py-2.5 text-zinc-300 font-sans text-[11px]">{msg.sourceIed}</td>
                      <td className="py-2.5 text-zinc-400">
                        sq:{msg.sqNum} / <span className="text-amber-300 font-bold">st:{msg.stNum}</span>
                      </td>
                      <td className="py-2.5 text-zinc-400">{msg.timeString}</td>
                      <td className="py-2.5">
                        <span
                          className={`font-bold ${
                            (msg.latencyMs ?? 1.2) > 3.0 ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {(msg.latencyMs ?? 1.2).toFixed(1)} ms
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                            msg.status === 'TRIPPED'
                              ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          }`}
                        >
                          {msg.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGoose(msg);
                          }}
                          className="px-2 py-0.5 text-[10px] rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sub-ms Latency Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 text-[10px] block">Mean GOOSE Latency</span>
                <span className="text-lg font-extrabold text-emerald-400">1.74 ms</span>
                <span className="text-[10px] text-zinc-500 block">Class P1 Requirement (&le;4ms)</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 text-[10px] block">Max Permissible Latency</span>
                <span className="text-lg font-extrabold text-indigo-400">4.00 ms</span>
                <span className="text-[10px] text-zinc-500 block">IEC 61850-5 Type 1A Fast</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 text-[10px] block">VLAN Priority & EtherType</span>
                <span className="text-lg font-extrabold text-amber-400">0x88B8</span>
                <span className="text-[10px] text-zinc-500 block">802.1Q PCP 4 (Critical)</span>
              </div>
            </div>
          </div>

          {/* Right Col: Decoded ASN.1 BER Payload Inspector */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 space-y-4 font-mono text-xs">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
              <span>Decoded ASN.1 BER Packet Inspector</span>
              <span className="text-cyan-400 text-[10px]">
                {selectedGoose?.appId || 'SELECT PACKET'}
              </span>
            </h3>

            {selectedGoose ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">GoCB Reference:</span>
                    <span className="text-zinc-200 font-bold truncate max-w-[170px]">{selectedGoose.gocbRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">DataSet Path:</span>
                    <span className="text-zinc-200 font-bold truncate max-w-[170px]">{selectedGoose.datSet}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Configuration Rev:</span>
                    <span className="text-amber-400 font-bold">{selectedGoose.confRev}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Source IED:</span>
                    <span className="text-cyan-300 font-bold">{selectedGoose.sourceIed}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-zinc-400 text-[11px] font-bold block uppercase">
                    Data Set Signals ({selectedGoose.allData.length} entries):
                  </span>
                  <div className="space-y-1.5">
                    {selectedGoose.allData.map((d, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-zinc-900/90 border border-zinc-800 flex items-center justify-between"
                      >
                        <span className="text-zinc-300 text-[11px]">{d.signal}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              d.value === true || d.value === 'CLOSED'
                                ? 'text-emerald-400'
                                : d.value === 'TRIPPED'
                                ? 'text-rose-400'
                                : 'text-zinc-400'
                            }`}
                          >
                            {String(d.value)}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                            {d.quality}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <span className="text-zinc-500 text-[10px] block">Target Subscriber IEDs:</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedGoose.targetIeds.map((tgt, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold"
                      >
                        {tgt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-500 space-y-2">
                <FileCode className="w-8 h-8 mx-auto text-zinc-600" />
                <p>Select any GOOSE packet in the stream to inspect the decoded BER protocol payload and data attributes.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Publisher / Subscriber Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Substation GOOSE Publisher / Subscriber Cross-Connect Matrix
              </h3>
              <p className="text-xs text-zinc-400">
                Mapped GOOSE control blocks (GoCB) between protection relays, bay controllers, and RTU gateways.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400">IEC 61850-7-2 Substation Engineering</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                  <th className="pb-3">Publisher (Sending IED)</th>
                  <th className="pb-3">GoCB Signal Purpose</th>
                  <th className="pb-3">TR-1 Bay (52-1)</th>
                  <th className="pb-3">TR-2 Bay (52-4)</th>
                  <th className="pb-3">132kV Bus (87B)</th>
                  <th className="pb-3">Bus Coupler</th>
                  <th className="pb-3">BESS Bay</th>
                  <th className="pb-3">SCADA RTU</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                <tr>
                  <td className="py-3 font-bold text-indigo-300">IED-TR1-PROT (87T)</td>
                  <td className="py-3 text-zinc-400">87T Diff Trip & Fast Block</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      TRIP (Sub)
                    </span>
                  </td>
                  <td className="py-3 text-zinc-600">-</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                      BLOCK (Sub)
                    </span>
                  </td>
                  <td className="py-3 text-zinc-600">-</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                      ISLAND (Sub)
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      SOE (Sub)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-indigo-300">IED-BAY-52_1 (Bay Ctrl)</td>
                  <td className="py-3 text-zinc-400">Disconnector / Earth Interlock</td>
                  <td className="py-3 text-zinc-400 font-bold">PUBLISHER</td>
                  <td className="py-3 text-zinc-600">-</td>
                  <td className="py-3 text-zinc-600">-</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      INTERLOCK (Sub)
                    </span>
                  </td>
                  <td className="py-3 text-zinc-600">-</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      POS (Sub)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-indigo-300">IED-BUS-87B (Bus Prot)</td>
                  <td className="py-3 text-zinc-400">132kV Bus Zone Trip</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                      TRIP (Sub)
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                      TRIP (Sub)
                    </span>
                  </td>
                  <td className="py-3 text-zinc-400 font-bold">PUBLISHER</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                      TRIP (Sub)
                    </span>
                  </td>
                  <td className="py-3 text-zinc-600">-</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      ALARM (Sub)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-indigo-300">IED-BESS-CTRL</td>
                  <td className="py-3 text-zinc-400">BESS Anti-Islanding / Dispatch</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                      STATUS (Sub)
                    </span>
                  </td>
                  <td className="py-3 text-zinc-600">-</td>
                  <td className="py-3 text-zinc-600">-</td>
                  <td className="py-3 text-zinc-600">-</td>
                  <td className="py-3 text-zinc-400 font-bold">PUBLISHER</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      TELEMETRY (Sub)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Sampled Values (SV Waveforms) */}
      {activeTab === 'sampled_values' && (
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                IEC 61869-9 / IEC 61850-9-2LE Sampled Values (Process Bus)
              </h3>
              <p className="text-xs text-zinc-400">
                80 Samples/Cycle (4,000 samples/sec at 50Hz) from Optical Merging Unit MU-TR1-HV.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setSelectedSvPhase('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedSvPhase === 'ALL'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}
              >
                All 3-Phase (V & I)
              </button>
              <button
                onClick={() => setSelectedSvPhase('VOLTAGE')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedSvPhase === 'VOLTAGE'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}
              >
                3-Phase Voltages (kV)
              </button>
              <button
                onClick={() => setSelectedSvPhase('CURRENT')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedSvPhase === 'CURRENT'
                    ? 'bg-amber-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}
              >
                3-Phase Currents (A)
              </button>
            </div>
          </div>

          {/* Recharts SV Waveform Graph */}
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={svSamples} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="timeMs" stroke="#71717a" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#71717a" fontSize={11} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

                {(selectedSvPhase === 'ALL' || selectedSvPhase === 'VOLTAGE') && (
                  <>
                    <Line type="monotone" dataKey="vA" name="V_A (kV)" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="vB" name="V_B (kV)" stroke="#eab308" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="vC" name="V_C (kV)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </>
                )}

                {(selectedSvPhase === 'ALL' || selectedSvPhase === 'CURRENT') && (
                  <>
                    <Line type="monotone" dataKey="iA" name="I_A (A)" stroke="#f97316" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                    <Line type="monotone" dataKey="iB" name="I_B (A)" stroke="#84cc16" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                    <Line type="monotone" dataKey="iC" name="I_C (A)" stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono pt-2">
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 text-[10px] block">Merging Unit ID</span>
              <span className="text-base font-bold text-white">MU-TR1-HV-01</span>
              <span className="text-[10px] text-zinc-500 block">Optic Fiber Process Bus</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 text-[10px] block">Sampling Frequency</span>
              <span className="text-base font-bold text-cyan-400">4,000 Hz (80 smp/cyc)</span>
              <span className="text-[10px] text-zinc-500 block">IEC 61869-9 Standard</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 text-[10px] block">Stream Jitter (RMS)</span>
              <span className="text-base font-bold text-emerald-400">&plusmn; 0.85 &mu;s</span>
              <span className="text-[10px] text-zinc-500 block">Jitter Limit (&lt; 2.0 &mu;s)</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 text-[10px] block">Synch Source</span>
              <span className="text-base font-bold text-indigo-400">GPS / PTP IEEE 1588</span>
              <span className="text-[10px] text-emerald-400 font-bold block">● GLOBAL LOCKED</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: IEEE 1588 PTP Time Synchronization */}
      {activeTab === 'ptp_sync' && (
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                IEEE 1588 Precision Time Protocol (PTP Power Utility Profile IEC/IEEE 61850-9-3)
              </h3>
              <p className="text-xs text-zinc-400">
                Nanosecond-accuracy time distribution to optical Merging Units and Phasor Measurement Units (PMUs).
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>PTP GRANDMASTER LOCKED</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Grandmaster Clock Identity</span>
              <span className="text-sm font-bold text-indigo-300 block">{ptpStatus.ptpGrandmasterId}</span>
              <div className="flex justify-between pt-2 border-t border-zinc-800 text-[11px]">
                <span className="text-zinc-500">Clock Class:</span>
                <span className="text-white font-bold">{ptpStatus.clockClass} (Primary GNSS)</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-500">PTP Domain Number:</span>
                <span className="text-white font-bold">0 (Power Profile)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Time Offset & Delay Tracking</span>
              <div className="flex justify-between items-baseline">
                <span className="text-zinc-400">Offset from Master:</span>
                <span className="text-xl font-extrabold text-emerald-400">+{ptpStatus.offsetToMasterNs} ns</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-zinc-400">Mean Path Delay:</span>
                <span className="text-sm font-bold text-cyan-400">{ptpStatus.meanPathDelayNs} ns</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-sans pt-1">
                Max allowable profile offset: &plusmn;1,000 ns (1 &mu;s) for 1% TVE synchrophasor limit.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">Network Frame Statistics</span>
              <div className="flex justify-between items-baseline">
                <span className="text-zinc-400">Process Bus Throughput:</span>
                <span className="text-lg font-bold text-white">{ptpStatus.packetsPerSec.toLocaleString()} pps</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-zinc-400">Dropped GOOSE Frames:</span>
                <span className="text-sm font-bold text-emerald-400">0 (0.00%)</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-zinc-400">Corrupted SV Packets:</span>
                <span className="text-sm font-bold text-emerald-400">0 (0.00%)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

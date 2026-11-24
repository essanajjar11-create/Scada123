import React, { useState } from 'react';
import { Terminal, Pause, Play, Trash2, Cpu } from 'lucide-react';
import { ProtocolPacket } from '../../types/substation';

interface ProtocolSnifferProps {
  packets: ProtocolPacket[];
  onClear: () => void;
}

export const ProtocolSniffer: React.FC<ProtocolSnifferProps> = ({ packets, onClear }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [selectedPacket, setSelectedPacket] = useState<ProtocolPacket | null>(null);

  const displayPackets = isPaused ? packets : packets.slice(-25);

  return (
    <div className="bg-[#0c0e12] border border-[#252a36] rounded-2xl p-4 shadow-2xl font-mono text-xs">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b border-[#212733] pb-2.5 mb-3 font-sans">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-xs text-slate-200 tracking-wide">
            محلل حزم بروتوكولات الشبكة الصناعية (Substation Protocol Sniffer)
          </h3>
          <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono px-2 py-0.2 rounded">
            PORT 2404 / 0x88B8
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition ${
              isPaused
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            <span>{isPaused ? 'استئناف' : 'إيقاف مؤقت'}</span>
          </button>

          <button
            onClick={onClear}
            title="مسح نافذة الالتقاط"
            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Packet Stream Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Packets Stream */}
        <div className="lg:col-span-2 bg-[#08090c] p-2.5 rounded-xl border border-[#1b202a] max-h-52 overflow-y-auto space-y-1.5 font-mono text-[11px]">
          {displayPackets.length === 0 ? (
            <div className="text-slate-600 text-center py-6 font-sans">
              بانتظار حركة حزم IEC-104 و IEC-61850 الحية...
            </div>
          ) : (
            displayPackets.map((pkt) => {
              const isSelected = selectedPacket?.id === pkt.id;
              const isGoose = pkt.protocol === 'IEC-61850-GOOSE';

              return (
                <div
                  key={pkt.id}
                  onClick={() => setSelectedPacket(pkt)}
                  className={`p-1.5 rounded cursor-pointer transition border text-right ${
                    isSelected
                      ? 'bg-slate-800 border-amber-500/80 text-white'
                      : isGoose
                      ? 'bg-[#121820] border-cyan-900/40 hover:bg-[#1a2330] text-cyan-200'
                      : 'bg-[#16171d] border-slate-800 hover:bg-[#1f222b] text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span className="font-bold text-amber-400">{pkt.protocol}</span>
                    <span>{pkt.timestamp.split('T')[1]?.replace('Z', '')}</span>
                  </div>
                  <div className="truncate text-slate-200 font-semibold">
                    {pkt.summary}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                    HEX: {pkt.rawHex}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Packet Inspector / Decoded View */}
        <div className="bg-[#08090c] p-3 rounded-xl border border-[#1b202a] max-h-52 overflow-y-auto space-y-2">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] border-b border-slate-800 pb-1 font-sans">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-slate-200">تحليل الحزمة المحددة (Decoded APDU)</span>
          </div>

          {selectedPacket ? (
            <div className="space-y-1.5 text-[11px]">
              <div className="bg-[#12151c] p-1.5 rounded border border-[#232936]">
                <span className="text-slate-500 block text-[10px]">البروتوكول:</span>
                <span className="font-bold text-cyan-400">{selectedPacket.protocol}</span>
              </div>
              
              <div className="bg-[#12151c] p-1.5 rounded border border-[#232936]">
                <span className="text-slate-500 block text-[10px]">البيانات المفككة (Fields):</span>
                <pre className="text-emerald-400 text-[10px] whitespace-pre-wrap font-mono mt-1">
                  {JSON.stringify(selectedPacket.details, null, 2)}
                </pre>
              </div>

              <div className="bg-[#12151c] p-1.5 rounded border border-[#232936]">
                <span className="text-slate-500 block text-[10px]">Raw Frame Octets:</span>
                <div className="font-mono text-[9px] text-amber-300 break-all mt-0.5">
                  {selectedPacket.rawHex}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-600 text-center py-10 font-sans text-xs">
              اضغط على أي حزمة في الشريط الأيسر لعرض تحليلها التفصيلي.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

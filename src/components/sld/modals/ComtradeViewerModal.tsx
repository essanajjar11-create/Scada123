import React, { useState } from 'react';
import { Activity, Download, X, Zap, FileText, CheckCircle2 } from 'lucide-react';

interface ComtradeViewerModalProps {
  assetName: string;
  onClose: () => void;
}

export const ComtradeViewerModal: React.FC<ComtradeViewerModalProps> = ({ assetName, onClose }) => {
  const [downloading, setDownloading] = useState(false);

  // Generate mock COMTRADE config (.CFG) and data (.DAT) strings
  const triggerTime = new Date().toISOString();

  const handleDownloadComtrade = () => {
    setDownloading(true);

    const cfgContent = `IEEE COMTRADE 1999 Standard Format
${assetName}_Substation_Fault_Record,1999
7,4A,3V
1,Ia,A,,A,1.0,0.0,0,-32768,32767,1.0,1.0,S
2,Ib,A,,A,1.0,0.0,0,-32768,32767,1.0,1.0,S
3,Ic,A,,A,1.0,0.0,0,-32768,32767,1.0,1.0,S
4,In,A,,A,1.0,0.0,0,-32768,32767,1.0,1.0,S
5,Va,V,,V,1.0,0.0,0,-32768,32767,1.0,1.0,S
6,Vb,V,,V,1.0,0.0,0,-32768,32767,1.0,1.0,S
7,Vc,V,,V,1.0,0.0,0,-32768,32767,1.0,1.0,S
50.0
1
4000,1000
${triggerTime}
${triggerTime}
ASCII
1.0`;

    const datContent = Array.from({ length: 400 }, (_, i) => {
      const t = i * 0.00025;
      const ia = Math.round(500 * Math.sin(2 * Math.PI * 50 * t + (i > 100 ? 1.5 : 0)));
      const ib = Math.round(500 * Math.sin(2 * Math.PI * 50 * t - (2 * Math.PI) / 3));
      const ic = Math.round(500 * Math.sin(2 * Math.PI * 50 * t + (2 * Math.PI) / 3));
      const inVal = ia + ib + ic;
      const va = Math.round(76200 * Math.sin(2 * Math.PI * 50 * t));
      const vb = Math.round(76200 * Math.sin(2 * Math.PI * 50 * t - (2 * Math.PI) / 3));
      const vc = Math.round(76200 * Math.sin(2 * Math.PI * 50 * t + (2 * Math.PI) / 3));
      return `${i + 1},${Math.round(t * 1e6)},${ia},${ib},${ic},${inVal},${va},${vb},${vc}`;
    }).join('\n');

    // Trigger download for CFG
    const elementCfg = document.createElement('a');
    const fileCfg = new Blob([cfgContent], { type: 'text/plain' });
    elementCfg.href = URL.createObjectURL(fileCfg);
    elementCfg.download = `${assetName.replace(/\s+/g, '_')}_Transient_${Date.now()}.CFG`;
    document.body.appendChild(elementCfg);
    elementCfg.click();

    // Trigger download for DAT
    setTimeout(() => {
      const elementDat = document.createElement('a');
      const fileDat = new Blob([datContent], { type: 'text/plain' });
      elementDat.href = URL.createObjectURL(fileDat);
      elementDat.download = `${assetName.replace(/\s+/g, '_')}_Transient_${Date.now()}.DAT`;
      document.body.appendChild(elementDat);
      elementDat.click();
      setDownloading(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl p-6 shadow-2xl relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
          <div className="p-2.5 bg-amber-950 border border-amber-600/60 rounded-lg text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 uppercase">
              COMTRADE Oscillography Transient Record
            </h2>
            <p className="text-xs text-slate-400">IEEE C37.111 / IEC 60255-24 Disturbance Waveform Viewer</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Trigger Asset:</span>
            <span className="font-bold text-cyan-300">{assetName}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Sampling Rate:</span>
            <span className="font-bold text-slate-200">4,000 Hz (80 samples/cycle @ 50Hz)</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Record Window:</span>
            <span className="font-bold text-slate-200">100 ms Pre-Trigger / 300 ms Post-Trigger</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Captured Analog Channels:</span>
            <span className="font-bold text-amber-300">3x Phase Current (Ia, Ib, Ic), Neutral In, 3x Phase Voltage (Va, Vb, Vc)</span>
          </div>

          {/* SVG Waveform Graphic */}
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">3-Phase Fault Current Oscillogram</span>
            <svg viewBox="0 0 500 120" className="w-full h-28 bg-slate-950 rounded border border-slate-800">
              <line x1="0" y1="60" x2="500" y2="60" stroke="#1e293b" strokeDasharray="3,3" />
              <line x1="150" y1="0" x2="150" y2="120" stroke="#ef4444" strokeDasharray="2,2" />
              <text x="155" y="15" fill="#ef4444" fontSize="9" fontWeight="bold">TRIP INSTANT</text>
              {/* Phase A */}
              <path
                d="M 0 60 Q 30 20 60 60 T 120 60 T 150 60 Q 170 -10 190 120 T 230 60 T 270 60 T 320 60 T 380 60 T 440 60 T 500 60"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="1.8"
              />
              {/* Phase B */}
              <path
                d="M 0 60 Q 30 90 60 60 T 120 60 T 150 60 Q 180 100 210 20 T 250 60 T 300 60 T 360 60 T 420 60 T 480 60"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              {/* Phase C */}
              <path
                d="M 0 60 Q 30 60 60 60 T 120 60 T 150 60 Q 175 110 200 10 T 240 60 T 290 60 T 350 60 T 410 60 T 470 60"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          <div className="flex items-center space-x-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>COMTRADE 1999 Standard Formatted</span>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleDownloadComtrade}
              disabled={downloading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Exporting...' : 'Export .CFG & .DAT Package'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

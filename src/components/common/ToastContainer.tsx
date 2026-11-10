import React from 'react';
import { useScada } from '../../context/ScadaContext';
import { Activity, Shield, X, AlertOctagon } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { remoteToasts, dismissToast } = useScada();

  if (remoteToasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-md w-full pointer-events-none font-sans">
      {remoteToasts.map((toast) => {
        const isEngineer = toast.operatorRole === 'engineer';
        const isManager = toast.operatorRole === 'manager';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-[#09090b]/95 border border-indigo-500/80 rounded-xl p-4 shadow-[0_0_30px_rgba(79,70,229,0.35)] backdrop-blur-md flex items-start justify-between gap-3 animate-slideUp transition-all font-sans"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                isManager
                  ? 'bg-purple-950/80 border border-purple-700 text-purple-300'
                  : isEngineer
                  ? 'bg-indigo-950/80 border border-indigo-700 text-indigo-300'
                  : 'bg-zinc-900 border border-zinc-700 text-cyan-300'
              }`}>
                {isManager || isEngineer ? (
                  <Shield className="w-5 h-5 animate-pulse" />
                ) : (
                  <Activity className="w-5 h-5 animate-pulse text-cyan-400" />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs text-white">
                    {toast.operatorName}
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-mono font-black uppercase rounded ${
                    isManager
                      ? 'bg-purple-950 text-purple-300 border border-purple-800'
                      : isEngineer
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  }`}>
                    {toast.operatorRole}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {toast.timestamp}
                  </span>
                </div>

                <div className="text-xs font-bold text-indigo-300">
                  {toast.actionTitle}
                </div>

                <div className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-1 rounded">
                  {toast.actionDetails}
                </div>
              </div>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              title="Dismiss Notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

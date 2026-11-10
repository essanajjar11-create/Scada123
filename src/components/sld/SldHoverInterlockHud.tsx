import React from 'react';
import { ShieldCheck, ShieldAlert, Lock, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

export interface InterlockRuleInfo {
  tag: string;
  name: string;
  isClosed: boolean;
  isPermissive: boolean;
  ruleCode: string;
  conditionDescription: string;
  blockingReasons?: string[];
  interlockedAssets?: string[];
}

interface SldHoverInterlockHudProps {
  info: InterlockRuleInfo | null;
  position: { x: number; y: number } | null;
}

const SldHoverInterlockHudImpl: React.FC<SldHoverInterlockHudProps> = ({ info, position }) => {
  const { t } = useScada();
  if (!info || !position) return null;

  return (
    <div
      className="fixed z-40 pointer-events-none transition-all duration-150 font-sans shadow-2xl"
      style={{
        left: `${Math.min(window.innerWidth - 320, Math.max(20, position.x + 15))}px`,
        top: `${Math.min(window.innerHeight - 220, Math.max(20, position.y + 15))}px`,
      }}
    >
      <div className="bg-zinc-950/95 border border-zinc-700/90 rounded-xl p-3 max-w-xs shadow-2xl backdrop-blur-xl text-xs space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
          <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
            <span className="font-mono font-bold text-cyan-400">[{info.tag}]</span>
            <span className="font-bold text-zinc-100 text-[11px] truncate max-w-[140px]">{info.name}</span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
              info.isPermissive
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}
          >
            {info.isPermissive ? t('permissive_badge') : t('interlocked_badge')}
          </span>
        </div>

        {/* Rule Code & Description */}
        <div className="space-y-1 text-[11px]">
          <div className="text-zinc-400 font-mono text-[10px]">
            {t('safety_rule_label')} <strong className="text-amber-400">{info.ruleCode}</strong>
          </div>
          <p className="text-zinc-300 leading-snug">
            {info.conditionDescription}
          </p>
        </div>

        {/* Blocking Reasons if any */}
        {info.blockingReasons && info.blockingReasons.length > 0 && (
          <div className="pt-1.5 border-t border-zinc-800 space-y-1">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
              {t('inhibiting_conditions')}
            </span>
            {info.blockingReasons.map((reason, idx) => (
              <div key={idx} className="flex items-start space-x-1 rtl:space-x-reverse text-[10px] text-rose-300">
                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        )}

        {/* Interlocked Equipment links */}
        {info.interlockedAssets && info.interlockedAssets.length > 0 && (
          <div className="text-[10px] text-zinc-500 font-mono pt-1 border-t border-zinc-800">
            {t('interlocked_with')} {info.interlockedAssets.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

export const SldHoverInterlockHud = React.memo(SldHoverInterlockHudImpl);

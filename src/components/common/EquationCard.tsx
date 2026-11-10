import React from 'react';
import { Cpu, Info, CheckCircle2, ChevronRight } from 'lucide-react';

export interface EquationVariable {
  symbol: string | React.ReactNode;
  label: string;
  value?: string | number;
  unit?: string;
  color?: string;
}

export interface EquationCardProps {
  title: string;
  standard?: string;
  equation: React.ReactNode;
  description?: string;
  variables?: EquationVariable[];
  result?: {
    label: string;
    value: string | number;
    unit?: string;
    status?: string;
    statusColor?: string;
  };
  className?: string;
}

export const EquationCard: React.FC<EquationCardProps> = ({
  title,
  standard,
  equation,
  description,
  variables,
  result,
  className = ''
}) => {
  return (
    <div className={`bg-slate-950/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl font-mono text-xs space-y-3.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-950 border border-indigo-700/60 rounded-lg text-indigo-400">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-200 text-xs uppercase tracking-wide">{title}</span>
        </div>
        {standard && (
          <span className="px-2 py-0.5 bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 rounded text-[10px] font-bold">
            {standard}
          </span>
        )}
      </div>

      {/* Main Equation Formula Box */}
      <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-3.5 text-center shadow-inner overflow-x-auto">
        <div className="text-sm sm:text-base font-bold text-cyan-300 tracking-wider flex items-center justify-center gap-2 py-1">
          {equation}
        </div>
        {description && (
          <p className="text-[11px] text-slate-400 mt-1 font-sans font-normal">
            {description}
          </p>
        )}
      </div>

      {/* Variables Table / Grid */}
      {variables && variables.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
          {variables.map((v, idx) => (
            <div key={idx} className="flex items-center justify-between bg-slate-900/60 px-2.5 py-1.5 rounded border border-slate-800/80">
              <div className="flex items-center space-x-1.5">
                <span className={`font-bold ${v.color || 'text-cyan-400'}`}>{v.symbol}:</span>
                <span className="text-slate-400">{v.label}</span>
              </div>
              {v.value !== undefined && (
                <span className="font-bold text-slate-200 ml-2">
                  {v.value} {v.unit || ''}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Result Display Box */}
      {result && (
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-bold">{result.label}:</span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className={`text-base font-extrabold ${result.statusColor || 'text-emerald-400'}`}>
              {result.value}
            </span>
            {result.unit && <span className="text-slate-400 text-[10px]">{result.unit}</span>}
            {result.status && (
              <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${result.statusColor || 'bg-emerald-950 text-emerald-300 border-emerald-700'}`}>
                {result.status}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

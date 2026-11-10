import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface SldPowerFlowVectorBadgeProps {
  x: number; // SVG X coordinate
  y: number; // SVG Y coordinate
  pMW: number; // Active Power in MW (positive = export / outgoing, negative = import / incoming)
  qMVAR: number; // Reactive Power in MVAR
  pf: number; // Power factor e.g. 0.95
  deltaDeg?: number; // Phase angle delta
  label?: string;
  loadingPct?: number; // Thermal loading %
  onClick?: () => void;
}

const SldPowerFlowVectorBadgeImpl: React.FC<SldPowerFlowVectorBadgeProps> = ({
  x,
  y,
  pMW,
  qMVAR,
  pf,
  deltaDeg = 0.0,
  label,
  loadingPct = 50,
  onClick,
}) => {
  const isExport = pMW >= 0;
  const absP = Math.abs(pMW);
  const absQ = Math.abs(qMVAR);

  // Loading color indicator
  const loadColor = loadingPct > 90 ? '#ef4444' : loadingPct > 70 ? '#eab308' : '#10b981';
  const badgeBg = loadingPct > 90 ? '#450a0a' : loadingPct > 70 ? '#422006' : '#022c22';
  const badgeBorder = loadingPct > 90 ? '#ef4444' : loadingPct > 70 ? '#f59e0b' : '#059669';

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer group select-none font-mono"
      onClick={onClick}
    >
      {/* Background Pill */}
      <rect
        x="-46"
        y="-14"
        width="92"
        height="28"
        rx="6"
        fill={badgeBg}
        fillOpacity="0.9"
        stroke={badgeBorder}
        strokeWidth="1.2"
        className="transition-all group-hover:stroke-cyan-400 group-hover:stroke-[1.8]"
      />

      {/* Loading indicator bar on top */}
      <rect
        x="-42"
        y="-12"
        width={Math.min(84, (loadingPct / 100) * 84)}
        height="2.5"
        rx="1"
        fill={loadColor}
      />

      {/* Active Power P and Arrow */}
      <text
        x="-38"
        y="2"
        fill="#f8fafc"
        fontSize="8.5"
        fontWeight="bold"
        textAnchor="start"
      >
        {isExport ? '➔' : '⬅'} {absP.toFixed(1)} MW
      </text>

      {/* Reactive Q and PF / Angle */}
      <text
        x="-38"
        y="10"
        fill="#94a3b8"
        fontSize="7.5"
        textAnchor="start"
      >
        {absQ.toFixed(1)} MVAR • cosφ {pf.toFixed(2)}
      </text>
    </g>
  );
};

export const SldPowerFlowVectorBadge = React.memo(SldPowerFlowVectorBadgeImpl);

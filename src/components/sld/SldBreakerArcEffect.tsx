import React from 'react';

interface SldBreakerArcEffectProps {
  activeArc: {
    x: number;
    y: number;
    id: string;
    action: string;
    timingMs: number;
  } | null;
}

const SldBreakerArcEffectImpl: React.FC<SldBreakerArcEffectProps> = ({ activeArc }) => {
  if (!activeArc) return null;

  const { x, y, id, action, timingMs } = activeArc;

  return (
    <g transform={`translate(${x}, ${y})`} className="font-mono select-none pointer-events-none">
      {/* 1. Outer Expanding Shockwave Ring */}
      <circle
        cx="0"
        cy="0"
        r="28"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2.5"
        opacity="0.8"
        className="animate-ping"
      />

      {/* 2. Arc Flash Radial Rays */}
      <path
        d="M -15 -15 L 15 15 M 15 -15 L -15 15 M -20 0 L 20 0 M 0 -20 L 0 20"
        stroke="#fbbf24"
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-pulse"
      />

      {/* 3. Center Arc Core */}
      <circle cx="0" cy="0" r="10" fill="#fef08a" filter="url(#glow)" />
      <circle cx="0" cy="0" r="5" fill="#ffffff" />

      {/* 4. Contact Timing Floating Badge */}
      <g transform="translate(24, -20)">
        <rect
          x="0"
          y="0"
          width="135"
          height="22"
          rx="6"
          fill="#451a03"
          stroke="#f59e0b"
          strokeWidth="1.5"
          className="shadow-xl"
        />
        <text x="8" y="14" fill="#fef3c7" fontSize="9" fontWeight="extrabold">
          ⚡ {id} {action} ({timingMs}ms)
        </text>
      </g>
    </g>
  );
};

export const SldBreakerArcEffect = React.memo(SldBreakerArcEffectImpl);

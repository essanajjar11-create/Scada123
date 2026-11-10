import React from 'react';

interface SldMiniSparklineProps {
  x: number;
  y: number;
  data: number[];
  label: string;
  unit: string;
  color?: string;
  width?: number;
  height?: number;
}

const SldMiniSparklineImpl: React.FC<SldMiniSparklineProps> = ({
  x,
  y,
  data,
  label,
  unit,
  color = '#38bdf8',
  width = 60,
  height = 18,
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, idx) => {
      const px = (idx / (data.length - 1)) * width;
      const py = height - ((val - min) / range) * (height - 4) - 2;
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(' ');

  const lastValue = data[data.length - 1];

  return (
    <g transform={`translate(${x}, ${y})`} className="select-none font-mono pointer-events-none">
      {/* Background Container Box */}
      <rect
        x="-4"
        y="-14"
        width={width + 54}
        height={height + 18}
        rx="6"
        fill="#090d16"
        fillOpacity="0.88"
        stroke="#1e293b"
        strokeWidth="1"
      />
      {/* Telemetry Header */}
      <text x="0" y="-4" fill="#94a3b8" fontSize="7.5" fontWeight="bold">
        {label}: <tspan fill={color} font-weight="extrabold">{lastValue.toFixed(1)} {unit}</tspan>
      </text>
      {/* Sparkline Line */}
      <g transform="translate(0, 0)">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {/* Current Value Glowing Dot */}
        <circle
          cx={width}
          cy={height - ((lastValue - min) / range) * (height - 4) - 2}
          r="2.5"
          fill={color}
        />
      </g>
    </g>
  );
};

export const SldMiniSparkline = React.memo(SldMiniSparklineImpl);

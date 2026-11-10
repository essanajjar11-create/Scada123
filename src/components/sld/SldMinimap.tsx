import React, { useRef, useState } from 'react';
import { Eye, Maximize2, Crosshair, Layers } from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { BayId } from './SldBaySelectorBar';

interface SldMinimapProps {
  zoom: number;
  pan: { x: number; y: number };
  onPanTo: (x: number, y: number) => void;
  isBusALive: boolean;
  isBusBLive: boolean;
  isMVBus1Live: boolean;
  isMVBus2Live: boolean;
  focusedBay?: BayId;
  onSelectBay?: (bay: BayId) => void;
}

const SldMinimapImpl: React.FC<SldMinimapProps> = ({
  zoom,
  pan,
  onPanTo,
  isBusALive,
  isBusBLive,
  isMVBus1Live,
  isMVBus2Live,
  focusedBay = 'ALL',
  onSelectBay,
}) => {
  const { t } = useScada();
  const mapWidth = 200;
  const mapHeight = 125;
  const scaleX = mapWidth / 1200;
  const scaleY = mapHeight / 650;

  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Viewport box calculations (strictly synchronized with zoom scale and screen pan)
  const vpWidth = Math.min(mapWidth, mapWidth / zoom);
  const vpHeight = Math.min(mapHeight, mapHeight / zoom);

  // The center of the visible area in SVG coordinates (1200 x 650):
  const centerSvgX = 600 - pan.x / zoom;
  const centerSvgY = 325 - pan.y / zoom;

  // Center projected into Minimap coordinates (200 x 125):
  const centerMapX = centerSvgX * scaleX;
  const centerMapY = centerSvgY * scaleY;

  const vpX = Math.max(0, Math.min(mapWidth - vpWidth, centerMapX - vpWidth / 2));
  const vpY = Math.max(0, Math.min(mapHeight - vpHeight, centerMapY - vpHeight / 2));

  const handlePointerNav = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(mapWidth, clientX - rect.left));
    const clickY = Math.max(0, Math.min(mapHeight, clientY - rect.top));

    // Calculate target point in SLD space (1200 x 650)
    const targetSvgX = clickX / scaleX;
    const targetSvgY = clickY / scaleY;

    // Pan required to center this target point at current zoom:
    const newPanX = Math.round((600 - targetSvgX) * zoom);
    const newPanY = Math.round((325 - targetSvgY) * zoom);
    onPanTo(newPanX, newPanY);
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    handlePointerNav(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      handlePointerNav(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="bg-zinc-950/95 border border-zinc-700/80 rounded-xl p-2.5 shadow-2xl backdrop-blur-md space-y-2 font-sans select-none"
      onMouseLeave={handleMouseUp}
    >
      {/* Header */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
        <span className="flex items-center space-x-1.5 text-cyan-400 font-mono">
          <Eye className="w-3.5 h-3.5" />
          <span>{t('radar_minimap') || 'Substation Radar'}</span>
        </span>
        <button
          onClick={() => {
            onPanTo(0, 0);
            if (onSelectBay) onSelectBay('ALL');
          }}
          title={t('zoom_reset') || 'Reset Viewport'}
          className="p-1 text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
        <svg
          ref={svgRef}
          width={mapWidth}
          height={mapHeight}
          className="cursor-crosshair block"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Canvas Background Grid */}
          <rect width={mapWidth} height={mapHeight} fill="#090d16" />

          {/* Bay Bounding Boxes */}
          {/* Bay 01: TR-1 */}
          <rect
            x={160 * scaleX}
            y={50 * scaleY}
            width={280 * scaleX}
            height={340 * scaleY}
            fill={focusedBay === 'BAY_01_TR1' ? '#06b6d4' : '#3b82f6'}
            fillOpacity={focusedBay === 'BAY_01_TR1' ? '0.2' : '0.04'}
            stroke={focusedBay === 'BAY_01_TR1' ? '#06b6d4' : '#1e293b'}
            strokeWidth="1"
            strokeDasharray="2 2"
          />

          {/* Bay 03: TR-2 */}
          <rect
            x={560 * scaleX}
            y={50 * scaleY}
            width={280 * scaleX}
            height={340 * scaleY}
            fill={focusedBay === 'BAY_03_TR2' ? '#06b6d4' : '#3b82f6'}
            fillOpacity={focusedBay === 'BAY_03_TR2' ? '0.2' : '0.04'}
            stroke={focusedBay === 'BAY_03_TR2' ? '#06b6d4' : '#1e293b'}
            strokeWidth="1"
            strokeDasharray="2 2"
          />

          {/* Bay 07: HVDC VSC-MMC */}
          <rect
            x={920 * scaleX}
            y={50 * scaleY}
            width={240 * scaleX}
            height={400 * scaleY}
            fill={focusedBay === 'BAY_07_HVDC' ? '#06b6d4' : '#6366f1'}
            fillOpacity={focusedBay === 'BAY_07_HVDC' ? '0.2' : '0.04'}
            stroke={focusedBay === 'BAY_07_HVDC' ? '#06b6d4' : '#1e293b'}
            strokeWidth="1"
            strokeDasharray="2 2"
          />

          {/* 132kV Main Bus A & B mini lines */}
          <line
            x1={90 * scaleX}
            y1={80 * scaleY}
            x2={1100 * scaleX}
            y2={80 * scaleY}
            stroke={isBusALive ? '#10b981' : '#52525b'}
            strokeWidth="2.5"
          />
          <line
            x1={90 * scaleX}
            y1={120 * scaleY}
            x2={1100 * scaleX}
            y2={120 * scaleY}
            stroke={isBusBLive ? '#10b981' : '#52525b'}
            strokeWidth="2.5"
          />

          {/* Bus Coupler 52-0 mini line */}
          <line
            x1={500 * scaleX}
            y1={80 * scaleY}
            x2={500 * scaleX}
            y2={120 * scaleY}
            stroke="#38bdf8"
            strokeWidth="1.5"
          />

          {/* TR-1 HV Path & Transformer Body */}
          <line x1={320 * scaleX} y1={80 * scaleY} x2={320 * scaleX} y2={240 * scaleY} stroke="#10b981" strokeWidth="1.5" />
          <circle cx={320 * scaleX} cy={260 * scaleY} r={8 * scaleX} fill="none" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx={320 * scaleX} cy={275 * scaleY} r={8 * scaleX} fill="none" stroke="#06b6d4" strokeWidth="1.5" />
          <line x1={320 * scaleX} y1={290 * scaleY} x2={320 * scaleX} y2={420 * scaleY} stroke="#10b981" strokeWidth="1.5" />

          {/* TR-2 HV Path & Transformer Body */}
          <line x1={680 * scaleX} y1={80 * scaleY} x2={680 * scaleX} y2={240 * scaleY} stroke="#10b981" strokeWidth="1.5" />
          <circle cx={680 * scaleX} cy={260 * scaleY} r={8 * scaleX} fill="none" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx={680 * scaleX} cy={275 * scaleY} r={8 * scaleX} fill="none" stroke="#06b6d4" strokeWidth="1.5" />
          <line x1={680 * scaleX} y1={290 * scaleY} x2={680 * scaleX} y2={420 * scaleY} stroke="#10b981" strokeWidth="1.5" />

          {/* 13.8kV MV Bus Section 1 & 2 */}
          <line
            x1={150 * scaleX}
            y1={420 * scaleY}
            x2={480 * scaleX}
            y2={420 * scaleY}
            stroke={isMVBus1Live ? '#10b981' : '#52525b'}
            strokeWidth="2.5"
          />
          <line
            x1={520 * scaleX}
            y1={420 * scaleY}
            x2={850 * scaleX}
            y2={420 * scaleY}
            stroke={isMVBus2Live ? '#10b981' : '#52525b'}
            strokeWidth="2.5"
          />

          {/* Sectionalizer 52-6 */}
          <line x1={480 * scaleX} y1={420 * scaleY} x2={520 * scaleX} y2={420 * scaleY} stroke="#38bdf8" strokeWidth="1.5" />

          {/* Feeders & BESS lines */}
          <line x1={180 * scaleX} y1={420 * scaleY} x2={180 * scaleX} y2={510 * scaleY} stroke="#38bdf8" strokeWidth="1.5" />
          <line x1={380 * scaleX} y1={420 * scaleY} x2={380 * scaleX} y2={510 * scaleY} stroke="#38bdf8" strokeWidth="1.5" />
          <line x1={620 * scaleX} y1={420 * scaleY} x2={620 * scaleX} y2={510 * scaleY} stroke="#38bdf8" strokeWidth="1.5" />
          <line x1={820 * scaleX} y1={420 * scaleY} x2={820 * scaleX} y2={500 * scaleY} stroke="#c084fc" strokeWidth="2" />

          {/* BESS Unit icon box */}
          <rect
            x={795 * scaleX}
            y={490 * scaleY}
            width={50 * scaleX}
            height={20 * scaleY}
            fill="#3b0764"
            stroke="#a855f7"
            strokeWidth="1"
            rx="1"
          />

          {/* HVDC Bay 07 Converter & DC link */}
          <line x1={1020 * scaleX} y1={80 * scaleY} x2={1020 * scaleX} y2={230 * scaleY} stroke="#10b981" strokeWidth="1.5" />
          <rect
            x={995 * scaleX}
            y={235 * scaleY}
            width={50 * scaleX}
            height={40 * scaleY}
            fill="#1e1b4b"
            stroke="#818cf8"
            strokeWidth="1"
            rx="2"
          />
          <line x1={995 * scaleX} y1={275 * scaleY} x2={995 * scaleX} y2={390 * scaleY} stroke="#ef4444" strokeWidth="1.5" />
          <line x1={1045 * scaleX} y1={275 * scaleY} x2={1045 * scaleX} y2={390 * scaleY} stroke="#3b82f6" strokeWidth="1.5" />

          {/* Draggable Active Viewport Lens Box */}
          <rect
            x={vpX}
            y={vpY}
            width={vpWidth}
            height={vpHeight}
            fill="#06b6d4"
            fillOpacity="0.18"
            stroke="#22d3ee"
            strokeWidth="1.5"
            strokeDasharray="3 2"
            rx="3"
            className="cursor-move"
          />

          {/* Viewport Center Target Dot */}
          <circle
            cx={vpX + vpWidth / 2}
            cy={vpY + vpHeight / 2}
            r="2"
            fill="#22d3ee"
          />
        </svg>
      </div>

      {/* Footer Instructions */}
      <div className="flex items-center justify-between text-[9px] text-zinc-400 font-mono">
        <span className="flex items-center space-x-1">
          <Crosshair className="w-2.5 h-2.5 text-cyan-400" />
          <span>{t('drag_to_pan') || 'Click/Drag to Pan'}</span>
        </span>
        <span className="text-cyan-400 font-bold">{Math.round(zoom * 100)}% ZOOM</span>
      </div>
    </div>
  );
};

export const SldMinimap = React.memo(SldMinimapImpl);

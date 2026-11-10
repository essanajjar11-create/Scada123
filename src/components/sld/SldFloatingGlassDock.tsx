import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Shield,
  LineChart,
  Flame,
  Layers,
  Eye,
  Compass,
  MapPin,
  Sliders,
  Check
} from 'lucide-react';
import { BayId } from './SldBaySelectorBar';

interface SldFloatingGlassDockProps {
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onResetView: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  layers: {
    powerFlow: boolean;
    assetDiagnostics: boolean;
    iec61850: boolean;
    protectionFaults: boolean;
    arcFlash: boolean;
    protectionZones?: boolean;
    miniSparklines?: boolean;
  };
  setLayers: React.Dispatch<React.SetStateAction<any>>;
  themeMode: 'ISA_101' | 'CYBERPUNK';
  onToggleThemeMode: () => void;
  isSynchroHudOpen?: boolean;
  onToggleSynchroHud?: () => void;
}

const SldFloatingGlassDockImpl: React.FC<SldFloatingGlassDockProps> = ({
  zoom,
  onZoomChange,
  onResetView,
  showMinimap,
  onToggleMinimap,
  layers,
  setLayers,
  themeMode,
  onToggleThemeMode,
  isSynchroHudOpen = false,
  onToggleSynchroHud,
}) => {
  return (
    <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2 p-2 rounded-2xl bg-[#090d16]/80 border border-zinc-700/80 backdrop-blur-xl shadow-2xl font-mono text-xs select-none">
      {/* Zoom Controls Group */}
      <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl">
        <button
          onClick={() => onZoomChange(Math.min(2.5, Number((zoom + 0.15).toFixed(2))))}
          className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4 text-cyan-400" />
        </button>
        <span className="px-2 text-[11px] font-bold text-cyan-300 min-w-[44px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => onZoomChange(Math.max(0.5, Number((zoom - 0.15).toFixed(2))))}
          className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4 text-cyan-400" />
        </button>
        <button
          onClick={onResetView}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Reset Zoom & Pan (1:1)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-[1px] h-6 bg-zinc-800" />

      {/* Layer Toggles Group */}
      <div className="flex items-center gap-1">
        {/* Protection Zones Layer */}
        <button
          onClick={() => setLayers((prev: any) => ({ ...prev, protectionZones: !prev.protectionZones }))}
          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            layers.protectionZones
              ? 'bg-purple-950/90 border-purple-500 text-purple-300 shadow-md shadow-purple-950/50'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
          title="Toggle Protection Zones (ANSI 87T, 87B, 21)"
        >
          <Shield className={`w-3.5 h-3.5 ${layers.protectionZones ? 'text-purple-400' : 'text-zinc-500'}`} />
          <span className="hidden sm:inline">Zones</span>
        </button>

        {/* Mini Sparklines Layer */}
        <button
          onClick={() => setLayers((prev: any) => ({ ...prev, miniSparklines: !prev.miniSparklines }))}
          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            layers.miniSparklines
              ? 'bg-cyan-950/90 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950/50'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
          title="Toggle Mini-Sparkline Telemetry Curves"
        >
          <LineChart className={`w-3.5 h-3.5 ${layers.miniSparklines ? 'text-cyan-400' : 'text-zinc-500'}`} />
          <span className="hidden sm:inline">Sparklines</span>
        </button>

        {/* Arc Flash Hazard Layer */}
        <button
          onClick={() => setLayers((prev: any) => ({ ...prev, arcFlash: !prev.arcFlash }))}
          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            layers.arcFlash
              ? 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-md shadow-rose-950/50'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
          title="Toggle NFPA 70E Arc Flash Hazard Boundaries"
        >
          <Flame className={`w-3.5 h-3.5 ${layers.arcFlash ? 'text-rose-400' : 'text-zinc-500'}`} />
          <span className="hidden sm:inline">Arc Flash</span>
        </button>

        {/* Minimap Toggle */}
        <button
          onClick={onToggleMinimap}
          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            showMinimap
              ? 'bg-amber-950/90 border-amber-500 text-amber-300 shadow-md shadow-amber-950/50'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
          title="Toggle Substation Minimap Radar"
        >
          <Compass className={`w-3.5 h-3.5 ${showMinimap ? 'text-amber-400' : 'text-zinc-500'}`} />
          <span className="hidden sm:inline">Radar</span>
        </button>

        {/* ANSI 25 Synchroscope HUD Toggle */}
        {onToggleSynchroHud && (
          <button
            onClick={onToggleSynchroHud}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isSynchroHudOpen
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/50 animate-pulse'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle ANSI 25 Synchrocheck & Vector Verification Scope"
          >
            <Compass className={`w-3.5 h-3.5 ${isSynchroHudOpen ? 'text-emerald-400 animate-spin' : 'text-zinc-500'}`} />
            <span className="hidden sm:inline">Sync (ANSI 25)</span>
          </button>
        )}
      </div>
    </div>
  );
};

export const SldFloatingGlassDock = React.memo(SldFloatingGlassDockImpl);

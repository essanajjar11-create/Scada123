import React from 'react';
import { Layers, Bookmark, ZoomIn, ZoomOut, RotateCcw, MapPin, Shield } from 'lucide-react';
import { useScada } from '../../context/ScadaContext';

export type BayId = 'ALL' | 'BAY_01_TR1' | 'BAY_02_COUPLER' | 'BAY_03_TR2' | 'BAY_04_MV1' | 'BAY_05_MV2' | 'BAY_06_BESS' | 'BAY_07_HVDC';

interface SldBaySelectorBarProps {
  focusedBay: BayId;
  onSelectBay: (bay: BayId) => void;
  onQuickJump: (x: number, y: number, zoomLevel: number) => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onResetView: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
}

const SldBaySelectorBarImpl: React.FC<SldBaySelectorBarProps> = ({
  focusedBay,
  onSelectBay,
  onQuickJump,
  zoom,
  onZoomChange,
  onResetView,
  showMinimap,
  onToggleMinimap,
}) => {
  const { t } = useScada();

  const bays: { id: BayId; labelKey: string; x: number; y: number; zoom: number }[] = [
    { id: 'ALL', labelKey: 'global_substation', x: 0, y: 0, zoom: 1.0 },
    { id: 'BAY_01_TR1', labelKey: 'bay_01_tr1_lbl', x: 180, y: 80, zoom: 1.35 },
    { id: 'BAY_02_COUPLER', labelKey: 'bay_02_coupler_lbl', x: 0, y: 150, zoom: 1.4 },
    { id: 'BAY_03_TR2', labelKey: 'bay_03_tr2_lbl', x: -180, y: 80, zoom: 1.35 },
    { id: 'BAY_07_HVDC', labelKey: 'bay_07_hvdc_lbl', x: 380, y: 80, zoom: 1.35 },
    { id: 'BAY_04_MV1', labelKey: 'bay_04_mv1_lbl', x: 150, y: -120, zoom: 1.35 },
    { id: 'BAY_05_MV2', labelKey: 'bay_05_mv2_lbl', x: -150, y: -120, zoom: 1.35 },
    { id: 'BAY_06_BESS', labelKey: 'bay_06_bess_lbl', x: -300, y: -120, zoom: 1.45 },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-zinc-900/90 border border-zinc-800/80 rounded-xl font-sans text-xs">
      {/* Bay Focus Isolation Buttons (ISA-101) */}
      <div className="flex items-center space-x-1.5 rtl:space-x-reverse flex-wrap">
        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center space-x-1 rtl:space-x-reverse px-1.5 font-mono">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t('isa101_bay_focus')}</span>
        </span>
        {bays.map((bay) => (
          <button
            key={bay.id}
            onClick={() => {
              onSelectBay(bay.id);
              onQuickJump(bay.x, bay.y, bay.zoom);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              focusedBay === bay.id
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20 font-extrabold'
                : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/50'
            }`}
          >
            {t(bay.labelKey)}
          </button>
        ))}
      </div>

      {/* Viewport Quick Zoom & Minimap Toggle */}
      <div className="flex items-center space-x-1 rtl:space-x-reverse bg-zinc-950/80 p-1 rounded-lg border border-zinc-800">
        <button
          onClick={() => onZoomChange(Math.min(zoom + 0.15, 1.8))}
          title={t('zoom_in')}
          className="p-1.5 hover:bg-zinc-800 text-zinc-300 rounded cursor-pointer transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onZoomChange(Math.max(zoom - 0.15, 0.7))}
          title={t('zoom_out')}
          className="p-1.5 hover:bg-zinc-800 text-zinc-300 rounded cursor-pointer transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onResetView}
          title={t('zoom_reset')}
          className="p-1.5 hover:bg-zinc-800 text-zinc-300 rounded cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-bold text-cyan-400 px-1.5 font-mono">{Math.round(zoom * 100)}%</span>

        <button
          onClick={onToggleMinimap}
          className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center space-x-1 rtl:space-x-reverse ${
            showMinimap ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          <span>{t('radar_btn')}</span>
        </button>
      </div>
    </div>
  );
};

export const SldBaySelectorBar = React.memo(SldBaySelectorBarImpl);

import React from 'react';
import { SubstationState, SwitchgearItem } from '../../types/substation';

interface SingleLineDiagramProps {
  state: SubstationState;
  onToggleSwitchgear: (id: string) => void;
}

export const SingleLineDiagram: React.FC<SingleLineDiagramProps> = ({ state, onToggleSwitchgear }) => {
  const { switchgears, measurements, bus1Energized, bus2Energized, transformers } = state;

  // Colors per ISA-101 / IEC standards
  const COLOR_220KV_ON = '#dc2626';  // Red (Energized 220 kV)
  const COLOR_110KV_ON = '#ea580c';  // Amber (Energized 110 kV)
  const COLOR_11KV_ON = '#0284c7';   // Sky Blue (Tertiary 11 kV)
  const COLOR_OFF = '#475569';       // Muted Steel Slate (De-energized)
  const COLOR_EARTH = '#22c55e';     // Ground Green

  const bus1Color = bus1Energized ? COLOR_220KV_ON : COLOR_OFF;
  const bus2Color = bus2Energized ? COLOR_220KV_ON : COLOR_OFF;

  // Flow & energization detection
  const t1HvLive = switchgears['CB5']?.state === 'CLOSED' && switchgears['DS9']?.state === 'CLOSED' && switchgears['DS10']?.state === 'CLOSED' && bus1Energized;
  const t2HvLive = switchgears['CB6']?.state === 'CLOSED' && switchgears['DS11']?.state === 'CLOSED' && switchgears['DS12']?.state === 'CLOSED' && bus2Energized;
  const t1LvLive = t1HvLive && transformers.T1.lvVoltageKV > 0;
  const t2LvLive = t2HvLive && transformers.T2.lvVoltageKV > 0;

  const couplerConnected = switchgears['CB4']?.state === 'CLOSED' && switchgears['DS7']?.state === 'CLOSED' && switchgears['DS8']?.state === 'CLOSED';
  const couplerEnergized = couplerConnected && (bus1Energized || bus2Energized);
  const couplerDir = measurements['BAY_COUPLER']?.flowDirection || 'NONE';

  const isFlowingW1 = (measurements['BAY_W1_1']?.currentL1_A || 0) > 5 && switchgears['CB1']?.state === 'CLOSED';
  const isFlowingW2 = (measurements['BAY_W2']?.currentL1_A || 0) > 5 && switchgears['CB2']?.state === 'CLOSED';
  const isFlowingW12 = (measurements['BAY_W1_2']?.currentL1_A || 0) > 5 && switchgears['CB3']?.state === 'CLOSED';
  const isFlowingCoupler = (measurements['BAY_COUPLER']?.currentL1_A || 0) > 2 && couplerEnergized;
  const isFlowingT1 = (measurements['BAY_T1']?.currentL1_A || 0) > 5 && t1HvLive;
  const isFlowingT2 = (measurements['BAY_T2']?.currentL1_A || 0) > 5 && t2HvLive;

  // 1. Render Animated Circuit Breaker
  const renderBreaker = (item: SwitchgearItem, x: number, y: number, labelSide: 'RIGHT' | 'TOP' | 'LEFT' = 'RIGHT') => {
    if (!item) return null;
    const isClosed = item.state === 'CLOSED';

    return (
      <g
        className="cursor-pointer group select-none"
        onClick={() => onToggleSwitchgear(item.id)}
      >
        <circle cx={x} cy={y} r={22} fill="transparent" className="group-hover:fill-amber-400/15 transition-all duration-200" />
        <rect
          x={x - 15}
          y={y - 15}
          width={30}
          height={30}
          rx={4}
          fill={isClosed ? '#dc2626' : '#0a0d13'}
          stroke={isClosed ? '#f87171' : '#22c55e'}
          strokeWidth={2.5}
          style={{ transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />

        {isClosed ? (
          <line
            x1={x}
            y1={y - 8}
            x2={x}
            y2={y + 8}
            stroke="#ffffff"
            strokeWidth={3}
            strokeLinecap="round"
            style={{ transition: 'all 0.2s ease-out' }}
          />
        ) : (
          <g style={{ transition: 'all 0.2s ease-out' }}>
            <line x1={x} y1={y - 9} x2={x} y2={y - 4} stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" />
            <circle cx={x} cy={y} r={3} fill="none" stroke="#22c55e" strokeWidth={2} />
            <line x1={x} y1={y + 4} x2={x} y2={y + 9} stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" />
          </g>
        )}

        {labelSide === 'RIGHT' && (
          <g transform={`translate(${x + 22}, ${y - 10})`}>
            <rect width={34} height={19} rx={4} fill="#141820" stroke="#2e3748" strokeWidth={1} />
            <text x={17} y={13.5} fill="#f1f5f9" fontSize={10.5} fontWeight="bold" fontFamily="IBM Plex Mono" textAnchor="middle">
              {item.id}
            </text>
          </g>
        )}
        {labelSide === 'LEFT' && (
          <g transform={`translate(${x - 56}, ${y - 10})`}>
            <rect width={34} height={19} rx={4} fill="#141820" stroke="#2e3748" strokeWidth={1} />
            <text x={17} y={13.5} fill="#f1f5f9" fontSize={10.5} fontWeight="bold" fontFamily="IBM Plex Mono" textAnchor="middle">
              {item.id}
            </text>
          </g>
        )}
        {labelSide === 'TOP' && (
          <g transform={`translate(${x - 17}, ${y - 30})`}>
            <rect width={34} height={19} rx={4} fill="#141820" stroke="#2e3748" strokeWidth={1} />
            <text x={17} y={13.5} fill="#f1f5f9" fontSize={10.5} fontWeight="bold" fontFamily="IBM Plex Mono" textAnchor="middle">
              {item.id}
            </text>
          </g>
        )}
      </g>
    );
  };

  // 2. Render Disconnector
  const renderDisconnector = (item: SwitchgearItem, x: number, y: number, orientation: 'V' | 'H' = 'V') => {
    if (!item) return null;
    const isClosed = item.state === 'CLOSED';

    if (orientation === 'H') {
      return (
        <g
          className="cursor-pointer group select-none"
          onClick={() => onToggleSwitchgear(item.id)}
        >
          <circle cx={x - 12} cy={y} r={3.5} fill="#94a3b8" />
          <circle cx={x + 12} cy={y} r={3.5} fill="#94a3b8" />
          <line
            x1={x - 12}
            y1={y}
            x2={x + 12}
            y2={y}
            stroke={isClosed ? '#dc2626' : '#22c55e'}
            strokeWidth={3}
            strokeLinecap="round"
            transform={`rotate(${isClosed ? 0 : -45} ${x - 12} ${y})`}
            style={{ transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.25s' }}
          />
          <g transform={`translate(${x - 16}, ${y + 10})`}>
            <rect width={32} height={16} rx={3} fill="#11141b" stroke="#2c3444" strokeWidth={0.8} />
            <text x={16} y={12} fill="#94a3b8" fontSize={9.5} fontWeight="bold" fontFamily="IBM Plex Mono" textAnchor="middle">
              {item.id}
            </text>
          </g>
        </g>
      );
    }

    return (
      <g
        className="cursor-pointer group select-none"
        onClick={() => onToggleSwitchgear(item.id)}
      >
        <circle cx={x} cy={y - 12} r={3.5} fill="#94a3b8" />
        <circle cx={x} cy={y + 12} r={3.5} fill="#94a3b8" />
        <line
          x1={x}
          y1={y + 12}
          x2={x}
          y2={y - 12}
          stroke={isClosed ? '#dc2626' : '#22c55e'}
          strokeWidth={3}
          strokeLinecap="round"
          transform={`rotate(${isClosed ? 0 : 42} ${x} ${y + 12})`}
          style={{ transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.25s' }}
        />
        <g transform={`translate(${x + 16}, ${y - 8})`}>
          <rect width={32} height={16} rx={3} fill="#11141b" stroke="#2c3444" strokeWidth={0.8} />
          <text x={16} y={12} fill="#94a3b8" fontSize={9.5} fontWeight="bold" fontFamily="IBM Plex Mono" textAnchor="middle">
            {item.id}
          </text>
        </g>
      </g>
    );
  };

  // 3. Render Earthing Switch
  const renderEarthSwitch = (item: SwitchgearItem, x: number, y: number, side: 'LEFT' | 'RIGHT' = 'RIGHT') => {
    if (!item) return null;
    const isClosed = item.state === 'CLOSED';
    const earthColor = isClosed ? COLOR_EARTH : '#64748b';
    const dir = side === 'RIGHT' ? 1 : -1;
    const armX = x + dir * 14;

    return (
      <g
        className="cursor-pointer group select-none"
        onClick={() => onToggleSwitchgear(item.id)}
      >
        <g
          transform={`rotate(${isClosed ? 0 : (dir * 50)} ${x} ${y})`}
          style={{ transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.2s' }}
        >
          <line x1={x} y1={y} x2={armX} y2={y} stroke={earthColor} strokeWidth={2.5} />
          <line x1={armX} y1={y - 7} x2={armX} y2={y + 7} stroke={earthColor} strokeWidth={2.5} />
          <line x1={armX + dir * 4} y1={y - 5} x2={armX + dir * 4} y2={y + 5} stroke={earthColor} strokeWidth={2} />
          <line x1={armX + dir * 8} y1={y - 2.5} x2={armX + dir * 8} y2={y + 2.5} stroke={earthColor} strokeWidth={1.5} />
        </g>
        <text
          x={armX + dir * 16}
          y={y + 3.5}
          fill={earthColor}
          fontSize={9.5}
          fontWeight="bold"
          fontFamily="IBM Plex Mono"
          textAnchor={side === 'RIGHT' ? 'start' : 'end'}
        >
          {item.id}
        </text>
      </g>
    );
  };

  // 4. Render Multi-Core Current Transformers (as in schematic ффффф)
  const renderCtCores = (x: number, y: number, coresCount: number = 5, orientation: 'V' | 'H' = 'V') => {
    return (
      <g opacity={0.88}>
        {Array.from({ length: coresCount }).map((_, i) => {
          const offset = (i - (coresCount - 1) / 2) * 5.5;
          const cx = orientation === 'V' ? x : x + offset;
          const cy = orientation === 'V' ? y + offset : y;
          return (
            <circle key={i} cx={cx} cy={cy} r={4.5} fill="none" stroke="#cbd5e1" strokeWidth={1.3} />
          );
        })}
      </g>
    );
  };

  // 5. Render IEC Surge Arrester (مانعة صواعق)
  const renderSurgeArrester = (x: number, y: number, side: 'LEFT' | 'RIGHT' = 'RIGHT') => {
    const dir = side === 'RIGHT' ? 1 : -1;
    const rx = x + dir * 14;
    return (
      <g opacity={0.9}>
        <line x1={x} y1={y} x2={rx} y2={y} stroke="#94a3b8" strokeWidth={1.4} />
        <rect x={rx - 4} y={y - 8} width={8} height={16} fill="#0d1117" stroke="#38bdf8" strokeWidth={1.4} rx={1} />
        <line x1={rx - 3} y1={y + 6} x2={rx + 3} y2={y - 6} stroke="#38bdf8" strokeWidth={1.2} />
        <line x1={rx} y1={y + 8} x2={rx} y2={y + 14} stroke="#22c55e" strokeWidth={1.4} />
        <line x1={rx - 4} y1={y + 14} x2={rx + 4} y2={y + 14} stroke="#22c55e" strokeWidth={1.4} />
        <line x1={rx - 2} y1={y + 16} x2={rx + 2} y2={y + 16} stroke="#22c55e" strokeWidth={1.2} />
      </g>
    );
  };

  // 6. Render Schematic Measuring Badges (A, V, W, Var, Wh)
  const renderMeterBadge = (label: string, x: number, y: number) => {
    const isWh = label === 'Wh';
    if (isWh) {
      return (
        <g transform={`translate(${x - 9}, ${y - 8})`}>
          <rect width={18} height={15} rx={2} fill="#0d1117" stroke="#cbd5e1" strokeWidth={1.2} />
          <text x={9} y={11} fill="#f1f5f9" fontSize={8} fontWeight="bold" fontFamily="IBM Plex Mono" textAnchor="middle">Wh</text>
        </g>
      );
    }
    return (
      <g transform={`translate(${x}, ${y})`}>
        <circle cx={0} cy={0} r={7.5} fill="#0d1117" stroke="#cbd5e1" strokeWidth={1.2} />
        <text x={0} y={3} fill="#f1f5f9" fontSize={8} fontWeight="bold" fontFamily="IBM Plex Mono" textAnchor="middle">{label}</text>
      </g>
    );
  };

  return (
    <div className="bg-[#0f1217] border border-[#262c38] rounded-2xl shadow-2xl overflow-hidden font-sans">
      
      {/* HTML Header Bar */}
      <div className="px-5 py-3.5 bg-[#151922] border-b border-[#252c3a] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-md shadow-red-500/50" />
          <h3 className="text-sm font-bold text-slate-100 tracking-wide font-sans">
            المخطط الكهربائي المطابق للأصل (Exact IEC/GOST Schematic Matching)
          </h3>
          <span className="bg-red-950/80 text-red-300 border border-red-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
            220/110/11 kV SUBSTATION
          </span>
          {(isFlowingW1 || isFlowingW2 || isFlowingW12) && (
            <span className="bg-amber-950/60 text-amber-400 border border-amber-800/80 text-[10px] font-mono px-2 py-0.5 rounded font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              سريان تيار حي (ACTIVE POWER FLOW)
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-5 text-xs font-mono" dir="ltr">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 bg-[#dc2626] rounded-sm shadow-sm shadow-red-600/50" />
            <span className="text-slate-200 font-sans">220 kV Busbar</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 bg-[#ea580c] rounded-sm shadow-sm shadow-amber-600/50" />
            <span className="text-slate-200 font-sans">110 kV Output</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 bg-[#0284c7] rounded-sm shadow-sm shadow-sky-600/50" />
            <span className="text-slate-200 font-sans">11 kV Tertiary</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 bg-[#22c55e] rounded-sm shadow-sm shadow-green-500/50" />
            <span className="text-slate-200 font-sans">Earthed / Open</span>
          </div>
        </div>
      </div>

      {/* Main SVG Schematic Canvas */}
      <div className="p-4 overflow-x-auto flex justify-center bg-[#0a0d13]" dir="ltr">
        <svg
          viewBox="0 0 1280 840"
          className="w-full h-auto max-w-[1280px] select-none"
        >
          {/* Subtle Substation Yard Background Grid */}
          <defs>
            <pattern id="yardGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#171d27" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="1280" height="840" fill="url(#yardGrid)" opacity="0.75" />

          {/* =========================================================================
              PROMINENT "220 kV" LABEL (Centered in the upper section matching schematic)
             ========================================================================= */}
          <text
            x="640"
            y="250"
            fill="#e2e8f0"
            fontSize="32"
            fontStyle="italic"
            fontWeight="bold"
            fontFamily="IBM Plex Serif, serif"
            textAnchor="middle"
            letterSpacing="2"
            opacity="0.85"
          >
            220 kV
          </text>

          {/* =========================================================================
              220 kV MAIN BUSBAR 1 (Left: X = 80 to 520, Y = 360)
             ========================================================================= */}
          <line
            x1="80"
            y1="360"
            x2="520"
            y2="360"
            stroke={bus1Color}
            strokeWidth="5.5"
            strokeLinecap="round"
            className={bus1Energized ? "anim-electric-220" : ""}
          />
          <g transform="translate(90, 335)">
            <rect width="170" height="20" rx="3" fill="#141820" stroke="#2a3344" strokeWidth="1" />
            <text x="8" y="14" fill={bus1Color} fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono">
              BUSBAR 1 • 220 kV ({bus1Energized ? `${(measurements['BUS1']?.voltageLL_kV || state.gridVoltageKV).toFixed(1)} kV` : '0.0 kV'})
            </text>
          </g>

          {/* Bus 1 Left End: Surge Arrester, Earthing Switch, Disconnector, and VT1 */}
          <line x1="80" y1="360" x2="80" y2="440" stroke={bus1Color} strokeWidth="2.5" />
          {renderSurgeArrester(80, 375, 'LEFT')}
          {renderDisconnector(switchgears['DS13'], 80, 395)}
          <circle cx="80" cy="450" r="9" fill="none" stroke="#94a3b8" strokeWidth="1.8" />
          <circle cx="80" cy="462" r="9" fill="none" stroke="#94a3b8" strokeWidth="1.8" />
          {renderMeterBadge('V', 105, 456)}
          <line x1="80" y1="471" x2="80" y2="485" stroke="#22c55e" strokeWidth="2" />
          {renderEarthSwitch(switchgears['ES13'], 80, 485, 'RIGHT')}
          <text x="60" y="515" fill="#38bdf8" fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono">
            {(measurements['BUS1']?.voltageLL_kV || 0).toFixed(1)} kV
          </text>

          {/* =========================================================================
              220 kV MAIN BUSBAR 2 (Right: X = 760 to 1200, Y = 360)
             ========================================================================= */}
          <line
            x1="760"
            y1="360"
            x2="1200"
            y2="360"
            stroke={bus2Color}
            strokeWidth="5.5"
            strokeLinecap="round"
            className={bus2Energized ? "anim-electric-220" : ""}
          />
          <g transform="translate(1010, 335)">
            <rect width="170" height="20" rx="3" fill="#141820" stroke="#2a3344" strokeWidth="1" />
            <text x="8" y="14" fill={bus2Color} fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono">
              BUSBAR 2 • 220 kV ({bus2Energized ? `${(measurements['BUS2']?.voltageLL_kV || state.gridVoltageKV).toFixed(1)} kV` : '0.0 kV'})
            </text>
          </g>

          {/* Bus 2 Right End: Disconnector, Earthing, Surge Arrester, and VT2 */}
          <line x1="1200" y1="360" x2="1200" y2="440" stroke={bus2Color} strokeWidth="2.5" />
          {renderSurgeArrester(1200, 375, 'RIGHT')}
          {renderDisconnector(switchgears['DS14'], 1200, 395)}
          <circle cx="1200" cy="450" r="9" fill="none" stroke="#94a3b8" strokeWidth="1.8" />
          <circle cx="1200" cy="462" r="9" fill="none" stroke="#94a3b8" strokeWidth="1.8" />
          {renderMeterBadge('V', 1175, 456)}
          <text x="1190" y="490" fill="#38bdf8" fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono" textAnchor="end">
            {(measurements['BUS2']?.voltageLL_kV || 0).toFixed(1)} kV
          </text>

          {/* =========================================================================
              BUS COUPLER BAY CB4 (Center: X = 520 to 760, Y = 360)
             ========================================================================= */}
          <line
            x1="520"
            y1="360"
            x2="760"
            y2="360"
            stroke={couplerEnergized ? COLOR_220KV_ON : COLOR_OFF}
            strokeWidth="4"
          />
          {isFlowingCoupler && (
            <line
              x1="520"
              y1="360"
              x2="760"
              y2="360"
              stroke="#fee2e2"
              strokeWidth="2.5"
              strokeOpacity="0.85"
              className={couplerDir === 'BUS2_TO_BUS1' ? 'anim-flow-left' : 'anim-flow-right'}
            />
          )}

          {renderDisconnector(switchgears['DS7'], 560, 360, 'H')}
          {renderEarthSwitch(switchgears['ES7'], 585, 360, 'RIGHT')}
          {renderBreaker(switchgears['CB4'], 640, 360, 'TOP')}
          
          {/* Coupler 5-core CT and Meters (A, Wh) matching schematic */}
          {renderCtCores(680, 360, 5, 'H')}
          {renderMeterBadge('A', 673, 340)}
          {renderMeterBadge('Wh', 690, 340)}

          {renderEarthSwitch(switchgears['ES8'], 700, 360, 'LEFT')}
          {renderDisconnector(switchgears['DS8'], 725, 360, 'H')}

          {/* Coupler Telemetry & Flow Direction Pill */}
          <g transform="translate(578, 392)">
            <rect width="124" height="32" rx="5" fill="#141820" stroke="#2e3748" strokeWidth="1" />
            <text x="62" y="13" fill="#e2e8f0" fontSize="10" fontWeight="bold" fontFamily="IBM Plex Mono" textAnchor="middle">
              {(measurements['BAY_COUPLER']?.currentL1_A || 0).toFixed(1)} A | {(measurements['BAY_COUPLER']?.activePowerMW || 0).toFixed(1)} MW
            </text>
            <text
              x="62"
              y="26"
              fill={couplerDir === 'NONE' ? '#64748b' : '#38bdf8'}
              fontSize="9"
              fontWeight="bold"
              fontFamily="IBM Plex Mono"
              textAnchor="middle"
            >
              {couplerDir === 'BUS1_TO_BUS2'
                ? 'FLOW: B1 ──▶ B2'
                : couplerDir === 'BUS2_TO_BUS1'
                ? 'FLOW: B1 ◀── B2'
                : couplerConnected
                ? 'BALANCED (0 FLOW)'
                : 'COUPLER OPEN'}
            </text>
          </g>

          {/* =========================================================================
              BAY 1: LINE W1' / W1 I (Top Left, X = 180, Y = 40 to 360)
             ========================================================================= */}
          <g transform="translate(130, 15)">
            <rect width="100" height="22" rx="4" fill="#181e28" stroke="#dc2626" strokeWidth="1.5" />
            <text x="50" y="15" fill="#f87171" fontSize="11" fontWeight="bold" fontFamily="IBM Plex Mono" textAnchor="middle">
              W1 I (220 kV)
            </text>
          </g>

          <line
            x1="180"
            y1="40"
            x2="180"
            y2="360"
            stroke={measurements['BAY_W1_1']?.voltageLL_kV > 0 ? COLOR_220KV_ON : COLOR_OFF}
            strokeWidth="3.5"
          />
          {isFlowingW1 && (
            <line
              x1="180"
              y1="40"
              x2="180"
              y2="360"
              stroke="#fee2e2"
              strokeWidth="2.5"
              strokeOpacity="0.9"
              className="anim-flow-down"
            />
          )}

          {/* Line W1' Surge Arrester & Coupling Capacitor */}
          {renderSurgeArrester(180, 50, 'RIGHT')}
          {renderEarthSwitch(switchgears['ES1'], 180, 80, 'RIGHT')}
          {renderDisconnector(switchgears['DS2'], 180, 120)}

          {/* 5-core CT & Meter Badges (Var, W, A, Wh) exactly per schematic */}
          {renderCtCores(180, 175, 5, 'V')}
          {renderMeterBadge('Var', 215, 150)}
          {renderMeterBadge('W', 215, 170)}
          {renderMeterBadge('A', 235, 170)}
          {renderMeterBadge('Wh', 215, 190)}

          {renderBreaker(switchgears['CB1'], 180, 235)}
          {renderEarthSwitch(switchgears['ES2'], 180, 280, 'RIGHT')}
          {renderDisconnector(switchgears['DS1'], 180, 315)}

          {/* Telemetry Card for Line W1' */}
          <g transform="translate(15, 125)">
            <rect width="125" height="72" rx="6" fill="#131720" stroke="#293344" strokeWidth="1.2" />
            <text x="10" y="18" fill="#38bdf8" fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono">
              U: {measurements['BAY_W1_1']?.voltageLL_kV.toFixed(1)} kV
            </text>
            <text x="10" y="34" fill="#4ade80" fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono">
              I: {measurements['BAY_W1_1']?.currentL1_A.toFixed(1)} A
            </text>
            <text x="10" y="50" fill="#fbbf24" fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono">
              P: {measurements['BAY_W1_1']?.activePowerMW.toFixed(1)} MW
            </text>
            <text x="10" y="65" fill="#94a3b8" fontSize="9" fontFamily="IBM Plex Mono">
              PF: {measurements['BAY_W1_1']?.powerFactor.toFixed(2)}
            </text>
          </g>

          {/* =========================================================================
              BAY 2: LINE W2 (Top Center-Left, X = 320, Y = 40 to 360)
             ========================================================================= */}
          <g transform="translate(275, 15)">
            <rect width="90" height="22" rx="4" fill="#181e28" stroke="#dc2626" strokeWidth="1.5" />
            <text x="45" y="15" fill="#f87171" fontSize="11" fontWeight="bold" fontFamily="IBM Plex Mono" textAnchor="middle">
              W2 (220 kV)
            </text>
          </g>

          <line
            x1="320"
            y1="40"
            x2="320"
            y2="360"
            stroke={measurements['BAY_W2']?.voltageLL_kV > 0 ? COLOR_220KV_ON : COLOR_OFF}
            strokeWidth="3.5"
          />
          {isFlowingW2 && (
            <line
              x1="320"
              y1="40"
              x2="320"
              y2="360"
              stroke="#fee2e2"
              strokeWidth="2.5"
              strokeOpacity="0.9"
              className="anim-flow-down"
            />
          )}

          {renderSurgeArrester(320, 50, 'RIGHT')}
          {renderEarthSwitch(switchgears['ES3'], 320, 80, 'RIGHT')}
          {renderDisconnector(switchgears['DS5'], 320, 120)}
          {renderCtCores(320, 175, 5, 'V')}
          {renderBreaker(switchgears['CB2'], 320, 235)}
          {renderEarthSwitch(switchgears['ES4'], 320, 280, 'RIGHT')}
          {renderDisconnector(switchgears['DS4'], 320, 315)}

          {/* Telemetry Card for Line W2 */}
          <g transform="translate(340, 125)">
            <rect width="105" height="72" rx="6" fill="#131720" stroke="#293344" strokeWidth="1.2" />
            <text x="8" y="18" fill="#38bdf8" fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono">
              U: {measurements['BAY_W2']?.voltageLL_kV.toFixed(1)} kV
            </text>
            <text x="8" y="34" fill="#4ade80" fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono">
              I: {measurements['BAY_W2']?.currentL1_A.toFixed(1)} A
            </text>
            <text x="8" y="50" fill="#fbbf24" fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono">
              P: {measurements['BAY_W2']?.activePowerMW.toFixed(1)} MW
            </text>
            <text x="8" y="65" fill="#94a3b8" fontSize="9" fontFamily="IBM Plex Mono">
              PF: {measurements['BAY_W2']?.powerFactor.toFixed(2)}
            </text>
          </g>

          {/* =========================================================================
              BAY 3: TRANSFORMER T1 (Bottom Center-Left, X = 460, Y = 360 to 800)
              (MATCHING SCHEMATIC: T1 DROPS FROM BUS 1 BETWEEN W2 AND COUPLER)
             ========================================================================= */}
          <line
            x1="460"
            y1="360"
            x2="460"
            y2="620"
            stroke={t1HvLive ? COLOR_220KV_ON : COLOR_OFF}
            strokeWidth="3.5"
          />
          {isFlowingT1 && (
            <line
              x1="460"
              y1="360"
              x2="460"
              y2="620"
              stroke="#fee2e2"
              strokeWidth="2.5"
              strokeOpacity="0.9"
              className="anim-flow-down"
            />
          )}

          {renderDisconnector(switchgears['DS9'], 460, 395)}
          {renderBreaker(switchgears['CB5'], 460, 445)}
          {renderCtCores(460, 485, 5, 'V')}
          {renderEarthSwitch(switchgears['ES9'], 460, 520, 'RIGHT')}
          {renderDisconnector(switchgears['DS10'], 460, 555)}
          {renderSurgeArrester(460, 590, 'RIGHT')}
          {renderCtCores(460, 615, 3, 'V')}
          {renderMeterBadge('A', 485, 615)}

          {/* Transformer T1 3-Winding Graphic (HV Top, MV Right with OLTC, LV Bottom Delta) */}
          <g transform="translate(460, 655)">
            {/* Neutral Grounding Connection on Left side matching schematic */}
            <line x1="-22" y1="0" x2="-48" y2="0" stroke="#94a3b8" strokeWidth="2" />
            {renderEarthSwitch(switchgears['ES10'], -48, 0, 'LEFT')}
            <line x1="-48" y1="0" x2="-62" y2="0" stroke="#22c55e" strokeWidth="1.8" />
            <line x1="-62" y1="-6" x2="-62" y2="6" stroke="#22c55e" strokeWidth="2" />
            <line x1="-65" y1="-4" x2="-65" y2="4" stroke="#22c55e" strokeWidth="1.5" />
            <line x1="-68" y1="-2" x2="-68" y2="2" stroke="#22c55e" strokeWidth="1.2" />

            {/* HV Star Winding (Top Circle) */}
            <circle
              cx="0"
              cy="-22"
              r="22"
              fill="#131720"
              stroke={t1HvLive ? COLOR_220KV_ON : COLOR_OFF}
              strokeWidth="2.8"
            />
            <text x="0" y="-17" fill={t1HvLive ? '#f87171' : '#64748b'} fontSize="12" fontWeight="bold" textAnchor="middle">Y</text>

            {/* MV Star Winding with Tap Changer (Right Circle) */}
            <circle
              cx="24"
              cy="0"
              r="22"
              fill="#131720"
              stroke={transformers.T1.mvVoltageKV > 0 ? COLOR_110KV_ON : COLOR_OFF}
              strokeWidth="2.8"
            />
            <text x="24" y="5" fill={transformers.T1.mvVoltageKV > 0 ? '#fb923c' : '#64748b'} fontSize="12" fontWeight="bold" textAnchor="middle">Y</text>
            
            {/* Diagonal OLTC Arrow across MV winding */}
            <line x1="5" y1="20" x2="44" y2="-18" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="44,-18 36,-16 40,-10" fill="#fbbf24" />

            {/* Tertiary LV Delta Winding (Bottom Circle) */}
            <circle
              cx="0"
              cy="22"
              r="22"
              fill="#131720"
              stroke={t1LvLive ? COLOR_11KV_ON : COLOR_OFF}
              strokeWidth="2.5"
            />
            <text x="0" y="27" fill={t1LvLive ? '#38bdf8' : '#64748b'} fontSize="12" fontWeight="bold" textAnchor="middle">Δ</text>

            {/* Title Badge */}
            <g transform="translate(-45, 50)">
              <rect width="90" height="20" rx="4" fill="#181e28" stroke="#2e3748" strokeWidth="1" />
              <text x="45" y="14" fill="#f1f5f9" fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono" textAnchor="middle">
                T1 (125 MVA)
              </text>
            </g>
          </g>

          {/* T1 MV 110 kV Feeder Outgoing (turning down and running horizontally across under T2) */}
          <path
            d="M 484 655 L 530 655 L 530 750 L 1240 750"
            fill="none"
            stroke={transformers.T1.mvVoltageKV > 0 ? COLOR_110KV_ON : COLOR_OFF}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {renderCtCores(508, 655, 3, 'H')}
          {renderMeterBadge('A', 500, 638)}
          {renderMeterBadge('W', 516, 638)}
          {renderMeterBadge('Wh', 532, 638)}
          {renderSurgeArrester(530, 715, 'RIGHT')}
          {/* Surge Arrester under T2 as per schematic */}
          {renderSurgeArrester(940, 750, 'RIGHT')}

          <g transform="translate(1120, 760)">
            <rect width="115" height="20" rx="3" fill="#1c1917" stroke={transformers.T1.mvVoltageKV > 0 ? '#ea580c' : COLOR_OFF} strokeWidth="1" />
            <text x="57" y="14" fill={transformers.T1.mvVoltageKV > 0 ? '#fb923c' : '#64748b'} fontSize="10" fontWeight="bold" fontFamily="IBM Plex Mono" textAnchor="middle">
              110 kV FEEDER 1
            </text>
          </g>

          {/* T1 Tertiary 11 kV Feeder Outgoing (dropping down matching schematic) */}
          <line
            x1="460"
            y1="677"
            x2="460"
            y2="800"
            stroke={t1LvLive ? COLOR_11KV_ON : COLOR_OFF}
            strokeWidth="2.5"
          />
          {renderCtCores(460, 715, 3, 'V')}
          {renderMeterBadge('A', 485, 708)}
          {renderMeterBadge('W', 485, 725)}
          {renderMeterBadge('Wh', 485, 742)}
          {renderSurgeArrester(460, 760, 'LEFT')}
          <g transform="translate(395, 805)">
            <rect width="130" height="18" rx="3" fill="#0c1929" stroke={t1LvLive ? '#0284c7' : COLOR_OFF} strokeWidth="1" />
            <text x="65" y="13" fill={t1LvLive ? '#38bdf8' : '#64748b'} fontSize="9.5" fontWeight="bold" fontFamily="IBM Plex Mono" textAnchor="middle">
              TERTIARY 1 ({transformers.T1.lvVoltageKV.toFixed(1)} kV)
            </text>
          </g>

          {/* Telemetry Card for Transformer T1 (Safely positioned to the left) */}
          <g transform="translate(230, 615)">
            <rect width="160" height="92" rx="7" fill="#131720" stroke="#2c3648" strokeWidth="1.2" />
            <text x="10" y="18" fill="#fb923c" fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono">
              U_MV: {transformers.T1.mvVoltageKV.toFixed(1)} kV
            </text>
            <text x="10" y="34" fill="#4ade80" fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono">
              I_MV: {measurements['BAY_T1']?.currentL1_A.toFixed(1)} A
            </text>
            <text x="10" y="50" fill="#fbbf24" fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono">
              TAP: {transformers.T1.tapPosition}/19 ({transformers.T1.tapPosition - 10 >= 0 ? `+${transformers.T1.tapPosition - 10}` : transformers.T1.tapPosition - 10})
            </text>
            <text x="10" y="67" fill="#38bdf8" fontSize="9.5" fontFamily="IBM Plex Mono">
              OIL: {transformers.T1.topOilTempC.toFixed(1)}°C | HS: {(transformers.T1.hotSpotTempC || transformers.T1.windingTempC).toFixed(1)}°C
            </text>
            <text x="10" y="83" fill="#a78bfa" fontSize="9" fontFamily="IBM Plex Mono">
              LOAD: {transformers.T1.loadingPercent.toFixed(0)}% | EFF: {transformers.T1.efficiencyPercent?.toFixed(1) || '99.8'}%
            </text>
          </g>

          {/* =========================================================================
              BAY 4: TRANSFORMER T2 (Bottom Center-Right, X = 820, Y = 360 to 800)
              (MATCHING SCHEMATIC: T2 DROPS FROM BUS 2 DIRECTLY AFTER COUPLER)
             ========================================================================= */}
          <line
            x1="820"
            y1="360"
            x2="820"
            y2="620"
            stroke={t2HvLive ? COLOR_220KV_ON : COLOR_OFF}
            strokeWidth="3.5"
          />
          {isFlowingT2 && (
            <line
              x1="820"
              y1="360"
              x2="820"
              y2="620"
              stroke="#fee2e2"
              strokeWidth="2.5"
              strokeOpacity="0.9"
              className="anim-flow-down"
            />
          )}

          {renderDisconnector(switchgears['DS11'], 820, 395)}
          {renderBreaker(switchgears['CB6'], 820, 445)}
          {renderCtCores(820, 485, 5, 'V')}
          {renderEarthSwitch(switchgears['ES11'], 820, 520, 'RIGHT')}
          {renderDisconnector(switchgears['DS12'], 820, 555)}
          {renderSurgeArrester(820, 590, 'RIGHT')}
          {renderCtCores(820, 615, 3, 'V')}

          {/* Transformer T2 3-Winding Graphic */}
          <g transform="translate(820, 655)">
            {/* Neutral Grounding Connection on Left side */}
            <line x1="-22" y1="0" x2="-48" y2="0" stroke="#94a3b8" strokeWidth="2" />
            {renderEarthSwitch(switchgears['ES12'], -48, 0, 'LEFT')}
            <line x1="-48" y1="0" x2="-62" y2="0" stroke="#22c55e" strokeWidth="1.8" />
            <line x1="-62" y1="-6" x2="-62" y2="6" stroke="#22c55e" strokeWidth="2" />
            <line x1="-65" y1="-4" x2="-65" y2="4" stroke="#22c55e" strokeWidth="1.5" />
            <line x1="-68" y1="-2" x2="-68" y2="2" stroke="#22c55e" strokeWidth="1.2" />

            <circle
              cx="0"
              cy="-22"
              r="22"
              fill="#131720"
              stroke={t2HvLive ? COLOR_220KV_ON : COLOR_OFF}
              strokeWidth="2.8"
            />
            <text x="0" y="-17" fill={t2HvLive ? '#f87171' : '#64748b'} fontSize="12" fontWeight="bold" textAnchor="middle">Y</text>

            <circle
              cx="24"
              cy="0"
              r="22"
              fill="#131720"
              stroke={transformers.T2.mvVoltageKV > 0 ? COLOR_110KV_ON : COLOR_OFF}
              strokeWidth="2.8"
            />
            <text x="24" y="5" fill={transformers.T2.mvVoltageKV > 0 ? '#fb923c' : '#64748b'} fontSize="12" fontWeight="bold" textAnchor="middle">Y</text>
            <line x1="5" y1="20" x2="44" y2="-18" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="44,-18 36,-16 40,-10" fill="#fbbf24" />

            <circle
              cx="0"
              cy="22"
              r="22"
              fill="#131720"
              stroke={t2LvLive ? COLOR_11KV_ON : COLOR_OFF}
              strokeWidth="2.5"
            />
            <text x="0" y="27" fill={t2LvLive ? '#38bdf8' : '#64748b'} fontSize="12" fontWeight="bold" textAnchor="middle">Δ</text>

            <g transform="translate(-45, 50)">
              <rect width="90" height="20" rx="4" fill="#181e28" stroke="#2e3748" strokeWidth="1" />
              <text x="45" y="14" fill="#f1f5f9" fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono" textAnchor="middle">
                T2 (125 MVA)
              </text>
            </g>
          </g>

          {/* T2 MV 110 kV Feeder Outgoing (Going straight right matching schematic) */}
          <line
            x1="844"
            y1="655"
            x2="1240"
            y2="655"
            stroke={transformers.T2.mvVoltageKV > 0 ? COLOR_110KV_ON : COLOR_OFF}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {renderCtCores(880, 655, 3, 'H')}
          {renderMeterBadge('A', 872, 638)}
          {renderMeterBadge('W', 888, 638)}
          {renderMeterBadge('Wh', 904, 638)}
          {renderSurgeArrester(935, 655, 'RIGHT')}

          <g transform="translate(1120, 630)">
            <rect width="115" height="20" rx="3" fill="#1c1917" stroke={transformers.T2.mvVoltageKV > 0 ? '#ea580c' : COLOR_OFF} strokeWidth="1" />
            <text x="57" y="14" fill={transformers.T2.mvVoltageKV > 0 ? '#fb923c' : '#64748b'} fontSize="10" fontWeight="bold" fontFamily="IBM Plex Mono" textAnchor="middle">
              110 kV FEEDER 2
            </text>
          </g>

          {/* T2 Tertiary 11 kV Feeder Outgoing (dropping down matching schematic) */}
          <line
            x1="820"
            y1="677"
            x2="820"
            y2="800"
            stroke={t2LvLive ? COLOR_11KV_ON : COLOR_OFF}
            strokeWidth="2.5"
          />
          {renderCtCores(820, 715, 3, 'V')}
          {renderMeterBadge('A', 845, 708)}
          {renderMeterBadge('W', 845, 725)}
          {renderMeterBadge('Wh', 845, 742)}
          {renderSurgeArrester(820, 785, 'LEFT')}
          <g transform="translate(755, 805)">
            <rect width="130" height="18" rx="3" fill="#0c1929" stroke={t2LvLive ? '#0284c7' : COLOR_OFF} strokeWidth="1" />
            <text x="65" y="13" fill={t2LvLive ? '#38bdf8' : '#64748b'} fontSize="9.5" fontWeight="bold" fontFamily="IBM Plex Mono" textAnchor="middle">
              TERTIARY 2 ({transformers.T2.lvVoltageKV.toFixed(1)} kV)
            </text>
          </g>

          {/* Telemetry Card for Transformer T2 (Safely positioned between Coupler and T2) */}
          <g transform="translate(605, 615)">
            <rect width="160" height="92" rx="7" fill="#131720" stroke="#2c3648" strokeWidth="1.2" />
            <text x="10" y="18" fill="#fb923c" fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono">
              U_MV: {transformers.T2.mvVoltageKV.toFixed(1)} kV
            </text>
            <text x="10" y="34" fill="#4ade80" fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono">
              I_MV: {measurements['BAY_T2']?.currentL1_A.toFixed(1)} A
            </text>
            <text x="10" y="50" fill="#fbbf24" fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono">
              TAP: {transformers.T2.tapPosition}/19 ({transformers.T2.tapPosition - 10 >= 0 ? `+${transformers.T2.tapPosition - 10}` : transformers.T2.tapPosition - 10})
            </text>
            <text x="10" y="67" fill="#38bdf8" fontSize="9.5" fontFamily="IBM Plex Mono">
              OIL: {transformers.T2.topOilTempC.toFixed(1)}°C | HS: {(transformers.T2.hotSpotTempC || transformers.T2.windingTempC).toFixed(1)}°C
            </text>
            <text x="10" y="83" fill="#a78bfa" fontSize="9" fontFamily="IBM Plex Mono">
              LOAD: {transformers.T2.loadingPercent.toFixed(0)}% | EFF: {transformers.T2.efficiencyPercent?.toFixed(1) || '99.8'}%
            </text>
          </g>

          {/* =========================================================================
              BAY 5: LINE W1'' / W1 II (Top Right, X = 980, Y = 40 to 360)
              (MATCHING SCHEMATIC: W1 II FEEDS BUS 2 AFTER TRANSFORMER T2)
             ========================================================================= */}
          <g transform="translate(930, 15)">
            <rect width="105" height="22" rx="4" fill="#181e28" stroke="#dc2626" strokeWidth="1.5" />
            <text x="52" y="15" fill="#f87171" fontSize="11" fontWeight="bold" fontFamily="IBM Plex Mono" textAnchor="middle">
              W1 II (220 kV)
            </text>
          </g>

          <line
            x1="980"
            y1="40"
            x2="980"
            y2="360"
            stroke={measurements['BAY_W1_2']?.voltageLL_kV > 0 ? COLOR_220KV_ON : COLOR_OFF}
            strokeWidth="3.5"
          />
          {isFlowingW12 && (
            <line
              x1="980"
              y1="40"
              x2="980"
              y2="360"
              stroke="#fee2e2"
              strokeWidth="2.5"
              strokeOpacity="0.9"
              className="anim-flow-down"
            />
          )}

          {renderSurgeArrester(980, 50, 'RIGHT')}
          {renderEarthSwitch(switchgears['ES5'], 980, 80, 'RIGHT')}
          {renderDisconnector(switchgears['DS3'], 980, 120)}
          {renderCtCores(980, 175, 5, 'V')}
          {renderBreaker(switchgears['CB3'], 980, 235)}
          {renderEarthSwitch(switchgears['ES6'], 980, 280, 'RIGHT')}
          {renderDisconnector(switchgears['DS6'], 980, 315)}

          {/* Telemetry Card for Line W1'' */}
          <g transform="translate(1005, 125)">
            <rect width="115" height="72" rx="6" fill="#131720" stroke="#293344" strokeWidth="1.2" />
            <text x="8" y="18" fill="#38bdf8" fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono">
              U: {measurements['BAY_W1_2']?.voltageLL_kV.toFixed(1)} kV
            </text>
            <text x="8" y="34" fill="#4ade80" fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono">
              I: {measurements['BAY_W1_2']?.currentL1_A.toFixed(1)} A
            </text>
            <text x="8" y="50" fill="#fbbf24" fontSize="10.5" fontWeight="bold" fontFamily="IBM Plex Mono">
              P: {measurements['BAY_W1_2']?.activePowerMW.toFixed(1)} MW
            </text>
            <text x="8" y="65" fill="#94a3b8" fontSize="9" fontFamily="IBM Plex Mono">
              PF: {measurements['BAY_W1_2']?.powerFactor.toFixed(2)}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};

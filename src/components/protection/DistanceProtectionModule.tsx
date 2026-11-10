import React, { useState } from 'react';
import {
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Zap,
  RotateCcw,
  Target,
  Compass,
  ArrowRight,
  TrendingUp,
  Layers
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { EquationCard } from '../common/EquationCard';

export const DistanceProtectionModule: React.FC = () => {
  const { addAuditLog, t, lang } = useScada();
  const isAr = lang === 'ar';

  // Characteristic Type: Mho vs Quadrilateral
  const [charType, setCharType] = useState<'mho' | 'quad'>('quad');

  // Transmission Line 132kV Parameters
  const [lineLengthKm, setLineLengthKm] = useState<number>(60);
  const [lineRPerKm, setLineRPerKm] = useState<number>(0.08); // Ohm/km
  const [lineXPerKm, setLineXPerKm] = useState<number>(0.42); // Ohm/km

  const totalLineR = lineLengthKm * lineRPerKm; // e.g. 4.8 Ohm
  const totalLineX = lineLengthKm * lineXPerKm; // e.g. 25.2 Ohm
  const lineAngleDeg = (Math.atan2(totalLineX, totalLineR) * 180) / Math.PI; // ~79.2 deg

  // Zone Reach Settings (% of Line Impedance)
  const [zone1ReachPct, setZone1ReachPct] = useState<number>(80); // 80%
  const [zone2ReachPct, setZone2ReachPct] = useState<number>(120); // 120%
  const [zone3ReachPct, setZone3ReachPct] = useState<number>(180); // 180%
  const [zone4RevReachPct, setZone4RevReachPct] = useState<number>(25); // 25% Rev

  // Quad Blinder Resistive Reach (Ohm)
  const [quadRReachZ1, setQuadRReachZ1] = useState<number>(12);
  const [quadRReachZ2, setQuadRReachZ2] = useState<number>(18);
  const [quadRReachZ3, setQuadRReachZ3] = useState<number>(28);

  // Load Encroachment Blinder Settings
  const [loadEncroachmentActive, setLoadEncroachmentActive] = useState<boolean>(true);
  const [loadRReach, setLoadRReach] = useState<number>(20); // Ohm
  const [loadAngleDeg, setLoadAngleDeg] = useState<number>(30); // deg

  // Test Fault Simulation
  const [faultDistPct, setFaultDistPct] = useState<number>(65); // 65% of line
  const [faultResistanceRf, setFaultResistanceRf] = useState<number>(2.5); // Ohm (Arc/Tower footing)
  const [isReverseFault, setIsReverseFault] = useState<boolean>(false);

  // Calculated Apparent Fault Impedance (Zm = Rm + jXm)
  const faultDirSign = isReverseFault ? -1 : 1;
  const zmR = (totalLineR * (faultDistPct / 100) + faultResistanceRf) * faultDirSign;
  const zmX = totalLineX * (faultDistPct / 100) * faultDirSign;
  const zmMag = Math.sqrt(zmR * zmR + zmX * zmX);
  const zmAngleDeg = (Math.atan2(zmX, zmR) * 180) / Math.PI;

  // Zone Evaluation
  const z1X = totalLineX * (zone1ReachPct / 100);
  const z2X = totalLineX * (zone2ReachPct / 100);
  const z3X = totalLineX * (zone3ReachPct / 100);
  const z4RevX = totalLineX * (zone4RevReachPct / 100);

  // Load Encroachment Check
  const isInsideLoadEncroachment =
    loadEncroachmentActive &&
    zmR > 0 &&
    zmR < loadRReach &&
    Math.abs(zmAngleDeg) < loadAngleDeg;

  let pickedUpZone: 'Z1' | 'Z2' | 'Z3' | 'Z4_REV' | 'NONE' = 'NONE';
  let tripTimeMs = 0;

  if (isInsideLoadEncroachment) {
    pickedUpZone = 'NONE'; // Blocked by load encroachment
  } else if (!isReverseFault) {
    if (charType === 'quad') {
      if (zmX <= z1X && zmX >= 0 && zmR <= quadRReachZ1 && zmR >= -2) {
        pickedUpZone = 'Z1';
        tripTimeMs = 20; // Instantaneous
      } else if (zmX <= z2X && zmX >= 0 && zmR <= quadRReachZ2 && zmR >= -4) {
        pickedUpZone = 'Z2';
        tripTimeMs = 350; // 350ms
      } else if (zmX <= z3X && zmX >= 0 && zmR <= quadRReachZ3 && zmR >= -6) {
        pickedUpZone = 'Z3';
        tripTimeMs = 800; // 800ms
      }
    } else {
      // Mho Circle Evaluation (Center = Z_reach / 2, Radius = |Z_reach| / 2)
      const testMho = (reachX: number) => {
        const reachR = reachX / Math.tan((lineAngleDeg * Math.PI) / 180);
        const cX = reachR / 2;
        const cY = reachX / 2;
        const radius = Math.sqrt(cX * cX + cY * cY);
        const distFromCenter = Math.sqrt((zmR - cX) ** 2 + (zmX - cY) ** 2);
        return distFromCenter <= radius;
      };

      if (testMho(z1X)) {
        pickedUpZone = 'Z1';
        tripTimeMs = 20;
      } else if (testMho(z2X)) {
        pickedUpZone = 'Z2';
        tripTimeMs = 350;
      } else if (testMho(z3X)) {
        pickedUpZone = 'Z3';
        tripTimeMs = 800;
      }
    }
  } else {
    // Reverse Fault
    if (Math.abs(zmX) <= z4RevX && zmX < 0) {
      pickedUpZone = 'Z4_REV';
      tripTimeMs = 1200; // 1.2s Reverse Backup
    }
  }

  // SVG Coordinates Transformation (Center = (260, 260), scale 6 px/Ohm)
  const svgCenterX = 220;
  const svgCenterY = 320;
  const scale = 5.8; // px per Ohm

  const toSvgX = (r: number) => svgCenterX + r * scale;
  const toSvgY = (x: number) => svgCenterY - x * scale;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-950/60 border border-amber-800/60 rounded-xl text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-wide">
                {isAr ? 'مخطط حماية المسافة ANSI 21 (Mho & Quad R-X)' : 'ANSI 21 Distance Protection R-X Plane & Reach Analyzer'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                132 kV TRANSMISSION
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {isAr
                ? 'تحليل مناطق الحماية (Z1, Z2, Z3, Reverse) مع كاشف تداخل الأحمال ومقاومة القوس الكهربائي'
                : 'Interactive R-X impedance plane with Mho circles, Quadrilateral blinders, load encroachment & fault locus'}
            </p>
          </div>
        </div>

        {/* Characteristic Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setCharType('quad')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              charType === 'quad' ? 'bg-amber-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Quadrilateral (Quad)
          </button>
          <button
            onClick={() => setCharType('mho')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              charType === 'mho' ? 'bg-cyan-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Mho Characteristic
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive R-X Plane Graphic */}
        <div className="lg:col-span-7 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              {isAr ? 'مستوى المعاوقة المركبة R-X' : 'Complex Impedance R-X Plane Display'}
            </span>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-emerald-400">● Zone 1 (80%)</span>
              <span className="text-blue-400">● Zone 2 (120%)</span>
              <span className="text-purple-400">● Zone 3 (180%)</span>
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="flex justify-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-2 relative overflow-hidden">
            <svg width="500" height="420" viewBox="0 0 500 420" className="select-none font-mono">
              {/* Grid Lines */}
              {[-20, -10, 0, 10, 20, 30, 40].map((rVal) => (
                <line
                  key={`r-${rVal}`}
                  x1={toSvgX(rVal)}
                  y1="10"
                  x2={toSvgX(rVal)}
                  y2="410"
                  stroke={rVal === 0 ? '#52525b' : '#27272a'}
                  strokeWidth={rVal === 0 ? '1.5' : '1'}
                  strokeDasharray={rVal === 0 ? '' : '3,3'}
                />
              ))}
              {[-10, 0, 10, 20, 30, 40, 50].map((xVal) => (
                <line
                  key={`x-${xVal}`}
                  x1="10"
                  y1={toSvgY(xVal)}
                  x2="490"
                  y2={toSvgY(xVal)}
                  stroke={xVal === 0 ? '#52525b' : '#27272a'}
                  strokeWidth={xVal === 0 ? '1.5' : '1'}
                  strokeDasharray={xVal === 0 ? '' : '3,3'}
                />
              ))}

              {/* Axis Labels */}
              <text x="470" y={toSvgY(0) - 8} fill="#a1a1aa" fontSize="11" fontWeight="bold">R (Ω)</text>
              <text x={toSvgX(0) + 8} y="25" fill="#a1a1aa" fontSize="11" fontWeight="bold">+jX (Ω)</text>
              <text x={toSvgX(0) + 8} y="410" fill="#a1a1aa" fontSize="10">-jX</text>

              {/* Characteristic Zones */}
              {charType === 'quad' ? (
                <>
                  {/* Zone 3 Quad */}
                  <polygon
                    points={`
                      ${toSvgX(-6)},${toSvgY(0)}
                      ${toSvgX(-6)},${toSvgY(z3X)}
                      ${toSvgX(quadRReachZ3)},${toSvgY(z3X)}
                      ${toSvgX(quadRReachZ3)},${toSvgY(0)}
                    `}
                    fill="rgba(168, 85, 247, 0.10)"
                    stroke="#a855f7"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                  />
                  {/* Zone 2 Quad */}
                  <polygon
                    points={`
                      ${toSvgX(-4)},${toSvgY(0)}
                      ${toSvgX(-4)},${toSvgY(z2X)}
                      ${toSvgX(quadRReachZ2)},${toSvgY(z2X)}
                      ${toSvgX(quadRReachZ2)},${toSvgY(0)}
                    `}
                    fill="rgba(59, 130, 246, 0.15)"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                  />
                  {/* Zone 1 Quad */}
                  <polygon
                    points={`
                      ${toSvgX(-2)},${toSvgY(0)}
                      ${toSvgX(-2)},${toSvgY(z1X)}
                      ${toSvgX(quadRReachZ1)},${toSvgY(z1X)}
                      ${toSvgX(quadRReachZ1)},${toSvgY(0)}
                    `}
                    fill="rgba(16, 185, 129, 0.22)"
                    stroke="#10b981"
                    strokeWidth="2"
                  />
                </>
              ) : (
                <>
                  {/* Zone 3 Mho */}
                  <circle
                    cx={toSvgX((z3X / Math.tan((lineAngleDeg * Math.PI) / 180)) / 2)}
                    cy={toSvgY(z3X / 2)}
                    r={(Math.sqrt((z3X / Math.tan((lineAngleDeg * Math.PI) / 180)) ** 2 + z3X ** 2) / 2) * scale}
                    fill="rgba(168, 85, 247, 0.12)"
                    stroke="#a855f7"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                  />
                  {/* Zone 2 Mho */}
                  <circle
                    cx={toSvgX((z2X / Math.tan((lineAngleDeg * Math.PI) / 180)) / 2)}
                    cy={toSvgY(z2X / 2)}
                    r={(Math.sqrt((z2X / Math.tan((lineAngleDeg * Math.PI) / 180)) ** 2 + z2X ** 2) / 2) * scale}
                    fill="rgba(59, 130, 246, 0.18)"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                  />
                  {/* Zone 1 Mho */}
                  <circle
                    cx={toSvgX((z1X / Math.tan((lineAngleDeg * Math.PI) / 180)) / 2)}
                    cy={toSvgY(z1X / 2)}
                    r={(Math.sqrt((z1X / Math.tan((lineAngleDeg * Math.PI) / 180)) ** 2 + z1X ** 2) / 2) * scale}
                    fill="rgba(16, 185, 129, 0.25)"
                    stroke="#10b981"
                    strokeWidth="2"
                  />
                </>
              )}

              {/* Load Encroachment Polygon */}
              {loadEncroachmentActive && (
                <polygon
                  points={`
                    ${toSvgX(0)},${toSvgY(0)}
                    ${toSvgX(loadRReach)},${toSvgY(loadRReach * Math.tan((loadAngleDeg * Math.PI) / 180))}
                    ${toSvgX(loadRReach + 15)},${toSvgY(loadRReach * Math.tan((loadAngleDeg * Math.PI) / 180))}
                    ${toSvgX(loadRReach + 15)},${toSvgY(-loadRReach * Math.tan((loadAngleDeg * Math.PI) / 180))}
                    ${toSvgX(loadRReach)},${toSvgY(-loadRReach * Math.tan((loadAngleDeg * Math.PI) / 180))}
                  `}
                  fill="rgba(245, 158, 11, 0.15)"
                  stroke="#f59e0b"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              )}

              {/* Transmission Line Impedance Vector (ZL) */}
              <line
                x1={toSvgX(0)}
                y1={toSvgY(0)}
                x2={toSvgX(totalLineR)}
                y2={toSvgY(totalLineX)}
                stroke="#e4e4e7"
                strokeWidth="3"
              />
              <circle cx={toSvgX(totalLineR)} cy={toSvgY(totalLineX)} r="4" fill="#ffffff" />
              <text
                x={toSvgX(totalLineR) + 6}
                y={toSvgY(totalLineX)}
                fill="#ffffff"
                fontSize="11"
                fontWeight="bold"
              >
                ZL (100%)
              </text>

              {/* Injected Fault Impedance Point */}
              <circle cx={toSvgX(zmR)} cy={toSvgY(zmX)} r="7" fill="#ef4444" className="animate-ping" opacity="0.75" />
              <circle cx={toSvgX(zmR)} cy={toSvgY(zmX)} r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
              <line
                x1={toSvgX(0)}
                y1={toSvgY(0)}
                x2={toSvgX(zmR)}
                y2={toSvgY(zmX)}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="2,2"
              />
              <text
                x={toSvgX(zmR) + 8}
                y={toSvgY(zmX) - 4}
                fill="#ef4444"
                fontSize="11"
                fontWeight="bold"
              >
                Zm ({zmR.toFixed(1)} + j{zmX.toFixed(1)} Ω)
              </text>
            </svg>
          </div>

          {/* Fault Status Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between font-mono text-xs ${
            pickedUpZone === 'Z1'
              ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300'
              : pickedUpZone === 'Z2'
              ? 'bg-blue-950/40 border-blue-700 text-blue-300'
              : pickedUpZone === 'Z3'
              ? 'bg-purple-950/40 border-purple-700 text-purple-300'
              : pickedUpZone === 'Z4_REV'
              ? 'bg-amber-950/40 border-amber-700 text-amber-300'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
          }`}>
            <div className="flex items-center gap-3">
              {pickedUpZone !== 'NONE' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-zinc-500" />
              )}
              <div>
                <div className="font-bold text-sm text-white">
                  {pickedUpZone === 'NONE'
                    ? (isInsideLoadEncroachment ? 'BLOCKED BY LOAD ENCROACHMENT' : 'NO TRIP / OUT OF REACH')
                    : `ANSI 21 TRIP INITIATED [${pickedUpZone}]`}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {pickedUpZone !== 'NONE'
                    ? `Operating Time: t_op = ${tripTimeMs} ms | Direction: ${isReverseFault ? 'REVERSE' : 'FORWARD'}`
                    : 'Relay remains in non-tripping restraint state.'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-zinc-500 uppercase">Impedance Magnitude</div>
              <div className="text-sm font-black text-white">{zmMag.toFixed(2)} Ω ∠ {zmAngleDeg.toFixed(1)}°</div>
            </div>
          </div>
        </div>

        {/* Controls & Relay Parameters */}
        <div className="lg:col-span-5 space-y-6">
          {/* Fault Injection Simulator */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4" />
              {isAr ? 'محاكي حقن أعطال خط النقل' : 'Transmission Line Fault Injector'}
            </span>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>{isAr ? 'موقع العطل على الخط' : 'Fault Location Along Line'}:</span>
                  <span className="font-bold text-amber-400">{faultDistPct}% ({(lineLengthKm * faultDistPct / 100).toFixed(1)} km)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={faultDistPct}
                  onChange={(e) => setFaultDistPct(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>{isAr ? 'مقاومة القوس / التأريض (Rf)' : 'Fault Arc & Ground Resistance (Rf)'}:</span>
                  <span className="font-bold text-cyan-400">{faultResistanceRf.toFixed(1)} Ω</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="0.5"
                  value={faultResistanceRf}
                  onChange={(e) => setFaultResistanceRf(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-zinc-800">
                <span className="text-zinc-300 text-xs">{isAr ? 'اتجاه العطل (عكسي Reverse)' : 'Reverse Directional Fault'}</span>
                <input
                  type="checkbox"
                  checked={isReverseFault}
                  onChange={(e) => setIsReverseFault(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Zone Settings */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4 font-mono text-xs">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              {isAr ? 'ضبط مناطق الحماية والـ Blinders' : 'Relay Reach & Blinder Configuration'}
            </span>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center p-2 bg-zinc-900/80 rounded-lg border border-zinc-800">
                <span className="text-emerald-400 font-bold">Zone 1 Reach:</span>
                <span>{zone1ReachPct}% (t = 0.00s / 20ms)</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-zinc-900/80 rounded-lg border border-zinc-800">
                <span className="text-blue-400 font-bold">Zone 2 Reach:</span>
                <span>{zone2ReachPct}% (t = 0.35s)</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-zinc-900/80 rounded-lg border border-zinc-800">
                <span className="text-purple-400 font-bold">Zone 3 Reach:</span>
                <span>{zone3ReachPct}% (t = 0.80s)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-zinc-300">Load Encroachment Blinder</span>
              <input
                type="checkbox"
                checked={loadEncroachmentActive}
                onChange={(e) => setLoadEncroachmentActive(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Equation Card */}
          <EquationCard
            title={isAr ? '?????? ???????? ???????? ??? ?????' : 'Line Apparent Impedance & SIR Formula'}
            equation="Z_m = V_relay / (I_relay + k₀·I_N) = m · Z_L + R_f"
            description={
              isAr
                ? 'تُحسب المعاوقة المقاسة من جهد والتيار المرحل مع معامل التعويض الصفري k0 لتحديد منطقة العطل'
                : 'Apparent fault loop impedance includes per-unit distance m, total line impedance ZL, and resistive fault/arc resistance Rf.'
            }
          />
        </div>
      </div>
    </div>
  );
};

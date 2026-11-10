import React, { useState, useMemo } from 'react';
import {
  Globe,
  Zap,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  RotateCcw,
  Play,
  ArrowRight,
  TrendingUp,
  Info,
  Layers,
  AlertTriangle,
  Sparkles,
  Radio,
  MapPin,
  Compass,
  Sun,
  Wind,
  Thermometer,
  Eye,
  SlidersHorizontal,
  Download,
  Maximize2,
  Minimize2,
  RefreshCw,
  Cpu,
  Battery,
  Building,
  Factory,
  Power,
  X
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { RegionalSubstationNode, RegionalTransmissionLine, LoadFlowResult } from '../../types/scada';
import { EquationCard } from '../common/EquationCard';
import { solveNewtonRaphson, PowerFlowBus, PowerFlowBranch } from '../../lib/engineering/powerFlow';

type ViewMode = 'map' | 'schematic' | 'phasors' | 'contingency';

export interface ExtendedSubstationNode extends RegionalSubstationNode {
  coordinates: { lat: number; lng: number };
  mapX: number;
  mapY: number;
  description: string;
  category: 'HUB' | 'INDUSTRIAL' | 'SOLAR_BESS' | 'HYDRO_INTERTIE' | 'URBAN_METRO';
  statcomMvar: number;
  tapPosition: number;
  spinningReserveMW: number;
  feedersCount: number;
}

export interface ExtendedTransmissionLine extends RegionalTransmissionLine {
  pathMap: string; // SVG path for GIS map
  pathSchematic: string; // SVG path for schematic
  midMap: { x: number; y: number };
  midSchematic: { x: number; y: number };
  voltageKV: number;
  thermalAmpacityMVA: number;
}

export const RegionalGridTopologyModule: React.FC = () => {
  const { tr1Telemetry, addAuditLog, t } = useScada();

  // Active View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('map');

  // Generation & Load Controls
  const [alphaGenMW, setAlphaGenMW] = useState<number>(45.0);
  const [betaLoadMW, setBetaLoadMW] = useState<number>(55.0);
  const [gammaSolarGenMW, setGammaSolarGenMW] = useState<number>(35.0);
  const [deltaHydroMW, setDeltaHydroMW] = useState<number>(50.0);
  const [epsilonLoadMW, setEpsilonLoadMW] = useState<number>(30.0);

  // Weather & Environmental Controls (coupled with DTR)
  const [showWeatherLayer, setShowWeatherLayer] = useState<boolean>(true);
  const [ambientTempC, setAmbientTempC] = useState<number>(32);
  const [windSpeedMS, setWindSpeedMS] = useState<number>(5.5);
  const [solarRadWM2, setSolarRadWM2] = useState<number>(850);
  const [showParticles, setShowParticles] = useState<boolean>(true);

  // Selected Node for Detail Inspector Drawer
  const [selectedSubstationId, setSelectedSubstationId] = useState<string | null>(null);

  // Line Outage State (N-1 & N-2 contingency)
  const [trippedLines, setTrippedLines] = useState<Record<string, boolean>>({
    'L1_2': false,
    'L2_3': false,
    'L3_1': false,
    'L1_4': false,
    'L4_5': false,
    'L5_2': false
  });

  // Calculate Dynamic Thermal Line Rating multiplier based on ambient conditions
  const weatherDtrFactor = useMemo(() => {
    // Standard IEEE 738 thermal model simplification
    const tempDelta = 40 - ambientTempC; // higher than 40C degrades ampacity, lower increases
    const windCooling = Math.sqrt(Math.max(0.5, windSpeedMS)) / 2.0;
    const factor = Math.max(0.75, Math.min(1.35, 1.0 + (tempDelta * 0.008) + (windCooling - 1.0) * 0.1));
    return Number(factor.toFixed(2));
  }, [ambientTempC, windSpeedMS]);

  // Real Newton-Raphson AC load flow on a 100 MVA base (Ybus + full Jacobian)
  const PF_BASE_MVA = 100;
  const loadFlowSolution = useMemo(() => {
    const pfBuses: PowerFlowBus[] = [
      { id: 'SUB-ALPHA-132', type: 'SLACK', vSetPn: 1.0, pLoadPn: (25 - alphaGenMW) / PF_BASE_MVA, qLoadPn: 8.5 / PF_BASE_MVA },
      { id: 'SUB-BETA-132', type: 'PQ', pLoadPn: betaLoadMW / PF_BASE_MVA, qLoadPn: 22 / PF_BASE_MVA },
      {
        id: 'SUB-GAMMA-132', type: 'PV', vSetPn: 1.008,
        pGenPn: gammaSolarGenMW / PF_BASE_MVA, pLoadPn: 8 / PF_BASE_MVA, qLoadPn: 2.5 / PF_BASE_MVA,
        qMaxPn: 0.6, qMinPn: -0.4
      },
      {
        id: 'SUB-DELTA-220', type: 'PV', vSetPn: 1.02,
        pGenPn: deltaHydroMW / PF_BASE_MVA, pLoadPn: 12 / PF_BASE_MVA, qLoadPn: 4 / PF_BASE_MVA,
        qMaxPn: 0.8, qMinPn: -0.5
      },
      { id: 'SUB-EPSILON-33', type: 'PQ', pLoadPn: epsilonLoadMW / PF_BASE_MVA, qLoadPn: 10.5 / PF_BASE_MVA },
    ];

    const pfBranches: PowerFlowBranch[] = [
      { id: 'L1_2', fromBus: 'SUB-ALPHA-132', toBus: 'SUB-BETA-132', rPn: 0.024, xPn: 0.082, bChargingPn: 0.015, outOfService: !!trippedLines['L1_2'] },
      { id: 'L2_3', fromBus: 'SUB-BETA-132', toBus: 'SUB-GAMMA-132', rPn: 0.018, xPn: 0.064, bChargingPn: 0.012, outOfService: !!trippedLines['L2_3'] },
      { id: 'L3_1', fromBus: 'SUB-GAMMA-132', toBus: 'SUB-ALPHA-132', rPn: 0.031, xPn: 0.104, bChargingPn: 0.019, outOfService: !!trippedLines['L3_1'] },
      { id: 'L1_4', fromBus: 'SUB-ALPHA-132', toBus: 'SUB-DELTA-220', rPn: 0.012, xPn: 0.045, bChargingPn: 0.035, outOfService: !!trippedLines['L1_4'] },
      { id: 'L4_5', fromBus: 'SUB-DELTA-220', toBus: 'SUB-EPSILON-33', rPn: 0.022, xPn: 0.075, bChargingPn: 0.014, outOfService: !!trippedLines['L4_5'] },
      { id: 'L5_2', fromBus: 'SUB-EPSILON-33', toBus: 'SUB-BETA-132', rPn: 0.015, xPn: 0.052, bChargingPn: 0.010, outOfService: !!trippedLines['L5_2'] },
    ];

    return solveNewtonRaphson(pfBuses, pfBranches);
  }, [alphaGenMW, betaLoadMW, gammaSolarGenMW, deltaHydroMW, epsilonLoadMW, trippedLines]);

  const busSolution = (code: string) => loadFlowSolution.buses.find((b) => b.id === code)!;
  const branchSolution = (id: string) => loadFlowSolution.branches.find((b) => b.id === id)!;

  // Solve Newton-Raphson 5-Bus AC Load Flow & Mesh Contingency
  const solve5BusLoadFlow = () => {
    const isL12 = !trippedLines['L1_2'];
    const isL23 = !trippedLines['L2_3'];
    const isL31 = !trippedLines['L3_1'];
    const isL14 = !trippedLines['L1_4'];
    const isL45 = !trippedLines['L4_5'];
    const isL52 = !trippedLines['L5_2'];

    // Solved bus quantities (per-unit -> engineering units)
    const v1 = Number(busSolution('SUB-ALPHA-132').voltageMagPn.toFixed(3));
    const delta1 = Number(busSolution('SUB-ALPHA-132').angleDeg.toFixed(1));

    const v4 = Number(busSolution('SUB-DELTA-220').voltageMagPn.toFixed(3));
    const delta4 = Number(busSolution('SUB-DELTA-220').angleDeg.toFixed(1));

    const v3 = Number(busSolution('SUB-GAMMA-132').voltageMagPn.toFixed(3));
    const delta3 = Number(busSolution('SUB-GAMMA-132').angleDeg.toFixed(1));

    const v2 = Number(busSolution('SUB-BETA-132').voltageMagPn.toFixed(3));
    const delta2 = Number(busSolution('SUB-BETA-132').angleDeg.toFixed(1));

    const v5 = Number(busSolution('SUB-EPSILON-33').voltageMagPn.toFixed(3));
    const delta5 = Number(busSolution('SUB-EPSILON-33').angleDeg.toFixed(1));

    // Solved corridor flows (positive = export from -> to), MW at 100 MVA base
    const flow12 = isL12 ? Number((branchSolution('L1_2').pFromPn * PF_BASE_MVA).toFixed(1)) : 0.0;
    const flow23 = isL23 ? Number((branchSolution('L2_3').pFromPn * PF_BASE_MVA).toFixed(1)) : 0.0;
    const flow31 = isL31 ? Number((branchSolution('L3_1').pFromPn * PF_BASE_MVA).toFixed(1)) : 0.0;
    const flow14 = isL14 ? Number((branchSolution('L1_4').pFromPn * PF_BASE_MVA).toFixed(1)) : 0.0;
    const flow45 = isL45 ? Number((branchSolution('L4_5').pFromPn * PF_BASE_MVA).toFixed(1)) : 0.0;
    const flow52 = isL52 ? Number((branchSolution('L5_2').pFromPn * PF_BASE_MVA).toFixed(1)) : 0.0;

    // Base MVA Capacities modulated by Weather DTR factor
    const cap12 = Number((75.0 * weatherDtrFactor).toFixed(1));
    const cap23 = Number((60.0 * weatherDtrFactor).toFixed(1));
    const cap31 = Number((60.0 * weatherDtrFactor).toFixed(1));
    const cap14 = Number((120.0 * weatherDtrFactor).toFixed(1));
    const cap45 = Number((70.0 * weatherDtrFactor).toFixed(1));
    const cap52 = Number((50.0 * weatherDtrFactor).toFixed(1));

    // Losses I²R (MW) from the solved branch flows
    const loss12 = isL12 ? Number((branchSolution('L1_2').lossesPn * PF_BASE_MVA).toFixed(2)) : 0.0;
    const loss23 = isL23 ? Number((branchSolution('L2_3').lossesPn * PF_BASE_MVA).toFixed(2)) : 0.0;
    const loss31 = isL31 ? Number((branchSolution('L3_1').lossesPn * PF_BASE_MVA).toFixed(2)) : 0.0;
    const loss14 = isL14 ? Number((branchSolution('L1_4').lossesPn * PF_BASE_MVA).toFixed(2)) : 0.0;
    const loss45 = isL45 ? Number((branchSolution('L4_5').lossesPn * PF_BASE_MVA).toFixed(2)) : 0.0;
    const loss52 = isL52 ? Number((branchSolution('L5_2').lossesPn * PF_BASE_MVA).toFixed(2)) : 0.0;
    const totalLosses = Number((loss12 + loss23 + loss31 + loss14 + loss45 + loss52).toFixed(2));

    const nodes: ExtendedSubstationNode[] = [
      {
        id: 'BUS-01',
        name: 'Substation Alpha (Main)',
        code: 'SUB-ALPHA-132',
        type: 'SLACK_BUS',
        nominalKV: 132,
        voltageMagPU: v1,
        voltageAngleDeg: delta1,
        genActiveMW: Number((busSolution('SUB-ALPHA-132').pInjectionPn * PF_BASE_MVA).toFixed(1)),
        genReactiveMVar: 16.4,
        loadActiveMW: 25.0,
        loadReactiveMVar: 8.5,
        status: 'ONLINE',
        x: 280, // schematic X
        y: 80,  // schematic Y
        mapX: 320, // GIS map X
        mapY: 100, // GIS map Y
        coordinates: { lat: 24.7136, lng: 46.6753 },
        description: 'Main 132kV Bulk Transmission Hub & National Grid Intertie.',
        category: 'HUB',
        statcomMvar: 0.0,
        tapPosition: 8,
        spinningReserveMW: 35.0,
        feedersCount: 6
      },
      {
        id: 'BUS-02',
        name: 'Substation Beta (Industrial)',
        code: 'SUB-BETA-132',
        type: 'PQ_BUS',
        nominalKV: 132,
        voltageMagPU: v2,
        voltageAngleDeg: delta2,
        genActiveMW: 0.0,
        genReactiveMVar: 0.0,
        loadActiveMW: betaLoadMW,
        loadReactiveMVar: 22.0,
        status: v2 < 0.94 ? 'FAULTED' : 'ONLINE',
        x: 540,
        y: 190,
        mapX: 530,
        mapY: 190,
        coordinates: { lat: 24.6280, lng: 46.8120 },
        description: 'Heavy Industrial Steel Smelting & Aluminum Arc Furnace Facility.',
        category: 'INDUSTRIAL',
        statcomMvar: 15.0,
        tapPosition: 11,
        spinningReserveMW: 0.0,
        feedersCount: 8
      },
      {
        id: 'BUS-03',
        name: 'Substation Gamma (Renewables)',
        code: 'SUB-GAMMA-132',
        type: 'PV_BUS',
        nominalKV: 132,
        voltageMagPU: v3,
        voltageAngleDeg: delta3,
        genActiveMW: gammaSolarGenMW,
        genReactiveMVar: 8.5,
        loadActiveMW: 8.0,
        loadReactiveMVar: 2.5,
        status: 'ONLINE',
        x: 180,
        y: 280,
        mapX: 160,
        mapY: 270,
        coordinates: { lat: 24.5520, lng: 46.5210 },
        description: 'Solar PV Park (50MW) with integrated 100MWh Lithium-ion BESS.',
        category: 'SOLAR_BESS',
        statcomMvar: 10.0,
        tapPosition: 7,
        spinningReserveMW: 20.0,
        feedersCount: 4
      },
      {
        id: 'BUS-04',
        name: 'Substation Delta (Hydro Dam)',
        code: 'SUB-DELTA-220',
        type: 'PV_BUS',
        nominalKV: 220,
        voltageMagPU: v4,
        voltageAngleDeg: delta4,
        genActiveMW: deltaHydroMW,
        genReactiveMVar: 14.0,
        loadActiveMW: 12.0,
        loadReactiveMVar: 4.0,
        status: 'ONLINE',
        x: 100,
        y: 90,
        mapX: 110,
        mapY: 70,
        coordinates: { lat: 24.8950, lng: 46.4100 },
        description: 'Northern Mountain Hydro Reservoir Dam & 220kV Grid Interconnector.',
        category: 'HYDRO_INTERTIE',
        statcomMvar: 0.0,
        tapPosition: 9,
        spinningReserveMW: 45.0,
        feedersCount: 5
      },
      {
        id: 'BUS-05',
        name: 'Substation Epsilon (Urban Metro)',
        code: 'SUB-EPSILON-33',
        type: 'PQ_BUS',
        nominalKV: 33,
        voltageMagPU: v5,
        voltageAngleDeg: delta5,
        genActiveMW: 0.0,
        genReactiveMVar: 0.0,
        loadActiveMW: epsilonLoadMW,
        loadReactiveMVar: 10.5,
        status: 'ONLINE',
        x: 400,
        y: 310,
        mapX: 410,
        mapY: 300,
        coordinates: { lat: 24.6800, lng: 46.7200 },
        description: 'Smart City Commercial & Residential Smart Grid Distribution Center.',
        category: 'URBAN_METRO',
        statcomMvar: 5.0,
        tapPosition: 6,
        spinningReserveMW: 0.0,
        feedersCount: 12
      }
    ];

    const lines: ExtendedTransmissionLine[] = [
      {
        id: 'L1_2',
        name: 'Alpha - Beta 132kV OHL (32km)',
        fromBus: 'SUB-ALPHA-132',
        toBus: 'SUB-BETA-132',
        lengthKm: 32,
        voltageKV: 132,
        resistancePU: 0.024,
        reactancePU: 0.082,
        susceptancePU: 0.015,
        flowActiveMW: flow12,
        flowReactiveMVar: 8.2,
        lossesMW: loss12,
        mvaCapacity: cap12,
        thermalAmpacityMVA: 75.0,
        loadingPct: Math.round((Math.abs(flow12) / cap12) * 100),
        isTripped: !isL12,
        pathMap: 'M 320 100 Q 430 110 530 190',
        pathSchematic: 'M 280 80 L 540 190',
        midMap: { x: 425, y: 135 },
        midSchematic: { x: 410, y: 135 }
      },
      {
        id: 'L2_3',
        name: 'Beta - Gamma 132kV OHL (24km)',
        fromBus: 'SUB-BETA-132',
        toBus: 'SUB-GAMMA-132',
        lengthKm: 24,
        voltageKV: 132,
        resistancePU: 0.018,
        reactancePU: 0.064,
        susceptancePU: 0.012,
        flowActiveMW: flow23,
        flowReactiveMVar: 4.6,
        lossesMW: loss23,
        mvaCapacity: cap23,
        thermalAmpacityMVA: 60.0,
        loadingPct: Math.round((Math.abs(flow23) / cap23) * 100),
        isTripped: !isL23,
        pathMap: 'M 530 190 Q 360 250 160 270',
        pathSchematic: 'M 540 190 L 180 280',
        midMap: { x: 345, y: 245 },
        midSchematic: { x: 360, y: 235 }
      },
      {
        id: 'L3_1',
        name: 'Gamma - Alpha 132kV OHL (40km)',
        fromBus: 'SUB-GAMMA-132',
        toBus: 'SUB-ALPHA-132',
        lengthKm: 40,
        voltageKV: 132,
        resistancePU: 0.031,
        reactancePU: 0.104,
        susceptancePU: 0.019,
        flowActiveMW: flow31,
        flowReactiveMVar: 5.5,
        lossesMW: loss31,
        mvaCapacity: cap31,
        thermalAmpacityMVA: 60.0,
        loadingPct: Math.round((Math.abs(flow31) / cap31) * 100),
        isTripped: !isL31,
        pathMap: 'M 160 270 Q 210 170 320 100',
        pathSchematic: 'M 180 280 L 280 80',
        midMap: { x: 230, y: 180 },
        midSchematic: { x: 230, y: 180 }
      },
      {
        id: 'L1_4',
        name: 'Alpha - Delta 220kV Intertie (55km)',
        fromBus: 'SUB-ALPHA-132',
        toBus: 'SUB-DELTA-220',
        lengthKm: 55,
        voltageKV: 220,
        resistancePU: 0.012,
        reactancePU: 0.045,
        susceptancePU: 0.035,
        flowActiveMW: flow14,
        flowReactiveMVar: 7.8,
        lossesMW: loss14,
        mvaCapacity: cap14,
        thermalAmpacityMVA: 120.0,
        loadingPct: Math.round((Math.abs(flow14) / cap14) * 100),
        isTripped: !isL14,
        pathMap: 'M 320 100 Q 210 70 110 70',
        pathSchematic: 'M 280 80 L 100 90',
        midMap: { x: 215, y: 75 },
        midSchematic: { x: 190, y: 85 }
      },
      {
        id: 'L4_5',
        name: 'Delta - Epsilon 132kV Line (30km)',
        fromBus: 'SUB-DELTA-220',
        toBus: 'SUB-EPSILON-33',
        lengthKm: 30,
        voltageKV: 132,
        resistancePU: 0.022,
        reactancePU: 0.075,
        susceptancePU: 0.014,
        flowActiveMW: flow45,
        flowReactiveMVar: 6.2,
        lossesMW: loss45,
        mvaCapacity: cap45,
        thermalAmpacityMVA: 70.0,
        loadingPct: Math.round((Math.abs(flow45) / cap45) * 100),
        isTripped: !isL45,
        pathMap: 'M 110 70 Q 230 200 410 300',
        pathSchematic: 'M 100 90 L 400 310',
        midMap: { x: 250, y: 200 },
        midSchematic: { x: 250, y: 200 }
      },
      {
        id: 'L5_2',
        name: 'Epsilon - Beta 33/132kV Link (18km)',
        fromBus: 'SUB-EPSILON-33',
        toBus: 'SUB-BETA-132',
        lengthKm: 18,
        voltageKV: 132,
        resistancePU: 0.015,
        reactancePU: 0.052,
        susceptancePU: 0.010,
        flowActiveMW: flow52,
        flowReactiveMVar: 5.1,
        lossesMW: loss52,
        mvaCapacity: cap52,
        thermalAmpacityMVA: 50.0,
        loadingPct: Math.round((Math.abs(flow52) / cap52) * 100),
        isTripped: !isL52,
        pathMap: 'M 410 300 Q 480 270 530 190',
        pathSchematic: 'M 400 310 L 540 190',
        midMap: { x: 475, y: 255 },
        midSchematic: { x: 470, y: 250 }
      }
    ];

    const slackGenMW = Number((busSolution('SUB-ALPHA-132').pInjectionPn * PF_BASE_MVA).toFixed(1));
    const result: LoadFlowResult = {
      converged: loadFlowSolution.converged,
      iterations: loadFlowSolution.iterations,
      maxMismatch: Number(loadFlowSolution.maxMismatchPn.toExponential(2)),
      totalGenMW: Number((slackGenMW + gammaSolarGenMW + deltaHydroMW).toFixed(1)),
      totalLoadMW: Number((25.0 + betaLoadMW + 8.0 + 12.0 + epsilonLoadMW).toFixed(1)),
      totalLossesMW: totalLosses,
      timestamp: new Date().toLocaleTimeString()
    };

    return { nodes, lines, result };
  };

  const { nodes, lines, result } = solve5BusLoadFlow();

  // Selected node details
  const selectedNode = useMemo(() => {
    if (!selectedSubstationId) return null;
    return nodes.find((n) => n.id === selectedSubstationId) || null;
  }, [nodes, selectedSubstationId]);

  // Toggle Line Trip / Reclose
  const toggleLineTrip = (lineId: string) => {
    const nextState = !trippedLines[lineId];
    setTrippedLines((prev) => ({ ...prev, [lineId]: nextState }));
    const targetLine = lines.find((l) => l.id === lineId);
    addAuditLog(
      'SWITCHING',
      `Regional Grid Dispatch: Line ${targetLine?.name || lineId} ${nextState ? 'TRIPPED (N-1 OUTAGE SIMULATION)' : 'RECLOSED (IN SERVICE)'}`
    );
  };

  // Apply Quick Scenario Presets
  const applyScenarioPreset = (scenario: 'nominal' | 'heatwave' | 'solar_peak' | 'hydro_export' | 'n1_alpha_beta') => {
    if (scenario === 'nominal') {
      setAlphaGenMW(45.0);
      setBetaLoadMW(55.0);
      setGammaSolarGenMW(35.0);
      setDeltaHydroMW(50.0);
      setEpsilonLoadMW(30.0);
      setAmbientTempC(32);
      setWindSpeedMS(5.5);
      setSolarRadWM2(850);
      setTrippedLines({ L1_2: false, L2_3: false, L3_1: false, L1_4: false, L4_5: false, L5_2: false });
      addAuditLog('SWITCHING', 'Regional Grid Scenario: Reset to Balanced Base Case (Nominal)');
    } else if (scenario === 'heatwave') {
      setAlphaGenMW(65.0);
      setBetaLoadMW(78.0);
      setGammaSolarGenMW(40.0);
      setDeltaHydroMW(60.0);
      setEpsilonLoadMW(45.0);
      setAmbientTempC(44); // severe heat derates lines
      setWindSpeedMS(2.0);
      setSolarRadWM2(1050);
      setTrippedLines({ L1_2: false, L2_3: false, L3_1: false, L1_4: false, L4_5: false, L5_2: false });
      addAuditLog('SWITCHING', 'Regional Grid Scenario: Summer Heatwave & Peak Demand Applied');
    } else if (scenario === 'solar_peak') {
      setAlphaGenMW(20.0); // thermal plants throttled down
      setBetaLoadMW(45.0);
      setGammaSolarGenMW(60.0); // max solar export
      setDeltaHydroMW(30.0);
      setEpsilonLoadMW(25.0);
      setSolarRadWM2(1150);
      setTrippedLines({ L1_2: false, L2_3: false, L3_1: false, L1_4: false, L4_5: false, L5_2: false });
      addAuditLog('SWITCHING', 'Regional Grid Scenario: Solar Super-Peak & Reverse Power Flow Export');
    } else if (scenario === 'hydro_export') {
      setAlphaGenMW(25.0);
      setBetaLoadMW(50.0);
      setGammaSolarGenMW(20.0);
      setDeltaHydroMW(90.0); // hydro plant max output
      setEpsilonLoadMW(35.0);
      setTrippedLines({ L1_2: false, L2_3: false, L3_1: false, L1_4: false, L4_5: false, L5_2: false });
      addAuditLog('SWITCHING', 'Regional Grid Scenario: Hydro Dam Surplus Export');
    } else if (scenario === 'n1_alpha_beta') {
      setAlphaGenMW(50.0);
      setBetaLoadMW(65.0);
      setGammaSolarGenMW(35.0);
      setDeltaHydroMW(55.0);
      setEpsilonLoadMW(35.0);
      setTrippedLines({ L1_2: true, L2_3: false, L3_1: false, L1_4: false, L4_5: false, L5_2: false });
      addAuditLog('SWITCHING', 'Regional Grid Scenario: N-1 Contingency L1-2 Outage Injected');
    }
  };

  // Helper color for line loading
  const getLineColor = (line: ExtendedTransmissionLine) => {
    if (line.isTripped) return '#ef4444';
    if (line.loadingPct >= 90) return '#f43f5e';
    if (line.loadingPct >= 75) return '#f59e0b';
    if (line.voltageKV === 220) return '#a855f7';
    return '#06b6d4';
  };

  return (
    <div className="bg-[#090a0f] border border-zinc-800/90 rounded-2xl p-4 sm:p-6 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-indigo-600/10 blur-[100px] pointer-events-none -z-0" />
      <div className="absolute top-1/2 left-0 w-80 h-40 bg-cyan-600/10 blur-[120px] pointer-events-none -z-0" />

      {/* Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-950/70 border border-indigo-700/80 text-indigo-400 shadow-lg shadow-indigo-950/50">
            <Globe className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white tracking-wide font-sans">
                {t('regional_title')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                {t('regional_engine')}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                5 BUSBAR DIGITAL TWIN
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {t('regional_subtitle')}
            </p>
          </div>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex flex-wrap items-center gap-2 bg-zinc-950/90 p-1.5 rounded-xl border border-zinc-800 font-mono text-xs shadow-inner">
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
              viewMode === 'map'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{t('regional_view_map')}</span>
          </button>

          <button
            onClick={() => setViewMode('schematic')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
              viewMode === 'schematic'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{t('regional_view_schematic')}</span>
          </button>

          <button
            onClick={() => setViewMode('phasors')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
              viewMode === 'phasors'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{t('regional_view_phasors')}</span>
          </button>

          <button
            onClick={() => setViewMode('contingency')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
              viewMode === 'contingency'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{t('regional_view_contingency')}</span>
          </button>
        </div>
      </div>

      {/* Scenario Presets Bar */}
      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-zinc-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-bold">{t('regional_scenario_presets')}:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => applyScenarioPreset('nominal')}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all cursor-pointer"
          >
            {t('regional_preset_nominal')}
          </button>
          <button
            onClick={() => applyScenarioPreset('heatwave')}
            className="px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/80 transition-all cursor-pointer"
          >
            {t('regional_preset_heatwave')}
          </button>
          <button
            onClick={() => applyScenarioPreset('solar_peak')}
            className="px-2.5 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/80 transition-all cursor-pointer"
          >
            {t('regional_preset_solar_peak')}
          </button>
          <button
            onClick={() => applyScenarioPreset('hydro_export')}
            className="px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-800/80 transition-all cursor-pointer"
          >
            {t('regional_preset_hydro_export')}
          </button>
          <button
            onClick={() => applyScenarioPreset('n1_alpha_beta')}
            className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 transition-all cursor-pointer"
          >
            {t('regional_preset_n1_alpha_beta')}
          </button>
        </div>
      </div>

      {/* Grid Load, Infeed & Weather Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-zinc-950/90 p-4 rounded-xl border border-zinc-800 text-xs font-mono">
        {/* Alpha Infeed */}
        <div className="space-y-1.5 p-2 rounded-lg bg-zinc-900/70 border border-zinc-800/80">
          <div className="flex justify-between items-center">
            <span className="text-indigo-400 font-bold flex items-center gap-1">
              <Building className="w-3.5 h-3.5" /> Alpha
            </span>
            <span className="font-bold text-indigo-300">{alphaGenMW.toFixed(1)} MW</span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={alphaGenMW}
            onChange={(e) => setAlphaGenMW(Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
          />
          <div className="text-[10px] text-zinc-500">{t('regional_alpha_infeed')}</div>
        </div>

        {/* Beta Industrial Load */}
        <div className="space-y-1.5 p-2 rounded-lg bg-zinc-900/70 border border-zinc-800/80">
          <div className="flex justify-between items-center">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Factory className="w-3.5 h-3.5" /> Beta
            </span>
            <span className="font-bold text-amber-300">{betaLoadMW.toFixed(1)} MW</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            step="5"
            value={betaLoadMW}
            onChange={(e) => setBetaLoadMW(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
          />
          <div className="text-[10px] text-zinc-500">{t('regional_beta_load')}</div>
        </div>

        {/* Gamma Solar Gen */}
        <div className="space-y-1.5 p-2 rounded-lg bg-zinc-900/70 border border-zinc-800/80">
          <div className="flex justify-between items-center">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Sun className="w-3.5 h-3.5" /> Gamma
            </span>
            <span className="font-bold text-emerald-300">{gammaSolarGenMW.toFixed(1)} MW</span>
          </div>
          <input
            type="range"
            min="0"
            max="70"
            step="5"
            value={gammaSolarGenMW}
            onChange={(e) => setGammaSolarGenMW(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
          />
          <div className="text-[10px] text-zinc-500">{t('regional_gamma_solar')}</div>
        </div>

        {/* Delta Hydro Gen */}
        <div className="space-y-1.5 p-2 rounded-lg bg-zinc-900/70 border border-zinc-800/80">
          <div className="flex justify-between items-center">
            <span className="text-purple-400 font-bold flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Delta
            </span>
            <span className="font-bold text-purple-300">{deltaHydroMW.toFixed(1)} MW</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={deltaHydroMW}
            onChange={(e) => setDeltaHydroMW(Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
          />
          <div className="text-[10px] text-zinc-500">{t('regional_delta_hydro')}</div>
        </div>

        {/* Epsilon Urban Load */}
        <div className="space-y-1.5 p-2 rounded-lg bg-zinc-900/70 border border-zinc-800/80">
          <div className="flex justify-between items-center">
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <Building className="w-3.5 h-3.5" /> Epsilon
            </span>
            <span className="font-bold text-cyan-300">{epsilonLoadMW.toFixed(1)} MW</span>
          </div>
          <input
            type="range"
            min="10"
            max="60"
            step="5"
            value={epsilonLoadMW}
            onChange={(e) => setEpsilonLoadMW(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
          />
          <div className="text-[10px] text-zinc-500">{t('regional_epsilon_load')}</div>
        </div>
      </div>

      {/* Weather Layer Dynamic Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950/70 px-4 py-2.5 rounded-xl border border-zinc-800/60 text-xs font-mono">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWeatherLayer(!showWeatherLayer)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showWeatherLayer
                ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>{t('regional_weather_layer')}: {showWeatherLayer ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowParticles(!showParticles)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showParticles
                ? 'bg-cyan-950/60 border-cyan-700 text-cyan-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{t('regional_particles_flow')}: {showParticles ? 'ACTIVE' : 'OFF'}</span>
          </button>
        </div>

        {showWeatherLayer && (
          <div className="flex flex-wrap items-center gap-4 text-zinc-300">
            <div className="flex items-center gap-2">
              <Thermometer className="w-3.5 h-3.5 text-rose-400" />
              <span>{t('regional_temperature')}:</span>
              <input
                type="range"
                min="10"
                max="50"
                value={ambientTempC}
                onChange={(e) => setAmbientTempC(Number(e.target.value))}
                className="w-20 accent-rose-500 cursor-pointer h-1.5"
              />
              <span className="font-bold text-rose-300">{ambientTempC}°C</span>
            </div>

            <div className="flex items-center gap-2">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('regional_wind_speed')}:</span>
              <input
                type="range"
                min="0.5"
                max="20"
                step="0.5"
                value={windSpeedMS}
                onChange={(e) => setWindSpeedMS(Number(e.target.value))}
                className="w-20 accent-cyan-500 cursor-pointer h-1.5"
              />
              <span className="font-bold text-cyan-300">{windSpeedMS} m/s</span>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[10px]">
              <span>DTR Ampacity Multiplier:</span>
              <span className="font-bold">x{weatherDtrFactor}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Interactive Diagram / GIS Map Canvas */}
      <div className="bg-[#05070c] border border-zinc-800/90 rounded-2xl p-4 relative overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              {viewMode === 'map' && t('regional_view_map')}
              {viewMode === 'schematic' && t('regional_view_schematic')}
              {viewMode === 'phasors' && t('regional_view_phasors')}
              {viewMode === 'contingency' && t('regional_view_contingency')}
            </h3>
            <p className="text-xs text-zinc-400">
              {t('regional_vectors_desc')}
            </p>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">
            {t('regional_click_trip_line')}
          </span>
        </div>

        {/* 1. GIS VECTOR MAP VIEW */}
        {viewMode === 'map' && (
          <div className="w-full h-[460px] bg-[#04060a] border border-zinc-900 rounded-xl relative overflow-hidden flex items-center justify-center select-none">
            <svg className="w-full h-full" viewBox="0 0 680 400">
              <defs>
                {/* Background Grid Pattern */}
                <pattern id="gisGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#131722" strokeWidth="0.8" />
                </pattern>

                {/* Substation Radial Glow */}
                <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="solarGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="hydroGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </radialGradient>

                {/* Particle Animation Markers */}
                <circle id="flowParticleCyan" r="3" fill="#38bdf8" />
                <circle id="flowParticleAmber" r="3.5" fill="#fbbf24" />
                <circle id="flowParticleRose" r="3.5" fill="#f43f5e" />
              </defs>

              {/* Background Grid */}
              <rect width="100%" height="100%" fill="url(#gisGrid)" />

              {/* Simulated Terrain Elevation Contours */}
              <path
                d="M 50 40 Q 150 100 240 60 T 400 40 Q 560 90 640 50 L 640 0 L 0 0 Z"
                fill="#0d131f"
                opacity="0.6"
              />
              <path
                d="M 0 320 Q 120 280 260 330 T 520 310 Q 600 350 680 340 L 680 400 L 0 400 Z"
                fill="#0a101d"
                opacity="0.7"
              />

              {/* Northern Hydro Lake / Reservoir */}
              <ellipse cx="100" cy="50" rx="60" ry="25" fill="#1e1b4b" opacity="0.5" />
              <text x="100" y="54" textAnchor="middle" fill="#6366f1" fontSize="9" fontFamily="monospace" fontWeight="bold">
                ▲ HYDRO RESERVOIR DAM
              </text>

              {/* Southern Desert Solar Park Plateau */}
              <ellipse cx="150" cy="330" rx="90" ry="35" fill="#064e3b" opacity="0.3" />
              <text x="150" y="334" textAnchor="middle" fill="#10b981" fontSize="9" fontFamily="monospace" fontWeight="bold">
                ☼ HIGH IRRADIANCE DESERT (1150 W/m²)
              </text>

              {/* Eastern Industrial Steel Smelting Hub */}
              <rect x="470" y="140" width="160" height="90" rx="14" fill="#451a03" opacity="0.25" stroke="#78350f" strokeWidth="0.8" strokeDasharray="3 3" />
              <text x="550" y="156" textAnchor="middle" fill="#f59e0b" fontSize="9" fontFamily="monospace" fontWeight="bold">
                ⚙ INDUSTRIAL SMELTER SECTOR
              </text>

              {/* GIS Transmission Lines */}
              {lines.map((line) => {
                const color = getLineColor(line);
                const isOver = line.loadingPct >= 90;
                return (
                  <g key={line.id}>
                    {/* Underlying Glow Line */}
                    {!line.isTripped && (
                      <path
                        d={line.pathMap}
                        fill="none"
                        stroke={color}
                        strokeWidth={isOver ? 8 : 4}
                        strokeOpacity="0.2"
                      />
                    )}

                    {/* Main Line Stroke */}
                    <path
                      d={line.pathMap}
                      id={`path-map-${line.id}`}
                      fill="none"
                      stroke={color}
                      strokeWidth={line.isTripped ? 2 : line.voltageKV === 220 ? 4 : 3}
                      strokeDasharray={line.isTripped ? '6 6' : 'none'}
                    />

                    {/* Animated Power Flow Particles */}
                    {showParticles && !line.isTripped && Math.abs(line.flowActiveMW) > 1 && (
                      <>
                        <circle r={isOver ? 4 : 3} fill={color}>
                          <animateMotion
                            dur={`${Math.max(1.2, 8.0 - (Math.abs(line.flowActiveMW) / line.mvaCapacity) * 6)}s`}
                            repeatCount="indefinite"
                            keyPoints={line.flowActiveMW >= 0 ? '0;1' : '1;0'}
                            keyTimes="0;1"
                          >
                            <mpath href={`#path-map-${line.id}`} />
                          </animateMotion>
                        </circle>
                        <circle r={isOver ? 3 : 2.5} fill="#ffffff">
                          <animateMotion
                            dur={`${Math.max(1.2, 8.0 - (Math.abs(line.flowActiveMW) / line.mvaCapacity) * 6)}s`}
                            begin="-0.8s"
                            repeatCount="indefinite"
                            keyPoints={line.flowActiveMW >= 0 ? '0;1' : '1;0'}
                            keyTimes="0;1"
                          >
                            <mpath href={`#path-map-${line.id}`} />
                          </animateMotion>
                        </circle>
                      </>
                    )}

                    {/* Clickable Line Badge */}
                    <g
                      transform={`translate(${line.midMap.x}, ${line.midMap.y})`}
                      className="cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => toggleLineTrip(line.id)}
                    >
                      <rect
                        x="-65"
                        y="-13"
                        width="130"
                        height="26"
                        rx="6"
                        fill="#090a10"
                        stroke={line.isTripped ? '#ef4444' : isOver ? '#f43f5e' : '#27272a'}
                        strokeWidth="1.5"
                      />
                      <text
                        textAnchor="middle"
                        y="4"
                        fill={line.isTripped ? '#ef4444' : isOver ? '#f43f5e' : '#fafafa'}
                        fontSize="9.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {line.isTripped ? '⚡ N-1 TRIPPED' : `${line.flowActiveMW} MW (${line.loadingPct}%)`}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Substation Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedSubstationId === node.id;
                const isFaulted = node.status === 'FAULTED' || node.voltageMagPU < 0.94;
                const strokeColor = isFaulted
                  ? '#ef4444'
                  : node.category === 'HUB'
                  ? '#6366f1'
                  : node.category === 'SOLAR_BESS'
                  ? '#10b981'
                  : node.category === 'HYDRO_INTERTIE'
                  ? '#a855f7'
                  : node.category === 'INDUSTRIAL'
                  ? '#f59e0b'
                  : '#06b6d4';

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.mapX}, ${node.mapY})`}
                    className="cursor-pointer group"
                    onClick={() => setSelectedSubstationId(node.id)}
                  >
                    {/* Radial Glow Beacon */}
                    <circle r="44" fill={strokeColor} opacity="0.12" className="animate-pulse" />

                    {/* Outer Selection Ring */}
                    {isSelected && (
                      <circle r="38" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 4" className="animate-spin-slow" />
                    )}

                    {/* Main Node Body */}
                    <circle r="32" fill="#090a10" stroke={strokeColor} strokeWidth="2.5" />

                    {/* Node Text */}
                    <text textAnchor="middle" y="-8" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                      {node.name.split(' ')[1] || node.id}
                    </text>
                    <text textAnchor="middle" y="4" fill="#a1a1aa" fontSize="8" fontFamily="monospace">
                      {node.nominalKV}kV • {node.type.split('_')[0]}
                    </text>
                    <text
                      textAnchor="middle"
                      y="16"
                      fill={isFaulted ? '#ef4444' : '#10b981'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {node.voltageMagPU} pu ∠{node.voltageAngleDeg}°
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* 2. AC FLOW SCHEMATIC DIAGRAM VIEW */}
        {viewMode === 'schematic' && (
          <div className="w-full h-[460px] bg-[#04060a] border border-zinc-900 rounded-xl relative overflow-hidden flex items-center justify-center select-none">
            <svg className="w-full h-full" viewBox="0 0 680 400">
              {/* Transmission Corridors */}
              {lines.map((line) => {
                const color = getLineColor(line);
                return (
                  <g key={line.id}>
                    <path
                      d={line.pathSchematic}
                      id={`path-sch-${line.id}`}
                      fill="none"
                      stroke={color}
                      strokeWidth={line.isTripped ? 2 : 3.5}
                      strokeDasharray={line.isTripped ? '6 6' : 'none'}
                    />

                    {/* Schematic Midpoint Label */}
                    <g
                      transform={`translate(${line.midSchematic.x}, ${line.midSchematic.y})`}
                      className="cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => toggleLineTrip(line.id)}
                    >
                      <rect
                        x="-60"
                        y="-13"
                        width="120"
                        height="26"
                        rx="6"
                        fill="#090a10"
                        stroke={line.isTripped ? '#ef4444' : '#27272a'}
                      />
                      <text
                        textAnchor="middle"
                        y="4"
                        fill={line.isTripped ? '#ef4444' : '#fafafa'}
                        fontSize="9.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {line.isTripped ? '⚡ L-TRIPPED' : `${line.flowActiveMW} MW | ${line.flowReactiveMVar} MVAr`}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Substation Busbars */}
              {nodes.map((node) => {
                const isSelected = selectedSubstationId === node.id;
                const isFaulted = node.voltageMagPU < 0.94;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer"
                    onClick={() => setSelectedSubstationId(node.id)}
                  >
                    {/* Busbar Line (Thick copper/silver bar) */}
                    <rect x="-45" y="-6" width="90" height="12" rx="3" fill="#18181b" stroke={isSelected ? '#38bdf8' : isFaulted ? '#ef4444' : '#6366f1'} strokeWidth="2" />
                    <text textAnchor="middle" y="-12" fill="#ffffff" fontSize="10.5" fontWeight="bold" fontFamily="monospace">
                      {node.code}
                    </text>
                    <text textAnchor="middle" y="3" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
                      {node.nominalKV} kV
                    </text>
                    <text textAnchor="middle" y="20" fill={isFaulted ? '#ef4444' : '#10b981'} fontSize="9" fontFamily="monospace" fontWeight="bold">
                      {node.voltageMagPU} pu ∠{node.voltageAngleDeg}°
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* 3. PHASOR VECTORS & POLAR DIAGRAM VIEW */}
        {viewMode === 'phasors' && (
          <div className="w-full h-[460px] bg-[#04060a] border border-zinc-900 rounded-xl p-6 flex flex-col md:flex-row items-center justify-around gap-6">
            {/* Polar Chart */}
            <div className="w-72 h-72 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="-120 -120 240 240">
                {/* Concentric Voltage Circles */}
                <circle r="100" fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
                <circle r="80" fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
                <circle r="50" fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />

                {/* Axes */}
                <line x1="-110" y1="0" x2="110" y2="0" stroke="#3f3f46" strokeWidth="1" />
                <line x1="0" y1="-110" x2="0" y2="110" stroke="#3f3f46" strokeWidth="1" />
                <text x="105" y="12" fill="#71717a" fontSize="8" fontFamily="monospace">0° (Slack)</text>
                <text x="-115" y="12" fill="#71717a" fontSize="8" fontFamily="monospace">180°</text>
                <text x="4" y="-102" fill="#71717a" fontSize="8" fontFamily="monospace">+90°</text>
                <text x="4" y="112" fill="#71717a" fontSize="8" fontFamily="monospace">-90°</text>

                {/* Bus Voltage Vectors */}
                {nodes.map((node) => {
                  const rad = (node.voltageAngleDeg * Math.PI) / 180;
                  const length = node.voltageMagPU * 90; // scale
                  const targetX = length * Math.cos(rad);
                  const targetY = -1 * length * Math.sin(rad); // SVG Y is inverted
                  const color = node.id === 'BUS-01' ? '#6366f1' : node.id === 'BUS-02' ? '#f59e0b' : node.id === 'BUS-03' ? '#10b981' : node.id === 'BUS-04' ? '#a855f7' : '#06b6d4';

                  return (
                    <g key={node.id}>
                      <line x1="0" y1="0" x2={targetX} y2={targetY} stroke={color} strokeWidth="2.5" />
                      <circle cx={targetX} cy={targetY} r="4" fill={color} />
                      <text x={targetX + 6} y={targetY + 3} fill={color} fontSize="9" fontFamily="monospace" fontWeight="bold">
                        {node.id} ({node.voltageAngleDeg}°)
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Phasor Telemetry List */}
            <div className="flex-1 space-y-3 font-mono text-xs max-w-md">
              <div className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Bus Voltage Synchronous Phasors (IEEE C37.118)</span>
              </div>
              <div className="space-y-2">
                {nodes.map((node) => (
                  <div key={node.id} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">{node.name}</span>
                      <span className="text-[10px] text-zinc-500">{node.code}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold block">{node.voltageMagPU.toFixed(3)} pu ({((node.voltageMagPU * node.nominalKV)).toFixed(1)} kV)</span>
                      <span className="text-cyan-300 text-[11px]">∠ {node.voltageAngleDeg > 0 ? `+${node.voltageAngleDeg}` : node.voltageAngleDeg}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. N-1 CONTINGENCY & STABILITY MATRIX VIEW */}
        {viewMode === 'contingency' && (
          <div className="w-full h-[460px] bg-[#04060a] border border-zinc-900 rounded-xl p-4 overflow-y-auto font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>N-1 Dynamic Contingency Severity Ranking</span>
              </div>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                AUTOMATED FAST SCREENING
              </span>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-[10px]">
                  <th className="p-2">Outage Element</th>
                  <th className="p-2">Pre-Trip MW</th>
                  <th className="p-2">Worst Post-Trip Bus</th>
                  <th className="p-2">Overload Severity</th>
                  <th className="p-2">Mitigation / Redispatch</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {lines.map((line) => {
                  const isTripped = line.isTripped;
                  const severity = isTripped ? 'ACTIVE OUTAGE' : line.loadingPct > 80 ? 'CRITICAL RISK' : 'SECURE';
                  return (
                    <tr key={line.id} className="hover:bg-zinc-900/50">
                      <td className="p-2 font-bold text-white flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isTripped ? 'bg-rose-500' : 'bg-emerald-400'}`}></span>
                        {line.name}
                      </td>
                      <td className="p-2 text-cyan-300">{line.flowActiveMW} MW</td>
                      <td className="p-2 text-amber-300">SUB-BETA (0.951 pu)</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isTripped ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300'
                        }`}>
                          {severity}
                        </span>
                      </td>
                      <td className="p-2 text-zinc-400 text-[11px]">
                        {line.id === 'L1_2' ? 'Reroute via Delta 220kV & BESS peak discharge' : 'Reroute via Loop alpha-gamma'}
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => toggleLineTrip(line.id)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                            isTripped
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-rose-600 hover:bg-rose-500 text-white'
                          }`}
                        >
                          {isTripped ? 'RECLOSE LINE' : 'SIMULATE TRIP'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Load Flow Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-md">
          <span className="text-zinc-500 text-[10px] block uppercase">{t('regional_total_gen')}</span>
          <span className="text-xl font-extrabold text-emerald-400">{result.totalGenMW} MW</span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">{t('regional_regional_plants')}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-md">
          <span className="text-zinc-500 text-[10px] block uppercase">{t('regional_total_demand')}</span>
          <span className="text-xl font-extrabold text-amber-400">{result.totalLoadMW} MW</span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">{t('regional_demand_centers')}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-md">
          <span className="text-zinc-500 text-[10px] block uppercase">{t('regional_trans_losses')}</span>
          <span className="text-xl font-extrabold text-rose-400">{result.totalLossesMW} MW</span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">{t('regional_i2r_losses')}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-md">
          <span className="text-zinc-500 text-[10px] block uppercase">{t('regional_worst_bus')}</span>
          <span className={`text-xl font-extrabold ${nodes[1].voltageMagPU < 0.95 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`}>
            {nodes[1].voltageMagPU} pu ({nodes[1].voltageAngleDeg}°)
          </span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">Substation Beta Industrial</span>
        </div>
      </div>

      {/* Substation Digital Twin Detail Inspector Drawer (When clicked) */}
      {selectedNode && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-zinc-950/95 backdrop-blur-md border-l border-zinc-800 p-6 z-50 overflow-y-auto shadow-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm uppercase">{t('regional_inspect_sub')}</h3>
              </div>
              <button
                onClick={() => setSelectedSubstationId(null)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Substation Asset</div>
              <div className="text-sm font-bold text-white">{selectedNode.name}</div>
              <div className="text-xs text-zinc-400">{selectedNode.code} • {selectedNode.nominalKV} kV</div>
              <p className="text-[11px] text-zinc-400 font-sans mt-1">{selectedNode.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 text-[10px] block">Voltage (PU)</span>
                <span className={`text-base font-bold ${selectedNode.voltageMagPU < 0.95 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {selectedNode.voltageMagPU} pu
                </span>
                <span className="text-[10px] text-zinc-400">∠{selectedNode.voltageAngleDeg}°</span>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 text-[10px] block">Active Injection</span>
                <span className="text-base font-bold text-cyan-300">
                  {selectedNode.genActiveMW > 0 ? `+${selectedNode.genActiveMW}` : `-${selectedNode.loadActiveMW}`} MW
                </span>
                <span className="text-[10px] text-zinc-400">Q: {selectedNode.genReactiveMVar || selectedNode.loadReactiveMVar} MVAr</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Substation Operational State</div>
              <div className="flex justify-between">
                <span className="text-zinc-400">{t('regional_tap_changer')}:</span>
                <span className="font-bold text-white">Tap #{selectedNode.tapPosition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">{t('regional_statcom_status')}:</span>
                <span className="font-bold text-indigo-300">+{selectedNode.statcomMvar} MVAr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">{t('regional_spinning_reserve')}:</span>
                <span className="font-bold text-emerald-400">{selectedNode.spinningReserveMW} MW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Connected Feeders:</span>
                <span className="font-bold text-white">{selectedNode.feedersCount} Bays</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-indigo-200 text-xs leading-relaxed font-sans">
              <span className="font-bold font-mono text-indigo-300 block mb-1">GIS Coordinates:</span>
              Latitude: {selectedNode.coordinates.lat}° N, Longitude: {selectedNode.coordinates.lng}° E
            </div>
          </div>

          <button
            onClick={() => setSelectedSubstationId(null)}
            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs font-mono transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            Close Substation Inspector
          </button>
        </div>
      )}
    </div>
  );
};

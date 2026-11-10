import React, { useState } from 'react';
import { useScada } from '../../context/ScadaContext';
import { SwitchgearState } from '../../types/scada';
import {
  GitBranch,
  CheckCircle2,
  ShieldAlert,
  Layers,
  Lock,
  Zap,
  Radio,
  Flame,
  Cpu,
  MapPin,
  Play,
  Activity,
  Battery,
  AlertOctagon,
  Download,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Sliders,
  Eye,
  Settings,
  ChevronRight,
  ShieldCheck,
  Terminal,
  RefreshCw,
  Power,
  X,
  Gauge,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  Compass
} from 'lucide-react';

// Modals
import { DuvalTriangleModal } from './modals/DuvalTriangleModal';
import { ComtradeViewerModal } from './modals/ComtradeViewerModal';
import { TakagiFaultModal } from './modals/TakagiFaultModal';
import { UhfThermalModal } from './modals/UhfThermalModal';
import { MergingUnitModal } from './modals/MergingUnitModal';
import { MacroPreviewModal } from './modals/MacroPreviewModal';
import { SynchrocheckModal } from './modals/SynchrocheckModal';
import { ArcFlashHazardModal } from './modals/ArcFlashHazardModal';
import { InstrumentTransformerModal } from './modals/InstrumentTransformerModal';
import { PointOnWaveModal } from './modals/PointOnWaveModal';
import { Iec61850PacketInspectorModal } from './modals/Iec61850PacketInspectorModal';
import { HvdcPqCapabilityModal } from './modals/HvdcPqCapabilityModal';
import { HvdcDiagnosticsModal } from './modals/HvdcDiagnosticsModal';
import { SldBaySelectorBar, BayId } from './SldBaySelectorBar';
import { SldHoverInterlockHud, InterlockRuleInfo } from './SldHoverInterlockHud';
import { SldMinimap } from './SldMinimap';
import { SldEquipmentSearch, EquipmentTarget, SUBSTATION_EQUIPMENT_REGISTRY } from './SldEquipmentSearch';
import { SldSafetyTagBar, AppliedSafetyTag, TAG_DEFINITIONS } from './SldSafetyTagBar';
import { SldSynchroscopeHud } from './SldSynchroscopeHud';
import { SldProcessBusHoverScope, ProcessBusTelemetry } from './SldProcessBusHoverScope';
import { SldPowerFlowVectorBadge } from './SldPowerFlowVectorBadge';
import { SldMiniSparkline } from './SldMiniSparkline';
import { SldProtectionZoneOverlay } from './SldProtectionZoneOverlay';
import { SldBreakerArcEffect } from './SldBreakerArcEffect';
import { SldFloatingGlassDock } from './SldFloatingGlassDock';

type SelectedItemType = {
  id: string;
  name: string;
  ansiCode: string;
  type: 'breaker' | 'disconnector' | 'earthSwitch' | 'transformer' | 'busbar' | 'feeder' | 'bess' | 'hvdc' | 'instrument';
  trId?: 'TR-1' | 'TR-2' | 'HVDC';
  switchKey?: keyof SwitchgearState;
  bay: string;
  voltageRating: string;
  currentRating: string;
};

const SLD_SVG_DEFS = (
  <defs>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#18181b" strokeWidth="1" />
    </pattern>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="selectionGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#38bdf8" floodOpacity="0.9" />
    </filter>

    <marker id="flowArrowCyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
    </marker>
    <marker id="flowArrowPurple" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#c084fc" />
    </marker>
  </defs>
);

export const SingleLineDiagramTab: React.FC = () => {
  const {
    tr1State,
    tr2State,
    toggleSwitch,
    isDeviceLocked,
    lockedDevices,
    dgaData,
    auditLogs,
    t,
    hvdcState,
    setHvdcSetpoints,
    setHvdcControlMode,
    setHvdcFault,
    tripHvdcDccb,
    resetHvdcProtection,
  } = useScada();
  const [toastMsg, setToastMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // HVDC Modals State
  const [hvdcPqModalOpen, setHvdcPqModalOpen] = useState(false);
  const [hvdcDiagModalOpen, setHvdcDiagModalOpen] = useState(false);

  // Canvas Viewport & Zoom Controls State
  // Add a stateful zoom value for UI components that need re‑render on zoom change
  const [zoomState, setZoomState] = React.useState<number>(1.0);
// ==== Performance‑optimized pan/zoom state ====
// Use refs to avoid React re‑renders on every mouse move.
const zoomRef = React.useRef<number>(1.0);
const panRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
const isCanvasDraggingRef = React.useRef<boolean>(false);
const dragStartRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
const panStartRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

// Helper to apply SVG transform without triggering a component render.
const applyCanvasTransform = () => {
  if (svgRef.current) {
    const { x, y } = panRef.current;
    const scale = zoomRef.current;
    svgRef.current.setAttribute('transform', `translate(${x},${y}) scale(${scale})`);
  }
};

// Throttle transform updates via requestAnimationFrame.
let rafId = null as number | null;
const scheduleTransform = () => {
  if (rafId !== null) return; // already scheduled
  rafId = requestAnimationFrame(() => {
    applyCanvasTransform();
    rafId = null;
  });
};

// Expose mutable refs via setters used by UI handlers.
  const setZoom = (v: number) => {
    zoomRef.current = v;
    setZoomState(v);
    scheduleTransform();
  };
const setPan = (v: { x: number; y: number }) => {
  panRef.current = v;
  scheduleTransform();
};
const setIsCanvasDragging = (v: boolean) => {
  isCanvasDraggingRef.current = v;
};
const setDragStart = (v: { x: number; y: number }) => {
  dragStartRef.current = v;
};
const setPanStart = (v: { x: number; y: number }) => {
  panStartRef.current = v;
};
// ==== End of performance‑optimized state ====

// Expose current zoom and pan values for components that expect them as plain numbers/objects
const zoom = zoomRef.current;
const pan = panRef.current;

  const [inspectorTab, setInspectorTab] = useState<'control' | 'telemetry' | 'protection' | 'logs'>('control');

  // Show Legend Drawer
  const [showLegend, setShowLegend] = useState(false);

  // Selected Equipment in Inspector
  const [selectedItem, setSelectedItem] = useState<SelectedItemType>({
    id: '52-1',
    name: 'TR-1 Primary HV Circuit Breaker',
    ansiCode: 'ANSI 52',
    type: 'breaker',
    trId: 'TR-1',
    switchKey: 'hvBreaker52_1',
    bay: 'TR-1 Transformer Bay 01',
    voltageRating: '132.0 kV',
    currentRating: '2,000 A'
  });

  // Action Confirmation Dialog
  const [pendingAction, setPendingAction] = useState<{
    trId: 'TR-1' | 'TR-2' | 'HVDC';
    switchKey: keyof SwitchgearState;
    actionName: string;
  } | null>(null);

  // Layer Selector State
  const [layers, setLayers] = useState({
    powerFlow: true,
    assetDiagnostics: true,
    iec61850: true,
    protectionFaults: true,
    arcFlash: false,
    protectionZones: true,
    miniSparklines: true,
  });

  // Active Breaker Arc Flash Micro-Animation State
  const [activeArc, setActiveArc] = useState<{
    x: number;
    y: number;
    id: string;
    action: string;
    timingMs: number;
  } | null>(null);

  // Historical Telemetry arrays for mini-sparklines
  const [tr1TempHistory] = useState<number[]>([42, 45, 48, 52, 54, 57, 59, 61, 58, 62]);
  const [tr2TempHistory] = useState<number[]>([40, 42, 44, 46, 49, 51, 53, 55, 52, 56]);
  const [feeder1MwHistory] = useState<number[]>([8.2, 8.8, 9.5, 10.1, 11.0, 11.8, 12.4, 12.0, 12.6]);
  const [feeder4MwHistory] = useState<number[]>([14.0, 15.5, 17.2, 18.0, 19.1, 20.0, 19.8, 20.2]);
  const [sf6PressHistory] = useState<number[]>([6.3, 6.3, 6.2, 6.2, 6.2, 6.1, 6.2, 6.2]);

  // ISA-101 Bay Focus State
  const [focusedBay, setFocusedBay] = useState<BayId>('ALL');
  const [showMinimap, setShowMinimap] = useState(true);

  // Smart Interlock Rule Hover State
  const [hoverInterlock, setHoverInterlock] = useState<{
    info: InterlockRuleInfo;
    pos: { x: number; y: number };
  } | null>(null);

  // Modal Control States
  const [duvalModalTr, setDuvalModalTr] = useState<'TR-1' | 'TR-2' | null>(null);
  const [comtradeModalAsset, setComtradeModalAsset] = useState<string | null>(null);
  const [takagiModalData, setTakagiModalData] = useState<{ feeder: string; dist: number; tower: string } | null>(null);
  const [uhfModalData, setUhfModalData] = useState<{
    trId: 'TR-1' | 'TR-2';
    loc: 'Bushing HV-A' | 'Bushing HV-B' | 'Bushing HV-C' | 'OLTC Compartment' | 'Main Tank';
    pd: number;
    temp: number;
  } | null>(null);
  const [muModalData, setMuModalData] = useState<{ id: string; dev: string } | null>(null);
  const [macroModalType, setMacroModalType] = useState<'ATS_TRANSFER' | 'TR1_ISOLATION' | 'UFLS_LOAD_SHED' | null>(null);

  // New Modals State
  const [synchroModalData, setSynchroModalData] = useState<{ bayName: string; vA: number; vB: number } | null>(null);
  const [arcFlashModalData, setArcFlashModalData] = useState<{
    id: string;
    bay: string;
    v: string;
    ik: number;
    t: number;
    d: number;
  } | null>(null);
  const [txModalData, setTxModalData] = useState<{
    type: 'CT' | 'PT';
    tag: string;
    name: string;
    bay: string;
    pri: string;
    sec: string;
    acc: string;
    burden: number;
  } | null>(null);
  const [powModalData, setPowModalData] = useState<{
    id: string;
    name: string;
    bay: string;
    loadType: 'Transformer (50MVA Core)' | 'Capacitor Bank (10MVAR)' | 'Transmission Line (132kV)';
  } | null>(null);
  const [iecInspectorOpen, setIecInspectorOpen] = useState(false);

  // BESS Mode State
  const [bessDischarging, setBessDischarging] = useState(false);

  // Active Macro Highlight Preview path state
  const [previewMacroPath, setPreviewMacroPath] = useState<'ATS' | 'ISOLATION' | 'UFLS' | null>(null);

  // Advanced SLD Feature States
  const [spotlightTarget, setSpotlightTarget] = useState<EquipmentTarget | null>(null);
  const [activeTags, setActiveTags] = useState<AppliedSafetyTag[]>([
    {
      id: 'TAG-101',
      equipmentId: '52-T',
      type: 'LOTO',
      label: 'DO NOT OPERATE (LOTO PERMIT)',
      appliedBy: 'Maintenance Lead (ID #2091)',
      appliedAt: '08:30 UTC',
      workOrder: 'WO-2026-STA-AUX',
    },
  ]);
  const [isSynchroHudOpen, setIsSynchroHudOpen] = useState(false);
  const [hoverTelemetry, setHoverTelemetry] = useState<{ telemetry: ProcessBusTelemetry; pos: { x: number; y: number } } | null>(null);
  const [themeMode, setThemeMode] = useState<'ISA_101' | 'CYBERPUNK'>('CYBERPUNK');
  const svgRef = React.useRef<SVGSVGElement | null>(null);

  // Switch States
  const sw1 = tr1State.switches;
  const sw2 = tr2State.switches;

  const handleApplyTag = (tag: Omit<AppliedSafetyTag, 'id' | 'appliedAt'>) => {
    const newTag: AppliedSafetyTag = {
      ...tag,
      id: `TAG-${Date.now().toString().slice(-4)}`,
      appliedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setActiveTags((prev) => [...prev, newTag]);
    setToastMsg({ text: `Safety Tag [${newTag.label}] successfully attached to ${tag.equipmentId}`, isError: false });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleRemoveTag = (tagId: string) => {
    setActiveTags((prev) => prev.filter((t) => t.id !== tagId));
    setToastMsg({ text: `Safety Tag removed from equipment`, isError: false });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleExportBlueprintSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgRef.current);
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Substation_132kV_SLD_AsBuilt_${new Date().toISOString().slice(0, 10)}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMsg({ text: 'Vector Blueprint SVG successfully exported!', isError: false });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleExecuteSwitch = (trId: 'TR-1' | 'TR-2' | 'HVDC', switchKey: keyof SwitchgearState) => {
    // Check if another operator holds an exclusive device lock
    const effectiveTrId = trId === 'HVDC' ? 'TR-1' : trId;
    const remoteLock = isDeviceLocked(effectiveTrId, switchKey);
    if (remoteLock) {
      const remainingSec = Math.max(1, Math.ceil((remoteLock.lockExpiry - Date.now()) / 1000));
      setToastMsg({
        text: `DEVICE LOCKED BY ${remoteLock.lockedBy} [${remoteLock.userRole.toUpperCase()}] — ${remainingSec}s remaining`,
        isError: true,
      });
      setTimeout(() => setToastMsg(null), 4000);
      setPendingAction(null);
      return;
    }

    // Check if target equipment is blocked by active safety tag
    const targetId = selectedItem.id;
    const blockingTag = activeTags.find((t) => t.equipmentId === targetId);
    if (blockingTag) {
      setToastMsg({
        text: `INTERLOCK VIOLATION: Operation BLOCKED by active safety tag [${blockingTag.label}] (${blockingTag.workOrder || 'LOTO'})`,
        isError: true,
      });
      setTimeout(() => setToastMsg(null), 5000);
      setPendingAction(null);
      return;
    }

    const res = toggleSwitch(trId === 'HVDC' ? 'TR-1' : trId, switchKey);
    setToastMsg({ text: res.message, isError: !res.success });
    setTimeout(() => setToastMsg(null), 4000);
    setPendingAction(null);

    // Trigger Breaker Contact Arc Micro-Animation
    if (res.success) {
      const targetEq = SUBSTATION_EQUIPMENT_REGISTRY.find((e) => e.id === targetId);
      if (targetEq) {
        const timing = Math.floor(Math.random() * 15) + 32;
        setActiveArc({
          x: targetEq.x,
          y: targetEq.y,
          id: targetEq.id,
          action: 'Operated',
          timingMs: timing,
        });
        setTimeout(() => setActiveArc(null), 2400);
      }
    }
  };

  const handleSelectEquipment = (eq: EquipmentTarget) => {
    setSpotlightTarget(eq);
    const targetPanX = 500 - eq.x;
    const targetPanY = 325 - eq.y;
    setPan({ x: Math.round(targetPanX), y: Math.round(targetPanY) });
    setZoom(1.4);

    const isHvdc = eq.bay.includes('HVDC') || eq.id.includes('HVDC') || eq.id.includes('DC');
    const trIdVal: 'TR-1' | 'TR-2' | 'HVDC' = isHvdc ? 'HVDC' : eq.bay.includes('TR-2') ? 'TR-2' : 'TR-1';

    let switchKeyVal: keyof SwitchgearState | undefined;
    if (eq.id === '52-1') switchKeyVal = 'hvBreaker52_1';
    else if (eq.id === '52-2') switchKeyVal = 'mvBreaker52_2';
    else if (eq.id === '52-4') switchKeyVal = 'hvBreaker52_4';
    else if (eq.id === '52-5') switchKeyVal = 'mvBreaker52_5';
    else if (eq.id === '52-0') {
      switchKeyVal = 'busCoupler52_0';
      setIsSynchroHudOpen(true);
    }
    else if (eq.id === '52-6') switchKeyVal = 'busSectionalizer52_6';
    else if (eq.id === '89-1A') switchKeyVal = 'hvDisconnect89_1A';
    else if (eq.id === '89-1B') switchKeyVal = 'hvDisconnect89_1B';
    else if (eq.id === '89-2A') switchKeyVal = 'hvDisconnect89_2A';
    else if (eq.id === '89-2B') switchKeyVal = 'hvDisconnect89_2B';
    else if (eq.id === '89-2') switchKeyVal = 'mvDisconnect89_2';
    else if (eq.id === '89-5') switchKeyVal = 'mvDisconnect89_5';
    else if (eq.id === '84-1') switchKeyVal = 'earthSwitch84_1';
    else if (eq.id === '84-2') switchKeyVal = 'earthSwitch84_2';
    else if (eq.id === '52-HVDC') switchKeyVal = 'hvBreaker52_HVDC';
    else if (eq.id === '89-HVDC-A') switchKeyVal = 'hvDisconnect89_HVDC_A';
    else if (eq.id === '89-HVDC-B') switchKeyVal = 'hvDisconnect89_HVDC_B';
    else if (eq.id === '52-DC1') switchKeyVal = 'dccbPositive52_DC1';
    else if (eq.id === '52-DC2') switchKeyVal = 'dccbNegative52_DC2';
    else if (eq.id === '89-DCE1') switchKeyVal = 'dcEarth89_DCE1';
    else if (eq.id === '89-DCE2') switchKeyVal = 'dcEarth89_DCE2';

    setSelectedItem({
      id: eq.id,
      name: eq.name,
      ansiCode: eq.ansiCode,
      type: eq.type === 'transformer' ? 'transformer' : eq.type === 'disconnector' ? 'disconnector' : eq.type === 'earthSwitch' ? 'earthSwitch' : eq.type === 'busbar' ? 'busbar' : eq.type === 'feeder' ? 'feeder' : 'breaker',
      bay: eq.bay,
      voltageRating: eq.voltage,
      currentRating: eq.voltage.startsWith('132') ? '2,000 A' : eq.voltage.includes('320') ? '2,000 A DC' : '1,250 A',
      trId: trIdVal,
      switchKey: switchKeyVal,
    });
  };

  const triggerProcessBusHover = (
    e: React.MouseEvent,
    assetId: string,
    name: string,
    bay: string,
    vRating: string,
    iRating: string,
    isLive: boolean,
    currentA: number
  ) => {
    const vRms = isLive ? (vRating.startsWith('132') ? tr1State.gridVoltage : 13.8) : 0;
    const iRms = isLive ? currentA : 0;
    setHoverTelemetry({
      telemetry: {
        assetId,
        name,
        bay,
        voltageRating: vRating,
        currentRating: iRating,
        vRmsA: vRms,
        vRmsB: vRms,
        vRmsC: vRms,
        iRmsA: iRms,
        iRmsB: iRms * 0.99,
        iRmsC: iRms * 1.01,
        frequency: tr1State.frequency || 50.0,
        thdPct: 1.14,
        harmonics: [100, 0.4, 1.8, 0.9, 0.5, 0.2],
      },
      pos: { x: e.clientX, y: e.clientY },
    });
  };

  // Line Energization States:
  const isBusALive = (tr1State?.gridVoltage ?? 0) > 20 && !tr1State?.faults?.underVoltage;
  const isBusBLive = (isBusALive && sw1.busCoupler52_0) || (sw1.hvDisconnect89_1B && (sw1.hvDisconnect89_1A && isBusALive)) || (sw2.hvDisconnect89_2B && (sw2.hvDisconnect89_2A && isBusALive));

  // TR-1 HV Path
  const isTR1_HV_Live = (sw1.hvDisconnect89_1A && isBusALive) || (sw1.hvDisconnect89_1B && isBusBLive);
  const isTR1_PrimLive = isTR1_HV_Live && sw1.hvBreaker52_1;

  // Interlock Hover Handler
  const handleInterlockHover = (
    e: React.MouseEvent,
    tag: string,
    name: string,
    isClosed: boolean,
    isPermissive: boolean,
    ruleCode: string,
    conditionDescription: string,
    blockingReasons?: string[],
    interlockedAssets?: string[]
  ) => {
    setHoverInterlock({
      info: {
        tag,
        name,
        isClosed,
        isPermissive,
        ruleCode,
        conditionDescription,
        blockingReasons,
        interlockedAssets,
      },
      pos: { x: e.clientX, y: e.clientY },
    });
  };

  // TR-1 Secondary MV Path
  const isTR1_SecLive = isTR1_PrimLive && sw1.mvBreaker52_2 && sw1.mvDisconnect89_2;

  // TR-2 HV Path
  const isTR2_HV_Live = (sw2.hvDisconnect89_2A && isBusALive) || (sw2.hvDisconnect89_2B && isBusBLive);
  const isTR2_PrimLive = isTR2_HV_Live && sw2.hvBreaker52_4;

  // TR-2 Secondary MV Path
  const isTR2_SecLive = isTR2_PrimLive && sw2.mvBreaker52_5 && sw2.mvDisconnect89_5;

  // HVDC Infeed & Transmission Path (Bay 07)
  const isHVDC_HV_Live = (sw1.hvDisconnect89_HVDC_A && isBusALive) || (sw1.hvDisconnect89_HVDC_B && isBusBLive);
  const isHVDC_AC_Live = isHVDC_HV_Live && sw1.hvBreaker52_HVDC;
  const isHVDC_DC_Pos_Live = isHVDC_AC_Live && sw1.dccbPositive52_DC1 && !sw1.dcEarth89_DCE1;
  const isHVDC_DC_Neg_Live = isHVDC_AC_Live && sw1.dccbNegative52_DC2 && !sw1.dcEarth89_DCE2;
  const hvdcProtectionLatched = hvdcState.dccbTripped || hvdcState.converterBlocked || hvdcState.faultState !== 'NONE';

  // MV Section 1 & Section 2 Busbars
  const isMVBus1Live = isTR1_SecLive || (sw1.busSectionalizer52_6 && isTR2_SecLive);
  const isMVBus2Live = isTR2_SecLive || (sw1.busSectionalizer52_6 && isTR1_SecLive) || (bessDischarging && sw1.feederBess52_B);

  // Grounding
  const isBus1Grounded = sw1.earthSwitch84_1;
  const isBus2Grounded = sw1.earthSwitch84_2;

  const getLineColor = (isLive: boolean, isGrounded: boolean) => {
    if (isGrounded) return '#eab308'; // Grounded Yellow
    if (isLive) return '#10b981'; // Live Green
    return '#475569'; // Open Gray
  };

  // IEEE C57.91 Aging Acceleration Factor FAA & %LOL calculation
  const calcAging = (windingTemp: number) => {
    const faa = Math.exp((15000 / 383) - (15000 / (windingTemp + 273.15)));
    const lolPct = (faa * 2400 / 180000) * 100;
    return { faa: Math.max(0.01, faa), lolPct: Math.max(0.001, lolPct) };
  };

  const tr1Aging = calcAging(tr1State.windingTemp);
  const tr2Aging = calcAging(tr2State.windingTemp);

  // Duval diagnosis label
  const sumTri = dgaData.ch4 + dgaData.c2h4 + dgaData.c2h2 || 1;
  const pctC2H4 = (dgaData.c2h4 / sumTri) * 100;
  const pctC2H2 = (dgaData.c2h2 / sumTri) * 100;
  const dgaStatusText = pctC2H2 > 15 ? 'D2 HIGH ARCING' : pctC2H4 > 20 ? 'T2 THERMAL' : 'NOMINAL';

  // Substation totals
  const totalLoadMW = ((tr1State.activePower + tr2State.activePower) / 1000).toFixed(1);
  const totalLoadMVAR = ((tr1State.reactivePower + tr2State.reactivePower) / 1000).toFixed(1);

  // Check state of currently selected switch or busbar
  const isSelectedClosed = selectedItem.switchKey && selectedItem.trId
    ? (selectedItem.trId === 'TR-2' ? sw2[selectedItem.switchKey] : sw1[selectedItem.switchKey])
    : selectedItem.type === 'busbar'
      ? (selectedItem.id === 'BUS-A' ? isBusALive : isBusBLive)
      : false;

  return (
    <div className="space-y-4 font-mono text-slate-100">
      {/* 1. TOP SUBSTATION COMMAND & KPI TICKER BAR */}
      <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Substation Identity & Status Header */}
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-emerald-950/90 border border-emerald-500/40 rounded-xl text-emerald-400 shadow-lg shadow-emerald-950/50">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-base font-extrabold tracking-wide text-zinc-100 font-sans">
                  {t('sld_title')}
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700/60 rounded-full flex items-center space-x-1.5 shadow-inner">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>{t('scada_live')}</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans">
                {t('sld_subtitle')}
              </p>
            </div>
          </div>

          {/* Substation KPI Quick Cards */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-zinc-900/90 border border-zinc-800/80 px-3.5 py-2 rounded-xl flex items-center space-x-3">
              <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase block tracking-wider font-sans">{t('total_load')}</span>
                <span className="text-xs font-bold text-cyan-300 font-mono">{totalLoadMW} MW <span className="text-zinc-500">/</span> {totalLoadMVAR} MVAR</span>
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800/80 px-3.5 py-2 rounded-xl flex items-center space-x-3">
              <Gauge className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase block tracking-wider font-sans">{t('grid_frequency')}</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">{tr1State.frequency.toFixed(2)} Hz</span>
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800/80 px-3.5 py-2 rounded-xl flex items-center space-x-3">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase block tracking-wider font-sans">{t('hv_busbar_a')}</span>
                <span className="text-xs font-bold text-zinc-200 font-mono">
                  {isBusALive ? `${tr1State.gridVoltage.toFixed(1)} kV` : '0.0 kV'}
                </span>
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800/80 px-3.5 py-2 rounded-xl flex items-center space-x-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase block tracking-wider font-sans">{t('interlocks')}</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">{t('active')}</span>
              </div>
            </div>
          </div>

          {/* Quick Macro Sequence Launchers */}
          <div className="flex items-center space-x-2 bg-zinc-900/70 p-1.5 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] text-amber-400 font-bold uppercase px-2 flex items-center space-x-1 font-sans">
              <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{t('macros')}</span>
            </span>
            <button
              onClick={() => {
                setPreviewMacroPath('ATS');
                setMacroModalType('ATS_TRANSFER');
              }}
              onMouseEnter={() => setPreviewMacroPath('ATS')}
              onMouseLeave={() => setPreviewMacroPath(null)}
              className="px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 text-xs rounded-lg font-bold cursor-pointer transition-all shadow-sm active:scale-95 flex items-center space-x-1 font-sans"
            >
              <span>{t('ats_transfer')}</span>
            </button>
            <button
              onClick={() => {
                setPreviewMacroPath('ISOLATION');
                setMacroModalType('TR1_ISOLATION');
              }}
              onMouseEnter={() => setPreviewMacroPath('ISOLATION')}
              onMouseLeave={() => setPreviewMacroPath(null)}
              className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs rounded-lg font-bold cursor-pointer transition-all shadow-sm active:scale-95 flex items-center space-x-1 font-sans"
            >
              <span>{t('tr1_isolation')}</span>
            </button>
            <button
              onClick={() => {
                setPreviewMacroPath('UFLS');
                setMacroModalType('UFLS_LOAD_SHED');
              }}
              onMouseEnter={() => setPreviewMacroPath('UFLS')}
              onMouseLeave={() => setPreviewMacroPath(null)}
              className="px-3 py-1.5 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs rounded-lg font-bold cursor-pointer transition-all shadow-sm active:scale-95 flex items-center space-x-1 font-sans"
            >
              <span>{t('ufls_shed')}</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Layer Toggles & View Controls Bar */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-zinc-800/80 gap-2">
          <div className="flex items-center space-x-2 text-xs font-sans">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-zinc-300 font-bold uppercase tracking-wide text-[11px]">Telemetry & Diagnostic Layers:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
            <label className={`px-3 py-1.5 rounded-xl border cursor-pointer transition-all flex items-center space-x-2 ${
              layers.powerFlow ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-950' : 'bg-zinc-900/80 border-zinc-800 text-zinc-500 hover:border-zinc-700'
            }`}>
              <input
                type="checkbox"
                checked={layers.powerFlow}
                onChange={(e) => setLayers({ ...layers, powerFlow: e.target.checked })}
                className="sr-only"
              />
              <span className={`w-2 h-2 rounded-full ${layers.powerFlow ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-600'}`} />
              <span className="font-medium text-[11px]">{t('power_flow_particles')}</span>
            </label>

            <label className={`px-3 py-1.5 rounded-xl border cursor-pointer transition-all flex items-center space-x-2 ${
              layers.assetDiagnostics ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-sm shadow-purple-950' : 'bg-zinc-900/80 border-zinc-800 text-zinc-500 hover:border-zinc-700'
            }`}>
              <input
                type="checkbox"
                checked={layers.assetDiagnostics}
                onChange={(e) => setLayers({ ...layers, assetDiagnostics: e.target.checked })}
                className="sr-only"
              />
              <span className={`w-2 h-2 rounded-full ${layers.assetDiagnostics ? 'bg-purple-400 animate-pulse' : 'bg-zinc-600'}`} />
              <span className="font-medium text-[11px]">{t('asset_health_rings')}</span>
            </label>

            <label className={`px-3 py-1.5 rounded-xl border cursor-pointer transition-all flex items-center space-x-2 ${
              layers.iec61850 ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-950' : 'bg-zinc-900/80 border-zinc-800 text-zinc-500 hover:border-zinc-700'
            }`}>
              <input
                type="checkbox"
                checked={layers.iec61850}
                onChange={(e) => setLayers({ ...layers, iec61850: e.target.checked })}
                className="sr-only"
              />
              <span className={`w-2 h-2 rounded-full ${layers.iec61850 ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              <span className="font-medium text-[11px]">{t('iec_61850_mus')}</span>
            </label>

            <label className={`px-3 py-1.5 rounded-xl border cursor-pointer transition-all flex items-center space-x-2 ${
              layers.protectionFaults ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-sm shadow-amber-950' : 'bg-zinc-900/80 border-zinc-800 text-zinc-500 hover:border-zinc-700'
            }`}>
              <input
                type="checkbox"
                checked={layers.protectionFaults}
                onChange={(e) => setLayers({ ...layers, protectionFaults: e.target.checked })}
                className="sr-only"
              />
              <span className={`w-2 h-2 rounded-full ${layers.protectionFaults ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'}`} />
              <span className="font-medium text-[11px]">{t('safety_locks')}</span>
            </label>

            <label className={`px-3 py-1.5 rounded-xl border cursor-pointer transition-all flex items-center space-x-2 ${
              layers.arcFlash ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-sm shadow-rose-950' : 'bg-zinc-900/80 border-zinc-800 text-zinc-500 hover:border-zinc-700'
            }`}>
              <input
                type="checkbox"
                checked={layers.arcFlash}
                onChange={(e) => setLayers({ ...layers, arcFlash: e.target.checked })}
                className="sr-only"
              />
              <span className={`w-2 h-2 rounded-full ${layers.arcFlash ? 'bg-rose-400 animate-pulse' : 'bg-zinc-600'}`} />
              <span className="font-medium text-[11px]">Arc Flash (NFPA 70E)</span>
            </label>

            <button
              onClick={() => setIecInspectorOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-emerald-700/60 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 transition-all flex items-center space-x-1.5 cursor-pointer font-medium text-[11px]"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>61850 Packet Bus</span>
            </button>

            <button
              onClick={() => setShowLegend(!showLegend)}
              className={`px-3 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 cursor-pointer font-medium text-[11px] ${
                showLegend ? 'bg-amber-950 text-amber-300 border-amber-600' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('symbol_key')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interlock Safety Toast Notification */}
      {toastMsg && (
        <div
          className={`p-3.5 rounded-2xl border font-mono text-xs flex items-center justify-between transition-all shadow-2xl ${
            toastMsg.isError
              ? 'bg-rose-950/90 border-rose-600 text-rose-200 shadow-rose-950/50'
              : 'bg-emerald-950/90 border-emerald-600 text-emerald-200 shadow-emerald-950/50'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {toastMsg.isError ? (
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span className="font-bold">{toastMsg.text}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-zinc-400 hover:text-zinc-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. MAIN WORKSPACE: SLD CANVAS + INSPECTOR PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* MAIN SLD CANVAS (8 COLS ON DESKTOP) */}
        <div className="lg:col-span-8 bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 shadow-2xl relative flex flex-col justify-between min-h-[660px] overflow-hidden space-y-3">
          {/* Top Quick Search & Engineering Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-zinc-900/80 p-2 rounded-2xl border border-zinc-800">
            <div className="flex-1 min-w-[240px]">
              <SldEquipmentSearch
                onSelectEquipment={handleSelectEquipment}
                spotlightTarget={spotlightTarget}
                onClearSpotlight={() => setSpotlightTarget(null)}
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Synchroscope Dial Launcher */}
              <button
                onClick={() => setIsSynchroHudOpen(!isSynchroHudOpen)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                  isSynchroHudOpen
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-cyan-950'
                    : 'bg-zinc-800/90 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                }`}
                title="Open ANSI 25 Synchroscope Dial HUD"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>ANSI 25 Synchroscope</span>
              </button>

              {/* Vector Blueprint SVG Export */}
              <button
                onClick={handleExportBlueprintSvg}
                className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-600/70 text-emerald-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Export live SLD as Vector CAD / SVG Blueprint"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export As-Built SVG</span>
              </button>

              {/* ISA-101 vs Cyberpunk Theme Switcher */}
              <button
                onClick={() => setThemeMode(themeMode === 'ISA_101' ? 'CYBERPUNK' : 'ISA_101')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  themeMode === 'ISA_101'
                    ? 'bg-slate-800 border-slate-600 text-slate-200'
                    : 'bg-indigo-950 border-indigo-500 text-indigo-300'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{themeMode === 'ISA_101' ? 'ISA-101 Mode' : 'Cyberpunk SCADA'}</span>
              </button>
            </div>
          </div>

          {/* ISA-101 Bay Isolation & Quick Jump Toolbar */}
          <SldBaySelectorBar
            focusedBay={focusedBay}
            onSelectBay={(bay) => setFocusedBay(bay)}
            onQuickJump={(x, y, zoomLevel) => {
              setPan({ x, y });
              setZoom(zoomLevel);
            }}
            zoom={zoom}
            onZoomChange={(newZoom) => setZoom(newZoom)}
            onResetView={() => {
              setZoom(1.0);
              setPan({ x: 0, y: 0 });
              setFocusedBay('ALL');
            }}
            showMinimap={showMinimap}
            onToggleMinimap={() => setShowMinimap(!showMinimap)}
          />

          {/* Symbol Key Legend Overlay */}
          {showLegend && (
            <div className="absolute top-16 right-5 z-20 bg-zinc-900/95 border border-zinc-700/80 p-4 rounded-2xl shadow-2xl max-w-sm space-y-2.5 text-xs backdrop-blur-xl font-sans">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <span className="font-bold text-amber-400 uppercase flex items-center space-x-1.5 tracking-wide text-xs">
                  <Info className="w-4 h-4" />
                  <span>IEC 60617 Switchgear Legend</span>
                </span>
                <button onClick={() => setShowLegend(false)} className="text-zinc-400 hover:text-zinc-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-[11px] text-zinc-300 pt-1">
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 bg-emerald-950 border border-emerald-500 rounded flex items-center justify-center text-[9px] font-bold text-emerald-400">✕</span>
                  <span>52 Breaker (Closed)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 bg-zinc-900 border border-zinc-600 rounded flex items-center justify-center text-[9px] font-bold text-zinc-400">▢</span>
                  <span>52 Breaker (Open)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-cyan-400 font-bold">──/ ──</span>
                  <span>89 Disconnector</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400 font-bold">──⏚</span>
                  <span>84 Earth Switch</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 block" />
                  <span>Transformer Winding</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-1.5 py-0.5 bg-emerald-900 text-emerald-300 text-[9px] font-bold rounded">MU</span>
                  <span>61850 Merging Unit</span>
                </div>
              </div>
            </div>
          )}

          {/* SVG Canvas Container */}
          <div
            className={`overflow-hidden relative w-full flex items-center justify-center p-2 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 select-none ${
              isCanvasDraggingRef.current ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onMouseDown={(e) => {
              if (e.button === 0) {
                setIsCanvasDragging(true);
                setDragStart({ x: e.clientX, y: e.clientY });
                // Use current pan values from ref
                setPanStart({ x: panRef.current.x, y: panRef.current.y });
              }
            }}
            onMouseMove={(e) => {
              if (isCanvasDraggingRef.current) {
                const dx = (e.clientX - dragStartRef.current.x) / zoomRef.current;
                const dy = (e.clientY - dragStartRef.current.y) / zoomRef.current;
                setPan({ x: Math.round(panStartRef.current.x + dx), y: Math.round(panStartRef.current.y + dy) });
              }
            }}
            onMouseUp={() => setIsCanvasDragging(false)}
            onMouseLeave={() => setIsCanvasDragging(false)}
            onWheel={(e) => {
              const delta = e.deltaY < 0 ? 0.1 : -0.1;
              setZoom(Math.min(2.5, Math.max(0.5, Number((zoomRef.current + delta).toFixed(2)))));
            }}
          >
            <svg
              ref={svgRef}
              viewBox="0 0 1200 650"
              className="w-full h-[600px] min-w-[880px] font-mono transition-transform duration-100"
              /* Transform is applied via requestAnimationFrame using refs */
            >
              {SLD_SVG_DEFS}

              {/* Background Canvas Grid */}
              <rect width="1200" height="650" fill="url(#grid)" />

              {/* ==================== ARC FLASH HAZARD BOUNDARIES (IEEE 1584 / NFPA 70E) ==================== */}
              {layers.arcFlash && (
                <g id="arc-flash-layer">
                  {/* 132kV Yard Arc Flash Boundary */}
                  <g
                    className="cursor-pointer"
                    onClick={() =>
                      setArcFlashModalData({
                        id: '132kV-SWYD',
                        bay: '132kV Main Switchyard',
                        v: '132.0 kV',
                        ik: 31.5,
                        t: 90,
                        d: 36,
                      })
                    }
                  >
                    <rect
                      x="70"
                      y="40"
                      width="860"
                      height="105"
                      fill="#f43f5e"
                      fillOpacity="0.12"
                      stroke="#f43f5e"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                      rx="8"
                    />
                    <rect x="80" y="46" width="220" height="18" fill="#881337" rx="4" />
                    <text x="86" y="58" fill="#fecdd3" fontSize="9" fontWeight="bold">
                      🔥 132kV YARD: 18.4 cal/cm² (CAT 4)
                    </text>
                  </g>

                  {/* TR-1 Bay Arc Flash Boundary */}
                  <g
                    className="cursor-pointer"
                    onClick={() =>
                      setArcFlashModalData({
                        id: 'TR1-BAY',
                        bay: 'TR-1 40MVA Bay 01',
                        v: '132/13.8 kV',
                        ik: 25.0,
                        t: 80,
                        d: 24,
                      })
                    }
                  >
                    <rect
                      x="160"
                      y="150"
                      width="290"
                      height="230"
                      fill="#f59e0b"
                      fillOpacity="0.10"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                      rx="8"
                    />
                    <rect x="170" y="156" width="210" height="18" fill="#78350f" rx="4" />
                    <text x="176" y="168" fill="#fef3c7" fontSize="9" fontWeight="bold">
                      🔥 TR-1 BAY: 12.6 cal/cm² (CAT 3)
                    </text>
                  </g>

                  {/* TR-2 Bay Arc Flash Boundary */}
                  <g
                    className="cursor-pointer"
                    onClick={() =>
                      setArcFlashModalData({
                        id: 'TR2-BAY',
                        bay: 'TR-2 40MVA Bay 03',
                        v: '132/13.8 kV',
                        ik: 25.0,
                        t: 80,
                        d: 24,
                      })
                    }
                  >
                    <rect
                      x="550"
                      y="150"
                      width="290"
                      height="230"
                      fill="#f59e0b"
                      fillOpacity="0.10"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                      rx="8"
                    />
                    <rect x="560" y="156" width="210" height="18" fill="#78350f" rx="4" />
                    <text x="566" y="168" fill="#fef3c7" fontSize="9" fontWeight="bold">
                      🔥 TR-2 BAY: 12.6 cal/cm² (CAT 3)
                    </text>
                  </g>

                  {/* 13.8kV MV Switchgear Arc Flash Boundary */}
                  <g
                    className="cursor-pointer"
                    onClick={() =>
                      setArcFlashModalData({
                        id: 'MV-SWG',
                        bay: '13.8kV Medium Voltage Switchgear',
                        v: '13.8 kV',
                        ik: 16.0,
                        t: 60,
                        d: 18,
                      })
                    }
                  >
                    <rect
                      x="120"
                      y="390"
                      width="760"
                      height="180"
                      fill="#10b981"
                      fillOpacity="0.10"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                      rx="8"
                    />
                    <rect x="130" y="396" width="200" height="18" fill="#064e3b" rx="4" />
                    <text x="136" y="408" fill="#a7f3d0" fontSize="9" fontWeight="bold">
                      🔥 MV SWG: 7.2 cal/cm² (CAT 2)
                    </text>
                  </g>
                </g>
              )}

              {/* ==================== 1. ELECTRICAL BUSBARS & POWER FLOW LAYER ==================== */}
              {/* Main Busbar A */}
              <g
                className="cursor-pointer group"
                style={{ opacity: focusedBay === 'ALL' || focusedBay === 'BAY_01_TR1' || focusedBay === 'BAY_02_COUPLER' || focusedBay === 'BAY_03_TR2' || focusedBay === 'BAY_07_HVDC' ? 1 : 0.85, transition: 'opacity 0.3s' }}
                onClick={() => {
                  setSelectedItem({
                    id: 'BUS-A',
                    name: '132kV Main Busbar A',
                    ansiCode: '132kV BUS-A',
                    type: 'busbar',
                    trId: 'TR-1',
                    bay: '132kV Main Busbar Bay',
                    voltageRating: `${isBusALive ? (tr1State?.gridVoltage ?? 132.0).toFixed(1) : '0.0'} kV`,
                    currentRating: '3,150 A'
                  });
                }}
              >
                {/* Conductor Outer Protective Channel */}
                <line
                  x1="90"
                  y1="80"
                  x2="1140"
                  y2="80"
                  stroke="#090d16"
                  strokeWidth="12"
                  strokeLinecap="round"
                />

                {/* Main Conductor Bar */}
                <line
                  x1="90"
                  y1="80"
                  x2="1140"
                  y2="80"
                  stroke={isBusALive ? '#10b981' : '#94a3b8'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  filter={selectedItem.id === 'BUS-A' ? 'url(#selectionGlow)' : isBusALive ? 'url(#glow)' : undefined}
                />

                {/* Conductor Core Reflection / Neon Track */}
                <line
                  x1="90"
                  y1="80"
                  x2="1140"
                  y2="80"
                  stroke={isBusALive ? '#a7f3d0' : '#f1f5f9'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeOpacity="0.8"
                />

                {/* Left & Right Terminal Blocks */}
                <rect x="80" y="74" width="12" height="12" rx="3" fill="#0f172a" stroke={isBusALive ? '#10b981' : '#94a3b8'} strokeWidth="1.5" />
                <rect x="1138" y="74" width="12" height="12" rx="3" fill="#0f172a" stroke={isBusALive ? '#10b981' : '#94a3b8'} strokeWidth="1.5" />

                {/* Prominent High-Visibility Bus A Header Identification Badge */}
                <g transform="translate(90, 48)">
                  <rect
                    x="0"
                    y="0"
                    width="310"
                    height="24"
                    rx="6"
                    fill={isBusALive ? '#022c22' : '#18181b'}
                    stroke={isBusALive ? '#10b981' : '#71717a'}
                    strokeWidth="1.5"
                    className="transition-all group-hover:stroke-cyan-400"
                  />
                  <circle cx="14" cy="12" r="4.5" fill={isBusALive ? '#10b981' : '#ef4444'} className={isBusALive ? 'animate-pulse' : ''} />
                  <text x="26" y="16" fill="#ffffff" fontSize="10" fontWeight="extrabold" letterSpacing="0.5">
                    132kV MAIN BUSBAR A
                  </text>
                  <rect x="175" y="4" width="65" height="16" rx="4" fill={isBusALive ? '#065f46' : '#27272a'} />
                  <text x="207" y="15.5" fill={isBusALive ? '#a7f3d0' : '#cbd5e1'} fontSize="8.5" fontWeight="bold" textAnchor="middle">
                    {isBusALive ? `${(tr1State?.gridVoltage ?? 132.0).toFixed(1)} kV` : '0.0 kV'}
                  </text>
                  <rect x="245" y="4" width="58" height="16" rx="4" fill={isBusALive ? '#042f2e' : '#27272a'} />
                  <text x="274" y="15.5" fill={isBusALive ? '#2dd4bf' : '#a1a1aa'} fontSize="8.5" fontWeight="bold" textAnchor="middle">
                    {tr1State?.frequency ? tr1State.frequency.toFixed(2) : '50.00'} Hz
                  </text>
                </g>

                {/* Live 3-Phase Voltage Ticker on Right Side */}
                <g transform="translate(680, 48)">
                  <rect x="0" y="0" width="228" height="24" rx="6" fill="#090d16" stroke="#334155" strokeWidth="1.2" />
                  <text x="8" y="15.5" fill="#94a3b8" fontSize="8" fontWeight="bold">
                    Va:<tspan fill="#38bdf8">76.2k</tspan> Vb:<tspan fill="#38bdf8">76.2k</tspan> Vc:<tspan fill="#38bdf8">76.2k</tspan>
                  </text>
                </g>
              </g>

              {/* Reserve Busbar B */}
              <g
                className="cursor-pointer group"
                style={{ opacity: focusedBay === 'ALL' || focusedBay === 'BAY_01_TR1' || focusedBay === 'BAY_02_COUPLER' || focusedBay === 'BAY_03_TR2' || focusedBay === 'BAY_07_HVDC' ? 1 : 0.85, transition: 'opacity 0.3s' }}
                onClick={() => {
                  setSelectedItem({
                    id: 'BUS-B',
                    name: '132kV Reserve Busbar B',
                    ansiCode: '132kV BUS-B',
                    type: 'busbar',
                    trId: 'TR-1',
                    bay: '132kV Reserve Busbar Bay',
                    voltageRating: `${isBusBLive ? (tr1State?.gridVoltage ?? 132.0).toFixed(1) : '0.0'} kV`,
                    currentRating: '3,150 A'
                  });
                }}
              >
                {/* Conductor Outer Protective Channel */}
                <line
                  x1="90"
                  y1="120"
                  x2="1140"
                  y2="120"
                  stroke="#090d16"
                  strokeWidth="12"
                  strokeLinecap="round"
                />

                {/* Reserve Conductor Bar */}
                <line
                  x1="90"
                  y1="120"
                  x2="1140"
                  y2="120"
                  stroke={isBusBLive ? '#0284c7' : '#94a3b8'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  filter={selectedItem.id === 'BUS-B' ? 'url(#selectionGlow)' : isBusBLive ? 'url(#glow)' : undefined}
                />

                {/* Conductor Core Reflection */}
                <line
                  x1="90"
                  y1="120"
                  x2="1140"
                  y2="120"
                  stroke={isBusBLive ? '#7dd3fc' : '#f1f5f9'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeOpacity="0.8"
                />

                {/* Left & Right Terminal Blocks */}
                <rect x="80" y="114" width="12" height="12" rx="3" fill="#0f172a" stroke={isBusBLive ? '#0284c7' : '#94a3b8'} strokeWidth="1.5" />
                <rect x="1138" y="114" width="12" height="12" rx="3" fill="#0f172a" stroke={isBusBLive ? '#0284c7' : '#94a3b8'} strokeWidth="1.5" />

                {/* Prominent High-Visibility Bus B Header Identification Badge */}
                <g transform="translate(90, 128)">
                  <rect
                    x="0"
                    y="0"
                    width="310"
                    height="24"
                    rx="6"
                    fill={isBusBLive ? '#082f49' : '#18181b'}
                    stroke={isBusBLive ? '#0284c7' : '#71717a'}
                    strokeWidth="1.5"
                    className="transition-all group-hover:stroke-cyan-400"
                  />
                  <circle cx="14" cy="12" r="4.5" fill={isBusBLive ? '#0284c7' : '#71717a'} className={isBusBLive ? 'animate-pulse' : ''} />
                  <text x="26" y="16" fill="#ffffff" fontSize="10" fontWeight="extrabold" letterSpacing="0.5">
                    132kV RESERVE BUSBAR B
                  </text>
                  <rect x="185" y="4" width="65" height="16" rx="4" fill={isBusBLive ? '#0369a1' : '#27272a'} />
                  <text x="217" y="15.5" fill={isBusBLive ? '#bae6fd' : '#cbd5e1'} fontSize="8.5" fontWeight="bold" textAnchor="middle">
                    {isBusBLive ? `${(tr1State?.gridVoltage ?? 132.0).toFixed(1)} kV` : '0.0 kV'}
                  </text>
                  <rect x="255" y="4" width="48" height="16" rx="4" fill={isBusBLive ? '#075985' : '#27272a'} />
                  <text x="279" y="15.5" fill={isBusBLive ? '#7dd3fc' : '#a1a1aa'} fontSize="8" fontWeight="bold" textAnchor="middle">
                    {isBusBLive ? 'STANDBY' : 'OPEN'}
                  </text>
                </g>
              </g>

              {/* Bus Coupler 52-0 Bay (Bay 02) */}
              <g
                style={{ opacity: focusedBay === 'ALL' || focusedBay === 'BAY_02_COUPLER' ? 1 : 0.85, transition: 'opacity 0.3s' }}
              >
                <g
                  className="cursor-pointer"
                  onMouseEnter={(e) =>
                    handleInterlockHover(
                      e,
                      '52-0',
                      '132kV Bus Coupler Breaker',
                      sw1.busCoupler52_0,
                      true,
                      'IL-25: ANSI 25 Synchrocheck Permissive',
                      'Closing allowed only when Bus A and Bus B voltages, phase angles (Δθ < 5°), and frequencies match.'
                    )
                  }
                  onMouseLeave={() => setHoverInterlock(null)}
                  onClick={() => {
                    setSelectedItem({
                      id: '52-0',
                      name: '132kV Bus Coupler Breaker',
                      ansiCode: 'ANSI 52',
                      type: 'breaker',
                      trId: 'TR-1',
                      switchKey: 'busCoupler52_0',
                      bay: '132kV Bus Coupling Bay',
                      voltageRating: '132.0 kV',
                      currentRating: '2,500 A'
                    });
                  }}
                >
                  <line x1="500" y1="80" x2="500" y2="120" stroke={sw1.busCoupler52_0 ? '#10b981' : '#52525b'} strokeWidth="3" />
                  <rect
                    x="486"
                    y="90"
                    width="28"
                    height="20"
                    fill="#090d16"
                    stroke={sw1.busCoupler52_0 ? '#10b981' : '#f43f5e'}
                    strokeWidth="2"
                    rx="4"
                    filter={selectedItem.id === '52-0' ? 'url(#selectionGlow)' : undefined}
                  />
                  <text x="500" y="104" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold">
                    {sw1.busCoupler52_0 ? '✕' : '▢'}
                  </text>
                  <text x="522" y="103" fill="#38bdf8" fontSize="10" fontWeight="bold">52-0 Coupler</text>
                </g>

                {/* ANSI 25 Synchrocheck Trigger Badge */}
                <g
                  className="cursor-pointer"
                  onClick={() =>
                    setSynchroModalData({
                      bayName: '132kV Bus Coupler 52-0 (Bus A <-> Bus B)',
                      vA: tr1State?.gridVoltage ?? 132.0,
                      vB: isBusBLive ? (tr1State?.gridVoltage ?? 132.0) : 0,
                    })
                  }
                >
                  <rect x="520" y="110" width="130" height="18" fill="#042f2e" stroke="#14b8a6" strokeWidth="1.2" rx="4" />
                  <text x="526" y="122" fill="#2dd4bf" fontSize="8" fontWeight="bold">
                    ⚡ 25 SYNCHRO (Δθ: 1.4°)
                  </text>
                </g>
              </g>

              {/* HV Bus PT-1 (Clickable Transducer) */}
              <g
                className="cursor-pointer"
                transform="translate(420, 36)"
                onClick={() =>
                  setTxModalData({
                    type: 'PT',
                    tag: 'HV PT-1',
                    name: '132kV Main Busbar Voltage Transformer',
                    bay: '132kV Main Bus A',
                    pri: '132 kV / √3',
                    sec: '110 V / √3',
                    acc: '0.2 / 3P',
                    burden: 50,
                  })
                }
              >
                <line x1="0" y1="44" x2="0" y2="20" stroke={isBusALive ? '#10b981' : '#52525b'} strokeWidth="2" />
                <circle cx="0" cy="12" r="8" fill="none" stroke={isBusALive ? '#f59e0b' : '#52525b'} strokeWidth="2" />
                <circle cx="0" cy="4" r="8" fill="none" stroke={isBusALive ? '#f59e0b' : '#52525b'} strokeWidth="2" />
                <text x="12" y="12" fill={isBusALive ? '#f59e0b' : '#71717a'} fontSize="9" fontWeight="bold">HV PT-1 (132/0.11kV)</text>
              </g>

              {/* ==================== BAY 01: TRANSFORMER TR-1 ==================== */}
              <g style={{ opacity: focusedBay === 'ALL' || focusedBay === 'BAY_01_TR1' ? 1 : 0.2, transition: 'opacity 0.3s' }}>
                {/* Bus A Selector 89-1A */}
                <g
                  className="cursor-pointer"
                  onMouseEnter={(e) =>
                    handleInterlockHover(
                      e,
                      '89-1A',
                      'TR-1 Busbar A Disconnector',
                      sw1.hvDisconnect89_1A,
                      !sw1.hvBreaker52_1,
                      'IL-101: Disconnector Off-Load Operation Only',
                      'Disconnector operation is interlocked when HV Breaker 52-1 is closed (interrupting load prohibited).',
                      sw1.hvBreaker52_1 ? ['HV Breaker 52-1 is CLOSED'] : []
                    )
                  }
                  onMouseLeave={() => setHoverInterlock(null)}
                  onClick={() => {
                    setSelectedItem({
                      id: '89-1A',
                      name: 'TR-1 Busbar A Disconnector',
                      ansiCode: 'ANSI 89',
                      type: 'disconnector',
                      trId: 'TR-1',
                      switchKey: 'hvDisconnect89_1A',
                      bay: 'TR-1 Transformer Bay 01',
                      voltageRating: '132.0 kV',
                      currentRating: '2,000 A'
                    });
                  }}
                >
                  <line x1="300" y1="80" x2="300" y2="150" stroke={getLineColor(sw1.hvDisconnect89_1A, false)} strokeWidth="3" />
                  <rect
                    x="288"
                    y="130"
                    width="24"
                    height="16"
                    fill="#090d16"
                    stroke={sw1.hvDisconnect89_1A ? '#10b981' : '#52525b'}
                    strokeWidth="2"
                    rx="3"
                    filter={selectedItem.id === '89-1A' ? 'url(#selectionGlow)' : undefined}
                  />
                  <text x="300" y="142" fill="#ffffff" fontSize="8" textAnchor="middle">89-1A</text>
                </g>

                {/* Bus B Selector 89-1B */}
                <g
                  className="cursor-pointer"
                  onMouseEnter={(e) =>
                    handleInterlockHover(
                      e,
                      '89-1B',
                      'TR-1 Busbar B Disconnector',
                      sw1.hvDisconnect89_1B,
                      !sw1.hvBreaker52_1,
                      'IL-101: Disconnector Off-Load Operation Only',
                      'Disconnector operation is interlocked when HV Breaker 52-1 is closed.',
                      sw1.hvBreaker52_1 ? ['HV Breaker 52-1 is CLOSED'] : []
                    )
                  }
                  onMouseLeave={() => setHoverInterlock(null)}
                  onClick={() => {
                    setSelectedItem({
                      id: '89-1B',
                      name: 'TR-1 Busbar B Disconnector',
                      ansiCode: 'ANSI 89',
                      type: 'disconnector',
                      trId: 'TR-1',
                      switchKey: 'hvDisconnect89_1B',
                      bay: 'TR-1 Transformer Bay 01',
                      voltageRating: '132.0 kV',
                      currentRating: '2,000 A'
                    });
                  }}
                >
                  <line x1="340" y1="120" x2="340" y2="150" stroke={getLineColor(sw1.hvDisconnect89_1B, false)} strokeWidth="3" />
                  <line x1="300" y1="150" x2="340" y2="150" stroke={getLineColor(isTR1_HV_Live, false)} strokeWidth="3" />
                  <rect
                    x="328"
                    y="130"
                    width="24"
                    height="16"
                    fill="#090d16"
                    stroke={sw1.hvDisconnect89_1B ? '#10b981' : '#52525b'}
                    strokeWidth="2"
                    rx="3"
                    filter={selectedItem.id === '89-1B' ? 'url(#selectionGlow)' : undefined}
                  />
                  <text x="340" y="142" fill="#ffffff" fontSize="8" textAnchor="middle">89-1B</text>
                </g>

                {/* TR-1 HV Breaker 52-1 with PoW and Interlock HUD */}
                <g
                  className="cursor-pointer"
                  onMouseEnter={(e) =>
                    handleInterlockHover(
                      e,
                      '52-1',
                      'TR-1 Primary HV Circuit Breaker',
                      sw1.hvBreaker52_1,
                      !sw1.earthSwitch84_1,
                      'IL-104: Earth Switch Interlock',
                      'HV Circuit Breaker cannot be closed while Maintenance Earth Switch 84-1 is closed.',
                      sw1.earthSwitch84_1 ? ['Earth Switch 84-1 is CLOSED'] : []
                    )
                  }
                  onMouseLeave={() => setHoverInterlock(null)}
                  onClick={() => {
                    setSelectedItem({
                      id: '52-1',
                      name: 'TR-1 Primary HV Circuit Breaker',
                      ansiCode: 'ANSI 52',
                      type: 'breaker',
                      trId: 'TR-1',
                      switchKey: 'hvBreaker52_1',
                      bay: 'TR-1 Transformer Bay 01',
                      voltageRating: '132.0 kV',
                      currentRating: '2,000 A'
                    });
                  }}
                >
                  <line x1="320" y1="150" x2="320" y2="230" stroke={getLineColor(isTR1_PrimLive, false)} strokeWidth="3" />
                  <rect
                    x="306"
                    y="175"
                    width="28"
                    height="22"
                    fill="#090d16"
                    stroke={sw1.hvBreaker52_1 ? '#10b981' : '#f43f5e'}
                    strokeWidth="2"
                    rx="4"
                    filter={selectedItem.id === '52-1' ? 'url(#selectionGlow)' : undefined}
                  />
                  <text x="320" y="190" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold">
                    {sw1.hvBreaker52_1 ? '✕' : '▢'}
                  </text>
                  <text x="342" y="188" fill="#a855f7" fontSize="10" fontWeight="bold">52-1 HV Breaker</text>
                </g>

                {/* Point-on-Wave (PoW) Controller Badge */}
                <g
                  className="cursor-pointer"
                  onClick={() =>
                    setPowModalData({
                      id: '52-1',
                      name: 'TR-1 Primary HV Circuit Breaker',
                      bay: 'TR-1 Transformer Bay 01',
                      loadType: 'Transformer (50MVA Core)',
                    })
                  }
                >
                  <rect x="235" y="177" width="65" height="17" fill="#3b0764" stroke="#a855f7" strokeWidth="1" rx="4" />
                  <text x="239" y="189" fill="#e9d5ff" fontSize="7.5" fontWeight="bold">
                    ⚡ PoW 90° CLS
                  </text>
                </g>

                {/* HV CT-1 (Clickable Transducer) */}
                <g
                  className="cursor-pointer"
                  transform="translate(320, 215)"
                  onClick={() =>
                    setTxModalData({
                      type: 'CT',
                      tag: 'HV CT-1',
                      name: 'TR-1 Primary Current Transformer',
                      bay: 'TR-1 Bay 01',
                      pri: '600 A',
                      sec: '5 A',
                      acc: '0.2S / 10P20',
                      burden: 30,
                    })
                  }
                >
                  <circle cx="0" cy="0" r="7" fill="none" stroke="#06b6d4" strokeWidth="2" />
                  <text x="12" y="4" fill="#06b6d4" fontSize="9" fontWeight="bold">CT-1 (600/5A)</text>
                </g>

              {/* Transformer TR-1 Winding Symbols & Concentric Insulation Aging Ring */}
              <g
                transform="translate(320, 270)"
                className="cursor-pointer"
                onClick={() => {
                  setSelectedItem({
                    id: 'TR-1',
                    name: 'TR-1 Main Power Transformer (40MVA)',
                    ansiCode: 'ANSI 87T',
                    type: 'transformer',
                    trId: 'TR-1',
                    bay: 'TR-1 Transformer Bay 01',
                    voltageRating: '132kV / 13.8kV',
                    currentRating: '175 A Prim / 1,673 A Sec'
                  });
                }}
              >
                <line x1="0" y1="-25" x2="0" y2="-15" stroke={getLineColor(isTR1_PrimLive, false)} strokeWidth="3" />
                
                {/* Concentric Insulation Aging Ring around TR-1 */}
                {layers.assetDiagnostics && (
                  <circle
                    cx="0"
                    cy="8"
                    r="30"
                    fill="none"
                    stroke={tr1Aging.faa > 1.0 ? '#f43f5e' : '#06b6d4'}
                    strokeWidth="2.5"
                    strokeDasharray="4,2"
                    className={tr1Aging.faa > 1.0 ? 'animate-spin' : ''}
                  />
                )}

                <circle cx="0" cy="-2" r="16" fill="none" stroke="#f59e0b" strokeWidth="3" />
                <circle cx="0" cy="18" r="16" fill="none" stroke="#06b6d4" strokeWidth="3" />
                <line x1="0" y1="34" x2="0" y2="45" stroke={getLineColor(isTR1_SecLive, false)} strokeWidth="3" />

                <text x="38" y="-8" fill="#f59e0b" fontSize="11" fontWeight="bold">TR-1 (40 MVA)</text>
                <text x="38" y="6" fill="#38bdf8" fontSize="10">132kV / 13.8kV Y-d11</text>
                <text x="38" y="20" fill="#10b981" fontSize="10">Load: {tr1State.loadCurrent.toFixed(0)} A</text>
              </g>

              {/* TR-1 MV Breaker 52-2 & Disconnector 89-2 */}
              <g
                className="cursor-pointer"
                onClick={() => {
                  setSelectedItem({
                    id: '52-2',
                    name: 'TR-1 MV Incomer Circuit Breaker',
                    ansiCode: 'ANSI 52',
                    type: 'breaker',
                    trId: 'TR-1',
                    switchKey: 'mvBreaker52_2',
                    bay: 'TR-1 Transformer Bay 01',
                    voltageRating: '13.8 kV',
                    currentRating: '3,000 A'
                  });
                }}
              >
                <line x1="320" y1="315" x2="320" y2="400" stroke={getLineColor(isTR1_SecLive, false)} strokeWidth="3" />
                <rect
                  x="306"
                  y="335"
                  width="28"
                  height="22"
                  fill="#090d16"
                  stroke={sw1.mvBreaker52_2 ? '#10b981' : '#f43f5e'}
                  strokeWidth="2"
                  rx="4"
                  filter={selectedItem.id === '52-2' ? 'url(#selectionGlow)' : undefined}
                />
                <text x="320" y="350" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold">
                  {sw1.mvBreaker52_2 ? '✕' : '▢'}
                </text>
                <text x="342" y="348" fill="#38bdf8" fontSize="10" fontWeight="bold">52-2 MV Breaker</text>
              </g>

              <g
                className="cursor-pointer"
                onClick={() => {
                  setSelectedItem({
                    id: '89-2',
                    name: 'TR-1 MV Incomer Disconnector',
                    ansiCode: 'ANSI 89',
                    type: 'disconnector',
                    trId: 'TR-1',
                    switchKey: 'mvDisconnect89_2',
                    bay: 'TR-1 Transformer Bay 01',
                    voltageRating: '13.8 kV',
                    currentRating: '3,000 A'
                  });
                }}
              >
                <rect
                  x="308"
                  y="375"
                  width="24"
                  height="16"
                  fill="#090d16"
                  stroke={sw1.mvDisconnect89_2 ? '#10b981' : '#52525b'}
                  strokeWidth="2"
                  rx="3"
                  filter={selectedItem.id === '89-2' ? 'url(#selectionGlow)' : undefined}
                />
                <text x="320" y="387" fill="#ffffff" fontSize="8" textAnchor="middle">89-2</text>
              </g>
            </g>

              {/* ==================== BAY 03: TRANSFORMER TR-2 ==================== */}
              <g style={{ opacity: focusedBay === 'ALL' || focusedBay === 'BAY_03_TR2' ? 1 : 0.2, transition: 'opacity 0.3s' }}>
                {/* Bus A Selector 89-2A */}
                <g
                  className="cursor-pointer"
                  onMouseEnter={(e) =>
                    handleInterlockHover(
                      e,
                      '89-2A',
                      'TR-2 Busbar A Disconnector',
                      sw2.hvDisconnect89_2A,
                      !sw2.hvBreaker52_4,
                      'IL-101: Disconnector Off-Load Operation Only',
                      'Disconnector operation is interlocked when HV Breaker 52-4 is closed.',
                      sw2.hvBreaker52_4 ? ['HV Breaker 52-4 is CLOSED'] : []
                    )
                  }
                  onMouseLeave={() => setHoverInterlock(null)}
                  onClick={() => {
                    setSelectedItem({
                      id: '89-2A',
                      name: 'TR-2 Busbar A Disconnector',
                      ansiCode: 'ANSI 89',
                      type: 'disconnector',
                      trId: 'TR-2',
                      switchKey: 'hvDisconnect89_2A',
                      bay: 'TR-2 Transformer Bay 03',
                      voltageRating: '132.0 kV',
                      currentRating: '2,000 A'
                    });
                  }}
                >
                  <line x1="660" y1="80" x2="660" y2="150" stroke={getLineColor(sw2.hvDisconnect89_2A, false)} strokeWidth="3" />
                  <rect
                    x="648"
                    y="130"
                    width="24"
                    height="16"
                    fill="#090d16"
                    stroke={sw2.hvDisconnect89_2A ? '#10b981' : '#52525b'}
                    strokeWidth="2"
                    rx="3"
                    filter={selectedItem.id === '89-2A' ? 'url(#selectionGlow)' : undefined}
                  />
                  <text x="660" y="142" fill="#ffffff" fontSize="8" textAnchor="middle">89-2A</text>
                </g>

                {/* Bus B Selector 89-2B */}
                <g
                  className="cursor-pointer"
                  onMouseEnter={(e) =>
                    handleInterlockHover(
                      e,
                      '89-2B',
                      'TR-2 Busbar B Disconnector',
                      sw2.hvDisconnect89_2B,
                      !sw2.hvBreaker52_4,
                      'IL-101: Disconnector Off-Load Operation Only',
                      'Disconnector operation is interlocked when HV Breaker 52-4 is closed.',
                      sw2.hvBreaker52_4 ? ['HV Breaker 52-4 is CLOSED'] : []
                    )
                  }
                  onMouseLeave={() => setHoverInterlock(null)}
                  onClick={() => {
                    setSelectedItem({
                      id: '89-2B',
                      name: 'TR-2 Busbar B Disconnector',
                      ansiCode: 'ANSI 89',
                      type: 'disconnector',
                      trId: 'TR-2',
                      switchKey: 'hvDisconnect89_2B',
                      bay: 'TR-2 Transformer Bay 03',
                      voltageRating: '132.0 kV',
                      currentRating: '2,000 A'
                    });
                  }}
                >
                  <line x1="700" y1="120" x2="700" y2="150" stroke={getLineColor(sw2.hvDisconnect89_2B, false)} strokeWidth="3" />
                  <line x1="660" y1="150" x2="700" y2="150" stroke={getLineColor(isTR2_HV_Live, false)} strokeWidth="3" />
                  <rect
                    x="688"
                    y="130"
                    width="24"
                    height="16"
                    fill="#090d16"
                    stroke={sw2.hvDisconnect89_2B ? '#10b981' : '#52525b'}
                    strokeWidth="2"
                    rx="3"
                    filter={selectedItem.id === '89-2B' ? 'url(#selectionGlow)' : undefined}
                  />
                  <text x="700" y="142" fill="#ffffff" fontSize="8" textAnchor="middle">89-2B</text>
                </g>

                {/* TR-2 HV Breaker 52-4 with PoW and Interlock HUD */}
                <g
                  className="cursor-pointer"
                  onMouseEnter={(e) =>
                    handleInterlockHover(
                      e,
                      '52-4',
                      'TR-2 Primary HV Circuit Breaker',
                      sw2.hvBreaker52_4,
                      true,
                      'IL-25: Synchrocheck & Trip Coil Healthy',
                      'Closing permissive verified against 132kV Bus A/B sync conditions.'
                    )
                  }
                  onMouseLeave={() => setHoverInterlock(null)}
                  onClick={() => {
                    setSelectedItem({
                      id: '52-4',
                      name: 'TR-2 Primary HV Circuit Breaker',
                      ansiCode: 'ANSI 52',
                      type: 'breaker',
                      trId: 'TR-2',
                      switchKey: 'hvBreaker52_4',
                      bay: 'TR-2 Transformer Bay 03',
                      voltageRating: '132.0 kV',
                      currentRating: '2,000 A'
                    });
                  }}
                >
                  <line x1="680" y1="150" x2="680" y2="230" stroke={getLineColor(isTR2_PrimLive, false)} strokeWidth="3" />
                  <rect
                    x="666"
                    y="175"
                    width="28"
                    height="22"
                    fill="#090d16"
                    stroke={sw2.hvBreaker52_4 ? '#10b981' : '#f43f5e'}
                    strokeWidth="2"
                    rx="4"
                    filter={selectedItem.id === '52-4' ? 'url(#selectionGlow)' : undefined}
                  />
                  <text x="680" y="190" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold">
                    {sw2.hvBreaker52_4 ? '✕' : '▢'}
                  </text>
                  <text x="702" y="188" fill="#a855f7" fontSize="10" fontWeight="bold">52-4 HV Breaker</text>
                </g>

                {/* Point-on-Wave (PoW) Controller Badge on 52-4 */}
                <g
                  className="cursor-pointer"
                  onClick={() =>
                    setPowModalData({
                      id: '52-4',
                      name: 'TR-2 Primary HV Circuit Breaker',
                      bay: 'TR-2 Transformer Bay 03',
                      loadType: 'Transformer (50MVA Core)',
                    })
                  }
                >
                  <rect x="715" y="177" width="65" height="17" fill="#3b0764" stroke="#a855f7" strokeWidth="1" rx="4" />
                  <text x="719" y="189" fill="#e9d5ff" fontSize="7.5" fontWeight="bold">
                    ⚡ PoW 90° CLS
                  </text>
                </g>

                {/* HV CT-2 (Clickable Transducer) */}
                <g
                  className="cursor-pointer"
                  transform="translate(680, 215)"
                  onClick={() =>
                    setTxModalData({
                      type: 'CT',
                      tag: 'HV CT-2',
                      name: 'TR-2 Primary Current Transformer',
                      bay: 'TR-2 Bay 03',
                      pri: '600 A',
                      sec: '5 A',
                      acc: '0.2S / 10P20',
                      burden: 30,
                    })
                  }
                >
                  <circle cx="0" cy="0" r="7" fill="none" stroke="#06b6d4" strokeWidth="2" />
                  <text x="12" y="4" fill="#06b6d4" fontSize="9" fontWeight="bold">CT-2 (600/5A)</text>
                </g>

                {/* Transformer TR-2 Winding Symbols */}
                <g
                  transform="translate(680, 270)"
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedItem({
                      id: 'TR-2',
                      name: 'TR-2 Main Power Transformer (40MVA)',
                      ansiCode: 'ANSI 87T',
                      type: 'transformer',
                      trId: 'TR-2',
                      bay: 'TR-2 Transformer Bay 03',
                      voltageRating: '132kV / 13.8kV',
                      currentRating: '175 A Prim / 1,673 A Sec'
                    });
                  }}
                >
                  <line x1="0" y1="-25" x2="0" y2="-15" stroke={getLineColor(isTR2_PrimLive, false)} strokeWidth="3" />

                  {layers.assetDiagnostics && (
                    <circle
                      cx="0"
                      cy="8"
                      r="30"
                      fill="none"
                      stroke={tr2Aging.faa > 1.0 ? '#f43f5e' : '#06b6d4'}
                      strokeWidth="2.5"
                      strokeDasharray="4,2"
                      className={tr2Aging.faa > 1.0 ? 'animate-spin' : ''}
                    />
                  )}

                  <circle cx="0" cy="-2" r="16" fill="none" stroke="#f59e0b" strokeWidth="3" />
                  <circle cx="0" cy="18" r="16" fill="none" stroke="#06b6d4" strokeWidth="3" />
                  <line x1="0" y1="34" x2="0" y2="45" stroke={getLineColor(isTR2_SecLive, false)} strokeWidth="3" />

                  <text x="38" y="-8" fill="#f59e0b" fontSize="11" fontWeight="bold">TR-2 (40 MVA)</text>
                  <text x="38" y="6" fill="#38bdf8" fontSize="10">132kV / 13.8kV Y-d11</text>
                  <text x="38" y="20" fill="#10b981" fontSize="10">Load: {tr2State.loadCurrent.toFixed(0)} A</text>
                </g>

                {/* TR-2 MV Breaker 52-5 & Disconnector 89-5 */}
                <g
                  className="cursor-pointer"
                  onMouseEnter={(e) =>
                    handleInterlockHover(
                      e,
                      '52-5',
                      'TR-2 MV Incomer Circuit Breaker',
                      sw2.mvBreaker52_5,
                      !isBus2Grounded,
                      'IL-104: Bus Ground Interlock',
                      'MV Incomer cannot close onto a grounded busbar section.',
                      isBus2Grounded ? ['MV Bus Section-2 is Grounded by 84-2'] : []
                    )
                  }
                  onMouseLeave={() => setHoverInterlock(null)}
                  onClick={() => {
                    setSelectedItem({
                      id: '52-5',
                      name: 'TR-2 MV Incomer Circuit Breaker',
                      ansiCode: 'ANSI 52',
                      type: 'breaker',
                      trId: 'TR-2',
                      switchKey: 'mvBreaker52_5',
                      bay: 'TR-2 Transformer Bay 03',
                      voltageRating: '13.8 kV',
                      currentRating: '3,000 A'
                    });
                  }}
                >
                  <line x1="680" y1="315" x2="680" y2="400" stroke={getLineColor(isTR2_SecLive, false)} strokeWidth="3" />
                  <rect
                    x="666"
                    y="335"
                    width="28"
                    height="22"
                    fill="#090d16"
                    stroke={sw2.mvBreaker52_5 ? '#10b981' : '#f43f5e'}
                    strokeWidth="2"
                    rx="4"
                    filter={selectedItem.id === '52-5' ? 'url(#selectionGlow)' : undefined}
                  />
                  <text x="680" y="350" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold">
                    {sw2.mvBreaker52_5 ? '✕' : '▢'}
                  </text>
                  <text x="702" y="348" fill="#38bdf8" fontSize="10" fontWeight="bold">52-5 MV Breaker</text>
                </g>

                <g
                  className="cursor-pointer"
                  onMouseEnter={(e) =>
                    handleInterlockHover(
                      e,
                      '89-5',
                      'TR-2 MV Incomer Disconnector',
                      sw2.mvDisconnect89_5,
                      !sw2.mvBreaker52_5,
                      'IL-101: Disconnector Off-Load Operation Only',
                      'Disconnector 89-5 cannot operate while MV Breaker 52-5 is closed.',
                      sw2.mvBreaker52_5 ? ['MV Breaker 52-5 is CLOSED'] : []
                    )
                  }
                  onMouseLeave={() => setHoverInterlock(null)}
                  onClick={() => {
                    setSelectedItem({
                      id: '89-5',
                      name: 'TR-2 MV Incomer Disconnector',
                      ansiCode: 'ANSI 89',
                      type: 'disconnector',
                      trId: 'TR-2',
                      switchKey: 'mvDisconnect89_5',
                      bay: 'TR-2 Transformer Bay 03',
                      voltageRating: '13.8 kV',
                      currentRating: '3,000 A'
                    });
                  }}
                >
                  <rect
                    x="668"
                    y="375"
                    width="24"
                    height="16"
                    fill="#090d16"
                    stroke={sw2.mvDisconnect89_5 ? '#10b981' : '#52525b'}
                    strokeWidth="2"
                    rx="3"
                    filter={selectedItem.id === '89-5' ? 'url(#selectionGlow)' : undefined}
                  />
                  <text x="680" y="387" fill="#ffffff" fontSize="8" textAnchor="middle">89-5</text>
                </g>
              </g>

              {/* ==================== BAY 07: VSC-HVDC ±320kV TRANSMISSION BAY (IEC 62501 / CIGRE B4) ==================== */}
              <g id="bay-07-hvdc-vsc" style={{ opacity: focusedBay === 'ALL' || focusedBay === 'BAY_07_HVDC' ? 1 : 0.15, transition: 'opacity 0.3s' }}>
                {/* Bay Identification Title Header */}
                <g transform="translate(945, 48)">
                  <rect x="0" y="0" width="195" height="24" rx="6" fill="#030712" stroke="#3b82f6" strokeWidth="1.2" />
                  <circle cx="12" cy="12" r="4" fill={isHVDC_AC_Live ? '#3b82f6' : '#64748b'} className={isHVDC_AC_Live ? 'animate-pulse' : ''} />
                  <text x="22" y="15.5" fill="#93c5fd" fontSize="9" fontWeight="extrabold">BAY 07: ±320kV HVDC</text>
                  <rect x="135" y="4" width="55" height="16" rx="3" fill="#1e3a8a" />
                  <text x="162" y="15.5" fill="#bfdbfe" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                    {hvdcState.activePowerMW >= 0 ? `+${hvdcState.activePowerMW.toFixed(0)} MW` : `${hvdcState.activePowerMW.toFixed(0)} MW`}
                  </text>
                </g>

                {/* Bus A Disconnector 89-HVDC-A */}
                <g
                  className="cursor-pointer"
                  onMouseEnter={(e) =>
                    handleInterlockHover(
                      e,
                      '89-HVDC-A',
                      'HVDC Infeed Bus A Disconnector',
                      sw1.hvDisconnect89_HVDC_A,
                      !sw1.hvBreaker52_HVDC,
                      'IL-101: Disconnector Off-Load Operation Only',
                      'Disconnector 89-HVDC-A cannot operate while AC Infeed Breaker 52-HVDC is closed.',
                      sw1.hvBreaker52_HVDC ? ['AC Infeed Breaker 52-HVDC is CLOSED'] : []
                    )
                  }
                  onMouseLeave={() => setHoverInterlock(null)}
                  onClick={() => {
                    setSelectedItem({
                      id: '89-HVDC-A',
                      name: 'HVDC Infeed Bus A Disconnector',
                      ansiCode: 'ANSI 89',
                      type: 'disconnector',
                      trId: 'HVDC',
                      switchKey: 'hvDisconnect89_HVDC_A',
                      bay: 'VSC-HVDC Bay 07',
                      voltageRating: '132.0 kV AC',
                      currentRating: '2,500 A'
                    });
                  }}
                >
                  <line x1="990" y1="80" x2="990" y2="150" stroke={getLineColor(sw1.hvDisconnect89_HVDC_A && isBusALive, false)} strokeWidth="3" />
                  <rect
                    x="978"
                    y="130"
                    width="24"
                    height="16"
                    fill="#090d16"
                    stroke={sw1.hvDisconnect89_HVDC_A ? '#10b981' : '#52525b'}
                    strokeWidth="2"
                    rx="3"
                    filter={selectedItem.id === '89-HVDC-A' ? 'url(#selectionGlow)' : undefined}
                  />
                  <text x="990" y="142" fill="#ffffff" fontSize="7.5" textAnchor="middle">89-A</text>
                </g>

                {/* Bus B Disconnector 89-HVDC-B */}
                <g
                  className="cursor-pointer"
                  onMouseEnter={(e) =>
                    handleInterlockHover(
                      e,
                      '89-HVDC-B',
                      'HVDC Infeed Bus B Disconnector',
                      sw1.hvDisconnect89_HVDC_B,
                      !sw1.hvBreaker52_HVDC,
                      'IL-101: Disconnector Off-Load Operation Only',
                      'Disconnector 89-HVDC-B cannot operate while AC Infeed Breaker 52-HVDC is closed.',
                      sw1.hvBreaker52_HVDC ? ['AC Infeed Breaker 52-HVDC is CLOSED'] : []
                    )
                  }
                  onMouseLeave={() => setHoverInterlock(null)}
                  onClick={() => {
                    setSelectedItem({
                      id: '89-HVDC-B',
                      name: 'HVDC Infeed Bus B Disconnector',
                      ansiCode: 'ANSI 89',
                      type: 'disconnector',
                      trId: 'HVDC',
                      switchKey: 'hvDisconnect89_HVDC_B',
                      bay: 'VSC-HVDC Bay 07',
                      voltageRating: '132.0 kV AC',
                      currentRating: '2,500 A'
                    });
                  }}
                >
                  <line x1="1050" y1="120" x2="1050" y2="150" stroke={getLineColor(sw1.hvDisconnect89_HVDC_B && isBusBLive, false)} strokeWidth="3" />
                  <line x1="990" y1="150" x2="1050" y2="150" stroke={getLineColor(isHVDC_HV_Live, false)} strokeWidth="3" />
                  <rect
                    x="1038"
                    y="130"
                    width="24"
                    height="16"
                    fill="#090d16"
                    stroke={sw1.hvDisconnect89_HVDC_B ? '#10b981' : '#52525b'}
                    strokeWidth="2"
                    rx="3"
                    filter={selectedItem.id === '89-HVDC-B' ? 'url(#selectionGlow)' : undefined}
                  />
                  <text x="1050" y="142" fill="#ffffff" fontSize="7.5" textAnchor="middle">89-B</text>
                </g>

                {/* Main 132kV AC PCC Circuit Breaker 52-HVDC */}
                <g
                  className="cursor-pointer"
                  onMouseEnter={(e) =>
                    handleInterlockHover(
                      e,
                      '52-HVDC',
                      '132kV AC PCC Infeed Circuit Breaker',
                      sw1.hvBreaker52_HVDC,
                      true,
                      'IL-25: VSC Grid Synchronization & Pre-Charge',
                      'Breaker permissive active. Controlled by Point-on-Wave (PoW) closing relay.'
                    )
                  }
                  onMouseLeave={() => setHoverInterlock(null)}
                  onClick={() => {
                    setSelectedItem({
                      id: '52-HVDC',
                      name: '132kV AC PCC Infeed Circuit Breaker',
                      ansiCode: 'ANSI 52',
                      type: 'breaker',
                      trId: 'HVDC',
                      switchKey: 'hvBreaker52_HVDC',
                      bay: 'VSC-HVDC Bay 07',
                      voltageRating: '132.0 kV AC',
                      currentRating: '2,500 A / 40kA'
                    });
                  }}
                >
                  <line x1="1020" y1="150" x2="1020" y2="235" stroke={getLineColor(isHVDC_AC_Live, false)} strokeWidth="3" />
                  <rect
                    x="1006"
                    y="170"
                    width="28"
                    height="22"
                    fill="#090d16"
                    stroke={sw1.hvBreaker52_HVDC ? '#10b981' : '#f43f5e'}
                    strokeWidth="2"
                    rx="4"
                    filter={selectedItem.id === '52-HVDC' ? 'url(#selectionGlow)' : undefined}
                  />
                  <text x="1020" y="185" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold">
                    {sw1.hvBreaker52_HVDC ? '✕' : '▢'}
                  </text>
                  <text x="1042" y="183" fill="#60a5fa" fontSize="9" fontWeight="bold">52-HVDC</text>
                </g>

                {/* Pre-Insertion Resistor (PIR) Soft-Charge Bypass */}
                <g
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedItem({
                      id: '52-PIR',
                      name: 'Pre-Insertion Resistor (PIR) Soft-Charge Breaker',
                      ansiCode: 'ANSI 52PIR',
                      type: 'breaker',
                      trId: 'HVDC',
                      switchKey: 'pirBreaker52_PIR',
                      bay: 'VSC-HVDC Bay 07',
                      voltageRating: '132.0 kV',
                      currentRating: '600 A Inrush Resistor'
                    });
                  }}
                >
                  <path d="M 1020 160 L 965 160 L 965 200 L 1020 200" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3,2" />
                  <rect x="952" y="174" width="26" height="14" fill="#1e293b" stroke={sw1.pirBreaker52_PIR ? '#10b981' : '#64748b'} strokeWidth="1.2" rx="3" />
                  <text x="965" y="184" fill="#94a3b8" fontSize="6.5" textAnchor="middle" fontWeight="bold">PIR</text>
                </g>

                {/* Point-on-Wave (PoW) Relay Badge */}
                <g
                  className="cursor-pointer"
                  transform="translate(1048, 202)"
                  onClick={() =>
                    setPowModalData({
                      id: '52-HVDC',
                      name: '132kV AC PCC Infeed Breaker (PoW Sync)',
                      bay: 'VSC-HVDC Bay 07',
                      loadType: 'Transmission Line (132kV)',
                    })
                  }
                >
                  <rect x="0" y="0" width="58" height="14" rx="3" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1" />
                  <text x="29" y="10" fill="#c7d2fe" fontSize="7" fontWeight="bold" textAnchor="middle">
                    PoW 0° Close
                  </text>
                </g>

                {/* Optical CT / PT Merging Unit Badge */}
                <g
                  className="cursor-pointer"
                  transform="translate(1020, 222)"
                  onClick={() =>
                    setTxModalData({
                      type: 'CT',
                      tag: 'HVDC-CT-07',
                      name: 'HVDC AC PCC Optical Rogowski CT',
                      bay: 'VSC-HVDC Bay 07',
                      pri: '2,500 A',
                      sec: 'Digital SV 4kHz',
                      acc: '0.1 Class Optical',
                      burden: 15,
                    })
                  }
                >
                  <circle cx="0" cy="0" r="6.5" fill="none" stroke="#38bdf8" strokeWidth="1.8" />
                  <text x="10" y="3.5" fill="#38bdf8" fontSize="7.5" fontWeight="bold">CT-7</text>
                </g>

                {/* ==================== VSC-MMC CONVERTER VALVE HALL ==================== */}
                <g
                  transform="translate(1020, 282)"
                  className="cursor-pointer group"
                  onClick={() => {
                    setSelectedItem({
                      id: 'VSC-MMC',
                      name: 'Modular Multilevel Converter (MMC ±320kV 200-SM)',
                      ansiCode: 'MMC-VSC',
                      type: 'transformer',
                      trId: 'HVDC',
                      bay: 'VSC-HVDC Bay 07',
                      voltageRating: '132kV AC / ±320kV DC',
                      currentRating: '1,500 A DC / 500 MW'
                    });
                  }}
                >
                  {/* Outer Shield Box */}
                  <rect
                    x="-68"
                    y="-40"
                    width="136"
                    height="80"
                    rx="10"
                    fill="#030712"
                    stroke={isHVDC_AC_Live ? '#3b82f6' : '#334155'}
                    strokeWidth="2"
                    filter={selectedItem.id === 'VSC-MMC' ? 'url(#selectionGlow)' : undefined}
                  />
                  <rect x="-64" y="-36" width="128" height="72" rx="8" fill="#0f172a" fillOpacity="0.85" />

                  {/* Converter 6-Arm Bridge Vector Graphic */}
                  <path
                    d="M -26 -14 L 0 -24 L 26 -14 L 0 4 Z M -26 18 L 0 8 L 26 18 L 0 32 Z"
                    fill="none"
                    stroke={isHVDC_AC_Live ? '#60a5fa' : '#475569'}
                    strokeWidth="1.5"
                  />
                  <line x1="0" y1="-40" x2="0" y2="-24" stroke={getLineColor(isHVDC_AC_Live, false)} strokeWidth="2.5" />

                  {/* Internal Status Labels */}
                  <text x="0" y="-14" fill="#93c5fd" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">
                    VSC-MMC VALVE HALL
                  </text>
                  <text x="0" y="-2" fill="#38bdf8" fontSize="7" textAnchor="middle">
                    N = 200 SM/arm • THD &lt; 0.8%
                  </text>
                  <text x="0" y="9" fill="#34d399" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                    P: {hvdcState.activePowerMW >= 0 ? `+${hvdcState.activePowerMW.toFixed(1)}` : hvdcState.activePowerMW.toFixed(1)} MW
                  </text>
                  <text x="0" y="20" fill="#a78bfa" fontSize="7" textAnchor="middle">
                    Q: {hvdcState.reactivePowerMVAR >= 0 ? `+${hvdcState.reactivePowerMVAR.toFixed(1)}` : hvdcState.reactivePowerMVAR.toFixed(1)} MVAR [{hvdcState.controlMode.slice(0, 8)}]
                  </text>

                  {/* Action Trigger Badges on the Converter */}
                  <g
                    transform="translate(-62, 46)"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHvdcPqModalOpen(true);
                    }}
                  >
                    <rect x="0" y="0" width="58" height="16" rx="4" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1" />
                    <text x="29" y="11" fill="#bfdbfe" fontSize="7" fontWeight="bold" textAnchor="middle">
                      📈 P-Q Locus
                    </text>
                  </g>
                  <g
                    transform="translate(4, 46)"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHvdcDiagModalOpen(true);
                    }}
                  >
                    <rect x="0" y="0" width="58" height="16" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                    <text x="29" y="11" fill="#a7f3d0" fontSize="7" fontWeight="bold" textAnchor="middle">
                      🩺 Diagnostics
                    </text>
                  </g>
                </g>

                {/* ==================== ±320kV DC BIPOLE LINES & DCCBs ==================== */}
                {/* Positive Pole Line (+320kV) */}
                <g transform="translate(985, 345)">
                  <line x1="0" y1="-5" x2="0" y2="180" stroke={isHVDC_DC_Pos_Live ? '#f59e0b' : '#52525b'} strokeWidth="3" />
                  {/* Positive DCCB 52-DC1 */}
                  <g
                    className="cursor-pointer"
                    onMouseEnter={(e) =>
                      handleInterlockHover(
                        e,
                        '52-DC1',
                        'High-Speed Hybrid DCCB Positive Pole (+320kV)',
                        sw1.dccbPositive52_DC1,
                        !sw1.dcEarth89_DCE1,
                        'IL-401: DC Fast Interrupter (< 5ms)',
                        'DCCB closing interlocked when Positive Pole Earth Switch 89-DCE1 is active.',
                        sw1.dcEarth89_DCE1 ? ['Positive Earth Switch 89-DCE1 is CLOSED'] : []
                      )
                    }
                    onMouseLeave={() => setHoverInterlock(null)}
                    onClick={() => {
                      setSelectedItem({
                        id: '52-DC1',
                        name: 'High-Speed Hybrid DCCB Positive Pole (+320kV)',
                        ansiCode: 'DCCB',
                        type: 'breaker',
                        trId: 'HVDC',
                        switchKey: 'dccbPositive52_DC1',
                        bay: 'VSC-HVDC Bay 07',
                        voltageRating: '+320.0 kV DC',
                        currentRating: '2,000 A DC (< 5ms trip)'
                      });
                    }}
                  >
                    <rect
                      x="-13"
                      y="10"
                      width="26"
                      height="20"
                      fill="#090d16"
                      stroke={sw1.dccbPositive52_DC1 ? '#10b981' : '#f43f5e'}
                      strokeWidth="2"
                      rx="4"
                      filter={selectedItem.id === '52-DC1' ? 'url(#selectionGlow)' : undefined}
                    />
                    <text x="0" y="24" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold">
                      {sw1.dccbPositive52_DC1 ? '✕' : '▢'}
                    </text>
                    <text x="-18" y="23" fill="#fbbf24" fontSize="7.5" textAnchor="end" fontWeight="bold">52-DC+</text>
                  </g>

                  {/* Positive DC Earth Switch 89-DCE1 */}
                  <g
                    className="cursor-pointer"
                    transform="translate(-25, 55)"
                    onMouseEnter={(e) =>
                      handleInterlockHover(
                        e,
                        '89-DCE1',
                        'Positive Pole Safety Earth Switch',
                        sw1.dcEarth89_DCE1,
                        !isHVDC_DC_Pos_Live,
                        'IL-105: Dead DC Pole Earthing Interlock',
                        'DC Earthing switch is strictly blocked while DC Positive Pole is live.',
                        isHVDC_DC_Pos_Live ? ['DC Positive Pole is ENERGIZED (+320kV)'] : []
                      )
                    }
                    onMouseLeave={() => setHoverInterlock(null)}
                    onClick={() => {
                      setSelectedItem({
                        id: '89-DCE1',
                        name: 'Positive Pole DC Earth Switch',
                        ansiCode: 'ANSI 89E',
                        type: 'earthSwitch',
                        trId: 'HVDC',
                        switchKey: 'dcEarth89_DCE1',
                        bay: 'VSC-HVDC Bay 07',
                        voltageRating: '+320 kV Ground',
                        currentRating: '50 kA Peak DC Ground'
                      });
                    }}
                  >
                    <line x1="25" y1="8" x2="0" y2="8" stroke={sw1.dcEarth89_DCE1 ? '#eab308' : '#52525b'} strokeWidth="1.8" />
                    <rect x="-12" y="0" width="24" height="15" fill="#090d16" stroke={sw1.dcEarth89_DCE1 ? '#eab308' : '#52525b'} strokeWidth="1.5" rx="3" />
                    <text x="0" y="11" fill="#ffffff" fontSize="7" textAnchor="middle">DCE1</text>
                    <line x1="0" y1="15" x2="0" y2="22" stroke="#eab308" strokeWidth="1.5" />
                    <line x1="-5" y1="22" x2="5" y2="22" stroke="#eab308" strokeWidth="2" />
                    <line x1="-3" y1="25" x2="3" y2="25" stroke="#eab308" strokeWidth="1.5" />
                  </g>

                  {/* +320kV Voltage Badge */}
                  <g transform="translate(-18, 100)">
                    <rect x="0" y="0" width="46" height="16" rx="3" fill="#451a03" stroke="#f59e0b" strokeWidth="1" />
                    <text x="23" y="11" fill="#fde047" fontSize="7" fontWeight="bold" textAnchor="middle">
                      +320.0 kV
                    </text>
                  </g>
                </g>

                {/* Negative Pole Line (-320kV) */}
                <g transform="translate(1055, 345)">
                  <line x1="0" y1="-5" x2="0" y2="180" stroke={isHVDC_DC_Neg_Live ? '#38bdf8' : '#52525b'} strokeWidth="3" />
                  {/* Negative DCCB 52-DC2 */}
                  <g
                    className="cursor-pointer"
                    onMouseEnter={(e) =>
                      handleInterlockHover(
                        e,
                        '52-DC2',
                        'High-Speed Hybrid DCCB Negative Pole (-320kV)',
                        sw1.dccbNegative52_DC2,
                        !sw1.dcEarth89_DCE2,
                        'IL-401: DC Fast Interrupter (< 5ms)',
                        'DCCB closing interlocked when Negative Pole Earth Switch 89-DCE2 is active.',
                        sw1.dcEarth89_DCE2 ? ['Negative Earth Switch 89-DCE2 is CLOSED'] : []
                      )
                    }
                    onMouseLeave={() => setHoverInterlock(null)}
                    onClick={() => {
                      setSelectedItem({
                        id: '52-DC2',
                        name: 'High-Speed Hybrid DCCB Negative Pole (-320kV)',
                        ansiCode: 'DCCB',
                        type: 'breaker',
                        trId: 'HVDC',
                        switchKey: 'dccbNegative52_DC2',
                        bay: 'VSC-HVDC Bay 07',
                        voltageRating: '-320.0 kV DC',
                        currentRating: '2,000 A DC (< 5ms trip)'
                      });
                    }}
                  >
                    <rect
                      x="-13"
                      y="10"
                      width="26"
                      height="20"
                      fill="#090d16"
                      stroke={sw1.dccbNegative52_DC2 ? '#10b981' : '#f43f5e'}
                      strokeWidth="2"
                      rx="4"
                      filter={selectedItem.id === '52-DC2' ? 'url(#selectionGlow)' : undefined}
                    />
                    <text x="0" y="24" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold">
                      {sw1.dccbNegative52_DC2 ? '✕' : '▢'}
                    </text>
                    <text x="18" y="23" fill="#38bdf8" fontSize="7.5" textAnchor="start" fontWeight="bold">52-DC-</text>
                  </g>

                  {/* Negative DC Earth Switch 89-DCE2 */}
                  <g
                    className="cursor-pointer"
                    transform="translate(25, 55)"
                    onMouseEnter={(e) =>
                      handleInterlockHover(
                        e,
                        '89-DCE2',
                        'Negative Pole Safety Earth Switch',
                        sw1.dcEarth89_DCE2,
                        !isHVDC_DC_Neg_Live,
                        'IL-105: Dead DC Pole Earthing Interlock',
                        'DC Earthing switch is strictly blocked while DC Negative Pole is live.',
                        isHVDC_DC_Neg_Live ? ['DC Negative Pole is ENERGIZED (-320kV)'] : []
                      )
                    }
                    onMouseLeave={() => setHoverInterlock(null)}
                    onClick={() => {
                      setSelectedItem({
                        id: '89-DCE2',
                        name: 'Negative Pole DC Earth Switch',
                        ansiCode: 'ANSI 89E',
                        type: 'earthSwitch',
                        trId: 'HVDC',
                        switchKey: 'dcEarth89_DCE2',
                        bay: 'VSC-HVDC Bay 07',
                        voltageRating: '-320 kV Ground',
                        currentRating: '50 kA Peak DC Ground'
                      });
                    }}
                  >
                    <line x1="-25" y1="8" x2="0" y2="8" stroke={sw1.dcEarth89_DCE2 ? '#eab308' : '#52525b'} strokeWidth="1.8" />
                    <rect x="-12" y="0" width="24" height="15" fill="#090d16" stroke={sw1.dcEarth89_DCE2 ? '#eab308' : '#52525b'} strokeWidth="1.5" rx="3" />
                    <text x="0" y="11" fill="#ffffff" fontSize="7" textAnchor="middle">DCE2</text>
                    <line x1="0" y1="15" x2="0" y2="22" stroke="#eab308" strokeWidth="1.5" />
                    <line x1="-5" y1="22" x2="5" y2="22" stroke="#eab308" strokeWidth="2" />
                    <line x1="-3" y1="25" x2="3" y2="25" stroke="#eab308" strokeWidth="1.5" />
                  </g>

                  {/* -320kV Voltage Badge */}
                  <g transform="translate(-18, 100)">
                    <rect x="0" y="0" width="46" height="16" rx="3" fill="#082f49" stroke="#0284c7" strokeWidth="1" />
                    <text x="23" y="11" fill="#7dd3fc" fontSize="7" fontWeight="bold" textAnchor="middle">
                      -320.0 kV
                    </text>
                  </g>
                </g>

                {/* 150 km Subsea / Underground DC Intertie Transmission Cablehead */}
                <g transform="translate(1020, 530)">
                  <rect x="-70" y="0" width="140" height="26" rx="6" fill="#020617" stroke="#3b82f6" strokeWidth="1.5" />
                  <text x="0" y="11" fill="#60a5fa" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                    150 km ±320kV DC CABLE
                  </text>
                  <text x="0" y="20" fill="#94a3b8" fontSize="6.5" textAnchor="middle">
                    Regional Intertie Node 1 (500 MW)
                  </text>
                </g>
              </g>

              {/* ==================== 13.8kV MEDIUM VOLTAGE BUSBARS & SECTIONALIZER ==================== */}
              {/* MV Section-1 Busbar */}
              <g
                className="cursor-pointer group"
                style={{ opacity: focusedBay === 'ALL' || focusedBay === 'BAY_04_MV1' || focusedBay === 'BAY_01_TR1' || focusedBay === 'BAY_02_COUPLER' ? 1 : 0.85, transition: 'opacity 0.3s' }}
                onClick={() => {
                  setSelectedItem({
                    id: 'MV-BUS-1',
                    name: '13.8kV MV Bus Section 1',
                    ansiCode: '13.8kV BUS-1',
                    type: 'busbar',
                    trId: 'TR-1',
                    bay: '13.8kV Switchgear Sec-1',
                    voltageRating: `${isMVBus1Live ? (tr1State?.secondarykV ?? 13.8).toFixed(1) : '0.0'} kV`,
                    currentRating: '2,500 A'
                  });
                }}
              >
                {/* Conductor Outer Channel */}
                <line x1="140" y1="420" x2="480" y2="420" stroke="#090d16" strokeWidth="10" strokeLinecap="round" />
                {/* Heavy Conductor Bar */}
                <line x1="140" y1="420" x2="480" y2="420" stroke={getLineColor(isMVBus1Live, isBus1Grounded)} strokeWidth="7" strokeLinecap="round" />
                {/* Core Reflection */}
                <line x1="140" y1="420" x2="480" y2="420" stroke={isMVBus1Live ? '#a7f3d0' : '#f1f5f9'} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.7" />

                {/* Left Terminal Block */}
                <rect x="130" y="415" width="10" height="10" rx="2" fill="#0f172a" stroke={getLineColor(isMVBus1Live, isBus1Grounded)} strokeWidth="1.2" />

                {/* Identification Header Badge */}
                <g transform="translate(140, 394)">
                  <rect
                    x="0"
                    y="0"
                    width="230"
                    height="20"
                    rx="5"
                    fill={isMVBus1Live ? '#022c22' : '#18181b'}
                    stroke={getLineColor(isMVBus1Live, isBus1Grounded)}
                    strokeWidth="1.2"
                  />
                  <circle cx="10" cy="10" r="3.5" fill={isMVBus1Live ? '#10b981' : '#ef4444'} />
                  <text x="20" y="13.5" fill="#ffffff" fontSize="9" fontWeight="bold">
                    13.8kV MV BUS SEC-1
                  </text>
                  <rect x="145" y="3" width="75" height="14" rx="3" fill={isMVBus1Live ? '#065f46' : '#27272a'} />
                  <text x="182" y="13.5" fill={isMVBus1Live ? '#a7f3d0' : '#cbd5e1'} fontSize="8" fontWeight="bold" textAnchor="middle">
                    {isMVBus1Live ? `${(tr1State?.secondarykV ?? 13.8).toFixed(1)} kV` : '0.0 kV'}
                  </text>
                </g>
              </g>

              {/* MV Section-2 Busbar */}
              <g
                className="cursor-pointer group"
                style={{ opacity: focusedBay === 'ALL' || focusedBay === 'BAY_05_MV2' || focusedBay === 'BAY_03_TR2' || focusedBay === 'BAY_02_COUPLER' ? 1 : 0.85, transition: 'opacity 0.3s' }}
                onClick={() => {
                  setSelectedItem({
                    id: 'MV-BUS-2',
                    name: '13.8kV MV Bus Section 2',
                    ansiCode: '13.8kV BUS-2',
                    type: 'busbar',
                    trId: 'TR-2',
                    bay: '13.8kV Switchgear Sec-2',
                    voltageRating: `${isMVBus2Live ? (tr2State?.secondarykV ?? 13.8).toFixed(1) : '0.0'} kV`,
                    currentRating: '2,500 A'
                  });
                }}
              >
                {/* Conductor Outer Channel */}
                <line x1="520" y1="420" x2="860" y2="420" stroke="#090d16" strokeWidth="10" strokeLinecap="round" />
                {/* Heavy Conductor Bar */}
                <line x1="520" y1="420" x2="860" y2="420" stroke={getLineColor(isMVBus2Live, isBus2Grounded)} strokeWidth="7" strokeLinecap="round" />
                {/* Core Reflection */}
                <line x1="520" y1="420" x2="860" y2="420" stroke={isMVBus2Live ? '#a7f3d0' : '#f1f5f9'} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.7" />

                {/* Right Terminal Block */}
                <rect x="860" y="415" width="10" height="10" rx="2" fill="#0f172a" stroke={getLineColor(isMVBus2Live, isBus2Grounded)} strokeWidth="1.2" />

                {/* Identification Header Badge */}
                <g transform="translate(630, 394)">
                  <rect
                    x="0"
                    y="0"
                    width="230"
                    height="20"
                    rx="5"
                    fill={isMVBus2Live ? '#022c22' : '#18181b'}
                    stroke={getLineColor(isMVBus2Live, isBus2Grounded)}
                    strokeWidth="1.2"
                  />
                  <circle cx="10" cy="10" r="3.5" fill={isMVBus2Live ? '#10b981' : '#ef4444'} />
                  <text x="20" y="13.5" fill="#ffffff" fontSize="9" fontWeight="bold">
                    13.8kV MV BUS SEC-2
                  </text>
                  <rect x="145" y="3" width="75" height="14" rx="3" fill={isMVBus2Live ? '#065f46' : '#27272a'} />
                  <text x="182" y="13.5" fill={isMVBus2Live ? '#a7f3d0' : '#cbd5e1'} fontSize="8" fontWeight="bold" textAnchor="middle">
                    {isMVBus2Live ? `${(tr2State?.secondarykV ?? 13.8).toFixed(1)} kV` : '0.0 kV'}
                  </text>
                </g>
              </g>

              {/* Sectionalizer 52-6 (Bay 04/05) with Synchrocheck & Interlock HUD */}
              <g
                style={{ opacity: focusedBay === 'ALL' || focusedBay === 'BAY_04_MV1' || focusedBay === 'BAY_05_MV2' || focusedBay === 'BAY_02_COUPLER' ? 1 : 0.2, transition: 'opacity 0.3s' }}
              >
                <g
                  className="cursor-pointer"
                  onMouseEnter={(e) =>
                    handleInterlockHover(
                      e,
                      '52-6',
                      'MV Bus Sectionalizer Breaker',
                      sw1.busSectionalizer52_6,
                      !(isBus1Grounded || isBus2Grounded),
                      'IL-25: MV Synchrocheck & Safety Matrix',
                      'Paralleling permitted only when Sec-1 and Sec-2 phase voltages match and no earth switch is active.',
                      isBus1Grounded || isBus2Grounded ? ['One or both bus sections are grounded'] : []
                    )
                  }
                  onMouseLeave={() => setHoverInterlock(null)}
                  onClick={() => {
                    setSelectedItem({
                      id: '52-6',
                      name: 'MV Bus Sectionalizer Breaker',
                      ansiCode: 'ANSI 52',
                      type: 'breaker',
                      trId: 'TR-1',
                      switchKey: 'busSectionalizer52_6',
                      bay: '13.8kV MV Switchgear Sectionalizer',
                      voltageRating: '13.8 kV',
                      currentRating: '3,000 A'
                    });
                  }}
                >
                  <line x1="480" y1="420" x2="520" y2="420" stroke={sw1.busSectionalizer52_6 ? '#10b981' : '#52525b'} strokeWidth="3" />
                  <rect
                    x="486"
                    y="409"
                    width="28"
                    height="22"
                    fill="#090d16"
                    stroke={sw1.busSectionalizer52_6 ? '#10b981' : '#f43f5e'}
                    strokeWidth="2"
                    rx="4"
                    filter={selectedItem.id === '52-6' ? 'url(#selectionGlow)' : undefined}
                  />
                  <text x="500" y="424" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold">
                    {sw1.busSectionalizer52_6 ? '✕' : '▢'}
                  </text>
                  <text x="500" y="443" fill="#38bdf8" fontSize="9" textAnchor="middle" fontWeight="bold">52-6 Sectionalizer</text>
                </g>

                {/* ANSI 25 Synchrocheck for MV Sectionalizer */}
                <g
                  className="cursor-pointer"
                  onClick={() =>
                    setSynchroModalData({
                      bayName: '13.8kV Bus Sectionalizer 52-6 (MV Sec 1 <-> Sec 2)',
                      vA: tr1State?.secondarykV ?? 13.8,
                      vB: tr2State?.secondarykV ?? 13.8,
                    })
                  }
                >
                  <rect x="440" y="450" width="120" height="17" fill="#042f2e" stroke="#14b8a6" strokeWidth="1" rx="4" />
                  <text x="445" y="462" fill="#2dd4bf" fontSize="7.5" fontWeight="bold">
                    ⚡ 25 SYNCHRO (Δθ: 0.8°)
                  </text>
                </g>
              </g>

              {/* Earth Switch 84-1 */}
              <g
                style={{ opacity: focusedBay === 'ALL' || focusedBay === 'BAY_04_MV1' || focusedBay === 'BAY_01_TR1' ? 1 : 0.2, transition: 'opacity 0.3s' }}
                className="cursor-pointer"
                onMouseEnter={(e) =>
                  handleInterlockHover(
                    e,
                    '84-1',
                    'MV Bus Section-1 Safety Earth Switch',
                    sw1.earthSwitch84_1,
                    !isMVBus1Live,
                    'IL-105: Dead Bus Earthing Interlock',
                    'Closing safety earth switch 84-1 is strictly blocked while Bus Section-1 is energized.',
                    isMVBus1Live ? ['Bus Section-1 is ENERGIZED (13.8kV)'] : []
                  )
                }
                onMouseLeave={() => setHoverInterlock(null)}
                onClick={() => {
                  setSelectedItem({
                    id: '84-1',
                    name: 'MV Bus Section-1 Safety Earth Switch',
                    ansiCode: 'ANSI 84',
                    type: 'earthSwitch',
                    trId: 'TR-1',
                    switchKey: 'earthSwitch84_1',
                    bay: 'MV Bus Section-1 Safety Bay',
                    voltageRating: '13.8 kV Ground',
                    currentRating: '40 kA Peak Ground'
                  });
                }}
              >
                <line x1="220" y1="420" x2="220" y2="460" stroke={isBus1Grounded ? '#eab308' : '#52525b'} strokeWidth="2" />
                <rect
                  x="208"
                  y="435"
                  width="24"
                  height="16"
                  fill="#090d16"
                  stroke={isBus1Grounded ? '#eab308' : '#52525b'}
                  strokeWidth="2"
                  rx="3"
                  filter={selectedItem.id === '84-1' ? 'url(#selectionGlow)' : undefined}
                />
                <text x="220" y="446" fill="#ffffff" fontSize="8" textAnchor="middle">84-1</text>
                <line x1="210" y1="460" x2="230" y2="460" stroke="#eab308" strokeWidth="2" />
                <line x1="214" y1="464" x2="226" y2="464" stroke="#eab308" strokeWidth="2" />
                <line x1="218" y1="468" x2="222" y2="468" stroke="#eab308" strokeWidth="2" />
              </g>

              {/* Earth Switch 84-2 */}
              <g
                style={{ opacity: focusedBay === 'ALL' || focusedBay === 'BAY_05_MV2' || focusedBay === 'BAY_03_TR2' || focusedBay === 'BAY_06_BESS' ? 1 : 0.2, transition: 'opacity 0.3s' }}
                className="cursor-pointer"
                onMouseEnter={(e) =>
                  handleInterlockHover(
                    e,
                    '84-2',
                    'MV Bus Section-2 Safety Earth Switch',
                    sw1.earthSwitch84_2,
                    !isMVBus2Live,
                    'IL-105: Dead Bus Earthing Interlock',
                    'Closing safety earth switch 84-2 is strictly blocked while Bus Section-2 is energized.',
                    isMVBus2Live ? ['Bus Section-2 is ENERGIZED (13.8kV)'] : []
                  )
                }
                onMouseLeave={() => setHoverInterlock(null)}
                onClick={() => {
                  setSelectedItem({
                    id: '84-2',
                    name: 'MV Bus Section-2 Safety Earth Switch',
                    ansiCode: 'ANSI 84',
                    type: 'earthSwitch',
                    trId: 'TR-1',
                    switchKey: 'earthSwitch84_2',
                    bay: 'MV Bus Section-2 Safety Bay',
                    voltageRating: '13.8 kV Ground',
                    currentRating: '40 kA Peak Ground'
                  });
                }}
              >
                <line x1="780" y1="420" x2="780" y2="460" stroke={isBus2Grounded ? '#eab308' : '#52525b'} strokeWidth="2" />
                <rect
                  x="768"
                  y="435"
                  width="24"
                  height="16"
                  fill="#090d16"
                  stroke={isBus2Grounded ? '#eab308' : '#52525b'}
                  strokeWidth="2"
                  rx="3"
                  filter={selectedItem.id === '84-2' ? 'url(#selectionGlow)' : undefined}
                />
                <text x="780" y="446" fill="#ffffff" fontSize="8" textAnchor="middle">84-2</text>
                <line x1="770" y1="460" x2="790" y2="460" stroke="#eab308" strokeWidth="2" />
                <line x1="774" y1="464" x2="786" y2="464" stroke="#eab308" strokeWidth="2" />
                <line x1="778" y1="468" x2="782" y2="468" stroke="#eab308" strokeWidth="2" />
              </g>

              {/* ==================== OUTGOING FEEDERS & BESS ==================== */}
              {/* Bay 04: Feeders 01 & 02 Group */}
              <g style={{ opacity: focusedBay === 'ALL' || focusedBay === 'BAY_04_MV1' ? 1 : 0.2, transition: 'opacity 0.3s' }}>
                {/* City Feeder 01 */}
                <g
                  transform="translate(180, 420)"
                  className="cursor-pointer"
                  onMouseEnter={(e) =>
                    handleInterlockHover(
                      e,
                      '52-7',
                      'City Feeder 01 Circuit Breaker',
                      sw1.feederCity52_7,
                      !isBus1Grounded,
                      'IL-201: Feeder Permissive Matrix',
                      'Closing permitted when bus is energized and no downstream line fault is latched.',
                      isBus1Grounded ? ['Bus Section-1 is GROUNDED'] : []
                    )
                  }
                  onMouseLeave={() => setHoverInterlock(null)}
                  onClick={() => {
                    setSelectedItem({
                      id: '52-7',
                      name: 'City Feeder 01 Circuit Breaker',
                      ansiCode: 'ANSI 50/51',
                      type: 'feeder',
                      trId: 'TR-1',
                      switchKey: 'feederCity52_7',
                      bay: 'Municipal Distribution Feeder Bay 01',
                      voltageRating: '13.8 kV',
                      currentRating: '1,200 A'
                    });
                  }}
                >
                  <line x1="0" y1="0" x2="0" y2="100" stroke={getLineColor(isMVBus1Live && sw1.feederCity52_7, false)} strokeWidth="3" />
                  <rect
                    x="-12"
                    y="30"
                    width="24"
                    height="18"
                    fill="#090d16"
                    stroke={sw1.feederCity52_7 ? '#10b981' : '#f43f5e'}
                    strokeWidth="2"
                    rx="3"
                    filter={selectedItem.id === '52-7' ? 'url(#selectionGlow)' : undefined}
                  />
                  <text x="0" y="42" fill="#ffffff" fontSize="8" textAnchor="middle">52-7</text>
                  <text x="0" y="115" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">City Feeder 01</text>
                </g>

                {/* Industrial Feeder 02 */}
                <g
                  transform="translate(380, 420)"
                  className="cursor-pointer"
                  onMouseEnter={(e) =>
                    handleInterlockHover(
                      e,
                      '52-8',
                      'Industrial Feeder 02 Circuit Breaker',
                      sw1.feederInd52_8,
                      !isBus1Grounded,
                      'IL-201: Feeder Permissive Matrix',
                      'Closing permitted when bus is energized and no downstream line fault is latched.',
                      isBus1Grounded ? ['Bus Section-1 is GROUNDED'] : []
                    )
                  }
                  onMouseLeave={() => setHoverInterlock(null)}
                  onClick={() => {
                    setSelectedItem({
                      id: '52-8',
                      name: 'Industrial Feeder 02 Circuit Breaker',
                      ansiCode: 'ANSI 50/51',
                      type: 'feeder',
                      trId: 'TR-1',
                      switchKey: 'feederInd52_8',
                      bay: 'Heavy Industry Feeder Bay 02',
                      voltageRating: '13.8 kV',
                      currentRating: '1,200 A'
                    });
                  }}
                >
                  <line x1="0" y1="0" x2="0" y2="100" stroke={getLineColor(isMVBus1Live && sw1.feederInd52_8, false)} strokeWidth="3" />
                  <rect
                    x="-12"
                    y="30"
                    width="24"
                    height="18"
                    fill="#090d16"
                    stroke={sw1.feederInd52_8 ? '#10b981' : '#f43f5e'}
                    strokeWidth="2"
                    rx="3"
                    filter={selectedItem.id === '52-8' ? 'url(#selectionGlow)' : undefined}
                  />
                  <text x="0" y="42" fill="#ffffff" fontSize="8" textAnchor="middle">52-8</text>
                  <text x="0" y="115" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">Industrial Feeder 02</text>
                </g>
              </g>

              {/* Bay 05: Commercial Feeder 03 Group */}
              <g style={{ opacity: focusedBay === 'ALL' || focusedBay === 'BAY_05_MV2' ? 1 : 0.2, transition: 'opacity 0.3s' }}>
                <g
                  transform="translate(620, 420)"
                  className="cursor-pointer"
                  onMouseEnter={(e) =>
                    handleInterlockHover(
                      e,
                      '52-9',
                      'Commercial Feeder 03 Circuit Breaker',
                      sw1.feederComm52_9,
                      !isBus2Grounded,
                      'IL-201: Feeder Permissive Matrix',
                      'Closing permitted when bus is energized and no downstream line fault is latched.',
                      isBus2Grounded ? ['Bus Section-2 is GROUNDED'] : []
                    )
                  }
                  onMouseLeave={() => setHoverInterlock(null)}
                  onClick={() => {
                    setSelectedItem({
                      id: '52-9',
                      name: 'Commercial Feeder 03 Circuit Breaker',
                      ansiCode: 'ANSI 50/51',
                      type: 'feeder',
                      trId: 'TR-1',
                      switchKey: 'feederComm52_9',
                      bay: 'Commercial Feeder Bay 03',
                      voltageRating: '13.8 kV',
                      currentRating: '1,200 A'
                    });
                  }}
                >
                  <line x1="0" y1="0" x2="0" y2="100" stroke={getLineColor(isMVBus2Live && sw1.feederComm52_9, false)} strokeWidth="3" />
                  <rect
                    x="-12"
                    y="30"
                    width="24"
                    height="18"
                    fill="#090d16"
                    stroke={sw1.feederComm52_9 ? '#10b981' : '#f43f5e'}
                    strokeWidth="2"
                    rx="3"
                    filter={selectedItem.id === '52-9' ? 'url(#selectionGlow)' : undefined}
                  />
                  <text x="0" y="42" fill="#ffffff" fontSize="8" textAnchor="middle">52-9</text>
                  <text x="0" y="115" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">Commercial Feeder 03</text>
                </g>
              </g>

              {/* Bay 06: BESS Battery Storage Bay Group */}
              <g style={{ opacity: focusedBay === 'ALL' || focusedBay === 'BAY_06_BESS' ? 1 : 0.2, transition: 'opacity 0.3s' }}>
                <g transform="translate(820, 420)">
                  <line x1="0" y1="0" x2="0" y2="80" stroke={getLineColor(isMVBus2Live && sw1.feederBess52_B, false)} strokeWidth="3" />
                  <g
                    className="cursor-pointer"
                    onMouseEnter={(e) =>
                      handleInterlockHover(
                        e,
                        '52-B',
                        '10MW / 20MWh BESS Inverter Breaker',
                        sw1.feederBess52_B,
                        !isBus2Grounded,
                        'IL-301: BESS Grid-Forming Synchronism Lock',
                        'Inverter breaker requires anti-islanding lock and DC pre-charge complete state.',
                        isBus2Grounded ? ['Bus Section-2 is GROUNDED'] : []
                      )
                    }
                    onMouseLeave={() => setHoverInterlock(null)}
                    onClick={() => {
                      setSelectedItem({
                        id: '52-B',
                        name: '10MW / 20MWh BESS Inverter Breaker',
                        ansiCode: 'ANSI 52',
                        type: 'bess',
                        trId: 'TR-1',
                        switchKey: 'feederBess52_B',
                        bay: 'BESS Battery Inverter Bay',
                        voltageRating: '13.8 kV',
                        currentRating: '800 A'
                      });
                    }}
                  >
                    <rect
                      x="-12"
                      y="25"
                      width="24"
                      height="18"
                      fill="#090d16"
                      stroke={sw1.feederBess52_B ? '#10b981' : '#f43f5e'}
                      strokeWidth="2"
                      rx="3"
                      filter={selectedItem.id === '52-B' ? 'url(#selectionGlow)' : undefined}
                    />
                    <text x="0" y="37" fill="#ffffff" fontSize="8" textAnchor="middle">52-B</text>
                  </g>

                  {/* Interactive BESS Sub-Bay Telemetry Box */}
                  <g className="cursor-pointer" onClick={() => setBessDischarging(!bessDischarging)}>
                    <rect x="-44" y="75" width="88" height="42" fill="#090d16" stroke="#a855f7" strokeWidth="2" rx="6" />
                    <text x="0" y="88" fill="#e879f9" fontSize="9" textAnchor="middle" fontWeight="bold">10MW BESS BAY</text>
                    <text x="0" y="100" fill="#38bdf8" fontSize="8" textAnchor="middle">84.2% SOC • 98.6% SOH</text>
                    <rect x="-38" y="105" width="76" height="10" fill={bessDischarging ? '#c084fc' : '#090d16'} rx="3" stroke="#a855f7" strokeWidth="1" />
                    <text x="0" y="113" fill={bessDischarging ? '#020617' : '#a855f7'} fontSize="7" textAnchor="middle" fontWeight="bold">
                      {bessDischarging ? 'DISCHARGING 8.4MW' : 'FFR ARMED / CHARGING'}
                    </text>
                  </g>
                </g>
              </g>

              {/* ==================== 2. DYNAMIC POWER FLOW STREAMLINES & PARTICLES (P + jQ) ==================== */}
              {layers.powerFlow && (
                <g id="power-flow-particles-layer">
                  {/* TR-1 Active & Reactive Power Streamlines */}
                  {isTR1_PrimLive && (
                    <>
                      {/* Active Power P Streamline (Emerald Cyan) */}
                      <path
                        d="M 320 80 L 320 230"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeDasharray="6,4"
                        className="animate-pulse"
                      />
                      {/* Animated P Particles */}
                      <circle cx="320" cy="110" r="3.5" fill="#34d399" filter="url(#glow)">
                        <animate attributeName="cy" values="80;230" dur="1.0s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="320" cy="180" r="3.5" fill="#34d399" filter="url(#glow)">
                        <animate attributeName="cy" values="140;230" dur="1.0s" repeatCount="indefinite" />
                      </circle>
                    </>
                  )}
                  {isTR1_SecLive && (
                    <>
                      <path
                        d="M 320 315 L 320 420 L 180 420 L 180 520"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2.5"
                        strokeDasharray="6,4"
                        className="animate-pulse"
                      />
                      <circle cx="320" cy="360" r="3.5" fill="#38bdf8" filter="url(#glow)">
                        <animate attributeName="cy" values="315;420" dur="1.0s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="250" cy="420" r="3.5" fill="#38bdf8" filter="url(#glow)">
                        <animate attributeName="cx" values="320;180" dur="1.2s" repeatCount="indefinite" />
                      </circle>
                      {sw1.feederCity52_7 && (
                        <circle cx="180" cy="460" r="3.5" fill="#38bdf8" filter="url(#glow)">
                          <animate attributeName="cy" values="420;520" dur="1.0s" repeatCount="indefinite" />
                        </circle>
                      )}
                      {sw1.feederInd52_8 && (
                        <circle cx="380" cy="460" r="3.5" fill="#38bdf8" filter="url(#glow)">
                          <animate attributeName="cy" values="420;520" dur="1.0s" repeatCount="indefinite" />
                        </circle>
                      )}

                      {/* TR-1 P+jQ Flow Badge */}
                      <g transform="translate(230, 320)">
                        <rect x="0" y="0" width="82" height="24" fill="#022c22" stroke="#10b981" strokeWidth="1" rx="4" opacity="0.9" />
                        <text x="5" y="10" fill="#34d399" fontSize="7.5" fontWeight="bold">P: +38.4 MW</text>
                        <text x="5" y="20" fill="#6ee7b7" fontSize="7" fontStyle="italic">Q: +6.2 MVAr (0.98)</text>
                      </g>
                    </>
                  )}

                  {/* TR-2 Active & Reactive Power Streamlines */}
                  {isTR2_PrimLive && (
                    <>
                      <path
                        d="M 680 80 L 680 230"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeDasharray="6,4"
                        className="animate-pulse"
                      />
                      <circle cx="680" cy="110" r="3.5" fill="#34d399" filter="url(#glow)">
                        <animate attributeName="cy" values="80;230" dur="1.0s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="680" cy="180" r="3.5" fill="#34d399" filter="url(#glow)">
                        <animate attributeName="cy" values="140;230" dur="1.0s" repeatCount="indefinite" />
                      </circle>
                    </>
                  )}
                  {isTR2_SecLive && (
                    <>
                      <path
                        d="M 680 315 L 680 420 L 620 420 L 620 520"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2.5"
                        strokeDasharray="6,4"
                        className="animate-pulse"
                      />
                      <circle cx="680" cy="360" r="3.5" fill="#38bdf8" filter="url(#glow)">
                        <animate attributeName="cy" values="315;420" dur="1.0s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="750" cy="420" r="3.5" fill="#38bdf8" filter="url(#glow)">
                        <animate attributeName="cx" values="680;820" dur="1.4s" repeatCount="indefinite" />
                      </circle>
                      {sw1.feederComm52_9 && (
                        <circle cx="620" cy="460" r="3.5" fill="#38bdf8" filter="url(#glow)">
                          <animate attributeName="cy" values="420;520" dur="1.0s" repeatCount="indefinite" />
                        </circle>
                      )}

                      {/* TR-2 P+jQ Flow Badge */}
                      <g transform="translate(715, 320)">
                        <rect x="0" y="0" width="82" height="24" fill="#022c22" stroke="#10b981" strokeWidth="1" rx="4" opacity="0.9" />
                        <text x="5" y="10" fill="#34d399" fontSize="7.5" fontWeight="bold">P: +26.1 MW</text>
                        <text x="5" y="20" fill="#6ee7b7" fontSize="7" fontStyle="italic">Q: +4.1 MVAr (0.98)</text>
                      </g>
                    </>
                  )}

                  {/* BESS Active Discharge Streamline */}
                  {bessDischarging && (
                    <>
                      <path
                        d="M 820 500 L 820 420 L 680 420"
                        fill="none"
                        stroke="#c084fc"
                        strokeWidth="2.5"
                        strokeDasharray="6,4"
                        className="animate-pulse"
                      />
                      <circle cx="820" cy="460" r="4" fill="#e879f9" filter="url(#glow)">
                        <animate attributeName="cy" values="500;420" dur="0.8s" repeatCount="indefinite" />
                      </circle>
                      <g transform="translate(865, 435)">
                        <rect x="0" y="0" width="75" height="22" fill="#3b0764" stroke="#c084fc" strokeWidth="1" rx="4" opacity="0.9" />
                        <text x="5" y="9" fill="#e879f9" fontSize="7" fontWeight="bold">BESS: -8.4 MW</text>
                        <text x="5" y="18" fill="#f0abfc" fontSize="6.5">Grid-Forming FFR</text>
                      </g>
                    </>
                  )}
                </g>
              )}

              {/* ==================== 3. ASSET DIAGNOSTICS & DGA BADGES ==================== */}
              {layers.assetDiagnostics && (
                <g id="asset-diagnostics-layer">
                  {/* TR-1 Asset Health Callout */}
                  <g transform="translate(180, 245)" className="cursor-pointer" onClick={() => setDuvalModalTr('TR-1')}>
                    <rect x="0" y="0" width="105" height="58" fill="#090d16" stroke="#38bdf8" strokeWidth="1.5" rx="6" />
                    <text x="6" y="12" fill="#38bdf8" fontSize="8" fontWeight="bold">FAA: {tr1Aging.faa.toFixed(2)} • %LOL: {tr1Aging.lolPct.toFixed(3)}%</text>
                    <text x="6" y="24" fill={pctC2H2 > 15 ? '#f43f5e' : '#34d399'} fontSize="8" fontWeight="bold">
                      DGA: {dgaStatusText}
                    </text>
                    <text x="6" y="36" fill="#f59e0b" fontSize="8">AI Anomaly: 4.2/100 (SAFE)</text>
                    <text x="6" y="48" fill="#c084fc" fontSize="7" fontWeight="bold">👉 ONE-CLICK DUVAL TRIANGLE</text>
                  </g>

                  {/* TR-2 Asset Health Callout */}
                  <g transform="translate(740, 245)" className="cursor-pointer" onClick={() => setDuvalModalTr('TR-2')}>
                    <rect x="0" y="0" width="105" height="58" fill="#090d16" stroke="#38bdf8" strokeWidth="1.5" rx="6" />
                    <text x="6" y="12" fill="#38bdf8" fontSize="8" fontWeight="bold">FAA: {tr2Aging.faa.toFixed(2)} • %LOL: {tr2Aging.lolPct.toFixed(3)}%</text>
                    <text x="6" y="24" fill="#34d399" fontSize="8" fontWeight="bold">DGA: NOMINAL</text>
                    <text x="6" y="36" fill="#f59e0b" fontSize="8">AI Anomaly: 2.8/100 (SAFE)</text>
                    <text x="6" y="48" fill="#c084fc" fontSize="7" fontWeight="bold">👉 ONE-CLICK DUVAL TRIANGLE</text>
                  </g>

                  {/* UHF Acoustic PD Node */}
                  <g
                    transform="translate(320, 240)"
                    className="cursor-pointer"
                    onClick={() => setUhfModalData({ trId: 'TR-1', loc: 'Bushing HV-A', pd: 0.14, temp: 54.4 })}
                  >
                    <circle cx="0" cy="0" r="8" fill="#a855f7" opacity="0.4" className="animate-ping" />
                    <circle cx="0" cy="0" r="5" fill="#c084fc" stroke="#ffffff" strokeWidth="1" />
                    <rect x="8" y="-8" width="70" height="14" fill="#020617" stroke="#a855f7" strokeWidth="1" rx="4" />
                    <text x="12" y="2" fill="#e879f9" fontSize="7" fontWeight="bold">UHF PD: 0.14 nC</text>
                  </g>

                  {/* IR Thermal Hotspot Marker */}
                  <g
                    transform="translate(320, 290)"
                    className="cursor-pointer"
                    onClick={() => setUhfModalData({ trId: 'TR-1', loc: 'OLTC Compartment', pd: 0.05, temp: tr1State.bushingTemp })}
                  >
                    <circle cx="0" cy="0" r="6" fill="#f59e0b" opacity="0.5" className="animate-pulse" />
                    <rect x="-80" y="-8" width="75" height="14" fill="#020617" stroke="#f59e0b" strokeWidth="1" rx="4" />
                    <text x="-76" y="2" fill="#fde047" fontSize="7" fontWeight="bold">IR: {tr1State.bushingTemp.toFixed(1)}°C (+1.8°C)</text>
                  </g>
                </g>
              )}

              {/* ==================== 4. IEC 61850 PROCESS BUS LAYER ==================== */}
              {layers.iec61850 && (
                <g id="iec61850-process-bus-layer">
                  <g className="cursor-pointer" transform="translate(350, 205)" onClick={() => setMuModalData({ id: 'MU-01', dev: 'CT-1 / PT-1 Primary Bay' })}>
                    <rect x="0" y="0" width="55" height="18" fill="#020617" stroke="#10b981" strokeWidth="1.5" rx="4" />
                    <text x="27" y="12" fill="#34d399" fontSize="8" textAnchor="middle" fontWeight="bold">MU-01 (SV 4kHz)</text>
                  </g>

                  <g className="cursor-pointer" transform="translate(710, 205)" onClick={() => setMuModalData({ id: 'MU-02', dev: 'CT-2 / PT-2 Primary Bay' })}>
                    <rect x="0" y="0" width="55" height="18" fill="#020617" stroke="#10b981" strokeWidth="1.5" rx="4" />
                    <text x="27" y="12" fill="#34d399" fontSize="8" textAnchor="middle" fontWeight="bold">MU-02 (SV 4kHz)</text>
                  </g>

                  <g className="cursor-pointer" transform="translate(140, 430)" onClick={() => setMuModalData({ id: 'MU-03', dev: 'MV Busbar Section-1 PT' })}>
                    <rect x="0" y="0" width="50" height="16" fill="#020617" stroke="#10b981" strokeWidth="1.5" rx="4" />
                    <text x="25" y="11" fill="#34d399" fontSize="7" textAnchor="middle" fontWeight="bold">MU-03 Bus1</text>
                  </g>

                  <g className="cursor-pointer" transform="translate(995, 205)" onClick={() => setMuModalData({ id: 'MU-07', dev: 'HVDC Valve Hall & PCC Merging Unit' })}>
                    <rect x="0" y="0" width="55" height="18" fill="#020617" stroke="#3b82f6" strokeWidth="1.5" rx="4" />
                    <text x="27" y="12" fill="#60a5fa" fontSize="8" textAnchor="middle" fontWeight="bold">MU-07 (SV 4kHz)</text>
                  </g>

                  <path
                    d="M 320 215 C 260 215, 260 345, 308 345"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="1.8"
                    strokeDasharray="4,3"
                    className="animate-pulse"
                  />
                  <rect x="235" y="270" width="75" height="14" fill="#090d16" stroke="#06b6d4" strokeWidth="1" rx="3" />
                  <text x="272" y="280" fill="#67e8f9" fontSize="7" textAnchor="middle" fontWeight="bold">GOOSE Trip &lt; 3.8ms</text>
                </g>
              )}

              {/* ==================== 5. PROTECTION LOCKS & TAKAGI FAULT PINS ==================== */}
              {layers.protectionFaults && (
                <g id="protection-faults-layer">
                  {sw1.hvBreaker52_1 && (
                    <g transform="translate(275, 125)">
                      <rect x="0" y="0" width="14" height="14" fill="#ef4444" rx="3" />
                      <text x="7" y="10" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold">🔒</text>
                    </g>
                  )}

                  {sw1.mvDisconnect89_2 && (
                    <g transform="translate(230, 430)">
                      <rect x="0" y="0" width="14" height="14" fill="#f59e0b" rx="3" className="animate-bounce" />
                      <text x="7" y="10" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold">⚠️</text>
                    </g>
                  )}

                  <g
                    transform="translate(180, 480)"
                    className="cursor-pointer"
                    onClick={() => setTakagiModalData({ feeder: 'City Feeder 01', dist: 14.2, tower: 'Tower #6' })}
                  >
                    <circle cx="0" cy="0" r="10" fill="#f43f5e" opacity="0.4" className="animate-ping" />
                    <circle cx="0" cy="0" r="6" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                    <rect x="10" y="-10" width="115" height="18" fill="#020617" stroke="#f43f5e" strokeWidth="1.5" rx="4" />
                    <text x="14" y="2" fill="#fda4af" fontSize="8" fontWeight="bold">📍 Takagi Pin: 14.2km (Tower #6)</text>
                  </g>

                  <g className="cursor-pointer" transform="translate(280, 195)" onClick={() => setComtradeModalAsset('CT-1 / TR-1 Protection Relay')}>
                    <rect x="0" y="0" width="80" height="15" fill="#78350f" stroke="#f59e0b" strokeWidth="1" rx="3" className="animate-pulse" />
                    <text x="40" y="10" fill="#fde047" fontSize="7" textAnchor="middle" fontWeight="bold">⚡ OSC RECORDED</text>
                  </g>
                </g>
              )}

              {/* ==================== 6. MACRO PREVIEW ANIMATED PATHS ==================== */}
              {previewMacroPath === 'ATS' && (
                <path
                  d="M 320 420 L 480 420 L 520 420 L 680 420"
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="4"
                  strokeDasharray="6,4"
                  className="animate-pulse"
                />
              )}

              {previewMacroPath === 'ISOLATION' && (
                <path
                  d="M 300 80 L 300 150 L 320 150 L 320 400"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="4"
                  strokeDasharray="6,4"
                  className="animate-pulse"
                />
              )}

              {previewMacroPath === 'UFLS' && (
                <path
                  d="M 620 420 L 620 520"
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="4"
                  strokeDasharray="6,4"
                  className="animate-pulse"
                />
              )}
              {/* ==================== 7. ARC FLASH HAZARD & PPE BOUNDARY OVERLAYS (NFPA 70E / IEEE 1584) ==================== */}
              {layers.arcFlash && (
                <g id="arc-flash-hazard-layer">
                  {/* 132kV HV Switchyard Zone (Category 4) */}
                  <g
                    className="cursor-pointer"
                    transform="translate(130, 40)"
                    onClick={() =>
                      setArcFlashModalData({
                        id: 'HV-SWYARD-132KV',
                        bay: '132kV High Voltage Switchyard',
                        v: '132.0 kV',
                        ik: 31.5,
                        t: 80,
                        d: 36,
                      })
                    }
                  >
                    <rect
                      x="0"
                      y="0"
                      width="740"
                      height="125"
                      fill="#881337"
                      fillOpacity="0.08"
                      stroke="#f43f5e"
                      strokeWidth="1.5"
                      strokeDasharray="6,4"
                      rx="8"
                    />
                    <g transform="translate(15, 12)">
                      <rect x="0" y="0" width="170" height="24" fill="#4c0519" stroke="#f43f5e" strokeWidth="1" rx="4" />
                      <text x="8" y="11" fill="#fda4af" fontSize="8" fontWeight="bold">⚠️ ARC FLASH: 31.4 cal/cm² (CAT 4)</text>
                      <text x="8" y="20" fill="#fecdd3" fontSize="7">Boundary: 14.6 ft • Working Dist: 36"</text>
                    </g>
                  </g>

                  {/* 13.8kV MV Section 1 Cubicle (Category 3) */}
                  <g
                    className="cursor-pointer"
                    transform="translate(140, 395)"
                    onClick={() =>
                      setArcFlashModalData({
                        id: 'MV-SWGR-SEC1',
                        bay: '13.8kV MV Switchgear Section 1',
                        v: '13.8 kV',
                        ik: 25.0,
                        t: 120,
                        d: 18,
                      })
                    }
                  >
                    <rect
                      x="0"
                      y="0"
                      width="350"
                      height="145"
                      fill="#78350f"
                      fillOpacity="0.08"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      strokeDasharray="6,4"
                      rx="8"
                    />
                    <g transform="translate(10, 12)">
                      <rect x="0" y="0" width="160" height="24" fill="#451a03" stroke="#f59e0b" strokeWidth="1" rx="4" />
                      <text x="8" y="11" fill="#fde047" fontSize="8" fontWeight="bold">⚠️ ARC FLASH: 18.6 cal/cm² (CAT 3)</text>
                      <text x="8" y="20" fill="#fef08a" fontSize="7">Boundary: 11.2 ft • Working Dist: 18"</text>
                    </g>
                  </g>

                  {/* 13.8kV MV Section 2 Cubicle (Category 3) */}
                  <g
                    className="cursor-pointer"
                    transform="translate(510, 395)"
                    onClick={() =>
                      setArcFlashModalData({
                        id: 'MV-SWGR-SEC2',
                        bay: '13.8kV MV Switchgear Section 2',
                        v: '13.8 kV',
                        ik: 25.0,
                        t: 120,
                        d: 18,
                      })
                    }
                  >
                    <rect
                      x="0"
                      y="0"
                      width="360"
                      height="145"
                      fill="#78350f"
                      fillOpacity="0.08"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      strokeDasharray="6,4"
                      rx="8"
                    />
                    <g transform="translate(10, 12)">
                      <rect x="0" y="0" width="160" height="24" fill="#451a03" stroke="#f59e0b" strokeWidth="1" rx="4" />
                      <text x="8" y="11" fill="#fde047" fontSize="8" fontWeight="bold">⚠️ ARC FLASH: 16.2 cal/cm² (CAT 3)</text>
                      <text x="8" y="20" fill="#fef08a" fontSize="7">Boundary: 10.5 ft • Working Dist: 18"</text>
                    </g>
                  </g>
                </g>
              )}

              {/* ==================== 8. SPOTLIGHT BEACON LAYER ==================== */}
              {spotlightTarget && (
                <g id="spotlight-beacon" transform={`translate(${spotlightTarget.x}, ${spotlightTarget.y})`}>
                  <circle r="36" fill="#38bdf8" fillOpacity="0.15" stroke="#38bdf8" strokeWidth="2" className="animate-ping" />
                  <circle r="22" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
                  <circle r="5" fill="#38bdf8" />
                  <text y="-28" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">
                    🎯 {spotlightTarget.id} ({spotlightTarget.name})
                  </text>
                </g>
              )}

              {/* ==================== 9. SAFETY & LOTO TAGS OVERLAY ==================== */}
              {activeTags.map((tag) => {
                const target = SUBSTATION_EQUIPMENT_REGISTRY.find((e) => e.id === tag.equipmentId);
                if (!target) return null;
                const def = TAG_DEFINITIONS[tag.type];
                return (
                  <g
                    key={tag.id}
                    transform={`translate(${target.x + 14}, ${target.y - 14})`}
                    className="cursor-pointer group"
                    onClick={() => handleRemoveTag(tag.id)}
                  >
                    <rect
                      x="-9"
                      y="-9"
                      width="18"
                      height="18"
                      rx="4"
                      fill={def.color}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="transition-transform group-hover:scale-125"
                    />
                    <text x="0" y="3.5" fill="#ffffff" fontSize="9" fontWeight="extrabold" textAnchor="middle">
                      🔒
                    </text>
                    <title>{`[${def.label}] ${tag.workOrder ? `WO: ${tag.workOrder}` : ''} - Click to remove tag`}</title>
                  </g>
                );
              })}

              {/* ==================== 10. DIRECTIONAL POWER FLOW VECTOR BADGES (P/Q/PF) ==================== */}
              {layers.powerFlow && (
                <g id="power-flow-vector-badges-layer">
                  {/* TR-1 Infeed */}
                  <SldPowerFlowVectorBadge
                    x={255}
                    y={315}
                    pMW={sw1.hvBreaker52_1 && isTR1_PrimLive ? tr1State.activePower / 1000 : 0}
                    qMVAR={sw1.hvBreaker52_1 && isTR1_PrimLive ? tr1State.reactivePower / 1000 : 0}
                    pf={tr1State.pf || 0.95}
                    loadingPct={(tr1State.loadCurrent / 600) * 100}
                  />
                  {/* TR-2 Infeed */}
                  <SldPowerFlowVectorBadge
                    x={745}
                    y={315}
                    pMW={sw2.hvBreaker52_4 && isTR2_PrimLive ? tr2State.activePower / 1000 : 0}
                    qMVAR={sw2.hvBreaker52_4 && isTR2_PrimLive ? tr2State.reactivePower / 1000 : 0}
                    pf={tr2State.pf || 0.95}
                    loadingPct={(tr2State.loadCurrent / 600) * 100}
                  />
                  {/* Feeder 1 - City */}
                  <SldPowerFlowVectorBadge
                    x={185}
                    y={555}
                    pMW={sw1.feederCity52_7 && isMVBus1Live ? 9.85 : 0}
                    qMVAR={sw1.feederCity52_7 && isMVBus1Live ? 2.87 : 0}
                    pf={0.96}
                    loadingPct={68}
                  />
                  {/* Feeder 2 - Industrial */}
                  <SldPowerFlowVectorBadge
                    x={285}
                    y={555}
                    pMW={sw1.feederInd52_8 && isMVBus1Live ? 7.74 : 0}
                    qMVAR={sw1.feederInd52_8 && isMVBus1Live ? 3.42 : 0}
                    pf={0.91}
                    loadingPct={54}
                  />
                  {/* Feeder 3 - Commercial */}
                  <SldPowerFlowVectorBadge
                    x={665}
                    y={555}
                    pMW={sw1.feederComm52_9 && isMVBus2Live ? 6.42 : 0}
                    qMVAR={sw1.feederComm52_9 && isMVBus2Live ? 1.55 : 0}
                    pf={0.97}
                    loadingPct={45}
                  />
                  {/* Feeder 4 - BESS / Solar */}
                  <SldPowerFlowVectorBadge
                    x={765}
                    y={555}
                    pMW={sw1.feederBess52_B && isMVBus2Live ? (bessDischarging ? 8.4 : -2.1) : 0}
                    qMVAR={sw1.feederBess52_B && isMVBus2Live ? 1.2 : 0}
                    pf={0.99}
                    loadingPct={62}
                  />
                  {/* Feeder 5 - Station Aux */}
                  <SldPowerFlowVectorBadge
                    x={860}
                    y={555}
                    pMW={sw1.tertiaryBreaker && isMVBus2Live ? 0.45 : 0}
                    qMVAR={sw1.tertiaryBreaker && isMVBus2Live ? 0.12 : 0}
                    pf={0.98}
                    loadingPct={18}
                  />
                  {/* Bay 07: VSC-HVDC Transmission Intertie */}
                  <SldPowerFlowVectorBadge
                    x={1020}
                    y={320}
                    pMW={isHVDC_AC_Live ? hvdcState.activePowerMW : 0}
                    qMVAR={isHVDC_AC_Live ? hvdcState.reactivePowerMVAR : 0}
                    pf={0.99}
                    loadingPct={isHVDC_AC_Live ? Math.min(100, (Math.abs(hvdcState.activePowerMW) / 500) * 100) : 0}
                  />
                </g>
              )}

              {/* ==================== 11. PROTECTION ZONES OVERLAY ==================== */}
              <SldProtectionZoneOverlay visible={!!layers.protectionZones} />

              {/* ==================== 12. BREAKER SWITCHING ARC FLASH MICRO-ANIMATION ==================== */}
              <SldBreakerArcEffect activeArc={activeArc} />

              {/* ==================== 13. EMBEDDED TELEMETRY MINI-SPARKLINES ==================== */}
              {layers.miniSparklines && (
                <g id="mini-sparklines-layer">
                  <SldMiniSparkline x={305} y={245} data={tr1TempHistory} label="TR-1 Oil" unit="°C" color="#f59e0b" />
                  <SldMiniSparkline x={795} y={245} data={tr2TempHistory} label="TR-2 Oil" unit="°C" color="#f59e0b" />
                  <SldMiniSparkline x={155} y={535} data={feeder1MwHistory} label="Feeder 1" unit="MW" color="#38bdf8" />
                  <SldMiniSparkline x={735} y={535} data={feeder4MwHistory} label="Solar+BESS" unit="MW" color="#10b981" />
                  <SldMiniSparkline x={435} y={445} data={sf6PressHistory} label="SF6 Press" unit="bar" color="#a855f7" />
                </g>
              )}
            </svg>

            {/* Floating Glassmorphism Controls Dock */}
            <SldFloatingGlassDock
              zoom={zoom}
              onZoomChange={(newZoom) => setZoom(newZoom)}
              onResetView={() => {
                setZoom(1.0);
                setPan({ x: 0, y: 0 });
                setFocusedBay('ALL');
              }}
              showMinimap={showMinimap}
              onToggleMinimap={() => setShowMinimap(!showMinimap)}
              layers={layers}
              setLayers={setLayers}
              themeMode={themeMode}
              onToggleThemeMode={() => setThemeMode(themeMode === 'ISA_101' ? 'CYBERPUNK' : 'ISA_101')}
              isSynchroHudOpen={isSynchroHudOpen}
              onToggleSynchroHud={() => setIsSynchroHudOpen(!isSynchroHudOpen)}
            />

            {/* Floating Synchroscope HUD */}
            {isSynchroHudOpen && (
              <SldSynchroscopeHud
                busAVoltage={isBusALive ? tr1State.gridVoltage : 0}
                busBVoltage={isBusBLive ? (tr2State.gridVoltage || 132.0) : 0}
                busAFrequency={tr1State.frequency || 50.0}
                busBFrequency={50.02}
                phaseAngleDeltaDeg={2.4}
                isBreakerClosed={sw1.busCoupler52_0}
                onClose={() => setIsSynchroHudOpen(false)}
                onExecuteSyncClose={() => handleExecuteSwitch('TR-1', 'busCoupler52_0')}
              />
            )}

            {/* Hover Real-time Process Bus Scope HUD */}
            {hoverTelemetry && (
              <SldProcessBusHoverScope
                telemetry={hoverTelemetry.telemetry}
                position={hoverTelemetry.pos}
                onClose={() => setHoverTelemetry(null)}
              />
            )}
            {/* Remote device-lock indicator */}
            {(() => {
              const nowMs = Date.now();
              const activeLocks = Object.values(lockedDevices).filter((lk) => lk.lockExpiry > nowMs);
              if (activeLocks.length === 0) return null;
              return (
                <div className="absolute bottom-16 left-6 z-20 pointer-events-none select-none">
                  <div className="bg-rose-950/85 backdrop-blur-md border border-rose-700/70 rounded-full px-4 py-1.5 font-mono text-[10px] font-bold text-rose-200 flex items-center gap-2 shadow-lg">
                    <Lock className="w-3 h-3" aria-hidden="true" />
                    <span>{activeLocks.length} locked:</span>
                    {activeLocks.map((lk) => (
                      <span key={lk.deviceKey} className="text-rose-100">
                        {lk.deviceKey} ({Math.ceil((lk.lockExpiry - nowMs) / 1000)}s)
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
            {/* Floating Navigation Minimap */}
            {showMinimap && (
              <div className="absolute bottom-16 right-6 z-20">
                <SldMinimap
                  zoom={zoom}
                  pan={pan}
                  onPanTo={(x, y) => setPan({ x, y })}
                  isBusALive={isBusALive}
                  isBusBLive={isBusBLive}
                  isMVBus1Live={isMVBus1Live}
                  isMVBus2Live={isMVBus2Live}
                  focusedBay={focusedBay}
                  onSelectBay={(bay) => setFocusedBay(bay)}
                />
              </div>
            )}
          </div>

          {/* Bottom Canvas Footer Status Bar */}
          <div className="flex flex-wrap justify-between items-center text-xs text-zinc-400 pt-3 border-t border-zinc-800/80 font-sans gap-2">
            <span className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Canvas Mode: Interactive Dispatch • Click any element to load into Inspector</span>
            </span>
            <span className="font-mono text-[11px] text-zinc-500">IEC 61850-9-2LE Process Bus Sync Lock: &lt; 34ns</span>
          </div>
        </div>

        {/* BAY TELEMETRY & CONTROL INSPECTOR SIDEBAR (4 COLS ON DESKTOP) */}
        <div className="lg:col-span-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 shadow-2xl flex flex-col justify-between space-y-4 font-sans">
          <div className="space-y-4">
            {/* Selected Equipment Header Card */}
            <div className="border-b border-zinc-800 pb-3 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800/80 tracking-wider">
                  {selectedItem.ansiCode} • {selectedItem.bay}
                </span>
                <h3 className="text-base font-extrabold text-zinc-100 mt-2 uppercase tracking-wide">
                  {selectedItem.name}
                </h3>
              </div>
              <span className="text-xs font-bold text-zinc-400 font-mono bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
                [{selectedItem.id}]
              </span>
            </div>

            {/* Inspector Tab Bar */}
            <div className="flex border-b border-zinc-800 text-xs font-bold">
              <button
                onClick={() => setInspectorTab('control')}
                className={`flex-1 py-2 border-b-2 text-center transition-colors cursor-pointer ${
                  inspectorTab === 'control' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t('control')}
              </button>
              <button
                onClick={() => setInspectorTab('telemetry')}
                className={`flex-1 py-2 border-b-2 text-center transition-colors cursor-pointer ${
                  inspectorTab === 'telemetry' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t('telemetry')}
              </button>
              <button
                onClick={() => setInspectorTab('protection')}
                className={`flex-1 py-2 border-b-2 text-center transition-colors cursor-pointer ${
                  inspectorTab === 'protection' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t('protection')}
              </button>
            </div>

            {/* TAB CONTENT 1: CONTROL & INTERLOCK COMMANDS */}
            {inspectorTab === 'control' && (
              <div className="space-y-3.5">
                {/* Current Status Card */}
                <div className="p-3.5 bg-zinc-900/90 rounded-xl border border-zinc-800 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block tracking-wider">{t('status')}</span>
                    <span
                      className={`text-sm font-extrabold flex items-center space-x-2 mt-0.5 ${
                        isSelectedClosed ? 'text-emerald-400' : 'text-zinc-400'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isSelectedClosed ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                      <span>{isSelectedClosed ? t('closed_live') : t('open_deenergized')}</span>
                    </span>
                  </div>
                  <div className="text-right text-xs font-mono">
                    <span className="text-[10px] text-zinc-500 block font-bold font-sans">OPERATIONS</span>
                    <span className="font-bold text-zinc-200">1,482 Cycles</span>
                  </div>
                </div>

                {/* Rating & Limits */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase block font-bold tracking-wider">Rated Voltage</span>
                    <span className="font-bold text-zinc-200 font-mono text-xs">{selectedItem.voltageRating}</span>
                  </div>
                  <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase block font-bold tracking-wider">Rated Current</span>
                    <span className="font-bold text-zinc-200 font-mono text-xs">{selectedItem.currentRating}</span>
                  </div>
                </div>

                {/* Safety Interlock Check Panel */}
                <div className="p-3.5 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Safety Interlock Matrix:</span>
                    <span className="text-emerald-400 font-bold px-2 py-0.5 bg-emerald-950 rounded text-[10px] border border-emerald-800">PASSED</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-zinc-300 pt-1">
                    <div className="flex items-center space-x-2 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>No Line-to-Ground Fault Latched</span>
                    </div>
                    <div className="flex items-center space-x-2 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Synchronism Check (25) Matched</span>
                    </div>
                    <div className="flex items-center space-x-2 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>SF6 Gas Pressure &gt; 5.8 Bar</span>
                    </div>
                  </div>
                </div>

                {/* Safety & Danger LOTO Tagging System */}
                <SldSafetyTagBar
                  selectedEquipmentId={selectedItem.id}
                  activeTags={activeTags}
                  onApplyTag={handleApplyTag}
                  onRemoveTag={handleRemoveTag}
                />

                {/* Command Confirmation Step / Execute Button */}
                {selectedItem.switchKey && selectedItem.trId ? (
                  <div className="p-3.5 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-2.5">
                    {pendingAction ? (
                      <div className="space-y-2.5 animate-pulse">
                        <p className="text-xs text-amber-300 font-bold">
                          ⚠️ Confirm {pendingAction.actionName} on [{selectedItem.id}]?
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleExecuteSwitch(pendingAction.trId, pendingAction.switchKey)}
                            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-lg"
                          >
                            CONFIRM EXECUTE
                          </button>
                          <button
                            onClick={() => setPendingAction(null)}
                            className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setPendingAction({
                            trId: selectedItem.trId!,
                            switchKey: selectedItem.switchKey!,
                            actionName: isSelectedClosed ? 'TRIP / OPEN' : 'CLOSE'
                          });
                        }}
                        className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg ${
                          isSelectedClosed
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-950/50'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                        <span>COMMAND: {isSelectedClosed ? 'TRIP / OPEN SWITCH' : 'CLOSE SWITCH'}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs text-zinc-400 text-center">
                    Passive Monitoring Asset — Select a circuit breaker or disconnector on the diagram to dispatch commands.
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: LIVE TELEMETRY */}
            {inspectorTab === 'telemetry' && (
              <div className="space-y-2 text-xs font-mono">
                {selectedItem.trId === 'HVDC' || selectedItem.bay.includes('HVDC') || selectedItem.id === 'VSC-MMC' ? (
                  <>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">Active Power P:</span>
                      <span className={`font-bold ${hvdcState.activePowerMW >= 0 ? 'text-emerald-400' : 'text-purple-400'}`}>
                        {hvdcState.activePowerMW >= 0 ? `+${hvdcState.activePowerMW.toFixed(1)} MW (IMPORT)` : `${hvdcState.activePowerMW.toFixed(1)} MW (EXPORT)`}
                      </span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">Reactive Power Q:</span>
                      <span className="font-bold text-cyan-300">
                        {hvdcState.reactivePowerMVAR >= 0 ? `+${hvdcState.reactivePowerMVAR.toFixed(1)} MVAR (CAP)` : `${hvdcState.reactivePowerMVAR.toFixed(1)} MVAR (IND)`}
                      </span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">DC Voltage (+ / -):</span>
                      <span className="font-bold text-amber-300">
                        {isHVDC_DC_Pos_Live ? `+${hvdcState.vdcPositiveKV.toFixed(1)}` : '0.0'} / {isHVDC_DC_Neg_Live ? `${hvdcState.vdcNegativeKV.toFixed(1)}` : '0.0'} kV (640kV Link)
                      </span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">DC Pole Current:</span>
                      <span className="font-bold text-zinc-200">
                        {isHVDC_AC_Live ? `${hvdcState.idcAmps.toFixed(1)} A` : '0.0 A'}
                      </span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">Submodules Status:</span>
                      <span className="font-bold text-emerald-400">
                        {hvdcState.healthySubmodules} / {hvdcState.totalSubmodules} Healthy (THD {(hvdcState.thdPercent ?? 0.85).toFixed(2)}%)
                      </span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">Coolant Temp / Flow:</span>
                      <span className="font-bold text-cyan-400">
                        {hvdcState.coolantTempC.toFixed(1)} °C • {(hvdcState.coolantFlowM3h ?? 18.7).toFixed(1)} m³/h
                      </span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">Control Mode:</span>
                      <span className="font-bold text-indigo-300 px-2 py-0.5 bg-indigo-950 rounded border border-indigo-800 text-[10px]">
                        {hvdcState.controlMode}
                      </span>
                    </div>
                    <div className="pt-2 grid grid-cols-2 gap-2 font-sans">
                      <button
                        onClick={() => setHvdcPqModalOpen(true)}
                        className="py-2 px-3 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-300 rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <span>📈 Dispatch P-Q</span>
                      </button>
                      <button
                        onClick={() => setHvdcDiagModalOpen(true)}
                        className="py-2 px-3 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-300 rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <span>🩺 Diagnostics</span>
                      </button>
                    </div>
                  </>
                ) : selectedItem.type === 'bess' || selectedItem.id === '52-B' ? (
                  <>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">BESS Active Power:</span>
                      <span className="font-bold text-purple-400">{bessDischarging ? '-8.4 MW (DISCHARGE)' : '+2.1 MW (CHARGE)'}</span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">State of Charge (SOC):</span>
                      <span className="font-bold text-emerald-400">84.2% (16.84 MWh)</span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">State of Health (SOH):</span>
                      <span className="font-bold text-cyan-300">98.6% Nominal</span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">DC Bus Link Voltage:</span>
                      <span className="font-bold text-zinc-200">840.5 V DC</span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">Battery Module Temp:</span>
                      <span className="font-bold text-emerald-400">23.8 °C (OPTIMAL)</span>
                    </div>
                  </>
                ) : selectedItem.type === 'feeder' ? (
                  <>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">Feeder Load Current:</span>
                      <span className="font-bold text-emerald-400">
                        {selectedItem.id === '52-7' ? (sw1.feederCity52_7 && isMVBus1Live ? '412.5 A' : '0.0 A') :
                         selectedItem.id === '52-8' ? (sw1.feederInd52_8 && isMVBus1Live ? '324.0 A' : '0.0 A') :
                         (sw1.feederComm52_9 && isMVBus2Live ? '268.4 A' : '0.0 A')}
                      </span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">Feeder Active Power:</span>
                      <span className="font-bold text-cyan-300">
                        {selectedItem.id === '52-7' ? (sw1.feederCity52_7 && isMVBus1Live ? '9.85 MW' : '0.0 MW') :
                         selectedItem.id === '52-8' ? (sw1.feederInd52_8 && isMVBus1Live ? '7.74 MW' : '0.0 MW') :
                         (sw1.feederComm52_9 && isMVBus2Live ? '6.42 MW' : '0.0 MW')}
                      </span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">Feeder Power Factor:</span>
                      <span className="font-bold text-zinc-200">0.96 Lagging</span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">Line Voltage:</span>
                      <span className="font-bold text-zinc-200">13.8 kV</span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">SF6 Gas Density:</span>
                      <span className="font-bold text-emerald-400">6.1 Bar (NOMINAL)</span>
                    </div>
                  </>
                ) : selectedItem.type === 'earthSwitch' ? (
                  <>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">Ground Loop Resistance:</span>
                      <span className="font-bold text-emerald-400">0.038 Ω</span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">Ground Current:</span>
                      <span className="font-bold text-zinc-200">0.00 A</span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">Interlock Status:</span>
                      <span className="font-bold text-amber-400">IL-105 DEAD BUS VERIFIED</span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">Earth Blade Alignment:</span>
                      <span className="font-bold text-emerald-400">100% CONTACT MESH</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">Phase A Current:</span>
                      <span className="font-bold text-emerald-400">
                        {selectedItem.trId === 'TR-2' ? (tr2State?.loadCurrent ?? 105.0).toFixed(1) : (tr1State?.loadCurrent ?? 122.5).toFixed(1)} A
                      </span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">Grid Line Voltage:</span>
                      <span className="font-bold text-zinc-200">
                        {selectedItem.trId === 'TR-2' ? (isBusBLive ? `${(tr2State?.gridVoltage ?? 132).toFixed(1)} kV` : '0.0 kV') : (isBusALive ? `${(tr1State?.gridVoltage ?? 132).toFixed(1)} kV` : '0.0 kV')}
                      </span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">Secondary CT Output:</span>
                      <span className="font-bold text-cyan-300">
                        {selectedItem.trId === 'TR-2' ? (tr2State?.ctSecA ?? 1.75).toFixed(2) : (tr1State?.ctSecA ?? 2.04).toFixed(2)} A (CT 300/5)
                      </span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">CT Burden:</span>
                      <span className="font-bold text-zinc-200">
                        {selectedItem.trId === 'TR-2' ? (tr2State?.ctBurdenVA ?? 12.5).toFixed(1) : (tr1State?.ctBurdenVA ?? 12.5).toFixed(1)} VA
                      </span>
                    </div>
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400 font-sans">SF6 Gas Density:</span>
                      <span className="font-bold text-emerald-400">6.2 Bar (NOMINAL)</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: PROTECTION RELAYS */}
            {inspectorTab === 'protection' && (
              <div className="space-y-2 text-xs font-sans">
                {selectedItem.trId === 'HVDC' || selectedItem.bay.includes('HVDC') || selectedItem.id === 'VSC-MMC' ? (
                  <>
                    <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-blue-400">ANSI 87V MMC Valve Differential</span>
                        <span className="text-emerald-400 font-mono">ARMED</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono">I_diff = 0.01 A &lt; I_trip (0.15 pu)</p>
                    </div>
                    <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-amber-400">ANSI 50DC High-Speed DC Overcurrent</span>
                        <span className="text-emerald-400 font-mono">ARMED (&lt; 2.5ms)</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono">I_dc_peak: {hvdcState.idcAmps.toFixed(1)} A / Limit: 3,500 A</p>
                    </div>
                    <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-purple-400">ANSI 27DC / 59DC DC Pole Voltage</span>
                        <span className="text-emerald-400 font-mono">NORMAL</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono">Pole Vdc: ±320kV (Threshold: 260kV - 360kV)</p>
                    </div>
                    <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-rose-400">Protection Trip State:</span>
                        <span className={`font-mono font-bold ${hvdcProtectionLatched ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                          {hvdcProtectionLatched ? 'LATCHED TRIP' : 'NORMAL / CLEAR'}
                        </span>
                      </div>
                      {hvdcProtectionLatched && (
                        <p className="text-[11px] text-rose-300 font-bold">Reason: {hvdcState.faultState === 'NONE' ? 'High-Speed Interruption' : hvdcState.faultState.replace(/_/g, ' ')}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-amber-400">ANSI 87T Differential Relay</span>
                        <span className="text-emerald-400 font-mono">ARMED</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono">I_diff = 0.02 A &lt; I_pickup (0.20 A)</p>
                    </div>
                    <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-cyan-400">ANSI 50/51 Overcurrent</span>
                        <span className="text-emerald-400 font-mono">ARMED</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono">Curve: IEC Very Inverse (TMS 0.15)</p>
                    </div>
                    <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-purple-400">ANSI 27/59 Voltage Relay</span>
                        <span className="text-emerald-400 font-mono">NORMAL</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono">V_min: 0.90 pu / V_max: 1.10 pu</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Diagnostic Modals Trigger Shortcuts */}
          <div className="pt-3 border-t border-zinc-800 space-y-2">
            <span className="text-[10px] text-zinc-400 uppercase font-bold block tracking-wider">Direct Diagnostic Inspectors:</span>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-sans">
              <button
                onClick={() => setDuvalModalTr('TR-1')}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-purple-300 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="font-bold text-[10px]">Duval DGA</span>
                <ChevronRight className="w-3 h-3 text-zinc-500" />
              </button>
              <button
                onClick={() => setComtradeModalAsset('CT-1 Protection Relay')}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-300 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="font-bold text-[10px]">COMTRADE</span>
                <ChevronRight className="w-3 h-3 text-zinc-500" />
              </button>
              <button
                onClick={() => setMuModalData({ id: 'MU-01', dev: 'CT-1 Primary Bay' })}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-300 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="font-bold text-[10px]">Merging Unit</span>
                <ChevronRight className="w-3 h-3 text-zinc-500" />
              </button>
              <button
                onClick={() => setTakagiModalData({ feeder: 'City Feeder 01', dist: 14.2, tower: 'Tower #6' })}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-rose-300 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="font-bold text-[10px]">Takagi Pin</span>
                <ChevronRight className="w-3 h-3 text-zinc-500" />
              </button>
              <button
                onClick={() => setHvdcPqModalOpen(true)}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-blue-300 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="font-bold text-[10px]">HVDC P-Q</span>
                <ChevronRight className="w-3 h-3 text-zinc-500" />
              </button>
              <button
                onClick={() => setHvdcDiagModalOpen(true)}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-300 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="font-bold text-[10px]">HVDC MMC</span>
                <ChevronRight className="w-3 h-3 text-zinc-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS RENDER SECTION */}
      {duvalModalTr && <DuvalTriangleModal trId={duvalModalTr} onClose={() => setDuvalModalTr(null)} />}
      {comtradeModalAsset && <ComtradeViewerModal assetName={comtradeModalAsset} onClose={() => setComtradeModalAsset(null)} />}
      {takagiModalData && (
        <TakagiFaultModal
          feederName={takagiModalData.feeder}
          distanceKm={takagiModalData.dist}
          towerNo={takagiModalData.tower}
          onClose={() => setTakagiModalData(null)}
        />
      )}
      {uhfModalData && (
        <UhfThermalModal
          trId={uhfModalData.trId}
          location={uhfModalData.loc}
          pdAmplitude={uhfModalData.pd}
          bushingTemp={uhfModalData.temp}
          onClose={() => setUhfModalData(null)}
        />
      )}
      {muModalData && <MergingUnitModal muId={muModalData.id} associatedDevice={muModalData.dev} onClose={() => setMuModalData(null)} />}
      {macroModalType && <MacroPreviewModal macroType={macroModalType} onClose={() => { setMacroModalType(null); setPreviewMacroPath(null); }} />}

      {/* NEW ADVANCED SLD MODALS */}
      {synchroModalData && (
        <SynchrocheckModal
          bayName={synchroModalData.bayName}
          sourceAVoltage={synchroModalData.vA}
          sourceBVoltage={synchroModalData.vB}
          frequency={tr1State.frequency || 50.0}
          onClose={() => setSynchroModalData(null)}
        />
      )}
      {arcFlashModalData && (
        <ArcFlashHazardModal
          locationId={arcFlashModalData.id}
          bayName={arcFlashModalData.bay}
          voltageRating={arcFlashModalData.v}
          boltedFaultCurrentKa={arcFlashModalData.ik}
          clearingTimeMs={arcFlashModalData.t}
          workingDistanceInches={arcFlashModalData.d}
          onClose={() => setArcFlashModalData(null)}
        />
      )}
      {txModalData && (
        <InstrumentTransformerModal
          txType={txModalData.type}
          tag={txModalData.tag}
          name={txModalData.name}
          bay={txModalData.bay}
          primaryRating={txModalData.pri}
          secondaryRating={txModalData.sec}
          accuracyClass={txModalData.acc}
          burdenVA={txModalData.burden}
          onClose={() => setTxModalData(null)}
        />
      )}
      {powModalData && (
        <PointOnWaveModal
          breakerId={powModalData.id}
          breakerName={powModalData.name}
          bayName={powModalData.bay}
          loadType={powModalData.loadType}
          onClose={() => setPowModalData(null)}
        />
      )}
      {iecInspectorOpen && (
        <Iec61850PacketInspectorModal onClose={() => setIecInspectorOpen(false)} />
      )}

      {/* HVDC ADVANCED MODALS */}
      {hvdcPqModalOpen && <HvdcPqCapabilityModal onClose={() => setHvdcPqModalOpen(false)} />}
      {hvdcDiagModalOpen && <HvdcDiagnosticsModal onClose={() => setHvdcDiagModalOpen(false)} />}

      {/* Floating Hover Interlock HUD */}
      <SldHoverInterlockHud info={hoverInterlock?.info ?? null} position={hoverInterlock?.pos ?? null} />
    </div>
  );
};

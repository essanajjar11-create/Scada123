import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  Zap,
  Cpu,
  GitBranch,
  BellRing,
  TrendingUp,
  Waves,
  SlidersHorizontal,
  Sparkles,
  Activity,
  Box,
  Thermometer,
  LineChart,
  ShieldAlert,
  Coins,
  HeartPulse,
  GraduationCap,
  BatteryCharging,
  ListOrdered,
  BarChart3,
  Globe,
  Sun,
  RotateCcw,
  Lock,
  Award,
  Server,
  Compass,
  FileCode,
  ShieldCheck,
  Leaf,
  Radio,
  Gauge,
  Key,
  Flame,
  Search,
  ChevronDown,
  Layers,
  Check,
  X
} from 'lucide-react';
import { useScada } from '../../context/ScadaContext';
import { SUBSTATION_EQUIPMENT_REGISTRY } from '../sld/SldEquipmentSearch';

export type TabId =
  | 'overview'
  | 'sld'
  | 'hvdc_intertie'
  | 'iec61850_scl'
  | 'green_hydrogen'
  | 'tdr_fault_locator'
  | 'sf6_watchdog'
  | 'blockchain_ledger'
  | 'transformer_thermal'
  | 'solar_pv'
  | 'black_start'
  | 'loto_ptw'
  | 'engineering_reports'
  | 'protocols'
  | 'distance_21'
  | 'diff_87t'
  | 'sc_60909'
  | 'comtrade_gen'
  | 'wams_pmu'
  | 'threed_twin'
  | 'dtr_rating'
  | 'tcc_protection'
  | 'ot_cyber_range'
  | 'switching_seq'
  | 'pq_harmonics'
  | 'regional_grid'
  | 'transient_stability'
  | 'loss_economics'
  | 'ahi_dashboard'
  | 'ots_simulator'
  | 'bess_scheduler'
  | 'power'
  | 'rts'
  | 'alarms'
  | 'trends'
  | 'settings'
  | 'advanced';

export type HubId =
  | 'hub_operations'
  | 'hub_protection'
  | 'hub_renewables'
  | 'hub_safety'
  | 'hub_analytics';

export interface SubTabDefinition {
  id: TabId;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
  badge?: number;
  highlight?: boolean;
}

export interface HubDefinition {
  id: HubId;
  titleKey: string;
  descKey: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  accentBorder: string;
  accentBg: string;
  activeBg: string;
  activeText: string;
  glowColor: string;
  tabs: SubTabDefinition[];
}

interface NavbarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isSearchOpen?: boolean;
  setIsSearchOpen?: (open: boolean | ((prev: boolean) => boolean)) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isSearchOpen: propIsSearchOpen,
  setIsSearchOpen: propSetIsSearchOpen
}) => {
  const { alarms, t, outdoorTheme } = useScada();
  const [internalSearchOpen, setInternalSearchOpen] = useState(false);
  const isSearchOpen = propIsSearchOpen !== undefined ? propIsSearchOpen : internalSearchOpen;
  const setIsSearchOpen = propSetIsSearchOpen || setInternalSearchOpen;
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdownHub, setOpenDropdownHub] = useState<HubId | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const unackedAlarmsCount = alarms.filter((a) => a.state === 'active_unacked').length;

  // Define the 5 Smart Hubs with complete sub-tabs mapping
  const hubs: HubDefinition[] = useMemo(
    () => [
      {
        id: 'hub_operations',
        titleKey: 'hub_operations_title',
        descKey: 'hub_operations_desc',
        icon: Zap,
        accentColor: 'text-cyan-400',
        accentBorder: 'border-cyan-500/50',
        accentBg: 'bg-cyan-950/40',
        activeBg: 'bg-cyan-600',
        activeText: 'text-white',
        glowColor: 'shadow-cyan-500/20',
        tabs: [
          { id: 'overview', labelKey: 'overview', icon: LayoutDashboard },
          { id: 'sld', labelKey: 'sld_diagram', icon: GitBranch, highlight: true },
          { id: 'threed_twin', labelKey: 'threed_twin', icon: Box, highlight: true },
          { id: 'rts', labelKey: 'switchgear_rts', icon: Cpu },
          { id: 'power', labelKey: 'power_energy', icon: Zap },
          { id: 'trends', labelKey: 'trend_charts', icon: TrendingUp },
          { id: 'transformer_thermal', labelKey: 'transformer_thermal_tab', icon: Flame, highlight: true },
          { id: 'sf6_watchdog', labelKey: 'sf6_watchdog_tab', icon: Gauge, highlight: true },
        ],
      },
      {
        id: 'hub_protection',
        titleKey: 'hub_protection_title',
        descKey: 'hub_protection_desc',
        icon: ShieldCheck,
        accentColor: 'text-emerald-400',
        accentBorder: 'border-emerald-500/50',
        accentBg: 'bg-emerald-950/40',
        activeBg: 'bg-emerald-600',
        activeText: 'text-white',
        glowColor: 'shadow-emerald-500/20',
        tabs: [
          { id: 'distance_21', labelKey: 'distance_protection_tab', icon: Compass, highlight: true },
          { id: 'diff_87t', labelKey: 'diff_protection_tab', icon: ShieldCheck, highlight: true },
          { id: 'sc_60909', labelKey: 'sc_60909_tab', icon: Zap, highlight: true },
          { id: 'tcc_protection', labelKey: 'tcc_protection', icon: LineChart, highlight: true },
          { id: 'protocols', labelKey: 'protocol_emulator_tab', icon: Server, highlight: true },
          { id: 'comtrade_gen', labelKey: 'comtrade_gen_tab', icon: FileCode, highlight: true },
          { id: 'wams_pmu', labelKey: 'wams_pmu', icon: Activity, highlight: true },
          { id: 'iec61850_scl', labelKey: 'iec61850_scl_tab', icon: FileCode, highlight: true },
        ],
      },
      {
        id: 'hub_renewables',
        titleKey: 'hub_renewables_title',
        descKey: 'hub_renewables_desc',
        icon: Sun,
        accentColor: 'text-amber-400',
        accentBorder: 'border-amber-500/50',
        accentBg: 'bg-amber-950/40',
        activeBg: 'bg-amber-600',
        activeText: 'text-white',
        glowColor: 'shadow-amber-500/20',
        tabs: [
          { id: 'solar_pv', labelKey: 'solar_pv_microgrid', icon: Sun, highlight: true },
          { id: 'bess_scheduler', labelKey: 'bess_scheduler', icon: BatteryCharging, highlight: true },
          { id: 'regional_grid', labelKey: 'regional_grid', icon: Globe, highlight: true },
          { id: 'transient_stability', labelKey: 'transient_stability_tab', icon: Waves, highlight: true },
          { id: 'pq_harmonics', labelKey: 'pq_harmonics', icon: BarChart3, highlight: true },
          { id: 'dtr_rating', labelKey: 'dtr_rating', icon: Thermometer, highlight: true },
          { id: 'green_hydrogen', labelKey: 'green_hydrogen_tab', icon: Leaf, highlight: true },
          { id: 'hvdc_intertie', labelKey: 'hvdc_tab', icon: Globe, highlight: true },
        ],
      },
      {
        id: 'hub_safety',
        titleKey: 'hub_safety_title',
        descKey: 'hub_safety_desc',
        icon: ShieldAlert,
        accentColor: 'text-rose-400',
        accentBorder: 'border-rose-500/50',
        accentBg: 'bg-rose-950/40',
        activeBg: 'bg-rose-600',
        activeText: 'text-white',
        glowColor: 'shadow-rose-500/20',
        tabs: [
          { id: 'alarms', labelKey: 'alarm_system', icon: BellRing, badge: unackedAlarmsCount },
          { id: 'black_start', labelKey: 'black_start_wizard', icon: RotateCcw, highlight: true },
          { id: 'loto_ptw', labelKey: 'loto_ptw_system', icon: Lock, highlight: true },
          { id: 'ots_simulator', labelKey: 'ots_simulator', icon: GraduationCap, highlight: true },
          { id: 'ot_cyber_range', labelKey: 'ot_cyber_range', icon: ShieldAlert, highlight: true },
          { id: 'switching_seq', labelKey: 'switching_seq', icon: ListOrdered, highlight: true },
        ],
      },
      {
        id: 'hub_analytics',
        titleKey: 'hub_analytics_title',
        descKey: 'hub_analytics_desc',
        icon: BarChart3,
        accentColor: 'text-indigo-400',
        accentBorder: 'border-indigo-500/50',
        accentBg: 'bg-indigo-950/40',
        activeBg: 'bg-indigo-600',
        activeText: 'text-white',
        glowColor: 'shadow-indigo-500/20',
        tabs: [
          { id: 'engineering_reports', labelKey: 'engineering_reports_tab', icon: Award, highlight: true },
          { id: 'ahi_dashboard', labelKey: 'ahi_dashboard', icon: HeartPulse, highlight: true },
          { id: 'loss_economics', labelKey: 'loss_economics', icon: Coins, highlight: true },
          { id: 'advanced', labelKey: 'advanced_suite', icon: Sparkles },
          { id: 'settings', labelKey: 'settings_faults', icon: SlidersHorizontal },
          { id: 'blockchain_ledger', labelKey: 'blockchain_ledger_tab', icon: Key, highlight: true },
          { id: 'tdr_fault_locator', labelKey: 'tdr_fault_locator_tab', icon: Radio, highlight: true },
        ],
      },
    ],
    [unackedAlarmsCount]
  );

  // Determine which Hub currently owns the activeTab
  const activeHubId = useMemo<HubId>(() => {
    for (const hub of hubs) {
      if (hub.tabs.some((t) => t.id === activeTab)) {
        return hub.id;
      }
    }
    return 'hub_operations';
  }, [activeTab, hubs]);

  // Selected Hub (can be active tab's hub or operator browsing another hub)
  const [selectedHubId, setSelectedHubId] = useState<HubId>(activeHubId);

  // Sync selectedHubId whenever activeTab changes
  useEffect(() => {
    setSelectedHubId(activeHubId);
  }, [activeHubId]);

  const activeHub = useMemo(
    () => hubs.find((h) => h.id === selectedHubId) || hubs[0],
    [hubs, selectedHubId]
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownHub(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global hotkey Ctrl+K to open Quick Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setOpenDropdownHub(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Handle clicking a Hub card
  const handleHubClick = (hub: HubDefinition) => {
    setSelectedHubId(hub.id);
    // If the active tab is not in this hub, switch to the first tab of this hub
    if (!hub.tabs.some((t) => t.id === activeTab)) {
      setActiveTab(hub.tabs[0].id);
    }
  };

  // Flattened list of all tabs for quick search
  const allTabsFlattened = useMemo(() => {
    return hubs.flatMap((hub) =>
      hub.tabs.map((tab) => ({
        ...tab,
        hubId: hub.id,
        hubTitle: t(hub.titleKey),
        hubColor: hub.accentColor,
        hubIcon: hub.icon,
      }))
    );
  }, [hubs, t]);

  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return allTabsFlattened;
    const q = searchQuery.toLowerCase().trim();
    return allTabsFlattened.filter((item) => {
      const label = t(item.labelKey).toLowerCase();
      const hubTitle = item.hubTitle.toLowerCase();
      const id = item.id.toLowerCase();
      return label.includes(q) || hubTitle.includes(q) || id.includes(q);
    });
  }, [allTabsFlattened, searchQuery, t]);

  const filteredEquipmentResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return SUBSTATION_EQUIPMENT_REGISTRY.filter((eq) =>
      eq.id.toLowerCase().includes(q) ||
      eq.name.toLowerCase().includes(q) ||
      eq.bay.toLowerCase().includes(q) ||
      eq.voltage.toLowerCase().includes(q) ||
      eq.ansiCode.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div
      ref={dropdownRef}
      className={`border-b transition-colors ${
        outdoorTheme
          ? 'bg-amber-100/90 border-amber-300 text-zinc-900'
          : 'bg-[#09090b] border-zinc-800/80 text-zinc-100'
      }`}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. PRIMARY HUB BAR (5 Smart Categories)
      ───────────────────────────────────────────────────────────── */}
      <div className="px-3 sm:px-6 pt-2.5 pb-2">
        <div className="flex items-center justify-between gap-2">
          {/* 5 Hub Tabs Grid / Horizontal Scroll */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto scrollbar-none py-0.5 flex-1">
            {hubs.map((hub) => {
              const HubIcon = hub.icon;
              const isCurrentHub = selectedHubId === hub.id;
              const hasActiveTab = hub.tabs.some((t) => t.id === activeTab);
              const hubUnackedAlarms = hub.id === 'hub_safety' ? unackedAlarmsCount : 0;

              return (
                <div key={hub.id} className="relative shrink-0">
                  <button
                    id={`hub-btn-${hub.id}`}
                    onClick={() => handleHubClick(hub)}
                    onMouseEnter={() => setOpenDropdownHub(hub.id)}
                    className={`group relative flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 rounded-xl font-sans transition-all duration-200 border cursor-pointer ${
                      isCurrentHub
                        ? `${
                            outdoorTheme
                              ? 'bg-white text-zinc-950 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                              : `${hub.accentBg} text-white ${hub.accentBorder} shadow-lg ${hub.glowColor} ring-1 ring-white/10`
                          }`
                        : `${
                            outdoorTheme
                              ? 'bg-amber-200/50 text-zinc-700 hover:bg-white/80 hover:text-zinc-950 border-amber-300/60'
                              : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border-zinc-800/90'
                          }`
                    }`}
                  >
                    {/* Hub Icon with subtle glow */}
                    <div
                      className={`p-1 rounded-lg transition-transform duration-200 group-hover:scale-110 ${
                        isCurrentHub
                          ? `${hub.activeBg} text-white shadow-sm`
                          : outdoorTheme
                          ? 'bg-amber-300/60 text-zinc-800'
                          : 'bg-zinc-800 text-zinc-400 group-hover:text-white'
                      }`}
                    >
                      <HubIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>

                    {/* Hub Titles */}
                    <div className="text-left rtl:text-right">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap ${
                            isCurrentHub
                              ? 'text-white font-black'
                              : outdoorTheme
                              ? 'text-zinc-900'
                              : 'text-zinc-300 group-hover:text-white'
                          }`}
                        >
                          {t(hub.titleKey)}
                        </span>

                        {/* Unacknowledged alarm badge */}
                        {hubUnackedAlarms > 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-rose-600 text-white animate-pulse shadow-sm shadow-rose-600/50">
                            {hubUnackedAlarms}
                          </span>
                        )}
                      </div>
                      <div className="hidden xl:block text-[10px] text-zinc-500 font-mono truncate max-w-[180px]">
                        {hub.tabs.length} {t('hub_active_subtabs').replace(':', '')}
                      </div>
                    </div>

                    {/* Active Tab Dot Indicator */}
                    {hasActiveTab && !isCurrentHub && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping absolute top-1.5 right-1.5 rtl:right-auto rtl:left-1.5" />
                    )}

                    {/* Chevron Dropdown Trigger */}
                    <ChevronDown
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownHub(openDropdownHub === hub.id ? null : hub.id);
                      }}
                      className={`w-3.5 h-3.5 transition-transform text-zinc-500 hover:text-zinc-300 hidden sm:block ${
                        openDropdownHub === hub.id ? 'rotate-180 text-white' : ''
                      }`}
                    />

                    {/* Bottom Active Glow Strip */}
                    {isCurrentHub && (
                      <span
                        className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full ${
                          outdoorTheme ? 'bg-amber-600' : hub.activeBg
                        }`}
                      />
                    )}
                  </button>

                  {/* ─────────────────────────────────────────────────────────────
                      HUB HOVER/CLICK DROPDOWN POPUP
                  ───────────────────────────────────────────────────────────── */}
                  {openDropdownHub === hub.id && (
                    <div
                      onMouseLeave={() => setOpenDropdownHub(null)}
                      className={`absolute top-full mt-2 z-50 min-w-[260px] p-2 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
                        outdoorTheme
                          ? 'bg-white/95 border-amber-300 text-zinc-900 shadow-amber-900/10'
                          : 'bg-[#121215]/95 border-zinc-800 text-zinc-200 shadow-black/80'
                      }`}
                      style={{ left: 0 }}
                    >
                      <div className="px-2.5 py-1.5 border-b border-zinc-800/60 mb-1 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                          {t(hub.titleKey)}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {hub.tabs.length} tabs
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        {hub.tabs.map((tab) => {
                          const TabIcon = tab.icon;
                          const isTabActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                setActiveTab(tab.id);
                                setSelectedHubId(hub.id);
                                setOpenDropdownHub(null);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left rtl:text-right cursor-pointer ${
                                isTabActive
                                  ? `${hub.activeBg} text-white font-bold shadow-sm`
                                  : outdoorTheme
                                  ? 'hover:bg-amber-100 text-zinc-800'
                                  : 'hover:bg-zinc-800/80 text-zinc-300 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <TabIcon className={`w-3.5 h-3.5 ${isTabActive ? 'text-white' : 'text-zinc-400'}`} />
                                <span>{t(tab.labelKey)}</span>
                              </div>
                              {tab.badge !== undefined && tab.badge > 0 && (
                                <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded-full bg-rose-600 text-white animate-pulse">
                                  {tab.badge}
                                </span>
                              )}
                              {isTabActive && <Check className="w-3.5 h-3.5 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SECONDARY SUB-TAB BAR (Active Hub Modules)
      ───────────────────────────────────────────────────────────── */}
      <div
        className={`px-3 sm:px-6 py-2 border-t flex items-center gap-2 overflow-x-auto scrollbar-none ${
          outdoorTheme
            ? 'bg-amber-200/40 border-amber-300/80'
            : 'bg-[#0e0e11] border-zinc-800/60'
        }`}
      >
        {/* Active Hub Label Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800/80 text-zinc-400 shrink-0 text-[11px] font-mono">
          <Layers className="w-3 h-3 text-zinc-500" />
          <span className="font-bold text-zinc-300">{t(activeHub.titleKey)}</span>
          <span className="text-zinc-600">/</span>
        </div>

        {/* Sub-tabs List */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 overflow-x-auto scrollbar-none py-0.5">
          {activeHub.tabs.map((tab) => {
            const SubIcon = tab.icon;
            const isSubActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-sans text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer relative border shrink-0 ${
                  isSubActive
                    ? `${activeHub.activeBg} text-white border-transparent shadow-md ${activeHub.glowColor} scale-[1.02] font-bold`
                    : outdoorTheme
                    ? 'bg-white/80 text-zinc-700 hover:bg-white hover:text-zinc-950 border-amber-300/80'
                    : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/90 border-zinc-800/80'
                }`}
              >
                <SubIcon
                  className={`w-3.5 h-3.5 ${
                    isSubActive
                      ? 'text-white'
                      : outdoorTheme
                      ? 'text-zinc-600'
                      : 'text-zinc-400'
                  }`}
                />
                <span className="tracking-tight">{t(tab.labelKey)}</span>

                {/* Alarm Badge Count */}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-rose-600 text-white animate-pulse shadow-sm shadow-rose-600/50">
                    {tab.badge}
                  </span>
                )}

                {/* Active Pill Dot */}
                {isSubActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. GLOBAL QUICK SEARCH & MODULE COMMAND MODAL (Ctrl+K)
      ───────────────────────────────────────────────────────────── */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ${
              outdoorTheme
                ? 'bg-white border-amber-400 text-zinc-900 shadow-amber-900/20'
                : 'bg-[#121215] border-zinc-700 text-zinc-100 shadow-black'
            }`}
          >
            {/* Search Input Bar */}
            <div className="p-4 border-b border-zinc-800/80 flex items-center gap-3">
              <Search className="w-5 h-5 text-indigo-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('hub_quick_search')}
                className="w-full bg-transparent border-none outline-none font-sans text-sm sm:text-base text-zinc-100 placeholder-zinc-500"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results categorized by Hub */}
            <div className="p-3 overflow-y-auto space-y-4 flex-1">
              {filteredSearchResults.length === 0 && filteredEquipmentResults.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 font-sans text-sm">
                  No SCADA modules or equipment matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                <>
                  {hubs.map((hub) => {
                    const hubResults = filteredSearchResults.filter((r) => r.hubId === hub.id);
                    if (hubResults.length === 0) return null;

                    const HubIcon = hub.icon;
                    return (
                      <div key={hub.id} className="space-y-1.5">
                        <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider">
                          <HubIcon className={`w-3.5 h-3.5 ${hub.accentColor}`} />
                          <span>{t(hub.titleKey)}</span>
                          <span className="text-zinc-600">({hubResults.length})</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {hubResults.map((item) => {
                            const ItemIcon = item.icon;
                            const isSelected = activeTab === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setActiveTab(item.id);
                                  setSelectedHubId(hub.id);
                                  setIsSearchOpen(false);
                                }}
                                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-sans transition-all text-left rtl:text-right cursor-pointer ${
                                  isSelected
                                    ? `${hub.activeBg} text-white border-transparent shadow-md`
                                    : outdoorTheme
                                    ? 'bg-zinc-100 hover:bg-amber-100 border-zinc-200 text-zinc-900'
                                    : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800/80 text-zinc-300 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="p-1 rounded-lg bg-zinc-800/80 text-zinc-300">
                                    <ItemIcon className="w-4 h-4" />
                                  </div>
                                  <span className="font-semibold">{t(item.labelKey)}</span>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-white" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Substation Equipment Matches */}
                  {filteredEquipmentResults.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Substation Equipment ({filteredEquipmentResults.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {filteredEquipmentResults.map((eq) => (
                          <button
                            key={eq.id}
                            onClick={() => {
                              setActiveTab('sld');
                              setSelectedHubId('hub_operations');
                              setIsSearchOpen(false);
                            }}
                            className="flex items-center justify-between p-2.5 rounded-xl border text-xs font-sans transition-all text-left rtl:text-right cursor-pointer bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800/80 text-zinc-300 hover:text-white"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="p-1 rounded-lg bg-cyan-950 text-cyan-300 font-mono font-bold text-[10px]">
                                {eq.ansiCode}
                              </div>
                              <div>
                                <div className="font-semibold text-white">{eq.id}</div>
                                <div className="text-[10px] text-zinc-400 font-mono truncate max-w-[180px]">{eq.name}</div>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-zinc-700">
                              {eq.voltage}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer Hotkey hint */}
            <div className="p-3 border-t border-zinc-800/80 text-xs text-zinc-500 font-mono flex items-center justify-between bg-zinc-950/60">
              <span>{t('hub_all_modules')}</span>
              <div className="flex items-center gap-2">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">ESC</kbd>
                <span>to close</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

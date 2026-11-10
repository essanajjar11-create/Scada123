import React, { useState, useEffect } from 'react';
import { useScada } from '../../context/ScadaContext';
import {
  Activity,
  Volume2,
  VolumeX,
  Shield,
  Sun,
  Moon,
  Tv,
  Clock,
  Radio,
  UserCheck,
  Globe,
  Users,
  Monitor,
  Zap,
  Presentation,
  Search
} from 'lucide-react';
import { RbacModal } from './RbacModal';
import { PopoutWindowModal } from './PopoutWindowModal';
import { AcademicPresentationModal } from '../presentation/AcademicPresentationModal';

interface HeaderProps {
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const {
    scanRateMs,
    setScanRateMs,
    currentUserRole,
    currentUserName,
    activeUsers,
    audioMuted,
    setAudioMuted,
    sirenActive,
    outdoorTheme,
    setOutdoorTheme,
    simMode,
    lang,
    setLang,
    t,
    maintenanceMode,
    setMaintenanceMode,
    setSoeModalOpen
  } = useScada();

  const [timeStr, setTimeStr] = useState<string>('');
  const [showRbacModal, setShowRbacModal] = useState<boolean>(false);
  const [showPopoutModal, setShowPopoutModal] = useState<boolean>(false);
  const [showPresencePopover, setShowPresencePopover] = useState<boolean>(false);
  const [showPresentationModal, setShowPresentationModal] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalConnected = Math.max(1, activeUsers.length);

  return (
    <>
      <header className="bg-[#09090b] border-b border-zinc-800/80 px-4 sm:px-6 py-2.5 sm:py-3 text-[#fafafa] flex flex-wrap items-center justify-between gap-4 shadow-xl">
        {/* Left Branding */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-500/20">
              S
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="font-bold tracking-tight text-base md:text-lg text-white">
                {t('app_title')}
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-mono rounded-full font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800/80">
                RTU-01
              </span>
            </div>
            <p className="text-[11px] font-sans text-zinc-400 flex items-center gap-2 mt-0.5">
              <span className="font-medium text-zinc-400">{t('substation_node')}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-emerald-400 font-bold text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                <Radio className="w-3 h-3 animate-pulse" /> {t('systems_nominal')}
              </span>
            </p>
          </div>

          {/* Quick Search Button in Top Header */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-mono transition-all border bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700/80 hover:border-indigo-500/60 shadow-lg cursor-pointer rtl:mr-3 ltr:ml-3"
              title={t('hub_quick_search')}
            >
              <Search className="w-4 h-4 text-indigo-400" />
              <span className="font-sans text-xs font-semibold text-zinc-200">{t('hub_quick_search')}</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-mono font-bold">
                Ctrl+K
              </kbd>
            </button>
          )}
        </div>

        {/* Right Controls & Telemetry Stats */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Mobile Quick Search Button */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="sm:hidden p-2 rounded-full bg-[#18181b] border border-zinc-800 text-indigo-400 hover:text-white transition-all cursor-pointer"
              title={t('hub_quick_search')}
            >
              <Search className="w-4 h-4" />
            </button>
          )}
          {/* AR / EN Language Toggle Button */}
          <div className="flex items-center bg-[#18181b] border border-zinc-800 rounded-full p-1 text-xs font-sans">
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                lang === 'en'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>EN</span>
            </button>
            <button
              onClick={() => setLang('ar')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                lang === 'ar'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>عربي</span>
            </button>
          </div>

          {/* RTC Clock */}
          <div className="hidden lg:flex items-center space-x-2 px-3.5 py-1.5 bg-[#18181b] border border-zinc-800 rounded-full font-mono text-xs text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-medium tracking-tight">{timeStr}</span>
          </div>

          {/* Scan Rate Selector */}
          <div className="flex items-center space-x-1.5 bg-[#18181b] border border-zinc-800 rounded-full px-3 py-1.5 text-xs font-sans">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-zinc-500 uppercase text-[10px] font-black tracking-wider">{t('scan_rate')}</span>
            <select
              value={scanRateMs}
              onChange={(e) => setScanRateMs(Number(e.target.value))}
              className="bg-transparent text-indigo-300 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value={500} className="bg-[#18181b] text-zinc-100">500 ms ({t('fast')})</option>
              <option value={1000} className="bg-[#18181b] text-zinc-100">1000 ms ({t('norm')})</option>
              <option value={2000} className="bg-[#18181b] text-zinc-100">2000 ms ({t('log')})</option>
              <option value={5000} className="bg-[#18181b] text-zinc-100">5000 ms ({t('slow')})</option>
            </select>
          </div>

          {/* SOE Microsecond Recorder Modal Button */}
          <button
            onClick={() => setSoeModalOpen(true)}
            className="px-3 py-1.5 rounded-full text-xs font-sans font-bold flex items-center gap-1.5 border transition-all cursor-pointer bg-zinc-900 text-rose-400 border-rose-800/80 hover:bg-rose-950/80"
            title={t('open_soe_recorder')}
          >
            <Zap className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>{t('soe_log')}</span>
          </button>

          {/* Academic Presentation Deck Button */}
          <button
            onClick={() => setShowPresentationModal(true)}
            className="px-3 py-1.5 rounded-full text-xs font-sans font-bold flex items-center gap-1.5 border transition-all cursor-pointer bg-indigo-950/70 text-indigo-300 border-indigo-700 hover:bg-indigo-900 shadow-md shadow-indigo-500/20"
            title={t('academic_pres_title')}
          >
            <Presentation className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t('presentation_btn')}</span>
          </button>

          {/* Sim Mode Indicator */}
          <div className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold flex items-center space-x-1.5 border tracking-tight ${
            simMode === 'AUTO' 
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
              : 'bg-amber-950/60 text-amber-400 border-amber-800/80 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
          }`}>
            <span>{simMode === 'AUTO' ? t('auto_sim') : t('override')}</span>
          </div>

          {/* Maintenance Mode Toggle */}
          <button
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              maintenanceMode
                ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse'
                : 'bg-[#18181b] text-zinc-400 border-zinc-800 hover:text-amber-300 hover:border-amber-700/60'
            }`}
            title={t('toggle_loto')}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>{maintenanceMode ? t('maintenance_active') : t('maintenance_mode')}</span>
          </button>

          {/* Alarm Audio Siren Toggle */}
          <button
            onClick={() => setAudioMuted(!audioMuted)}
            className={`p-2 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
              sirenActive && !audioMuted
                ? 'bg-rose-600 text-white border-rose-400 animate-bounce shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                : audioMuted
                ? 'bg-[#18181b] text-zinc-500 border-zinc-800 hover:text-zinc-200'
                : 'bg-[#18181b] text-indigo-400 border-zinc-800 hover:border-indigo-500/50'
            }`}
            title={audioMuted ? t('unmute_siren') : t('mute_siren')}
          >
            {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Field Theme Toggle */}
          <button
            onClick={() => setOutdoorTheme(!outdoorTheme)}
            className={`p-2 rounded-full border text-xs font-sans transition-all flex items-center cursor-pointer ${
              outdoorTheme
                ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold'
                : 'bg-[#18181b] text-zinc-300 border-zinc-800 hover:text-indigo-400 hover:border-zinc-700'
            }`}
            title={t('toggle_outdoor')}
          >
            {outdoorTheme ? <Sun className="w-4 h-4 text-amber-600" /> : <Moon className="w-4 h-4 text-zinc-400" />}
          </button>

          {/* Video Wall Popout Button */}
          <button
            onClick={() => setShowPopoutModal(true)}
            className="p-2 rounded-full bg-[#18181b] border border-zinc-800 text-zinc-300 hover:text-indigo-400 hover:border-zinc-700 transition-all cursor-pointer"
            title={t('control_room_popout')}
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Multi-User Real-Time Presence Indicator */}
          <div className="relative">
            <button
              onClick={() => setShowPresencePopover(!showPresencePopover)}
              className="px-3.5 py-1.5 rounded-full bg-[#18181b] border border-emerald-800/80 hover:border-emerald-500 text-xs font-sans font-bold flex items-center space-x-2 text-emerald-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)]"
              title={t('active_connected_workstations')}
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[11px] font-bold">
                {totalConnected} {totalConnected > 1 ? t('workstations') : t('workstation')}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>

            {/* Presence Popover Dropdown */}
            {showPresencePopover && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl p-4 z-50 font-sans space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs text-white uppercase font-mono">{t('active_workstations')}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono rounded font-bold">
                    {t('live_sync')}
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {/* Current Local User */}
                  <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-700/80 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="font-bold text-xs text-white">{currentUserName}</span>
                        <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[9px] font-mono font-bold rounded">
                          {t('you')}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-300 uppercase block">
                        {t('role')} {currentUserRole}
                      </span>
                    </div>
                  </div>

                  {/* Remote Connected Workstations */}
                  {activeUsers.map((u) => (
                    <div key={u.workstationId} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="font-bold text-xs text-zinc-200">{u.userName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                          <span className="uppercase text-cyan-400 font-bold">{u.userRole}</span>
                          <span>•</span>
                          <span>{u.workstationId}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] font-mono text-zinc-500 text-center border-t border-zinc-800/80 pt-2">
                  {t('sync_engine_desc')}
                </div>
              </div>
            )}
          </div>

          {/* RBAC Role Switcher */}
          <button
            onClick={() => setShowRbacModal(true)}
            className={`px-4 py-1.5 rounded-full text-xs font-sans font-bold flex items-center space-x-2 rtl:space-x-reverse border transition-all cursor-pointer tracking-tight ${
              currentUserRole === 'manager'
                ? 'bg-purple-950/80 text-purple-300 border-purple-700 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                : currentUserRole === 'engineer'
                ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                : 'bg-[#18181b] text-zinc-300 border-zinc-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-current" />
            <span className="uppercase text-[11px] font-extrabold">
              {currentUserRole === 'manager' ? t('role_manager') : currentUserRole === 'engineer' ? t('role_engineer') : t('role_operator')}
            </span>
            <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </header>

      {/* Maintenance Mode Hazard Banner */}
      {maintenanceMode && (
        <div className="bg-amber-950/90 border-b border-amber-600/80 px-6 py-2 text-amber-200 text-xs font-mono font-bold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
            <span className="text-amber-300 font-extrabold uppercase">
              ⚠️ {t('maintenance_active')}: {t('maint_warning')}
            </span>
          </div>
          <button
            onClick={() => setMaintenanceMode(false)}
            className="px-2.5 py-0.5 bg-amber-500 text-black hover:bg-amber-400 rounded text-[11px] font-extrabold transition-colors cursor-pointer"
          >
            {t('clear_loto')}
          </button>
        </div>
      )}

      {/* RBAC Authentication Modal */}
      {showRbacModal && <RbacModal onClose={() => setShowRbacModal(false)} />}

      {/* Popout Video Wall Modal */}
      {showPopoutModal && <PopoutWindowModal onClose={() => setShowPopoutModal(false)} />}

      {/* Academic Presentation Modal */}
      {showPresentationModal && (
        <AcademicPresentationModal
          isOpen={showPresentationModal}
          onClose={() => setShowPresentationModal(false)}
        />
      )}
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  Radio, 
  Boxes, 
  Home, 
  BarChart3, 
  Flame, 
  Wifi, 
  WifiOff, 
  UserCheck, 
  ShieldAlert,
  ChevronDown,
  LogOut,
  User,
  HeartHandshake
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../lib/api';
import { getPendingOfflineReports, syncOfflineReports } from '../lib/offlineQueue';

export type TabType = 
  | 'incidents' 
  | 'volunteer-tasks'
  | 'map' 
  | 'report' 
  | 'resources' 
  | 'shelters' 
  | 'disaster-detail' 
  | 'admin';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedIncidentCode?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, selectedIncidentCode }) => {
  const { user, quickLogin, logout, isAnonymous } = useAuth();
  const [offlineCount, setOfflineCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      setCurrentTime(`${dateStr} · ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Offline queue listener
  useEffect(() => {
    const checkQueue = async () => {
      const pending = await getPendingOfflineReports();
      setOfflineCount(pending.length);
    };
    checkQueue();

    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineReports().then(checkQueue);
    };
    const handleOffline = () => setIsOnline(false);
    const handleQueueChange = () => checkQueue();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-queue-updated', handleQueueChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-updated', handleQueueChange);
    };
  }, []);

  const roles: Array<{ key: UserRole; label: string; badge: string }> = [
    { key: 'authority', label: 'Authority (Incident Commander)', badge: 'AUTHORITY' },
    { key: 'volunteer', label: 'Volunteer (Responder)', badge: 'VOLUNTEER' },
    { key: 'resource_manager', label: 'Resource Manager', badge: 'LOGISTICS' },
    { key: 'citizen', label: 'Citizen (Public)', badge: 'CITIZEN' },
  ];

  const currentRole = user?.role || 'citizen';

  return (
    <header className="bg-dark-surface border-b border-dark-border sticky top-0 z-50">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveTab(currentRole === 'volunteer' ? 'volunteer-tasks' : 'incidents')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-lg bg-brand-redDim border border-brand-red/40 flex items-center justify-center text-brand-red shadow-lg shadow-brand-red/10 group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white flex items-center gap-2">
              <span>DisasterOps</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-brand-blueDim text-brand-blue border border-brand-blue/30">
                RELIEF
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono tracking-wider uppercase">
              Command Center
            </div>
          </div>
        </div>

        {/* Role-Based Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-dark-base/80 p-1 rounded-xl border border-dark-border">
          
          {/* Volunteer Specific Tab */}
          {currentRole === 'volunteer' && (
            <button
              id="nav-tab-volunteer-tasks"
              onClick={() => setActiveTab('volunteer-tasks')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'volunteer-tasks'
                  ? 'bg-brand-green text-dark-base font-bold shadow-md shadow-brand-green/20'
                  : 'text-brand-green hover:bg-dark-hover'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>My Tasks</span>
            </button>
          )}

          {/* Incidents Tab */}
          <button
            id="nav-tab-incidents"
            onClick={() => setActiveTab('incidents')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'incidents'
                ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
            }`}
          >
            {currentRole === 'authority' ? 'Triage & Command' : 'Incidents'}
          </button>

          {/* Live Map Tab */}
          <button
            id="nav-tab-map"
            onClick={() => setActiveTab('map')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'map'
                ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Live Map</span>
          </button>

          {/* Report Threat Tab */}
          <button
            id="nav-tab-report"
            onClick={() => setActiveTab('report')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'report'
                ? 'bg-brand-red text-white shadow-md shadow-brand-red/25 animate-pulse'
                : 'text-brand-red hover:bg-brand-redDim/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Report Threat</span>
          </button>

          {/* Resources Tab (Authority & Resource Manager) */}
          {(currentRole === 'authority' || currentRole === 'resource_manager') && (
            <button
              id="nav-tab-resources"
              onClick={() => setActiveTab('resources')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'resources'
                  ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Resources</span>
            </button>
          )}

          {/* Shelters Tab */}
          <button
            id="nav-tab-shelters"
            onClick={() => setActiveTab('shelters')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'shelters'
                ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Shelters</span>
          </button>

          {/* Disaster Detail Tab (Authority) */}
          {currentRole === 'authority' && (
            <button
              id="nav-tab-disaster"
              onClick={() => setActiveTab('disaster-detail')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'disaster-detail'
                  ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Disaster Detail</span>
            </button>
          )}

          {/* Admin Tab (Authority) */}
          {currentRole === 'authority' && (
            <button
              id="nav-tab-admin"
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}

        </nav>

        {/* Right Status & User Profile Actions */}
        <div className="flex items-center gap-3.5">
          
          {/* Offline Sync Indicator */}
          {offlineCount > 0 && (
            <button
              onClick={() => syncOfflineReports()}
              title="Click to sync queued reports now"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-amberDim border border-brand-amber/40 text-brand-amber text-xs font-mono animate-bounce"
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span>{offlineCount} QUEUED OFFLINE</span>
            </button>
          )}

          {/* System Nominal Indicator */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-green"></span>
            </span>
            <span className="text-xs font-mono text-slate-300">System Nominal</span>
          </div>

          {/* Live Date / Time */}
          <div className="hidden xl:block text-xs font-mono text-slate-400 border-l border-dark-border pl-3">
            {currentTime || '22 Aug 2026 · 17:42'}
          </div>

          {/* User Profile & Role Switcher Menu */}
          <div className="relative">
            <button
              id="user-profile-menu-btn"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-dark-card border border-dark-borderLight text-xs font-medium text-slate-200 hover:bg-dark-hover transition-colors shadow-sm"
            >
              <div className="w-6 h-6 rounded-lg bg-brand-blueDim text-brand-blue font-bold text-xs flex items-center justify-center border border-brand-blue/30">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
              </div>

              <div className="flex flex-col text-left hidden sm:flex">
                <span className="text-[11px] font-semibold text-white truncate max-w-[120px]">
                  {user?.name || 'Citizen'}
                </span>
                <span className="text-[9px] text-brand-blue font-mono uppercase font-bold">
                  {user?.role || 'Citizen'}
                </span>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-dark-card border border-dark-borderLight rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2">
                
                {/* User Info Header */}
                <div className="px-3 py-2 border-b border-dark-border mb-2">
                  <div className="text-xs font-bold text-white truncate">{user?.name}</div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">{user?.email || 'Public Citizen Session'}</div>
                  <div className="mt-1">
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-brand-blueDim text-brand-blue border border-brand-blue/40 uppercase font-bold">
                      {user?.role?.toUpperCase()} ACCESS
                    </span>
                  </div>
                </div>

                {/* Role Switcher Options (Matching Screenshot) */}
                <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                  SWITCH ACTIVE ROLE (DEMO MODE)
                </div>

                <div className="space-y-1">
                  {roles.map(r => (
                    <button
                      key={r.key}
                      onClick={async () => {
                        await quickLogin(r.key);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        user?.role === r.key
                          ? 'bg-brand-blueDim text-brand-blue font-semibold border border-brand-blue/30'
                          : 'text-slate-300 hover:bg-dark-hover'
                      }`}
                    >
                      <span>{r.label}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-dark-base border border-dark-border text-slate-400 font-bold">
                        {r.badge}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Log Out Button */}
                <div className="mt-2 pt-2 border-t border-dark-border">
                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-mono font-semibold text-brand-red hover:bg-brand-redDim flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out & Return to Portal</span>
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mobile navigation bar */}
      <div className="lg:hidden flex items-center justify-around bg-dark-base px-2 py-2 border-t border-dark-border overflow-x-auto">
        {currentRole === 'volunteer' && (
          <button
            onClick={() => setActiveTab('volunteer-tasks')}
            className={`px-2.5 py-1 text-xs font-medium rounded ${activeTab === 'volunteer-tasks' ? 'bg-brand-green text-dark-base font-bold' : 'text-slate-400'}`}
          >
            My Tasks
          </button>
        )}
        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-2.5 py-1 text-xs font-medium rounded ${activeTab === 'incidents' ? 'bg-brand-blue text-white' : 'text-slate-400'}`}
        >
          {currentRole === 'authority' ? 'Triage' : 'Incidents'}
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`px-2.5 py-1 text-xs font-medium rounded ${activeTab === 'map' ? 'bg-brand-blue text-white' : 'text-slate-400'}`}
        >
          Map
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-2.5 py-1 text-xs font-medium rounded ${activeTab === 'report' ? 'bg-brand-red text-white' : 'text-brand-red'}`}
        >
          Report
        </button>
        {(currentRole === 'authority' || currentRole === 'resource_manager') && (
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-2.5 py-1 text-xs font-medium rounded ${activeTab === 'resources' ? 'bg-brand-blue text-white' : 'text-slate-400'}`}
          >
            Resources
          </button>
        )}
        <button
          onClick={() => setActiveTab('shelters')}
          className={`px-2.5 py-1 text-xs font-medium rounded ${activeTab === 'shelters' ? 'bg-brand-blue text-white' : 'text-slate-400'}`}
        >
          Shelters
        </button>
      </div>
    </header>
  );
};

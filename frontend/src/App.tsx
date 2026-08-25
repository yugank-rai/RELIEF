import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPortal } from './pages/AuthPortal';
import { Navbar } from './components/Navbar';
import type { TabType } from './components/Navbar';
import { LiveAlertTicker } from './components/LiveAlertTicker';
import { PublicDashboard } from './pages/PublicDashboard';
import { ResponseDashboard } from './pages/ResponseDashboard';
import { VolunteerDashboard } from './pages/VolunteerDashboard';
import { ReportThreat } from './pages/ReportThreat';
import { ResourcesAndShelters } from './pages/ResourcesAndShelters';
import { DisasterDetails } from './pages/DisasterDetails';
import { AdminDashboard } from './pages/AdminDashboard';
import { LiveMapScreen } from './pages/LiveMapScreen';
import type { Incident } from './lib/api';
import { AlertTriangle, Radio, ShieldAlert, LogIn } from 'lucide-react';

const AccessDeniedCard: React.FC<{ requiredRole: string; onSwitchToAuthority: () => void }> = ({ 
  requiredRole, 
  onSwitchToAuthority 
}) => (
  <div className="bg-dark-surface border border-brand-red/40 rounded-2xl p-8 max-w-xl mx-auto text-center space-y-4 shadow-2xl my-12">
    <div className="w-12 h-12 rounded-2xl bg-brand-redDim border border-brand-red/40 text-brand-red flex items-center justify-center mx-auto shadow-lg shadow-brand-red/20">
      <ShieldAlert className="w-6 h-6" />
    </div>
    <h3 className="text-lg font-bold text-white">403 Forbidden: Restricted Command Area</h3>
    <p className="text-xs text-slate-300 leading-relaxed font-sans">
      This operational module requires <strong className="text-brand-red">{requiredRole.toUpperCase()}</strong> clearance. Citizens and field volunteers cannot access official triage, inventory modifications, or administrative audit logs without authorization.
    </p>
    <div className="text-[11px] font-mono text-slate-400 bg-dark-base p-3 rounded-xl border border-dark-border space-y-1">
      <div>Security Enforcement: <strong>Active RBAC Token Guard</strong></div>
      <div className="text-[10px] text-slate-500">Sign in with official command credentials (Passcode: COMMAND-2026).</div>
    </div>
    <button
      onClick={onSwitchToAuthority}
      className="px-5 py-2.5 bg-brand-red hover:bg-brand-red/90 text-white rounded-xl text-xs font-mono font-bold tracking-wide transition-all shadow-lg shadow-brand-red/20 flex items-center justify-center gap-2 mx-auto"
    >
      <LogIn className="w-4 h-4" />
      <span>Switch to Authority Portal</span>
    </button>
  </div>
);

const MainApp: React.FC = () => {
  const { user, isAuthenticated, isAnonymous, isLoading, quickLogin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('incidents');
  const [selectedIncidentForDetail, setSelectedIncidentForDetail] = useState<Incident | null>(null);
  const [authorityViewMode, setAuthorityViewMode] = useState<'public' | 'command'>('command');

  // Update default tab when role changes
  useEffect(() => {
    if (user?.role === 'volunteer') {
      setActiveTab('volunteer-tasks');
    } else if (user?.role === 'authority') {
      setActiveTab('incidents');
      setAuthorityViewMode('command');
    } else if (user?.role === 'resource_manager') {
      setActiveTab('resources');
    } else {
      setActiveTab('incidents');
    }
  }, [user?.role]);

  const handleSelectIncidentDetail = (incident: Incident) => {
    setSelectedIncidentForDetail(incident);
    setActiveTab('disaster-detail');
  };

  const handleOpenLiveMap = () => {
    setActiveTab('map');
  };

  // Loading spinner while verifying credentials
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-base text-slate-100 flex items-center justify-center font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-brand-blue animate-ping" />
          <span>INITIALIZING DISASTEROPS RELIEF SESSION...</span>
        </div>
      </div>
    );
  }

  // If user is not authenticated and not in anonymous mode, show the Auth Portal
  if (!isAuthenticated && !isAnonymous) {
    return <AuthPortal />;
  }

  const isAuthority = user?.role === 'authority';
  const isResourceManager = user?.role === 'resource_manager';
  const isVolunteer = user?.role === 'volunteer';

  return (
    <div className="min-h-screen bg-dark-base text-slate-100 flex flex-col font-sans selection:bg-brand-red selection:text-white">
      
      {/* 1. Command Center Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedIncidentCode={selectedIncidentForDetail?.code}
      />

      {/* 2. Broadcast Live Alert Ticker */}
      <LiveAlertTicker />

      {/* 3. Main Workspace Content Container */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 pb-24">
        
        {/* Authority / Public Sub-toggle when on Incidents Tab */}
        {activeTab === 'incidents' && isAuthority && (
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-dark-surface border border-dark-border p-2.5 rounded-xl text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-400">
              <Radio className="w-4 h-4 text-brand-red animate-pulse" />
              <span>Authority Role Active: Switch Workspace View</span>
            </div>
            <div className="flex items-center gap-1 bg-dark-base p-1 rounded-lg border border-dark-borderLight">
              <button
                onClick={() => setAuthorityViewMode('command')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  authorityViewMode === 'command'
                    ? 'bg-brand-red text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Triage & Dispatch Command
              </button>
              <button
                onClick={() => setAuthorityViewMode('public')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  authorityViewMode === 'public'
                    ? 'bg-brand-blue text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Public Radar View
              </button>
            </div>
          </div>
        )}

        {/* Tab Routing with Strict RBAC Guards */}
        {activeTab === 'volunteer-tasks' && (
          isVolunteer ? (
            <VolunteerDashboard onSelectIncidentDetail={handleSelectIncidentDetail} />
          ) : (
            <AccessDeniedCard requiredRole="volunteer" onSwitchToAuthority={() => quickLogin('volunteer')} />
          )
        )}

        {activeTab === 'incidents' && (
          authorityViewMode === 'command' && isAuthority ? (
            <ResponseDashboard onSelectDisasterDetail={handleSelectIncidentDetail} />
          ) : (
            <PublicDashboard
              onSelectIncidentDetail={handleSelectIncidentDetail}
              onOpenLiveMap={handleOpenLiveMap}
            />
          )
        )}

        {activeTab === 'map' && (
          <LiveMapScreen onSelectIncidentDetail={handleSelectIncidentDetail} />
        )}

        {activeTab === 'report' && (
          <ReportThreat onIncidentReported={() => setActiveTab('incidents')} />
        )}

        {activeTab === 'resources' && (
          (isAuthority || isResourceManager) ? (
            <ResourcesAndShelters />
          ) : (
            <AccessDeniedCard requiredRole="authority or resource_manager" onSwitchToAuthority={() => quickLogin('authority')} />
          )
        )}

        {activeTab === 'shelters' && (
          <ResourcesAndShelters />
        )}

        {activeTab === 'disaster-detail' && (
          <DisasterDetails
            incident={selectedIncidentForDetail}
            onBack={() => setActiveTab('incidents')}
          />
        )}

        {activeTab === 'admin' && (
          isAuthority ? (
            <AdminDashboard />
          ) : (
            <AccessDeniedCard requiredRole="authority" onSwitchToAuthority={() => quickLogin('authority')} />
          )
        )}

      </main>

      {/* 4. Persistent Emergency Action Button */}
      {activeTab !== 'report' && (
        <button
          onClick={() => setActiveTab('report')}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-brand-red hover:bg-brand-red/90 text-white font-bold text-xs uppercase tracking-wider shadow-2xl shadow-brand-red/50 hover:scale-105 transition-all duration-200 border border-white/20 animate-pulse"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Report Emergency</span>
        </button>
      )}

    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;

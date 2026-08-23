import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import type { TabType } from './components/Navbar';
import { LiveAlertTicker } from './components/LiveAlertTicker';
import { PublicDashboard } from './pages/PublicDashboard';
import { ResponseDashboard } from './pages/ResponseDashboard';
import { ReportThreat } from './pages/ReportThreat';
import { ResourcesAndShelters } from './pages/ResourcesAndShelters';
import { DisasterDetails } from './pages/DisasterDetails';
import { AdminDashboard } from './pages/AdminDashboard';
import { LiveMapScreen } from './pages/LiveMapScreen';
import type { Incident } from './lib/api';
import { AlertTriangle, Radio } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('incidents');
  const [selectedIncidentForDetail, setSelectedIncidentForDetail] = useState<Incident | null>(null);

  // If user role is Authority, show Emergency Response Command when 'incidents' is selected, or let them toggle
  const [authorityViewMode, setAuthorityViewMode] = useState<'public' | 'command'>('public');

  const handleSelectIncidentDetail = (incident: Incident) => {
    setSelectedIncidentForDetail(incident);
    setActiveTab('disaster-detail');
  };

  const handleOpenLiveMap = () => {
    setActiveTab('map');
  };

  return (
    <div className="min-h-screen bg-dark-base text-slate-100 flex flex-col font-sans selection:bg-brand-red selection:text-white">
      
      {/* 1. Command Center Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedIncidentCode={selectedIncidentForDetail?.code}
      />

      {/* 2. Broadcast Live Alert Ticker (Matching Screenshots) */}
      <LiveAlertTicker />

      {/* 3. Main Workspace Content Container */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 pb-24">
        
        {/* Authority / Public Sub-toggle when on Incidents Tab */}
        {activeTab === 'incidents' && user?.role === 'authority' && (
          <div className="mb-4 flex items-center justify-between bg-dark-surface border border-dark-border p-2.5 rounded-xl text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-400">
              <Radio className="w-4 h-4 text-brand-red animate-pulse" />
              <span>Authority Role Active: Switch Workspace View</span>
            </div>
            <div className="flex items-center gap-1 bg-dark-base p-1 rounded-lg border border-dark-borderLight">
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
            </div>
          </div>
        )}

        {/* Tab Routing */}
        {activeTab === 'incidents' && (
          authorityViewMode === 'command' && user?.role === 'authority' ? (
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
          <ResourcesAndShelters />
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
          <AdminDashboard />
        )}

      </main>

      {/* 4. Persistent Emergency Action Button on Mobile & Desktop */}
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

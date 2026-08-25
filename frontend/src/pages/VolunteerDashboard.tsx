import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Incident } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { IncidentMap } from '../components/Map/IncidentMap';
import { 
  HeartHandshake, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  Radio, 
  Activity, 
  Phone, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface VolunteerDashboardProps {
  onSelectIncidentDetail: (incident: Incident) => void;
}

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({ onSelectIncidentDetail }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<{ assigned: Incident[]; nearbyOpen: Incident[] }>({
    assigned: [],
    nearbyOpen: [],
  });
  const [volunteerStatus, setVolunteerStatus] = useState<string>(user?.status || 'available');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchVolunteerTasks = async () => {
    try {
      const data = await api.volunteers.getMyTasks();
      setTasks({
        assigned: data.assigned || [],
        nearbyOpen: data.nearbyOpen || [],
      });
    } catch (err) {
      console.error('Failed to load volunteer tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteerTasks();
    const interval = setInterval(fetchVolunteerTasks, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    setVolunteerStatus(newStatus);
    try {
      await api.volunteers.updateStatus({ status: newStatus });
      setActionNotice(`Status updated to ${newStatus.toUpperCase()}`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAcceptTask = async (incidentId: number | string, incidentCode: string) => {
    try {
      await api.volunteers.acceptTask(incidentId);
      setActionNotice(`✅ Accepted task for incident ${incidentCode}! Units dispatched.`);
      setTimeout(() => setActionNotice(null), 4000);
      fetchVolunteerTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to accept task');
    }
  };

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto">
      
      {/* Volunteer Active Status & Mission Header */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-greenDim border border-brand-green/40 flex items-center justify-center text-brand-green shadow-lg shadow-brand-green/20">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Volunteer Responder Task Center</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-greenDim text-brand-green border border-brand-green/40 font-semibold">
                FIELD READY
              </span>
            </h2>
            <div className="text-xs font-mono text-slate-400">
              Welcome, <strong className="text-white">{user?.name}</strong> · Skills: {user?.skills?.join(', ') || 'General Support'}
            </div>
          </div>
        </div>

        {/* Status Toggle Bar */}
        <div className="flex items-center gap-2 bg-dark-base p-1 rounded-xl border border-dark-borderLight text-xs font-mono">
          <span className="text-[10px] text-slate-400 uppercase px-2">Deployment Status:</span>
          {['available', 'deployed', 'standby', 'offline'].map(st => (
            <button
              key={st}
              onClick={() => handleStatusChange(st)}
              className={`px-3 py-1 rounded-lg uppercase font-bold text-[11px] transition-all ${
                volunteerStatus === st
                  ? st === 'available'
                    ? 'bg-brand-green text-dark-base shadow'
                    : st === 'deployed'
                    ? 'bg-brand-red text-white shadow'
                    : 'bg-brand-amber text-dark-base shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-brand-greenDim border border-brand-green/40 text-brand-green text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Grid: Left Tasks Lists (7 Cols) + Right Map & Skills (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols: Assigned Incidents & Nearby Open Incidents */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section A: My Assigned Incidents */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-dark-border pb-3">
              <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-green" />
                <span>MY ASSIGNED MISSIONS ({tasks.assigned.length})</span>
              </div>
              <span className="text-xs font-mono text-brand-green font-semibold">
                Direct Dispatch
              </span>
            </div>

            <div className="space-y-3">
              {tasks.assigned.length === 0 ? (
                <div className="text-xs font-mono text-slate-500 bg-dark-base p-6 rounded-xl text-center">
                  No incidents currently assigned. Review nearby open requests below to accept.
                </div>
              ) : (
                tasks.assigned.map(inc => (
                  <div
                    key={inc.id}
                    className="bg-dark-base border border-brand-green/40 rounded-xl p-4 space-y-3 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-white">{inc.code}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-redDim text-brand-red font-bold uppercase">
                            {inc.severity}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-white mt-1">{inc.title}</h4>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{inc.locationName}</div>
                      </div>

                      <button
                        onClick={() => onSelectIncidentDetail(inc)}
                        className="px-3 py-1.5 bg-dark-card hover:bg-dark-hover border border-dark-borderLight text-xs font-mono text-brand-blue rounded-lg flex items-center gap-1 shrink-0"
                      >
                        <span>Operations Brief</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 font-sans leading-relaxed">{inc.description}</p>

                    <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-dark-border text-slate-400">
                      <span>Priority: <strong className="text-brand-amber">{inc.priorityScore?.toFixed(2)}</strong></span>
                      <span className="text-brand-green font-semibold uppercase">● Mission Active</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section B: Nearby Open Incidents Waiting for Responders */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-dark-border pb-3">
              <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-brand-amber" />
                <span>NEARBY OPEN INCIDENTS WAITING FOR RESPONDERS ({tasks.nearbyOpen.length})</span>
              </div>
            </div>

            <div className="space-y-3">
              {tasks.nearbyOpen.map(inc => (
                <div
                  key={inc.id}
                  className="bg-dark-base border border-dark-border rounded-xl p-4 space-y-3 hover:border-slate-500 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{inc.code}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-amberDim text-brand-amber font-bold uppercase">
                          {inc.severity}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white mt-1">{inc.title}</h4>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{inc.locationName}</div>
                    </div>

                    <button
                      onClick={() => handleAcceptTask(inc.id, inc.code)}
                      className="px-4 py-2 bg-brand-green hover:bg-brand-green/90 text-dark-base font-mono font-bold text-xs rounded-xl shadow-lg shadow-brand-green/20 flex items-center gap-1.5 shrink-0 transition-transform active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Accept Mission</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">{inc.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 5 Cols: Tactical Map & Field Checklist */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Tactical Map */}
          <div>
            <IncidentMap
              incidents={[...tasks.assigned, ...tasks.nearbyOpen]}
              height="380px"
              showLayerControls={false}
            />
          </div>

          {/* Volunteer Field Readiness Checklist */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-5 shadow-2xl space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-brand-blue" />
              <span>FIELD RESPONDER PROTOCOLS</span>
            </div>

            <ul className="text-xs text-slate-400 space-y-2 font-mono">
              <li className="flex items-start gap-2">
                <span className="text-brand-green font-bold">1.</span>
                <span>Maintain live status: Switch to <strong>DEPLOYED</strong> once en route to scene.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-green font-bold">2.</span>
                <span>Coordinate with Incident Commander (IC Officer) immediately upon arrival.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-green font-bold">3.</span>
                <span>Use offline threat reporting if connectivity drops in disaster pockets.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};

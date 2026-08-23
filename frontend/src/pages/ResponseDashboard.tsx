import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Incident } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  Radio, 
  Users, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Send, 
  AlertOctagon, 
  Layers, 
  Activity, 
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';

interface ResponseDashboardProps {
  onSelectDisasterDetail: (incident: Incident) => void;
}

export const ResponseDashboard: React.FC<ResponseDashboardProps> = ({ onSelectDisasterDetail }) => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [matchingCandidates, setMatchingCandidates] = useState<any[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState<boolean>(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const list = await api.incidents.getAll();
      setIncidents(list);
      if (list.length > 0) {
        if (!selectedIncident) {
          loadIncidentDetail(list[0].id);
        } else {
          loadIncidentDetail(selectedIncident.id);
        }
      }
    } catch (err) {
      console.error('Failed to load triage queue:', err);
    }
  };

  const loadIncidentDetail = async (id: number | string) => {
    try {
      const full = await api.incidents.getById(id);
      setSelectedIncident(full);

      // Load matching volunteers
      setIsLoadingMatches(true);
      const matches = await api.incidents.getMatchingVolunteers(id);
      setMatchingCandidates(matches.candidates || []);
    } catch (err) {
      console.error('Failed to load incident detail:', err);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedIncident) return;
    try {
      await api.incidents.updateStatus(selectedIncident.id, { status: newStatus });
      setDispatchStatus(`Status changed to ${newStatus.toUpperCase()}`);
      setTimeout(() => setDispatchStatus(null), 4000);
      fetchQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDispatchVolunteer = async (volunteerId: number, volunteerName: string) => {
    if (!selectedIncident) return;
    try {
      await api.incidents.assign(selectedIncident.id, { volunteerId });
      setDispatchStatus(`✅ Dispatched responder ${volunteerName} to ${selectedIncident.code}!`);
      setTimeout(() => setDispatchStatus(null), 5000);
      loadIncidentDetail(selectedIncident.id);
    } catch (err: any) {
      alert(err.message || 'Dispatch failed');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-redDim border border-brand-red/40 flex items-center justify-center text-brand-red shadow-lg shadow-brand-red/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Authority Emergency Response & Triage Command</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-redDim text-brand-red border border-brand-red/40 font-semibold">
                LIVE TRIAGE
              </span>
            </h2>
            <div className="text-xs font-mono text-slate-400">
              Rule-Based Priority Scoring · Spatial Corroboration · Multi-Factor Matcher
            </div>
          </div>
        </div>

        {dispatchStatus && (
          <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-brand-greenDim border border-brand-green/40 text-brand-green font-semibold animate-in fade-in">
            {dispatchStatus}
          </div>
        )}
      </div>

      {/* Main Grid: Left Triage Queue (5 Cols) + Right Incident & Dispatch Center (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 5 Cols: Prioritized Incident Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>TRIAGE QUEUE ({incidents.length})</span>
            <span>SORTED BY PRIORITY (MAX 10.0)</span>
          </div>

          <div className="space-y-2.5 max-h-[820px] overflow-y-auto pr-1">
            {incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => loadIncidentDetail(inc.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer select-none relative ${
                    isSelected
                      ? 'bg-dark-card border-brand-blue shadow-xl shadow-brand-blue/10 ring-1 ring-brand-blue'
                      : 'bg-dark-surface border-dark-border hover:border-slate-600 hover:bg-dark-hover/60'
                  }`}
                >
                  {/* Top line: Code, Priority, Severity */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">
                        {inc.code}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                          inc.severity === 'critical'
                            ? 'bg-brand-redDim text-brand-red border border-brand-red/40'
                            : inc.severity === 'high'
                            ? 'bg-brand-amberDim text-brand-amber border border-brand-amber/40'
                            : 'bg-brand-blueDim text-brand-blue border border-brand-blue/40'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-dark-base px-2 py-0.5 rounded border border-dark-borderLight">
                      <span className="text-[10px] font-mono text-slate-400">PRIORITY</span>
                      <strong className="text-xs font-mono text-brand-amber">
                        {inc.priorityScore?.toFixed(2) || '7.50'}
                      </strong>
                    </div>
                  </div>

                  {/* Title & Location */}
                  <div className="font-semibold text-sm text-white mb-1">
                    {inc.title}
                  </div>
                  <div className="text-xs text-slate-400 mb-2.5">
                    {inc.locationName}
                  </div>

                  {/* Corroboration & Status Tags */}
                  <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-dark-border text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-brand-blue" />
                      <span>{inc.reportCount || 1} corroborations</span>
                    </span>
                    <span
                      className={`font-semibold uppercase ${
                        inc.status === 'in_progress' || inc.status === 'assigned'
                          ? 'text-brand-red'
                          : inc.status === 'contained'
                          ? 'text-brand-green'
                          : 'text-brand-blue'
                      }`}
                    >
                      {inc.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 7 Cols: Incident Inspection & Dispatch Engine */}
        <div className="lg:col-span-7">
          {selectedIncident ? (
            <div className="bg-dark-surface border border-dark-border rounded-xl p-6 shadow-2xl space-y-6">
              
              {/* Incident Header & Quick Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dark-border pb-4">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1">
                    ACTIVE TRIAGE INSPECTION
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {selectedIncident.title}
                  </h3>
                  <div className="text-xs font-mono text-slate-400">
                    {selectedIncident.code} · {selectedIncident.locationName}
                  </div>
                </div>

                <button
                  onClick={() => onSelectDisasterDetail(selectedIncident)}
                  className="px-3.5 py-1.5 bg-dark-card hover:bg-dark-hover border border-dark-borderLight text-xs font-mono text-brand-blue rounded-lg flex items-center gap-1.5 shrink-0 self-start transition-colors"
                >
                  <span>Full Operations Brief</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Formula Breakdown Panel (Locked Logic Display) */}
              <div className="bg-dark-base border border-dark-border rounded-xl p-4 space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-amber" />
                    <span>LOCKED RULE-BASED PRIORITY CALCULATION</span>
                  </span>
                  <span className="text-base font-bold text-brand-amber">
                    {selectedIncident.priorityScore?.toFixed(2)} / 10.0
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="bg-dark-surface p-2 rounded border border-dark-border">
                    <span className="text-[9px] text-slate-500 block">0.35 × SEVERITY</span>
                    <strong className="text-brand-red">{selectedIncident.priorityBreakdown?.components.severityScore.toFixed(1) || '10.0'}</strong>
                  </div>
                  <div className="bg-dark-surface p-2 rounded border border-dark-border">
                    <span className="text-[9px] text-slate-500 block">0.20 × TIME WAIT</span>
                    <strong className="text-white">{selectedIncident.priorityBreakdown?.components.timeWaitingScore.toFixed(1) || '4.5'}</strong>
                  </div>
                  <div className="bg-dark-surface p-2 rounded border border-dark-border">
                    <span className="text-[9px] text-slate-500 block">0.20 × VULNERABILITY</span>
                    <strong className="text-brand-amber">{selectedIncident.priorityBreakdown?.components.vulnerabilityScore.toFixed(1) || '8.0'}</strong>
                  </div>
                  <div className="bg-dark-surface p-2 rounded border border-dark-border">
                    <span className="text-[9px] text-slate-500 block">0.15 × URGENCY</span>
                    <strong className="text-brand-blue">{selectedIncident.priorityBreakdown?.components.resourceUrgencyScore.toFixed(1) || '7.0'}</strong>
                  </div>
                  <div className="bg-dark-surface p-2 rounded border border-dark-border col-span-2 sm:col-span-1">
                    <span className="text-[9px] text-slate-500 block">0.10 × REPORTS</span>
                    <strong className="text-brand-green">{selectedIncident.priorityBreakdown?.components.reportCountScore.toFixed(1) || '6.0'}</strong>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 pt-1">
                  Formula: <code className="text-slate-300">{selectedIncident.priorityBreakdown?.normalizedFormula || 'Priority = 0.35(S) + 0.20(TW) + 0.20(V) + 0.15(RU) + 0.10(RC)'}</code>
                </div>
              </div>

              {/* Status Controls (Authority Override) */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                  SET INCIDENT STATUS
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['verified', 'in_progress', 'contained', 'resolved'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(st)}
                      className={`py-2 px-3 rounded-lg text-xs font-mono uppercase font-bold transition-all border ${
                        selectedIncident.status === st
                          ? 'bg-brand-blue text-white border-brand-blue shadow-md'
                          : 'bg-dark-base border-dark-borderLight text-slate-400 hover:bg-dark-hover hover:text-white'
                      }`}
                    >
                      {st.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Corroboration & Linked Reports Tree */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    LINKED CORROBORATION RECORDS ({selectedIncident.reports?.length || 1})
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    Spatial &lt; 200m · Temporal &lt; 12h · Zero Discards
                  </span>
                </div>

                <div className="space-y-2 bg-dark-base p-3 rounded-xl border border-dark-border max-h-40 overflow-y-auto">
                  {selectedIncident.reports && selectedIncident.reports.length > 0 ? (
                    selectedIncident.reports.map((rep, idx) => (
                      <div key={idx} className="flex items-start justify-between text-xs font-mono p-2 rounded bg-dark-surface/60 border border-dark-borderLight/30">
                        <div>
                          <span className="text-white font-semibold">{rep.reporterName || 'Citizen'}</span>
                          <span className="text-slate-500 text-[10px] ml-2">({rep.locationName})</span>
                          <p className="text-slate-300 text-[11px] mt-0.5 font-sans">{rep.description}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                          {new Date(rep.serverReceivedAt || rep.clientCreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs font-mono text-slate-500 text-center py-2">
                      Primary incident report (1 report linked)
                    </div>
                  )}
                </div>
              </div>

              {/* Volunteer Auto-Matching & Dispatch Panel */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-brand-blue" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold">
                      VOLUNTEER MULTI-FACTOR MATCHING (RULE-BASED)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Skill + Distance + Availability + Priority
                  </span>
                </div>

                <div className="space-y-2.5">
                  {isLoadingMatches ? (
                    <div className="p-4 text-center text-xs font-mono text-slate-500 bg-dark-base rounded-xl">
                      Evaluating candidate distance and skills...
                    </div>
                  ) : matchingCandidates.length === 0 ? (
                    <div className="p-4 text-center text-xs font-mono text-slate-500 bg-dark-base rounded-xl">
                      No active volunteers available nearby.
                    </div>
                  ) : (
                    matchingCandidates.map((cand) => (
                      <div
                        key={cand.volunteerId}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          cand.isRecommended
                            ? 'bg-dark-card border-brand-green/40 shadow-lg shadow-brand-green/5'
                            : 'bg-dark-base border-dark-border'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-white">
                              {cand.volunteerName}
                            </span>
                            {cand.isRecommended && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-brand-greenDim text-brand-green border border-brand-green/40 font-bold uppercase">
                                TOP MATCH ({cand.matchScore} pts)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {cand.explanation}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDispatchVolunteer(cand.volunteerId, cand.volunteerName)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors ${
                            cand.isRecommended
                              ? 'bg-brand-green hover:bg-brand-green/90 text-dark-base font-bold'
                              : 'bg-brand-blue hover:bg-brand-blue/90 text-white'
                          }`}
                        >
                          <Send className="w-3 h-3" />
                          <span>Dispatch Responder</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center text-slate-500 font-mono text-xs">
              Select an incident from the queue to start triage inspection.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

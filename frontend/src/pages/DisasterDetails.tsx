import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Incident } from '../lib/api';
import { IncidentMap } from '../components/Map/IncidentMap';
import { 
  Flame, 
  Droplets, 
  MapPin, 
  Clock, 
  Users, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Activity, 
  ArrowLeft,
  Share2,
  Phone
} from 'lucide-react';

interface DisasterDetailsProps {
  incident?: Incident | null;
  onBack: () => void;
}

export const DisasterDetails: React.FC<DisasterDetailsProps> = ({ incident: initialIncident, onBack }) => {
  const [incident, setIncident] = useState<Incident | null>(initialIncident || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialIncident);

  useEffect(() => {
    async function loadLatest() {
      try {
        const id = initialIncident?.id || 1;
        const full = await api.incidents.getById(id);
        setIncident(full);
      } catch (err) {
        console.error('Failed to load disaster details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLatest();
  }, [initialIncident]);

  if (isLoading || !incident) {
    return (
      <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center font-mono text-xs text-slate-500">
        Loading Disaster Operational Brief...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto">
      
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-dark-surface border border-dark-border rounded-xl p-4 shadow-xl">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-base hover:bg-dark-hover border border-dark-borderLight text-xs font-mono text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-brand-redDim text-brand-red border border-brand-red/40 font-bold uppercase">
            {incident.severity} SEVERITY
          </span>
          <span className="px-2.5 py-1 rounded bg-brand-blueDim text-brand-blue border border-brand-blue/40 font-bold uppercase">
            {incident.status.toUpperCase()}
          </span>
          <span className="text-slate-400 font-mono">
            CODE: <strong>{incident.code}</strong>
          </span>
        </div>
      </div>

      {/* Hero Disaster Brief Card */}
      <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 shadow-2xl space-y-6">
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-dark-border pb-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-brand-amber font-semibold mb-1">
              MAJOR INCIDENT REPORT · METRO REGION DISPATCH
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {incident.title}
            </h1>
            <div className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-brand-red" />
              <span>{incident.locationName} ({incident.latitude.toFixed(4)}°N, {incident.longitude.toFixed(4)}°W)</span>
            </div>
          </div>

          {/* Quick Metrics Pill */}
          <div className="flex items-center gap-3 bg-dark-base p-3 rounded-xl border border-dark-border font-mono text-xs">
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-500 block">PRIORITY</span>
              <strong className="text-brand-amber text-base font-bold">
                {incident.priorityScore?.toFixed(2) || '8.45'}
              </strong>
            </div>
            <div className="h-8 w-[1px] bg-dark-border" />
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-500 block">UNITS ON SCENE</span>
              <strong className="text-white text-base font-bold">
                {incident.unitsDeployed || 12}
              </strong>
            </div>
            <div className="h-8 w-[1px] bg-dark-border" />
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-500 block">CORROBORATIONS</span>
              <strong className="text-brand-blue text-base font-bold">
                {incident.reportCount || 6}
              </strong>
            </div>
          </div>
        </div>

        {/* 2-Column Layout: Left Tactical Data + Right Map & Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left 6 Cols: Operational Situation */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Situation Summary */}
            <div className="bg-dark-base p-4 rounded-xl border border-dark-border space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                SITUATION SUMMARY
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {incident.description}
              </p>
            </div>

            {/* Tactical Grid */}
            <div className="grid grid-cols-2 gap-3 bg-dark-base p-4 rounded-xl border border-dark-border text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Incident Commander</span>
                <span className="text-white font-bold">{incident.icOfficer || 'Cpt. R. Torres'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Evacuation Status</span>
                <span className="text-brand-red font-bold">{incident.evacuationZone || 'Zone 4 Active'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Est. Containment</span>
                <span className="text-white font-bold">{incident.estClearTime || '~4 hours'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Assigned Team</span>
                <span className="text-brand-blue font-bold">{incident.assignedTeam?.name || 'Alpha Water Rescue Team'}</span>
              </div>
            </div>

            {/* Deployed Responder Roster */}
            <div className="bg-dark-base p-4 rounded-xl border border-dark-border space-y-3">
              <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center justify-between">
                <span>DEPLOYED RESPONDER ROSTER</span>
                <span className="text-brand-blue text-[10px]">12 ACTIVE PERSONNEL</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded bg-dark-surface border border-dark-borderLight">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-green" />
                    <span className="text-white font-semibold">Lt. Mark Evans (Captain)</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Water Rescue / Incident Lead</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-dark-surface border border-dark-borderLight">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-green" />
                    <span className="text-white font-semibold">Priya Sharma, EMT-P</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Paramedic / Field Triage</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-dark-surface border border-dark-borderLight">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-green" />
                    <span className="text-white font-semibold">David Miller</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Inflatable Vessel Operator</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right 6 Cols: Local Tactical Map & Timeline */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Tactical OpenStreetMap with 200m buffer */}
            <div>
              <IncidentMap
                incidents={[incident]}
                selectedIncident={incident}
                height="300px"
                showLayerControls={false}
              />
            </div>

            {/* Timeline & Corroboration History */}
            <div className="bg-dark-base p-4 rounded-xl border border-dark-border space-y-3">
              <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-brand-red" />
                <span>OPERATIONAL TIMELINE & CORROBORATION FEED</span>
              </div>

              <div className="space-y-2.5 text-xs font-mono max-h-48 overflow-y-auto pr-1">
                {incident.reports && incident.reports.length > 0 ? (
                  incident.reports.map((r, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2 rounded bg-dark-surface border border-dark-borderLight/30">
                      <span className="w-2 h-2 rounded-full bg-brand-blue mt-1 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{r.reporterName}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(r.clientCreatedAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] font-sans mt-0.5">{r.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-xs">Initial report accepted and logged.</div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

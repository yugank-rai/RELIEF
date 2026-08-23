import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Incident, KPIStats } from '../lib/api';
import { StatCards } from '../components/StatCards';
import { IncidentMap } from '../components/Map/IncidentMap';
import { 
  ShieldAlert, 
  Search, 
  ArrowRight, 
  Clock, 
  Users, 
  Radio, 
  Filter, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Flame,
  Droplets,
  Zap,
  Activity
} from 'lucide-react';

interface PublicDashboardProps {
  onSelectIncidentDetail: (incident: Incident) => void;
  onOpenLiveMap: () => void;
}

export const PublicDashboard: React.FC<PublicDashboardProps> = ({
  onSelectIncidentDetail,
  onOpenLiveMap,
}) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [kpis, setKpis] = useState<KPIStats | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    try {
      const [incidentList, kpiData] = await Promise.all([
        api.incidents.getAll({ status: activeFilter, search: searchQuery }),
        api.analytics.getKPIs(),
      ]);
      setIncidents(incidentList);
      setKpis(kpiData);

      if (incidentList.length > 0 && !selectedIncident) {
        setSelectedIncident(incidentList[0]);
      }
    } catch (err) {
      console.error('Failed to load public dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [activeFilter, searchQuery]);

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'critical', label: 'Critical' },
    { key: 'high', label: 'High' },
    { key: 'moderate', label: 'Moderate' },
    { key: 'active', label: 'Active' },
    { key: 'contained', label: 'Contained' },
    { key: 'monitoring', label: 'Monitoring' },
  ];

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return 'Just now';
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-6">
      
      {/* 4 KPI Summary Cards (Matching Screenshots) */}
      <StatCards kpis={kpis} isLoading={isLoading} />

      {/* Main Grid: Left Table & Map + Right Detail Drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: Map + Filter Tabs + Incident Table */}
        <div className="xl:col-span-8 space-y-4">
          
          {/* Incident Radar Map Preview with Open Live Map CTA */}
          <div className="relative">
            <IncidentMap
              incidents={incidents}
              selectedIncident={selectedIncident}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              height="280px"
              showLayerControls={false}
            />
            <button
              onClick={onOpenLiveMap}
              className="absolute bottom-3 right-3 z-[400] px-3.5 py-1.5 rounded-lg bg-dark-surface/90 hover:bg-dark-card border border-dark-borderLight text-xs font-mono font-medium text-brand-blue flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all hover:scale-105"
            >
              <span>Open Live Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-dark-surface border border-dark-border rounded-xl p-2.5">
            
            {/* Filter Tabs matching Screenshot */}
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeFilter === tab.key
                      ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-dark-base border border-dark-borderLight rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>
          </div>

          {/* Incident Table (Matching Screenshot 1) */}
          <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-dark-base/80 border-b border-dark-border text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Units</th>
                    <th className="py-3 px-4 text-right">Reported</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {incidents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-mono text-xs">
                        No incidents found matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    incidents.map((inc) => {
                      const isSelected = selectedIncident?.id === inc.id;
                      return (
                        <tr
                          key={inc.id}
                          onClick={() => setSelectedIncident(inc)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-dark-card border-l-2 border-l-brand-blue'
                              : 'hover:bg-dark-hover/60'
                          }`}
                        >
                          {/* ID */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                            {inc.code}
                          </td>

                          {/* Type */}
                          <td className="py-3.5 px-4 font-semibold text-white">
                            {inc.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </td>

                          {/* Location */}
                          <td className="py-3.5 px-4 text-slate-300">
                            {inc.locationName}
                          </td>

                          {/* Severity Badge */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider ${
                                inc.severity === 'critical'
                                  ? 'bg-brand-redDim text-brand-red border border-brand-red/40'
                                  : inc.severity === 'high'
                                  ? 'bg-brand-amberDim text-brand-amber border border-brand-amber/40'
                                  : inc.severity === 'moderate'
                                  ? 'bg-brand-blueDim text-brand-blue border border-brand-blue/40'
                                  : 'bg-dark-hover text-slate-400 border border-dark-border'
                              }`}
                            >
                              {inc.severity}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 font-medium">
                            <span
                              className={
                                inc.status === 'in_progress' || inc.status === 'reported' || inc.status === 'assigned'
                                  ? 'text-brand-red'
                                  : inc.status === 'contained'
                                  ? 'text-brand-green'
                                  : 'text-brand-blue'
                              }
                            >
                              {inc.status === 'in_progress'
                                ? 'Active'
                                : inc.status === 'contained'
                                ? 'Contained'
                                : inc.status === 'verified'
                                ? 'Monitoring'
                                : inc.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </td>

                          {/* Units */}
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                            {inc.unitsDeployed || 0}
                          </td>

                          {/* Reported Time */}
                          <td className="py-3.5 px-4 text-right font-mono text-slate-400 text-[11px]">
                            {formatRelativeTime(inc.clientCreatedAt || inc.serverReceivedAt)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right 4 Cols: Incident Detail Drawer */}
        <div className="xl:col-span-4">
          {selectedIncident ? (
            <div className="bg-dark-surface border border-dark-border rounded-xl p-5 shadow-2xl space-y-5 sticky top-20">
              
              {/* Header */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1">
                  INCIDENT DETAIL
                </div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {selectedIncident.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      selectedIncident.severity === 'critical'
                        ? 'bg-brand-redDim text-brand-red border border-brand-red/40'
                        : selectedIncident.severity === 'high'
                        ? 'bg-brand-amberDim text-brand-amber border border-brand-amber/40'
                        : 'bg-brand-blueDim text-brand-blue border border-brand-blue/40'
                    }`}
                  >
                    {selectedIncident.severity}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-400 mt-1">
                  {selectedIncident.code} · {selectedIncident.latitude.toFixed(2)}°N {Math.abs(selectedIncident.longitude).toFixed(2)}°W
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 bg-dark-base/80 p-3.5 rounded-lg border border-dark-border text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Reported</span>
                  <span className="text-slate-200 font-semibold">
                    {formatRelativeTime(selectedIncident.clientCreatedAt)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Units on scene</span>
                  <span className="text-slate-200 font-semibold">
                    {selectedIncident.unitsDeployed || 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Evacuation</span>
                  <span className="text-brand-amber font-semibold">
                    {selectedIncident.evacuationZone || 'None active'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Est. clear</span>
                  <span className="text-slate-200 font-semibold">
                    {selectedIncident.estClearTime || '~4 hrs'}
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-dark-border">
                  <span className="text-slate-500 block text-[10px] uppercase">IC Officer</span>
                  <span className="text-brand-blue font-semibold">
                    {selectedIncident.icOfficer || 'Cpt. R. Torres'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="text-xs text-slate-300 leading-relaxed bg-dark-card/50 p-3 rounded-lg border border-dark-borderLight/40">
                {selectedIncident.description}
              </div>

              {/* Priority Formula Transparency Badge */}
              <div className="bg-dark-base p-3 rounded-lg border border-dark-border text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span>RULE-BASED PRIORITY SCORE</span>
                  <strong className="text-brand-amber text-sm font-bold">
                    {selectedIncident.priorityScore?.toFixed(2) || '8.45'} / 10.0
                  </strong>
                </div>
                <div className="w-full bg-dark-hover h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-blue via-brand-amber to-brand-red rounded-full"
                    style={{ width: `${Math.min(100, (selectedIncident.priorityScore || 7.5) * 10)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-1.5">
                  Reports linked: <strong>{selectedIncident.reportCount || 1}</strong> · Corroborated without discard
                </div>
              </div>

              {/* View Full Report Button */}
              <button
                onClick={() => onSelectIncidentDetail(selectedIncident)}
                className="w-full py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2"
              >
                <span>View Full Report & Triage</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Activity Log */}
              <div className="border-t border-dark-border pt-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-brand-red" />
                  <span>ACTIVITY LOG</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-red mt-1.5 shrink-0" />
                    <div>
                      <span className="font-mono text-slate-500 text-[11px] mr-1.5">
                        {formatRelativeTime(selectedIncident.updatedAt)}
                      </span>
                      <span>{selectedIncident.unitsDeployed || 12} units dispatched to {selectedIncident.locationName}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue mt-1.5 shrink-0" />
                    <div>
                      <span className="font-mono text-slate-500 text-[11px] mr-1.5">
                        {formatRelativeTime(selectedIncident.clientCreatedAt)}
                      </span>
                      <span>Initial incident reported & priority scoring engine computed</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-dark-surface border border-dark-border rounded-xl p-8 text-center text-slate-500 font-mono text-xs">
              Select an incident from the table or map to inspect details.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

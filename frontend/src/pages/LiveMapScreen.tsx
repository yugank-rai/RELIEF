import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Incident } from '../lib/api';
import { IncidentMap } from '../components/Map/IncidentMap';
import { 
  MapPin, 
  Layers, 
  Radio, 
  ShieldAlert, 
  Flame, 
  Droplets, 
  ChevronRight,
  Maximize2
} from 'lucide-react';

interface LiveMapScreenProps {
  onSelectIncidentDetail: (incident: Incident) => void;
}

export const LiveMapScreen: React.FC<LiveMapScreenProps> = ({ onSelectIncidentDetail }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    async function loadMapData() {
      try {
        const [incList, shList] = await Promise.all([
          api.incidents.getAll(),
          api.shelters.getAll(),
        ]);
        setIncidents(incList);
        setShelters(shList);
        if (incList.length > 0 && !selectedIncident) {
          setSelectedIncident(incList[0]);
        }
      } catch (err) {
        console.error('Failed to load live map data:', err);
      }
    }
    loadMapData();
  }, []);

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto">
      
      {/* Top Banner Matching Screenshot 4 */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-3.5 shadow-xl flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2.5 text-slate-300">
          <div className="w-2 h-2 rounded-full bg-brand-blue animate-ping" />
          <span className="text-slate-400">Map API slot active:</span>
          <span className="text-white font-semibold">OpenStreetMap Live Telemetry Embed (Riverside & Metro Sectors)</span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-brand-green" />
          <span>Real-time GPS synchronization active</span>
        </div>
      </div>

      {/* Main Layout: 8 Cols Map + 4 Cols Pinned Incidents (Matching Screenshot 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: Large Interactive Map with Layer Controls */}
        <div className="lg:col-span-8">
          <IncidentMap
            incidents={incidents}
            shelters={shelters}
            selectedIncident={selectedIncident}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            height="680px"
            showLayerControls={true}
          />
        </div>

        {/* Right 4 Cols: Pinned Incidents List (Matching Screenshot 4) */}
        <div className="lg:col-span-4 bg-dark-surface border border-dark-border rounded-xl p-5 shadow-2xl space-y-4">
          
          <div className="flex items-center justify-between border-b border-dark-border pb-3">
            <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-brand-red" />
              <span>PINNED INCIDENTS</span>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {incidents.length} active
            </span>
          </div>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer select-none space-y-2 ${
                    isSelected
                      ? 'bg-dark-card border-brand-blue shadow-lg ring-1 ring-brand-blue'
                      : 'bg-dark-base border-dark-border hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          inc.severity === 'critical'
                            ? 'bg-brand-red'
                            : inc.severity === 'high'
                            ? 'bg-brand-amber'
                            : 'bg-brand-blue'
                        }`}
                      />
                      <span className="font-bold text-xs text-white">
                        {inc.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {inc.code}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 font-mono">
                    {inc.locationName}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-dark-border text-slate-400">
                    <span>PRIORITY: <strong className="text-brand-amber">{inc.priorityScore?.toFixed(2)}</strong></span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIncidentDetail(inc);
                      }}
                      className="text-brand-blue hover:text-white flex items-center gap-1 font-semibold"
                    >
                      <span>Brief</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
};

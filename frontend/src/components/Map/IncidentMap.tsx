import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Incident } from '../../lib/api';
import { Layers, MapPin, ShieldAlert, Home, Navigation } from 'lucide-react';

interface IncidentMapProps {
  incidents: Incident[];
  selectedIncident?: Incident | null;
  onSelectIncident?: (incident: Incident) => void;
  shelters?: any[];
  height?: string;
  showLayerControls?: boolean;
}

// Custom Leaflet DivIcon generator for glowing radar beacons
function createPulsingIcon(severity: string) {
  const colorMap: Record<string, { bg: string; border: string; glowClass: string }> = {
    critical: { bg: '#F85149', border: '#FFA198', glowClass: 'pin-glow-critical' },
    high: { bg: '#D29922', border: '#F2CC60', glowClass: 'pin-glow-high' },
    moderate: { bg: '#58A6FF', border: '#A5D6FF', glowClass: 'pin-glow-moderate' },
    low: { bg: '#8B949E', border: '#C9D1D9', glowClass: '' },
    shelter: { bg: '#3FB950', border: '#7EE787', glowClass: 'pin-glow-nominal' },
  };

  const c = colorMap[severity] || colorMap.moderate;

  return L.divIcon({
    className: 'custom-radar-pin',
    html: `
      <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${c.bg}; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <span style="position: relative; width: 12px; height: 12px; border-radius: 50%; background-color: ${c.bg}; border: 2px solid ${c.border};" class="${c.glowClass}"></span>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function createShelterIcon() {
  return L.divIcon({
    className: 'custom-shelter-pin',
    html: `
      <div style="width: 26px; height: 26px; background-color: #111622; border: 2px solid #3FB950; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(63, 185, 80, 0.5);">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3FB950" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

// Evacuation zone polygon coordinates around Riverside Basin
const RIVERSIDE_ZONE_4: [number, number][] = [
  [34.062, -118.255],
  [34.058, -118.230],
  [34.045, -118.232],
  [34.048, -118.258],
];

export const IncidentMap: React.FC<IncidentMapProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  shelters = [],
  height = '420px',
  showLayerControls = true,
}) => {
  const [activeLayers, setActiveLayers] = useState({
    activeIncidents: true,
    communityReports: true,
    evacuationZones: true,
    shelterSites: true,
    resourcePositions: false,
    weatherOverlay: false,
  });

  const center: [number, number] = selectedIncident
    ? [selectedIncident.latitude, selectedIncident.longitude]
    : [34.0537, -118.2427]; // Metro Center

  const toggleLayer = (layerKey: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-dark-border bg-dark-base shadow-xl">
      
      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 bg-dark-surface/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-dark-borderLight text-xs font-mono text-slate-300">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-blue opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-blue"></span>
        </span>
        <span className="font-semibold text-white uppercase tracking-wider">
          INCIDENT MAP — METRO REGION
        </span>
        <span className="text-slate-500 font-mono text-[10px]">
          ({incidents.length} plotted)
        </span>
      </div>

      {/* Map Container */}
      <div style={{ height }}>
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          {/* Dark styled OpenStreetMap tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={18}
          />

          {/* Evacuation Zone Overlay */}
          {activeLayers.evacuationZones && (
            <Polygon
              positions={RIVERSIDE_ZONE_4}
              pathOptions={{
                color: '#F85149',
                fillColor: '#F85149',
                fillOpacity: 0.18,
                weight: 2,
                dashArray: '6, 6',
              }}
            >
              <Popup>
                <div className="p-1 font-sans">
                  <div className="text-brand-red font-bold text-xs uppercase font-mono">
                    MANDATORY EVACUATION ZONE 4
                  </div>
                  <div className="text-slate-300 text-xs mt-1">
                    Riverside Lowlands. Submerged roads. Evacuate to Riverside High School or Metro Civic Center.
                  </div>
                </div>
              </Popup>
            </Polygon>
          )}

          {/* Incident Pins */}
          {activeLayers.activeIncidents &&
            incidents.map(inc => (
              <React.Fragment key={inc.id}>
                <Marker
                  position={[inc.latitude, inc.longitude]}
                  icon={createPulsingIcon(inc.severity)}
                  eventHandlers={{
                    click: () => onSelectIncident && onSelectIncident(inc),
                  }}
                >
                  <Popup>
                    <div className="p-1 font-sans min-w-[200px]">
                      <div className="flex items-center justify-between gap-2 border-b border-dark-border pb-1 mb-1">
                        <span className="font-mono text-xs font-bold text-white">
                          {inc.code}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                            inc.severity === 'critical'
                              ? 'bg-brand-red/20 text-brand-red border border-brand-red/40'
                              : inc.severity === 'high'
                              ? 'bg-brand-amber/20 text-brand-amber border border-brand-amber/40'
                              : 'bg-brand-blue/20 text-brand-blue border border-brand-blue/40'
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </div>

                      <div className="font-semibold text-sm text-slate-100 mb-0.5">
                        {inc.title}
                      </div>

                      <div className="text-xs text-slate-400 mb-2">
                        {inc.locationName}
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-dark-base p-1.5 rounded">
                        <span>PRIORITY: <strong className="text-brand-amber">{inc.priorityScore?.toFixed(2) || '7.50'}</strong></span>
                        <span>UNITS: <strong className="text-white">{inc.unitsDeployed || 0}</strong></span>
                      </div>

                      {onSelectIncident && (
                        <button
                          onClick={() => onSelectIncident(inc)}
                          className="w-full mt-2 py-1 bg-brand-blue hover:bg-brand-blue/90 text-white rounded text-xs font-medium transition-colors"
                        >
                          View Incident Details
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>

                {/* 200m Dedup Radius Visualization */}
                {selectedIncident?.id === inc.id && (
                  <Circle
                    center={[inc.latitude, inc.longitude]}
                    radius={200}
                    pathOptions={{
                      color: '#58A6FF',
                      fillColor: '#58A6FF',
                      fillOpacity: 0.1,
                      weight: 1,
                    }}
                  />
                )}
              </React.Fragment>
            ))}

          {/* Shelter Pins */}
          {activeLayers.shelterSites &&
            shelters.map(shelter => (
              <Marker
                key={shelter.id}
                position={[shelter.latitude, shelter.longitude]}
                icon={createShelterIcon()}
              >
                <Popup>
                  <div className="p-1 font-sans min-w-[210px]">
                    <div className="flex items-center gap-1.5 text-brand-green font-mono text-xs font-bold uppercase mb-1">
                      <Home className="w-3.5 h-3.5" />
                      <span>EMERGENCY SHELTER</span>
                    </div>
                    <div className="font-semibold text-sm text-white mb-0.5">
                      {shelter.name}
                    </div>
                    <div className="text-xs text-slate-400 mb-2">
                      {shelter.locationName}
                    </div>
                    <div className="text-xs font-mono text-slate-300 bg-dark-base p-1.5 rounded flex justify-between">
                      <span>Occupancy:</span>
                      <strong>{shelter.occupancy} / {shelter.capacity} ({Math.round((shelter.occupancy / shelter.capacity) * 100)}%)</strong>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      {/* Layer Controls Side Overlay */}
      {showLayerControls && (
        <div className="absolute top-3 right-3 z-[400] bg-dark-surface/95 backdrop-blur-md p-3 rounded-xl border border-dark-borderLight shadow-2xl w-48 text-xs font-mono">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-dark-border pb-1">
            <Layers className="w-3.5 h-3.5 text-brand-blue" />
            <span>MAP LAYERS</span>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-red"></span>
                <span>Active Incidents</span>
              </span>
              <span className={`text-[10px] ${activeLayers.activeIncidents ? 'text-brand-green font-bold' : 'text-slate-500'}`}>
                {activeLayers.activeIncidents ? 'on' : 'off'}
              </span>
              <input
                type="checkbox"
                checked={activeLayers.activeIncidents}
                onChange={() => toggleLayer('activeIncidents')}
                className="hidden"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-blue"></span>
                <span>Community Reports</span>
              </span>
              <span className={`text-[10px] ${activeLayers.communityReports ? 'text-brand-green font-bold' : 'text-slate-500'}`}>
                {activeLayers.communityReports ? 'on' : 'off'}
              </span>
              <input
                type="checkbox"
                checked={activeLayers.communityReports}
                onChange={() => toggleLayer('communityReports')}
                className="hidden"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-amber"></span>
                <span>Evacuation Zones</span>
              </span>
              <span className={`text-[10px] ${activeLayers.evacuationZones ? 'text-brand-green font-bold' : 'text-slate-500'}`}>
                {activeLayers.evacuationZones ? 'on' : 'off'}
              </span>
              <input
                type="checkbox"
                checked={activeLayers.evacuationZones}
                onChange={() => toggleLayer('evacuationZones')}
                className="hidden"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-green"></span>
                <span>Shelter Sites</span>
              </span>
              <span className={`text-[10px] ${activeLayers.shelterSites ? 'text-brand-green font-bold' : 'text-slate-500'}`}>
                {activeLayers.shelterSites ? 'on' : 'off'}
              </span>
              <input
                type="checkbox"
                checked={activeLayers.shelterSites}
                onChange={() => toggleLayer('shelterSites')}
                className="hidden"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-slate-400 hover:text-white">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-purple"></span>
                <span>Resource Positions</span>
              </span>
              <span className={`text-[10px] ${activeLayers.resourcePositions ? 'text-brand-green font-bold' : 'text-slate-500'}`}>
                {activeLayers.resourcePositions ? 'on' : 'off'}
              </span>
              <input
                type="checkbox"
                checked={activeLayers.resourcePositions}
                onChange={() => toggleLayer('resourcePositions')}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

    </div>
  );
};

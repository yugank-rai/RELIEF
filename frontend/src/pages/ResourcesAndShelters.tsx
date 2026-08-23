import React, { useState, useEffect } from 'react';
import { 
  api 
} from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  Boxes, 
  Home, 
  Activity, 
  Flame, 
  Droplets, 
  ShieldCheck, 
  Plus, 
  Send, 
  Phone, 
  MapPin, 
  Check, 
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';

export const ResourcesAndShelters: React.FC = () => {
  const { user } = useAuth();
  const [resourceData, setResourceData] = useState<any>(null);
  const [shelters, setShelters] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'resources' | 'shelters'>('resources');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Allocate stock state
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
  const [allocQty, setAllocQty] = useState<number>(5);
  const [targetZone, setTargetZone] = useState<string>('Riverside District (Zone 4)');

  const fetchData = async () => {
    try {
      const [resOverview, shelterList] = await Promise.all([
        api.resources.getOverview(),
        api.shelters.getAll(34.0537, -118.2427),
      ]);
      setResourceData(resOverview);
      setShelters(shelterList);
    } catch (err) {
      console.error('Failed to load resources and shelters data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockId) return;

    try {
      await api.resources.allocate({
        stockId: selectedStockId,
        quantity: allocQty,
        targetZone,
      });
      setActionFeedback(`✅ Successfully allocated ${allocQty} units to ${targetZone}`);
      setTimeout(() => setActionFeedback(null), 4000);
      setSelectedStockId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Allocation failed');
    }
  };

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto">
      
      {/* Tab Switcher & Feedback Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-dark-surface border border-dark-border rounded-xl p-4 shadow-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 rounded-lg text-xs font-mono uppercase font-bold flex items-center gap-2 transition-all ${
              activeTab === 'resources'
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
                : 'text-slate-400 hover:text-white hover:bg-dark-hover'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Resource Availability & Logistics</span>
          </button>

          <button
            onClick={() => setActiveTab('shelters')}
            className={`px-4 py-2 rounded-lg text-xs font-mono uppercase font-bold flex items-center gap-2 transition-all ${
              activeTab === 'shelters'
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
                : 'text-slate-400 hover:text-white hover:bg-dark-hover'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Shelter & Safe Haven Finder</span>
          </button>
        </div>

        {actionFeedback && (
          <div className="text-xs font-mono px-3.5 py-1.5 rounded-lg bg-brand-greenDim border border-brand-green/40 text-brand-green font-semibold animate-in fade-in">
            {actionFeedback}
          </div>
        )}
      </div>

      {activeTab === 'resources' ? (
        /* Resources View (Matching Screenshot 2) */
        <div className="space-y-6">
          
          {/* Top Row: Resource Availability Bars + Deployment Summary (Matching Screenshot 2) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 6 Cols: Resource Availability (Bars) */}
            <div className="lg:col-span-6 bg-dark-surface border border-dark-border rounded-xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-dark-border pb-3">
                <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  RESOURCE AVAILABILITY
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Total Deployed: <strong className="text-white">{resourceData?.totalDeployedUnits || 30}</strong> / {resourceData?.totalAvailableUnits || 49}
                </div>
              </div>

              <div className="space-y-4">
                {resourceData?.availabilityCategories?.map((cat: any) => {
                  const percent = Math.round((cat.deployed / cat.total) * 100);
                  return (
                    <div key={cat.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-200 font-semibold">{cat.label}</span>
                        <span className="text-slate-400">
                          <strong className="text-white">{cat.deployed}</strong>/{cat.total}
                        </span>
                      </div>
                      <div className="w-full bg-dark-base h-2 rounded-full overflow-hidden border border-dark-border">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 6 Cols: Deployment Summary (Matching Screenshot 2) */}
            <div className="lg:col-span-6 bg-dark-surface border border-dark-border rounded-xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-dark-border pb-3">
                <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  DEPLOYMENT SUMMARY
                </div>
                <span className="text-xs font-mono text-brand-blue font-semibold">
                  5 Active Sectors
                </span>
              </div>

              <div className="space-y-3">
                {resourceData?.deployments?.map((dep: any) => (
                  <div
                    key={dep.id}
                    className="bg-dark-base/80 border border-dark-border rounded-xl p-3.5 flex items-center justify-between hover:border-dark-borderLight transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-xs text-white">
                        {dep.location}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {dep.mission}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-sm text-white">
                        {dep.units} <span className="text-xs font-normal text-slate-400">units</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-brand-redDim text-brand-red border border-brand-red/30 uppercase font-semibold">
                        {dep.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Section: Inventory — Critical Supplies (Matching Screenshot 2) */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-dark-border pb-3">
              <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                INVENTORY — CRITICAL SUPPLIES
              </div>
              <span className="text-xs font-mono text-slate-500">
                Live Warehouses & Staging Depots
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {resourceData?.inventory?.map((item: any) => {
                const percent = Math.round((item.quantity / item.maxCapacity) * 100);
                return (
                  <div
                    key={item.id}
                    className="bg-dark-base border border-dark-border rounded-xl p-4 space-y-3 hover:border-slate-500 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-white leading-tight">
                        {item.itemName}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-dark-card border border-dark-border text-slate-400 uppercase">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1 font-mono">
                      <span className="text-2xl font-bold text-brand-amber">{item.quantity}</span>
                      <span className="text-xs text-slate-400">/ {item.maxCapacity} {item.unit}</span>
                    </div>

                    <div className="w-full bg-dark-card h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-amber rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <button
                      onClick={() => setSelectedStockId(item.id)}
                      className="w-full py-1.5 bg-dark-card hover:bg-dark-hover border border-dark-borderLight text-slate-300 rounded text-xs font-mono transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3 h-3 text-brand-blue" />
                      <span>Allocate Supplies</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stock Allocation Modal */}
          {selectedStockId && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-dark-border pb-3">
                  <h4 className="text-sm font-bold text-white font-mono uppercase">
                    Allocate Critical Supplies to Emergency Zone
                  </h4>
                  <button
                    onClick={() => setSelectedStockId(null)}
                    className="text-slate-400 hover:text-white text-xs font-mono"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAllocate} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="text-slate-400 block mb-1">Target Zone / Sector</label>
                    <input
                      type="text"
                      required
                      value={targetZone}
                      onChange={(e) => setTargetZone(e.target.value)}
                      className="w-full p-2 bg-dark-base border border-dark-borderLight rounded text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Quantity to Dispatch</label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={allocQty}
                      onChange={(e) => setAllocQty(Number(e.target.value))}
                      className="w-full p-2 bg-dark-base border border-dark-borderLight rounded text-white text-xs"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStockId(null)}
                      className="flex-1 py-2 bg-dark-card border border-dark-border rounded text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-brand-blue text-white rounded font-bold hover:bg-brand-blue/90"
                    >
                      Confirm Allocation
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* Shelter Finder View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shelters.map((shelter) => {
            const occupancyPercent = shelter.occupancyPercent || Math.round((shelter.occupancy / shelter.capacity) * 100);
            const isFull = occupancyPercent >= 95;
            return (
              <div
                key={shelter.id}
                className="bg-dark-surface border border-dark-border rounded-xl p-5 shadow-2xl space-y-4 hover:border-slate-500 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-white tracking-tight">
                      {shelter.name}
                    </h4>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {shelter.locationName}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase shrink-0 ${
                      isFull
                        ? 'bg-brand-redDim text-brand-red border border-brand-red/40'
                        : 'bg-brand-greenDim text-brand-green border border-brand-green/40'
                    }`}
                  >
                    {isFull ? 'NEAR FULL' : 'ACCEPTING EVACUEES'}
                  </span>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1.5 bg-dark-base p-3 rounded-lg border border-dark-border text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>CAPACITY OCCUPIED</span>
                    <strong className="text-white">
                      {shelter.occupancy} / {shelter.capacity} ({occupancyPercent}%)
                    </strong>
                  </div>
                  <div className="w-full bg-dark-card h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFull
                          ? 'bg-brand-red'
                          : occupancyPercent > 75
                          ? 'bg-brand-amber'
                          : 'bg-brand-green'
                      }`}
                      style={{ width: `${Math.min(100, occupancyPercent)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 pt-0.5 flex justify-between">
                    <span>Available beds: <strong className="text-slate-300">{shelter.availableBeds}</strong></span>
                    {shelter.distanceKm && <span>{shelter.distanceKm} km away</span>}
                  </div>
                </div>

                {/* Amenities Badges */}
                <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                  {shelter.hasMedical && (
                    <span className="px-2 py-0.5 rounded bg-brand-blueDim text-brand-blue border border-brand-blue/30">
                      ✚ Medical Staff
                    </span>
                  )}
                  {shelter.hasFood && (
                    <span className="px-2 py-0.5 rounded bg-brand-greenDim text-brand-green border border-brand-green/30">
                      🍲 Hot Food
                    </span>
                  )}
                  {shelter.hasPower && (
                    <span className="px-2 py-0.5 rounded bg-brand-amberDim text-brand-amber border border-brand-amber/30">
                      ⚡ Generator Power
                    </span>
                  )}
                </div>

                {/* Address & Contact */}
                <div className="text-xs font-mono text-slate-400 space-y-1 pt-2 border-t border-dark-border">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{shelter.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{shelter.contactPhone}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

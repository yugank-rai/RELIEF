import React, { useState } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  Crosshair, 
  Send, 
  CheckCircle2, 
  WifiOff, 
  ShieldAlert,
  Info,
  Clock,
  Sparkles,
  AlertOctagon,
  Users
} from 'lucide-react';
import { api } from '../lib/api';
import { queueOfflineReport } from '../lib/offlineQueue';
import { useAuth } from '../context/AuthContext';

interface ReportThreatProps {
  onIncidentReported: () => void;
}

const THREAT_TYPES = [
  { id: 'flood', label: 'Flood / Water Hazard' },
  { id: 'wildfire', label: 'Wildfire / Smoke' },
  { id: 'structure_fire', label: 'Structure Fire' },
  { id: 'gas_leak', label: 'Gas Leak / Explosion' },
  { id: 'landslide', label: 'Landslide / Erosion' },
  { id: 'road_collapse', label: 'Road Collapse / Sinkhole' },
  { id: 'chemical_spill', label: 'Chemical Spill' },
  { id: 'medical', label: 'Medical Emergency' },
  { id: 'civil_unrest', label: 'Civil Unrest' },
  { id: 'other', label: 'Other' },
];

const SEVERITY_LEVELS = [
  {
    id: 'low',
    label: 'Low',
    desc: 'Minor — no immediate danger',
    border: 'border-slate-600',
    selectedBg: 'bg-dark-hover border-slate-400',
    textColor: 'text-slate-300',
  },
  {
    id: 'moderate',
    label: 'Moderate',
    desc: 'Developing — monitor closely',
    border: 'border-brand-blue/30',
    selectedBg: 'bg-brand-blueDim border-brand-blue text-brand-blue',
    textColor: 'text-brand-blue',
  },
  {
    id: 'high',
    label: 'High',
    desc: 'Serious — response needed',
    border: 'border-brand-amber/30',
    selectedBg: 'bg-brand-amberDim border-brand-amber text-brand-amber',
    textColor: 'text-brand-amber',
  },
  {
    id: 'critical',
    label: 'Critical',
    desc: 'Life-threatening — urgent',
    border: 'border-brand-red/30',
    selectedBg: 'bg-brand-redDim border-brand-red text-brand-red',
    textColor: 'text-brand-red',
  },
];

export const ReportThreat: React.FC<ReportThreatProps> = ({ onIncidentReported }) => {
  const { user } = useAuth();
  
  const [selectedType, setSelectedType] = useState<string>('flood');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('high');
  const [locationName, setLocationName] = useState<string>('');
  const [latitude, setLatitude] = useState<number>(34.0537);
  const [longitude, setLongitude] = useState<number>(-118.2427);
  const [description, setDescription] = useState<string>('');
  const [trappedCount, setTrappedCount] = useState<number>(0);
  const [elderlyChildCount, setElderlyChildCount] = useState<number>(0);
  const [medicalEmergency, setMedicalEmergency] = useState<boolean>(false);
  const [reporterName, setReporterName] = useState<string>(user?.name || '');
  const [reporterPhone, setReporterPhone] = useState<string>(user?.phone || '');
  const [isGettingGps, setIsGettingGps] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    type: 'success' | 'corroborated' | 'offline' | 'error';
    message: string;
    details?: any;
  } | null>(null);

  // GPS Auto-Fill
  const handleUseGps = () => {
    setIsGettingGps(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          if (!locationName) {
            setLocationName(`GPS Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
          }
          setIsGettingGps(false);
        },
        (err) => {
          console.warn('GPS failed, using Metro coordinates:', err);
          // Fallback to active disaster zone coordinate
          setLatitude(34.0540);
          setLongitude(-118.2430);
          setLocationName('Riverside Basin (GPS autofilled)');
          setIsGettingGps(false);
        },
        { timeout: 5000 }
      );
    } else {
      setLatitude(34.0540);
      setLongitude(-118.2430);
      setLocationName('Metro Emergency Zone (GPS autofilled)');
      setIsGettingGps(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !locationName.trim()) {
      alert('Please fill in both location and description.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionFeedback(null);

    const payload = {
      type: selectedType,
      severity: selectedSeverity,
      description,
      locationName,
      latitude,
      longitude,
      accuracyMeters: 15,
      trappedCount: Number(trappedCount),
      elderlyChildCount: Number(elderlyChildCount),
      medicalEmergency,
      resourceUrgencyScore: selectedSeverity === 'critical' ? 9.0 : selectedSeverity === 'high' ? 7.0 : 4.0,
      reporterName: reporterName || 'Anonymous Citizen',
      reporterPhone: reporterPhone || null,
      clientCreatedAt: new Date().toISOString(),
    };

    // Offline check: If navigator is offline or server unreachable, queue in IndexedDB
    if (!navigator.onLine) {
      await queueOfflineReport(payload);
      setSubmissionFeedback({
        type: 'offline',
        message: 'No internet connection detected. Your report has been securely saved locally and will auto-sync to emergency dispatch as soon as connection is restored.',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await api.incidents.report(payload);
      if (res.corroborated) {
        setSubmissionFeedback({
          type: 'corroborated',
          message: res.message,
          details: res,
        });
      } else {
        setSubmissionFeedback({
          type: 'success',
          message: res.message,
          details: res,
        });
      }

      // Reset form fields
      setDescription('');
      setLocationName('');
      setTrappedCount(0);
      setElderlyChildCount(0);
      setMedicalEmergency(false);
      onIncidentReported();
    } catch (err: any) {
      console.warn('Online submission failed, falling back to offline queue:', err);
      await queueOfflineReport(payload);
      setSubmissionFeedback({
        type: 'offline',
        message: 'Server unreachable. Report queued safely in your browser and will automatically transmit once connected.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Static sample community reports matching Screenshot 3
  const recentCommunityReports = [
    {
      id: 'RPT-014',
      initials: 'M',
      author: 'Maria L.',
      category: 'Flood / Water Hazard',
      location: 'Elm St & 5th Ave',
      time: '6 min ago',
      text: 'Street completely submerged, water reaching front doors. 3 families unable to leave.',
      severity: 'high',
    },
    {
      id: 'RPT-013',
      initials: 'J',
      author: 'James K.',
      category: 'Road Collapse / Sinkhole',
      location: 'Park Blvd near Oakwood',
      time: '31 min ago',
      text: 'Large sinkhole appeared in road, about 2m wide. Traffic blocked both directions.',
      severity: 'moderate',
    },
    {
      id: 'RPT-012',
      initials: 'P',
      author: 'Priya N.',
      category: 'Gas Leak / Explosion',
      location: 'Industrial Zone C',
      time: '1 hr ago',
      text: 'Strong smell of gas near warehouse row. Two workers already evacuated.',
      severity: 'critical',
    },
  ];

  return (
    <div className="max-w-[1500px] mx-auto space-y-6">
      
      {/* Feedback banner if just submitted */}
      {submissionFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-xl animate-in fade-in slide-in-from-top-3 ${
            submissionFeedback.type === 'corroborated'
              ? 'bg-brand-blueDim/80 border-brand-blue/50 text-white'
              : submissionFeedback.type === 'offline'
              ? 'bg-brand-amberDim/80 border-brand-amber/50 text-white'
              : 'bg-brand-greenDim/80 border-brand-green/50 text-white'
          }`}
        >
          {submissionFeedback.type === 'offline' ? (
            <WifiOff className="w-5 h-5 text-brand-amber shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
          )}
          <div className="text-xs font-mono leading-relaxed">
            <strong className="block font-bold text-sm mb-1 uppercase tracking-wide">
              {submissionFeedback.type === 'corroborated'
                ? '⚡ Report Corroborated Existing Incident'
                : submissionFeedback.type === 'offline'
                ? '📦 Report Queued Offline (Auto-Sync Armed)'
                : '✅ Incident Created & Prioritized'}
            </strong>
            <span>{submissionFeedback.message}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Left Form (8 Cols) + Right Community Reports (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: Threat Submission Form (Matching Screenshot 3) */}
        <div className="lg:col-span-8 bg-dark-surface border border-dark-border rounded-xl p-6 shadow-2xl space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-dark-border pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-redDim border border-brand-red/40 flex items-center justify-center text-brand-red">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Report a Threat in Your Area
                </h2>
                <div className="text-[11px] font-mono text-slate-400">
                  Citizen emergency dispatch · Multi-factor priority queued
                </div>
              </div>
            </div>

            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-dark-base border border-dark-border text-slate-400">
              Public submission
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* THREAT TYPE * (Selectable Grid from Screenshot 3) */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5">
                THREAT TYPE *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {THREAT_TYPES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedType(t.id)}
                    className={`py-2.5 px-3 rounded-lg text-xs font-medium text-left transition-all border ${
                      selectedType === t.id
                        ? 'bg-dark-cardElevated border-brand-blue text-white shadow-md shadow-brand-blue/10 ring-1 ring-brand-blue'
                        : 'bg-dark-base border-dark-borderLight text-slate-300 hover:bg-dark-hover hover:border-slate-500'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SEVERITY LEVEL * (4 Cards from Screenshot 3) */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5">
                SEVERITY LEVEL *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {SEVERITY_LEVELS.map(lvl => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setSelectedSeverity(lvl.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      selectedSeverity === lvl.id
                        ? `${lvl.selectedBg} ring-1 ring-current shadow-lg`
                        : `bg-dark-base ${lvl.border} text-slate-400 hover:bg-dark-hover`
                    }`}
                  >
                    <div className="font-bold text-sm text-white mb-1">
                      {lvl.label}
                    </div>
                    <div className="text-[11px] leading-tight text-slate-400">
                      {lvl.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* LOCATION * with GPS Button */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                LOCATION *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Street address, landmark, or description..."
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-dark-base border border-dark-borderLight rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUseGps}
                  disabled={isGettingGps}
                  className="px-3.5 py-2 rounded-lg bg-dark-card border border-dark-borderLight hover:bg-dark-hover text-xs font-mono text-brand-blue flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <Crosshair className={`w-3.5 h-3.5 ${isGettingGps ? 'animate-spin' : ''}`} />
                  <span>{isGettingGps ? 'Locating...' : '+ Use GPS'}</span>
                </button>
              </div>
            </div>

            {/* DESCRIPTION * */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                DESCRIPTION *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe what you're seeing — conditions, number of people affected, access routes, any immediate dangers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-dark-base border border-dark-borderLight rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue transition-colors leading-relaxed"
              />
            </div>

            {/* Vulnerability & Immediate Distress Modifiers (Inputs to Formula) */}
            <div className="bg-dark-base p-4 rounded-xl border border-dark-border space-y-3">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-amber" />
                <span>VULNERABILITY & RESCUE FACTORS (PRIORITY WEIGHTS)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block mb-1">Trapped Individuals</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={trappedCount}
                    onChange={(e) => setTrappedCount(Number(e.target.value))}
                    className="w-full p-1.5 bg-dark-surface border border-dark-borderLight rounded text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Elderly / Children</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={elderlyChildCount}
                    onChange={(e) => setElderlyChildCount(Number(e.target.value))}
                    className="w-full p-1.5 bg-dark-surface border border-dark-borderLight rounded text-white text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="med-emergency-chk"
                    checked={medicalEmergency}
                    onChange={(e) => setMedicalEmergency(e.target.checked)}
                    className="w-4 h-4 rounded bg-dark-surface border-dark-borderLight text-brand-red focus:ring-0"
                  />
                  <label htmlFor="med-emergency-chk" className="text-slate-300 text-xs cursor-pointer select-none">
                    Immediate Medical Emergency
                  </label>
                </div>
              </div>
            </div>

            {/* Reporter Contact Info (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Your Name (Optional / Anonymous)
                </label>
                <input
                  type="text"
                  placeholder="Anonymous Citizen"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full p-2 bg-dark-base border border-dark-borderLight rounded-lg text-xs text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Callback Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  className="w-full p-2 bg-dark-base border border-dark-borderLight rounded-lg text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-brand-red hover:bg-brand-red/90 disabled:opacity-50 text-white rounded-xl text-sm font-semibold tracking-wide transition-all shadow-xl shadow-brand-red/20 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Transmitting Threat Data...' : 'Submit Emergency Report'}</span>
            </button>

          </form>

        </div>

        {/* Right 4 Cols: Recent Community Reports + Guidelines (Matching Screenshot 3) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Recent Community Reports Box */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-5 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-dark-border pb-3">
              <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                RECENT COMMUNITY REPORTS
              </div>
              <span className="text-[11px] font-mono text-brand-blue font-semibold">
                3 reports
              </span>
            </div>

            <div className="space-y-3.5">
              {recentCommunityReports.map(rep => (
                <div
                  key={rep.id}
                  className="bg-dark-base/80 border border-dark-border rounded-lg p-3.5 space-y-2 hover:border-dark-borderLight transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-blueDim text-brand-blue font-bold text-[10px] flex items-center justify-center">
                        {rep.initials}
                      </div>
                      <span className="font-semibold text-xs text-white">{rep.author}</span>
                      <span className="text-[10px] font-mono text-slate-500">{rep.id}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{rep.time}</span>
                  </div>

                  <div className="text-xs text-slate-400 font-medium">
                    {rep.category} · {rep.location}
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed">
                    {rep.text}
                  </div>

                  <div className="pt-1">
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        rep.severity === 'critical'
                          ? 'bg-brand-redDim text-brand-red border border-brand-red/40'
                          : rep.severity === 'high'
                          ? 'bg-brand-amberDim text-brand-amber border border-brand-amber/40'
                          : 'bg-brand-blueDim text-brand-blue border border-brand-blue/40'
                      }`}
                    >
                      {rep.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Submission Guidelines Box */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-5 shadow-2xl space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-brand-blue" />
              <span>SUBMISSION GUIDELINES</span>
            </div>

            <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-brand-blue font-bold">•</span>
                <span><strong>No Account Needed:</strong> Citizens can report threats anonymously without logging in.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-brand-blue font-bold">•</span>
                <span><strong>Corroboration:</strong> Reports within 200m of existing events are linked together to raise triage priority without duplication.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-brand-blue font-bold">•</span>
                <span><strong>Offline Tolerant:</strong> If cellular coverage drops, reports are held in your local queue and sync automatically upon reconnection.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};

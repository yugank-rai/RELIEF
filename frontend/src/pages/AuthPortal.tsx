import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../lib/api';
import { 
  AlertTriangle, 
  ShieldAlert, 
  UserCheck, 
  LogIn, 
  UserPlus, 
  Radio, 
  Boxes, 
  Home, 
  HeartHandshake, 
  ArrowRight, 
  Sparkles, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  Building,
  Globe
} from 'lucide-react';

const VOLUNTEER_SKILL_OPTIONS = [
  { id: 'medical', label: 'Medical & Paramedic (EMT)' },
  { id: 'water_rescue', label: 'Water Rescue & Boat Operator' },
  { id: 'search_and_rescue', label: 'Urban Search & Rescue (USAR)' },
  { id: 'firefighting', label: 'Firefighting & Wildfire Suppression' },
  { id: 'hazmat', label: 'Hazmat Containment & Chemical Safety' },
  { id: 'heavy_machinery', label: 'Heavy Machinery & Road Clearing' },
  { id: 'logistics', label: 'Emergency Logistics & Supply Driver' },
];

export const AuthPortal: React.FC = () => {
  const { login, register, googleSignIn, quickLogin, enableAnonymousMode } = useAuth();

  // Portal Level: 'authority' (Command & Logistics) vs 'public' (Citizens & Volunteers)
  const [portalType, setPortalType] = useState<'authority' | 'public'>('authority');
  
  // Auth Mode within portal: 'login' | 'register'
  const [formMode, setFormMode] = useState<'login' | 'register'>('login');

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('authority');
  const [authorityPasscode, setAuthorityPasscode] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Google Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync default role when switching portal
  const handlePortalSwitch = (type: 'authority' | 'public') => {
    setPortalType(type);
    setErrorMessage(null);
    if (type === 'authority') {
      setRegRole('authority');
      setLoginEmail('authority@relief.org');
      setLoginPassword('relief2026');
    } else {
      setRegRole('citizen');
      setLoginEmail('citizen@relief.org');
      setLoginPassword('relief2026');
    }
  };

  // Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(loginEmail, loginPassword, portalType);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed');
      setIsLoading(false);
    }
  };

  // Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone || !regPassword) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    if (portalType === 'authority' && !authorityPasscode) {
      setErrorMessage("Command Passcode required for Authority registration (Demo code: COMMAND-2026)");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        role: regRole,
        authorityPasscode: portalType === 'authority' ? authorityPasscode : undefined,
        skills: regRole === 'volunteer' ? selectedSkills : [],
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed');
      setIsLoading(false);
    }
  };

  // Google / Gmail Sign In Trigger
  const handleGoogleAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const emailToUse = googleEmail || (portalType === 'authority' ? 'commander.officer@gmail.com' : 'citizen.resident@gmail.com');
    const nameToUse = googleName || (portalType === 'authority' ? 'Commander Officer' : 'Citizen Resident');

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await googleSignIn({
        email: emailToUse,
        name: nameToUse,
        role: portalType === 'authority' ? regRole : (regRole === 'volunteer' ? 'volunteer' : 'citizen'),
        authorityPasscode: portalType === 'authority' ? (authorityPasscode || 'COMMAND-2026') : undefined,
        skills: regRole === 'volunteer' ? selectedSkills : [],
      });
      setShowGoogleModal(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Google authentication failed');
      setIsLoading(false);
    }
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) ? prev.filter(s => s !== skillId) : [...prev, skillId]
    );
  };

  return (
    <div className="min-h-screen bg-dark-base text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden bg-grid-pattern">
      
      {/* Glow Backdrops */}
      <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
        portalType === 'authority' ? 'bg-brand-red/15' : 'bg-brand-blue/15'
      }`} />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-xl bg-dark-surface border border-dark-border rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/90 relative z-10 space-y-6">
        
        {/* Brand & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-redDim border border-brand-red/40 text-brand-red shadow-xl shadow-brand-red/20 mb-1">
            <AlertTriangle className="w-7 h-7 animate-pulse" />
          </div>

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              DisasterOps Command Center
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-blueDim text-brand-blue border border-brand-blue/40 font-bold">
              RELIEF
            </span>
          </div>

          <p className="text-xs font-mono text-slate-400">
            Emergency Response, Triage Dispatch & Citizen Logistics
          </p>
        </div>

        {/* 1. SEPARATE PORTAL SELECTION (Authority vs Public Citizen/Volunteer) */}
        <div className="grid grid-cols-2 gap-2 bg-dark-base p-1.5 rounded-2xl border border-dark-borderLight text-xs font-mono">
          <button
            type="button"
            onClick={() => handlePortalSwitch('authority')}
            className={`py-3 px-3 rounded-xl font-bold transition-all flex flex-col items-center gap-1 ${
              portalType === 'authority'
                ? 'bg-brand-red text-white shadow-lg shadow-brand-red/25 border border-brand-red/50'
                : 'text-slate-400 hover:text-white hover:bg-dark-hover'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>Authority Command</span>
            </div>
            <span className="text-[9px] font-normal opacity-80">Commanders & Logistics</span>
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch('public')}
            className={`py-3 px-3 rounded-xl font-bold transition-all flex flex-col items-center gap-1 ${
              portalType === 'public'
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/25 border border-brand-blue/50'
                : 'text-slate-400 hover:text-white hover:bg-dark-hover'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              <span>Public Citizen & Volunteer</span>
            </div>
            <span className="text-[9px] font-normal opacity-80">Reports & Responders</span>
          </button>
        </div>

        {/* Portal Context Banner */}
        <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
          portalType === 'authority'
            ? 'bg-brand-redDim/40 border-brand-red/30 text-slate-200'
            : 'bg-brand-blueDim/40 border-brand-blue/30 text-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${portalType === 'authority' ? 'bg-brand-red' : 'bg-brand-blue'}`} />
            <span>
              {portalType === 'authority' ? 'RESTRICTED COMMAND CLEARANCE' : 'PUBLIC CITIZEN & RESPONDER NETWORK'}
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase text-slate-400">
            {portalType === 'authority' ? 'OFFICIALS ONLY' : 'OPEN ACCESS'}
          </span>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-brand-redDim border border-brand-red/40 text-brand-red text-xs font-mono flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sub Mode: Sign In vs Register */}
        <div className="flex items-center justify-between border-b border-dark-border pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setFormMode('login'); setErrorMessage(null); }}
              className={`text-xs font-mono font-bold pb-1 border-b-2 transition-all ${
                formMode === 'login'
                  ? 'text-white border-brand-blue'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              Sign In with Account
            </button>
            <span className="text-slate-600">·</span>
            <button
              type="button"
              onClick={() => { setFormMode('register'); setErrorMessage(null); }}
              className={`text-xs font-mono font-bold pb-1 border-b-2 transition-all ${
                formMode === 'register'
                  ? 'text-white border-brand-blue'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              Register New Profile
            </button>
          </div>

          <span className="text-[10px] font-mono text-slate-500">JWT & Zod Guarded</span>
        </div>

        {/* Google / Gmail Sign In Button */}
        <div>
          <button
            type="button"
            onClick={() => setShowGoogleModal(true)}
            className="w-full py-2.5 px-4 bg-dark-base hover:bg-dark-hover border border-dark-borderLight rounded-xl text-xs font-mono font-semibold text-slate-200 transition-all flex items-center justify-center gap-3 shadow-md group"
          >
            {/* Google SVG Icon */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google / Gmail</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
          <div className="flex-1 h-[1px] bg-dark-border" />
          <span>OR SIGN IN WITH EMAIL</span>
          <div className="flex-1 h-[1px] bg-dark-border" />
        </div>

        {/* 2. FORM: SIGN IN */}
        {formMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Official Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="officer@relief.org"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-dark-base border border-dark-borderLight rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-dark-base border border-dark-borderLight rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>

            {/* Evaluator Demo Credentials Autofill */}
            <div className="bg-dark-base p-3 rounded-xl border border-dark-border space-y-1.5 font-mono">
              <div className="text-[10px] uppercase text-slate-400 font-bold">
                Demo Accounts (Password: relief2026)
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {portalType === 'authority' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { setLoginEmail('authority@relief.org'); setLoginPassword('relief2026'); }}
                      className="p-1.5 bg-dark-card hover:bg-dark-hover border border-dark-borderLight rounded text-left text-brand-blue truncate"
                    >
                      🛡️ Incident Commander
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLoginEmail('resources@relief.org'); setLoginPassword('relief2026'); }}
                      className="p-1.5 bg-dark-card hover:bg-dark-hover border border-dark-borderLight rounded text-left text-brand-amber truncate"
                    >
                      📦 Resource Manager
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => { setLoginEmail('priya.volunteer@relief.org'); setLoginPassword('relief2026'); }}
                      className="p-1.5 bg-dark-card hover:bg-dark-hover border border-dark-borderLight rounded text-left text-brand-green truncate"
                    >
                      🚑 Volunteer (EMT)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLoginEmail('citizen@relief.org'); setLoginPassword('relief2026'); }}
                      className="p-1.5 bg-dark-card hover:bg-dark-hover border border-dark-borderLight rounded text-left text-slate-300 truncate"
                    >
                      👤 Citizen (Public)
                    </button>
                  </>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 text-white rounded-xl text-xs font-mono font-bold tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                portalType === 'authority'
                  ? 'bg-brand-red hover:bg-brand-red/90 shadow-brand-red/20'
                  : 'bg-brand-blue hover:bg-brand-blue/90 shadow-brand-blue/20'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Verifying Credentials...' : `Sign In to ${portalType === 'authority' ? 'Command Center' : 'Network'}`}</span>
            </button>
          </form>
        )}

        {/* 3. FORM: REGISTER */}
        {formMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            {/* Role Selection Specific to Portal */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Select Clearance Level / Role *
              </label>
              
              {portalType === 'authority' ? (
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setRegRole('authority')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      regRole === 'authority'
                        ? 'bg-brand-redDim border-brand-red text-white font-bold'
                        : 'bg-dark-base border-dark-borderLight text-slate-400'
                    }`}
                  >
                    <div className="font-bold">Authority Commander</div>
                    <div className="text-[10px] text-slate-400">Triage, dispatch & overrides</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('resource_manager')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      regRole === 'resource_manager'
                        ? 'bg-brand-amberDim border-brand-amber text-white font-bold'
                        : 'bg-dark-base border-dark-borderLight text-slate-400'
                    }`}
                  >
                    <div className="font-bold">Resource Manager</div>
                    <div className="text-[10px] text-slate-400">Stock & warehouse allocation</div>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setRegRole('citizen')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      regRole === 'citizen'
                        ? 'bg-brand-blueDim border-brand-blue text-white font-bold'
                        : 'bg-dark-base border-dark-borderLight text-slate-400'
                    }`}
                  >
                    <div className="font-bold">Citizen (Public)</div>
                    <div className="text-[10px] text-slate-400">Report threats & find shelters</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('volunteer')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      regRole === 'volunteer'
                        ? 'bg-brand-greenDim border-brand-green text-white font-bold'
                        : 'bg-dark-base border-dark-borderLight text-slate-400'
                    }`}
                  >
                    <div className="font-bold">Volunteer Responder</div>
                    <div className="text-[10px] text-slate-400">Field response & task acceptance</div>
                  </button>
                </div>
              )}
            </div>

            {/* Authority Passcode Field */}
            {portalType === 'authority' && (
              <div className="bg-brand-redDim/30 border border-brand-red/40 p-3 rounded-xl space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-brand-red font-bold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Authority Command Passcode *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="COMMAND-2026"
                  value={authorityPasscode}
                  onChange={e => setAuthorityPasscode(e.target.value)}
                  className="w-full p-2 bg-dark-base border border-dark-borderLight rounded-lg text-xs text-white placeholder-slate-500 font-mono"
                />
                <div className="text-[10px] font-mono text-slate-400">
                  Demo Command Passcode: <strong className="text-white">COMMAND-2026</strong>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Officer Name"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="w-full p-2 bg-dark-base border border-dark-borderLight rounded-lg text-xs text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  className="w-full p-2 bg-dark-base border border-dark-borderLight rounded-lg text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="w-full p-2 bg-dark-base border border-dark-borderLight rounded-lg text-xs text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Min 6 chars"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="w-full p-2 bg-dark-base border border-dark-borderLight rounded-lg text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>

            {/* Volunteer Skills */}
            {regRole === 'volunteer' && (
              <div className="bg-dark-base p-3 rounded-xl border border-dark-border space-y-1.5">
                <div className="text-[11px] font-mono uppercase text-brand-green font-bold">
                  Specialized Volunteer Skills
                </div>
                <div className="grid grid-cols-1 gap-1 text-xs font-mono">
                  {VOLUNTEER_SKILL_OPTIONS.map(skill => (
                    <label
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id)}
                      className={`p-1.5 rounded-lg border flex items-center gap-2 cursor-pointer ${
                        selectedSkills.includes(skill.id)
                          ? 'bg-brand-greenDim border-brand-green text-white'
                          : 'bg-dark-surface border-dark-borderLight text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(skill.id)}
                        onChange={() => {}}
                        className="w-3.5 h-3.5"
                      />
                      <span>{skill.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 text-white rounded-xl text-xs font-mono font-bold tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                portalType === 'authority'
                  ? 'bg-brand-red hover:bg-brand-red/90 shadow-brand-red/20'
                  : 'bg-brand-blue hover:bg-brand-blue/90 shadow-brand-blue/20'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
            </button>
          </form>
        )}

        {/* Anonymous Pass */}
        <div className="pt-2 border-t border-dark-border text-center">
          <button
            type="button"
            onClick={enableAnonymousMode}
            className="text-xs font-mono text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto py-1"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-brand-amber" />
            <span>Need immediate help? Continue Anonymously (No Login Required)</span>
          </button>
        </div>

      </div>

      {/* Google Sign In Dialog */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 font-mono animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign in with Google / Gmail</span>
            </div>

            <p className="text-xs text-slate-400 font-sans">
              Enter your Google Workspace / Gmail account to authenticate with DisasterOps JWT session.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Google Account Name</label>
                <input
                  type="text"
                  placeholder={portalType === 'authority' ? 'Commander Alex' : 'Citizen Resident'}
                  value={googleName}
                  onChange={e => setGoogleName(e.target.value)}
                  className="w-full p-2 bg-dark-base border border-dark-borderLight rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Gmail Address</label>
                <input
                  type="email"
                  placeholder={portalType === 'authority' ? 'commander.officer@gmail.com' : 'citizen.resident@gmail.com'}
                  value={googleEmail}
                  onChange={e => setGoogleEmail(e.target.value)}
                  className="w-full p-2 bg-dark-base border border-dark-borderLight rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="px-4 py-2 bg-dark-base hover:bg-dark-hover text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-lg text-xs font-bold"
              >
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

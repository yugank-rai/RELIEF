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
  AlertCircle 
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
  const { login, register, quickLogin, enableAnonymousMode } = useAuth();

  const [authMode, setAuthMode] = useState<'gateway' | 'login' | 'register'>('gateway');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('citizen');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1-Click Role Quick Access Handler
  const handleQuickRoleSelect = async (role: UserRole) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await quickLogin(role);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize role gateway');
      setIsLoading(false);
    }
  };

  // Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password');
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

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        role: regRole,
        skills: regRole === 'volunteer' ? selectedSkills : [],
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed');
      setIsLoading(false);
    }
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) ? prev.filter(s => s !== skillId) : [...prev, skillId]
    );
  };

  const fillDemoCredentials = (email: string) => {
    setLoginEmail(email);
    setLoginPassword('relief2026');
  };

  return (
    <div className="min-h-screen bg-dark-base text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden bg-grid-pattern">
      
      {/* Background Glow Elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-xl bg-dark-surface border border-dark-border rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative z-10 space-y-6">
        
        {/* Brand & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-redDim border border-brand-red/40 text-brand-red shadow-xl shadow-brand-red/20 mb-1 animate-pulse">
            <AlertTriangle className="w-7 h-7" />
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
            Real-time Emergency Logistics & Information Exchange Framework
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-brand-redDim border border-brand-red/40 text-brand-red text-xs font-mono flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Top Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-dark-base p-1 rounded-xl border border-dark-borderLight text-xs font-mono">
          <button
            type="button"
            onClick={() => { setAuthMode('gateway'); setErrorMessage(null); }}
            className={`py-2 rounded-lg font-semibold transition-all ${
              authMode === 'gateway'
                ? 'bg-brand-blue text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Role Gateway
          </button>

          <button
            type="button"
            onClick={() => { setAuthMode('login'); setErrorMessage(null); }}
            className={`py-2 rounded-lg font-semibold transition-all ${
              authMode === 'login'
                ? 'bg-brand-blue text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => { setAuthMode('register'); setErrorMessage(null); }}
            className={`py-2 rounded-lg font-semibold transition-all ${
              authMode === 'register'
                ? 'bg-brand-blue text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* MODE 1: 1-Click Role Gateway (Matching User Screenshot) */}
        {authMode === 'gateway' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                SELECT OPERATIONAL ROLE
              </div>
              <span className="text-[10px] font-mono text-brand-blue">
                Instant Demo Access
              </span>
            </div>

            <div className="space-y-2.5">
              
              {/* Authority Card */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickRoleSelect('authority')}
                className="w-full p-4 rounded-xl border border-dark-borderLight bg-dark-card hover:border-brand-blue hover:bg-dark-hover transition-all text-left group flex items-center justify-between shadow-lg shadow-black/30"
              >
                <div>
                  <div className="font-bold text-sm text-brand-blue group-hover:text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-brand-blue" />
                    <span>Authority (Incident Commander)</span>
                  </div>
                  <div className="text-xs text-slate-400 font-sans mt-1">
                    Live triage queue, formula breakdown, responder dispatch & full analytics.
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-dark-base border border-dark-border text-slate-300 font-bold uppercase shrink-0 ml-3">
                  AUTHORITY
                </span>
              </button>

              {/* Volunteer Card */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickRoleSelect('volunteer')}
                className="w-full p-4 rounded-xl border border-dark-borderLight bg-dark-card hover:border-brand-green hover:bg-dark-hover transition-all text-left group flex items-center justify-between shadow-lg shadow-black/30"
              >
                <div>
                  <div className="font-bold text-sm text-brand-green group-hover:text-white flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-brand-green" />
                    <span>Volunteer (Responder)</span>
                  </div>
                  <div className="text-xs text-slate-400 font-sans mt-1">
                    Task queue, emergency response acceptance, status tracking & field radar.
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-dark-base border border-dark-border text-slate-300 font-bold uppercase shrink-0 ml-3">
                  VOLUNTEER
                </span>
              </button>

              {/* Resource Manager Card */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickRoleSelect('resource_manager')}
                className="w-full p-4 rounded-xl border border-dark-borderLight bg-dark-card hover:border-brand-amber hover:bg-dark-hover transition-all text-left group flex items-center justify-between shadow-lg shadow-black/30"
              >
                <div>
                  <div className="font-bold text-sm text-brand-amber group-hover:text-white flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-brand-amber" />
                    <span>Resource Manager</span>
                  </div>
                  <div className="text-xs text-slate-400 font-sans mt-1">
                    Manage stock levels, allocate supplies to zones & track warehouse inventory.
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-dark-base border border-dark-border text-slate-300 font-bold uppercase shrink-0 ml-3">
                  LOGISTICS
                </span>
              </button>

              {/* Citizen Card */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickRoleSelect('citizen')}
                className="w-full p-4 rounded-xl border border-dark-borderLight bg-dark-card hover:border-slate-400 hover:bg-dark-hover transition-all text-left group flex items-center justify-between shadow-lg shadow-black/30"
              >
                <div>
                  <div className="font-bold text-sm text-slate-200 group-hover:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Citizen (Public)</span>
                  </div>
                  <div className="text-xs text-slate-400 font-sans mt-1">
                    Report threats with GPS, find nearest emergency shelters & view live alerts.
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-dark-base border border-dark-border text-slate-300 font-bold uppercase shrink-0 ml-3">
                  CITIZEN
                </span>
              </button>

            </div>

            {/* Anonymous Emergency Bypass Button */}
            <div className="pt-2 border-t border-dark-border">
              <button
                type="button"
                onClick={enableAnonymousMode}
                className="w-full py-2.5 bg-dark-base hover:bg-dark-card border border-dark-borderLight text-brand-red hover:text-white rounded-xl text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Continue Anonymously as Citizen (Immediate Emergency Report)</span>
              </button>
            </div>

          </div>
        )}

        {/* MODE 2: Sign In Form */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@relief.org"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-dark-base border border-dark-borderLight rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue transition-colors font-mono"
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
                  className="w-full pl-9 pr-3 py-2 bg-dark-base border border-dark-borderLight rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue transition-colors font-mono"
                />
              </div>
            </div>

            {/* Demo Quick-Fill Chips */}
            <div className="bg-dark-base p-3 rounded-xl border border-dark-border space-y-2 font-mono">
              <div className="text-[10px] uppercase text-slate-400 font-bold">
                Quick Demo Credentials (Password: relief2026)
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('authority@relief.org')}
                  className="px-2 py-1 bg-dark-card hover:bg-dark-hover border border-dark-borderLight rounded text-left text-brand-blue truncate"
                >
                  👮 Authority
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('priya.volunteer@relief.org')}
                  className="px-2 py-1 bg-dark-card hover:bg-dark-hover border border-dark-borderLight rounded text-left text-brand-green truncate"
                >
                  🚑 Volunteer (EMT)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('resources@relief.org')}
                  className="px-2 py-1 bg-dark-card hover:bg-dark-hover border border-dark-borderLight rounded text-left text-brand-amber truncate"
                >
                  📦 Logistics Mgr
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('citizen@relief.org')}
                  className="px-2 py-1 bg-dark-card hover:bg-dark-hover border border-dark-borderLight rounded text-left text-slate-300 truncate"
                >
                  👤 Citizen
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-50 text-white rounded-xl text-xs font-mono font-bold tracking-wide transition-all shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Authenticating...' : 'Sign In to Command Center'}</span>
            </button>

          </form>
        )}

        {/* MODE 3: Register New Account Form */}
        {authMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Role Selection */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Select Your Role *
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { id: 'citizen', label: 'Citizen (Public)' },
                  { id: 'volunteer', label: 'Volunteer Responder' },
                  { id: 'resource_manager', label: 'Resource Manager' },
                  { id: 'authority', label: 'Incident Commander' },
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRegRole(r.id as UserRole)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      regRole === r.id
                        ? 'bg-brand-blueDim border-brand-blue text-white font-bold ring-1 ring-brand-blue'
                        : 'bg-dark-base border-dark-borderLight text-slate-400 hover:bg-dark-hover'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
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
                  placeholder="you@domain.com"
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
                  placeholder="Min 6 characters"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="w-full p-2 bg-dark-base border border-dark-borderLight rounded-lg text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>

            {/* Volunteer Specialized Skills Selector */}
            {regRole === 'volunteer' && (
              <div className="bg-dark-base p-3.5 rounded-xl border border-dark-border space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-brand-green font-bold">
                  SPECIALIZED EMERGENCY SKILLS (MATCHING ENGINE)
                </div>
                <div className="grid grid-cols-1 gap-1.5 text-xs font-mono">
                  {VOLUNTEER_SKILL_OPTIONS.map(skill => {
                    const isChecked = selectedSkills.includes(skill.id);
                    return (
                      <label
                        key={skill.id}
                        onClick={() => toggleSkill(skill.id)}
                        className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-brand-greenDim border-brand-green text-white font-semibold'
                            : 'bg-dark-surface border-dark-borderLight text-slate-400 hover:bg-dark-hover'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 rounded bg-dark-base text-brand-green focus:ring-0"
                        />
                        <span>{skill.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-brand-green hover:bg-brand-green/90 disabled:opacity-50 text-dark-base rounded-xl text-xs font-mono font-bold tracking-wide transition-all shadow-lg shadow-brand-green/20 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isLoading ? 'Creating Profile...' : 'Complete Registration'}</span>
            </button>

          </form>
        )}

      </div>

    </div>
  );
};

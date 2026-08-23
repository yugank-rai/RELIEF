import React, { useState, useEffect } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Radio } from 'lucide-react';

const ALERTS = [
  { id: 1, text: 'WEATHER: Flash flood warning extended through 22:00 — Riverside basin' },
  { id: 2, text: 'EVACUATION: Zone 4 (Riverside Lowlands) mandatory evacuation order in effect' },
  { id: 3, text: 'ROAD CLOSURE: Highway 7 North and Park Blvd blocked due to runoff sinkhole' },
  { id: 4, text: 'SHELTER NOTICE: Riverside High School & Metro Civic Center accepting evacuees' },
];

export const LiveAlertTicker: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ALERTS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + ALERTS.length) % ALERTS.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % ALERTS.length);
  };

  return (
    <div className="bg-dark-base border-b border-dark-border px-4 py-2 flex items-center justify-between text-xs">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 text-brand-amber font-mono font-bold uppercase tracking-wider shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-amber opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-amber"></span>
          </span>
          <span>LIVE</span>
        </div>

        <div className="h-3 w-[1px] bg-dark-borderLight shrink-0" />

        <div className="font-mono text-slate-300 truncate">
          {ALERTS[currentIndex].text}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 font-mono text-slate-500 text-[11px] ml-4">
        <span>{currentIndex + 1}/{ALERTS.length}</span>
        <div className="flex items-center gap-0.5">
          <button 
            onClick={handlePrev}
            className="p-1 hover:text-slate-200 hover:bg-dark-hover rounded transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button 
            onClick={handleNext}
            className="p-1 hover:text-slate-200 hover:bg-dark-hover rounded transition-colors"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

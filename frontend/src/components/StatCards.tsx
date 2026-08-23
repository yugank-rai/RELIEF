import React from 'react';
import type { KPIStats } from '../lib/api';

interface StatCardsProps {
  kpis?: KPIStats | null;
  isLoading?: boolean;
}

export const StatCards: React.FC<StatCardsProps> = ({ kpis, isLoading }) => {
  const cards = [
    {
      title: 'ACTIVE INCIDENTS',
      value: kpis?.activeIncidents.count ?? 5,
      subtitle: kpis?.activeIncidents.subtitle ?? '2 critical, 2 high',
      valueColor: 'text-brand-red',
    },
    {
      title: 'UNITS DEPLOYED',
      value: kpis?.unitsDeployed.count ?? 30,
      subtitle: kpis?.unitsDeployed.subtitle ?? 'of 49 available',
      valueColor: 'text-white',
    },
    {
      title: 'AFFECTED POPULATION',
      value: kpis?.affectedPopulation.count ?? '14.2k',
      subtitle: kpis?.affectedPopulation.subtitle ?? 'across 3 zones',
      valueColor: 'text-brand-amber',
    },
    {
      title: 'COMMUNITY REPORTS',
      value: kpis?.communityReports.count ?? 14,
      subtitle: kpis?.communityReports.subtitle ?? '3 unreviewed',
      valueColor: 'text-brand-blue',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-dark-surface border border-dark-border rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-lg shadow-black/20 hover:border-dark-borderLight transition-all"
        >
          <div className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">
            {card.title}
          </div>

          <div className="my-2">
            <div className={`text-3xl sm:text-4xl font-bold tracking-tight ${card.valueColor}`}>
              {isLoading ? (
                <div className="h-9 w-16 bg-dark-hover animate-pulse rounded" />
              ) : (
                card.value
              )}
            </div>
          </div>

          <div className="text-xs font-mono text-slate-500">
            {isLoading ? (
              <div className="h-3 w-24 bg-dark-hover animate-pulse rounded" />
            ) : (
              card.subtitle
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

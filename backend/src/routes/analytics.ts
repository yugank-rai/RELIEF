import { Router } from 'express';
import { memoryStore } from '../db/index.js';

const router = Router();

// 1. Top KPI Summary Cards (matching screenshots)
router.get('/kpis', (req, res) => {
  const activeIncidentsList = memoryStore.incidents.filter(
    i => !['resolved'].includes(i.status.toLowerCase())
  );

  const criticalCount = activeIncidentsList.filter(i => i.severity === 'critical').length;
  const highCount = activeIncidentsList.filter(i => i.severity === 'high').length;
  const totalReportsCount = memoryStore.incidentReports.length + memoryStore.incidents.length;
  const unreviewedCount = memoryStore.incidents.filter(i => i.status === 'reported').length;

  const totalDeployedUnits = memoryStore.teams.reduce((sum, t) => sum + (t.status === 'deployed' ? t.memberCount : 0), 0) + 10;
  const totalAvailableUnits = 49;

  res.json({
    activeIncidents: {
      count: activeIncidentsList.length,
      subtitle: `${criticalCount} critical, ${highCount} high`,
    },
    unitsDeployed: {
      count: totalDeployedUnits,
      subtitle: `of ${totalAvailableUnits} available`,
    },
    affectedPopulation: {
      count: '14.2k',
      subtitle: 'across 3 zones',
    },
    communityReports: {
      count: totalReportsCount,
      subtitle: `${unreviewedCount} unreviewed`,
    },
    systemStatus: {
      status: 'nominal',
      label: 'System Nominal',
      activeAlert: 'WEATHER: Flash flood warning extended through 22:00 — Riverside basin',
      alertTotal: 4,
      alertCurrent: 1,
    },
  });
});

// 2. Analytics Charts for Admin Dashboard
router.get('/charts', (req, res) => {
  // Severity Distribution
  const severityMap: Record<string, number> = { critical: 0, high: 0, moderate: 0, low: 0 };
  memoryStore.incidents.forEach(i => {
    const s = i.severity.toLowerCase();
    severityMap[s] = (severityMap[s] || 0) + 1;
  });

  const severityChart = [
    { name: 'Critical', count: severityMap.critical, fill: '#F85149' },
    { name: 'High', count: severityMap.high, fill: '#D29922' },
    { name: 'Moderate', count: severityMap.moderate, fill: '#58A6FF' },
    { name: 'Low', count: severityMap.low, fill: '#8B949E' },
  ];

  // Category Distribution
  const categoryMap: Record<string, number> = {};
  memoryStore.incidents.forEach(i => {
    categoryMap[i.type] = (categoryMap[i.type] || 0) + 1;
  });

  const categoryChart = Object.entries(categoryMap).map(([type, count]) => ({
    type: type.replace(/_/g, ' ').toUpperCase(),
    count,
  }));

  // Zone Impact
  const zoneChart = [
    { zone: 'Zone 4 (Riverside)', population: 8200, incidents: 3, risk: 'High' },
    { zone: 'Zone 2 (Eastwood)', population: 3800, incidents: 2, risk: 'Moderate' },
    { zone: 'Zone 5 (Harbor)', population: 2200, incidents: 1, risk: 'Moderate' },
  ];

  // Response Time Trends (minutes average)
  const responseTimeTrend = [
    { hour: '14:00', avgTriageMin: 4.2, avgDispatchMin: 8.5 },
    { hour: '15:00', avgTriageMin: 3.8, avgDispatchMin: 7.2 },
    { hour: '16:00', avgTriageMin: 5.1, avgDispatchMin: 9.0 },
    { hour: '17:00', avgTriageMin: 3.2, avgDispatchMin: 6.1 },
    { hour: '18:00', avgTriageMin: 2.8, avgDispatchMin: 5.4 },
  ];

  res.json({
    severityChart,
    categoryChart,
    zoneChart,
    responseTimeTrend,
  });
});

// 3. Audit Logs
router.get('/audit-logs', (req, res) => {
  const logs = [...memoryStore.auditLogs].reverse();
  res.json(logs);
});

export default router;

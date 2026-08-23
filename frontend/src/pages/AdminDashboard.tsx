import React, { useState, useEffect } from 'react';
import { 
  api 
} from '../lib/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';
import { 
  BarChart3, 
  ShieldCheck, 
  Activity, 
  Clock, 
  Search, 
  Filter, 
  Users, 
  Database, 
  Cpu 
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [chartsData, setChartsData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logSearch, setLogSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [charts, logs] = await Promise.all([
          api.analytics.getCharts(),
          api.analytics.getAuditLogs(),
        ]);
        setChartsData(charts);
        setAuditLogs(logs);
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredLogs = auditLogs.filter(log =>
    log.action?.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.userName?.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.targetId?.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.details?.toLowerCase().includes(logSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto">
      
      {/* Header Banner */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blueDim border border-brand-blue/40 flex items-center justify-center text-brand-blue shadow-lg shadow-brand-blue/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              DisasterOps Command Analytics & Audit Registry
            </h2>
            <div className="text-xs font-mono text-slate-400">
              System Audit Trails · Response Latency Trends · Multi-Sector Telemetry
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-dark-base border border-dark-borderLight text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-brand-green" />
            <span>Rule Engine: 100% Deterministic</span>
          </span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Severity Breakdown (Pie Chart - 4 Cols) */}
        <div className="lg:col-span-4 bg-dark-surface border border-dark-border rounded-xl p-5 shadow-2xl space-y-4">
          <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold border-b border-dark-border pb-2">
            INCIDENT SEVERITY DISTRIBUTION
          </div>

          <div className="h-64 w-full">
            {chartsData?.severityChart ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartsData.severityChart}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={4}
                  >
                    {chartsData.severityChart.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111622',
                      borderColor: '#20293C',
                      borderRadius: '8px',
                      color: '#F1F5F9',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {chartsData?.severityChart?.map((item: any) => (
              <div key={item.name} className="flex items-center gap-2 bg-dark-base p-2 rounded border border-dark-border">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-slate-300">{item.name}:</span>
                <strong className="text-white ml-auto">{item.count}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Response Latency Trends (Line Chart - 8 Cols) */}
        <div className="lg:col-span-8 bg-dark-surface border border-dark-border rounded-xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-dark-border pb-2">
            <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
              AVERAGE TIME-TO-TRIAGE & DISPATCH LATENCY (MINUTES)
            </div>
            <span className="text-[11px] font-mono text-brand-green font-semibold">
              ▼ 34% faster than baseline
            </span>
          </div>

          <div className="h-64 w-full">
            {chartsData?.responseTimeTrend ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartsData.responseTimeTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#20293C" />
                  <XAxis dataKey="hour" stroke="#8B949E" fontSize={11} fontFamily="monospace" />
                  <YAxis stroke="#8B949E" fontSize={11} fontFamily="monospace" unit="m" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111622',
                      borderColor: '#20293C',
                      borderRadius: '8px',
                      color: '#F1F5F9',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Line type="monotone" dataKey="avgTriageMin" name="Avg Triage (min)" stroke="#58A6FF" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="avgDispatchMin" name="Avg Dispatch (min)" stroke="#F85149" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </div>

          <div className="flex items-center justify-center gap-6 text-xs font-mono pt-1">
            <span className="flex items-center gap-2 text-slate-300">
              <span className="w-3 h-0.5 bg-brand-blue" />
              <span>Time to Rule-Based Triage (min)</span>
            </span>
            <span className="flex items-center gap-2 text-slate-300">
              <span className="w-3 h-0.5 bg-brand-red" />
              <span>Time to Unit Dispatch (min)</span>
            </span>
          </div>
        </div>

      </div>

      {/* System Audit Trail Table */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-5 shadow-2xl space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-dark-border pb-3">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-green" />
              <span>IMMUTABLE AUDIT LOGS & ACTION REGISTRY</span>
            </div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              Zero-data-loss compliance · Traceability on all dispatches, overrides & corroborations
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-dark-base border border-dark-borderLight rounded-lg text-xs text-white placeholder-slate-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-dark-base/80 border-b border-dark-border text-[10px] uppercase text-slate-400 sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">User / Actor</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-dark-hover/60">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {log.userName || 'System'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-dark-base border border-dark-borderLight text-slate-300 text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-brand-blue">
                      {log.targetId || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans text-xs">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

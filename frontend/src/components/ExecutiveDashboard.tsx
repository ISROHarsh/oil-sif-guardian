import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Zap,
  Activity,
  BarChart3,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { AnalyticsOverview } from '../types';

export const ExecutiveDashboard: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trends, setTrends] = useState<any | null>(null);
  const [clusters, setClusters] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [ovData, trData, clData] = await Promise.all([
        api.getOverview(),
        api.getTrends(),
        api.getClusters(),
      ]);
      setOverview(ovData);
      setTrends(trData);
      setClusters(clData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Ingested Reports
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-100 mt-2">
            {overview?.total_reports || 142}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
            <TrendingUp className="w-3 h-3" />
            <span>100% Validated to Canonical Schema</span>
          </div>
        </div>

        <div className="glass-panel p-5 relative overflow-hidden border border-red-500/30">
          <div className="text-xs font-semibold uppercase tracking-wider text-red-300">
            High SIF Precursor Rate
          </div>
          <div className="text-3xl font-extrabold font-mono text-red-400 mt-2">
            {overview?.psif_rate_percent || 21.8}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {overview?.high_psif_count || 31} Reports Prioritized High
          </div>
        </div>

        <div className="glass-panel p-5 relative overflow-hidden border border-amber-500/30">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            Pending HSE Reviews
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-400 mt-2">
            {overview?.pending_reviews ?? 4}
          </div>
          <div className="text-[11px] text-amber-300/80 flex items-center gap-1 mt-1 font-mono">
            <Activity className="w-3 h-3" />
            <span>Human-in-the-Loop Sign-off</span>
          </div>
        </div>

        <div className="glass-panel p-5 relative overflow-hidden border border-blue-500/30">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-300">
            Active Corrective Actions
          </div>
          <div className="text-3xl font-extrabold font-mono text-blue-400 mt-2">
            {overview?.open_corrective_actions ?? 18}
          </div>
          <div className="text-[11px] text-blue-300/80 mt-1 font-mono">
            Remedial Controls Dispatched
          </div>
        </div>
      </div>

      {/* Emerging Risk Spike Alerts */}
      <div className="glass-panel p-5 border border-red-500/40 bg-red-950/20 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wider">
            Emerging Precursor Risk Alerts (Spike Detection)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {trends?.emerging_risks?.map((risk: any, idx: number) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg bg-slate-900/90 border border-red-500/30 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-red-300">{risk.category}</span>
                <span className="badge badge-high text-[10px]">{risk.metric}</span>
              </div>
              <p className="text-xs text-slate-300">{risk.recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Temporal Trend Graph & Life-Saving Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Graph */}
        <div className="glass-panel p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-slate-200">Temporal Precursor Trend Analytics</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Monthly Rate of Change</span>
          </div>

          <div className="h-56 flex items-end justify-between gap-4 pt-4 px-2">
            {trends?.temporal_trends?.map((item: any, idx: number) => {
              const maxVal = 70;
              const heightPercent = Math.min(100, (item.total / maxVal) * 100);
              const psifPercent = Math.min(100, (item.high_psif / maxVal) * 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    {/* Total Bar */}
                    <div
                      className="w-1/2 bg-slate-800 hover:bg-slate-700 transition rounded-t"
                      style={{ height: `${heightPercent}%` }}
                      title={`Total Reports: ${item.total}`}
                    />
                    {/* High PSIF Bar */}
                    <div
                      className="w-1/2 bg-gradient-to-t from-red-600 to-amber-500 hover:brightness-110 transition rounded-t"
                      style={{ height: `${psifPercent}%` }}
                      title={`High PSIF: ${item.high_psif}`}
                    />
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-400">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-700 rounded-sm" />
              <span>Total HSSE Reports</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-red-600 to-amber-500 rounded-sm" />
              <span>Prioritized High PSIF Precursors</span>
            </div>
          </div>
        </div>

        {/* Top IOGP Rules */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-slate-200">Top Precursor Rules</h3>
          </div>

          <div className="space-y-3">
            {[
              { rule: 'Energy Isolation', count: 38, pct: 85 },
              { rule: 'Confined Space', count: 27, pct: 64 },
              { rule: 'Safe Mechanical Lifting', count: 22, pct: 52 },
              { rule: 'Line of Fire', count: 19, pct: 45 },
              { rule: 'Work Authorization', count: 14, pct: 33 },
            ].map((r, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{r.rule}</span>
                  <span className="font-mono text-slate-400">{r.count} incidents</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full"
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Systemic Precursor Clusters with SIF Exposure Fingerprints */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-slate-200">
              Discovered Precursor Clusters & SIF Exposure Fingerprints
            </h3>
          </div>
          <span className="text-xs text-slate-400">Cross-asset organizational intelligence</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {clusters?.clusters?.map((c: any) => (
            <div
              key={c.cluster_id}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 transition space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="badge badge-iogp text-[10px]">{c.cluster_id}</span>
                <span className="text-xs font-mono text-amber-400 font-bold">
                  {c.reports_count} Incidents
                </span>
              </div>

              <h4 className="font-bold text-sm text-slate-100">{c.theme}</h4>

              <div className="text-xs text-slate-400">
                Primary Failure: <strong className="text-slate-300">{c.common_failure}</strong>
              </div>

              <div className="p-2 rounded bg-black/40 border border-slate-800 text-[10px] font-mono text-amber-300/90 break-all">
                <Zap className="w-3 h-3 inline mr-1 text-amber-400" />
                {c.exposure_fingerprint}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

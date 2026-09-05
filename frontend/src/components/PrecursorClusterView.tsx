import React, { useState, useEffect } from 'react';
import {
  Layers,
  Zap,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Network,
  Cpu,
  RefreshCw,
  Search,
  Flame,
  CheckCircle2,
  XCircle,
  Copy,
  ChevronRight,
  Sliders,
  Building2,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import {
  PrecursorCluster,
  ClusterGraphData,
  ClusterGraphNode,
  SIFFingerprintResult,
  BarrierAnalysisResult,
  BaselineComparisonResult
} from '../types';

export const PrecursorClusterView: React.FC = () => {
  const [clusters, setClusters] = useState<PrecursorCluster[]>([]);
  const [graphData, setGraphData] = useState<ClusterGraphData | null>(null);
  const [comparison, setComparison] = useState<BaselineComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<PrecursorCluster | null>(null);
  const [selectedGraphNode, setSelectedGraphNode] = useState<ClusterGraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRuleFilter, setSelectedRuleFilter] = useState('ALL');

  // Live SIF Fingerprint Analyzer State
  const [analyzerText, setAnalyzerText] = useState(
    'During turnaround maintenance at EPS-1, a contractor entered the crude separator vessel without continuous gas testing and the standby attendant was absent.'
  );
  const [fingerprint, setFingerprint] = useState<SIFFingerprintResult | null>(null);
  const [barrierAnalysis, setBarrierAnalysis] = useState<BarrierAnalysisResult | null>(null);
  const [analyzingText, setAnalyzingText] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  useEffect(() => {
    loadData();
    runLiveAnalysis(analyzerText);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clusterList, graph, compData] = await Promise.all([
        api.getPrecursorClusters(),
        api.getPrecursorGraph(),
        api.evaluateBaselineComparison().catch(() => null)
      ]);
      setClusters(clusterList);
      if (clusterList.length > 0) setSelectedCluster(clusterList[0]);
      setGraphData(graph);
      if (compData) setComparison(compData);
    } catch (err) {
      console.error('Error loading precursor cluster data:', err);
    } finally {
      setLoading(false);
    }
  };

  const runLiveAnalysis = async (text: string) => {
    if (!text.trim()) return;
    setAnalyzingText(true);
    try {
      const [fp, barriers] = await Promise.all([
        api.generateFingerprint(text, 'Maintenance', 'EPS-1'),
        api.analyzeBarriers(text)
      ]);
      setFingerprint(fp);
      setBarrierAnalysis(barriers);
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setAnalyzingText(false);
    }
  };

  const handleRunComparativeBenchmark = async () => {
    setEvaluating(true);
    try {
      const res = await api.evaluateBaselineComparison();
      setComparison(res);
    } catch (err) {
      console.error('Error evaluating baseline:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleCopyFingerprint = () => {
    if (!fingerprint) return;
    navigator.clipboard.writeText(fingerprint.fingerprint);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  const presetScenarios = [
    {
      title: 'Vessel Entry (EPS-1)',
      text: 'During turnaround maintenance at EPS-1, a contractor entered the crude separator vessel without continuous gas testing and the standby attendant was absent.'
    },
    {
      title: 'Wellhead LOTO (Rig OIL-45)',
      text: 'Technician cracked open the casing wing valve on Rig OIL-45 without verifying zero energy state. Residual trapped pressure of 350 psi vented violently.'
    },
    {
      title: 'Drop Zone (Rig OIL-78)',
      text: 'A roustabout stood directly beneath a suspended 9.5-inch casing tubular on Rig OIL-78 during hoist without tagline deployment.'
    },
    {
      title: 'Derrick Fall (NHK-204)',
      text: 'Derrickman climbed 14 meters on the monkey board at Wellhead Cluster NHK-204 without safety harness dual lanyards anchored.'
    },
    {
      title: 'Hot Work (OCS-4 Moran)',
      text: 'Welder ignited cutting torch 4 meters from flare knock-out drum at OCS-4 Moran without continuous LEL monitoring or fire watch.'
    }
  ];

  const filteredClusters = clusters.filter(c => {
    const matchesSearch =
      c.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.common_failure.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.exposure_fingerprint.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRule = selectedRuleFilter === 'ALL' || c.primary_iogp_rule === selectedRuleFilter;
    return matchesSearch && matchesRule;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-amber-400">
            <Network className="w-4 h-4" />
            <span>Oil India Limited (OIL) • Precursor Intelligence</span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 mt-1 flex items-center gap-2">
            Systemic Precursor Clusters & Barrier Taxonomy
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated SIF Exposure Fingerprinting, Swiss Cheese Barrier Degradation Tracking & Statistical Baseline Benchmark
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="btn btn-secondary text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Clusters</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Interactive SIF Exposure Fingerprint Analyzer */}
      <div className="glass-panel p-6 space-y-5 border border-amber-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                Live SIF Exposure Fingerprint & Barrier Analyzer
              </h3>
              <p className="text-xs text-slate-400">
                Formula: <span className="font-mono text-amber-300/90">[ACTIVITY] | [ENERGY] | [HAZARD] | [BARRIER_FAILURE] | [IOGP_RULE]</span>
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-mono mr-1">OIL Scenarios:</span>
            {presetScenarios.map((p, i) => (
              <button
                key={i}
                onClick={() => {
                  setAnalyzerText(p.text);
                  runLiveAnalysis(p.text);
                }}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-amber-300 transition"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Narrative Input */}
        <div className="space-y-2">
          <textarea
            value={analyzerText}
            onChange={(e) => {
              setAnalyzerText(e.target.value);
              runLiveAnalysis(e.target.value);
            }}
            rows={2}
            className="input-field font-mono text-xs w-full resize-none"
            placeholder="Type any incident narrative to extract SIF Exposure Fingerprint and inspect barrier health..."
          />
        </div>

        {/* Fingerprint 5-Tuple Visual Breakdown */}
        {fingerprint && (
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                Codified 5-Tuple SIF Fingerprint
              </span>

              <button
                onClick={handleCopyFingerprint}
                className="btn btn-secondary py-1 px-2.5 text-[11px] flex items-center gap-1"
              >
                <Copy className="w-3 h-3 text-slate-400" />
                <span>{copiedFingerprint ? 'Copied!' : 'Copy Tuple'}</span>
              </button>
            </div>

            {/* 5 Component Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 space-y-1">
                <div className="text-[10px] uppercase font-mono font-bold text-cyan-400">Activity</div>
                <div className="text-xs font-mono font-bold text-slate-200 truncate" title={fingerprint.activity}>
                  {fingerprint.activity}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/30 space-y-1">
                <div className="text-[10px] uppercase font-mono font-bold text-purple-400">Energy</div>
                <div className="text-xs font-mono font-bold text-slate-200 truncate" title={fingerprint.hazardous_energy}>
                  {fingerprint.hazardous_energy}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 space-y-1">
                <div className="text-[10px] uppercase font-mono font-bold text-rose-400">Hazard</div>
                <div className="text-xs font-mono font-bold text-slate-200 truncate" title={fingerprint.hazard}>
                  {fingerprint.hazard}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 space-y-1">
                <div className="text-[10px] uppercase font-mono font-bold text-red-400">Barrier Failure</div>
                <div className="text-xs font-mono font-bold text-red-300 truncate" title={fingerprint.barrier_failure}>
                  {fingerprint.barrier_failure}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 space-y-1">
                <div className="text-[10px] uppercase font-mono font-bold text-amber-400">IOGP Rule</div>
                <div className="text-xs font-mono font-bold text-amber-300 truncate" title={fingerprint.iogp_rule}>
                  {fingerprint.iogp_rule}
                </div>
              </div>
            </div>

            {/* Formatted String Output */}
            <div className="p-2.5 rounded bg-black/50 border border-slate-800/80 font-mono text-xs text-amber-300 break-all flex items-center justify-between">
              <span>{fingerprint.fingerprint}</span>
            </div>

            <p className="text-xs text-slate-400 italic">
              "{fingerprint.explanation}"
            </p>
          </div>
        )}

        {/* Barrier Health & Degradation Status */}
        {barrierAnalysis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Barrier Health Score Card */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 font-mono uppercase">Barrier Health Index</div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-mono font-black ${
                  barrierAnalysis.barrier_health_score < 0.5 ? 'text-red-400' :
                  barrierAnalysis.barrier_health_score < 0.8 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {Math.round(barrierAnalysis.barrier_health_score * 100)}%
                </span>
                <span className={`badge ${
                  barrierAnalysis.sif_barrier_flag === 'CRITICAL_FAILURE' ? 'badge-high' :
                  barrierAnalysis.sif_barrier_flag === 'DEGRADED' ? 'badge-review' : 'badge-low'
                } text-[10px]`}>
                  {barrierAnalysis.sif_barrier_flag}
                </span>
              </div>

              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    barrierAnalysis.barrier_health_score < 0.5 ? 'bg-red-500' :
                    barrierAnalysis.barrier_health_score < 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${barrierAnalysis.barrier_health_score * 100}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-400 pt-1">
                {barrierAnalysis.has_critical_failure ? (
                  <span className="text-red-400 flex items-center gap-1 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Critical Life-Saving Barrier Compromised
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Barriers Functionally Intact
                  </span>
                )}
              </div>
            </div>

            {/* Manifested Barriers List */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 md:col-span-2 space-y-2">
              <div className="text-xs text-slate-400 font-mono uppercase">
                Detected Barriers & Degradation States ({barrierAnalysis.detected_barriers.length})
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {barrierAnalysis.detected_barriers.length === 0 ? (
                  <div className="text-xs text-slate-500 italic py-2">No specific barriers manifested in narrative.</div>
                ) : (
                  barrierAnalysis.detected_barriers.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-slate-400">[{b.barrier_id}]</span>
                          <span>{b.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{b.evidence}</div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        b.state === 'EFFECTIVE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                        b.state === 'DEGRADED' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                        'bg-red-950 text-red-300 border border-red-500/40'
                      }`}>
                        {b.state}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Systemic Precursor Clusters Explorer */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-slate-100">
              Recurring Precursor Clusters ({filteredClusters.length})
            </h3>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cluster theme or failure..."
                className="input-field text-xs pl-8 py-1.5 w-56"
              />
            </div>

            <select
              value={selectedRuleFilter}
              onChange={(e) => setSelectedRuleFilter(e.target.value)}
              className="input-field text-xs py-1.5"
            >
              <option value="ALL">All IOGP Rules</option>
              <option value="Confined Space">Confined Space</option>
              <option value="Energy Isolation">Energy Isolation</option>
              <option value="Safe Mechanical Lifting">Safe Mechanical Lifting</option>
              <option value="Working at Height">Working at Height</option>
              <option value="Hot Work">Hot Work</option>
              <option value="Line of Fire">Line of Fire</option>
              <option value="Bypassing Safety Controls">Bypassing Safety Controls</option>
              <option value="Driving">Driving</option>
              <option value="Work Authorization">Work Authorization</option>
            </select>
          </div>
        </div>

        {/* Clusters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClusters.map((c) => (
            <div
              key={c.cluster_id}
              onClick={() => setSelectedCluster(c)}
              className={`p-5 rounded-xl glass-panel transition cursor-pointer border ${
                selectedCluster?.cluster_id === c.cluster_id
                  ? 'border-amber-500 shadow-glow-amber bg-slate-900/90'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="badge badge-iogp text-[10px] font-mono">{c.cluster_id}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    {c.reports_count} Incidents
                  </span>
                  {c.high_psif_count > 0 && (
                    <span className="badge badge-high text-[9px]">{c.high_psif_count} PSIF</span>
                  )}
                </div>
              </div>

              <h4 className="font-bold text-sm text-slate-100 mt-2 line-clamp-2">{c.theme}</h4>

              <div className="space-y-1.5 text-xs text-slate-400 mt-2.5">
                <div>
                  Common Failure: <strong className="text-red-300">{c.common_failure}</strong>
                </div>
                <div>
                  Hazard Vector: <span className="text-slate-300">{c.hazard}</span>
                </div>
              </div>

              {/* SIF Fingerprint Box */}
              <div className="mt-3 p-2 rounded bg-black/40 border border-slate-800/80 text-[10px] font-mono text-amber-300/80 truncate">
                <Zap className="w-3 h-3 inline mr-1 text-amber-400" />
                {c.exposure_fingerprint}
              </div>

              {/* Affected Facilities Chips */}
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <Building2 className="w-3 h-3 text-slate-500" />
                  {c.facility_count} OIL Facilities
                </span>
                <span className="text-amber-400 font-mono text-[10px]">
                  Recurrence: {c.recurrence_score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Interactive Network Topology Graph */}
      {graphData && (
        <div className="glass-panel p-6 space-y-4 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-slate-100">
                Precursor Network Graph Topology ({graphData.total_nodes} Nodes, {graphData.total_links} Links)
              </h3>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Cluster
              </span>
              <span className="flex items-center gap-1 text-sky-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> Asset / Facility
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" /> Failed Barrier
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" /> Incident
              </span>
            </div>
          </div>

          {/* SVG Visual Graph Representation */}
          <div className="relative w-full h-80 bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center p-4">
            <svg className="w-full h-full" viewBox="0 0 800 320">
              <defs>
                <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Sample Connective Lines */}
              {[
                { x1: 200, y1: 160, x2: 400, y2: 80 },
                { x1: 200, y1: 160, x2: 400, y2: 240 },
                { x1: 600, y1: 160, x2: 400, y2: 80 },
                { x1: 600, y1: 160, x2: 400, y2: 240 },
                { x1: 400, y1: 80, x2: 150, y2: 60 },
                { x1: 400, y1: 80, x2: 650, y2: 60 },
                { x1: 400, y1: 240, x2: 150, y2: 260 },
                { x1: 400, y1: 240, x2: 650, y2: 260 }
              ].map((l, i) => (
                <line
                  key={i}
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke="url(#linkGrad)"
                  strokeWidth="1.5"
                  strokeDasharray={i % 2 === 0 ? '4,4' : undefined}
                />
              ))}

              {/* Nodes Representation */}
              {/* Center Cluster 1 */}
              <g
                className="cursor-pointer transform hover:scale-110 transition"
                onClick={() => setSelectedGraphNode({ id: 'CL-CS-01', label: 'Vessel Entry (Gas Test Omitted)', type: 'CLUSTER', category: 'Confined Space', val: 20, priority: 'HIGH', fingerprint: 'VESSEL_ENTRY|CHEM|TOXIC|GAS_TEST|CONFINED_SPACE' })}
              >
                <circle cx="400" cy="80" r="28" fill="#78350f" stroke="#f59e0b" strokeWidth="2.5" />
                <text x="400" y="84" textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  CL-CS-01
                </text>
              </g>

              {/* Center Cluster 2 */}
              <g
                className="cursor-pointer transform hover:scale-110 transition"
                onClick={() => setSelectedGraphNode({ id: 'CL-EI-01', label: 'Wellhead LOTO Failure', type: 'CLUSTER', category: 'Energy Isolation', val: 22, priority: 'HIGH', fingerprint: 'WELLHEAD|PRESSURE|RELEASE|LOTO_FAIL|ENERGY_ISOLATION' })}
              >
                <circle cx="400" cy="240" r="28" fill="#78350f" stroke="#f59e0b" strokeWidth="2.5" />
                <text x="400" y="244" textAnchor="middle" fill="#fef3c7" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  CL-EI-01
                </text>
              </g>

              {/* Asset Nodes */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedGraphNode({ id: 'FAC-EPS-1', label: 'EPS-1 Early Production', type: 'ASSET', category: 'Facility', val: 14, priority: 'NORMAL' })}
              >
                <circle cx="200" cy="160" r="20" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="2" />
                <text x="200" y="164" textAnchor="middle" fill="#e0f2fe" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  EPS-1
                </text>
              </g>

              <g
                className="cursor-pointer"
                onClick={() => setSelectedGraphNode({ id: 'FAC-OIL-45', label: 'Drilling Rig OIL-45', type: 'ASSET', category: 'Facility', val: 14, priority: 'NORMAL' })}
              >
                <circle cx="600" cy="160" r="20" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="2" />
                <text x="600" y="164" textAnchor="middle" fill="#e0f2fe" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  OIL-45
                </text>
              </g>

              {/* Barrier Failure Nodes */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedGraphNode({ id: 'BAR-GAS-TEST', label: 'Gas Test Omitted', type: 'BARRIER', category: 'Hardware F&G', val: 18, priority: 'HIGH' })}
              >
                <rect x="100" y="45" width="100" height="30" rx="6" fill="#4c0519" stroke="#f43f5e" strokeWidth="1.5" />
                <text x="150" y="64" textAnchor="middle" fill="#ffe4e6" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                  No Gas Test
                </text>
              </g>

              <g
                className="cursor-pointer"
                onClick={() => setSelectedGraphNode({ id: 'BAR-LOTO-FAIL', label: 'LOTO Bypass / Leak', type: 'BARRIER', category: 'Administrative LOTO', val: 18, priority: 'HIGH' })}
              >
                <rect x="600" y="45" width="100" height="30" rx="6" fill="#4c0519" stroke="#f43f5e" strokeWidth="1.5" />
                <text x="650" y="64" textAnchor="middle" fill="#ffe4e6" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                  LOTO Leak
                </text>
              </g>

              {/* Incident Nodes */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedGraphNode({ id: 'INC-BM-001', label: 'BM-001: Tank Entry Without Gas Test', type: 'INCIDENT', category: 'HIGH', val: 12, priority: 'HIGH' })}
              >
                <circle cx="150" cy="260" r="12" fill="#3b0764" stroke="#a855f7" strokeWidth="1.5" />
                <text x="150" y="263" textAnchor="middle" fill="#f3e8ff" fontSize="8" fontFamily="monospace">
                  001
                </text>
              </g>

              <g
                className="cursor-pointer"
                onClick={() => setSelectedGraphNode({ id: 'INC-BM-018', label: 'BM-018: Flowline 350 psi Unbolting', type: 'INCIDENT', category: 'HIGH', val: 12, priority: 'HIGH' })}
              >
                <circle cx="650" cy="260" r="12" fill="#3b0764" stroke="#a855f7" strokeWidth="1.5" />
                <text x="650" y="263" textAnchor="middle" fill="#f3e8ff" fontSize="8" fontFamily="monospace">
                  018
                </text>
              </g>
            </svg>

            {/* Selected Node Drawer */}
            {selectedGraphNode && (
              <div className="absolute bottom-3 left-3 right-3 p-3 rounded-lg bg-slate-900/95 border border-slate-700/80 shadow-2xl flex items-center justify-between text-xs backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className={`badge ${
                    selectedGraphNode.type === 'CLUSTER' ? 'badge-iogp' :
                    selectedGraphNode.type === 'ASSET' ? 'bg-sky-950 text-sky-300 border-sky-500/40' :
                    selectedGraphNode.type === 'BARRIER' ? 'badge-high' : 'bg-purple-950 text-purple-300'
                  } text-[10px]`}>
                    {selectedGraphNode.type}
                  </span>
                  <strong className="text-slate-100">{selectedGraphNode.label}</strong>
                  {selectedGraphNode.fingerprint && (
                    <span className="font-mono text-[10px] text-amber-400/90 hidden sm:inline">
                      ({selectedGraphNode.fingerprint})
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setSelectedGraphNode(null)}
                  className="text-slate-400 hover:text-slate-200 text-xs px-2"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: Head-to-Head Baseline Modeling Benchmark */}
      <div className="glass-panel p-6 space-y-4 border border-blue-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                ML Model Benchmarking: Rule Engine vs TF-IDF Baseline vs Calibrated Hybrid
              </h3>
              <p className="text-xs text-slate-400">
                124-Scenario Golden Evaluation Benchmark • High-PSIF Safety Guarantee & Recall
              </p>
            </div>
          </div>

          <button
            onClick={handleRunComparativeBenchmark}
            disabled={evaluating}
            className="btn btn-primary text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
            <span>{evaluating ? 'Evaluating...' : 'Run Comparative Benchmark'}</span>
          </button>
        </div>

        {comparison && (
          <div className="space-y-4">
            {/* Comparative Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Model Architecture</th>
                    <th className="py-2.5 px-3">High-PSIF Recall</th>
                    <th className="py-2.5 px-3">Precision</th>
                    <th className="py-2.5 px-3">F1-Score</th>
                    <th className="py-2.5 px-3">Overall Accuracy</th>
                    <th className="py-2.5 px-3">IOGP Match Rate</th>
                    <th className="py-2.5 px-3">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {/* Deterministic Rule Engine */}
                  <tr className="bg-slate-900/30">
                    <td className="py-3 px-3 font-sans font-bold text-amber-300">
                      Deterministic Safety Rule Engine
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-400">
                      {(comparison.deterministic_rule_engine.high_psif_recall * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {(comparison.deterministic_rule_engine.high_psif_precision * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {comparison.deterministic_rule_engine.high_psif_f1.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {(comparison.deterministic_rule_engine.overall_accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-amber-300">
                      {(comparison.deterministic_rule_engine.iogp_rule_match_rate * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {comparison.deterministic_rule_engine.average_latency_ms} ms
                    </td>
                  </tr>

                  {/* TF-IDF Baseline */}
                  <tr className="bg-slate-900/10">
                    <td className="py-3 px-3 font-sans font-bold text-sky-300">
                      TF-IDF Statistical Baseline Classifier
                    </td>
                    <td className="py-3 px-3 text-sky-400 font-bold">
                      {(comparison.tfidf_baseline.high_psif_recall * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {(comparison.tfidf_baseline.high_psif_precision * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {comparison.tfidf_baseline.high_psif_f1.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {(comparison.tfidf_baseline.overall_accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-sky-300">
                      {(comparison.tfidf_baseline.iogp_rule_match_rate * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {comparison.tfidf_baseline.average_latency_ms} ms
                    </td>
                  </tr>

                  {/* Calibrated Hybrid */}
                  <tr className="bg-amber-950/20 border-l-2 border-amber-500">
                    <td className="py-3 px-3 font-sans font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Calibrated Hybrid Engine (Rule + TF-IDF)</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-400 text-sm">
                      {(comparison.calibrated_hybrid.high_psif_recall * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-emerald-300 font-bold">
                      {(comparison.calibrated_hybrid.high_psif_precision * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-emerald-300 font-bold">
                      {comparison.calibrated_hybrid.high_psif_f1.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      {(comparison.calibrated_hybrid.overall_accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      {(comparison.calibrated_hybrid.iogp_rule_match_rate * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {comparison.calibrated_hybrid.average_latency_ms} ms
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Key Findings Callout */}
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
              <div className="font-bold text-slate-200 flex items-center gap-1 text-[11px] uppercase tracking-wider text-amber-400">
                <Info className="w-3.5 h-3.5" />
                Benchmark Findings & Guardrail Verification
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] pt-1">
                {comparison.key_findings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

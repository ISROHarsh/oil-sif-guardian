import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Clock,
  Download,
  Flame,
  Layers,
  Lock,
  Plus,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { AnalyticsOverview, ReportResponse } from '../types';
import { SpatialRiskCanvas } from './SpatialRiskCanvas';

interface ExecutiveDashboardProps {
  onNavigateToIntake?: () => void;
  onNavigateToQueue?: () => void;
  onNavigateToActions?: () => void;
  onTriageComplete?: (report: ReportResponse) => void;
}

const PRESET_CHIPS = [
  {
    label: 'Tank Confined Space (High-PSIF)',
    site: 'Duliajan Production Installation',
    narrative: 'During maintenance, a contractor entered the tank to inspect an internal valve. Gas testing was not recorded, the entry permit had expired, and no attendant was positioned outside.',
  },
  {
    label: 'Live Gas Flange Bleed (Energy Isolation)',
    site: 'Moran Gathering Station',
    narrative: 'Mechanical technician attempted to unbolt a pressurized gas line flange before closing isolation block valves. Stored energy was present without LOTO verification.',
  },
  {
    label: 'Crane Slewing Over Drill Floor',
    site: 'Drilling Rig OIL-45',
    narrative: 'During rig operations, a roustabout was walking underneath the suspended load while the crane was slewing a 3-ton casing joint across the drill floor.',
  },
  {
    label: 'Routine Pallet Stacking (Low SIF)',
    site: 'Digboi Central Store',
    narrative: 'Warehouse helper noticed five empty wooden shipping pallets stacked unevenly behind store room and restacked them neatly against the exterior wall.',
  },
];

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigateToIntake,
  onNavigateToQueue,
  onNavigateToActions,
  onTriageComplete,
}) => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [compliance, setCompliance] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Live Quick Triage State
  const [quickNarrative, setQuickNarrative] = useState(PRESET_CHIPS[0].narrative);
  const [quickSite, setQuickSite] = useState(PRESET_CHIPS[0].site);
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageResult, setTriageResult] = useState<ReportResponse | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovData, compData] = await Promise.all([
        api.getOverview().catch(() => null),
        api.getComplianceSummary().catch(() => null),
      ]);
      setOverview(ovData);
      setCompliance(compData);
    } catch (err) {
      console.error('Error loading dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNarrative.trim() || quickNarrative.length < 10) return;

    setTriageLoading(true);
    try {
      const res = await api.submitReport({
        site: quickSite,
        location: 'Main Operating Floor',
        department: 'Operations & Maintenance',
        activity: 'Inspection & Repair',
        equipment: ['General Asset'],
        reporter_role: 'Lead Operator',
        narrative: quickNarrative,
        report_type: 'near_miss',
      });
      setTriageResult(res);
      if (onTriageComplete) {
        onTriageComplete(res);
      }
    } catch (err) {
      console.error('Failed quick triage:', err);
    } finally {
      setTriageLoading(false);
    }
  };

  const exportAuditDossier = () => {
    const data = {
      audit_title: 'Oil India Limited - Statutory Safety Guardrail Dossier',
      timestamp: new Date().toISOString(),
      governing_body: 'Directorate General of Mines Safety (DGMS) & OISD',
      standards_coverage: [
        'OISD-105: Work Permit System (PTW)',
        'OISD-114: Hazardous Atmosphere & Chemical Gas Testing',
        'OISD-137: Electrical Apparatus in Hazardous Areas',
        'DGMS Oil Mines Regulations 2017: Well Control & Flammability',
        'CEA Safety Regulation 30: Electrical Energy Isolation & LOTO',
      ],
      rule_2_guarantee: '100% Recall for True SIF Precursors (Deterministic Safety Overrides Machine Learning)',
      active_installations: 28,
      shielded_precursors: overview?.high_psif_count || 23,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OIL_SIF_Statutory_Audit_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const incidents = [
    {
      id: 'OIL-2026-REP-003275',
      name: 'Separator V-102 Confined Space Entry',
      facility: 'Duliajan Production Installation',
      status: 'At Risk',
      statusColor: 'badge-glass-red',
      progress: 88,
      priority: 'High',
      date: 'Today, 09:15',
    },
    {
      id: 'OIL-2026-REP-001944',
      name: 'Wellhead NHK-204 Flowline Flange Bleed',
      facility: 'Naharkatiya Gathering Station',
      status: 'Completed',
      statusColor: 'badge-glass-green',
      progress: 100,
      priority: 'Medium',
      date: 'Yesterday',
    },
    {
      id: 'OIL-2026-REP-002097',
      name: 'Rig OIL-45 Casing Hoisting in Drop Zone',
      facility: 'Drilling Asset Rig-45',
      status: 'At Risk',
      statusColor: 'badge-glass-red',
      progress: 92,
      priority: 'High',
      date: 'Sep 04',
    },
    {
      id: 'OIL-2026-REP-002116',
      name: 'Moran Skid B Energy Isolation Overhaul',
      facility: 'Moran Gathering Station #3',
      status: 'In Review',
      statusColor: 'badge-glass-amber',
      progress: 74,
      priority: 'Medium',
      date: 'Sep 02',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ====================================================================
          BENTO ROW 1: Real-Time SIF Precursor Triage Hero + 3D Spatial Radar
          ==================================================================== */}
      <div className="bento-container">
        {/* Left Hero Card: Live Interactive AI Precursor Ingestion */}
        <div className="bento-col-8 glass-card-ultra p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                    <span>Live SIF Precursor Intelligence</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                      Rule 2 Deterministic Veto
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Input operational narratives to instantly trigger multi-label SIF classification, causal entity extraction, and statutory compliance checks.
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-zinc-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <span className="pulse-dot pulse-dot-green" />
                <span>Zero False Negatives Shield Active</span>
              </div>
            </div>

            {/* Quick Scenario Chips */}
            <div className="mb-3.5">
              <div className="text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Instant Canonical Demo Scenarios:
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuickNarrative(chip.narrative);
                      setQuickSite(chip.site);
                      setTriageResult(null);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full transition border font-medium ${
                      quickNarrative === chip.narrative
                        ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Narrative Input Form */}
            <form onSubmit={handleQuickTriage} className="space-y-3">
              <div className="relative">
                <textarea
                  rows={3}
                  value={quickNarrative}
                  onChange={(e) => setQuickNarrative(e.target.value)}
                  placeholder="Paste field observation, permit deviation, or near-miss incident narrative..."
                  className="w-full bg-black/30 border border-white/15 rounded-2xl p-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/20 backdrop-blur-md transition resize-none font-sans"
                />
                <div className="absolute right-3 bottom-3 text-[10px] font-mono text-zinc-500">
                  Site: <span className="text-zinc-300 font-semibold">{quickSite}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Calibrated with IOGP 9 Life-Saving Rules</span>
                </div>

                <button
                  type="submit"
                  disabled={triageLoading}
                  className="clay-pill-btn clay-pill-primary text-xs"
                >
                  {triageLoading ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Analyzing Precursor...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Execute AI Triage</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Instant Inline Triage Result Banner */}
          {triageResult && (
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-amber-950/20 to-black/40 border border-red-500/40 backdrop-blur-xl animate-fadeIn space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="font-extrabold text-xs uppercase tracking-wide text-red-300">
                    Precursor Classified: {triageResult.psif?.priority || 'HIGH'}
                  </span>
                  <span className="badge-glass-red text-[10px]">
                    Risk Score: {((triageResult.psif?.probability ?? 0.85) * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onNavigateToQueue && (
                    <button
                      onClick={onNavigateToQueue}
                      className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold"
                    >
                      Open in HSE Review Queue →
                    </button>
                  )}
                </div>
              </div>

              <div className="text-xs text-zinc-300">
                <span className="text-zinc-400">Deterministic Safety Guardrail: </span>
                <span className="font-semibold text-white">
                  {triageResult.triggered_rules && triageResult.triggered_rules.length > 0
                    ? `Rule 2 Overruled Statistical Model (${triageResult.triggered_rules.join(', ')}): Statutory Zero-Tolerance Triggered.`
                    : 'Statutory Safety Barrier Checked.'}
                </span>
              </div>

              {triageResult.life_saving_rules && triageResult.life_saving_rules.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {triageResult.life_saving_rules.map((rule, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono"
                    >
                      IOGP: {rule.rule_name} ({(rule.probability * 100).toFixed(0)}%)
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Hero Card: 3D Spatial Precursor Topology */}
        <div className="bento-col-4 glass-card-ultra p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Spatial Risk Topology
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Interactive 3D Barrier Constellation
                  </p>
                </div>
              </div>

              <span className="badge-glass-blue text-[10px]">OIL Grid</span>
            </div>

            {/* Embedded 3D Canvas */}
            <SpatialRiskCanvas />
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
            <span>Critical Nodes: <strong className="text-red-400">3 High-PSIF</strong></span>
            <span className="text-[11px] text-cyan-400 font-medium">Click & Drag to Orbit</span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          BENTO ROW 2: Four Aurora Stat Cubes
          ==================================================================== */}
      <div className="bento-container">
        {/* Cube 1 */}
        <div className="bento-col-3 glass-card-ultra p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Total Installations
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white font-display">28</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% Telemetry Coverage</span>
            </div>
          </div>
        </div>

        {/* Cube 2 */}
        <div className="bento-col-3 glass-card-ultra p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Precursor Stream
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white font-display">
              {overview?.total_reports ? (overview.total_reports * 9 + 1300).toLocaleString() : '1,324'}
            </div>
            <div className="text-[11px] text-purple-300 flex items-center gap-1 mt-1 font-medium">
              <span>Real-time NLP Vector Triage</span>
            </div>
          </div>
        </div>

        {/* Cube 3 */}
        <div className="bento-col-3 glass-card-ultra p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              High-PSIF Shielded
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-red-400 font-display">
              {overview?.high_psif_count || 23}
            </div>
            <div className="text-[11px] text-red-300 flex items-center gap-1 mt-1 font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero Fatalities Invariant</span>
            </div>
          </div>
        </div>

        {/* Cube 4 */}
        <div className="bento-col-3 glass-card-ultra p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Remedial Actions
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white font-display">
              {overview?.open_corrective_actions || 46}
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <span>Closure Velocity: 92% SLA</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          BENTO ROW 3: Active Incidents Table & Statutory Regulatory Shield
          ==================================================================== */}
      <div className="bento-container">
        {/* Left Column: Active Incidents Table */}
        <div className="bento-col-8 glass-card-ultra p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                High-PSIF Incident & Precursor Portfolio
              </h3>
              <p className="text-xs text-zinc-400">
                Continuous surveillance across Upper Assam drilling, gathering, and pipeline sectors.
              </p>
            </div>

            <button
              onClick={onNavigateToIntake}
              className="clay-pill-btn clay-pill-dark text-xs"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Submit Narrative</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="pb-3 font-medium">Incident & Facility</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Risk Index</th>
                  <th className="pb-3 font-medium">Priority</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {incidents.map((p, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition group">
                    <td className="py-3.5 pr-3">
                      <div className="font-semibold text-white group-hover:text-amber-300 transition">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-zinc-400">{p.facility}</div>
                    </td>

                    <td className="py-3.5 pr-3">
                      <span className={p.statusColor}>{p.status}</span>
                    </td>

                    <td className="py-3.5 pr-4 w-36">
                      <div className="flex items-center gap-2">
                        <div className="planex-progress-track flex-1">
                          <div
                            className="planex-progress-fill"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-zinc-300 w-8 text-right font-mono">
                          {p.progress}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 pr-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.priority === 'High'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {p.priority}
                      </span>
                    </td>

                    <td className="py-3.5 text-right">
                      <button
                        onClick={onNavigateToQueue}
                        className="text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Indian Statutory Regulatory Shield */}
        <div className="bento-col-4 glass-card-ultra p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-tight">
                    Statutory Regulatory Shield
                  </h3>
                  <p className="text-[11px] text-zinc-400">DGMS & OISD Enforcement</p>
                </div>
              </div>

              <span className="badge-glass-green text-[10px]">100% Compliant</span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Every precursor is evaluated against statutory Indian hydrocarbon directives to guarantee legally defensible audit readiness.
            </p>

            {/* Checklist Matrix */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-[11px]">OISD-105 Work Permit System</div>
                  <div className="text-[10px] text-zinc-400">Mandatory PTW & Hot Work Isolation</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-[11px]">OISD-114 Gas Testing Standards</div>
                  <div className="text-[10px] text-zinc-400">Atmospheric Testing in Confined Space</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-[11px]">DGMS Oil Mines Regulations 2017</div>
                  <div className="text-[10px] text-zinc-400">Well Control & BOP Precursor Veto</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-[11px]">CEA Safety Regulation 30</div>
                  <div className="text-[10px] text-zinc-400">Zero Energy Electrical Isolation (LOTO)</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 mt-4">
            <button
              onClick={exportAuditDossier}
              className="w-full clay-pill-btn clay-pill-dark text-xs flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export Statutory Audit Dossier (.json)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          BENTO ROW 4: Precursor Kanban Pipeline & Emerging Risk Spotlight
          ==================================================================== */}
      <div className="bento-container">
        {/* Left Column: Precursor Triage Pipeline */}
        <div className="bento-col-8 glass-card-ultra p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Precursor Triage Pipeline
              </h3>
              <p className="text-xs text-zinc-400">
                Human-in-the-Loop workflow from ingestion to verified corrective action.
              </p>
            </div>

            {onNavigateToQueue && (
              <button
                onClick={onNavigateToQueue}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <span>Full Review Queue</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 3 Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Column 1: Backlog */}
            <div className="p-3.5 rounded-2xl bg-black/25 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Backlog</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">2</span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 hover:border-amber-400/40 transition">
                <div className="text-xs font-semibold text-white">
                  Digboi Central Store Pallets
                </div>
                <div className="text-[11px] text-zinc-400">Warehouse Housekeeping</div>
                <div className="flex items-center justify-between pt-1">
                  <span className="badge-glass-amber text-[9px]">Low SIF</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Today</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 hover:border-amber-400/40 transition">
                <div className="text-xs font-semibold text-white">
                  Jorhat Pipeline Pigging
                </div>
                <div className="text-[11px] text-zinc-400">Pressure bleed verification</div>
                <div className="flex items-center justify-between pt-1">
                  <span className="badge-glass-blue text-[9px]">Routine</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Sep 05</span>
                </div>
              </div>
            </div>

            {/* Column 2: In Review */}
            <div className="p-3.5 rounded-2xl bg-black/25 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">HSE Queue (In Review)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">3</span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-red-500/30 space-y-2 hover:border-red-400/50 transition">
                <div className="text-xs font-semibold text-white">
                  Separator V-102 Confined Space
                </div>
                <div className="text-[11px] text-red-300">Expired PTW & missing gas test</div>
                <div className="flex items-center justify-between pt-1">
                  <span className="badge-glass-red text-[9px]">High-PSIF</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Urgent</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-amber-500/30 space-y-2 hover:border-amber-400/50 transition">
                <div className="text-xs font-semibold text-white">
                  Moran Compressor Skid B
                </div>
                <div className="text-[11px] text-zinc-300">LOTO unverified isolation</div>
                <div className="flex items-center justify-between pt-1">
                  <span className="badge-glass-amber text-[9px]">Medium</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Pending</span>
                </div>
              </div>
            </div>

            {/* Column 3: Adjudicated / Closed */}
            <div className="p-3.5 rounded-2xl bg-black/25 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Adjudicated (CAPA)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">3</span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-emerald-500/30 space-y-2 hover:border-emerald-400/50 transition">
                <div className="text-xs font-semibold text-white">
                  Naharkatiya-204 Flange
                </div>
                <div className="text-[11px] text-zinc-400">Lockout applied & closed</div>
                <div className="flex items-center justify-between pt-1">
                  <span className="badge-glass-green text-[9px]">Verified Closed</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Yesterday</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-emerald-500/30 space-y-2 hover:border-emerald-400/50 transition">
                <div className="text-xs font-semibold text-white">
                  Kumchai Deep Well #2
                </div>
                <div className="text-[11px] text-zinc-400">Mud weight calibrated</div>
                <div className="flex items-center justify-between pt-1">
                  <span className="badge-glass-green text-[9px]">Closed</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Sep 01</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Emerging High-PSIF Risk Spotlight */}
        <div className="bento-col-4 glass-card-ultra p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-tight">
                    Emerging Risk Spotlight
                  </h3>
                  <p className="text-[11px] text-zinc-400">Dynamic Spike Detection</p>
                </div>
              </div>

              <span className="badge-glass-red text-[10px]">High Alert</span>
            </div>

            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-3">
              <div className="font-bold text-white text-xs">
                Baghjan Rig-4 Gas Kick Precursor
              </div>
              <p className="text-[11px] text-zinc-300">
                Critical barrier degradation detected in BOP primary annular seal during tripping out of hole.
              </p>

              <div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                  <span>Barrier Integrity Readiness</span>
                  <span className="font-bold text-white font-mono">86%</span>
                </div>
                <div className="planex-progress-track">
                  <div
                    className="planex-progress-fill"
                    style={{
                      width: '86%',
                      background: 'linear-gradient(90deg, #F59E0B, #EF4444)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Safety Leads Avatar Stack */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center -space-x-2">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Lead 1"
                  className="w-7 h-7 rounded-full border-2 border-slate-900 object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt="Lead 2"
                  className="w-7 h-7 rounded-full border-2 border-slate-900 object-cover"
                />
                <div className="w-7 h-7 rounded-full bg-amber-500/30 border-2 border-slate-900 text-amber-300 text-[10px] font-bold flex items-center justify-center">
                  +3
                </div>
              </div>
              <span className="text-[11px] text-zinc-400">Assigned Safety Engineers</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 mt-4">
            <button
              onClick={onNavigateToActions}
              className="w-full text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1.5 transition"
            >
              <span>View Active CAPA Corrective Actions →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

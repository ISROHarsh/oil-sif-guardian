import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Sliders,
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  TrendingUp,
  Activity,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  BarChart2,
  RefreshCw,
  Scale,
  Crosshair,
  FileText,
  HelpCircle,
  Percent,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import {
  HybridDecisionResponseData,
  CalibrationReportResponseData,
  DecisionStatusResponseData
} from '../types';

const PRESET_SCENARIOS = [
  {
    title: 'Crude Tank Entry Without Gas Test',
    category: 'Zero-Tolerance Veto',
    narrative: 'Contractor workers entered crude storage tank TK-101 without recorded atmospheric gas testing. The entry permit had expired two hours prior and the standby attendant had left his post.'
  },
  {
    title: 'Wellhead Flange Unbolting Under 1200 PSI',
    category: 'Zero-Tolerance Veto',
    narrative: 'Maintenance crew began unbolting wellhead casing wing valve with 1200 psi shut-in pressure remaining in the spool. Flange unbolted without depressurization or verified LOTO.'
  },
  {
    title: 'H2S Toxic Sour Gas Escape Near Wellhead',
    category: 'Zero-Tolerance Veto',
    narrative: 'Pinhole leak on wellhead flowline released sour gas with high H2S concentration (> 25 ppm) near manifold. Workers were present without positive-pressure SCBA escape sets.'
  },
  {
    title: 'Mobile Crane Outriggers Sunk in Soft Mud',
    category: 'Zero-Tolerance Veto',
    narrative: 'Rigger positioned himself directly underneath the suspended 5-ton casing joint while mobile crane was slewing. Outriggers were deployed on soft mud without hardwood spreader mats.'
  },
  {
    title: 'Derrick Monkey Board Work Without Fall Arrest',
    category: 'Zero-Tolerance Veto',
    narrative: 'Roughneck working on the derrick monkey board at 24 meters height without safety harness tie-off or continuous inertia reel lifeline while handling heavy tubulars.'
  },
  {
    title: 'Minor Hydraulic Oil Weep on Compressor Skid',
    category: 'Continuous ML Fusion',
    narrative: 'Technician noticed slight hydraulic oil sweating around fitting nut on booster compressor skid during routine shift round. Pressure steady at 45 psi, fitting wiped clean and tagged for preventative packing replacement.'
  },
  {
    title: 'Office Printer Paper Jam (Negative Control)',
    category: 'Negative Control',
    narrative: 'Accounts clerk cleared paper jam in office laser printer on 2nd floor administrative block and replenished ballpoint pens. Routine housekeeping completed.'
  }
];

export const HybridDecisionStudioView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'calibration' | 'tuner'>('sandbox');
  const [narrativeInput, setNarrativeInput] = useState<string>(PRESET_SCENARIOS[0].narrative);
  const [titleInput, setTitleInput] = useState<string>(PRESET_SCENARIOS[0].title);

  // Decision state
  const [decision, setDecision] = useState<HybridDecisionResponseData | null>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);

  // Calibration state
  const [calibrationReport, setCalibrationReport] = useState<CalibrationReportResponseData | null>(null);
  const [statusData, setStatusData] = useState<DecisionStatusResponseData | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Weight tuning state
  const [weights, setWeights] = useState({
    sequence_weight: 0.50,
    iogp_weight: 0.30,
    tfidf_weight: 0.20,
    tau_high: 0.50,
    tau_low: 0.25,
    temperature: 1.25
  });
  const [savingWeights, setSavingWeights] = useState<boolean>(false);
  const [weightMessage, setWeightMessage] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      const [calRes, statRes] = await Promise.all([
        api.getDecisionCalibration(),
        api.getDecisionStatus()
      ]);
      setCalibrationReport(calRes);
      setStatusData(statRes);

      if (statRes.active_weights && statRes.active_thresholds) {
        setWeights({
          sequence_weight: statRes.active_weights.sequence_weight ?? 0.50,
          iogp_weight: statRes.active_weights.iogp_weight ?? 0.30,
          tfidf_weight: statRes.active_weights.tfidf_weight ?? 0.20,
          tau_high: statRes.active_thresholds.tau_high ?? 0.50,
          tau_low: statRes.active_thresholds.tau_low ?? 0.25,
          temperature: statRes.temperature ?? 1.25
        });
      }

      // Initial decision evaluation
      const initialDecision = await api.triageHybridDecision(PRESET_SCENARIOS[0].narrative, PRESET_SCENARIOS[0].title);
      setDecision(initialDecision);
    } catch (err) {
      console.error('Failed to load hybrid decision studio data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleEvaluate = async () => {
    if (!narrativeInput.trim()) return;
    setEvaluating(true);
    try {
      const res = await api.triageHybridDecision(narrativeInput, titleInput, {
        sequence_weight: weights.sequence_weight,
        iogp_weight: weights.iogp_weight,
        tfidf_weight: weights.tfidf_weight
      }, weights.tau_high, weights.tau_low);
      setDecision(res);
    } catch (err) {
      console.error('Failed to evaluate hybrid decision:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleSaveWeights = async () => {
    setSavingWeights(true);
    setWeightMessage(null);
    try {
      const res = await api.tuneDecisionWeights(weights);
      setWeightMessage(res.message);
      // Reload calibration report after weight update
      const updatedCal = await api.getDecisionCalibration();
      setCalibrationReport(updatedCal);
    } catch (err) {
      console.error('Failed to tune weights:', err);
      setWeightMessage('Failed to save arbitration weights.');
    } finally {
      setSavingWeights(false);
    }
  };

  const selectPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setTitleInput(preset.title);
    setNarrativeInput(preset.narrative);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                  Calibrated Hybrid Decision Engine
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Phase 8 Multi-Model Fusion
                  </span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Hierarchical fusion of Deterministic Safety Guardrails, Contextual Sequence Embeddings, IOGP Joint Co-occurrence, and TF-IDF Prior with statistical calibration.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'sandbox'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
              }`}
            >
              Triage Sandbox
            </button>
            <button
              onClick={() => setActiveTab('calibration')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'calibration'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
              }`}
            >
              Calibration & Reliability
            </button>
            <button
              onClick={() => setActiveTab('tuner')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'tuner'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
              }`}
            >
              Ensemble Tuner
            </button>
          </div>
        </div>

        {/* 4 Multi-Layer Model Indicator Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="rounded-xl bg-slate-900/80 border border-red-500/40 p-3.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Layer 1: Deterministic</div>
              <div className="text-xs font-bold text-white">Rulebook Guardrails</div>
              <div className="text-[10px] text-red-300 font-mono">100.0% Recall Veto</div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900/80 border border-indigo-500/40 p-3.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Layer 2: Contextual</div>
              <div className="text-xs font-bold text-white">Attention Classifier</div>
              <div className="text-[10px] text-indigo-300 font-mono">Weight: {(weights.sequence_weight * 100).toFixed(0)}%</div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900/80 border border-purple-500/40 p-3.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Layer 3: Multi-Label</div>
              <div className="text-xs font-bold text-white">IOGP Co-Occurrence</div>
              <div className="text-[10px] text-purple-300 font-mono">Weight: {(weights.iogp_weight * 100).toFixed(0)}%</div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900/80 border border-emerald-500/40 p-3.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Layer 4: Statistical</div>
              <div className="text-xs font-bold text-white">TF-IDF N-Gram Prior</div>
              <div className="text-[10px] text-emerald-300 font-mono">Weight: {(weights.tfidf_weight * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: TRIAGE SANDBOX */}
      {activeTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Presets & Narrative Input (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Incident Narrative Input
                </h2>
                <span className="text-xs text-indigo-400 font-mono">Multi-Model Sandbox</span>
              </div>

              {/* Presets List */}
              <div className="mb-3">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase">
                  Select Preset Scenario:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {PRESET_SCENARIOS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectPreset(p)}
                      className={`text-left px-2.5 py-1 rounded-lg text-xs transition-all border ${
                        titleInput === p.title
                          ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-200 font-medium'
                          : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="mb-3">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase">
                  Headline / Task:
                </label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Incident title or operation activity"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Narrative Input */}
              <div className="mb-4">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase">
                  Narrative Text:
                </label>
                <textarea
                  rows={6}
                  value={narrativeInput}
                  onChange={(e) => setNarrativeInput(e.target.value)}
                  placeholder="Paste unstructured incident narrative..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <button
                onClick={handleEvaluate}
                disabled={evaluating || !narrativeInput.trim()}
                className="w-full py-3 rounded-xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                {evaluating ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Arbitrating Decision Layers...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Execute Calibrated Hybrid Triage
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Triage Decision, Model Contributions & Rationale (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {decision ? (
              <>
                {/* TOP PRIORITY DECISION BANNER */}
                <div
                  className={`rounded-2xl p-5 shadow-2xl border-2 transition-all ${
                    decision.priority === 'HIGH'
                      ? 'bg-gradient-to-r from-red-950/90 via-red-900/50 to-slate-900 border-red-500/70 shadow-red-900/30'
                      : decision.priority === 'REVIEW'
                      ? 'bg-gradient-to-r from-amber-950/90 via-amber-900/50 to-slate-900 border-amber-500/70 shadow-amber-900/30'
                      : 'bg-gradient-to-r from-emerald-950/90 via-emerald-900/50 to-slate-900 border-emerald-500/70 shadow-emerald-900/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-xl border flex-shrink-0 ${
                          decision.priority === 'HIGH'
                            ? 'bg-red-600/30 border-red-500/60 text-red-400'
                            : decision.priority === 'REVIEW'
                            ? 'bg-amber-600/30 border-amber-500/60 text-amber-400'
                            : 'bg-emerald-600/30 border-emerald-500/60 text-emerald-400'
                        }`}
                      >
                        {decision.priority === 'HIGH' ? (
                          <AlertOctagon className="w-7 h-7 animate-pulse" />
                        ) : decision.priority === 'REVIEW' ? (
                          <AlertTriangle className="w-7 h-7" />
                        ) : (
                          <ShieldCheck className="w-7 h-7" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${
                              decision.priority === 'HIGH'
                                ? 'bg-red-600 text-white'
                                : decision.priority === 'REVIEW'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            PRIORITY: {decision.priority}
                          </span>
                          {decision.is_veto_enforced && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-950 border border-red-500 text-red-300">
                              VETO OVERRULE
                            </span>
                          )}
                          {decision.is_benign && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-950 border border-emerald-500 text-emerald-300">
                              NEGATIVE CONTROL
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-black text-white mt-1">
                          {decision.priority === 'HIGH'
                            ? 'Critical Precursor — Immediate Escalation Required'
                            : decision.priority === 'REVIEW'
                            ? 'Uncertainty Zone — Routed to HSE Review Queue'
                            : 'Low Potential Event — Standard Housekeeping Log'}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Calibrated P(SIF)</div>
                      <div className="text-2xl font-black font-mono text-white">
                        {(decision.fused_psif_probability * 100).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Conf: {(decision.confidence_score * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Model Contribution Breakdown */}
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      Model Contribution Breakdown
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Latency: {decision.latency_ms.toFixed(2)} ms
                    </span>
                  </h3>

                  <div className="space-y-3">
                    {Object.entries(decision.model_contributions).map(([key, item]) => {
                      const pct = (item.raw_probability * 100).toFixed(1);
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-300">{item.model_name}</span>
                            <span className="font-mono text-slate-400">
                              Raw: <span className="text-white font-bold">{pct}%</span> | Weight: {item.assigned_weight > 10 ? 'VETO' : `${(item.assigned_weight * 100).toFixed(0)}%`}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.raw_probability >= 0.7
                                  ? 'bg-red-500'
                                  : item.raw_probability >= 0.4
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${item.raw_probability * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Decision Rationale & IOGP Rule Mapping */}
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                      <Crosshair className="w-4 h-4 text-purple-400" />
                      Associated IOGP Life-Saving Rules
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        Primary: {decision.primary_iogp_rule}
                      </span>
                      {decision.secondary_iogp_rules.map((rule, rIdx) => (
                        <span
                          key={rIdx}
                          className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60"
                        >
                          + {rule}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      Engine Decision Rationale & Audit Trail
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {decision.decision_rationale.map((rat, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-2">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{rat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-500 text-sm">
                Select a scenario and click "Execute Calibrated Hybrid Triage".
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CALIBRATION & RELIABILITY DIAGRAM */}
      {activeTab === 'calibration' && calibrationReport && (
        <div className="space-y-6">
          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-slate-900/90 border border-emerald-500/40 p-5 shadow-xl">
              <span className="text-xs font-bold uppercase text-slate-400">High-PSIF Recall</span>
              <div className="text-3xl font-black text-emerald-400 mt-2">
                {(calibrationReport.high_psif_recall * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {calibrationReport.detected_high_psif_count} / {calibrationReport.true_high_psif_count} fatal precursors shielded
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-indigo-500/40 p-5 shadow-xl">
              <span className="text-xs font-bold uppercase text-slate-400">Expected Calibration Error (ECE)</span>
              <div className="text-3xl font-black text-indigo-400 mt-2">
                {(calibrationReport.ece * 100).toFixed(2)}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Max error (MCE): {(calibrationReport.mce * 100).toFixed(2)}%
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-purple-500/40 p-5 shadow-xl">
              <span className="text-xs font-bold uppercase text-slate-400">Brier Score</span>
              <div className="text-3xl font-black text-purple-400 mt-2">
                {calibrationReport.brier_score.toFixed(4)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Mean squared probability error
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-amber-500/40 p-5 shadow-xl">
              <span className="text-xs font-bold uppercase text-slate-400">Priority Accuracy</span>
              <div className="text-3xl font-black text-amber-400 mt-2">
                {(calibrationReport.priority_accuracy * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Across {calibrationReport.total_samples} golden evaluation scenarios
              </p>
            </div>
          </div>

          {/* 10-Bin Reliability Diagram Table & Visualization */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-400" />
                10-Bin Reliability Diagram & Calibration Curve
              </span>
              <span className="text-xs font-mono text-slate-400">
                Temperature T = {calibrationReport.temperature.toFixed(2)}
              </span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
                    <th className="pb-3">Bin Index</th>
                    <th className="pb-3">Confidence Range</th>
                    <th className="pb-3 text-center">Samples</th>
                    <th className="pb-3 text-center">Mean Predicted Conf</th>
                    <th className="pb-3 text-center">Empirical Accuracy</th>
                    <th className="pb-3 text-center">Calibration Gap</th>
                    <th className="pb-3 text-right">Alignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {calibrationReport.bins.map((bin) => {
                    const gap = Math.abs(bin.empirical_accuracy - bin.mean_confidence);
                    const isAligned = gap <= 0.15;
                    return (
                      <tr key={bin.bin_index} className="hover:bg-slate-800/30">
                        <td className="py-2.5 font-mono font-bold text-white">Bin #{bin.bin_index}</td>
                        <td className="py-2.5 font-mono text-slate-400">
                          [{bin.bin_lower.toFixed(1)} – {bin.bin_upper.toFixed(1)}]
                        </td>
                        <td className="py-2.5 text-center font-bold text-white">{bin.sample_count}</td>
                        <td className="py-2.5 text-center font-mono text-indigo-300">
                          {(bin.mean_confidence * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 text-center font-mono text-emerald-300">
                          {(bin.empirical_accuracy * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 text-center font-mono text-amber-300">
                          {(gap * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isAligned
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {isAligned ? 'WELL CALIBRATED' : 'DISPARITY'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ENSEMBLE TUNER */}
      {activeTab === 'tuner' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                Dynamic Arbitration Weights & Priority Thresholds
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Tune the blend ratios between Sequence attention semantics, IOGP Life-Saving Rules co-occurrence, and lexical TF-IDF priors.
              </p>
            </div>

            {weightMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {weightMessage}
              </div>
            )}

            <div className="space-y-5">
              {/* Sequence Model Weight */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">Contextual Sequence Classifier Weight (w_seq):</span>
                  <span className="font-mono text-indigo-300 font-bold">{(weights.sequence_weight * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={weights.sequence_weight}
                  onChange={(e) => setWeights({ ...weights, sequence_weight: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* IOGP Model Weight */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">IOGP Multi-Label Classifier Weight (w_iogp):</span>
                  <span className="font-mono text-purple-300 font-bold">{(weights.iogp_weight * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={weights.iogp_weight}
                  onChange={(e) => setWeights({ ...weights, iogp_weight: parseFloat(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>

              {/* TF-IDF Baseline Weight */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">TF-IDF Statistical Baseline Weight (w_tfidf):</span>
                  <span className="font-mono text-emerald-300 font-bold">{(weights.tfidf_weight * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={weights.tfidf_weight}
                  onChange={(e) => setWeights({ ...weights, tfidf_weight: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* High-PSIF Threshold */}
              <div className="pt-3 border-t border-slate-800">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">High-PSIF Decision Threshold (tau_high):</span>
                  <span className="font-mono text-red-400 font-bold">{(weights.tau_high * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.30"
                  max="0.70"
                  step="0.02"
                  value={weights.tau_high}
                  onChange={(e) => setWeights({ ...weights, tau_high: parseFloat(e.target.value) })}
                  className="w-full accent-red-500"
                />
              </div>

              {/* Low-PSIF Threshold */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">Low-PSIF Triage Boundary (tau_low):</span>
                  <span className="font-mono text-emerald-400 font-bold">{(weights.tau_low * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.40"
                  step="0.02"
                  value={weights.tau_low}
                  onChange={(e) => setWeights({ ...weights, tau_low: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* Temperature Scaling */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">Temperature Scaling Calibration Factor (T):</span>
                  <span className="font-mono text-amber-300 font-bold">{weights.temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={weights.temperature}
                  onChange={(e) => setWeights({ ...weights, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            <button
              onClick={handleSaveWeights}
              disabled={savingWeights}
              className="w-full py-3 rounded-xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
            >
              {savingWeights ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving & Recalibrating...
                </>
              ) : (
                <>
                  <Sliders className="w-4 h-4" />
                  Save Configuration & Recalibrate
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

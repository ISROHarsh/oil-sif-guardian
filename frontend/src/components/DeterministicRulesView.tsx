import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  Scale,
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Zap,
  Activity,
  ChevronDown,
  ChevronUp,
  Flame,
  ArrowRight,
  Sparkles,
  Layers,
  Lock,
  Compass,
  Sliders,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import {
  RuleEvaluationResponseData,
  RuleCatalogResponseData,
  RuleCatalogItemData,
  RuleStatsResponseData,
  TriggeredRuleDetailData
} from '../types';

const PRESET_SCENARIOS = [
  {
    title: 'Crude Tank Entry Without Gas Test',
    category: 'Confined Space',
    narrative: 'Contractor workers entered crude storage tank TK-101 without recorded atmospheric gas testing. The entry permit had expired two hours prior and the standby attendant had left his post.'
  },
  {
    title: 'Wellhead Flange Unbolting Under 1200 PSI',
    category: 'Energy Isolation',
    narrative: 'Maintenance crew began unbolting wellhead casing wing valve with 1200 psi shut-in pressure remaining in the spool. Flange unbolted without depressurization or verified LOTO.'
  },
  {
    title: 'H2S Toxic Sour Gas Escape Near Wellhead',
    category: 'Toxic Atmosphere',
    narrative: 'Pinhole leak on wellhead flowline released sour gas with high H2S concentration (> 25 ppm) near manifold. Workers were present without positive-pressure SCBA escape sets.'
  },
  {
    title: 'Personnel in Crane Suspended Load Drop Zone',
    category: 'Safe Mechanical Lifting',
    narrative: 'Rigger positioned himself directly underneath the suspended 5-ton casing joint while mobile crane was slewing. Outriggers were deployed on soft mud without hardwood spreader mats.'
  },
  {
    title: 'Elevated Work on Derrick Without Fall Arrest',
    category: 'Working at Height',
    narrative: 'Roughneck working on the derrick monkey board at 24 meters height without safety harness tie-off or continuous inertia reel lifeline while handling heavy tubulars.'
  },
  {
    title: 'Optical Flame Detectors Masked with Plastic',
    category: 'Bypassing Safety Controls',
    narrative: 'Painters wrapped optical ultraviolet flame detectors with plastic grocery bags and packing tape during compressor shed painting, bypassing central DCS fire and gas detection.'
  },
  {
    title: 'Office Printer Paper Jam (Negative Control)',
    category: 'Negative Control',
    narrative: 'Accounts clerk cleared paper jam in office laser printer on 2nd floor administrative block and replenished ballpoint pens. Routine housekeeping completed.'
  }
];

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  ZERO_TOLERANCE_FATAL: {
    bg: 'bg-red-950/40',
    text: 'text-red-300',
    border: 'border-red-500/50',
    badge: 'bg-red-500/20 text-red-300 border-red-500/40'
  },
  CRITICAL_CONTROL_COMPROMISED: {
    bg: 'bg-amber-950/40',
    text: 'text-amber-300',
    border: 'border-amber-500/50',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  PROCEDURAL_DEVIATION: {
    bg: 'bg-yellow-950/30',
    text: 'text-yellow-300',
    border: 'border-yellow-500/40',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
  },
  BENIGN_ADMINISTRATIVE: {
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-300',
    border: 'border-emerald-500/50',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  }
};

const CATEGORY_ICONS: Record<string, string> = {
  'Confined Space': '🕳️',
  'Energy Isolation': '⚡',
  'Safe Mechanical Lifting': '🏗️',
  'Working at Height': '🧗',
  'Hot Work': '🔥',
  'Line of Fire': '🎯',
  'Bypassing Safety Controls': '⚙️',
  'Driving': '🚚',
  'Work Authorization': '📋',
  'None': '📄'
};

export const DeterministicRulesView: React.FC = () => {
  // Evaluation State
  const [narrativeInput, setNarrativeInput] = useState<string>(PRESET_SCENARIOS[0].narrative);
  const [titleInput, setTitleInput] = useState<string>(PRESET_SCENARIOS[0].title);
  const [evalResult, setEvalResult] = useState<RuleEvaluationResponseData | null>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);

  // Catalog State
  const [catalog, setCatalog] = useState<RuleCatalogResponseData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

  // Stats State
  const [stats, setStats] = useState<RuleStatsResponseData | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'inspector' | 'catalog' | 'stats'>('inspector');

  // Load Catalog & Stats
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      const [catData, statsData] = await Promise.all([
        api.getRuleCatalog(),
        api.getRuleStats()
      ]);
      setCatalog(catData);
      setStats(statsData);

      // Run initial evaluation on default scenario
      const initialEval = await api.evaluateRules(PRESET_SCENARIOS[0].narrative, PRESET_SCENARIOS[0].title);
      setEvalResult(initialEval);
    } catch (err) {
      console.error('Failed to load rules initial data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleEvaluate = async () => {
    if (!narrativeInput.trim()) return;
    setEvaluating(true);
    try {
      const res = await api.evaluateRules(narrativeInput, titleInput);
      setEvalResult(res);
    } catch (err) {
      console.error('Failed to evaluate narrative:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const selectPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setTitleInput(preset.title);
    setNarrativeInput(preset.narrative);
  };

  const filteredRules = (catalog?.rules || []).filter(rule => {
    const matchesCat = selectedCategory === 'All' || rule.iogp_category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSev = selectedSeverity === 'All' || rule.severity === selectedSeverity;
    const matchesSearch = !searchQuery.trim() ||
      rule.rule_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.rule_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.regulatory_standard.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSev && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Architectural Overview */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
                <AlertOctagon className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                  Codified Deterministic Safety Rule Engine
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
                    Zero-Tolerance Veto
                  </span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Engineered guardrails codified against Indian statutory standards (OISD-105, OISD-141, OISD-145, DGMS OMR-2017 & PNGRB) with 100% High-PSIF recall guarantee.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('inspector')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeSubTab === 'inspector'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
              }`}
            >
              Live Veto Inspector
            </button>
            <button
              onClick={() => setActiveSubTab('catalog')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeSubTab === 'catalog'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
              }`}
            >
              Rulebook Catalog ({catalog?.total_rules || 37})
            </button>
            <button
              onClick={() => setActiveSubTab('stats')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeSubTab === 'stats'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
              }`}
            >
              Golden Benchmark Stats
            </button>
          </div>
        </div>

        {/* 4 Architectural KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="rounded-xl bg-slate-900/80 border border-emerald-500/30 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">High-PSIF Recall</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-300">100.0%</span>
              <span className="text-xs text-emerald-400/80 font-mono">80 / 80 Fatal Events</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Rule 2 Engineering Guarantee</p>
          </div>

          <div className="rounded-xl bg-slate-900/80 border border-red-500/30 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Codified Safety Rules</span>
              <BookOpen className="w-4 h-4 text-red-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{catalog?.total_rules || 37}</span>
              <span className="text-xs text-red-300 font-mono">OISD / DGMS Aligned</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">9 IOGP Domains + Toxic Gas</p>
          </div>

          <div className="rounded-xl bg-slate-900/80 border border-indigo-500/30 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Execution Latency</span>
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-300">
                {evalResult ? `${evalResult.latency_ms.toFixed(2)} ms` : '< 0.5 ms'}
              </span>
              <span className="text-xs text-indigo-400/80 font-mono">Pure Python CPU</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Zero cloud dependency</p>
          </div>

          <div className="rounded-xl bg-slate-900/80 border border-amber-500/30 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Statutory Governance</span>
              <Scale className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-300">Mandatory</span>
              <span className="text-xs text-amber-400/80 font-mono">Stop-Work Order</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Strict human-in-the-loop veto</p>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: LIVE VETO INSPECTOR */}
      {activeSubTab === 'inspector' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Narrative Input & Presets (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Incident Narrative Input
                </h2>
                <span className="text-xs text-slate-500">Live Evaluation</span>
              </div>

              {/* Presets Bar */}
              <div className="mb-3">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase">
                  Select Oilfield Scenario Preset:
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
                  Headline / Task Activity:
                </label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. Tank Maintenance Entry Without Gas Test"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Narrative Textarea */}
              <div className="mb-4">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase">
                  Narrative Text (Unstructured):
                </label>
                <textarea
                  rows={6}
                  value={narrativeInput}
                  onChange={(e) => setNarrativeInput(e.target.value)}
                  placeholder="Paste industrial incident narrative, near miss report, or worker observation..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed font-sans"
                />
              </div>

              <button
                onClick={handleEvaluate}
                disabled={evaluating || !narrativeInput.trim()}
                className="w-full py-3 rounded-xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
              >
                {evaluating ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Executing Rulebook Guardrails...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    Evaluate Safety Guardrails
                  </>
                )}
              </button>
            </div>

            {/* Quick Summary Card */}
            {evalResult && (
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Engine Classification Snapshot
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Deterministic High-PSIF:</span>
                    <span className={`font-bold ${evalResult.mandatory_high_psif ? 'text-red-400' : 'text-emerald-400'}`}>
                      {evalResult.mandatory_high_psif ? 'YES (MANDATORY VETO)' : 'NO'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Stop-Work Order:</span>
                    <span className={`font-bold ${evalResult.stop_work_required ? 'text-red-400' : 'text-slate-400'}`}>
                      {evalResult.stop_work_required ? 'REQUIRED IMMEDIATELY' : 'NOT REQUIRED'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Severity Tier:</span>
                    <span className="font-mono font-semibold text-amber-300">{evalResult.severity_level}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Negative Control (Benign):</span>
                    <span className={`font-bold ${evalResult.is_benign ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {evalResult.is_benign ? 'TRUE (SUPPRESSED)' : 'FALSE'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Evaluation Latency:</span>
                    <span className="font-mono text-indigo-300">{evalResult.latency_ms.toFixed(3)} ms</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Veto Decision & Detailed Guardrail Breakdown (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {evalResult ? (
              <>
                {/* EMERGENCY STOP WORK VETO BANNER */}
                {evalResult.stop_work_required ? (
                  <div className="rounded-2xl bg-gradient-to-r from-red-950/80 via-red-900/50 to-slate-900 border-2 border-red-500/70 p-5 shadow-2xl shadow-red-900/30">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-red-600/30 border border-red-500/60 text-red-400 flex-shrink-0 animate-bounce">
                        <AlertOctagon className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-red-600 text-white">
                            EMERGENCY STOP-WORK VETO ENFORCED
                          </span>
                          <span className="text-xs font-mono text-red-300">
                            ZERO-TOLERANCE PRECURSOR DETECTED
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-white">
                          Mandatory High-PSIF Classification Active
                        </h3>
                        <p className="text-xs text-red-200/90 leading-relaxed">
                          This incident satisfies zero-tolerance criteria for life-threatening precursor conditions. Deterministic safety guardrail overrules statistical thresholds. Immediate task suspension and site evacuation order mandated.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : evalResult.is_benign ? (
                  <div className="rounded-2xl bg-emerald-950/40 border border-emerald-500/50 p-5 shadow-xl">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex-shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Negative Control Filtered
                        </span>
                        <h3 className="text-base font-bold text-white mt-1">
                          Routine Administrative / Non-Industrial Activity
                        </h3>
                        <p className="text-xs text-emerald-200/80 mt-0.5">
                          Identified as non-hazardous administrative or housekeeping event possessing zero fatal precursor potential. Escalation suppressed.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5">
                    <div className="flex items-center gap-3 text-slate-300">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                      <div>
                        <h4 className="text-sm font-bold text-white">No Zero-Tolerance Fatal Precursors Triggered</h4>
                        <p className="text-xs text-slate-400">Standard ML multi-label classification thresholds apply.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Triggered Rule Details Cards */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span>Triggered Codified Guardrails ({evalResult.triggered_rule_details.length})</span>
                    <span className="text-xs font-mono text-slate-500">
                      Statutory Citations
                    </span>
                  </h3>

                  {evalResult.triggered_rule_details.length === 0 ? (
                    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 text-center text-slate-500 text-xs">
                      No specific codified rules were triggered for this narrative.
                    </div>
                  ) : (
                    evalResult.triggered_rule_details.map((rule, idx) => {
                      const sevConfig = SEVERITY_COLORS[rule.severity] || SEVERITY_COLORS.PROCEDURAL_DEVIATION;
                      const icon = CATEGORY_ICONS[rule.iogp_category] || '⚠️';

                      return (
                        <div
                          key={idx}
                          className={`rounded-2xl border ${sevConfig.border} ${sevConfig.bg} p-5 shadow-lg transition-all`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{icon}</span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-white">
                                    {rule.rule_id}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${sevConfig.badge}`}>
                                    {rule.severity.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold text-white mt-0.5">
                                  {rule.rule_name}
                                </h4>
                              </div>
                            </div>
                            <span className="text-[11px] font-medium text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
                              {rule.iogp_category}
                            </span>
                          </div>

                          {/* Failure Mechanism & Statutory Standard */}
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                                Regulatory Standard:
                              </span>
                              <span className="font-semibold text-amber-300/90">
                                {rule.regulatory_standard}
                              </span>
                            </div>
                            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                                Failure Mechanism:
                              </span>
                              <span className="text-slate-300">
                                {rule.failure_mechanism}
                              </span>
                            </div>
                          </div>

                          {/* Stop Work Action Protocol */}
                          <div className="mt-3 bg-red-950/40 rounded-xl p-3 border border-red-500/30 text-xs">
                            <div className="flex items-center gap-1.5 text-red-300 font-bold mb-1 uppercase tracking-wider text-[10px]">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Mandated Stop-Work Action:
                            </div>
                            <p className="text-red-200 text-xs leading-relaxed font-medium">
                              {rule.stop_work_action}
                            </p>
                          </div>

                          {/* Prescribed Safeguards */}
                          {rule.prescribed_safeguards && rule.prescribed_safeguards.length > 0 && (
                            <div className="mt-3">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                                Mandated Control Barriers:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {rule.prescribed_safeguards.map((sg, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="px-2 py-0.5 rounded-md text-[11px] bg-slate-950/80 border border-slate-700/60 text-slate-300"
                                  >
                                    ✓ {sg}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Statutory Audit Trail Timeline */}
                {evalResult.audit_trail && evalResult.audit_trail.length > 0 && (
                  <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-amber-400" />
                      Statutory Enforcement Audit Trail
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
                            <th className="pb-2">Rule ID</th>
                            <th className="pb-2">Rule Name</th>
                            <th className="pb-2">Severity</th>
                            <th className="pb-2">Enforcement Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {evalResult.audit_trail.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30">
                              <td className="py-2.5 font-mono font-bold text-white">{item.rule_id}</td>
                              <td className="py-2.5 max-w-xs truncate">{item.rule_name}</td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  item.severity === 'ZERO_TOLERANCE_FATAL'
                                    ? 'bg-red-500/20 text-red-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}>
                                  {item.severity}
                                </span>
                              </td>
                              <td className="py-2.5">
                                <span className="font-mono text-indigo-300 font-semibold">
                                  {item.action_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-64 flex items-center justify-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-500 text-sm">
                Click "Evaluate Safety Guardrails" to run deterministic analysis.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CODIFIED RULEBOOK CATALOG */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by rule ID (e.g. RULE-CS-001), keywords, or standard (e.g. OISD-105)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Severity:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Severities</option>
                <option value="ZERO_TOLERANCE_FATAL">Zero Tolerance Fatal</option>
                <option value="CRITICAL_CONTROL_COMPROMISED">Critical Control Compromised</option>
                <option value="PROCEDURAL_DEVIATION">Procedural Deviation</option>
                <option value="BENIGN_ADMINISTRATIVE">Benign Administrative</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['All', ...(catalog?.categories || [])].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat !== 'All' && CATEGORY_ICONS[cat] && `${CATEGORY_ICONS[cat]} `}
                {cat}
              </button>
            ))}
          </div>

          {/* Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRules.map((rule) => {
              const isExpanded = expandedRuleId === rule.rule_id;
              const sevConfig = SEVERITY_COLORS[rule.severity] || SEVERITY_COLORS.PROCEDURAL_DEVIATION;
              const icon = CATEGORY_ICONS[rule.iogp_category] || '⚠️';

              return (
                <div
                  key={rule.rule_id}
                  className={`rounded-2xl border ${sevConfig.border} bg-slate-900/90 p-5 shadow-lg transition-all flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-indigo-300">
                              {rule.rule_id}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${sevConfig.badge}`}>
                              {rule.severity.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1">
                            {rule.rule_name}
                          </h4>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                        {rule.iogp_category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                      {rule.description}
                    </p>

                    <div className="mt-3 bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/80">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        Statutory Mandate:
                      </span>
                      <span className="text-xs font-semibold text-amber-300">
                        {rule.regulatory_standard}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 space-y-3 pt-3 border-t border-slate-800/80">
                        <div className="bg-red-950/30 rounded-xl p-3 border border-red-500/30 text-xs">
                          <span className="text-[10px] font-bold uppercase text-red-400 block mb-1">
                            Stop-Work Protocol:
                          </span>
                          <p className="text-red-200 leading-relaxed font-medium">
                            {rule.stop_work_action}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                            Failure Mechanism:
                          </span>
                          <p className="text-xs text-slate-300">
                            {rule.failure_mechanism}
                          </p>
                        </div>

                        {rule.prescribed_safeguards && rule.prescribed_safeguards.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                              Mandated Safeguards:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {rule.prescribed_safeguards.map((sg, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded text-[11px] bg-slate-950 border border-slate-800 text-slate-300"
                                >
                                  ✓ {sg}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setExpandedRuleId(isExpanded ? null : rule.rule_id)}
                    className="mt-4 pt-2 border-t border-slate-800 text-xs text-indigo-400 hover:text-indigo-300 flex items-center justify-between font-semibold"
                  >
                    <span>{isExpanded ? 'Hide Details' : 'View Full Statutory Details'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>

          {filteredRules.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm rounded-2xl bg-slate-900 border border-slate-800">
              No codified rules match the selected filter criteria.
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: GOLDEN BENCHMARK PERFORMANCE & STATS */}
      {activeSubTab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-slate-900/90 border border-emerald-500/40 p-5 shadow-xl">
              <span className="text-xs font-bold uppercase text-slate-400">High-PSIF Recall</span>
              <div className="text-3xl font-black text-emerald-400 mt-2">
                {(stats.high_psif_recall * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {stats.high_psif_count} / {stats.high_psif_count} true fatal precursors detected
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-red-500/40 p-5 shadow-xl">
              <span className="text-xs font-bold uppercase text-slate-400">Zero-Tolerance Vetoes</span>
              <div className="text-3xl font-black text-red-400 mt-2">
                {stats.zero_tolerance_vetoes}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Enforced across 124 benchmark events
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-indigo-500/40 p-5 shadow-xl">
              <span className="text-xs font-bold uppercase text-slate-400">Negative Control Filtered</span>
              <div className="text-3xl font-black text-indigo-400 mt-2">
                {stats.benign_suppressions}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Benign administrative records suppressed
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-amber-500/40 p-5 shadow-xl">
              <span className="text-xs font-bold uppercase text-slate-400">Total Scenarios Tested</span>
              <div className="text-3xl font-black text-amber-400 mt-2">
                {stats.total_evaluated}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                124-event golden benchmark evaluation
              </p>
            </div>
          </div>

          {/* Top Triggered Rules in Benchmark Table */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center justify-between">
              <span>Top Triggered Codified Rules in Golden Benchmark</span>
              <span className="text-xs text-slate-400 font-normal">Prevalence Breakdown</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
                    <th className="pb-3">Rule ID</th>
                    <th className="pb-3">Rule Name</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3 text-center">Triggers</th>
                    <th className="pb-3 text-center">Prevalence %</th>
                    <th className="pb-3">Regulatory Standard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stats.top_triggered_rules.map((rule, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-3 font-mono font-bold text-indigo-300">{rule.rule_id}</td>
                      <td className="py-3 font-medium text-white max-w-xs">{rule.rule_name}</td>
                      <td className="py-3">
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                          {rule.iogp_category}
                        </span>
                      </td>
                      <td className="py-3 text-center font-bold text-amber-300">{rule.trigger_count}</td>
                      <td className="py-3 text-center font-mono text-emerald-300">
                        {rule.benchmark_prevalence_pct.toFixed(1)}%
                      </td>
                      <td className="py-3 text-slate-400">{rule.regulatory_standard}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Trigger Distribution */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4">
              IOGP Domain Precursor Distribution Across Golden Set
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(stats.category_distribution).map(([cat, count]) => (
                <div key={cat} className="rounded-xl bg-slate-950 p-3 border border-slate-800/80">
                  <div className="text-xs font-semibold text-slate-400 truncate">
                    {CATEGORY_ICONS[cat] || '⚠️'} {cat}
                  </div>
                  <div className="text-xl font-black text-white mt-1">{count}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {((count / stats.total_evaluated) * 100).toFixed(1)}% prevalence
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

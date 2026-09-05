import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Layers,
  Sparkles,
  BarChart3,
  Sliders,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
  Thermometer,
  Percent,
  Search,
  Activity
} from 'lucide-react';
import { api } from '../services/api';
import {
  SequencePredictResponseData,
  TokenAttributionResponseData,
  TokenAttributionItemData,
  EnsembleArbitrationResponseData,
  FourWayBenchmarkResponseData,
  ModelStatusResponseData
} from '../types';

interface PresetScenario {
  title: string;
  facility: string;
  activity: string;
  narrative: string;
}

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    title: 'EPS-1 Confined Separator Entry (Asphyxiation Risk)',
    facility: 'Early Production System EPS-1',
    activity: 'Vessel Cleanout',
    narrative:
      'Contractor entered separator vessel at Early Production System EPS-1 to clear sludge. ' +
      'Gas testing was omitted, the entry permit had expired, and no standby attendant was positioned ' +
      'outside the manway, exposing workers to lethal h2s gas pocket with potential fatal asphyxiation.'
  },
  {
    title: 'Rig OIL-45 Casing Hoist (Line-of-Fire / 3500 psi Kick)',
    facility: 'Drilling Rig OIL-45',
    activity: 'Casing Makeup',
    narrative:
      'On Drilling Rig OIL-45, high pressure gas kick of 3500 psi surged through choke line while running casing. ' +
      'Whip check was unlatched and banksman was absent. Workers positioned directly in line of fire under suspended ' +
      'load narrowly escaped crush fatality.'
  },
  {
    title: 'Moran OCS-4 Hot Work Flange (Vapor Flash Fire)',
    facility: 'Oil Collecting Station OCS-4 Moran',
    activity: 'Hot Work & Welding',
    narrative:
      'Maintenance team conducted torch welding at Moran OCS-4 near crude oil storage tank. ' +
      'Double block and bleed isolation was not applied, single gate valve was passing crude vapor, ' +
      'and sparks from grinding near 415v switchgear resulted in flash fire fatality risk.'
  },
  {
    title: 'WIS-Moran Line Hydrotesting (High Pressure Burst)',
    facility: 'Water Injection Station WIS-Moran',
    activity: 'Hydrotesting Gathering Line',
    narrative:
      'During hydrotesting of gathering line at WIS-Moran at 5000 psi, pressure safety valve was gagged ' +
      'and discharge hose lacked whip check. Uncontrolled pressure release struck operator causing traumatic amputation.'
  },
  {
    title: 'Routine Inspection (Safe Negative Control)',
    facility: 'Central Tank Farm CTF-Duliajan',
    activity: 'Routine Visual Walkthrough',
    narrative:
      'Monthly routine visual inspection completed at Central Tank Farm CTF-Duliajan. ' +
      'All pressure gauges inspected within calibration limits, fire extinguishers verified in green zone, ' +
      'and housekeeping maintained with zero safety deviations.'
  }
];

export const ModelStudioView: React.FC = () => {
  const [narrativeInput, setNarrativeInput] = useState(PRESET_SCENARIOS[0].narrative);
  const [activityInput, setActivityInput] = useState(PRESET_SCENARIOS[0].activity);
  const [siteInput, setSiteInput] = useState(PRESET_SCENARIOS[0].facility);

  const [predictResult, setPredictResult] = useState<SequencePredictResponseData | null>(null);
  const [attributionResult, setAttributionResult] = useState<TokenAttributionResponseData | null>(null);
  const [ensembleResult, setEnsembleResult] = useState<EnsembleArbitrationResponseData | null>(null);
  const [benchmarkReport, setBenchmarkReport] = useState<FourWayBenchmarkResponseData | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatusResponseData | null>(null);

  const [loading, setLoading] = useState(false);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ATTRIBUTION' | 'ARBITRATION' | 'BENCHMARK'>('ATTRIBUTION');
  const [selectedToken, setSelectedToken] = useState<TokenAttributionItemData | null>(null);

  useEffect(() => {
    loadModelStatus();
    handleAnalyze();
  }, []);

  const loadModelStatus = async () => {
    try {
      const status = await api.getModelStatus();
      setModelStatus(status);
    } catch (e) {
      console.error('Failed to load model status', e);
    }
  };

  const handleAnalyze = async (customNarrative?: string, customAct?: string, customSite?: string) => {
    const text = customNarrative || narrativeInput;
    if (!text || !text.trim()) return;

    setLoading(true);
    try {
      const [pred, attr, ens] = await Promise.all([
        api.predictSequence(text, customAct || activityInput, customSite || siteInput),
        api.explainTokenAttribution(text),
        api.arbitrateEnsemble(text, customAct || activityInput, customSite || siteInput)
      ]);
      setPredictResult(pred);
      setAttributionResult(attr);
      setEnsembleResult(ens);
      setSelectedToken(null);
    } catch (e) {
      console.error('Analysis failed', e);
    } finally {
      setLoading(false);
    }
  };

  const loadBenchmark = async () => {
    setBenchmarkLoading(true);
    try {
      const bench = await api.getFourWayBenchmark();
      setBenchmarkReport(bench);
    } catch (e) {
      console.error('Failed to load 4-way benchmark', e);
    } finally {
      setBenchmarkLoading(false);
    }
  };

  const handleSelectPreset = (preset: PresetScenario) => {
    setNarrativeInput(preset.narrative);
    setActivityInput(preset.activity);
    setSiteInput(preset.facility);
    handleAnalyze(preset.narrative, preset.activity, preset.facility);
  };

  // Render Token Saliency Heatmap
  const renderAttributionHeatmap = () => {
    if (!attributionResult) return null;
    const { narrative, tokens } = attributionResult;

    if (!tokens.length) {
      return <div className="text-slate-700 dark:text-slate-300 p-4">{narrative}</div>;
    }

    return (
      <div className="text-slate-800 dark:text-slate-200 text-base leading-loose p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner min-h-[140px] flex flex-wrap gap-1.5 items-center">
        {tokens.map((t, idx) => {
          const isSelected = selectedToken?.start_char === t.start_char && selectedToken?.end_char === t.end_char;
          const isAmplifier = t.role === 'RISK_AMPLIFIER';
          const isMitigator = t.role === 'SAFETY_MITIGATOR';

          return (
            <span
              key={idx}
              onClick={() => setSelectedToken(t)}
              className={`cursor-pointer px-2 py-0.5 rounded-md text-sm font-medium transition-all duration-150 inline-flex items-center gap-1 ${
                isAmplifier
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-700 font-semibold'
                  : isMitigator
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              } ${isSelected ? 'ring-2 ring-indigo-500 scale-105 shadow-md' : 'hover:opacity-80'}`}
              title={`${t.token}: Saliency ${t.saliency_score > 0 ? '+' : ''}${t.saliency_score} [${t.start_char}:${t.end_char}]`}
            >
              <span>{t.token}</span>
              {isAmplifier && (
                <span className="text-[10px] bg-rose-200 dark:bg-rose-900/80 text-rose-800 dark:text-rose-300 px-1 py-0.2 rounded font-bold">
                  +{Math.round(t.saliency_score * 100)}%
                </span>
              )}
              {isMitigator && (
                <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 px-1 py-0.2 rounded font-bold">
                  {Math.round(t.saliency_score * 100)}%
                </span>
              )}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-semibold rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-300" />
              Phase 5 Architecture
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Model: {modelStatus?.model_version || 'ContextualSeq_OIL_v1.0'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-indigo-400" />
            Sequence Modeling & Model Studio
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-3xl">
            Multi-task contextual sequence classifier with temperature-scaled confidence calibration, token-level attribution heatmaps, and tri-model ensemble arbitration.
          </p>
        </div>

        {modelStatus && (
          <div className="flex items-center gap-4 bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl backdrop-blur-sm shrink-0">
            <div className="text-center px-2">
              <div className="text-xs text-slate-400 font-medium">Temperature (T)</div>
              <div className="text-xl font-bold text-indigo-400">{modelStatus.temperature}</div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-center px-2">
              <div className="text-xs text-slate-400 font-medium">Vocabulary</div>
              <div className="text-xl font-bold text-emerald-400">{modelStatus.vocabulary_size}</div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-center px-2">
              <div className="text-xs text-slate-400 font-medium">IOGP Rules</div>
              <div className="text-xl font-bold text-amber-400">{modelStatus.supported_rules.length}</div>
            </div>
          </div>
        )}
      </div>

      {/* Preset Scenarios Strip */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span>OIL Operational Scenarios</span>
          <span>Click to evaluate with Model Studio</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {PRESET_SCENARIOS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(p)}
              className="text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all text-xs group"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1">
                {p.title}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span className="truncate">{p.facility}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Narrative Input & Analyze Action */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              Operational Activity
            </label>
            <input
              type="text"
              value={activityInput}
              onChange={e => setActivityInput(e.target.value)}
              placeholder="e.g. Vessel Cleanout, Casing Hoisting"
              className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              Installation / Asset
            </label>
            <input
              type="text"
              value={siteInput}
              onChange={e => setSiteInput(e.target.value)}
              placeholder="e.g. Early Production System EPS-1, Rig OIL-45"
              className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
            Raw Narrative Text
          </label>
          <textarea
            rows={3}
            value={narrativeInput}
            onChange={e => setNarrativeInput(e.target.value)}
            placeholder="Type or paste unstructured safety incident report..."
            className="w-full text-sm p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {narrativeInput.length} characters | {narrativeInput.split(/\s+/).filter(Boolean).length} words
          </div>
          <button
            onClick={() => handleAnalyze()}
            disabled={loading || !narrativeInput.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
            Execute Model Studio Inference
          </button>
        </div>
      </div>

      {/* Studio Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('ATTRIBUTION')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'ATTRIBUTION'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Token Attribution Heatmap & Saliency
        </button>

        <button
          onClick={() => setActiveTab('ARBITRATION')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'ARBITRATION'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          Tri-Model Ensemble Arbitration Matrix
        </button>

        <button
          onClick={() => {
            setActiveTab('BENCHMARK');
            if (!benchmarkReport) loadBenchmark();
          }}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'BENCHMARK'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          4-Way Benchmark Dashboard (124 Scenarios)
        </button>
      </div>

      {/* TAB 1: ATTRIBUTION HEATMAP */}
      {activeTab === 'ATTRIBUTION' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Click on any word chip below to inspect exact token contribution weight and character boundaries.</span>
              {attributionResult && (
                <span className="font-mono">
                  Saliency Balance: <strong>{attributionResult.saliency_balance > 0 ? '+' : ''}{attributionResult.saliency_balance}</strong>
                  ({attributionResult.saliency_balance > 0 ? 'Risk Dominated' : 'Safety Dominated'})
                </span>
              )}
            </div>
            {renderAttributionHeatmap()}
          </div>

          {/* Selected Token Details */}
          {selectedToken && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wider ${
                    selectedToken.role === 'RISK_AMPLIFIER'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                      : selectedToken.role === 'SAFETY_MITIGATOR'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {selectedToken.role.replace('_', ' ')}
                  </span>
                  <span className="text-base font-semibold text-slate-900 dark:text-white">
                    "{selectedToken.token}"
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-3">
                  <span>Saliency: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{selectedToken.saliency_score > 0 ? '+' : ''}{selectedToken.saliency_score}</strong></span>
                  <span>Offsets: <strong className="font-mono text-slate-700 dark:text-slate-300">[{selectedToken.start_char}:{selectedToken.end_char}]</strong></span>
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg">
                {selectedToken.rationale}
              </div>
            </div>
          )}

          {/* Top Amplifiers and Mitigators */}
          {attributionResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Risk Amplifiers */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-rose-200 dark:border-rose-900/40 space-y-3">
                <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  Top Risk Amplifiers (Drivers of High PSIF)
                </h3>
                <div className="space-y-2">
                  {attributionResult.top_risk_amplifiers.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-xs border border-rose-100 dark:border-rose-900/20"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-300 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          "{item.token}"
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-rose-700 dark:text-rose-300 font-bold">
                        <span>+{Math.round(item.score * 100)}%</span>
                        <span className="text-slate-400 text-[10px]">[{item.offsets[0]}:{item.offsets[1]}]</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Mitigators */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 space-y-3">
                <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Top Safety Mitigators & Controls
                </h3>
                <div className="space-y-2">
                  {attributionResult.top_mitigators.length === 0 ? (
                    <div className="text-xs text-slate-400 italic p-3">No strong mitigating tokens detected in this narrative.</div>
                  ) : (
                    attributionResult.top_mitigators.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-xs border border-emerald-100 dark:border-emerald-900/20"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            "{item.token}"
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                          <span>{Math.round(item.score * 100)}%</span>
                          <span className="text-slate-400 text-[10px]">[{item.offsets[0]}:{item.offsets[1]}]</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ARBITRATION MATRIX */}
      {activeTab === 'ARBITRATION' && ensembleResult && (
        <div className="space-y-6">
          {/* Final Arbitration Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl border border-indigo-900 text-white shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider ${
                  ensembleResult.final_priority === 'HIGH'
                    ? 'bg-rose-500 text-white shadow-md'
                    : ensembleResult.final_priority === 'REVIEW'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-emerald-500 text-slate-950 shadow-md'
                }`}>
                  Final Decision: {ensembleResult.final_priority} PSIF
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  Confidence: <strong>{Math.round(ensembleResult.confidence_score * 100)}%</strong>
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Latency: {ensembleResult.latency_ms} ms
              </div>
            </div>

            {ensembleResult.safety_override && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Deterministic Safety Guardrail Veto Active:</strong> {ensembleResult.override_reason}
                </span>
              </div>
            )}

            <div className="text-sm text-slate-200 bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/60 font-mono">
              {ensembleResult.arbitration_summary}
            </div>
          </div>

          {/* 3-Way Model Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Deterministic Safety Rules */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  1. Deterministic Rule Engine
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                  ensembleResult.rule_engine_decision.priority === 'HIGH'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {ensembleResult.rule_engine_decision.priority}
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div>Safety Rule: <strong>{ensembleResult.rule_engine_decision.triggered_rules.length > 0 ? ensembleResult.rule_engine_decision.triggered_rules[0] : 'None Triggered'}</strong></div>
                <div>Guardrail Veto: <strong>{ensembleResult.rule_engine_decision.priority === 'HIGH' ? 'ACTIVE' : 'INACTIVE'}</strong></div>
              </div>
            </div>

            {/* Card 2: Statistical TF-IDF Baseline */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  2. Statistical TF-IDF Baseline
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                  ensembleResult.tfidf_decision.priority === 'HIGH'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {ensembleResult.tfidf_decision.priority}
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                {Object.entries(ensembleResult.tfidf_decision.probabilities).map(([cat, prob]) => (
                  <div key={cat} className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>{cat}:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{Math.round(prob * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: Contextual Sequence Classifier */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  3. Contextual Sequence Model
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                  ensembleResult.contextual_decision.priority === 'HIGH'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {ensembleResult.contextual_decision.priority}
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                {Object.entries(ensembleResult.contextual_decision.calibrated_probabilities).map(([cat, prob]) => (
                  <div key={cat} className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>{cat}:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{Math.round(prob * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Assigned IOGP Life-Saving Rules */}
          {ensembleResult.final_iogp_rules.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Assigned IOGP Life-Saving Rules (Ensemble Multi-Label)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {ensembleResult.final_iogp_rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1 text-xs"
                  >
                    <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>{rule.rule_name}</span>
                      {rule.is_primary && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-bold">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 flex items-center justify-between text-[11px]">
                      <span>Source: {rule.source.replace('_', ' ')}</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {Math.round(rule.probability * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BENCHMARK DASHBOARD */}
      {activeTab === 'BENCHMARK' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                4-Way Model Benchmark Evaluation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated against all 124 expert-adjudicated scenarios in the Golden Evaluation Dataset.
              </p>
            </div>
            <button
              onClick={loadBenchmark}
              disabled={benchmarkLoading}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${benchmarkLoading ? 'animate-spin' : ''}`} />
              Re-run Benchmark Evaluation
            </button>
          </div>

          {benchmarkReport && (
            <div className="space-y-6">
              {/* Comparative Table */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Comparative Performance Metrics
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3">Model Architecture</th>
                        <th className="p-3 text-center">High-PSIF Recall</th>
                        <th className="p-3 text-center">High-PSIF Precision</th>
                        <th className="p-3 text-center">High-PSIF F1</th>
                        <th className="p-3 text-center">Overall Accuracy</th>
                        <th className="p-3 text-center">IOGP Match</th>
                        <th className="p-3 text-center">Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {[
                        benchmarkReport.deterministic_rule_engine,
                        benchmarkReport.tfidf_baseline,
                        benchmarkReport.contextual_sequence_classifier,
                        benchmarkReport.tri_model_ensemble
                      ].map((item, idx) => {
                        const isEnsemble = item.model_name.includes('Ensemble');
                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                              isEnsemble ? 'bg-indigo-50/40 dark:bg-indigo-950/20 font-bold' : ''
                            }`}
                          >
                            <td className="p-3 text-slate-900 dark:text-white flex items-center gap-2">
                              {isEnsemble && <Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
                              <span>{item.model_name}</span>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {Math.round(item.high_psif_recall * 100)}%
                            </td>
                            <td className="p-3 text-center font-mono">
                              {Math.round(item.high_psif_precision * 100)}%
                            </td>
                            <td className="p-3 text-center font-mono">
                              {item.high_psif_f1.toFixed(3)}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {Math.round(item.overall_accuracy * 100)}%
                            </td>
                            <td className="p-3 text-center font-mono">
                              {Math.round(item.iogp_rule_match_rate * 100)}%
                            </td>
                            <td className="p-3 text-center font-mono text-slate-500">
                              {item.average_latency_ms} ms
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Key Findings */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Key Benchmark Findings & Safety Insights
                </h3>
                <div className="space-y-2">
                  {benchmarkReport.key_findings.map((finding, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                      <span>{finding}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

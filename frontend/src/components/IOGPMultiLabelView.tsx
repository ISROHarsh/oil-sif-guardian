import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  Zap,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Eye,
  Crosshair,
  Maximize2,
  Layers,
  FileText,
  Clock,
  Sparkles,
  Search,
  Filter,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import {
  IOGPMultiLabelResponseData,
  IOGPMatrixResponseData,
  IOGPEvaluationReportResponseData,
  IOGPStatusResponseData
} from '../types';

const SAMPLE_NARRATIVES = [
  {
    title: 'Confined Space + Work Auth (Separator Entry)',
    narrative: 'Fitter entered the interior of test separator vessel through open manway to clean heavy sludge without atmospheric gas test or standby attendant. The PTW was expired and entry log was blank.'
  },
  {
    title: 'Energy Isolation + Line of Fire (Wellhead Unbolting)',
    narrative: 'Maintenance crew unbolted wellhead casing wing valve with 1200 psi shut-in casing pressure. Stored energy blew flange open, projecting heavy studs directly across the rig cellar floor.'
  },
  {
    title: 'Safe Lifting + Line of Fire (Drop Zone Rigging)',
    narrative: 'A 50-ton hydraulic mobile crane set outriggers directly on soft mud without mats. While hoisting 8-ton casing joint, synthetic sling parted and load plummeted into active worker transit corridor.'
  },
  {
    title: 'Height + Lifting (Crane Man-Riding Defect)',
    narrative: 'NDT inspector hoisted in a custom fabricated steel box suspended from crane hook at 18 meters. The crane was not certified for man-riding and lacked anti-two-block limit switch.'
  },
  {
    title: 'Negative Control (Routine Office Paper Jam)',
    narrative: 'Accounts clerk cleared paper jam in office laser printer on second floor administrative block. Used ballpoint pen to unstick roller. No injury reported.'
  }
];

const RULE_ICONS: Record<string, string> = {
  'Bypassing Safety Controls': '⚙️',
  'Confined Space': '🕳️',
  'Driving': '🚚',
  'Energy Isolation': '⚡',
  'Hot Work': '🔥',
  'Line of Fire': '🎯',
  'Safe Mechanical Lifting': '🏗️',
  'Work Authorization': '📋',
  'Working at Height': '🧗'
};

export const IOGPMultiLabelView: React.FC = () => {
  const [narrativeInput, setNarrativeInput] = useState<string>(SAMPLE_NARRATIVES[0].narrative);
  const [incidentTitle, setIncidentTitle] = useState<string>(SAMPLE_NARRATIVES[0].title);
  const [thresholds, setThresholds] = useState<Record<string, number>>({});
  const [prediction, setPrediction] = useState<IOGPMultiLabelResponseData | null>(null);
  const [matrixData, setMatrixData] = useState<IOGPMatrixResponseData | null>(null);
  const [benchmarkReport, setBenchmarkReport] = useState<IOGPEvaluationReportResponseData | null>(null);
  const [statusData, setStatusData] = useState<IOGPStatusResponseData | null>(null);
  const [loadingPredict, setLoadingPredict] = useState<boolean>(false);
  const [loadingBenchmark, setLoadingBenchmark] = useState<boolean>(false);
  const [selectedCell, setSelectedCell] = useState<{ r1: string; r2: string; count: number } | null>(null);
  const [thresholdSavedNotice, setThresholdSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [status, matrix, bench] = await Promise.all([
        api.getIOGPStatus().catch(() => null),
        api.getIOGPMatrix().catch(() => null),
        api.getIOGPBenchmark().catch(() => null)
      ]);

      if (status) {
        setStatusData(status);
        setThresholds(status.current_thresholds);
      }
      if (matrix) setMatrixData(matrix);
      if (bench) setBenchmarkReport(bench);

      // Run prediction on default sample
      runInference(SAMPLE_NARRATIVES[0].narrative, SAMPLE_NARRATIVES[0].title);
    } catch (e) {
      console.error('Failed to load initial IOGP multi-label data', e);
    }
  };

  const runInference = async (text: string, title?: string, overrideThresh?: Record<string, number>) => {
    setLoadingPredict(true);
    try {
      const pred = await api.predictIOGPMultiLabel(text, title, overrideThresh || thresholds);
      setPrediction(pred);
    } catch (e) {
      console.error('Prediction failed', e);
    } finally {
      setLoadingPredict(false);
    }
  };

  const handleSelectSample = (sample: { title: string; narrative: string }) => {
    setIncidentTitle(sample.title);
    setNarrativeInput(sample.narrative);
    runInference(sample.narrative, sample.title);
  };

  const handleThresholdChange = (ruleName: string, val: number) => {
    const updated = { ...thresholds, [ruleName]: val };
    setThresholds(updated);
    if (narrativeInput) {
      runInference(narrativeInput, incidentTitle, updated);
    }
  };

  const saveThresholdsToBackend = async () => {
    try {
      const res = await api.updateIOGPThresholds(thresholds);
      setThresholdSavedNotice(res.message);
      setTimeout(() => setThresholdSavedNotice(null), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshBenchmark = async () => {
    setLoadingBenchmark(true);
    try {
      const rep = await api.getIOGPBenchmark();
      setBenchmarkReport(rep);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBenchmark(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card-industrial bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border-slate-800 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Crosshair className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white font-heading tracking-tight">
                  IOGP 9 Life-Saving Rules Multi-Label Classifier
                </h1>
                <span className="badge badge-iogp text-[10px] py-0.5 px-2 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                  Phase 6 Architecture
                </span>
                <span className="badge text-[10px] py-0.5 px-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono">
                  {statusData ? `${statusData.rules_count} Rules Locked` : '9 Rules Locked'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                Joint barrier degradation intelligence for Oil India Limited. Classifies simultaneous primary and secondary Life-Saving Rules,
                evaluates empirical 9x9 barrier co-occurrences, and applies calibrated dynamic thresholding.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={saveThresholdsToBackend}
              className="btn btn-secondary text-xs flex items-center gap-1.5 px-3 py-2 border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/40"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Persist Thresholds</span>
            </button>
            <button
              onClick={refreshBenchmark}
              disabled={loadingBenchmark}
              className="btn btn-primary text-xs flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingBenchmark ? 'animate-spin' : ''}`} />
              <span>Run Golden Benchmark</span>
            </button>
          </div>
        </div>

        {thresholdSavedNotice && (
          <div className="mt-3 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 rounded px-3 py-1.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{thresholdSavedNotice}</span>
          </div>
        )}
      </div>

      {/* Preset Scenarios Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1.5 pl-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Test Narratives:
        </span>
        {SAMPLE_NARRATIVES.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectSample(s)}
            className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap transition flex items-center gap-1.5 ${
              incidentTitle === s.title
                ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-200 font-semibold'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>{idx + 1}.</span>
            <span>{s.title}</span>
          </button>
        ))}
      </div>

      {/* Interactive Inference Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Narrative & Prediction Summary */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card-industrial p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                Raw Incident Narrative
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {narrativeInput.length} chars
              </span>
            </div>

            <textarea
              rows={5}
              value={narrativeInput}
              onChange={(e) => setNarrativeInput(e.target.value)}
              placeholder="Enter incident or near-miss report narrative..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed resize-y"
            />

            <button
              onClick={() => runInference(narrativeInput, incidentTitle)}
              disabled={loadingPredict || narrativeInput.trim().length < 5}
              className="w-full btn btn-primary py-2.5 text-xs font-semibold flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500"
            >
              {loadingPredict ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Multi-Label Rules...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>Execute Multi-Label IOGP Inference</span>
                </>
              )}
            </button>
          </div>

          {/* Inference Decision Output */}
          {prediction && (
            <div className="card-industrial p-5 space-y-4 border-indigo-500/20 bg-gradient-to-b from-slate-900 to-slate-950">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Multi-Label Decision Card
                </span>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {prediction.latency_ms} ms latency
                </span>
              </div>

              {/* Primary Rule */}
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block mb-1.5">
                  Designated Primary Rule
                </span>
                <div className="p-3 rounded-lg border bg-amber-500/10 border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{RULE_ICONS[prediction.primary_rule] || '🛡️'}</span>
                    <div>
                      <div className="text-sm font-bold text-amber-300 font-heading">
                        {prediction.primary_rule}
                      </div>
                      <div className="text-[11px] text-amber-400/80 font-mono">
                        {prediction.primary_rule === 'None'
                          ? 'Zero industrial Life-Saving Rules breached (Administrative Control)'
                          : `Dominant Precursor Driver (P = ${((prediction.rule_scores[prediction.primary_rule]?.probability || 0) * 100).toFixed(1)}%)`}
                      </div>
                    </div>
                  </div>
                  {prediction.primary_rule !== 'None' && (
                    <span className="badge badge-high text-[10px]">PRIMARY</span>
                  )}
                </div>
              </div>

              {/* Secondary Rules */}
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block mb-1.5">
                  Co-Occurring Secondary Rules ({prediction.secondary_rules.length})
                </span>
                {prediction.secondary_rules.length === 0 ? (
                  <div className="text-xs text-slate-500 italic p-2 rounded bg-slate-950/60 border border-slate-800">
                    No secondary rules exceeded decision thresholds.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {prediction.secondary_rules.map((ruleName) => {
                      const score = prediction.rule_scores[ruleName];
                      return (
                        <div
                          key={ruleName}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/40 text-indigo-200 text-xs flex items-center gap-2 font-mono"
                        >
                          <span>{RULE_ICONS[ruleName] || '🔹'}</span>
                          <span className="font-semibold">{ruleName}</span>
                          <span className="text-[10px] text-indigo-400">
                            {(score.probability * 100).toFixed(0)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Co-Occurrence Tags */}
              {prediction.co_occurrence_tags.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block mb-1.5 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Empirical Barrier Coupling
                  </span>
                  <div className="space-y-1.5">
                    {prediction.co_occurrence_tags.map((tag, i) => (
                      <div
                        key={i}
                        className="text-xs p-2 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between text-slate-300"
                      >
                        <span>
                          {tag.rule_a} <span className="text-slate-500">↔</span> {tag.rule_b}
                        </span>
                        <span className="badge text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">
                          {tag.historical_co_occurrences} Historical Pairs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: 9-Rule Grid with Threshold Sliders */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-industrial p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-400" />
                9 IOGP Life-Saving Rules Activation & Calibration Grid
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Triggered: {prediction ? prediction.triggered_rules.length : 0} / 9
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {statusData?.canonical_rules.map((ruleName) => {
                const score = prediction?.rule_scores[ruleName];
                const prob = score ? score.probability : 0.0;
                const tau = thresholds[ruleName] ?? 0.40;
                const isTriggered = score ? score.is_triggered : false;
                const isPrimary = prediction?.primary_rule === ruleName;

                return (
                  <div
                    key={ruleName}
                    className={`p-3 rounded-xl border transition-all ${
                      isPrimary
                        ? 'bg-amber-950/20 border-amber-500/50 shadow-glow-amber'
                        : isTriggered
                        ? 'bg-indigo-950/20 border-indigo-500/50'
                        : 'bg-slate-950/60 border-slate-800/80 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{RULE_ICONS[ruleName] || '🛡️'}</span>
                        <span className="text-xs font-bold text-white tracking-tight leading-tight">
                          {ruleName}
                        </span>
                      </div>
                      {isPrimary ? (
                        <span className="badge badge-high text-[9px] py-0 px-1.5">PRIMARY</span>
                      ) : isTriggered ? (
                        <span className="badge text-[9px] py-0 px-1.5 bg-indigo-500/30 text-indigo-300">SECONDARY</span>
                      ) : (
                        <span className="text-[9px] font-mono text-slate-500">OFF</span>
                      )}
                    </div>

                    {/* Probability Bar */}
                    <div className="space-y-1 mb-2.5">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Activation</span>
                        <span className={isTriggered ? 'text-indigo-300 font-bold' : 'text-slate-500'}>
                          {(prob * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isPrimary
                              ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                              : isTriggered
                              ? 'bg-gradient-to-r from-indigo-500 to-indigo-400'
                              : 'bg-slate-700'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(2, prob * 100))}%` }}
                        />
                        {/* Threshold cut-off marker */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm"
                          style={{ left: `${tau * 100}%` }}
                          title={`Threshold tau = ${tau}`}
                        />
                      </div>
                    </div>

                    {/* Interactive Threshold Slider */}
                    <div className="space-y-1 pt-1 border-t border-slate-800/60">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Threshold (τ)</span>
                        <span className="text-indigo-400">{tau.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.10"
                        max="0.85"
                        step="0.01"
                        value={tau}
                        onChange={(e) => handleThresholdChange(ruleName, parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    {/* Evidence Snippets */}
                    {score && score.evidence_spans.length > 0 && (
                      <div className="mt-2 pt-1 border-t border-slate-800/60 flex flex-wrap gap-1">
                        {score.evidence_spans.slice(0, 2).map((sp, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-slate-300 font-mono truncate max-w-full"
                          >
                            "{sp}"
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 9x9 Empirical Co-Occurrence Heatmap & Golden Benchmark Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 9x9 Co-Occurrence Matrix Heatmap */}
        <div className="lg:col-span-7 card-industrial p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                9x9 Empirical IOGP Barrier Co-Occurrence Matrix
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Evaluates joint frequency of simultaneous control compromises across OIL golden benchmark reports.
              </p>
            </div>
            <span className="badge text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              Golden Corpus Empirical Matrix
            </span>
          </div>

          {matrixData && (
            <div className="overflow-x-auto pb-2">
              <table className="w-full text-center text-[10px] font-mono border-collapse">
                <thead>
                  <tr>
                    <th className="p-1 text-left text-slate-500 text-[9px]">Rule</th>
                    {matrixData.rules.map((r, i) => (
                      <th key={i} className="p-1 text-slate-400 font-semibold" title={r}>
                        {RULE_ICONS[r] || r.slice(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixData.matrix.map((row, i) => {
                    const r1Name = matrixData.rules[i];
                    return (
                      <tr key={i} className="border-t border-slate-800/40 hover:bg-slate-800/30 transition">
                        <td className="p-1.5 text-left text-slate-300 font-semibold truncate max-w-[130px] flex items-center gap-1">
                          <span>{RULE_ICONS[r1Name]}</span>
                          <span className="truncate">{r1Name}</span>
                        </td>
                        {row.map((count, j) => {
                          const r2Name = matrixData.rules[j];
                          const isDiagonal = i === j;
                          const intensity = Math.min(1.0, count / 15.0);

                          return (
                            <td
                              key={j}
                              onClick={() => setSelectedCell({ r1: r1Name, r2: r2Name, count })}
                              className={`p-1.5 cursor-pointer transition rounded ${
                                isDiagonal
                                  ? 'bg-slate-800/80 font-bold text-amber-400 border border-amber-500/30'
                                  : count > 0
                                  ? 'font-semibold text-slate-100 hover:scale-105'
                                  : 'text-slate-600'
                              }`}
                              style={{
                                backgroundColor: isDiagonal
                                  ? undefined
                                  : count > 0
                                  ? `rgba(79, 70, 229, ${0.15 + intensity * 0.7})`
                                  : undefined
                              }}
                              title={`${r1Name} + ${r2Name}: ${count} occurrences`}
                            >
                              {count}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {selectedCell && (
                <div className="mt-3 p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/40 text-xs text-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>
                      <strong>{selectedCell.r1}</strong> and <strong>{selectedCell.r2}</strong> co-occur in{' '}
                      <span className="text-amber-300 font-bold font-mono">{selectedCell.count}</span> golden evaluation incidents.
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedCell(null)}
                    className="text-xs text-slate-400 hover:text-white px-2 py-0.5"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Golden Benchmark Scorecard */}
        <div className="lg:col-span-5 card-industrial p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              124-Event Golden Benchmark Scorecard
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {benchmarkReport?.evaluated_at || 'Evaluated on Golden Dataset'}
            </span>
          </div>

          {benchmarkReport && (
            <div className="space-y-4">
              {/* 4 KPI Metrics */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">Subset Accuracy (Exact)</div>
                  <div className="text-lg font-bold text-amber-400 font-heading">
                    {(benchmarkReport.subset_accuracy * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500">Exact 9-Rule Match</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">Hamming Loss</div>
                  <div className="text-lg font-bold text-emerald-400 font-heading">
                    {benchmarkReport.hamming_loss.toFixed(4)}
                  </div>
                  <div className="text-[10px] text-slate-500">Bit error rate (&lt; 0.08)</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">Macro F1 Score</div>
                  <div className="text-lg font-bold text-indigo-400 font-heading">
                    {(benchmarkReport.macro_f1 * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500">Unweighted 9-class mean</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">Primary Rule Top-1</div>
                  <div className="text-lg font-bold text-sky-400 font-heading">
                    {(benchmarkReport.primary_rule_accuracy * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500">Dominant rule accuracy</div>
                </div>
              </div>

              {/* Per-Rule Table */}
              <div className="overflow-x-auto max-h-56 overflow-y-auto scrollbar-thin">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead className="bg-slate-950/90 sticky top-0 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="py-1 px-2">Rule</th>
                      <th className="py-1 px-1 text-right">Supp</th>
                      <th className="py-1 px-1 text-right">Prec</th>
                      <th className="py-1 px-1 text-right">Rec</th>
                      <th className="py-1 px-2 text-right">F1</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {Object.entries(benchmarkReport.per_rule_metrics).map(([rName, m]) => (
                      <tr key={rName} className="hover:bg-slate-800/30">
                        <td className="py-1 px-2 text-slate-300 truncate max-w-[120px]" title={rName}>
                          {rName}
                        </td>
                        <td className="py-1 px-1 text-right text-slate-400">{m.support}</td>
                        <td className="py-1 px-1 text-right text-slate-300">{(m.precision * 100).toFixed(0)}%</td>
                        <td className="py-1 px-1 text-right text-slate-300">{(m.recall * 100).toFixed(0)}%</td>
                        <td className="py-1 px-2 text-right font-bold text-indigo-400">{(m.f1 * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

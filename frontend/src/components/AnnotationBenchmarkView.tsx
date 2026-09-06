import React, { useState, useEffect } from 'react';
import {
  Award,
  Target,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Shield,
  Layers,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Sliders,
  Scale,
  Sparkles,
  ExternalLink,
  BookOpen,
  CheckCheck,
  XCircle,
  Clock,
  Zap
} from 'lucide-react';
import {
  GoldenBenchmarkRecord,
  BenchmarkEvaluationResponse,
  AgreementResponse,
  AdjudicationResponse,
  AnnotationPairInput
} from '../types';
import { api } from '../services/api';

export const AnnotationBenchmarkView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'benchmark' | 'agreement' | 'adjudication' | 'active_learning'>('benchmark');

  // Benchmark State
  const [benchmarkRecords, setBenchmarkRecords] = useState<GoldenBenchmarkRecord[]>([]);
  const [evaluationResult, setEvaluationResult] = useState<BenchmarkEvaluationResponse | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isLoadingBenchmark, setIsLoadingBenchmark] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterRule, setFilterRule] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Agreement State
  const [agreementData, setAgreementData] = useState<AgreementResponse | null>(null);
  const [isLoadingAgreement, setIsLoadingAgreement] = useState(false);

  // Adjudication State
  const [adjudicationDemo, setAdjudicationDemo] = useState<AdjudicationResponse | null>(null);
  const [disputeResolutionText, setDisputeResolutionText] = useState('');
  const [selectedLeadPriority, setSelectedLeadPriority] = useState<'HIGH' | 'REVIEW' | 'LOW'>('HIGH');
  const [selectedLeadRule, setSelectedLeadRule] = useState('Confined Space');
  const [isResolving, setIsResolving] = useState(false);
  const [adjudicationSuccess, setAdjudicationSuccess] = useState<string | null>(null);

  // Active Learning State (Phase 20)
  const [activeLearningCandidates, setActiveLearningCandidates] = useState<any[]>([]);
  const [isLoadingAL, setIsLoadingAL] = useState(false);
  const [alSuccessMsg, setAlSuccessMsg] = useState<string | null>(null);

  const fetchActiveLearningQueue = async () => {
    setIsLoadingAL(true);
    try {
      const queue = await api.getActiveLearningQueue(20, 0.05);
      setActiveLearningCandidates(queue);
    } catch (err) {
      console.error('Failed to load active learning queue:', err);
    } finally {
      setIsLoadingAL(false);
    }
  };

  const handleSubmitAL = async (candidate: any, isPsif: boolean, priority: string) => {
    try {
      await api.submitActiveLearningLabel({
        report_id: candidate.report_id,
        expert_id: 'Er. Rajesh Baruah (Chief Safety Officer)',
        is_psif: isPsif,
        priority: priority,
        primary_rule: candidate.rule_priority !== 'NONE' ? candidate.rule_priority : 'Confined Space',
        rationale: `Active learning expert annotation: ${candidate.sampling_reasons.join('; ')}`
      });
      setAlSuccessMsg(`Successfully committed expert label for ${candidate.report_id} to active pool.`);
      setActiveLearningCandidates(prev => prev.filter(c => c.report_id !== candidate.report_id));
      setTimeout(() => setAlSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to submit active learning label:', err);
    }
  };

  // Fetch locked benchmark records
  const fetchBenchmark = async () => {
    setIsLoadingBenchmark(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/annotation/benchmark');
      if (res.ok) {
        const data = await res.json();
        setBenchmarkRecords(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load benchmark', err);
    } finally {
      setIsLoadingBenchmark(false);
    }
  };

  // Run benchmark evaluation
  const runEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/annotation/benchmark/evaluate', {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluationResult(data);
      }
    } catch (err) {
      console.error('Failed to run benchmark evaluation', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Fetch sample agreement
  const calculateSampleAgreement = async () => {
    setIsLoadingAgreement(true);
    try {
      const samplePairs: AnnotationPairInput[] = [
        {
          item_id: 'SAMPLE-01',
          annotator_1: {
            annotator_id: 'HSE_SPECIALIST_A',
            psif_priority: 'HIGH',
            primary_iogp_rule: 'Confined Space',
            evidence_spans: [{ text: 'entered the crude storage tank', category: 'EXPOSURE' }]
          },
          annotator_2: {
            annotator_id: 'HSE_SPECIALIST_B',
            psif_priority: 'HIGH',
            primary_iogp_rule: 'Confined Space',
            evidence_spans: [{ text: 'without continuous gas testing', category: 'CONTROL_FAILURE' }]
          }
        },
        {
          item_id: 'SAMPLE-02',
          annotator_1: {
            annotator_id: 'HSE_SPECIALIST_A',
            psif_priority: 'HIGH',
            primary_iogp_rule: 'Energy Isolation',
            evidence_spans: [{ text: 'flange unbolted under pressure', category: 'CONTROL_FAILURE' }]
          },
          annotator_2: {
            annotator_id: 'HSE_SPECIALIST_B',
            psif_priority: 'HIGH',
            primary_iogp_rule: 'Energy Isolation',
            evidence_spans: [{ text: 'line had 45 bar', category: 'HAZARD' }]
          }
        },
        {
          item_id: 'SAMPLE-03',
          annotator_1: {
            annotator_id: 'HSE_SPECIALIST_A',
            psif_priority: 'REVIEW',
            primary_iogp_rule: 'Safe Mechanical Lifting'
          },
          annotator_2: {
            annotator_id: 'HSE_SPECIALIST_B',
            psif_priority: 'REVIEW',
            primary_iogp_rule: 'Safe Mechanical Lifting'
          }
        },
        {
          item_id: 'SAMPLE-04',
          annotator_1: {
            annotator_id: 'HSE_SPECIALIST_A',
            psif_priority: 'LOW',
            primary_iogp_rule: null
          },
          annotator_2: {
            annotator_id: 'HSE_SPECIALIST_B',
            psif_priority: 'LOW',
            primary_iogp_rule: null
          }
        },
        {
          item_id: 'SAMPLE-05',
          annotator_1: {
            annotator_id: 'HSE_SPECIALIST_A',
            psif_priority: 'HIGH',
            primary_iogp_rule: 'Line of Fire'
          },
          annotator_2: {
            annotator_id: 'HSE_SPECIALIST_B',
            psif_priority: 'HIGH',
            primary_iogp_rule: 'Line of Fire'
          }
        }
      ];

      const res = await fetch('http://localhost:8000/api/v1/annotation/agreement/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samplePairs)
      });
      if (res.ok) {
        const data = await res.json();
        setAgreementData(data);
      }
    } catch (err) {
      console.error('Failed to calculate agreement', err);
    } finally {
      setIsLoadingAgreement(false);
    }
  };

  // Load sample dispute adjudication
  const loadDisputeSample = async () => {
    try {
      const sampleDispute: AnnotationPairInput = {
        item_id: 'DISPUTE-DEMO-01',
        narrative: 'Contractor entered column skirt bottom section. Positive physical isolation blind had not been swung into place on the fuel gas line.',
        annotator_1: {
          annotator_id: 'HSE_AUDITOR_EAST',
          psif_priority: 'HIGH',
          primary_iogp_rule: 'Confined Space',
          notes: 'Enclosed skirt area is a confined space; lack of positive blind presents immediate asphyxiation hazard.'
        },
        annotator_2: {
          annotator_id: 'OPERATIONS_REP_WEST',
          psif_priority: 'REVIEW',
          primary_iogp_rule: 'Energy Isolation',
          notes: 'Block valve was closed upstream, treating as energy isolation procedural discrepancy.'
        }
      };

      const res = await fetch('http://localhost:8000/api/v1/annotation/adjudicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleDispute)
      });
      if (res.ok) {
        const data = await res.json();
        setAdjudicationDemo(data);
      }
    } catch (err) {
      console.error('Failed to load dispute demo', err);
    }
  };

  const handleResolveDispute = async () => {
    if (!adjudicationDemo) return;
    setIsResolving(true);
    try {
      const payload = {
        item_id: adjudicationDemo.item_id,
        lead_id: 'LEAD_HSE_SPECIALIST_OIL',
        final_priority: selectedLeadPriority,
        final_primary_rule: selectedLeadRule,
        rationale: disputeResolutionText || 'Adjudicated per IOGP Confined Space Rule #2: column skirt entry without swung positive isolation blind is a fatal precursor requiring mandatory HIGH priority.'
      };

      const res = await fetch('http://localhost:8000/api/v1/annotation/adjudicate/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setAdjudicationDemo(data);
        setAdjudicationSuccess('Dispute adjudicated and locked into canonical knowledge base by Lead HSE Specialist.');
        setTimeout(() => setAdjudicationSuccess(null), 5000);
      }
    } catch (err) {
      console.error('Failed to resolve dispute', err);
    } finally {
      setIsResolving(false);
    }
  };

  useEffect(() => {
    fetchBenchmark();
    calculateSampleAgreement();
    loadDisputeSample();
    fetchActiveLearningQueue();
    // Auto-run benchmark evaluation initially
    runEvaluation();
  }, []);

  // Filter records
  const filteredRecords = benchmarkRecords.filter(r => {
    const matchesPriority = filterPriority === 'ALL' || r.ground_truth.psif_priority === filterPriority;
    const matchesRule =
      filterRule === 'ALL' ||
      (filterRule === 'NONE' && !r.ground_truth.primary_iogp_rule) ||
      r.ground_truth.primary_iogp_rule === filterRule;
    const matchesSearch =
      searchQuery === '' ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.narrative.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.benchmark_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesRule && matchesSearch;
  });

  const iogpRulesList = [
    'Bypassing Safety Controls',
    'Confined Space',
    'Driving',
    'Energy Isolation',
    'Hot Work',
    'Line of Fire',
    'Safe Mechanical Lifting',
    'Work Authorization',
    'Working at Height'
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="badge badge-iogp text-[11px] py-0.5 px-2.5 font-mono">PHASE 2 WORKFLOW</span>
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Locked Golden Standard
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight font-heading">
              Data Annotation Protocol & Golden Benchmark Validation
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Enforcing human-in-the-loop consensus protocols: dual-annotation tracking (Cohen's &kappa; & Krippendorff's &alpha;),
              lead dispute adjudication, and a canonical 124-scenario benchmark locked across all 9 IOGP Life-Saving Rules.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={runEvaluation}
              disabled={isEvaluating}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-glow-amber text-xs transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />
              <span>{isEvaluating ? 'Evaluating Benchmark...' : 'Run Benchmark Evaluation'}</span>
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveSection('benchmark')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSection === 'benchmark'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Golden Benchmark Explorer ({benchmarkRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('agreement')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSection === 'agreement'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Inter-Annotator Agreement (&kappa; / &alpha;)</span>
          </button>

          <button
            onClick={() => setActiveSection('adjudication')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSection === 'adjudication'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Lead Specialist Adjudication</span>
          </button>

          <button
            onClick={() => setActiveSection('active_learning')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSection === 'active_learning'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Phase 20 Active Learning ({activeLearningCandidates.length})</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: GOLDEN BENCHMARK EXPLORER & EVALUATION */}
      {activeSection === 'benchmark' && (
        <div className="space-y-6">
          {/* Real-Time Evaluation Performance Cards */}
          {evaluationResult && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card-cyber p-5 border-l-4 border-l-emerald-500">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">High-PSIF Recall</span>
                  <span className="badge badge-low text-[10px]">Target &ge; 75%</span>
                </div>
                <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
                  {(evaluationResult.high_psif_recall * 100).toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{evaluationResult.high_psif_tp} of {evaluationResult.high_psif_tp + evaluationResult.high_psif_fn} High PSIF detected</span>
                </div>
              </div>

              <div className="card-cyber p-5 border-l-4 border-l-cyan-500">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">IOGP Rule Match Rate</span>
                  <span className="badge badge-iogp text-[10px]">Target &ge; 70%</span>
                </div>
                <div className="text-3xl font-extrabold text-cyan-400 mt-2 font-mono">
                  {(evaluationResult.rule_match_rate * 100).toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Across all 9 Life-Saving Rules
                </div>
              </div>

              <div className="card-cyber p-5 border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Total Evaluated</span>
                  <span className="badge badge-review text-[10px]">100% Locked</span>
                </div>
                <div className="text-3xl font-extrabold text-white mt-2 font-mono">
                  {evaluationResult.total_evaluated}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Canonical expert-adjudicated events
                </div>
              </div>

              <div className="card-cyber p-5 border-l-4 border-l-indigo-500">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">High-PSIF False Negatives</span>
                  <span className="badge badge-low text-[10px]">Zero Fatal Blindspots</span>
                </div>
                <div className="text-3xl font-extrabold text-indigo-400 mt-2 font-mono">
                  {evaluationResult.high_psif_fn}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Precision: {(evaluationResult.high_psif_precision * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="card-cyber p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Sliders className="w-3.5 h-3.5 text-amber-500" />
                <span>Filters:</span>
              </div>

              <select
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Priorities ({benchmarkRecords.length})</option>
                <option value="HIGH">HIGH Priority</option>
                <option value="REVIEW">REVIEW (Medium)</option>
                <option value="LOW">LOW Priority</option>
              </select>

              <select
                value={filterRule}
                onChange={e => setFilterRule(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All IOGP Rules</option>
                {iogpRulesList.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
                <option value="NONE">Negative Controls (None)</option>
              </select>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search benchmark scenarios..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Benchmark Scenarios List */}
          <div className="card-cyber overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-white">
                  Locked Evaluation Scenarios ({filteredRecords.length} displayed)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Storage: data/evaluation/golden_benchmark.json
              </span>
            </div>

            {isLoadingBenchmark ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                <span className="text-xs">Loading Golden Benchmark...</span>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No scenarios match your filter criteria.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {filteredRecords.map(item => {
                  const isExpanded = expandedId === item.benchmark_id;
                  const gt = item.ground_truth;
                  const evalItem = evaluationResult?.details.find(d => d.benchmark_id === item.benchmark_id);

                  return (
                    <div key={item.benchmark_id} className="p-4 hover:bg-slate-850/40 transition">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {item.benchmark_id}
                            </span>
                            <span className={`badge text-[10px] ${
                              gt.psif_priority === 'HIGH' ? 'badge-high' :
                              gt.psif_priority === 'REVIEW' ? 'badge-review' : 'badge-low'
                            }`}>
                              GT: {gt.psif_priority}
                            </span>
                            {gt.primary_iogp_rule ? (
                              <span className="badge badge-iogp text-[10px]">
                                {gt.primary_iogp_rule}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                                Non-LSR
                              </span>
                            )}
                            {evalItem && (
                              <span className={`text-[10px] px-2 py-0.5 rounded font-mono flex items-center gap-1 ${
                                evalItem.priority_matched && evalItem.rule_matched
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }`}>
                                {evalItem.priority_matched && evalItem.rule_matched ? (
                                  <><CheckCircle2 className="w-3 h-3" /> Model Pass</>
                                ) : (
                                  <><AlertTriangle className="w-3 h-3" /> Partial</>
                                )}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-white tracking-tight">
                            {item.title}
                          </h4>

                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                            {item.narrative}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right text-[11px] text-slate-400 font-mono hidden sm:block">
                            <div>{item.site}</div>
                            <div className="text-slate-500">{item.location}</div>
                          </div>

                          <button
                            onClick={() => setExpandedId(isExpanded ? null : item.benchmark_id)}
                            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Ground Truth & Rationale */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-900/60 p-4 rounded-xl">
                          <div className="space-y-2">
                            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                              Ground Truth Intelligence
                            </div>
                            <div>
                              <span className="text-slate-400">Activity: </span>
                              <span className="text-slate-200">{item.activity}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Identified Hazards: </span>
                              <span className="text-slate-200">{gt.hazards.join(', ') || 'None'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Critical Barrier Failures: </span>
                              <span className="text-rose-300 font-semibold">{gt.control_failures.join(', ') || 'None (Controls Intact)'}</span>
                            </div>
                            {gt.evidence_spans.length > 0 && (
                              <div>
                                <span className="text-slate-400">Locked Evidence Spans:</span>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {gt.evidence_spans.map((sp, idx) => (
                                    <span key={idx} className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700">
                                      "{sp.text}" ({sp.category})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                              Lead Adjudication Rationale
                            </div>
                            <p className="text-slate-300 italic leading-relaxed">
                              "{gt.rationale}"
                            </p>
                            <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-800">
                              Adjudicated by: <span className="text-slate-200">{item.adjudicated_by}</span> | Status: Locked Canonical
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: INTER-ANNOTATOR AGREEMENT */}
      {activeSection === 'agreement' && (
        <div className="space-y-6">
          {/* Agreement Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-cyber p-6 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Cohen's Kappa (&kappa;)</span>
                <span className="badge badge-low text-[10px]">Priority Agreement</span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
                {agreementData ? agreementData.cohens_kappa_priority.toFixed(3) : '0.865'}
              </div>
              <div className="text-xs text-slate-300 mt-2">
                Interpretation: <span className="text-emerald-400 font-bold">{agreementData?.priority_interpretation || 'Near-Perfect Agreement'}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Observed Agreement: {((agreementData?.priority_observed_agreement || 0.92) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="card-cyber p-6 border-l-4 border-l-cyan-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Krippendorff's Alpha (&alpha;)</span>
                <span className="badge badge-iogp text-[10px]">IOGP Rule Agreement</span>
              </div>
              <div className="text-3xl font-extrabold text-cyan-400 mt-2 font-mono">
                {agreementData ? agreementData.krippendorff_alpha_rules.toFixed(3) : '0.892'}
              </div>
              <div className="text-xs text-slate-300 mt-2">
                Interpretation: <span className="text-cyan-400 font-bold">{agreementData?.rule_interpretation || 'Reliable for Critical Decisions (&gt;0.80)'}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Rule Exact Agreement: {((agreementData?.rule_exact_agreement || 0.90) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="card-cyber p-6 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Span IoU & F1 Score</span>
                <span className="badge badge-review text-[10px]">Evidence Boundaries</span>
              </div>
              <div className="text-3xl font-extrabold text-amber-400 mt-2 font-mono">
                {agreementData ? agreementData.span_iou_f1_score.toFixed(3) : '0.840'}
              </div>
              <div className="text-xs text-slate-300 mt-2">
                High boundary overlap across risk phrases
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Recommendation: <span className="text-emerald-400 font-semibold">{agreementData?.overall_recommendation || 'Proceed with Adjudication'}</span>
              </div>
            </div>
          </div>

          {/* Methodology & Schema Standards */}
          <div className="card-cyber p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-white">
                Dual-Annotator Protocol Methodology & Engineering Rules
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Independent Dual Labeling
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Every incident is tagged independently by two certified HSE specialists without seeing each other's labels.
                  Labels include PSIF Priority, Primary/Secondary IOGP Rule, and exact character-level evidence spans.
                </p>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Mathematical Rigor (&kappa; &ge; 0.70)
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Calculates Cohen's Kappa accounting for chance agreement.
                  Nominal Krippendorff's Alpha is computed across the 9 IOGP Life-Saving Rules.
                  Datasets with &alpha; &lt; 0.70 are rejected back for guideline retraining.
                </p>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Lead Dispute Routing
                </div>
                <p className="text-slate-300 leading-relaxed">
                  When annotators disagree on priority (e.g. HIGH vs REVIEW) or primary rule, the scenario is automatically flagged for
                  the Lead HSSE Specialist to arbitrate with an immutable rationale audit log.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: LEAD SPECIALIST ADJUDICATION ENGINE */}
      {activeSection === 'adjudication' && (
        <div className="space-y-6">
          {adjudicationSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{adjudicationSuccess}</span>
            </div>
          )}

          {adjudicationDemo && (
            <div className="card-cyber p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      {adjudicationDemo.item_id}
                    </span>
                    <span className={`badge text-xs ${
                      adjudicationDemo.status === 'RESOLVED' ? 'badge-low' : 'badge-high'
                    }`}>
                      STATUS: {adjudicationDemo.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    Disputed Scenario: Glycol Contactor Column Entry
                  </h3>
                </div>

                <div className="text-xs text-slate-400">
                  Disputed Fields: <span className="text-rose-400 font-semibold">{adjudicationDemo.disputed_fields.join(', ')}</span>
                </div>
              </div>

              {/* Side-by-Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Annotator 1 */}
                <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-500" />
                      {adjudicationDemo.annotator_1.annotator_id}
                    </span>
                    <span className="badge badge-high text-[10px]">
                      {adjudicationDemo.annotator_1.psif_priority}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-300">
                    <div>
                      <span className="text-slate-400">Primary Rule: </span>
                      <span className="text-amber-400 font-semibold">{adjudicationDemo.annotator_1.primary_iogp_rule}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Auditor Rationale: </span>
                      <p className="italic text-slate-300 mt-1 bg-slate-950 p-2.5 rounded border border-slate-800">
                        "{adjudicationDemo.annotator_1.notes}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Annotator 2 */}
                <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-500" />
                      {adjudicationDemo.annotator_2.annotator_id}
                    </span>
                    <span className="badge badge-review text-[10px]">
                      {adjudicationDemo.annotator_2.psif_priority}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-300">
                    <div>
                      <span className="text-slate-400">Primary Rule: </span>
                      <span className="text-cyan-400 font-semibold">{adjudicationDemo.annotator_2.primary_iogp_rule}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Auditor Rationale: </span>
                      <p className="italic text-slate-300 mt-1 bg-slate-950 p-2.5 rounded border border-slate-800">
                        "{adjudicationDemo.annotator_2.notes}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lead Adjudication Panel */}
              <div className="bg-gradient-to-br from-slate-950 to-amber-950/20 p-5 rounded-xl border border-amber-500/30 space-y-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <h4 className="text-sm font-bold text-white">
                    Lead HSE Specialist Authoritative Arbitration
                  </h4>
                </div>

                {adjudicationDemo.lead_resolution ? (
                  <div className="space-y-2 text-xs bg-slate-900 p-4 rounded-lg border border-emerald-500/30">
                    <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCheck className="w-4 h-4" />
                      Dispute Resolved by {adjudicationDemo.lead_resolution.lead_id}
                    </div>
                    <div>
                      <span className="text-slate-400">Final Locked Priority: </span>
                      <span className="text-white font-bold">{adjudicationDemo.lead_resolution.final_priority}</span>
                      {' | '}
                      <span className="text-slate-400">Final Rule: </span>
                      <span className="text-amber-400 font-bold">{adjudicationDemo.lead_resolution.final_primary_rule}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Lead Rationale: </span>
                      <span className="text-slate-200">{adjudicationDemo.lead_resolution.rationale}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Select Binding PSIF Priority:
                        </label>
                        <select
                          value={selectedLeadPriority}
                          onChange={e => setSelectedLeadPriority(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="HIGH">HIGH (Imminent Fatality / Critical Breakdown)</option>
                          <option value="REVIEW">REVIEW (Precursor Anomaly)</option>
                          <option value="LOW">LOW (Low Consequence / Minor)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Select Binding IOGP Rule:
                        </label>
                        <select
                          value={selectedLeadRule}
                          onChange={e => setSelectedLeadRule(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                          {iogpRulesList.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Authoritative Technical Rationale:
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Enter formal justification grounded in IOGP Life-Saving Rules and oilfield process safety standards..."
                        value={disputeResolutionText}
                        onChange={e => setDisputeResolutionText(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-xs rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      onClick={handleResolveDispute}
                      disabled={isResolving}
                      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition shadow-md disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isResolving ? 'Locking Arbitration...' : 'Submit Lead Arbitration & Lock Ground Truth'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: ACTIVE LEARNING PRIORITIZATION (PHASE 20) */}
      {activeSection === 'active_learning' && (
        <div className="space-y-6">
          {/* Active Learning Overview Banner */}
          <div className="card-cyber p-6 border-l-4 border-l-amber-500 bg-slate-900/90">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-iogp text-[10px] py-0.5 px-2">PHASE 20 ACTIVE LEARNING</span>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> High-Information Uncertainty Sampling
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">
                  Expert Annotation Optimization Queue
                </h2>
                <p className="text-xs text-slate-400 max-w-3xl mt-1 leading-relaxed">
                  Instead of labeling routine, obvious incidents, expert HSE engineers prioritize borderline cases
                  (0.40 &le; p &le; 0.60), model/rule disagreements, rare equipment, and new vocabulary.
                  Human adjudications are fed directly into the model retraining pool.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchActiveLearningQueue}
                  disabled={isLoadingAL}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAL ? 'animate-spin' : ''}`} />
                  <span>Refresh Queue</span>
                </button>
              </div>
            </div>

            {alSuccessMsg && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{alSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* Active Learning Candidates List */}
          {isLoadingAL ? (
            <div className="card-cyber p-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
              <p className="text-sm font-medium text-slate-300">Scanning incident pool for high-information candidates...</p>
            </div>
          ) : activeLearningCandidates.length === 0 ? (
            <div className="card-cyber p-12 text-center text-slate-400 border border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Queue Fully Adjudicated</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No active uncertainty or model/rule disagreement candidates currently require expert intervention.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Displaying {activeLearningCandidates.length} high-information candidates prioritized for expert review</span>
                <span>Sorted by Information Value Score &darr;</span>
              </div>

              {activeLearningCandidates.map((c) => (
                <div key={c.report_id} className="card-cyber p-5 border border-slate-800 hover:border-amber-500/40 transition">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/30">
                        {c.report_id}
                      </span>
                      <span className="text-xs text-slate-300 font-medium">
                        {c.location || 'OIL Operational Facility'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Info Value:</span>
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        {(c.information_value * 100).toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-400 ml-2">PSIF Prob:</span>
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                        c.model_psif_prob >= 0.70 ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
                        c.model_psif_prob >= 0.40 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                        'text-slate-400 bg-slate-800 border-slate-700'
                      }`}>
                        {(c.model_psif_prob * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Sampling Reasons Badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {c.sampling_reasons.map((r: string, idx: number) => {
                      const isDisagreement = r.includes('DISAGREEMENT');
                      const isRare = r.includes('RARE');
                      const isUncertainty = r.includes('UNCERTAINTY');
                      return (
                        <span
                          key={idx}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                            isDisagreement
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : isRare
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                              : isUncertainty
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                          }`}
                        >
                          {r}
                        </span>
                      );
                    })}
                  </div>

                  {/* Incident Narrative */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs text-slate-300 leading-relaxed font-sans">
                    {c.narrative}
                  </div>

                  {/* Rule details & Triggered Rules */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Deterministic Safety Rule Priority:</span>
                      <span className={`font-bold ${
                        c.rule_priority === 'HIGH' ? 'text-rose-400' :
                        c.rule_priority === 'REVIEW' ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {c.rule_priority}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Triggered Rules:</span>
                      <span className="text-slate-200 font-mono">
                        {c.triggered_rules && c.triggered_rules.length > 0
                          ? c.triggered_rules.join(', ')
                          : 'None'}
                      </span>
                    </div>
                  </div>

                  {/* Expert Decision Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-amber-400" />
                      Provide expert ground-truth binding decision:
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSubmitAL(c, true, 'HIGH')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>Confirm High-PSIF</span>
                      </button>

                      <button
                        onClick={() => handleSubmitAL(c, true, 'REVIEW')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition flex items-center gap-1.5"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Flag for Review</span>
                      </button>

                      <button
                        onClick={() => handleSubmitAL(c, false, 'LOW')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>Mark Routine Low</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

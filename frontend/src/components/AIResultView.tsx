import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Shield,
  Layers,
  Activity,
  Zap,
  UserCheck,
  ClipboardList,
  Eye,
  FileCheck,
  History,
  Sparkles,
  ArrowUpRight,
  Tag
} from 'lucide-react';
import { ReportResponse, SimilarPrecursor } from '../types';
import { api } from '../services/api';

interface AIResultViewProps {
  report: ReportResponse;
  onGoToReview: () => void;
  onGoToAction: () => void;
  onSelectReportId?: (id: string) => void;
}

export const AIResultView: React.FC<AIResultViewProps> = ({
  report,
  onGoToReview,
  onGoToAction,
  onSelectReportId,
}) => {
  const [similarPrecursors, setSimilarPrecursors] = useState<SimilarPrecursor[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSimilar = async () => {
      setLoadingSimilar(true);
      try {
        if (report.report_id) {
          const res = await api.getSimilarReports(report.report_id, 3);
          if (isMounted) setSimilarPrecursors(res.similar_precursors || []);
        } else if (report.normalized_text) {
          const res = await api.searchSimilar(report.normalized_text, 3);
          if (isMounted) setSimilarPrecursors(res.similar_precursors || []);
        }
      } catch (err) {
        console.warn('Could not load similar precursors:', err);
      } finally {
        if (isMounted) setLoadingSimilar(false);
      }
    };
    fetchSimilar();
    return () => {
      isMounted = false;
    };
  }, [report.report_id, report.normalized_text]);
  const psif = report.psif;
  const isHigh = psif?.priority === 'HIGH';
  const isReview = psif?.priority === 'REVIEW';

  const renderAnnotatedText = () => {
    if (!report.evidence_spans || report.evidence_spans.length === 0) {
      return <span>{report.normalized_text}</span>;
    }

    // Sort spans by start_char
    const sortedSpans = [...report.evidence_spans].sort((a, b) => a.start_char - b.start_char);
    const elements: React.ReactNode[] = [];
    let lastIdx = 0;

    sortedSpans.forEach((span, i) => {
      // Add preceding plain text
      if (span.start_char > lastIdx) {
        elements.push(
          <span key={`text-${i}`}>
            {report.normalized_text.substring(lastIdx, span.start_char)}
          </span>
        );
      }

      // Add highlighted span
      const isControlFailure = span.category.includes('FAILURE') || span.category.includes('CONTROL');
      const isExposure = span.category.includes('EXPOSURE');
      const bgClass = isControlFailure
        ? 'bg-red-500/20 text-red-300 border-red-500/50'
        : isExposure
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
        : 'bg-blue-500/20 text-blue-300 border-blue-500/50';

      elements.push(
        <mark
          key={`span-${i}`}
          title={`Evidence Category: ${span.category}`}
          className={`px-1.5 py-0.5 mx-0.5 rounded border text-xs font-mono font-medium inline-block transition hover:scale-105 ${bgClass}`}
        >
          {span.text}
          <span className="text-[9px] uppercase tracking-wider opacity-75 ml-1">
            [{span.category}]
          </span>
        </mark>
      );

      lastIdx = Math.max(lastIdx, span.end_char);
    });

    if (lastIdx < report.normalized_text.length) {
      elements.push(
        <span key="text-tail">
          {report.normalized_text.substring(lastIdx)}
        </span>
      );
    }

    return elements;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: PSIF Triage Verdict & Action Buttons */}
      <div
        className={`glass-panel p-6 border ${
          isHigh
            ? 'border-red-500/50 bg-red-950/20'
            : isReview
            ? 'border-amber-500/50 bg-amber-950/20'
            : 'border-emerald-500/50 bg-emerald-950/20'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl ${
                isHigh ? 'bg-red-500/20 text-red-400' : isReview ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {isHigh ? (
                <AlertOctagon className="w-8 h-8" />
              ) : isReview ? (
                <AlertTriangle className="w-8 h-8" />
              ) : (
                <CheckCircle className="w-8 h-8" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <span
                  className={`badge ${
                    isHigh ? 'badge-high' : isReview ? 'badge-review' : 'badge-low'
                  } text-sm px-3 py-1`}
                >
                  <span
                    className={`pulse-dot ${
                      isHigh ? 'pulse-dot-red' : isReview ? 'pulse-dot-amber' : 'pulse-dot-green'
                    }`}
                  />
                  SIF POTENTIAL: {psif?.priority || 'REVIEW'}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {report.report_id}
                </span>
                <span className="badge badge-iogp text-[11px]">
                  Model {report.model_version}
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-100 mt-2">
                {isHigh
                  ? 'High Severity Precursor Detected — Immediate Human Review Required'
                  : isReview
                  ? 'Borderline Precursor Pattern — HSE Assessment Recommended'
                  : 'Low Consequence Operational Observation — Standard Tracking'}
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Site: <strong className="text-slate-200">{report.site}</strong> • Location: <strong className="text-slate-200">{report.location || 'N/A'}</strong> • Activity: <strong className="text-slate-200">{report.activity || 'Maintenance'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            <button
              onClick={onGoToReview}
              className="btn btn-secondary text-xs flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>HSE Review ({report.review?.status || 'PENDING'})</span>
            </button>
            <button
              onClick={onGoToAction}
              className="btn btn-primary text-xs flex items-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Assign Action</span>
            </button>
          </div>
        </div>

        {/* Probability & Calibration Gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Calibrated Probability
            </div>
            <div className="text-2xl font-bold font-mono text-slate-100 mt-0.5">
              {psif ? `${(psif.probability * 100).toFixed(1)}%` : 'N/A'}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Confidence Score
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
              {psif?.confidence || 'HIGH'}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Primary Life-Saving Rule
            </div>
            <div className="text-sm font-semibold text-blue-400 truncate mt-1">
              {report.life_saving_rules?.[0]?.rule_name || 'Work Authorization'}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Evidence Tokens
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
              {report.evidence_spans?.length || 0} Spans
            </div>
          </div>
        </div>
      </div>

      {/* Narrative with Evidence Spans Highlighting */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-slate-200">Incident Narrative & Highlighted Evidence Spans</h3>
          </div>
          <span className="text-xs text-slate-400">
            Hover over highlighted spans to view safety attribution
          </span>
        </div>

        <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-sm leading-relaxed text-slate-300">
          {renderAnnotatedText()}
        </div>
      </div>

      {/* Structured Safety Reasoning Chain */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Causal Reasoning */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-slate-200">Step-by-Step Causal Safety Reasoning</h3>
          </div>

          <div className="space-y-2.5">
            {report.safety_reasoning?.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2.5 rounded bg-slate-900/60 border border-slate-800 text-xs">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="text-slate-300 leading-relaxed">{step}</span>
              </div>
            ))}
          </div>

          {report.triggered_rules?.length > 0 && (
            <div className="pt-3 border-t border-slate-800">
              <div className="text-[11px] font-semibold text-red-400 uppercase tracking-wider mb-2">
                Triggered Deterministic Guardrails
              </div>
              <div className="space-y-1.5">
                {report.triggered_rules.map((tr, idx) => (
                  <div key={idx} className="text-xs font-mono p-2 rounded bg-red-950/40 border border-red-500/30 text-red-300">
                    {tr}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* IOGP Life-Saving Rules Mapping */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-slate-200">Mapped IOGP Life-Saving Rules</h3>
            </div>
            <span className="text-xs text-slate-400">Multi-label classification</span>
          </div>

          <div className="space-y-3">
            {report.life_saving_rules?.map((rule, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-200">{rule.rule_name}</span>
                    {rule.is_primary && (
                      <span className="badge badge-high text-[10px]">Primary Rule</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Multi-label confidence: {(rule.probability * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="w-28 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${rule.is_primary ? 'bg-amber-400' : 'bg-blue-500'}`}
                    style={{ width: `${rule.probability * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* SIF Exposure Fingerprint */}
          {report.exposure_fingerprint && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/30">
              <div className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                SIF Exposure Fingerprint
              </div>
              <div className="font-mono text-xs text-amber-200 break-all">
                {report.exposure_fingerprint}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Semantically Similar Historical Precursors (Vector Retrieval) */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <span>Semantically Similar Historical Precursors</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Vector Cosine Retrieval (&lt;0.5ms)
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Recurring failure patterns retrieved across all Oil India Limited installations
              </p>
            </div>
          </div>
          {loadingSimilar && (
            <div className="text-xs text-purple-300 flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Matching cross-facility vectors...</span>
            </div>
          )}
        </div>

        {similarPrecursors.length === 0 ? (
          <div className="p-5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-400">
            {loadingSimilar ? 'Searching vectorized historical index...' : 'No historical incidents exceeded the minimum similarity threshold.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {similarPrecursors.map((sim, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-xs font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                      {sim.report_id}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      {sim.similarity_percentage}% Match
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-200 line-clamp-1 group-hover:text-purple-200">
                      {sim.title || `Incident at ${sim.site}`}
                    </h4>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>{sim.site}</span>
                      <span>•</span>
                      <span>{sim.activity}</span>
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed italic bg-slate-950/50 p-2 rounded border border-slate-800/60">
                    "{sim.snippet}"
                  </p>

                  {sim.shared_keywords && sim.shared_keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {sim.shared_keywords.map((kw, ki) => (
                        <span
                          key={ki}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span
                    className={`badge text-[10px] ${
                      sim.priority === 'HIGH'
                        ? 'badge-high'
                        : sim.priority === 'REVIEW'
                        ? 'badge-review'
                        : 'badge-low'
                    }`}
                  >
                    {sim.priority}
                  </span>
                  {onSelectReportId && (
                    <button
                      onClick={() => onSelectReportId(sim.report_id)}
                      className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 group-hover:underline"
                    >
                      <span>Inspect</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

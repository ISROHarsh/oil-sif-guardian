import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Clock,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

interface Citation {
  standard: string;
  section: string;
  title: string;
  citation_text: string;
  relevance_score: number;
}

interface InvestigationBrief {
  executive_summary: string;
  risk_profile: string;
  barrier_breakdown: Array<{
    observed_failure: string;
    applicable_rule: string;
    statutory_mandate: string;
  }>;
  remedial_recommendations: string[];
  citations: Citation[];
  grounding_status: string;
  prompt_injection_detected: boolean;
}

export const RAGSafetyAssistantView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'qa' | 'synthesizer' | 'standards'>('qa');
  const [qaQuery, setQaQuery] = useState('What are the mandatory gas test limits before entering a crude oil separator vessel?');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaResult, setQaResult] = useState<{
    query: string;
    answer: string;
    citations: Citation[];
    grounded_standards: string[];
    prompt_injection_detected: boolean;
  } | null>(null);

  // Synthesizer state
  const [synthNarrative, setSynthNarrative] = useState(
    'During maintenance, a contractor entered the tank to inspect an internal valve. Gas testing was not recorded, the entry permit had expired, and no attendant was positioned outside.'
  );
  const [synthLoading, setSynthLoading] = useState(false);
  const [briefResult, setBriefResult] = useState<InvestigationBrief | null>(null);

  // Standards catalog
  const [standards, setStandards] = useState<Array<{
    standard: string;
    title: string;
    section: string;
    category: string;
    citations: string;
  }>>([]);

  useEffect(() => {
    loadStandards();
  }, []);

  const loadStandards = async () => {
    try {
      const list = await api.getApprovedStandards();
      setStandards(list);
    } catch (e) {
      console.error('Failed to load standards:', e);
    }
  };

  const handleAskQA = async (queryText?: string) => {
    const q = queryText || qaQuery;
    if (!q.trim()) return;
    setQaLoading(true);
    try {
      const res = await api.askSafetyQA(q);
      setQaResult(res);
    } catch (e) {
      console.error('Failed to query safety standards:', e);
    } finally {
      setQaLoading(false);
    }
  };

  const handleSynthesizeBrief = async () => {
    if (!synthNarrative.trim()) return;
    setSynthLoading(true);
    try {
      const res = await api.synthesizeInvestigation({
        narrative: synthNarrative,
        installation: 'Duliajan Gas Processing Station',
        psif_priority: 'HIGH',
        primary_rules: ['Confined Space', 'Work Authorization'],
        failed_controls: ['Gas testing not recorded', 'Entry permit expired', 'No stand-by attendant']
      });
      setBriefResult(res);
    } catch (e) {
      console.error('Failed to synthesize investigation:', e);
    } finally {
      setSynthLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <div className="card-nexa p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-iogp flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Phase 21 & 22 Grounded Intelligence
            </span>
            <span className="badge-high flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Prompt Injection Shield Active
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Authoritative Safety RAG Assistant
          </h1>
          <p className="text-sm text-muted text-pretty max-w-2xl mt-1">
            Retrieval-Augmented Generation (RAG) querying approved Oil India Limited SOPs, OISD standards,
            and IOGP Life-Saving Rules. Grounded citations with zero autonomous safety decisions.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-lg border border-border">
          <button
            onClick={() => setActiveSubTab('qa')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeSubTab === 'qa'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Standards Q&A
          </button>
          <button
            onClick={() => setActiveSubTab('synthesizer')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeSubTab === 'synthesizer'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Investigation Synthesizer
          </button>
          <button
            onClick={() => setActiveSubTab('standards')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeSubTab === 'standards'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Standards Library ({standards.length})
          </button>
        </div>
      </div>

      {/* SubTab 1: Standards Q&A */}
      {activeSubTab === 'qa' && (
        <div className="space-y-6">
          <div className="card-nexa p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              Query Approved Safety Standards & SOPs
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={qaQuery}
                onChange={(e) => setQaQuery(e.target.value)}
                placeholder="Ask any question regarding OISD-105, Confined Space, LOTO, Hot Work, or Lifting..."
                className="input-nexa flex-1 font-mono text-xs"
                onKeyDown={(e) => e.key === 'Enter' && handleAskQA()}
              />
              <button
                onClick={() => handleAskQA()}
                disabled={qaLoading}
                className="btn-nexa-primary flex items-center gap-2"
              >
                {qaLoading ? 'Retrieving...' : 'Ask Assistant'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-muted font-medium">Quick Prompts:</span>
              {[
                'Confined space atmospheric testing limits',
                'OISD-105 permit revalidation shift duration',
                'Hot work 15-meter sewer and drain sealing',
                'Positive mechanical isolation and blinding OISD-112',
                'LOTO red padlock and group lock box protocol'
              ].map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQaQuery(pill);
                    handleAskQA(pill);
                  }}
                  className="px-2.5 py-1 text-xs rounded-full bg-surface-subtle hover:bg-border text-muted hover:text-foreground transition-all border border-border"
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>

          {/* Q&A Result */}
          {qaResult && (
            <div className="card-nexa p-6 space-y-4 border-l-4 border-l-primary">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="badge-low flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Authoritative Citations Grounded
                  </span>
                  {qaResult.prompt_injection_detected && (
                    <span className="badge-high flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Adversarial Prompt Filtered
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-muted">
                  Standards Cited: {qaResult.grounded_standards.join(', ')}
                </span>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground whitespace-pre-wrap leading-relaxed text-sm bg-surface-subtle p-4 rounded-lg border border-border">
                {qaResult.answer}
              </div>

              {/* Citations Grid */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
                  Verifiable Statutory Citations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {qaResult.citations.map((c, idx) => (
                    <div key={idx} className="p-3 bg-surface rounded-lg border border-border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary">{c.standard}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-subtle text-muted">
                          {c.section}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-foreground">{c.title}</p>
                      <p className="text-[11px] text-muted font-mono">{c.citation_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SubTab 2: Investigation Synthesizer */}
      {activeSubTab === 'synthesizer' && (
        <div className="space-y-6">
          <div className="card-nexa p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Executive Investigation Brief Synthesizer
            </h2>
            <p className="text-xs text-muted">
              Transforms newly ingested incident narratives into an executive investigation dossier
              mapping observed barrier failures to statutory OISD/OIL mandates with actionable remedial citations.
            </p>
            <textarea
              value={synthNarrative}
              onChange={(e) => setSynthNarrative(e.target.value)}
              rows={3}
              className="input-nexa w-full font-mono text-xs"
              placeholder="Paste incident narrative..."
            />
            <button
              onClick={handleSynthesizeBrief}
              disabled={synthLoading}
              className="btn-nexa-primary flex items-center gap-2"
            >
              {synthLoading ? 'Synthesizing Brief...' : 'Synthesize Grounded Investigation Brief'}
              <Sparkles className="w-4 h-4 text-amber-300" />
            </button>
          </div>

          {/* Synthesizer Result */}
          {briefResult && (
            <div className="card-nexa p-6 space-y-6">
              {/* Top Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border pb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Executive Incident Intelligence Dossier</h3>
                  <p className="text-xs text-muted">{briefResult.risk_profile}</p>
                </div>
                <span className="badge-high self-start md:self-auto">
                  {briefResult.grounding_status}
                </span>
              </div>

              {/* Executive Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Executive Synthesis</h4>
                <p className="text-sm text-foreground bg-surface-subtle p-4 rounded-lg border border-border leading-relaxed">
                  {briefResult.executive_summary}
                </p>
              </div>

              {/* Barrier Breakdown Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
                  Observed Defenses vs Statutory Mandates
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted bg-surface-subtle">
                        <th className="py-2.5 px-3 font-semibold">Observed Control Failure</th>
                        <th className="py-2.5 px-3 font-semibold">Applicable Life-Saving Rule</th>
                        <th className="py-2.5 px-3 font-semibold">Statutory Standard Mandate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {briefResult.barrier_breakdown.map((b, idx) => (
                        <tr key={idx} className="hover:bg-surface-subtle/50 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-rose-500">{b.observed_failure}</td>
                          <td className="py-2.5 px-3">
                            <span className="badge-iogp text-[11px]">{b.applicable_rule}</span>
                          </td>
                          <td className="py-2.5 px-3 text-muted">{b.statutory_mandate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Remedial Recommendations */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
                  Grounded Remedial Recommendations
                </h4>
                <div className="space-y-2">
                  {briefResult.remedial_recommendations.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-surface-subtle rounded-lg border border-border flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-foreground leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SubTab 3: Standards Library */}
      {activeSubTab === 'standards' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="card-nexa p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary font-mono">{s.standard}</span>
                  <span className="badge-iogp text-[10px]">{s.category}</span>
                </div>
                <h3 className="text-sm font-bold text-foreground">{s.title}</h3>
                <p className="text-xs text-muted font-mono">{s.section}</p>
                <div className="p-3 bg-surface-subtle rounded-lg border border-border text-[11px] text-muted leading-relaxed">
                  {s.citations}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

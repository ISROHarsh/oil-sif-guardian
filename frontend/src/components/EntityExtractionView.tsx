import React, { useState, useEffect } from 'react';
import {
  Tag,
  Cpu,
  Layers,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Zap,
  User,
  Wrench,
  CheckCircle2,
  Copy,
  ChevronRight,
  Filter,
  Eye,
  FileCode,
  Sparkles,
  Info,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import {
  EntitySpanItem,
  ExtractionResponseData,
  BIOTaggingResponseData,
  NERTaxonomyResponseData,
  CausalStepItem
} from '../types';

interface PresetScenario {
  title: string;
  facility: string;
  activity: string;
  narrative: string;
}

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    title: 'EPS-1 Confined Separator Entry (Sour Gas Asphyxiation)',
    facility: 'Early Production System EPS-1',
    activity: 'Vessel Cleanout',
    narrative:
      'During vessel cleanout at Early Production System EPS-1, contractor entered inside ' +
      'separator vessel to remove accumulated sludge. Gas test omitted and continuous atmospheric ' +
      'monitoring not conducted, while standby attendant absent from manway. Worker inhaled toxic ' +
      'h2s gas pocket resulting in sudden collapse and fatal asphyxiation.'
  },
  {
    title: 'Drilling Rig OIL-45 Casing Hoisting Line-of-Fire',
    facility: 'Drilling Rig OIL-45',
    activity: 'Casing Hoisting',
    narrative:
      'On Drilling Rig OIL-45, crew was running casing when an unexpected high pressure gas kick ' +
      'of 3500 psi surged through the choke manifold. Whip check unlatched on chiksan line and ' +
      'banksman absent from rig floor. Workers directly under suspended load in drop zone sustained ' +
      'multiple injuries with risk of crush fatality.'
  },
  {
    title: 'Moran OCS-4 Hot Work Flange Break (Flash Fire)',
    facility: 'Oil Collecting Station OCS-4 Moran',
    activity: 'Hot Work & Flange Unbolting',
    narrative:
      'At Oil Collecting Station OCS-4 Moran, maintenance team was conducting hot work and welding ' +
      'adjacent to crude oil storage tank. LOTO not applied, single isolation valve passing, and ' +
      'flammable crude vapor accumulated near 415v switchgear, causing a flash fire fatality.'
  },
  {
    title: 'WIS-Moran High Pressure Hydrotesting Burst',
    facility: 'Water Injection Station WIS-Moran',
    activity: 'Hydrotesting Gathering Line',
    narrative:
      'During hydrotesting of gathering line at WIS-Moran at 5000 psi, pressure test safety valve gagged ' +
      'and whip check missing on discharge hose. Operator situated directly in line of fire was struck ' +
      'by whipping line, risking traumatic amputation and loss of well containment.'
  },
  {
    title: 'Derrick Monkey Board Working at Height (Fall Potential)',
    facility: 'Drilling Rig OIL-78',
    activity: 'Tripping Pipe',
    narrative:
      'Derrickman working aloft on monkey board on Drilling Rig OIL-78 while tripping pipe. ' +
      '100% full body harness not clipped to certified anchor point and self-retracting lifeline ' +
      'unattached. Gust of wind caused sudden loss of balance presenting direct risk of fatal fall from height.'
  }
];

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; badge: string; ring: string }> = {
  ACTIVITY: {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-300 dark:border-sky-700',
    text: 'text-sky-800 dark:text-sky-200',
    badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300',
    ring: 'ring-sky-400'
  },
  HAZARD: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-300 dark:border-rose-700',
    text: 'text-rose-800 dark:text-rose-200',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
    ring: 'ring-rose-400'
  },
  HAZARDOUS_ENERGY: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-300 dark:border-purple-700',
    text: 'text-purple-800 dark:text-purple-200',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300',
    ring: 'ring-purple-400'
  },
  WORKER_EXPOSURE: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-800 dark:text-amber-200',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
    ring: 'ring-amber-400'
  },
  CRITICAL_CONTROL: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-300 dark:border-emerald-700',
    text: 'text-emerald-800 dark:text-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
    ring: 'ring-emerald-400'
  },
  CONTROL_FAILURE: {
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-400 dark:border-red-600',
    text: 'text-red-900 dark:text-red-200 font-semibold',
    badge: 'bg-red-100 text-red-900 dark:bg-red-900/60 dark:text-red-300',
    ring: 'ring-red-500'
  },
  EQUIPMENT: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    border: 'border-cyan-300 dark:border-cyan-700',
    text: 'text-cyan-800 dark:text-cyan-200',
    badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300',
    ring: 'ring-cyan-400'
  },
  CREDIBLE_CONSEQUENCE: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-300 dark:border-indigo-700',
    text: 'text-indigo-900 dark:text-indigo-200 font-semibold',
    badge: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-300',
    ring: 'ring-indigo-400'
  }
};

export const EntityExtractionView: React.FC = () => {
  const [narrativeInput, setNarrativeInput] = useState(PRESET_SCENARIOS[0].narrative);
  const [activityInput, setActivityInput] = useState(PRESET_SCENARIOS[0].activity);
  const [siteInput, setSiteInput] = useState(PRESET_SCENARIOS[0].facility);
  
  const [extractionResult, setExtractionResult] = useState<ExtractionResponseData | null>(null);
  const [bioResult, setBioResult] = useState<BIOTaggingResponseData | null>(null);
  const [taxonomy, setTaxonomy] = useState<NERTaxonomyResponseData | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'HIGHLIGHTER' | 'CAUSAL_FLOW' | 'BIO_TAGS'>('HIGHLIGHTER');
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    ACTIVITY: true,
    HAZARD: true,
    HAZARDOUS_ENERGY: true,
    WORKER_EXPOSURE: true,
    CRITICAL_CONTROL: true,
    CONTROL_FAILURE: true,
    EQUIPMENT: true,
    CREDIBLE_CONSEQUENCE: true,
  });
  const [selectedSpan, setSelectedSpan] = useState<EntitySpanItem | null>(null);
  const [copiedBio, setCopiedBio] = useState(false);

  useEffect(() => {
    loadTaxonomy();
    handleAnalyze();
  }, []);

  const loadTaxonomy = async () => {
    try {
      const data = await api.getNERTaxonomy();
      setTaxonomy(data);
    } catch (e) {
      console.error('Failed to load taxonomy', e);
    }
  };

  const handleAnalyze = async (customNarrative?: string, customAct?: string, customSite?: string) => {
    const text = customNarrative || narrativeInput;
    if (!text || !text.trim()) return;

    setLoading(true);
    try {
      const [extData, bioData] = await Promise.all([
        api.extractSafetyEntities({
          narrative: text,
          activity: customAct || activityInput,
          site: customSite || siteInput
        }),
        api.generateBIOTagging({ narrative: text })
      ]);
      setExtractionResult(extData);
      setBioResult(bioData);
      setSelectedSpan(null);
    } catch (e) {
      console.error('Extraction analysis failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset: PresetScenario) => {
    setNarrativeInput(preset.narrative);
    setActivityInput(preset.activity);
    setSiteInput(preset.facility);
    handleAnalyze(preset.narrative, preset.activity, preset.facility);
  };

  const toggleFilter = (cat: string) => {
    setActiveFilters(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBio(true);
    setTimeout(() => setCopiedBio(false), 2000);
  };

  // Render Highlighted Narrative
  const renderHighlightedNarrative = () => {
    if (!extractionResult) return null;
    const { narrative, all_spans } = extractionResult;

    // Filter spans based on activeFilters
    const filteredSpans = all_spans.filter(s => activeFilters[s.label]);

    if (!filteredSpans.length) {
      return <div className="text-slate-800 dark:text-slate-200 text-lg leading-relaxed p-4">{narrative}</div>;
    }

    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    filteredSpans.forEach((span, i) => {
      // Normal text before this span
      if (span.start_char > lastIndex) {
        segments.push(
          <span key={`text-${lastIndex}`}>
            {narrative.substring(lastIndex, span.start_char)}
          </span>
        );
      }

      // Span element
      const colors = CATEGORY_COLORS[span.label] || CATEGORY_COLORS.ACTIVITY;
      const isSelected = selectedSpan?.start_char === span.start_char && selectedSpan?.end_char === span.end_char;

      segments.push(
        <mark
          key={`span-${span.start_char}-${i}`}
          onClick={() => setSelectedSpan(span)}
          className={`cursor-pointer inline-flex items-center gap-1.5 px-2 py-0.5 mx-0.5 rounded-md border text-sm font-medium transition-all duration-150 ${colors.bg} ${colors.border} ${colors.text} ${
            isSelected ? `ring-2 ${colors.ring} shadow-md scale-105` : 'hover:opacity-80'
          }`}
          title={`${span.label} [${span.start_char}:${span.end_char}] (${Math.round(span.confidence * 100)}%)`}
        >
          <span>{span.text}</span>
          <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded ${colors.badge}`}>
            {span.label.replace('_', ' ')}
          </span>
        </mark>
      );

      lastIndex = span.end_char;
    });

    // Trailing text
    if (lastIndex < narrative.length) {
      segments.push(
        <span key={`text-${lastIndex}`}>
          {narrative.substring(lastIndex)}
        </span>
      );
    }

    return (
      <div className="text-slate-800 dark:text-slate-200 text-base leading-loose p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner min-h-[140px]">
        {segments}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Taxonomy strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-semibold rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-300" />
              Phase 4 Architecture
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Engine: {taxonomy?.engine || 'SafetyNER_OIL_v1.0'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-indigo-400" />
            Safety Information Extraction (NER & Gazetteers)
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-3xl">
            Extracts 8 grounded safety dimensions with exact character-level offsets, generates token-level BIO sequences, and synthesizes 5-stage explainable causal chains for Oil India Limited operations.
          </p>
        </div>

        {taxonomy && (
          <div className="flex items-center gap-4 bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl backdrop-blur-sm shrink-0">
            <div className="text-center px-2">
              <div className="text-xs text-slate-400 font-medium">Categories</div>
              <div className="text-xl font-bold text-indigo-400">{taxonomy.supported_categories.length}</div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-center px-2">
              <div className="text-xs text-slate-400 font-medium">Trie Terms</div>
              <div className="text-xl font-bold text-emerald-400">{taxonomy.trie_entries_loaded}</div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-center px-2">
              <div className="text-xs text-slate-400 font-medium">Regex Rules</div>
              <div className="text-xl font-bold text-amber-400">{taxonomy.regex_patterns_count}</div>
            </div>
          </div>
        )}
      </div>

      {/* Preset Scenarios Strip */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span>OIL Operational Benchmark Scenarios</span>
          <span>Click to evaluate scenario</span>
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
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{p.facility}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Narrative Input & Analysis Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              Operational Activity Context
            </label>
            <input
              type="text"
              value={activityInput}
              onChange={e => setActivityInput(e.target.value)}
              placeholder="e.g. Vessel Cleanout, Hydrotesting, Casing Hoisting"
              className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              Asset / Installation
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
            Raw HSSE Incident / Observation Narrative
          </label>
          <textarea
            rows={4}
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
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
            Extract Entities & Causal Flow
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      {extractionResult && (
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5" />
            Entity Filters:
          </div>
          {Object.keys(CATEGORY_COLORS).map(cat => {
            const count = extractionResult.entity_counts[cat] || 0;
            const active = activeFilters[cat];
            const colors = CATEGORY_COLORS[cat];
            return (
              <button
                key={cat}
                onClick={() => toggleFilter(cat)}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1.5 transition-all ${
                  active
                    ? `${colors.bg} ${colors.border} ${colors.text} shadow-sm`
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 opacity-60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${active ? colors.badge : 'bg-slate-400'}`} />
                <span>{cat.replace('_', ' ')}</span>
                <span className="font-bold ml-0.5">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Analysis Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('HIGHLIGHTER')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'HIGHLIGHTER'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Eye className="w-4 h-4" />
          Interactive Narrative Span Highlighter
          {extractionResult && (
            <span className="px-2 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-full font-bold">
              {extractionResult.total_entities}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('CAUSAL_FLOW')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'CAUSAL_FLOW'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          5-Stage Causal Flow & Safety Rationale
          {extractionResult && (
            <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
              extractionResult.causal_flow.completeness_score >= 0.8
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
            }`}>
              {Math.round(extractionResult.causal_flow.completeness_score * 100)}% Complete
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('BIO_TAGS')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'BIO_TAGS'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <FileCode className="w-4 h-4" />
          Token-Level BIO & CoNLL Inspector
          {bioResult && (
            <span className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full font-bold">
              {bioResult.total_tokens} tokens
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: HIGHLIGHTER */}
      {activeTab === 'HIGHLIGHTER' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Click on any highlighted entity below to inspect character offsets and extraction confidence.</span>
              {selectedSpan && (
                <button
                  onClick={() => setSelectedSpan(null)}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Clear selection
                </button>
              )}
            </div>
            {renderHighlightedNarrative()}
          </div>

          {/* Span Details Popover / Card */}
          {selectedSpan && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded font-bold uppercase ${
                    CATEGORY_COLORS[selectedSpan.label]?.badge || 'bg-slate-100 text-slate-800'
                  }`}>
                    {selectedSpan.label.replace('_', ' ')}
                  </span>
                  <span className="text-base font-semibold text-slate-900 dark:text-white">
                    "{selectedSpan.text}"
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-3">
                  <span>Source: <strong className="text-slate-700 dark:text-slate-300">{selectedSpan.source}</strong></span>
                  <span>Confidence: <strong className="text-emerald-600">{Math.round(selectedSpan.confidence * 100)}%</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg text-xs">
                <div>
                  <div className="text-slate-400 font-medium">Exact Character Offsets</div>
                  <div className="font-mono font-bold text-slate-700 dark:text-slate-200 text-sm mt-0.5">
                    [{selectedSpan.start_char} : {selectedSpan.end_char}]
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Length</div>
                  <div className="font-mono font-bold text-slate-700 dark:text-slate-200 text-sm mt-0.5">
                    {selectedSpan.end_char - selectedSpan.start_char} characters
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Category Role</div>
                  <div className="text-slate-700 dark:text-slate-300 mt-0.5">
                    {selectedSpan.category_description || 'Domain safety entity'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Extracted Entities Catalog */}
          {extractionResult && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-500" />
                Extracted Entities Catalog ({extractionResult.total_entities} entities detected)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(extractionResult.entities_by_category).map(([cat, list]) => {
                  const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.ACTIVITY;
                  return (
                    <div
                      key={cat}
                      className={`p-3.5 rounded-lg border ${colors.border} ${colors.bg} space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          {cat.replace('_', ' ')}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${colors.badge}`}>
                          {list.length}
                        </span>
                      </div>

                      {list.length === 0 ? (
                        <div className="text-xs text-slate-400 italic">None detected</div>
                      ) : (
                        <ul className="space-y-1.5 text-xs">
                          {list.map((item, idx) => (
                            <li
                              key={idx}
                              onClick={() => setSelectedSpan(item)}
                              className="cursor-pointer flex items-center justify-between p-1.5 rounded hover:bg-white/60 dark:hover:bg-slate-800/80 transition-all"
                            >
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {item.text}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400 shrink-0 ml-1">
                                [{item.start_char}:{item.end_char}]
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CAUSAL FLOW & SAFETY RATIONALE */}
      {activeTab === 'CAUSAL_FLOW' && extractionResult && (
        <div className="space-y-6">
          {/* Causal Synthesis Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-xl border border-indigo-900 text-white shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                  extractionResult.causal_flow.risk_level === 'HIGH_PSIF'
                    ? 'bg-rose-500/30 border border-rose-500/50 text-rose-300'
                    : 'bg-amber-500/30 border border-amber-500/50 text-amber-300'
                }`}>
                  {extractionResult.causal_flow.risk_level.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-300">
                  Causal Completeness: <strong>{Math.round(extractionResult.causal_flow.completeness_score * 100)}%</strong>
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Key Failure: <span className="font-semibold text-rose-300">{extractionResult.causal_flow.key_failure_mechanism}</span>
              </div>
            </div>

            <div className="text-base font-medium text-slate-100 leading-relaxed bg-slate-800/60 p-4 rounded-lg border border-slate-700/60">
              "{extractionResult.causal_flow.causal_narrative}"
            </div>
          </div>

          {/* 5-Stage Visual Causal Pipeline */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              5-Stage Precursor Causal Sequence
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {extractionResult.causal_flow.steps.map((step: CausalStepItem, idx: number) => {
                const colors = CATEGORY_COLORS[step.category] || CATEGORY_COLORS.ACTIVITY;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                      step.has_evidence
                        ? `${colors.bg} ${colors.border} shadow-sm`
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-400 uppercase">Step {step.step_id}</span>
                        {step.has_evidence ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Evidenced
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Info className="w-3.5 h-3.5" /> Latent / Unstated
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {step.title}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-snug">
                        {step.summary}
                      </div>
                    </div>

                    {step.detected_entities.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Grounded Entities:</div>
                        <div className="flex flex-wrap gap-1">
                          {step.detected_entities.map((e, eIdx) => (
                            <span
                              key={eIdx}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colors.badge}`}
                            >
                              {e}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suggested Critical Controls */}
          {extractionResult.causal_flow.suggested_critical_controls.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Targeted Critical Barrier Interventions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {extractionResult.causal_flow.suggested_critical_controls.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BIO TAGS & CONLL */}
      {activeTab === 'BIO_TAGS' && bioResult && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                BIO Sequence Representation (CoNLL-2003 Standard)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total Tokens: <strong>{bioResult.total_tokens}</strong> | Entity Tokens: <strong>{bioResult.entity_tokens_count}</strong>
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(bioResult.conll_format)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedBio ? 'Copied CoNLL!' : 'Copy CoNLL Text'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tokens Table */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Token-by-Token Sequence
              </div>
              <div className="max-h-[450px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {bioResult.tokens.map((t, idx) => {
                  const isEntity = t.tag !== 'O';
                  const baseCat = isEntity ? t.tag.substring(2) : '';
                  const colors = isEntity ? (CATEGORY_COLORS[baseCat] || CATEGORY_COLORS.ACTIVITY) : null;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all ${
                        isEntity ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-400 text-[11px] w-6">{idx + 1}</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {t.token}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          [{t.start_char}:{t.end_char}]
                        </span>
                      </div>

                      <div>
                        {isEntity ? (
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${colors?.badge}`}>
                            {t.tag}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded font-mono text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-800">
                            O
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CoNLL Text Box */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                <span>CoNLL-2003 Output</span>
                <span className="text-[10px] text-slate-400 font-normal">Ready for Model Training</span>
              </div>
              <textarea
                readOnly
                rows={18}
                value={bioResult.conll_format}
                className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

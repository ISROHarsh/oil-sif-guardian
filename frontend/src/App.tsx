import React, { useState } from 'react';
import {
  ShieldAlert,
  FilePlus,
  FileSpreadsheet,
  UserCheck,
  ClipboardCheck,
  BarChart3,
  ExternalLink,
  Cpu,
  Layers,
  Activity,
  Network,
  Tag,
  Target,
  Sliders,
  Crosshair,
  AlertOctagon
} from 'lucide-react';
import { ReportIngestion } from './components/ReportIngestion';
import { AIResultView } from './components/AIResultView';
import { BatchIngestionView } from './components/BatchIngestionView';
import { AnnotationBenchmarkView } from './components/AnnotationBenchmarkView';
import { PrecursorClusterView } from './components/PrecursorClusterView';
import { EntityExtractionView } from './components/EntityExtractionView';
import { ModelStudioView } from './components/ModelStudioView';
import { IOGPMultiLabelView } from './components/IOGPMultiLabelView';
import { DeterministicRulesView } from './components/DeterministicRulesView';
import { HSEReviewQueue } from './components/HSEReviewQueue';
import { CorrectiveActionsView } from './components/CorrectiveActionsView';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { ReportResponse } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'intake' | 'batch' | 'annotation' | 'clusters' | 'extraction' | 'models' | 'iogp' | 'rules' | 'queue' | 'actions' | 'analytics'>('intake');
  const [latestReport, setLatestReport] = useState<ReportResponse | null>(null);

  const handleTriageComplete = (report: ReportResponse) => {
    setLatestReport(report);
    setActiveTab('intake');
  };

  const handleSelectReportFromQueue = (report: ReportResponse) => {
    setLatestReport(report);
    setActiveTab('intake');
  };

  const handleSelectReportId = async (reportId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/reports/${reportId}`);
      if (res.ok) {
        const rep = await res.json();
        setLatestReport(rep);
        setActiveTab('intake');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans">
      {/* Top Command Center Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-glow-amber">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white font-heading">
                  OIL-SIF GUARDIAN
                </span>
                <span className="badge badge-iogp text-[10px] py-0.5 px-2">v1.0 PSIF Prioritizer</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <span className="pulse-dot pulse-dot-green" />
                <span>Oil India Limited HSSE Intelligence Platform</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('intake')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'intake'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>Intake & Triage</span>
            </button>

            <button
              onClick={() => setActiveTab('batch')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'batch'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Batch & Quality</span>
            </button>

            <button
              onClick={() => setActiveTab('annotation')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'annotation'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Annotation & Benchmark</span>
            </button>

            <button
              onClick={() => setActiveTab('clusters')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'clusters'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Clusters & Barriers</span>
            </button>

            <button
              onClick={() => setActiveTab('extraction')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'extraction'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Entity NER</span>
            </button>

            <button
              onClick={() => setActiveTab('models')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'models'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Model Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('iogp')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'iogp'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>IOGP Rules</span>
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'rules'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Safety Rules</span>
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'queue'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>HSE Review Queue</span>
            </button>

            <button
              onClick={() => setActiveTab('actions')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'actions'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Corrective Actions</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'analytics'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Precursor Analytics</span>
            </button>
          </nav>

          {/* Right Header Status */}
          <div className="flex items-center gap-3">
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary text-[11px] py-1.5 px-3 flex items-center gap-1.5"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Swagger API</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950 py-2 px-2">
          <button
            onClick={() => setActiveTab('intake')}
            className={`text-xs px-2 py-1 rounded ${activeTab === 'intake' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Intake
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`text-xs px-2 py-1 rounded ${activeTab === 'batch' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Batch
          </button>
          <button
            onClick={() => setActiveTab('annotation')}
            className={`text-xs px-2 py-1 rounded ${activeTab === 'annotation' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Benchmark
          </button>
          <button
            onClick={() => setActiveTab('clusters')}
            className={`text-xs px-2 py-1 rounded ${activeTab === 'clusters' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Clusters
          </button>
          <button
            onClick={() => setActiveTab('extraction')}
            className={`text-xs px-2 py-1 rounded ${activeTab === 'extraction' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            NER
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`text-xs px-2 py-1 rounded ${activeTab === 'models' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Models
          </button>
          <button
            onClick={() => setActiveTab('iogp')}
            className={`text-xs px-2 py-1 rounded ${activeTab === 'iogp' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            IOGP
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`text-xs px-2 py-1 rounded ${activeTab === 'rules' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Rules
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`text-xs px-2 py-1 rounded ${activeTab === 'queue' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Queue
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`text-xs px-2 py-1 rounded ${activeTab === 'actions' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Actions
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`text-xs px-2 py-1 rounded ${activeTab === 'analytics' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Analytics
          </button>
        </div>
      </header>

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'intake' && (
          <div className="space-y-6">
            <ReportIngestion onTriageComplete={handleTriageComplete} />
            {latestReport && (
              <div className="pt-2">
                <AIResultView
                  report={latestReport}
                  onGoToReview={() => setActiveTab('queue')}
                  onGoToAction={() => setActiveTab('actions')}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'batch' && (
          <BatchIngestionView onSelectReportId={handleSelectReportId} />
        )}

        {activeTab === 'annotation' && (
          <AnnotationBenchmarkView />
        )}

        {activeTab === 'clusters' && (
          <PrecursorClusterView />
        )}

        {activeTab === 'extraction' && (
          <EntityExtractionView />
        )}

        {activeTab === 'models' && (
          <ModelStudioView />
        )}

        {activeTab === 'iogp' && (
          <IOGPMultiLabelView />
        )}

        {activeTab === 'rules' && (
          <DeterministicRulesView />
        )}

        {activeTab === 'queue' && (
          <HSEReviewQueue onSelectReport={handleSelectReportFromQueue} />
        )}

        {activeTab === 'actions' && (
          <CorrectiveActionsView />
        )}

        {activeTab === 'analytics' && (
          <ExecutiveDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 font-mono">
          <div className="flex items-center gap-2">
            <span>OIL-SIF Guardian Enterprise Platform</span>
            <span>•</span>
            <span className="text-amber-400">AI recommends. Evidence explains. HSE decides.</span>
          </div>
          <div>Strict Confidentiality • Version Locked to IOGP 9 Life-Saving Rules</div>
        </div>
      </footer>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FilePlus,
  FileSpreadsheet,
  Target,
  Network,
  Tag,
  Sliders,
  AlertOctagon,
  Cpu,
  UserCheck,
  CheckSquare,
  BarChart3,
  Search,
  Bell,
  Settings,
  HelpCircle,
  Calendar,
  ChevronDown,
  Plus,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Zap,
  Layers,
  Crosshair,
  Sun,
  Moon,
  ChevronUp
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
import { HybridDecisionStudioView } from './components/HybridDecisionStudioView';
import { HSEReviewQueue } from './components/HSEReviewQueue';
import { CorrectiveActionsView } from './components/CorrectiveActionsView';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { ReportResponse } from './types';
import { api } from './services/api';

type TabType =
  | 'dashboard'
  | 'intake'
  | 'batch'
  | 'annotation'
  | 'clusters'
  | 'extraction'
  | 'models'
  | 'iogp'
  | 'rules'
  | 'decision'
  | 'queue'
  | 'actions';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [latestReport, setLatestReport] = useState<ReportResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'cosmic' | 'opal'>('cosmic');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    if (theme === 'opal') {
      document.body.classList.add('theme-opal');
    } else {
      document.body.classList.remove('theme-opal');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'cosmic' ? 'opal' : 'cosmic');
  };

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
      const rep = await api.getReport(reportId);
      setLatestReport(rep);
      setActiveTab('intake');
    } catch (e) {
      console.error('Failed to load report:', e);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col font-sans">
      {/* ====================================================================
          Atmospheric Aurora Engine (Ambient Glow Orbs)
          ==================================================================== */}
      <div className="aurora-mesh-container" aria-hidden="true">
        <div className="aurora-orb aurora-orb-cyan" />
        <div className="aurora-orb aurora-orb-purple" />
        <div className="aurora-orb aurora-orb-amber" />
        <div className="aurora-orb aurora-orb-emerald" />
      </div>

      {/* Spatial Precision Grid Overlay */}
      <div className="spatial-grid-overlay" aria-hidden="true" />

      {/* ====================================================================
          Top Glass Navigation Bar
          ==================================================================== */}
      <header className="sticky top-0 z-40 px-4 sm:px-8 py-3.5 border-b border-white/10 backdrop-blur-2xl bg-black/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white font-heading">
                  OIL-SIF GUARDIAN
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                  v1.0 PSIF Prioritizer
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-mono">
                <span className="pulse-dot pulse-dot-green" />
                <span>Oil India Limited • HSSE Intelligence Platform</span>
              </div>
            </div>
          </div>

          {/* Centered Pill Search Input */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search incidents, installations, barrier codes, regulations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tactile-search-input text-xs"
            />
          </div>

          {/* Right Action Cluster: Theme Switcher, Profile, API */}
          <div className="flex items-center gap-3">
            {/* Theme Switcher (Cosmic Aurora / Luxe Opal) */}
            <button
              onClick={toggleTheme}
              className="clay-pill-btn clay-pill-dark text-xs p-2.5 rounded-full"
              title={theme === 'cosmic' ? 'Switch to Luxe Opal Glass (Light)' : 'Switch to Cosmic Aurora Glass (Dark)'}
            >
              {theme === 'cosmic' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setActiveTab('queue')}
              className="clay-pill-btn clay-pill-dark text-xs p-2.5 rounded-full relative"
              title="Audit & Incident Notifications"
            >
              <Bell className="w-4 h-4 text-zinc-300" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>

            {/* Swagger API */}
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition"
              title="Open FastAPI Swagger Documentation"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Swagger API</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Er. Rajesh Baruah"
                className="w-8 h-8 rounded-full border border-white/30 object-cover"
              />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-white leading-tight">
                  Er. Rajesh Baruah
                </div>
                <div className="text-[10px] text-zinc-400 leading-none">
                  Chief Safety Officer
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ====================================================================
          Main Stage Content Area
          ==================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 z-10">
        {activeTab === 'dashboard' && (
          <ExecutiveDashboard
            onNavigateToIntake={() => setActiveTab('intake')}
            onNavigateToQueue={() => setActiveTab('queue')}
            onNavigateToActions={() => setActiveTab('actions')}
            onTriageComplete={handleTriageComplete}
          />
        )}

        {activeTab === 'intake' && (
          <div className="space-y-6 pb-24">
            <ReportIngestion onTriageComplete={handleTriageComplete} />
            {latestReport && (
              <div className="pt-2">
                <AIResultView
                  report={latestReport}
                  onGoToReview={() => setActiveTab('queue')}
                  onGoToAction={() => setActiveTab('actions')}
                  onSelectReportId={handleSelectReportId}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="pb-24">
            <HSEReviewQueue onSelectReport={handleSelectReportFromQueue} />
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="pb-24">
            <CorrectiveActionsView />
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="pb-24">
            <DeterministicRulesView />
          </div>
        )}

        {activeTab === 'clusters' && (
          <div className="pb-24">
            <PrecursorClusterView />
          </div>
        )}

        {activeTab === 'models' && (
          <div className="pb-24">
            <ModelStudioView />
          </div>
        )}

        {activeTab === 'batch' && (
          <div className="pb-24">
            <BatchIngestionView onSelectReportId={handleSelectReportId} />
          </div>
        )}

        {activeTab === 'annotation' && (
          <div className="pb-24">
            <AnnotationBenchmarkView />
          </div>
        )}

        {activeTab === 'extraction' && (
          <div className="pb-24">
            <EntityExtractionView />
          </div>
        )}

        {activeTab === 'decision' && (
          <div className="pb-24">
            <HybridDecisionStudioView />
          </div>
        )}

        {activeTab === 'iogp' && (
          <div className="pb-24">
            <IOGPMultiLabelView />
          </div>
        )}
      </main>

      {/* ====================================================================
          Floating Apple VisionOS-Style Master Glass Dock
          ==================================================================== */}
      <nav className="glass-dock" aria-label="Quick Dock Navigation">
        <button
          onClick={() => { setActiveTab('dashboard'); setShowMoreMenu(false); }}
          className={`glass-dock-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Cockpit</span>
        </button>

        <button
          onClick={() => { setActiveTab('intake'); setShowMoreMenu(false); }}
          className={`glass-dock-item ${activeTab === 'intake' ? 'active' : ''}`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>AI Triage</span>
        </button>

        <button
          onClick={() => { setActiveTab('queue'); setShowMoreMenu(false); }}
          className={`glass-dock-item ${activeTab === 'queue' ? 'active' : ''}`}
        >
          <UserCheck className="w-4 h-4" />
          <span>HSE Review</span>
        </button>

        <button
          onClick={() => { setActiveTab('actions'); setShowMoreMenu(false); }}
          className={`glass-dock-item ${activeTab === 'actions' ? 'active' : ''}`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>CAPA Actions</span>
        </button>

        <button
          onClick={() => { setActiveTab('rules'); setShowMoreMenu(false); }}
          className={`glass-dock-item ${activeTab === 'rules' ? 'active' : ''}`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Safety Rules</span>
        </button>

        {/* More Tools Trigger Popover */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`glass-dock-item ${showMoreMenu ? 'active' : ''}`}
          >
            <Layers className="w-4 h-4" />
            <span>More Views</span>
            <ChevronUp className={`w-3 h-3 transition-transform ${showMoreMenu ? 'rotate-180' : ''}`} />
          </button>

          {showMoreMenu && (
            <div className="absolute bottom-full mb-3 right-0 w-56 p-2 rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/20 shadow-2xl space-y-1 z-50 animate-fadeIn">
              <button
                onClick={() => { setActiveTab('clusters'); setShowMoreMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
              >
                <Network className="w-4 h-4 text-cyan-400" />
                <span>Precursor Clusters</span>
              </button>

              <button
                onClick={() => { setActiveTab('batch'); setShowMoreMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Batch Processing</span>
              </button>

              <button
                onClick={() => { setActiveTab('models'); setShowMoreMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
              >
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Model Studio</span>
              </button>

              <button
                onClick={() => { setActiveTab('extraction'); setShowMoreMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
              >
                <Tag className="w-4 h-4 text-amber-400" />
                <span>Entity Extraction (NER)</span>
              </button>

              <button
                onClick={() => { setActiveTab('annotation'); setShowMoreMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
              >
                <Target className="w-4 h-4 text-rose-400" />
                <span>Annotation Benchmark</span>
              </button>

              <button
                onClick={() => { setActiveTab('decision'); setShowMoreMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
              >
                <Cpu className="w-4 h-4 text-blue-400" />
                <span>Hybrid Decision Studio</span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

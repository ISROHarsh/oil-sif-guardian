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
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Zap,
  Layers,
  Sun,
  Moon,
  Menu,
  X,
  FileText,
  TrendingUp,
  Shield,
  Plus
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
  | 'queue'
  | 'actions'
  | 'rules'
  | 'clusters'
  | 'models'
  | 'batch'
  | 'annotation'
  | 'extraction'
  | 'decision'
  | 'iogp';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [latestReport, setLatestReport] = useState<ReportResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light'); // Default to clean light enterprise theme matching NEXA & Insights
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-200">
      {/* ====================================================================
          1. ENTERPRISE LEFT SIDEBAR (Direct 1:1 with NEXA Reference 4)
          ==================================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Brand Logo & Title Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
            <div
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition">
                <ShieldAlert className="w-4 h-4 text-amber-400 dark:text-amber-500" />
              </div>
              <div>
                <div className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white font-display leading-tight">
                  OIL GUARDIAN
                </div>
                <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                  Enterprise HSSE Suite
                </div>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links Grouped Logically (NEXA Style) */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
            {/* Group 1: OVERVIEW */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
                Overview
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'dashboard'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => { setActiveTab('intake'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'intake'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${activeTab === 'intake' ? 'text-amber-500' : 'text-slate-400'}`} />
                  <span>Incident Triage</span>
                </button>
              </div>
            </div>

            {/* Group 2: OPERATIONS & HITL */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
                Operations & HITL
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveTab('queue'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'queue'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UserCheck className={`w-4 h-4 ${activeTab === 'queue' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                    <span>HSE Review Queue</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    3
                  </span>
                </button>

                <button
                  onClick={() => { setActiveTab('actions'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'actions'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900'
                  }`}
                >
                  <CheckSquare className={`w-4 h-4 ${activeTab === 'actions' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  <span>Corrective Actions</span>
                </button>
              </div>
            </div>

            {/* Group 3: HSSE GOVERNANCE */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
                HSSE Governance
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveTab('rules'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'rules'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900'
                  }`}
                >
                  <AlertOctagon className={`w-4 h-4 ${activeTab === 'rules' ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                  <span>Statutory Rules</span>
                </button>

                <button
                  onClick={() => { setActiveTab('clusters'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'clusters'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900'
                  }`}
                >
                  <Network className={`w-4 h-4 ${activeTab === 'clusters' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`} />
                  <span>Precursor Clusters</span>
                </button>
              </div>
            </div>

            {/* Group 4: ADVANCED AI & SYSTEM */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
                System & AI
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveTab('models'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'models'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900'
                  }`}
                >
                  <Sliders className={`w-4 h-4 ${activeTab === 'models' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                  <span>Model Studio</span>
                </button>

                <button
                  onClick={() => { setActiveTab('batch'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'batch'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className={`w-4 h-4 ${activeTab === 'batch' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  <span>Batch Ingestion</span>
                </button>

                <button
                  onClick={() => { setActiveTab('extraction'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'extraction'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900'
                  }`}
                >
                  <Tag className={`w-4 h-4 ${activeTab === 'extraction' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                  <span>Entity Extraction</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom User Profile Section */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Er. Rajesh Baruah"
                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  Er. Rajesh Baruah
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  Chief Safety Officer
                </div>
              </div>

              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noreferrer"
                title="FastAPI Swagger Reference"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                <Cpu className="w-4 h-4 text-amber-500" />
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* ====================================================================
          2. MAIN STAGE WRAPPER (Offset by sidebar width on desktop)
          ==================================================================== */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm md:text-base text-slate-900 dark:text-white tracking-tight capitalize">
                  {activeTab}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hidden sm:inline-block">
                  Upper Assam Operations
                </span>
              </div>
            </div>
          </div>

          {/* Search & Actions Bar */}
          <div className="flex items-center gap-3">
            {/* Search Pill */}
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search incidents, rigs, equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            {/* Theme Switcher Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Notifications Button */}
            <button
              onClick={() => setActiveTab('queue')}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>

            {/* Primary Action Button */}
            <button
              onClick={() => setActiveTab('intake')}
              className="hidden sm:inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Incident</span>
            </button>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <ExecutiveDashboard
              onNavigateToIntake={() => setActiveTab('intake')}
              onNavigateToQueue={() => setActiveTab('queue')}
              onNavigateToActions={() => setActiveTab('actions')}
              onTriageComplete={handleTriageComplete}
            />
          )}

          {activeTab === 'intake' && (
            <div className="space-y-6">
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
            <HSEReviewQueue onSelectReport={handleSelectReportFromQueue} />
          )}

          {activeTab === 'actions' && <CorrectiveActionsView />}

          {activeTab === 'rules' && <DeterministicRulesView />}

          {activeTab === 'clusters' && <PrecursorClusterView />}

          {activeTab === 'models' && <ModelStudioView />}

          {activeTab === 'batch' && (
            <BatchIngestionView onSelectReportId={handleSelectReportId} />
          )}

          {activeTab === 'annotation' && <AnnotationBenchmarkView />}

          {activeTab === 'extraction' && <EntityExtractionView />}

          {activeTab === 'decision' && <HybridDecisionStudioView />}

          {activeTab === 'iogp' && <IOGPMultiLabelView />}
        </main>
      </div>
    </div>
  );
};

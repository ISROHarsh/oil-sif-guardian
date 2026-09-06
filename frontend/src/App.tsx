import React, { useState } from 'react';
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
  Layers,
  Crosshair,
  Filter
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
  | 'actions'
  | 'analytics';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [latestReport, setLatestReport] = useState<ReportResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

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
    <div className="planex-shell">
      {/* Floating Left Icon Rail (1:1 Planex Aesthetic) */}
      <aside className="planex-sidebar-rail" aria-label="Sidebar Navigation">
        {/* Top Logo Glyph */}
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="w-10 h-10 rounded-2xl bg-[#18181B] text-white flex items-center justify-center hover:bg-[#27272A] transition shadow-sm"
            title="Planex / OIL HSSE Dashboard"
          >
            {/* Diamond Star / Glyph matching reference image */}
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
          </button>

          {/* Primary Navigation Icons */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`planex-rail-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              title="Cockpit Overview"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('intake')}
              className={`planex-rail-btn ${activeTab === 'intake' ? 'active' : ''}`}
              title="Intake & Rapid Triage"
            >
              <FilePlus className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('batch')}
              className={`planex-rail-btn ${activeTab === 'batch' ? 'active' : ''}`}
              title="Batch Ingestion & Quality"
            >
              <FileSpreadsheet className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`planex-rail-btn ${activeTab === 'queue' ? 'active' : ''}`}
              title="HSE Review Queue"
            >
              <UserCheck className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('actions')}
              className={`planex-rail-btn ${activeTab === 'actions' ? 'active' : ''}`}
              title="Corrective Actions (CAPA)"
            >
              <CheckSquare className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('clusters')}
              className={`planex-rail-btn ${activeTab === 'clusters' ? 'active' : ''}`}
              title="Precursor Clusters & Barriers"
            >
              <Network className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('models')}
              className={`planex-rail-btn ${activeTab === 'models' ? 'active' : ''}`}
              title="Model Studio & Benchmarks"
            >
              <Sliders className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`planex-rail-btn ${activeTab === 'rules' ? 'active' : ''}`}
              title="Deterministic Safety Rules (Rule 2)"
            >
              <AlertOctagon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bottom Rail Icons */}
        <div className="flex flex-col items-center gap-2">
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="planex-rail-btn"
            title="FastAPI Swagger Documentation"
          >
            <Settings className="w-5 h-5" />
          </a>

          <button
            onClick={() => setActiveTab('decision')}
            className="planex-rail-btn"
            title="System Diagnostics & Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Planex Main Stage */}
      <main className="planex-stage">
        {/* Top App Bar (1:1 Planex Style) */}
        <header className="planex-topbar">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <svg
              className="w-5 h-5 text-[#18181B]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
            <span className="font-extrabold text-xl tracking-tight text-[#18181B] font-heading">
              Planex
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#18181B] text-white hidden sm:inline-block">
              OIL HSSE
            </span>
          </div>

          {/* Centered Pill Search Input */}
          <div className="planex-search-container">
            <Search className="planex-search-icon w-4 h-4" />
            <input
              type="text"
              placeholder="Search projects, tasks, members.."
              className="planex-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Right User & Actions Capsule */}
          <div className="flex items-center gap-3">
            {/* User Profile Capsule */}
            <div
              className="planex-profile-capsule"
              onClick={() => setActiveTab('dashboard')}
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Roger Hummer"
                className="planex-avatar"
              />
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-[#18181B] leading-tight">
                  Roger Hummer
                </div>
                <div className="text-[11px] text-[#71717A] font-medium leading-none">
                  Ops Manager
                </div>
              </div>
            </div>

            {/* Notification Bell Button */}
            <button
              className="planex-icon-circle-btn relative"
              title="Audit & Incident Alerts"
              onClick={() => setActiveTab('queue')}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#EF4444] border-2 border-white" />
            </button>

            {/* Quick Settings Button */}
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="planex-icon-circle-btn"
              title="FastAPI Swagger API Reference"
            >
              <Settings className="w-4 h-4" />
            </a>
          </div>
        </header>

        {/* Hero Greeting Section (1:1 Planex Style) */}
        <section className="planex-hero">
          <div>
            <h1 className="planex-hero-title">
              Welcome back, Roger <span>👋</span>
            </h1>
            <p className="planex-hero-subtitle">
              Here's a quick overview of your workspace today.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Date Pill */}
            <button className="planex-btn-white">
              <Calendar className="w-3.5 h-3.5 text-[#71717A]" />
              <span>Today</span>
              <ChevronDown className="w-3 h-3 text-[#A1A1AA]" />
            </button>

            {/* Timeframe Toggle Pills */}
            <div className="planex-pill-group">
              <button
                onClick={() => setTimeframe('daily')}
                className={`planex-pill-tab ${timeframe === 'daily' ? 'active' : ''}`}
              >
                Daily
              </button>
              <button
                onClick={() => setTimeframe('weekly')}
                className={`planex-pill-tab ${timeframe === 'weekly' ? 'active' : ''}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimeframe('monthly')}
                className={`planex-pill-tab ${timeframe === 'monthly' ? 'active' : ''}`}
              >
                Monthly
              </button>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => setActiveTab('intake')}
              className="planex-btn-black"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Project</span>
            </button>
          </div>
        </section>

        {/* Secondary Sub-navigation Bar for Complete Feature Access */}
        <nav className="planex-subnav-bar" aria-label="Feature Views">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`planex-subnav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Executive Cockpit</span>
          </button>

          <button
            onClick={() => setActiveTab('intake')}
            className={`planex-subnav-item ${activeTab === 'intake' ? 'active' : ''}`}
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>Intake & Triage</span>
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`planex-subnav-item ${activeTab === 'batch' ? 'active' : ''}`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Batch Processing</span>
          </button>

          <button
            onClick={() => setActiveTab('annotation')}
            className={`planex-subnav-item ${activeTab === 'annotation' ? 'active' : ''}`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Benchmark & Ground Truth</span>
          </button>

          <button
            onClick={() => setActiveTab('clusters')}
            className={`planex-subnav-item ${activeTab === 'clusters' ? 'active' : ''}`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Clusters & Barriers</span>
          </button>

          <button
            onClick={() => setActiveTab('extraction')}
            className={`planex-subnav-item ${activeTab === 'extraction' ? 'active' : ''}`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Entity NER</span>
          </button>

          <button
            onClick={() => setActiveTab('models')}
            className={`planex-subnav-item ${activeTab === 'models' ? 'active' : ''}`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Model Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('iogp')}
            className={`planex-subnav-item ${activeTab === 'iogp' ? 'active' : ''}`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>IOGP Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`planex-subnav-item ${activeTab === 'rules' ? 'active' : ''}`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Safety Guardrails</span>
          </button>

          <button
            onClick={() => setActiveTab('decision')}
            className={`planex-subnav-item ${activeTab === 'decision' ? 'active' : ''}`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Decision Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`planex-subnav-item ${activeTab === 'queue' ? 'active' : ''}`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>HSE Review Queue</span>
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className={`planex-subnav-item ${activeTab === 'actions' ? 'active' : ''}`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Corrective Actions</span>
          </button>
        </nav>

        {/* Dynamic View Body */}
        <div className="w-full">
          {activeTab === 'dashboard' && (
            <ExecutiveDashboard
              onNavigateToIntake={() => setActiveTab('intake')}
              onNavigateToQueue={() => setActiveTab('queue')}
              onNavigateToActions={() => setActiveTab('actions')}
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

          {activeTab === 'batch' && (
            <BatchIngestionView onSelectReportId={handleSelectReportId} />
          )}

          {activeTab === 'annotation' && <AnnotationBenchmarkView />}

          {activeTab === 'clusters' && <PrecursorClusterView />}

          {activeTab === 'extraction' && <EntityExtractionView />}

          {activeTab === 'models' && <ModelStudioView />}

          {activeTab === 'iogp' && <IOGPMultiLabelView />}

          {activeTab === 'rules' && <DeterministicRulesView />}

          {activeTab === 'decision' && <HybridDecisionStudioView />}

          {activeTab === 'queue' && (
            <HSEReviewQueue onSelectReport={handleSelectReportFromQueue} />
          )}

          {activeTab === 'actions' && <CorrectiveActionsView />}

          {activeTab === 'analytics' && (
            <ExecutiveDashboard
              onNavigateToIntake={() => setActiveTab('intake')}
              onNavigateToQueue={() => setActiveTab('queue')}
              onNavigateToActions={() => setActiveTab('actions')}
            />
          )}
        </div>

        {/* Minimalist Discreet Footer */}
        <footer className="pt-6 pb-2 border-t border-[#E4E1DA] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8E8A83] gap-2 font-medium">
          <div className="flex items-center gap-2">
            <span>OIL-SIF Guardian Enterprise Platform</span>
            <span>•</span>
            <span>AI recommends. Evidence explains. HSE decides.</span>
          </div>
          <div>Strict Statutory Compliance • OISD-105 • DGMS OMR 2017</div>
        </footer>
      </main>
    </div>
  );
};

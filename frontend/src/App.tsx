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
  Sun,
  Moon,
  Menu,
  X,
  FileText,
  TrendingUp,
  Shield,
  Plus,
  BookOpen
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
import { RAGSafetyAssistantView } from './components/RAGSafetyAssistantView';
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
  | 'iogp'
  | 'rag';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [latestReport, setLatestReport] = useState<ReportResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
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
    <div className="app-shell">
      {/* ====================================================================
          1. FIXED LEFT ENTERPRISE SIDEBAR (1:1 with NEXA Reference 4)
          ==================================================================== */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header Brand */}
          <div className="sidebar-header">
            <div
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                <ShieldAlert style={{ width: '18px', height: '18px', color: '#F59E0B' }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  OIL GUARDIAN
                </div>
                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Enterprise HSSE Suite
                </div>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="icon-btn"
              style={{ display: window.innerWidth > 768 ? 'none' : 'flex' }}
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
          </div>

          {/* Grouped Sidebar Menu Items */}
          <div className="sidebar-menu">
            {/* OVERVIEW */}
            <div className="sidebar-group-title">Overview</div>
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <div className="sidebar-item-left">
                <LayoutDashboard style={{ width: '16px', height: '16px' }} />
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('intake'); setMobileMenuOpen(false); }}
              className={`sidebar-item ${activeTab === 'intake' ? 'active' : ''}`}
            >
              <div className="sidebar-item-left">
                <Zap style={{ width: '16px', height: '16px', color: '#F59E0B' }} />
                <span>Incident Triage</span>
              </div>
            </button>

            {/* OPERATIONS & HITL */}
            <div className="sidebar-group-title">Operations & HITL</div>
            <button
              onClick={() => { setActiveTab('queue'); setMobileMenuOpen(false); }}
              className={`sidebar-item ${activeTab === 'queue' ? 'active' : ''}`}
            >
              <div className="sidebar-item-left">
                <UserCheck style={{ width: '16px', height: '16px' }} />
                <span>HSE Review Queue</span>
              </div>
              <span className="sidebar-badge">3</span>
            </button>

            <button
              onClick={() => { setActiveTab('actions'); setMobileMenuOpen(false); }}
              className={`sidebar-item ${activeTab === 'actions' ? 'active' : ''}`}
            >
              <div className="sidebar-item-left">
                <CheckSquare style={{ width: '16px', height: '16px' }} />
                <span>Corrective Actions</span>
              </div>
            </button>

            {/* HSSE GOVERNANCE */}
            <div className="sidebar-group-title">HSSE Governance</div>
            <button
              onClick={() => { setActiveTab('rules'); setMobileMenuOpen(false); }}
              className={`sidebar-item ${activeTab === 'rules' ? 'active' : ''}`}
            >
              <div className="sidebar-item-left">
                <AlertOctagon style={{ width: '16px', height: '16px', color: '#EF4444' }} />
                <span>Statutory Rules</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('clusters'); setMobileMenuOpen(false); }}
              className={`sidebar-item ${activeTab === 'clusters' ? 'active' : ''}`}
            >
              <div className="sidebar-item-left">
                <Network style={{ width: '16px', height: '16px', color: '#06B6D4' }} />
                <span>Precursor Clusters</span>
              </div>
            </button>

            {/* ADVANCED AI & SYSTEM */}
            <div className="sidebar-group-title">Advanced AI & System</div>
            <button
              onClick={() => { setActiveTab('models'); setMobileMenuOpen(false); }}
              className={`sidebar-item ${activeTab === 'models' ? 'active' : ''}`}
            >
              <div className="sidebar-item-left">
                <Sliders style={{ width: '16px', height: '16px', color: '#8B5CF6' }} />
                <span>Model Studio</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('batch'); setMobileMenuOpen(false); }}
              className={`sidebar-item ${activeTab === 'batch' ? 'active' : ''}`}
            >
              <div className="sidebar-item-left">
                <FileSpreadsheet style={{ width: '16px', height: '16px', color: '#10B981' }} />
                <span>Batch Ingestion</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('extraction'); setMobileMenuOpen(false); }}
              className={`sidebar-item ${activeTab === 'extraction' ? 'active' : ''}`}
            >
              <div className="sidebar-item-left">
                <Tag style={{ width: '16px', height: '16px', color: '#F59E0B' }} />
                <span>Entity Extraction (NER)</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('rag'); setMobileMenuOpen(false); }}
              className={`sidebar-item ${activeTab === 'rag' ? 'active' : ''}`}
            >
              <div className="sidebar-item-left">
                <BookOpen style={{ width: '16px', height: '16px', color: '#06B6D4' }} />
                <span>Standards RAG (Phase 21)</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('annotation'); setMobileMenuOpen(false); }}
              className={`sidebar-item ${activeTab === 'annotation' ? 'active' : ''}`}
            >
              <div className="sidebar-item-left">
                <Target style={{ width: '16px', height: '16px', color: '#10B981' }} />
                <span>Active Learning & Benchmark</span>
              </div>
            </button>
          </div>

          {/* User Profile Footer */}
          <div className="sidebar-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Er. Rajesh Baruah"
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  Er. Rajesh Baruah
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  Chief Safety Officer
                </div>
              </div>
            </div>

            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              title="FastAPI Swagger Reference"
              className="icon-btn"
            >
              <Cpu style={{ width: '16px', height: '16px', color: '#F59E0B' }} />
            </a>
          </div>
        </div>
      </aside>

      {/* ====================================================================
          2. MAIN STAGE WRAPPER
          ==================================================================== */}
      <div className="main-stage">
        {/* Sticky Top Header */}
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="icon-btn"
              style={{ display: window.innerWidth > 768 ? 'none' : 'flex' }}
            >
              <Menu style={{ width: '18px', height: '18px' }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, textTransform: 'capitalize' }}>
                {activeTab}
              </span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  backgroundColor: 'var(--sidebar-active)',
                  color: 'var(--accent-blue)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                }}
              >
                Upper Assam Basin
              </span>
            </div>
          </div>

          <div className="header-actions">
            {/* Search Pill */}
            <div className="search-pill-box">
              <Search
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '14px',
                  height: '14px',
                  color: 'var(--text-dim)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search incidents, rigs, barrier tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-pill-input"
              />
            </div>

            {/* Theme Switcher Toggle */}
            <button
              onClick={toggleTheme}
              className="icon-btn"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                <Moon style={{ width: '16px', height: '16px' }} />
              ) : (
                <Sun style={{ width: '16px', height: '16px', color: '#F59E0B' }} />
              )}
            </button>

            {/* Notifications Button */}
            <button
              onClick={() => setActiveTab('queue')}
              className="icon-btn"
              title="Audit & Incident Alerts"
              style={{ position: 'relative' }}
            >
              <Bell style={{ width: '16px', height: '16px' }} />
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '7px',
                  height: '7px',
                  backgroundColor: '#EF4444',
                  borderRadius: '50%',
                }}
              />
            </button>

            {/* Primary Action Button */}
            <button
              onClick={() => setActiveTab('intake')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                padding: '8px 14px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Plus style={{ width: '14px', height: '14px' }} />
              <span>New Incident</span>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="content-viewport">
          {activeTab === 'dashboard' && (
            <ExecutiveDashboard
              onNavigateToIntake={() => setActiveTab('intake')}
              onNavigateToQueue={() => setActiveTab('queue')}
              onNavigateToActions={() => setActiveTab('actions')}
              onTriageComplete={handleTriageComplete}
            />
          )}

          {activeTab === 'intake' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <ReportIngestion onTriageComplete={handleTriageComplete} />
              {latestReport && (
                <AIResultView
                  report={latestReport}
                  onGoToReview={() => setActiveTab('queue')}
                  onGoToAction={() => setActiveTab('actions')}
                  onSelectReportId={handleSelectReportId}
                />
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

          {activeTab === 'rag' && <RAGSafetyAssistantView />}
        </main>
      </div>
    </div>
  );
};

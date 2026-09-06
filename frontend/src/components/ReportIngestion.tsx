import React, { useState } from 'react';
import { Send, Sparkles, FileText, AlertTriangle, ShieldCheck, RefreshCw, Layers } from 'lucide-react';
import { api } from '../services/api';
import { ReportResponse } from '../types';

interface ReportIngestionProps {
  onTriageComplete: (report: ReportResponse) => void;
}

const DEMO_PRESETS = [
  {
    label: 'Tank Confined Space (High-PSIF)',
    site: 'Duliajan Production Installation',
    location: 'Separator Station #4',
    department: 'Mechanical Maintenance',
    activity: 'Separator Vessel Inspection',
    equipment: 'Gas Separator V-102',
    reporter_role: 'Lead Operator',
    narrative:
      'During maintenance, a contractor entered the tank to inspect an internal valve. Gas testing was not recorded, the entry permit had expired, and no attendant was positioned outside.',
  },
  {
    label: 'Live Gas Flange Bleed (Energy Isolation)',
    site: 'Moran Gathering Station',
    location: 'Manifold Skid B',
    department: 'Pipeline Operations',
    activity: 'Flange Unbolting',
    equipment: 'Main Gathering Line 12-inch',
    reporter_role: 'Maintenance Fitter',
    narrative:
      'Mechanical technician attempted to unbolt a pressurized gas line flange before closing isolation block valves. Stored energy was present without LOTO verification.',
  },
  {
    label: 'Crane Drop Zone Breach (Line of Fire)',
    site: 'Drilling Rig OIL-45',
    location: 'Drill Floor / Catwalk',
    department: 'Drilling Services',
    activity: 'Tubular Handling',
    equipment: 'Hydraulic Rig Crane #2',
    reporter_role: 'Assistant Driller',
    narrative:
      'During rig operations, a roustabout was walking underneath the suspended load while the crane was slewing a 3-ton casing joint across the drill floor.',
  },
  {
    label: 'Routine Housekeeping (Low SIF)',
    site: 'Digboi Central Store',
    location: 'Warehouse Bay 3',
    department: 'Materials Management',
    activity: 'Housekeeping',
    equipment: 'Wooden Storage Pallets',
    reporter_role: 'Warehouse Helper',
    narrative:
      'Warehouse helper noticed five empty wooden shipping pallets stacked unevenly behind store room and restacked them neatly against the exterior wall.',
  },
];

export const ReportIngestion: React.FC<ReportIngestionProps> = ({ onTriageComplete }) => {
  const [site, setSite] = useState(DEMO_PRESETS[0].site);
  const [location, setLocation] = useState(DEMO_PRESETS[0].location);
  const [department, setDepartment] = useState(DEMO_PRESETS[0].department);
  const [activity, setActivity] = useState(DEMO_PRESETS[0].activity);
  const [equipment, setEquipment] = useState(DEMO_PRESETS[0].equipment);
  const [reporterRole, setReporterRole] = useState(DEMO_PRESETS[0].reporter_role);
  const [narrative, setNarrative] = useState(DEMO_PRESETS[0].narrative);
  const [reportType, setReportType] = useState('near_miss');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePresetSelect = (preset: typeof DEMO_PRESETS[0]) => {
    setSite(preset.site);
    setLocation(preset.location);
    setDepartment(preset.department);
    setActivity(preset.activity);
    setEquipment(preset.equipment);
    setReporterRole(preset.reporter_role);
    setNarrative(preset.narrative);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrative.trim() || narrative.length < 10) {
      setError('Please enter a detailed safety narrative (minimum 10 characters).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.submitReport({
        site,
        location,
        department,
        activity,
        equipment: equipment ? [equipment] : [],
        reporter_role: reporterRole,
        narrative,
        report_type: reportType,
      });

      onTriageComplete(result);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Preset Scenario Selector Banner */}
      <div
        className="card-panel"
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(37, 99, 235, 0.02) 100%)',
          borderColor: 'rgba(245, 158, 11, 0.25)',
          padding: '20px 24px',
          marginBottom: '0px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles style={{ width: '18px', height: '18px', color: '#D97706' }} />
            <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#D97706' }}>
              Canonical SIF Test Scenarios
            </span>
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Select to pre-populate verified industrial test narratives
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
          {DEMO_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetSelect(p)}
              style={{
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: narrative === p.narrative ? '#0F172A' : 'var(--bg-surface)',
                color: narrative === p.narrative ? '#FFFFFF' : 'var(--text-primary)',
                border: narrative === p.narrative ? '1px solid #0F172A' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700 }}>
                {p.label}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: narrative === p.narrative ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                  marginTop: '4px',
                }}
              >
                {p.site}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Ingestion Form */}
      <form onSubmit={handleSubmit} className="card-panel" style={{ marginBottom: '0px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '18px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText style={{ width: '20px', height: '20px', color: '#2563EB' }} />
              HSSE Incident & Precursor Intake
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Submit operational narratives for multi-label SIF classification and statutory compliance verification.
            </p>
          </div>
          <span className="pill-status pill-blue">
            Rule 2 Shield Active
          </span>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', color: '#DC2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label">Operational Asset / Site *</label>
            <input
              type="text"
              className="form-input"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location / Platform Area</label>
            <input
              type="text"
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Report Category</label>
            <select
              className="form-select"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="near_miss">Near Miss</option>
              <option value="unsafe_act">Unsafe Act</option>
              <option value="unsafe_condition">Unsafe Condition</option>
              <option value="incident">Incident</option>
              <option value="hazard_observation">Hazard Observation</option>
            </select>
          </div>
        </div>

        {/* Form Fields Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label">Operational Activity</label>
            <input
              type="text"
              className="form-input"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="e.g. Tank Maintenance, Wireline, Lifting"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Equipment Involved</label>
            <input
              type="text"
              className="form-input"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="e.g. Separator V-102, Crane, Mud Pump"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reporter Role</label>
            <input
              type="text"
              className="form-input"
              value={reporterRole}
              onChange={(e) => setReporterRole(e.target.value)}
              placeholder="e.g. Lead Operator, HSE Officer"
            />
          </div>
        </div>

        {/* Free-text Narrative Area */}
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Safety Incident Free-Text Narrative *</label>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              PII automatically masked • Immutable audit trail
            </span>
          </div>
          <textarea
            rows={5}
            className="form-textarea"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6 }}
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="Describe what occurred, personnel positioning, energy sources, barriers present, and control failures..."
            required
          />
        </div>

        {/* Submit Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <ShieldCheck style={{ width: '16px', height: '16px', color: '#10B981' }} />
            <span>Adheres to OIL Canonical Safety Schema & IOGP Rule Taxonomy</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ padding: '10px 24px' }}
          >
            {loading ? (
              <>
                <RefreshCw style={{ width: '15px', height: '15px' }} className="animate-spin" />
                <span>Running Hybrid AI Triage...</span>
              </>
            ) : (
              <>
                <Send style={{ width: '15px', height: '15px' }} />
                <span>Analyze Incident Precursor</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

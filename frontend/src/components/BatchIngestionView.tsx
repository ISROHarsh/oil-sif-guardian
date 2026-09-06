import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Sparkles,
  RefreshCw,
  Search,
  Layers,
  Award,
  BarChart2,
  FileText
} from 'lucide-react';
import { BatchIngestResponse, DataQualitySummary, BatchIngestItemResult } from '../types';

interface BatchIngestionViewProps {
  onSelectReportId?: (reportId: string) => void;
}

export const BatchIngestionView: React.FC<BatchIngestionViewProps> = ({ onSelectReportId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchIngestResponse | null>(null);
  const [qualitySummary, setQualitySummary] = useState<DataQualitySummary | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterGrade, setFilterGrade] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const apiBase = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1';

  const fetchQualitySummary = async () => {
    try {
      const res = await fetch(`${apiBase}/reports/quality-summary`);
      if (res.ok) {
        const data = await res.json();
        setQualitySummary(data);
      }
    } catch (err) {
      console.error('Failed to fetch quality summary', err);
    }
  };

  useEffect(() => {
    fetchQualitySummary();
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.txt')) {
        setFile(droppedFile);
        setErrorMessage(null);
      } else {
        setErrorMessage('Only .csv or plain text tabular files are accepted.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${apiBase}/reports/upload-csv`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to upload and parse CSV dataset');
      }

      const result: BatchIngestResponse = await response.json();
      setBatchResult(result);
      fetchQualitySummary();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred during CSV batch ingestion.');
    } finally {
      setIsUploading(false);
    }
  };

  const loadSampleCuratedDataset = async () => {
    setIsUploading(true);
    setErrorMessage(null);
    try {
      // Simulate quick batch import with sample curated reports
      const response = await fetch('http://localhost:8000/api/v1/reports/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reports: [
            {
              report_type: 'near_miss',
              site: 'Duliajan Production Installation',
              location: 'Separator Station #4',
              department: 'Mechanical Maintenance',
              activity: 'Separator Vessel Inspection',
              equipment: ['Gas Separator V-102'],
              reporter_role: 'Lead Operator',
              narrative: 'During maintenance, a contractor entered the tank to inspect an internal valve. Gas testing was not recorded, the entry permit had expired, and no attendant was positioned outside.'
            },
            {
              report_type: 'near_miss',
              site: 'Moran Gathering Station',
              location: 'Manifold Skid B',
              department: 'Pipeline Operations',
              activity: 'Flange Unbolting',
              equipment: ['Main Gathering Line 12-inch'],
              reporter_role: 'Maintenance Fitter',
              narrative: 'Mechanical technician attempted to unbolt a pressurized gas line flange before closing isolation block valves. Stored energy was present without LOTO verification.'
            },
            {
              report_type: 'unsafe_act',
              site: 'Drilling Rig OIL-45',
              location: 'Drill Floor / Catwalk',
              department: 'Drilling Services',
              activity: 'Tubular Handling',
              equipment: ['Hydraulic Rig Crane #2'],
              reporter_role: 'Assistant Driller',
              narrative: 'During rig operations, a roustabout was walking underneath the suspended load while the crane was slewing a 3-ton casing joint across the drill floor.'
            },
            {
              report_type: 'unsafe_condition',
              site: 'Naharkatiya Wellhead Cluster',
              location: 'Well NHK-204',
              department: 'Workover Operations',
              activity: 'Xmas Tree Servicing',
              equipment: ['Wellhead Xmas Tree'],
              reporter_role: 'Rig Supervisor',
              narrative: 'Discovered casing valve needle valve sheared off with 1200 psi shut-in casing pressure. Wireline grease injector unit was operating nearby without barrier.'
            },
            {
              report_type: 'near_miss',
              site: 'Tinsukia Crude Pump Station',
              location: 'Pump House East',
              department: 'Electrical Engineering',
              activity: 'Motor Control Center (MCC)',
              equipment: ['415V Switchgear Panel'],
              reporter_role: 'Senior Electrician',
              narrative: 'Electrician opened 415V MCC panel door with live busbars exposed while wearing cotton gloves. No arc flash PPE or calibrated multimeter voltage check performed.'
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to load sample dataset');
      }

      const resData = await response.json();
      setBatchResult(resData);
      fetchQualitySummary();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load sample dataset.');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredItems = (batchResult?.items || []).filter((item) => {
    if (filterPriority !== 'ALL' && item.priority !== filterPriority) return false;
    if (filterGrade !== 'ALL' && item.quality_grade !== filterGrade) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = item.report_id?.toLowerCase().includes(q);
      const matchRule = item.primary_rule?.toLowerCase().includes(q);
      const matchStatus = item.status.toLowerCase().includes(q);
      if (!matchId && !matchRule && !matchStatus) return false;
    }
    return true;
  });

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'B':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'C':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'D':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-amber-400" />
            <span>Dataset Ingestion, Normalization & Quality Audit</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Batch-ingest legacy HSSE spreadsheets, expand oilfield abbreviations, redact PII, score narrative richness, and detect duplicate submissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSampleCuratedDataset}
            disabled={isUploading}
            className="btn btn-secondary text-xs flex items-center gap-1.5 py-2 px-3 hover:border-amber-500/40"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Curated Sample (5 Incidents)</span>
          </button>
          <button
            onClick={fetchQualitySummary}
            className="btn btn-secondary text-xs flex items-center gap-1.5 py-2 px-3"
            title="Refresh analytics"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Global Data Quality Summary Dashboard */}
      {qualitySummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Ingested Reports</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">{qualitySummary.total_reports}</span>
              <span className="text-xs text-slate-400">records</span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Full Historical Corpus</span>
            </div>
          </div>

          <div className="card p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Average Quality Score</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-400 font-mono">
                {qualitySummary.average_quality_score}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <div className="mt-3 flex items-center gap-1">
              <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                  style={{ width: `${Math.min(100, qualitySummary.average_quality_score)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="card p-4 col-span-1 md:col-span-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2 block">
              Quality Grade Distribution
            </span>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {['A', 'B', 'C', 'D', 'F'].map((grade) => (
                <div
                  key={grade}
                  className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-center ${getGradeBadge(grade)}`}
                >
                  <span className="text-xs font-bold">Grade {grade}</span>
                  <span className="text-lg font-mono font-extrabold mt-0.5">
                    {qualitySummary.grade_distribution[grade] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CSV Upload Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`card p-6 border-2 border-dashed transition flex flex-col items-center justify-center text-center ${
          isDragOver ? 'border-amber-500 bg-amber-500/5' : 'border-slate-700/80 hover:border-slate-600'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3 text-amber-400">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-white">Upload Incident Dataset (.CSV)</h3>
        <p className="text-xs text-slate-400 max-w-md mt-1">
          Drag and drop your HSSE incident spreadsheet here, or click to browse. Automatically matches field aliases, expands domain acronyms, and redacts PII.
        </p>

        <label className="mt-4 inline-flex items-center gap-2 cursor-pointer btn btn-secondary text-xs px-4 py-2">
          <span>Choose File</span>
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {file && (
          <div className="mt-4 flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700">
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-200 font-mono">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="btn btn-primary text-xs py-1 px-3 ml-2 flex items-center gap-1"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Execute Batch Ingestion</span>
              )}
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mt-3 text-xs text-rose-400 flex items-center gap-1.5 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Batch Processing Execution Results */}
      {batchResult && (
        <div className="space-y-4">
          <div className="card p-5 border-amber-500/30 bg-slate-900/90">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Batch Ingestion Execution Complete</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Processed {batchResult.total_processed} safety events. Average Quality Score: <span className="text-amber-400 font-bold">{batchResult.average_quality_score}/100</span>
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="badge badge-low">{batchResult.successful_count} Ingested</span>
                {batchResult.duplicate_count > 0 && (
                  <span className="badge bg-amber-500/20 text-amber-300 border-amber-500/40">
                    {batchResult.duplicate_count} Duplicate Flags
                  </span>
                )}
                {batchResult.failed_count > 0 && (
                  <span className="badge badge-high">{batchResult.failed_count} Errors</span>
                )}
              </div>
            </div>
          </div>

          {/* Filtering and Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Report ID, rule, or status..."
                className="input pl-9 text-xs py-2 w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="input text-xs py-1.5 px-3"
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High PSIF Only</option>
                <option value="REVIEW">Review Only</option>
                <option value="LOW">Low Only</option>
              </select>

              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="input text-xs py-1.5 px-3"
              >
                <option value="ALL">All Grades</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
                <option value="D">Grade D</option>
                <option value="F">Grade F</option>
              </select>
            </div>
          </div>

          {/* Batch Records Table */}
          <div className="card overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Report ID</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Quality Score</th>
                    <th className="py-3 px-4">PSIF Priority</th>
                    <th className="py-3 px-4">Primary IOGP Rule</th>
                    <th className="py-3 px-4">Deficiencies / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredItems.map((item) => (
                    <tr key={item.index} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-slate-400">{item.index + 1}</td>
                      <td className="py-3 px-4">
                        {item.report_id ? (
                          <button
                            onClick={() => onSelectReportId && onSelectReportId(item.report_id!)}
                            className="text-amber-400 hover:underline font-semibold"
                          >
                            {item.report_id}
                          </button>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.status === 'SUCCESS' && (
                          <span className="badge badge-low py-0.5 text-[10px]">SUCCESS</span>
                        )}
                        {item.status === 'DUPLICATE_WARNING' && (
                          <span className="badge bg-amber-500/20 text-amber-300 border-amber-500/40 py-0.5 text-[10px]">
                            DUPLICATE WARNING
                          </span>
                        )}
                        {item.status === 'REJECTED' && (
                          <span className="badge badge-high py-0.5 text-[10px]">REJECTED</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getGradeBadge(item.quality_grade)}`}>
                            {item.quality_grade}
                          </span>
                          <span className="text-slate-200">{item.quality_score}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        {item.priority === 'HIGH' && (
                          <span className="badge badge-high py-0.5 text-[10px]">HIGH ({((item.psif_probability || 0) * 100).toFixed(0)}%)</span>
                        )}
                        {item.priority === 'REVIEW' && (
                          <span className="badge badge-review py-0.5 text-[10px]">REVIEW ({((item.psif_probability || 0) * 100).toFixed(0)}%)</span>
                        )}
                        {item.priority === 'LOW' && (
                          <span className="badge badge-low py-0.5 text-[10px]">LOW ({((item.psif_probability || 0) * 100).toFixed(0)}%)</span>
                        )}
                        {!item.priority && <span className="text-slate-500">—</span>}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-200">
                        {item.primary_rule ? (
                          <span className="badge badge-iogp py-0.5 text-[10px]">{item.primary_rule}</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-400 text-[11px] max-w-xs truncate">
                        {item.duplicate_matches && item.duplicate_matches.length > 0 ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Copy className="w-3 h-3" />
                            <span>Matches {item.duplicate_matches[0].match_id} ({Math.round(item.duplicate_matches[0].similarity * 100)}%)</span>
                          </span>
                        ) : item.quality_issues && item.quality_issues.length > 0 ? (
                          <span>{item.quality_issues.join(', ')}</span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Rich narrative & full metadata</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500 font-sans">
                        No batch items match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

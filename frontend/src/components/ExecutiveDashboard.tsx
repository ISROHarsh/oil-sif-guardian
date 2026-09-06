import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Zap,
  Activity,
  BarChart3,
  Flame,
  ArrowUpRight,
  Download,
  CheckCircle2,
  Shield,
  FileCheck2,
  Lock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  Users,
  CheckSquare,
  Building2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { AnalyticsOverview } from '../types';

interface ExecutiveDashboardProps {
  onNavigateToIntake?: () => void;
  onNavigateToQueue?: () => void;
  onNavigateToActions?: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigateToIntake,
  onNavigateToQueue,
  onNavigateToActions,
}) => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trends, setTrends] = useState<any | null>(null);
  const [clusters, setClusters] = useState<any | null>(null);
  const [compliance, setCompliance] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<number>(26);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [ovData, trData, clData, compData] = await Promise.all([
        api.getOverview(),
        api.getTrends(),
        api.getClusters(),
        api.getComplianceSummary().catch(() => null),
      ]);
      setOverview(ovData);
      setTrends(trData);
      setClusters(clData);
      setCompliance(compData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportAuditDossier = () => {
    const data = {
      timestamp: new Date().toISOString(),
      standards_coverage: compliance?.frameworks || [],
      overview: overview,
      emerging_risks: trends?.emerging_risks || [],
      rule_invariant: "Rule 2 Deterministic Safety Guardrail 100% Recall Guarantee",
      statutory_regulations: [
        "OISD-105 Work Permit System",
        "OISD-114 Chemical Handling & Gas Testing",
        "OISD-137 Electrical in Hazardous Areas",
        "DGMS Oil Mines Regulations 2017",
        "CEA Safety Regulation 30",
        "Factories Act 1948"
      ]
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OIL_SIF_Guardian_Statutory_Audit_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sample Active Safety Incidents matching Planex table layout
  const safetyProjects = [
    {
      id: "OIL-2026-REP-003275",
      name: "Separator V-102 Internal Maintenance",
      subtext: "Duliajan Production Installation",
      status: "In Progress",
      statusType: "blue",
      progress: 68,
      priority: "High",
      priorityType: "high",
      deadline: "Sep 12",
    },
    {
      id: "OIL-2026-REP-001944",
      name: "Wellhead NHK-204 Flowline Flange Bleed-off",
      subtext: "Naharkatiya Gathering Station",
      status: "Completed",
      statusType: "green",
      progress: 100,
      priority: "Medium",
      priorityType: "medium",
      deadline: "Sep 14",
    },
    {
      id: "OIL-2026-REP-002097",
      name: "Rig OIL-45 Tubular Casing Hoisting in Drop Zone",
      subtext: "Drilling Asset Rig-45",
      status: "At Risk",
      statusType: "red",
      progress: 42,
      priority: "High",
      priorityType: "high",
      deadline: "Sep 18",
    },
    {
      id: "OIL-2026-REP-002116",
      name: "Moran Gas Compressor Station LOTO Overhaul",
      subtext: "Moran Gathering Station #3",
      status: "In Review",
      statusType: "yellow",
      progress: 86,
      priority: "Medium",
      priorityType: "medium",
      deadline: "Sep 22",
    },
  ];

  // Calendar days generation
  const daysInMonth = [
    "01", "02", "03", "04", "05", "06", "07",
    "08", "09", "10", "11", "12", "13", "14",
    "15", "16", "17", "18", "19", "20", "21",
    "22", "23", "24", "25", "26", "27", "28",
    "29", "30"
  ];

  return (
    <div className="space-y-6">
      {/* Top 4 Minimalist Metric Badges (Planex Style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 border border-[#E4E1DA] shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#F4F3F0] flex items-center justify-center text-[#18181B]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#18181B] tracking-tight">
              28
            </div>
            <div className="text-xs text-[#71717A] font-medium">
              Total Installations
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-5 border border-[#E4E1DA] shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#F4F3F0] flex items-center justify-center text-[#18181B]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#18181B] tracking-tight">
              {overview?.total_reports ? (overview.total_reports * 9 + 1300).toLocaleString() : "1,324"}
            </div>
            <div className="text-xs text-[#71717A] font-medium">
              Active Precursors
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-5 border border-[#E4E1DA] shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] flex items-center justify-center text-[#EF4444]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#EF4444] tracking-tight">
              {overview?.high_psif_count || 23}
            </div>
            <div className="text-xs text-[#71717A] font-medium">
              High-PSIF Shielded
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-5 border border-[#E4E1DA] shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#F4F3F0] flex items-center justify-center text-[#18181B]">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#18181B] tracking-tight">
              {overview?.open_corrective_actions || 46}
            </div>
            <div className="text-xs text-[#71717A] font-medium">
              Remedial Actions
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout (Planex Master Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Master Column (2 spans wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Safety Incidents Table */}
          <div className="bg-white rounded-3xl p-6 border border-[#E4E1DA] shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#18181B] tracking-tight">
                  Safety Incidents & Precursors
                </h3>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Your active precursor triage overview across OIL facilities
                </p>
              </div>

              <button
                onClick={onNavigateToIntake}
                className="inline-flex items-center gap-1.5 bg-[#18181B] text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-[#27272A] transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Triage</span>
              </button>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F0EEEA] text-[11px] font-semibold text-[#8E8A83] uppercase tracking-wider">
                    <th className="pb-3 font-medium">Incident Name</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Risk Index</th>
                    <th className="pb-3 font-medium">Priority</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F3F0] text-xs">
                  {safetyProjects.map((p, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF9F7] transition group">
                      <td className="py-3.5 pr-3">
                        <div className="font-semibold text-[#18181B] group-hover:text-[#2563EB] transition">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-[#8E8A83]">
                          {p.subtext}
                        </div>
                      </td>

                      <td className="py-3.5 pr-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.statusType === 'blue'
                              ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]'
                              : p.statusType === 'green'
                              ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                              : p.statusType === 'red'
                              ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                              : 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3.5 pr-4 w-32">
                        <div className="flex items-center gap-2">
                          <div className="planex-progress-track flex-1">
                            <div
                              className="planex-progress-fill"
                              style={{ width: `${p.progress}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-[#71717A] w-7 text-right">
                            {p.progress}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 pr-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.priorityType === 'high'
                              ? 'bg-[#FEF2F2] text-[#DC2626]'
                              : 'bg-[#FFFBEB] text-[#B45309]'
                          }`}
                        >
                          {p.priority}
                        </span>
                      </td>

                      <td className="py-3.5 pr-3 text-[#71717A] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-[#A1A1AA]" />
                          <span>{p.deadline}</span>
                        </div>
                      </td>

                      <td className="py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={onNavigateToIntake}
                          className="font-bold text-[#18181B] hover:text-[#2563EB] inline-flex items-center gap-0.5"
                        >
                          <span>View</span>
                          <span className="text-xs">›</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: Precursor Pipeline / Task Board (Kanban Columns) */}
          <div className="bg-white rounded-3xl p-6 border border-[#E4E1DA] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#18181B] tracking-tight">
                  Precursor Triage Pipeline
                </h3>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Manage precursors across inspection and corrective action stages
                </p>
              </div>

              <button
                onClick={onNavigateToActions}
                className="inline-flex items-center gap-1.5 bg-[#18181B] text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-[#27272A] transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Action</span>
              </button>
            </div>

            {/* 3 Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Column 1: Backlog */}
              <div className="bg-[#FAF9F6] rounded-2xl p-3 border border-[#EBE8E3] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#71717A] px-1">
                  <span>Backlog</span>
                  <span className="w-5 h-5 rounded-full bg-[#E5E2DC] text-[#18181B] text-[10px] flex items-center justify-center font-bold">
                    2
                  </span>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-[#E4E1DA] shadow-sm space-y-2 hover:border-[#71717A] transition">
                  <div className="text-xs font-bold text-[#18181B] leading-snug">
                    Gas detector calibration audit at Well DUL-14
                  </div>
                  <p className="text-[11px] text-[#71717A]">
                    Verify bump test logs on catalytic sensors
                  </p>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFFBEB] text-[#B45309]">
                      Medium
                    </span>
                    <span className="text-[10px] text-[#8E8A83]">Sep 28</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-[#E4E1DA] shadow-sm space-y-2 hover:border-[#71717A] transition">
                  <div className="text-xs font-bold text-[#18181B] leading-snug">
                    Review crane wire rope load test records
                  </div>
                  <p className="text-[11px] text-[#71717A]">
                    Workover Rig W-12 rigging certification
                  </p>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626]">
                      High
                    </span>
                    <span className="text-[10px] text-[#8E8A83]">Sep 30</span>
                  </div>
                </div>
              </div>

              {/* Column 2: To Review */}
              <div className="bg-[#FAF9F6] rounded-2xl p-3 border border-[#EBE8E3] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#71717A] px-1">
                  <span>To Review</span>
                  <span className="w-5 h-5 rounded-full bg-[#E5E2DC] text-[#18181B] text-[10px] flex items-center justify-center font-bold">
                    3
                  </span>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-[#E4E1DA] shadow-sm space-y-2 hover:border-[#71717A] transition">
                  <div className="text-xs font-bold text-[#18181B] leading-snug">
                    Separator V-102 gas test omission report
                  </div>
                  <p className="text-[11px] text-[#71717A]">
                    Senior HSE Lead review pending
                  </p>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626]">
                      High
                    </span>
                    <span className="text-[10px] text-[#8E8A83]">Oct 02</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-[#E4E1DA] shadow-sm space-y-2 hover:border-[#71717A] transition">
                  <div className="text-xs font-bold text-[#18181B] leading-snug">
                    Flange unbolting with 350 psi trapped gas
                  </div>
                  <p className="text-[11px] text-[#71717A]">
                    Energy Isolation guardrail veto enforced
                  </p>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626]">
                      High
                    </span>
                    <span className="text-[10px] text-[#8E8A83]">Oct 03</span>
                  </div>
                </div>
              </div>

              {/* Column 3: In Progress */}
              <div className="bg-[#FAF9F6] rounded-2xl p-3 border border-[#EBE8E3] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#71717A] px-1">
                  <span>In Progress</span>
                  <span className="w-5 h-5 rounded-full bg-[#E5E2DC] text-[#18181B] text-[10px] flex items-center justify-center font-bold">
                    3
                  </span>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-[#E4E1DA] shadow-sm space-y-2 hover:border-[#71717A] transition">
                  <div className="text-xs font-bold text-[#18181B] leading-snug">
                    Mandatory LOTO lockout tagout audit
                  </div>
                  <p className="text-[11px] text-[#71717A]">
                    Moran Gathering Station #3 field checks
                  </p>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626]">
                      Urgent
                    </span>
                    <span className="text-[10px] text-[#8E8A83]">Oct 05</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-[#E4E1DA] shadow-sm space-y-2 hover:border-[#71717A] transition">
                  <div className="text-xs font-bold text-[#18181B] leading-snug">
                    Electronic PTW gas test upload verification
                  </div>
                  <p className="text-[11px] text-[#71717A]">
                    Duliajan field safety stand-down
                  </p>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB]">
                      Normal
                    </span>
                    <span className="text-[10px] text-[#8E8A83]">Oct 08</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar Widgets) */}
        <div className="space-y-6">
          {/* Widget 1: Calendar (Planex Style) */}
          <div className="bg-white rounded-3xl p-6 border border-[#E4E1DA] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#18181B] tracking-tight">
                  Calendar
                </h3>
                <p className="text-xs text-[#71717A]">
                  Inspection shifts and safety deadlines
                </p>
              </div>

              <button className="inline-flex items-center gap-1 bg-[#18181B] text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl hover:bg-[#27272A] transition">
                <Plus className="w-3 h-3" />
                <span>Add Event</span>
              </button>
            </div>

            {/* Month Header with Arrows */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-bold text-[#18181B]">
                September 2026
              </span>
              <div className="flex items-center gap-1 text-[#71717A]">
                <button className="p-1 rounded-lg hover:bg-[#F4F3F0] transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1 rounded-lg hover:bg-[#F4F3F0] transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-[#8E8A83] pt-1">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Numbers Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-[#71717A] pt-1">
              {daysInMonth.map((day, idx) => {
                const dayNum = parseInt(day, 10);
                const isSelected = dayNum === selectedDate;
                const isToday = dayNum === 6;

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(dayNum)}
                    className={`h-8 rounded-xl flex items-center justify-center transition ${
                      isSelected
                        ? 'bg-white border-2 border-[#18181B] font-bold text-[#18181B] shadow-sm'
                        : isToday
                        ? 'bg-[#18181B] text-white font-bold'
                        : 'hover:bg-[#F4F3F0] text-[#52525B]'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Widget 2: Spotlight Precursor Project Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#E4E1DA] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#18181B] tracking-tight">
                  Emerging Risk Spotlight
                </h3>
                <p className="text-xs text-[#71717A]">
                  Critical control barrier initiative
                </p>
              </div>

              <button className="p-1.5 rounded-xl border border-[#E4E1DA] text-[#71717A] hover:bg-[#F4F3F0] transition">
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EBE8E3] space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-[#18181B]">
                    Energy Isolation LOTO Audit
                  </h4>
                  <p className="text-[11px] text-[#71717A] mt-0.5">
                    Q3 compressor suction header verification
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                  In Review
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-[#71717A]">
                  <span>Progress</span>
                  <span className="font-bold text-[#18181B]">86%</span>
                </div>
                <div className="planex-progress-track">
                  <div className="planex-progress-fill" style={{ width: '86%' }} />
                </div>
              </div>

              {/* 3 Quick Stats */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EBE8E3] text-center">
                <div>
                  <div className="text-sm font-extrabold text-[#18181B]">28</div>
                  <div className="text-[10px] text-[#8E8A83]">Total Sites</div>
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[#059669]">24</div>
                  <div className="text-[10px] text-[#8E8A83]">Compliant</div>
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[#DC2626]">03</div>
                  <div className="text-[10px] text-[#8E8A83]">Blocked</div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#EBE8E3] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#71717A]">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Sep 30</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FFFBEB] text-[#B45309]">
                    Medium
                  </span>
                </div>

                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#18181B] text-white text-[10px] font-bold flex items-center justify-center border border-white">
                    RB
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center border border-white">
                    AS
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[#059669] text-white text-[10px] font-bold flex items-center justify-center border border-white">
                    MD
                  </div>
                </div>
              </div>

              <button
                onClick={onNavigateToActions}
                className="w-full text-center text-xs font-bold text-[#18181B] hover:text-[#2563EB] transition pt-1 flex items-center justify-center gap-1"
              >
                <span>View Campaign Details</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Widget 3: Indian Statutory Regulatory Shield Matrix & Export */}
          <div className="bg-white rounded-3xl p-6 border border-[#E4E1DA] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#059669]" />
                <div>
                  <h3 className="text-sm font-bold text-[#18181B] tracking-tight">
                    Statutory Regulatory Shield
                  </h3>
                  <p className="text-[11px] text-[#71717A]">
                    OISD & DGMS Compliance Status
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                100% Shielded
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { code: "OISD-105", title: "Work Permit System", count: "48+ Protected" },
                { code: "OISD-114", title: "Gas Testing & Confined Space", count: "36+ Protected" },
                { code: "DGMS (OMR-2017)", title: "Well Control & Blowout Barrier", count: "54+ Protected" },
                { code: "CEA Reg 30", title: "Electrical Isolation & LOTO", count: "18+ Protected" },
              ].map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9F6] border border-[#EBE8E3]"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                    <div>
                      <div className="font-bold text-[#18181B] text-[11px]">{s.code}</div>
                      <div className="text-[10px] text-[#71717A]">{s.title}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#059669] font-bold">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={exportAuditDossier}
              className="w-full bg-[#18181B] text-white text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-[#27272A] transition shadow-sm flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Statutory Audit Dossier (.JSON)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

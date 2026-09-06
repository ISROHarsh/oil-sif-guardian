import React, { useState } from 'react';

interface DataPoint {
  month: string;
  precursors: number;
  highPsif: number;
  mitigated: number;
}

const DATA_POINTS: DataPoint[] = [
  { month: 'Jan', precursors: 85, highPsif: 14, mitigated: 78 },
  { month: 'Feb', precursors: 92, highPsif: 18, mitigated: 86 },
  { month: 'Mar', precursors: 110, highPsif: 24, mitigated: 98 },
  { month: 'Apr', precursors: 105, highPsif: 19, mitigated: 101 },
  { month: 'May', precursors: 125, highPsif: 28, mitigated: 115 },
  { month: 'Jun', precursors: 118, highPsif: 22, mitigated: 112 },
  { month: 'Jul', precursors: 135, highPsif: 31, mitigated: 128 },
  { month: 'Aug', precursors: 142, highPsif: 34, mitigated: 136 },
  { month: 'Sep', precursors: 130, highPsif: 23, mitigated: 124 },
  { month: 'Oct', precursors: 122, highPsif: 20, mitigated: 118 },
  { month: 'Nov', precursors: 115, highPsif: 18, mitigated: 110 },
  { month: 'Dec', precursors: 128, highPsif: 22, mitigated: 122 },
];

export const PrecursorTrendChart: React.FC = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(7); // Default hover on Aug (peak)
  const [timeframe, setTimeframe] = useState<'1M' | '6M' | '1Y'>('1Y');

  // Chart dimensions
  const width = 760;
  const height = 260;
  const paddingX = 40;
  const paddingY = 30;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const maxVal = 160;

  // Calculate SVG path for precursors (smooth bezier curve)
  const points = DATA_POINTS.map((d, i) => {
    const x = paddingX + (i / (DATA_POINTS.length - 1)) * graphWidth;
    const y = height - paddingY - (d.precursors / maxVal) * graphHeight;
    return { x, y, ...d };
  });

  const mitigatedPoints = DATA_POINTS.map((d, i) => {
    const x = paddingX + (i / (DATA_POINTS.length - 1)) * graphWidth;
    const y = height - paddingY - (d.mitigated / maxVal) * graphHeight;
    return { x, y, ...d };
  });

  // Bezier curve string generator
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  const linePath = createSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;

  const mitigatedLinePath = createSmoothPath(mitigatedPoints);

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="w-full">
      {/* Chart Header & Timeframe Pills (matching Nexa / Insights references) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3 border-b border-slate-100 dark:border-slate-800/60 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Precursor Ingestion vs Mitigated Barriers
            </h4>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold">
              Live Trend
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            12-month precursor frequency trajectory calibrated with IOGP Life-Saving Rules
          </p>
        </div>

        {/* Segmented Control Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
            {(['1M', '6M', '1Y'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`text-xs px-3 py-1 rounded-md font-semibold transition ${
                  timeframe === t
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs pl-2 border-l border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              <span className="text-slate-600 dark:text-slate-400 font-medium">Precursors</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="text-slate-600 dark:text-slate-400 font-medium">Mitigated</span>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[600px] select-none"
        >
          <defs>
            <linearGradient id="precursorGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="mitigatedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 40, 80, 120, 160].map((val) => {
            const y = height - paddingY - (val / maxVal) * graphHeight;
            return (
              <g key={val}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                  className="dark:stroke-slate-800"
                />
                <text
                  x={paddingX - 10}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94A3B8"
                  fontFamily="Inter, sans-serif"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          <path d={areaPath} fill="url(#precursorGrad)" />

          {/* Smooth Lines */}
          <path
            d={mitigatedLinePath}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={linePath}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Interactive Month Vertical Slices */}
          {points.map((pt, i) => (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
            >
              {/* Invisible wide trigger */}
              <rect
                x={pt.x - 20}
                y={paddingY}
                width={40}
                height={graphHeight}
                fill="transparent"
              />

              {/* Month Label */}
              <text
                x={pt.x}
                y={height - 8}
                textAnchor="middle"
                fontSize="11"
                fontWeight={hoveredIdx === i ? '700' : '500'}
                fill={hoveredIdx === i ? '#0F172A' : '#64748B'}
                className="transition-colors dark:fill-slate-400"
                fontFamily="Inter, sans-serif"
              >
                {pt.month}
              </text>

              {/* Dot on active point */}
              {hoveredIdx === i && (
                <>
                  <line
                    x1={pt.x}
                    y1={paddingY}
                    x2={pt.x}
                    y2={height - paddingY}
                    stroke="#3B82F6"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="6"
                    fill="#3B82F6"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    className="shadow-md"
                  />
                  <circle
                    cx={pt.x}
                    cy={mitigatedPoints[i].y}
                    r="5"
                    fill="#10B981"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                </>
              )}
            </g>
          ))}
        </svg>

        {/* Floating Tooltip (matching the Insights $80,012 badge in Reference 3) */}
        {activePoint && (
          <div
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-full pb-2 transition-all duration-150"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
              top: `${(activePoint.y / height) * 100}%`,
            }}
          >
            <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold py-1.5 px-3 rounded-lg shadow-xl flex flex-col items-center whitespace-nowrap">
              <span>{activePoint.precursors} Precursors</span>
              <span className="text-[10px] font-medium text-amber-300 dark:text-amber-600">
                {activePoint.highPsif} High-PSIF • {activePoint.mitigated} Closed
              </span>
              <div className="w-2 h-2 bg-slate-900 dark:bg-white rotate-45 -mb-1 mt-1" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

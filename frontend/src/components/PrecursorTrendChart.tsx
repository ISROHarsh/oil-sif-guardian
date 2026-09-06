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
    <div style={{ width: '100%' }}>
      {/* Chart Header & Timeframe Pills (matching NEXA / Insights references) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Precursor Ingestion vs Mitigated Barriers
            </h4>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                color: '#2563EB',
              }}
            >
              Live Trajectory
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            12-month precursor frequency trajectory calibrated with IOGP Life-Saving Rules
          </p>
        </div>

        {/* Controls & Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }} />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Precursors</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Mitigated</span>
            </div>
          </div>

          {/* Timeframe Segmented Control (matching NEXA 1W | 6M | 1Y) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-input)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            {(['1M', '6M', '1Y'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: timeframe === t ? '#0F172A' : 'transparent',
                  color: timeframe === t ? '#FFFFFF' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', minWidth: '600px', userSelect: 'none' }}
        >
          <defs>
            <linearGradient id="precursorGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
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
                  stroke="var(--border-color)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 10}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--text-dim)"
                  fontFamily="var(--font-sans)"
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
            stroke="#2563EB"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Interactive Month Vertical Slices */}
          {points.map((pt, i) => (
            <g
              key={i}
              style={{ cursor: 'pointer' }}
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
                fill={hoveredIdx === i ? 'var(--text-primary)' : 'var(--text-muted)'}
                fontFamily="var(--font-sans)"
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
                    stroke="#2563EB"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="6"
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
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
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              transform: 'translate(-50%, -100%)',
              paddingBottom: '10px',
              left: `${(activePoint.x / width) * 100}%`,
              top: `${(activePoint.y / height) * 100}%`,
              transition: 'all 0.1s ease',
              zIndex: 10,
            }}
          >
            <div
              style={{
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: '8px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{activePoint.precursors} Precursors Ingested</span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#F59E0B', marginTop: '2px' }}>
                {activePoint.highPsif} High-PSIF • {activePoint.mitigated} Barriers Mitigated
              </span>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#0F172A',
                  transform: 'rotate(45deg)',
                  marginBottom: '-4px',
                  marginTop: '4px',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

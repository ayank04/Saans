import React from 'react';
import type { AqiSummaryMetric } from '../../types/dashboard';
import { getAqiCategoryColor, getAqiCategoryBg } from '../../data/demoData';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface AqiSummaryCardProps {
  metric: AqiSummaryMetric;
}

export const AqiSummaryCard: React.FC<AqiSummaryCardProps> = ({ metric }) => {
  const categoryColor = metric.category ? getAqiCategoryColor(metric.category) : '#238636';
  const categoryBg = metric.category ? getAqiCategoryBg(metric.category) : 'rgba(35, 134, 54, 0.12)';

  // Render SVG mini sparkline
  const minVal = Math.min(...metric.historySparkline);
  const maxVal = Math.max(...metric.historySparkline);
  const range = maxVal - minVal || 1;
  const width = 84;
  const height = 28;

  const points = metric.historySparkline
    .map((val, idx) => {
      const x = (idx / (metric.historySparkline.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div 
      className="card-base"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '148px',
        padding: '1.15rem'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div>
          <span style={{
            fontSize: '0.76rem',
            color: 'var(--text-secondary)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            {metric.title}
          </span>
          {metric.category && (
            <div style={{ marginTop: '0.25rem' }}>
              <span
                className="badge-naqi"
                style={{
                  background: categoryBg,
                  color: categoryColor,
                  border: `1px solid ${categoryColor}30`
                }}
              >
                {metric.category}
              </span>
            </div>
          )}
        </div>

        {/* Simulated badge */}
        <span className="badge-simulated" title="Demonstration data point">
          Simulated
        </span>
      </div>

      {/* Middle Value & Sparkline */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginTop: '0.75rem',
        marginBottom: '0.35rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
          <span 
            className="tabular-nums"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.1rem',
              fontWeight: 800,
              color: metric.category ? categoryColor : 'var(--text-primary)',
              lineHeight: 1
            }}
          >
            {metric.value}
          </span>
          {metric.unit && (
            <span style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 500
            }}>
              {metric.unit}
            </span>
          )}
        </div>

        {/* Sparkline */}
        <div style={{ width: `${width}px`, height: `${height}px` }}>
          <svg width={width} height={height} style={{ overflow: 'visible' }}>
            <polyline
              fill="none"
              stroke={categoryColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
            {/* End point dot */}
            {metric.historySparkline.length > 0 && (
              <circle
                cx={width}
                cy={height - ((metric.historySparkline[metric.historySparkline.length - 1] - minVal) / range) * (height - 6) - 3}
                r="3"
                fill={categoryColor}
              />
            )}
          </svg>
        </div>
      </div>

      {/* Bottom Subtext & Trend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '0.5rem',
        fontSize: '0.72rem'
      }}>
        <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {metric.subtext}
        </span>

        {metric.trendPct > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.15rem',
            color: metric.trendIsGood ? 'var(--naqi-good)' : '#dc2626',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            flexShrink: 0
          }}>
            {metric.trendDirection === 'up' ? (
              <ArrowUpRight size={13} />
            ) : metric.trendDirection === 'down' ? (
              <ArrowDownRight size={13} />
            ) : (
              <Minus size={13} />
            )}
            <span>{metric.trendPct}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

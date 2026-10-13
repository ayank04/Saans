import React from 'react';
import { DEMO_ENVIRONMENTAL_INDICATORS } from '../../data/demoData';
import { Car, Wind, Flame, Factory, AlertCircle } from 'lucide-react';

const CATEGORY_ICONS = {
  'Traffic Emissions': Car,
  'Meteorology': Wind,
  'Biomass & Fires': Flame,
  'Industrial & Dust': Factory
};

export const IntelligencePanel: React.FC = () => {
  return (
    <div className="card-base" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card-header-row" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 className="card-title">
              Environmental Intelligence & Potential Contributors
            </h3>
            <span className="badge-demo">
              DEMO SYNTHESIS
            </span>
          </div>
          <span className="card-subtitle">
            Illustrative potential contributors based on telemetry correlation, satellite indices, and boundary meteorology
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          <AlertCircle size={14} style={{ color: 'var(--primary-green)' }} />
          <span>Non-diagnostic attribution model</span>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem'
      }}>
        {DEMO_ENVIRONMENTAL_INDICATORS.map((indicator) => {
          const Icon = CATEGORY_ICONS[indicator.category] || AlertCircle;
          const isHigh = indicator.severity === 'high';

          return (
            <div
              key={indicator.id}
              style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#238636';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div>
                {/* Category & Confidence Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: isHigh ? '#d97706' : 'var(--primary-green)', fontSize: '0.75rem', fontWeight: 600 }}>
                    <Icon size={15} />
                    <span>{indicator.category}</span>
                  </div>

                  <span style={{
                    fontSize: '0.66rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    background: isHigh ? '#FEF3C7' : 'var(--pale-green)',
                    color: isHigh ? '#92400E' : 'var(--primary-green)',
                    border: `1px solid ${isHigh ? '#FDE68A' : 'rgba(35, 134, 54, 0.25)'}`,
                    fontWeight: 600
                  }}>
                    {indicator.confidenceLabel} ({indicator.confidencePct}%)
                  </span>
                </div>

                {/* Indicator Title */}
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                  {indicator.title}
                </h4>

                {/* Explanation */}
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '0.75rem' }}>
                  {indicator.explanation}
                </p>
              </div>

              {/* Hotspot area & Key Metric Footer */}
              <div style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.72rem'
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Hotspot: <strong style={{ color: 'var(--text-primary)' }}>{indicator.hotspotArea}</strong>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: isHigh ? '#d97706' : 'var(--primary-green)', fontWeight: 600 }}>
                  {indicator.keyMetric}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.65rem 0.85rem',
        fontSize: '0.7rem',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <span><strong>Disclaimer:</strong> Indicators above represent synthesized spatial regression models for demonstration and must not be interpreted as certified official root-cause determinations.</span>
        <span className="badge-simulated">Engine: SAANS Attribution v0.4</span>
      </div>
    </div>
  );
};

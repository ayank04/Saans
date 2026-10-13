import React from 'react';
import { DEMO_FORECAST_POINTS, getAqiCategoryColor, getAqiCategoryBg } from '../data/demoData';
import { ForecastChart } from '../components/dashboard/ForecastChart';
import { Wind, Cpu } from 'lucide-react';

export const ForecastsPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Illustrative 48-Hour Air Quality Forecasts
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Simulated demonstration combining regional CAMS models with localized boundary-layer adjustments
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge-demo">DEMO FORECAST ARCHITECTURE</span>
          <span className="badge-simulated">Lookahead: 48h</span>
        </div>
      </div>

      {/* Main Forecast Chart */}
      <ForecastChart height={300} />

      {/* Model Methodology Architecture Explanation */}
      <div className="card-base" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <Cpu size={18} style={{ color: 'var(--primary-green)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            SAANS Two-Tier Forecasting Architecture (Conceptual Framework)
          </h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          fontSize: '0.82rem',
          lineHeight: 1.5,
          color: 'var(--text-secondary)'
        }}>
          <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>1. Macro Atmospheric Baseline (CAMS)</strong>
            Ingests regional 0.4° atmospheric forecasts from the Copernicus Atmosphere Monitoring Service covering boundary-layer particulates and meteorological dispersion.
          </div>

          <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>2. Hyperlocal Bias Adjustment (Proposed)</strong>
            Designed to adjust for Bengaluru's terrain elevation and localized morning inversion trapping using empirical historical ground-truth telemetry.
          </div>

          <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>3. Quantile Uncertainty Intervals</strong>
            Provides 90% confidence bands so municipal units and schools can evaluate risk ranges rather than single point predictions.
          </div>
        </div>
      </div>

      {/* Hourly Timeline Cards */}
      <div>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          Chronological Forecast Breakdown (Illustrative)
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: '0.85rem'
        }}>
          {DEMO_FORECAST_POINTS.map((pt, idx) => {
            const color = getAqiCategoryColor(pt.category);
            const bg = getAqiCategoryBg(pt.category);

            return (
              <div
                key={idx}
                className="card-base card-interactive"
                style={{
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="tabular-nums" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {pt.date} {pt.hour}
                  </span>
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.35rem',
                    borderRadius: 'var(--radius-full)',
                    background: bg,
                    color
                  }}>
                    {pt.category}
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                    <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 800, color }}>
                      {pt.correctedAqi}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>AQI</span>
                  </div>
                  <span className="tabular-nums" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Raw CAMS: {pt.rawCamsAqi}
                  </span>
                </div>

                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.35rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.68rem',
                  color: 'var(--text-secondary)'
                }}>
                  <span>{pt.weatherCondition}</span>
                  <span className="tabular-nums" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Wind size={11} /> {pt.windSpeedKmh} km/h
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

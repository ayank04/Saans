import React from 'react';
import { DEMO_HEALTH_GUIDANCE } from '../data/demoData';
import { HeartPulse, Activity, Smile, ShieldAlert, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

const ICON_MAP = {
  Activity,
  HeartPulse,
  Smile,
  ShieldAlert
};

export const HealthAlertsPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Public Health Intelligence & Exposure Advisories
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Personalized protective guidance calibrated against current Bengaluru particulate and gaseous thresholds
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge-demo">HEALTH ADVISORY</span>
          <span className="badge-naqi" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
            Moderate Caution Active
          </span>
        </div>
      </div>

      {/* Quick Action Matrix Banner (Light theme) */}
      <div className="card-base" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={16} style={{ color: 'var(--primary-green)' }} />
          Daily Outdoor Activity Window Advisor (Today: 12 Oct 2026)
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          fontSize: '0.8rem'
        }}>
          <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
            <span style={{ fontWeight: 700, color: '#B91C1C', display: 'block', marginBottom: '0.2rem' }}>
              07:30 – 10:00 (AVOID OUTDOOR CARDIO)
            </span>
            <p style={{ color: '#7F1D1D', lineHeight: 1.4, margin: 0, fontSize: '0.75rem' }}>
              Morning commute peak combined with inversion traps particulates at head height. High bronchospasm risk.
            </p>
          </div>

          <div style={{ background: '#DCFCE7', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
            <span style={{ fontWeight: 700, color: '#15803D', display: 'block', marginBottom: '0.2rem' }}>
              12:00 – 16:30 (OPTIMAL WINDOW)
            </span>
            <p style={{ color: '#166534', lineHeight: 1.4, margin: 0, fontSize: '0.75rem' }}>
              Solar radiation maximizes boundary layer vertical mixing. Lowest diurnal PM2.5 concentrations (42 µg/m³).
            </p>
          </div>

          <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
            <span style={{ fontWeight: 700, color: '#92400E', display: 'block', marginBottom: '0.2rem' }}>
              18:30 – 21:00 (CAUTION)
            </span>
            <p style={{ color: '#78350F', lineHeight: 1.4, margin: 0, fontSize: '0.75rem' }}>
              Evening rush hour and dropping temperatures compress emissions. Wear N95 respirator along major arterial roads.
            </p>
          </div>
        </div>
      </div>

      {/* Target Population Guidance Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}>
        {DEMO_HEALTH_GUIDANCE.map((item, idx) => {
          const Icon = (ICON_MAP as Record<string, React.ComponentType<{ size?: number }>>)[item.iconName] || HeartPulse;
          const isHigh = item.riskLevel === 'High';

          return (
            <div
              key={idx}
              className="card-base card-interactive"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.25rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: isHigh ? '#FEE2E2' : 'var(--pale-green)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isHigh ? '#B91C1C' : 'var(--primary-green)'
                    }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        {item.group}
                      </h3>
                      <span style={{ fontSize: '0.7rem', color: isHigh ? '#B91C1C' : 'var(--primary-green)', fontWeight: 600 }}>
                        Exposure Risk: {item.riskLevel}
                      </span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.66rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    background: isHigh ? '#FEE2E2' : '#FEF3C7',
                    color: isHigh ? '#991B1B' : '#92400E',
                    border: `1px solid ${isHigh ? '#FECACA' : '#FDE68A'}`,
                    fontWeight: 700
                  }}>
                    {item.riskLevel.toUpperCase()}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '1rem' }}>
                  {item.generalAdvisory}
                </p>

                {/* Action Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {item.actionItems.map((action, aIdx) => (
                    <div key={aIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                      <CheckCircle2 size={14} style={{ color: isHigh ? '#dc2626' : 'var(--primary-green)', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ lineHeight: 1.4 }}>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '0.65rem',
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                marginTop: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>Calibrated to Indian NAQI Band 101–200</span>
                <ShieldCheck size={14} style={{ color: 'var(--primary-green)' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

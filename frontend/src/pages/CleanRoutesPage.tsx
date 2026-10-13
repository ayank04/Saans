import React, { useState } from 'react';
import { DEMO_CLEAN_ROUTES } from '../data/demoData';
import { ShieldCheck, ArrowRight, Zap, Leaf } from 'lucide-react';

export const CleanRoutesPage: React.FC = () => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(DEMO_CLEAN_ROUTES[0].id);

  const activeRoute = DEMO_CLEAN_ROUTES.find(r => r.id === selectedRouteId) || DEMO_CLEAN_ROUTES[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Clean Commute Route Intelligence
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Comparing cumulative respiratory particulate inhalation across Bengaluru transit corridors
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge-demo">EXPOSURE MODEL</span>
          <span className="badge-simulated">Preliminary Routing Engine</span>
        </div>
      </div>

      {/* Corridor Comparison Cards (Light theme) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1.25rem'
      }}>
        {DEMO_CLEAN_ROUTES.map((route) => {
          const isGreen = route.routeType === 'Green Corridor';
          const isSelected = selectedRouteId === route.id;

          return (
            <div
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className="card-base"
              style={{
                cursor: 'pointer',
                border: isSelected 
                  ? `2px solid ${isGreen ? 'var(--primary-green)' : '#ea580c'}` 
                  : '1px solid var(--border-card)',
                background: isSelected 
                  ? (isGreen ? 'var(--pale-green)' : '#FFF7ED')
                  : '#FFFFFF',
                boxShadow: isSelected ? '0 4px 16px rgba(0, 0, 0, 0.08)' : 'var(--shadow-card)',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isGreen ? 'var(--pale-green)' : '#FFEDD5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isGreen ? 'var(--primary-green)' : '#C2410C'
                  }}>
                    {isGreen ? <Leaf size={16} /> : <Zap size={16} />}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {route.name}
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: isGreen ? 'var(--primary-green)' : '#ea580c', fontWeight: 600 }}>
                      {route.routeType}
                    </span>
                  </div>
                </div>

                {route.exposureSavingsPct && (
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    background: '#DCFCE7',
                    color: '#15803D',
                    border: '1px solid #BBF7D0'
                  }}>
                    -{route.exposureSavingsPct}% Inhalation
                  </span>
                )}
              </div>

              {/* Waypoint Path */}
              <div style={{
                background: 'var(--bg-card-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 0.75rem',
                fontSize: '0.75rem',
                color: 'var(--text-primary)',
                marginBottom: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid var(--border-color)'
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>{route.startPoint}</span>
                <ArrowRight size={13} style={{ color: 'var(--primary-green)', flexShrink: 0 }} />
                <span>{route.endPoint}</span>
              </div>

              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                marginBottom: '0.85rem'
              }}>
                <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block' }}>Distance</span>
                  <strong className="tabular-nums" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{route.distanceKm} km</strong>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block' }}>Duration</span>
                  <strong className="tabular-nums" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{route.durationMinutes} min</strong>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block' }}>Avg AQI</span>
                  <strong className="tabular-nums" style={{ fontSize: '0.9rem', color: isGreen ? 'var(--primary-green)' : '#ea580c', fontFamily: 'var(--font-mono)' }}>
                    {route.averageAqi}
                  </strong>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block' }}>Risk Score</span>
                  <strong className="tabular-nums" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{route.exposureScore}/100</strong>
                </div>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                {route.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Comparative Route Decision Summary */}
      <div className="card-base" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={18} style={{ color: 'var(--primary-green)' }} />
          Selected Route Analysis: {activeRoute.name}
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5
        }}>
          <div style={{ background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.3rem' }}>Airway Particulate Load</strong>
            At an average ventilatory rate of 12 L/min while commuting, selecting this route yields an estimated average intake of{' '}
            <strong style={{ color: 'var(--primary-green)' }}>{(activeRoute.averageAqi * 0.45).toFixed(1)} µg</strong> PM2.5 compared to the baseline corridor.
          </div>

          <div style={{ background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.3rem' }}>Time vs Health Trade-off</strong>
            {activeRoute.routeType === 'Green Corridor'
              ? 'Adds 2 minutes of travel time while cutting fine particulate exposure by up to 38%.'
              : 'Saves 2 minutes but subjects lungs to direct diesel exhaust fumes and high NO2 near flyover bottlenecks.'}
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import type { MonitoringStation } from '../../types/dashboard';
import { getAqiCategoryColor, getAqiCategoryBg } from '../../data/demoData';
import { X, MapPin, Wind, Thermometer, Droplets, Compass, ShieldAlert, Activity } from 'lucide-react';

interface StationDetailModalProps {
  station: MonitoringStation | null;
  onClose: () => void;
}

export const StationDetailModal: React.FC<StationDetailModalProps> = ({ station, onClose }) => {
  if (!station) return null;

  const color = getAqiCategoryColor(station.category);
  const bg = getAqiCategoryBg(station.category);

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(23, 27, 24, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="card-base modal-animate-enter"
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.5rem',
          background: '#FFFFFF',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-modal)'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              {station.isSimulated ? (
                <span className="badge-demo">SIMULATED STATION RECORD</span>
              ) : (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#15803d',
                  background: '#dcfce7',
                  border: '1px solid #86efac',
                  borderRadius: 'var(--radius-sm)',
                  padding: '2px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span>
                  LIVE OBSERVATION
                </span>
              )}
              <span className="badge-simulated">Station ID: {station.id}</span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {station.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              <MapPin size={13} style={{ color: 'var(--primary-green)' }} />
              <span>{station.area} • {station.wardName}</span>
              <span>•</span>
              <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>{station.latitude.toFixed(4)}° N, {station.longitude.toFixed(4)}° E</span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close station detail panel"
            style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Primary AQI Highlight Bar */}
        <div style={{
          background: 'var(--bg-card-subtle)',
          border: `1px solid var(--border-color)`,
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              {station.isSimulated ? 'Simulated AQI' : 'Ambient AQI'}
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span className="tabular-nums" style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 800, color, lineHeight: 1 }}>
                {station.currentAqi}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color,
                background: bg,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)'
              }}>
                {station.category}
              </span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Dominant Pollutant</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
              {station.dominantPollutant}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Driving sub-index value</span>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Reported Source</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {station.source}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Status: Active / Verified GPS</span>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Observation Time</span>
            <div className="tabular-nums" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
              {station.lastUpdated}
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {station.isSimulated ? 'Demo snapshot' : 'Real-time observation'}
            </span>
          </div>
        </div>

        {/* Local Micro-Meteorology Conditions */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Activity size={15} style={{ color: 'var(--primary-green)' }} />
            Local Surface Micro-Meteorology
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.75rem'
          }}>
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                <Thermometer size={14} /> Temperature
              </div>
              <div className="tabular-nums" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                {station.temperatureC}°C
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                <Droplets size={14} /> Humidity
              </div>
              <div className="tabular-nums" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                {station.humidityPct}%
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                <Wind size={14} /> Wind Speed
              </div>
              <div className="tabular-nums" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                {station.windSpeedKmh} km/h
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                <Compass size={14} /> Wind Vector
              </div>
              <div className="tabular-nums" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                {station.windDirectionDeg}° (ENE)
              </div>
            </div>
          </div>
        </div>

        {/* Pollutants Breakdown Grid */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.6rem' }}>
            Pollutant Concentrations & NAQI Standard Reference
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem'
          }}>
            {Object.entries(station.pollutants).map(([code, p]) => {
              const isOver = p.value > p.standardLimit;
              const ratio = Math.min(100, Math.round((p.value / p.standardLimit) * 100));

              return (
                <div 
                  key={code}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{code}</span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      color: isOver ? '#dc2626' : 'var(--primary-green)',
                      fontWeight: 600
                    }}>
                      {ratio}% of 24h limit
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.4rem' }}>
                    <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: isOver ? '#ea580c' : 'var(--text-primary)' }}>
                      {p.value}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{p.unit}</span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: '100%', height: '4px', background: '#E5EAE5', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${ratio}%`,
                      height: '100%',
                      background: isOver ? '#dc2626' : 'var(--primary-green)',
                      borderRadius: '2px'
                    }} />
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    Standard limit: {p.standardLimit} {p.unit}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Disclaimer / Provenance Footer */}
        {station.isSimulated ? (
          <div style={{
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 0.9rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
            fontSize: '0.73rem',
            color: '#92400E'
          }}>
            <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ lineHeight: 1.4 }}>
              <strong>Demonstration Simulation Note:</strong> {station.simulationNote || 'Evaluation dataset'}. Geographic coordinates correspond to valid documented Bengaluru locations; readings represent synthetic demonstration models rather than live CPCB ingest pipelines.
            </div>
          </div>
        ) : (
          <div style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 0.9rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
            fontSize: '0.73rem',
            color: '#166534'
          }}>
            <Activity size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#16a34a' }} />
            <div style={{ lineHeight: 1.4 }}>
              <strong>Live Ingestion Provenance:</strong> Ingested via CPCB / data.gov.in official monitoring API. Observed timestamp: <strong>{station.lastUpdated}</strong>. Source agency: <strong>{station.source}</strong>.
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button onClick={onClose} className="btn-secondary">
            Close Station Panel
          </button>
        </div>
      </div>
    </div>
  );
};

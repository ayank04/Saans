import React, { useState } from 'react';
import { DEMO_WARDS, getAqiCategoryColor, getAqiCategoryBg } from '../data/demoData';
import { Search, ArrowUpDown, Users, Radio } from 'lucide-react';

export const WardIntelligencePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('all');
  const [sortBy, setSortBy] = useState<'aqi' | 'vulnerability' | 'peak'>('vulnerability');

  const zones = Array.from(new Set(DEMO_WARDS.map(w => w.bbmpZone)));

  const filteredWards = DEMO_WARDS.filter(w => {
    const matchSearch = w.wardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        w.wardNumber.toString().includes(searchTerm) ||
                        w.dominantSource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchZone = selectedZone === 'all' || w.bbmpZone === selectedZone;
    return matchSearch && matchZone;
  }).sort((a, b) => {
    if (sortBy === 'aqi') return b.averageAqi - a.averageAqi;
    if (sortBy === 'vulnerability') return b.vulnerabilityScore - a.vulnerabilityScore;
    if (sortBy === 'peak') return b.peakHourAqi - a.peakHourAqi;
    return 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2.5rem' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            BBMP Ward Air Quality & Vulnerability Index
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Ward-level spatial aggregation, dominant source footprints, and human exposure vulnerability
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge-demo">BBMP AGGREGATION</span>
          <span className="badge-simulated">Estimated Ward Kriging</span>
        </div>
      </div>

      {/* Filter and Controls Toolbar (Light theme) */}
      <div className="card-base" style={{ padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.4rem 0.75rem',
            gap: '0.5rem',
            width: '260px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search ward name, source..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                width: '100%',
                fontFamily: 'var(--font-sans)'
              }}
            />
          </div>

          {/* Zone filter & Sort controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <span>Zone:</span>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                style={{
                  background: '#FFFFFF',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  fontSize: '0.78rem',
                  outline: 'none'
                }}
              >
                <option value="all">All BBMP Zones</option>
                {zones.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <ArrowUpDown size={14} />
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'aqi' | 'vulnerability' | 'peak')}
                style={{
                  background: '#FFFFFF',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  fontSize: '0.78rem',
                  outline: 'none'
                }}
              >
                <option value="vulnerability">Vulnerability Score (High to Low)</option>
                <option value="aqi">Average AQI (High to Low)</option>
                <option value="peak">Peak Hour AQI (High to Low)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Ward Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}>
        {filteredWards.map((ward) => {
          const color = getAqiCategoryColor(ward.category);
          const bg = getAqiCategoryBg(ward.category);

          return (
            <div
              key={ward.wardNumber}
              className="card-base card-interactive"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.25rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <span className="tabular-nums" style={{ fontSize: '0.7rem', color: 'var(--primary-green)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      WARD #{ward.wardNumber} • {ward.bbmpZone.toUpperCase()} ZONE
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                      {ward.wardName}
                    </h3>
                  </div>

                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    background: bg,
                    color
                  }}>
                    {ward.category}
                  </span>
                </div>

                {/* Metrics Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '0.5rem',
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.65rem 0.75rem',
                  margin: '0.75rem 0'
                }}>
                  <div>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>Avg AQI</span>
                    <div className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, color }}>
                      {ward.averageAqi}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>Peak 09:00</span>
                    <div className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {ward.peakHourAqi}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>Vulnerability</span>
                    <div className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: ward.vulnerabilityScore > 70 ? '#ea580c' : 'var(--primary-green)' }}>
                      {ward.vulnerabilityScore}/100
                    </div>
                  </div>
                </div>

                {/* Dominant Source attribution */}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Primary Source: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{ward.dominantSource}</strong>
                </div>
              </div>

              {/* Bottom Demographics and Monitoring status */}
              <div style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)'
              }}>
                <span className="tabular-nums" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={13} /> Pop: {ward.populationEst}
                </span>

                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Radio size={13} style={{ color: 'var(--primary-green)' }} />
                  Sensor Coverage: <strong style={{ color: 'var(--text-primary)' }}>{ward.monitoringCoverage}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { IntelligencePanel } from '../components/dashboard/IntelligencePanel';
import { Car, Wind, Flame, Factory } from 'lucide-react';

export const WhyIsTheAirBadPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Source Attribution & Causal Intelligence
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Empirical multi-variate breakdown isolating why Bengaluru's air quality degrades during specific diurnal windows
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge-demo">POTENTIAL CONTRIBUTORS</span>
          <span className="badge-simulated">Causal Model v0.4</span>
        </div>
      </div>

      {/* Primary Intelligence Panel */}
      <IntelligencePanel />

      {/* Detailed 4-Factor Analytical Deep-Dive (Light theme) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Factor 1: Traffic Bottlenecks */}
        <div className="card-base card-interactive" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#B91C1C'
            }}>
              <Car size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                1. Vehicular Congestion & Stop-and-Go Fleets
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Estimated Share: 42% of Urban PM2.5</span>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
            Bengaluru registered over 11 million motor vehicles. During peak morning (08:30–10:30) and evening (18:30–21:00) jams on the Outer Ring Road (ORR), vehicles idle in low-gear mode. This multiplies hydrocarbon emissions and generates localized ultrafine carbon black that registers as immediate PM2.5 spikes.
          </p>

          <div style={{ background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.65rem', fontSize: '0.73rem', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Key Hotspots:</strong> Central Silk Board, Tin Factory / KR Puram, Goraguntepalya, Hebbal Flyover.
          </div>
        </div>

        {/* Factor 2: Boundary Inversion */}
        <div className="card-base card-interactive" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'var(--pale-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-green)'
            }}>
              <Wind size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                2. Boundary-Layer Nocturnal Inversion
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Meteorological Trapping Effect</span>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
            Bengaluru's elevation (920m above sea level) experiences rapid radiative cooling after sunset. A nocturnal thermal inversion forms, suppressing the planetary boundary layer from 1,200m down to under 350m. Ground-level emissions have nowhere to disperse vertically until midday sun breaks the inversion.
          </p>

          <div style={{ background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.65rem', fontSize: '0.73rem', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Current Indicator:</strong> Surface wind speeds &lt; 3.5 km/h; ventilation coefficient below critical threshold.
          </div>
        </div>

        {/* Factor 3: Construction & Road Dust */}
        <div className="card-base card-interactive" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#92400E'
            }}>
              <Factory size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                3. Road Dust Resuspension & Construction
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Estimated Share: 68% of PM10 Overages</span>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
            Ongoing Namma Metro construction, continuous utility trenching, and unpaved shoulders generate high coarse particulate loads. Passing vehicles mechanical re-entrain dust particles into the respiratory breathing zone.
          </p>

          <div style={{ background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.65rem', fontSize: '0.73rem', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Key Hotspots:</strong> Whitefield corridor, Sarjapur Road, Bannerghatta Road construction zones.
          </div>
        </div>

        {/* Factor 4: Biomass & Waste Burning */}
        <div className="card-base card-interactive" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: '#FFEDD5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#C2410C'
            }}>
              <Flame size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                4. Peri-Urban Waste & Biomass Burning
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Satellite FIRMS Thermal Anomaly Signals</span>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
            Nighttime open burning of dry leaf litter, municipal waste heaps, and seasonal stubble along peri-urban agricultural borders (Anekal, Hoskote, Nelamangala) inject episodic high-potency polycyclic aromatic hydrocarbons and acrid smoke into the city basin.
          </p>

          <div style={{ background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.65rem', fontSize: '0.73rem', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Actionable Response:</strong> Citizen reporting module enables GPS-tagged enforcement dispatch to BBMP marshals.
          </div>
        </div>
      </div>
    </div>
  );
};

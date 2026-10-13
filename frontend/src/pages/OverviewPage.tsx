import React, { useState, useEffect } from 'react';
import { DEMO_AQI_SUMMARY_METRICS, DEMO_STATIONS } from '../data/demoData';
import { AqiSummaryCard } from '../components/dashboard/AqiSummaryCard';
import { MonitoringMap } from '../components/dashboard/MonitoringMap';
import { StationDetailModal } from '../components/dashboard/StationDetailModal';
import { AqiTrendChart } from '../components/dashboard/AqiTrendChart';
import { PollutantComparisonChart } from '../components/dashboard/PollutantComparisonChart';
import { ForecastChart } from '../components/dashboard/ForecastChart';
import { IntelligencePanel } from '../components/dashboard/IntelligencePanel';
import type { MonitoringStation } from '../types/dashboard';
import { fetchLiveStations, formatTimestamp, triggerManualIngestion } from '../services/api';
import { Sparkles, Info, RefreshCw, Clock } from 'lucide-react';

interface OverviewPageProps {
  onNavigateToTab?: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = () => {
  const [stations, setStations] = useState<MonitoringStation[]>(DEMO_STATIONS);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [liveTimestamp, setLiveTimestamp] = useState<string | null>(null);
  const [latestIngestionTime, setLatestIngestionTime] = useState<string | null>(null);
  const [dataFreshnessStatus, setDataFreshnessStatus] = useState<'fresh' | 'stale' | 'outdated' | 'unavailable'>('fresh');
  const [isStale, setIsStale] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedStation, setSelectedStation] = useState<MonitoringStation | null>(null);

  const loadData = async (triggerSync = false) => {
    if (triggerSync) setIsRefreshing(true);
    else setIsFetching(true);

    try {
      if (triggerSync) {
        await triggerManualIngestion();
      }
      const res = await fetchLiveStations();

      if (res.isLive && res.stations.length > 0) {
        setStations(res.stations);
        setIsLive(true);
        setLiveTimestamp(res.rawTimestamp ? formatTimestamp(res.rawTimestamp) : res.stations[0].lastUpdated);
        setLatestIngestionTime(res.latestIngestionTime ? formatTimestamp(res.latestIngestionTime) : null);
        setDataFreshnessStatus(res.dataFreshnessStatus || 'fresh');
        setIsStale(res.isStale || false);
      } else {
        // Explicit clean fallback to DEMO_STATIONS
        setStations(DEMO_STATIONS);
        setIsLive(false);
      }
    } finally {
      setIsFetching(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2.5rem' }}>
      {/* 1. Environment / Live Status Banner */}
      {isLive ? (
        <div style={{
          background: isStale ? '#FFFBEB' : '#F0FDF4',
          border: `1px solid ${isStale ? '#FDE68A' : '#BBF7D0'}`,
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {isStale ? (
              <Clock size={18} style={{ color: '#D97706', flexShrink: 0 }} />
            ) : (
              <Sparkles size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
            )}
            <span style={{ fontSize: '0.83rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              <strong>{isStale ? 'CPCB Telemetry (Data Delay Detected):' : 'Live Environmental Telemetry:'}</strong>{' '}
              Ingested via CPCB / data.gov.in monitoring pipeline. <strong>{stations.length}</strong> active Bengaluru stations reporting.
              <span style={{ marginLeft: '0.45rem', color: isStale ? '#92400E' : 'var(--text-secondary)' }}>
                • Source Observation: <strong>{liveTimestamp}</strong>
                {latestIngestionTime && (
                  <span style={{ marginLeft: '0.45rem' }}>
                    • Ingested: <strong>{latestIngestionTime}</strong>
                  </span>
                )}
                <span style={{ marginLeft: '0.45rem', textTransform: 'capitalize' }}>
                  ({dataFreshnessStatus})
                </span>
              </span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              background: isStale ? '#FEF3C7' : '#dcfce7',
              color: isStale ? '#92400E' : '#15803d',
              border: `1px solid ${isStale ? '#FCD34D' : '#86efac'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '2px 8px',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isStale ? '#D97706' : '#16a34a'
              }}></span>
              {isStale ? 'OBSERVATION DELAYED' : 'LIVE CPCB INGESTION'}
            </span>

            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              title="Refresh / Trigger Ingestion Check"
              style={{
                background: 'white',
                border: '1px solid var(--border-color, #E2E8F0)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px 8px',
                fontSize: '0.72rem',
                cursor: isRefreshing ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--text-secondary)'
              }}
            >
              <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Syncing...' : 'Sync Now'}
            </button>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Info size={13} /> Official Sensor Network
            </span>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--pale-green)',
          border: '1px solid rgba(35, 134, 54, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Sparkles size={18} style={{ color: 'var(--primary-green)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.83rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              <strong>Hyperlocal Environmental Intelligence:</strong> Real-time atmospheric simulation across Bengaluru's 198 BBMP wards. 12 illustrative monitoring nodes active.
              {isFetching ? ' (Checking live sensor feed...)' : ' (Live backend unavailable — showing fallback demo dataset)'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isFetching ? (
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <RefreshCw size={13} className="animate-spin" /> Verifying live API...
              </span>
            ) : (
              <>
                <span className="badge-demo">SIMULATED DEMO</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Info size={13} /> Evaluation dataset
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. AQI Summary Cards Section (5 Cards) */}
      <section aria-label="Key AQI Indicators">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem'
        }}>
          {DEMO_AQI_SUMMARY_METRICS.map((metric, idx) => (
            <AqiSummaryCard key={idx} metric={metric} />
          ))}
        </div>
      </section>

      {/* 3. Main Monitoring Map Section */}
      <section aria-label="Bengaluru Spatial Monitoring Map">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <MonitoringMap
            selectedStationId={selectedStation?.id}
            onSelectStation={(st) => setSelectedStation(st)}
            onInspectStation={(st) => setSelectedStation(st)}
            height="460px"
            stations={stations}
            isLive={isLive}
          />
        </div>
      </section>

      {/* 4. Analytics Section (Trend & Comparison Charts) */}
      <section aria-label="Air Quality Analytics">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '1.25rem'
        }} className="analytics-grid">
          <AqiTrendChart height={270} />
          <PollutantComparisonChart height={270} />
        </div>
      </section>

      {/* 5. Forecast Section */}
      <section aria-label="Forecast Intelligence">
        <ForecastChart height={260} />
      </section>

      {/* 6. Environmental Intelligence Panel */}
      <section aria-label="Environmental Intelligence Factors">
        <IntelligencePanel />
      </section>

      {/* Station Modal Popup */}
      <StationDetailModal
        station={selectedStation}
        onClose={() => setSelectedStation(null)}
      />

      <style>{`
        @media (max-width: 900px) {
          .analytics-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

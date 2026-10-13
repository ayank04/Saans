import React, { useState, useRef, useEffect } from 'react';
import { DEMO_STATIONS, getAqiCategoryColor, getAqiCategoryBg } from '../data/demoData';
import { MonitoringMap } from '../components/dashboard/MonitoringMap';
import { StationDetailModal } from '../components/dashboard/StationDetailModal';
import type { MonitoringStation } from '../types/dashboard';
import { fetchLiveStations, formatTimestamp } from '../services/api';
import { Search, MapPin, X, ArrowUpDown, ExternalLink, SlidersHorizontal, RefreshCw } from 'lucide-react';

export const MapExplorerPage: React.FC = () => {
  const [stations, setStations] = useState<MonitoringStation[]>(DEMO_STATIONS);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [liveTimestamp, setLiveTimestamp] = useState<string | null>(null);
  const [latestIngestionTime, setLatestIngestionTime] = useState<string | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [selectedStationId, setSelectedStationId] = useState<string>(DEMO_STATIONS[0].id);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'aqi-desc' | 'aqi-asc' | 'name'>('aqi-desc');
  const [modalStation, setModalStation] = useState<MonitoringStation | null>(null);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsFetching(true);
      const res = await fetchLiveStations();
      if (!isMounted) return;

      if (res.isLive && res.stations.length > 0) {
        setStations(res.stations);
        setIsLive(true);
        setLiveTimestamp(res.rawTimestamp ? formatTimestamp(res.rawTimestamp) : res.stations[0].lastUpdated);
        setLatestIngestionTime(res.latestIngestionTime ? formatTimestamp(res.latestIngestionTime) : null);
        setIsStale(res.isStale || false);
        setSelectedStationId(res.stations[0].id);
      } else {
        setStations(DEMO_STATIONS);
        setIsLive(false);
      }
      setIsFetching(false);
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedStation = stations.find((s) => s.id === selectedStationId) || stations[0];

  // Filter and sort stations
  const filteredStations = stations.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                          s.area.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          s.wardName.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          (s.wardNumber ? s.wardNumber.toString().includes(searchFilter) : false);
    const matchesCategory = categoryFilter === 'all' || s.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'aqi-desc') return b.currentAqi - a.currentAqi;
    if (sortBy === 'aqi-asc') return a.currentAqi - b.currentAqi;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  // Synchronize scrolling when selectedStationId changes
  useEffect(() => {
    if (selectedStationId && cardRefs.current[selectedStationId]) {
      cardRefs.current[selectedStationId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedStationId]);

  const handleSelectFromMap = (station: MonitoringStation) => {
    setSelectedStationId(station.id);
  };

  const handleResetFilters = () => {
    setSearchFilter('');
    setCategoryFilter('all');
    setSortBy('aqi-desc');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2.5rem' }}>
      {/* Page Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Geospatial Air Quality Explorer
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            High-resolution spatial distribution of ambient particulate matter across Bengaluru urban zones
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isLive ? (
            <>
              <span style={{
                background: isStale ? '#FEF3C7' : '#dcfce7',
                color: isStale ? '#92400E' : '#15803d',
                border: `1px solid ${isStale ? '#FCD34D' : '#86efac'}`,
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isStale ? '#D97706' : '#16a34a'
                }}></span>
                {stations.length} LIVE STATIONS {isStale ? '(OBSERVATION DELAYED)' : '(FRESH)'}
              </span>
              <span className="badge-simulated">CRS: EPSG:4326 (WGS84)</span>
              {liveTimestamp && (
                <span style={{ fontSize: '0.72rem', color: isStale ? '#92400E' : 'var(--text-secondary)', paddingLeft: '4px' }}>
                  Observed: {liveTimestamp}
                  {latestIngestionTime && ` • Ingested: ${latestIngestionTime}`}
                </span>
              )}
            </>
          ) : (
            <>
              {isFetching ? (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={12} className="animate-spin" /> Verifying live sensors...
                </span>
              ) : (
                <span className="badge-demo">12 SIMULATED SENSORS</span>
              )}
              <span className="badge-simulated">CRS: EPSG:4326 (WGS84)</span>
            </>
          )}
        </div>
      </div>

      {/* Main 2-column layout: Left station list, Right substantial map */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          gap: '1.25rem',
          minHeight: '640px'
        }} 
        className="map-explorer-layout"
      >
        {/* Left station selector list */}
        <div 
          className="card-base" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            padding: '1rem', 
            height: '660px',
            overflow: 'hidden'
          }}
        >
          {/* Search and Filter Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search station, area, ward..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.5rem 0.45rem 2.1rem',
                  fontSize: '0.78rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  background: '#FFFFFF',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  aria-label="Clear station search"
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Category Filter Pills & Sort Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                {['all', 'satisfactory', 'moderate'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      background: categoryFilter === cat ? 'var(--primary-green)' : 'var(--bg-card-subtle)',
                      color: categoryFilter === cat ? '#FFFFFF' : 'var(--text-secondary)',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      border: `1px solid ${categoryFilter === cat ? 'var(--primary-green)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUpDown size={12} style={{ color: 'var(--text-muted)' }} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'aqi-desc' | 'aqi-asc' | 'name')}
                  aria-label="Sort stations"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.68rem',
                    color: 'var(--text-secondary)',
                    padding: '2px 4px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="aqi-desc">AQI (High)</option>
                  <option value="aqi-asc">AQI (Low)</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scrollable station cards */}
          <div 
            style={{ 
              flex: 1, 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.5rem',
              paddingRight: '2px'
            }}
          >
            {filteredStations.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2.5rem 1rem',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                gap: '0.75rem'
              }}>
                <SlidersHorizontal size={28} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    No stations match filter
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Try clearing search query or category filters.
                  </div>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredStations.map((station) => {
                const color = getAqiCategoryColor(station.category);
                const isSelected = selectedStationId === station.id;

                return (
                  <div
                    key={station.id}
                    ref={(el) => { cardRefs.current[station.id] = el; }}
                    onClick={() => setSelectedStationId(station.id)}
                    style={{
                      background: isSelected ? 'var(--pale-green)' : '#FFFFFF',
                      border: `1px solid ${isSelected ? 'var(--primary-green)' : 'var(--border-color)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      boxShadow: isSelected ? '0 2px 8px rgba(35, 134, 54, 0.14)' : 'none',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#B5C4B5';
                        e.currentTarget.style.background = 'var(--bg-card-subtle)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.background = '#FFFFFF';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {station.name}
                      </span>
                      <span 
                        className="tabular-nums"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          color
                        }}
                      >
                        {station.currentAqi}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      {station.area} • {station.wardNumber > 0 ? `Ward #${station.wardNumber}` : station.wardName}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem' }}>
                      <span style={{
                        padding: '0.1rem 0.45rem',
                        borderRadius: 'var(--radius-full)',
                        background: getAqiCategoryBg(station.category),
                        color,
                        fontWeight: 600
                      }}>
                        {station.category}
                      </span>
                      <span className="tabular-nums" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {station.pollutants['PM2.5'] ? `PM2.5: ${station.pollutants['PM2.5'].value} µg/m³` : `Dominant: ${station.dominantPollutant}`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Selected Station Quick Diagnostic Strip */}
          {selectedStation && (
            <div style={{
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <MapPin size={13} style={{ color: 'var(--primary-green)' }} />
                  <span>{selectedStation.name}</span>
                </div>
                <span className="tabular-nums" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {selectedStation.latitude.toFixed(2)}° N, {selectedStation.longitude.toFixed(2)}° E
                </span>
              </div>

              <button
                onClick={() => setModalStation(selectedStation)}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>Inspect Full Sensor Audit</span>
                <ExternalLink size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Right Map Canvas */}
        <div className="map-explorer-map-container" style={{ height: '660px', position: 'relative' }}>
          <MonitoringMap
            selectedStationId={selectedStationId}
            onSelectStation={handleSelectFromMap}
            onInspectStation={(st) => setModalStation(st)}
            height="100%"
            stations={stations}
            isLive={isLive}
          />
        </div>
      </div>

      {/* Station Detail Modal when requested */}
      <StationDetailModal
        station={modalStation}
        onClose={() => setModalStation(null)}
      />

      <style>{`
        @media (max-width: 980px) {
          .map-explorer-layout {
            grid-template-columns: 1fr !important;
          }
          .map-explorer-map-container {
            height: 520px !important;
          }
        }
      `}</style>
    </div>
  );
};

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import type { MonitoringStation } from '../../types/dashboard';
import { DEMO_STATIONS, getAqiCategoryColor } from '../../data/demoData';
import { ZoomIn, ZoomOut, RotateCcw, Layers, AlertCircle, Maximize2, X } from 'lucide-react';

export interface MonitoringMapProps {
  selectedStationId?: string;
  onSelectStation: (station: MonitoringStation) => void;
  onInspectStation?: (station: MonitoringStation) => void;
  height?: string;
  className?: string;
  stations?: MonitoringStation[];
  isLive?: boolean;
}

const BENGALURU_CENTER: [number, number] = [12.9716, 77.5946];
const DEFAULT_ZOOM = 11;
const MIN_ZOOM = 9;
const MAX_ZOOM = 18;

// Indian National AQI Categories and Colors
const NAQI_LEGEND = [
  { label: 'Good (0-50)', color: '#10b981' },
  { label: 'Satisfactory (51-100)', color: '#14b8a6' },
  { label: 'Moderate (101-200)', color: '#f59e0b' },
  { label: 'Poor (201-300)', color: '#f97316' },
  { label: 'Very Poor (301-400)', color: '#ef4444' },
  { label: 'Severe (401-500)', color: '#991b1b' },
];

export type BasemapType = 'osm' | 'carto' | 'esri';

interface BasemapOption {
  id: BasemapType;
  label: string;
  url: string;
  attribution: string;
  subdomains?: string;
  maxZoom: number;
}

const BASEMAP_OPTIONS: BasemapOption[] = [
  {
    id: 'osm',
    label: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  {
    id: 'esri',
    label: 'Esri Light Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com" target="_blank" rel="noopener noreferrer">Esri</a>, HERE, &copy; OpenStreetMap',
    maxZoom: 16
  },
  {
    id: 'carto',
    label: 'CartoDB Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }
];

// Helper to check valid coordinates for Bengaluru/Karnataka
const isValidCoordinate = (lat?: number, lng?: number): boolean => {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  // Bounding box roughly covering Karnataka & Greater Bengaluru (11.0N - 14.5N, 76.0E - 78.5E)
  if (lat < 11.0 || lat > 14.5 || lng < 76.0 || lng > 78.5) return false;
  return true;
};

export const MonitoringMap: React.FC<MonitoringMapProps> = ({
  selectedStationId,
  onSelectStation,
  onInspectStation,
  height = '480px',
  className = '',
  stations,
  isLive = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activePollutantView, setActivePollutantView] = useState<'AQI' | 'PM2.5' | 'PM10'>('AQI');
  const [activeBasemap, setActiveBasemap] = useState<BasemapType>('osm');
  const [tileErrorCount, setTileErrorCount] = useState<number>(0);
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);

  // Determine stations to display
  const stationPool = useMemo(() => {
    return stations && stations.length > 0 ? stations : DEMO_STATIONS;
  }, [stations]);

  // Validate stations
  const validStations = useMemo(() => {
    return stationPool.filter((s) => isValidCoordinate(s.latitude, s.longitude));
  }, [stationPool]);

  // Selected station lookup
  const selectedStation = useMemo(() => {
    return validStations.find((s) => s.id === selectedStationId);
  }, [validStations, selectedStationId]);

  // Create custom marker HTML
  const getMarkerHtml = useCallback((
    station: MonitoringStation,
    isSelected: boolean,
    displayVal: string | number
  ): string => {
    const color = getAqiCategoryColor(station.category);
    return `
      <div class="saans-station-marker ${isSelected ? 'marker-wrapper-selected' : ''}" style="cursor: pointer;" role="button" aria-label="${station.name}: AQI ${station.currentAqi}">
        <div class="marker-pulse-ring" style="background-color: ${color}; opacity: ${isSelected ? 0.75 : 0.35}; width: ${isSelected ? '50px' : '42px'}; height: ${isSelected ? '50px' : '42px'};"></div>
        <div class="marker-inner-circle ${isSelected ? 'marker-selected' : ''}" style="
          background-color: ${color};
          border-color: ${isSelected ? '#171B18' : '#FFFFFF'};
          box-shadow: 0 2px 8px ${isSelected ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.22)'};
          transform: ${isSelected ? 'scale(1.28)' : 'scale(1)'};
          outline: ${isSelected ? '2.5px solid #238636' : 'none'};
          outline-offset: 2px;
        ">
          <span class="tabular-nums" style="font-feature-settings: 'tnum'; font-weight: 700; font-size: ${isSelected ? '12px' : '11px'};">${displayVal}</span>
        </div>
      </div>
    `;
  }, []);

  // Create Popup Content
  const getPopupHtml = useCallback((station: MonitoringStation): string => {
    const color = getAqiCategoryColor(station.category);
    const pm25 = station.pollutants['PM2.5']?.value ?? '--';
    const pm10 = station.pollutants['PM10']?.value ?? '--';
    const no2 = station.pollutants['NO2']?.value ?? '--';

    return `
      <div class="saans-map-popup" style="padding: 12px; min-width: 230px; font-family: var(--font-sans); color: #171B18;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 10px; font-family: var(--font-mono); color: #92400E; background: #FEF3C7; padding: 2px 7px; border-radius: 9999px; border: 1px solid #FDE68A; font-weight: 600;">
            SIMULATED
          </span>
          <span style="font-size: 11px; font-weight: 700; color: ${color};">
            ${station.category}
          </span>
        </div>
        
        <div style="font-size: 13.5px; font-weight: 700; color: #171B18; line-height: 1.3; margin-bottom: 2px;">
          ${station.name}
        </div>
        <div style="font-size: 11px; color: #737B75; margin-bottom: 8px;">
          ${station.area} • Ward #${station.wardNumber} (${station.wardName})
        </div>
        
        <div style="display: flex; align-items: center; justify-content: space-between; background: #F3F7F4; border: 1px solid #E5EAE5; border-radius: 6px; padding: 7px 10px; margin-bottom: 8px;">
          <div style="display: flex; flex-direction: column;">
            <span style="font-size: 10px; color: #737B75; font-weight: 500;">Simulated AQI</span>
            <span class="tabular-nums" style="font-size: 20px; font-weight: 800; color: ${color}; font-family: var(--font-mono); font-feature-settings: 'tnum'; line-height: 1.1;">
              ${station.currentAqi}
            </span>
          </div>
          <div style="display: flex; flex-direction: column; text-align: right; gap: 2px;">
            <span style="font-size: 9.5px; color: #737B75;">PM2.5 / PM10 / NO2</span>
            <span class="tabular-nums" style="font-size: 10.5px; font-family: var(--font-mono); color: #171B18; font-weight: 600; font-feature-settings: 'tnum';">
              ${pm25} / ${pm10} / ${no2} µg/m³
            </span>
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #8C948E; margin-bottom: 10px;">
          <span class="tabular-nums">${station.latitude.toFixed(4)}° N, ${station.longitude.toFixed(4)}° E</span>
          <span style="color: #238636; font-weight: 600;">Node: ${station.id}</span>
        </div>

        <button 
          type="button" 
          id="btn-inspect-${station.id}" 
          class="saans-popup-inspect-btn"
          data-station-id="${station.id}"
          style="
            width: 100%;
            background: #238636;
            color: #FFFFFF;
            border: none;
            border-radius: 6px;
            padding: 6px 10px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            transition: background 150ms ease;
          "
        >
          <span>Inspect Full Sensor Audit</span>
          <span style="font-size: 12px;">↗</span>
        </button>
      </div>
    `;
  }, []);

  // 1. Initialize Map Once
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // React Strict Mode safety: clean leftover ID if unmounted
    if ((container as unknown as { _leaflet_id?: number })._leaflet_id && !mapInstanceRef.current) {
      delete (container as unknown as { _leaflet_id?: number })._leaflet_id;
    }

    if (!mapInstanceRef.current) {
      try {
        const map = L.map(container, {
          center: BENGALURU_CENTER,
          zoom: DEFAULT_ZOOM,
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
          zoomControl: false,
          attributionControl: true
        });

        mapInstanceRef.current = map;
      } catch (err) {
        console.warn('Map initialization:', err);
        return;
      }
    }

    const map = mapInstanceRef.current;

    // Invalidate map size after initial rendering
    const timer1 = setTimeout(() => map?.invalidateSize(), 80);
    const timer2 = setTimeout(() => map?.invalidateSize(), 260);
    const timer3 = setTimeout(() => map?.invalidateSize(), 450);

    // ResizeObserver watches container bounds for sidebar collapse, tab changes, and window resizing
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        map?.invalidateSize();
      });
      resizeObserver.observe(container);
    }

    const handleWindowResize = () => {
      map?.invalidateSize();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('resize', handleWindowResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (tileLayerRef.current) {
        tileLayerRef.current.remove();
        tileLayerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (container && (container as unknown as { _leaflet_id?: number })._leaflet_id) {
        delete (container as unknown as { _leaflet_id?: number })._leaflet_id;
      }
    };
  }, []);

  // 2. Manage Tile Layer without recreating the map instance
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
      tileLayerRef.current = null;
    }

    const basemapConfig = BASEMAP_OPTIONS.find((b) => b.id === activeBasemap) || BASEMAP_OPTIONS[0];

    const tileLayer = L.tileLayer(basemapConfig.url, {
      attribution: basemapConfig.attribution,
      subdomains: basemapConfig.subdomains || 'abc',
      maxZoom: basemapConfig.maxZoom
    });

    tileLayer.on('tileerror', () => {
      setTileErrorCount((prev) => prev + 1);
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    // Invalidate size once layer is attached
    map.invalidateSize();
  }, [activeBasemap]);

  // 3. Delegate Popup Inspection Button Click
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handlePopupOpen = (e: L.PopupEvent) => {
      const el = e.popup.getElement();
      if (!el) return;

      const btn = el.querySelector('.saans-popup-inspect-btn') as HTMLButtonElement | null;
      if (btn) {
        const stationId = btn.getAttribute('data-station-id');
        const station = validStations.find((s) => s.id === stationId);
        if (station) {
          btn.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (onInspectStation) {
              onInspectStation(station);
            } else {
              onSelectStation(station);
            }
          };
        }
      }
    };

    map.on('popupopen', handlePopupOpen);
    return () => {
      map.off('popupopen', handlePopupOpen);
    };
  }, [validStations, onInspectStation, onSelectStation]);

  const selectedStationIdRef = useRef(selectedStationId);
  useEffect(() => {
    selectedStationIdRef.current = selectedStationId;
  }, [selectedStationId]);

  // 4. Update Markers (Filter & Pollutant View)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    const filtered = validStations.filter((station) => {
      if (filterCategory === 'all') return true;
      return station.category.toLowerCase() === filterCategory.toLowerCase();
    });

    filtered.forEach((station) => {
      const isSelected = station.id === selectedStationIdRef.current;

      let displayVal: string | number = station.currentAqi;
      if (activePollutantView === 'PM2.5') {
        displayVal = Math.round(station.pollutants['PM2.5']?.value || 0);
      } else if (activePollutantView === 'PM10') {
        displayVal = Math.round(station.pollutants['PM10']?.value || 0);
      }

      const icon = L.divIcon({
        className: 'saans-station-marker-wrapper',
        html: getMarkerHtml(station, isSelected, displayVal),
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
      });

      const marker = L.marker([station.latitude, station.longitude], {
        icon,
        title: `${station.name} (${station.category} AQI: ${station.currentAqi})`,
        zIndexOffset: isSelected ? 1000 : 0
      });

      marker.bindPopup(getPopupHtml(station), {
        maxWidth: 320,
        className: 'saans-custom-leaflet-popup'
      });

      marker.on('click', () => {
        onSelectStation(station);
      });

      marker.addTo(map);
      markersRef.current[station.id] = marker;
    });
  }, [validStations, filterCategory, activePollutantView, getMarkerHtml, getPopupHtml, onSelectStation]);

  // 5. Synchronize Selected Station (Highlight & Pan without destroying markers)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Update icons for selection changes
    validStations.forEach((station) => {
      const marker = markersRef.current[station.id];
      if (!marker) return;

      const isSelected = station.id === selectedStationId;
      let displayVal: string | number = station.currentAqi;
      if (activePollutantView === 'PM2.5') {
        displayVal = Math.round(station.pollutants['PM2.5']?.value || 0);
      } else if (activePollutantView === 'PM10') {
        displayVal = Math.round(station.pollutants['PM10']?.value || 0);
      }

      marker.setIcon(L.divIcon({
        className: 'saans-station-marker-wrapper',
        html: getMarkerHtml(station, isSelected, displayVal),
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
      }));

      marker.setZIndexOffset(isSelected ? 1000 : 0);
    });

    if (selectedStationId) {
      const station = validStations.find((s) => s.id === selectedStationId);
      if (station) {
        map.flyTo([station.latitude, station.longitude], 13, {
          duration: 0.9
        });
        const marker = markersRef.current[station.id];
        if (marker) {
          // Open popup smoothly
          setTimeout(() => {
            marker.openPopup();
          }, 350);
        }
      }
    }
  }, [selectedStationId, validStations, activePollutantView, getMarkerHtml]);

  // Controls Handlers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleReset = () => {
    mapInstanceRef.current?.flyTo(BENGALURU_CENTER, DEFAULT_ZOOM, { duration: 1 });
    mapInstanceRef.current?.closePopup();
  };
  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map || validStations.length === 0) return;
    const bounds = L.latLngBounds(validStations.map((s) => [s.latitude, s.longitude]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  };

  return (
    <div 
      className={`card-base ${className}`}
      style={{
        padding: 0,
        height,
        minHeight: '380px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 1. Map Control Bar Overlay (Light theme) */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        right: '12px',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        pointerEvents: 'none'
      }}>
        {/* Left: Map title, DEMO Notice & Selected Station Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 12px',
          boxShadow: 'var(--shadow-sm)',
          pointerEvents: 'auto',
          maxWidth: '100%'
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Bengaluru Air Quality
          </span>

          {isLive ? (
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              color: '#15803d',
              background: '#dcfce7',
              border: '1px solid #86efac',
              borderRadius: 'var(--radius-sm)',
              padding: '2px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#16a34a' }}></span>
              LIVE CPCB OBSERVATIONS
            </span>
          ) : (
            <span className="badge-demo" style={{ fontSize: '0.62rem' }}>
              SIMULATED TELEMETRY
            </span>
          )}

          {selectedStation && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--pale-green)',
              border: '1px solid rgba(35, 134, 54, 0.25)',
              fontSize: '0.72rem',
              color: 'var(--text-primary)'
            }}>
              <span 
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: getAqiCategoryColor(selectedStation.category)
                }} 
              />
              <span style={{ fontWeight: 600 }}>{selectedStation.name}</span>
              <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: getAqiCategoryColor(selectedStation.category) }}>
                AQI {selectedStation.currentAqi}
              </span>
            </div>
          )}
        </div>

        {/* Right: Basemap switcher & Metric Selector & Filter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '4px 6px',
          boxShadow: 'var(--shadow-sm)',
          pointerEvents: 'auto'
        }}>
          {/* Basemap Switcher Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              aria-label="Toggle basemap layer"
              title="Select Basemap Provider"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '0.72rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 7px',
                cursor: 'pointer'
              }}
            >
              <Layers size={13} style={{ color: 'var(--primary-green)' }} />
              <span style={{ fontWeight: 600 }}>{BASEMAP_OPTIONS.find(b => b.id === activeBasemap)?.label.split(' ')[0]}</span>
            </button>

            {showLayerMenu && (
              <div 
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  background: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-floating)',
                  padding: '6px',
                  minWidth: '170px',
                  zIndex: 30,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', padding: '2px 6px' }}>
                  BASEMAP LAYER
                </div>
                {BASEMAP_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setActiveBasemap(opt.id);
                      setShowLayerMenu(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: activeBasemap === opt.id ? 'var(--pale-green)' : 'transparent',
                      color: activeBasemap === opt.id ? 'var(--primary-green)' : 'var(--text-primary)',
                      fontWeight: activeBasemap === opt.id ? 700 : 500,
                      fontSize: '0.72rem',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span>{opt.label}</span>
                    {activeBasemap === opt.id && <span style={{ color: 'var(--primary-green)' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 2px' }} />

          {/* Metric Selector (AQI / PM2.5 / PM10) */}
          {(['AQI', 'PM2.5', 'PM10'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setActivePollutantView(view)}
              style={{
                background: activePollutantView === view ? 'var(--primary-green)' : 'transparent',
                color: activePollutantView === view ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: activePollutantView === view ? 700 : 500,
                fontSize: '0.72rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 8px',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              {view}
            </button>
          ))}

          <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 2px' }} />

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            aria-label="Filter stations by AQI category"
            style={{
              background: '#FFFFFF',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.72rem',
              padding: '3px 6px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All ({validStations.length})</option>
            <option value="satisfactory">Satisfactory (51-100)</option>
            <option value="moderate">Moderate (101-200)</option>
          </select>
        </div>
      </div>

      {/* 2. Vertical Map Action Controls (Zoom / Reset / Fit) */}
      <div style={{
        position: 'absolute',
        top: '68px',
        right: '12px',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
      }}>
        <button
          onClick={handleZoomIn}
          aria-label="Zoom in on map"
          title="Zoom In"
          style={{
            width: '32px',
            height: '32px',
            background: 'rgba(255, 255, 255, 0.96)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'background var(--transition-fast)'
          }}
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={handleZoomOut}
          aria-label="Zoom out on map"
          title="Zoom Out"
          style={{
            width: '32px',
            height: '32px',
            background: 'rgba(255, 255, 255, 0.96)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleReset}
          aria-label="Reset map view to Bengaluru center"
          title="Reset to Bengaluru (12.97° N, 77.59° E)"
          style={{
            width: '32px',
            height: '32px',
            background: 'rgba(255, 255, 255, 0.96)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--primary-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <RotateCcw size={15} />
        </button>
        <button
          onClick={handleFitBounds}
          aria-label="Fit all Bengaluru monitoring stations in view"
          title="Fit All Stations"
          style={{
            width: '32px',
            height: '32px',
            background: 'rgba(255, 255, 255, 0.96)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* 3. Non-blocking Tile Warning Notification (if any tile fails) */}
      {tileErrorCount > 4 && (
        <div style={{
          position: 'absolute',
          top: '68px',
          left: '12px',
          zIndex: 20,
          background: 'rgba(254, 243, 199, 0.95)',
          border: '1px solid #FCD34D',
          borderRadius: 'var(--radius-md)',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.72rem',
          color: '#92400E',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <AlertCircle size={14} style={{ color: '#D97706' }} />
          <span>Some map tiles failed to load. Check network or switch basemap.</span>
          <button
            onClick={() => setTileErrorCount(0)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#92400E' }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* 4. Map Leaflet Canvas Container */}
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: '100%', zIndex: 10, background: '#F2F4F2' }}
      />

      {/* 5. Bottom NAQI Scale Legend Overlay */}
      <div 
        className="monitoring-map-legend"
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 12px',
          boxShadow: 'var(--shadow-sm)',
          maxWidth: 'calc(100% - 240px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            NAQI SCALE:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {NAQI_LEGEND.map((item, idx) => (
              <span 
                key={idx}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  fontSize: '0.67rem', 
                  color: 'var(--text-primary)' 
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {validStations.length} Verified Stations
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--primary-green)', fontWeight: 600 }}>
            Click marker to inspect telemetry
          </span>
        </div>
      </div>
    </div>
  );
};

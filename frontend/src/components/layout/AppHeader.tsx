import { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  MapPin,
  Clock,
  Info,
  X
} from 'lucide-react';
import { DEMO_METADATA, searchLocations, getAqiCategoryColor } from '../../data/demoData';
import type { NavItemKey } from './AppSidebar';

interface AppHeaderProps {
  activeNav: NavItemKey;
  onOpenMobileSidebar: () => void;
  onSelectStationOrWard?: (id: string, type: 'station' | 'ward') => void;
}

const PAGE_TITLES: Record<NavItemKey, { title: string; subtitle: string }> = {
  overview: {
    title: 'Citywide Environmental Overview',
    subtitle: 'Hyperlocal particulate & gaseous monitoring across Bengaluru BBMP zones'
  },
  map: {
    title: 'Interactive Air Quality Map',
    subtitle: 'Spatial sensor telemetry, station monitors, and localized pollution hot-spots'
  },
  wards: {
    title: 'BBMP Ward Intelligence',
    subtitle: 'Vulnerability ranking, source attributions, and ward-by-ward air profiles'
  },
  forecasts: {
    title: '48-Hour AI-Corrected Forecasts',
    subtitle: 'CAMS atmospheric model combined with localized XGBoost bias corrections'
  },
  why: {
    title: 'Why Is the Air Bad?',
    subtitle: 'Root-cause attribution: vehicular corridors, inversion layers, and dust loading'
  },
  health: {
    title: 'Public Health Advisories & Guidance',
    subtitle: 'Precautionary guidance calibrated for asthmatics, children, and elderly citizens'
  },
  routes: {
    title: 'Clean Commute Corridors',
    subtitle: 'Exposure-minimized routing between Bengaluru hubs versus high-particulate arteries'
  },
  reports: {
    title: 'Citizen Pollution Incident Reports',
    subtitle: 'Hyperlocal community reports on open burning, construction dust, and smoky vehicles'
  }
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeNav,
  onOpenMobileSidebar,
  onSelectStationOrWard
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showDemoInfoModal, setShowDemoInfoModal] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const searchResults = searchQuery.trim().length > 0 ? searchLocations(searchQuery) : [];

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pageInfo = PAGE_TITLES[activeNav] || {
    title: 'SAANS Air Intelligence',
    subtitle: 'Hyperlocal environmental monitoring for Bengaluru'
  };

  return (
    <>
      <header
        role="banner"
        style={{
          height: '68px',
          background: 'transparent',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}
      >
        {/* Left: Mobile Toggle & Page Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
          <button
            onClick={onOpenMobileSidebar}
            aria-label="Open mobile navigation menu"
            className="mobile-header-menu-btn"
            style={{
              display: 'none',
              background: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              padding: '6px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Menu size={20} />
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <h1 style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {pageInfo.title}
            </h1>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }} className="header-subtitle-text">
              {pageInfo.subtitle}
            </span>
          </div>
        </div>

        {/* Middle: Location search input */}
        <div 
          ref={searchContainerRef}
          style={{ 
            position: 'relative', 
            width: '280px',
            maxWidth: '100%' 
          }}
          className="header-search-container"
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#FFFFFF',
            border: `1px solid ${isSearchFocused ? 'var(--primary-green)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '0.45rem 0.75rem',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-sm)',
            transition: 'border-color var(--transition-fast)'
          }}>
            <Search size={15} style={{ color: isSearchFocused ? 'var(--primary-green)' : 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search station, ward, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              aria-label="Search monitoring stations or wards"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                width: '100%',
                fontFamily: 'var(--font-sans)'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search dropdown results */}
          {isSearchFocused && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-floating)',
              zIndex: 50,
              overflow: 'hidden',
              maxHeight: '320px',
              overflowY: 'auto'
            }}>
              <div style={{
                padding: '0.45rem 0.75rem',
                background: 'var(--bg-card-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}>
                Matched Bengaluru Locations ({searchResults.length})
              </div>

              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (onSelectStationOrWard) {
                      onSelectStationOrWard(item.id, item.type);
                    }
                    setIsSearchFocused(false);
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-subtle)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {item.subtitle}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: getAqiCategoryColor(item.category)
                    }}>
                      AQI {item.aqi}
                    </span>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: getAqiCategoryColor(item.category)
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right side: Bengaluru badge, Demo Mode indicator & Last updated */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {/* Bengaluru City Badge */}
          <div 
            className="header-location-badge"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: '#FFFFFF',
              border: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <MapPin size={13} style={{ color: 'var(--primary-green)' }} />
            <span><strong style={{ color: 'var(--text-primary)' }}>Bengaluru</strong>, KA (12.97° N, 77.59° E)</span>
          </div>

          {/* Last updated label */}
          <div 
            className="header-timestamp"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.73rem',
              color: 'var(--text-muted)'
            }}
          >
            <Clock size={13} />
            <span>Updated: <strong style={{ color: 'var(--text-secondary)' }}>{DEMO_METADATA.lastUpdatedFormatted}</strong></span>
          </div>

          {/* DEMO MODE BADGE */}
          <button
            onClick={() => setShowDemoInfoModal(true)}
            aria-label="View demonstration mode details"
            className="badge-demo"
            style={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#d97706'
            }} />
            <span>DEMO MODE</span>
            <Info size={12} />
          </button>
        </div>
      </header>

      {/* Demo Mode Modal (Light theme) */}
      {showDemoInfoModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(23, 27, 24, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div 
            className="modal-animate-enter"
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '520px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-modal)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge-demo">DATA PROVENANCE NOTICE</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>Demonstration Mode Active</h3>
              </div>
              <button
                onClick={() => setShowDemoInfoModal(false)}
                aria-label="Close dialog"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
              All monitoring station values, particulate levels, spatial hot-spots, and causal attributions in this dashboard are generated by the <strong>SAANS Hyperlocal Simulation Engine</strong> for UI testing and evaluation ahead of the 14 October 2026 milestone.
            </p>

            <div style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem'
            }}>
              <div><strong style={{ color: 'var(--text-primary)' }}>Target City:</strong> Bengaluru, Karnataka (BBMP 198 Wards)</div>
              <div><strong style={{ color: 'var(--text-primary)' }}>Station Coordinates:</strong> Valid geolocations (BTM Layout, Peenya, Silk Board, Indiranagar, etc.)</div>
              <div><strong style={{ color: 'var(--text-primary)' }}>Status:</strong> Standalone client-side operational sandbox (Backend decoupled)</div>
              <div><strong style={{ color: 'var(--text-primary)' }}>Dataset Version:</strong> {DEMO_METADATA.datasetVersion}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDemoInfoModal(false)}
                className="btn-primary"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .mobile-header-menu-btn {
            display: block !important;
          }
          .header-subtitle-text {
            display: none !important;
          }
          .header-location-badge {
            display: none !important;
          }
          .header-timestamp {
            display: none !important;
          }
          .header-search-container {
            width: 180px !important;
          }
        }
        @media (max-width: 640px) {
          .header-search-container {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Building2,
  TrendingUp,
  HelpCircle,
  HeartPulse,
  Navigation,
  AlertTriangle,
  Wind,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export type NavItemKey = 
  | 'overview' 
  | 'map' 
  | 'wards' 
  | 'forecasts' 
  | 'why' 
  | 'health' 
  | 'routes' 
  | 'reports';

interface AppSidebarProps {
  activeNav: NavItemKey;
  onSelectNav: (key: NavItemKey) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItemConfig {
  key: NavItemKey;
  label: string;
  badge?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_ITEMS: NavItemConfig[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'map', label: 'Air Quality Map', icon: MapPin },
  { key: 'wards', label: 'Ward Intelligence', icon: Building2 },
  { key: 'forecasts', label: 'Forecasts', icon: TrendingUp },
  { key: 'why', label: 'Why Is the Air Bad?', icon: HelpCircle },
  { key: 'health', label: 'Health Alerts', icon: HeartPulse, badge: 'Active' },
  { key: 'routes', label: 'Clean Routes', icon: Navigation },
  { key: 'reports', label: 'Citizen Reports', icon: AlertTriangle, badge: '4 New' }
];

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeNav,
  onSelectNav,
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(23, 27, 24, 0.4)',
            backdropFilter: 'blur(3px)',
            zIndex: 40,
            display: 'block'
          }}
        />
      )}

      {/* Floating sidebar wrapper */}
      <div 
        className={`floating-sidebar-container ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: isCollapsed ? '92px' : '266px',
          minWidth: isCollapsed ? '92px' : '266px',
          transition: 'width 240ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <aside
          aria-label="Main Navigation Sidebar"
          className="floating-sidebar-inner"
          style={{
            width: isCollapsed ? '76px' : '250px',
            minWidth: isCollapsed ? '76px' : '250px'
          }}
        >
          {/* Brand header */}
          <div style={{
            padding: isCollapsed ? '1.25rem 0.5rem' : '1.25rem 1.15rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--primary-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(35, 134, 54, 0.25)',
                flexShrink: 0
              }}>
                <Wind size={20} strokeWidth={2.4} />
              </div>

              {!isCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '1.18rem',
                    letterSpacing: '0.04em',
                    color: 'var(--text-primary)',
                    lineHeight: 1.1
                  }}>
                    SAANS
                  </span>
                  <span style={{
                    fontSize: '0.67rem',
                    fontWeight: 600,
                    color: 'var(--primary-green)',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                    marginTop: '2px'
                  }}>
                    Hyperlocal Air Intelligence
                  </span>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="mobile-close-btn"
              aria-label="Close navigation sidebar"
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation items list */}
          <nav 
            style={{ 
              flex: 1, 
              padding: '0.85rem 0.65rem', 
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => {
                    onSelectNav(item.key);
                    onCloseMobile();
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  title={isCollapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: isCollapsed ? '0.7rem 0' : '0.6rem 0.8rem',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'var(--pale-green)' : 'transparent',
                    color: isActive ? 'var(--primary-green)' : 'var(--text-secondary)',
                    border: isActive ? '1px solid rgba(35, 134, 54, 0.25)' : '1px solid transparent',
                    cursor: 'pointer',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.84rem',
                    transition: 'all var(--transition-fast)',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--bg-card-subtle)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isActive ? 'var(--primary-green)' : 'var(--text-muted)'
                  }}>
                    <Icon size={18} />
                  </div>

                  {!isCollapsed && (
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  )}

                  {!isCollapsed && item.badge && (
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '0.12rem 0.45rem',
                      borderRadius: 'var(--radius-full)',
                      background: item.key === 'health' ? '#FEE2E2' : '#DCFCE7',
                      color: item.key === 'health' ? '#B91C1C' : '#15803D',
                      border: item.key === 'health' ? '1px solid #FECACA' : '1px solid #BBF7D0'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer / Collapse toggle */}
          <div style={{
            padding: isCollapsed ? '0.75rem 0.4rem' : '0.85rem 0.95rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            background: 'var(--bg-card)'
          }}>
            {!isCollapsed && (
              <div style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 0.65rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span className="badge-demo" style={{ fontSize: '0.58rem', padding: '0.1rem 0.35rem' }}>DEMO DATA</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Bengaluru 2026</span>
                </div>
                <p style={{ fontSize: '0.66rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  Simulated environmental intelligence for UI validation.
                </p>
              </div>
            )}

            {/* Desktop collapse button */}
            <button
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
              className="sidebar-collapse-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                width: '100%',
                padding: '0.45rem 0.6rem',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.74rem',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-card-subtle)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {!isCollapsed && <span>Collapse Sidebar</span>}
              {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>
        </aside>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .floating-sidebar-container {
            position: fixed !important;
            top: 0;
            left: 0;
            padding: 0 !important;
            transform: translateX(-100%);
            width: 250px !important;
            min-width: 250px !important;
            z-index: 50 !important;
          }
          .floating-sidebar-container.mobile-open {
            transform: translateX(0) !important;
          }
          .floating-sidebar-inner {
            border-radius: 0 !important;
            height: 100vh !important;
            width: 250px !important;
            min-width: 250px !important;
          }
          .mobile-close-btn {
            display: block !important;
          }
          .sidebar-collapse-btn {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

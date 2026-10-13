import { useState } from 'react';
import { AppSidebar, type NavItemKey } from './components/layout/AppSidebar';
import { AppHeader } from './components/layout/AppHeader';
import { OverviewPage } from './pages/OverviewPage';
import { MapExplorerPage } from './pages/MapExplorerPage';
import { WardIntelligencePage } from './pages/WardIntelligencePage';
import { ForecastsPage } from './pages/ForecastsPage';
import { WhyIsTheAirBadPage } from './pages/WhyIsTheAirBadPage';
import { HealthAlertsPage } from './pages/HealthAlertsPage';
import { CleanRoutesPage } from './pages/CleanRoutesPage';
import { CitizenReportsPage } from './pages/CitizenReportsPage';

export function App() {
  const [activeNav, setActiveNav] = useState<NavItemKey>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const handleSelectStationOrWard = (_id: string, type: 'station' | 'ward') => {
    if (type === 'station') {
      setActiveNav('map');
    } else {
      setActiveNav('wards');
    }
  };

  const renderActivePage = () => {
    switch (activeNav) {
      case 'overview':
        return <OverviewPage />;
      case 'map':
        return <MapExplorerPage />;
      case 'wards':
        return <WardIntelligencePage />;
      case 'forecasts':
        return <ForecastsPage />;
      case 'why':
        return <WhyIsTheAirBadPage />;
      case 'health':
        return <HealthAlertsPage />;
      case 'routes':
        return <CleanRoutesPage />;
      case 'reports':
        return <CitizenReportsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: 'var(--bg-app)' }}>
      {/* Sidebar */}
      <AppSidebar
        activeNav={activeNav}
        onSelectNav={(key) => setActiveNav(key)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppHeader
          activeNav={activeNav}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onSelectStationOrWard={handleSelectStationOrWard}
        />

        <main 
          id="main-content"
          role="main"
          style={{
            flex: 1,
            padding: '1.5rem',
            maxWidth: '1600px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}
        >
          <div key={activeNav} className="page-transition">
            {renderActivePage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

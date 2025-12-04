import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from '@/contexts/WalletProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { InteractiveBackground } from '@/components/layout/InteractiveBackground';

// Public Pages
import { LandingPage } from '@/pages/LandingPage';

// Main Pages
import { DashboardPage } from '@/pages/DashboardPage';
import { RecommendationsPage } from '@/pages/RecommendationsPage';
import { PortfolioPage } from '@/pages/PortfolioPage';
import { MarketsPage } from '@/pages/MarketsPage';
import { AdvisorPage } from '@/pages/AdvisorPage';
import { KalshorbPage } from '@/pages/KalshorbPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { SettingsPage } from '@/pages/SettingsPage';

function App() {
  return (
    <WalletProvider>
      <AuthProvider>
        <Router>
          {/* Background Layer:
            This sits at z-index 0. It is fixed and covers the screen.
          */}
          <InteractiveBackground />

          {/* Content Layer:
            This sits at z-index 10. relative positioning ensures it 
            appears on top of the canvas background.
          */}
          <div className="relative z-10 min-h-screen">
            <Routes>
              {/* Public Route - New Landing Page */}
              <Route path="/" element={<LandingPage />} />
              
              {/* Protected Routes - wrapped with Layout */}
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/recommendations" element={<RecommendationsPage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/markets" element={<MarketsPage />} />
                <Route path="/advisor" element={<AdvisorPage />} />
                <Route path="/kalshorb" element={<KalshorbPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* Catch-all redirect to Landing Page instead of Connect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </WalletProvider>
  );
}

export default App;
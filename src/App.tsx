import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from '@/contexts/WalletProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';

// Auth Pages
import { WalletConnectPage } from '@/pages/WalletConnectPage';

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
          <Routes>
            {/* Public Routes */}
            <Route path="/connect" element={<WalletConnectPage />} />
            
            {/* Protected Routes - wrapped with Layout */}
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/recommendations" element={<RecommendationsPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/markets" element={<MarketsPage />} />
              <Route path="/advisor" element={<AdvisorPage />} />
              <Route path="/kalshorb" element={<KalshorbPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/connect" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </WalletProvider>
  );
}

export default App;

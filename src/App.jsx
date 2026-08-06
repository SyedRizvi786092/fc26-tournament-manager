import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import { useLiveData } from './hooks/useLiveData.js';
import AuthPage from './pages/AuthPage.jsx';
import AdminSetupPage from './pages/AdminSetupPage.jsx';
import HomePage from './pages/HomePage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import HistoryDetailsPage from './pages/HistoryDetailsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import StatsPage from './pages/StatsPage.jsx';
import MainPage from './pages/MainPage.jsx';
import HallOfFamePage from './pages/HallOfFamePage.jsx';
import ManagerProfilePage from './pages/ManagerProfilePage.jsx';

function AppRoutes() {
  useLiveData(); // start all Firestore listeners

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/history/:id" element={<HistoryDetailsPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/teams" element={<Navigate to="/settings" replace />} />
      <Route path="/hall-of-fame" element={<HallOfFamePage />} />
      <Route path="/profile/:id" element={<ManagerProfilePage />} />
      <Route path="/tournament/:id" element={<MainPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const { currentUser, loading, setupNeeded } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚽</div>
          <div style={{ color: 'var(--t2)', fontSize: 14 }}>Loading…</div>
        </div>
      </div>
    );
  }

  if (!currentUser) return <AuthPage />;

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

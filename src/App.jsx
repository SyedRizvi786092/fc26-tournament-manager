import { useAuth } from './contexts/AuthContext.jsx';
import { useLiveData } from './hooks/useLiveData.js';
import useStore from './store/useStore.js';
import AuthPage from './pages/AuthPage.jsx';
import AdminSetupPage from './pages/AdminSetupPage.jsx';
import SetupPage from './pages/SetupPage.jsx';
import MainPage from './pages/MainPage.jsx';
import ProfilesPage from './pages/ProfilesPage.jsx';
import StatsPage from './pages/StatsPage.jsx';
import HistoryDetailsPage from './pages/HistoryDetailsPage.jsx';

function AppContent() {
  useLiveData(); // start all Firestore listeners

  const { tournament, showProfiles, showStats, viewHistoryId } = useStore();

  if (showProfiles)  return <ProfilesPage />;
  if (showStats)     return <StatsPage />;
  if (viewHistoryId) return <HistoryDetailsPage />;
  if (tournament)    return <MainPage />;
  return <SetupPage />;
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

  if (!currentUser)  return <AuthPage />;
  if (setupNeeded)   return <AdminSetupPage />;

  return <AppContent />;
}

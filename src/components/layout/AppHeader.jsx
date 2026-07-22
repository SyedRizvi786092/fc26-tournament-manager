import useStore from '../../store/useStore.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { updateAdminPresence } from '../../services/firestoreService.js';
import LiveIndicator from '../ui/LiveIndicator.jsx';
import { useEffect } from 'react';

export default function AppHeader() {
  const { tournament, view, setView, goToProfiles, goToStats, goToHub } = useStore();
  const { isAdmin } = useAuth();

  if (!tournament) return null;

  // Track Admin presence: Live when inside tournament (not when complete)
  useEffect(() => {
    if (isAdmin && tournament && tournament.status !== 'complete') {
      updateAdminPresence(tournament.id, true);
    }
  }, [isAdmin, tournament]);

  const handleBackToHub = async () => {
    if (isAdmin && tournament && tournament.status !== 'complete') {
      await updateAdminPresence(tournament.id, false);
    }
    goToHub();
  };

  const t = tournament;
  const lTotal  = t.fixtures.filter(f => f.phase === 'league').length;
  const lPlayed = t.fixtures.filter(f => f.phase === 'league' && f.status === 'played').length;
  const pct     = lTotal ? Math.round((lPlayed / lTotal) * 100) : 0;
  const aS      = (t.suspensions || []).filter(s => !s.served).length;

  // Tabs: Result (only if complete) + Standings + Matches (merged fixtures+playoffs) + Suspensions
  const tabs = [
    ...(t.status === 'complete' ? [{ id: 'result', icon: '🏆', label: 'Result' }] : []),
    { id: 'standings',   icon: '📊', label: 'Standings' },
    { id: 'fixtures',    icon: '📅', label: 'Matches' },
    { id: 'suspensions', icon: '🟥', label: 'Suspensions', badge: aS },
  ];

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="header-brand">
          <button className="btn btn-sm btn-secondary nav-home-btn" onClick={handleBackToHub}>
            ← Home
          </button>
          <div className="header-brand-info">
            {/* Tournament name */}
            <div className="header-name">{t.name}</div>
            {/* Live/Paused/Completed indicator replaces the status label */}
            <LiveIndicator inline />
          </div>
        </div>
        <div className="header-actions">
          <div className="header-action-btns">
            <button className="btn btn-sm btn-secondary" onClick={goToStats}>📊 Stats</button>
            <button className="btn btn-sm btn-secondary" onClick={goToProfiles}>⚙️ Teams</button>
          </div>
        </div>
      </div>
      <div className="header-progress">
        <div className="header-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <nav className="app-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${view === tab.id ? 'active' : ''}`}
            onClick={() => setView(tab.id)}
          >
            {tab.icon} {tab.label}
            {tab.badge ? <span className="nav-badge">{tab.badge}</span> : null}
          </button>
        ))}
      </nav>
    </header>
  );
}

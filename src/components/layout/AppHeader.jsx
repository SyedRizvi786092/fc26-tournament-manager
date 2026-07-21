import useStore from '../../store/useStore.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import LiveIndicator from '../ui/LiveIndicator.jsx';

export default function AppHeader() {
  const { tournament, view, setView, goToProfiles, goToStats, openModal } = useStore();
  const { isAdmin, signOut } = useAuth();

  if (!tournament) return null;

  const t = tournament;
  const lTotal  = t.fixtures.filter(f => f.phase === 'league').length;
  const lPlayed = t.fixtures.filter(f => f.phase === 'league' && f.status === 'played').length;
  const pct     = lTotal ? Math.round((lPlayed / lTotal) * 100) : 0;
  const aS      = (t.suspensions || []).filter(s => !s.served).length;

  const statusLabel = { league: 'League Phase', playoffs: 'Playoffs', complete: '🏆 Complete' }[t.status] || t.status;
  const statusColor = { league: 'var(--blue)', playoffs: 'var(--gold)', complete: 'var(--green)' }[t.status] || 'var(--t2)';

  const tabs = [
    { id: 'standings',   icon: '📊', label: 'Standings' },
    { id: 'fixtures',    icon: '📅', label: 'Fixtures' },
    { id: 'suspensions', icon: '🟥', label: 'Suspensions', badge: aS },
    { id: 'playoffs',    icon: '🏆', label: 'Playoffs' },
  ];

  const handleNew = () => {
    openModal({
      type: 'confirm',
      title: '🔄 New Tournament',
      msg: t.status === 'complete'
        ? 'Archive this completed tournament and start fresh? You can view its results anytime in history.'
        : 'Leave this tournament in progress and start fresh? It will be saved as "In Progress" in history.',
      action: 'newTournament',
    });
  };

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="header-brand">
          <div className="header-logo">⚽</div>
          <div>
            <div className="header-name">{t.name}</div>
            <div className="header-status" style={{ color: statusColor }}>{statusLabel}</div>
          </div>
        </div>
        <div className="header-actions">
          <LiveIndicator />
          <button className="btn btn-sm btn-secondary" onClick={goToStats}>📊 Stats</button>
          <button className="btn btn-sm btn-secondary" onClick={goToProfiles}>⚙️ Teams</button>
          {isAdmin && (
            <button className="btn btn-sm btn-danger" onClick={handleNew}>🔄 New</button>
          )}
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

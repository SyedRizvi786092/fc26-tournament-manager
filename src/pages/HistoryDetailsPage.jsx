import useStore from '../store/useStore.js';
import StandingsTable from '../components/tournament/StandingsTable.jsx';
import FixturesList from '../components/tournament/FixturesList.jsx';
import ResultTab from '../components/tournament/ResultTab.jsx';

function renderHistoryRedCards(t) {
  const rcs = [];
  (t.fixtures || []).forEach(f => {
    if (f.status === 'played' && f.redCards?.length) {
      f.redCards.forEach(rc => {
        rcs.push({
          playerName:   rc.playerName,
          teamName:     t.players.find(p => p.id === rc.teamId)?.teamName || 'Unknown',
          managerName:  t.players.find(p => p.id === rc.teamId)?.name    || 'Unknown',
          phase:        f.phase,
          matchday:     f.matchday,
        });
      });
    }
  });
  if (!rcs.length) {
    return (
      <div className="empty-state">
        <div className="ei">✅</div><h3>No Red Cards Given</h3>
        <p>No players received red cards during this tournament.</p>
      </div>
    );
  }
  return (
    <>
      <div className="sec-title">Red Cards Summary ({rcs.length})</div>
      {rcs.map((rc, i) => {
        const matchLabel = rc.phase === 'final' ? '⭐ Final' : rc.phase === 'eliminator' ? '🔥 Eliminator' : `Matchday ${rc.matchday}`;
        return (
          <div key={i} className="susp-item" style={{ borderLeftColor: 'var(--red)' }}>
            <div>
              <div className="susp-player">🟥 {rc.playerName}</div>
              <div className="susp-team">{rc.managerName} – {rc.teamName}</div>
            </div>
            <div className="susp-serves">
              <div className="susp-serves-lbl">Received In</div>
              <div className="susp-serves-match">{matchLabel}</div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function ManualHistoryDetails({ t, onBack }) {
  const { setHistoryTab } = useStore();
  const champ     = t.players.find(p => p.id === t.champion);
  const finalist1 = t.players.find(p => p.id === t.final?.homeId);
  const finalist2 = t.players.find(p => p.id === t.final?.awayId);
  const formattedDate = new Date(t.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  let hCol = '', aCol = '';
  if (t.final) {
    if      (t.final.homeScore > t.final.awayScore) { hCol = 'color:var(--green)'; aCol = 'color:var(--red)'; }
    else if (t.final.awayScore > t.final.homeScore) { aCol = 'color:var(--green)'; hCol = 'color:var(--red)'; }
  }

  return (
    <div className="profiles-page">
      <div className="profiles-hdr">
        <button className="btn btn-sm btn-secondary" onClick={onBack}>← Home</button>
        <span className="profiles-hdr-title">{t.name} (Retro)</span>
        <span style={{ fontSize: 12, color: 'var(--t2)', marginRight: 12 }}>{formattedDate}</span>
      </div>
      <div className="profiles-body" style={{ maxWidth: 640, paddingTop: 20 }}>
        <div className="champ-banner">
          <div className="champ-trophy">🏆</div>
          <div className="champ-label">Tournament Champion</div>
          <div className="champ-name">{champ?.name || '—'}</div>
          <div className="champ-club">{champ?.teamName || '—'}</div>
        </div>
        <div className="setup-card" style={{ marginBottom: 20 }}>
          <div className="setup-card-title">⚽ Grand Final Result</div>
          {t.final && (
            <div className="score-wrap" style={{ padding: '20px 0' }}>
              <div className="score-side">
                <div className="score-side-name">{finalist1?.name || '—'}</div>
                <div className="score-side-club">{finalist1?.teamName || '—'}</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: hCol ? 'var(--green)' : undefined }}>{t.final.homeScore}</div>
              </div>
              <span className="score-sep" style={{ fontSize: 32, paddingBottom: 0 }}>—</span>
              <div className="score-side">
                <div className="score-side-name">{finalist2?.name || '—'}</div>
                <div className="score-side-club">{finalist2?.teamName || '—'}</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: aCol ? 'var(--green)' : undefined }}>{t.final.awayScore}</div>
              </div>
            </div>
          )}
          {t.final?.penaltyWinner && (
            <div style={{ textAlign: 'center', color: 'var(--gold)', fontSize: 13, fontWeight: 700 }}>
              🥅 Penalties Winner: {t.players.find(p => p.id === t.final.penaltyWinner)?.name}
            </div>
          )}
        </div>
        <div className="setup-card">
          <div className="setup-card-title">👥 Participating Managers ({t.players.length})</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {t.players.map(p => (
              <div key={p.id} className="profile-card" style={{ padding: '10px 15px' }}>
                <div className="profile-avatar" style={{ width: 32, height: 32, fontSize: 14 }}>👤</div>
                <div className="profile-info">
                  <div className="profile-name" style={{ fontSize: 14 }}>{p.name}</div>
                  <div className="profile-club" style={{ fontSize: 12 }}>{p.teamName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HistoryDetailsPage() {
  const { selectedTournamentId, historyTab, setHistoryTab, goToHub, history } = useStore();
  const t = history.find(h => h.id === selectedTournamentId);

  if (!t) return <div className="empty-state"><h3>Tournament Not Found</h3></div>;
  if (t.isManual) return <ManualHistoryDetails t={t} onBack={goToHub} />;

  const formattedDate = new Date(t.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  // FixturesList now includes Playoffs inline, so no need to manually append them
  const tabContent = {
    result:    <ResultTab      tournament={t} isHistory />,
    standings: <StandingsTable tournament={t} isHistory />,
    fixtures:  <FixturesList   tournament={t} isHistory />,
    redcards:  renderHistoryRedCards(t),
  }[historyTab] ?? <ResultTab tournament={t} isHistory />;

  const tabs = [
    { id: 'result',    icon: '🏆', label: 'Result' },
    { id: 'standings', icon: '📊', label: 'Standings' },
    { id: 'fixtures',  icon: '📅', label: 'Matches' },
    { id: 'redcards',  icon: '🟥', label: 'Red Cards' },
  ];

  return (
    <div className="profiles-page">
      <div className="profiles-hdr">
        <button className="btn btn-sm btn-secondary" onClick={goToHub}>← Home</button>
        <span className="profiles-hdr-title">{t.name}</span>
        <span style={{ fontSize: 12, color: 'var(--t2)', marginRight: 12 }}>{formattedDate}</span>
      </div>
      <div style={{ borderBottom: '1px solid var(--border)', background: 'rgba(7,9,15,.97)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 18px' }}>
          <nav className="app-nav" style={{ borderTop: 'none' }}>
            {tabs.map(tab => (
              <button key={tab.id} className={`nav-tab ${historyTab === tab.id ? 'active' : ''}`}
                onClick={() => setHistoryTab(tab.id)}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
      <div className="profiles-body" style={{ paddingTop: 20, maxWidth: 860 }}>
        {tabContent}
      </div>
    </div>
  );
}

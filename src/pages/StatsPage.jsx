import useStore from '../store/useStore.js';

function getManagerStats(history) {
  const stats = {};
  const getEntry = (name) => {
    const lc = name.trim().toLowerCase();
    if (!stats[lc]) stats[lc] = { name: name.trim(), wins: 0, runnerUps: 0, played: 0 };
    return stats[lc];
  };

  history.forEach(h => {
    if (h.status !== 'complete') return;
    h.players.forEach(p => getEntry(p.name).played++);

    const champPlayer = h.players.find(p => p.id === h.champion);
    if (champPlayer) getEntry(champPlayer.name).wins++;

    let ruPlayer = null;
    if (h.isManual && h.final) {
      const ruId = h.final.homeId === h.champion ? h.final.awayId : h.final.homeId;
      ruPlayer = h.players.find(p => p.id === ruId);
    } else {
      const fin = (h.fixtures || []).find(f => f.phase === 'final');
      if (fin && fin.status === 'played') {
        let ruId = null;
        if      (fin.homeScore > fin.awayScore) ruId = fin.awayId;
        else if (fin.awayScore > fin.homeScore) ruId = fin.homeId;
        else if (fin.penaltyWinner) ruId = fin.penaltyWinner === fin.homeId ? fin.awayId : fin.homeId;
        if (ruId) ruPlayer = h.players.find(p => p.id === ruId);
      }
    }
    if (ruPlayer) getEntry(ruPlayer.name).runnerUps++;
  });

  return Object.values(stats).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.runnerUps !== a.runnerUps) return b.runnerUps - a.runnerUps;
    return b.played - a.played;
  });
}

export default function StatsPage() {
  const { history, goToHub } = useStore();
  const stats = getManagerStats(history);

  return (
    <div className="profiles-page">
      <div className="profiles-hdr">
        <button className="btn btn-sm btn-secondary" onClick={goToHub}>← Home</button>
        <span className="profiles-hdr-title">Manager Leaderboard &amp; Stats</span>
      </div>

      <div className="profiles-body" style={{ maxWidth: 760, paddingTop: 20 }}>
        <div className="setup-card">
          <div className="setup-card-title">📊 Lifetime Standings</div>
          <div className="standings-wrap">
            <table className="standings-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th style={{ textAlign: 'left', paddingLeft: 10 }}>Manager</th>
                  <th>Wins 🏆</th>
                  <th>Runner-Up 🥈</th>
                  <th>Played</th>
                  <th>Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {stats.length ? stats.map((st, i) => {
                  const wr = st.played > 0 ? ((st.wins / st.played) * 100).toFixed(1) + '%' : '0.0%';
                  return (
                    <tr key={st.name}>
                      <td className="st-pos">{i + 1}</td>
                      <td style={{ textAlign: 'left', fontWeight: 700, paddingLeft: 10 }}>{st.name}</td>
                      <td style={{ fontWeight: 800, color: 'var(--gold)', fontSize: 15 }}>🏆 {st.wins}</td>
                      <td style={{ fontWeight: 700, color: 'var(--t2)' }}>🥈 {st.runnerUps}</td>
                      <td>{st.played}</td>
                      <td style={{ fontWeight: 600, color: 'var(--green)' }}>{wr}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={6} style={{ padding: 40, color: 'var(--t3)', textAlign: 'center' }}>No history data found to compile stats.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 12, lineHeight: 1.5 }}>
            * Leaderboard is calculated automatically from all completed tournaments in history (including manually retrofitted entries).
          </p>
        </div>
      </div>
    </div>
  );
}

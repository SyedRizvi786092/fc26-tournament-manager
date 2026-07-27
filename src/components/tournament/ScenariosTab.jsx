import { calculateScenarios } from '../../logic/scenarios.js';
import Badge from '../ui/Badge.jsx';

export default function ScenariosTab({ tournament }) {
  if (!tournament) return null;

  const { teamScenarios } = calculateScenarios(tournament);
  const numPlayers = tournament.players.length;
  const unplayedLeague = tournament.fixtures.filter(f => f.phase === 'league' && f.status !== 'played');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'qualified_final':
        return <Badge variant="green">🟢 Qualified for Final (1st)</Badge>;
      case 'qualified':
        return <Badge variant="blue">{numPlayers === 5 ? '🔵 Qualified for Eliminator' : '🟢 Qualified for Final'}</Badge>;
      case 'contending':
        return <Badge variant="gold">🟡 In Contention</Badge>;
      case 'eliminated':
        return <Badge variant="muted">🔴 Eliminated</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="scenarios-tab-container">
      <div className="sec-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>🎯 Qualification Scenarios &amp; Math</span>
        <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--t2)', textTransform: 'none' }}>
          {unplayedLeague.length} league match{unplayedLeague.length === 1 ? '' : 'es'} remaining
        </span>
      </div>

      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--t2)' }}>
        💡 <strong>Playoff Format:</strong>{' '}
        {numPlayers === 5
          ? '1st Place goes directly to the Grand Final. 2nd & 3rd Place play in the Eliminator match.'
          : 'The Top 2 teams in the league phase qualify directly to the Grand Final.'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {teamScenarios.map(t => (
          <div key={t.id} className="setup-card" style={{ padding: '16px 18px', marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--t1)' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t2)' }}>{t.teamName}</div>
              </div>
              <div>{getStatusBadge(t.status)}</div>
            </div>

            {/* Points bar */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--t2)', marginBottom: 4 }}>
                <span>Points Progress: <strong>{t.currentPts} pts</strong></span>
                <span>Max Possible: <strong>{t.maxPts} pts</strong></span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,.07)', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${t.maxPts > 0 ? (t.currentPts / t.maxPts) * 100 : 0}%`,
                    background: t.status.includes('qualified') ? 'var(--green)' : t.status === 'eliminated' ? 'var(--red)' : 'var(--gold)',
                    borderRadius: 3,
                    transition: 'width .3s ease',
                  }}
                />
              </div>
            </div>

            {/* Requirements list */}
            <div style={{ background: 'rgba(0,0,0,.2)', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
              {t.requirements.map((req, idx) => (
                <div key={idx} style={{ color: req.startsWith('🟢') || req.startsWith('🔵') ? 'var(--green)' : req.startsWith('🔴') ? 'var(--t3)' : 'var(--t1)', padding: '2px 0' }}>
                  {req}
                </div>
              ))}
            </div>

            {/* Remaining fixtures list */}
            {t.remainingFixtures.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.05)', fontSize: 12, color: 'var(--t2)' }}>
                <strong>Remaining Match{t.remainingFixtures.length > 1 ? 'es' : ''}:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {t.remainingFixtures.map(rf => (
                    <div key={rf.fixtureId} style={{ padding: '4px 8px', background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', borderRadius: 6 }}>
                      Matchday {rf.matchday}: {rf.isHome ? 'vs' : '@'} {rf.opponentName} ({rf.opponentClub})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

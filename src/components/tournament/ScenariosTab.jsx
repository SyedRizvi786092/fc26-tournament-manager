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
        <span>🎯 Qualification Scenarios &amp; Requirements</span>
        <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--t2)', textTransform: 'none' }}>
          {unplayedLeague.length} league match{unplayedLeague.length === 1 ? '' : 'es'} remaining
        </span>
      </div>

      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--t2)' }}>
        💡 <strong>Playoff Format:</strong>{' '}
        {numPlayers === 5
          ? '1st Place advances directly to the Grand Final. 2nd & 3rd Place play in the Eliminator.'
          : 'The Top 2 teams in the league phase advance to the Grand Final.'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {teamScenarios.map(t => (
          <div key={t.id} className="setup-card" style={{ padding: '16px 18px', marginBottom: 0 }}>
            {/* Header: Manager Name, Club, Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--t1)' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t2)' }}>{t.teamName}</div>
              </div>
              <div>{getStatusBadge(t.status)}</div>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, background: 'rgba(255,255,255,.03)', borderRadius: 8, padding: '8px 12px', textAlign: 'center', marginBottom: 12, border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase' }}>Played</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{t.played}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase' }}>Record</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{t.W}W - {t.D}D - {t.L}L</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase' }}>Points</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>{t.currentPts}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase' }}>GD</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.GD > 0 ? 'var(--green)' : t.GD < 0 ? 'var(--red)' : 'var(--t1)' }}>
                  {t.GD > 0 ? `+${t.GD}` : t.GD}
                </div>
              </div>
            </div>

            {/* Requirements & Target Box */}
            <div style={{ background: 'rgba(0,0,0,.25)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 8, padding: '12px 14px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {t.requirements.map((req, idx) => (
                <div
                  key={idx}
                  style={{
                    color: req.startsWith('🟢') || req.startsWith('🔵') ? 'var(--green)' : req.startsWith('🔴') ? 'var(--t3)' : 'var(--t1)',
                    lineHeight: 1.4,
                  }}
                >
                  {req}
                </div>
              ))}
            </div>

            {/* Remaining Fixtures List */}
            {t.remainingFixtures.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.05)', fontSize: 12, color: 'var(--t2)' }}>
                <strong>Remaining Match{t.remainingFixtures.length > 1 ? 'es' : ''} ({t.remainingFixtures.length}):</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {t.remainingFixtures.map(rf => (
                    <div key={rf.fixtureId} style={{ padding: '4px 10px', background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}>
                      Matchday {rf.matchday}: {rf.isHome ? 'vs' : '@'} <strong>{rf.opponentName}</strong> ({rf.opponentClub})
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

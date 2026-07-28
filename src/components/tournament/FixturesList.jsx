import FixtureCard from './FixtureCard.jsx';
import EmptyState from '../ui/EmptyState.jsx';

export default function FixturesList({ tournament, isHistory = false, onOpen }) {
  if (!tournament) return null;

  const lfix = tournament.fixtures.filter(f => f.phase === 'league');
  const days = [...new Set(lfix.map(f => f.matchday))].sort((a, b) => a - b);

  const elim = tournament.fixtures.find(f => f.phase === 'eliminator');
  const fin  = tournament.fixtures.find(f => f.phase === 'final');
  const hasPlayoffs = elim || fin;
  const inPlayoffPhase = tournament.status === 'playoffs' || tournament.status === 'complete';

  return (
    <>
      <div className="sec-title">League Fixtures</div>
      {days.map(md => {
        const matches = lfix.filter(f => f.matchday === md);
        const done    = matches.every(m => m.status === 'played');
        return (
          <div key={md} className="matchday-group">
            <div className="matchday-hdr">
              <span className="matchday-pill">Matchday {md}</span>
              {done && <span className="md-done">✓ Completed</span>}
            </div>
            {matches.map(f => (
              <FixtureCard key={f.id} fixture={f} tournament={tournament} isHistory={isHistory} onOpen={onOpen} />
            ))}
          </div>
        );
      })}

      {/* Playoffs section — always shown once available, whether in-progress or history */}
      {(hasPlayoffs || inPlayoffPhase) && (
        <div className="matchday-group" style={{ marginTop: 30 }}>
          <div className="sec-title">Playoffs</div>
          {!inPlayoffPhase && !hasPlayoffs && (
            <EmptyState
              icon="⏳"
              title="League Phase In Progress"
              message="Playoffs will appear here once all league matches are completed."
            />
          )}
          {elim && (
            <div style={{ marginBottom: 20 }}>
              <div className="bracket-round-title">🔥 Eliminator</div>
              <FixtureCard fixture={elim} tournament={tournament} isHistory={isHistory} onOpen={onOpen} />
              {elim.status === 'locked' && (
                <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 7 }}>Waiting for league phase to end…</p>
              )}
            </div>
          )}
          {fin && (
            <div>
              <div className="bracket-round-title">⭐ Grand Final</div>
              <FixtureCard fixture={fin} tournament={tournament} isHistory={isHistory} onOpen={onOpen} />
              {fin.status === 'locked' && (
                <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 7 }}>Waiting for Eliminator result…</p>
              )}
            </div>
          )}
        </div>
      )}

      {!isHistory && (
        <p style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginTop: 12 }}>
          Click any fixture to enter or edit the score &amp; red cards
        </p>
      )}
    </>
  );
}

import FixtureCard from './FixtureCard.jsx';
import EmptyState from '../ui/EmptyState.jsx';

export default function PlayoffBracket({ tournament, isHistory = false, onOpen }) {
  if (!tournament) return null;

  if (tournament.status === 'league') {
    const rem = tournament.fixtures.filter(f => f.phase === 'league' && f.status !== 'played').length;
    return (
      <EmptyState
        icon="⏳"
        title="League Phase In Progress"
        message={`${rem} match${rem !== 1 ? 'es' : ''} remaining before playoffs unlock.`}
      />
    );
  }

  const elim = tournament.fixtures.find(f => f.phase === 'eliminator');
  const fin  = tournament.fixtures.find(f => f.phase === 'final');

  return (
    <div className="bracket">
      {elim && (
        <div>
          <div className="bracket-round-title">🔥 Eliminator</div>
          <FixtureCard fixture={elim} tournament={tournament} isHistory={isHistory} onOpen={onOpen} />
          <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 7 }}>Winner advances to the Grand Final</p>
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
  );
}

import FixtureCard from './FixtureCard.jsx';

export default function FixturesList({ tournament, isHistory = false, onOpen }) {
  if (!tournament) return null;
  const lfix = tournament.fixtures.filter(f => f.phase === 'league');
  const days = [...new Set(lfix.map(f => f.matchday))].sort((a, b) => a - b);

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
      {!isHistory && (
        <p style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginTop: 4 }}>
          Click any fixture to enter or edit the score &amp; red cards
        </p>
      )}
    </>
  );
}

import FixtureCard from './FixtureCard.jsx';
import { calculateScenarios } from '../../logic/scenarios.js';

export default function FixturesList({ tournament, isHistory = false, onOpen }) {
  if (!tournament) return null;

  const lfix = tournament.fixtures.filter(f => f.phase === 'league');
  const days = [...new Set(lfix.map(f => f.matchday))].sort((a, b) => a - b);

  const numPlayers = tournament.players.length;
  const scenarios = calculateScenarios(tournament);

  const existingElim = tournament.fixtures.find(f => f.phase === 'eliminator');
  const existingFin  = tournament.fixtures.find(f => f.phase === 'final');

  // Build Eliminator card (for 5-player tournaments)
  let elimCard = null;
  if (numPlayers === 5) {
    if (existingElim) {
      elimCard = {
        ...existingElim,
        homeId: existingElim.homeId || scenarios.locked2nd,
        awayId: existingElim.awayId || scenarios.locked3rd,
        homeLabel: 'TBD (2nd Place)',
        awayLabel: 'TBD (3rd Place)',
      };
    } else {
      elimCard = {
        id: 'virtual_elim',
        phase: 'eliminator',
        status: 'locked',
        homeId: scenarios.locked2nd || null,
        awayId: scenarios.locked3rd || null,
        homeLabel: 'TBD (2nd Place)',
        awayLabel: 'TBD (3rd Place)',
        homeScore: null,
        awayScore: null,
        redCards: [],
      };
    }
  }

  // Build Grand Final card (for 3, 4, or 5 player tournaments)
  let finCard = null;
  if (existingFin) {
    finCard = {
      ...existingFin,
      homeId: existingFin.homeId || scenarios.locked1st,
      awayId: existingFin.awayId || (numPlayers !== 5 ? scenarios.locked2nd : null),
      homeLabel: 'TBD (1st Place)',
      awayLabel: numPlayers === 5 ? 'TBD (Winner of Eliminator)' : 'TBD (2nd Place)',
    };
  } else {
    finCard = {
      id: 'virtual_final',
      phase: 'final',
      status: 'locked',
      homeId: scenarios.locked1st || null,
      awayId: numPlayers !== 5 ? (scenarios.locked2nd || null) : null,
      homeLabel: 'TBD (1st Place)',
      awayLabel: numPlayers === 5 ? 'TBD (Winner of Eliminator)' : 'TBD (2nd Place)',
      homeScore: null,
      awayScore: null,
      redCards: [],
    };
  }

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

      {/* Playoffs section — ALWAYS shown from start of tournament */}
      <div className="matchday-group" style={{ marginTop: 30 }}>
        <div className="sec-title">Playoffs</div>
        {elimCard && (
          <div style={{ marginBottom: 20 }}>
            <div className="bracket-round-title">🔥 Eliminator</div>
            <FixtureCard fixture={elimCard} tournament={tournament} isHistory={isHistory} onOpen={onOpen} />
            {elimCard.status === 'locked' && (
              <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 7 }}>
                {scenarios.locked2nd && scenarios.locked3rd
                  ? '🔒 Matchup locked! Plays once league phase ends.'
                  : 'Teams dynamically qualify as league phase progresses…'}
              </p>
            )}
          </div>
        )}
        {finCard && (
          <div>
            <div className="bracket-round-title">⭐ Grand Final</div>
            <FixtureCard fixture={finCard} tournament={tournament} isHistory={isHistory} onOpen={onOpen} />
            {finCard.status === 'locked' && (
              <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 7 }}>
                {scenarios.locked1st && (numPlayers !== 5 ? scenarios.locked2nd : true)
                  ? '🔒 Finalist(s) locked! Plays once preceding matches complete.'
                  : 'Teams dynamically qualify as league phase progresses…'}
              </p>
            )}
          </div>
        )}
      </div>

      {!isHistory && (
        <p style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginTop: 12 }}>
          Click any fixture to enter or edit the score &amp; red cards
        </p>
      )}
    </>
  );
}

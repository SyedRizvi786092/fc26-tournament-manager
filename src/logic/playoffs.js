import { uid } from './uid.js';
import { getStandings } from './standings.js';

export function createPlayoffs(tournament) {
  const st = getStandings(tournament);
  const fixtures = [...tournament.fixtures];

  if (tournament.players.length === 5) {
    const elim = {
      id: uid(), matchday: null,
      homeId: st[1].id, awayId: st[2].id,
      status: 'pending', homeScore: null, awayScore: null,
      redCards: [], penaltyWinner: null, phase: 'eliminator',
    };
    const fin = {
      id: uid(), matchday: null,
      homeId: st[0].id, awayId: null,
      status: 'locked', homeScore: null, awayScore: null,
      redCards: [], penaltyWinner: null, phase: 'final',
      eliminatorId: elim.id,
    };
    fixtures.push(elim, fin);
  } else {
    fixtures.push({
      id: uid(), matchday: null,
      homeId: st[0].id, awayId: st[1].id,
      status: 'pending', homeScore: null, awayScore: null,
      redCards: [], penaltyWinner: null, phase: 'final',
    });
  }

  return { ...tournament, status: 'playoffs', fixtures };
}

export function resolveEliminator(fixtures, eliminatorFixture) {
  let winner;
  if      (eliminatorFixture.homeScore > eliminatorFixture.awayScore) winner = eliminatorFixture.homeId;
  else if (eliminatorFixture.awayScore > eliminatorFixture.homeScore) winner = eliminatorFixture.awayId;
  else    winner = eliminatorFixture.penaltyWinner;

  return fixtures.map(f =>
    f.phase === 'final' && winner
      ? { ...f, awayId: winner, status: 'pending' }
      : f
  );
}

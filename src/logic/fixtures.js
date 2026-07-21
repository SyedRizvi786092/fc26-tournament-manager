import { uid } from './uid.js';

/**
 * Generates round-robin fixtures for a given set of players.
 * Supports 1 or 2 legs (home/away swap).
 * Migrated verbatim from index.html.
 */
export function generateFixtures(players, legs = 1) {
  const ids  = players.map(p => p.id);
  const list = ids.length % 2 === 0 ? [...ids] : [...ids, null];
  const total = list.length, rounds = total - 1, perRound = total / 2;
  const fixtures = [];

  // Leg 1
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < perRound; i++) {
      const home = list[i], away = list[total - 1 - i];
      if (home !== null && away !== null) {
        fixtures.push({
          id: uid(), matchday: r + 1,
          homeId: home, awayId: away,
          status: 'pending', homeScore: null, awayScore: null,
          redCards: [], penaltyWinner: null, phase: 'league',
        });
      }
    }
    const last = list.splice(total - 1, 1)[0];
    list.splice(1, 0, last);
  }

  // Leg 2 — swap home/away
  if (legs === 2) {
    const leg1Count = fixtures.length;
    for (let j = 0; j < leg1Count; j++) {
      const f = fixtures[j];
      fixtures.push({
        id: uid(), matchday: f.matchday + rounds,
        homeId: f.awayId, awayId: f.homeId,
        status: 'pending', homeScore: null, awayScore: null,
        redCards: [], penaltyWinner: null, phase: 'league',
      });
    }
  }

  return fixtures;
}

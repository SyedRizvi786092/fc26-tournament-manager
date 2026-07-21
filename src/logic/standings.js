/**
 * Calculates league standings with tiebreaker: Pts → GD → GF → H2H.
 * Migrated verbatim from index.html.
 */
export function getStandings(tournament) {
  if (!tournament) return [];
  const played = tournament.fixtures.filter(
    f => f.phase === 'league' && f.status === 'played'
  );
  const map = {};
  tournament.players.forEach(p => {
    map[p.id] = { ...p, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 };
  });

  played.forEach(f => {
    const h = map[f.homeId], a = map[f.awayId];
    if (h && a) {
      h.P++; a.P++;
      h.GF += f.homeScore; h.GA += f.awayScore;
      a.GF += f.awayScore; a.GA += f.homeScore;
      h.GD = h.GF - h.GA; a.GD = a.GF - a.GA;
      if      (f.homeScore > f.awayScore) { h.W++; h.Pts += 3; a.L++; }
      else if (f.awayScore > f.homeScore) { a.W++; a.Pts += 3; h.L++; }
      else { h.D++; a.D++; h.Pts++; a.Pts++; }
    }
  });

  return Object.values(map).sort((a, b) => {
    if (b.Pts !== a.Pts) return b.Pts - a.Pts;
    if (b.GD  !== a.GD)  return b.GD  - a.GD;
    if (b.GF  !== a.GF)  return b.GF  - a.GF;
    return h2hPts(b.id, a.id, played) - h2hPts(a.id, b.id, played);
  });
}

export function h2hPts(A, B, played) {
  let pts = 0;
  played.forEach(f => {
    if (f.homeId === A && f.awayId === B) {
      if (f.homeScore > f.awayScore) pts += 3;
      else if (f.homeScore === f.awayScore) pts += 1;
    } else if (f.awayId === A && f.homeId === B) {
      if (f.awayScore > f.homeScore) pts += 3;
      else if (f.homeScore === f.awayScore) pts += 1;
    }
  });
  return pts;
}

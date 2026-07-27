import { h2hPts } from './standings.js';

/**
 * Simulates remaining league fixtures to determine early qualification locks
 * and human-readable scenarios for each team.
 */
export function calculateScenarios(tournament) {
  if (!tournament || !tournament.players || !tournament.fixtures) {
    return { locked1st: null, locked2nd: null, locked3rd: null, teamScenarios: [] };
  }

  const players = tournament.players;
  const numPlayers = players.length;
  const targetRankCutoff = numPlayers === 5 ? 3 : 2; // Top 2 for 3/4 teams; Top 3 for 5 teams

  const playedLeague = tournament.fixtures.filter(f => f.phase === 'league' && f.status === 'played');
  const unplayedLeague = tournament.fixtures.filter(f => f.phase === 'league' && f.status !== 'played');

  // Compute current points & base stats
  const baseMap = {};
  players.forEach(p => {
    baseMap[p.id] = { id: p.id, name: p.name, teamName: p.teamName, Pts: 0, GF: 0, GA: 0, GD: 0, P: 0, W: 0, D: 0, L: 0 };
  });

  playedLeague.forEach(f => {
    const h = baseMap[f.homeId], a = baseMap[f.awayId];
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

  // Calculate max possible points for each team
  players.forEach(p => {
    const remainingCount = unplayedLeague.filter(f => f.homeId === p.id || f.awayId === p.id).length;
    baseMap[p.id].remainingCount = remainingCount;
    baseMap[p.id].maxPts = baseMap[p.id].Pts + (remainingCount * 3);
  });

  // If no unplayed matches, standings are final
  if (unplayedLeague.length === 0) {
    const finalSt = Object.values(baseMap).sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF);
    return {
      locked1st: finalSt[0]?.id || null,
      locked2nd: finalSt[1]?.id || null,
      locked3rd: finalSt[2]?.id || null,
      teamScenarios: players.map(p => {
        const st = baseMap[p.id];
        const rank = finalSt.findIndex(s => s.id === p.id) + 1;
        const qualified = numPlayers === 5 ? rank <= 3 : rank <= 2;
        return {
          id: p.id,
          name: p.name,
          teamName: p.teamName,
          rank,
          status: qualified ? (numPlayers === 5 && rank === 1 ? 'qualified_final' : 'qualified') : 'eliminated',
          maxPts: st.Pts,
          currentPts: st.Pts,
          remainingCount: 0,
          remainingFixtures: [],
          requirements: qualified ? ['Qualified for playoffs!'] : ['Eliminated from playoffs.'],
        };
      }),
    };
  }

  // Permutation simulation over unplayed matches
  // Cap at 7 unplayed matches for full 3^k simulation (3^7 = 2187 iterations); for more, sample key outcomes
  const simFixtures = unplayedLeague.slice(0, 8);
  const totalSims = Math.pow(3, simFixtures.length);

  const teamSimStats = {};
  players.forEach(p => {
    teamSimStats[p.id] = { minRank: 99, maxRank: 0, ranks: [], qualCount: 0, directFinalCount: 0 };
  });

  for (let i = 0; i < totalSims; i++) {
    let temp = i;
    const simPlayed = [...playedLeague];

    for (let j = 0; j < simFixtures.length; j++) {
      const outcome = temp % 3; // 0: Home win 2-0, 1: Draw 1-1, 2: Away win 0-2
      temp = Math.floor(temp / 3);
      const f = simFixtures[j];

      let hs = 0, as = 0;
      if (outcome === 0) { hs = 2; as = 0; }
      else if (outcome === 1) { hs = 1; as = 1; }
      else { hs = 0; as = 2; }

      simPlayed.push({ homeId: f.homeId, awayId: f.awayId, homeScore: hs, awayScore: as });
    }

    // Compute standings for this simulation
    const simMap = {};
    players.forEach(p => {
      simMap[p.id] = { id: p.id, Pts: 0, GD: 0, GF: 0, GA: 0 };
    });
    simPlayed.forEach(f => {
      const h = simMap[f.homeId], a = simMap[f.awayId];
      if (h && a) {
        h.GF += f.homeScore; h.GA += f.awayScore;
        a.GF += f.awayScore; a.GA += f.homeScore;
        h.GD = h.GF - h.GA; a.GD = a.GF - a.GA;
        if      (f.homeScore > f.awayScore) { h.Pts += 3; }
        else if (f.awayScore > f.homeScore) { a.Pts += 3; }
        else { h.Pts++; a.Pts++; }
      }
    });

    const simSorted = Object.values(simMap).sort((a, b) => {
      if (b.Pts !== a.Pts) return b.Pts - a.Pts;
      if (b.GD  !== a.GD)  return b.GD  - a.GD;
      if (b.GF  !== a.GF)  return b.GF  - a.GF;
      return h2hPts(b.id, a.id, simPlayed) - h2hPts(a.id, b.id, simPlayed);
    });

    simSorted.forEach((s, idx) => {
      const r = idx + 1;
      const stats = teamSimStats[s.id];
      if (r < stats.minRank) stats.minRank = r;
      if (r > stats.maxRank) stats.maxRank = r;
      if (r <= targetRankCutoff) stats.qualCount++;
      if (r === 1) stats.directFinalCount++;
    });
  }

  // Determine locked spots
  let locked1st = null, locked2nd = null, locked3rd = null;
  players.forEach(p => {
    const stats = teamSimStats[p.id];
    if (stats.minRank === 1 && stats.maxRank === 1) locked1st = p.id;
    if (numPlayers !== 5) {
      if (stats.minRank <= 2 && stats.maxRank <= 2 && !locked1st) locked2nd = p.id;
    } else {
      if (stats.minRank === 2 && stats.maxRank === 2) locked2nd = p.id;
      if (stats.minRank === 3 && stats.maxRank === 3) locked3rd = p.id;
    }
  });

  // Build per-team scenarios & requirements
  const teamScenarios = players.map(p => {
    const st = baseMap[p.id];
    const stats = teamSimStats[p.id];
    const qualPct = Math.round((stats.qualCount / totalSims) * 100);
    const directPct = Math.round((stats.directFinalCount / totalSims) * 100);

    const remainingFixtures = unplayedLeague
      .filter(f => f.homeId === p.id || f.awayId === p.id)
      .map(f => {
        const oppId = f.homeId === p.id ? f.awayId : f.homeId;
        const opp = players.find(x => x.id === oppId);
        return {
          fixtureId: f.id,
          matchday: f.matchday,
          opponentName: opp ? opp.name : 'Unknown',
          opponentClub: opp ? opp.teamName : '—',
          isHome: f.homeId === p.id,
        };
      });

    let status = 'contending'; // qualified | qualified_final | contending | eliminated
    if (numPlayers === 5) {
      if (stats.maxRank === 1) status = 'qualified_final';
      else if (stats.maxRank <= 3) status = 'qualified';
      else if (stats.minRank > 3) status = 'eliminated';
    } else {
      if (stats.maxRank <= 2) status = 'qualified';
      else if (stats.minRank > 2) status = 'eliminated';
    }

    const requirements = [];

    if (status === 'qualified_final') {
      requirements.push('🟢 Mathematically guaranteed 1st Place & direct entry to Grand Final!');
    } else if (status === 'qualified') {
      requirements.push(numPlayers === 5 ? '🔵 Mathematically guaranteed Top 3 (Eliminator spot)!' : '🟢 Mathematically guaranteed Top 2 (Grand Final spot)!');
    } else if (status === 'eliminated') {
      requirements.push('🔴 Mathematically eliminated from playoff contention.');
    } else {
      // In contention logic
      const ptsNeeded = Math.max(0, st.maxPts - st.Pts);
      if (st.remainingCount === 1) {
        const opp = remainingFixtures[0]?.opponentName || 'opponent';
        if (qualPct >= 75) {
          requirements.push(`Needs a win or draw vs ${opp} to lock qualification.`);
        } else if (qualPct >= 50) {
          requirements.push(`Must WIN final match vs ${opp} to qualify.`);
        } else {
          requirements.push(`Must WIN vs ${opp} and relies on other results to pass competitors.`);
        }
      } else if (st.remainingCount > 1) {
        if (qualPct >= 80) {
          requirements.push(`Needs 1 win from remaining ${st.remainingCount} matches to guarantee qualification.`);
        } else {
          requirements.push(`Must target at least ${Math.ceil(st.remainingCount * 1.5)} pts from ${st.remainingCount} remaining matches.`);
        }
      }
      requirements.push(`Current: ${st.Pts} pts (Max possible: ${st.maxPts} pts).`);
    }

    return {
      id: p.id,
      name: p.name,
      teamName: p.teamName,
      status,
      currentPts: st.Pts,
      maxPts: st.maxPts,
      remainingCount: st.remainingCount,
      minRank: stats.minRank,
      maxRank: stats.maxRank,
      qualPct,
      directPct,
      remainingFixtures,
      requirements,
    };
  });

  return {
    locked1st,
    locked2nd,
    locked3rd,
    teamScenarios,
  };
}

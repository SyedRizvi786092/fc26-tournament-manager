import { h2hPts } from './standings.js';

/**
 * Calculates mathematical qualification status and precise, wins-based requirements
 * for all teams in a tournament during the league phase.
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

  // Compute current points & base stats for each team
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

  // Calculate remaining unplayed matches per team
  players.forEach(p => {
    const remainingFixtures = unplayedLeague.filter(f => f.homeId === p.id || f.awayId === p.id);
    baseMap[p.id].remainingCount = remainingFixtures.length;
    baseMap[p.id].maxPts = baseMap[p.id].Pts + (remainingFixtures.length * 3);
  });

  // If all league matches played, return final status
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
          played: st.P,
          currentPts: st.Pts,
          maxPts: st.Pts,
          W: st.W, D: st.D, L: st.L, GD: st.GD,
          remainingCount: 0,
          winsTarget: 0,
          remainingFixtures: [],
          requirements: qualified
            ? [numPlayers === 5 && rank === 1 ? '🏆 Finished 1st Place — Qualified for Grand Final!' : '✅ Qualified for Playoffs!']
            : ['🔴 Eliminated from playoffs.'],
        };
      }),
    };
  }

  // Simulation over unplayed matches
  // Cap unplayed simulation array to 8 matches max for fast computation
  const simFixtures = unplayedLeague.slice(0, 8);
  const totalSims = Math.pow(3, simFixtures.length);

  const teamSimStats = {};
  players.forEach(p => {
    teamSimStats[p.id] = { minRank: 99, maxRank: 0, qualCount: 0, directFinalCount: 0 };
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

  // Calculate wins needed for each team to guarantee qualification
  const teamScenarios = players.map(p => {
    const st = baseMap[p.id];
    const stats = teamSimStats[p.id];
    const remainingCount = st.remainingCount;

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

    let status = 'contending'; // qualified_final | qualified | contending | eliminated
    if (numPlayers === 5) {
      if (stats.maxRank === 1) status = 'qualified_final';
      else if (stats.maxRank <= 3) status = 'qualified';
      else if (stats.minRank > 3) status = 'eliminated';
    } else {
      if (stats.maxRank <= 2) status = 'qualified';
      else if (stats.minRank > 2) status = 'eliminated';
    }

    // Determine minimum wins needed out of remainingCount matches to guarantee qualification 100%
    let winsTarget = 99;
    if (status === 'contending' && remainingCount > 0) {
      for (let w = 0; w <= remainingCount; w++) {
        // Test if adding w wins (and 0 draws) to team p guarantees top rank
        let guaranteedInAllScenarios = true;

        for (let i = 0; i < totalSims; i++) {
          let temp = i;
          const simPlayed = [...playedLeague];

          for (let j = 0; j < simFixtures.length; j++) {
            const outcome = temp % 3;
            temp = Math.floor(temp / 3);
            const f = simFixtures[j];

            let hs = 0, as = 0;
            // Override team p's fixtures to give team p 'w' wins
            const isTeamHome = f.homeId === p.id;
            const isTeamAway = f.awayId === p.id;

            if (isTeamHome || isTeamAway) {
              // Assume Team p wins
              if (isTeamHome) { hs = 2; as = 0; }
              else { hs = 0; as = 2; }
            } else {
              if (outcome === 0) { hs = 2; as = 0; }
              else if (outcome === 1) { hs = 1; as = 1; }
              else { hs = 0; as = 2; }
            }

            simPlayed.push({ homeId: f.homeId, awayId: f.awayId, homeScore: hs, awayScore: as });
          }

          // Evaluate rank of p
          const simMap = {};
          players.forEach(pl => { simMap[pl.id] = { id: pl.id, Pts: 0, GD: 0, GF: 0, GA: 0 }; });
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

          const pRank = simSorted.findIndex(x => x.id === p.id) + 1;
          if (pRank > targetRankCutoff) {
            guaranteedInAllScenarios = false;
            break;
          }
        }

        if (guaranteedInAllScenarios) {
          winsTarget = w;
          break;
        }
      }
    } else {
      winsTarget = 0;
    }

    // Build human-readable requirement messages
    const requirements = [];

    if (status === 'qualified_final') {
      requirements.push('🟢 Mathematically guaranteed 1st Place & direct entry to Grand Final!');
    } else if (status === 'qualified') {
      requirements.push(numPlayers === 5 ? '🔵 Mathematically guaranteed Top 3 (Eliminator spot)!' : '🟢 Mathematically guaranteed Top 2 (Grand Final spot)!');
    } else if (status === 'eliminated') {
      requirements.push('🔴 Mathematically eliminated from playoff contention.');
    } else {
      // Contending: Give clear wins-based target
      const targetSpotName = numPlayers === 5 ? 'Top 3' : 'Top 2';

      if (winsTarget <= remainingCount) {
        if (winsTarget === 0) {
          requirements.push(`🎯 Highly Favorable: A win or draw in remaining match(es) guarantees ${targetSpotName}.`);
        } else if (winsTarget === 1 && remainingCount === 1) {
          requirements.push(`🎯 Target: Needs 1 win in the final match to guarantee ${targetSpotName}.`);
        } else if (winsTarget === 1 && remainingCount > 1) {
          requirements.push(`🎯 Target: Needs 1 win from remaining ${remainingCount} matches to guarantee ${targetSpotName}.`);
        } else {
          requirements.push(`🎯 Target: Needs ${winsTarget} wins from remaining ${remainingCount} matches to guarantee ${targetSpotName}.`);
        }
      } else {
        requirements.push(`🎯 Must win ALL ${remainingCount} remaining matches AND relies on other results to reach ${targetSpotName}.`);
      }

      // Check specific opponent matchday insights
      if (remainingFixtures.length === 1) {
        const rf = remainingFixtures[0];
        requirements.push(`💡 Key Match (Matchday ${rf.matchday}): ${rf.isHome ? 'vs' : '@'} ${rf.opponentName} (${rf.opponentClub}).`);
      } else if (remainingFixtures.length > 1) {
        const nextRf = remainingFixtures[0];
        requirements.push(`💡 Next Match (Matchday ${nextRf.matchday}): ${nextRf.isHome ? 'vs' : '@'} ${nextRf.opponentName}.`);
      }

      // Check Goal Difference note if GD is close to competitors
      const closestCompetitor = players.find(x => x.id !== p.id && Math.abs(baseMap[x.id].Pts - st.Pts) <= 3);
      if (closestCompetitor) {
        const compSt = baseMap[closestCompetitor.id];
        const gdDiff = st.GD - compSt.GD;
        if (Math.abs(gdDiff) <= 3) {
          requirements.push(`⚖️ Goal Difference Warning: Tied/close on GD with ${closestCompetitor.name} (${st.GD > 0 ? '+' : ''}${st.GD} vs ${compSt.GD > 0 ? '+' : ''}${compSt.GD}). Win margin matters!`);
        }
      }
    }

    return {
      id: p.id,
      name: p.name,
      teamName: p.teamName,
      status,
      played: st.P,
      currentPts: st.Pts,
      maxPts: st.maxPts,
      W: st.W, D: st.D, L: st.L, GD: st.GD,
      remainingCount,
      winsTarget,
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

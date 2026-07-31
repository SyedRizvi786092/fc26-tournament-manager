/**
 * Mathematical Qualification Engine
 *
 * Determines, after every completed league match, the mathematical status of
 * every team regarding qualification for the Playoffs / Final.
 *
 * Uses exhaustive DFS with backtracking over all remaining league fixtures,
 * simulating three outcomes per match (Home Win / Draw / Away Win) to
 * enumerate every possible points distribution.
 *
 * CORRECTNESS MODEL — handling GD uncertainty:
 *   Since real matches can end with any score (e.g., 1-5, 10-0), GD from
 *   unplayed matches is unbounded. The algorithm handles this by splitting
 *   teams tied on points into two categories:
 *
 *   • "Completed" teams  — have NO remaining matches. Their GD, GF, and
 *     H2H are fully determined from actual results → ranked deterministically.
 *
 *   • "Active" teams — appear in at least one remaining match. Their GD is
 *     variable → can finish at ANY position within a same-points group.
 *
 *   This guarantees:
 *     🟢 = team qualifies in 100% of scenarios (never falsely green)
 *     🔴 = team eliminated in 100% of scenarios (never falsely red)
 *     🟡 = at least one scenario exists for each outcome
 *
 * Qualification thresholds:
 *   3 or 4 teams → top 2 qualify (both go to Final).
 *   5 teams      → top 3 qualify (1st → Final, 2nd–3rd → Eliminator).
 *
 * @module qualification
 */

import { h2hPts } from './standings.js';

/* ── Configuration ─────────────────────────────────────────────────────── */

/** Maximum remaining matches for which full DFS is attempted. */
const MAX_DFS_REMAINING = 16;

/* ── Main Export ────────────────────────────────────────────────────────── */

/**
 * Determines the qualification status of each team in the tournament.
 *
 * @param   {Object}      tournament  The tournament object
 * @returns {Object|null} Qualification data, or null if not in league phase.
 *
 *   {
 *     status:          { [teamId]: 'qualified' | 'eliminated' | 'alive' },
 *     lockedPositions: { [position]: teamId | null }   // 1-indexed
 *   }
 */
export function getQualificationStatus(tournament) {
  /* ── Guard: only run during league phase ──────────────────────────── */
  if (!tournament || tournament.status !== 'league') return null;

  const n            = tournament.players.length;
  const qualifyCount = n === 5 ? 3 : 2;
  const teamIds      = tournament.players.map(p => p.id);

  const leagueFixtures = tournament.fixtures.filter(f => f.phase === 'league');
  const played         = leagueFixtures.filter(f => f.status === 'played');
  const remaining      = leagueFixtures.filter(f => f.status !== 'played');

  /* ── Initialise result ────────────────────────────────────────────── */
  const result = { status: {}, lockedPositions: {}, qualifiedInOrder: [] };
  teamIds.forEach(id => { result.status[id] = 'alive'; });
  for (let i = 1; i <= n; i++) result.lockedPositions[i] = null;

  /* ── Edge: no matches played → all alive ──────────────────────────── */
  if (played.length === 0) return result;

  /* ── Build base stats from actually-played matches ────────────────── */
  const stats = {};
  teamIds.forEach(id => {
    stats[id] = { GF: 0, GA: 0, GD: 0, Pts: 0 };
  });
  played.forEach(f => {
    const h = stats[f.homeId], a = stats[f.awayId];
    if (!h || !a) return;
    h.GF += f.homeScore; h.GA += f.awayScore;
    a.GF += f.awayScore; a.GA += f.homeScore;
    h.GD = h.GF - h.GA;  a.GD = a.GF - a.GA;
    if      (f.homeScore > f.awayScore) { h.Pts += 3; }
    else if (f.awayScore > f.homeScore) { a.Pts += 3; }
    else    { h.Pts++; a.Pts++; }
  });

  /* ── Edge: all league matches played → final standings (deterministic) */
  if (remaining.length === 0) {
    const ranked = [...teamIds].sort((aId, bId) => {
      const a = stats[aId], b = stats[bId];
      if (b.Pts !== a.Pts) return b.Pts - a.Pts;
      if (b.GD  !== a.GD)  return b.GD  - a.GD;
      if (b.GF  !== a.GF)  return b.GF  - a.GF;
      return h2hPts(bId, aId, played) - h2hPts(aId, bId, played);
    });
    ranked.forEach((id, i) => {
      result.status[id] = i < qualifyCount ? 'qualified' : 'eliminated';
      result.lockedPositions[i + 1] = id;
    });
    result.qualifiedInOrder = ranked.slice(0, qualifyCount);
    return result;
  }

  /* ── Identify "active" teams ──────────────────────────────────────── */
  // Active = team appears in at least one remaining match.
  // Their GD from simulated matches is unbounded → any position possible
  // among same-points peers.
  //
  // Completed = team has NO remaining matches.
  // Their GD/GF/H2H are fully determined → rank deterministically.
  const activeTeams = new Set();
  remaining.forEach(f => {
    activeTeams.add(f.homeId);
    activeTeams.add(f.awayId);
  });

  /* ── Quick-bounds check (point-based, ignores tie-breakers) ───────── */
  const remainingPerTeam = {};
  teamIds.forEach(id => {
    remainingPerTeam[id] = remaining.filter(
      f => f.homeId === id || f.awayId === id
    ).length;
  });

  const maxPts = {}, minPts = {};
  teamIds.forEach(id => {
    maxPts[id] = stats[id].Pts + 3 * remainingPerTeam[id];
    minPts[id] = stats[id].Pts;
  });

  const resolved = new Set();

  // Eliminated: ≥ qualifyCount other teams GUARANTEED more points.
  teamIds.forEach(id => {
    const above = teamIds.filter(o => o !== id && minPts[o] > maxPts[id]).length;
    if (above >= qualifyCount) {
      result.status[id] = 'eliminated';
      resolved.add(id);
    }
  });

  // Qualified: fewer than qualifyCount other teams can even MATCH points.
  teamIds.forEach(id => {
    if (resolved.has(id)) return;
    const couldBeAbove = teamIds.filter(
      o => o !== id && maxPts[o] >= minPts[id]
    ).length;
    if (couldBeAbove < qualifyCount) {
      result.status[id] = 'qualified';
      resolved.add(id);
    }
  });

  if (resolved.size === teamIds.length) return result;
  if (remaining.length > MAX_DFS_REMAINING) return result;

  /* ── Full DFS with backtracking ───────────────────────────────────── */
  const unresolvedIds = teamIds.filter(id => !resolved.has(id));
  const tracker = {};
  teamIds.forEach(id => {
    tracker[id] = {
      seenInTopN:    false,
      seenOutOfTopN: false,
      minPos:        n + 1,
      maxPos:        0,
    };
  });

  let earlyExit = false;

  /* ── Leaf evaluator ───────────────────────────────────────────────── */
  // For teams tied on points:
  //   • Completed teams → rank deterministically by GD → GF → H2H
  //   • Active teams → can land at ANY position within the tied group
  //
  // Each team gets a best-position / worst-position within the group.
  function evaluateLeaf() {
    const sorted = [...teamIds].sort((a, b) => stats[b].Pts - stats[a].Pts);

    let pos = 1;
    let i = 0;

    while (i < sorted.length) {
      const pts = stats[sorted[i]].Pts;
      let j = i;
      while (j < sorted.length && stats[sorted[j]].Pts === pts) j++;
      const group = sorted.slice(i, j);
      const groupSize = group.length;

      if (groupSize === 1) {
        /* ── Solo team at this point level: position is exact ──────── */
        const id = group[0];
        const t  = tracker[id];
        if (pos <= qualifyCount) t.seenInTopN = true;
        else                    t.seenOutOfTopN = true;
        if (pos < t.minPos) t.minPos = pos;
        if (pos > t.maxPos) t.maxPos = pos;
      } else {
        /* ── Tied group: split into completed / active ─────────────── */
        const completed   = group.filter(id => !activeTeams.has(id));
        const activeCount = groupSize - completed.length;

        // Rank completed teams deterministically using actual GD→GF→H2H.
        // Their stats were never modified by DFS (they have no remaining matches).
        completed.sort((aId, bId) => {
          const a = stats[aId], b = stats[bId];
          if (b.GD !== a.GD) return b.GD - a.GD;
          if (b.GF !== a.GF) return b.GF - a.GF;
          return h2hPts(bId, aId, played) - h2hPts(aId, bId, played);
        });

        for (const id of group) {
          let bestInGroup, worstInGroup;

          if (!activeTeams.has(id)) {
            // Completed: fixed rank among completed peers.
            // Active teams can slot above or below → shift worst position.
            const rankAmongCompleted = completed.indexOf(id) + 1;
            bestInGroup  = rankAmongCompleted;                // all active below
            worstInGroup = rankAmongCompleted + activeCount;  // all active above
          } else {
            // Active: GD is unbounded → can be anywhere in the group.
            bestInGroup  = 1;
            worstInGroup = groupSize;
          }

          const bestPos  = pos + bestInGroup  - 1;
          const worstPos = pos + worstInGroup - 1;

          const t = tracker[id];
          if (bestPos  <= qualifyCount) t.seenInTopN    = true;
          if (worstPos >  qualifyCount) t.seenOutOfTopN = true;
          if (bestPos  < t.minPos) t.minPos = bestPos;
          if (worstPos > t.maxPos) t.maxPos = worstPos;
        }
      }

      pos += groupSize;
      i = j;
    }

    // Early termination: all unresolved teams have been seen in BOTH
    // positions → every one of them is alive, no more DFS needed.
    earlyExit = unresolvedIds.every(
      id => tracker[id].seenInTopN && tracker[id].seenOutOfTopN
    );
  }

  /* ── DFS: branch on W / D / L only (points change) ───────────────── */
  function dfs(idx) {
    if (earlyExit) return;

    if (idx === remaining.length) {
      evaluateLeaf();
      return;
    }

    const f = remaining[idx];
    const h = stats[f.homeId], a = stats[f.awayId];

    // ── Home Win ────────────────────────────────────────────────────
    h.Pts += 3;
    dfs(idx + 1);
    h.Pts -= 3;
    if (earlyExit) return;

    // ── Draw ────────────────────────────────────────────────────────
    h.Pts += 1; a.Pts += 1;
    dfs(idx + 1);
    h.Pts -= 1; a.Pts -= 1;
    if (earlyExit) return;

    // ── Away Win ────────────────────────────────────────────────────
    a.Pts += 3;
    dfs(idx + 1);
    a.Pts -= 3;
  }

  dfs(0);

  /* ── Determine status for unresolved teams ────────────────────────── */
  unresolvedIds.forEach(id => {
    const t = tracker[id];
    if (t.seenInTopN && !t.seenOutOfTopN)      result.status[id] = 'qualified';
    else if (t.seenOutOfTopN && !t.seenInTopN) result.status[id] = 'eliminated';
    else                                        result.status[id] = 'alive';
  });

  /* ── Position locks (only valid if DFS exhausted every branch) ────── */
  if (!earlyExit) {
    teamIds.forEach(id => {
      const t = tracker[id];
      if (t.minPos === t.maxPos && t.minPos >= 1 && t.minPos <= n) {
        result.lockedPositions[t.minPos] = id;
      }
    });
  }

  /* ── Qualified teams in current standings order ───────────────────── */
  // Sort ALL qualified teams by their actual (played-match) stats to give
  // the best-estimate slot ordering for the playoff preview. This does NOT
  // claim their exact final position is known — it is just the current
  // standings order among qualified teams, used for the preview display.
  const qualifiedIds = teamIds.filter(id => result.status[id] === 'qualified');
  if (qualifiedIds.length === qualifyCount) {
    result.qualifiedInOrder = qualifiedIds.sort((aId, bId) => {
      const a = stats[aId], b = stats[bId];
      if (b.Pts !== a.Pts) return b.Pts - a.Pts;
      if (b.GD  !== a.GD)  return b.GD  - a.GD;
      if (b.GF  !== a.GF)  return b.GF  - a.GF;
      return h2hPts(bId, aId, played) - h2hPts(aId, bId, played);
    });
  }

  return result;
}

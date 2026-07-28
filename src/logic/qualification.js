/**
 * Mathematical Qualification Engine
 *
 * Determines, after every completed league match, the mathematical status of
 * every team regarding qualification for the Playoffs / Final.
 *
 * Uses exhaustive DFS with backtracking over all remaining league fixtures,
 * simulating three canonical outcomes per match (Home Win 1-0, Draw 0-0,
 * Away Win 0-1) and applying the app's full tie-breaker sequence
 * (Pts → GD → GF → H2H).
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

/* ── Helpers ───────────────────────────────────────────────────────────── */

/**
 * Rank team IDs by the app's existing tie-breaker sequence:
 * Pts → GD → GF → H2H.
 *
 * @param {Object}   stats     Mutable stats map { [id]: {Pts,GD,GF,…} }
 * @param {Object[]} allPlayed All effective played matches (actual + simulated)
 * @param {string[]} teamIds   Array of team ID strings
 * @returns {string[]} Sorted team IDs (best first)
 */
function rankTeamIds(stats, allPlayed, teamIds) {
  return [...teamIds].sort((aId, bId) => {
    const a = stats[aId], b = stats[bId];
    if (b.Pts !== a.Pts) return b.Pts - a.Pts;
    if (b.GD  !== a.GD)  return b.GD  - a.GD;
    if (b.GF  !== a.GF)  return b.GF  - a.GF;
    return h2hPts(bId, aId, allPlayed) - h2hPts(aId, bId, allPlayed);
  });
}

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

  const n             = tournament.players.length;
  const qualifyCount  = n === 5 ? 3 : 2;
  const teamIds       = tournament.players.map(p => p.id);

  const leagueFixtures = tournament.fixtures.filter(f => f.phase === 'league');
  const played         = leagueFixtures.filter(f => f.status === 'played');
  const remaining      = leagueFixtures.filter(f => f.status !== 'played');

  /* ── Initialise result ────────────────────────────────────────────── */
  const result = { status: {}, lockedPositions: {} };
  teamIds.forEach(id => { result.status[id] = 'alive'; });
  for (let i = 1; i <= n; i++) result.lockedPositions[i] = null;

  /* ── Edge: no matches played → all alive ──────────────────────────── */
  if (played.length === 0) return result;

  /* ── Build base stats from actually-played matches ────────────────── */
  const stats = {};
  teamIds.forEach(id => {
    stats[id] = { P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 };
  });

  played.forEach(f => {
    const h = stats[f.homeId], a = stats[f.awayId];
    if (!h || !a) return;
    h.P++; a.P++;
    h.GF += f.homeScore; h.GA += f.awayScore;
    a.GF += f.awayScore; a.GA += f.homeScore;
    h.GD = h.GF - h.GA;  a.GD = a.GF - a.GA;
    if      (f.homeScore > f.awayScore) { h.W++; h.Pts += 3; a.L++; }
    else if (f.awayScore > f.homeScore) { a.W++; a.Pts += 3; h.L++; }
    else    { h.D++; a.D++; h.Pts++; a.Pts++; }
  });

  /* ── Edge: all league matches played → final standings ────────────── */
  if (remaining.length === 0) {
    const allPlayed = played.map(f => ({
      homeId: f.homeId, awayId: f.awayId,
      homeScore: f.homeScore, awayScore: f.awayScore,
    }));
    const ranked = rankTeamIds(stats, allPlayed, teamIds);
    ranked.forEach((id, i) => {
      result.status[id] = i < qualifyCount ? 'qualified' : 'eliminated';
      result.lockedPositions[i + 1] = id;
    });
    return result;
  }

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

  // Eliminated: ≥ qualifyCount other teams GUARANTEED more points than
  // this team's absolute best.
  teamIds.forEach(id => {
    const above = teamIds.filter(o => o !== id && minPts[o] > maxPts[id]).length;
    if (above >= qualifyCount) {
      result.status[id] = 'eliminated';
      resolved.add(id);
    }
  });

  // Qualified: fewer than qualifyCount other teams can even MATCH this
  // team's absolute worst → guaranteed top-N.
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

  // All teams resolved by quick bounds — return (no position-lock data).
  if (resolved.size === teamIds.length) return result;

  // Too many remaining matches for DFS — unresolved stay as 'alive'.
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

  // Build effective-played array (actual + simulated; grows/shrinks in DFS)
  const allPlayed = played.map(f => ({
    homeId: f.homeId, awayId: f.awayId,
    homeScore: f.homeScore, awayScore: f.awayScore,
  }));

  let earlyExit = false; // true once every unresolved team has been seen in
                          // BOTH top-N and outside top-N → all alive.

  function dfs(idx) {
    if (earlyExit) return;

    if (idx === remaining.length) {
      // ── Leaf node: rank teams and record positions ────────────────
      const ranked = rankTeamIds(stats, allPlayed, teamIds);
      for (let pos = 0; pos < ranked.length; pos++) {
        const id  = ranked[pos];
        const t   = tracker[id];
        const p1  = pos + 1;            // 1-indexed position
        if (p1 <= qualifyCount) t.seenInTopN    = true;
        else                   t.seenOutOfTopN = true;
        if (p1 < t.minPos) t.minPos = p1;
        if (p1 > t.maxPos) t.maxPos = p1;
      }

      // Check early termination for unresolved teams only
      earlyExit = unresolvedIds.every(
        id => tracker[id].seenInTopN && tracker[id].seenOutOfTopN
      );
      return;
    }

    const f   = remaining[idx];
    const hId = f.homeId, aId = f.awayId;
    const h   = stats[hId], a = stats[aId];

    // ── Outcome 1: Home Win (1–0) ──────────────────────────────────
    h.P++; a.P++; h.W++; a.L++; h.Pts += 3;
    h.GF++; a.GA++; h.GD = h.GF - h.GA; a.GD = a.GF - a.GA;
    allPlayed.push({ homeId: hId, awayId: aId, homeScore: 1, awayScore: 0 });
    dfs(idx + 1);
    allPlayed.pop();
    h.P--; a.P--; h.W--; a.L--; h.Pts -= 3;
    h.GF--; a.GA--; h.GD = h.GF - h.GA; a.GD = a.GF - a.GA;
    if (earlyExit) return;

    // ── Outcome 2: Draw (0–0) ──────────────────────────────────────
    h.P++; a.P++; h.D++; a.D++; h.Pts++; a.Pts++;
    allPlayed.push({ homeId: hId, awayId: aId, homeScore: 0, awayScore: 0 });
    dfs(idx + 1);
    allPlayed.pop();
    h.P--; a.P--; h.D--; a.D--; h.Pts--; a.Pts--;
    if (earlyExit) return;

    // ── Outcome 3: Away Win (0–1) ──────────────────────────────────
    h.P++; a.P++; h.L++; a.W++; a.Pts += 3;
    a.GF++; h.GA++; h.GD = h.GF - h.GA; a.GD = a.GF - a.GA;
    allPlayed.push({ homeId: hId, awayId: aId, homeScore: 0, awayScore: 1 });
    dfs(idx + 1);
    allPlayed.pop();
    h.P--; a.P--; h.L--; a.W--; a.Pts -= 3;
    a.GF--; h.GA--; h.GD = h.GF - h.GA; a.GD = a.GF - a.GA;
  }

  dfs(0);

  /* ── Determine status for unresolved teams from DFS ───────────────── */
  unresolvedIds.forEach(id => {
    const t = tracker[id];
    if (t.seenInTopN && !t.seenOutOfTopN) {
      result.status[id] = 'qualified';
    } else if (t.seenOutOfTopN && !t.seenInTopN) {
      result.status[id] = 'eliminated';
    } else {
      result.status[id] = 'alive';
    }
  });

  /* ── Position locks (only valid if DFS exhausted all branches) ────── */
  if (!earlyExit) {
    teamIds.forEach(id => {
      const t = tracker[id];
      if (t.minPos === t.maxPos && t.minPos >= 1 && t.minPos <= n) {
        result.lockedPositions[t.minPos] = id;
      }
    });
  }

  return result;
}

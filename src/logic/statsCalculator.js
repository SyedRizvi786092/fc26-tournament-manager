/**
 * Comprehensive Statistics & Analytics Calculator Engine
 *
 * Compiles real-time and historical analytics across completed history entries
 * and played active tournament fixtures.
 */

// Helper to normalize manager names
function norm(name) {
  return (name || '').trim().toLowerCase();
}

// Helper to resolve player display name from profiles if profileId exists
function resolveName(p, profiles = []) {
  if (!p) return 'Unknown';
  if (p.profileId && profiles.length > 0) {
    const prof = profiles.find(pr => pr.id === p.profileId);
    if (prof && prof.managerName) return prof.managerName.trim();
  }
  return p.name ? p.name.trim() : 'Unknown';
}

// Collect all unique manager names across history & active tournament
export function getAllManagerNames(history = [], tournament = null, profiles = []) {
  const names = new Set();
  const addPlayers = (players) => {
    (players || []).forEach(p => {
      const name = resolveName(p, profiles);
      if (name) names.add(name);
    });
  };

  (history || []).forEach(h => addPlayers(h.players));
  if (tournament) addPlayers(tournament.players);

  return [...names].sort((a, b) => a.localeCompare(b));
}

// Extract all played matches across history & active tournament
function getAllPlayedMatches(history = [], tournament = null, profiles = []) {
  const matches = [];

  const processTournament = (t) => {
    if (!t) return;
    const playerMap = {};
    (t.players || []).forEach(p => { playerMap[p.id] = resolveName(p, profiles); });

    if (t.isManual && t.final) {
      const homeName = playerMap[t.final.homeId] || 'Unknown';
      const awayName = playerMap[t.final.awayId] || 'Unknown';
      matches.push({
        id: `manual_${t.id}`,
        tournamentName: t.name,
        date: t.createdAt,
        homeId: t.final.homeId,
        awayId: t.final.awayId,
        homeName,
        awayName,
        homeScore: t.final.homeScore ?? 0,
        awayScore: t.final.awayScore ?? 0,
        penaltyWinnerName: t.final.penaltyWinner ? playerMap[t.final.penaltyWinner] : null,
        homePenScore: t.final.homePenScore,
        awayPenScore: t.final.awayPenScore,
        matchday: null,
        phase: 'final',
        redCards: [],
      });
      return;
    }

    (t.fixtures || []).forEach(f => {
      if (f.status !== 'played') return;
      const homeName = playerMap[f.homeId];
      const awayName = playerMap[f.awayId];
      if (!homeName || !awayName) return;

      matches.push({
        id: f.id,
        tournamentName: t.name,
        date: t.createdAt,
        homeId: f.homeId,
        awayId: f.awayId,
        homeName,
        awayName,
        homeScore: f.homeScore ?? 0,
        awayScore: f.awayScore ?? 0,
        penaltyWinnerName: f.penaltyWinner ? playerMap[f.penaltyWinner] : null,
        homePenScore: f.homePenScore,
        awayPenScore: f.awayPenScore,
        matchday: f.matchday,
        phase: f.phase,
        redCards: f.redCards || [],
      });
    });
  };

  (history || []).forEach(h => processTournament(h));
  if (tournament) processTournament(tournament);

  return matches;
}

/* ── 0. Default Lifetime Manager Standings ──────────────────────────────── */
export function getLifetimeStandings(history = [], tournament = null, profiles = []) {
  const stats = {};

  const getEntry = (name) => {
    const key = norm(name);
    if (!stats[key]) stats[key] = { name: name.trim(), wins: 0, runnerUps: 0, played: 0 };
    return stats[key];
  };

  const processCompleted = (h) => {
    if (!h || h.status !== 'complete') return;
    (h.players || []).forEach(p => getEntry(resolveName(p, profiles)).played++);

    const champPlayer = (h.players || []).find(p => p.id === h.champion);
    if (champPlayer) getEntry(resolveName(champPlayer, profiles)).wins++;

    let ruPlayer = null;
    if (h.isManual && h.final) {
      const ruId = h.final.homeId === h.champion ? h.final.awayId : h.final.homeId;
      ruPlayer = (h.players || []).find(p => p.id === ruId);
    } else {
      const fin = (h.fixtures || []).find(f => f.phase === 'final');
      if (fin && fin.status === 'played') {
        let ruId = null;
        if      (fin.homeScore > fin.awayScore) ruId = fin.awayId;
        else if (fin.awayScore > fin.homeScore) ruId = fin.homeId;
        else if (fin.penaltyWinner) ruId = fin.penaltyWinner === fin.homeId ? fin.awayId : fin.homeId;
        if (ruId) ruPlayer = (h.players || []).find(p => p.id === ruId);
      }
    }
    if (ruPlayer) getEntry(resolveName(ruPlayer, profiles)).runnerUps++;
  };

  (history || []).forEach(h => processCompleted(h));
  if (tournament && tournament.status === 'complete') processCompleted(tournament);

  return Object.values(stats).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.runnerUps !== a.runnerUps) return b.runnerUps - a.runnerUps;
    return b.played - a.played;
  });
}

/* ── 1. Performance Leaderboard (W/D/L, Win %, Form, Longest Streak) ──── */
export function getPerformanceStats(history = [], tournament = null, profiles = []) {
  const managers = getAllManagerNames(history, tournament, profiles);
  const matches  = getAllPlayedMatches(history, tournament, profiles);

  const data = {};
  managers.forEach(m => {
    data[norm(m)] = {
      name: m,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      winRate: 0,
      matchLog: [],
    };
  });

  matches.forEach(m => {
    const hKey = norm(m.homeName);
    const aKey = norm(m.awayName);
    const h = data[hKey];
    const a = data[aKey];

    if (!h || !a) return;

    h.played++;
    a.played++;

    let hRes = 'D', aRes = 'D';

    if (m.homeScore > m.awayScore) {
      hRes = 'W'; aRes = 'L';
      h.wins++; a.losses++;
    } else if (m.awayScore > m.homeScore) {
      hRes = 'L'; aRes = 'W';
      h.losses++; a.wins++;
    } else if (m.penaltyWinnerName) {
      if (norm(m.penaltyWinnerName) === hKey) {
        hRes = 'W'; aRes = 'L';
        h.wins++; a.losses++;
      } else {
        hRes = 'L'; aRes = 'W';
        h.losses++; a.wins++;
      }
    } else {
      h.draws++; a.draws++;
    }

    h.matchLog.push({ date: m.date, result: hRes });
    a.matchLog.push({ date: m.date, result: aRes });
  });

  const list = Object.values(data).map(m => {
    m.winRate = m.played > 0 ? (m.wins / m.played) * 100 : 0;
    m.matchLog.sort((a, b) => new Date(a.date) - new Date(b.date));
    m.form = m.matchLog.slice(-5).map(l => l.result);

    let maxStreak = 0, currStreak = 0;
    m.matchLog.forEach(l => {
      if (l.result === 'W') {
        currStreak++;
        if (currStreak > maxStreak) maxStreak = currStreak;
      } else {
        currStreak = 0;
      }
    });
    m.longestWinStreak = maxStreak;

    return m;
  });

  return list.sort((a, b) => {
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.played - a.played;
  });
}

/* ── 2. Goals & Records (Goal Machine, Clean Sheets, Blowouts) ─────────── */
export function getGoalStats(history = [], tournament = null, profiles = []) {
  const managers = getAllManagerNames(history, tournament, profiles);
  const matches  = getAllPlayedMatches(history, tournament, profiles);

  const data = {};
  managers.forEach(m => {
    data[norm(m)] = {
      name: m,
      played: 0,
      GF: 0,
      GA: 0,
      GD: 0,
      avgGF: 0,
      cleanSheets: 0,
      cleanSheetPct: 0,
    };
  });

  matches.forEach(m => {
    const hKey = norm(m.homeName);
    const aKey = norm(m.awayName);
    const h = data[hKey];
    const a = data[aKey];

    if (!h || !a) return;

    h.played++;
    a.played++;

    h.GF += m.homeScore;
    h.GA += m.awayScore;

    a.GF += m.awayScore;
    a.GA += m.homeScore;

    if (m.awayScore === 0) h.cleanSheets++;
    if (m.homeScore === 0) a.cleanSheets++;
  });

  const goalMachine = Object.values(data).map(m => {
    m.GD = m.GF - m.GA;
    m.avgGF = m.played > 0 ? parseFloat((m.GF / m.played).toFixed(2)) : 0;
    m.cleanSheetPct = m.played > 0 ? parseFloat(((m.cleanSheets / m.played) * 100).toFixed(1)) : 0;
    return m;
  });

  // Calculate Single-Match Records
  let maxGFMatch = null;
  let maxMarginMatch = null;

  matches.forEach(m => {
    if (!maxGFMatch || m.homeScore > maxGFMatch.goals || m.awayScore > maxGFMatch.goals) {
      const topGF = Math.max(m.homeScore, m.awayScore);
      const isHome = m.homeScore >= m.awayScore;
      if (!maxGFMatch || topGF > maxGFMatch.goals) {
        maxGFMatch = {
          manager: isHome ? m.homeName : m.awayName,
          opponent: isHome ? m.awayName : m.homeName,
          goals: topGF,
          score: `${m.homeScore} - ${m.awayScore}`,
          tournamentName: m.tournamentName,
        };
      }
    }

    const margin = Math.abs(m.homeScore - m.awayScore);
    if (!maxMarginMatch || margin > maxMarginMatch.margin) {
      const isHome = m.homeScore > m.awayScore;
      maxMarginMatch = {
        winner: isHome ? m.homeName : m.awayName,
        loser: isHome ? m.awayName : m.homeName,
        margin,
        score: `${m.homeScore} - ${m.awayScore}`,
        tournamentName: m.tournamentName,
      };
    }
  });

  return { goalMachine, maxGFMatch, maxMarginMatch };
}

/* ── 3. Head-to-Head Matrix ─────────────────────────────────────────────── */
export function getH2HStats(managerA, managerB, history = [], tournament = null, profiles = []) {
  if (!managerA || !managerB || norm(managerA) === norm(managerB)) {
    return null;
  }

  const matches = getAllPlayedMatches(history, tournament, profiles);
  const keyA = norm(managerA);
  const keyB = norm(managerB);

  let totalPlayed = 0;
  let winsA = 0;
  let winsB = 0;
  let draws = 0;
  let gfA = 0;
  let gfB = 0;
  const h2hMatches = [];

  matches.forEach(m => {
    const hKey = norm(m.homeName);
    const aKey = norm(m.awayName);

    const isMatch = (hKey === keyA && aKey === keyB) || (hKey === keyB && aKey === keyA);
    if (!isMatch) return;

    totalPlayed++;
    const isAHome = hKey === keyA;
    const scoreA = isAHome ? m.homeScore : m.awayScore;
    const scoreB = isAHome ? m.awayScore : m.homeScore;

    gfA += scoreA;
    gfB += scoreB;

    let winner = null;
    if (scoreA > scoreB) {
      winsA++;
      winner = managerA;
    } else if (scoreB > scoreA) {
      winsB++;
      winner = managerB;
    } else if (m.penaltyWinnerName) {
      if (norm(m.penaltyWinnerName) === keyA) {
        winsA++;
        winner = managerA;
      } else {
        winsB++;
        winner = managerB;
      }
    } else {
      draws++;
    }

    h2hMatches.push({
      id: m.id,
      tournamentName: m.tournamentName,
      date: m.date,
      score: `${scoreA} - ${scoreB}`,
      winner,
      penaltyWinner: m.penaltyWinnerName,
    });
  });

  return {
    managerA,
    managerB,
    totalPlayed,
    winsA,
    winsB,
    draws,
    gfA,
    gfB,
    gdA: gfA - gfB,
    gdB: gfB - gfA,
    matches: h2hMatches.sort((a, b) => new Date(b.date) - new Date(a.date)),
  };
}

/* ── 4. Fiercest Rivalry ────────────────────────────────────────────────── */
export function getFiercestRivalry(history = [], tournament = null, profiles = []) {
  const matches = getAllPlayedMatches(history, tournament, profiles);
  const pairMap = {};

  matches.forEach(m => {
    const pairKey = [m.homeName, m.awayName].sort((a, b) => a.localeCompare(b)).join(' vs ');
    pairMap[pairKey] = (pairMap[pairKey] || 0) + 1;
  });

  let topPair = null;
  let maxMatches = 0;

  Object.entries(pairMap).forEach(([pair, count]) => {
    if (count > maxMatches) {
      maxMatches = count;
      topPair = pair;
    }
  });

  return topPair ? { pair: topPair, count: maxMatches } : null;
}

/* ── 5. Clutch Kings (Penalty Shootouts & Finals) ────────────────────────── */
export function getClutchStats(history = [], tournament = null, profiles = []) {
  const managers = getAllManagerNames(history, tournament, profiles);
  const matches  = getAllPlayedMatches(history, tournament, profiles);

  const data = {};
  managers.forEach(m => {
    data[norm(m)] = {
      name: m,
      shootoutsPlayed: 0,
      shootoutsWon: 0,
      shootoutWinRate: 0,
      finalPlayed: 0,
      finalWon: 0,
    };
  });

  matches.forEach(m => {
    const hKey = norm(m.homeName);
    const aKey = norm(m.awayName);
    const h = data[hKey];
    const a = data[aKey];

    if (!h || !a) return;

    if (m.penaltyWinnerName) {
      h.shootoutsPlayed++;
      a.shootoutsPlayed++;
      if (norm(m.penaltyWinnerName) === hKey) h.shootoutsWon++;
      if (norm(m.penaltyWinnerName) === aKey) a.shootoutsWon++;
    }

    if (m.phase === 'final') {
      h.finalPlayed++;
      a.finalPlayed++;
      let winnerKey = null;
      if (m.homeScore > m.awayScore) winnerKey = hKey;
      else if (m.awayScore > m.homeScore) winnerKey = aKey;
      else if (m.penaltyWinnerName) winnerKey = norm(m.penaltyWinnerName);

      if (winnerKey === hKey) h.finalWon++;
      if (winnerKey === aKey) a.finalWon++;
    }
  });

  const list = Object.values(data).map(m => {
    m.shootoutWinRate = m.shootoutsPlayed > 0 ? (m.shootoutsWon / m.shootoutsPlayed) * 100 : 0;
    return m;
  });

  return list.sort((a, b) => {
    if (b.shootoutsWon !== a.shootoutsWon) return b.shootoutsWon - a.shootoutsWon;
    return b.finalWon - a.finalWon;
  });
}

/* ── 6. Discipline & Red Cards ──────────────────────────────────────────── */
export function getDisciplineStats(history = [], tournament = null, profiles = []) {
  const managers = getAllManagerNames(history, tournament, profiles);
  const matches  = getAllPlayedMatches(history, tournament, profiles);

  const data = {};
  managers.forEach(m => {
    data[norm(m)] = {
      name: m,
      redCards: 0,
    };
  });

  const processRedCards = (t) => {
    if (!t) return;
    const playerMap = {};
    (t.players || []).forEach(p => { playerMap[p.id] = resolveName(p, profiles); });

    (t.fixtures || []).forEach(f => {
      if (f.status !== 'played' || !f.redCards) return;
      f.redCards.forEach(rc => {
        const mgrName = playerMap[rc.teamId];
        if (mgrName && data[norm(mgrName)]) {
          data[norm(mgrName)].redCards++;
        }
      });
    });
  };

  (history || []).forEach(h => processRedCards(h));
  if (tournament) processRedCards(tournament);

  return Object.values(data).sort((a, b) => b.redCards - a.redCards);
}

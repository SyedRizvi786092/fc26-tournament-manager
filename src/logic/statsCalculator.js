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

// Collect all unique manager names across history & active tournament
export function getAllManagerNames(history = [], tournament = null) {
  const names = new Set();
  const addPlayers = (players) => {
    (players || []).forEach(p => {
      if (p.name?.trim()) names.add(p.name.trim());
    });
  };

  (history || []).forEach(h => addPlayers(h.players));
  if (tournament) addPlayers(tournament.players);

  return [...names].sort((a, b) => a.localeCompare(b));
}

// Extract all played matches across history & active tournament
function getAllPlayedMatches(history = [], tournament = null) {
  const matches = [];

  const processTournament = (t) => {
    if (!t) return;
    const playerMap = {};
    (t.players || []).forEach(p => { playerMap[p.id] = p.name?.trim(); });

    if (t.isManual && t.final) {
      const homeName = playerMap[t.final.homeId] || 'Unknown';
      const awayName = playerMap[t.final.awayId] || 'Unknown';
      matches.push({
        id: `manual_${t.id}`,
        tournamentName: t.name,
        date: t.createdAt,
        homeName,
        awayName,
        homeScore: t.final.homeScore ?? 0,
        awayScore: t.final.awayScore ?? 0,
        penaltyWinnerName: t.final.penaltyWinner ? playerMap[t.final.penaltyWinner] : null,
        homePenScore: t.final.homePenScore,
        awayPenScore: t.final.awayPenScore,
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
        homeName,
        awayName,
        homeScore: f.homeScore ?? 0,
        awayScore: f.awayScore ?? 0,
        penaltyWinnerName: f.penaltyWinner ? playerMap[f.penaltyWinner] : null,
        homePenScore: f.homePenScore,
        awayPenScore: f.awayPenScore,
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
export function getLifetimeStandings(history = [], tournament = null) {
  const stats = {};

  const getEntry = (name) => {
    const key = norm(name);
    if (!stats[key]) stats[key] = { name: name.trim(), wins: 0, runnerUps: 0, played: 0 };
    return stats[key];
  };

  const processCompleted = (h) => {
    if (!h || h.status !== 'complete') return;
    (h.players || []).forEach(p => getEntry(p.name).played++);

    const champPlayer = (h.players || []).find(p => p.id === h.champion);
    if (champPlayer) getEntry(champPlayer.name).wins++;

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
    if (ruPlayer) getEntry(ruPlayer.name).runnerUps++;
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
export function getPerformanceStats(history = [], tournament = null) {
  const managers = getAllManagerNames(history, tournament);
  const matches  = getAllPlayedMatches(history, tournament);

  const data = {};
  managers.forEach(m => {
    data[norm(m)] = {
      name: m,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      winRate: 0,
      matchLog: [], // { date, result: 'W'|'D'|'L' }
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

    // Sort log chronologically to calculate streaks and recent form
    m.matchLog.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Last 5 form
    m.form = m.matchLog.slice(-5).map(l => l.result);

    // All-time longest win streak
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
export function getGoalStats(history = [], tournament = null) {
  const managers = getAllManagerNames(history, tournament);
  const matches  = getAllPlayedMatches(history, tournament);

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
    m.avgGF = m.played > 0 ? m.GF / m.played : 0;
    m.cleanSheetPct = m.played > 0 ? (m.cleanSheets / m.played) * 100 : 0;
    return m;
  });

  // Clean Sheets leaderboard
  const cleanSheets = [...goalMachine].sort((a, b) => {
    if (b.cleanSheetPct !== a.cleanSheetPct) return b.cleanSheetPct - a.cleanSheetPct;
    if (b.cleanSheets !== a.cleanSheets) return b.cleanSheets - a.cleanSheets;
    return a.played - b.played;
  });

  // Largest Margin Wins (Top 5)
  const largestMargin = [...matches]
    .filter(m => m.homeScore !== m.awayScore)
    .map(m => {
      const isHomeWin = m.homeScore > m.awayScore;
      const winner = isHomeWin ? m.homeName : m.awayName;
      const loser  = isHomeWin ? m.awayName : m.homeName;
      const wScore = isHomeWin ? m.homeScore : m.awayScore;
      const lScore = isHomeWin ? m.awayScore : m.homeScore;
      const margin = wScore - lScore;
      return { ...m, winner, loser, wScore, lScore, margin };
    })
    .sort((a, b) => b.margin - a.margin || (b.wScore + b.lScore) - (a.wScore + a.lScore))
    .slice(0, 5);

  // Highest Scoring Single Fixtures (Top 5)
  const highestScoring = [...matches]
    .map(m => ({ ...m, totalGoals: m.homeScore + m.awayScore }))
    .sort((a, b) => b.totalGoals - a.totalGoals)
    .slice(0, 5);

  return { goalMachine, cleanSheets, largestMargin, highestScoring };
}

/* ── 3. Head-to-Head Rivalry Finder ───────────────────────────────────── */
export function getH2HStats(managerA, managerB, history = [], tournament = null) {
  if (!managerA || !managerB || norm(managerA) === norm(managerB)) return null;

  const aKey = norm(managerA);
  const bKey = norm(managerB);
  const matches = getAllPlayedMatches(history, tournament);

  const h2h = {
    managerA,
    managerB,
    totalPlayed: 0,
    aWins: 0,
    bWins: 0,
    draws: 0,
    aGoals: 0,
    bGoals: 0,
    playoffPlayed: 0,
    aPlayoffWins: 0,
    bPlayoffWins: 0,
  };

  matches.forEach(m => {
    const hK = norm(m.homeName);
    const aK = norm(m.awayName);

    if (!((hK === aKey && aK === bKey) || (hK === bKey && aK === aKey))) return;

    h2h.totalPlayed++;
    const isAHome = hK === aKey;
    const aScore  = isAHome ? m.homeScore : m.awayScore;
    const bScore  = isAHome ? m.awayScore : m.homeScore;

    h2h.aGoals += aScore;
    h2h.bGoals += bScore;

    const isPlayoff = m.phase === 'eliminator' || m.phase === 'final';
    if (isPlayoff) h2h.playoffPlayed++;

    if (aScore > bScore) {
      h2h.aWins++;
      if (isPlayoff) h2h.aPlayoffWins++;
    } else if (bScore > aScore) {
      h2h.bWins++;
      if (isPlayoff) h2h.bPlayoffWins++;
    } else if (m.penaltyWinnerName) {
      if (norm(m.penaltyWinnerName) === aKey) {
        h2h.aWins++;
        if (isPlayoff) h2h.aPlayoffWins++;
      } else {
        h2h.bWins++;
        if (isPlayoff) h2h.bPlayoffWins++;
      }
    } else {
      h2h.draws++;
    }
  });

  return h2h;
}

// Find pair of managers with most direct playoff/final encounters
export function getFiercestRivalry(history = [], tournament = null) {
  const matches = getAllPlayedMatches(history, tournament);
  const pairings = {};

  matches.forEach(m => {
    const isPlayoff = m.phase === 'eliminator' || m.phase === 'final';
    if (!isPlayoff) return;

    const pair = [m.homeName.trim(), m.awayName.trim()].sort((a, b) => a.localeCompare(b));
    const key  = pair.join(' vs ');

    if (!pairings[key]) {
      pairings[key] = { managerA: pair[0], managerB: pair[1], playoffCount: 0, totalCount: 0 };
    }
    pairings[key].playoffCount++;
  });

  const list = Object.values(pairings).sort((a, b) => b.playoffCount - a.playoffCount);
  if (!list.length) return null;

  const top = list[0];
  const fullH2H = getH2HStats(top.managerA, top.managerB, history, tournament);
  return { ...top, fullH2H };
}

/* ── 4. Clutch Factor (Trophies, Finals Win %, Penalties Record) ────────── */
export function getClutchStats(history = [], tournament = null) {
  const managers = getAllManagerNames(history, tournament);
  const matches  = getAllPlayedMatches(history, tournament);

  const data = {};
  managers.forEach(m => {
    data[norm(m)] = {
      name: m,
      gold: 0,
      silver: 0,
      totalFinals: 0,
      finalsWinRate: 0,
      shootoutsPlayed: 0,
      shootoutsWon: 0,
      shootoutsLost: 0,
      shootoutWinRate: 0,
    };
  });

  // Trophies & Finals count
  const processCompleted = (h) => {
    if (!h || h.status !== 'complete') return;
    const playerMap = {};
    (h.players || []).forEach(p => { playerMap[p.id] = p.name.trim(); });

    const champName = playerMap[h.champion];
    let ruName = null;

    if (h.isManual && h.final) {
      const ruId = h.final.homeId === h.champion ? h.final.awayId : h.final.homeId;
      ruName = playerMap[ruId];
    } else {
      const fin = (h.fixtures || []).find(f => f.phase === 'final');
      if (fin && fin.status === 'played') {
        let ruId = null;
        if      (fin.homeScore > fin.awayScore) ruId = fin.awayId;
        else if (fin.awayScore > fin.homeScore) ruId = fin.homeId;
        else if (fin.penaltyWinner) ruId = fin.penaltyWinner === fin.homeId ? fin.awayId : fin.homeId;
        if (ruId) ruName = playerMap[ruId];
      }
    }

    if (champName && data[norm(champName)]) {
      data[norm(champName)].gold++;
      data[norm(champName)].totalFinals++;
    }
    if (ruName && data[norm(ruName)]) {
      data[norm(ruName)].silver++;
      data[norm(ruName)].totalFinals++;
    }
  };

  (history || []).forEach(h => processCompleted(h));
  if (tournament && tournament.status === 'complete') processCompleted(tournament);

  // Shootout records
  matches.forEach(m => {
    if (!m.penaltyWinnerName) return;
    const hKey = norm(m.homeName);
    const aKey = norm(m.awayName);
    const wKey = norm(m.penaltyWinnerName);
    const lKey = wKey === hKey ? aKey : hKey;

    if (data[wKey]) {
      data[wKey].shootoutsPlayed++;
      data[wKey].shootoutsWon++;
    }
    if (data[lKey]) {
      data[lKey].shootoutsPlayed++;
      data[lKey].shootoutsLost++;
    }
  });

  const list = Object.values(data).map(m => {
    m.finalsWinRate = m.totalFinals > 0 ? (m.gold / m.totalFinals) * 100 : 0;
    m.shootoutWinRate = m.shootoutsPlayed > 0 ? (m.shootoutsWon / m.shootoutsPlayed) * 100 : 0;
    return m;
  });

  return list.sort((a, b) => {
    if (b.gold !== a.gold) return b.gold - a.gold;
    if (b.silver !== a.silver) return b.silver - a.silver;
    return b.finalsWinRate - a.finalsWinRate;
  });
}

/* ── 5. Bad Boy Leaderboard (Manager & Squad Player Red Cards) ─────────── */
export function getDisciplineStats(history = [], tournament = null) {
  const managers = getAllManagerNames(history, tournament);
  const matches  = getAllPlayedMatches(history, tournament);

  const managerData = {};
  managers.forEach(m => {
    managerData[norm(m)] = {
      name: m,
      played: 0,
      redCards: 0,
      cardsPerMatch: 0,
    };
  });

  const squadPlayers = {};

  matches.forEach(m => {
    const hKey = norm(m.homeName);
    const aKey = norm(m.awayName);
    if (managerData[hKey]) managerData[hKey].played++;
    if (managerData[aKey]) managerData[aKey].played++;

    (m.redCards || []).forEach(rc => {
      const teamName = norm(m.homeName) === norm(rc.teamId) ? m.homeName : m.awayName;
      const mKey = norm(teamName);

      if (managerData[mKey]) {
        managerData[mKey].redCards++;
      }

      const pName = (rc.playerName || '').trim();
      if (pName) {
        const pKey = `${norm(pName)}_${mKey}`;
        if (!squadPlayers[pKey]) {
          squadPlayers[pKey] = { name: pName, manager: teamName, count: 0 };
        }
        squadPlayers[pKey].count++;
      }
    });
  });

  const managerDiscipline = Object.values(managerData)
    .map(m => {
      m.cardsPerMatch = m.played > 0 ? m.redCards / m.played : 0;
      return m;
    })
    .sort((a, b) => b.redCards - a.redCards || b.cardsPerMatch - a.cardsPerMatch);

  const squadDiscipline = Object.values(squadPlayers).sort((a, b) => b.count - a.count);

  return { managerDiscipline, squadDiscipline };
}

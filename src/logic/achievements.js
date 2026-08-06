/**
 * Pure logic module for FC26 Tournament Manager achievements and stats.
 */

/**
 * Normalizes a name string for comparison.
 * @param {string} name
 * @returns {string}
 */
export function norm(name) {
  return (name || '').trim().toLowerCase();
}

export const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

export const TIER_META = {
  bronze: { label: 'Bronze', icon: '🥉', color: '#cd7f32' },
  silver: { label: 'Silver', icon: '🥈', color: '#c0c0c0' },
  gold: { label: 'Gold', icon: '🥇', color: '#ffd700' },
  platinum: { label: 'Platinum', icon: '💠', color: '#e5e4e2' },
  diamond: { label: 'Diamond', icon: '💎', color: '#b9f2ff' }
};

export const LEVEL_TIERS = [
  { minXP: 0, maxXP: 1000, title: 'Rookie Manager', icon: '🟢' },
  { minXP: 1001, maxXP: 2500, title: 'Contender', icon: '🔵' },
  { minXP: 2501, maxXP: 5000, title: 'Elite Manager', icon: '🟣' },
  { minXP: 5001, maxXP: 9999, title: 'World Class', icon: '🟡' },
  { minXP: 10000, maxXP: Infinity, title: 'Hall of Fame Legend', icon: '👑' }
];

export const BADGE_CATALOG = [
  // Bronze (50 XP each)
  { id: 'first_blood', name: 'First Blood', icon: '🥉', tier: 'bronze', xp: 50, description: 'Win your first tournament match.', evaluate: (stats) => stats.totalWins >= 1 },
  { id: 'off_the_mark', name: 'Off the Mark', icon: '🥉', tier: 'bronze', xp: 50, description: 'Score 10 career goals.', evaluate: (stats) => stats.totalGF >= 10 },
  { id: 'safe_hands', name: 'Safe Hands', icon: '🥉', tier: 'bronze', xp: 50, description: 'Keep 1 clean sheet.', evaluate: (stats) => stats.totalCleanSheets >= 1 },
  { id: 'warning_shot', name: 'Warning Shot', icon: '🥉', tier: 'bronze', xp: 50, description: 'Receive 1 red card.', evaluate: (stats) => stats.totalRedCards >= 1 },
  { id: 'manager_debut', name: 'Manager Debut', icon: '🥉', tier: 'bronze', xp: 50, description: 'Complete 1 tournament.', evaluate: (stats) => stats.tournamentsCompleted >= 1 },
  
  // Silver (100 XP each)
  { id: 'winners_circle', name: 'Winner\'s Circle', icon: '🥈', tier: 'silver', xp: 100, description: 'Win 20 tournament matches.', evaluate: (stats) => stats.totalWins >= 20 },
  { id: 'fifty_club', name: 'Fifty Club', icon: '🥈', tier: 'silver', xp: 100, description: 'Score 50 career goals.', evaluate: (stats) => stats.totalGF >= 50 },
  { id: 'clean_sheet_collector', name: 'Clean Sheet Collector', icon: '🥈', tier: 'silver', xp: 100, description: 'Keep 5 clean sheets.', evaluate: (stats) => stats.totalCleanSheets >= 5 },
  { id: 'bad_boy', name: 'Bad Boy', icon: '🥈', tier: 'silver', xp: 100, description: 'Receive 5 red cards.', evaluate: (stats) => stats.totalRedCards >= 5 },
  { id: 'high_five', name: 'High Five', icon: '🥈', tier: 'silver', xp: 100, description: 'Score 5+ goals in a single match.', evaluate: (stats) => stats.maxGoalsInMatch >= 5 },
  { id: 'nerves_of_steel', name: 'Nerves of Steel', icon: '🥈', tier: 'silver', xp: 100, description: 'Win 1 penalty shootout.', evaluate: (stats) => stats.shootoutsWon >= 1 },
  { id: 'so_close', name: 'So Close', icon: '🥈', tier: 'silver', xp: 100, description: 'Finish Runner-Up in a tournament.', evaluate: (stats) => stats.runnerUps >= 1 },
  { id: 'seasoned_veteran', name: 'Seasoned Veteran', icon: '🥈', tier: 'silver', xp: 100, description: 'Complete 10 tournaments.', evaluate: (stats) => stats.tournamentsCompleted >= 10 },
  
  // Gold (250 XP each)
  { id: 'half_century_wins', name: 'Half Century Wins', icon: '🥇', tier: 'gold', xp: 250, description: 'Win 50 matches.', evaluate: (stats) => stats.totalWins >= 50 },
  { id: 'century_club', name: 'Century Club', icon: '🥇', tier: 'gold', xp: 250, description: 'Score 100 career goals.', evaluate: (stats) => stats.totalGF >= 100 },
  { id: 'brick_wall', name: 'Brick Wall', icon: '🥇', tier: 'gold', xp: 250, description: 'Keep 10 clean sheets.', evaluate: (stats) => stats.totalCleanSheets >= 10 },
  { id: 'the_enforcer', name: 'The Enforcer', icon: '🥇', tier: 'gold', xp: 250, description: 'Receive 10 red cards.', evaluate: (stats) => stats.totalRedCards >= 10 },
  { id: 'on_fire', name: 'On Fire', icon: '🥇', tier: 'gold', xp: 250, description: 'Win 3 consecutive matches within a single tournament.', evaluate: (stats) => stats.bestTournamentStreak >= 3 },
  { id: 'shootout_specialist', name: 'Shootout Specialist', icon: '🥇', tier: 'gold', xp: 250, description: 'Win 3 penalty shootouts.', evaluate: (stats) => stats.shootoutsWon >= 3 },
  { id: 'champion', name: 'Champion', icon: '🥇', tier: 'gold', xp: 250, description: 'Win 1 tournament title.', evaluate: (stats) => stats.titles >= 1 },
  { id: 'marathon_manager', name: 'Marathon Manager', icon: '🥇', tier: 'gold', xp: 250, description: 'Complete 20 tournaments.', evaluate: (stats) => stats.tournamentsCompleted >= 20 },
  
  // Platinum (500 XP each)
  { id: 'centurion_wins', name: 'Centurion Wins', icon: '💠', tier: 'platinum', xp: 500, description: 'Win 100 matches.', evaluate: (stats) => stats.totalWins >= 100 },
  { id: 'double_century_club', name: 'Double Century Club', icon: '💠', tier: 'platinum', xp: 500, description: 'Score 200 goals.', evaluate: (stats) => stats.totalGF >= 200 },
  { id: 'rule_breaker', name: 'Rule Breaker', icon: '💠', tier: 'platinum', xp: 500, description: 'Receive 15 red cards.', evaluate: (stats) => stats.totalRedCards >= 15 },
  { id: 'serial_winner', name: 'Serial Winner', icon: '💠', tier: 'platinum', xp: 500, description: 'Win 5 titles.', evaluate: (stats) => stats.titles >= 5 },
  { id: 'back_to_back', name: 'Back to Back', icon: '💠', tier: 'platinum', xp: 500, description: 'Win 2 consecutive titles.', evaluate: (stats) => stats.longestConsecutiveTitles >= 2 },
  { id: 'flawless_victory', name: 'Flawless Victory', icon: '💠', tier: 'platinum', xp: 500, description: 'Win a tournament with zero losses.', evaluate: (stats) => stats.hasFlawlessVictory === true },
  { id: 'fortress', name: 'Fortress', icon: '💠', tier: 'platinum', xp: 500, description: 'Keep 25 clean sheets.', evaluate: (stats) => stats.totalCleanSheets >= 25 },
  { id: 'unstoppable', name: 'Unstoppable', icon: '💠', tier: 'platinum', xp: 500, description: 'Win 5 consecutive matches across history.', evaluate: (stats) => stats.longestWinStreak >= 5 },
  { id: 'blowout_master', name: 'Blowout Master', icon: '💠', tier: 'platinum', xp: 500, description: 'Win a match by 5+ goal margin.', evaluate: (stats) => stats.maxWinMargin >= 5 },
  { id: 'rivalry_winner', name: 'Rivalry Winner', icon: '💠', tier: 'platinum', xp: 500, description: 'Win 3 playoff matches vs the same opponent.', evaluate: (stats) => stats.maxPlayoffWinsVsSingle >= 3 },
  { id: 'ice_in_the_veins', name: 'Ice in the Veins', icon: '💠', tier: 'platinum', xp: 500, description: 'Win 5 penalty shootouts.', evaluate: (stats) => stats.shootoutsWon >= 5 },
  
  // Diamond (1000 XP each)
  { id: 'dynasty_goat', name: 'Dynasty GOAT', icon: '💎', tier: 'diamond', xp: 1000, description: 'Win 10 titles.', evaluate: (stats) => stats.titles >= 10 },
  { id: 'invincible_champion', name: 'Invincible Champion', icon: '💎', tier: 'diamond', xp: 1000, description: 'Win a tournament with 100% win rate (0 draws, 0 losses).', evaluate: (stats) => stats.hasInvincibleSeason === true },
  { id: 'triple_century_club', name: 'Triple Century Club', icon: '💎', tier: 'diamond', xp: 1000, description: 'Score 300 goals.', evaluate: (stats) => stats.totalGF >= 300 },
  { id: 'legendary_lockout', name: 'Legendary Lockout', icon: '💎', tier: 'diamond', xp: 1000, description: 'Keep 50 clean sheets.', evaluate: (stats) => stats.totalCleanSheets >= 50 },
  { id: 'immortal_streak', name: 'Immortal Streak', icon: '💎', tier: 'diamond', xp: 1000, description: 'Win 10 consecutive matches across history.', evaluate: (stats) => stats.longestWinStreak >= 10 },
  { id: 'clutch_god', name: 'Clutch God', icon: '💎', tier: 'diamond', xp: 1000, description: 'Win 10 penalty shootouts.', evaluate: (stats) => stats.shootoutsWon >= 10 },
  { id: 'iron_wall', name: 'Iron Wall', icon: '💎', tier: 'diamond', xp: 1000, description: 'Concede 0 goals in the League Phase of a tournament (min 3 matches).', evaluate: (stats) => stats.hasIronWall === true },
  { id: 'hat_trick_titles', name: 'Hat-Trick Titles', icon: '💎', tier: 'diamond', xp: 1000, description: 'Win 3 consecutive titles.', evaluate: (stats) => stats.longestConsecutiveTitles >= 3 }
];

/**
 * Calculates manager level and progression stats based on total XP.
 * @param {number} totalXP 
 * @returns {object}
 */
export function getManagerLevel(totalXP) {
  let level = 1;
  let minLevelXP = 0;
  let maxLevelXP = 333;

  if (totalXP <= 1000) {
    if (totalXP <= 333) { level = 1; minLevelXP = 0; maxLevelXP = 333; }
    else if (totalXP <= 666) { level = 2; minLevelXP = 334; maxLevelXP = 666; }
    else { level = 3; minLevelXP = 667; maxLevelXP = 1000; }
  } else if (totalXP <= 2500) {
    if (totalXP <= 1500) { level = 4; minLevelXP = 1001; maxLevelXP = 1500; }
    else if (totalXP <= 2000) { level = 5; minLevelXP = 1501; maxLevelXP = 2000; }
    else { level = 6; minLevelXP = 2001; maxLevelXP = 2500; }
  } else if (totalXP <= 5000) {
    if (totalXP <= 3333) { level = 7; minLevelXP = 2501; maxLevelXP = 3333; }
    else if (totalXP <= 4166) { level = 8; minLevelXP = 3334; maxLevelXP = 4166; }
    else { level = 9; minLevelXP = 4167; maxLevelXP = 5000; }
  } else if (totalXP <= 9999) {
    const remaining = totalXP - 5000;
    const l = Math.floor((remaining - 1) / 1000) + 1;
    level = 9 + l;
    minLevelXP = 5000 + (l - 1) * 1000 + 1;
    maxLevelXP = 5000 + l * 1000;
    if (maxLevelXP === 10000) maxLevelXP = 9999;
  } else {
    const remaining = totalXP - 9999;
    const l = Math.floor((remaining - 1) / 1500) + 1;
    level = 14 + l;
    minLevelXP = 9999 + (l - 1) * 1500 + 1;
    maxLevelXP = 9999 + l * 1500;
  }

  let tierIndex = 0;
  let tierInfo = LEVEL_TIERS[0];
  for (let i = 0; i < LEVEL_TIERS.length; i++) {
    if (totalXP >= LEVEL_TIERS[i].minXP && totalXP <= LEVEL_TIERS[i].maxXP) {
      tierInfo = LEVEL_TIERS[i];
      tierIndex = i;
      break;
    }
  }

  const xpInCurrentLevel = totalXP - minLevelXP;
  const xpForNextLevel = maxLevelXP - minLevelXP + 1;
  const xpRemainingForNextLevel = maxLevelXP === Infinity ? 0 : Math.max(0, (maxLevelXP + 1) - totalXP);
  const progress = Math.min(1, Math.max(0, xpInCurrentLevel / xpForNextLevel));

  return {
    level,
    title: tierInfo.title,
    icon: tierInfo.icon,
    tierIndex,
    xpInCurrentLevel,
    xpForNextLevel,
    xpRemainingForNextLevel,
    progress
  };
}

/**
 * Finds a manager's player entry in a tournament.
 * @param {object} tournament 
 * @param {object} identifier { profileId, managerName }
 * @returns {object|null}
 */
export function findPlayerEntry(tournament, identifier) {
  const players = tournament.players || [];
  if (identifier.profileId) {
    const byId = players.find(p => p.profileId === identifier.profileId);
    if (byId) return byId;
  }
  return players.find(p => norm(p.name) === norm(identifier.managerName)) || null;
}

/**
 * Builds a comprehensive stats object for a single manager.
 * @param {object} managerIdentifier { profileId, managerName }
 * @param {Array} history Array of completed tournaments
 * @param {object|null} tournament Active tournament (if any)
 * @param {Array} profiles Array of all profiles
 * @returns {object}
 */
export function buildManagerStats(managerIdentifier, history, tournament, profiles) {
  const stats = {
    totalPlayed: 0,
    totalWins: 0,
    totalDraws: 0,
    totalLosses: 0,
    totalGF: 0,
    totalGA: 0,
    totalCleanSheets: 0,
    totalRedCards: 0,
    tournamentsCompleted: 0,
    titles: 0,
    runnerUps: 0,
    shootoutsWon: 0,
    shootoutsLost: 0,
    maxGoalsInMatch: 0,
    maxWinMargin: 0,
    longestWinStreak: 0,
    bestTournamentStreak: 0,
    longestConsecutiveTitles: 0,
    maxPlayoffWinsVsSingle: 0,
    hasFlawlessVictory: false,
    hasInvincibleSeason: false,
    hasIronWall: false
  };

  const allTournaments = [...history];
  if (tournament && tournament.status === 'complete') {
    allTournaments.push(tournament);
  }

  // Sort tournaments chronologically for streaks
  allTournaments.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  let currentConsecutiveTitles = 0;
  const allMatchResults = [];
  const playoffWinsByOpponent = {};

  for (const tourney of allTournaments) {
    const playerEntry = findPlayerEntry(tourney, managerIdentifier);
    if (!playerEntry) continue; // Manager didn't participate

    const playerId = playerEntry.id;
    stats.tournamentsCompleted++;

    const isChampion = tourney.champion === playerId;
    if (isChampion) {
      stats.titles++;
      currentConsecutiveTitles++;
      if (currentConsecutiveTitles > stats.longestConsecutiveTitles) {
        stats.longestConsecutiveTitles = currentConsecutiveTitles;
      }
    } else {
      currentConsecutiveTitles = 0; // Streak reset if participated but didn't win
    }

    let isRunnerUp = false;
    let tourneyWins = 0;
    let tourneyDraws = 0;
    let tourneyLosses = 0;
    let tourneyMatches = [];
    let leagueMatches = 0;
    let leagueConceded = 0;

    if (tourney.isManual && tourney.final) {
      // Retro tournament
      const f = tourney.final;
      if (f.homeId === playerId || f.awayId === playerId) {
        const isHome = f.homeId === playerId;
        const opponentId = isHome ? f.awayId : f.homeId;
        isRunnerUp = !isChampion;
        
        stats.totalPlayed++;
        const myScore = isHome ? (f.homeScore || 0) : (f.awayScore || 0);
        const oppScore = isHome ? (f.awayScore || 0) : (f.homeScore || 0);
        
        stats.totalGF += myScore;
        stats.totalGA += oppScore;
        if (myScore > stats.maxGoalsInMatch) stats.maxGoalsInMatch = myScore;

        if (oppScore === 0) stats.totalCleanSheets++;

        let wonMatch = false;
        if (myScore > oppScore) {
          stats.totalWins++;
          tourneyWins++;
          wonMatch = true;
          const margin = myScore - oppScore;
          if (margin > stats.maxWinMargin) stats.maxWinMargin = margin;
        } else if (myScore < oppScore) {
          stats.totalLosses++;
          tourneyLosses++;
        } else {
          stats.totalDraws++; // we still log it as a draw on standard stats
          tourneyDraws++;
          if (f.penaltyWinner === playerId) {
            stats.shootoutsWon++;
            stats.totalWins++; // Penalty shootout wins count as wins in all contexts
            stats.totalDraws--; // Correct the draw
            tourneyWins++;
            tourneyDraws--;
            wonMatch = true;
          } else if (f.penaltyWinner === opponentId) {
            stats.shootoutsLost++;
          }
        }
        allMatchResults.push(wonMatch);
      }
    } else {
      // Regular tournament
      const fixtures = tourney.fixtures || [];
      const playedFixtures = fixtures.filter(f => f.status === 'played' && (f.homeId === playerId || f.awayId === playerId));
      
      // Determine runner up (loser of the final)
      const finalFixture = fixtures.find(f => f.phase === 'final' && f.status === 'played');
      if (finalFixture) {
        if (!isChampion && (finalFixture.homeId === playerId || finalFixture.awayId === playerId)) {
          isRunnerUp = true;
        }
      }

      for (const f of playedFixtures) {
        const isHome = f.homeId === playerId;
        const opponentId = isHome ? f.awayId : f.homeId;
        
        stats.totalPlayed++;
        const myScore = isHome ? (f.homeScore || 0) : (f.awayScore || 0);
        const oppScore = isHome ? (f.awayScore || 0) : (f.homeScore || 0);
        
        stats.totalGF += myScore;
        stats.totalGA += oppScore;
        if (myScore > stats.maxGoalsInMatch) stats.maxGoalsInMatch = myScore;

        if (oppScore === 0) stats.totalCleanSheets++;

        // Red cards
        const redCards = f.redCards || [];
        for (const rc of redCards) {
          if (rc.teamId === playerId) {
            stats.totalRedCards++;
          }
        }

        if (f.phase === 'league') {
          leagueMatches++;
          leagueConceded += oppScore;
        }

        let wonMatch = false;
        if (myScore > oppScore) {
          stats.totalWins++;
          tourneyWins++;
          wonMatch = true;
          const margin = myScore - oppScore;
          if (margin > stats.maxWinMargin) stats.maxWinMargin = margin;
        } else if (myScore < oppScore) {
          stats.totalLosses++;
          tourneyLosses++;
        } else {
          stats.totalDraws++; // count as draw initially
          tourneyDraws++;
          if (f.penaltyWinner === playerId) {
            stats.shootoutsWon++;
            stats.totalWins++; // Penalty shootout wins count as wins in all contexts
            stats.totalDraws--; // Correct the draw
            tourneyWins++;
            tourneyDraws--;
            wonMatch = true;
          } else if (f.penaltyWinner === opponentId) {
            stats.shootoutsLost++;
          }
        }

        if (wonMatch && (f.phase === 'eliminator' || f.phase === 'final')) {
          if (opponentId) {
            playoffWinsByOpponent[opponentId] = (playoffWinsByOpponent[opponentId] || 0) + 1;
            if (playoffWinsByOpponent[opponentId] > stats.maxPlayoffWinsVsSingle) {
              stats.maxPlayoffWinsVsSingle = playoffWinsByOpponent[opponentId];
            }
          }
        }

        allMatchResults.push(wonMatch);
        tourneyMatches.push(wonMatch);
      }

      // Best tournament streak
      let currentTourneyStreak = 0;
      for (const won of tourneyMatches) {
        if (won) {
          currentTourneyStreak++;
          if (currentTourneyStreak > stats.bestTournamentStreak) {
            stats.bestTournamentStreak = currentTourneyStreak;
          }
        } else {
          currentTourneyStreak = 0;
        }
      }

      if (isChampion) {
        if (tourneyLosses === 0) stats.hasFlawlessVictory = true;
        if (tourneyLosses === 0 && tourneyDraws === 0 && tourneyWins > 0) stats.hasInvincibleSeason = true;
      }
      
      if (leagueMatches >= 3 && leagueConceded === 0) {
        stats.hasIronWall = true;
      }
    }

    if (isRunnerUp) {
      stats.runnerUps++;
    }
  }

  // Cross-tournament streak
  let currentStreak = 0;
  for (const won of allMatchResults) {
    if (won) {
      currentStreak++;
      if (currentStreak > stats.longestWinStreak) {
        stats.longestWinStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  }

  return stats;
}

/**
 * Evaluates all profiles and returns sorted achievements/stats.
 * @param {Array} history Array of completed tournaments
 * @param {object|null} tournament Active tournament
 * @param {Array} profiles Array of all profiles
 * @returns {Array}
 */
export function evaluateAllManagers(history, tournament, profiles) {
  const results = [];

  for (const profile of profiles) {
    const identifier = { profileId: profile.id, managerName: profile.managerName };
    const stats = buildManagerStats(identifier, history, tournament, profiles);

    let totalBadgeXP = 0;
    const unlockedBadges = [];

    for (const badge of BADGE_CATALOG) {
      if (badge.evaluate(stats)) {
        unlockedBadges.push(badge);
        totalBadgeXP += badge.xp;
      }
    }

    // Match XP calculation: Win (25), Draw (10), Loss (10)
    // Note: Since we convert shootout wins to standard wins in stats.totalWins above, 
    // stats.totalWins represents all wins including shootouts.
    const actualWins = stats.totalWins;
    const matchXP = (actualWins * 25) + ((stats.totalPlayed - actualWins) * 10);
    const totalXP = totalBadgeXP + matchXP;

    const levelInfo = getManagerLevel(totalXP);

    results.push({
      profileId: profile.id,
      managerName: profile.managerName,
      stats,
      unlockedBadges,
      totalBadgeXP,
      matchXP,
      totalXP,
      level: levelInfo
    });
  }

  results.sort((a, b) => b.totalXP - a.totalXP);
  return results;
}

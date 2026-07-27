import { saveTournament, addToHistory } from '../services/firestoreService.js';

/**
 * Checks history documents for Tournament 3 and Tournament 10,
 * attaches their penalty shootout scores (7-6 and 5-3 respectively),
 * and saves the updated documents back to Firestore history.
 */
export async function patchHistoryPenaltyScores(historyList) {
  if (!Array.isArray(historyList) || historyList.length === 0) return;

  for (const h of historyList) {
    const name = (h.name || '').trim();
    const isT3  = name === 'Tournament 3'  || name.toLowerCase() === 'tournament 3'  || name.endsWith('Tournament 3');
    const isT10 = name === 'Tournament 10' || name.toLowerCase() === 'tournament 10' || name.endsWith('Tournament 10');

    if (!isT3 && !isT10) continue;

    const winnerScore = isT3 ? 7 : 5;
    const loserScore  = isT3 ? 6 : 3;
    let modified = false;
    const cloned = JSON.parse(JSON.stringify(h));

    // 1) Patch in fixtures array (standard tournaments)
    if (Array.isArray(cloned.fixtures)) {
      cloned.fixtures.forEach(f => {
        if (f.penaltyWinner || f.phase === 'final' || f.phase === 'eliminator') {
          if (f.penaltyWinner && (f.homePenScore === undefined || f.homePenScore === null)) {
            if (f.penaltyWinner === f.homeId) {
              f.homePenScore = winnerScore;
              f.awayPenScore = loserScore;
            } else {
              f.homePenScore = loserScore;
              f.awayPenScore = winnerScore;
            }
            modified = true;
          }
        }
      });
    }

    // 2) Patch in final object (manual/retro tournaments if any)
    if (cloned.final && cloned.final.penaltyWinner && (cloned.final.homePenScore === undefined || cloned.final.homePenScore === null)) {
      if (cloned.final.penaltyWinner === cloned.final.homeId) {
        cloned.final.homePenScore = winnerScore;
        cloned.final.awayPenScore = loserScore;
      } else {
        cloned.final.homePenScore = loserScore;
        cloned.final.awayPenScore = winnerScore;
      }
      modified = true;
    }

    if (modified) {
      console.log(`[Patch] Updating penalty scores for ${cloned.name}: ${winnerScore}-${loserScore}`);
      await addToHistory(cloned);
    }
  }
}

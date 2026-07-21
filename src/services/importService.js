import { saveTournament, addToHistory, saveProfile } from './firestoreService.js';

/**
 * Imports a legacy JSON data backup into Firestore collections.
 * Can be triggered from the browser by selecting fc26-tournament-data.json
 * or by pasting/loading the JSON object.
 */
export async function importDataToFirestore(data) {
  let importedCount = 0;

  // Active tournament
  if (data.tournament) {
    await saveTournament(data.tournament);
    importedCount++;
  }

  // History
  if (Array.isArray(data.history)) {
    for (const h of data.history) {
      await addToHistory(h);
      importedCount++;
    }
  }

  // Profiles
  if (Array.isArray(data.profiles)) {
    for (const p of data.profiles) {
      await saveProfile(p);
      importedCount++;
    }
  }

  return importedCount;
}

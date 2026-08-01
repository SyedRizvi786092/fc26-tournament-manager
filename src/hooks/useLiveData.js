import { useEffect, useRef } from 'react';
import useStore from '../store/useStore.js';
import {
  subscribeToTournament,
  subscribeToHistory,
  subscribeToProfiles,
  subscribeToSettings,
} from '../services/firestoreService.js';
import { migrateProfileShape } from '../logic/migrateProfile.js';
import { patchHistoryPenaltyScores } from '../logic/patchHistory.js';
import { applyThemeAccent } from '../logic/theme.js';

/**
 * Sets up all Firestore real-time listeners.
 * Called once at the app root after auth is confirmed.
 */
export function useLiveData() {
  const { setTournament, setHistory, setProfiles, setAdminPresence, setThemeAccent, setDataReady } = useStore();

  // Track previous tournament status to detect status transitions
  const prevTournamentRef = useRef(null);

  useEffect(() => {
    const unsubT = subscribeToTournament((t) => {
      const prev  = prevTournamentRef.current;
      const store = useStore.getState();

      // Tournament was deleted (admin finished it) — send viewers back to hub
      if (!t && prev) {
        if (store.activeView === 'tournament') store.goToHub();
        prevTournamentRef.current = null;
        setTournament(null);
        return;
      }

      // Status just became 'complete' — auto-navigate all viewers to Result tab
      if (t && prev && prev.status !== 'complete' && t.status === 'complete') {
        if (store.activeView === 'tournament') store.setView('result');
      }

      prevTournamentRef.current = t;
      setTournament(t);
      setDataReady(true);
    });

    const unsubH = subscribeToHistory(h => {
      setHistory(h);
      setDataReady(true);
      patchHistoryPenaltyScores(h);
    });

    // Apply migration so all profile consumers always get the new multi-team shape
    const unsubP = subscribeToProfiles(profiles => {
      setProfiles(profiles.map(migrateProfileShape));
    });

    const unsubS = subscribeToSettings(settings => {
      setAdminPresence(settings?.adminPresence || null);
      const accent = settings?.themeAccent || '#00c896';
      setThemeAccent(accent);
      applyThemeAccent(accent);
    });

    return () => { unsubT(); unsubH(); unsubP(); unsubS(); };
  }, [setTournament, setHistory, setProfiles, setAdminPresence, setThemeAccent, setDataReady]);
}

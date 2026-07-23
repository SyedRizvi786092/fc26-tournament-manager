import { useEffect, useRef } from 'react';
import useStore from '../store/useStore.js';
import {
  subscribeToTournament,
  subscribeToHistory,
  subscribeToProfiles,
  subscribeToSettings,
} from '../services/firestoreService.js';
import { migrateProfileShape } from '../logic/migrateProfile.js';

/**
 * Sets up all Firestore real-time listeners.
 * Called once at the app root after auth is confirmed.
 */
export function useLiveData() {
  const { setTournament, setHistory, setProfiles, setAdminPresence } = useStore();

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
    });

    const unsubH = subscribeToHistory(setHistory);

    // Apply migration so all profile consumers always get the new multi-team shape
    const unsubP = subscribeToProfiles(profiles => {
      setProfiles(profiles.map(migrateProfileShape));
    });

    const unsubS = subscribeToSettings(settings => {
      setAdminPresence(settings?.adminPresence || null);
    });

    return () => { unsubT(); unsubH(); unsubP(); unsubS(); };
  }, [setTournament, setHistory, setProfiles, setAdminPresence]);
}

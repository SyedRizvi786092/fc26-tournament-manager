import { useEffect, useRef } from 'react';
import useStore from '../store/useStore.js';
import {
  subscribeToTournament,
  subscribeToHistory,
  subscribeToProfiles,
  subscribeToSettings,
} from '../services/firestoreService.js';

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
      const prev = prevTournamentRef.current;
      const store = useStore.getState();

      // Tournament was deleted (admin finished it)
      if (!t && prev) {
        // If any non-admin viewer is still on the tournament page, send them to hub
        if (store.activeView === 'tournament') {
          store.goToHub();
        }
        prevTournamentRef.current = null;
        setTournament(null);
        return;
      }

      // Tournament status just changed to 'complete' — auto-navigate ALL users to Result tab
      if (t && prev && prev.status !== 'complete' && t.status === 'complete') {
        if (store.activeView === 'tournament') {
          store.setView('result');
        }
      }

      // Tournament was newly created or resumed — auto-navigate users who are on hub to tournament
      // (Only happens if they were already viewing tournament and it was re-saved)
      prevTournamentRef.current = t;
      setTournament(t);
    });

    const unsubH = subscribeToHistory(setHistory);
    const unsubP = subscribeToProfiles(setProfiles);
    const unsubS = subscribeToSettings(settings => {
      setAdminPresence(settings?.adminPresence || null);
    });

    return () => {
      unsubT();
      unsubH();
      unsubP();
      unsubS();
    };
  }, [setTournament, setHistory, setProfiles, setAdminPresence]);
}

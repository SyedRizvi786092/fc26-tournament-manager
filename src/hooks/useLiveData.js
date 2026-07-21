import { useEffect } from 'react';
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

  useEffect(() => {
    const unsubT = subscribeToTournament(setTournament);
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

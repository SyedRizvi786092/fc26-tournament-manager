import { useEffect } from 'react';
import useStore from '../store/useStore.js';
import {
  subscribeToTournament,
  subscribeToHistory,
  subscribeToProfiles,
} from '../services/firestoreService.js';

/**
 * Sets up all three Firestore real-time listeners.
 * Called once at the app root after auth is confirmed.
 */
export function useLiveData() {
  const { setTournament, setHistory, setProfiles } = useStore();

  useEffect(() => {
    const unsubT = subscribeToTournament(setTournament);
    const unsubH = subscribeToHistory(setHistory);
    const unsubP = subscribeToProfiles(setProfiles);

    return () => {
      unsubT();
      unsubH();
      unsubP();
    };
  }, [setTournament, setHistory, setProfiles]);
}

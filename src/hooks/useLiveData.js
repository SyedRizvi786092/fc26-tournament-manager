import { useEffect, useRef } from 'react';
import useStore from '../store/useStore.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  subscribeToTournament,
  subscribeToHistory,
  subscribeToProfiles,
  subscribeToSettings,
  subscribeToUserSettings,
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
  const { currentUser } = useAuth();

  // Track previous tournament status to detect status transitions
  const prevTournamentRef = useRef(null);

  // Per-user theme preference listener (persisted in Firestore under users/{uid})
  useEffect(() => {
    if (!currentUser) return;
    const unsubUser = subscribeToUserSettings(currentUser.uid, (userSettings) => {
      const accent = userSettings?.themeAccent || '#00c896';
      setThemeAccent(accent);
      applyThemeAccent(accent);
    });
    return () => unsubUser();
  }, [currentUser, setThemeAccent]);

  useEffect(() => {
    const unsubT = subscribeToTournament((t) => {
      const prev  = prevTournamentRef.current;
      const store = useStore.getState();

      if (!t && prev) {
        if (store.activeView === 'tournament') store.goToHub();
        prevTournamentRef.current = null;
        setTournament(null);
        return;
      }

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

    const unsubP = subscribeToProfiles(profiles => {
      setProfiles(profiles.map(migrateProfileShape));
    });

    const unsubS = subscribeToSettings(settings => {
      setAdminPresence(settings?.adminPresence || null);
    });

    return () => { unsubT(); unsubH(); unsubP(); unsubS(); };
  }, [setTournament, setHistory, setProfiles, setAdminPresence, setDataReady]);
}

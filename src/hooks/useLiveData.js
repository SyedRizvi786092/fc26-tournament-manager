import { useEffect, useRef } from 'react';
import useStore from '../store/useStore.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  subscribeToTournament,
  subscribeToHistory,
  subscribeToProfiles,
  subscribeToSettings,
  subscribeToTrades,
  expireTrade,
} from '../services/firestoreService.js';
import { migrateProfileShape } from '../logic/migrateProfile.js';
import { patchHistoryPenaltyScores } from '../logic/patchHistory.js';
import { applyThemeAccent } from '../logic/theme.js';

/**
 * Sets up all Firestore real-time listeners.
 * Called once at the app root after auth is confirmed.
 */
export function useLiveData() {
  const {
    setTournament, setHistory, setProfiles, setAdminPresence,
    setThemeAccent, setUserNames, setDataReady, setTrades,
    setManagerRequests, setLinkedProfile,
  } = useStore();
  const { currentUser } = useAuth();

  // Track previous tournament status to detect status transitions
  const prevTournamentRef = useRef(null);

  // Load initial local preference instantly on user auth
  useEffect(() => {
    if (!currentUser) return;
    const localAccent = localStorage.getItem(`fc26_theme_${currentUser.uid}`);
    if (localAccent) {
      setThemeAccent(localAccent);
      applyThemeAccent(localAccent);
    }
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
      const migrated = profiles.map(migrateProfileShape);
      setProfiles(migrated);

      // Derive linked profile for the current user
      if (currentUser?.email) {
        const userEmail = currentUser.email.trim().toLowerCase();
        const linked = migrated.find(
          p => p.linkedEmail && p.linkedEmail.trim().toLowerCase() === userEmail
        ) || null;
        setLinkedProfile(linked);
      } else {
        setLinkedProfile(null);
      }
    });

    const unsubS = subscribeToSettings(settings => {
      setAdminPresence(settings?.adminPresence || null);
      if (settings?.userNames) {
        setUserNames(settings.userNames);
      }
      if (settings?.managerRequests) {
        setManagerRequests(settings.managerRequests);
      } else {
        setManagerRequests([]);
      }

      // Real-time sync user's personal cloud theme accent across all devices logged into this account
      if (currentUser && settings?.userThemes?.[currentUser.uid]) {
        const userAccent = settings.userThemes[currentUser.uid];
        setThemeAccent(userAccent);
        applyThemeAccent(userAccent);
        localStorage.setItem(`fc26_theme_${currentUser.uid}`, userAccent);
      }
    });

    // Subscribe to trades — auto-expire stale pending trades
    const unsubTr = subscribeToTrades(trades => {
      const now = new Date();
      trades.forEach(trade => {
        if (trade.status === 'pending' && trade.expiresAt && new Date(trade.expiresAt) < now) {
          expireTrade(trade.id);
        }
      });
      setTrades(trades);
    });

    return () => { unsubT(); unsubH(); unsubP(); unsubS(); unsubTr(); };
  }, [currentUser, setTournament, setHistory, setProfiles, setAdminPresence, setThemeAccent, setUserNames, setDataReady, setTrades, setManagerRequests, setLinkedProfile]);
}

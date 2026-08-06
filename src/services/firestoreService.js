import {
  doc, collection, setDoc, getDoc, deleteDoc, updateDoc,
  onSnapshot, query, orderBy, where, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase.js';

// ─── Config & Admin Presence ──────────────────────────────────────────────

export const getSettings = () => getDoc(doc(db, 'config', 'settings'));

export const saveSettings = (data) =>
  setDoc(doc(db, 'config', 'settings'), data, { merge: true });

export const subscribeToSettings = (callback) =>
  onSnapshot(doc(db, 'config', 'settings'), snapshot => {
    callback(snapshot.exists() ? snapshot.data() : null);
  });

export const updateAdminPresence = (activeTournamentId, isEditing) =>
  setDoc(doc(db, 'config', 'settings'), {
    adminPresence: {
      activeTournamentId: activeTournamentId || null,
      isEditing: !!isEditing,
      updatedAt: new Date().toISOString(),
    }
  }, { merge: true });

// ─── Per-User Cloud Preferences ─────────────────────────────────────────

export const saveUserThemeAccent = (uid, themeAccent) => {
  localStorage.setItem(`fc26_theme_${uid}`, themeAccent);
  return setDoc(doc(db, 'config', 'settings'), {
    userThemes: {
      [uid]: themeAccent,
    }
  }, { merge: true }).catch(() => {});
};

export const saveUserName = (uid, displayName) => {
  localStorage.setItem(`fc26_username_${uid}`, displayName);
  return setDoc(doc(db, 'profiles', `user_${uid}`), {
    id: `user_${uid}`,
    isUserProfile: true,
    uid,
    displayName,
  }, { merge: true }).catch(() => {});
};

// ─── Active Tournament ───────────────────────────────────────────────────

export const subscribeToTournament = (callback) =>
  onSnapshot(doc(db, 'tournaments', 'active'), snapshot => {
    callback(snapshot.exists() ? snapshot.data() : null);
  });

export const saveTournament = (data) =>
  setDoc(doc(db, 'tournaments', 'active'), data);

export const clearActiveTournament = () =>
  deleteDoc(doc(db, 'tournaments', 'active'));

// ─── History ─────────────────────────────────────────────────────────────

export const subscribeToHistory = (callback) =>
  onSnapshot(
    query(collection(db, 'history'), orderBy('createdAt', 'desc')),
    snapshot => callback(snapshot.docs.map(d => d.data()))
  );

export const addToHistory = (tournament) =>
  setDoc(doc(db, 'history', tournament.id), tournament);

export const deleteFromHistory = (id) =>
  deleteDoc(doc(db, 'history', id));

/**
 * Batch-update history entries with profileId tags (one-time migration).
 */
export const batchUpdateHistory = async (updatedEntries) => {
  const promises = updatedEntries.map(entry =>
    setDoc(doc(db, 'history', entry.id), entry)
  );
  await Promise.all(promises);
};

// ─── Profiles ─────────────────────────────────────────────────────────────

export const subscribeToProfiles = (callback) =>
  onSnapshot(collection(db, 'profiles'), snapshot => {
    const list = snapshot.docs
      .map(d => d.data())
      .filter(d => !d.isManagerRequest && !d.isUserProfile);
    callback(list);
  });

export const saveProfile = (profile) =>
  setDoc(doc(db, 'profiles', profile.id), profile);

export const deleteProfile = (id) =>
  deleteDoc(doc(db, 'profiles', id));

/**
 * Link a Google email address to a manager profile.
 */
export const linkManagerEmail = (profileId, email) =>
  setDoc(doc(db, 'profiles', profileId), {
    linkedEmail: email.trim().toLowerCase(),
    role: 'manager',
  }, { merge: true });

/**
 * Update manager customization fields (avatar, favoriteTeamId).
 */
export const updateManagerCustomization = (profileId, data) =>
  setDoc(doc(db, 'profiles', profileId), data, { merge: true });

// ─── Trades (stored in config/settings) ───────────────────────────────────

export const subscribeToTrades = (callback) =>
  onSnapshot(
    doc(db, 'config', 'settings'),
    snapshot => {
      const data = snapshot.exists() ? snapshot.data() : {};
      const tradesMap = data.trades || {};
      const list = Object.values(tradesMap).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      callback(list);
    }
  );

export const createTradeProposal = async (trade) => {
  const tradeId = 'trade_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const tradeObj = {
    ...trade,
    id: tradeId,
    status: 'pending',
    selectedPlayer: null,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  await setDoc(doc(db, 'config', 'settings'), {
    trades: {
      [tradeId]: tradeObj,
    }
  }, { merge: true });

  return tradeId;
};

export const acceptTrade = (tradeId, selectedPlayer) =>
  setDoc(doc(db, 'config', 'settings'), {
    trades: {
      [tradeId]: {
        status: 'accepted',
        selectedPlayer,
        resolvedAt: new Date().toISOString(),
      }
    }
  }, { merge: true });

export const rejectTrade = (tradeId) =>
  setDoc(doc(db, 'config', 'settings'), {
    trades: {
      [tradeId]: {
        status: 'rejected',
        resolvedAt: new Date().toISOString(),
      }
    }
  }, { merge: true });

export const cancelTrade = (tradeId) =>
  setDoc(doc(db, 'config', 'settings'), {
    trades: {
      [tradeId]: {
        status: 'cancelled',
        resolvedAt: new Date().toISOString(),
      }
    }
  }, { merge: true });

export const expireTrade = (tradeId) =>
  setDoc(doc(db, 'config', 'settings'), {
    trades: {
      [tradeId]: {
        status: 'expired',
        resolvedAt: new Date().toISOString(),
      }
    }
  }, { merge: true });

export const markTradeRead = (tradeId, uid) =>
  setDoc(doc(db, 'config', 'settings'), {
    trades: {
      [tradeId]: {
        [`readBy_${uid}`]: true,
      }
    }
  }, { merge: true });

// ─── Manager Registration Requests (stored in profiles collection) ──────────

export const subscribeToManagerRequests = (callback) =>
  onSnapshot(
    collection(db, 'profiles'),
    snapshot => {
      const list = snapshot.docs
        .map(d => d.data())
        .filter(d => d.isManagerRequest === true)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      callback(list);
    }
  );

export const sendManagerRequest = async (requestData) => {
  const now = new Date().toISOString();
  const reqDoc = {
    id: 'req_' + requestData.uid,
    isManagerRequest: true,
    uid: requestData.uid,
    userEmail: requestData.userEmail.toLowerCase(),
    userName: requestData.userName,
    status: 'pending',
    createdAt: now,
  };
  await setDoc(doc(db, 'profiles', reqDoc.id), reqDoc);
};

export const resolveManagerRequest = async (targetUid, status) => {
  const reqDocId = 'req_' + targetUid;
  if (status === 'accepted') {
    await deleteDoc(doc(db, 'profiles', reqDocId)).catch(() => {});
  } else {
    await setDoc(doc(db, 'profiles', reqDocId), {
      status,
      resolvedAt: new Date().toISOString(),
    }, { merge: true });
  }
};

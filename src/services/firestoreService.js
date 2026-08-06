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

export const saveUserThemeAccent = (uid, themeAccent) =>
  setDoc(doc(db, 'config', 'settings'), {
    userThemes: {
      [uid]: themeAccent,
    }
  }, { merge: true });

export const saveUserName = (uid, displayName) =>
  setDoc(doc(db, 'config', 'settings'), {
    userNames: {
      [uid]: displayName,
    }
  }, { merge: true });

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
 * @param {Array} updatedEntries - Array of { id, ...tournamentData } objects with profileId fields added to players.
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
    callback(snapshot.docs.map(d => d.data()));
  });

export const saveProfile = (profile) =>
  setDoc(doc(db, 'profiles', profile.id), profile);

export const deleteProfile = (id) =>
  deleteDoc(doc(db, 'profiles', id));

/**
 * Link a Google email address to a manager profile.
 * @param {string} profileId - The profile document ID.
 * @param {string} email - The Google email to link.
 */
export const linkManagerEmail = (profileId, email) =>
  setDoc(doc(db, 'profiles', profileId), {
    linkedEmail: email.trim().toLowerCase(),
    role: 'manager',
  }, { merge: true });

/**
 * Update manager customization fields (avatar, favoriteTeamId).
 * @param {string} profileId
 * @param {object} data - { avatar?: string, favoriteTeamId?: string }
 */
export const updateManagerCustomization = (profileId, data) =>
  setDoc(doc(db, 'profiles', profileId), data, { merge: true });

// ─── Trades ───────────────────────────────────────────────────────────────

export const subscribeToTrades = (callback) =>
  onSnapshot(
    query(collection(db, 'trades'), orderBy('createdAt', 'desc')),
    snapshot => callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
  );

/**
 * Create a new trade proposal.
 * @param {object} trade - Trade proposal object (without id — Firestore auto-generates).
 */
export const createTradeProposal = async (trade) => {
  const tradeRef = doc(collection(db, 'trades'));
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await setDoc(tradeRef, {
    ...trade,
    id: tradeRef.id,
    status: 'pending',
    selectedPlayer: null,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
  return tradeRef.id;
};

/**
 * Accept a trade proposal by selecting a player from the offered list.
 * @param {string} tradeId
 * @param {string} selectedPlayer - The player name selected by the recipient.
 */
export const acceptTrade = (tradeId, selectedPlayer) =>
  setDoc(doc(db, 'trades', tradeId), {
    status: 'accepted',
    selectedPlayer,
    resolvedAt: new Date().toISOString(),
  }, { merge: true });

/**
 * Reject a trade proposal.
 * @param {string} tradeId
 */
export const rejectTrade = (tradeId) =>
  setDoc(doc(db, 'trades', tradeId), {
    status: 'rejected',
    resolvedAt: new Date().toISOString(),
  }, { merge: true });

/**
 * Cancel a trade proposal (by the proposer).
 * @param {string} tradeId
 */
export const cancelTrade = (tradeId) =>
  setDoc(doc(db, 'trades', tradeId), {
    status: 'cancelled',
    resolvedAt: new Date().toISOString(),
  }, { merge: true });

/**
 * Mark a trade as expired.
 * @param {string} tradeId
 */
export const expireTrade = (tradeId) =>
  setDoc(doc(db, 'trades', tradeId), {
    status: 'expired',
    resolvedAt: new Date().toISOString(),
  }, { merge: true });

/**
 * Mark trade notifications as read for a user.
 * @param {string} tradeId
 * @param {string} uid - The user who read the notification.
 */
export const markTradeRead = (tradeId, uid) =>
  setDoc(doc(db, 'trades', tradeId), {
    [`readBy.${uid}`]: true,
  }, { merge: true });

// ─── Manager Registration Requests ──────────────────────────────────────────

export const subscribeToManagerRequests = (callback) =>
  onSnapshot(
    query(collection(db, 'managerRequests'), orderBy('createdAt', 'desc')),
    snapshot => callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
  );

export const sendManagerRequest = async (requestData) => {
  const ref = doc(collection(db, 'managerRequests'));
  const now = new Date().toISOString();
  await setDoc(ref, {
    id: ref.id,
    ...requestData,
    status: 'pending',
    createdAt: now,
  });
  return ref.id;
};

export const resolveManagerRequest = (requestId, status) =>
  setDoc(doc(db, 'managerRequests', requestId), {
    status, // 'accepted' | 'rejected'
    resolvedAt: new Date().toISOString(),
  }, { merge: true });

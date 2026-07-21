import {
  doc, collection, setDoc, getDoc, deleteDoc,
  onSnapshot, query, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase.js';

// ─── Config ────────────────────────────────────────────────────────────────

export const getSettings = () => getDoc(doc(db, 'config', 'settings'));

export const saveSettings = (data) =>
  setDoc(doc(db, 'config', 'settings'), data, { merge: true });

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

// ─── Profiles ─────────────────────────────────────────────────────────────

export const subscribeToProfiles = (callback) =>
  onSnapshot(collection(db, 'profiles'), snapshot => {
    callback(snapshot.docs.map(d => d.data()));
  });

export const saveProfile = (profile) =>
  setDoc(doc(db, 'profiles', profile.id), profile);

export const deleteProfile = (id) =>
  deleteDoc(doc(db, 'profiles', id));

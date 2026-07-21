import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase.js';
import { getSettings, saveSettings } from '../services/firestoreService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(undefined); // undefined = loading
  const [adminUid, setAdminUid]       = useState(null);
  const [setupNeeded, setSetupNeeded] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const snap = await getSettings();
          if (snap.exists()) {
            const { adminUid: storedUid } = snap.data();
            setAdminUid(storedUid);
            setSetupNeeded(false);
          } else {
            // No config yet — first run, let this user claim admin
            setAdminUid(null);
            setSetupNeeded(true);
          }
        } catch {
          setAdminUid(null);
        }
      } else {
        setAdminUid(null);
        setSetupNeeded(false);
      }
    });
    return unsub;
  }, []);

  const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

  const signOut = () => firebaseSignOut(auth);

  const claimAdmin = async () => {
    if (!currentUser) return;
    await saveSettings({ adminUid: currentUser.uid });
    setAdminUid(currentUser.uid);
    setSetupNeeded(false);
  };

  const isAdmin = currentUser != null && currentUser.uid === adminUid;
  const loading = currentUser === undefined;

  return (
    <AuthContext.Provider value={{ currentUser, isAdmin, loading, setupNeeded, signInWithGoogle, signOut, claimAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

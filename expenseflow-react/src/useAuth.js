import { useEffect, useState, useRef, useCallback } from "react";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "./firebase";

// Auto sign-out after this much inactivity (financial data hygiene).
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"];

export function useAuth() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const idleTimer = useRef(null);

  const logout = useCallback(() => signOut(auth), []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthLoading(false);
      return;
    }
    // Persist the session in local storage (survives reloads, not shared across
    // browsers). This is explicit rather than relying on the SDK default.
    setPersistence(auth, browserLocalPersistence).catch(() => {});

    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  // ── Idle auto-logout ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured || !user) return;

    function resetTimer() {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => { signOut(auth); }, IDLE_TIMEOUT_MS);
    }
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, resetTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [user]);

  const loginGoogle = () => signInWithPopup(auth, googleProvider);
  const loginEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);
  const registerEmail = async (email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Kick off email verification so accounts can be validated.
    try { await sendEmailVerification(cred.user); } catch { /* non-fatal */ }
    return cred;
  };
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);
  const resendVerification = () =>
    auth.currentUser ? sendEmailVerification(auth.currentUser) : Promise.resolve();

  return {
    user, authLoading, loginGoogle, loginEmail, registerEmail,
    resetPassword, resendVerification, logout,
  };
}

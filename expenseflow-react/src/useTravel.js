import { useEffect, useState, useCallback } from "react";
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc,
  doc, getDocs, query, where, writeBatch, getDoc, setDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

const TRIPS = "trips";
const TRIP_EXPENSES = "tripExpenses";

export function useTravel(uid, userEmail) {
  const [trips,          setTrips]          = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [expenses,       setExpenses]       = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);

  // ── Load trips the user owns or is a member of ────────────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured || !uid) return;
    const qOwner  = query(collection(db, TRIPS), where("ownerUid",   "==", uid));
    const qMember = query(collection(db, TRIPS), where("memberUids", "array-contains", uid));

    const merge = (snap, key) => {
      setTrips((prev) => {
        const filtered = prev.filter((t) => t._src !== key);
        const fresh = snap.docs.map((d) => ({ id: d.id, _src: key, ...d.data() }));
        const map = new Map([...filtered, ...fresh].map((t) => [t.id, t]));
        return [...map.values()];
      });
    };

    const unsubOwner  = onSnapshot(qOwner,  (s) => merge(s, "owner"),  (e) => setError(e.message));
    const unsubMember = onSnapshot(qMember, (s) => merge(s, "member"), (e) => setError(e.message));
    return () => { unsubOwner(); unsubMember(); };
  }, [uid]);

  // ── Load expenses for selected trip ───────────────────────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured || !selectedTripId) { setExpenses([]); return; }
    const trip = trips.find((t) => t.id === selectedTripId);
    if (!trip) return;

    setLoading(true);
    const q = query(
      collection(db, TRIP_EXPENSES),
      where("tripId",   "==", selectedTripId),
      where("ownerUid", "==", trip.ownerUid),
    );
    const unsub = onSnapshot(q,
      (s) => { setExpenses(s.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
      (e) => { setError(e.message); setLoading(false); },
    );
    return () => unsub();
  }, [selectedTripId, trips]);

  const selectedTrip = trips.find((t) => t.id === selectedTripId) || null;
  const isOwner = selectedTrip?.ownerUid === uid;

  // ── Create trip ────────────────────────────────────────────────────────────
  const createTrip = useCallback(async (name, destination = "") => {
    const ref = await addDoc(collection(db, TRIPS), {
      name, destination,
      ownerUid: uid, ownerEmail: userEmail,
      memberUids: [], memberEmails: [], pendingEmails: [],
      createdAt: Date.now(),
    });
    setSelectedTripId(ref.id);
    return ref.id;
  }, [uid, userEmail]);

  // ── Rename trip ────────────────────────────────────────────────────────────
  const renameTrip = useCallback(async (tripId, name) => {
    if (!name?.trim()) throw new Error("Name cannot be empty.");
    await updateDoc(doc(db, TRIPS, tripId), { name: name.trim() });
  }, []);

  // ── Delete trip ────────────────────────────────────────────────────────────
  const deleteTrip = useCallback(async (tripId) => {
    const snap = await getDocs(query(collection(db, TRIP_EXPENSES), where("tripId", "==", tripId)));
    for (let i = 0; i < snap.docs.length; i += 450) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await deleteDoc(doc(db, TRIPS, tripId));
    setSelectedTripId(null);
  }, []);

  // ── Member management ──────────────────────────────────────────────────────
  const inviteMember = useCallback(async (tripId, email) => {
    const normalized = email.trim().toLowerCase();
    const tripRef = doc(db, TRIPS, tripId);
    const snap = await getDoc(tripRef);
    if (!snap.exists()) throw new Error("Trip not found");
    const data = snap.data();
    if (data.memberEmails?.includes(normalized))  throw new Error("Already a member.");
    if (data.pendingEmails?.includes(normalized)) throw new Error("Already invited.");
    if (data.ownerEmail?.toLowerCase() === normalized) throw new Error("That's the owner.");

    const lookupSnap = await getDocs(query(collection(db, "userLookup"), where("email", "==", normalized)));
    if (!lookupSnap.empty) {
      const memberUid = lookupSnap.docs[0].data().uid;
      await updateDoc(tripRef, {
        memberEmails: [...(data.memberEmails || []), normalized],
        memberUids:   [...(data.memberUids   || []), memberUid],
      });
    } else {
      await updateDoc(tripRef, { pendingEmails: [...(data.pendingEmails || []), normalized] });
    }
  }, []);

  // ── Guest management (name-only, no account needed) ───────────────────────
  const addGuest = useCallback(async (tripId, name) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Name cannot be empty.");
    const tripRef = doc(db, TRIPS, tripId);
    const snap = await getDoc(tripRef);
    if (!snap.exists()) throw new Error("Trip not found");
    const data = snap.data();
    const guests = data.guestNames || [];
    if (guests.map((g) => g.toLowerCase()).includes(trimmed.toLowerCase()))
      throw new Error("A guest with that name already exists.");
    await updateDoc(tripRef, { guestNames: [...guests, trimmed] });
  }, []);

  const removeGuest = useCallback(async (tripId, name) => {
    const tripRef = doc(db, TRIPS, tripId);
    const snap = await getDoc(tripRef);
    if (!snap.exists()) return;
    const data = snap.data();
    await updateDoc(tripRef, {
      guestNames: (data.guestNames || []).filter((g) => g !== name),
    });
  }, []);

  const removeMember = useCallback(async (tripId, email) => {
    const normalized = email.trim().toLowerCase();
    const tripRef = doc(db, TRIPS, tripId);
    const snap = await getDoc(tripRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const memberEmails = data.memberEmails || [];
    const memberUids   = data.memberUids   || [];
    const newEmails = [], newUids = [];
    memberEmails.forEach((e, i) => {
      if (e !== normalized) { newEmails.push(e); newUids.push(memberUids[i]); }
    });
    await updateDoc(tripRef, {
      memberEmails:  newEmails,
      memberUids:    newUids,
      pendingEmails: (data.pendingEmails || []).filter((e) => e !== normalized),
    });
  }, []);

  // ── Expense CRUD ───────────────────────────────────────────────────────────
  const addExpense = useCallback(async ({ cat, desc, amount, date }) => {
    await addDoc(collection(db, TRIP_EXPENSES), {
      tripId: selectedTripId, ownerUid: uid,
      cat, desc: desc || "", amount: Number(amount), date,
    });
  }, [selectedTripId, uid]);

  const updateExpense = useCallback(async (id, fields) => {
    await updateDoc(doc(db, TRIP_EXPENSES, id), { ...fields, amount: Number(fields.amount) });
  }, []);

  const deleteExpense = useCallback((id) => deleteDoc(doc(db, TRIP_EXPENSES, id)), []);

  return {
    trips, selectedTripId, setSelectedTripId, selectedTrip, isOwner,
    expenses, loading, error,
    createTrip, renameTrip, deleteTrip,
    inviteMember, removeMember,
    addGuest, removeGuest,
    addExpense, updateExpense, deleteExpense,
  };
}

/**
 * Resolve pending travel invites when user logs in.
 * Call alongside registerUserLookup.
 */
export async function resolveTravelInvites(uid, email) {
  if (!isFirebaseConfigured || !uid || !email) return;
  try {
    const q = query(collection(db, TRIPS), where("pendingEmails", "array-contains", email.toLowerCase()));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const data = d.data();
      await updateDoc(d.ref, {
        pendingEmails: (data.pendingEmails || []).filter((e) => e !== email.toLowerCase()),
        memberEmails:  [...(data.memberEmails || []), email.toLowerCase()],
        memberUids:    [...(data.memberUids   || []), uid],
      });
    }
  } catch (_) {}
}

import { useEffect, useState, useCallback } from "react";
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc,
  doc, getDocs, query, where, writeBatch, getDoc, setDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

const SHARED_HOUSES   = "sharedHouses";
const SHARED_HOUSE_TX = "sharedHouseTx"; // sub-data keyed by houseId

/**
 * Shared house data hook.
 * - Loads all shared houses where the current user is owner OR member.
 * - For the selected shared house, loads its bills + grocery items.
 */
export function useSharedHouse(uid, userEmail) {
  const [sharedHouses, setSharedHouses]   = useState([]); // list of house meta docs
  const [selectedHouseId, setSelectedHouseId] = useState(null);
  const [house,   setHouse]   = useState([]);
  const [grocery, setGrocery] = useState([]);
  const [tuition, setTuition] = useState([]);
  const [otherExpense, setOtherExpense] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // ── Load list of shared houses the user belongs to ────────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured || !uid) return;
    // Houses where user is owner
    const qOwner  = query(collection(db, SHARED_HOUSES), where("ownerUid",     "==", uid));
    // Houses where user is a member (by uid)
    const qMember = query(collection(db, SHARED_HOUSES), where("memberUids",   "array-contains", uid));

    const merge = (snap, key) => {
      setSharedHouses((prev) => {
        const filtered = prev.filter((h) => h._src !== key);
        const fresh = snap.docs.map((d) => ({ id: d.id, _src: key, ...d.data() }));
        // De-dup by id (owner query + member query might overlap)
        const map = new Map([...filtered, ...fresh].map((h) => [h.id, h]));
        return [...map.values()];
      });
    };

    const unsubOwner  = onSnapshot(qOwner,  (s) => merge(s, "owner"),  (e) => setError(e.message));
    const unsubMember = onSnapshot(qMember, (s) => merge(s, "member"), (e) => setError(e.message));
    return () => { unsubOwner(); unsubMember(); };
  }, [uid]);

  // ── Load bills + grocery for selected house ────────────────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured || !selectedHouseId) {
      setHouse([]); setGrocery([]); return;
    }
    // We need the house doc to know the ownerUid for the query
    const house = sharedHouses.find((h) => h.id === selectedHouseId);
    if (!house) return; // not loaded yet
    const ownerUid = house.ownerUid;

    setLoading(true);
    // Rules check ownerUid on each doc — query must include it so Firestore can evaluate the rule
    const qHouse   = query(collection(db, "sharedHouseBills"),   where("houseId", "==", selectedHouseId), where("ownerUid", "==", ownerUid));
    const qGrocery = query(collection(db, "sharedHouseGrocery"), where("houseId", "==", selectedHouseId), where("ownerUid", "==", ownerUid));
    const qTuition = query(collection(db, "sharedHouseTuition"), where("houseId", "==", selectedHouseId), where("ownerUid", "==", ownerUid));
    const qOther   = query(collection(db, "sharedHouseOther"),   where("houseId", "==", selectedHouseId), where("ownerUid", "==", ownerUid));

    const unsubH = onSnapshot(qHouse,   (s) => { setHouse(s.docs.map((d)        => ({ id: d.id, ...d.data() }))); setLoading(false); }, (e) => { setError(e.message); setLoading(false); });
    const unsubG = onSnapshot(qGrocery, (s) => { setGrocery(s.docs.map((d)      => ({ id: d.id, ...d.data() }))); });
    const unsubT = onSnapshot(qTuition, (s) => { setTuition(s.docs.map((d)      => ({ id: d.id, ...d.data() }))); });
    const unsubO = onSnapshot(qOther,   (s) => { setOtherExpense(s.docs.map((d) => ({ id: d.id, ...d.data() }))); });
    return () => { unsubH(); unsubG(); unsubT(); unsubO(); };
  }, [selectedHouseId, sharedHouses]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const selectedHouse = sharedHouses.find((h) => h.id === selectedHouseId) || null;
  const isOwner = selectedHouse?.ownerUid === uid;

  // ── Create a new shared house ──────────────────────────────────────────────
  const createSharedHouse = useCallback(async (name) => {
    const ref = await addDoc(collection(db, SHARED_HOUSES), {
      name,
      ownerUid: uid,
      ownerEmail: userEmail,
      memberUids: [],
      memberEmails: [],
      pendingEmails: [],
      createdAt: Date.now(),
    });
    setSelectedHouseId(ref.id);
    return ref.id;
  }, [uid, userEmail]);

  // ── Invite a member by email ───────────────────────────────────────────────
  const inviteMember = useCallback(async (houseId, email) => {
    const normalized = email.trim().toLowerCase();
    const houseRef = doc(db, SHARED_HOUSES, houseId);
    const snap = await getDoc(houseRef);
    if (!snap.exists()) throw new Error("House not found");
    const data = snap.data();

    if (data.memberEmails?.includes(normalized))  throw new Error("Already a member.");
    if (data.pendingEmails?.includes(normalized)) throw new Error("Already invited.");
    if (data.ownerEmail?.toLowerCase() === normalized) throw new Error("That's the owner.");

    // Look up if a user with that email has already used the app
    // We store a lookup in a `userLookup` collection keyed by email
    const lookupSnap = await getDocs(query(collection(db, "userLookup"), where("email", "==", normalized)));
    if (!lookupSnap.empty) {
      // User exists — add directly
      const memberUid = lookupSnap.docs[0].data().uid;
      await updateDoc(houseRef, {
        memberEmails: [...(data.memberEmails || []), normalized],
        memberUids:   [...(data.memberUids   || []), memberUid],
      });
    } else {
      // User doesn't exist yet — add to pending
      await updateDoc(houseRef, {
        pendingEmails: [...(data.pendingEmails || []), normalized],
      });
    }
  }, []);

  // ── Remove a member ────────────────────────────────────────────────────────
  const removeMember = useCallback(async (houseId, email) => {
    const normalized = email.trim().toLowerCase();
    const houseRef = doc(db, SHARED_HOUSES, houseId);
    const snap = await getDoc(houseRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const memberEmails = data.memberEmails || [];
    const memberUids   = data.memberUids   || [];
    // Build filtered arrays, keeping uid/email pairs in sync
    const newEmails = [];
    const newUids   = [];
    memberEmails.forEach((e, i) => {
      if (e !== normalized) { newEmails.push(e); newUids.push(memberUids[i]); }
    });
    await updateDoc(houseRef, {
      memberEmails:  newEmails,
      memberUids:    newUids,
      pendingEmails: (data.pendingEmails || []).filter((e) => e !== normalized),
    });
  }, []);

  // ── Rename shared house (owner only) ─────────────────────────────────────
  const renameSharedHouse = useCallback(async (houseId, newName) => {
    if (!newName?.trim()) throw new Error("Name cannot be empty.");
    await updateDoc(doc(db, SHARED_HOUSES, houseId), { name: newName.trim() });
  }, []);
  const deleteSharedHouse = useCallback(async (houseId) => {
    // Delete all bills + grocery for this house
    const [billsSnap, grocSnap] = await Promise.all([
      getDocs(query(collection(db, "sharedHouseBills"),   where("houseId", "==", houseId))),
      getDocs(query(collection(db, "sharedHouseGrocery"), where("houseId", "==", houseId))),
    ]);
    const allDocs = [...billsSnap.docs, ...grocSnap.docs];
    for (let i = 0; i < allDocs.length; i += 450) {
      const batch = writeBatch(db);
      allDocs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await deleteDoc(doc(db, SHARED_HOUSES, houseId));
    setSelectedHouseId(null);
  }, []);

  // ── Bill CRUD (owner only) ─────────────────────────────────────────────────
  const addBill = useCallback(async ({ category, amount, month, note, usage }) => {
    await addDoc(collection(db, "sharedHouseBills"), {
      houseId: selectedHouseId, ownerUid: uid,
      cat: category, amount: Number(amount), month, note: note || "", usage: usage ?? null,
    });
  }, [selectedHouseId, uid]);

  const updateBill = useCallback(async (id, fields) => {
    await updateDoc(doc(db, "sharedHouseBills", id), { ...fields, amount: Number(fields.amount), usage: fields.usage ?? null });
  }, []);

  const deleteBill = useCallback((id) => deleteDoc(doc(db, "sharedHouseBills", id)), []);

  const importBills = useCallback(async (rows = []) => {
    const batch = writeBatch(db);
    rows.forEach((r) => {
      batch.set(doc(collection(db, "sharedHouseBills")), {
        houseId: selectedHouseId, ownerUid: uid,
        cat: r.cat, amount: Number(r.amount), month: r.month, note: r.note || "", usage: r.usage ?? null,
      });
    });
    await batch.commit();
  }, [selectedHouseId, uid]);

  // ── Grocery CRUD (owner only) ──────────────────────────────────────────────
  const addGrocery = useCallback(async ({ subcat, desc, amount, month }) => {
    await addDoc(collection(db, "sharedHouseGrocery"), {
      houseId: selectedHouseId, ownerUid: uid,
      subcat, desc, amount: Number(amount), month,
    });
  }, [selectedHouseId, uid]);

  const addTuition = useCallback(async ({ subcat, desc, amount, month }) => {
    await addDoc(collection(db, "sharedHouseTuition"), { houseId: selectedHouseId, ownerUid: uid, subcat, desc, amount: Number(amount), month });
  }, [selectedHouseId, uid]);

  const deleteTuition = useCallback((id) => deleteDoc(doc(db, "sharedHouseTuition", id)), []);

  const addOtherExpense = useCallback(async ({ subcat, desc, amount, month }) => {
    await addDoc(collection(db, "sharedHouseOther"), { houseId: selectedHouseId, ownerUid: uid, subcat, desc, amount: Number(amount), month });
  }, [selectedHouseId, uid]);

  const deleteOtherExpense = useCallback((id) => deleteDoc(doc(db, "sharedHouseOther", id)), []);

  const deleteGrocery = useCallback((id) => deleteDoc(doc(db, "sharedHouseGrocery", id)), []);

  const importGrocery = useCallback(async (rows = []) => {    const batch = writeBatch(db);
    rows.forEach((r) => {
      batch.set(doc(collection(db, "sharedHouseGrocery")), {
        houseId: selectedHouseId, ownerUid: uid,
        subcat: r.subcat, desc: r.desc, amount: Number(r.amount), month: r.month,
      });
    });
    await batch.commit();
  }, [selectedHouseId, uid]);

  // ── Clear all bills + grocery for the selected shared house ──────────────
  const clearSharedData = useCallback(async () => {
    if (!selectedHouseId) throw new Error("No shared house selected.");
    const [billsSnap, grocSnap] = await Promise.all([
      getDocs(query(collection(db, "sharedHouseBills"),   where("houseId", "==", selectedHouseId), where("ownerUid", "==", uid))),
      getDocs(query(collection(db, "sharedHouseGrocery"), where("houseId", "==", selectedHouseId), where("ownerUid", "==", uid))),
    ]);
    const allDocs = [...billsSnap.docs, ...grocSnap.docs];
    for (let i = 0; i < allDocs.length; i += 450) {
      const batch = writeBatch(db);
      allDocs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    return allDocs.length;
  }, [selectedHouseId, uid]);
  const migrateToShared = useCallback(async (personalHouse = [], personalGrocery = []) => {
    if (!selectedHouseId) throw new Error("No shared house selected.");
    const CHUNK = 450;
    const billRows    = personalHouse.map((r) => ({ houseId: selectedHouseId, ownerUid: uid, cat: r.cat, amount: Number(r.amount), month: r.month, note: r.note || "", usage: r.usage ?? null }));
    const groceryRows = personalGrocery.map((r) => ({ houseId: selectedHouseId, ownerUid: uid, subcat: r.subcat, desc: r.desc, amount: Number(r.amount), month: r.month }));
    const allRows = [
      ...billRows.map((r)    => ({ col: "sharedHouseBills",   data: r })),
      ...groceryRows.map((r) => ({ col: "sharedHouseGrocery", data: r })),
    ];
    for (let i = 0; i < allRows.length; i += CHUNK) {
      const batch = writeBatch(db);
      allRows.slice(i, i + CHUNK).forEach(({ col, data }) => {
        batch.set(doc(collection(db, col)), data);
      });
      await batch.commit();
    }
    return { bills: billRows.length, grocery: groceryRows.length };
  }, [selectedHouseId, uid]);

  return {
    sharedHouses, selectedHouseId, setSelectedHouseId,
    selectedHouse, isOwner,
    house, grocery, tuition, otherExpense, loading, error,
    createSharedHouse, inviteMember, removeMember, renameSharedHouse, deleteSharedHouse,
    addBill, updateBill, deleteBill, importBills,
    addGrocery, deleteGrocery, importGrocery,
    addTuition, deleteTuition, addOtherExpense, deleteOtherExpense,
    migrateToShared, clearSharedData,
  };
}

/**
 * Call this once on login so invited users get linked by UID.
 * Write/merge a userLookup doc so future invites by email resolve instantly.
 */
export async function registerUserLookup(uid, email) {
  if (!isFirebaseConfigured || !uid || !email) return;
  try {
    await setDoc(doc(db, "userLookup", uid), { uid, email: email.toLowerCase() }, { merge: true });
    // Also resolve any pending invites for this email
    const q = query(collection(db, SHARED_HOUSES), where("pendingEmails", "array-contains", email.toLowerCase()));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const data = d.data();
      const pending = data.pendingEmails || [];
      await updateDoc(d.ref, {
        pendingEmails: pending.filter((e) => e !== email.toLowerCase()),
        memberEmails:  [...(data.memberEmails || []), email.toLowerCase()],
        memberUids:    [...(data.memberUids   || []), uid],
      });
    }
  } catch (_) { /* non-critical */ }
}

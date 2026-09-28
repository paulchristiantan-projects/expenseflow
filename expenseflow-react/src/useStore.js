import { useEffect, useState, useCallback } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { cat } from "./helpers";

const TX = "transactions";
const OTHERS = "others";
const WALLETS = "wallets";
const HOUSE = "house";
const GROCERY = "grocery";
const S_BILLS   = "sharedHouseBills";
const S_GROCERY = "sharedHouseGrocery";
const TUITION     = "tuition";
const OTHER_EXP   = "otherExpense";
const S_TUITION   = "sharedHouseTuition";
const S_OTHER_EXP = "sharedHouseOther";

export function useStore(uid, syncTarget = null) {
  // syncTarget: { houseId, ownerUid } — when set, all house/grocery writes mirror to shared collections
  const [tx, setTx] = useState([]);
  const [others, setOthers] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [house, setHouse] = useState([]);
  const [grocery, setGrocery] = useState([]);
  const [tuition, setTuition] = useState([]);
  const [otherExpense, setOtherExpense] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(isFirebaseConfigured ? null : "config");

  useEffect(() => {
    if (!isFirebaseConfigured || !uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const txQuery      = query(collection(db, TX),      where("uid", "==", uid));
    const othersQuery  = query(collection(db, OTHERS),  where("uid", "==", uid));
    const walletsQuery = query(collection(db, WALLETS), where("uid", "==", uid));
    const houseQuery   = query(collection(db, HOUSE),    where("uid", "==", uid));
    const groceryQuery = query(collection(db, GROCERY),  where("uid", "==", uid));
    const tuitionQuery = query(collection(db, TUITION),  where("uid", "==", uid));
    const otherExpQuery= query(collection(db, OTHER_EXP),where("uid", "==", uid));

    const unsubTx = onSnapshot(txQuery, (s) => {
      setTx(s.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (e) => { setError(e.message); setLoading(false); });

    const unsubOthers  = onSnapshot(othersQuery,  (s) => setOthers(s.docs.map((d)  => ({ id: d.id, ...d.data() }))));
    const unsubWallets = onSnapshot(walletsQuery, (s) => setWallets(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubHouse   = onSnapshot(houseQuery,    (s) => setHouse(s.docs.map((d)        => ({ id: d.id, ...d.data() }))));
    const unsubGrocery = onSnapshot(groceryQuery,  (s) => setGrocery(s.docs.map((d)      => ({ id: d.id, ...d.data() }))));
    const unsubTuition = onSnapshot(tuitionQuery,  (s) => setTuition(s.docs.map((d)      => ({ id: d.id, ...d.data() }))));
    const unsubOtherExp= onSnapshot(otherExpQuery, (s) => setOtherExpense(s.docs.map((d) => ({ id: d.id, ...d.data() }))));

    return () => { unsubTx(); unsubOthers(); unsubWallets(); unsubHouse(); unsubGrocery(); unsubTuition(); unsubOtherExp(); };
  }, [uid]);

  const addTx = useCallback(async ({ date, amount, desc, category }) => {
    const month = date.slice(0, 7);
    await addDoc(collection(db, TX), { date, amount: Number(amount), desc, cat: category || cat(desc), month, uid });
  }, [uid]);

  const importMany = useCallback(async (txRows = [], otherRows = [], fallbackMonth) => {
    const batch = writeBatch(db);
    txRows.forEach((r) => {
      batch.set(doc(collection(db, TX)), { date: r.date, amount: Number(r.amount), desc: r.desc, cat: cat(r.desc), month: r.date.slice(0, 7), uid });
    });
    otherRows.forEach((r) => {
      batch.set(doc(collection(db, OTHERS)), { desc: r.desc, amount: Number(r.amount), cat: cat(r.desc), month: r.month || fallbackMonth, uid });
    });
    await batch.commit();
  }, [uid]);

  const addOther = useCallback(async ({ desc, amount, month, category }) => {
    await addDoc(collection(db, OTHERS), { desc, amount: Number(amount), cat: category || cat(desc), month, uid });
  }, [uid]);

  const addHouse = useCallback(async ({ category, amount, month, note, usage }) => {
    const personalRef = await addDoc(collection(db, HOUSE), { cat: category, amount: Number(amount), month, note: note || "", usage: usage ?? null, uid });
    if (syncTarget?.houseId) {
      const sharedRef = await addDoc(collection(db, S_BILLS), { houseId: syncTarget.houseId, ownerUid: syncTarget.ownerUid, cat: category, amount: Number(amount), month, note: note || "", usage: usage ?? null });
      // Store the shared doc id on the personal doc for future updates/deletes
      await updateDoc(personalRef, { sharedDocId: sharedRef.id });
    }
  }, [uid, syncTarget]);

  const updateHouse = useCallback(async (id, fields) => {
    await updateDoc(doc(db, HOUSE, id), { ...fields, amount: Number(fields.amount), usage: fields.usage ?? null });
    if (syncTarget?.houseId && fields.sharedDocId) {
      await updateDoc(doc(db, S_BILLS, fields.sharedDocId), { cat: fields.cat, amount: Number(fields.amount), note: fields.note ?? "", usage: fields.usage ?? null, month: fields.month });
    }
  }, [syncTarget]);

  const delHouse = useCallback(async (id, sharedDocId) => {
    await deleteDoc(doc(db, HOUSE, id));
    if (syncTarget?.houseId && sharedDocId) {
      await deleteDoc(doc(db, S_BILLS, sharedDocId));
    }
  }, [syncTarget]);

  const importManyHouse = useCallback(async (rows = []) => {
    const batch = writeBatch(db);
    const personalRefs = rows.map(() => doc(collection(db, HOUSE)));
    rows.forEach((r, i) => {
      batch.set(personalRefs[i], { cat: r.cat, amount: Number(r.amount), month: r.month, note: r.note || "", usage: r.usage ?? null, uid });
    });
    if (syncTarget?.houseId) {
      rows.forEach((r, i) => {
        const sharedRef = doc(collection(db, S_BILLS));
        batch.set(sharedRef, { houseId: syncTarget.houseId, ownerUid: syncTarget.ownerUid, cat: r.cat, amount: Number(r.amount), month: r.month, note: r.note || "", usage: r.usage ?? null });
        batch.update(personalRefs[i], { sharedDocId: sharedRef.id });
      });
    }
    await batch.commit();
  }, [uid, syncTarget]);

  const addGrocery = useCallback(async ({ subcat, desc, amount, month }) => {
    const personalRef = await addDoc(collection(db, GROCERY), { subcat, desc, amount: Number(amount), month, uid });
    if (syncTarget?.houseId) {
      const sharedRef = await addDoc(collection(db, S_GROCERY), { houseId: syncTarget.houseId, ownerUid: syncTarget.ownerUid, subcat, desc, amount: Number(amount), month });
      await updateDoc(personalRef, { sharedDocId: sharedRef.id });
    }
  }, [uid, syncTarget]);

  const delGrocery = useCallback(async (id, sharedDocId) => {
    await deleteDoc(doc(db, GROCERY, id));
    if (syncTarget?.houseId && sharedDocId) {
      await deleteDoc(doc(db, S_GROCERY, sharedDocId));
    }
  }, [syncTarget]);

  const importManyGrocery = useCallback(async (rows = []) => {
    const batch = writeBatch(db);
    const personalRefs = rows.map(() => doc(collection(db, GROCERY)));
    rows.forEach((r, i) => {
      batch.set(personalRefs[i], { subcat: r.subcat, desc: r.desc, amount: Number(r.amount), month: r.month, uid });
    });
    if (syncTarget?.houseId) {
      rows.forEach((r, i) => {
        const sharedRef = doc(collection(db, S_GROCERY));
        batch.set(sharedRef, { houseId: syncTarget.houseId, ownerUid: syncTarget.ownerUid, subcat: r.subcat, desc: r.desc, amount: Number(r.amount), month: r.month });
        batch.update(personalRefs[i], { sharedDocId: sharedRef.id });
      });
    }
    await batch.commit();
  }, [uid, syncTarget]);

  // ── Tuition ────────────────────────────────────────────────────────────────
  const addTuition = useCallback(async ({ subcat, desc, amount, month }) => {
    const ref = await addDoc(collection(db, TUITION), { subcat, desc, amount: Number(amount), month, uid });
    if (syncTarget?.houseId) {
      const sRef = await addDoc(collection(db, S_TUITION), { houseId: syncTarget.houseId, ownerUid: syncTarget.ownerUid, subcat, desc, amount: Number(amount), month });
      await updateDoc(ref, { sharedDocId: sRef.id });
    }
  }, [uid, syncTarget]);

  const delTuition = useCallback(async (id, sharedDocId) => {
    await deleteDoc(doc(db, TUITION, id));
    if (syncTarget?.houseId && sharedDocId) await deleteDoc(doc(db, S_TUITION, sharedDocId));
  }, [syncTarget]);

  // ── Other Expense ──────────────────────────────────────────────────────────
  const addOtherExpense = useCallback(async ({ subcat, desc, amount, month }) => {
    const ref = await addDoc(collection(db, OTHER_EXP), { subcat, desc, amount: Number(amount), month, uid });
    if (syncTarget?.houseId) {
      const sRef = await addDoc(collection(db, S_OTHER_EXP), { houseId: syncTarget.houseId, ownerUid: syncTarget.ownerUid, subcat, desc, amount: Number(amount), month });
      await updateDoc(ref, { sharedDocId: sRef.id });
    }
  }, [uid, syncTarget]);

  const delOtherExpense = useCallback(async (id, sharedDocId) => {
    await deleteDoc(doc(db, OTHER_EXP, id));
    if (syncTarget?.houseId && sharedDocId) await deleteDoc(doc(db, S_OTHER_EXP, sharedDocId));
  }, [syncTarget]);

  // Wallet CRUD
  const addWallet = useCallback(async ({ name, balance, color, icon }) => {
    await addDoc(collection(db, WALLETS), { name, balance: Number(balance), color, icon, uid });
  }, [uid]);

  const updateWallet = useCallback(async (id, fields) => {
    await updateDoc(doc(db, WALLETS, id), { ...fields, balance: Number(fields.balance) });
  }, []);

  const delWallet = useCallback((id) => deleteDoc(doc(db, WALLETS, id)), []);

  const delTx    = useCallback((id) => deleteDoc(doc(db, TX, id)),     []);
  const delOther = useCallback((id) => deleteDoc(doc(db, OTHERS, id)), []);

  const deleteMonth = useCallback(async (targetMonth) => {
    const [txSnap, othersSnap] = await Promise.all([
      getDocs(query(collection(db, TX),     where("uid", "==", uid), where("month", "==", targetMonth))),
      getDocs(query(collection(db, OTHERS), where("uid", "==", uid), where("month", "==", targetMonth))),
    ]);
    const docs = [...txSnap.docs, ...othersSnap.docs];
    for (let i = 0; i < docs.length; i += 450) {
      const batch = writeBatch(db);
      docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    return docs.length;
  }, [uid]);

  return { tx, others, house, grocery, tuition, otherExpense, wallets, loading, error, addTx, importMany, addOther, delTx, delOther, deleteMonth, addWallet, updateWallet, delWallet, addHouse, updateHouse, delHouse, importManyHouse, addGrocery, delGrocery, importManyGrocery, addTuition, delTuition, addOtherExpense, delOtherExpense };
}

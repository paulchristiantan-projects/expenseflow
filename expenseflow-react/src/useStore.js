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

export function useStore(uid) {
  const [tx, setTx] = useState([]);
  const [others, setOthers] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [house, setHouse] = useState([]);
  const [grocery, setGrocery] = useState([]);
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
    const houseQuery   = query(collection(db, HOUSE),   where("uid", "==", uid));
    const groceryQuery = query(collection(db, GROCERY), where("uid", "==", uid));

    const unsubTx = onSnapshot(txQuery, (s) => {
      setTx(s.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (e) => { setError(e.message); setLoading(false); });

    const unsubOthers  = onSnapshot(othersQuery,  (s) => setOthers(s.docs.map((d)  => ({ id: d.id, ...d.data() }))));
    const unsubWallets = onSnapshot(walletsQuery, (s) => setWallets(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubHouse   = onSnapshot(houseQuery,   (s) => setHouse(s.docs.map((d)   => ({ id: d.id, ...d.data() }))));
    const unsubGrocery = onSnapshot(groceryQuery, (s) => setGrocery(s.docs.map((d) => ({ id: d.id, ...d.data() }))));

    return () => { unsubTx(); unsubOthers(); unsubWallets(); unsubHouse(); unsubGrocery(); };
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
    await addDoc(collection(db, HOUSE), { cat: category, amount: Number(amount), month, note: note || "", usage: usage ?? null, uid });
  }, [uid]);

  const updateHouse = useCallback(async (id, fields) => {
    await updateDoc(doc(db, HOUSE, id), { ...fields, amount: Number(fields.amount), usage: fields.usage ?? null });
  }, []);

  const delHouse = useCallback((id) => deleteDoc(doc(db, HOUSE, id)), []);

  const importManyHouse = useCallback(async (rows = []) => {
    const batch = writeBatch(db);
    rows.forEach((r) => {
      batch.set(doc(collection(db, HOUSE)), { cat: r.cat, amount: Number(r.amount), month: r.month, note: r.note || "", uid });
    });
    await batch.commit();
  }, [uid]);

  const addGrocery = useCallback(async ({ subcat, desc, amount, month }) => {
    await addDoc(collection(db, GROCERY), { subcat, desc, amount: Number(amount), month, uid });
  }, [uid]);

  const delGrocery = useCallback((id) => deleteDoc(doc(db, GROCERY, id)), []);

  const importManyGrocery = useCallback(async (rows = []) => {
    const batch = writeBatch(db);
    rows.forEach((r) => {
      batch.set(doc(collection(db, GROCERY)), { subcat: r.subcat, desc: r.desc, amount: Number(r.amount), month: r.month, uid });
    });
    await batch.commit();
  }, [uid]);

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

  return { tx, others, house, grocery, wallets, loading, error, addTx, importMany, addOther, delTx, delOther, deleteMonth, addWallet, updateWallet, delWallet, addHouse, updateHouse, delHouse, importManyHouse, addGrocery, delGrocery, importManyGrocery };
}

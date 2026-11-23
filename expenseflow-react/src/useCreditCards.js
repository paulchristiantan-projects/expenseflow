import { useEffect, useState, useCallback } from "react";
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc,
  doc, query, where,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

const CARDS    = "creditCards";
const PAYMENTS = "creditCardPayments";
const REWARDS  = "creditCardRewards";

export function useCreditCards(uid) {
  const [cards,    setCards]    = useState([]);
  const [payments, setPayments] = useState([]);
  const [rewards,  setRewards]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !uid) { setLoading(false); return; }
    setLoading(true);

    const qCards    = query(collection(db, CARDS),    where("uid", "==", uid));
    const qPayments = query(collection(db, PAYMENTS), where("uid", "==", uid));
    const qRewards  = query(collection(db, REWARDS),  where("uid", "==", uid));

    let n = 0;
    const done  = () => { if (++n >= 3) setLoading(false); };
    const onErr = (label) => (e) => { setError(`${label}: ${e.message}`); setLoading(false); };

    const u1 = onSnapshot(qCards,    (s) => { setCards(s.docs.map((d)    => ({ id: d.id, ...d.data() }))); done(); }, onErr("cards"));
    const u2 = onSnapshot(qPayments, (s) => { setPayments(s.docs.map((d) => ({ id: d.id, ...d.data() }))); done(); }, onErr("payments"));
    const u3 = onSnapshot(qRewards,  (s) => { setRewards(s.docs.map((d)  => ({ id: d.id, ...d.data() }))); done(); }, onErr("rewards"));

    return () => { u1(); u2(); u3(); };
  }, [uid]);

  // ── Card CRUD ──────────────────────────────────────────────────────────────
  const addCard = useCallback(async (data) => {
    const ref = await addDoc(collection(db, CARDS), {
      uid,
      name:      (data.name || "").trim(),
      soaDate:   Number(data.soaDate) || 1,
      expiry:    data.expiry  || "",
      limit:     Number(data.limit)   || 0,
      color:     data.color   || "indigo",
      network:   data.network || "visa",
      note:      data.note    || "",
      createdAt: Date.now(),
    });
    return ref.id;
  }, [uid]);

  const updateCard = useCallback(async (id, data) => {
    await updateDoc(doc(db, CARDS, id), {
      name:    (data.name || "").trim(),
      soaDate: Number(data.soaDate) || 1,
      expiry:  data.expiry  || "",
      limit:   Number(data.limit)   || 0,
      color:   data.color   || "indigo",
      network: data.network || "visa",
      note:    data.note    || "",
    });
  }, []);

  const deleteCard = useCallback(async (id) => {
    await deleteDoc(doc(db, CARDS, id));
    // Orphaned payments/rewards are benign — the UI filters by cardId
  }, []);

  // ── Payment CRUD ───────────────────────────────────────────────────────────
  const addPayment = useCallback(async (cardId, data) => {
    await addDoc(collection(db, PAYMENTS), {
      uid, cardId,
      amount: Number(String(data.amount).replace(/[^0-9.]/g, "")) || 0,
      date:   data.date,
      note:   data.note || "",
    });
  }, [uid]);

  const updatePayment = useCallback(async (id, data) => {
    await updateDoc(doc(db, PAYMENTS, id), {
      amount: Number(String(data.amount).replace(/[^0-9.]/g, "")) || 0,
      date:   data.date,
      note:   data.note || "",
    });
  }, []);

  const deletePayment = useCallback((id) => deleteDoc(doc(db, PAYMENTS, id)), []);

  // ── Reward CRUD ────────────────────────────────────────────────────────────
  const addReward = useCallback(async (cardId, data) => {
    await addDoc(collection(db, REWARDS), {
      uid, cardId,
      value: Number(String(data.value).replace(/[^0-9.]/g, "")) || 0,
      desc:  data.desc || "",
      date:  data.date || "",
    });
  }, [uid]);

  const updateReward = useCallback(async (id, data) => {
    await updateDoc(doc(db, REWARDS, id), {
      value: Number(String(data.value).replace(/[^0-9.]/g, "")) || 0,
      desc:  data.desc || "",
      date:  data.date || "",
    });
  }, []);

  const deleteReward = useCallback((id) => deleteDoc(doc(db, REWARDS, id)), []);

  return {
    cards, payments, rewards, loading, error,
    addCard, updateCard, deleteCard,
    addPayment, updatePayment, deletePayment,
    addReward, updateReward, deleteReward,
  };
}

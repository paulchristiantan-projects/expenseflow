import { useEffect, useState, useCallback } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
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

export function useStore(uid) {
  const [tx, setTx] = useState([]);
  const [others, setOthers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(isFirebaseConfigured ? null : "config");

  useEffect(() => {
    if (!isFirebaseConfigured || !uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const txQuery = query(collection(db, TX), where("uid", "==", uid));
    const othersQuery = query(collection(db, OTHERS), where("uid", "==", uid));

    const unsubTx = onSnapshot(
      txQuery,
      (s) => {
        setTx(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      }
    );
    const unsubOthers = onSnapshot(othersQuery, (s) =>
      setOthers(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubTx();
      unsubOthers();
    };
  }, [uid]);

  const addTx = useCallback(
    async ({ date, amount, desc, category }) => {
      const month = date.slice(0, 7);
      await addDoc(collection(db, TX), {
        date,
        amount: Number(amount),
        desc,
        cat: category || cat(desc),
        month,
        uid,
      });
    },
    [uid]
  );

  const importMany = useCallback(
    async (txRows = [], otherRows = [], fallbackMonth) => {
      const batch = writeBatch(db);
      txRows.forEach((r) => {
        batch.set(doc(collection(db, TX)), {
          date: r.date,
          amount: Number(r.amount),
          desc: r.desc,
          cat: cat(r.desc),
          month: r.date.slice(0, 7),
          uid,
        });
      });
      otherRows.forEach((r) => {
        batch.set(doc(collection(db, OTHERS)), {
          desc: r.desc,
          amount: Number(r.amount),
          cat: cat(r.desc),
          month: r.month || fallbackMonth,
          uid,
        });
      });
      await batch.commit();
    },
    [uid]
  );

  const addOther = useCallback(
    async ({ desc, amount, month, category }) => {
      await addDoc(collection(db, OTHERS), {
        desc,
        amount: Number(amount),
        cat: category || cat(desc),
        month,
        uid,
      });
    },
    [uid]
  );

  const delTx = useCallback((id) => deleteDoc(doc(db, TX, id)), []);
  const delOther = useCallback((id) => deleteDoc(doc(db, OTHERS, id)), []);

  // Deletes every transaction and other-expense for the given month (YYYY-MM).
  const deleteMonth = useCallback(
    async (targetMonth) => {
      const [txSnap, othersSnap] = await Promise.all([
        getDocs(query(collection(db, TX), where("uid", "==", uid), where("month", "==", targetMonth))),
        getDocs(query(collection(db, OTHERS), where("uid", "==", uid), where("month", "==", targetMonth))),
      ]);
      const docs = [...txSnap.docs, ...othersSnap.docs];
      // Firestore batches cap at 500 ops, so chunk the deletes.
      for (let i = 0; i < docs.length; i += 450) {
        const batch = writeBatch(db);
        docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      return docs.length;
    },
    [uid]
  );

  return { tx, others, loading, error, addTx, importMany, addOther, delTx, delOther, deleteMonth };
}

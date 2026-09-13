import { useMemo, useState } from "react";
import { useStore } from "./useStore";
import { useAuth } from "./useAuth";
import { monthLabel } from "./helpers";
import Dashboard from "./components/Dashboard";
import Transactions from "./components/Transactions";
import BulkImport from "./components/BulkImport";
import Others from "./components/Others";
import YearSummary from "./components/YearSummary";
import AddModal from "./components/AddModal";
import Login from "./components/Login";

const NAV = [
  { key: "dashboard", label: "▦   Dashboard" },
  { key: "transactions", label: "☷   Transactions" },
  { key: "paste", label: "＋   Bulk Import" },
  { key: "others", label: "◈   Other Expenses" },
  { key: "year", label: "▤   Year Summary" },
];

export default function App() {
  const auth = useAuth();
  const { user, authLoading, logout } = auth;
  const store = useStore(user?.uid);
  const { tx, others, loading, error } = store;
  const [view, setView] = useState("dashboard");
  const [month, setMonth] = useState("2026-08");
  const [modalOpen, setModalOpen] = useState(false);

  // Derive the list of months present in the data.
  const months = useMemo(() => {
    const set = new Set([...tx, ...others].map((x) => x.month).filter(Boolean));
    set.add(month);
    return [...set].sort().reverse();
  }, [tx, others, month]);

  const monthTx = useMemo(() => tx.filter((x) => x.month === month), [tx, month]);
  const monthOthers = useMemo(
    () => others.filter((x) => x.month === month),
    [others, month]
  );

  if (error === "config") {
    return (
      <div className="loading">
        <div style={{ maxWidth: 520 }}>
          <div className="banner">
            Firebase isn’t configured yet. Copy <code>.env.example</code> to{" "}
            <code>.env.local</code>, add your Firebase project keys, then restart{" "}
            <code>npm run dev</code>.
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) return <div className="loading">Loading…</div>;

  if (!user) return <Login auth={auth} />;

  if (loading) return <div className="loading">Loading your expenses…</div>;

  async function handleAddOther() {
    const desc = prompt("Description");
    if (!desc) return;
    const amount = Number(prompt("Amount (PHP)"));
    if (!amount) return;
    await store.addOther({ desc, amount, month });
  }

  async function handleDeleteMonth() {
    const label = monthLabel(month);
    const count = monthTx.length + monthOthers.length;
    if (!count) {
      alert(`No entries to delete for ${label}.`);
      return;
    }
    if (
      !confirm(
        `Delete ALL ${count} entries for ${label} (${monthTx.length} transactions, ${monthOthers.length} other expenses)? This cannot be undone.`
      )
    )
      return;
    try {
      await store.deleteMonth(month);
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  }

  async function handleImport(txRows, otherRows) {
    // Determine the month to store others under and to jump to.
    const lastTx = txRows[txRows.length - 1];
    const targetMonth = lastTx
      ? lastTx.date.slice(0, 7)
      : otherRows.find((o) => o.month)?.month || month;
    await store.importMany(txRows, otherRows, targetMonth);
    setMonth(targetMonth);
  }

  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          Expense<span>Flow</span>
        </div>
        <div className="nav">
          {NAV.map((n) => (
            <button
              key={n.key}
              className={view === n.key ? "active" : ""}
              onClick={() => setView(n.key)}
            >
              {n.label}
            </button>
          ))}
        </div>
      </aside>

      <main className="main">
        <div className="top">
          <div className="title">
            <h1>Personal Finance</h1>
            <p>
              {monthLabel(month)} • {monthTx.length} transactions
            </p>
          </div>
          <div className="actions">
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              {months.map((k) => (
                <option key={k} value={k}>
                  {monthLabel(k)}
                </option>
              ))}
            </select>
            <button className="btn primary" onClick={() => setModalOpen(true)}>
              ＋ Add expense
            </button>
            <button className="btn secondary" onClick={handleDeleteMonth}>
              Delete month
            </button>
            <button className="btn secondary" onClick={logout} title={user.email || ""}>
              Sign out
            </button>
          </div>
        </div>

        {error && error !== "config" && (
          <div className="banner">Firestore error: {error}</div>
        )}

        {view === "dashboard" && (
          <Dashboard
            tx={monthTx}
            others={monthOthers}
            onView={setView}
            onDelete={store.delTx}
          />
        )}
        {view === "transactions" && (
          <Transactions tx={monthTx} onDelete={store.delTx} />
        )}
        {view === "paste" && <BulkImport onImport={handleImport} />}
        {view === "others" && (
          <Others others={monthOthers} onAdd={handleAddOther} onDelete={store.delOther} />
        )}
        {view === "year" && <YearSummary tx={tx} others={others} />}
      </main>

      <AddModal
        open={modalOpen}
        month={month}
        onClose={() => setModalOpen(false)}
        onSave={async (d) => {
          await store.addTx(d);
          setMonth(d.date.slice(0, 7));
        }}
      />
    </div>
  );
}

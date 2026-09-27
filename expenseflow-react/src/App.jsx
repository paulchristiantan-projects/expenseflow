import { useMemo, useState, useEffect } from "react";
import { useStore } from "./useStore";
import { useAuth } from "./useAuth";
import { monthLabel } from "./helpers";
import Home          from "./components/Home";
import Dashboard    from "./components/Dashboard";
import Transactions from "./components/Transactions";
import BulkImport   from "./components/BulkImport";
import YearSummary  from "./components/YearSummary";
import Budget       from "./components/Budget";
import AddModal     from "./components/AddModal";
import Login        from "./components/Login";
import Profile      from "./components/Profile";
import HouseExpenses, { HouseBulkImport, HouseMonthlySummary } from "./components/HouseExpenses";
import HouseDashboard from "./components/HouseDashboard";
import {
  IconHome, IconTransactions, IconYear,
  IconImport, IconProfile, IconLogout, IconLeaf, IconPlus, IconBudget, IconHouse,
} from "./components/Icons";

const NAV_BOTTOM = [
  { key: "dashboard",    label: "Home",    Icon: IconHome },
  { key: "budget",       label: "Budget",  Icon: IconBudget },
  { key: "transactions", label: "Txns",    Icon: IconTransactions },
  { key: "house",        label: "House",   Icon: IconHouse },
  { key: "profile",      label: "Profile", Icon: IconProfile },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function App() {
  const auth  = useAuth();
  const { user, authLoading, logout } = auth;
  const store = useStore(user?.uid);
  const { tx, others, house, grocery, wallets, loading, error } = store;

  const [view,      setView]      = useState("dashboard");
  const [month,     setMonth]     = useState("2026-08");
  const [modalOpen, setModalOpen] = useState(false);
  const [theme,     setTheme]     = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const months = useMemo(() => {
    const set = new Set([...tx, ...others, ...house].map((x) => x.month).filter(Boolean));
    set.add(month);
    return [...set].sort().reverse();
  }, [tx, others, house, month]);

  const monthTx     = useMemo(() => tx.filter((x)    => x.month === month), [tx,    month]);
  const monthOthers = useMemo(() => others.filter((x) => x.month === month), [others, month]);
  const monthHouse  = useMemo(() => house.filter((x)  => x.month === month), [house,  month]);
  const monthGrocery = useMemo(() => grocery.filter((x) => x.month === month), [grocery, month]);

  if (error === "config") return (
    <div className="loading">
      <div style={{ maxWidth: 520 }}>
        <div className="banner">
          Firebase isn't configured yet. Copy <code>.env.example</code> to{" "}
          <code>.env.local</code>, add your Firebase project keys, then restart <code>npm run dev</code>.
        </div>
      </div>
    </div>
  );

  if (authLoading) return <div className="loading">Loading…</div>;
  if (!user)       return <Login auth={auth} />;
  if (loading)     return <div className="loading">Loading your data…</div>;

  async function handleAddOther() {
    const desc = prompt("Description"); if (!desc) return;
    const amount = Number(prompt("Amount (PHP)")); if (!amount) return;
    await store.addOther({ desc, amount, month });
  }

  async function handleDeleteMonth() {
    const count = monthTx.length + monthOthers.length;
    if (!count) { alert(`No entries for ${monthLabel(month)}.`); return; }
    if (!confirm(`Delete ALL ${count} entries for ${monthLabel(month)}? This cannot be undone.`)) return;
    try { await store.deleteMonth(month); } catch (e) { alert("Delete failed: " + e.message); }
  }

  async function handleImport(txRows, otherRows) {
    const lastTx = txRows[txRows.length - 1];
    const targetMonth = lastTx ? lastTx.date.slice(0, 7) : otherRows.find((o) => o.month)?.month || month;
    await store.importMany(txRows, otherRows, targetMonth);
    setMonth(targetMonth);
  }

  const displayName = user.displayName || user.email?.split("@")[0] || "there";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const hideTopBar = view === "profile" || view === "budget" || view === "dashboard"
    || view === "house-import" || view === "house-summary" || view === "house-dashboard"
    || view === "personal-dashboard" || view === "personal-summary";

  // Personal views that activate "Personal" parent
  const personalViews = ["personal-dashboard", "personal-summary", "transactions", "paste"];

  return (
    <div className="app">
      {/* ── Sidebar ── */}
      <aside className="side">
        <div className="brand">
          <div className="brand-icon"><IconLeaf size={17} /></div>
          <div className="brand-name">Expense<span>Flow</span></div>
        </div>

        <div className="nav-section-label">Menu</div>
        <nav className="nav">
          <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>
            <span className="nav-icon"><IconHome /></span>
            <span>Home</span>
          </button>
          <button className={view === "budget" ? "active" : ""} onClick={() => setView("budget")}>
            <span className="nav-icon"><IconBudget /></span>
            <span>Budget</span>
          </button>

          {/* Personal */}
          <button className={personalViews.includes(view) ? "active" : ""} onClick={() => setView("personal-dashboard")}>
            <span className="nav-icon"><IconTransactions /></span>
            <span>Personal</span>
          </button>
          <button className={`nav-sub ${view === "personal-dashboard" ? "active" : ""}`} onClick={() => setView("personal-dashboard")}>
            <span className="nav-icon"><IconHome /></span>
            <span>Dashboard</span>
          </button>
          <button className={`nav-sub ${view === "personal-summary" ? "active" : ""}`} onClick={() => setView("personal-summary")}>
            <span className="nav-icon"><IconYear /></span>
            <span>Monthly Summary</span>
          </button>
          <button className={`nav-sub ${view === "transactions" ? "active" : ""}`} onClick={() => setView("transactions")}>
            <span className="nav-icon"><IconTransactions /></span>
            <span>Transactions</span>
          </button>
          <button className={`nav-sub ${view === "paste" ? "active" : ""}`} onClick={() => setView("paste")}>
            <span className="nav-icon"><IconImport /></span>
            <span>Bulk Import</span>
          </button>

          {/* House */}
          <button className={["house-dashboard","house-import","house-summary"].includes(view) ? "active" : ""} onClick={() => setView("house-dashboard")}>
            <span className="nav-icon"><IconHouse /></span>
            <span>House</span>
          </button>
          <button className={`nav-sub ${view === "house-dashboard" ? "active" : ""}`} onClick={() => setView("house-dashboard")}>
            <span className="nav-icon"><IconHome /></span>
            <span>Dashboard</span>
          </button>
          <button className={`nav-sub ${view === "house-summary" ? "active" : ""}`} onClick={() => setView("house-summary")}>
            <span className="nav-icon"><IconYear /></span>
            <span>Monthly Summary</span>
          </button>
          <button className={`nav-sub ${view === "house-import" ? "active" : ""}`} onClick={() => setView("house-import")}>
            <span className="nav-icon"><IconImport /></span>
            <span>Bulk Import</span>
          </button>

          <hr className="nav-divider" />
          <div className="nav-section-label">Account</div>

          <button className={view === "profile" ? "active" : ""} onClick={() => setView("profile")}>
            <span className="nav-icon"><IconProfile /></span>
            <span>Profile</span>
          </button>
          <button className="nav-danger" onClick={logout} title={user.email || ""}>
            <span className="nav-icon"><IconLogout /></span>
            <span>Sign out</span>
          </button>
        </nav>
      </aside>

      {/* ── Bottom nav (mobile) ── */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {NAV_BOTTOM.map(({ key, label, Icon }) => (
            <button key={key} className={view === key ? "active" : ""} onClick={() => setView(key)}>
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="main">
        {!hideTopBar && (
          <div className="top">
            <div className="greeting">
              <div className="greeting-sub">{today}</div>
              <h1>{getGreeting()}, {displayName}!</h1>
            </div>
            <div className="top-actions">
              <select className="month-pill" value={month} onChange={(e) => setMonth(e.target.value)}>
                {months.map((k) => <option key={k} value={k}>{monthLabel(k)}</option>)}
              </select>
              <button className="btn primary" onClick={() => setModalOpen(true)}>
                <IconPlus /> Add expense
              </button>
              <button className="btn secondary" onClick={handleDeleteMonth}>
                Delete month
              </button>
            </div>
          </div>
        )}

        {error && error !== "config" && <div className="banner">Firestore error: {error}</div>}

        {view === "dashboard"    && <Home tx={monthTx} others={monthOthers} house={monthHouse} grocery={monthGrocery} allTx={tx} allOthers={others} allHouse={house} allGrocery={grocery} month={month} wallets={wallets} onView={setView} displayName={displayName} greeting={getGreeting()} today={today} onMonthChange={setMonth} months={months} />}
        {view === "budget"       && <Budget wallets={wallets} onAdd={store.addWallet} onUpdate={store.updateWallet} onDelete={store.delWallet} />}
        {view === "transactions" && <Transactions tx={monthTx} onDelete={store.delTx} others={monthOthers} onAddOther={handleAddOther} onDeleteOther={store.delOther} />}
        {view === "paste"        && <BulkImport onImport={handleImport} />}
        {view === "year"         && <YearSummary tx={tx} others={others} />}
        {view === "profile"      && <Profile user={user} theme={theme} onThemeChange={setTheme} />}

        {/* ── Personal views ── */}
        {view === "personal-dashboard" && (
          <div>
            <div className="top" style={{ marginBottom: 0 }}>
              <div className="greeting">
                <div className="greeting-sub">{today}</div>
                <h1>Personal — Dashboard</h1>
              </div>
              <div className="top-actions">
                <select className="month-pill" value={month} onChange={(e) => setMonth(e.target.value)}>
                  {months.map((k) => <option key={k} value={k}>{monthLabel(k)}</option>)}
                </select>
                <button className="btn primary" onClick={() => setModalOpen(true)}>
                  <IconPlus /> Add expense
                </button>
                <button className="btn secondary" onClick={handleDeleteMonth}>Delete month</button>
              </div>
            </div>
            <Dashboard tx={monthTx} others={monthOthers} onView={setView} onDelete={store.delTx} />
          </div>
        )}
        {view === "personal-summary" && (
          <div>
            <div className="top" style={{ marginBottom: 0 }}>
              <div className="greeting">
                <div className="greeting-sub">{today}</div>
                <h1>Personal — Monthly Summary</h1>
              </div>
            </div>
            <YearSummary tx={tx} others={others} />
          </div>
        )}

        {/* ── House views ── */}
        {view === "house-dashboard" && (
          <div>
            <div className="top" style={{ marginBottom: 0 }}>
              <div className="greeting">
                <div className="greeting-sub">{today}</div>
                <h1>House — Dashboard</h1>
              </div>
              <div className="top-actions">
                <select className="month-pill" value={month} onChange={(e) => setMonth(e.target.value)}>
                  {months.map((k) => <option key={k} value={k}>{monthLabel(k)}</option>)}
                </select>
              </div>
            </div>
            <HouseDashboard
              house={monthHouse}
              grocery={monthGrocery}
              month={month}
              onView={setView}
              onAdd={(d) => store.addHouse(d)}
              onUpdate={(id, fields) => store.updateHouse(id, fields)}
              onDelete={store.delHouse}
              onAddGrocery={store.addGrocery}
              onDelGrocery={store.delGrocery}
            />
          </div>
        )}
        {view === "house-import"  && (
          <div>
            <div className="top" style={{ marginBottom: 0 }}>
              <div className="greeting">
                <div className="greeting-sub">{today}</div>
                <h1>House — Bulk Import</h1>
              </div>
            </div>
            <div className="card" style={{ marginTop: 0 }}>
              <HouseBulkImport
                onImport={store.importManyHouse}
                onImportGrocery={store.importManyGrocery}
              />
            </div>
          </div>
        )}

        {view === "house-summary"  && (
          <div>
            <div className="top" style={{ marginBottom: 0 }}>
              <div className="greeting">
                <div className="greeting-sub">{today}</div>
                <h1>House — Monthly Summary</h1>
              </div>
            </div>
            <HouseMonthlySummary allHouse={house} allGrocery={grocery} />
          </div>
        )}
      </main>

      <AddModal
        open={modalOpen}
        month={month}
        onClose={() => setModalOpen(false)}
        onSave={async (d) => { await store.addTx(d); setMonth(d.date.slice(0, 7)); }}
      />
    </div>
  );
}

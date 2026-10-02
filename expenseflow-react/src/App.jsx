import { useMemo, useState, useEffect } from "react";
import { useStore } from "./useStore";
import { useAuth } from "./useAuth";
import { useSharedHouse, registerUserLookup } from "./useSharedHouse";
import { useTravel, resolveTravelInvites } from "./useTravel";
import { monthLabel, mergedCategories } from "./helpers";
import Home          from "./components/Home";
import Dashboard    from "./components/Dashboard";
import Transactions from "./components/Transactions";
import BulkImport   from "./components/BulkImport";
import YearSummary  from "./components/YearSummary";
import Budget       from "./components/Budget";
import Loans        from "./components/Loans";
import Debts        from "./components/Debts";
import AddModal     from "./components/AddModal";
import OtherModal   from "./components/OtherModal";
import ConfirmDialog from "./components/ConfirmDialog";
import { useToast } from "./components/Toast";
import Login        from "./components/Login";
import Profile      from "./components/Profile";
import HouseExpenses, { HouseBulkImport, HouseMonthlySummary } from "./components/HouseExpenses";
import HouseDashboard from "./components/HouseDashboard";import SharedHouse  from "./components/SharedHouse";
import Travel        from "./components/Travel";
import { applyAccent, DEFAULT_ACCENT } from "./accents";
import MonthPicker from "./components/MonthPicker";
import {
  IconHome, IconTransactions, IconYear,
  IconImport, IconProfile, IconLogout, IconLeaf, IconPlus, IconBudget, IconHouse, IconTravel, IconLoan, IconDebt,
} from "./components/Icons";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function App() {
  const auth  = useAuth();
  const toast = useToast();
  const { user, authLoading, logout } = auth;
  const sharedHouseStore = useSharedHouse(user?.uid, user?.email);
  const travelStore      = useTravel(user?.uid, user?.email);

  // Register user lookup so invites-by-email resolve on next login
  useEffect(() => {
    if (user?.uid && user?.email) {
      registerUserLookup(user.uid, user.email);
      resolveTravelInvites(user.uid, user.email);
    }
  }, [user?.uid, user?.email]);

  // Sync personal house writes to the selected shared house (owner only)
  const syncTarget = useMemo(() => {
    const h = sharedHouseStore.selectedHouse;
    if (h && h.ownerUid === user?.uid) return { houseId: h.id, ownerUid: h.ownerUid };
    return null;
  }, [sharedHouseStore.selectedHouse, user?.uid]);

  const store = useStore(user?.uid, syncTarget);
  const { tx, others, house, grocery, tuition, otherExpense, wallets, customCats, loading, error } = store;
  const categoryList = useMemo(() => mergedCategories(customCats), [customCats]);

  const VALID_VIEWS = ["dashboard", "budget", "loans", "debts", "personal", "shared-house", "travel", "profile", "year"];
  const [view,      setView]      = useState(() => {
    const saved = localStorage.getItem("view");
    return VALID_VIEWS.includes(saved) ? saved : "dashboard";
  });
  const [month,     setMonth]     = useState("2026-08");
  const [modalOpen, setModalOpen] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);
  const [confirmMonth, setConfirmMonth] = useState(false);
  const [theme,     setTheme]     = useState(() => localStorage.getItem("theme") || "light");
  const [accent,    setAccent]    = useState(() => localStorage.getItem("accent") || DEFAULT_ACCENT);
  const [mobileNav, setMobileNav] = useState(false);
  const [personalTab, setPersonalTab] = useState(() => localStorage.getItem("personalTab") || "dashboard");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    applyAccent(accent, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("accent", accent);
    applyAccent(accent, theme);
  }, [accent, theme]);

  // Persist current view + personal tab so a refresh keeps the user in place
  useEffect(() => { localStorage.setItem("view", view); }, [view]);
  useEffect(() => { localStorage.setItem("personalTab", personalTab); }, [personalTab]);

  // Global keyboard shortcut: press "n" to add an expense (ignored while typing)
  useEffect(() => {
    function onKey(e) {
      const el = e.target;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setModalOpen(true); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const months = useMemo(() => {
    const set = new Set([...tx, ...others, ...house, ...tuition, ...otherExpense].map((x) => x.month).filter(Boolean));
    set.add(month);
    return [...set].sort().reverse();
  }, [tx, others, house, month]);

  const monthTx      = useMemo(() => tx.filter((x)      => x.month === month), [tx,      month]);
  const monthOthers  = useMemo(() => others.filter((x)  => x.month === month), [others,  month]);
  const monthHouse   = useMemo(() => house.filter((x)   => x.month === month), [house,   month]);
  const monthGrocery = useMemo(() => grocery.filter((x) => x.month === month), [grocery, month]);
  const monthTuition = useMemo(() => tuition.filter((x) => x.month === month), [tuition, month]);
  const monthOtherExp= useMemo(() => otherExpense.filter((x) => x.month === month), [otherExpense, month]);

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

  async function handleAddOther(data) {
    await store.addOther({ ...data, month });
    toast.success("Other expense added.");
  }

  function requestDeleteMonth() {
    const count = monthTx.length + monthOthers.length;
    if (!count) { toast.info(`No entries for ${monthLabel(month)}.`); return; }
    setConfirmMonth(true);
  }

  async function confirmDeleteMonth() {
    setConfirmMonth(false);
    try {
      const n = await store.deleteMonth(month);
      toast.success(`Deleted ${n} entr${n === 1 ? "y" : "ies"} for ${monthLabel(month)}.`);
    } catch (e) {
      toast.error("Delete failed: " + e.message);
    }
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
    || view === "personal" || view === "shared-house" || view === "travel" || view === "loans" || view === "debts";

  const personalViews = ["personal"];

  function navTo(key) { setView(key); setMobileNav(false); }

  const SideNav = () => (
    <>
      <div className="brand">
        <div className="brand-icon"><IconLeaf size={17} /></div>
        <div className="brand-name">Expense<span>Flow</span></div>
      </div>
      <div className="nav-section-label">Menu</div>
      <nav className="nav">
        <button className={view === "dashboard" ? "active" : ""} onClick={() => navTo("dashboard")}>
          <span className="nav-icon"><IconHome /></span><span>Home</span>
        </button>
        <button className={view === "budget" ? "active" : ""} onClick={() => navTo("budget")}>
          <span className="nav-icon"><IconBudget /></span><span>Budget</span>
        </button>
        <button className={view === "loans" ? "active" : ""} onClick={() => navTo("loans")}>
          <span className="nav-icon"><IconLoan /></span>
          <span>Loans</span>
          {store.loans?.length > 0 && (
            <span style={{ marginLeft: "auto", background: "var(--accent)", color: "#fff", borderRadius: 10, fontSize: 10, padding: "1px 6px", fontWeight: 700 }}>
              {store.loans.length}
            </span>
          )}
        </button>
        <button className={view === "debts" ? "active" : ""} onClick={() => navTo("debts")}>
          <span className="nav-icon"><IconDebt /></span>
          <span>Owed to Me</span>
          {store.debts?.length > 0 && (
            <span style={{ marginLeft: "auto", background: "var(--accent)", color: "#fff", borderRadius: 10, fontSize: 10, padding: "1px 6px", fontWeight: 700 }}>
              {store.debts.length}
            </span>
          )}
        </button>
        <button className={view === "personal" ? "active" : ""} onClick={() => navTo("personal")}>
          <span className="nav-icon"><IconTransactions /></span><span>Personal</span>
        </button>
        <button className={view === "shared-house" ? "active" : ""} onClick={() => navTo("shared-house")}>
          <span className="nav-icon"><IconHouse /></span>
          <span>Shared House</span>
          {sharedHouseStore.sharedHouses.length > 0 && (
            <span style={{ marginLeft: "auto", background: "var(--accent)", color: "#fff", borderRadius: 10, fontSize: 10, padding: "1px 6px", fontWeight: 700 }}>
              {sharedHouseStore.sharedHouses.length}
            </span>
          )}
        </button>
        <button className={view === "travel" ? "active" : ""} onClick={() => navTo("travel")}>
          <span className="nav-icon"><IconTravel /></span>
          <span>Travel</span>
          {travelStore.trips.length > 0 && (
            <span style={{ marginLeft: "auto", background: "var(--accent)", color: "#fff", borderRadius: 10, fontSize: 10, padding: "1px 6px", fontWeight: 700 }}>
              {travelStore.trips.length}
            </span>
          )}
        </button>
        <hr className="nav-divider" />
        <div className="nav-section-label">Account</div>
        <button className={view === "profile" ? "active" : ""} onClick={() => navTo("profile")}>
          <span className="nav-icon"><IconProfile /></span><span>Profile</span>
        </button>
        <button className="nav-danger" onClick={logout} title={user.email || ""}>
          <span className="nav-icon"><IconLogout /></span><span>Sign out</span>
        </button>
      </nav>
    </>
  );

  return (
    <div className="app">
      {/* ── Desktop sidebar ── */}
      <aside className="side">
        <SideNav />
      </aside>

      {/* ── Mobile: hamburger bar + drawer ── */}
      <div className="mobile-topbar">
        <button className="hamburger" onClick={() => setMobileNav(true)} aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="19" y2="6"/><line x1="3" y1="11" x2="19" y2="11"/><line x1="3" y1="16" x2="19" y2="16"/>
          </svg>
        </button>
        <div className="brand" style={{ padding: 0 }}>
          <div className="brand-icon"><IconLeaf size={15} /></div>
          <div className="brand-name" style={{ fontSize: 15 }}>Expense<span>Flow</span></div>
        </div>
        <div style={{ width: 36 }} />{/* spacer to keep brand centered */}
      </div>

      {/* ── Mobile drawer overlay ── */}
      {mobileNav && (
        <div className="mobile-overlay" onClick={() => setMobileNav(false)} />
      )}
      <aside className={`mobile-drawer ${mobileNav ? "open" : ""}`}>
        <button className="drawer-close" onClick={() => setMobileNav(false)} aria-label="Close menu">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/>
          </svg>
        </button>
        <SideNav />
      </aside>

      {/* ── Main ── */}
      <main className="main">
        {!hideTopBar && (
          <div className="top">
            <div className="greeting">
              <div className="greeting-sub">{today}</div>
              <h1>{getGreeting()}, {displayName}!</h1>
            </div>
            <div className="top-actions">
              <MonthPicker value={month} onChange={setMonth} months={months} />
              <button className="btn primary" onClick={() => setModalOpen(true)}>
                <IconPlus /> Add expense
              </button>
            </div>
          </div>
        )}

        {error && error !== "config" && <div className="banner">Firestore error: {error}</div>}

        {view === "dashboard"    && <Home tx={monthTx} others={monthOthers} house={monthHouse} grocery={monthGrocery} tuition={monthTuition} otherExpense={monthOtherExp} allTx={tx} allOthers={others} allHouse={house} allGrocery={grocery} allTuition={tuition} allOtherExpense={otherExpense} month={month} wallets={wallets} onView={(v) => { if (["personal-dashboard","personal-summary","transactions","paste"].includes(v)) { const tabMap = {"personal-dashboard":"dashboard","personal-summary":"summary","transactions":"transactions","paste":"import"}; setPersonalTab(tabMap[v]||"dashboard"); setView("personal"); } else setView(v); }} displayName={displayName} greeting={getGreeting()} today={today} onMonthChange={setMonth} months={months} />}
        {view === "budget"       && <Budget wallets={wallets} onAdd={store.addWallet} onUpdate={store.updateWallet} onDelete={store.delWallet} />}
        {view === "loans"        && <Loans loans={store.loans} onAdd={store.addLoan} onUpdate={store.updateLoan} onDelete={store.delLoan} />}
        {view === "debts"        && <Debts debts={store.debts} onAdd={store.addDebt} onUpdate={store.updateDebt} onDelete={store.delDebt} />}
        {view === "year"         && <YearSummary tx={tx} others={others} />}
        {view === "profile"      && <Profile user={user} theme={theme} onThemeChange={setTheme} accent={accent} onAccentChange={setAccent} />}

        {/* ── Personal (tabbed) ── */}
        {view === "personal" && (
          <div>
            <div className="top" style={{ marginBottom: 0 }}>
              <div className="greeting">
                <div className="greeting-sub">{today}</div>
                <h1>Personal</h1>
              </div>
              <div className="top-actions">
                <MonthPicker value={month} onChange={setMonth} months={months} />
                {personalTab !== "import" && (
                  <button className="btn primary" onClick={() => setModalOpen(true)}>
                    <IconPlus /> Add expense
                  </button>
                )}
              </div>
            </div>

            <div className="tab-bar">
              {[
                { key: "dashboard",    label: "Dashboard",       icon: <IconHome size={14}/> },
                { key: "summary",      label: "Monthly Summary", icon: <IconYear size={14}/> },
                { key: "transactions", label: "Transactions",    icon: <IconTransactions size={14}/> },
                { key: "import",       label: "Bulk Import",     icon: <IconImport size={14}/> },
              ].map(({ key, label, icon }) => (
                <button key={key} className={`tab-btn${personalTab === key ? " active" : ""}`} onClick={() => setPersonalTab(key)}>
                  {icon}<span>{label}</span>
                </button>
              ))}
            </div>

            {personalTab === "dashboard"    && <Dashboard tx={monthTx} others={monthOthers} onView={(v) => { if (v === "transactions") setPersonalTab("transactions"); }} onDelete={store.delTx} />}
            {personalTab === "summary"      && <YearSummary tx={tx} others={others} />}
            {personalTab === "transactions" && <Transactions tx={monthTx} onDelete={store.delTx} others={monthOthers} onAddOther={() => setOtherOpen(true)} onDeleteOther={store.delOther} month={month} categories={categoryList} />}
            {personalTab === "import"       && <BulkImport onImport={handleImport} />}
          </div>
        )}

        {/* ── Shared House ── */}
        {view === "shared-house" && (
          <SharedHouse
            sharedHouseStore={sharedHouseStore}
            month={month}
            onMonthChange={setMonth}
            months={months}
            userEmail={user.email}
            today={today}
            personalHouse={house}
            personalGrocery={grocery}
          />
        )}

        {/* ── Travel ── */}
        {view === "travel" && (
          <div>
            <div className="top" style={{ marginBottom: 0 }}>
              <div className="greeting">
                <div className="greeting-sub">{today}</div>
                <h1>Travel</h1>
              </div>
            </div>
            <Travel travelStore={travelStore} userEmail={user.email} />
          </div>
        )}
      </main>

      <AddModal
        open={modalOpen}
        month={month}
        categories={categoryList}
        onAddCategory={store.addCategory}
        onClose={() => setModalOpen(false)}
        onSave={async (d) => { await store.addTx(d); setMonth(d.date.slice(0, 7)); toast.success("Expense added."); }}
      />

      <OtherModal
        open={otherOpen}
        categories={categoryList}
        onAddCategory={store.addCategory}
        onClose={() => setOtherOpen(false)}
        onSave={handleAddOther}
      />

      <ConfirmDialog
        open={confirmMonth}
        danger
        title={`Delete all entries for ${monthLabel(month)}?`}
        message={`This will permanently remove ${monthTx.length + monthOthers.length} entr${(monthTx.length + monthOthers.length) === 1 ? "y" : "ies"}. This cannot be undone.`}
        confirmLabel="Delete all"
        onConfirm={confirmDeleteMonth}
        onCancel={() => setConfirmMonth(false)}
      />
    </div>
  );
}

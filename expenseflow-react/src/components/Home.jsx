import { useMemo } from "react";
import { money, monthLabel } from "../helpers";
import { IconChevronRight } from "./Icons";
import { HOUSE_CATEGORIES, effectiveHouseBycat } from "./HouseExpenses";

function trend(current, prev) {
  if (!prev || prev === 0) return null;
  const pct = Math.round(((current - prev) / prev) * 100);
  return { pct, up: pct > 0 };
}

function TrendPill({ current, prev }) {
  const t = trend(current, prev);
  if (!t) return null;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
      color: t.up ? "var(--danger)" : "var(--good)",
      background: t.up ? "#fdeaea" : "#e6f7ef",
    }}>
      {t.up ? "↑" : "↓"} {Math.abs(t.pct)}% vs last month
    </span>
  );
}

function SpendCard({ label, amount, prev, sub, onClick }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>
        {money(amount)}
      </div>
      <TrendPill current={amount} prev={prev} />
      {sub && <div style={{ fontSize: 12, color: "var(--muted)" }}>{sub}</div>}
      <button className="btn secondary" style={{ fontSize: 12, padding: "6px 11px", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, alignSelf: "flex-start" }}
        onClick={onClick}>
        View details <IconChevronRight size={13} />
      </button>
    </div>
  );
}

function HighlightRow({ icon, label, name, amount }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: "var(--accent-bg)", color: "var(--accent)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{label}</div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
      </div>
      <div style={{ fontWeight: 800, color: "var(--accent)", fontSize: 15 }}>{money(amount)}</div>
    </div>
  );
}

function NavTile({ emoji, title, sub, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
      background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)",
      cursor: "pointer", textAlign: "left", width: "100%", transition: "all .15s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-bg)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.background = "var(--card)"; }}
    >
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{title}</div>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>{sub}</div>
      </div>
      <IconChevronRight size={14} />
    </button>
  );
}

export default function Home({
  tx, others, house, grocery,
  allTx, allOthers, allHouse, allGrocery,
  month, wallets, onView, displayName, greeting, today, onMonthChange, months,
}) {
  const personalTotal = useMemo(() =>
    tx.reduce((s, x) => s + x.amount, 0) + others.reduce((s, x) => s + x.amount, 0),
  [tx, others]);

  const houseBycat = useMemo(() => effectiveHouseBycat(house, grocery), [house, grocery]);
  const houseTotal = useMemo(() => Object.values(houseBycat).reduce((s, v) => s + v, 0), [houseBycat]);

  const lastMonth = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, [month]);

  const lastPersonal = useMemo(() => {
    const l = (allTx || []).filter((x) => x.month === lastMonth);
    const lo = (allOthers || []).filter((x) => x.month === lastMonth);
    return l.reduce((s, x) => s + x.amount, 0) + lo.reduce((s, x) => s + x.amount, 0);
  }, [allTx, allOthers, lastMonth]);

  const lastHouse = useMemo(() => {
    const lh = (allHouse || []).filter((x) => x.month === lastMonth);
    const lg = (allGrocery || []).filter((x) => x.month === lastMonth);
    return Object.values(effectiveHouseBycat(lh, lg)).reduce((s, v) => s + v, 0);
  }, [allHouse, allGrocery, lastMonth]);

  const topPersonalCat = useMemo(() => {
    const by = {};
    tx.forEach((x) => { by[x.cat] = (by[x.cat] || 0) + x.amount; });
    const top = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
    return top ? { name: top[0], amount: top[1] } : null;
  }, [tx]);

  const topHouseBill = useMemo(() =>
    HOUSE_CATEGORIES.map(({ key }) => ({ key, amt: houseBycat[key] }))
      .filter((x) => x.amt > 0).sort((a, b) => b.amt - a.amt)[0] || null,
  [houseBycat]);

  const walletTotal = wallets.reduce((s, w) => s + w.balance, 0);
  const hasHighlights = topPersonalCat || topHouseBill;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Header with greeting + month picker ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{today}</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{greeting}, {displayName}!</h1>
        </div>
        <select className="month-pill" value={month} onChange={(e) => onMonthChange(e.target.value)}>
          {months.map((k) => <option key={k} value={k}>{monthLabel(k)}</option>)}
        </select>
      </div>

      {/* ── Spending cards ── */}
      <div className="two">
        <SpendCard
          label="Personal expenses"
          amount={personalTotal}
          prev={lastPersonal}
          sub={`${tx.length} transaction${tx.length !== 1 ? "s" : ""} · ${monthLabel(month, { month: "long" })}`}
          onClick={() => onView("personal-dashboard")}
        />
        <SpendCard
          label="House expenses"
          amount={houseTotal}
          prev={lastHouse}
          sub={`${house.length} bill${house.length !== 1 ? "s" : ""} · ${grocery.length} grocery item${grocery.length !== 1 ? "s" : ""}`}
          onClick={() => onView("house-dashboard")}
        />
      </div>

      {/* ── Highlights + Wallet row ── */}
      <div className="two">

        {/* Top spends */}
        {hasHighlights && (
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>This month's highlights</div>
            <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 12 }}>{monthLabel(month, { month: "long", year: "numeric" })}</div>
            {topPersonalCat && (
              <HighlightRow
                icon={<svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="6" r="3"/><path d="M3 16c0-3 2.7-5 6-5s6 2 6 5"/></svg>}
                label="Top personal category"
                name={topPersonalCat.name}
                amount={topPersonalCat.amount}
              />
            )}
            {topHouseBill && (
              <HighlightRow
                icon={<svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M1 7l7-5 7 5v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z"/><path d="M6 14V9h6v5"/></svg>}
                label="Top house bill"
                name={topHouseBill.key}
                amount={topHouseBill.amt}
              />
            )}
          </div>
        )}

        {/* Wallet balance */}
        {wallets.length > 0 && (
          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
                Total balance
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: "var(--accent)" }}>{money(walletTotal)}</div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                {wallets.slice(0, 3).map((w) => (
                  <div key={w.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--muted)" }}>{w.name}</span>
                    <span style={{ fontWeight: 600 }}>{money(w.balance)}</span>
                  </div>
                ))}
                {wallets.length > 3 && (
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>+{wallets.length - 3} more</div>
                )}
              </div>
            </div>
            <button className="btn secondary" style={{ fontSize: 12, padding: "6px 11px", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 14, alignSelf: "flex-start" }}
              onClick={() => onView("budget")}>
              Manage accounts <IconChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── Quick nav ── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
          Quick access
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
          <NavTile emoji="📊" title="Personal Dashboard" sub="Charts & categories" onClick={() => onView("personal-dashboard")} />
          <NavTile emoji="📅" title="Personal Summary" sub="Month-by-month" onClick={() => onView("personal-summary")} />
          <NavTile emoji="🏠" title="House Dashboard" sub="Bills & groceries" onClick={() => onView("house-dashboard")} />
          <NavTile emoji="📋" title="House Summary" sub="Year overview" onClick={() => onView("house-summary")} />
          <NavTile emoji="💳" title="Budget" sub="Accounts & balances" onClick={() => onView("budget")} />
          <NavTile emoji="📥" title="Bulk Import" sub="Personal transactions" onClick={() => onView("paste")} />
        </div>
      </div>

    </div>
  );
}

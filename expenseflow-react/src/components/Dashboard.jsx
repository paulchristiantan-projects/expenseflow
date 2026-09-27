import { money, byDateDesc } from "../helpers";
import TxTable from "./TxTable";
import { IconChevronRight } from "./Icons";

function KpiIcon({ children, color = "var(--accent-bg)", iconColor = "var(--accent)" }) {
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 10,
      background: color, color: iconColor,
      display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: 12, flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

function DonutChart({ segments }) {
  // segments: [{ value, color }]
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (!total) return <div className="empty" style={{ padding: 16 }}>No data</div>;

  let offset = 0;
  const r = 40;
  const circ = 2 * Math.PI * r;
  const arcs = segments.map((seg) => {
    const pct = seg.value / total;
    const dash = pct * circ;
    const arc = { ...seg, dash, offset };
    offset += dash;
    return arc;
  });

  return (
    <svg viewBox="0 0 100 100" style={{ width: 100, height: 100, transform: "rotate(-90deg)" }}>
      {arcs.map((a, i) => (
        <circle
          key={i}
          cx="50" cy="50" r={r}
          fill="none"
          stroke={a.color}
          strokeWidth="14"
          strokeDasharray={`${a.dash} ${circ - a.dash}`}
          strokeDashoffset={-a.offset}
        />
      ))}
    </svg>
  );
}

const CAT_COLORS = [
  "#4a5adf", "#7c8cff", "#a0acff", "#c7ccf8",
  "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd",
  "#6366f1", "#818cf8", "#e67e22", "#c0392b",
];

export default function Dashboard({ tx, others, onView, onDelete }) {
  const daily = tx.reduce((a, x) => a + x.amount, 0);
  const oth = others.reduce((a, x) => a + x.amount, 0);
  const total = daily + oth;

  const by = {};
  tx.forEach((x) => (by[x.cat] = (by[x.cat] || 0) + x.amount));
  const cats = Object.entries(by).sort((a, b) => b[1] - a[1]);

  const days = {};
  tx.forEach((x) => (days[x.date] = (days[x.date] || 0) + x.amount));
  const ds = Object.entries(days).sort();
  const max = Math.max(...ds.map((x) => x[1]), 1);

  const recent = byDateDesc(tx).slice(0, 8);

  const donutSegments = cats.slice(0, 6).map((c, i) => ({
    value: c[1],
    color: CAT_COLORS[i % CAT_COLORS.length],
    label: c[0],
  }));

  const avgPerDay = ds.length ? daily / ds.length : 0;
  const topCat = cats[0];

  return (
    <>
      {/* KPI cards */}
      <div className="grid">
        <div className="card kpi kpi-accent">
          <KpiIcon>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="14" height="10" rx="2"/>
              <path d="M5 5V4a2 2 0 0 1 4 0v1M11 10h2"/>
            </svg>
          </KpiIcon>
          <div className="label">Total expenses</div>
          <div className="value">{money(total)}</div>
          <small>Daily + other expenses</small>
        </div>
        <div className="card kpi">
          <KpiIcon>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="9" r="7"/>
              <path d="M9 6v3l2 2"/>
            </svg>
          </KpiIcon>
          <div className="label">Daily spending</div>
          <div className="value">{money(daily)}</div>
          <small>{tx.length} transactions</small>
        </div>
        <div className="card kpi">
          <KpiIcon>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
              <path d="M6 7h6M6 10h4"/>
            </svg>
          </KpiIcon>
          <div className="label">Other expenses</div>
          <div className="value">{money(oth)}</div>
          <small>Recurring / separate</small>
        </div>
        <div className="card kpi">
          <KpiIcon>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 13l4-4 3 3 5-6"/>
            </svg>
          </KpiIcon>
          <div className="label">Avg. per day</div>
          <div className="value">{money(avgPerDay)}</div>
          <small>{ds.length} active days</small>
        </div>
      </div>

      {/* Charts row */}
      <div className="two">
        {/* Daily spending bar chart */}
        <div className="card">
          <div className="section-header">
            <h2>Daily spending</h2>
            <span className="badge">{ds.length} days</span>
          </div>
          {ds.length ? (
            <div className="bars">
              {ds.map(([d, v]) => (
                <div className="barwrap" key={d}>
                  <div className="barvalue">{money(v)}</div>
                  <div className="bar" style={{ height: Math.max(4, (v / max) * 150) }} />
                  <div className="barlabel">{d.slice(5)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No daily transactions yet.</div>
          )}
        </div>

        {/* Category breakdown */}
        <div className="card">
          <div className="section-header">
            <h2>Expense distribution</h2>
          </div>
          {cats.length ? (
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
              <DonutChart segments={donutSegments} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                {donutSegments.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0, display: "inline-block" }} />
                    <span style={{ flex: 1, color: "var(--muted)" }}>{s.label}</span>
                    <span style={{ fontWeight: 700 }}>
                      {Math.round((s.value / (daily || 1)) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="cat">
            {cats.map(([c, v]) => (
              <div className="catrow" key={c}>
                <span>{c}</span>
                <div className="track">
                  <div className="fill" style={{ width: `${(v / (cats[0]?.[1] || 1)) * 100}%` }} />
                </div>
                <span className="catamt">{money(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      {topCat && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 14 }}>
          <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--accent-bg)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 2l1.8 5.4H17l-4.9 3.6 1.9 5.6L9 13.2l-5 3.4 1.9-5.6L1 7.4h6.2z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>Top category</div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{topCat[0]}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{money(topCat[1])}</div>
            </div>
          </div>
          <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--accent-bg)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="14" height="13" rx="2"/>
                <path d="M6 2v2M12 2v2M2 7h14"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>Avg. transaction</div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{money(tx.length ? daily / tx.length : 0)}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{tx.length} transactions</div>
            </div>
          </div>
          <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--accent-bg)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="7" r="4"/><path d="M14 14l-3-3"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>Categories</div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{cats.length} used</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>this month</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="card tablecard">
        <div className="section-header">
          <h2>Recent transactions</h2>
          <button className="btn secondary" style={{ fontSize: 12, padding: "7px 12px", display: "inline-flex", alignItems: "center", gap: 4 }} onClick={() => onView("transactions")}>
            View all <IconChevronRight />
          </button>
        </div>
        <TxTable rows={recent} onDelete={onDelete} />
      </div>
    </>
  );
}

import { useState } from "react";
import { money, cat, monthLabel } from "../helpers";

export default function YearSummary({ tx, others }) {
  // Combine daily transactions and other expenses across all months.
  const all = [
    ...tx,
    ...others.map((o) => ({ ...o, date: o.date || (o.month ? o.month + "-01" : "") })),
  ];

  const years = [
    ...new Set(all.map((x) => (x.date || x.month || "").slice(0, 4)).filter(Boolean)),
  ].sort().reverse();

  const [picked, setPicked] = useState(null);
  // Use the picked year if it still exists in the data, else default to latest.
  const year =
    (picked && years.includes(picked) ? picked : years[0]) ||
    String(new Date().getFullYear());

  const yearTx = all.filter((x) => (x.date || x.month || "").slice(0, 4) === year);
  const total = yearTx.reduce((s, x) => s + Number(x.amount || 0), 0);

  const cats = {};
  const months = {};
  yearTx.forEach((x) => {
    const c = /deca payment/i.test(x.desc || "")
      ? "House Payment"
      : x.cat || cat(x.desc || "");
    cats[c] = (cats[c] || 0) + Number(x.amount || 0);
    const m = (x.date || x.month || "").slice(0, 7);
    if (m) months[m] = (months[m] || 0) + Number(x.amount || 0);
  });

  const rows = Array.from({ length: 12 }, (_, i) => {
    const key = year + "-" + String(i + 1).padStart(2, "0");
    return {
      key,
      total: months[key] || 0,
      count: yearTx.filter((x) => (x.date || x.month || "").startsWith(key)).length,
    };
  });

  const active = rows.filter((x) => x.total > 0);
  const avg = active.length ? total / active.length : 0;
  const topMonth = [...rows].sort((a, b) => b.total - a.total)[0];
  const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
  const maxM = Math.max(...rows.map((x) => x.total), 1);
  const maxC = Math.max(...Object.values(cats), 1);

  return (
    <>
      <div className="section-title">
        <h2>Monthly Summary</h2>
        <select
          value={year}
          onChange={(e) => setPicked(e.target.value)}
          disabled={!years.length}
        >
          {(years.length ? years : [year]).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div className="grid">
        <div className="card kpi">
          <div className="label">Year total</div>
          <div className="value">{money(total)}</div>
          <small>{year} • all expenses</small>
        </div>
        <div className="card kpi">
          <div className="label">Average / active month</div>
          <div className="value">{money(avg)}</div>
          <small>
            {active.length} active month{active.length === 1 ? "" : "s"}
          </small>
        </div>
        <div className="card kpi">
          <div className="label">Highest month</div>
          <div className="value">{topMonth.total ? money(topMonth.total) : "—"}</div>
          <small>{monthLabel(topMonth.key, { month: "long" })}</small>
        </div>
        <div className="card kpi">
          <div className="label">Top category</div>
          <div className="value">{topCat ? topCat[0] : "—"}</div>
          <small>{topCat ? money(topCat[1]) : "No data"}</small>
        </div>
      </div>

      <div className="two">
        <div className="card">
          <div className="section-title">
            <h2>{year} Monthly Spending</h2>
            <span>{yearTx.length} records</span>
          </div>
          <div className="bars">
            {rows.map((x) => (
              <div className="barwrap" key={x.key}>
                <div className="barvalue">{x.total ? money(x.total) : ""}</div>
                <div
                  className="bar"
                  style={{ height: Math.max(2, Math.round((x.total / maxM) * 165)) }}
                />
                <div className="barlabel">{monthLabel(x.key, { month: "short" })}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="section-title">
            <h2>Category Breakdown</h2>
          </div>
          {Object.entries(cats).sort((a, b) => b[1] - a[1]).length ? (
            Object.entries(cats)
              .sort((a, b) => b[1] - a[1])
              .map(([c, v]) => (
                <div className="catrow" key={c}>
                  <span>{c}</span>
                  <div className="track">
                    <div className="fill" style={{ width: `${(v / maxC) * 100}%` }} />
                  </div>
                  <span className="catamt">{money(v)}</span>
                </div>
              ))
          ) : (
            <div className="empty">No expenses yet.</div>
          )}
        </div>
      </div>

      <div className="card tablecard">
        <div className="section-title">
          <h2>Monthly Breakdown</h2>
          <span>{year}</span>
        </div>
        <div className="month-breakdown-list">
          {rows.map((x) => (
            <div key={x.key} className={`month-breakdown-row${x.total === 0 ? " empty-month" : ""}`}>
              <span className="mbl-month">{monthLabel(x.key, { month: "long" })}</span>
              <span className="mbl-count">{x.count > 0 ? `${x.count} txn${x.count !== 1 ? "s" : ""}` : "—"}</span>
              <span className="mbl-total">{x.total ? money(x.total) : "—"}</span>
            </div>
          ))}
          <div className="month-breakdown-row total-row">
            <span className="mbl-month">Year Total</span>
            <span className="mbl-count">{yearTx.length} txns</span>
            <span className="mbl-total">{money(total)}</span>
          </div>
        </div>
      </div>
    </>
  );
}

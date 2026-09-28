import { useState } from "react";
import TxTable from "./TxTable";
import { CATEGORIES, byDateDesc, money } from "../helpers";
import { IconTrash } from "./Icons";

export default function Transactions({ tx, onDelete, others, onAddOther, onDeleteOther }) {
  const [q, setQ] = useState("");
  const [c, setC] = useState("");

  const rows = byDateDesc(tx).filter(
    (x) => (!q || x.desc.toLowerCase().includes(q.toLowerCase())) && (!c || x.cat === c)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Other Expenses ── */}
      <div className="card" style={{ marginTop: 0 }}>
        <div className="section-header">
          <h2>Other Expenses</h2>
          <button className="btn primary" onClick={onAddOther}>＋ Add</button>
        </div>
        <div className="notice">
          Recurring or one-off amounts kept separate from daily spending.
        </div>
        {others?.length ? (
          <>
            {/* Desktop table */}
            <div className="tablewrap tx-table-desktop" style={{ marginTop: 12 }}>
              <table>
                <colgroup>
                  <col style={{ width: "auto" }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 48 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {others.map((x) => (
                    <tr key={x.id}>
                      <td style={{ fontWeight: 500 }}>{x.desc}</td>
                      <td><span className="tag">{x.cat || "Other"}</span></td>
                      <td className="amount">{money(x.amount)}</td>
                      <td className="col-action-cell">
                        <button className="tx-delete-btn" title="Delete"
                          onMouseEnter={(e) => e.currentTarget.style.color = "var(--danger)"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "var(--danger)"}
                          onClick={() => onDeleteOther(x.id)}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                            <line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile card list */}
            <div className="tx-card-list" style={{ marginTop: 12 }}>
              {others.map((x) => (
                <div key={x.id} className="tx-card">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="tx-card-main">
                      <div className="tx-card-desc">{x.desc}</div>
                      <div className="tx-card-amount">{money(x.amount)}</div>
                    </div>
                    <div className="tx-card-meta">
                      <span className="tag">{x.cat || "Other"}</span>
                    </div>
                  </div>
                  <button className="tx-x-btn" title="Delete" onClick={() => onDeleteOther(x.id)}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty">No other expenses yet.</div>
        )}
      </div>

      {/* ── Transactions ── */}
      <div className="card tablecard">
        <div className="section-header">
          <h2>Transactions</h2>
          <span className="badge">{tx.length} records</span>
        </div>
        <div className="filters">
          <input
            placeholder="Search description..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select value={c} onChange={(e) => setC(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.filter((x) => x !== "House Payment").map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <TxTable rows={rows} onDelete={onDelete} />
      </div>

    </div>
  );
}

import { money } from "../helpers";
import { IconTrash } from "./Icons";

export default function TxTable({ rows, onDelete }) {
  if (!rows.length) return <div className="empty">No transactions yet.</div>;
  return (
    <>
      {/* ── Desktop table ── */}
      <div className="tablewrap tx-table-desktop">
        <table>
          <colgroup>
            <col className="col-date" />
            <col className="col-desc" />
            <col className="col-cat" />
            <col className="col-amount" />
            <col className="col-action" />
          </colgroup>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id}>
                <td style={{ color: "var(--muted)", fontSize: 12 }}>{x.date}</td>
                <td style={{ fontWeight: 500 }} title={x.desc}>{x.desc}</td>
                <td><span className="tag">{x.cat}</span></td>
                <td className="amount">{money(x.amount)}</td>
                <td className="col-action-cell">
                  <button
                    className="tx-delete-btn"
                    title="Delete"
                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--danger)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted)"}
                    onClick={() => onDelete(x.id)}
                  >
                    <IconTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list ── */}
      <div className="tx-card-list">
        {rows.map((x) => (
          <div key={x.id} className="tx-card">
            <div className="tx-card-main">
              <div className="tx-card-desc">{x.desc}</div>
              <div className="tx-card-amount">{money(x.amount)}</div>
            </div>
            <div className="tx-card-meta">
              <span className="tx-card-date">{x.date}</span>
              <span className="tag">{x.cat}</span>
              <button
                className="tx-delete-btn"
                title="Delete"
                onClick={() => onDelete(x.id)}
              >
                <IconTrash />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

import { money } from "../helpers";
import { IconTrash } from "./Icons";

export default function Others({ others, onAdd, onDelete }) {
  return (
    <div className="card" style={{ marginTop: 0 }}>
      <div className="section-header">
        <h2>Other expenses</h2>
        <button className="btn primary" onClick={onAdd}>
          ＋ Add
        </button>
      </div>
      <div className="notice">
        These are kept separate from daily spending and included in the monthly total.
      </div>
      {others.length ? (
        <div className="tablewrap" style={{ marginTop: 15 }}>
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
                    <button
                      style={{
                        background: "none", border: "none", color: "var(--muted)",
                        cursor: "pointer", padding: "5px", borderRadius: 6,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        transition: "color .12s",
                      }}
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
      ) : (
        <div className="empty">No other expenses yet.</div>
      )}
    </div>
  );
}

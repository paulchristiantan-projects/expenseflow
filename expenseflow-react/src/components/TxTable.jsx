import { money } from "../helpers";
import { IconTrash } from "./Icons";

export default function TxTable({ rows, onDelete }) {
  if (!rows.length) return <div className="empty">No transactions yet.</div>;
  return (
    <div className="tablewrap">
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
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--muted)",
                    cursor: "pointer",
                    padding: "5px",
                    borderRadius: 6,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
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
  );
}

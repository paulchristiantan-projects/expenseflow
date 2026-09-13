import { money } from "../helpers";

export default function Others({ others, onAdd, onDelete }) {
  return (
    <div className="card" style={{ marginTop: 0 }}>
      <div className="section-title">
        <h2>Other expenses</h2>
        <button className="btn primary" onClick={onAdd}>
          ＋ Add other expense
        </button>
      </div>
      <div className="notice">
        These are kept separate from daily transaction spending and included in the
        monthly total.
      </div>
      {others.length ? (
        <div className="tablewrap" style={{ marginTop: 15 }}>
          <table>
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
                  <td>{x.desc}</td>
                  <td>
                    <span className="tag">{x.cat || "Other"}</span>
                  </td>
                  <td className="amount">{money(x.amount)}</td>
                  <td>
                    <button
                      className="btn secondary"
                      style={{ padding: "6px 9px" }}
                      onClick={() => onDelete(x.id)}
                    >
                      Delete
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

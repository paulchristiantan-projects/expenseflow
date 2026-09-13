import { money } from "../helpers";

export default function TxTable({ rows, onDelete }) {
  if (!rows.length) return <div className="empty">No transactions yet.</div>;
  return (
    <div className="tablewrap">
      <table>
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
              <td>{x.date}</td>
              <td>{x.desc}</td>
              <td>
                <span className="tag">{x.cat}</span>
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
  );
}

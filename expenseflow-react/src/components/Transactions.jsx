import { useState } from "react";
import TxTable from "./TxTable";
import { CATEGORIES, byDateDesc } from "../helpers";

export default function Transactions({ tx, onDelete }) {
  const [q, setQ] = useState("");
  const [c, setC] = useState("");

  const rows = byDateDesc(tx).filter(
    (x) => (!q || x.desc.toLowerCase().includes(q.toLowerCase())) && (!c || x.cat === c)
  );

  return (
    <div className="card tablecard" style={{ marginTop: 0 }}>
      <div className="section-title">
        <h2>Transactions</h2>
        <span>{tx.length} records</span>
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
  );
}

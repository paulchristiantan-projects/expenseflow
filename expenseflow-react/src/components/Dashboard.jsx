import { money, byDateDesc } from "../helpers";
import TxTable from "./TxTable";

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

  return (
    <>
      <div className="grid">
        <div className="card kpi">
          <div className="label">Total expenses</div>
          <div className="value">{money(total)}</div>
          <small>Daily + other expenses</small>
        </div>
        <div className="card kpi">
          <div className="label">Daily spending</div>
          <div className="value">{money(daily)}</div>
          <small>{tx.length} transactions</small>
        </div>
        <div className="card kpi">
          <div className="label">Other expenses</div>
          <div className="value">{money(oth)}</div>
          <small>Recurring / separate items</small>
        </div>
        <div className="card kpi">
          <div className="label">Avg. transaction</div>
          <div className="value">{money(tx.length ? daily / tx.length : 0)}</div>
          <small>Daily transactions only</small>
        </div>
      </div>

      <div className="two">
        <div className="card">
          <div className="section-title">
            <h2>Daily spending</h2>
            <span className="label">{ds.length} active days</span>
          </div>
          <div className="bars">
            {ds.map(([d, v]) => (
              <div className="barwrap" key={d}>
                <div className="barvalue">{money(v)}</div>
                <div className="bar" style={{ height: Math.max(2, (v / max) * 165) }} />
                <div className="barlabel">{d.slice(5)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="section-title">
            <h2>By category</h2>
          </div>
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

      <div className="card tablecard">
        <div className="section-title">
          <h2>Recent transactions</h2>
          <button className="btn secondary" onClick={() => onView("transactions")}>
            View all
          </button>
        </div>
        <TxTable rows={recent} onDelete={onDelete} />
      </div>
    </>
  );
}

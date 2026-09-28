import { useMemo, useState } from "react";
import { money, monthLabel } from "../helpers";
import { HOUSE_CATEGORIES, GROCERY_SUBCATS, HouseCatIcon, USAGE_CONFIG, effectiveHouseBycat, HOUSE_CAT_COLORS, normalizeCat } from "./HouseExpenses";
import { IconTrash, IconEdit, IconPlus } from "./Icons";

// Entry modal
function EntryModal({ initial, month, onSave, onClose }) {
  const [cat,   setCat]   = useState(initial?.cat    || HOUSE_CATEGORIES[0].key);
  const [amount,setAmount]= useState(initial?.amount != null ? String(initial.amount) : "");
  const [note,  setNote]  = useState(initial?.note   || "");
  const [usage, setUsage] = useState(initial?.usage  != null ? String(initial.usage) : "");
  const usageCfg = USAGE_CONFIG[cat];
  const S = { display:"block", width:"100%", marginTop:6, padding:"8px 10px", borderRadius:8, border:"1px solid var(--line)", fontSize:14, background:"var(--bg)", color:"var(--text)" };
  const L = { fontSize:12, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:.5 };
  function submit(e) {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    onSave({ category:cat, amount:Number(amount), note, usage: usage ? Number(usage) : null, month });
  }
  return (
    <div className="modal open" onClick={onClose}>
      <div className="modalbox" style={{ maxWidth:420 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <h2 style={{ margin:0, fontSize:16 }}>{initial ? "Edit" : "Add"} House Expense</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted)", fontSize:18, lineHeight:1, padding:4 }}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <label style={L}>Category
            <select value={cat} onChange={(e) => { setCat(e.target.value); setUsage(""); }} style={S}>
              {HOUSE_CATEGORIES.map(({ key }) => <option key={key} value={key}>{key}</option>)}
            </select>
          </label>
          <label style={L}>Amount (PHP)
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required autoFocus style={S}/>
          </label>
          {usageCfg && (
            <label style={L}>{usageCfg.label}
              <div style={{ position:"relative" }}>
                <input type="number" min="0" step="0.01" value={usage} onChange={(e) => setUsage(e.target.value)} placeholder={usageCfg.placeholder} style={{ ...S, paddingRight:44 }}/>
                <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:12, color:"var(--muted)", pointerEvents:"none" }}>{usageCfg.unit}</span>
              </div>
            </label>
          )}
          <label style={L}>Note (optional)
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Meralco Jan bill" style={S}/>
          </label>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:4 }}>
            <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary"><IconPlus size={14}/> {initial ? "Save" : "Add"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const CAT_COLORS = []; // kept for compatibility, use HOUSE_CAT_COLORS instead

function KpiIcon({ children }) {
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 10,
      background: "var(--accent-bg)", color: "var(--accent)",
      display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: 12, flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

function DonutChart({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (!total) return <div className="empty" style={{ padding: 16 }}>No data</div>;
  let offset = 0;
  const r = 40, circ = 2 * Math.PI * r;
  const arcs = segments.map((seg) => {
    const dash = (seg.value / total) * circ;
    const arc = { ...seg, dash, offset };
    offset += dash;
    return arc;
  });
  return (
    <svg viewBox="0 0 100 100" style={{ width: 100, height: 100, transform: "rotate(-90deg)" }}>
      {arcs.map((a, i) => (
        <circle key={i} cx="50" cy="50" r={r} fill="none"
          stroke={a.color} strokeWidth="14"
          strokeDasharray={`${a.dash} ${circ - a.dash}`}
          strokeDashoffset={-a.offset} />
      ))}
    </svg>
  );
}

export default function HouseDashboard({ house, grocery, tuition = [], otherExpense = [], month, onView, onAdd, onUpdate, onDelete, onAddGrocery, onDelGrocery, onAddTuition, onDelTuition, onAddOther, onDelOther, readOnly = false }) {
  const [modal, setModal] = useState(null); // null | "add" | { ...entry }

  async function handleSave(data) {
    if (modal?.id) await onUpdate(modal.id, { cat: data.category, amount: data.amount, note: data.note, usage: data.usage ?? null, month: data.month, sharedDocId: modal.sharedDocId });
    else await onAdd(data);
    setModal(null);
  }
  // Bills totals by category — Groceries/Market overridden by grocery items when present
  const bycat = useMemo(() => effectiveHouseBycat(house, grocery, tuition, otherExpense), [house, grocery, tuition, otherExpense]);

  const houseTotal = useMemo(() => Object.values(bycat).reduce((s, v) => s + v, 0), [bycat]);
  const groceryTotal = grocery.reduce((s, x) => s + x.amount, 0);
  const grandTotal = houseTotal;

  // For donut — non-zero categories
  const donutSegments = HOUSE_CATEGORIES
    .filter(({ key }) => bycat[key] > 0)
    .map(({ key }) => ({ value: bycat[key], color: HOUSE_CAT_COLORS[key], label: key }));

  // Grocery by subcat
  const groceryBySubcat = useMemo(() =>
    Object.fromEntries(GROCERY_SUBCATS.map((s) => [s, grocery.filter((x) => x.subcat === s).reduce((a, x) => a + x.amount, 0)])),
  [grocery]);

  const maxCat = Math.max(...HOUSE_CATEGORIES.map(({ key }) => bycat[key]), 1);
  const topBill = HOUSE_CATEGORIES.map(({ key, icon }) => ({ key, icon, amt: bycat[key] })).sort((a, b) => b.amt - a.amt)[0];

  return (
    <>
      {/* ── KPI cards ── */}
      <div className="grid">
        <div className="card kpi kpi-accent">
          <KpiIcon>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 7l7-5 7 5v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z"/>
              <path d="M6 14V9h6v5"/>
            </svg>
          </KpiIcon>
          <div className="label">Total house expenses</div>
          <div className="value">{money(grandTotal)}</div>
          <small>Bills + groceries</small>
        </div>

        <div className="card kpi">
          <KpiIcon>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 5h14M2 9h10M2 13h6"/>
            </svg>
          </KpiIcon>
          <div className="label">House bills</div>
          <div className="value">{money(houseTotal)}</div>
          <small>{house.length} entries</small>
        </div>

        <div className="card kpi">
          <KpiIcon>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 2h1.5l2 7h7l1.5-5H5"/>
              <circle cx="6.5" cy="13.5" r="1.5"/>
              <circle cx="11.5" cy="13.5" r="1.5"/>
            </svg>
          </KpiIcon>
          <div className="label">Food & Essentials</div>
          <div className="value">{money(bycat["Food & Essentials"])}</div>
          <small>{grocery.length > 0 ? `${grocery.length} items` : "from bills"}</small>
        </div>

        <div className="card kpi">
          <KpiIcon>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2l1.8 5.4H17l-4.9 3.6 1.9 5.6L9 13.2l-5 3.4 1.9-5.6L1 7.4h6.2z"/>
            </svg>
          </KpiIcon>
          <div className="label">Top bill</div>
          <div className="value" style={{ fontSize: 16 }}>{topBill?.amt > 0 ? topBill.key : "—"}</div>
          <small>{topBill?.amt > 0 ? money(topBill.amt) : "no data"}</small>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="two">
        {/* Bills bar chart by category */}
        <div className="card">
          <div className="section-header">
            <h2>Bills by category</h2>
            <span className="badge">{monthLabel(month, { month: "short", year: "numeric" })}</span>
          </div>
          {houseTotal > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              {HOUSE_CATEGORIES.map(({ key, icon }) => {
                const amt   = bycat[key] || 0;
                const pct   = amt ? Math.max(4, Math.round((amt / maxCat) * 100)) : 0;
                const color = HOUSE_CAT_COLORS[key];
                return (
                  <div key={key}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--muted)" }}>
                        <HouseCatIcon type={icon} size={13} /> {key}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: amt ? "var(--text)" : "var(--muted)" }}>
                        {amt ? money(amt) : "—"}
                      </span>
                    </div>
                    <div style={{ height: 10, borderRadius: 6, background: "var(--line)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 6, transition: "width .3s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty">No bills data for this month.</div>
          )}
        </div>

        {/* Expense distribution donut */}
        <div className="card">
          <div className="section-header">
            <h2>Expense distribution</h2>
          </div>
          {donutSegments.length > 0 ? (
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
              <DonutChart segments={donutSegments} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                {donutSegments.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0, display: "inline-block" }} />
                    <span style={{ flex: 1, color: "var(--muted)" }}>{s.label}</span>
                    <span style={{ fontWeight: 700 }}>{Math.round((s.value / (houseTotal || 1)) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty">No distribution data yet.</div>
          )}
        </div>
      </div>

      {/* ── Grocery breakdown ── */}
      {groceryTotal > 0 && (
        <div className="card">
          <div className="section-header" style={{ marginBottom: 14 }}>
            <h2>Food & Essentials breakdown</h2>
            <span style={{ fontWeight: 700, color: "var(--accent)" }}>{money(groceryTotal)}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {GROCERY_SUBCATS.map((sub) => {
              const amt = groceryBySubcat[sub];
              return (
                <div key={sub} style={{
                  padding: "12px 14px", borderRadius: 12,
                  background: amt > 0 ? "var(--accent-bg)" : "var(--bg)",
                  border: `1px solid ${amt > 0 ? "var(--accent-soft)" : "var(--line)"}`,
                }}>
                  <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginBottom: 4 }}>{sub}</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: amt > 0 ? "var(--accent)" : "var(--muted)" }}>
                    {amt > 0 ? money(amt) : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── House bills table ── */}
      <div className="card">
        <div className="section-header">
          <h2>House Bills — {monthLabel(month, { month: "long", year: "numeric" })}</h2>
          {!readOnly && <button className="btn primary" onClick={() => setModal("add")}><IconPlus size={14}/> Add</button>}
        </div>
        {/* Category chips */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, margin:"14px 0 10px" }}>
          {HOUSE_CATEGORIES.map(({ key, icon }) => {
            const amt = house.filter((x) => normalizeCat(x.cat)===key).reduce((s,x)=>s+x.amount,0);
            return (
              <div key={key} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:20,
                background: amt?"var(--accent-bg)":"var(--bg)", border:`1px solid ${amt?"var(--accent-soft)":"var(--line)"}`,
                fontSize:13, color: amt?"var(--accent)":"var(--muted)" }}>
                <HouseCatIcon type={icon} size={15}/>
                <span style={{ fontWeight:500 }}>{key}</span>
                {amt > 0 && <span style={{ fontWeight:700 }}>{money(amt)}</span>}
              </div>
            );
          })}
        </div>
        {house.length ? (
          <div className="tablewrap" style={{ marginTop:8 }}>
            <table>
              <colgroup><col style={{ width:36 }}/><col/><col style={{ width:110 }}/><col/><col style={{ width:130 }}/>{!readOnly && <col style={{ width:48 }}/>}{!readOnly && <col style={{ width:48 }}/>}</colgroup>
              <thead><tr><th></th><th>Category</th><th style={{ textAlign:"right" }}>Usage</th><th>Note</th><th style={{ textAlign:"right" }}>Amount</th>{!readOnly && <th></th>}{!readOnly && <th></th>}</tr></thead>
              <tbody>
                {house.map((x) => {
                  const displayCat = normalizeCat(x.cat);
                  const meta = HOUSE_CATEGORIES.find((c) => c.key===displayCat)||{};
                  const uc = USAGE_CONFIG[displayCat];
                  return (
                    <tr key={x.id}>
                      <td style={{ textAlign:"center", paddingTop:2 }}><HouseCatIcon type={meta.icon} size={18}/></td>
                      <td style={{ fontWeight:500 }}>{displayCat}</td>
                      <td style={{ textAlign:"right", color:"var(--muted)", fontSize:13 }}>
                        {uc && x.usage != null ? <span>{x.usage.toLocaleString()} <span style={{ fontSize:11 }}>{uc.unit}</span></span> : uc ? "—" : ""}
                      </td>
                      <td style={{ color:"var(--muted)", fontSize:13 }}>{x.note||"—"}</td>
                      <td className="amount">{money(x.amount)}</td>
                      {!readOnly && <td className="col-action-cell">
                        <button style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", padding:5, borderRadius:6, display:"inline-flex" }}
                          onMouseEnter={(e)=>e.currentTarget.style.color="var(--accent)"} onMouseLeave={(e)=>e.currentTarget.style.color="var(--muted)"}
                          onClick={() => setModal(x)}><IconEdit size={14}/></button>
                      </td>}
                      {!readOnly && <td className="col-action-cell">
                        <button style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", padding:5, borderRadius:6, display:"inline-flex" }}
                          onMouseEnter={(e)=>e.currentTarget.style.color="var(--danger)"} onMouseLeave={(e)=>e.currentTarget.style.color="var(--muted)"}
                          onClick={() => { if(confirm(`Delete this ${displayCat} entry?`)) onDelete(x.id, x.sharedDocId); }}><IconTrash/></button>
                      </td>}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr><td colSpan={4} style={{ fontWeight:700, textAlign:"right", paddingRight:8, fontSize:13 }}>Total</td>
                <td className="amount" style={{ fontWeight:700, color:"var(--accent)" }}>{money(houseTotal)}</td><td/><td/></tr>
              </tfoot>
            </table>
          </div>
        ) : <div className="empty">No house bills yet for this month.</div>}
      </div>

      {/* ── Grocery list ── */}
      {grocery.length > 0 && (
        <div className="card">
          <div className="section-header" style={{ marginBottom:14 }}>
            <h2>Food & Essentials</h2>
            <span style={{ fontWeight:700, color:"var(--accent)", fontSize:15 }}>{money(groceryTotal)}</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {GROCERY_SUBCATS.map((sub) => {
              const items = grocery.filter((x) => x.subcat === sub);
              if (!items.length) return null;
              const subTotal = items.reduce((s,x)=>s+x.amount,0);
              return (
                <div key={sub}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <span style={{ fontWeight:600, fontSize:13 }}>{sub}</span>
                    <span style={{ fontWeight:700, fontSize:13, color:"var(--accent)" }}>{money(subTotal)}</span>
                  </div>
                  <div className="tablewrap">
                    <table>
                      <tbody>
                        {items.map((x) => (
                          <tr key={x.id}>
                            <td style={{ color:"var(--muted)", fontSize:13 }}>{x.desc}</td>
                            <td className="amount">{money(x.amount)}</td>
                            {!readOnly && <td className="col-action-cell">
                              <button style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", padding:5, borderRadius:6, display:"inline-flex" }}
                                onMouseEnter={(e)=>e.currentTarget.style.color="var(--danger)"} onMouseLeave={(e)=>e.currentTarget.style.color="var(--muted)"}
                                onClick={() => { if(confirm(`Delete "${x.desc}"?`)) onDelGrocery(x.id, x.sharedDocId); }}><IconTrash/></button>
                            </td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── School Fees breakdown ── */}
      {tuition.length > 0 && (
        <div className="card">
          <div className="section-header" style={{ marginBottom:14 }}>
            <h2>School Fees</h2>
            <span style={{ fontWeight:700, color:"var(--accent)", fontSize:15 }}>{money(tuition.reduce((s,x)=>s+x.amount,0))}</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[...new Set(tuition.map((x)=>x.subcat))].map((sub) => {
              const items = tuition.filter((x)=>x.subcat===sub);
              const subTotal = items.reduce((s,x)=>s+x.amount,0);
              return (
                <div key={sub}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontWeight:600, fontSize:13 }}>{sub}</span>
                    <span style={{ fontWeight:700, fontSize:13, color:"var(--accent)" }}>{money(subTotal)}</span>
                  </div>
                  <div className="tablewrap"><table><tbody>
                    {items.map((x) => (
                      <tr key={x.id}>
                        <td style={{ color:"var(--muted)", fontSize:13 }}>{x.desc}</td>
                        <td className="amount">{money(x.amount)}</td>
                        {!readOnly && <td className="col-action-cell">
                          <button style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", padding:5, borderRadius:6, display:"inline-flex" }}
                            onMouseEnter={(e)=>e.currentTarget.style.color="var(--danger)"} onMouseLeave={(e)=>e.currentTarget.style.color="var(--muted)"}
                            onClick={() => { if(confirm(`Delete "${x.desc}"?`)) onDelTuition(x.id, x.sharedDocId); }}><IconTrash/></button>
                        </td>}
                      </tr>
                    ))}
                  </tbody></table></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Other Expense breakdown ── */}
      {otherExpense.length > 0 && (
        <div className="card">
          <div className="section-header" style={{ marginBottom:14 }}>
            <h2>Other Expenses</h2>
            <span style={{ fontWeight:700, color:"var(--accent)", fontSize:15 }}>{money(otherExpense.reduce((s,x)=>s+x.amount,0))}</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[...new Set(otherExpense.map((x)=>x.subcat))].map((sub) => {
              const items = otherExpense.filter((x)=>x.subcat===sub);
              const subTotal = items.reduce((s,x)=>s+x.amount,0);
              return (
                <div key={sub}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontWeight:600, fontSize:13 }}>{sub}</span>
                    <span style={{ fontWeight:700, fontSize:13, color:"var(--accent)" }}>{money(subTotal)}</span>
                  </div>
                  <div className="tablewrap"><table><tbody>
                    {items.map((x) => (
                      <tr key={x.id}>
                        <td style={{ color:"var(--muted)", fontSize:13 }}>{x.desc}</td>
                        <td className="amount">{money(x.amount)}</td>
                        {!readOnly && <td className="col-action-cell">
                          <button style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", padding:5, borderRadius:6, display:"inline-flex" }}
                            onMouseEnter={(e)=>e.currentTarget.style.color="var(--danger)"} onMouseLeave={(e)=>e.currentTarget.style.color="var(--muted)"}
                            onClick={() => { if(confirm(`Delete "${x.desc}"?`)) onDelOther(x.id, x.sharedDocId); }}><IconTrash/></button>
                        </td>}
                      </tr>
                    ))}
                  </tbody></table></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display:"flex", gap:10 }}>
        <button className="btn secondary" style={{ fontSize:12 }} onClick={() => onView("house-summary")}>
          Monthly summary →
        </button>
      </div>

      {modal && !readOnly && (
        <EntryModal
          initial={modal === "add" ? null : modal}
          month={month}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

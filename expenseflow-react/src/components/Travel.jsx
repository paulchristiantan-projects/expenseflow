import { useState, useMemo } from "react";
import { money } from "../helpers";
import { IconPlus, IconTrash, IconEdit } from "./Icons";

// ── Constants ─────────────────────────────────────────────────────────────────
export const TRAVEL_CATEGORIES = [
  { key: "Food & Drinks",   color: "#f97316", icon: "food"      },
  { key: "Lodging",         color: "#4a5adf", icon: "lodging"   },
  { key: "Transport",       color: "#f59e0b", icon: "transport" },
  { key: "Tour / Activity", color: "#10b981", icon: "tour"      },
  { key: "Shopping",        color: "#ec4899", icon: "shopping"  },
  { key: "Others",          color: "#94a3b8", icon: "others"    },
];

// ── Category icon ─────────────────────────────────────────────────────────────
function TravelCatIcon({ type, size = 15 }) {
  const s = { width: size, height: size, display: "inline-block", flexShrink: 0 };
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (type) {
    case "transport": return (
      <svg style={s} viewBox="0 0 16 16" {...p}>
        <rect x="1" y="5" width="14" height="7" rx="2" fill="var(--accent-bg)" stroke="var(--accent)"/>
        <path d="M4 12v2M12 12v2"/><circle cx="4.5" cy="9" r="1" fill="var(--accent)" stroke="none"/>
        <circle cx="11.5" cy="9" r="1" fill="var(--accent)" stroke="none"/>
        <path d="M1 8h14M5 5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>
    );
    case "lodging": return (
      <svg style={s} viewBox="0 0 16 16" {...p}>
        <path d="M1 7l7-5 7 5v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z" fill="var(--accent-bg)"/>
        <path d="M5.5 14V9h5v5"/>
      </svg>
    );
    case "food": return (
      <svg style={s} viewBox="0 0 16 16" {...p}>
        <path d="M5 2v5a3 3 0 0 0 6 0V2"/><line x1="8" y1="7" x2="8" y2="14"/>
        <line x1="5" y1="4" x2="11" y2="4"/>
      </svg>
    );
    case "tour": return (
      <svg style={s} viewBox="0 0 16 16" {...p}>
        <circle cx="8" cy="8" r="6" fill="var(--accent-bg)" stroke="var(--accent)"/>
        <path d="M8 2v2M8 12v2M2 8h2M12 8h2"/>
        <circle cx="8" cy="8" r="2" fill="var(--accent)" stroke="none"/>
      </svg>
    );
    case "shopping": return (
      <svg style={s} viewBox="0 0 16 16" {...p}>
        <path d="M2 2h1.5l2 7h7l1.5-5H5" fill="var(--accent-bg)" stroke="var(--accent)"/>
        <circle cx="6.5" cy="12.5" r="1.2" fill="var(--accent)" stroke="none"/>
        <circle cx="11" cy="12.5" r="1.2" fill="var(--accent)" stroke="none"/>
      </svg>
    );
    case "others": return (
      <svg style={s} viewBox="0 0 16 16" {...p}>
        <circle cx="8" cy="8" r="6" fill="var(--accent-bg)" stroke="var(--accent)"/>
        <line x1="8" y1="5" x2="8" y2="8"/>
        <circle cx="8" cy="11" r="0.75" fill="var(--accent)" stroke="none"/>
      </svg>
    );
    default: return null;
  }
}

// ── Member chip ───────────────────────────────────────────────────────────────
function MemberChip({ email, isOwner, isPending, canRemove, onRemove }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px", borderRadius:20,
      background: isPending ? "var(--bg)" : "var(--accent-bg)",
      border: `1px solid ${isPending ? "var(--line)" : "var(--accent-soft)"}`, fontSize:13 }}>
      <span style={{ width:24, height:24, borderRadius:"50%", flexShrink:0,
        background: isOwner ? "var(--accent)" : isPending ? "var(--line)" : "var(--accent-soft)",
        color: isOwner ? "#fff" : "var(--accent)",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800 }}>
        {email[0].toUpperCase()}
      </span>
      <span style={{ color:"var(--text)" }}>{email}</span>
      {isOwner   && <span style={{ fontSize:11, color:"var(--accent)", fontWeight:700, marginLeft:2 }}>owner</span>}
      {isPending && <span style={{ fontSize:11, color:"var(--muted)", fontWeight:600, marginLeft:2 }}>pending</span>}
      {canRemove && (
        <button onClick={() => onRemove(email)}
          style={{ background:"none", border:"1px solid var(--line)", borderRadius:6, cursor:"pointer",
            color:"var(--danger)", padding:"2px 7px", fontSize:11, fontWeight:600, marginLeft:4, lineHeight:1.4 }}>
          Remove
        </button>
      )}
    </div>
  );
}

// ── Add / Edit expense modal ──────────────────────────────────────────────────
function ExpenseModal({ open, initial, members = [], onSave, onClose }) {
  const blank = { cat: TRAVEL_CATEGORIES[0].key, desc: "", amount: "", date: new Date().toISOString().slice(0,10), splitType: "shared", assignedTo: "" };
  const [form, setForm] = useState(initial || blank);
  const [busy, setBusy] = useState(false);

  useMemo(() => { if (open) setForm(initial || blank); }, [open]); // eslint-disable-line

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || isNaN(Number(form.amount))) return alert("Enter a valid amount.");
    if (!form.date) return alert("Pick a date.");
    if (form.splitType === "individual" && !form.assignedTo) return alert("Select who this expense is for.");
    setBusy(true);
    try {
      await onSave({
        cat: form.cat, desc: form.desc, amount: Number(form.amount), date: form.date,
        splitType: form.splitType,
        assignedTo: form.splitType === "individual" ? form.assignedTo : "",
      });
      onClose();
    }
    catch (err) { alert(err.message); }
    finally { setBusy(false); }
  }

  const field = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="modal open">
      <div className="modalbox">
        <h2>{initial ? "Edit Expense" : "Add Expense"}</h2>
        <div className="formgrid">

          <div className="field">
            <label>Category</label>
            <select value={form.cat} onChange={(e) => field("cat", e.target.value)}>
              {TRAVEL_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.key}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Date</label>
            <input type="date" value={form.date} onChange={(e) => field("date", e.target.value)} required />
          </div>

          <div className="field full">
            <label>Description</label>
            <input value={form.desc} onChange={(e) => field("desc", e.target.value)}
              placeholder="e.g. Hotel check-in, Grab to airport…" />
          </div>

          <div className="field">
            <label>Amount</label>
            <input type="number" min="0" step="0.01" value={form.amount}
              onChange={(e) => field("amount", e.target.value)} placeholder="0.00" required />
          </div>

          <div className="field full">
            <label>Split</label>
            <div style={{ display:"flex", gap:0, borderRadius:8, overflow:"hidden", border:"1px solid var(--line)" }}>
              {[
                { val:"shared",     label:"Shared",     icon:(
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="5" cy="5" r="2.5"/><circle cx="11" cy="5" r="2.5"/>
                    <path d="M1 13c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5"/><path d="M11 9.5c2.2 0 4 1.5 4 3.5"/>
                  </svg>
                )},
                { val:"individual", label:"Individual",  icon:(
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/>
                  </svg>
                )},
              ].map(({ val, label, icon }) => (
                <button key={val} type="button" onClick={() => field("splitType", val)}
                  style={{ flex:1, padding:"9px 0", fontSize:13, fontWeight:600, border:"none", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                    background: form.splitType === val ? "var(--accent)" : "var(--card)",
                    color: form.splitType === val ? "#fff" : "var(--muted)" }}>
                  {icon}{label}
                </button>
              ))}
            </div>
          </div>

          {form.splitType === "individual" && (
            <div className="field full">
              <label>Assigned to</label>
              <select value={form.assignedTo} onChange={(e) => field("assignedTo", e.target.value)} required>
                <option value="">— select person —</option>
                {members.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}

        </div>
        <div className="modalactions">
          <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn primary" disabled={busy} onClick={handleSubmit}>
            {busy ? "Saving…" : initial ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Trip selector (landing) ───────────────────────────────────────────────────
function TripSelector({ trips, onSelect, onCreate }) {
  const [creating, setCreating] = useState(false);
  const [name,     setName]     = useState("");
  const [dest,     setDest]     = useState("");
  const [busy,     setBusy]     = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try { await onCreate(name.trim(), dest.trim()); setName(""); setDest(""); setCreating(false); }
    catch (err) { alert(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ maxWidth:560 }}>
      <p style={{ margin:"0 0 20px", color:"var(--muted)", fontSize:14 }}>
        Track expenses per trip. Invite companions — they can view, you control edits.
      </p>

      {trips.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
          {trips.map((t) => (
            <button key={t.id} className="card"
              style={{ textAlign:"left", cursor:"pointer", display:"flex", alignItems:"center",
                justifyContent:"space-between", padding:"14px 16px",
                border:"1.5px solid var(--line)", background:"var(--card)",
                borderRadius:10, width:"100%" }}
              onClick={() => onSelect(t.id)}>
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>{t.name}</div>
                {t.destination && <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>📍 {t.destination}</div>}
                <div style={{ fontSize:11, color:"var(--muted)", marginTop:3 }}>
                  {t.memberEmails?.length ? `${t.memberEmails.length + 1} member${t.memberEmails.length > 0 ? "s" : ""}` : "Only you"}
                </div>
              </div>
              <span style={{ fontSize:12, color:"var(--accent)", fontWeight:600 }}>Open →</span>
            </button>
          ))}
        </div>
      )}

      {!creating ? (
        <button className="btn primary" onClick={() => setCreating(true)}>
          <IconPlus /> New trip
        </button>
      ) : (
        <form onSubmit={handleCreate}
          style={{ background:"var(--card)", border:"1.5px solid var(--line)", borderRadius:10,
            padding:"16px 18px", display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ fontWeight:700, fontSize:14 }}>New trip</div>
          <input className="input" placeholder="Trip name (e.g. Japan 2026)" value={name}
            onChange={(e) => setName(e.target.value)} autoFocus required />
          <input className="input" placeholder="Destination (optional)" value={dest}
            onChange={(e) => setDest(e.target.value)} />
          <div style={{ display:"flex", gap:8 }}>
            <button type="submit" className="btn primary" disabled={busy || !name.trim()}>
              {busy ? "Creating…" : "Create"}
            </button>
            <button type="button" className="btn secondary" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Trip Dashboard ────────────────────────────────────────────────────────────
function TripDashboard({ trip, expenses, isOwner, loading, onAdd, onUpdate, onDelete, onBack, onManageMembers }) {
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  // full member list for assignment picker
  const memberNames = useMemo(() => {
    const ownerName = trip.ownerEmail?.split("@")[0] || "Owner";
    const emails    = (trip.memberEmails || []).map((e) => e.split("@")[0]);
    const guests    = trip.guestNames || [];
    return [ownerName, ...emails, ...guests];
  }, [trip]);

  const memberCount = memberNames.length;

  const totals = useMemo(() => {
    const map = {};
    TRAVEL_CATEGORIES.forEach((c) => { map[c.key] = 0; });
    expenses.forEach((e) => { if (map[e.cat] !== undefined) map[e.cat] += e.amount; else map[e.cat] = e.amount; });
    return map;
  }, [expenses]);

  // shared = split among all; individual = belongs to one person only
  const sharedTotal     = useMemo(() => expenses.filter((e) => e.splitType !== "individual").reduce((s, e) => s + e.amount, 0), [expenses]);
  const individualTotal = useMemo(() => expenses.filter((e) => e.splitType === "individual").reduce((s, e) => s + e.amount, 0), [expenses]);
  const grandTotal      = sharedTotal + individualTotal;
  const perPersonShared = memberCount > 0 ? sharedTotal / memberCount : 0;

  const sorted = useMemo(() =>
    [...expenses].sort((a, b) => (b.date || "").localeCompare(a.date || "")),
  [expenses]);

  function openEdit(exp) { setEditTarget(exp); setModalOpen(true); }
  function openAdd()     { setEditTarget(null); setModalOpen(true); }

  async function handleSave(data) {
    if (editTarget) await onUpdate(editTarget.id, data);
    else await onAdd(data);
  }

  const catColor = (key) => TRAVEL_CATEGORIES.find((c) => c.key === key)?.color || "#94a3b8";
  const catIcon  = (key) => TRAVEL_CATEGORIES.find((c) => c.key === key)?.icon  || "others";
  const fmtDate  = (d)   => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) : "—";

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18, flexWrap:"wrap" }}>
        <button className="btn secondary" style={{ padding:"6px 12px", fontSize:13 }} onClick={onBack}>← Back</button>
        <div style={{ flex:1 }}>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800 }}>{trip.name}</h2>
          {trip.destination && <div style={{ fontSize:13, color:"var(--muted)" }}>📍 {trip.destination}</div>}
        </div>
        <button className="btn secondary" style={{ fontSize:13 }} onClick={onManageMembers}>
          Members ({memberCount})
        </button>
        {isOwner && (
          <button className="btn primary" onClick={openAdd}><IconPlus /> Add expense</button>
        )}
      </div>

      {/* Category totals — horizontal scroll strip */}
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:20, scrollbarWidth:"none" }}>
        {TRAVEL_CATEGORIES.map((c) => (
          <div key={c.key} style={{
            flexShrink:0, minWidth:110, background:"var(--card)",
            border:"1px solid var(--line)", borderRadius:12,
            borderTop:`3px solid ${c.color}`, padding:"10px 12px",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
              <TravelCatIcon type={c.icon} size={12} />
              <span style={{ fontSize:10, color:"var(--muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:".04em" }}>{c.key}</span>
            </div>
            <div style={{ fontWeight:800, fontSize:15, color: totals[c.key] ? "var(--text)" : "var(--muted)" }}>
              {money(totals[c.key] || 0)}
            </div>
          </div>
        ))}
      </div>

      {/* Expense list */}
      {loading && <div style={{ color:"var(--muted)", fontSize:14 }}>Loading…</div>}
      {!loading && expenses.length === 0 && (
        <div style={{ color:"var(--muted)", fontSize:14, textAlign:"center", padding:"32px 0" }}>
          No expenses yet.{isOwner ? " Add one to get started." : ""}
        </div>
      )}

      {!loading && expenses.length > 0 && (
        <div className="card" style={{ padding:0, marginBottom:16 }}>
          {/* ── Desktop table ── */}
          <div className="tx-table-desktop" style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"var(--bg)", borderBottom:"2px solid var(--line)" }}>
                  <th style={th}>Category</th>
                  <th style={th}>Description</th>
                  <th style={th}>Date</th>
                  <th style={{ ...th, textAlign:"right" }}>Amount</th>
                  <th style={{ ...th, textAlign:"right" }}>Split / Assigned to</th>
                  {isOwner && <th style={th}></th>}
                </tr>
              </thead>
              <tbody>
                {sorted.map((exp, i) => {
                  const isIndividual = exp.splitType === "individual";
                  return (
                    <tr key={exp.id} style={{ borderBottom: i < sorted.length - 1 ? "1px solid var(--line)" : "none", background: i % 2 === 0 ? "var(--card)" : "var(--bg)" }}>
                      <td style={td}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ width:22, height:22, borderRadius:6, background:"var(--accent-bg)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <TravelCatIcon type={catIcon(exp.cat)} size={12} />
                          </span>
                          <span style={{ background: catColor(exp.cat) + "22", color: catColor(exp.cat), borderRadius:4, padding:"2px 6px", fontWeight:600, fontSize:11, whiteSpace:"nowrap" }}>{exp.cat}</span>
                        </div>
                      </td>
                      <td style={td}>{exp.desc || <span style={{ color:"var(--muted)" }}>—</span>}</td>
                      <td style={{ ...td, whiteSpace:"nowrap", color:"var(--muted)" }}>{fmtDate(exp.date)}</td>
                      <td style={{ ...td, textAlign:"right", fontWeight:700 }}>{money(exp.amount)}</td>
                      <td style={{ ...td, textAlign:"right" }}>
                        {isIndividual ? (
                          <span style={{ background:"#f1f5f9", color:"var(--text)", borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>👤 {exp.assignedTo}</span>
                        ) : (
                          <span style={{ color:"var(--accent)", fontWeight:600 }}>
                            {money(exp.amount / memberCount)}<span style={{ fontSize:10, color:"var(--muted)", marginLeft:3 }}>÷{memberCount}</span>
                          </span>
                        )}
                      </td>
                      {isOwner && (
                        <td style={{ ...td, whiteSpace:"nowrap" }}>
                          <button style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted)", padding:"2px 4px" }} onClick={() => openEdit(exp)} title="Edit"><IconEdit /></button>
                          <button style={{ background:"none", border:"none", cursor:"pointer", color:"var(--danger)", padding:"2px 4px" }} onClick={() => { if (confirm("Delete this expense?")) onDelete(exp.id); }} title="Delete"><IconTrash /></button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background:"var(--accent-bg)", borderTop:"2px solid var(--accent-soft, var(--line))" }}>
                  <td style={{ ...td, fontWeight:800, color:"var(--accent)" }} colSpan={3}>
                    {expenses.length} item{expenses.length !== 1 ? "s" : ""}
                    {individualTotal > 0 && <span style={{ fontSize:11, color:"var(--muted)", fontWeight:400, marginLeft:8 }}>(shared: {money(sharedTotal)} · individual: {money(individualTotal)})</span>}
                  </td>
                  <td style={{ ...td, textAlign:"right", fontWeight:900, fontSize:15 }}>{money(grandTotal)}</td>
                  <td style={{ ...td, textAlign:"right", fontWeight:900, fontSize:15, color:"var(--accent)" }}>
                    {money(perPersonShared)}<div style={{ fontSize:10, color:"var(--muted)", fontWeight:400 }}>shared ÷{memberCount}</div>
                  </td>
                  {isOwner && <td style={td}></td>}
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="tx-card-list" style={{ padding:"0 4px" }}>
            {sorted.map((exp) => {
              const isIndividual = exp.splitType === "individual";
              return (
                <div key={exp.id} style={{
                  padding:"14px 8px", borderBottom:"1px solid var(--line)",
                  display:"flex", flexDirection:"column", gap:8,
                }}>
                  {/* Row 1: desc + amount */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <span style={{
                        background: catColor(exp.cat) + "22", color: catColor(exp.cat),
                        borderRadius:4, padding:"2px 7px", fontWeight:700, fontSize:11,
                        marginRight:7, whiteSpace:"nowrap",
                      }}>{exp.cat}</span>
                      <span style={{ fontWeight:600, fontSize:14, color:"var(--text)" }}>{exp.desc || "—"}</span>
                    </div>
                    <span style={{ fontWeight:800, fontSize:15, color:"var(--accent)", whiteSpace:"nowrap", flexShrink:0 }}>
                      {money(exp.amount)}
                    </span>
                  </div>
                  {/* Row 2: date + split + actions */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                    <span style={{ fontSize:12, color:"var(--muted)" }}>{fmtDate(exp.date)}</span>
                    {isIndividual
                      ? <span style={{ fontSize:12, color:"var(--muted)" }}>👤 {exp.assignedTo}</span>
                      : <span style={{ fontSize:12, color:"var(--accent)", fontWeight:600 }}>{money(exp.amount / memberCount)} each</span>
                    }
                    {isOwner && (
                      <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
                        <button style={{ background:"var(--accent-bg)", border:"none", borderRadius:6, cursor:"pointer", color:"var(--accent)", padding:"4px 10px", fontSize:12, fontWeight:600 }}
                          onClick={() => openEdit(exp)}>Edit</button>
                        <button style={{ background:"#fdeaea", border:"none", borderRadius:6, cursor:"pointer", color:"var(--danger)", padding:"4px 10px", fontSize:12, fontWeight:600 }}
                          onClick={() => { if (confirm("Delete this expense?")) onDelete(exp.id); }}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Total row */}
            <div style={{ display:"flex", justifyContent:"space-between", padding:"14px 8px", fontWeight:800, fontSize:15, borderTop:"2px solid var(--line)", marginTop:4 }}>
              <span style={{ color:"var(--muted)" }}>{expenses.length} item{expenses.length !== 1 ? "s" : ""}</span>
              <span style={{ color:"var(--accent)" }}>{money(grandTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Per-person breakdown */}
      {!loading && expenses.length > 0 && memberCount > 1 && (
        <div className="card" style={{ padding:0, marginTop:16 }}>
          <div style={{ padding:"12px 16px", borderBottom:"2px solid var(--line)", fontWeight:800, fontSize:14 }}>
            Per-person Breakdown
          </div>
          {/* Desktop */}
          <div className="tx-table-desktop" style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"var(--bg)", borderBottom:"1px solid var(--line)" }}>
                  <th style={th}>Person</th>
                  <th style={{ ...th, textAlign:"right" }}>Shared portion</th>
                  <th style={{ ...th, textAlign:"right" }}>Individual</th>
                  <th style={{ ...th, textAlign:"right" }}>Total owed</th>
                </tr>
              </thead>
              <tbody>
                {memberNames.map((name, i) => {
                  const indiv = expenses.filter((e) => e.splitType === "individual" && e.assignedTo === name).reduce((s, e) => s + e.amount, 0);
                  const total = perPersonShared + indiv;
                  return (
                    <tr key={name} style={{ borderBottom: i < memberNames.length - 1 ? "1px solid var(--line)" : "none", background: i % 2 === 0 ? "var(--card)" : "var(--bg)" }}>
                      <td style={td}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ width:26, height:26, borderRadius:"50%", flexShrink:0, background: i === 0 ? "var(--accent)" : "var(--accent-bg)", color: i === 0 ? "#fff" : "var(--accent)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800 }}>{name[0].toUpperCase()}</span>
                          <span style={{ fontWeight:600 }}>{name}</span>
                          {i === 0 && <span style={{ fontSize:10, color:"var(--accent)", fontWeight:700 }}>owner</span>}
                        </div>
                      </td>
                      <td style={{ ...td, textAlign:"right", color:"var(--muted)" }}>{money(perPersonShared)}</td>
                      <td style={{ ...td, textAlign:"right", color: indiv > 0 ? "var(--text)" : "var(--muted)" }}>{indiv > 0 ? money(indiv) : "—"}</td>
                      <td style={{ ...td, textAlign:"right", fontWeight:800, color:"var(--accent)", fontSize:14 }}>{money(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background:"var(--accent-bg)", borderTop:"2px solid var(--accent-soft, var(--line))" }}>
                  <td style={{ ...td, fontWeight:800, color:"var(--accent)" }}>Grand Total</td>
                  <td style={{ ...td, textAlign:"right", fontWeight:700 }}>{money(sharedTotal)}</td>
                  <td style={{ ...td, textAlign:"right", fontWeight:700 }}>{money(individualTotal)}</td>
                  <td style={{ ...td, textAlign:"right", fontWeight:900, fontSize:15, color:"var(--accent)" }}>{money(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="tx-card-list" style={{ padding:"0 4px" }}>
            {memberNames.map((name, i) => {
              const indiv = expenses.filter((e) => e.splitType === "individual" && e.assignedTo === name).reduce((s, e) => s + e.amount, 0);
              const total = perPersonShared + indiv;
              return (
                <div key={name} style={{ padding:"14px 8px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ width:36, height:36, borderRadius:"50%", flexShrink:0,
                    background: i === 0 ? "var(--accent)" : "var(--accent-bg)",
                    color: i === 0 ? "#fff" : "var(--accent)",
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800 }}>
                    {name[0].toUpperCase()}
                  </span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontWeight:700, fontSize:14 }}>{name}</span>
                      {i === 0 && <span style={{ fontSize:10, color:"var(--accent)", fontWeight:700, background:"var(--accent-bg)", padding:"1px 6px", borderRadius:8 }}>owner</span>}
                    </div>
                    <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>
                      Shared: {money(perPersonShared)}
                      {indiv > 0 && <span style={{ marginLeft:8 }}>· Individual: {money(indiv)}</span>}
                    </div>
                  </div>
                  <span style={{ fontWeight:800, fontSize:15, color:"var(--accent)", flexShrink:0 }}>{money(total)}</span>
                </div>
              );
            })}
            <div style={{ display:"flex", justifyContent:"space-between", padding:"14px 8px", fontWeight:800, fontSize:15, borderTop:"2px solid var(--line)" }}>
              <span style={{ color:"var(--accent)" }}>Grand Total</span>
              <span style={{ color:"var(--accent)" }}>{money(grandTotal)}</span>
            </div>
          </div>
        </div>
      )}

      <ExpenseModal
        open={modalOpen}
        members={memberNames}
        initial={editTarget ? {
          cat: editTarget.cat, desc: editTarget.desc, amount: editTarget.amount,
          date: editTarget.date, splitType: editTarget.splitType || "shared",
          assignedTo: editTarget.assignedTo || "",
        } : null}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
      />
    </div>
  );
}

// table cell styles
const th = { padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700,
  color:"var(--muted)", textTransform:"uppercase", letterSpacing:.4, whiteSpace:"nowrap" };
const td = { padding:"10px 14px", verticalAlign:"middle" };

// ── Members panel ─────────────────────────────────────────────────────────────
function MembersPanel({ trip, isOwner, userEmail, onInvite, onRemove, onAddGuest, onRemoveGuest, onRename, onDelete, onBack }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteBusy,  setInviteBusy]  = useState(false);
  const [guestName,   setGuestName]   = useState("");
  const [guestBusy,   setGuestBusy]   = useState(false);
  const [renaming,    setRenaming]    = useState(false);
  const [newName,     setNewName]     = useState(trip.name);

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteBusy(true);
    try { await onInvite(trip.id, inviteEmail.trim()); setInviteEmail(""); }
    catch (err) { alert(err.message); }
    finally { setInviteBusy(false); }
  }

  async function handleAddGuest(e) {
    e.preventDefault();
    if (!guestName.trim()) return;
    setGuestBusy(true);
    try { await onAddGuest(trip.id, guestName.trim()); setGuestName(""); }
    catch (err) { alert(err.message); }
    finally { setGuestBusy(false); }
  }

  async function handleRename(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try { await onRename(trip.id, newName.trim()); setRenaming(false); }
    catch (err) { alert(err.message); }
  }

  async function handleDelete() {
    if (!confirm(`Delete trip "${trip.name}" and all its expenses? This cannot be undone.`)) return;
    try { await onDelete(trip.id); }
    catch (err) { alert(err.message); }
  }

  const allMembers = [
    { email: trip.ownerEmail, label: trip.ownerEmail, isOwner: true,  isPending: false, isGuest: false },
    ...(trip.memberEmails || []).map((email) => ({ email, label: email, isOwner: false, isPending: false, isGuest: false })),
    ...(trip.pendingEmails || []).map((email) => ({ email, label: email, isOwner: false, isPending: true,  isGuest: false })),
    ...(trip.guestNames   || []).map((name)  => ({ email: name, label: name,  isOwner: false, isPending: false, isGuest: true  })),
  ];

  return (
    <div style={{ maxWidth:520 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <button className="btn secondary" style={{ padding:"6px 12px", fontSize:13 }} onClick={onBack}>← Back</button>
        <h2 style={{ margin:0, fontSize:18, fontWeight:800 }}>Members — {trip.name}</h2>
      </div>

      {/* Rename */}
      {isOwner && (
        <div className="card" style={{ padding:"14px 18px", marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>Trip name</div>
          {renaming ? (
            <form onSubmit={handleRename} style={{ display:"flex", gap:8 }}>
              <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus style={{ flex:1 }} />
              <button type="submit" className="btn primary" style={{ fontSize:13 }}>Save</button>
              <button type="button" className="btn secondary" style={{ fontSize:13 }} onClick={() => setRenaming(false)}>Cancel</button>
            </form>
          ) : (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontWeight:600 }}>{trip.name}</span>
              <button className="btn secondary" style={{ fontSize:12 }} onClick={() => setRenaming(true)}>Rename</button>
            </div>
          )}
        </div>
      )}

      {/* Member list */}
      <div className="card" style={{ padding:"14px 18px", marginBottom:14 }}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>
          Members ({allMembers.length})
          {(trip.guestNames?.length > 0) && (
            <span style={{ fontSize:11, color:"var(--muted)", fontWeight:400, marginLeft:6 }}>
              includes {trip.guestNames.length} guest{trip.guestNames.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {allMembers.map(({ email, label, isOwner: isMO, isPending, isGuest }) => (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px", borderRadius:20,
              background: isGuest ? "var(--bg)" : isPending ? "var(--bg)" : "var(--accent-bg)",
              border: `1px solid ${isGuest || isPending ? "var(--line)" : "var(--accent-soft)"}`, fontSize:13 }}>
              <span style={{ width:24, height:24, borderRadius:"50%", flexShrink:0,
                background: isMO ? "var(--accent)" : isGuest ? "#e2e8f0" : isPending ? "var(--line)" : "var(--accent-soft)",
                color: isMO ? "#fff" : "var(--accent)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800 }}>
                {label[0].toUpperCase()}
              </span>
              <span style={{ color:"var(--text)", flex:1 }}>{label}</span>
              {isMO    && <span style={{ fontSize:11, color:"var(--accent)",  fontWeight:700 }}>owner</span>}
              {isPending && <span style={{ fontSize:11, color:"var(--muted)", fontWeight:600 }}>pending</span>}
              {isGuest && <span style={{ fontSize:11, color:"var(--muted)",   fontWeight:600 }}>guest</span>}
              {isOwner && !isMO && (
                <button onClick={() => {
                    if (!confirm(`Remove ${label}?`)) return;
                    isGuest ? onRemoveGuest(trip.id, label) : onRemove(trip.id, email);
                  }}
                  style={{ background:"none", border:"1px solid var(--line)", borderRadius:6, cursor:"pointer",
                    color:"var(--danger)", padding:"2px 7px", fontSize:11, fontWeight:600, marginLeft:4, lineHeight:1.4 }}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add guest by name */}
      {isOwner && (
        <div className="card" style={{ padding:"14px 18px", marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>Add guest (no account needed)</div>
          <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8 }}>
            Just a name — counts toward the split but doesn't need to sign up.
          </div>
          <form onSubmit={handleAddGuest} style={{ display:"flex", gap:8 }}>
            <input className="input" placeholder="e.g. Maria, John…" value={guestName}
              onChange={(e) => setGuestName(e.target.value)} style={{ flex:1 }} />
            <button type="submit" className="btn primary" disabled={guestBusy || !guestName.trim()} style={{ fontSize:13 }}>
              {guestBusy ? "…" : "Add"}
            </button>
          </form>
        </div>
      )}

      {/* Invite by email */}
      {isOwner && (
        <div className="card" style={{ padding:"14px 18px", marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>Invite by email (has account)</div>
          <form onSubmit={handleInvite} style={{ display:"flex", gap:8 }}>
            <input className="input" type="email" placeholder="companion@email.com"
              value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} style={{ flex:1 }} />
            <button type="submit" className="btn primary" disabled={inviteBusy || !inviteEmail.trim()} style={{ fontSize:13 }}>
              {inviteBusy ? "…" : "Invite"}
            </button>
          </form>
          <div style={{ fontSize:11, color:"var(--muted)", marginTop:6 }}>
            If they haven't signed up yet, they'll be added as pending and resolved on their next login.
          </div>
        </div>
      )}

      {/* Delete trip */}
      {isOwner && (
        <div className="card" style={{ padding:"14px 18px", borderColor:"var(--danger-soft, #fecaca)" }}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:4, color:"var(--danger)" }}>Danger zone</div>
          <p style={{ fontSize:13, color:"var(--muted)", margin:"0 0 10px" }}>
            Deleting the trip removes all expenses permanently.
          </p>
          <button className="btn" style={{ background:"var(--danger)", color:"#fff", fontSize:13 }} onClick={handleDelete}>
            Delete this trip
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Travel component (exported) ─────────────────────────────────────────
export default function Travel({ travelStore, userEmail }) {
  const {
    trips, selectedTripId, setSelectedTripId, selectedTrip, isOwner,
    expenses, loading,
    createTrip, renameTrip, deleteTrip,
    inviteMember, removeMember,
    addGuest, removeGuest,
    addExpense, updateExpense, deleteExpense,
  } = travelStore;

  const [panel, setPanel] = useState("list"); // "list" | "dashboard" | "members"

  function selectTrip(id) { setSelectedTripId(id); setPanel("dashboard"); }
  function goBack()        { setSelectedTripId(null); setPanel("list"); }

  if (panel === "members" && selectedTrip) {
    return (
      <MembersPanel
        trip={selectedTrip}
        isOwner={isOwner}
        userEmail={userEmail}
        onInvite={inviteMember}
        onRemove={removeMember}
        onAddGuest={addGuest}
        onRemoveGuest={removeGuest}
        onRename={renameTrip}
        onDelete={async (id) => { await deleteTrip(id); setPanel("list"); }}
        onBack={() => setPanel("dashboard")}
      />
    );
  }

  if (panel === "dashboard" && selectedTrip) {
    return (
      <TripDashboard
        trip={selectedTrip}
        expenses={expenses}
        isOwner={isOwner}
        loading={loading}
        onAdd={addExpense}
        onUpdate={updateExpense}
        onDelete={deleteExpense}
        onBack={goBack}
        onManageMembers={() => setPanel("members")}
      />
    );
  }

  return (
    <TripSelector
      trips={trips}
      onSelect={selectTrip}
      onCreate={async (name, dest) => { await createTrip(name, dest); setPanel("dashboard"); }}
    />
  );
}

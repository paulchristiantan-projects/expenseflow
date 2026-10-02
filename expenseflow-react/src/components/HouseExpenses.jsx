import { useState, useMemo } from "react";
import { money, monthLabel } from "../helpers";
import { IconTrash, IconEdit, IconPlus } from "./Icons";

// ── Constants ────────────────────────────────────────────────────────────────
export const HOUSE_CATEGORIES = [
  { key: "Association Dues",  icon: "dues"        },
  { key: "Electricity",       icon: "electricity" },
  { key: "Food & Essentials", icon: "grocery"     },
  { key: "House Payment",     icon: "house"       },
  { key: "Internet",          icon: "internet"    },
  { key: "Other Expense",     icon: "other"       },
  { key: "School Fees",       icon: "tuition"     },
  { key: "Water",             icon: "water"       },
];

// Canonical color per category — shared by dashboard, charts, donut
export const HOUSE_CAT_COLORS = {
  "Electricity":      "#4a5adf",
  "Water":            "#60a5fa",
  "Internet":         "#a78bfa",
  "House Payment":    "#f59e0b",
  "Association Dues": "#10b981",
  "Food & Essentials": "#f97316",
  "School Fees":      "#ec4899",
  "Other Expense":    "#94a3b8",
};

export function HouseCatIcon({ type, size = 16 }) {
  const s = { width: size, height: size, display: "inline-block", flexShrink: 0 };
  const p = { fill: "none", stroke: "var(--accent)", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (type) {
    case "electricity": return (
      <svg style={s} viewBox="0 0 16 16" {...p}>
        <path d="M9 1L4 9h5l-2 6 7-8H9z" fill="var(--accent-bg)"/>
      </svg>
    );
    case "water": return (
      <svg style={s} viewBox="0 0 16 16" {...p}>
        <path d="M8 2C8 2 3 7.5 3 10.5a5 5 0 0 0 10 0C13 7.5 8 2 8 2z" fill="var(--accent-bg)"/>
      </svg>
    );
    case "internet": return (
      <svg style={s} viewBox="0 0 16 16" {...p}>
        <circle cx="8" cy="8" r="6"/>
        <path d="M2 8h12M8 2c-2 2-3 4-3 6s1 4 3 6M8 2c2 2 3 4 3 6s-1 4-3 6"/>
      </svg>
    );
    case "house": return (
      <svg style={s} viewBox="0 0 16 16" {...p}>
        <path d="M1 7l7-5 7 5v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z" fill="var(--accent-bg)"/>
        <path d="M5.5 14V9h5v5"/>
      </svg>
    );
    case "dues": return (
      <svg style={s} viewBox="0 0 16 16" {...p}>
        <rect x="1" y="5" width="14" height="9" rx="1.5" fill="var(--accent-bg)" stroke="var(--accent)"/>
        <path d="M4 5V3.5A2.5 2.5 0 0 1 6.5 1h3A2.5 2.5 0 0 1 12 3.5V5"/>
        <circle cx="8" cy="9.5" r="1.5" fill="var(--accent)" stroke="none"/>
      </svg>
    );
    case "grocery": return (
      <svg style={s} viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 2h1.5l2 7h7l1.5-5H5" fill="var(--accent-bg)" stroke="var(--accent)"/>
        <circle cx="6.5" cy="12.5" r="1.2" fill="var(--accent)" stroke="none"/>
        <circle cx="11" cy="12.5" r="1.2" fill="var(--accent)" stroke="none"/>
      </svg>
    );
    case "tuition": return (
      <svg style={s} viewBox="0 0 16 16" {...p}>
        <path d="M8 1L1 5l7 4 7-4-7-4z" fill="var(--accent-bg)"/>
        <path d="M4 6.5v4a4 4 0 0 0 8 0v-4"/>
        <line x1="1" y1="5" x2="1" y2="10"/>
      </svg>
    );
    case "other": return (
      <svg style={s} viewBox="0 0 16 16" {...p}>
        <circle cx="8" cy="8" r="6" fill="var(--accent-bg)" stroke="var(--accent)"/>
        <line x1="8" y1="5" x2="8" y2="8"/>
        <circle cx="8" cy="11" r="0.75" fill="var(--accent)" stroke="none"/>
      </svg>
    );
    default: return null;
  }
}

export const GROCERY_SUBCATS = ["Food", "Mineral", "Others", "Dad", "Precious Allowance"];

export const TUITION_SUBCATS = ["Tuition Fee", "Allowance", "Project", "Books/Supplies", "Uniform", "Others"];

export const OTHER_EXPENSE_SUBCATS = ["Aircon Cleaning", "House Repair", "Appliance Repair", "Medical", "Transportation", "Others"];

export const USAGE_CONFIG = {
  "Electricity": { label: "kWh used",     placeholder: "e.g. 312.5", unit: "kWh" },
  "Water":       { label: "Cubic meters", placeholder: "e.g. 14.2",  unit: "m³"  },
};

/**
 * Returns per-category totals for house bills, but overrides Groceries/Market
 * with the sum of grocery items when any items exist for that month.
 * allHouse: all house bill entries, allGrocery: all grocery items, month: "YYYY-MM"
 */
// Fallback palette for custom (user-added) categories with no fixed color.
const CUSTOM_CAT_PALETTE = ["#8b5cf6", "#06b6d4", "#f43f5e", "#84cc16", "#eab308", "#14b8a6", "#f97316", "#6366f1"];
export function houseCatColor(key, index = 0) {
  return HOUSE_CAT_COLORS[key] || CUSTOM_CAT_PALETTE[index % CUSTOM_CAT_PALETTE.length];
}

// Merge built-in house categories with a house's custom categories.
export function houseCategoriesWith(customCats = []) {
  const seen = new Map(HOUSE_CATEGORIES.map((c) => [c.key.toLowerCase(), c]));
  for (const name of customCats) {
    const clean = (typeof name === "string" ? name : name?.key || "").trim();
    if (clean && !seen.has(clean.toLowerCase())) seen.set(clean.toLowerCase(), { key: clean, icon: "other" });
  }
  return [...seen.values()];
}

export function effectiveHouseBycat(houseEntries, groceryEntries, tuitionEntries = [], otherEntries = [], extraCats = []) {
  const cats = houseCategoriesWith(extraCats);
  const bycat = Object.fromEntries(cats.map(({ key }) => [key, 0]));
  houseEntries.forEach((x) => {
    // Map old key to new key for backwards compatibility
    const cat = x.cat === "Groceries/Market" ? "Food & Essentials"
              : x.cat === "Tuition"          ? "School Fees"
              : x.cat;
    // Include custom categories that aren't in the base map.
    if (bycat[cat] === undefined) bycat[cat] = 0;
    bycat[cat] += x.amount;
  });
  const groceryTotal  = groceryEntries.reduce((s, x) => s + x.amount, 0);
  const tuitionTotal  = tuitionEntries.reduce((s, x) => s + x.amount, 0);
  const otherTotal    = otherEntries.reduce((s, x) => s + x.amount, 0);
  if (groceryEntries.length > 0) bycat["Food & Essentials"] = groceryTotal;
  if (tuitionEntries.length > 0) bycat["School Fees"]       = tuitionTotal;
  if (otherEntries.length  > 0)  bycat["Other Expense"]    = otherTotal;
  return bycat;
}

const YEAR_OPTIONS = (() => {
  const now = new Date().getFullYear();
  const out = [];
  for (let y = now + 1; y >= 2020; y--) out.push(y);
  return out;
})();

const MONTH_NAMES = {
  january:1,february:2,march:3,april:4,may:5,june:6,
  july:7,august:8,september:9,october:10,november:11,december:12,
  jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
};

// ── Parsers ──────────────────────────────────────────────────────────────────
// Normalize legacy category names to current ones
export function normalizeCat(cat) {
  if (cat === "Groceries/Market") return "Food & Essentials";
  if (cat === "Tuition")          return "School Fees";
  return cat;
}
const CAT_ALIASES = {
  "groceries/market": "Food & Essentials",
  "groceries":        "Food & Essentials",
  "grocery":          "Food & Essentials",
  "food":             "Food & Essentials",
  "tuition":          "School Fees",
};

function matchCat(raw) {
  const s = (raw || "").trim().toLowerCase();
  if (CAT_ALIASES[s]) return CAT_ALIASES[s];
  return HOUSE_CATEGORIES.find((c) => c.key.toLowerCase() === s)?.key || null;
}
function matchSubcat(raw) {
  const s = (raw || "").trim().toLowerCase();
  return GROCERY_SUBCATS.find((c) => c.toLowerCase() === s) || null;
}

export function parseHouseBulk(text, defaultYear = new Date().getFullYear()) {
  const rows = [], errors = [];
  let currentCat = null, currentYear = defaultYear;
  (text || "").split(/\r?\n/).forEach((line, i) => {
    const t = line.trim();
    if (!t || t.startsWith("#")) return;
    if (/^(20\d{2})$/.test(t)) { currentYear = Number(t); return; }
    const asCat = matchCat(t);
    if (asCat) { currentCat = asCat; return; }
    const m = t.match(/^([a-z]+)[,\s]+([0-9,]+(?:\.\d+)?)(?:[,\s]+([0-9,]+(?:\.\d+)?))?$/i);
    if (m) {
      const moNum = MONTH_NAMES[m[1].toLowerCase()];
      if (!moNum) { errors.push(`Line ${i+1}: unknown month "${m[1]}"`); return; }
      const amount = Number(m[2].replace(/,/g,""));
      if (!amount) return;
      if (!currentCat) { errors.push(`Line ${i+1}: amount before category`); return; }
      const month = `${currentYear}-${String(moNum).padStart(2,"0")}`;
      const usage = m[3] ? Number(m[3].replace(/,/g,"")) : null;
      rows.push({ cat: currentCat, amount, month, note: "", usage });
      return;
    }
    errors.push(`Line ${i+1}: unrecognized — "${t}"`);
  });
  return { rows, errors };
}

export function parseGroceryBulk(text, defaultYear = new Date().getFullYear()) {
  const rows = [], errors = [];
  let currentYear = defaultYear, currentMonth = null, currentSubcat = null;
  (text || "").split(/\r?\n/).forEach((line, i) => {
    const t = line.trim();
    if (!t || t.startsWith("#")) return;
    if (/^(20\d{2})$/.test(t)) { currentYear = Number(t); return; }
    const moNum = MONTH_NAMES[t.toLowerCase()];
    if (moNum) { currentMonth = `${currentYear}-${String(moNum).padStart(2,"0")}`; currentSubcat = null; return; }
    const asSubcat = matchSubcat(t);
    if (asSubcat) { currentSubcat = asSubcat; return; }
    const m = t.match(/^([\d,]+(?:\.\d+)?)\s*-\s*(.+)$/);
    if (m) {
      if (!currentMonth)  { errors.push(`Line ${i+1}: amount before month`); return; }
      if (!currentSubcat) { errors.push(`Line ${i+1}: amount before sub-category`); return; }
      const amount = Number(m[1].replace(/,/g,""));
      if (!amount) return;
      rows.push({ subcat: currentSubcat, desc: m[2].trim(), amount, month: currentMonth });
      return;
    }
    errors.push(`Line ${i+1}: unrecognized — "${t}"`);
  });
  return { rows, errors };
}

// ── Bills Import Panel ────────────────────────────────────────────────────────
const BILLS_EXAMPLE = `2026\n\nElectricity\nJanuary, 7302.54, 312.5\nFebruary, 6948.82, 298.1\n\nWater\nJanuary, 450, 14.2\nFebruary, 480, 15.1\n\nInternet\nJanuary, 1499\nFebruary, 1499\n\nHouse Payment\nJanuary, 8500\n\nAssociation Dues\nJanuary, 500\n\nFood & Essentials\nJanuary, 6200\n\nSchool Fees\nJanuary, 15000\n\nOther Expense\nJanuary, 2500`;

function BillsImportPanel({ onImport, onClose }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  function handlePreview() { setPreview(parseHouseBulk(text, year)); }
  async function handleImport() {
    if (!preview?.rows?.length) return;
    setBusy(true);
    try { await onImport(preview.rows); alert(`Imported ${preview.rows.length} entries.`); setText(""); setPreview(null); onClose(); }
    catch (e) { alert("Import failed: " + e.message); }
    finally { setBusy(false); }
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div className="notice" style={{ lineHeight:1.8 }}>
        Year → Category → <code>Month, amount[, usage]</code>.<br/>
        Electricity: 3rd value = kWh &nbsp;|&nbsp; Water: 3rd value = m³.<br/>
        Categories: {HOUSE_CATEGORIES.map(({ key }) => <code key={key} style={{ marginRight:4 }}>{key}</code>)}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <label style={{ fontSize:12, fontWeight:600, color:"var(--muted)" }}>Default year</label>
        <select value={year} onChange={(e) => { setYear(Number(e.target.value)); setPreview(null); }}>
          {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <textarea style={{ width:"100%", height:300, fontFamily:"monospace", fontSize:13 }}
        placeholder={BILLS_EXAMPLE} value={text}
        onChange={(e) => { setText(e.target.value); setPreview(null); }}/>
      <div style={{ display:"flex", gap:8 }}>
        <button className="btn secondary" onClick={handlePreview} disabled={!text.trim()}>Preview</button>
        {preview?.rows?.length > 0 && (
          <button className="btn primary" onClick={handleImport} disabled={busy}>
            {busy ? "Importing…" : `Import ${preview.rows.length} rows`}
          </button>
        )}
      </div>
      {preview && <>
        {preview.errors.length > 0 && <div style={{ color:"var(--danger)", fontSize:13 }}>{preview.errors.map((e,i) => <div key={i}>⚠ {e}</div>)}</div>}
        {preview.rows.length > 0 && (
          <div className="tablewrap">
            <table>
              <thead><tr><th>Category</th><th>Month</th><th style={{ textAlign:"right" }}>Amount</th><th style={{ textAlign:"right" }}>Usage</th></tr></thead>
              <tbody>
                {preview.rows.map((r,i) => {
                  const uc = USAGE_CONFIG[r.cat];
                  return (
                    <tr key={i}>
                        <td style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <HouseCatIcon type={HOUSE_CATEGORIES.find((c) => c.key === r.cat)?.icon} size={14}/> {r.cat}
                        </td>
                      <td>{monthLabel(r.month, { month:"short", year:"numeric" })}</td>
                      <td className="amount">{money(r.amount)}</td>
                      <td style={{ textAlign:"right", color:"var(--muted)", fontSize:13 }}>{uc && r.usage != null ? `${r.usage} ${uc.unit}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </>}
    </div>
  );
}

// ── Grocery Import Panel ──────────────────────────────────────────────────────
const GROCERY_EXAMPLE = `2026\n\nJanuary\nFood\n250 - Rice\n180 - Chicken\n95 - Vegetables\n\nMineral\n120 - Distilled water\n\nOthers\n350 - Cleaning supplies\n\nDad\n500 - Allowance\n\nPrecious Allowance\n1500 - Monthly allowance\n\nFebruary\nFood\n280 - Rice\n200 - Pork`;

function GroceryImportPanel({ onImport, onClose }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  function handlePreview() { setPreview(parseGroceryBulk(text, year)); }
  async function handleImport() {
    if (!preview?.rows?.length) return;
    setBusy(true);
    try { await onImport(preview.rows); alert(`Imported ${preview.rows.length} grocery items.`); setText(""); setPreview(null); onClose(); }
    catch (e) { alert("Import failed: " + e.message); }
    finally { setBusy(false); }
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div className="notice" style={{ lineHeight:1.8 }}>
        Year → Month → Sub-category → <code>amount - description</code>.<br/>
        Sub-categories: {GROCERY_SUBCATS.map((s) => <code key={s} style={{ marginRight:4 }}>{s}</code>)}<br/>
        Blank lines and <code>#</code> comments ignored.
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <label style={{ fontSize:12, fontWeight:600, color:"var(--muted)" }}>Default year</label>
        <select value={year} onChange={(e) => { setYear(Number(e.target.value)); setPreview(null); }}>
          {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <textarea style={{ width:"100%", height:300, fontFamily:"monospace", fontSize:13 }}
        placeholder={GROCERY_EXAMPLE} value={text}
        onChange={(e) => { setText(e.target.value); setPreview(null); }}/>
      <div style={{ display:"flex", gap:8 }}>
        <button className="btn secondary" onClick={handlePreview} disabled={!text.trim()}>Preview</button>
        {preview?.rows?.length > 0 && (
          <button className="btn primary" onClick={handleImport} disabled={busy}>
            {busy ? "Importing…" : `Import ${preview.rows.length} items`}
          </button>
        )}
      </div>
      {preview && <>
        {preview.errors.length > 0 && <div style={{ color:"var(--danger)", fontSize:13 }}>{preview.errors.map((e,i) => <div key={i}>⚠ {e}</div>)}</div>}
        {preview.rows.length > 0 && (
          <div className="tablewrap">
            <table>
              <thead><tr><th>Sub-category</th><th>Month</th><th>Description</th><th style={{ textAlign:"right" }}>Amount</th></tr></thead>
              <tbody>
                {preview.rows.map((r,i) => (
                  <tr key={i}>
                    <td><span className="tag">{r.subcat}</span></td>
                    <td style={{ whiteSpace:"nowrap" }}>{monthLabel(r.month, { month:"short", year:"numeric" })}</td>
                    <td>{r.desc}</td>
                    <td className="amount">{money(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>}
    </div>
  );
}

// ── Combined Bulk Import Panel (exported for standalone page) ─────────────────
export function HouseBulkImport({ onImport, onImportGrocery }) {
  const [importTab, setImportTab] = useState("bills");
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, marginTop:12 }}>
      <div style={{ display:"flex", gap:6, borderBottom:"1px solid var(--line)", paddingBottom:10 }}>
        <button className={importTab === "bills" ? "btn primary" : "btn secondary"} style={{ fontSize:13 }} onClick={() => setImportTab("bills")}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight:5 }}><path d="M1 7l7-5 7 5v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z"/><path d="M5.5 15V9h5v6"/></svg>
          House Bills
        </button>
        <button className={importTab === "grocery" ? "btn primary" : "btn secondary"} style={{ fontSize:13 }} onClick={() => setImportTab("grocery")}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight:5 }}><path d="M2 2h1.5l2 7h7l1.5-5H5"/><circle cx="6.5" cy="12.5" r="1"/><circle cx="11" cy="12.5" r="1"/></svg>
          Food & Essentials
        </button>
      </div>
      {importTab === "bills"
        ? <BillsImportPanel onImport={onImport} onClose={() => {}} />
        : <GroceryImportPanel onImport={onImportGrocery} onClose={() => {}} />
      }
    </div>
  );
}

// ── Entry Modal ───────────────────────────────────────────────────────────────
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
              {HOUSE_CATEGORIES.map(({ key, icon }) => <option key={key} value={key}>{icon} {key}</option>)}
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

// ── Sub-item Modal (Tuition / Other Expense) ─────────────────────────────────
function SubItemModal({ title, subcats, month, onSave, onClose }) {
  const [subcat, setSubcat] = useState(subcats[0]);
  const [desc,   setDesc]   = useState("");
  const [amount, setAmount] = useState("");
  const S = { display:"block", width:"100%", marginTop:6, padding:"8px 10px", borderRadius:8, border:"1px solid var(--line)", fontSize:14, background:"var(--bg)", color:"var(--text)" };
  const L = { fontSize:12, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:.5 };
  function submit(e) {
    e.preventDefault();
    if (!desc.trim() || !amount || isNaN(Number(amount))) return;
    onSave({ subcat, desc: desc.trim(), amount: Number(amount), month });
  }
  return (
    <div className="modal open" onClick={onClose}>
      <div className="modalbox" style={{ maxWidth:420 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <h2 style={{ margin:0, fontSize:16 }}>Add {title} Item</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted)", fontSize:18, lineHeight:1, padding:4 }}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <label style={L}>Category
            <select value={subcat} onChange={(e) => setSubcat(e.target.value)} style={S}>
              {subcats.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label style={L}>Description
            <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. School enrollment fee" required autoFocus style={S}/>
          </label>
          <label style={L}>Amount (PHP)
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required style={S}/>
          </label>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:4 }}>
            <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary"><IconPlus size={14}/> Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sub-item list (shared by Tuition + Other Expense) ─────────────────────────
function SubItemSection({ title, icon, items, subcats, month, onAdd, onDel }) {
  const [open, setOpen] = useState(false);
  const total = items.reduce((s, x) => s + x.amount, 0);
  const bySubcat = Object.fromEntries(subcats.map((s) => [s, items.filter((x) => x.subcat === s)]));
  return (
    <>
      <div className="card">
        <div className="section-header" style={{ marginBottom: total > 0 ? 14 : 0 }}>
          <h2 style={{ display:"flex", alignItems:"center", gap:7 }}>{icon} {title} — {monthLabel(month)}</h2>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {total > 0 && <span style={{ fontWeight:700, color:"var(--accent)", fontSize:15 }}>{money(total)}</span>}
            <button className="btn primary" onClick={() => setOpen(true)}><IconPlus size={14}/> Add</button>
          </div>
        </div>
        {items.length > 0 ? (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {subcats.map((sub) => {
              const rows = bySubcat[sub];
              if (!rows?.length) return null;
              const subTotal = rows.reduce((s, x) => s + x.amount, 0);
              return (
                <div key={sub}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <span style={{ fontWeight:600, fontSize:13 }}>{sub}</span>
                    <span style={{ fontWeight:700, fontSize:13, color:"var(--accent)" }}>{money(subTotal)}</span>
                  </div>
                  <div className="tablewrap">
                    <table><tbody>
                      {rows.map((x) => (
                        <tr key={x.id}>
                          <td style={{ color:"var(--muted)", fontSize:13 }}>{x.desc}</td>
                          <td className="amount">{money(x.amount)}</td>
                          <td className="col-action-cell">
                            <button style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", padding:5, borderRadius:6, display:"inline-flex" }}
                              onMouseEnter={(e)=>e.currentTarget.style.color="var(--danger)"} onMouseLeave={(e)=>e.currentTarget.style.color="var(--muted)"}
                              onClick={() => { if(confirm(`Delete "${x.desc}"?`)) onDel(x.id, x.sharedDocId); }}><IconTrash/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody></table>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty">No {title.toLowerCase()} items yet for this month.</div>
        )}
      </div>
      {open && <SubItemModal title={title} subcats={subcats} month={month} onSave={async (d) => { await onAdd(d); setOpen(false); }} onClose={() => setOpen(false)}/>}
    </>
  );
}
const STACKED_CATS = [
  { key: "Electricity",      color: "#4a5adf" },
  { key: "Water",            color: "#60a5fa" },
  { key: "Internet",         color: "#a78bfa" },
  { key: "House Payment",    color: "#f59e0b" },
  { key: "Association Dues", color: "#10b981" },
  { key: "Food & Essentials", color: "#f97316" },
  { key: "School Fees",      color: "#ec4899" },
  { key: "Other Expense",    color: "#94a3b8" },
];

const LINE_CATS = [
  { key: "Electricity",      color: "#4a5adf" },
  { key: "Water",            color: "#60a5fa" },
  { key: "Food & Essentials", color: "#f97316" },
];

function LineTrendChart({ rows }) {
  const W = 600, H = 180, PL = 8, PR = 8, PT = 20, PB = 28;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const months = rows.map((r) => new Date(r.key + "-01").toLocaleString("en-US", { month: "short" }));
  const n = rows.length;

  const allVals = LINE_CATS.flatMap(({ key }) => rows.map((r) => r.bycat[key] || 0));
  const maxVal  = Math.max(...allVals, 1);

  function x(i) { return PL + (i / (n - 1)) * chartW; }
  function y(v) { return PT + chartH - (v / maxVal) * chartH; }

  function polyline(key) {
    return rows
      .map((r, i) => `${x(i)},${y(r.bycat[key] || 0)}`)
      .join(" ");
  }

  // Y-axis tick count
  const ticks = 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
      {/* Grid lines */}
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const val = (maxVal / ticks) * i;
        const yy  = y(val);
        return (
          <g key={i}>
            <line x1={PL} y1={yy} x2={W - PR} y2={yy} stroke="var(--line)" strokeWidth={0.8} />
            <text x={PL} y={yy - 3} fontSize={8} fill="var(--muted)" textAnchor="start">
              {val >= 1000 ? `₱${(val / 1000).toFixed(0)}k` : `₱${val.toFixed(0)}`}
            </text>
          </g>
        );
      })}

      {/* Lines + dots per category */}
      {LINE_CATS.map(({ key, color }) => {
        const pts = rows.map((r, i) => [x(i), y(r.bycat[key] || 0)]);
        // smooth bezier path
        const d = pts.reduce((acc, [px, py], i) => {
          if (i === 0) return `M ${px} ${py}`;
          const [ppx, ppy] = pts[i - 1];
          const cpx = (ppx + px) / 2;
          return `${acc} C ${cpx} ${ppy}, ${cpx} ${py}, ${px} ${py}`;
        }, "");
        return (
          <g key={key}>
            <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
            {pts.map(([px, py], i) => {
              const val = rows[i].bycat[key] || 0;
              return val > 0 ? (
                <g key={i}>
                  <circle cx={px} cy={py} r={3.5} fill={color} />
                  <circle cx={px} cy={py} r={6} fill={color} fillOpacity={0.12} />
                </g>
              ) : null;
            })}
          </g>
        );
      })}

      {/* X-axis labels */}
      {months.map((mo, i) => (
        <text key={i} x={x(i)} y={H - 4} fontSize={9} fill="var(--muted)" textAnchor="middle">{mo}</text>
      ))}
    </svg>
  );
}

// ── Monthly Summary (exported for standalone page) ───────────────────────────
export function HouseMonthlySummary({ allHouse, allGrocery = [], allTuition = [], allOtherExpense = [] }) {
  const availableYears = useMemo(() => {
    const years = [...new Set(allHouse.map((x) => x.month?.slice(0,4)).filter(Boolean))].sort().reverse();
    if (!years.length) years.push(String(new Date().getFullYear()));
    return years;
  }, [allHouse]);

  const [summaryYear, setSummaryYear] = useState(() => String(new Date().getFullYear()));
  const resolvedYear = availableYears.includes(summaryYear) ? summaryYear : availableYears[0];

  // All 12 months for the selected year
  const rows = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const key = `${resolvedYear}-${String(i + 1).padStart(2, "0")}`;
      const entries = allHouse.filter((x) => x.month === key);
      const groceryEntries  = allGrocery.filter((x) => x.month === key);
      const tuitionEntries  = allTuition.filter((x) => x.month === key);
      const otherEntries    = allOtherExpense.filter((x) => x.month === key);
      const bycat = effectiveHouseBycat(entries, groceryEntries, tuitionEntries, otherEntries);
      const total = Object.values(bycat).reduce((s, v) => s + v, 0);
      return { key, total, bycat, count: entries.length };
    });
  }, [allHouse, allGrocery, resolvedYear]);

  const yearTotal = rows.reduce((s, r) => s + r.total, 0);
  const active = rows.filter((r) => r.total > 0);
  const avg = active.length ? yearTotal / active.length : 0;
  const topMonth = [...rows].sort((a, b) => b.total - a.total)[0];

  // Category totals for the year
  const catTotals = useMemo(() =>
    Object.fromEntries(HOUSE_CATEGORIES.map(({ key: k }) => [k, rows.reduce((s, r) => s + r.bycat[k], 0)])),
  [rows]);
  const topCat = HOUSE_CATEGORIES.map(({ key }) => [key, catTotals[key]]).sort((a, b) => b[1] - a[1])[0];
  const maxCat = Math.max(...Object.values(catTotals), 1);
  const maxM = Math.max(...rows.map((r) => r.total), 1);

  if (!allHouse.length) return (
    <div className="card" style={{ marginTop: 0 }}>
      <div className="empty">No house expense data yet.</div>
    </div>
  );

  return (
    <>
      {/* Year picker */}
      <div className="section-title" style={{ marginBottom: 0 }}>
        <h2>Monthly Summary</h2>
        <select value={resolvedYear} onChange={(e) => setSummaryYear(e.target.value)} disabled={!availableYears.length}>
          {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* KPI cards */}
      <div className="grid">
        <div className="card kpi">
          <div className="label">Year total</div>
          <div className="value">{money(yearTotal)}</div>
          <small>{resolvedYear} · all bills</small>
        </div>
        <div className="card kpi">
          <div className="label">Avg / active month</div>
          <div className="value">{money(avg)}</div>
          <small>{active.length} active month{active.length === 1 ? "" : "s"}</small>
        </div>
        <div className="card kpi">
          <div className="label">Highest month</div>
          <div className="value">{topMonth?.total ? money(topMonth.total) : "—"}</div>
          <small>{topMonth?.total ? new Date(topMonth.key + "-01").toLocaleString("en-US", { month: "long" }) : "No data"}</small>
        </div>
        <div className="card kpi">
          <div className="label">Top category</div>
          <div className="value" style={{ fontSize: 16 }}>{topCat?.[1] > 0 ? topCat[0] : "—"}</div>
          <small>{topCat?.[1] > 0 ? money(topCat[1]) : "No data"}</small>
        </div>
      </div>

      {/* Charts row — stacked bar + category breakdown */}
      <div className="two">
        {/* Stacked bar chart */}
        <div className="card">
          <div className="section-title">
            <h2>{resolvedYear} Monthly Spending</h2>
            <span>{allHouse.filter((x) => x.month?.startsWith(resolvedYear)).length} entries</span>
          </div>
          {/* Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginBottom: 12 }}>
            {STACKED_CATS.map(({ key, color }) => (
              <span key={key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block", flexShrink: 0 }} />
                {key}
              </span>
            ))}
          </div>
          {/* Bars */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 140 }}>
            {rows.map((r) => {
              const mo = new Date(r.key + "-01").toLocaleString("en-US", { month: "short" });
              return (
                <div key={r.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%", justifyContent: "flex-end" }}>
                  <div style={{ width: "100%", display: "flex", flexDirection: "column-reverse", borderRadius: "4px 4px 0 0", overflow: "hidden" }}>
                    {STACKED_CATS.map(({ key, color }) => {
                      const val = r.bycat[key] || 0;
                      const h   = val ? Math.max(3, Math.round((val / maxM) * 120)) : 0;
                      return h > 0 ? <div key={key} style={{ width: "100%", height: h, background: color }} /> : null;
                    })}
                  </div>
                  <span style={{ fontSize: 9, color: "var(--muted)" }}>{mo}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category breakdown horizontal bars */}
        <div className="card">
          <div className="section-title"><h2>Category Breakdown</h2></div>
          {yearTotal > 0 ? (
            HOUSE_CATEGORIES.map(({ key, icon }) => (
              <div className="catrow" key={key}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <HouseCatIcon type={icon} size={13} /> {key}
                </span>
                <div className="track">
                  <div className="fill" style={{ width: `${(catTotals[key] / maxCat) * 100}%` }} />
                </div>
                <span className="catamt">{catTotals[key] ? money(catTotals[key]) : "—"}</span>
              </div>
            ))
          ) : (
            <div className="empty">No expenses yet.</div>
          )}
        </div>
      </div>

      {/* Line chart — Electricity, Water, Food & Essentials */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: 4 }}>
          <h2>Utility & Grocery Trends — {resolvedYear}</h2>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          {LINE_CATS.map(({ key, color }) => (
            <span key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--muted)" }}>
              <span style={{ width: 20, height: 2, background: color, display: "inline-block", borderRadius: 2 }} />
              {key}
            </span>
          ))}
        </div>
        <LineTrendChart rows={rows} year={resolvedYear} />
      </div>

      {/* Monthly breakdown table */}
      <div className="card tablecard">
        <div className="section-title">
          <h2>Monthly Breakdown</h2>
          <span>{resolvedYear}</span>
        </div>
        <div className="month-breakdown-list">
          {rows.map((r) => (
            <details key={r.key} className={`month-breakdown-row${r.total === 0 ? " empty-month" : ""}`}>
              <summary style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", cursor: r.total > 0 ? "pointer" : "default", listStyle: "none", gap: 8 }}>
                <span className="mbl-month">{new Date(r.key + "-01").toLocaleString("en-US", { month: "long" })}</span>
                <span className="mbl-total">{r.total ? money(r.total) : "—"}</span>
              </summary>
              {r.total > 0 && (
                <div style={{ paddingTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                  {HOUSE_CATEGORIES.map(({ key }) => r.bycat[key] ? (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", padding: "2px 0" }}>
                      <span>{key}</span>
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>{money(r.bycat[key])}</span>
                    </div>
                  ) : null)}
                </div>
              )}
            </details>
          ))}
          <div className="month-breakdown-row total-row">
            <span className="mbl-month">Year Total</span>
            <span className="mbl-total">{money(yearTotal)}</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function HouseExpenses({
  house, month, onAdd, onUpdate, onDelete, allHouse,
  grocery, allGrocery, onAddGrocery, onDelGrocery,
  tuition, onAddTuition, onDelTuition,
  otherExpense, onAddOther, onDelOther,
}) {
  const [modal, setModal] = useState(null);

  const monthTotal = house.reduce((s,x) => s+x.amount, 0);

  // Grocery breakdown for current month
  const groceryBySubcat = useMemo(() =>
    Object.fromEntries(GROCERY_SUBCATS.map((s) => [s, grocery.filter((x) => x.subcat === s)])),
  [grocery]);
  const groceryTotal = grocery.reduce((s,x) => s+x.amount, 0);

  async function handleSave(data) {
    if (modal?.id) await onUpdate(modal.id, { cat:data.category, amount:data.amount, note:data.note, usage:data.usage??null, month:data.month, sharedDocId:modal.sharedDocId });
    else await onAdd(data);
    setModal(null);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── House bills card ── */}
      <div className="card" style={{ marginTop:0 }}>
        <div className="section-header">
          <h2>House Expenses — {monthLabel(month)}</h2>
          <button className="btn primary" onClick={() => setModal("add")}><IconPlus size={14}/> Add</button>
        </div>
        <div className="notice">Track recurring household bills separately from daily spending.</div>
        <>
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
                <colgroup><col style={{ width:36 }}/><col/><col style={{ width:110 }}/><col/><col style={{ width:130 }}/><col style={{ width:48 }}/><col style={{ width:48 }}/></colgroup>
                <thead><tr><th></th><th>Category</th><th style={{ textAlign:"right" }}>Usage</th><th>Note</th><th style={{ textAlign:"right" }}>Amount</th><th></th><th></th></tr></thead>
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
                        <td className="col-action-cell">
                          <button style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", padding:5, borderRadius:6, display:"inline-flex" }} title="Edit"
                            onMouseEnter={(e)=>e.currentTarget.style.color="var(--accent)"} onMouseLeave={(e)=>e.currentTarget.style.color="var(--muted)"}
                            onClick={() => setModal(x)}><IconEdit size={14}/></button>
                        </td>
                        <td className="col-action-cell">
                          <button style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", padding:5, borderRadius:6, display:"inline-flex" }} title="Delete"
                            onMouseEnter={(e)=>e.currentTarget.style.color="var(--danger)"} onMouseLeave={(e)=>e.currentTarget.style.color="var(--muted)"}
                            onClick={() => { if(confirm(`Delete this ${displayCat} entry?`)) onDelete(x.id, x.sharedDocId); }}><IconTrash/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot><tr><td colSpan={4} style={{ fontWeight:700, textAlign:"right", paddingRight:8, fontSize:13 }}>Total</td><td className="amount" style={{ fontWeight:700, color:"var(--accent)" }}>{money(monthTotal)}</td><td/><td/></tr></tfoot>
              </table>
            </div>
          ) : <div className="empty">No house expenses yet for this month.</div>}
        </>
      </div>

      {/* ── Grocery breakdown for current month ── */}
      {grocery.length > 0 && (
        <div className="card">
          <div className="section-header" style={{ marginBottom:14 }}>
            <h2>Food & Essentials — {monthLabel(month)}</h2>
            {groceryTotal > 0 && <span style={{ fontWeight:700, color:"var(--accent)", fontSize:15 }}>{money(groceryTotal)}</span>}
          </div>
          {grocery.length === 0 ? (
            <div className="empty">No grocery items yet for this month.</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {GROCERY_SUBCATS.map((sub) => {
                const items = groceryBySubcat[sub];
                if (!items?.length) return null;
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
                              <td className="col-action-cell">
                                <button style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", padding:5, borderRadius:6, display:"inline-flex" }} title="Delete"
                                  onMouseEnter={(e)=>e.currentTarget.style.color="var(--danger)"} onMouseLeave={(e)=>e.currentTarget.style.color="var(--muted)"}
                                  onClick={() => { if(confirm(`Delete "${x.desc}"?`)) onDelGrocery(x.id, x.sharedDocId); }}><IconTrash/></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── School Fees ── */}
      <SubItemSection title="School Fees" icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 1L1 5l7 4 7-4-7-4z"/><path d="M4 6.5v4a4 4 0 0 0 8 0v-4"/></svg>} items={tuition} subcats={TUITION_SUBCATS} month={month} onAdd={onAddTuition} onDel={onDelTuition}/>

      {/* ── Other Expense ── */}
      <SubItemSection title="Other Expense" icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 11v.5"/></svg>} items={otherExpense} subcats={OTHER_EXPENSE_SUBCATS} month={month} onAdd={onAddOther} onDel={onDelOther}/>

      {modal && (
        <EntryModal initial={modal==="add"?null:modal} month={month} onSave={handleSave} onClose={() => setModal(null)}/>
      )}
    </div>
  );
}

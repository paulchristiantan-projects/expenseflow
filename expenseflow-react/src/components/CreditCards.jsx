import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { IconPlus, IconEdit, IconTrash } from "./Icons";
import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "./Toast";

// Render modal overlays at document.body so position:fixed is always relative
// to the viewport, never to a CSS-transformed ancestor inside .main
function Overlay({ open, children }) {
  if (!open) return null;
  return createPortal(children, document.body);
}

// ── Color presets ─────────────────────────────────────────────────────────────
const CARD_COLORS = {  indigo:  { grad: "linear-gradient(135deg,#5a6bf0,#7c8cff)",  label: "Indigo"   },
  crimson: { grad: "linear-gradient(135deg,#be123c,#f43f5e)",  label: "Crimson"  },
  ocean:   { grad: "linear-gradient(135deg,#0e7cc4,#38bdf8)",  label: "Ocean"    },
  navy:    { grad: "linear-gradient(135deg,#1e3a5f,#2563eb)",  label: "Navy"     },
  violet:  { grad: "linear-gradient(135deg,#7c3aed,#a78bfa)",  label: "Violet"   },
  emerald: { grad: "linear-gradient(135deg,#0f9d6e,#34d399)",  label: "Emerald"  },
  amber:   { grad: "linear-gradient(135deg,#d97706,#f59e0b)",  label: "Amber"    },
  teal:    { grad: "linear-gradient(135deg,#0d9488,#2dd4bf)",  label: "Teal"     },
  rose:    { grad: "linear-gradient(135deg,#e11d63,#fb7185)",  label: "Rose"     },
  slate:   { grad: "linear-gradient(135deg,#475569,#64748b)",  label: "Graphite" },
};

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n) {
  return "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ordinal(n) {
  const s = ["th","st","nd","rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function nextSoaDate(soaDay) {
  const today = new Date();
  const d = new Date(today.getFullYear(), today.getMonth(), soaDay);
  if (d <= today) d.setMonth(d.getMonth() + 1);
  return d;
}

function daysUntil(date) {
  return Math.ceil((date - new Date()) / 86400000);
}

/** "2024-11-18" → "Nov 18, 2024" */
function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  const MO = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${MO[+m - 1]} ${+d}, ${y}`;
}

const PREVIEW_COUNT = 8;

/** Normalize an amount string — handles typos like "37,a235.82" or "3.263.27" */
function parseAmountStr(raw) {
  let s = String(raw || "0").replace(/[₱\s]/g, "").replace(/[a-z]/gi, "").trim();
  const dots = (s.match(/\./g) || []).length;
  if (dots > 1) {
    // "3.263.27" → "3263.27"
    const parts = s.split(".");
    const dec = parts.pop();
    s = parts.join("") + "." + dec;
  }
  return parseFloat(s.replace(/,/g, "")) || 0;
}

/** Parse pasted payment lines: "5,466.32 - 08/16/2022" or "20,600.04 08/25/2023" */
function parsePastedPayments(text) {
  const rows = [], errors = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    // Try with dash separator (may have trailing marker like "(x)")
    let m = line.match(/^([₱\d,.\s a-z]+?)\s*-+\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*(\(x\))?$/i);
    if (!m) m = line.match(/^([₱\d,.]+)\s+(\d{1,2}\/\d{1,2}\/\d{4})(\s+\(x\))?$/);
    if (m) {
      const amount = parseAmountStr(m[1]);
      const [mo, dy, yr] = m[2].split("/");
      const date = `${yr}-${mo.padStart(2, "0")}-${dy.padStart(2, "0")}`;
      const note = m[3] ? "(x)" : "";
      if (amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        rows.push({ amount, date, note });
      } else {
        errors.push(line);
      }
    } else {
      errors.push(line);
    }
  }
  return { rows, errors };
}

/** Parse pasted reward lines: "10,000 - Real Thrills Reward" */
function parsePastedRewards(text) {
  const rows = [], errors = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^([\d,]+)\s*[-–]\s*(.+)$/);
    if (m) {
      const value = parseFloat(m[1].replace(/,/g, "")) || 0;
      const desc = m[2].trim();
      if (value > 0 && desc) rows.push({ value, desc, date: "" });
      else errors.push(line);
    } else {
      errors.push(line);
    }
  }
  return { rows, errors };
}

// ── Visual Credit Card ────────────────────────────────────────────────────────
function VisualCard({ card, selected, onClick }) {
  const cp = CARD_COLORS[card.color] || CARD_COLORS.indigo;
  const soaNext = nextSoaDate(card.soaDate);
  const days = daysUntil(soaNext);

  return (
    <button
      className={`cc-card${selected ? " cc-card--active" : ""}`}
      style={{ background: cp.grad }}
      onClick={onClick}
    >
      <div className="cc-orb-1" />
      <div className="cc-orb-2" />

      {/* Row 1: chip + network label */}
      <div className="cc-row-top">
        <div className="cc-chip">
          <div className="cc-chip-h" /><div className="cc-chip-v" />
        </div>
        <span className="cc-network">{(card.network || "VISA").toUpperCase()}</span>
      </div>

      {/* Bank name */}
      <div className="cc-bank">{card.name}</div>
      {card.note && <div className="cc-card-note">{card.note}</div>}

      {/* Footer row */}
      <div className="cc-row-footer">
        <div className="cc-info-block">
          <div className="cc-info-lbl">LIMIT</div>
          <div className="cc-info-val">₱{(card.limit / 1000).toFixed(0)}K</div>
        </div>
        <div className="cc-info-block">
          <div className="cc-info-lbl">EXPIRES</div>
          <div className="cc-info-val">{card.expiry || "—"}</div>
        </div>
        <div className="cc-info-block" style={{ textAlign: "right" }}>
          <div className="cc-info-lbl">SOA IN</div>
          <div className="cc-info-val">{days <= 0 ? "Today" : `${days}d`}</div>
        </div>
      </div>
    </button>
  );
}

// ── Card Form Modal ───────────────────────────────────────────────────────────
function CardModal({ open, initial, onClose, onSave }) {
  const blank = { name: "", soaDate: "", expiry: "", limit: "", color: "indigo", network: "visa", note: "" };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? {
      name: initial.name, soaDate: String(initial.soaDate),
      expiry: initial.expiry || "", limit: String(initial.limit),
      color: initial.color || "indigo", network: initial.network || "visa",
      note: initial.note || "",
    } : blank);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Overlay open>
    <div className="modal open">
      <div className="modalbox">
        <h2>{initial ? "Edit Card" : "Add Credit Card"}</h2>
        <form onSubmit={async e => {
          e.preventDefault();
          setBusy(true);
          try { await onSave(form); onClose(); } finally { setBusy(false); }
        }}>
          <div className="formgrid">
            <div className="field full">
              <label>Bank / Card Name</label>
              <input value={form.name} onChange={e => f("name", e.target.value)}
                placeholder="e.g. BPI, CITI, UnionBank" required />
            </div>
            <div className="field">
              <label>SOA Date (day of month)</label>
              <input type="number" min="1" max="31" value={form.soaDate}
                onChange={e => f("soaDate", e.target.value)} placeholder="27" required />
            </div>
            <div className="field">
              <label>Expiry (MM/YY)</label>
              <input value={form.expiry} onChange={e => f("expiry", e.target.value)} placeholder="07/27" />
            </div>
            <div className="field">
              <label>Credit Limit (₱)</label>
              <input type="number" min="0" value={form.limit}
                onChange={e => f("limit", e.target.value)} placeholder="262000" required />
            </div>
            <div className="field">
              <label>Network</label>
              <select value={form.network} onChange={e => f("network", e.target.value)}>
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="amex">Amex</option>
                <option value="jcb">JCB</option>
              </select>
            </div>
            <div className="field full">
              <label>Card Color</label>
              <div className="cc-color-grid">
                {Object.entries(CARD_COLORS).map(([k, { grad, label }]) => (
                  <button key={k} type="button" title={label}
                    className={`cc-color-swatch${form.color === k ? " active" : ""}`}
                    style={{ background: grad }} onClick={() => f("color", k)} />
                ))}
              </div>
            </div>
            <div className="field full">
              <label>Note (optional)</label>
              <input value={form.note} onChange={e => f("note", e.target.value)} placeholder="e.g. NAFFL, supplementary" />
            </div>
          </div>
          <div className="modalactions">
            <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? "Saving…" : initial ? "Save Changes" : "Add Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Overlay>
  );
}

// ── Payment Form Modal ────────────────────────────────────────────────────────
function PaymentModal({ open, initial, onClose, onSave }) {
  const blank = { amount: "", date: "", note: "" };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initial
      ? { amount: String(initial.amount), date: initial.date, note: initial.note || "" }
      : blank);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Overlay open>
    <div className="modal open">
      <div className="modalbox" style={{ maxWidth: 420 }}>
        <h2>{initial ? "Edit Payment" : "Add Payment"}</h2>
        <form onSubmit={async e => {
          e.preventDefault();
          setBusy(true);
          try {
            await onSave({ amount: parseAmountStr(form.amount), date: form.date, note: form.note });
            onClose();
          } finally { setBusy(false); }
        }}>
          <div className="formgrid">
            <div className="field">
              <label>SOA Amount (₱)</label>
              <input value={form.amount} onChange={e => f("amount", e.target.value)}
                placeholder="0.00" required />
            </div>
            <div className="field">
              <label>Payment Date</label>
              <input type="date" value={form.date} onChange={e => f("date", e.target.value)} required />
            </div>
            <div className="field full">
              <label>Note (optional)</label>
              <input value={form.note} onChange={e => f("note", e.target.value)} placeholder="e.g. partial payment" />
            </div>
          </div>
          <div className="modalactions">
            <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? "Saving…" : initial ? "Save Changes" : "Add Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Overlay>
  );
}

// ── Paste Import Modal ────────────────────────────────────────────────────────
function PasteModal({ open, mode, onClose, onSave }) {
  const isPayments = mode === "payments";
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setText(""); setPreview(null); } }, [open]);

  if (!open) return null;

  function handleParse() {
    setPreview(isPayments ? parsePastedPayments(text) : parsePastedRewards(text));
  }

  async function handleSave() {
    if (!preview?.rows.length) return;
    setBusy(true);
    try { await onSave(preview.rows); onClose(); } finally { setBusy(false); }
  }

  return (
    <Overlay open>
    <div className="modal open">
      <div className="modalbox" style={{ maxWidth: 540 }}>
        <h2>Paste Import — {isPayments ? "Payments" : "Rewards"}</h2>

        {!preview ? (
          <>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 10px" }}>
              {isPayments
                ? 'One entry per line: "5,466.32 - 08/16/2022"'
                : 'One entry per line: "10,000 - Real Thrills Reward"'}
            </p>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={10}
              style={{ width: "100%", fontFamily: "monospace", fontSize: 12 }}
              placeholder={isPayments
                ? "5,466.32 - 08/16/2022\n26,417.84 - 09/19/2022\n34,027.87 - 10/17/2022"
                : "10,000 - Real Thrills Reward\n5,000 - SM GC Holiday Promo"}
            />
            <div className="modalactions">
              <button className="btn secondary" onClick={onClose}>Cancel</button>
              <button className="btn primary" onClick={handleParse} disabled={!text.trim()}>
                Parse →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="notice" style={{ marginBottom: 10 }}>
              {preview.rows.length} row{preview.rows.length !== 1 ? "s" : ""} ready to import.
              {preview.errors.length > 0 && ` ${preview.errors.length} line${preview.errors.length !== 1 ? "s" : ""} skipped.`}
            </div>
            {preview.errors.length > 0 && (
              <div className="banner" style={{ marginBottom: 10, fontSize: 12 }}>
                Skipped: {preview.errors.slice(0, 4).join(" · ")}{preview.errors.length > 4 ? ` +${preview.errors.length - 4} more` : ""}
              </div>
            )}
            <div style={{
              maxHeight: 200, overflowY: "auto", fontSize: 12, fontFamily: "monospace",
              background: "var(--accent-bg)", borderRadius: 10, padding: "10px 12px", marginBottom: 4,
            }}>
              {isPayments
                ? preview.rows.map((r, i) => (
                    <div key={i}>{r.date}  {fmt(r.amount)}{r.note ? `  ${r.note}` : ""}</div>
                  ))
                : preview.rows.map((r, i) => (
                    <div key={i}>₱{r.value.toLocaleString()}  {r.desc}</div>
                  ))
              }
            </div>
            <div className="modalactions">
              <button className="btn secondary" onClick={() => setPreview(null)}>← Back</button>
              <button className="btn primary" onClick={handleSave}
                disabled={busy || !preview.rows.length}>
                {busy ? "Saving…" : `Import ${preview.rows.length} row${preview.rows.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
    </Overlay>
  );
}

// ── Reward Form Modal ─────────────────────────────────────────────────────────
function RewardModal({ open, initial, onClose, onSave }) {
  const blank = { value: "", desc: "", date: "" };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initial
      ? { value: String(initial.value), desc: initial.desc, date: initial.date || "" }
      : blank);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Overlay open>
    <div className="modal open">
      <div className="modalbox" style={{ maxWidth: 420 }}>
        <h2>{initial ? "Edit Reward" : "Add Reward"}</h2>
        <form onSubmit={async e => {
          e.preventDefault();
          setBusy(true);
          try {
            await onSave({ value: parseAmountStr(form.value), desc: form.desc, date: form.date });
            onClose();
          } finally { setBusy(false); }
        }}>
          <div className="formgrid">
            <div className="field full">
              <label>Description</label>
              <input value={form.desc} onChange={e => f("desc", e.target.value)}
                placeholder="e.g. SM GC Holiday Promo" required />
            </div>
            <div className="field">
              <label>Value (₱)</label>
              <input value={form.value} onChange={e => f("value", e.target.value)}
                placeholder="1000" required />
            </div>
            <div className="field">
              <label>Date Received</label>
              <input type="date" value={form.date} onChange={e => f("date", e.target.value)} />
            </div>
          </div>
          <div className="modalactions">
            <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? "Saving…" : initial ? "Save Changes" : "Add Reward"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Overlay>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function CreditCards({
  cards, payments, rewards,
  onAddCard, onUpdateCard, onDeleteCard,
  onAddPayment, onUpdatePayment, onDeletePayment,
  onAddReward, onUpdateReward, onDeleteReward,
}) {
  const toast = useToast();

  // Sort cards alphabetically for consistent display
  const sortedCards = useMemo(() =>
    [...cards].sort((a, b) => a.name.localeCompare(b.name)),
    [cards]);

  const [selId,       setSelId]       = useState(null);
  const [tab,         setTab]         = useState("payments");
  const [pmtYear,     setPmtYear]     = useState("All");

  // Card modals
  const [cardModal,   setCardModal]   = useState(false);
  const [editCard,    setEditCard]    = useState(null);
  const [delCard,     setDelCard]     = useState(null);

  // Payment modals
  const [pmtModal,    setPmtModal]    = useState(false);
  const [editPmt,     setEditPmt]     = useState(null);
  const [delPmt,      setDelPmt]      = useState(null);
  const [pasteOpen,   setPasteOpen]   = useState(false);

  // Reward modals
  const [rwdModal,    setRwdModal]    = useState(false);
  const [editRwd,     setEditRwd]     = useState(null);
  const [delRwd,      setDelRwd]      = useState(null);
  const [rewardPaste, setRewardPaste] = useState(false);

  const sel = cards.find(c => c.id === selId) || null;

  // Payments + rewards for selected card
  const cardPayments = useMemo(() =>
    payments.filter(p => p.cardId === selId).sort((a, b) => b.date.localeCompare(a.date)),
    [payments, selId]);

  const cardRewards = useMemo(() =>
    rewards.filter(r => r.cardId === selId).sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    [rewards, selId]);

  // Available years from payments
  const years = useMemo(() =>
    [...new Set(cardPayments.map(p => p.date.slice(0, 4)))].sort().reverse(),
    [cardPayments]);

  // Filtered payments for selected year
  const filteredPayments = useMemo(() =>
    pmtYear === "All"
      ? cardPayments
      : cardPayments.filter(p => p.date.startsWith(pmtYear)),
    [cardPayments, pmtYear]);

  // Monthly chart data for selected year
  const monthlyChart = useMemo(() => {
    if (pmtYear === "All") return null;
    return Array.from({ length: 12 }, (_, i) => {
      const key = `${pmtYear}-${String(i + 1).padStart(2, "0")}`;
      const total = cardPayments
        .filter(p => p.date.startsWith(key))
        .reduce((s, p) => s + p.amount, 0);
      return { label: MONTHS_SHORT[i], total };
    });
  }, [cardPayments, pmtYear]);

  const maxBar = monthlyChart ? Math.max(...monthlyChart.map(m => m.total), 1) : 1;

  // All-time year breakdown
  const yearBreakdown = useMemo(() => {
    const map = {};
    cardPayments.forEach(p => {
      const y = p.date.slice(0, 4);
      if (!map[y]) map[y] = { year: y, count: 0, total: 0 };
      map[y].count++;
      map[y].total += p.amount;
    });
    return Object.values(map).sort((a, b) => b.year.localeCompare(a.year));
  }, [cardPayments]);

  // KPIs
  const lastPayment    = cardPayments[0] || null;
  const thisYear       = String(new Date().getFullYear());
  const thisYearTotal  = cardPayments.filter(p => p.date.startsWith(thisYear)).reduce((s, p) => s + p.amount, 0);
  const totalRewardsVal = cardRewards.reduce((s, r) => s + r.value, 0);
  const soaNext        = sel ? nextSoaDate(sel.soaDate) : null;
  const soaDays        = soaNext ? daysUntil(soaNext) : 0;
  const utilPct        = sel?.limit > 0 && lastPayment
    ? Math.min(100, (lastPayment.amount / sel.limit) * 100)
    : 0;

  function selectCard(id) {
    if (selId === id) { setSelId(null); return; }
    setSelId(id);
    setTab("payments");
    setPmtYear("All");
  }

  async function handleDeleteCard() {
    try {
      await onDeleteCard(delCard.id);
      setDelCard(null);
      setSelId(null);
      toast.success(`${delCard.name} removed.`);
    } catch (e) { toast.error(e.message); }
  }

  async function handlePastePayments(rows) {
    let n = 0;
    for (const r of rows) { await onAddPayment(selId, r); n++; }
    toast.success(`${n} payment${n !== 1 ? "s" : ""} imported.`);
  }

  async function handlePasteRewards(rows) {
    let n = 0;
    for (const r of rows) { await onAddReward(selId, r); n++; }
    toast.success(`${n} reward${n !== 1 ? "s" : ""} imported.`);
  }

  return (
    <div>
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="top" style={{ marginBottom: 20 }}>
        <div className="greeting">
          <div className="greeting-sub">Finance</div>
          <h1>Credit Cards</h1>
        </div>
        <div className="top-actions">
          <button className="btn primary" onClick={() => { setEditCard(null); setCardModal(true); }}>
            <IconPlus /> Add Card
          </button>
        </div>
      </div>

      {/* ── Cards grid ──────────────────────────────────────────────────────── */}
      {cards.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: 48 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No credit cards yet.</div>
            <button className="btn primary" onClick={() => { setEditCard(null); setCardModal(true); }}>
              <IconPlus /> Add your first card
            </button>
          </div>
        </div>
      ) : (
        <div className="cc-grid">
          {sortedCards.map(c => (
            <VisualCard key={c.id} card={c} selected={selId === c.id} onClick={() => selectCard(c.id)} />
          ))}
        </div>
      )}

      {/* ── Detail panel ────────────────────────────────────────────────────── */}
      {sel && (
        <div className="card cc-detail">
          {/* Detail header */}
          <div className="cc-detail-header">
            <div className="cc-detail-title-block">
              <h2 className="cc-detail-name">{sel.name}</h2>
              <div className="cc-meta-chips">
                <span className="cc-meta-chip">SOA {ordinal(sel.soaDate)}</span>
                <span className="cc-meta-chip">Limit {fmt(sel.limit)}</span>
                <span className="cc-meta-chip">Expires {sel.expiry || "—"}</span>
                {sel.note && <span className="cc-meta-chip">{sel.note}</span>}
              </div>
            </div>
            <div className="cc-detail-actions">
              <button className="btn secondary" onClick={() => { setEditCard(sel); setCardModal(true); }}>
                <IconEdit /><span className="cc-btn-label"> Edit</span>
              </button>
              <button className="btn secondary cc-danger-btn" onClick={() => setDelCard(sel)}>
                <IconTrash /><span className="cc-btn-label"> Delete</span>
              </button>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid" style={{ marginBottom: 16 }}>
            <div className="card kpi kpi-accent">
              <div className="label">Last SOA</div>
              <div className="value">{lastPayment ? fmt(lastPayment.amount) : "—"}</div>
              <small>{lastPayment ? lastPayment.date : "No payments yet"}</small>
            </div>
            <div className="card kpi kpi-accent">
              <div className="label">Next SOA</div>
              <div className="value">{soaDays <= 0 ? "Today" : `${soaDays}d`}</div>
              <small>{soaNext?.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</small>
            </div>
            <div className="card kpi kpi-accent">
              <div className="label">This Year ({thisYear})</div>
              <div className="value">{fmt(thisYearTotal)}</div>
              <small>{cardPayments.filter(p => p.date.startsWith(thisYear)).length} payments</small>
            </div>
            <div className="card kpi kpi-accent">
              <div className="label">Total Rewards</div>
              <div className="value">{fmt(totalRewardsVal)}</div>
              <small>{cardRewards.length} reward{cardRewards.length !== 1 ? "s" : ""} earned</small>
            </div>
          </div>

          {/* Utilization bar */}
          {lastPayment && sel.limit > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 5 }}>
                <span>Last SOA vs Credit Limit</span>
                <span style={{ fontWeight: 700 }}>{utilPct.toFixed(1)}%</span>
              </div>
              <div className="track" style={{ height: 10 }}>
                <div className="fill" style={{
                  width: `${utilPct}%`,
                  background: utilPct > 80
                    ? "linear-gradient(90deg,var(--danger),#f97316)"
                    : utilPct > 50
                      ? "linear-gradient(90deg,var(--warn),#f59e0b)"
                      : "var(--accent-grad)",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                <span>{fmt(lastPayment.amount)}</span>
                <span>Limit: {fmt(sel.limit)}</span>
              </div>
            </div>
          )}

          {/* Tab bar */}
          <div className="tab-bar" style={{ marginTop: 0 }}>
            <button className={`tab-btn${tab === "payments" ? " active" : ""}`} onClick={() => setTab("payments")}>
              Payments ({cardPayments.length})
            </button>
            <button className={`tab-btn${tab === "rewards" ? " active" : ""}`} onClick={() => setTab("rewards")}>
              Rewards ({cardRewards.length})
            </button>
          </div>

          {/* ── Payments tab ─────────────────────────────────────────────── */}
          {tab === "payments" && (
            <div>
              {/* Toolbar with year filter */}
              <div className="cc-toolbar">
                <select value={pmtYear} onChange={e => setPmtYear(e.target.value)} className="cc-year-select">
                  <option value="All">All years</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <div className="cc-toolbar-actions">
                  <button className="btn secondary" onClick={() => setPasteOpen(true)}>Paste Import</button>
                  <button className="btn primary" onClick={() => { setEditPmt(null); setPmtModal(true); }}>
                    <IconPlus /> Add Payment
                  </button>
                </div>
              </div>

              {cardPayments.length === 0 ? (
                <div className="empty">No payments recorded yet.</div>
              ) : (
                <>
                  {/* Year breakdown summary (shown when All years selected) */}
                  {pmtYear === "All" && yearBreakdown.length > 0 && (
                    <div className="card" style={{ marginBottom: 14, padding: "14px 16px" }}>
                      <div className="month-breakdown-list">
                        {/* Header */}
                        <div style={{
                          display: "grid", gridTemplateColumns: "60px 1fr auto 150px",
                          gap: 8, padding: "4px 4px 10px", borderBottom: "1.5px solid var(--accent-soft)",
                          fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em",
                        }}>
                          <span>Year</span><span /><span style={{ textAlign: "right" }}>Payments</span>
                          <span style={{ textAlign: "right" }}>Total</span>
                        </div>
                        {yearBreakdown.map(y => (
                          <div key={y.year} className="cc-yr-row"
                            onClick={() => setPmtYear(y.year)}>
                            <span className="mbl-month" style={{ fontWeight: 600 }}>{y.year}</span>
                            <span />
                            <span className="mbl-count">{y.count}</span>
                            <span className="mbl-total">{fmt(y.total)}</span>
                          </div>
                        ))}
                        <div className="cc-yr-row total-row">
                          <span className="mbl-month">Total</span>
                          <span />
                          <span className="mbl-count">{cardPayments.length}</span>
                          <span className="mbl-total" style={{ color: "var(--text)" }}>
                            {fmt(cardPayments.reduce((s, p) => s + p.amount, 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Monthly bar chart (shown when a specific year is selected) */}
                  {monthlyChart && (
                    <div className="card" style={{ marginBottom: 14 }}>
                      <div className="section-header">
                        <h2>{pmtYear} Monthly SOA</h2>
                        <span className="badge">{fmt(filteredPayments.reduce((s, p) => s + p.amount, 0))}</span>
                      </div>
                      <div className="bars">
                        {monthlyChart.map(m => (
                          <div key={m.label} className="barwrap">
                            <div className="barvalue">{m.total > 0 ? `₱${(m.total / 1000).toFixed(0)}K` : ""}</div>
                            <div className="bar" style={{ height: `${(m.total / maxBar) * 100}%` }} />
                            <div className="barlabel">{m.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full entry list — all filtered payments, page scrolls */}
                  {filteredPayments.length === 0 ? (
                    <div className="empty">No payments for {pmtYear}.</div>
                  ) : (
                    <div className="card cc-entries-wrap">
                      <div className="cc-entry-head">
                        <span>Date</span><span>Amount</span><span>Note</span>
                        <span className="cc-entry-spacer" /><span />
                      </div>
                      {filteredPayments.map(p => (
                        <div key={p.id} className="cc-entry-row">
                          <div className="cc-entry-date">{fmtDate(p.date)}</div>
                          <div className="cc-entry-amt">{fmt(p.amount)}</div>
                          <div className="cc-entry-note">{p.note || "—"}</div>
                          <div className="cc-entry-spacer" />
                          <div className="cc-entry-acts">
                            <button className="tx-delete-btn" title="Edit"
                              onClick={() => { setEditPmt(p); setPmtModal(true); }}>
                              <IconEdit size={14} />
                            </button>
                            <button className="tx-delete-btn" title="Delete" onClick={() => setDelPmt(p)}>
                              <IconTrash size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Rewards tab ───────────────────────────────────────────────── */}
          {tab === "rewards" && (
            <div>
              <div className="cc-toolbar cc-toolbar--end">
                <div className="cc-toolbar-actions">
                  <button className="btn secondary" onClick={() => setRewardPaste(true)}>Paste Import</button>
                  <button className="btn primary" onClick={() => { setEditRwd(null); setRwdModal(true); }}>
                    <IconPlus /> Add Reward
                  </button>
                </div>
              </div>

              {cardRewards.length === 0 ? (
                <div className="empty">No rewards recorded yet.</div>
              ) : (
                <div className="card cc-entries-wrap">
                  <div className="cc-entry-head cc-entry-head--rwd">
                    <span>Description</span><span>Value</span><span>Date</span><span />
                  </div>
                  {cardRewards.map(r => (
                    <div key={r.id} className="cc-entry-row cc-entry-row--rwd">
                      <div className="cc-entry-desc">{r.desc}</div>
                      <div className="cc-entry-amt" style={{ color: "var(--good)" }}>{fmt(r.value)}</div>
                      <div className="cc-entry-note">{fmtDate(r.date)}</div>
                      <div className="cc-entry-acts">
                        <button className="tx-delete-btn" title="Edit"
                          onClick={() => { setEditRwd(r); setRwdModal(true); }}>
                          <IconEdit size={14} />
                        </button>
                        <button className="tx-delete-btn" title="Delete" onClick={() => setDelRwd(r)}>
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}      <CardModal
        open={cardModal}
        initial={editCard}
        onClose={() => setCardModal(false)}
        onSave={async (data) => {
          if (editCard) { await onUpdateCard(editCard.id, data); toast.success("Card updated."); }
          else { await onAddCard(data); toast.success("Card added."); }
        }}
      />

      <PaymentModal
        open={pmtModal}
        initial={editPmt}
        onClose={() => setPmtModal(false)}
        onSave={async (data) => {
          if (editPmt) { await onUpdatePayment(editPmt.id, data); toast.success("Payment updated."); }
          else { await onAddPayment(selId, data); toast.success("Payment added."); }
        }}
      />

      <PasteModal open={pasteOpen} mode="payments" onClose={() => setPasteOpen(false)} onSave={handlePastePayments} />

      <RewardModal
        open={rwdModal}
        initial={editRwd}
        onClose={() => setRwdModal(false)}
        onSave={async (data) => {
          if (editRwd) { await onUpdateReward(editRwd.id, data); toast.success("Reward updated."); }
          else { await onAddReward(selId, data); toast.success("Reward added."); }
        }}
      />

      <PasteModal open={rewardPaste} mode="rewards" onClose={() => setRewardPaste(false)} onSave={handlePasteRewards} />

      <ConfirmDialog
        open={!!delCard} danger
        title={`Delete ${delCard?.name}?`}
        message="This permanently removes the card. Historical payments and rewards will be orphaned in the database but hidden from the UI."
        confirmLabel="Delete Card"
        onConfirm={handleDeleteCard}
        onCancel={() => setDelCard(null)}
      />

      <ConfirmDialog
        open={!!delPmt} danger
        title="Delete payment?"
        message={`Remove the ${delPmt?.date} payment of ${delPmt ? fmt(delPmt.amount) : ""}?`}
        confirmLabel="Delete"
        onConfirm={async () => {
          try { await onDeletePayment(delPmt.id); setDelPmt(null); toast.success("Payment removed."); }
          catch (e) { toast.error(e.message); }
        }}
        onCancel={() => setDelPmt(null)}
      />

      <ConfirmDialog
        open={!!delRwd} danger
        title="Delete reward?"
        message={`Remove "${delRwd?.desc}"?`}
        confirmLabel="Delete"
        onConfirm={async () => {
          try { await onDeleteReward(delRwd.id); setDelRwd(null); toast.success("Reward removed."); }
          catch (e) { toast.error(e.message); }
        }}
        onCancel={() => setDelRwd(null)}
      />
    </div>
  );
}

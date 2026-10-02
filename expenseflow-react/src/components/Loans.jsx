import { useState, useMemo } from "react";
import { money, monthLabel, loanProgress, defaultDateForMonth } from "../helpers";
import { IconPlus, IconEdit, IconTrash, IconClose, IconLoan } from "./Icons";
import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "./Toast";

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function LoanModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [lender, setLender] = useState(initial?.lender ?? "");
  const [monthlyAmount, setMonthly] = useState(initial?.monthlyAmount != null ? String(initial.monthlyAmount) : "");
  const [termMonths, setTerm] = useState(initial?.termMonths != null ? String(initial.termMonths) : "");
  const [startMonth, setStart] = useState(initial?.startMonth ?? currentMonthKey());
  const [note, setNote] = useState(initial?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const total = (Number(monthlyAmount) || 0) * (Number(termMonths) || 0);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) { setErr("Give this loan a name."); return; }
    if (!(Number(monthlyAmount) > 0)) { setErr("Monthly amount must be greater than zero."); return; }
    if (!(Number(termMonths) > 0)) { setErr("Term must be at least 1 month."); return; }
    setBusy(true);
    try {
      await onSave({
        name: name.trim(), lender: lender.trim(),
        monthlyAmount: Number(monthlyAmount), termMonths: Number(termMonths),
        startMonth, note: note.trim(), principal: total,
      });
      onClose();
    } catch (e2) {
      setErr("Could not save: " + (e2?.message || "unknown error"));
      setBusy(false);
    }
  }

  return (
    <div className="modal open" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modalbox" style={{ width: "min(460px, 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>{initial ? "Edit loan" : "Add loan / installment"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }} aria-label="Close"><IconClose /></button>
        </div>

        {err && <div className="banner" style={{ marginBottom: 14 }}>{err}</div>}

        <form onSubmit={submit}>
          <div className="formgrid">
            <div className="field full">
              <label>Name</label>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Car loan, iPhone installment" />
            </div>
            <div className="field full">
              <label>Lender / provider (optional)</label>
              <input value={lender} onChange={(e) => setLender(e.target.value)} placeholder="e.g. BPI, Home Credit" />
            </div>
            <div className="field">
              <label>Monthly payment (PHP)</label>
              <input type="number" step="0.01" min="0" value={monthlyAmount} onChange={(e) => setMonthly(e.target.value)} placeholder="0.00" />
            </div>
            <div className="field">
              <label>Term (months)</label>
              <input type="number" min="1" step="1" value={termMonths} onChange={(e) => setTerm(e.target.value)} placeholder="e.g. 12" />
            </div>
            <div className="field">
              <label>Start month</label>
              <input type="month" value={startMonth} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="field">
              <label>Total</label>
              <input value={total ? money(total) : "—"} disabled />
            </div>
            <div className="field full">
              <label>Note (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. 0% interest promo" />
            </div>
          </div>
          <div className="modalactions">
            <button type="button" className="btn secondary" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="btn primary" disabled={busy}>{busy ? "Saving…" : initial ? "Save changes" : "Add loan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoanCard({ loan, refMonth, onEdit, onDelete }) {
  const p = loanProgress(loan, refMonth);
  const status = p.done ? { label: "Paid off", color: "var(--good)", bg: "var(--good-bg)" }
    : p.notStarted ? { label: "Not started", color: "var(--muted)", bg: "var(--accent-bg)" }
    : { label: `${p.remaining} month${p.remaining !== 1 ? "s" : ""} left`, color: "var(--accent)", bg: "var(--accent-bg)" };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", gap: 11, minWidth: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--accent-bg)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <IconLoan />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loan.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{loan.lender || "—"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button className="tx-delete-btn" title="Edit" onClick={() => onEdit(loan)}><IconEdit size={15} /></button>
          <button className="tx-delete-btn" title="Delete" onClick={() => onDelete(loan)}><IconTrash size={15} /></button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>{money(loan.monthlyAmount)}/mo</span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, color: status.color, background: status.bg }}>
          {status.label}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="track" style={{ height: 9 }}>
          <div className="fill" style={{ width: `${p.pct}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
          <span>{p.paid} of {p.term} paid ({p.pct}%)</span>
          <span>{monthLabel(p.start, { month: "short", year: "numeric" })} → {monthLabel(p.endMonth, { month: "short", year: "numeric" })}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Remaining</div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "var(--accent)" }}>{money(p.remainingAmount)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Paid / Total</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{money(p.paidAmount)} / {money(p.totalAmount)}</div>
        </div>
      </div>
    </div>
  );
}

export default function Loans({ loans, onAdd, onUpdate, onDelete }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const toast = useToast();
  const refMonth = currentMonthKey();

  const totals = useMemo(() => {
    let remaining = 0, monthlyActive = 0, active = 0;
    for (const l of loans) {
      const p = loanProgress(l, refMonth);
      remaining += p.remainingAmount;
      if (!p.done && !p.notStarted) { monthlyActive += p.monthly; active += 1; }
    }
    return { remaining, monthlyActive, active };
  }, [loans, refMonth]);

  const sorted = useMemo(() =>
    [...loans].sort((a, b) => {
      const pa = loanProgress(a, refMonth), pb = loanProgress(b, refMonth);
      return (pa.done - pb.done) || (a.name || "").localeCompare(b.name || "");
    }), [loans, refMonth]);

  function openAdd() { setEditing(null); setModalOpen(true); }
  function openEdit(l) { setEditing(l); setModalOpen(true); }

  async function handleSave(data) {
    if (editing) { await onUpdate(editing.id, data); toast.success("Loan updated."); }
    else { await onAdd(data); toast.success("Loan added."); }
  }

  async function confirmDelete() {
    const l = pendingDelete;
    setPendingDelete(null);
    try { await onDelete(l.id); toast.success(`"${l.name}" removed.`); }
    catch (e) { toast.error("Delete failed: " + e.message); }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Loans & Installments</h2>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
            Track payoff progress, months left, and remaining balance.
          </p>
        </div>
        <button className="btn primary" onClick={openAdd}><IconPlus /> Add loan</button>
      </div>

      {/* Summary */}
      {loans.length > 0 && (
        <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 18 }}>
          <div className="card kpi kpi-accent">
            <div className="label">Total remaining</div>
            <div className="value">{money(totals.remaining)}</div>
            <small>across all loans</small>
          </div>
          <div className="card kpi">
            <div className="label">Monthly commitment</div>
            <div className="value">{money(totals.monthlyActive)}</div>
            <small>active this month</small>
          </div>
          <div className="card kpi">
            <div className="label">Active loans</div>
            <div className="value">{totals.active}</div>
            <small>{loans.length} total</small>
          </div>
        </div>
      )}

      {loans.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: "48px 20px" }}>
            <div style={{ marginBottom: 12, opacity: .4 }}><IconLoan size={40} /></div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No loans tracked yet</div>
            <div style={{ fontSize: 12 }}>Add a loan or installment to track its payoff over time.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 15 }}>
          {sorted.map((l) => (
            <LoanCard key={l.id} loan={l} refMonth={refMonth} onEdit={openEdit} onDelete={setPendingDelete} />
          ))}
        </div>
      )}

      {modalOpen && (
        <LoanModal initial={editing} onSave={handleSave} onClose={() => setModalOpen(false)} />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        danger
        title={`Delete "${pendingDelete?.name}"?`}
        message="This removes the loan from tracking. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

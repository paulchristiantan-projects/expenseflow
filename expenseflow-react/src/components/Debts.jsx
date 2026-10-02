import { useState, useMemo } from "react";
import { money, getInitials, todayISO } from "../helpers";
import { IconPlus, IconEdit, IconTrash, IconClose, IconDebt } from "./Icons";
import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "./Toast";

function fmtDate(d) {
  return d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
}

function DebtModal({ initial, onSave, onClose }) {
  const [person, setPerson] = useState(initial?.person ?? "");
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : "");
  const [paidAmount, setPaid] = useState(initial?.paidAmount != null ? String(initial.paidAmount) : "0");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [dueDate, setDue] = useState(initial?.dueDate ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!person.trim()) { setErr("Enter the person's name."); return; }
    if (!(Number(amount) > 0)) { setErr("Amount must be greater than zero."); return; }
    if (Number(paidAmount) > Number(amount)) { setErr("Paid amount can't exceed the total."); return; }
    setBusy(true);
    try {
      await onSave({
        person: person.trim(), amount: Number(amount), paidAmount: Number(paidAmount) || 0,
        date, dueDate, note: note.trim(),
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
          <h2 style={{ margin: 0 }}>{initial ? "Edit debt" : "Add debt owed to me"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }} aria-label="Close"><IconClose /></button>
        </div>

        {err && <div className="banner" style={{ marginBottom: 14 }}>{err}</div>}

        <form onSubmit={submit}>
          <div className="formgrid">
            <div className="field full">
              <label>Person</label>
              <input autoFocus value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Who borrowed from you?" />
            </div>
            <div className="field">
              <label>Amount lent (PHP)</label>
              <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="field">
              <label>Already paid back (PHP)</label>
              <input type="number" step="0.01" min="0" value={paidAmount} onChange={(e) => setPaid(e.target.value)} placeholder="0.00" />
            </div>
            <div className="field">
              <label>Date lent</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Due date (optional)</label>
              <input type="date" value={dueDate} onChange={(e) => setDue(e.target.value)} />
            </div>
            <div className="field full">
              <label>Note (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. for groceries" />
            </div>
          </div>
          <div className="modalactions">
            <button type="button" className="btn secondary" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="btn primary" disabled={busy}>{busy ? "Saving…" : initial ? "Save changes" : "Add debt"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DebtCard({ debt, onEdit, onDelete, onRecordPayment }) {
  const remaining = Math.max(0, (debt.amount || 0) - (debt.paidAmount || 0));
  const pct = debt.amount > 0 ? Math.round(((debt.paidAmount || 0) / debt.amount) * 100) : 0;
  const settled = remaining <= 0;
  const overdue = !settled && debt.dueDate && debt.dueDate < todayISO();

  const status = settled ? { label: "Settled", color: "var(--good)", bg: "var(--good-bg)" }
    : overdue ? { label: "Overdue", color: "var(--danger)", bg: "var(--danger-bg)" }
    : { label: money(remaining) + " left", color: "var(--accent)", bg: "var(--accent-bg)" };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", gap: 11, minWidth: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, fontSize: 14 }}>
            {getInitials(debt.person, "")}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{debt.person}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Lent {fmtDate(debt.date)}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button className="tx-delete-btn" title="Edit" onClick={() => onEdit(debt)}><IconEdit size={15} /></button>
          <button className="tx-delete-btn" title="Delete" onClick={() => onDelete(debt)}><IconTrash size={15} /></button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 20, fontWeight: 800 }}>{money(debt.amount)}</span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, color: status.color, background: status.bg }}>
          {status.label}
        </span>
      </div>

      <div>
        <div className="track" style={{ height: 9 }}>
          <div className="fill" style={{ width: `${pct}%`, background: settled ? "var(--good)" : "var(--accent-grad)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
          <span>{money(debt.paidAmount || 0)} paid ({pct}%)</span>
          {debt.dueDate && <span style={{ color: overdue ? "var(--danger)" : "var(--muted)" }}>Due {fmtDate(debt.dueDate)}</span>}
        </div>
      </div>

      {debt.note && <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>{debt.note}</div>}

      {!settled && (
        <button className="btn secondary" style={{ fontSize: 12, padding: "8px 12px", justifyContent: "center" }} onClick={() => onRecordPayment(debt)}>
          Record payment
        </button>
      )}
    </div>
  );
}

export default function Debts({ debts, onAdd, onUpdate, onDelete }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [payFor, setPayFor] = useState(null);
  const [payAmt, setPayAmt] = useState("");
  const toast = useToast();

  const totals = useMemo(() => {
    let outstanding = 0, lent = 0, people = new Set();
    for (const d of debts) {
      const rem = Math.max(0, (d.amount || 0) - (d.paidAmount || 0));
      outstanding += rem;
      lent += d.amount || 0;
      if (rem > 0) people.add(d.person);
    }
    return { outstanding, lent, people: people.size };
  }, [debts]);

  const sorted = useMemo(() =>
    [...debts].sort((a, b) => {
      const ra = Math.max(0, (a.amount || 0) - (a.paidAmount || 0));
      const rb = Math.max(0, (b.amount || 0) - (b.paidAmount || 0));
      return (Number(ra <= 0) - Number(rb <= 0)) || (b.date || "").localeCompare(a.date || "");
    }), [debts]);

  function openAdd() { setEditing(null); setModalOpen(true); }
  function openEdit(d) { setEditing(d); setModalOpen(true); }

  async function handleSave(data) {
    if (editing) { await onUpdate(editing.id, data); toast.success("Debt updated."); }
    else { await onAdd(data); toast.success("Debt added."); }
  }

  async function confirmDelete() {
    const d = pendingDelete;
    setPendingDelete(null);
    try { await onDelete(d.id); toast.success(`"${d.person}" removed.`); }
    catch (e) { toast.error("Delete failed: " + e.message); }
  }

  function openPayment(d) { setPayFor(d); setPayAmt(""); }

  async function confirmPayment() {
    const add = Number(payAmt);
    if (!(add > 0)) { toast.error("Enter a valid amount."); return; }
    const newPaid = Math.min((payFor.amount || 0), (payFor.paidAmount || 0) + add);
    const d = payFor;
    setPayFor(null);
    try {
      await onUpdate(d.id, { ...d, paidAmount: newPaid });
      toast.success(newPaid >= d.amount ? `${d.person}'s debt is now settled.` : `Recorded ${money(add)} from ${d.person}.`);
    } catch (e) { toast.error("Failed: " + e.message); }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Owed to Me</h2>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
            Track people who borrowed from you and how much they still owe.
          </p>
        </div>
        <button className="btn primary" onClick={openAdd}><IconPlus /> Add debt</button>
      </div>

      {debts.length > 0 && (
        <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 18 }}>
          <div className="card kpi kpi-accent">
            <div className="label">Total outstanding</div>
            <div className="value">{money(totals.outstanding)}</div>
            <small>still owed to you</small>
          </div>
          <div className="card kpi">
            <div className="label">Total lent</div>
            <div className="value">{money(totals.lent)}</div>
            <small>{debts.length} record{debts.length !== 1 ? "s" : ""}</small>
          </div>
          <div className="card kpi">
            <div className="label">People owing</div>
            <div className="value">{totals.people}</div>
            <small>with balances</small>
          </div>
        </div>
      )}

      {debts.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: "48px 20px" }}>
            <div style={{ marginBottom: 12, opacity: .4 }}><IconDebt size={40} /></div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No debts tracked yet</div>
            <div style={{ fontSize: 12 }}>Add someone who borrowed money from you to start tracking.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 15 }}>
          {sorted.map((d) => (
            <DebtCard key={d.id} debt={d} onEdit={openEdit} onDelete={setPendingDelete} onRecordPayment={openPayment} />
          ))}
        </div>
      )}

      {modalOpen && (
        <DebtModal initial={editing} onSave={handleSave} onClose={() => setModalOpen(false)} />
      )}

      {/* Record payment mini-modal */}
      {payFor && (
        <div className="modal open" onMouseDown={(e) => { if (e.target === e.currentTarget) setPayFor(null); }}>
          <div className="modalbox" style={{ width: "min(380px, 100%)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 16 }}>Record payment</h2>
              <button onClick={() => setPayFor(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }} aria-label="Close"><IconClose /></button>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--muted)" }}>
              {payFor.person} still owes <strong style={{ color: "var(--text)" }}>{money(Math.max(0, payFor.amount - (payFor.paidAmount || 0)))}</strong>.
            </p>
            <div className="field full">
              <label>Amount received (PHP)</label>
              <input type="number" step="0.01" min="0" autoFocus value={payAmt}
                onChange={(e) => setPayAmt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmPayment()}
                placeholder="0.00" />
            </div>
            <div className="modalactions">
              <button className="btn secondary" onClick={() => setPayFor(null)}>Cancel</button>
              <button className="btn primary" onClick={confirmPayment}>Record</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        danger
        title={`Delete "${pendingDelete?.person}"?`}
        message="This removes the debt record. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

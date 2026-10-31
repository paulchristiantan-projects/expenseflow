import { useState, useMemo } from "react";
import { money, monthlySalary, salaryProgression, todayISO } from "../helpers";
import { estimatePHDeductions } from "../phDeductions";
import { IconPlus, IconEdit, IconTrash, IconClose, IconSalary } from "./Icons";
import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "./Toast";

const FREQUENCIES = [
  { value: "monthly",  label: "Monthly" },
  { value: "annual",   label: "Annual" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "weekly",   label: "Weekly" },
  { value: "hourly",   label: "Hourly" },
];

const CHANGE_TYPES = ["Raise", "Promotion", "New job", "Adjustment", "Bonus base"];

function SalaryModal({ initial, onSave, onClose }) {
  const [amount, setAmount]         = useState(initial?.amount != null ? String(initial.amount) : "");
  const [allowance, setAllowance]   = useState(initial?.allowance != null ? String(initial.allowance) : "");
  const [allowanceFreq, setAllowanceFreq] = useState(initial?.allowanceFreq ?? "monthly");
  const [allowanceLabel, setAllowanceLabel] = useState(initial?.allowanceLabel ?? "");
  const [allowanceTaxable, setAllowanceTaxable] = useState(initial?.allowanceTaxable !== false);
  const [sss, setSss]               = useState(initial?.sss != null ? String(initial.sss) : "");
  const [philhealth, setPhilhealth] = useState(initial?.philhealth != null ? String(initial.philhealth) : "");
  const [pagibig, setPagibig]       = useState(initial?.pagibig != null ? String(initial.pagibig) : "");
  const [tax, setTax]               = useState(initial?.tax != null ? String(initial.tax) : "");
  const [effectiveDate, setDate]    = useState(initial?.effectiveDate ?? todayISO());
  const [frequency, setFrequency]   = useState(initial?.frequency ?? "annual");
  const [employer, setEmployer]     = useState(initial?.employer ?? "");
  const [title, setTitle]           = useState(initial?.title ?? "");
  const [changeType, setChangeType] = useState(initial?.changeType ?? "");
  const [note, setNote]             = useState(initial?.note ?? "");
  const [busy, setBusy]             = useState(false);
  const [err, setErr]               = useState("");
  const [estNote, setEstNote]       = useState("");

  function autoEstimate() {
    const baseMonthly  = monthlySalary(Number(amount) || 0, frequency);
    const allowMonthly = monthlySalary(Number(allowance) || 0, allowanceFreq);
    if (!(baseMonthly + allowMonthly > 0)) { setErr("Enter an amount first so I can estimate the deductions."); return; }
    const est = estimatePHDeductions(baseMonthly, effectiveDate, allowMonthly, allowanceTaxable);
    // Store values back in the entry's own frequency (modal inputs are per-frequency)
    const perFreq = (monthlyVal) => {
      switch (frequency) {
        case "annual":   return monthlyVal * 12;
        case "biweekly": return (monthlyVal * 12) / 26;
        case "weekly":   return (monthlyVal * 12) / 52;
        case "hourly":   return monthlyVal / 160;
        default:         return monthlyVal;
      }
    };
    const r2 = (n) => Math.round(n * 100) / 100;
    setSss(String(r2(perFreq(est.sss))));
    setPhilhealth(String(r2(perFreq(est.philhealth))));
    setPagibig(String(r2(perFreq(est.pagibig))));
    setTax(String(r2(perFreq(est.tax))));
    setErr("");
    setEstNote(`Estimated using ${est.year} PH rates${allowMonthly > 0 ? ` (contributions on basic pay; tax on basic${allowanceTaxable ? " + allowance" : ", allowance excluded"})` : ""}. Adjust to match your payslip if needed.`);
  }

  async function submit(e) {
    e.preventDefault();
    if (!(Number(amount) > 0)) { setErr("Enter a salary amount greater than zero."); return; }
    if (!effectiveDate)        { setErr("Pick the date this salary takes effect."); return; }
    setBusy(true);
    try {
      await onSave({
        amount: Number(amount),
        allowance: Number(allowance) || 0,
        allowanceFreq,
        allowanceLabel: allowanceLabel.trim(),
        allowanceTaxable,
        sss: Number(sss) || 0,
        philhealth: Number(philhealth) || 0,
        pagibig: Number(pagibig) || 0,
        tax: Number(tax) || 0,
        effectiveDate, frequency,
        employer: employer.trim(), title: title.trim(),
        changeType, note: note.trim(),
      });
      onClose();
    } catch (e2) {
      setErr("Could not save: " + (e2?.message || "unknown error"));
      setBusy(false);
    }
  }

  return (
    <div className="modal open" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modalbox" style={{ width: "min(480px, 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>{initial ? "Edit salary entry" : "Add salary entry"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }} aria-label="Close"><IconClose /></button>
        </div>

        {err && <div className="banner" style={{ marginBottom: 14 }}>{err}</div>}

        <form onSubmit={submit}>
          <div className="formgrid">
            <div className="field">
              <label>Amount (PHP)</label>
              <input type="number" step="0.01" min="0" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              {Number(amount) > 0 && frequency !== "monthly" && (
                <small style={{ color: "var(--muted)", fontSize: 11 }}>≈ {money(monthlySalary(Number(amount), frequency))}/mo</small>
              )}
            </div>
            <div className="field">
              <label>Pay rate</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Effective date</label>
              <input type="date" value={effectiveDate} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Change type</label>
              <select value={changeType} onChange={(e) => setChangeType(e.target.value)}>
                <option value="">—</option>
                {CHANGE_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Allowance (PHP, optional)</label>
              <input type="number" step="0.01" min="0" value={allowance} onChange={(e) => setAllowance(e.target.value)} placeholder="0.00" />
              {Number(allowance) > 0 && allowanceFreq !== "monthly" && (
                <small style={{ color: "var(--muted)", fontSize: 11 }}>≈ {money(monthlySalary(Number(allowance), allowanceFreq))}/mo</small>
              )}
            </div>
            <div className="field">
              <label>Allowance rate</label>
              <select value={allowanceFreq} onChange={(e) => setAllowanceFreq(e.target.value)}>
                {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div className="field full">
              <label>Allowance type</label>
              <input value={allowanceLabel} onChange={(e) => setAllowanceLabel(e.target.value)} placeholder="e.g. Transport, Meal, Housing" />
            </div>
            <div className="field full">
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={allowanceTaxable}
                  onChange={(e) => setAllowanceTaxable(e.target.checked)}
                  style={{ width: "auto", margin: 0 }}
                />
                Allowance is taxable (included in withholding tax base)
              </label>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                Uncheck only for non-taxable / de-minimis allowances. Statutory contributions are always based on basic pay.
              </div>
            </div>

            <div className="field full">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em", margin: 0 }}>
                  Government-mandated deductions ({(FREQUENCIES.find((f) => f.value === frequency) || {}).label?.toLowerCase() || "per period"})
                </label>
                <button type="button" className="btn secondary" style={{ fontSize: 12, padding: "5px 10px" }} onClick={autoEstimate}>
                  Auto-estimate (PH)
                </button>
              </div>
              {estNote && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{estNote}</div>}
            </div>
            <div className="field">
              <label>SSS</label>
              <input type="number" step="0.01" min="0" value={sss} onChange={(e) => setSss(e.target.value)} placeholder="0.00" />
            </div>
            <div className="field">
              <label>PhilHealth</label>
              <input type="number" step="0.01" min="0" value={philhealth} onChange={(e) => setPhilhealth(e.target.value)} placeholder="0.00" />
            </div>
            <div className="field">
              <label>Pag-IBIG</label>
              <input type="number" step="0.01" min="0" value={pagibig} onChange={(e) => setPagibig(e.target.value)} placeholder="0.00" />
            </div>
            <div className="field">
              <label>Withholding tax</label>
              <input type="number" step="0.01" min="0" value={tax} onChange={(e) => setTax(e.target.value)} placeholder="0.00" />
            </div>

            <div className="field full">
              <label>Employer (optional)</label>
              <input value={employer} onChange={(e) => setEmployer(e.target.value)} placeholder="e.g. Acme Corp" />
            </div>
            <div className="field full">
              <label>Job title (optional)</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Engineer" />
            </div>
            <div className="field full">
              <label>Note (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. annual merit increase" />
            </div>
            {Number(amount) > 0 && (() => {
              const mBase  = monthlySalary(Number(amount), frequency);
              const mAllow = monthlySalary(Number(allowance) || 0, allowanceFreq);
              const mDed   = monthlySalary(Number(sss) || 0, frequency) + monthlySalary(Number(philhealth) || 0, frequency)
                           + monthlySalary(Number(pagibig) || 0, frequency) + monthlySalary(Number(tax) || 0, frequency);
              const mNet   = mBase + mAllow - mDed;
              return (
                <div className="field full">
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5, background: "var(--accent-bg)", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--muted)" }}>Basic / month</span>
                      <span style={{ fontWeight: 700 }}>{money(mBase)}</span>
                    </div>
                    {mAllow > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--muted)" }}>Allowance / month{allowanceTaxable ? "" : " (non-taxable)"}</span>
                        <span style={{ fontWeight: 700 }}>{money(mAllow)}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--muted)" }}>Deductions / month</span>
                      <span style={{ fontWeight: 700, color: "var(--danger)" }}>− {money(mDed)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--accent-soft)", paddingTop: 4, marginTop: 2 }}>
                      <span style={{ color: "var(--text)", fontWeight: 700 }}>Net take-home</span>
                      <span style={{ fontWeight: 800, color: "var(--accent)" }}>{money(mNet)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="modalactions">
            <button type="button" className="btn secondary" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="btn primary" disabled={busy}>{busy ? "Saving…" : initial ? "Save changes" : "Add entry"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GrowthPill({ pct }) {
  if (pct == null) {
    return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, color: "var(--muted)", background: "var(--accent-bg)" }}>Starting point</span>;
  }
  const up = pct >= 0;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
      color: up ? "var(--good)" : "var(--danger)",
      background: up ? "var(--good-bg, #e6f7ef)" : "#fdeaea",
    }}>
      {up ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function dateLabel(iso) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function SalaryRow({ entry, isLatest, onEdit, onDelete }) {
  const freqLabel = (FREQUENCIES.find((f) => f.value === entry.frequency) || {}).label || "Monthly";
  return (
    <div className="card salary-row">
      <div className="salary-row-icon" style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-bg)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <IconSalary />
      </div>
      <div className="salary-row-main" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, fontSize: 16 }}>{money(entry.amount)}</span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>/ {freqLabel.toLowerCase()}</span>
          {entry.allowance > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "var(--accent-bg)", padding: "2px 8px", borderRadius: 20 }}>
              +{money(entry.allowance)} {entry.allowanceLabel || "allowance"}
            </span>
          )}
          {isLatest && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", background: "var(--accent-bg)", padding: "2px 7px", borderRadius: 20 }}>CURRENT</span>}
        </div>
        <div className="salary-row-meta" style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
          {dateLabel(entry.effectiveDate)}
          {entry.changeType && ` · ${entry.changeType}`}
          {entry.title && ` · ${entry.title}`}
          {entry.employer && ` · ${entry.employer}`}
        </div>
        {entry.allowance > 0 && (
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, display: "flex", flexWrap: "wrap", gap: 10 }}>
            <span>Basic <strong>{money(entry.monthlyBase)}</strong>/mo</span>
            <span>Allowance <strong>{money(entry.monthlyAllowance)}</strong>/mo{entry.allowanceTaxable === false ? " (non-taxable)" : ""}</span>
          </div>
        )}
        {entry.monthlyDeductions > 0 && (
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span>Net ≈ <strong style={{ color: "var(--accent)" }}>{money(entry.monthlyNet)}</strong>/mo</span>
            <span style={{ color: "var(--muted)" }}>
              (− {money(entry.monthlyDeductions)}:
              {entry.monthlySSS > 0 && ` SSS ${money(entry.monthlySSS)}`}
              {entry.monthlyPhilhealth > 0 && ` · PH ${money(entry.monthlyPhilhealth)}`}
              {entry.monthlyPagibig > 0 && ` · PI ${money(entry.monthlyPagibig)}`}
              {entry.monthlyTax > 0 && ` · Tax ${money(entry.monthlyTax)}`})
            </span>
          </div>
        )}
        {entry.note && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, fontStyle: "italic" }}>{entry.note}</div>}
      </div>
      <div className="salary-row-growth" style={{ textAlign: "right", flexShrink: 0 }}>
        <GrowthPill pct={entry.growthPct} />
        {entry.growthAmount != null && entry.growthAmount !== 0 && (
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
            {entry.growthAmount > 0 ? "+" : ""}{money(entry.growthAmount)}/mo
          </div>
        )}
      </div>
      <div className="salary-row-actions" style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <button className="tx-delete-btn" title="Edit" onClick={() => onEdit(entry)}><IconEdit size={15} /></button>
        <button className="tx-delete-btn" title="Delete" onClick={() => onDelete(entry)}><IconTrash size={15} /></button>
      </div>
    </div>
  );
}

export default function Salary({ salaries, onAdd, onUpdate, onDelete }) {
  const [modalOpen, setModalOpen]         = useState(false);
  const [editing, setEditing]             = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const toast = useToast();

  const progression = useMemo(() => salaryProgression(salaries), [salaries]);
  const latest = progression[0] || null;

  const stats = useMemo(() => {
    if (progression.length === 0) return null;
    const first = progression[progression.length - 1];
    const totalGrowth = first.monthlyEquivalent > 0
      ? ((latest.monthlyEquivalent - first.monthlyEquivalent) / first.monthlyEquivalent) * 100
      : null;
    return {
      current: latest.monthlyEquivalent,
      base: latest.monthlyBase,
      allowance: latest.monthlyAllowance,
      gross: latest.monthlyGross,
      deductions: latest.monthlyDeductions,
      net: latest.monthlyNet,
      annual: latest.monthlyGross * 12,
      annualNet: latest.monthlyNet * 12,
      totalGrowth,
      raises: progression.length - 1,
    };
  }, [progression, latest]);

  function openAdd() { setEditing(null); setModalOpen(true); }
  function openEdit(s) { setEditing(s); setModalOpen(true); }

  async function handleSave(data) {
    if (editing) { await onUpdate(editing.id, data); toast.success("Salary entry updated."); }
    else { await onAdd(data); toast.success("Salary entry added."); }
  }

  async function confirmDelete() {
    const s = pendingDelete;
    setPendingDelete(null);
    try { await onDelete(s.id); toast.success("Entry removed."); }
    catch (e) { toast.error("Delete failed: " + e.message); }
  }

  return (
    <>
      <div className="salary-header">
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Salary Progression</h2>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
            Log every pay change with its effective date and watch your income grow over time.
          </p>
        </div>
        <button className="btn primary salary-add-btn" onClick={openAdd}><IconPlus /> Add entry</button>
      </div>

      {stats && (
        <div className="grid salary-kpis" style={{ marginBottom: 18 }}>
          <div className="card kpi">
            <div className="label">Basic + Allowance (monthly)</div>
            <div className="value" style={{ fontSize: 20 }}>
              {money(stats.base)}
              {stats.allowance > 0 && <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600 }}> + {money(stats.allowance)}</span>}
            </div>
            <small>{stats.allowance > 0 ? "basic + allowance (shown separately)" : "basic pay"}</small>
          </div>
          <div className="card kpi">
            <div className="label">Deductions (monthly)</div>
            <div className="value">{stats.deductions > 0 ? `− ${money(stats.deductions)}` : "—"}</div>
            <small>SSS · PhilHealth · Pag-IBIG · tax</small>
          </div>
          <div className="card kpi kpi-accent">
            <div className="label">Net take-home (monthly)</div>
            <div className="value">{money(stats.net)}</div>
            <small>≈ {money(stats.annualNet)} / year</small>
          </div>
          <div className="card kpi">
            <div className="label">Total growth</div>
            <div className="value">{stats.totalGrowth == null ? "—" : `${stats.totalGrowth >= 0 ? "+" : ""}${stats.totalGrowth.toFixed(1)}%`}</div>
            <small>{stats.raises} change{stats.raises !== 1 ? "s" : ""} · {progression.length} entries</small>
          </div>
        </div>
      )}

      {progression.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: "48px 20px" }}>
            <div style={{ marginBottom: 12, opacity: .4 }}><IconSalary size={40} /></div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No salary history yet</div>
            <div style={{ fontSize: 12 }}>Add your current salary to start tracking progression over time.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {progression.map((entry, i) => (
            <SalaryRow key={entry.id} entry={entry} isLatest={i === 0} onEdit={openEdit} onDelete={setPendingDelete} />
          ))}
        </div>
      )}

      {modalOpen && (
        <SalaryModal initial={editing} onSave={handleSave} onClose={() => setModalOpen(false)} />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        danger
        title="Delete this salary entry?"
        message="This removes the entry from your progression history. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

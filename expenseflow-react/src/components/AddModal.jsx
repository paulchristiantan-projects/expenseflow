import { useState, useEffect, useRef } from "react";
import { CATEGORIES, defaultDateForMonth, money } from "../helpers";
import { IconClose } from "./Icons";
import CategorySelect from "./CategorySelect";

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export default function AddModal({ open, month, onClose, onSave, categories = CATEGORIES, onAddCategory }) {
  const [date, setDate] = useState(defaultDateForMonth(month));
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState(categories[0] || CATEGORIES[0]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const descRef = useRef(null);

  useEffect(() => {
    if (open) {
      setDate(defaultDateForMonth(month));
      setAmount("");
      setDesc("");
      setCategory(categories[0] || CATEGORIES[0]);
      setErr("");
      setSaving(false);
      // focus description shortly after the modal paints
      setTimeout(() => descRef.current?.focus(), 60);
    }
  }, [open, month]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function save() {
    if (saving) return;
    if (!date || !amount || !desc.trim()) {
      setErr("Please complete the date, amount, and description.");
      return;
    }
    if (Number(amount) <= 0) {
      setErr("Amount must be greater than zero.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ date, amount: Number(amount), desc: desc.trim(), category });
      onClose();
    } catch (e) {
      setErr("Could not save: " + (e?.message || "unknown error"));
      setSaving(false);
    }
  }

  return (
    <div
      className={"modal" + (open ? " open" : "")}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modalbox">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>Add expense</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }} aria-label="Close">
            <IconClose />
          </button>
        </div>

        {err && <div className="banner" style={{ marginBottom: 14 }}>{err}</div>}

        <div className="formgrid">
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Amount (PHP)</label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="field full">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {QUICK_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className="chip"
                  onClick={() => setAmount(String(a))}
                >
                  {money(a).replace(".00", "")}
                </button>
              ))}
            </div>
          </div>
          <div className="field full">
            <label>Description</label>
            <input
              ref={descRef}
              placeholder="e.g. Lunch"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <div className="field full">
            <label>Category</label>
            <CategorySelect
              value={category}
              onChange={setCategory}
              categories={categories}
              onAddCategory={onAddCategory}
            />
          </div>
        </div>
        <div className="modalactions">
          <button className="btn secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save expense"}
          </button>
        </div>
      </div>
    </div>
  );
}

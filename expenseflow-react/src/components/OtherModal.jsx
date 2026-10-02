import { useState, useEffect, useRef } from "react";
import { CATEGORIES } from "../helpers";
import { IconClose } from "./Icons";
import CategorySelect from "./CategorySelect";

// Modal to add an "Other" expense (recurring / separate from daily spending).
export default function OtherModal({ open, onClose, onSave, categories = CATEGORIES, onAddCategory }) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const descRef = useRef(null);

  useEffect(() => {
    if (open) {
      setDesc(""); setAmount(""); setCategory("Other"); setErr(""); setSaving(false);
      setTimeout(() => descRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function save() {
    if (saving) return;
    if (!desc.trim() || !amount) { setErr("Enter a description and amount."); return; }
    if (Number(amount) <= 0) { setErr("Amount must be greater than zero."); return; }
    setSaving(true);
    try {
      await onSave({ desc: desc.trim(), amount: Number(amount), category });
      onClose();
    } catch (e) {
      setErr("Could not save: " + (e?.message || "unknown error"));
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal open" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modalbox" style={{ width: "min(440px, 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>Add other expense</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }} aria-label="Close">
            <IconClose />
          </button>
        </div>

        {err && <div className="banner" style={{ marginBottom: 14 }}>{err}</div>}

        <div className="formgrid">
          <div className="field full">
            <label>Description</label>
            <input ref={descRef} placeholder="e.g. Netflix subscription" value={desc} onChange={(e) => setDesc(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} />
          </div>
          <div className="field">
            <label>Amount (PHP)</label>
            <input type="number" step="0.01" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} />
          </div>
          <div className="field">
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
          <button className="btn secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

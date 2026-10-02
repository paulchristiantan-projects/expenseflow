import { useState } from "react";

// A category dropdown that supports adding a new custom category inline.
// props:
//  value, onChange       — controlled selected category name
//  categories            — array of category name strings to show
//  onAddCategory(name)   — async; persists a new custom category
export default function CategorySelect({ value, onChange, categories, onAddCategory }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirmAdd() {
    const name = draft.trim();
    if (!name) { setAdding(false); return; }
    // If it already exists (case-insensitive), just select it.
    const existing = categories.find((c) => c.toLowerCase() === name.toLowerCase());
    if (existing) { onChange(existing); setAdding(false); setDraft(""); return; }
    setBusy(true);
    try {
      await onAddCategory?.(name);
      onChange(name);
      setDraft("");
      setAdding(false);
    } finally {
      setBusy(false);
    }
  }

  if (adding) {
    return (
      <div style={{ display: "flex", gap: 6 }}>
        <input
          autoFocus
          placeholder="New category name"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); confirmAdd(); }
            if (e.key === "Escape") { setAdding(false); setDraft(""); }
          }}
          style={{ flex: 1 }}
        />
        <button type="button" className="btn primary" style={{ padding: "8px 12px" }} onClick={confirmAdd} disabled={busy}>
          {busy ? "…" : "Add"}
        </button>
        <button type="button" className="btn secondary" style={{ padding: "8px 12px" }} onClick={() => { setAdding(false); setDraft(""); }}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === "__add__") { setAdding(true); return; }
        onChange(e.target.value);
      }}
    >
      {categories.map((x) => <option key={x} value={x}>{x}</option>)}
      <option value="__add__">＋ Add new category…</option>
    </select>
  );
}

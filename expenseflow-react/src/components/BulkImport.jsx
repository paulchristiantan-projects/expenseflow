import { useState } from "react";
import { parseBulk } from "../parseBulk";

// Offer a range of years to default to when a date header omits the year.
const YEAR_OPTIONS = (() => {
  const now = new Date().getFullYear();
  const years = [];
  for (let y = now + 1; y >= 2020; y--) years.push(y);
  return years;
})();

export default function BulkImport({ onImport }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  async function handleImport() {
    const { tx, others } = parseBulk(text, Number(year));
    if (!tx.length && !others.length) {
      alert("No transactions detected. Check the format.");
      return;
    }
    setBusy(true);
    try {
      await onImport(tx, others);
      const parts = [];
      if (tx.length) parts.push(`${tx.length} transactions`);
      if (others.length) parts.push(`${others.length} other expenses`);
      alert(`Imported ${parts.join(" and ")}.`);
      setText("");
    } catch (e) {
      alert("Import failed: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ marginTop: 0 }}>
      <div className="section-title">
        <h2>Bulk import</h2>
        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
          <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>
            Default year
          </label>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button className="btn primary" onClick={handleImport} disabled={busy}>
            {busy ? "Importing..." : "Import transactions"}
          </button>
        </div>
      </div>
      <p style={{ color: "var(--muted)", fontSize: 13 }}>
        Paste your original format. The app detects dates and lines like{" "}
        <b>260 - Mototaxi</b>. Lines beginning with “Total:” are ignored because the app
        calculates totals automatically.
      </p>
      <textarea
        style={{ width: "100%", height: 390 }}
        placeholder={"2025\nJuly 1\n\n55 - Mototaxi\n105 - Lunch\n71 - Mototaxi"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="notice">
        Tip: Dates without a year use the <b>Default year</b> above. You can also write
        the year inline (<b>08/01/2025</b> or <b>August 1, 2025</b>) or put a year on its
        own line (<b>2025</b>) to set it for everything below. Ranges like “08/29 - 08/31”
        store under the first date. Add an <b>Others:</b> line to send amounts to the Other
        Expenses tab. “Total” lines are ignored.
      </div>
    </div>
  );
}

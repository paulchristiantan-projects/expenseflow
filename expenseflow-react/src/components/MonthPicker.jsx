import { useState, useRef, useEffect, useMemo } from "react";
import { monthLabel } from "../helpers";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// A styled month picker popover. `value` and options are "YYYY-MM" keys.
// `months` is the list of known months (used to mark which have data).
export default function MonthPicker({ value, onChange, months = [] }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => Number(value.slice(0, 4)));
  const ref = useRef(null);

  const [selYear, selMonth] = useMemo(() => value.split("-").map(Number), [value]);
  const withData = useMemo(() => new Set(months), [months]);

  useEffect(() => {
    if (open) setYear(Number(value.slice(0, 4)));
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  function pick(m) {
    onChange(`${year}-${String(m + 1).padStart(2, "0")}`);
    setOpen(false);
  }

  return (
    <div className="mp" ref={ref}>
      <button type="button" className="mp-trigger" onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open}>
        <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.5" y="3.5" width="13" height="12" rx="2" /><path d="M2.5 7h13M6 2v3M12 2v3" />
        </svg>
        <span>{monthLabel(value)}</span>
        <svg className={`mp-caret ${open ? "up" : ""}`} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 4.5L6 7.5l3-3" />
        </svg>
      </button>

      {open && (
        <div className="mp-pop" role="dialog">
          <div className="mp-head">
            <button type="button" className="mp-nav" onClick={() => setYear((y) => y - 1)} aria-label="Previous year">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 3L4.5 7l4 4" /></svg>
            </button>
            <div className="mp-year">{year}</div>
            <button type="button" className="mp-nav" onClick={() => setYear((y) => y + 1)} aria-label="Next year">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 3l4 4-4 4" /></svg>
            </button>
          </div>
          <div className="mp-grid">
            {MONTHS_SHORT.map((label, i) => {
              const key = `${year}-${String(i + 1).padStart(2, "0")}`;
              const isSel = year === selYear && i + 1 === selMonth;
              const hasData = withData.has(key);
              return (
                <button
                  key={label}
                  type="button"
                  className={`mp-month${isSel ? " sel" : ""}${hasData ? " has-data" : ""}`}
                  onClick={() => pick(i)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

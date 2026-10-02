import { useEffect } from "react";
import { IconClose } from "./Icons";

// Controlled confirm dialog.
// props: open, title, message, confirmLabel, cancelLabel, danger, onConfirm, onCancel
export default function ConfirmDialog({
  open, title = "Are you sure?", message, confirmLabel = "Confirm",
  cancelLabel = "Cancel", danger = false, onConfirm, onCancel,
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Enter")  onConfirm?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <div className="modal open" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}>
      <div className="modalbox" style={{ width: "min(400px, 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: danger ? "var(--danger-bg)" : "var(--accent-bg)",
              color: danger ? "var(--danger)" : "var(--accent)",
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2.5L18 16.5H2z" /><path d="M10 8v3.5M10 14v.2" />
              </svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{title}</h2>
              {message && <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>{message}</p>}
            </div>
          </div>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }} aria-label="Close">
            <IconClose />
          </button>
        </div>
        <div className="modalactions">
          <button className="btn secondary" onClick={onCancel}>{cancelLabel}</button>
          <button
            className="btn primary"
            style={danger ? { background: "var(--danger)", boxShadow: "0 4px 14px rgba(224,57,43,.3)" } : undefined}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

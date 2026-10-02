import { createContext, useContext, useState, useCallback, useMemo, useRef } from "react";

const ToastContext = createContext(null);

let idSeq = 0;

function ToastIcon({ type }) {
  const s = { width: 18, height: 18, viewBox: "0 0 18 18", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
  if (type === "success") return <svg {...s}><circle cx="9" cy="9" r="7.5" /><path d="M5.5 9.2l2.3 2.3 4.7-5" /></svg>;
  if (type === "error")   return <svg {...s}><circle cx="9" cy="9" r="7.5" /><path d="M9 5.5v4M9 12.3v.2" /></svg>;
  return <svg {...s}><circle cx="9" cy="9" r="7.5" /><path d="M9 8.2v4.3M9 5.5v.2" /></svg>;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    if (timers.current[id]) { clearTimeout(timers.current[id]); delete timers.current[id]; }
  }, []);

  const push = useCallback((message, type = "info", duration = 3200) => {
    const id = ++idSeq;
    setToasts((t) => [...t, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const toast = useMemo(() => ({
    success: (m, d) => push(m, "success", d),
    error:   (m, d) => push(m, "error", d ?? 4500),
    info:    (m, d) => push(m, "info", d),
  }), [push]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" role="region" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} onClick={() => dismiss(t.id)}>
            <span className="toast-icon"><ToastIcon type={t.type} /></span>
            <span className="toast-msg">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback so components never crash if provider is missing
    return { success: () => {}, error: () => {}, info: () => {} };
  }
  return ctx;
}

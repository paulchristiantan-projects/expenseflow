import { useState } from "react";
import { money } from "../helpers";
import { IconPlus, IconEdit, IconTrash, IconClose } from "./Icons";

const WALLET_COLORS = [
  { label: "Green",  value: "#2d6a2d" },
  { label: "Blue",   value: "#1a5fa8" },
  { label: "Purple", value: "#6b3fa0" },
  { label: "Orange", value: "#c05c1a" },
  { label: "Red",    value: "#a82020" },
  { label: "Teal",   value: "#0e7c7b" },
  { label: "Pink",   value: "#a0316b" },
  { label: "Dark",   value: "#2a2a3a" },
];

const WALLET_ICONS = [
  { label: "Bank",    value: "bank" },
  { label: "Wallet",  value: "wallet" },
  { label: "Phone",   value: "phone" },
  { label: "Card",    value: "card" },
  { label: "Cash",    value: "cash" },
  { label: "Savings", value: "savings" },
];

function WalletSvgIcon({ type, size = 22 }) {
  const s = { width: size, height: size, viewBox: "0 0 22 22", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" };
  if (type === "bank") return (
    <svg {...s}><path d="M3 9h16M3 9l8-5 8 5M5 9v7M9 9v7M13 9v7M17 9v7M3 16h16"/></svg>
  );
  if (type === "phone") return (
    <svg {...s}><rect x="6" y="2" width="10" height="18" rx="2"/><circle cx="11" cy="17" r="1" fill="currentColor" stroke="none"/></svg>
  );
  if (type === "card") return (
    <svg {...s}><rect x="2" y="6" width="18" height="12" rx="2"/><path d="M2 10h18"/><path d="M6 14h3"/></svg>
  );
  if (type === "cash") return (
    <svg {...s}><rect x="2" y="6" width="18" height="12" rx="2"/><circle cx="11" cy="12" r="3"/></svg>
  );
  if (type === "savings") return (
    <svg {...s}><path d="M4 16c0-4 3-7 7-7s7 3 7 7"/><path d="M11 9V5"/><path d="M8 5h6"/><circle cx="16" cy="16" r="1" fill="currentColor" stroke="none"/></svg>
  );
  // default: wallet
  return (
    <svg {...s}><rect x="2" y="6" width="18" height="12" rx="2"/><path d="M16 12h2"/><path d="M2 10h18"/></svg>
  );
}

function WalletModal({ initial, onSave, onClose }) {
  const [name,    setName]    = useState(initial?.name    ?? "");
  const [balance, setBalance] = useState(initial?.balance ?? "");
  const [color,   setColor]   = useState(initial?.color   ?? WALLET_COLORS[0].value);
  const [icon,    setIcon]    = useState(initial?.icon    ?? "wallet");

  function submit(e) {
    e.preventDefault();
    if (!name.trim() || balance === "") return;
    onSave({ name: name.trim(), balance: Number(balance), color, icon });
  }

  return (
    <div className="modal open">
      <div className="modalbox" style={{ width: "min(440px,100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            {initial ? "Edit account" : "Add account"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}>
            <IconClose />
          </button>
        </div>

        {/* Preview card */}
        <div style={{
          borderRadius: 14, padding: "18px 20px", marginBottom: 20,
          background: color, color: "#fff",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ opacity: .9 }}><WalletSvgIcon type={icon} size={28} /></div>
          <div>
            <div style={{ fontSize: 13, opacity: .8, marginBottom: 2 }}>{name || "Account name"}</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              {balance !== "" ? money(Number(balance)) : "₱0.00"}
            </div>
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="formgrid">
            <div className="field full">
              <label>Account name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. BPI, GCash, Maya" required />
            </div>
            <div className="field full">
              <label>Balance (PHP)</label>
              <input type="number" step="0.01" min="0" value={balance}
                onChange={(e) => setBalance(e.target.value)} placeholder="0.00" required />
            </div>
            <div className="field full">
              <label>Icon</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {WALLET_ICONS.map((w) => (
                  <button key={w.value} type="button" onClick={() => setIcon(w.value)}
                    style={{
                      padding: "8px 10px", borderRadius: 10, cursor: "pointer",
                      border: `2px solid ${icon === w.value ? color : "var(--line)"}`,
                      background: icon === w.value ? "var(--accent-bg)" : "var(--card)",
                      color: icon === w.value ? color : "var(--muted)",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      fontSize: 10, fontWeight: 600,
                    }}>
                    <WalletSvgIcon type={w.value} size={18} />
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="field full">
              <label>Color</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {WALLET_COLORS.map((c) => (
                  <button key={c.value} type="button" onClick={() => setColor(c.value)}
                    title={c.label}
                    style={{
                      width: 30, height: 30, borderRadius: "50%", background: c.value,
                      border: color === c.value ? "3px solid var(--text)" : "3px solid transparent",
                      cursor: "pointer", flexShrink: 0,
                    }} />
                ))}
              </div>
            </div>
          </div>
          <div className="modalactions">
            <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary">
              {initial ? "Save changes" : "Add account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Budget({ wallets, onAdd, onUpdate, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null); // wallet object or null

  const total = wallets.reduce((s, w) => s + w.balance, 0);

  function openAdd()      { setEditing(null);    setShowModal(true); }
  function openEdit(w)    { setEditing(w);        setShowModal(true); }
  function closeModal()   { setShowModal(false);  setEditing(null); }

  async function handleSave(data) {
    if (editing) await onUpdate(editing.id, data);
    else         await onAdd(data);
    closeModal();
  }

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Budget & Accounts</h2>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
            Track your balances across banks and e-wallets
          </p>
        </div>
        <button className="btn primary" onClick={openAdd}>
          <IconPlus /> Add account
        </button>
      </div>

      {/* Total balance summary */}
      {wallets.length > 0 && (
        <div className="card" style={{
          background: "var(--accent)", color: "#fff", border: "none",
          marginBottom: 18, display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, opacity: .8, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>
              Total balance
            </div>
            <div style={{ fontSize: 30, fontWeight: 800 }}>{money(total)}</div>
            <div style={{ fontSize: 12, opacity: .7, marginTop: 4 }}>{wallets.length} account{wallets.length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ opacity: .25 }}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="18" width="44" height="30" rx="6"/>
              <path d="M6 28h44"/><circle cx="42" cy="36" r="3" fill="currentColor" stroke="none"/>
              <path d="M16 10h24"/>
            </svg>
          </div>
        </div>
      )}

      {/* Wallet cards grid */}
      {wallets.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: "48px 20px" }}>
            <div style={{ marginBottom: 12, opacity: .4 }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="12" width="32" height="22" rx="4"/>
                <path d="M4 20h32"/><circle cx="30" cy="27" r="2" fill="currentColor" stroke="none"/>
                <path d="M12 7h16"/>
              </svg>
            </div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No accounts yet</div>
            <div style={{ fontSize: 12 }}>Add your banks and e-wallets to track your balances</div>
          </div>
        </div>
      ) : (
        <div className="wallet-grid">
          {wallets.map((w) => (
            <div key={w.id} className="wallet-card" style={{ background: w.color }}>
              <div className="wallet-card-top">
                <div className="wallet-card-icon">
                  <WalletSvgIcon type={w.icon || "wallet"} size={22} />
                </div>
                <div className="wallet-card-actions">
                  <button onClick={() => openEdit(w)} title="Edit">
                    <IconEdit size={14} />
                  </button>
                  <button onClick={() => { if (confirm(`Remove ${w.name}?`)) onDelete(w.id); }} title="Delete">
                    <IconTrash size={14} />
                  </button>
                </div>
              </div>
              <div className="wallet-card-name">{w.name}</div>
              <div className="wallet-card-balance">{money(w.balance)}</div>
              <div className="wallet-card-pct">
                {total > 0 ? Math.round((w.balance / total) * 100) : 0}% of total
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <WalletModal initial={editing} onSave={handleSave} onClose={closeModal} />
      )}
    </>
  );
}

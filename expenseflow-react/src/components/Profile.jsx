import { useState } from "react";
import { updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import { IconSun, IconMoon } from "./Icons";

export default function Profile({ user, theme, onThemeChange }) {
  const [name, setName] = useState(user.displayName || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  async function saveName(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setMsg(null);
    try {
      await updateProfile(auth.currentUser, { displayName: name.trim() });
      setMsg({ type: "ok", text: "Display name updated." });
    } catch (err) {
      setMsg({ type: "error", text: "Failed to update name: " + err.message });
    } finally {
      setSaving(false);
    }
  }

  const initials = (user.displayName || user.email || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div style={{ maxWidth: 520 }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 800 }}>Profile</h2>

      {/* Avatar + email */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "var(--accent)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 800, flexShrink: 0,
          letterSpacing: ".02em",
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{user.displayName || "—"}</div>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>{user.email}</div>
        </div>
      </div>

      {/* Edit name */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Display name</div>
        {msg && (
          <div className={msg.type === "ok" ? "notice" : "banner"} style={{ marginBottom: 12, marginTop: 0 }}>
            {msg.text}
          </div>
        )}
        <form onSubmit={saveName} style={{ display: "flex", gap: 10 }}>
          <input
            style={{ flex: 1 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your display name"
          />
          <button className="btn primary" type="submit" disabled={saving || !name.trim()}>
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
          Email address: <strong>{user.email}</strong>
        </div>
      </div>

      {/* Theme */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Appearance</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => onThemeChange("light")}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "14px 10px",
              borderRadius: "var(--radius-sm)",
              border: `2px solid ${theme === "light" ? "var(--accent)" : "var(--line)"}`,
              background: theme === "light" ? "var(--accent-bg)" : "transparent",
              cursor: "pointer",
              color: theme === "light" ? "var(--accent)" : "var(--muted)",
              fontWeight: 600,
              fontSize: 13,
              transition: "all .15s",
            }}
          >
            <IconSun size={22} />
            Light
          </button>
          <button
            onClick={() => onThemeChange("dark")}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "14px 10px",
              borderRadius: "var(--radius-sm)",
              border: `2px solid ${theme === "dark" ? "var(--accent)" : "var(--line)"}`,
              background: theme === "dark" ? "var(--accent-bg)" : "transparent",
              cursor: "pointer",
              color: theme === "dark" ? "var(--accent)" : "var(--muted)",
              fontWeight: 600,
              fontSize: 13,
              transition: "all .15s",
            }}
          >
            <IconMoon size={22} />
            Dark
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { updateProfile } from "firebase/auth";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "../firebase";
import { IconSun, IconMoon } from "./Icons";
import { ACCENTS } from "../accents";
import { getInitials } from "../helpers";
import { useToast } from "./Toast";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

export default function Profile({ user, theme, onThemeChange, accent, onAccentChange }) {
  const [name, setName] = useState(user.displayName || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoURL, setPhotoURL] = useState(user.photoURL || "");
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);
  const toast = useToast();

  async function saveName(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setMsg(null);
    try {
      await updateProfile(auth.currentUser, { displayName: name.trim() });
      setMsg({ type: "ok", text: "Display name updated." });
      toast.success("Display name updated.");
    } catch (err) {
      setMsg({ type: "error", text: "Failed to update name: " + err.message });
      toast.error("Failed to update name.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file."); return; }
    if (file.size > MAX_AVATAR_BYTES) { toast.error("Image is too large (max 2 MB)."); return; }
    if (!storage) { toast.error("Storage isn't configured."); return; }

    setUploading(true);
    try {
      const path = `avatars/${user.uid}/${Date.now()}-${file.name}`;
      const r = storageRef(storage, path);
      await uploadBytes(r, file, { contentType: file.type });
      const url = await getDownloadURL(r);
      await updateProfile(auth.currentUser, { photoURL: url });
      setPhotoURL(url);
      toast.success("Profile photo updated.");
    } catch (err) {
      toast.error("Upload failed: " + (err?.message || "unknown error"));
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    setUploading(true);
    try {
      await updateProfile(auth.currentUser, { photoURL: "" });
      setPhotoURL("");
      toast.success("Reverted to initials.");
    } catch (err) {
      toast.error("Could not remove photo: " + (err?.message || "unknown error"));
    } finally {
      setUploading(false);
    }
  }

  const initials = getInitials(user.displayName, user.email);

  return (
    <div style={{ maxWidth: 520 }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 800 }}>Profile</h2>

      {/* Avatar + email */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
        <div className="avatar-wrap">
          {photoURL ? (
            <img src={photoURL} alt="Profile" className="avatar-img" />
          ) : (
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "var(--accent)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 800, letterSpacing: ".02em",
            }}>
              {initials}
            </div>
          )}
          <button
            className="avatar-edit"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title="Change photo"
            aria-label="Change profile photo"
          >
            {uploading ? (
              <svg width="12" height="12" viewBox="0 0 12 12" style={{ animation: "spin .8s linear infinite" }} fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 1a5 5 0 1 0 5 5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 10.5V12h1.5l6-6L8 4.5l-6 6z" /><path d="M9 4l1 1" />
              </svg>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{user.displayName || "—"}</div>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>{user.email}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn secondary" style={{ fontSize: 12, padding: "6px 11px" }} onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading…" : photoURL ? "Change photo" : "Upload photo"}
            </button>
            {photoURL && (
              <button className="btn secondary" style={{ fontSize: 12, padding: "6px 11px", color: "var(--danger)", borderColor: "var(--danger)" }} onClick={removePhoto} disabled={uploading}>
                Remove
              </button>
            )}
          </div>
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
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Appearance</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => onThemeChange("light")}
            style={themeBtnStyle(theme === "light")}
          >
            <IconSun size={22} />
            Light
          </button>
          <button
            onClick={() => onThemeChange("dark")}
            style={themeBtnStyle(theme === "dark")}
          >
            <IconMoon size={22} />
            Dark
          </button>
        </div>
      </div>

      {/* Accent color */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Accent color</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
          Personalize the highlight color used across the app.
        </div>
        <div className="accent-grid">
          {Object.entries(ACCENTS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              className={`accent-swatch${accent === key ? " active" : ""}`}
              onClick={() => onAccentChange(key)}
            >
              <span className="accent-dot" style={{ background: preset.swatch }} />
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function themeBtnStyle(active) {
  return {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "14px 10px",
    borderRadius: "var(--radius-sm)",
    border: `2px solid ${active ? "var(--accent)" : "var(--line)"}`,
    background: active ? "var(--accent-bg)" : "transparent",
    cursor: "pointer",
    color: active ? "var(--accent)" : "var(--muted)",
    fontWeight: 600,
    fontSize: 13,
    transition: "all .15s",
  };
}

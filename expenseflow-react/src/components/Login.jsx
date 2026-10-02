import { useState } from "react";
import { IconLeaf } from "./Icons";

function friendlyError(code) {
  const map = {
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/missing-password": "Please enter a password.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/popup-closed-by-user": "Sign-in popup was closed before finishing.",
    "auth/configuration-not-found":
      "Authentication isn't enabled in Firebase yet. Enable Email/Password and Google in the console.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

export default function Login({ auth }) {
  const { loginGoogle, loginEmail, registerEmail, resetPassword } = auth;
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function run(fn) {
    setMsg(null);
    setBusy(true);
    try { await fn(); }
    catch (e) { setMsg({ type: "error", text: friendlyError(e.code) }); }
    finally { setBusy(false); }
  }

  function submit(e) {
    e.preventDefault();
    if (mode === "login") run(() => loginEmail(email, password));
    else run(() => registerEmail(email, password));
  }

  async function handleReset() {
    if (!email) { setMsg({ type: "error", text: "Enter your email first, then tap reset." }); return; }
    await run(async () => {
      await resetPassword(email);
      setMsg({ type: "ok", text: "Password reset email sent. Check your inbox." });
    });
  }

  return (
    <div className="login-page">
      {/* ── Left brand panel (desktop) ── */}
      <div className="login-brand-panel">
        <div className="login-brand-inner">
          <div className="login-brand-logo">
            <IconLeaf size={30} />
          </div>
          <div className="login-brand-title">Expense<span>Flow</span></div>
          <p className="login-brand-tag">
            Track spending, split house bills, and plan trips — all in one calm, focused place.
          </p>
          <ul className="login-brand-points">
            <li><span className="lb-dot" /> Personal & shared expense tracking</li>
            <li><span className="lb-dot" /> Split house bills with housemates</li>
            <li><span className="lb-dot" /> Budgets, wallets & travel planning</li>
          </ul>
        </div>
        <div className="login-brand-orb login-brand-orb-1" />
        <div className="login-brand-orb login-brand-orb-2" />
      </div>

      {/* ── Right form panel ── */}
      <div className="login-form-panel">
        <div className="login-card-wrap">
          {/* Compact logo (mobile) */}
          <div className="login-logo-mobile">
            <div className="login-logo-badge"><IconLeaf size={22} /></div>
            <div className="login-logo-text">Expense<span>Flow</span></div>
          </div>

          <div className="login-heading">
            <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
            <p>{mode === "login" ? "Sign in to continue to your dashboard." : "Start tracking your expenses in minutes."}</p>
          </div>

          {msg && (
            <div className={msg.type === "ok" ? "notice" : "banner"} style={{ marginBottom: 16 }}>
              {msg.text}
            </div>
          )}

          <form onSubmit={submit} style={{ display: "grid", gap: 15 }}>
            <div className="field">
              <label>Email</label>
              <div className="input-icon-wrap">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1.5" y="3" width="13" height="10" rx="2" /><path d="M2 4l6 4.5L14 4" />
                  </svg>
                </span>
                <input type="email" autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </div>
            <div className="field">
              <label>Password</label>
              <div className="input-icon-wrap">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5 7V5a3 3 0 0 1 6 0v2" />
                  </svg>
                </span>
                <input type={showPw ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters" />
                <button type="button" className="input-trailing" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? "Hide password" : "Show password"}>
                  {showPw ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 2l12 12M6.5 6.6a2 2 0 0 0 2.8 2.8" /><path d="M4.3 4.5C2.7 5.5 1.5 8 1.5 8s2.5 4.5 6.5 4.5c1.2 0 2.2-.3 3.1-.8M13 11.4c1-1 1.5-3.4 1.5-3.4S12 3.5 8 3.5c-.5 0-.9 0-1.3.1" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" /><circle cx="8" cy="8" r="2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button className="btn primary" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center", padding: "13px" }}>
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
            {mode === "login" && (
              <button type="button" onClick={handleReset}
                style={{ background: "none", border: 0, color: "var(--accent)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, justifySelf: "start" }}>
                Forgot password?
              </button>
            )}
          </form>

          <div className="login-divider"><span>or</span></div>

          <button className="btn secondary login-google" style={{ width: "100%", justifyContent: "center", padding: "13px", gap: 10 }}
            onClick={() => run(loginGoogle)} disabled={busy}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z"/>
              <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z"/>
              <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"/>
            </svg>
            Continue with Google
          </button>

          <p className="login-switch">
            {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
            <button type="button"
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setMsg(null); }}>
              {mode === "login" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

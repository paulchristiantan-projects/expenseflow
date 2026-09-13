import { useState } from "react";

// Maps Firebase auth error codes to readable messages.
function friendlyError(code) {
  const map = {
    "auth/invalid-email": "That email address doesn’t look right.",
    "auth/missing-password": "Please enter a password.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/popup-closed-by-user": "Sign-in popup was closed before finishing.",
    "auth/configuration-not-found":
      "Authentication isn’t enabled in Firebase yet. Enable Email/Password and Google in the console.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

export default function Login({ auth }) {
  const { loginGoogle, loginEmail, registerEmail, resetPassword } = auth;
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function run(fn) {
    setMsg(null);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setMsg({ type: "error", text: friendlyError(e.code) });
    } finally {
      setBusy(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    if (mode === "login") run(() => loginEmail(email, password));
    else run(() => registerEmail(email, password));
  }

  async function handleReset() {
    if (!email) {
      setMsg({ type: "error", text: "Enter your email first, then tap reset." });
      return;
    }
    await run(async () => {
      await resetPassword(email);
      setMsg({ type: "ok", text: "Password reset email sent. Check your inbox." });
    });
  }

  return (
    <div className="loading">
      <div style={{ width: "min(380px, 100%)" }}>
        <div
          className="brand"
          style={{ color: "var(--text)", fontSize: 28, padding: 0, textAlign: "center" }}
        >
          Expense<span style={{ color: "var(--accent)" }}>Flow</span>
        </div>
        <p style={{ color: "var(--muted)", margin: "10px 0 22px", textAlign: "center" }}>
          {mode === "login"
            ? "Sign in to access your finances."
            : "Create an account to get started."}
        </p>

        {msg && (
          <div
            className={msg.type === "ok" ? "notice" : "banner"}
            style={{ marginTop: 0, marginBottom: 14 }}
          >
            {msg.text}
          </div>
        )}

        <form className="card" onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>

          {mode === "login" && (
            <button
              type="button"
              onClick={handleReset}
              style={{
                background: "none",
                border: 0,
                color: "var(--accent)",
                fontSize: 12,
                cursor: "pointer",
                justifySelf: "start",
                padding: 0,
              }}
            >
              Forgot password?
            </button>
          )}
        </form>

        <div style={{ textAlign: "center", color: "var(--muted)", margin: "14px 0", fontSize: 13 }}>
          or
        </div>

        <button
          className="btn secondary"
          style={{ width: "100%" }}
          onClick={() => run(loginGoogle)}
          disabled={busy}
        >
          Continue with Google
        </button>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "var(--muted)" }}>
          {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setMsg(null);
            }}
            style={{
              background: "none",
              border: 0,
              color: "var(--accent)",
              fontWeight: 700,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {mode === "login" ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

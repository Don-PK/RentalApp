import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../auth/useAuth";

const C = { navy: "#0f1923", blue: "#00b4d8", pink: "#f72585" };

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", code: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = { email: form.email, password: form.password };
      if (form.code) payload.code = form.code;
      const res = await api.post("/auth/login", payload);
      login(res.data.token, res.data.user);
      navigate(res.data.mustChangePassword ? "/change-initial-password" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  const input = {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.08)",
    border: "1.5px solid rgba(255,255,255,0.15)",
    borderRadius: 10,
    fontSize: 14,
    color: "white",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: `linear-gradient(135deg, ${C.navy} 0%, #0a1e2e 60%, #0f1923 100%)` }}>
      
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 48, textAlign: "center" }}>
        <div style={{ width: 88, height: 88, borderRadius: 24, background: `linear-gradient(135deg, ${C.blue}, ${C.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, fontWeight: 900, color: "white", marginBottom: 24, boxShadow: "0 12px 36px rgba(0,0,0,0.4)" }}>K</div>
        <h1 style={{ margin: 0, fontSize: 80, fontWeight: 900, color: "white", fontFamily: "Georgia, serif", letterSpacing: "2px", textShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>KODI</h1>
        <p style={{ margin: "12px 0 0", fontSize: 24, color: "#a8c8d8", fontWeight: 500, letterSpacing: "1px" }}>Property Management</p>
      </div>

      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 24, padding: "40px 48px", width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.5)", boxSizing: "border-box" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 800, color: "white", textAlign: "center" }}>Welcome back</h2>
          <p style={{ margin: "0 0 32px", fontSize: 15, color: "#7fb3c8", textAlign: "center" }}>Sign in to your account</p>

          <form onSubmit={handleSubmit}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#a8c8d8" }}>Email Address</label>
            <input type="email" required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="you@example.com" style={{ ...input, marginBottom: 16 }} />

            <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#a8c8d8" }}>Password</label>
            <input type="password" required value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="Password" style={{ ...input, marginBottom: 16 }} />

            <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#a8c8d8" }}>One-time code for new agents</label>
            <input type="text" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="Only required on first agent login" style={{ ...input, marginBottom: 18 }} />

            {error && <div style={{ padding: "12px 16px", borderRadius: 8, marginBottom: 16, background: "rgba(247,37,133,0.15)", border: "1px solid rgba(247,37,133,0.3)", fontSize: 13, color: "#f472b6" }}>{error}</div>}

            <button type="submit" disabled={loading} style={{ width: "100%", padding: 14, background: loading ? "rgba(0,180,216,0.4)" : `linear-gradient(135deg, ${C.blue}, #0096c7)`, color: "white", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 20, fontSize: 13 }}>
            <Link to="/signup" style={{ color: C.blue, textDecoration: "none", fontWeight: 700 }}>Create admin account</Link>
            <Link to="/forgot-password" style={{ color: "#a8c8d8", textDecoration: "none" }}>Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

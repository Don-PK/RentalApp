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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: `linear-gradient(135deg, ${C.navy} 0%, #0a1e2e 60%, #0f1923 100%)` }}>
      <div style={{ width: "100%", maxHeight: 200, overflow: "hidden" }}>
        <img src="/cover.svg" alt="Rental Management" style={{ width: "100%", display: "block", objectFit: "cover", height: 200 }} />
      </div>
      <div style={{ display: "flex", flex: 1 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 80px" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg, ${C.blue}, ${C.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900, color: "white", marginBottom: 24 }}>K</div>
        <h1 style={{ margin: 0, fontSize: 56, fontWeight: 900, color: "white", fontFamily: "Georgia, serif" }}>KODI</h1>
        <p style={{ margin: "8px 0 0", fontSize: 20, color: "#7fb3c8" }}>Property Management</p>
      </div>

      <div style={{ width: 460, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 40, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: "white" }}>Welcome back</h2>
          <p style={{ margin: "0 0 28px", fontSize: 14, color: "#7fb3c8" }}>Sign in to your KODI account</p>

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
    </div>
  );
}

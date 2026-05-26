import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../auth/useAuth";

const C = { navy: "#0f1923", blue: "#00b4d8", pink: "#f72585" };

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/register", form);
      login(res.data.token, res.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create admin account");
    } finally {
      setLoading(false);
    }
  }

  const input = { width: "100%", padding: "12px 14px", marginBottom: 14, border: "1px solid #dbe3ea", borderRadius: 8, fontSize: 14, boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: `linear-gradient(135deg, ${C.navy}, #0a1e2e)`, padding: 24 }}>
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 430, background: "white", borderRadius: 16, padding: 32, boxShadow: "0 18px 55px rgba(0,0,0,0.3)" }}>
        <h2 style={{ margin: "0 0 6px", color: C.navy }}>Create Admin Account</h2>
        <p style={{ margin: "0 0 22px", color: "#64748b", fontSize: 14 }}>New admins sign up with email and password.</p>
        <input required placeholder="Full name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} style={input} />
        <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} style={input} />
        <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} style={input} />
        <input required type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))} style={input} />
        {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{error}</div>}
        <button disabled={loading} style={{ width: "100%", padding: 13, border: "none", borderRadius: 8, background: `linear-gradient(135deg, ${C.blue}, ${C.pink})`, color: "white", fontWeight: 800, cursor: "pointer" }}>{loading ? "Creating..." : "Create Admin"}</button>
        <p style={{ textAlign: "center", margin: "18px 0 0", fontSize: 13 }}><Link to="/login" style={{ color: C.blue }}>Back to login</Link></p>
      </form>
    </div>
  );
}

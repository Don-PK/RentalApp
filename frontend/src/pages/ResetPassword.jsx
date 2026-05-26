import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function ResetPassword() {
  const navigate = useNavigate();
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") || "", []);
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, ...form });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0f1923", padding: 24 }}>
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 420, background: "white", borderRadius: 16, padding: 32 }}>
        <h2 style={{ marginTop: 0 }}>Set New Password</h2>
        <input type="password" required placeholder="New password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} style={{ width: "100%", padding: 12, border: "1px solid #dbe3ea", borderRadius: 8, marginBottom: 14, boxSizing: "border-box" }} />
        <input type="password" required placeholder="Confirm new password" value={form.confirmPassword} onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))} style={{ width: "100%", padding: 12, border: "1px solid #dbe3ea", borderRadius: 8, marginBottom: 14, boxSizing: "border-box" }} />
        {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{error}</div>}
        <button disabled={loading || !token} style={{ width: "100%", padding: 13, border: "none", borderRadius: 8, background: "#00b4d8", color: "white", fontWeight: 800 }}>{loading ? "Saving..." : "Save Password"}</button>
        <p style={{ textAlign: "center", margin: "18px 0 0", fontSize: 13 }}><Link to="/login">Back to login</Link></p>
      </form>
    </div>
  );
}

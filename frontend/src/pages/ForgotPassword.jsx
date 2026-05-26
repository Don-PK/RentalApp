import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setResetLink("");
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage("If the admin email exists, a password setup link has been prepared.");
      if (res.data.resetLink) setResetLink(res.data.resetLink);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request password reset");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0f1923", padding: 24 }}>
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 420, background: "white", borderRadius: 16, padding: 32 }}>
        <h2 style={{ marginTop: 0 }}>Forgot Password</h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>Admins can request a password reset link here. Agents should ask their admin to send the reset link.</p>
        <input type="email" required placeholder="Admin email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: 12, border: "1px solid #dbe3ea", borderRadius: 8, marginBottom: 14, boxSizing: "border-box" }} />
        {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{error}</div>}
        {message && <div style={{ background: "#dcfce7", color: "#166534", padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{message}</div>}
        {resetLink && <a href={resetLink} style={{ display: "block", wordBreak: "break-all", marginBottom: 14, fontSize: 13 }}>{resetLink}</a>}
        <button disabled={loading} style={{ width: "100%", padding: 13, border: "none", borderRadius: 8, background: "#00b4d8", color: "white", fontWeight: 800 }}>{loading ? "Sending..." : "Send Reset Link"}</button>
        <p style={{ textAlign: "center", margin: "18px 0 0", fontSize: 13 }}><Link to="/login">Back to login</Link></p>
      </form>
    </div>
  );
}

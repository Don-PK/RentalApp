import { useEffect, useState } from "react";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import { useAuth } from "../auth/useAuth";

const COLORS = {
  primary: "#2c3e50",
  secondary: "#3498db",
  accent: "#e74c3c",
  success: "#27ae60",
  warning: "#f39c12",
  light: "#ecf0f1",
};

export default function Agents() {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [oneTimeCode, setOneTimeCode] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "" });

  useEffect(() => {
    if (user?.role === "ADMIN") fetchAgents();
  }, [user]);

  async function fetchAgents() {
    try {
      const res = await api.get("/users/agents");
      setAgents(res.data);
    } catch (err) {
      console.error("Failed to fetch agents:", err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setOneTimeCode("");
    setResetLink("");
    setLoading(true);

    try {
      if (!formData.name || !formData.email || !formData.password) {
        setError("Name, email, and temporary password are required");
        return;
      }

      const res = await api.post("/users", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
      });

      setSuccess(`Agent "${res.data.name}" created. Give them the temporary password and one-time code.`);
      setOneTimeCode(res.data.oneTimeCode || "");
      setFormData({ name: "", email: "", password: "", phone: "" });
      fetchAgents();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create agent");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReset(agentId) {
    setError("");
    setSuccess("");
    setOneTimeCode("");
    setResetLink("");
    try {
      const res = await api.post(`/users/agents/${agentId}/send-reset-link`);
      setSuccess("Password reset link generated for the agent.");
      setResetLink(res.data.resetLink || "");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate reset link");
    }
  }

  async function handleDelete(agentId) {
    if (!window.confirm("Are you sure you want to delete this agent? This action cannot be undone.")) return;

    try {
      await api.delete(`/users/${agentId}`);
      setSuccess("Agent deleted successfully!");
      fetchAgents();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete agent");
    }
  }

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const inputStyle = { width: "100%", padding: "10px", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" };
  const labelStyle = { display: "block", marginBottom: "5px", fontWeight: "500", color: "#333", fontSize: "14px" };
  const buttonStyle = { padding: "10px 20px", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "500" };

  if (user?.role !== "ADMIN") {
    return (
      <AdminLayout>
        <div style={{ padding: "20px" }}>
          <h2>Unauthorized</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, color: COLORS.primary }}>Agents Management</h2>
          <button onClick={() => setShowForm(!showForm)} style={{ ...buttonStyle, background: showForm ? COLORS.accent : COLORS.secondary, color: "white" }}>
            {showForm ? "Cancel" : "Create New Agent"}
          </button>
        </div>

        {error && <div style={{ background: "#fee", color: "#c33", padding: "12px", borderRadius: "4px", marginBottom: "20px", border: "1px solid #fcc" }}>{error}</div>}
        {success && <div style={{ background: "#efe", color: "#166534", padding: "12px", borderRadius: "4px", marginBottom: "20px", border: "1px solid #cfc" }}>{success}</div>}
        {oneTimeCode && <div style={{ background: "#fff7ed", color: "#9a3412", padding: "12px", borderRadius: "4px", marginBottom: "20px", border: "1px solid #fed7aa" }}>One-time agent login code: <strong>{oneTimeCode}</strong></div>}
        {resetLink && <div style={{ background: "#eff6ff", color: "#1d4ed8", padding: "12px", borderRadius: "4px", marginBottom: "20px", border: "1px solid #bfdbfe", wordBreak: "break-all" }}>Reset link: <a href={resetLink}>{resetLink}</a></div>}

        {showForm && (
          <form onSubmit={handleSubmit} style={{ background: "white", padding: "20px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "30px", maxWidth: "500px" }}>
            <label style={labelStyle}>Full Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} placeholder="e.g., John Smith" />
            <label style={labelStyle}>Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} placeholder="agent@example.com" />
            <label style={labelStyle}>Temporary Password *</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} style={inputStyle} placeholder="Temporary password" />
            <label style={labelStyle}>Phone Number</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} placeholder="+254712345678" />
            <button type="submit" disabled={loading} style={{ ...buttonStyle, background: loading ? "#ccc" : COLORS.success, color: "white" }}>
              {loading ? "Creating..." : "Create Agent"}
            </button>
          </form>
        )}

        <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", overflowX: "auto" }}>
          <h3 style={{ margin: "0 0 20px 0", color: COLORS.primary }}>All Agents</h3>
          {agents.length === 0 ? <p style={{ color: "#999" }}>No agents created yet</p> : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
              <thead>
                <tr style={{ background: `linear-gradient(90deg, ${COLORS.secondary}15, ${COLORS.secondary}05)`, borderBottom: `2px solid ${COLORS.secondary}` }}>
                  <th style={{ padding: "14px", textAlign: "left", color: COLORS.primary }}>Name</th>
                  <th style={{ padding: "14px", textAlign: "left", color: COLORS.primary }}>Email</th>
                  <th style={{ padding: "14px", textAlign: "center", color: COLORS.primary }}>Status</th>
                  <th style={{ padding: "14px", textAlign: "center", color: COLORS.primary }}>Assigned Properties</th>
                  <th style={{ padding: "14px", textAlign: "center", color: COLORS.primary }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent, idx) => (
                  <tr key={agent.id} style={{ borderBottom: `1px solid ${COLORS.light}`, background: idx % 2 === 0 ? "white" : `${COLORS.light}40` }}>
                    <td style={{ padding: "14px", fontWeight: "600", color: COLORS.primary }}>{agent.name}</td>
                    <td style={{ padding: "14px", color: "#7f8c8d" }}>{agent.email}</td>
                    <td style={{ padding: "14px", textAlign: "center" }}>{agent.mustChangePassword ? "Initial password pending" : "Active"}</td>
                    <td style={{ padding: "14px", textAlign: "center" }}>{agent.assignedProperties?.length || 0}</td>
                    <td style={{ padding: "14px", textAlign: "center", display: "flex", gap: 8, justifyContent: "center" }}>
                      <button onClick={() => handleSendReset(agent.id)} style={{ ...buttonStyle, background: COLORS.warning, color: "white", padding: "6px 10px", fontSize: "12px" }}>Send reset link</button>
                      <button onClick={() => handleDelete(agent.id)} style={{ ...buttonStyle, background: COLORS.accent, color: "white", padding: "6px 10px", fontSize: "12px" }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

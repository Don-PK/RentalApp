import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const COLORS = {
  primary: "#2c3e50",
  secondary: "#3498db",
  accent: "#e74c3c",
  light: "#ecf0f1",
  text: "#2c3e50",
  textLight: "#7f8c8d",
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        background: `linear-gradient(90deg, white 0%, ${COLORS.light} 100%)`,
        borderBottom: `2px solid ${COLORS.secondary}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: COLORS.primary }}>
          📊 Dashboard
        </h3>

        <Link
          to="/dashboard"
          style={{
            textDecoration: "none",
            color: COLORS.textLight,
            fontSize: "14px",
            fontWeight: "500",
            transition: "color 0.3s ease",
          }}
          onMouseEnter={(e) => (e.target.style.color = COLORS.secondary)}
          onMouseLeave={(e) => (e.target.style.color = COLORS.textLight)}
        >
          Home
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 16px",
              background: `linear-gradient(135deg, ${COLORS.secondary}20, ${COLORS.accent}20)`,
              borderRadius: "8px",
              border: `1px solid ${COLORS.secondary}30`,
            }}
          >
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${COLORS.secondary}, ${COLORS.accent})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <p style={{ margin: "0 0 2px 0", fontSize: "14px", fontWeight: "600", color: COLORS.text }}>
                {user.name}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: COLORS.textLight }}>
                {user.role === "ADMIN" ? "👑 Admin" : "👤 Agent"}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            border: "none",
            cursor: "pointer",
            background: COLORS.accent,
            color: "white",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "13px",
            transition: "all 0.3s ease",
            boxShadow: "0 2px 8px rgba(231,76,60,0.2)",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#c0392b";
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 4px 12px rgba(231,76,60,0.3)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = COLORS.accent;
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 2px 8px rgba(231,76,60,0.2)";
          }}
        >
          🚪 Logout
        </button>
      </div>
    </nav>
  );
}
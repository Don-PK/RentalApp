import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const COLORS = {
  primary: "#0f1923",
  secondary: "#00b4d8",
  accent: "#f72585",
  success: "#06d6a0",
  warning: "#ffd166",
  light: "#e0fbfc",
  text: "#caf0f8",
  textMuted: "#7f9baa",
};

const MENU = [
  { name: "Dashboard", path: "/dashboard", icon: "◈" },
  { name: "Properties", path: "/properties", icon: "⬡" },
  { name: "Units", path: "/units", icon: "⊞" },
  { name: "Tenants", path: "/tenants", icon: "◎" },
  { name: "Payments", path: "/payments", icon: "◈" },
  { name: "Debtors", path: "/debtors", icon: "△" },
  { name: "Water", path: "/water", icon: "◉" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const adminMenu = [...MENU, { name: "Agents", path: "/agents", icon: "◆" }];
  const agentMenu = MENU;
  const menu = user?.role === "ADMIN" ? adminMenu : agentMenu;

  return (
    <div style={{
      width: 260,
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${COLORS.primary} 0%, #0a1520 100%)`,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      color: "white",
      boxShadow: "4px 0 24px rgba(0,0,0,0.4)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background accent */}
      <div style={{
        position: "absolute", top: -60, right: -60,
        width: 200, height: 200,
        background: `radial-gradient(circle, ${COLORS.secondary}15 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div>
        {/* Logo */}
        <div style={{
          padding: "28px 24px 24px",
          borderBottom: `1px solid rgba(0,180,216,0.2)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 40, height: 40,
              background: `linear-gradient(135deg, ${COLORS.secondary}, ${COLORS.accent})`,
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 900,
              boxShadow: `0 4px 16px ${COLORS.secondary}40`,
            }}>K</div>
            <div>
              <h1 style={{
                margin: 0, fontSize: 26, fontWeight: 900,
                letterSpacing: "0.08em",
                background: `linear-gradient(90deg, #fff, ${COLORS.secondary})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                fontFamily: "'Georgia', serif",
              }}>KODI</h1>
              <p style={{ margin: 0, fontSize: 10, color: COLORS.textMuted, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                Property Management
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "16px 12px" }}>
          {menu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 16px", marginBottom: 4,
                textDecoration: "none", borderRadius: 10,
                color: isActive ? "#fff" : COLORS.textMuted,
                background: isActive
                  ? `linear-gradient(90deg, ${COLORS.secondary}25, ${COLORS.secondary}10)`
                  : "transparent",
                border: isActive ? `1px solid ${COLORS.secondary}40` : "1px solid transparent",
                transition: "all 0.2s ease",
                fontWeight: isActive ? "700" : "500",
                fontSize: 14,
                letterSpacing: "0.02em",
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{
                  fontSize: 16, width: 24, textAlign: "center",
                  color: isActive ? COLORS.secondary : COLORS.textMuted,
                }}>{item.icon}</span>
                {item.name}
                {isActive && (
                  <span style={{
                    marginLeft: "auto", width: 6, height: 6,
                    borderRadius: "50%", background: COLORS.secondary,
                    boxShadow: `0 0 8px ${COLORS.secondary}`,
                  }} />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User + Logout */}
      <div style={{ padding: "16px 12px 20px" }}>
        {user && (
          <div style={{
            background: "rgba(0,180,216,0.08)",
            border: "1px solid rgba(0,180,216,0.15)",
            padding: "12px 16px", borderRadius: 10, marginBottom: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: `linear-gradient(135deg, ${COLORS.secondary}, ${COLORS.accent})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 14,
              }}>{user.name?.charAt(0).toUpperCase()}</div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff" }}>{user.name}</p>
                <span style={{
                  fontSize: 10, background: COLORS.secondary + "30",
                  color: COLORS.secondary, padding: "1px 6px", borderRadius: 4,
                  fontWeight: 700, letterSpacing: "0.05em",
                }}>{user.role}</span>
              </div>
            </div>
          </div>
        )}
        <button onClick={() => { logout(); navigate("/login"); }} style={{
          width: "100%", padding: "10px", border: "none", cursor: "pointer",
          background: "rgba(247,37,133,0.15)",
          border: "1px solid rgba(247,37,133,0.3)",
          color: COLORS.accent, borderRadius: 10,
          fontWeight: 700, fontSize: 13, letterSpacing: "0.05em",
          transition: "all 0.2s ease",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(247,37,133,0.25)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(247,37,133,0.15)"; }}
        >
          ← Logout
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const COLORS = {
  primary: "#0f1923",
  secondary: "#00b4d8",
  accent: "#f72585",
  success: "#06d6a0",
  warning: "#ffd166",
  light: "#f0f4f8",
};

const KPICard = ({ title, value, icon, color }) => (
  <div
    style={{
      background: `linear-gradient(135deg, ${color}15, ${color}05)`,
      border: `2px solid ${color}40`,
      borderRadius: "12px",
      padding: "24px",
      flex: 1,
      minWidth: "250px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      transition: "all 0.3s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#7f8c8d", fontWeight: "500" }}>
          {title}
        </p>
        <h3 style={{ margin: 0, fontSize: "28px", fontWeight: "700", color: COLORS.primary }}>
          {value}
        </h3>
      </div>
      <span style={{ fontSize: "32px" }}>{icon}</span>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get("/dashboard/summary");
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      }
    }

    fetchDashboard();
  }, []);

  if (error)
    return (
      <AdminLayout>
        <div
          style={{
            background: "#fee",
            color: "#c33",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #fcc",
          }}
        >
          {error}
        </div>
      </AdminLayout>
    );

  if (!data)
    return (
      <AdminLayout>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "#7f8c8d" }}>Loading dashboard...</p>
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div>
        <h1 style={{ margin: "0 0 30px 0", color: COLORS.primary, fontSize: "28px", fontWeight: "700" }}>
          {user?.role === "AGENT" ? "👤 Agent Dashboard" : "📊 Dashboard Overview"}
        </h1>

        <div style={{ display: "flex", gap: 20, marginBottom: 40, flexWrap: "wrap" }}>
          <KPICard
            title="Total Revenue"
            value={`KES ${data.totalRevenue.toLocaleString()}`}
            icon="💰"
            color={COLORS.success}
          />
          <KPICard
            title="Outstanding Balance"
            value={`KES ${data.outstandingBalance.toLocaleString()}`}
            icon="⚠️"
            color={COLORS.accent}
          />
          <KPICard
            title="Occupancy Rate"
            value={`${data.occupancy.occupancyRate}%`}
            icon="📈"
            color={COLORS.secondary}
          />
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            marginBottom: 40,
          }}
        >
          <h2 style={{ margin: "0 0 20px 0", color: COLORS.primary, fontSize: "18px", fontWeight: "700" }}>
            📈 Monthly Income Trend
          </h2>

          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={data.monthlyIncome} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.light} />
                <XAxis dataKey="month" stroke="#7f8c8d" />
                <YAxis stroke="#7f8c8d" />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: `1px solid ${COLORS.secondary}`,
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={COLORS.secondary}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  dot={{ fill: COLORS.secondary, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            overflowX: "auto",
          }}
        >
          <h2 style={{ margin: "0 0 20px 0", color: COLORS.primary, fontSize: "18px", fontWeight: "700" }}>
            🏢 Property Performance
          </h2>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "600px",
            }}
          >
            <thead>
              <tr style={{ background: `linear-gradient(90deg, ${COLORS.secondary}15, ${COLORS.secondary}05)`, borderBottom: `2px solid ${COLORS.secondary}` }}>
                <th style={{ padding: "14px", textAlign: "left", fontWeight: "600", color: COLORS.primary, fontSize: "13px" }}>
                  Property
                </th>
                <th style={{ padding: "14px", textAlign: "left", fontWeight: "600", color: COLORS.primary, fontSize: "13px" }}>
                  Location
                </th>
                <th style={{ padding: "14px", textAlign: "center", fontWeight: "600", color: COLORS.primary, fontSize: "13px" }}>
                  Total Units
                </th>
                <th style={{ padding: "14px", textAlign: "center", fontWeight: "600", color: COLORS.primary, fontSize: "13px" }}>
                  Occupied
                </th>
                <th style={{ padding: "14px", textAlign: "center", fontWeight: "600", color: COLORS.primary, fontSize: "13px" }}>
                  Vacant
                </th>
                <th style={{ padding: "14px", textAlign: "center", fontWeight: "600", color: COLORS.primary, fontSize: "13px" }}>
                  Occupancy %
                </th>
              </tr>
            </thead>

            <tbody>
              {data.propertyPerformance.map((p, idx) => (
                <tr
                  key={p.propertyId}
                  style={{
                    borderBottom: `1px solid ${COLORS.light}`,
                    background: idx % 2 === 0 ? "white" : `${COLORS.light}40`,
                    transition: "background 0.3s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = `${COLORS.secondary}10`)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "white" : `${COLORS.light}40`)}
                >
                  <td style={{ padding: "14px", color: COLORS.primary, fontWeight: "600", fontSize: "14px" }}>
                    🏠 {p.propertyName}
                  </td>
                  <td style={{ padding: "14px", color: "#7f8c8d", fontSize: "14px" }}>
                    📍 {p.location}
                  </td>
                  <td style={{ padding: "14px", textAlign: "center", color: COLORS.primary, fontWeight: "600" }}>
                    {p.totalUnits}
                  </td>
                  <td
                    style={{
                      padding: "14px",
                      textAlign: "center",
                      color: COLORS.success,
                      fontWeight: "600",
                      background: `${COLORS.success}10`,
                      borderRadius: "6px",
                      margin: "4px",
                    }}
                  >
                    ✓ {p.occupiedUnits}
                  </td>
                  <td
                    style={{
                      padding: "14px",
                      textAlign: "center",
                      color: COLORS.warning,
                      fontWeight: "600",
                    }}
                  >
                    ○ {p.vacantUnits}
                  </td>
                  <td
                    style={{
                      padding: "14px",
                      textAlign: "center",
                      color: "white",
                      fontWeight: "700",
                      background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.primary})`,
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  >
                    {p.occupancyRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

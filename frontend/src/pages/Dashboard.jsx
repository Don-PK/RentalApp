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
  BarChart,
  Bar,
  Legend,
} from "recharts";

/* ─── Design tokens ─── */
const C = {
  navy:   "#0f1923",
  blue:   "#00b4d8",
  pink:   "#f72585",
  green:  "#06d6a0",
  yellow: "#ffd166",
  purple: "#7c3aed",
  light:  "#f0f4f8",
};

/* Palette for per-property lines */
const PROP_COLORS = ["#00b4d8","#f72585","#06d6a0","#ffd166","#7c3aed","#f97316","#14b8a6","#ec4899"];

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ─── KPI card ─── */
function KPICard({ title, value, icon, color, sub }) {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${color}18, ${color}06)`,
        border: `2px solid ${color}40`,
        borderRadius: 14,
        padding: "22px 24px",
        flex: 1,
        minWidth: 220,
        boxShadow: "0 4px 14px rgba(0,0,0,0.07)",
        transition: "all 0.3s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.07)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: "0 0 6px 0", fontSize: 12, color: "#7f8c8d", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {title}
          </p>
          <h3 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.navy }}>{value}</h3>
          {sub && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>{sub}</p>}
        </div>
        <span style={{ fontSize: 30 }}>{icon}</span>
      </div>
    </div>
  );
}

/* ─── Custom tooltip for multi-line chart ─── */
function MultiLineTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <p style={{ margin: "0 0 6px", fontWeight: 700, color: C.navy, fontSize: 13 }}>{MONTH_LABELS[label - 1]}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ margin: "2px 0", fontSize: 12, color: entry.color, fontWeight: 600 }}>
          {entry.dataKey}: KES {(entry.value || 0).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedProperty, setExpandedProperty] = useState(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get(`/dashboard/summary?year=${selectedYear}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      }
    }
    fetchDashboard();
  }, [selectedYear]);

  if (error)
    return (
      <AdminLayout>
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: 16, borderRadius: 10, border: "1px solid #fecdd3", margin: 24 }}>
          ⚠️ {error}
        </div>
      </AdminLayout>
    );

  if (!data)
    return (
      <AdminLayout>
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ width: 44, height: 44, border: `3px solid ${C.blue}30`, borderTop: `3px solid ${C.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ color: "#7f8c8d", fontSize: 14 }}>Loading dashboard…</p>
        </div>
      </AdminLayout>
    );

  const multiLine = data.monthlyIncomeByProperty || { data: [], propertyNames: [] };
  const hasMultiProps = (data.propertyPerformance?.length || 0) > 1;

  /* map month numbers to labels for x-axis */
  const trendData = (multiLine.data || []).map((row) => ({
    ...row,
    monthLabel: MONTH_LABELS[row.month - 1],
  }));

  return (
    <AdminLayout>
      <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.navy, letterSpacing: "-0.5px" }}>
              {user?.role === "AGENT" ? "👤 Agent Dashboard" : "📊 Dashboard Overview"}
            </h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
              {data.propertyPerformance?.length || 0} {data.propertyPerformance?.length === 1 ? "property" : "properties"} · {data.occupancy.totalUnits} total units
            </p>
          </div>
          {/* Year selector */}
          <select
            id="year-selector"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, fontWeight: 600, background: "white", cursor: "pointer" }}
          >
            {[0, 1, 2].map((offset) => {
              const y = new Date().getFullYear() - offset;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
        </div>

        {/* ── KPI cards ── */}
        <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <KPICard
            title="Total Revenue"
            value={`KES ${data.totalRevenue.toLocaleString()}`}
            icon="💰"
            color={C.green}
            sub="Payments collected (all time)"
          />
          <KPICard
            title="Outstanding Balance"
            value={`KES ${data.outstandingBalance.toLocaleString()}`}
            icon="⚠️"
            color={C.pink}
            sub="Across all unpaid invoices"
          />
          <KPICard
            title="Occupancy Rate"
            value={`${data.occupancy.occupancyRate}%`}
            icon="📈"
            color={C.blue}
            sub={`${data.occupancy.occupiedUnits} occupied / ${data.occupancy.vacantUnits} vacant`}
          />
        </div>

        {/* ── Per-property financial breakdown (shows when >1 property) ── */}
        {data.propertyFinancials?.length > 0 && (
          <div style={{ background: "white", borderRadius: 14, padding: "22px 24px", boxShadow: "0 4px 12px rgba(0,0,0,0.07)", marginBottom: 28, border: "1px solid #e2e8f0" }}>
            <h2 style={{ margin: "0 0 18px 0", fontSize: 16, fontWeight: 800, color: C.navy }}>
              💼 Financial Breakdown by Property
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
              {data.propertyFinancials.map((pf, idx) => {
                const color = PROP_COLORS[idx % PROP_COLORS.length];
                const isExpanded = expandedProperty === pf.propertyId;
                return (
                  <div
                    key={pf.propertyId}
                    onClick={() => setExpandedProperty(isExpanded ? null : pf.propertyId)}
                    style={{
                      border: `2px solid ${color}40`,
                      borderRadius: 12,
                      padding: "16px 18px",
                      background: `linear-gradient(135deg, ${color}10, ${color}04)`,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, color: C.navy, fontSize: 14 }}>🏠 {pf.propertyName}</span>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{isExpanded ? "▲" : "▼"}</span>
                    </div>
                    {isExpanded && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 8 }}>
                        <div style={{ textAlign: "center", background: "#fff0f3", borderRadius: 8, padding: "10px 6px" }}>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#be123c", textTransform: "uppercase" }}>Outstanding</p>
                          <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 800, color: "#be123c" }}>KES {pf.outstanding.toLocaleString()}</p>
                        </div>
                        <div style={{ textAlign: "center", background: "#f0fdf9", borderRadius: 8, padding: "10px 6px" }}>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#065f46", textTransform: "uppercase" }}>Collected</p>
                          <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 800, color: "#065f46" }}>KES {pf.collected.toLocaleString()}</p>
                        </div>
                        <div style={{ textAlign: "center", background: "#fffbea", borderRadius: 8, padding: "10px 6px" }}>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Overdue</p>
                          <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 800, color: "#92400e" }}>{pf.overdue}</p>
                        </div>
                      </div>
                    )}
                    {!isExpanded && (
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: "#be123c", fontWeight: 700 }}>⬤ Owed: KES {pf.outstanding.toLocaleString()}</span>
                        <span style={{ fontSize: 12, color: "#065f46", fontWeight: 700 }}>⬤ Paid: KES {pf.collected.toLocaleString()}</span>
                        {pf.overdue > 0 && <span style={{ fontSize: 12, color: "#92400e", fontWeight: 700 }}>⚠ {pf.overdue} overdue</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Monthly Income Trend (multi-line per property) ── */}
        <div style={{ background: "white", borderRadius: 14, padding: "22px 24px", boxShadow: "0 4px 12px rgba(0,0,0,0.07)", marginBottom: 28, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.navy }}>
              📈 Monthly Income Trend — {selectedYear}
            </h2>
            {multiLine.propertyNames?.length > 1 && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {multiLine.propertyNames.map((name, i) => (
                  <span key={name} style={{ fontSize: 12, fontWeight: 700, color: PROP_COLORS[i % PROP_COLORS.length], display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: PROP_COLORS[i % PROP_COLORS.length], display: "inline-block" }} />
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ width: "100%", height: 300 }}>
            {trendData.length > 0 ? (
              <ResponsiveContainer>
                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="monthLabel" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<MultiLineTip />} />
                  {(multiLine.propertyNames || []).map((name, i) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={PROP_COLORS[i % PROP_COLORS.length]}
                      strokeWidth={2.5}
                      dot={{ fill: PROP_COLORS[i % PROP_COLORS.length], r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
                <p>No income data for {selectedYear}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Property Comparison Bar Chart (shows when >1 property) ── */}
        {hasMultiProps && (
          <div style={{ background: "white", borderRadius: 14, padding: "22px 24px", boxShadow: "0 4px 12px rgba(0,0,0,0.07)", marginBottom: 28, border: "1px solid #e2e8f0" }}>
            <h2 style={{ margin: "0 0 18px 0", fontSize: 16, fontWeight: 800, color: C.navy }}>
              📊 Property Comparison — Occupancy
            </h2>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={data.propertyPerformance} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="propertyName" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: "white", border: `1px solid ${C.blue}`, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 16, fontSize: 13 }} />
                  <Bar dataKey="occupiedUnits" name="Occupied" fill={C.green} radius={[5, 5, 0, 0]} />
                  <Bar dataKey="vacantUnits" name="Vacant" fill={C.yellow} radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Property Performance Table ── */}
        <div style={{ background: "white", borderRadius: 14, padding: "22px 24px", boxShadow: "0 4px 12px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0" }}>
          <h2 style={{ margin: "0 0 18px 0", fontSize: 16, fontWeight: 800, color: C.navy }}>
            🏢 Property Performance
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.blue}30`, background: `${C.blue}08` }}>
                  {["Property", "Location", "Total Units", "Occupied", "Vacant", "Occupancy %"].map((h) => (
                    <th key={h} style={{ padding: "13px 14px", textAlign: h === "Property" || h === "Location" ? "left" : "center", fontWeight: 700, color: C.navy, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.propertyPerformance.map((p, idx) => (
                  <tr
                    key={p.propertyId}
                    style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "white" : "#fafbfc", transition: "background 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = `${C.blue}08`}
                    onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? "white" : "#fafbfc"}
                  >
                    <td style={{ padding: "14px", color: C.navy, fontWeight: 700, fontSize: 14 }}>🏠 {p.propertyName}</td>
                    <td style={{ padding: "14px", color: "#64748b", fontSize: 14 }}>📍 {p.location}</td>
                    <td style={{ padding: "14px", textAlign: "center", fontWeight: 700, color: C.navy }}>{p.totalUnits}</td>
                    <td style={{ padding: "14px", textAlign: "center", fontWeight: 700, color: "#065f46", background: `${C.green}12`, borderRadius: 6 }}>
                      ✓ {p.occupiedUnits}
                    </td>
                    <td style={{ padding: "14px", textAlign: "center", fontWeight: 700, color: "#92400e" }}>
                      ○ {p.vacantUnits}
                    </td>
                    <td style={{ padding: "14px", textAlign: "center" }}>
                      <span style={{
                        padding: "5px 14px", borderRadius: 20, fontWeight: 800, fontSize: 13, color: "white",
                        background: p.occupancyRate >= 80 ? C.green : p.occupancyRate >= 50 ? C.blue : C.pink,
                      }}>
                        {p.occupancyRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}

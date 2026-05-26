import { useEffect, useState } from "react";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";

const C = { navy: "#0f1923", blue: "#00b4d8", pink: "#f72585", green: "#06d6a0", yellow: "#ffd166" };

export default function Debtors() {
  const [debtors, setDebtors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/tenants/debtors")
      .then(res => setDebtors(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function exportCSV() {
    const header = ["Tenant", "Phone", "Property", "Unit", "Balance", "Last Updated"];
    const rows = debtors.map(d => [
      d.fullName, d.phone,
      d.unit?.property?.name, d.unit?.unitCode,
      d.arrears?.balance || 0,
      d.arrears?.updatedAt ? new Date(d.arrears.updatedAt).toLocaleDateString() : "—",
    ]);
    const csv = [header, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `kodi-debtors-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  const totalArrears = debtors.reduce((s, d) => s + (d.arrears?.balance || 0), 0);

  if (loading) return (
    <AdminLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <p style={{ color: "#64748b" }}>Loading debtors…</p>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.navy, letterSpacing: "-0.5px" }}>Balances</h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Tenants with arrears or advance balances</p>
          </div>
          <button onClick={exportCSV} style={{
            padding: "11px 22px",
            background: `linear-gradient(135deg, ${C.navy}, #1e3a5f)`,
            color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer",
            boxShadow: "0 4px 12px rgba(15,25,35,0.25)",
          }}>↓ Export CSV</button>
        </div>

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total Debtors", value: debtors.length, color: C.pink, bg: "#fff0f6" },
            { label: "Net Balance", value: `KES ${totalArrears.toLocaleString()}`, color: "#be123c", bg: "#fff0f3" },
            { label: "Avg. Per Debtor", value: debtors.length ? `KES ${Math.round(totalArrears / debtors.length).toLocaleString()}` : "KES 0", color: C.yellow, bg: "#fffbea" },
          ].map(card => (
            <div key={card.label} style={{ background: card.bg, borderRadius: 12, padding: "18px 22px", border: `1px solid ${card.color}30` }}>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b", fontWeight: 600 }}>{card.label}</p>
              <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflowX: "auto" }}>
          {debtors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 50, marginBottom: 14 }}>🎉</div>
              <h3 style={{ margin: 0, color: C.green, fontWeight: 800 }}>All Clear!</h3>
              <p style={{ color: "#64748b", marginTop: 8 }}>No Balances at this time.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", background: "#fff0f3" }}>
                  {["Tenant", "Phone", "Property", "Unit", "Balance", "Last Updated", "Action"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: h === "Balance" ? "right" : "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {debtors.map((d, i) => (
                  <tr key={d.id} style={{
                    borderBottom: "1px solid #f8fafc",
                    background: i % 2 === 0 ? "white" : "#fafbfc",
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fff0f3"}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafbfc"}>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: C.navy, fontSize: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: `linear-gradient(135deg, ${C.pink}30, ${C.pink}60)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 800, fontSize: 13, color: C.pink,
                        }}>{d.fullName?.charAt(0).toUpperCase()}</div>
                        {d.fullName}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#64748b" }}>{d.phone}</td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#64748b" }}>{d.unit?.property?.name || "—"}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, fontSize: 14, color: C.navy }}>
                      <span style={{ background: "#f1f5f9", padding: "3px 10px", borderRadius: 6 }}>{d.unit?.unitCode || "—"}</span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      {(d.arrears?.balance || 0) > 0 ? (
                        <span style={{
                          fontWeight: 800, fontSize: 13, color: "#be123c",
                          background: "#fff0f3", padding: "4px 12px", borderRadius: 8, border: "1px solid #fecdd3",
                          whiteSpace: "nowrap",
                        }}>
                          KES {(d.arrears?.balance || 0).toLocaleString()} (Arrears)
                        </span>
                      ) : (d.arrears?.balance || 0) < 0 ? (
                        <span style={{
                          fontWeight: 800, fontSize: 13, color: "#065f46",
                          background: "#f0fdf9", padding: "4px 12px", borderRadius: 8, border: "1px solid #a7f3d0",
                          whiteSpace: "nowrap",
                        }}>
                          KES {Math.abs(d.arrears?.balance || 0).toLocaleString()} (Advance)
                        </span>
                      ) : (
                        <span style={{
                          fontWeight: 800, fontSize: 13, color: "#64748b",
                          background: "#f1f5f9", padding: "4px 12px", borderRadius: 8, border: "1px solid #cbd5e1",
                          whiteSpace: "nowrap",
                        }}>
                          KES 0 (Cleared)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#94a3b8" }}>
                      {d.arrears?.updatedAt ? new Date(d.arrears.updatedAt).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button onClick={() => alert(`Reminder sent to ${d.phone}`)} style={{
                        padding: "7px 16px", background: C.blue, color: "white",
                        border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}>📱 Remind</button>
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


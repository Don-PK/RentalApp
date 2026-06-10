import { useEffect, useState } from "react";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import { useAuth } from "../auth/useAuth";

/* ─── Design tokens ─── */
const C = {
  navy:   "#0f1923",
  blue:   "#00b4d8",
  green:  "#06d6a0",
  pink:   "#f72585",
  yellow: "#ffd166",
};

const PROP_COLORS = ["#00b4d8","#f72585","#06d6a0","#ffd166","#7c3aed","#f97316","#14b8a6","#ec4899"];

export default function Tenants() {
  const { user } = useAuth();
  const [units, setUnits]     = useState([]);
  const [tenants, setTenants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch]   = useState("");
  const [form, setForm] = useState({
    fullName: "", phone: "", nationalId: "", occupants: "1", unitId: "",
    startDate: new Date().toISOString().slice(0, 10),
    rent: "", initialWaterReading: "",
    paymentReference: "", paymentAmount: "", paymentMethod: "MPESA",
    paymentDate: new Date().toISOString().slice(0, 10),
    wallPaintStatus: "PAINTED", toiletLocksCondition: "GOOD",
    doorsCondition: "GOOD", sinkCondition: "GOOD",
    socketsCondition: "GOOD", lightingCondition: "GOOD", tokenStatus: "PROVIDED",
  });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const [u, t] = await Promise.all([api.get("/units"), api.get("/tenants")]);
    setUnits((u.data || []).filter(x => x.status === "VACANT"));
    setTenants(t.data || []);
  }

  function change(e) {
    const { name, value } = e.target;
    setForm(p => {
      const n = { ...p, [name]: value };
      if (name === "unitId") {
        const unit = units.find(u => u.id === value);
        if (unit) { n.rent = unit.rent || ""; n.paymentAmount = unit.rent ? String(Number(unit.rent) * 2) : ""; }
      }
      if (name === "rent") n.paymentAmount = String(Number(value || 0) * 2);
      return n;
    });
  }

  async function submit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      await api.post("/tenants", {
        ...form,
        occupants: Number(form.occupants),
        rent: Number(form.rent),
        initialWaterReading: Number(form.initialWaterReading || 0),
        paymentAmount: form.paymentAmount ? Number(form.paymentAmount) : undefined,
      });
      setSuccess("Tenant created and checked in.");
      setShowForm(false);
      await fetchAll();
    } catch (err) { setError(err.response?.data?.message || "Failed to create tenant"); }
  }

  const inp = { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: "white" };
  const lbl = { display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13, color: "#475569" };

  /* group tenants by property */
  const searchLower = search.toLowerCase();
  const filtered = tenants.filter(t =>
    !search ||
    t.fullName?.toLowerCase().includes(searchLower) ||
    t.phone?.toLowerCase().includes(searchLower) ||
    t.unit?.unitCode?.toLowerCase().includes(searchLower) ||
    t.unit?.property?.name?.toLowerCase().includes(searchLower)
  );

  const propGroups = {};
  filtered.forEach(t => {
    const propId   = t.unit?.property?.id   || "unassigned";
    const propName = t.unit?.property?.name || "Unassigned";
    if (!propGroups[propId]) propGroups[propId] = { propId, propName, tenants: [] };
    propGroups[propId].tenants.push(t);
  });
  const groupList = Object.values(propGroups);

  return (
    <AdminLayout>
      <div style={{ padding: "28px 32px", maxWidth: 1300, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.navy, letterSpacing: "-0.5px" }}>👥 Tenants</h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
              {tenants.length} tenant{tenants.length !== 1 ? "s" : ""} across {groupList.length} {groupList.length !== 1 ? "properties" : "property"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13 }}>🔍</span>
              <input
                type="text"
                placeholder="Search tenant, unit, property…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inp, paddingLeft: 32, width: 260 }}
              />
            </div>
            <button
              onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }}
              style={{
                padding: "10px 20px", border: "none", borderRadius: 10, cursor: "pointer",
                fontWeight: 700, fontSize: 14,
                background: showForm ? C.pink : C.blue, color: "white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              {showForm ? "✕ Cancel" : "+ Add Tenant"}
            </button>
          </div>
        </div>

        {/* ── Alerts ── */}
        {error   && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: 8, marginBottom: 14, fontSize: 14 }}>⚠️ {error}</div>}
        {success && <div style={{ background: "#dcfce7", color: "#166534", padding: "12px 16px", borderRadius: 8, marginBottom: 14, fontSize: 14 }}>✅ {success}</div>}

        {/* ── Create Tenant Form ── */}
        {showForm && (
          <form onSubmit={submit} style={{ background: "white", padding: 24, borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", marginBottom: 28 }}>
            <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 800, color: C.navy }}>New Tenant Check-In</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 12 }}>
              <div><label style={lbl}>Full Name *</label><input name="fullName" placeholder="Full name" value={form.fullName} onChange={change} style={inp} required /></div>
              <div><label style={lbl}>Phone *</label><input name="phone" placeholder="Phone" value={form.phone} onChange={change} style={inp} required /></div>
              <div><label style={lbl}>National ID *</label><input name="nationalId" placeholder="National ID" value={form.nationalId} onChange={change} style={inp} required /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={lbl}>Assign to Unit *</label>
                <select name="unitId" value={form.unitId} onChange={change} style={inp} required>
                  <option value="">— Select vacant unit —</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.property?.name} · Unit {u.unitCode} · KES {u.rent}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Occupants</label><input name="occupants" type="number" value={form.occupants} onChange={change} style={inp} min="1" /></div>
              <div><label style={lbl}>Rent (KES)</label><input name="rent" type="number" placeholder="Monthly rent" value={form.rent} onChange={change} style={inp} required /></div>
              <div><label style={lbl}>Move-In Date</label><input name="startDate" type="date" value={form.startDate} onChange={change} style={inp} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
              <div><label style={lbl}>Initial Water Reading</label><input name="initialWaterReading" type="number" placeholder="e.g. 120" value={form.initialWaterReading} onChange={change} style={inp} /></div>
              <div><label style={lbl}>Amount Paid (KES)</label><input name="paymentAmount" type="number" placeholder="First payment" value={form.paymentAmount} onChange={change} style={inp} /></div>
              <div><label style={lbl}>Transaction ID</label><input name="paymentReference" placeholder="M-PESA ref etc." value={form.paymentReference} onChange={change} style={inp} /></div>
              <div>
                <label style={lbl}>Payment Method</label>
                <select name="paymentMethod" value={form.paymentMethod} onChange={change} style={inp}>
                  <option>MPESA</option><option>BANK</option><option>CASH</option>
                </select>
              </div>
            </div>
            <button type="submit" style={{ padding: "11px 28px", border: "none", borderRadius: 10, background: `linear-gradient(135deg, ${C.green}, #059669)`, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              ✓ Create &amp; Check In
            </button>
          </form>
        )}

        {/* ── Property Groups ── */}
        {groupList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 14, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#94a3b8" }}>
              {search ? "No tenants match your search" : "No tenants yet — check a tenant into a unit to get started"}
            </p>
          </div>
        ) : (
          groupList.map((group, gIdx) => {
            const color = PROP_COLORS[gIdx % PROP_COLORS.length];
            return (
              <div key={group.propId} style={{ marginBottom: 32 }}>
                {/* Property header */}
                <div style={{
                  padding: "13px 20px", display: "flex", alignItems: "center", gap: 12,
                  background: `linear-gradient(135deg, ${color}18, ${color}06)`,
                  border: `1.5px solid ${color}40`, borderBottom: "none",
                  borderRadius: "14px 14px 0 0",
                }}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.navy, flex: 1 }}>🏢 {group.propName}</h3>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                    {group.tenants.length} tenant{group.tenants.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Tenants table */}
                <div style={{
                  background: "white", border: `1.5px solid ${color}40`,
                  borderTop: `2px solid ${color}`, borderRadius: "0 0 14px 14px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflowX: "auto",
                }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #f1f5f9", background: "#f8fafc" }}>
                        {["Tenant Name","Phone","National ID","Unit","Move-In Date","Balance Status"].map(h => (
                          <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.tenants.map((t, i) => {
                        const arrBalance = t.arrears?.balance || 0;
                        return (
                          <tr
                            key={t.id}
                            style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafbfc", transition: "background 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.background = `${color}08`}
                            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafbfc"}
                          >
                            <td style={{ padding: "14px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{
                                  width: 34, height: 34, borderRadius: "50%",
                                  background: `linear-gradient(135deg, ${color}40, ${color}80)`,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontWeight: 800, fontSize: 13, color: "white", flexShrink: 0,
                                }}>
                                  {t.fullName?.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontWeight: 700, color: C.navy, fontSize: 14 }}>{t.fullName}</span>
                              </div>
                            </td>
                            <td style={{ padding: "14px 16px", fontSize: 13, color: "#64748b" }}>{t.phone}</td>
                            <td style={{ padding: "14px 16px", fontSize: 13, color: "#64748b", fontFamily: "monospace" }}>{t.nationalId}</td>
                            <td style={{ padding: "14px 16px" }}>
                              <span style={{ background: "#f1f5f9", padding: "4px 10px", borderRadius: 6, fontWeight: 800, color: C.navy, fontSize: 13 }}>
                                {t.unit?.unitCode || "—"}
                              </span>
                            </td>
                            <td style={{ padding: "14px 16px", fontSize: 13, color: "#64748b" }}>
                              {t.leases?.[0]?.startDate ? new Date(t.leases[0].startDate).toLocaleDateString() : "—"}
                            </td>
                            <td style={{ padding: "14px 16px" }}>
                              {arrBalance > 0 ? (
                                <span style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "#fff0f3", color: "#be123c", border: "1px solid #fecdd3" }}>
                                  ↑ Arrears KES {arrBalance.toLocaleString()}
                                </span>
                              ) : arrBalance < 0 ? (
                                <span style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "#eff9ff", color: "#075985", border: "1px solid #bae6fd" }}>
                                  ↓ Advance KES {Math.abs(arrBalance).toLocaleString()}
                                </span>
                              ) : (
                                <span style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "#f0fdf9", color: "#065f46", border: "1px solid #a7f3d0" }}>
                                  ✓ Cleared
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </AdminLayout>
  );
}

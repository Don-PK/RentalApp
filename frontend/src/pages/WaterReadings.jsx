import { useEffect, useState } from "react";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";

const C = { navy: "#0f1923", blue: "#00b4d8", green: "#06d6a0", yellow: "#ffd166", pink: "#f72585" };

export default function WaterReadings() {
  const [units, setUnits] = useState([]);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [form, setForm] = useState({
    reading: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    waterRatePerUnit: 100,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    fetchUnits();
    fetchAllReadings();
  }, []);

  async function fetchUnits() {
    try {
      setLoading(true);
      const res = await api.get("/units");
      setUnits((res.data || []).filter(u => u.status === "OCCUPIED"));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function fetchAllReadings() {
    try {
      const res = await api.get("/water");
      setReadings(res.data || []);
    } catch (err) { console.error(err); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedUnit || form.reading === "") return;
    try {
      setSubmitting(true);
      setMessage({ type: "", text: "" });
      const res = await api.post("/water/record", {
        unitId: selectedUnit,
        reading: parseFloat(form.reading),
        month: Number(form.month),
        year: Number(form.year),
        waterRatePerUnit: parseFloat(form.waterRatePerUnit),
      });
      setLastResult(res.data);
      setMessage({ type: "success", text: `✓ Reading recorded. Units used: ${res.data.unitsUsed?.toFixed(2) ?? "—"} | Water bill: KES ${res.data.waterBill?.toLocaleString()}` });
      setForm(p => ({ ...p, reading: "" }));
      fetchAllReadings();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to record reading" });
    } finally { setSubmitting(false); }
  }

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const inp = { width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const lbl = { display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13, color: "#475569" };

  const filteredReadings = selectedUnit ? readings.filter(r => r.unitId === selectedUnit) : readings;

  return (
    <AdminLayout>
      <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.navy, letterSpacing: "-0.5px" }}>
            Water Readings
          </h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
            Record monthly water meter readings to auto-calculate bills
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 24 }}>
          {/* Form */}
          <div style={{ background: "white", padding: 28, borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: C.navy }}>💧 Record Reading</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Select Unit (Occupied Only)</label>
                <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} required style={inp}>
                  <option value="">— Select a Unit —</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.property?.name} · Unit {u.unitCode} ({u.tenant?.fullName || "Occupied"})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={lbl}>Month</label>
                  <select value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))} style={inp}>
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Year</label>
                  <input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
                    style={inp} min="2020" max="2100" />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Current Meter Reading (Units)</label>
                <input type="number" step="0.01" value={form.reading}
                  onChange={e => setForm(p => ({ ...p, reading: e.target.value }))}
                  placeholder="e.g. 1456.5" required style={inp} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Water Rate (KES per Unit)</label>
                <input type="number" step="0.01" value={form.waterRatePerUnit}
                  onChange={e => setForm(p => ({ ...p, waterRatePerUnit: e.target.value }))}
                  style={inp} min="1" />
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
                  Set by agent. Default: KES 100/unit
                </p>
              </div>

              {message.text && (
                <div style={{
                  padding: 14, borderRadius: 8, marginBottom: 16, fontSize: 13,
                  background: message.type === "success" ? "#f0fdf9" : "#fff0f3",
                  color: message.type === "success" ? "#065f46" : "#be123c",
                  border: `1px solid ${message.type === "success" ? "#a7f3d0" : "#fecdd3"}`,
                }}>{message.text}</div>
              )}

              {lastResult && message.type === "success" && (
                <div style={{ background: "#eff9ff", borderRadius: 10, padding: 14, marginBottom: 16, border: "1px solid #bae6fd" }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.navy }}>Calculation Breakdown</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                    {[
                      ["Previous Reading", `${lastResult.prevValue ?? 0} units`],
                      ["Current Reading", `${lastResult.waterReading?.reading ?? "—"} units`],
                      ["Units Used", `${lastResult.unitsUsed?.toFixed(2) ?? "—"}`],
                      ["Water Bill", `KES ${lastResult.waterBill?.toLocaleString()}`],
                    ].map(([k, v]) => (
                      <div key={k} style={{ background: "white", padding: "8px 10px", borderRadius: 6 }}>
                        <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>{k}</p>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.navy }}>{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" disabled={submitting} style={{
                width: "100%", padding: 13, borderRadius: 10, border: "none",
                background: submitting ? "#cbd5e1" : `linear-gradient(135deg, ${C.blue}, #0096c7)`,
                color: "white", fontWeight: 700, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(0,180,216,0.3)",
              }}>{submitting ? "Recording…" : "Record Water Reading"}</button>
            </form>
          </div>

          {/* Readings table */}
          <div style={{ background: "white", padding: 28, borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: C.navy }}>
              📋 Reading History {selectedUnit ? "(Filtered)" : "(All Units)"}
            </h3>
            {filteredReadings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>💧</div>
                <p>No readings recorded yet</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                      {["Unit", "Tenant", "Month/Year", "Reading", "Recorded"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReadings.slice(0, 30).map((r, i) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "white" : "#fafbfc" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: C.navy, fontSize: 13 }}>{r.unit?.unitCode}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "#475569" }}>{r.unit?.tenant?.fullName || "—"}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "#64748b" }}>{MONTHS[r.month - 1]} {r.year}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, fontSize: 13 }}>
                          <span style={{ background: "#eff9ff", color: C.blue, padding: "2px 8px", borderRadius: 6 }}>{r.reading}</span>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: "#94a3b8" }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

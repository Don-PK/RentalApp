import { useEffect, useState } from "react";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import { useAuth } from "../auth/useAuth";

const C = { navy: "#0f1923", blue: "#00b4d8", green: "#06d6a0", yellow: "#ffd166", pink: "#f72585" };
const goodOptions = ["GOOD", "NEEDS_REPAIR"];
const wallOptions = ["PAINTED", "NOT_PAINTED"];
const tokenOptions = ["PROVIDED", "NOT_PROVIDED"];

const emptyCheck = {
  fullName: "", phone: "", nationalId: "", occupants: "1", startDate: new Date().toISOString().slice(0, 10),
  rent: "", initialWaterReading: "", paymentAmount: "", paymentReference: "", paymentMethod: "MPESA", paymentDate: new Date().toISOString().slice(0, 10),
  wallPaintStatus: "PAINTED", toiletLocksCondition: "GOOD", doorsCondition: "GOOD", sinkCondition: "GOOD", socketsCondition: "GOOD", lightingCondition: "GOOD", tokenStatus: "PROVIDED",
};
const emptyWater = { reading: "", month: new Date().getMonth() + 1, year: new Date().getFullYear(), waterRatePerUnit: 100 };
const emptyCheckout = { endDate: new Date().toISOString().slice(0, 10), checkoutWallPaintStatus: "PAINTED", checkoutToiletLocksCondition: "GOOD", checkoutDoorsCondition: "GOOD", checkoutSinkCondition: "GOOD", checkoutSocketsCondition: "GOOD", checkoutLightingCondition: "GOOD", checkoutTokenStatus: "PROVIDED", checkoutWaterReading: "" };

export default function Units() {
  const { user } = useAuth();
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [mode, setMode] = useState("");
  const [checkForm, setCheckForm] = useState(emptyCheck);
  const [waterForm, setWaterForm] = useState(emptyWater);
  const [checkoutForm, setCheckoutForm] = useState(emptyCheckout);
  const [checkoutStatus, setCheckoutStatus] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchUnits(); }, []);
  async function fetchUnits() {
    const res = await api.get("/units");
    setUnits(res.data || []);
  }

  async function open(unit, nextMode) {
    setSelectedUnit(unit);
    setMode(nextMode);
    setError("");
    setSuccess("");
    setCheckoutStatus(null);

    if (nextMode === "checkin") {
      // Pre-populate initial water reading from last reading on unit (from previous checkout)
      const lastWaterReading = unit.waterReadings?.[0]?.reading || "";
      setCheckForm({
        ...emptyCheck,
        rent: unit.rent || "",
        paymentAmount: unit.rent ? String(Number(unit.rent) * 2) : "",
        initialWaterReading: lastWaterReading ? String(lastWaterReading) : "",
      });
    }
    if (nextMode === "water") {
      setWaterForm(emptyWater);
    }
    if (nextMode === "checkout") {
      // Fetch checkout status to show invoice info
      try {
        const leaseId = unit.leases?.[0]?.id;
        if (leaseId) {
          const res = await api.get(`/leases/${leaseId}/checkout-status`);
          setCheckoutStatus(res.data);
          if (!res.data.canCheckout) {
            setError(`Cannot checkout: ${res.data.unpaidInvoices.length} invoice(s) unpaid. Paid ${res.data.paidInvoiceCount}/${res.data.invoiceCount} invoices.`);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to check invoice status");
      }
      setCheckoutForm({ ...emptyCheckout, checkoutWaterReading: unit.waterReadings?.[0]?.reading || "" });
    }
  }

  function close() {
    setSelectedUnit(null);
    setMode("");
    setCheckoutStatus(null);
  }

  async function submitCheckIn(e) {
    e.preventDefault(); setLoading(true); setError(""); setSuccess("");
    try {
      await api.post("/tenants", { ...checkForm, unitId: selectedUnit.id, occupants: Number(checkForm.occupants), rent: Number(checkForm.rent), initialWaterReading: Number(checkForm.initialWaterReading || 0), paymentAmount: checkForm.paymentAmount ? Number(checkForm.paymentAmount) : undefined });
      setSuccess("Tenant checked in and first invoice/payment recorded."); await fetchUnits(); setTimeout(close, 800);
    } catch (err) { setError(err.response?.data?.message || "Check-in failed"); }
    finally { setLoading(false); }
  }
  async function submitWater(e) {
    e.preventDefault(); setLoading(true); setError(""); setSuccess("");
    try {
      const res = await api.post("/water/record", { unitId: selectedUnit.id, reading: Number(waterForm.reading), month: Number(waterForm.month), year: Number(waterForm.year), waterRatePerUnit: Number(waterForm.waterRatePerUnit) });
      setSuccess(`Water updated. Bill: KES ${Number(res.data.waterBill || 0).toLocaleString()}. Invoice is now available in Payments.`); await fetchUnits();
    } catch (err) { setError(err.response?.data?.error || "Water update failed"); }
    finally { setLoading(false); }
  }
  async function submitCheckout(e) {
    e.preventDefault(); setLoading(true); setError(""); setSuccess("");
    try {
      const leaseId = selectedUnit.leases?.[0]?.id;
      if (!leaseId) throw new Error("No active lease found for this unit");
      await api.patch(`/leases/${leaseId}/close`, checkoutForm);
      setSuccess("Tenant checked out and unit marked vacant."); await fetchUnits(); setTimeout(close, 800);
    } catch (err) { setError(err.response?.data?.message || err.message || "Checkout failed"); }
    finally { setLoading(false); }
  }

  const input = { width: "100%", padding: 10, border: "1px solid #dbe3ea", borderRadius: 8, boxSizing: "border-box", marginBottom: 10 };
  const btn = { padding: "9px 12px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 };
  const modalTitle = mode === "checkin" ? "Check In Tenant" : mode === "water" ? "Update Water Reading" : "Check Out Tenant";

  return <AdminLayout><div style={{ padding: 28 }}>
    <h2 style={{ marginTop: 0, color: C.navy }}>Units</h2>
    {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 8, marginBottom: 14 }}>{error}</div>}
    {success && <div style={{ background: "#dcfce7", color: "#166534", padding: 12, borderRadius: 8, marginBottom: 14 }}>{success}</div>}
    {Object.entries(
      units.reduce((acc, u) => {
        const pName = u.property?.name || "Unassigned";
        if (!acc[pName]) acc[pName] = [];
        acc[pName].push(u);
        return acc;
      }, {})
    ).map(([propertyName, propertyUnits]) => (
      <div key={propertyName} style={{ marginBottom: 32 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, color: "#475569", borderBottom: "2px solid #e2e8f0", paddingBottom: 8 }}>
          🏢 {propertyName}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {propertyUnits.map((u) => <div key={u.id} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><strong>Unit {u.unitCode}</strong><span>{u.status}</span></div>
            <p style={{ margin: "6px 0", color: "#64748b" }}>{u.unitType?.replaceAll("_", " ")}</p>
            <p style={{ margin: "6px 0" }}>Rent: KES {Number(u.rent || 0).toLocaleString()}</p>
            {u.tenant && <p style={{ margin: "6px 0" }}>Tenant: {u.tenant.fullName} ({u.tenant.phone})</p>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              {u.status === "VACANT" && <button onClick={() => open(u, "checkin")} style={{ ...btn, background: C.blue, color: "white" }}>Check in</button>}
              {u.status === "OCCUPIED" && <button onClick={() => open(u, "water")} style={{ ...btn, background: C.green, color: "white" }}>Water reading</button>}
              {u.status === "OCCUPIED" && <button onClick={() => open(u, "checkout")} style={{ ...btn, background: C.pink, color: "white" }}>Check out</button>}
              {user?.role === "ADMIN" && (
                <button onClick={() => open(u, "edit")} style={{ ...btn, background: "#64748b", color: "white" }}>Edit Unit</button>
              )}
            </div>
          </div>)}
        </div>
      </div>
    ))}

    {mode && selectedUnit && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "grid", placeItems: "center", zIndex: 20 }} onClick={close}>
      <form onSubmit={mode === "checkin" ? submitCheckIn : mode === "water" ? submitWater : submitCheckout} onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 14, padding: 24, width: "min(720px, 92vw)", maxHeight: "90vh", overflow: "auto" }}>
        <h3 style={{ marginTop: 0 }}>{modalTitle} - Unit {selectedUnit.unitCode}</h3>
        {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 8, marginBottom: 14, fontSize: 13 }}>⚠️ {error}</div>}
        {mode === "checkin" && <>
          {selectedUnit.waterReadings?.[0] && <div style={{ background: "#ecf0ff", border: "1px solid #c7d2fe", padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13, color: "#3730a3" }}>ℹ️ Initial water reading pre-filled from previous tenant checkout: <strong>{selectedUnit.waterReadings[0].reading} units</strong></div>}
          <input style={input} placeholder="Tenant name" value={checkForm.fullName} onChange={(e) => setCheckForm({ ...checkForm, fullName: e.target.value })} required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><input style={input} placeholder="Phone" value={checkForm.phone} onChange={(e) => setCheckForm({ ...checkForm, phone: e.target.value })} required /><input style={input} placeholder="National ID" value={checkForm.nationalId} onChange={(e) => setCheckForm({ ...checkForm, nationalId: e.target.value })} required /></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}><input style={input} type="number" placeholder="Occupants" value={checkForm.occupants} onChange={(e) => setCheckForm({ ...checkForm, occupants: e.target.value })} required /><input style={input} type="date" value={checkForm.startDate} onChange={(e) => setCheckForm({ ...checkForm, startDate: e.target.value })} /><input style={input} type="number" placeholder="Rent" value={checkForm.rent} onChange={(e) => setCheckForm({ ...checkForm, rent: e.target.value, paymentAmount: String(Number(e.target.value || 0) * 2) })} required /><input style={input} type="number" placeholder="Initial water" value={checkForm.initialWaterReading} onChange={(e) => setCheckForm({ ...checkForm, initialWaterReading: e.target.value })} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}><input style={input} placeholder="Transaction ID" value={checkForm.paymentReference} onChange={(e) => setCheckForm({ ...checkForm, paymentReference: e.target.value })} /><input style={input} type="number" placeholder="Amount paid" value={checkForm.paymentAmount} onChange={(e) => setCheckForm({ ...checkForm, paymentAmount: e.target.value })} /><input style={input} type="date" value={checkForm.paymentDate} onChange={(e) => setCheckForm({ ...checkForm, paymentDate: e.target.value })} /><select style={input} value={checkForm.paymentMethod} onChange={(e) => setCheckForm({ ...checkForm, paymentMethod: e.target.value })}><option>MPESA</option><option>BANK</option><option>CASH</option></select></div>
          <Inspection form={checkForm} setForm={setCheckForm} prefix="" />
        </>}
        {mode === "water" && <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}><input style={input} type="number" step="0.01" placeholder="Current reading" value={waterForm.reading} onChange={(e) => setWaterForm({ ...waterForm, reading: e.target.value })} required /><input style={input} type="number" value={waterForm.month} onChange={(e) => setWaterForm({ ...waterForm, month: e.target.value })} /><input style={input} type="number" value={waterForm.year} onChange={(e) => setWaterForm({ ...waterForm, year: e.target.value })} /><input style={input} type="number" value={waterForm.waterRatePerUnit} onChange={(e) => setWaterForm({ ...waterForm, waterRatePerUnit: e.target.value })} /></div>}
        {mode === "edit" && user?.role === "ADMIN" && <EditUnit unit={selectedUnit} onChange={(u)=>{setSelectedUnit(u); fetchUnits();}} onClose={close} />}
        {mode === "checkout" && <>
          {checkoutStatus && (
            <div style={{ background: checkoutStatus.canCheckout ? "#dcfce7" : "#fee2e2", border: `1px solid ${checkoutStatus.canCheckout ? "#86efac" : "#fca5a5"}`, padding: 12, borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
              {checkoutStatus.canCheckout ? (
                <div style={{ color: "#166534" }}>✅ All invoices paid ({checkoutStatus.paidInvoiceCount}/{checkoutStatus.invoiceCount}). Ready for checkout.</div>
              ) : (
                <div style={{ color: "#991b1b" }}>❌ {checkoutStatus.unpaidInvoices.length} invoice(s) unpaid ({checkoutStatus.paidInvoiceCount}/{checkoutStatus.invoiceCount} paid)</div>
              )}
              {checkoutStatus.lastWaterReading && <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>Last water reading: {checkoutStatus.lastWaterReading.reading} units (Month {checkoutStatus.lastWaterReading.month}/{checkoutStatus.lastWaterReading.year})</div>}
            </div>
          )}
          <input style={input} type="date" value={checkoutForm.endDate} onChange={(e) => setCheckoutForm({ ...checkoutForm, endDate: e.target.value })} />
          <input style={input} type="number" placeholder="Final water reading" value={checkoutForm.checkoutWaterReading} onChange={(e) => setCheckoutForm({ ...checkoutForm, checkoutWaterReading: e.target.value })} />
          <Inspection form={checkoutForm} setForm={setCheckoutForm} prefix="checkout" />
        </>}
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}><button disabled={loading || (mode === "checkout" && checkoutStatus && !checkoutStatus.canCheckout)} style={{ ...btn, background: (mode === "checkout" && checkoutStatus && !checkoutStatus.canCheckout) ? "#cbd5e1" : C.blue, color: "white", cursor: (mode === "checkout" && checkoutStatus && !checkoutStatus.canCheckout) ? "not-allowed" : "pointer" }}>{loading ? "Saving..." : "Save"}</button><button type="button" onClick={close} style={{ ...btn, background: "#e2e8f0" }}>Cancel</button></div>
      </form>
    </div>}
  </div></AdminLayout>;
}

function Inspection({ form, setForm, prefix }) {
  const map = prefix === "checkout" ? {
    wall: "checkoutWallPaintStatus", toilet: "checkoutToiletLocksCondition", doors: "checkoutDoorsCondition", sink: "checkoutSinkCondition", sockets: "checkoutSocketsCondition", lighting: "checkoutLightingCondition", token: "checkoutTokenStatus",
  } : { wall: "wallPaintStatus", toilet: "toiletLocksCondition", doors: "doorsCondition", sink: "sinkCondition", sockets: "socketsCondition", lighting: "lightingCondition", token: "tokenStatus" };
  const [showUtilities, setShowUtilities] = useState(false);
  const labels = { wall: 'Wall paint', toilet: 'Toilet & locks', doors: 'Doors', sink: 'Sink', sockets: 'Sockets', lighting: 'Lighting', token: 'Token' };
  const select = (key, opts) => (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{labels[key] || key}</div>
      <select disabled={!showUtilities} style={{ width: "100%", padding: 10, border: "1px solid #dbe3ea", borderRadius: 8, marginBottom: 10, background: showUtilities ? 'white' : '#f8fafc' }} value={form[key] || opts[0]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>{opts.map((o) => <option key={o}>{o}</option>)}</select>
    </div>
  );
  return <div>
    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
      <label style={{ fontWeight: 700 }}>Utilities</label>
      <button type="button" onClick={() => setShowUtilities(s => !s)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}>{showUtilities ? 'Hide' : 'Show'} utilities</button>
      <span style={{ color: '#64748b', fontSize: 13 }}>(You must view utilities before selecting conditions)</span>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>{select(map.wall, wallOptions)}{select(map.toilet, goodOptions)}{select(map.doors, goodOptions)}{select(map.sink, goodOptions)}{select(map.sockets, goodOptions)}{select(map.lighting, goodOptions)}{select(map.token, tokenOptions)}</div>
  </div>;
}

function EditUnit({ unit, onChange, onClose }) {
  const [form, setForm] = useState({ type: unit.unitType || '', rent: unit.rent || 0 });
  const [loading, setLoading] = useState(false);
  const save = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await api.patch(`/units/${unit.id}`, { type: form.type, rent: Number(form.rent) });
      onChange(res.data);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update unit');
    } finally { setLoading(false); }
  };
  return (
    <form onSubmit={save} style={{ display: 'grid', gap: 10 }}>
      <label style={{ fontWeight: 700 }}>Unit Type</label>
      <select value={form.type} onChange={e=>setForm(f=>({...f, type: e.target.value}))} style={{ padding: 10, borderRadius: 8 }} required>
        <option value="">Select type</option>
        <option value="ONE_BEDROOM">ONE_BEDROOM</option>
        <option value="TWO_BEDROOM">TWO_BEDROOM</option>
        <option value="THREE_BEDROOM">THREE_BEDROOM</option>
        <option value="BEDSITTER">BEDSITTER</option>
        <option value="SINGLE_ROOM">SINGLE_ROOM</option>
        <option value="SHOP">SHOP</option>
        <option value="OFFICE">OFFICE</option>
      </select>
      <label style={{ fontWeight: 700 }}>Rent (KES)</label>
      <input type="number" value={form.rent} onChange={e=>setForm(f=>({...f, rent: e.target.value}))} style={{ padding: 10, borderRadius: 8 }} required />
      <div style={{ display: 'flex', gap: 8 }}><button type="submit" style={{ padding: '8px 12px', background: '#0f172a', color: 'white', borderRadius: 8 }} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button><button type="button" onClick={onClose} style={{ padding: '8px 12px', background: '#e2e8f0', borderRadius: 8 }}>Cancel</button></div>
    </form>
  );
}

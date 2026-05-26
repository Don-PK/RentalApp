import { useEffect, useState } from "react";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import { useAuth } from "../auth/useAuth";

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = {
  primary: "#2c3e50",
  secondary: "#3498db",
  accent: "#e74c3c",
  success: "#27ae60",
  warning: "#f39c12",
  light: "#ecf0f1",
  white: "#ffffff",
};

const RESIDENTIAL_UNIT_TYPES = [
  { value: "THREE_BEDROOM", label: "3 Bedroom" },
  { value: "TWO_BEDROOM",   label: "2 Bedroom" },
  { value: "ONE_BEDROOM",   label: "1 Bedroom" },
  { value: "BEDSITTER",     label: "Studio Apartment" },
  { value: "SINGLE_ROOM",   label: "Single Room" },
];

const BUSINESS_UNIT_TYPES = [
  { value: "SHOP",   label: "Shop" },
  { value: "OFFICE", label: "Office" },
];

const UNIT_TYPE_LABELS = {
  THREE_BEDROOM: "3 Bedroom",
  TWO_BEDROOM:   "2 Bedroom",
  ONE_BEDROOM:   "1 Bedroom",
  BEDSITTER:     "Studio Apartment",
  SINGLE_ROOM:   "Single Room",
  SHOP:          "Shop",
  OFFICE:        "Office",
};

const RESIDENTIAL_DEFAULT_RENTS = {
  THREE_BEDROOM: 30000,
  TWO_BEDROOM: 20000,
  ONE_BEDROOM: 10000,
  BEDSITTER: 7000,
  SINGLE_ROOM: 4000,
};

function floorLabel(idx) {
  if (idx === 0) return "Ground Floor";
  const suffixes = ["th", "st", "nd", "rd"];
  const v = idx % 100;
  const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  return `${idx}${suffix} Floor`;
}

function unitCode(floorIdx, unitIdx) {
  if (floorIdx === 0) return `GF${unitIdx + 1}`;
  return `${String.fromCharCode(64 + floorIdx)}${unitIdx + 1}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: "6px",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle = {
  display: "block",
  marginBottom: "5px",
  fontWeight: "600",
  color: "#444",
  fontSize: "13px",
 };

const btnBase = {
  padding: "9px 18px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "600",
  transition: "opacity 0.15s",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Properties() {
  const { user } = useAuth();
  const [properties, setProperties]   = useState([]);
  const [agents, setAgents]           = useState([]);
  const [showForm, setShowForm]       = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [loading, setLoading]         = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState("");

  // ── Form state ──────────────────────────────────────────────────────────────
  const [basics, setBasics] = useState({
    name: "",
    location: "",
    type: "house_rental",
    numberOfFloors: "",
    agentId: "",
    businessUnitType: "SHOP",
    businessRent: "",
  });

  // floors[i] = { unitCount: "", units: [{ unitType: "", rent: "" }, ...] }
  const [floors, setFloors] = useState([]);
  const [floorsConfigured, setFloorsConfigured] = useState(false);

  const unitTypes =
    basics.type === "house_rental" ? RESIDENTIAL_UNIT_TYPES : BUSINESS_UNIT_TYPES;

  // ── Data fetching ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user) {
      fetchProperties();
      if (user.role === "ADMIN") {
        fetchAgents();
      }
    }
  }, [user]);

  async function fetchProperties() {
    try {
      const res = await api.get("/properties");
      setProperties(res.data);
    } catch (err) {
      console.error("Failed to fetch properties:", err);
    }
  }

  async function fetchAgents() {
    try {
      const res = await api.get("/users/agents");
      setAgents(res.data);
    } catch (err) {
      console.error("Failed to fetch agents:", err);
    }
  }

  // ── Basic field changes ──────────────────────────────────────────────────────
  function handleBasicsChange(e) {
    const { name, value } = e.target;
    setBasics((prev) => {
      const nextBasics = { ...prev, [name]: value };

      // Reset floors when property type or floor count changes
      if (name === "type" || name === "numberOfFloors") {
        setFloors([]);
        setFloorsConfigured(false);
      }

      // If we are editing business unit type or rent, propagate to all configured units
      if (prev.type === "business_rental" && (name === "businessUnitType" || name === "businessRent")) {
        setFloors((prevFloors) =>
          prevFloors.map((floor) => ({
            ...floor,
            units: floor.units.map((unit) => ({
              ...unit,
              unitType: name === "businessUnitType" ? value : unit.unitType,
              rent: name === "businessRent" ? value : unit.rent,
            })),
          }))
        );
      }

      return nextBasics;
    });
  }

  // ── Step: initialise floor rows ──────────────────────────────────────────────
  function handleInitFloors() {
    const n = parseInt(basics.numberOfFloors);
    if (!n || n < 1) {
      setError("Please enter a valid number of floors first.");
      return;
    }
    setError("");
    setFloors(Array.from({ length: n }, () => ({ unitCount: "", units: [] })));
    setFloorsConfigured(true);
  }

  // ── Change unit count for a floor ───────────────────────────────────────────
  function handleUnitCountChange(floorIdx, value) {
    const count = parseInt(value) || 0;
    setFloors((prev) => {
      const next = [...prev];
      const existing = next[floorIdx].units;
      // Expand or shrink units array, preserving existing entries
      const newUnits = Array.from({ length: count }, (_, i) => {
        if (existing[i]) return existing[i];
        if (basics.type === "business_rental") {
          return { unitType: basics.businessUnitType, rent: basics.businessRent };
        } else {
          return { unitType: "", rent: "" };
        }
      });
      next[floorIdx] = { unitCount: value, units: newUnits };
      return next;
    });
  }

  // ── Change unit type for a specific unit ────────────────────────────────────
  function handleUnitTypeChange(floorIdx, unitIdx, value) {
    setFloors((prev) => {
      const next = [...prev];
      const units = [...next[floorIdx].units];
      const defaultRent = RESIDENTIAL_DEFAULT_RENTS[value] || "";
      units[unitIdx] = { ...units[unitIdx], unitType: value, rent: defaultRent };
      next[floorIdx] = { ...next[floorIdx], units };
      return next;
    });
  }

  // ── Change rent fee for a specific unit ─────────────────────────────────────
  function handleUnitRentChange(floorIdx, unitIdx, value) {
    setFloors((prev) => {
      const next = [...prev];
      const units = [...next[floorIdx].units];
      units[unitIdx] = { ...units[unitIdx], rent: value };
      next[floorIdx] = { ...next[floorIdx], units };
      return next;
    });
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { name, location, type, numberOfFloors, agentId } = basics;

    if (!name || !location || !type || !numberOfFloors) {
      return setError("Name, location, type, and number of floors are required.");
    }
    if (!floorsConfigured || floors.length === 0) {
      return setError("Please configure the floors before submitting.");
    }

    // Validate each floor & unit
    for (let f = 0; f < floors.length; f++) {
      const fl = floors[f];
      if (!fl.unitCount || parseInt(fl.unitCount) < 1) {
        return setError(`${floorLabel(f)} must have at least 1 unit.`);
      }
      for (let u = 0; u < fl.units.length; u++) {
        if (!fl.units[u].unitType) {
          return setError(
            `Please select a unit type for unit ${unitCode(f, u)} (${floorLabel(f)}).`
          );
        }
        if (fl.units[u].rent === undefined || fl.units[u].rent === "") {
          return setError(
            `Please enter a rent fee for unit ${unitCode(f, u)} (${floorLabel(f)}).`
          );
        }
      }
    }

    setLoading(true);
    try {
      const payload = {
        name,
        location,
        type,
        numberOfFloors: parseInt(numberOfFloors),
        floors: floors.map((fl) => ({
          units: fl.units.map((u) => ({
            unitType: u.unitType,
            rent: u.rent ? parseFloat(u.rent) : 0,
          })),
        })),
      };
      if (agentId) payload.agentId = agentId;

      const res = await api.post("/properties", payload);
      setSuccess(
        `Property "${res.data.name}" created with ${res.data.units.length} units!`
      );
      resetForm();
      fetchProperties();
      setTimeout(() => { setShowForm(false); setSuccess(""); }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create property.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setBasics({
      name: "",
      location: "",
      type: "house_rental",
      numberOfFloors: "",
      agentId: "",
      businessUnitType: "SHOP",
      businessRent: "",
    });
    setFloors([]);
    setFloorsConfigured(false);
  }

  // ── Assign agent ─────────────────────────────────────────────────────────────
  async function handleAssignAgent(propertyId, agentId) {
    if (!agentId) return setError("Please select an agent.");
    try {
      await api.patch(`/properties/${propertyId}/assign-agent`, { agentId });
      setSuccess("Agent assigned successfully!");
      setAssigningId(null);
      setSelectedAgent("");
      fetchProperties();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign agent.");
    }
  }

  // ── Guard ─────────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <AdminLayout>
        <div style={{ padding: "20px" }}>
          <h2>Loading...</h2>
        </div>
      </AdminLayout>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, color: COLORS.primary, fontSize: "22px" }}>🏢 Properties</h2>
          {user?.role === "ADMIN" && (
            <button
              onClick={() => { setShowForm(!showForm); resetForm(); setError(""); setSuccess(""); }}
              style={{ ...btnBase, background: showForm ? COLORS.accent : COLORS.secondary, color: COLORS.white }}
            >
              {showForm ? "✕ Cancel" : "+ Add Property"}
            </button>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{ background: "#dcfce7", color: "#166534", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
            ✅ {success}
          </div>
        )}

        {/* ── Create Property Form ── */}
        {user?.role === "ADMIN" && showForm && (
          <form
            onSubmit={handleSubmit}
            style={{
              background: COLORS.white,
              padding: "24px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              marginBottom: "32px",
            }}
          >
            <h3 style={{ margin: "0 0 20px 0", color: COLORS.primary, fontSize: "16px" }}>
              New Property
            </h3>

            {/* Row: Name + Location */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelStyle}>Property Name *</label>
                <input type="text" name="name" value={basics.name}
                  onChange={handleBasicsChange} style={inputStyle} placeholder="e.g., Sunrise Apartments" />
              </div>
              <div>
                <label style={labelStyle}>Location *</label>
                <input type="text" name="location" value={basics.location}
                  onChange={handleBasicsChange} style={inputStyle} placeholder="e.g., Nairobi, Kenya" />
              </div>
            </div>

            {/* Row: Type + Agent */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelStyle}>Property Type *</label>
                <select name="type" value={basics.type} onChange={handleBasicsChange} style={inputStyle}>
                  <option value="house_rental">🏠 House Rental</option>
                  <option value="business_rental">🏪 Business Rental</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Assign Agent (optional)</label>
                <select name="agentId" value={basics.agentId} onChange={handleBasicsChange} style={inputStyle}>
                  <option value="">— No agent —</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Top-level Business Unit Config if business property */}
            {basics.type === "business_rental" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>Business Unit Type *</label>
                  <select name="businessUnitType" value={basics.businessUnitType} onChange={handleBasicsChange} style={inputStyle}>
                    {BUSINESS_UNIT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Rent per Unit (KES) *</label>
                  <input
                    type="number"
                    name="businessRent"
                    value={basics.businessRent}
                    onChange={handleBasicsChange}
                    style={inputStyle}
                    placeholder="e.g., 15000"
                    min="0"
                    step="100"
                  />
                </div>
              </div>
            )}

            {/* Number of floors + configure button */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", marginBottom: "24px" }}>
              <div style={{ flex: "0 0 200px" }}>
                <label style={labelStyle}>Number of Floors *</label>
                <input type="number" name="numberOfFloors" value={basics.numberOfFloors}
                  onChange={handleBasicsChange} style={inputStyle} placeholder="e.g., 3" min="1" />
              </div>
              <button
                type="button"
                onClick={handleInitFloors}
                style={{ ...btnBase, background: COLORS.warning, color: COLORS.white, marginBottom: "1px" }}
              >
                {floorsConfigured ? "↻ Reconfigure Floors" : "Configure Floors →"}
              </button>
            </div>

            {/* ── Per-floor configuration ── */}
            {floorsConfigured && floors.map((fl, fi) => (
              <div
                key={fi}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "16px",
                  background: fi % 2 === 0 ? "#f9fafb" : "#fff",
                }}
              >
                {/* Floor header */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "14px" }}>
                  <span style={{
                    background: COLORS.secondary,
                    color: COLORS.white,
                    borderRadius: "6px",
                    padding: "4px 12px",
                    fontSize: "13px",
                    fontWeight: "700",
                    whiteSpace: "nowrap",
                  }}>
                    {floorLabel(fi)}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{ ...labelStyle, margin: 0, whiteSpace: "nowrap" }}>
                      Units on this floor:
                    </label>
                    <input
                      type="number"
                      value={fl.unitCount}
                      onChange={(e) => handleUnitCountChange(fi, e.target.value)}
                      style={{ ...inputStyle, width: "80px" }}
                      min="1"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Per-unit type rows */}
                {fl.units.length > 0 && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: "10px",
                  }}>
                    {fl.units.map((unit, ui) => {
                      if (basics.type === "business_rental") {
                        return (
                          <div
                            key={ui}
                            style={{
                              background: "#f3f4f6",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              padding: "10px 12px",
                            }}
                          >
                            <label style={{ ...labelStyle, color: "#4b5563" }}>
                              Unit {unitCode(fi, ui)}
                            </label>
                            <div style={{ fontSize: "12px", color: "#374151", lineHeight: "1.5" }}>
                              <div><strong>Type:</strong> {UNIT_TYPE_LABELS[basics.businessUnitType] || basics.businessUnitType}</div>
                              <div><strong>Rent:</strong> KES {basics.businessRent ? parseFloat(basics.businessRent).toLocaleString() : "0"}</div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div
                            key={ui}
                            style={{
                              background: COLORS.white,
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              padding: "10px 12px",
                            }}
                          >
                            <label style={{ ...labelStyle, color: COLORS.secondary }}>
                              Unit {unitCode(fi, ui)}
                            </label>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              <select
                                value={unit.unitType}
                                onChange={(e) => handleUnitTypeChange(fi, ui, e.target.value)}
                                style={inputStyle}
                              >
                                <option value="">— Select type —</option>
                                {unitTypes.map((t) => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                value={unit.rent}
                                onChange={(e) => handleUnitRentChange(fi, ui, e.target.value)}
                                style={inputStyle}
                                placeholder="Rent Fee (KES)"
                                min="0"
                                step="100"
                              />
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}

                {fl.units.length === 0 && parseInt(fl.unitCount) >= 1 && (
                  <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>
                    Enter a unit count above to configure units.
                  </p>
                )}
              </div>
            ))}

            {/* Submit */}
            <div style={{ marginTop: "8px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...btnBase,
                  background: loading ? "#9ca3af" : COLORS.success,
                  color: COLORS.white,
                  padding: "11px 28px",
                  fontSize: "14px",
                }}
              >
                {loading ? "Creating…" : "✓ Create Property"}
              </button>
            </div>
          </form>
        )}

        {/* ── Properties Table ── */}
        <div style={{
          background: COLORS.white,
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          overflowX: "auto",
        }}>
          <h3 style={{ margin: "0 0 20px 0", color: COLORS.primary }}>All Properties</h3>

          {properties.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>No properties created yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
              <thead>
                <tr style={{
                  background: `linear-gradient(90deg, ${COLORS.secondary}18, ${COLORS.secondary}05)`,
                  borderBottom: `2px solid ${COLORS.secondary}`,
                }}>
                  {["Name", "Location", "Type", "Floors", "Units", "Assigned Agent", ...(user?.role === "ADMIN" ? ["Action"] : [])].map((h) => (
                    <th key={h} style={{ padding: "13px 14px", textAlign: "left", fontWeight: "700", color: COLORS.primary, fontSize: "13px" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {properties.map((prop, idx) => (
                  <tr
                    key={prop.id}
                    style={{
                      borderBottom: `1px solid ${COLORS.light}`,
                      background: idx % 2 === 0 ? COLORS.white : `${COLORS.light}55`,
                    }}
                  >
                    <td style={{ padding: "13px 14px", fontWeight: "600", color: COLORS.primary }}>
                      {prop.type === "house_rental" ? "🏠" : "🏪"} {prop.name}
                    </td>
                    <td style={{ padding: "13px 14px", color: "#6b7280" }}>📍 {prop.location}</td>
                    <td style={{ padding: "13px 14px" }}>
                      <span style={{
                        background: prop.type === "house_rental" ? "#dbeafe" : "#fef3c7",
                        color: prop.type === "house_rental" ? "#1e40af" : "#92400e",
                        borderRadius: "999px",
                        padding: "3px 10px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}>
                        {prop.type === "house_rental" ? "House" : "Business"}
                      </span>
                    </td>
                    <td style={{ padding: "13px 14px", color: "#6b7280" }}>{prop.numberOfFloors}</td>
                    <td style={{ padding: "13px 14px", color: "#6b7280" }}>
                      {prop.units?.length || 0} units
                      {prop.units?.length > 0 && (
                        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                          {[...new Set(prop.units.map((u) => UNIT_TYPE_LABELS[u.unitType] || u.unitType))]
                            .join(", ")}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "13px 14px", color: "#6b7280" }}>
                      {prop.agent ? `👤 ${prop.agent.name}` : <span style={{ color: "#d1d5db" }}>—</span>}
                    </td>
                    {user?.role === "ADMIN" && (
                      <td style={{ padding: "13px 14px" }}>
                        {assigningId === prop.id ? (
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <select
                              value={selectedAgent}
                              onChange={(e) => setSelectedAgent(e.target.value)}
                              style={{ ...inputStyle, width: "140px", padding: "6px 8px" }}
                            >
                              <option value="">Select agent</option>
                              {agents.map((a) => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                              ))}
                            </select>
                            <button onClick={() => handleAssignAgent(prop.id, selectedAgent)}
                              style={{ ...btnBase, background: COLORS.success, color: COLORS.white, padding: "6px 12px" }}>✓</button>
                            <button onClick={() => { setAssigningId(null); setSelectedAgent(""); }}
                              style={{ ...btnBase, background: COLORS.accent, color: COLORS.white, padding: "6px 12px" }}>✕</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAssigningId(prop.id)}
                            style={{ ...btnBase, background: COLORS.secondary, color: COLORS.white }}
                          >
                            {prop.agent ? "Change Agent" : "Assign Agent"}
                          </button>
                        )}
                      </td>
                    )}
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

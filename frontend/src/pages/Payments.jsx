import { useEffect, useState, useCallback, Fragment } from "react";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import { useAuth } from "../auth/useAuth";

/* ─── design tokens ─── */
const C = {
  navy: "#0f1923",
  blue: "#00b4d8",
  pink: "#f72585",
  green: "#06d6a0",
  yellow: "#ffd166",
  purple: "#7c3aed",
  lightGray: "#f8fafc",
  borderGray: "#e2e8f0",
  textMuted: "#64748b",
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const STATUS_STYLE = {
  PAID:    { bg: "#f0fdf9", color: "#065f46", border: "#a7f3d0", label: "PAID" },
  PENDING: { bg: "#fffbea", color: "#92400e", border: "#fde68a", label: "PENDING" },
  PARTIAL: { bg: "#eff9ff", color: "#075985", border: "#bae6fd", label: "PARTIAL" },
  LATE:    { bg: "#fff0f3", color: "#be123c", border: "#fecdd3", label: "LATE" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.PENDING;
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: "nowrap", letterSpacing: "0.04em",
    }}>{s.label}</span>
  );
}

function BalanceBadge({ type, amount }) {
  const map = {
    CLEARED:  { bg: "#f0fdf9", color: "#065f46", icon: "✓", text: "Cleared" },
    ARREARS:  { bg: "#fff0f3", color: "#be123c", icon: "↑", text: `Arrears KES ${(amount||0).toLocaleString()}` },
    ADVANCE:  { bg: "#eff9ff", color: "#075985", icon: "↓", text: `Advance KES ${Math.abs(amount||0).toLocaleString()}` },
  };
  const d = map[type];
  if (!d) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700,
      background: d.bg, color: d.color,
    }}>{d.icon} {d.text}</span>
  );
}

export default function Payments() {
  const { user } = useAuth();

  /* ─── data ─── */
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ─── UI state ─── */
  const [activeTab, setActiveTab] = useState("invoices");
  const [filter, setFilter] = useState("ALL");
  const [searchTx, setSearchTx] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [expandedUnits, setExpandedUnits] = useState({});

  /* ─── Inline Pay Form State ─── */
  const [activePaymentInvoiceId, setActivePaymentInvoiceId] = useState(null);
  const [payForm, setPayForm] = useState({
    amount: "",
    reference: "",
    method: "MPESA",
    paymentDate: new Date().toISOString().split("T")[0],
  });
  const [submittingInvoiceId, setSubmittingInvoiceId] = useState(null);
  const [inlineFormError, setInlineFormError] = useState("");
  const [inlineFormResult, setInlineFormResult] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, payRes] = await Promise.all([
        api.get("/invoices"),
        api.get("/payments"),
      ]);
      setInvoices(invRes.data || []);
      setPayments(payRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleExpand = (unitId) => {
    setExpandedUnits(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };

  const handleOpenPayForm = (inv) => {
    const remaining = Math.max(0, inv.amountDue - inv.amountPaid);
    setActivePaymentInvoiceId(inv.id);
    setPayForm({
      amount: remaining.toString(),
      reference: "",
      method: "MPESA",
      paymentDate: new Date().toISOString().split("T")[0],
    });
    setInlineFormError("");
    setInlineFormResult(null);
  };

  const handleClosePayForm = () => {
    setActivePaymentInvoiceId(null);
    setInlineFormError("");
    setInlineFormResult(null);
  };

  const handleInlineSubmit = async (e, inv) => {
    e.preventDefault();
    setSubmittingInvoiceId(inv.id);
    setInlineFormError("");
    setInlineFormResult(null);
    try {
      const res = await api.post("/payments", {
        invoiceId: inv.id,
        tenantId: inv.lease.tenantId,
        amount: parseFloat(payForm.amount),
        reference: payForm.reference,
        method: payForm.method,
        paymentDate: payForm.paymentDate,
      });
      setInlineFormResult({ type: res.data.balanceType, balance: res.data.balance });
      await fetchAll();
      setTimeout(() => {
        setActivePaymentInvoiceId(null);
        setInlineFormResult(null);
      }, 3000);
    } catch (err) {
      setInlineFormError(err.response?.data?.message || "Failed to record payment.");
    } finally {
      setSubmittingInvoiceId(null);
    }
  };

  /* ─── computed stats ─── */
  const totalOutstanding = invoices.filter(i => i.status !== "PAID").reduce((s, i) => s + Math.max(0, i.amountDue - i.amountPaid), 0);
  const totalCollected   = payments.reduce((s, p) => s + p.amount, 0);
  const overdueCount     = invoices.filter(i => i.status === "LATE" || i.status === "PARTIAL").length;

  /* ─── grouping invoices by unit ─── */
  const groupedUnits = {};
  invoices.forEach(inv => {
    const unit = inv.lease?.unit;
    if (!unit) return;
    const unitId = unit.id;
    if (!groupedUnits[unitId]) {
      groupedUnits[unitId] = {
        unit,
        tenant: inv.lease?.tenant,
        invoices: [],
      };
    }
    groupedUnits[unitId].invoices.push(inv);
  });

  const unitList = Object.values(groupedUnits).map(item => {
    const sortedInvoices = [...item.invoices].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    const latestInvoice = sortedInvoices[0];
    const totalInvoiced = item.invoices.reduce((sum, inv) => sum + (inv.amountDue || 0), 0);
    const totalPaid = item.invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const totalBalance = totalInvoiced - totalPaid;

    return {
      ...item,
      invoices: sortedInvoices,
      latestInvoice,
      totalInvoiced,
      totalPaid,
      totalBalance,
    };
  });

  // Filter unit list based on active status filter and search query
  const searchLower = invoiceSearch.toLowerCase();
  const filteredUnitList = unitList.filter(item => {
    const matchesSearch = !invoiceSearch || 
      item.unit?.unitCode?.toLowerCase().includes(searchLower) ||
      item.tenant?.fullName?.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    if (filter === "ALL") return true;
    return item.invoices.some(inv => inv.status === filter);
  });

  const filteredPayments = searchTx
    ? payments.filter(p => p.reference?.toLowerCase().includes(searchTx.toLowerCase()))
    : payments;

  const inp = {
    width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0",
    borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit",
    boxSizing: "border-box", background: "white",
  };
  const lbl = { display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13, color: "#475569" };

  if (loading) return (
    <AdminLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 44, height: 44, border: `3px solid ${C.blue}30`, borderTop: `3px solid ${C.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#64748b", fontSize: 14 }}>Loading payments…</p>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.navy, letterSpacing: "-0.5px" }}>
              Payments &amp; Invoices
            </h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
              Invoices are grouped by unit. Click a unit to view its invoice history and record tenant payments.
            </p>
          </div>
        </div>

        {/* ── Summary cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total Outstanding", value: `KES ${totalOutstanding.toLocaleString()}`, color: C.pink,   bg: "#fff0f6", icon: "💰" },
            { label: "Total Collected",   value: `KES ${totalCollected.toLocaleString()}`,   color: C.green,  bg: "#f0fdf9", icon: "✅" },
            { label: "Overdue / Partial", value: overdueCount,                                color: C.yellow, bg: "#fffbea", icon: "⚠️" },
          ].map(card => (
            <div key={card.label} style={{
              background: card.bg, borderRadius: 14, padding: "20px 24px",
              border: `1px solid ${card.color}30`, display: "flex", gap: 16, alignItems: "center",
            }}>
              <div style={{ fontSize: 28 }}>{card.icon}</div>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{card.label}</p>
                <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: card.color }}>{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f1f5f9", borderRadius: 10, padding: 4, width: "fit-content" }}>
          {[["invoices", "🧾 Invoices By Unit"], ["payments", "💳 Payment History"]].map(([k, v]) => (
            <button
              key={k}
              id={`tab-${k}`}
              onClick={() => setActiveTab(k)}
              style={{
                padding: "8px 22px", border: "none", borderRadius: 8, cursor: "pointer",
                background: activeTab === k ? "white" : "transparent",
                color: activeTab === k ? C.navy : "#64748b",
                fontWeight: activeTab === k ? 700 : 500, fontSize: 14,
                boxShadow: activeTab === k ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s",
              }}>
              {v}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════
            TAB: INVOICES
        ══════════════════════════════ */}
        {activeTab === "invoices" && (
          <>
            {/* Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["ALL","PENDING","PARTIAL","PAID","LATE"].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    style={{
                      padding: "6px 16px", border: "none", borderRadius: 20,
                      cursor: "pointer", fontSize: 12, fontWeight: 700,
                      background: filter === s ? C.blue : "#f1f5f9",
                      color: filter === s ? "white" : "#64748b",
                      transition: "all 0.15s",
                    }}>
                    {s}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ position: "relative", width: 280 }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94a3b8" }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search Unit or Tenant…"
                    value={invoiceSearch}
                    onChange={e => setInvoiceSearch(e.target.value)}
                    style={{ ...inp, padding: "8px 12px 8px 32px", fontSize: 13 }}
                  />
                </div>
                <span style={{ color: "#94a3b8", fontSize: 13, whiteSpace: "nowrap" }}>
                  {filteredUnitList.length} unit{filteredUnitList.length !== 1 ? "s" : ""} listed
                </span>
              </div>
            </div>

            <div style={{
              background: "white", borderRadius: 14, border: "1px solid #e2e8f0",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden",
            }}>
              {filteredUnitList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div>
                  <p style={{ fontSize: 15, fontWeight: 600 }}>No units with invoices found</p>
                  <p style={{ fontSize: 13 }}>Record a water reading to automatically generate rent invoices</p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9", background: "#f8fafc" }}>
                      <th style={{ padding: "14px 18px", width: 40 }}></th>
                      {["Unit", "Tenant Name", "Total Invoiced", "Total Paid", "Outstanding Balance", "Latest Invoice Date", "Latest Bill"].map(h => (
                        <th key={h} style={{
                          padding: "14px 14px",
                          textAlign: h.includes("Total") || h.includes("Balance") || h.includes("Bill") ? "right" : "left",
                          fontSize: 11, fontWeight: 700, color: "#64748b",
                          textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnitList.map((item) => {
                      const isExpanded = !!expandedUnits[item.unit.id];
                      return (
                        <Fragment key={item.unit.id}>
                          {/* Unit Row */}
                          <tr
                            onClick={() => toggleExpand(item.unit.id)}
                            style={{
                              borderBottom: "1px solid #f1f5f9",
                              background: isExpanded ? "#f8fafc" : "white",
                              cursor: "pointer",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = "#f0fbff"; }}
                            onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = "white"; }}
                          >
                            {/* Expand Chevron */}
                            <td style={{ padding: "14px 18px", textAlign: "center", color: C.blue, fontWeight: 800, fontSize: 14 }}>
                              {isExpanded ? "▼" : "▶"}
                            </td>
                            {/* Unit Code */}
                            <td style={{ padding: "14px 14px" }}>
                              <span style={{
                                background: "#f1f5f9", padding: "4px 10px", borderRadius: 6,
                                fontWeight: 800, color: C.navy, fontSize: 13,
                              }}>
                                {item.unit.unitCode}
                              </span>
                            </td>
                            {/* Tenant Name */}
                            <td style={{ padding: "14px 14px", fontSize: 14, fontWeight: 700, color: C.navy }}>
                              {item.tenant?.fullName || "—"}
                            </td>
                            {/* Total Invoiced */}
                            <td style={{ padding: "14px 14px", fontSize: 13, textAlign: "right", color: "#475569" }}>
                              KES {item.totalInvoiced.toLocaleString()}
                            </td>
                            {/* Total Paid */}
                            <td style={{ padding: "14px 14px", fontSize: 13, textAlign: "right", color: C.green, fontWeight: 600 }}>
                              KES {item.totalPaid.toLocaleString()}
                            </td>
                            {/* Total Balance */}
                            <td style={{ padding: "14px 14px", textAlign: "right" }}>
                              <span style={{
                                fontWeight: 800, fontSize: 14,
                                color: item.totalBalance > 0 ? C.pink : item.totalBalance < 0 ? C.blue : C.green
                              }}>
                                KES {item.totalBalance.toLocaleString()}
                              </span>
                            </td>
                            {/* Latest Date */}
                            <td style={{ padding: "14px 14px", fontSize: 13, color: "#64748b" }}>
                              {item.latestInvoice ? `${MONTHS[item.latestInvoice.month - 1]} ${item.latestInvoice.year}` : "—"}
                            </td>
                            {/* Latest Bill */}
                            <td style={{ padding: "14px 14px", textAlign: "right" }}>
                              {item.latestInvoice ? (
                                <span style={{ fontWeight: 700, fontSize: 13, color: C.navy }}>
                                  KES {item.latestInvoice.amountDue.toLocaleString()}
                                </span>
                              ) : "—"}
                            </td>
                          </tr>

                          {/* Expanded Invoices Container */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={9} style={{ padding: "12px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                <div style={{
                                  background: "white",
                                  borderRadius: 10,
                                  border: "1px solid #e2e8f0",
                                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
                                  padding: 16,
                                }}>
                                  <h4 style={{ margin: "0 0 12px 0", fontSize: 13, fontWeight: 800, color: C.navy, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                    🧾 Monthly Invoices for Unit {item.unit.unitCode} ({item.tenant?.fullName})
                                  </h4>
                                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                      <tr style={{ borderBottom: "1.5px solid #e2e8f0", background: "#fafbfc" }}>
                                        {["Billing Month", "Rent Fee", "Water Bill", "Total Bill", "Amount Paid", "Balance Due", "Status", user?.role === "AGENT" ? "Actions" : ""].filter(Boolean).map(sh => (
                                          <th key={sh} style={{
                                            padding: "10px 12px",
                                            textAlign: sh.includes("Fee") || sh.includes("Bill") || sh.includes("Paid") || sh.includes("Balance") ? "right" : "left",
                                            fontSize: 10, fontWeight: 700, color: "#64748b",
                                            textTransform: "uppercase", letterSpacing: "0.04em",
                                          }}>{sh}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {item.invoices.map((inv) => {
                                        const isFormOpen = activePaymentInvoiceId === inv.id;
                                        const balance = inv.amountDue - inv.amountPaid;
                                        return (
                                          <Fragment key={inv.id}>
                                            <tr style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}>
                                              {/* Billing Month */}
                                              <td style={{ padding: "12px", fontSize: 13, fontWeight: 600, color: C.navy }}>
                                                {MONTHS[inv.month - 1]} {inv.year}
                                              </td>
                                              {/* Rent Fee */}
                                              <td style={{ padding: "12px", fontSize: 13, textAlign: "right", color: "#475569" }}>
                                                KES {inv.baseRent.toLocaleString()}
                                              </td>
                                              {/* Water Bill */}
                                              <td style={{ padding: "12px", fontSize: 13, textAlign: "right", color: C.blue, fontWeight: 600 }}>
                                                KES {inv.waterBill.toLocaleString()}
                                              </td>
                                              {/* Total Bill */}
                                              <td style={{ padding: "12px", fontSize: 13, textAlign: "right", fontWeight: 700, color: C.navy }}>
                                                KES {inv.amountDue.toLocaleString()}
                                              </td>
                                              {/* Amount Paid */}
                                              <td style={{ padding: "12px", fontSize: 13, textAlign: "right", color: C.green, fontWeight: 600 }}>
                                                KES {inv.amountPaid.toLocaleString()}
                                              </td>
                                              {/* Balance Due */}
                                              <td style={{ padding: "12px", fontSize: 13, textAlign: "right", fontWeight: 700, color: balance > 0 ? C.pink : C.navy }}>
                                                KES {balance.toLocaleString()}
                                              </td>
                                              {/* Status */}
                                              <td style={{ padding: "12px" }}>
                                                <StatusBadge status={inv.status} />
                                              </td>
                                              {/* Actions */}
                                              {user?.role === "AGENT" && (
                                                <td style={{ padding: "12px" }}>
                                                  {inv.status !== "PAID" ? (
                                                    <button
                                                      onClick={() => isFormOpen ? handleClosePayForm() : handleOpenPayForm(inv)}
                                                      style={{
                                                        padding: "5px 12px",
                                                        background: isFormOpen ? "#cbd5e1" : C.blue,
                                                        color: isFormOpen ? "#64748b" : "white",
                                                        border: "none", borderRadius: 6, cursor: "pointer",
                                                        fontSize: 11, fontWeight: 700,
                                                        transition: "all 0.15s",
                                                      }}>
                                                      {isFormOpen ? "Cancel" : "Add Payment"}
                                                    </button>
                                                  ) : (
                                                    <span style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>✓ Settled</span>
                                                  )}
                                                </td>
                                              )}
                                            </tr>

                                            {/* Inline Form */}
                                            {isFormOpen && (
                                              <tr>
                                                <td colSpan={8} style={{ padding: "14px", background: "#f0fdf4", borderBottom: "1px solid #cbd5e1" }}>
                                                  <form onSubmit={(e) => handleInlineSubmit(e, inv)} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr) auto", gap: 12, alignItems: "end" }}>
                                                    <div>
                                                      <label style={{ ...lbl, fontSize: 11, marginBottom: 3 }}>Amount Paid (KES) *</label>
                                                      <input
                                                        type="number" min="1" required
                                                        value={payForm.amount}
                                                        onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))}
                                                        style={{ ...inp, padding: "8px 10px", fontSize: 13 }}
                                                      />
                                                    </div>
                                                    <div>
                                                      <label style={{ ...lbl, fontSize: 11, marginBottom: 3 }}>Date Paid *</label>
                                                      <input
                                                        type="date" required
                                                        value={payForm.paymentDate}
                                                        onChange={e => setPayForm(p => ({ ...p, paymentDate: e.target.value }))}
                                                        style={{ ...inp, padding: "8px 10px", fontSize: 13 }}
                                                      />
                                                    </div>
                                                    <div>
                                                      <label style={{ ...lbl, fontSize: 11, marginBottom: 3 }}>Transaction ID *</label>
                                                      <input
                                                        type="text" required
                                                        placeholder="e.g. QWE123ABC"
                                                        value={payForm.reference}
                                                        onChange={e => setPayForm(p => ({ ...p, reference: e.target.value }))}
                                                        style={{ ...inp, padding: "8px 10px", fontSize: 13 }}
                                                      />
                                                    </div>
                                                    <div>
                                                      <label style={{ ...lbl, fontSize: 11, marginBottom: 3 }}>Method</label>
                                                      <select
                                                        value={payForm.method}
                                                        onChange={e => setPayForm(p => ({ ...p, method: e.target.value }))}
                                                        style={{ ...inp, padding: "8px 10px", fontSize: 13 }}
                                                      >
                                                        <option value="MPESA">M-PESA</option>
                                                        <option value="BANK">Bank Transfer</option>
                                                        <option value="CASH">Cash</option>
                                                      </select>
                                                    </div>
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                      <button
                                                        type="submit"
                                                        disabled={submittingInvoiceId === inv.id}
                                                        style={{
                                                          padding: "8px 16px",
                                                          background: `linear-gradient(135deg, ${C.green}, #059669)`,
                                                          color: "white", border: "none", borderRadius: 8, fontWeight: 700,
                                                          fontSize: 12, cursor: "pointer",
                                                        }}>
                                                        {submittingInvoiceId === inv.id ? "Saving…" : "Post"}
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={handleClosePayForm}
                                                        style={{
                                                          padding: "8px 12px", background: "#cbd5e1", border: "none",
                                                          borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", color: "#64748b"
                                                        }}>
                                                        ✕
                                                      </button>
                                                    </div>

                                                    {/* inline alerts */}
                                                    {inlineFormError && (
                                                      <div style={{ gridColumn: "1/-1", color: "#be123c", fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                                                        ⚠ {inlineFormError}
                                                      </div>
                                                    )}

                                                    {inlineFormResult && (
                                                      <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                                                        <span style={{ fontSize: 12, color: "#065f46", fontWeight: 700 }}>Payment Recorded:</span>
                                                        <BalanceBadge type={inlineFormResult.type} amount={Math.abs(inlineFormResult.balance)} />
                                                      </div>
                                                    )}
                                                  </form>
                                                </td>
                                              </tr>
                                            )}
                                          </Fragment>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════════
            TAB: PAYMENT HISTORY
        ══════════════════════════════ */}
        {activeTab === "payments" && (
          <>
            {/* Search */}
            <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#94a3b8" }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search by Transaction ID…"
                  value={searchTx}
                  onChange={e => setSearchTx(e.target.value)}
                  style={{ ...inp, paddingLeft: 38 }}
                />
              </div>
              {searchTx && (
                <button
                  onClick={() => setSearchTx("")}
                  style={{ padding: "8px 14px", background: "#f1f5f9", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#64748b" }}>
                  Clear
                </button>
              )}
              <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                {filteredPayments.length} record{filteredPayments.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div style={{
              background: "white", borderRadius: 14, border: "1px solid #e2e8f0",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflowX: "auto",
            }}>
              {filteredPayments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
                  <p style={{ fontSize: 15, fontWeight: 600 }}>
                    {searchTx ? "No payments match your search" : "No payments recorded yet"}
                  </p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9", background: "#f8fafc" }}>
                      {["Transaction ID","Unit","Tenant Name","Amount","Method","Date Paid"].map(h => (
                        <th key={h} style={{
                          padding: "13px 14px", textAlign: h === "Amount" ? "right" : "left",
                          fontSize: 11, fontWeight: 700, color: "#64748b",
                          textTransform: "uppercase", letterSpacing: "0.05em",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((p, i) => (
                      <tr
                        key={p.id}
                        style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafbfc" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f0fbff"}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafbfc"}
                      >
                        <td style={{ padding: "13px 14px", fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: C.blue }}>
                          {p.reference}
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <span style={{ background: "#f1f5f9", padding: "3px 10px", borderRadius: 6, fontWeight: 800, color: C.navy, fontSize: 13 }}>
                            {p.invoice?.lease?.unit?.unitCode || p.tenant?.unit?.unitCode || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: 13, fontWeight: 600, color: C.navy }}>
                          {p.tenant?.fullName || "—"}
                        </td>
                        <td style={{ padding: "13px 14px", fontWeight: 800, color: C.green, fontSize: 15, textAlign: "right" }}>
                          KES {(p.amount || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <span style={{
                            padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                            background: p.method === "MPESA" ? "#f0fdf9" : p.method === "BANK" ? "#eff9ff" : "#fffbea",
                            color:      p.method === "MPESA" ? "#065f46" : p.method === "BANK" ? "#075985" : "#92400e",
                          }}>{p.method}</span>
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: 13, color: "#64748b" }}>
                          {new Date(p.paymentDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

      </div>
    </AdminLayout>
  );
}

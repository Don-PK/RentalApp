import { prisma } from "../../db/prisma.js";

function propertyScope({ agentId, createdById } = {}) {
  if (agentId) return { agentId };
  if (createdById) return { createdById };
  return {};
}

function unitScope(scope = {}) {
  return { property: propertyScope(scope) };
}

function paymentScope(scope = {}) {
  return { invoice: { lease: { unit: unitScope(scope) } } };
}

function tenantScope(scope = {}) {
  return { unit: unitScope(scope) };
}

export async function getTotalRevenue(scope = {}) {
  const result = await prisma.payment.aggregate({ where: paymentScope(scope), _sum: { amount: true } });
  return result._sum.amount ?? 0;
}

export async function getOutstandingBalance(scope = {}) {
  const invoices = await prisma.rentInvoice.findMany({
    where: {
      lease: {
        unit: unitScope(scope)
      }
    },
    select: {
      amountDue: true,
      amountPaid: true
    }
  });
  return invoices.reduce((sum, inv) => sum + ((inv.amountDue || 0) - (inv.amountPaid || 0)), 0);
}

export async function getOccupancyRate(scope = {}) {
  const filter = unitScope(scope);
  const totalUnits = await prisma.unit.count({ where: filter });
  const occupiedUnits = await prisma.unit.count({ where: { status: "OCCUPIED", ...filter } });
  return {
    totalUnits,
    occupiedUnits,
    vacantUnits: totalUnits - occupiedUnits,
    occupancyRate: totalUnits === 0 ? 0 : Math.round((occupiedUnits / totalUnits) * 100),
  };
}

export async function getPropertyPerformance(scope = {}) {
  const properties = await prisma.property.findMany({ where: propertyScope(scope), include: { units: true } });
  return properties.map((property) => {
    const totalUnits = property.units.length;
    const occupiedUnits = property.units.filter((u) => u.status === "OCCUPIED").length;
    return {
      propertyId: property.id,
      propertyName: property.name,
      location: property.location,
      totalUnits,
      occupiedUnits,
      vacantUnits: totalUnits - occupiedUnits,
      occupancyRate: totalUnits === 0 ? 0 : Math.round((occupiedUnits / totalUnits) * 100),
    };
  });
}

export async function getMonthlyIncome(year, scope = {}) {
  const invoices = await prisma.rentInvoice.findMany({
    where: {
      dueDate: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
      lease: {
        unit: unitScope(scope),
      },
    },
    select: { amountDue: true, dueDate: true },
  });

  const monthlyTotals = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 }));
  for (const inv of invoices) {
    const m = new Date(inv.dueDate).getMonth();
    monthlyTotals[m].total += inv.amountDue || 0;
  }
  return monthlyTotals;
}

/**
 * Returns monthly income broken down per property.
 * Result shape: { data: [{month, "Prop A": 0, "Prop B": 0}, ...], propertyNames: ["Prop A","Prop B"] }
 */
export async function getMonthlyIncomeByProperty(year, scope = {}) {
  const properties = await prisma.property.findMany({
    where: propertyScope(scope),
    select: { id: true, name: true },
  });

  if (properties.length === 0) return { data: [], propertyNames: [] };

  const propertyNames = properties.map((p) => p.name);

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const row = { month: i + 1 };
    propertyNames.forEach((name) => { row[name] = 0; });
    return row;
  });

  for (const prop of properties) {
    const invoices = await prisma.rentInvoice.findMany({
      where: {
        dueDate: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
        lease: { unit: { propertyId: prop.id } },
      },
      select: { amountDue: true, dueDate: true },
    });
    for (const inv of invoices) {
      const m = new Date(inv.dueDate).getMonth();
      monthlyData[m][prop.name] += inv.amountDue || 0;
    }
  }

  return { data: monthlyData, propertyNames };
}

/**
 * Returns outstanding, collected, and overdue counts per property.
 */
export async function getPropertyFinancials(scope = {}) {
  const properties = await prisma.property.findMany({
    where: propertyScope(scope),
    select: { id: true, name: true },
  });

  const result = [];
  for (const prop of properties) {
    const invoices = await prisma.rentInvoice.findMany({
      where: { lease: { unit: { propertyId: prop.id } } },
      select: { amountDue: true, amountPaid: true, status: true },
    });
    const outstanding = invoices
      .filter((i) => i.status !== "PAID")
      .reduce((s, i) => s + Math.max(0, (i.amountDue || 0) - (i.amountPaid || 0)), 0);
    const collected = invoices.reduce((s, i) => s + (i.amountPaid || 0), 0);
    const overdue = invoices.filter((i) => i.status === "LATE" || i.status === "PARTIAL").length;
    result.push({ propertyId: prop.id, propertyName: prop.name, outstanding, collected, overdue });
  }
  return result;
}

export async function getDebtors({ propertyId, agentId, createdById } = {}) {
  const scope = { agentId, createdById };
  const tenants = await prisma.tenant.findMany({
    where: {
      unit: {
        ...(propertyId ? { propertyId } : {}),
        property: propertyScope(scope),
      },
    },
    include: {
      unit: { include: { property: true } },
      leases: {
        include: { invoices: true }
      },
      arrears: true
    }
  });

  const tenantIds = tenants.map(t => t.id);
  const payments = tenantIds.length ? await prisma.payment.findMany({
    where: { tenantId: { in: tenantIds } },
    select: { tenantId: true, paymentDate: true },
    orderBy: { paymentDate: 'desc' }
  }) : [];

  const latestPaymentByTenant = payments.reduce((acc, p) => {
    const d = p.paymentDate ? new Date(p.paymentDate) : null;
    if (!d) return acc;
    if (!acc[p.tenantId] || d > acc[p.tenantId]) acc[p.tenantId] = d;
    return acc;
  }, {});

  const debtors = tenants.map((tenant) => {
    const totalOutstanding = tenant.leases.reduce((sum, lease) => {
      const leaseOutstanding = lease.invoices.reduce((s, inv) => s + ((inv.amountDue || 0) - (inv.amountPaid || 0)), 0);
      return sum + leaseOutstanding;
    }, 0);

    const latestPayment = latestPaymentByTenant[tenant.id] || null;

    return {
      tenantId: tenant.id,
      tenantName: tenant.fullName,
      phone: tenant.phone,
      propertyName: tenant.unit?.property?.name || "N/A",
      unitNumber: tenant.unit?.unitCode || "N/A",
      balance: totalOutstanding,
      lastUpdated: latestPayment || tenant.arrears?.updatedAt || tenant.createdAt,
    };
  }).filter((d) => d.balance > 0);

  debtors.sort((a, b) => b.balance - a.balance);
  return debtors;
}

export async function getDashboardSummary(year, scope = {}) {
  const [
    totalRevenue,
    outstandingBalance,
    occupancy,
    propertyPerformance,
    monthlyIncome,
    monthlyIncomeByProperty,
    propertyFinancials,
    debtors,
  ] = await Promise.all([
    getTotalRevenue(scope),
    getOutstandingBalance(scope),
    getOccupancyRate(scope),
    getPropertyPerformance(scope),
    getMonthlyIncome(year, scope),
    getMonthlyIncomeByProperty(year, scope),
    getPropertyFinancials(scope),
    getDebtors(scope),
  ]);

  return {
    totalRevenue,
    outstandingBalance,
    occupancy,
    propertyPerformance,
    monthlyIncome,
    monthlyIncomeByProperty,
    propertyFinancials,
    debtors,
  };
}

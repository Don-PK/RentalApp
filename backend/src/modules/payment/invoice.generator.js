import { prisma } from '../../db/prisma.js';
import { updateTenantArrears } from '../tenant/arrears.helper.js';

function getDueDate(year, month) { return new Date(year, month - 1, 5); }
function propertyScope(user) { if (user?.role === 'AGENT') return { agentId: user.id }; if (user?.role === 'ADMIN') return { createdById: user.id }; return {}; }

export async function generateMonthlyInvoices(year, month, { user } = {}) {
  const leases = await prisma.lease.findMany({
    where: { isActive: true, unit: { property: propertyScope(user) } },
    include: {
      tenant: { include: { arrears: true } },
      unit: { include: { waterReadings: { where: { year, month } } } },
      invoices: true,
    },
  });
  const invoices = [];
  for (const lease of leases) {
    let waterBill = 0;
    if (lease.unit.waterReadings.length > 0) {
      const prevReading = await prisma.waterReading.findFirst({
        where: {
          unitId: lease.unitId,
          OR: [
            { year, month: { lt: month } },
            { year: { lt: year } },
          ],
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      });
      const currentReading = lease.unit.waterReadings[0].reading;
      const prevValue = prevReading ? prevReading.reading : (lease.initialWaterReading ?? 0);
      waterBill = Math.max(0, currentReading - prevValue) * 100;
    }

    // Determine if this is the first invoice for the lease
    const isFirstMonth = lease.invoices.length === 0 || lease.invoices.every(inv => inv.year !== year || inv.month !== month);
    let amountDue;
    let deposit = lease.deposit || lease.rentAmount; // fallback if deposit not set
    if (isFirstMonth && month === lease.startDate.getMonth() + 1 && year === lease.startDate.getFullYear()) {
      // First month: rent + deposit
      amountDue = lease.rentAmount + deposit;
    } else {
      // Subsequent months: rent + water
      amountDue = lease.rentAmount + waterBill;
    }

    const invoice = await prisma.rentInvoice.upsert({
      where: { leaseId_year_month: { leaseId: lease.id, year, month } },
      update: { baseRent: lease.rentAmount, waterBill, amountDue },
      create: { leaseId: lease.id, year, month, baseRent: lease.rentAmount, waterBill, amountDue, dueDate: getDueDate(year, month) },
    });
    await updateTenantArrears(lease.tenantId, prisma);
    invoices.push(invoice);
  }
  return invoices;
}

import { prisma } from '../../db/prisma.js';
import { DEFAULT_WATER_RATE_PER_UNIT } from '../../utils/rentRates.js';
import { updateTenantArrears } from '../tenant/arrears.helper.js';

function propertyScope(user) {
  if (user?.role === 'AGENT') return { agentId: user.id };
  if (user?.role === 'ADMIN') return { createdById: user.id };
  return {};
}
function getDueDate(year, month) { return new Date(year, month - 1, 5); }
function invoiceStatus(invoice) {
  if (invoice.amountPaid >= invoice.amountDue) return 'PAID';
  if (invoice.amountPaid > 0) return 'PARTIAL';
  return new Date() > invoice.dueDate ? 'LATE' : 'PENDING';
}

export async function recordWaterReading({ unitId, reading, month, year, waterRatePerUnit, user }) {
  const rateToUse = waterRatePerUnit ?? DEFAULT_WATER_RATE_PER_UNIT;
  return prisma.$transaction(async (tx) => {
    const unit = await tx.unit.findFirst({
      where: { id: unitId, property: propertyScope(user) },
      include: { tenant: { include: { leases: { where: { isActive: true } } } } },
    });
    if (!unit) throw new Error('Unit not found');

    const previousReading = await tx.waterReading.findFirst({
      where: { unitId, OR: [{ year, month: { lt: month } }, { year: { lt: year } }] },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    const prevValue = previousReading ? previousReading.reading : (unit.tenant?.leases?.[0]?.initialWaterReading ?? 0);
    const unitsUsed = Number(reading) - Number(prevValue);
    if (unitsUsed < 0) throw new Error('Current reading cannot be less than previous reading');
    const waterBill = unitsUsed * rateToUse;

    const waterReading = await tx.waterReading.upsert({
      where: { unitId_year_month: { unitId, year: Number(year), month: Number(month) } },
      update: { reading: Number(reading) },
      create: { unitId, reading: Number(reading), month: Number(month), year: Number(year) },
    });

    let updatedInvoice = null;
    if (unit.tenant && unit.tenant.leases.length > 0) {
      const lease = unit.tenant.leases[0];
      const amountDue = lease.rentAmount + waterBill;
      updatedInvoice = await tx.rentInvoice.upsert({
        where: { leaseId_year_month: { leaseId: lease.id, year: Number(year), month: Number(month) } },
        update: { baseRent: lease.rentAmount, waterBill, amountDue },
        create: { leaseId: lease.id, year: Number(year), month: Number(month), baseRent: lease.rentAmount, waterBill, amountDue, dueDate: getDueDate(Number(year), Number(month)) },
      });
      await updateTenantArrears(unit.tenant.id, tx);
      updatedInvoice = await tx.rentInvoice.update({ where: { id: updatedInvoice.id }, data: { status: invoiceStatus(updatedInvoice) } });
    }

    return { waterReading, waterBill, unitsUsed, prevValue, updatedInvoice };
  });
}

export async function listWaterReadings(unitId, { user } = {}) {
  return prisma.waterReading.findMany({
    where: { ...(unitId ? { unitId } : {}), unit: { property: propertyScope(user) } },
    include: { unit: { include: { property: true, tenant: true } } },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
}

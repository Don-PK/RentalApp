import { prisma } from '../../db/prisma.js';
import { updateTenantArrears } from './arrears.helper.js';

function getDueDate(year, month) { return new Date(year, month - 1, 5); }
function propertyScope(user) {
  if (user?.role === 'AGENT') return { agentId: user.id };
  if (user?.role === 'ADMIN') return { createdById: user.id };
  return {};
}

export async function createTenant({
  fullName, phone, nationalId, occupants, unitId, startDate,
  paymentAmount, paymentReference, paymentMethod, paymentDate,
  rent, user, initialWaterReading,
  wallPaintStatus, toiletLocksCondition, doorsCondition, sinkCondition,
  socketsCondition, lightingCondition, tokenStatus,
}) {
  return prisma.$transaction(async (tx) => {
    const unit = await tx.unit.findFirst({ where: { id: unitId, property: propertyScope(user) }, include: { property: true } });
    if (!unit) throw new Error('Unit not found');
    if (unit.status !== 'VACANT') throw new Error('Unit is not vacant');
    const rentToUse = rent !== undefined && rent !== null && rent !== '' ? Number(rent) : Number(unit.rent || 0);
    if (!rentToUse || rentToUse <= 0) throw new Error('Unit rent must be set before check-in');

    const tenant = await tx.tenant.create({ data: { fullName, phone, nationalId, occupants: Number(occupants), unitId }, include: { unit: true } });
    await tx.unit.update({ where: { id: unitId }, data: { status: 'OCCUPIED', rent: rentToUse } });

    const checkInDate = startDate ? new Date(startDate) : new Date();
    const year = checkInDate.getFullYear();
    const month = checkInDate.getMonth() + 1;
    const lease = await tx.lease.create({
      data: {
        tenantId: tenant.id,
        unitId,
        startDate: checkInDate,
        rentAmount: rentToUse,
        deposit: rentToUse,
        isActive: true,
        checkInWallPaintStatus: wallPaintStatus,
        checkInToiletLocksCondition: toiletLocksCondition,
        checkInDoorsCondition: doorsCondition,
        checkInSinkCondition: sinkCondition,
        checkInSocketsCondition: socketsCondition,
        checkInLightingCondition: lightingCondition,
        checkInTokenStatus: tokenStatus,
        initialWaterReading: initialWaterReading !== undefined && initialWaterReading !== '' ? Number(initialWaterReading) : null,
      },
    });

    if (initialWaterReading !== undefined && initialWaterReading !== null && initialWaterReading !== '') {
      await tx.waterReading.upsert({
        where: { unitId_year_month: { unitId, year, month } },
        update: { reading: Number(initialWaterReading) },
        create: { unitId, reading: Number(initialWaterReading), month, year },
      });
    }

    const firstMonthDue = rentToUse * 2;
    let invoice = await tx.rentInvoice.create({
      data: { leaseId: lease.id, year, month, baseRent: rentToUse, waterBill: 0, amountDue: firstMonthDue, dueDate: getDueDate(year, month) },
    });

    let payment = null;
    if (paymentAmount !== undefined && paymentReference && paymentMethod) {
      payment = await tx.payment.create({
        data: { tenantId: tenant.id, invoiceId: invoice.id, amount: Number(paymentAmount), reference: paymentReference, method: paymentMethod, paymentDate: paymentDate ? new Date(paymentDate) : new Date() },
      });
      invoice = await tx.rentInvoice.update({ where: { id: invoice.id }, data: { amountPaid: { increment: Number(paymentAmount) } } });
      const balance = invoice.amountDue - invoice.amountPaid;
      invoice = await tx.rentInvoice.update({ where: { id: invoice.id }, data: { status: balance <= 0 ? 'PAID' : invoice.amountPaid > 0 ? 'PARTIAL' : 'PENDING' } });
    }
    await updateTenantArrears(tenant.id, tx);

    return { tenant, lease, invoice, payment };
  });
}

export async function listTenants({ user } = {}) {
  return prisma.tenant.findMany({
    where: { unit: { property: propertyScope(user) } },
    include: { unit: { include: { property: true, waterReadings: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 1 } } }, leases: true, arrears: true, payments: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listDebtors({ user } = {}) {
  const tenants = await prisma.tenant.findMany({
    where: { unit: { property: propertyScope(user) } },
    include: {
      unit: { include: { property: true } },
      leases: {
        include: { invoices: true }
      },
      arrears: true
    }
  });

  const debtors = tenants.map(tenant => {
    const totalOutstanding = tenant.leases.reduce((sum, lease) => {
      const leaseOutstanding = lease.invoices.reduce((s, inv) => s + (inv.amountDue - inv.amountPaid), 0);
      return sum + leaseOutstanding;
    }, 0);

    return {
      ...tenant,
      arrears: {
        id: tenant.arrears?.id || `temp-${tenant.id}`,
        tenantId: tenant.id,
        balance: totalOutstanding,
        updatedAt: tenant.arrears?.updatedAt || tenant.createdAt
      }
    };
  }).filter(d => d.arrears.balance !== 0);

  debtors.sort((a, b) => new Date(b.arrears.updatedAt) - new Date(a.arrears.updatedAt));
  return debtors;
}

export async function getTenantById(id, { user } = {}) {
  return prisma.tenant.findFirst({ where: { id, unit: { property: propertyScope(user) } }, include: { unit: { include: { property: true } }, leases: true, payments: true, arrears: true } });
}

import { prisma } from '../../db/prisma.js';

function propertyScope(user) { if (user?.role === 'AGENT') return { agentId: user.id }; if (user?.role === 'ADMIN') return { createdById: user.id }; return {}; }
function allGood(payload) {
  return ['checkoutToiletLocksCondition', 'checkoutDoorsCondition', 'checkoutSinkCondition', 'checkoutSocketsCondition', 'checkoutLightingCondition']
    .every((key) => payload[key] === 'GOOD' || payload[key] === 'WORKING');
}

export async function createLease({ tenantId, unitId, startDate, rentAmount, deposit }) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('Tenant not found');
  if (tenant.unitId !== unitId) throw new Error('Tenant is not assigned to this unit');
  const existingLease = await prisma.lease.findFirst({ where: { tenantId, isActive: true } });
  if (existingLease) throw new Error('Tenant already has an active lease');
  return prisma.lease.create({ data: { tenantId, unitId, startDate: new Date(startDate), rentAmount, deposit, isActive: true } });
}

export async function closeLease(leaseId, payload, user) {
  const lease = await prisma.lease.findFirst({
    where: { id: leaseId, unit: { property: propertyScope(user) } },
    include: { tenant: { include: { arrears: true } }, invoices: true, unit: true },
  });
  if (!lease) throw new Error('Lease not found');
  if (!lease.isActive) throw new Error('Lease already closed');
  if (!payload.endDate) throw new Error('endDate is required');
  if (!allGood(payload)) throw new Error('All utilities must be in good working condition before checkout');
  if ((lease.tenant.arrears?.balance ?? 0) > 0 || lease.invoices.some((i) => i.amountPaid < i.amountDue)) {
    throw new Error('Checkout cannot be completed until all invoice balances are paid');
  }

  return prisma.$transaction(async (tx) => {
    const closed = await tx.lease.update({
      where: { id: leaseId },
      data: {
        endDate: new Date(payload.endDate),
        isActive: false,
        checkoutWallPaintStatus: payload.checkoutWallPaintStatus,
        checkoutToiletLocksCondition: payload.checkoutToiletLocksCondition,
        checkoutDoorsCondition: payload.checkoutDoorsCondition,
        checkoutSinkCondition: payload.checkoutSinkCondition,
        checkoutSocketsCondition: payload.checkoutSocketsCondition,
        checkoutLightingCondition: payload.checkoutLightingCondition,
        checkoutTokenStatus: payload.checkoutTokenStatus,
        checkoutWaterReading: payload.checkoutWaterReading !== undefined && payload.checkoutWaterReading !== '' ? Number(payload.checkoutWaterReading) : null,
      },
    });
    await tx.unit.update({ where: { id: lease.unitId }, data: { status: 'VACANT' } });
    // archive payments before removing them to preserve history
    const payments = await tx.payment.findMany({ where: { tenantId: lease.tenantId } });
    if (payments.length > 0) {
      const archives = payments.map(p => ({
        id: p.id,
        amount: p.amount,
        reference: p.reference,
        method: p.method,
        paymentDate: p.paymentDate,
        createdAt: p.createdAt,
        tenantId: p.tenantId,
        invoiceId: p.invoiceId,
      }));
      await tx.paymentArchive.createMany({ data: archives });
      await tx.payment.deleteMany({ where: { tenantId: lease.tenantId } });
    }
    await tx.arrears.deleteMany({ where: { tenantId: lease.tenantId } });
    await tx.tenant.delete({ where: { id: lease.tenantId } });
    return closed;
  });
}

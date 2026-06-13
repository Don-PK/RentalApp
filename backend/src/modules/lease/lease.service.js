import { prisma } from '../../db/prisma.js';

function propertyScope(user) { if (user?.role === 'AGENT') return { agentId: user.id }; if (user?.role === 'ADMIN') return { createdById: user.id }; return {}; }

function allGood(payload) {
  return ['checkoutToiletLocksCondition', 'checkoutDoorsCondition', 'checkoutSinkCondition', 'checkoutSocketsCondition', 'checkoutLightingCondition']
    .every((key) => payload[key] === 'GOOD' || payload[key] === 'WORKING');
}

// Check if all invoices are fully paid (status = PAID)
function allInvoicesPaid(invoices) {
  if (!invoices || invoices.length === 0) return true;
  return invoices.every((inv) => inv.status === 'PAID');
}

// Get checkout validation status
export async function getCheckoutStatus(leaseId, user) {
  const lease = await prisma.lease.findFirst({
    where: { id: leaseId, unit: { property: propertyScope(user) } },
    include: {
      tenant: { include: { arrears: true } },
      invoices: true,
      unit: { include: { waterReadings: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 1 } } },
    },
  });

  if (!lease) throw new Error('Lease not found');

  const unpaidInvoices = lease.invoices.filter((inv) => inv.status !== 'PAID');
  const arrearBalance = lease.tenant.arrears?.balance ?? 0;
  const lastWaterReading = lease.unit.waterReadings?.[0];

  return {
    canCheckout: unpaidInvoices.length === 0 && arrearBalance <= 0,
    unpaidInvoices,
    arrearBalance,
    lastWaterReading,
    invoiceCount: lease.invoices.length,
    paidInvoiceCount: lease.invoices.filter((inv) => inv.status === 'PAID').length,
  };
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
    include: {
      tenant: { include: { arrears: true } },
      invoices: true,
      unit: { include: { waterReadings: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 1 } } },
    },
  });

  if (!lease) throw new Error('Lease not found');
  if (!lease.isActive) throw new Error('Lease already closed');
  if (!payload.endDate) throw new Error('endDate is required');

  // Validate utilities condition
  if (!allGood(payload)) {
    throw new Error('All utilities must be in good working condition before checkout');
  }

  // Validate all invoices are PAID - this is the key requirement
  const unpaidInvoices = lease.invoices.filter((inv) => inv.status !== 'PAID');
  if (unpaidInvoices.length > 0) {
    const pendingCount = unpaidInvoices.length;
    const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + (inv.amountDue - inv.amountPaid), 0);
    throw new Error(`Checkout cannot be completed. ${pendingCount} invoice(s) remaining with KES ${totalUnpaid.toLocaleString()} unpaid.`);
  }

  // Validate no arrears
  if ((lease.tenant.arrears?.balance ?? 0) > 0) {
    throw new Error(`Checkout cannot be completed. Outstanding arrears of KES ${(lease.tenant.arrears?.balance ?? 0).toLocaleString()} must be cleared.`);
  }

  return prisma.$transaction(async (tx) => {
    // Store the last water reading from checkout to preserve for next tenant
    const checkoutWaterReading = payload.checkoutWaterReading !== undefined && payload.checkoutWaterReading !== '' ? Number(payload.checkoutWaterReading) : null;
    const endDate = new Date(payload.endDate);
    const checkoutYear = endDate.getFullYear();
    const checkoutMonth = endDate.getMonth() + 1;

    // Close the lease and record checkout info
    const closed = await tx.lease.update({
      where: { id: leaseId },
      data: {
        endDate: endDate,
        isActive: false,
        checkoutWallPaintStatus: payload.checkoutWallPaintStatus,
        checkoutToiletLocksCondition: payload.checkoutToiletLocksCondition,
        checkoutDoorsCondition: payload.checkoutDoorsCondition,
        checkoutSinkCondition: payload.checkoutSinkCondition,
        checkoutSocketsCondition: payload.checkoutSocketsCondition,
        checkoutLightingCondition: payload.checkoutLightingCondition,
        checkoutTokenStatus: payload.checkoutTokenStatus,
        checkoutWaterReading: checkoutWaterReading,
      },
    });

    // Save checkout water reading to WaterReading table so it's available for next tenant
    if (checkoutWaterReading !== null) {
      await tx.waterReading.upsert({
        where: { unitId_year_month: { unitId: lease.unitId, year: checkoutYear, month: checkoutMonth } },
        update: { reading: checkoutWaterReading },
        create: { unitId: lease.unitId, reading: checkoutWaterReading, month: checkoutMonth, year: checkoutYear },
      });
    }

    // Mark unit as VACANT so it can accept new tenants
    await tx.unit.update({ where: { id: lease.unitId }, data: { status: 'VACANT' } });

    // Archive all payments for audit trail
    const payments = await tx.payment.findMany({ where: { tenantId: lease.tenantId } });
    if (payments.length > 0) {
      const archives = payments.map((p) => ({
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

    // Clean up arrears record
    await tx.arrears.deleteMany({ where: { tenantId: lease.tenantId } });

    // Delete tenant record (completed checkout)
    await tx.tenant.delete({ where: { id: lease.tenantId } });

    return {
      ...closed,
      message: 'Tenant checked out successfully',
      unitNowVacant: true,
      lastWaterReadingRecorded: checkoutWaterReading,
    };
  });
}

import { prisma } from '../../db/prisma.js';

/**
 * Calculates the total outstanding balance across all invoices for a tenant
 * and updates or creates the Arrears table entry.
 * Can be run within a Prisma transaction by passing the transaction context 'tx'.
 */
export async function updateTenantArrears(tenantId, tx = prisma) {
  const leases = await tx.lease.findMany({
    where: { tenantId },
    select: { id: true },
  });
  const leaseIds = leases.map(l => l.id);

  const invoices = await tx.rentInvoice.findMany({
    where: { leaseId: { in: leaseIds } },
  });

  // balance = amountDue - amountPaid (could be positive for arrears, negative for advance)
  const totalOutstanding = invoices.reduce((sum, inv) => {
    return sum + (inv.amountDue - inv.amountPaid);
  }, 0);

  const arrears = await tx.arrears.upsert({
    where: { tenantId },
    update: { balance: totalOutstanding },
    create: { tenantId, balance: totalOutstanding },
  });

  return arrears;
}

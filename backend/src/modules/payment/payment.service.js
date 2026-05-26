import { prisma } from '../../db/prisma.js';
import { updateTenantArrears } from '../tenant/arrears.helper.js';

function computeStatus(amountDue, amountPaid, dueDate) {
  if (amountPaid >= amountDue) return 'PAID';
  if (amountPaid > 0) return 'PARTIAL';
  return new Date() > dueDate ? 'LATE' : 'PENDING';
}
function propertyScope(user) { if (user?.role === 'AGENT') return { agentId: user.id }; if (user?.role === 'ADMIN') return { createdById: user.id }; return {}; }
function paymentScope(user) { return { invoice: { lease: { unit: { property: propertyScope(user) } } } }; }
function invoiceScope(user) { return { lease: { unit: { property: propertyScope(user) } } }; }

export async function recordPayment({ tenantId, invoiceId, amount, reference, method, paymentDate, user }) {
  const invoice = await prisma.rentInvoice.findFirst({ where: { id: invoiceId, ...invoiceScope(user) }, include: { lease: { include: { tenant: { include: { arrears: true } } } } } });
  if (!invoice) throw new Error('Invoice not found');
  if (invoice.lease.tenantId !== tenantId) throw new Error('Tenant does not match invoice lease');
  if (amount <= 0) throw new Error('Amount must be greater than 0');

  // Preserve agent-entered date accurately. If a date-only string (YYYY-MM-DD)
  // is provided from the frontend, append a midday time to avoid timezone
  // shifts that can make the stored date appear one day off.
  let storedPaymentDate = new Date();
  if (paymentDate) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
      // use noon to avoid timezone rollbacks
      storedPaymentDate = new Date(`${paymentDate}T12:00:00`);
    } else {
      storedPaymentDate = new Date(paymentDate);
    }
  }

  const payment = await prisma.payment.create({ data: { tenantId, invoiceId, amount, reference, method, paymentDate: storedPaymentDate } });
  const updatedInvoice = await prisma.rentInvoice.update({ where: { id: invoiceId }, data: { amountPaid: { increment: amount } } });
  const finalInvoice = await prisma.rentInvoice.update({ where: { id: invoiceId }, data: { status: computeStatus(updatedInvoice.amountDue, updatedInvoice.amountPaid, updatedInvoice.dueDate) } });
  const arrears = await updateTenantArrears(tenantId, prisma);
  const balance = arrears.balance;
  return { payment, invoice: finalInvoice, balance, balanceType: balance > 0 ? 'ARREARS' : balance < 0 ? 'ADVANCE' : 'CLEARED' };
}

export async function listPayments({ search, user } = {}) {
  return prisma.payment.findMany({
    where: { ...(search ? { reference: { contains: search, mode: 'insensitive' } } : {}), ...paymentScope(user) },
    include: { tenant: { include: { unit: { include: { property: true } } } }, invoice: { include: { lease: { include: { unit: true } } } } },
    orderBy: { paymentDate: 'desc' },
  });
}

export async function getInvoiceById(invoiceId, { user } = {}) {
  return prisma.rentInvoice.findFirst({ where: { id: invoiceId, ...invoiceScope(user) }, include: { lease: { include: { tenant: true, unit: { include: { property: true } } } }, payments: true } });
}

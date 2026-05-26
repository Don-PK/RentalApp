import { prisma } from '../../db/prisma.js';
import { generateMonthlyInvoices } from '../payment/invoice.generator.js';

function propertyScope(user) {
  return user.role === 'AGENT' ? { agentId: user.id } : { createdById: user.id };
}

export async function generate(req, res) {
  try {
    const { year, month } = req.body;
    if (!year || !month) return res.status(400).json({ message: 'year and month are required' });
    const invoices = await generateMonthlyInvoices(Number(year), Number(month), { user: req.user });
    return res.json({ count: invoices.length, invoices });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function list(req, res) {
  try {
    const invoices = await prisma.rentInvoice.findMany({
      where: { lease: { unit: { property: propertyScope(req.user) } } },
      include: {
        lease: { include: { tenant: { include: { arrears: true } }, unit: { include: { property: true } } } },
        payments: true,
      },
      orderBy: { dueDate: 'desc' },
    });
    return res.json(invoices);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}


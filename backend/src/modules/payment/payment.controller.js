import { recordPayment, listPayments, getInvoiceById } from './payment.service.js';

export async function create(req, res) {
  try {
    const { tenantId, invoiceId, amount, reference, method, paymentDate } = req.body;
    if (!tenantId || !invoiceId || !amount || !reference) {
      return res.status(400).json({ message: 'tenantId, invoiceId, amount, and reference are required' });
    }
    const result = await recordPayment({ tenantId, invoiceId, amount: parseFloat(amount), reference, method, paymentDate, user: req.user });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function list(req, res) {
  try {
    const { search } = req.query;
    const payments = await listPayments({ search, user: req.user });
    return res.json(payments);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function getInvoice(req, res) {
  try {
    const invoice = await getInvoiceById(req.params.id, { user: req.user });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    return res.json(invoice);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

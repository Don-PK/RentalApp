import { closeLease, createLease, getCheckoutStatus } from './lease.service.js';

export async function create(req, res) {
  try {
    const { tenantId, unitId, startDate, rentAmount, deposit } = req.body;
    if (!tenantId || !unitId || !startDate || !rentAmount || deposit === undefined) return res.status(400).json({ message: 'tenantId, unitId, startDate, rentAmount, deposit are required' });
    const lease = await createLease({ tenantId, unitId, startDate, rentAmount: Number(rentAmount), deposit: Number(deposit) });
    return res.status(201).json(lease);
  } catch (err) { return res.status(400).json({ message: err.message }); }
}

export async function checkoutStatus(req, res) {
  try {
    const status = await getCheckoutStatus(req.params.id, req.user);
    return res.json(status);
  } catch (err) { return res.status(400).json({ message: err.message }); }
}

export async function close(req, res) {
  try {
    const lease = await closeLease(req.params.id, req.body, req.user);
    return res.json(lease);
  } catch (err) { return res.status(400).json({ message: err.message }); }
}


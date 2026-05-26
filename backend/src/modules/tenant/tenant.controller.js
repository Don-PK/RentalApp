import { createTenant, getTenantById, listTenants, listDebtors } from './tenant.service.js';

export async function create(req, res) {
  try {
    const { fullName, phone, nationalId, occupants, unitId } = req.body;
    if (!fullName || !phone || !nationalId || !occupants || !unitId) {
      return res.status(400).json({ message: 'fullName, phone, nationalId, occupants, unitId are required' });
    }
    const tenant = await createTenant({ ...req.body, occupants: Number(occupants), rent: req.body.rent !== undefined && req.body.rent !== '' ? Number(req.body.rent) : undefined, paymentAmount: req.body.paymentAmount !== undefined && req.body.paymentAmount !== '' ? Number(req.body.paymentAmount) : undefined, initialWaterReading: req.body.initialWaterReading !== undefined && req.body.initialWaterReading !== '' ? Number(req.body.initialWaterReading) : undefined, user: req.user });
    return res.status(201).json(tenant);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function list(req, res) {
  try { return res.json(await listTenants({ user: req.user })); }
  catch (err) { return res.status(500).json({ message: err.message }); }
}

export async function getById(req, res) {
  try {
    const tenant = await getTenantById(req.params.id, { user: req.user });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    return res.json(tenant);
  } catch (err) { return res.status(500).json({ message: err.message }); }
}

export async function getDebtors(req, res) {
  try { return res.json(await listDebtors({ user: req.user })); }
  catch (err) { return res.status(500).json({ message: err.message }); }
}

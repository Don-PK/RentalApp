import { createUnit, listUnits, updateUnitStatus, updateUnitConditions } from './unit.service.js';

export async function create(req, res) {
  try {
    const { propertyId, number, type, rent } = req.body;

    if (!propertyId || !number || !type || rent === undefined) {
      return res.status(400).json({
        message: 'propertyId, number, type, and rent are required',
      });
    }

    const unit = await createUnit({
      propertyId,
      number,
      type,
      rent: Number(rent),
      user: req.user,
    });

    return res.status(201).json(unit);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function list(req, res) {
  try {
    const units = await listUnits({ user: req.user });
    return res.json(units);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'status is required' });
    }

    const unit = await updateUnitStatus(id, status, req.user);
    return res.json(unit);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function updateConditions(req, res) {
  try {
    const { id } = req.params;
    const {
      toiletCondition,
      sinkCondition,
      doorsCondition,
      cabinetsCondition,
      electricalAppliancesCondition,
      rent,
      type,
    } = req.body;

    const unit = await updateUnitConditions(id, {
      toiletCondition,
      sinkCondition,
      doorsCondition,
      cabinetsCondition,
      electricalAppliancesCondition,
      rent,
      type,
      user: req.user,
    });

    return res.json(unit);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}


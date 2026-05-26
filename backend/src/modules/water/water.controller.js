import { recordWaterReading, listWaterReadings } from './water.service.js';

export async function record(req, res) {
  try {
    const { unitId, reading, month, year, waterRatePerUnit } = req.body;
    if (!unitId || reading === undefined || !month || !year) {
      return res.status(400).json({ error: 'unitId, reading, month, and year are required' });
    }
    const result = await recordWaterReading({
      unitId,
      reading: Number(reading),
      month: Number(month),
      year: Number(year),
      waterRatePerUnit: waterRatePerUnit ? Number(waterRatePerUnit) : undefined,
      user: req.user,
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function list(req, res) {
  try {
    const { unitId } = req.query;
    const readings = await listWaterReadings(unitId, { user: req.user });
    return res.json(readings);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

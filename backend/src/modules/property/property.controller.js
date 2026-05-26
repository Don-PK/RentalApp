import { createProperty, assignPropertyToAgent, getPropertyById, listProperties } from './property.service.js';

const RESIDENTIAL_TYPES = ['THREE_BEDROOM', 'TWO_BEDROOM', 'ONE_BEDROOM', 'BEDSITTER', 'SINGLE_ROOM'];
const BUSINESS_TYPES = ['SHOP', 'OFFICE'];

function propertyScope(user) {
  return user.role === 'AGENT' ? { agentId: user.id } : { createdById: user.id };
}

export async function create(req, res) {
  try {
    const { name, location, type, numberOfFloors, agentId, floors } = req.body;

    if (!name || !location || !type || numberOfFloors === undefined || !Array.isArray(floors)) {
      return res.status(400).json({ message: 'name, location, type, numberOfFloors, and floors[] are required' });
    }

    if (!['house_rental', 'business_rental'].includes(type)) {
      return res.status(400).json({ message: 'type must be either "house_rental" or "business_rental"' });
    }

    if (numberOfFloors < 1) return res.status(400).json({ message: 'numberOfFloors must be at least 1' });

    if (floors.length !== numberOfFloors) {
      return res.status(400).json({ message: `floors array length (${floors.length}) must match numberOfFloors (${numberOfFloors})` });
    }

    const allowedTypes = type === 'house_rental' ? RESIDENTIAL_TYPES : BUSINESS_TYPES;
    for (let f = 0; f < floors.length; f++) {
      const floor = floors[f];
      if (!Array.isArray(floor.units) || floor.units.length === 0) {
        return res.status(400).json({ message: `Floor ${f} must have at least one unit` });
      }
      for (let u = 0; u < floor.units.length; u++) {
        const unitType = floor.units[u].unitType;
        if (!unitType || !allowedTypes.includes(unitType)) {
          return res.status(400).json({ message: `Invalid unitType "${unitType}" on floor ${f}, unit ${u + 1}. Allowed: ${allowedTypes.join(', ')}` });
        }
      }
    }

    const property = await createProperty({
      name,
      location,
      type,
      numberOfFloors,
      agentId,
      floors,
      createdById: req.user.id,
    });
    return res.status(201).json(property);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function assignAgent(req, res) {
  try {
    const { id } = req.params;
    const { agentId } = req.body;

    if (!agentId) return res.status(400).json({ message: 'agentId is required' });

    const property = await assignPropertyToAgent({ propertyId: id, agentId, createdById: req.user.id });
    return res.json(property);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function list(req, res) {
  try {
    const properties = await listProperties(propertyScope(req.user));
    return res.json(properties);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function getById(req, res) {
  try {
    const { id } = req.params;
    const property = await getPropertyById(id, propertyScope(req.user));

    if (!property) return res.status(404).json({ message: 'Property not found' });
    return res.json(property);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

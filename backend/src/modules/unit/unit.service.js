import { prisma } from '../../db/prisma.js';

function propertyScope(user) {
  if (user?.role === 'AGENT') return { agentId: user.id };
  if (user?.role === 'ADMIN') return { createdById: user.id };
  return {};
}

export async function createUnit({ propertyId, number, type, rent, user }) {
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      ...propertyScope(user),
    },
  });

  if (!property) throw new Error('Property not found');
  if (user.role === 'AGENT') throw new Error('Agents cannot add units');

  return prisma.unit.create({
    data: { propertyId, unitCode: number, unitType: type, rent },
  });
}

export async function listUnits({ user } = {}) {
  return prisma.unit.findMany({
    where: { property: propertyScope(user) },
    include: { property: true, tenant: true, leases: { where: { isActive: true } }, waterReadings: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 1 } },
    orderBy: [{ propertyId: 'asc' }, { floor: 'asc' }, { unitCode: 'asc' }],
  });
}

export async function updateUnitStatus(unitId, status, user) {
  const unit = await prisma.unit.findFirst({
    where: { id: unitId, property: propertyScope(user) },
    include: { property: true },
  });

  if (!unit) throw new Error('Unit not found');

  return prisma.unit.update({ where: { id: unitId }, data: { status } });
}

export async function updateUnitConditions(
  unitId,
  {
    toiletCondition,
    sinkCondition,
    doorsCondition,
    cabinetsCondition,
    electricalAppliancesCondition,
    rent,
    user,
  }
) {
  const unit = await prisma.unit.findFirst({
    where: { id: unitId, property: propertyScope(user) },
    include: { property: true, tenant: true, leases: { where: { isActive: true } }, waterReadings: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 1 } },
  });

  if (!unit) throw new Error('Unit not found');

  const updateData = {};
  if (toiletCondition) updateData.toiletCondition = toiletCondition;
  if (sinkCondition) updateData.sinkCondition = sinkCondition;
  if (doorsCondition) updateData.doorsCondition = doorsCondition;
  if (cabinetsCondition) updateData.cabinetsCondition = cabinetsCondition;
  if (electricalAppliancesCondition) updateData.electricalAppliancesCondition = electricalAppliancesCondition;
  if (rent !== undefined) updateData.rent = rent;
  if (type) updateData.unitType = type;
  if (unit.tenant) updateData.status = 'OCCUPIED';

  return prisma.unit.update({
    where: { id: unitId },
    data: updateData,
    include: { tenant: true, property: true },
  });
}


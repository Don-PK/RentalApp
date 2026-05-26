import { prisma } from '../../db/prisma.js';
import { generateAllUnitData } from '../../utils/unitCodeGenerator.js';

export async function createProperty({ name, location, type, numberOfFloors, agentId, floors, createdById }) {
  if (!createdById) {
    throw new Error('createdById is required');
  }

  if (agentId) {
    const agent = await prisma.user.findFirst({ where: { id: agentId, role: 'AGENT', createdByAdminId: createdById } });
    if (!agent) {
      throw new Error('Assigned agent not found');
    }
  }

  const unitData = generateAllUnitData(floors);

  return prisma.property.create({
    data: {
      name,
      location,
      type,
      numberOfFloors,
      agentId,
      createdById,
      units: {
        createMany: {
          data: unitData.map(({ unitCode, floor, unitType, rent }) => ({
            unitCode,
            floor,
            unitType,
            rent,
            status: 'VACANT',
          })),
        },
      },
    },
    include: {
      units: {
        include: { tenant: true, leases: { where: { isActive: true } } },
        orderBy: [{ floor: 'asc' }, { unitCode: 'asc' }],
      },
      agent: true,
      createdBy: true,
    },
  });
}

export async function assignPropertyToAgent({ propertyId, agentId, createdById }) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, createdById },
  });

  if (!property) {
    throw new Error('Property not found');
  }

  const agent = await prisma.user.findFirst({ where: { id: agentId, role: 'AGENT', createdByAdminId: createdById } });
  if (!agent) {
    throw new Error('Agent not found');
  }

  return prisma.property.update({
    where: { id: propertyId },
    data: { agentId },
    include: {
      units: {
        include: { tenant: true, leases: { where: { isActive: true } } },
        orderBy: [{ floor: 'asc' }, { unitCode: 'asc' }],
      },
      agent: true,
      createdBy: true,
    },
  });
}

export async function listProperties({ agentId, createdById } = {}) {
  return prisma.property.findMany({
    where: {
      ...(agentId ? { agentId } : {}),
      ...(createdById ? { createdById } : {}),
    },
    include: {
      units: {
        include: { tenant: true, leases: { where: { isActive: true } } },
        orderBy: [{ floor: 'asc' }, { unitCode: 'asc' }],
      },
      agent: true,
      createdBy: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPropertyById(propertyId, { agentId, createdById } = {}) {
  return prisma.property.findFirst({
    where: {
      id: propertyId,
      ...(agentId ? { agentId } : {}),
      ...(createdById ? { createdById } : {}),
    },
    include: {
      units: {
        include: { tenant: true, leases: { where: { isActive: true } } },
        orderBy: [{ floor: 'asc' }, { unitCode: 'asc' }],
      },
      agent: true,
      createdBy: true,
    },
  });
}



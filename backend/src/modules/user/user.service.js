import crypto from 'crypto';
import { prisma } from '../../db/prisma.js';
import { hashPassword } from '../../utils/hash.js';

function buildResetLink(token) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${frontendUrl}/reset-password?token=${token}`;
}

function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

export async function listAgents({ adminId }) {
  return prisma.user.findMany({
    where: { role: 'AGENT', createdByAdminId: adminId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      mustChangePassword: true,
      assignedProperties: { select: { id: true, name: true, location: true } },
    },
  });
}

export async function deleteAgent(agentId, { adminId }) {
  const agent = await prisma.user.findFirst({
    where: { id: agentId, role: 'AGENT', createdByAdminId: adminId },
    include: { assignedProperties: true },
  });
  if (!agent) throw new Error('Agent not found');
  if (agent.assignedProperties.length > 0) throw new Error('Cannot delete agent with assigned properties. Please reassign properties first.');
  return prisma.user.delete({ where: { id: agentId } });
}

export async function createAgent({ name, email, password, phone, adminId }) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('Email already exists');
  const code = generateCode();
  const agent = await prisma.user.create({
    data: {
      name,
      email,
      password: await hashPassword(password),
      phone,
      role: 'AGENT',
      createdByAdminId: adminId,
      mustChangePassword: true,
      agentLoginCode: code,
      agentLoginCodeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  console.log(`One-time login code for ${agent.email}: ${code}`);
  return { id: agent.id, name: agent.name, email: agent.email, role: agent.role, oneTimeCode: code };
}

export async function sendAgentResetLink(agentId, { adminId }) {
  const agent = await prisma.user.findFirst({ where: { id: agentId, role: 'AGENT', createdByAdminId: adminId } });
  if (!agent) throw new Error('Agent not found');
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: agent.id },
    data: { resetToken: token, resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });
  const resetLink = buildResetLink(token);
  console.log(`Agent password reset link for ${agent.email}: ${resetLink}`);
  return { ok: true, resetLink };
}

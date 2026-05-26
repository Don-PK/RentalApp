import crypto from 'crypto';
import { prisma } from '../../db/prisma.js';
import { hashPassword, comparePassword } from '../../utils/hash.js';
import { signToken } from '../../utils/jwt.js';

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
}

function buildResetLink(token) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${frontendUrl}/reset-password?token=${token}`;
}

export async function registerUser({ name, email, password, role, phone }) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('Email already exists');

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: await hashPassword(password),
      phone,
      role: role ?? 'ADMIN',
    },
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return { user: publicUser(user), token };
}

export async function loginUser({ email, password, code }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid email or password');

  const isPasswordCorrect = await comparePassword(password, user.password);
  if (!isPasswordCorrect) throw new Error('Invalid email or password');

  if (user.role === 'AGENT' && user.mustChangePassword) {
    if (!code || code !== user.agentLoginCode || !user.agentLoginCodeExpiresAt || user.agentLoginCodeExpiresAt < new Date()) {
      throw new Error('Valid one-time authentication code is required');
    }
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return { user: publicUser(user), token, mustChangePassword: user.mustChangePassword };
}

export async function changeInitialPassword({ userId, password, confirmPassword }) {
  if (!password || !confirmPassword) throw new Error('password and confirmPassword are required');
  if (password !== confirmPassword) throw new Error('Passwords do not match');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      password: await hashPassword(password),
      mustChangePassword: false,
      agentLoginCode: null,
      agentLoginCodeExpiresAt: null,
    },
  });

  const token = signToken({ id: updated.id, email: updated.email, role: updated.role });
  return { user: publicUser(updated), token };
}

export async function forgotPassword({ email }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: true };

  if (user.role === 'AGENT') {
    throw new Error('Agent password resets must be initiated by an Admin');
  }

  const token = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const resetLink = buildResetLink(token);
  console.log(`Admin password reset link for ${user.email}: ${resetLink}`);
  return { ok: true, resetLink };
}

export async function resetPassword({ token, password, confirmPassword }) {
  if (!token) throw new Error('Reset token is required');
  if (!password || !confirmPassword) throw new Error('password and confirmPassword are required');
  if (password !== confirmPassword) throw new Error('Passwords do not match');

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiresAt: { gt: new Date() },
    },
  });

  if (!user) throw new Error('Invalid or expired reset link');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await hashPassword(password),
      resetToken: null,
      resetTokenExpiresAt: null,
      mustChangePassword: false,
      agentLoginCode: null,
      agentLoginCodeExpiresAt: null,
    },
  });

  return { ok: true };
}

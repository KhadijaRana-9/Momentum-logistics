import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from './env.ts';
import { collection } from './db.ts';
import { COLLECTIONS, permissionsForRole, type Permission, type UserDoc } from './models.ts';
import { forbidden, unauthorized } from './http.ts';

const COOKIE_NAME = 'ml_session';
const BCRYPT_ROUNDS = 12;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: Permission[];
}

interface JwtPayload {
  sub: string;
  name: string;
  email: string;
  role: string;
}

// --- password hashing ---------------------------------------------------------

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// --- JWT --------------------------------------------------------------------

export function signSession(user: UserDoc): string {
  const payload: JwtPayload = {
    sub: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] });
}

function decodeSession(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
}

// --- cookies ---------------------------------------------------------------

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export function setSessionCookie(res: VercelResponse, token: string): void {
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (env.isProd) parts.push('Secure');
  if (env.cookieDomain) parts.push(`Domain=${env.cookieDomain}`);
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res: VercelResponse): void {
  const parts = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (env.isProd) parts.push('Secure');
  if (env.cookieDomain) parts.push(`Domain=${env.cookieDomain}`);
  res.setHeader('Set-Cookie', parts.join('; '));
}

// --- session resolution --------------------------------------------------------

/**
 * Resolves the current staff session from the httpOnly cookie, then re-loads the
 * user from the database so a suspended/deleted account is rejected immediately
 * and role/permission changes take effect without waiting for token expiry.
 */
export async function getSession(req: VercelRequest): Promise<SessionUser | null> {
  const cookies = parseCookies(req.headers.cookie);
  const raw =
    cookies[COOKIE_NAME] ??
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined);
  if (!raw) return null;

  const payload = decodeSession(raw);
  if (!payload || !ObjectId.isValid(payload.sub)) return null;

  const users = await collection<UserDoc>(COLLECTIONS.users);
  const user = await users.findOne({ _id: new ObjectId(payload.sub) });
  if (!user || user.status === 'suspended') return null;

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions ?? permissionsForRole(user.role),
  };
}

export async function requireAuth(req: VercelRequest): Promise<SessionUser> {
  const session = await getSession(req);
  if (!session) throw unauthorized();
  return session;
}

export async function requirePermission(req: VercelRequest, permission: Permission): Promise<SessionUser> {
  const session = await requireAuth(req);
  if (!session.permissions.includes(permission)) {
    throw forbidden(`Missing permission: ${permission}`);
  }
  return session;
}

export function hasPermission(session: SessionUser, permission: Permission): boolean {
  return session.permissions.includes(permission);
}

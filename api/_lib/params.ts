import type { VercelRequest } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { badRequest } from './http.ts';

export function stringParam(req: VercelRequest, key: string): string | undefined {
  const v = req.query[key];
  if (Array.isArray(v)) return v[0];
  return typeof v === 'string' ? v : undefined;
}

export function objectIdParam(req: VercelRequest, key = 'id'): ObjectId {
  const raw = stringParam(req, key);
  if (!raw || !ObjectId.isValid(raw)) throw badRequest(`Invalid ${key}`);
  return new ObjectId(raw);
}

export function intParam(req: VercelRequest, key: string, fallback: number, opts: { min?: number; max?: number } = {}): number {
  const raw = stringParam(req, key);
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isNaN(n)) return fallback;
  let out = n;
  if (opts.min !== undefined) out = Math.max(opts.min, out);
  if (opts.max !== undefined) out = Math.min(opts.max, out);
  return out;
}

export function csvParam(req: VercelRequest, key: string): string[] {
  const raw = stringParam(req, key);
  return raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

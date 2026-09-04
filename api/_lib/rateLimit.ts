import type { VercelRequest } from '@vercel/node';
import { collection } from './db.ts';
import { COLLECTIONS } from './models.ts';
import { getClientIp, tooMany } from './http.ts';

interface RateLimitDoc {
  key: string;
  count: number;
  windowStart: Date;
  expiresAt: Date;
}

/**
 * Fixed-window rate limiter backed by MongoDB (works across serverless instances).
 * The TTL index on `expiresAt` cleans up stale windows automatically.
 */
export async function rateLimit(
  req: VercelRequest,
  opts: { name: string; limit: number; windowMs: number; by?: string },
): Promise<void> {
  const ip = getClientIp(req) ?? 'unknown';
  const bucket = opts.by ?? ip;
  const now = Date.now();
  const windowStart = new Date(now - (now % opts.windowMs));
  const key = `${opts.name}:${bucket}:${windowStart.getTime()}`;

  const col = await collection<RateLimitDoc>(COLLECTIONS.rateLimits);
  const res = await col.findOneAndUpdate(
    { key },
    {
      $inc: { count: 1 },
      $setOnInsert: {
        windowStart,
        expiresAt: new Date(windowStart.getTime() + opts.windowMs),
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  if ((res?.count ?? 1) > opts.limit) {
    throw tooMany();
  }
}

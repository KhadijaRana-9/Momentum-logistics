import type { VercelRequest, VercelResponse } from '@vercel/node';
import { env } from './env.js';

/**
 * Thin HTTP helpers shared by every serverless function:
 * error normalisation, method routing, safe JSON, security headers.
 */

export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, message: string, code = 'error', details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (msg: string, details?: unknown) => new HttpError(400, msg, 'bad_request', details);
export const unauthorized = (msg = 'Authentication required') => new HttpError(401, msg, 'unauthorized');
export const forbidden = (msg = 'You do not have permission to do that') => new HttpError(403, msg, 'forbidden');
export const notFound = (msg = 'Not found') => new HttpError(404, msg, 'not_found');
export const conflict = (msg: string) => new HttpError(409, msg, 'conflict');
export const tooMany = (msg = 'Too many requests. Please slow down.') => new HttpError(429, msg, 'rate_limited');

export function json(res: VercelResponse, status: number, body: unknown): void {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(body));
}

export function getClientIp(req: VercelRequest): string | undefined {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0]?.trim();
  if (Array.isArray(fwd)) return fwd[0];
  return req.socket?.remoteAddress ?? undefined;
}

/** Parses a JSON body defensively (Vercel usually pre-parses, but not always). */
export function readJsonBody<T = Record<string, unknown>>(req: VercelRequest): T {
  const b = req.body;
  if (b == null || b === '') return {} as T;
  if (typeof b === 'string') {
    try {
      return JSON.parse(b) as T;
    } catch {
      throw badRequest('Request body is not valid JSON');
    }
  }
  return b as T;
}

function applySecurityHeaders(req: VercelRequest, res: VercelResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store');

  const origin = req.headers.origin;
  if (origin && env.allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
}

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void;
type MethodMap = Partial<Record<'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', Handler>>;

/**
 * Wraps a per-method handler map with uniform error handling. Never leaks stack
 * traces or database errors to the client.
 */
export function route(methods: MethodMap): Handler {
  return async (req, res) => {
    applySecurityHeaders(req, res);

    if (req.method === 'OPTIONS') {
      res.setHeader('Allow', ['OPTIONS', ...Object.keys(methods)].join(', '));
      res.status(204).end();
      return;
    }

    const handler = methods[req.method as keyof MethodMap];
    if (!handler) {
      res.setHeader('Allow', Object.keys(methods).join(', '));
      json(res, 405, { error: `Method ${req.method} not allowed`, code: 'method_not_allowed' });
      return;
    }

    try {
      await handler(req, res);
    } catch (err) {
      if (err instanceof HttpError) {
        json(res, err.status, { error: err.message, code: err.code, details: err.details });
        return;
      }
      console.error('[api] unhandled error', err);
      json(res, 500, { error: 'Something went wrong on our side. Please try again.', code: 'internal_error' });
    }
  };
}

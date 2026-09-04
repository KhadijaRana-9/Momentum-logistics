import { badRequest } from './http.js';

/**
 * Minimal, dependency-free validation + sanitisation.
 * Every public endpoint runs untrusted input through a Schema before it touches
 * the database. Unknown keys are dropped (mass-assignment protection).
 */

export type FieldType = 'string' | 'email' | 'phone' | 'number' | 'boolean' | 'enum' | 'url' | 'stringArray';

export interface FieldRule {
  type: FieldType;
  required?: boolean;
  min?: number;
  max?: number;
  values?: readonly string[];
  /** Default applied when the field is absent/empty. */
  default?: unknown;
}

export type Schema = Record<string, FieldRule>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_RE = /^https?:\/\/[^\s]+$/i;
const CONTROL_CHARS_RE = /[\x00-\x1f\x7f]/g;

/** Collapses whitespace and strips control characters / angle brackets. */
export function sanitizeText(input: string): string {
  return input
    .replace(CONTROL_CHARS_RE, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Keeps a leading + and digits only; used purely for dedupe matching. */
export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  return plus + trimmed.replace(/\D/g, '');
}

export function isBusinessEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  const free = new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'aol.com',
    'icloud.com', 'proton.me', 'protonmail.com', 'gmx.com', 'mail.com', 'yandex.com',
    'ymail.com', 'rediffmail.com',
  ]);
  return domain.length > 0 && !free.has(domain);
}

export function validate<T = Record<string, unknown>>(schema: Schema, raw: unknown): T {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw badRequest('Expected a JSON object body');
  }
  const input = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const [key, rule] of Object.entries(schema)) {
    const value: unknown = input[key];

    const empty = value === undefined || value === null || value === '';
    if (empty) {
      if (rule.default !== undefined) out[key] = rule.default;
      else if (rule.required) errors[key] = 'This field is required';
      continue;
    }

    switch (rule.type) {
      case 'string':
      case 'email':
      case 'phone':
      case 'url': {
        if (typeof value !== 'string') { errors[key] = 'Must be text'; break; }
        const s = sanitizeText(value);
        if (rule.min && s.length < rule.min) errors[key] = `Must be at least ${rule.min} characters`;
        else if (rule.max && s.length > rule.max) errors[key] = `Must be at most ${rule.max} characters`;
        else if (rule.type === 'email' && !EMAIL_RE.test(s)) errors[key] = 'Enter a valid email address';
        else if (rule.type === 'url' && !URL_RE.test(s)) errors[key] = 'Enter a valid URL (https://…)';
        else if (rule.type === 'phone' && normalizePhone(s).replace('+', '').length < 7) errors[key] = 'Enter a valid phone number';
        else out[key] = s;
        break;
      }
      case 'number': {
        const n = typeof value === 'number' ? value : Number(value);
        if (Number.isNaN(n)) { errors[key] = 'Must be a number'; break; }
        if (rule.min !== undefined && n < rule.min) errors[key] = `Must be at least ${rule.min}`;
        else if (rule.max !== undefined && n > rule.max) errors[key] = `Must be at most ${rule.max}`;
        else out[key] = n;
        break;
      }
      case 'boolean': {
        out[key] = value === true || value === 'true' || value === 1;
        break;
      }
      case 'enum': {
        const s = typeof value === 'string' ? value.trim() : '';
        if (!rule.values || !rule.values.includes(s)) errors[key] = `Must be one of: ${rule.values?.join(', ')}`;
        else out[key] = s;
        break;
      }
      case 'stringArray': {
        const arr = Array.isArray(value) ? value : String(value).split(',');
        out[key] = arr
          .map((v) => sanitizeText(String(v)))
          .filter(Boolean)
          .slice(0, rule.max ?? 25);
        break;
      }
      default:
        break;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw badRequest('Some fields need your attention', errors);
  }
  return out as T;
}

import type { VercelRequest } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { collection } from './db.ts';
import { COLLECTIONS, type AuditLogDoc } from './models.ts';
import { getClientIp } from './http.ts';
import type { SessionUser } from './auth.ts';

interface AuditInput {
  actor: SessionUser | null;
  action: string;
  entity: string;
  entityId?: string;
  changes?: { field: string; from: unknown; to: unknown }[];
  meta?: Record<string, unknown>;
  req?: VercelRequest;
}

const SENSITIVE = /password|token|secret|apikey|api_key|authorization|hash/i;

function scrub(value: unknown): unknown {
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE.test(k) ? '[redacted]' : v;
    }
    return out;
  }
  return value;
}

/** Writes an immutable audit record. Best-effort — never blocks the business action. */
export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    const col = await collection<AuditLogDoc>(COLLECTIONS.auditLogs);
    await col.insertOne({
      actorId: input.actor ? new ObjectId(input.actor.id) : null,
      actorName: input.actor?.name ?? 'System',
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      changes: input.changes
        ?.filter((c) => !SENSITIVE.test(c.field))
        .map((c) => ({ field: c.field, from: scrub(c.from), to: scrub(c.to) })),
      meta: input.meta ? (scrub(input.meta) as Record<string, unknown>) : undefined,
      ip: input.req ? getClientIp(input.req) : undefined,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('[audit] write failed', err);
  }
}

/** Computes a field-level diff between two flat objects for audit `changes`. */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
): { field: string; from: unknown; to: unknown }[] {
  const changes: { field: string; from: unknown; to: unknown }[] = [];
  for (const [field, to] of Object.entries(after)) {
    const from = before[field];
    if (JSON.stringify(from) !== JSON.stringify(to)) changes.push({ field, from, to });
  }
  return changes;
}

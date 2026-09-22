import { ObjectId } from 'mongodb';
import { collection } from './db.js';
import { COLLECTIONS, type AlertDoc, type AlertSeverity, type Permission } from './models.js';

interface RaiseAlertInput {
  severity: AlertSeverity;
  module: string;
  title: string;
  description?: string;
  entityType?: string;
  entityRef?: string;
  /** Broadcast to everyone holding this permission (omit recipientId for a broadcast alert). */
  visibleToPermission?: Permission | null;
  /** A specific person (e.g. the RRR requester) instead of a broadcast. */
  recipientId?: string | ObjectId | null;
}

/** Writes a real, persisted, permission-scoped notification. Best-effort — never blocks the caller's action. */
export async function raiseAlert(input: RaiseAlertInput): Promise<void> {
  try {
    const col = await collection<AlertDoc>(COLLECTIONS.alerts);
    const doc: AlertDoc = {
      severity: input.severity,
      module: input.module,
      title: input.title,
      description: input.description,
      entityType: input.entityType,
      entityRef: input.entityRef,
      visibleToPermission: input.visibleToPermission ?? null,
      recipientId: input.recipientId ? new ObjectId(input.recipientId) : null,
      readBy: [],
      createdAt: new Date(),
    };
    await col.insertOne(doc);
  } catch (err) {
    console.error('[alerts] raiseAlert failed', err);
  }
}

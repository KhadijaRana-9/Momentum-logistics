import { ObjectId, type ClientSession } from 'mongodb';
import { collection } from './db.ts';
import { COLLECTIONS, type ActivityDoc, type ActivityType } from './models.ts';

interface LogActivityInput {
  leadId: ObjectId;
  type: ActivityType;
  title: string;
  detail?: string;
  meta?: Record<string, unknown>;
  actorId?: ObjectId | string | null;
  actorName?: string;
}

function toObjectId(id: ObjectId | string | null | undefined): ObjectId | null {
  if (!id) return null;
  return typeof id === 'string' ? (ObjectId.isValid(id) ? new ObjectId(id) : null) : id;
}

/**
 * Appends one event to a lead's timeline and bumps the lead's lastActivityAt.
 * Timeline writes never throw into the caller's happy path.
 */
export async function logActivity(input: LogActivityInput, session?: ClientSession): Promise<void> {
  const now = new Date();
  const doc: ActivityDoc = {
    leadId: input.leadId,
    type: input.type,
    title: input.title,
    detail: input.detail,
    meta: input.meta,
    actorId: toObjectId(input.actorId),
    actorName: input.actorName ?? 'System',
    createdAt: now,
  };

  const activities = await collection<ActivityDoc>(COLLECTIONS.activities);
  const leads = await collection(COLLECTIONS.leads);
  await activities.insertOne(doc, { session });
  await leads.updateOne({ _id: input.leadId }, { $set: { lastActivityAt: now, updatedAt: now } }, { session });
}

export async function listActivities(leadId: ObjectId, limit = 100): Promise<ActivityDoc[]> {
  const activities = await collection<ActivityDoc>(COLLECTIONS.activities);
  return activities.find({ leadId }).sort({ createdAt: -1 }).limit(limit).toArray();
}

export async function countActivities(leadId: ObjectId): Promise<number> {
  const activities = await collection<ActivityDoc>(COLLECTIONS.activities);
  return activities.countDocuments({ leadId });
}

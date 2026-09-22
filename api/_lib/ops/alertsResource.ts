import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId, type Filter } from 'mongodb';
import { collection } from '../db.js';
import { COLLECTIONS, type AlertDoc, type Permission } from '../models.js';
import { json, notFound } from '../http.js';
import { requireAuth } from '../auth.js';
import { intParam, stringParam } from '../params.js';

function serializeAlert(a: AlertDoc, viewerId: string) {
  return {
    id: String(a._id),
    severity: a.severity,
    module: a.module,
    title: a.title,
    description: a.description ?? null,
    entityType: a.entityType ?? null,
    entityRef: a.entityRef ?? null,
    read: a.readBy.some((id) => String(id) === viewerId),
    createdAt: a.createdAt,
  };
}

/**
 * A user sees an alert if it was addressed directly to them, or if it's a
 * broadcast (no recipient) and either open to everyone or gated by a
 * permission they actually hold — enforced here, not just hidden in the UI.
 * Read state is per-viewer (readBy), so a broadcast dismissed by one manager
 * still shows as unread for everyone else who can see it.
 */
export async function listAlerts(req: VercelRequest, res: VercelResponse) {
  const session = await requireAuth(req);
  const page = intParam(req, 'page', 1, { min: 1 });
  const limit = intParam(req, 'limit', 30, { min: 1, max: 100 });
  const unreadOnly = stringParam(req, 'unread') === 'true';

  const visiblePermissions: (Permission | null)[] = [null, ...session.permissions];
  const visibility: Filter<AlertDoc> = {
    $or: [
      { recipientId: new ObjectId(session.id) },
      { recipientId: null, visibleToPermission: { $in: visiblePermissions } },
    ],
  };
  // Applied as a real query condition (not a post-hoc JS filter) so `total`/`totalPages`
  // are correct when a caller asks for only-unread — e.g. the sidebar/header badge counts.
  const filter: Filter<AlertDoc> = unreadOnly
    ? { $and: [visibility, { readBy: { $ne: new ObjectId(session.id) } }] }
    : visibility;

  const col = await collection<AlertDoc>(COLLECTIONS.alerts);
  const [rawItems, total] = await Promise.all([
    col.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    col.countDocuments(filter),
  ]);
  const items = rawItems.map((a) => serializeAlert(a, session.id));
  const unreadOnPage = items.filter((a) => !a.read).length;

  json(res, 200, { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), unreadOnPage });
}

export async function markAlertRead(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  const session = await requireAuth(req);
  const col = await collection<AlertDoc>(COLLECTIONS.alerts);
  const alert = await col.findOne({ _id: id });
  if (!alert) throw notFound('Alert not found');

  // Authorization: only a direct recipient, or someone who actually holds the
  // gating permission of a broadcast, may mark it read — never trust the id alone.
  const isRecipient = alert.recipientId && String(alert.recipientId) === session.id;
  const canSeeBroadcast = !alert.recipientId && (!alert.visibleToPermission || session.permissions.includes(alert.visibleToPermission));
  if (!isRecipient && !canSeeBroadcast) throw notFound('Alert not found');

  await col.updateOne({ _id: id }, { $addToSet: { readBy: new ObjectId(session.id) } });
  const updated = (await col.findOne({ _id: id }))!;
  json(res, 200, { alert: serializeAlert(updated, session.id) });
}

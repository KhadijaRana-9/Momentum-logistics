import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { put, get as getBlob } from '@vercel/blob';
import { collection } from '../db.js';
import {
  COLLECTIONS, ATTACHMENT_PARENT_TYPES,
  type AttachmentDoc, type AttachmentParentType, type Permission,
  type RrrDoc, type ExpenseDoc, type FuelVoucherDoc,
} from '../models.js';
import { badRequest, forbidden, json, notFound } from '../http.js';
import { requireAuth } from '../auth.js';
import { validate } from '../validation.js';
import { stringParam } from '../params.js';
import { writeAudit } from '../audit.js';
import { env } from '../env.js';

const MAX_BYTES = 3 * 1024 * 1024; // 3MB raw — keeps the base64 JSON body well under Vercel's request size ceiling
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

function permissionsForParent(parentType: AttachmentParentType): { view: Permission; manage: Permission } {
  switch (parentType) {
    case 'rrr':
      return { view: 'rrr:view', manage: 'rrr:edit' };
    case 'expense':
    case 'fuel':
      return { view: 'finance:view', manage: 'finance:manage' };
  }
}

async function parentExists(parentType: AttachmentParentType, parentId: ObjectId): Promise<boolean> {
  if (parentType === 'rrr') return !!(await (await collection<RrrDoc>(COLLECTIONS.rrrs)).findOne({ _id: parentId }, { projection: { _id: 1 } }));
  if (parentType === 'expense') return !!(await (await collection<ExpenseDoc>(COLLECTIONS.expenses)).findOne({ _id: parentId }, { projection: { _id: 1 } }));
  return !!(await (await collection<FuelVoucherDoc>(COLLECTIONS.fuelVouchers)).findOne({ _id: parentId }, { projection: { _id: 1 } }));
}

function serializeAttachment(a: AttachmentDoc) {
  return {
    id: String(a._id),
    filename: a.filename,
    contentType: a.contentType,
    size: a.size,
    uploadedByName: a.uploadedByName,
    createdAt: a.createdAt,
  };
}

/** GET /api/ops?resource=attachments&parentType=rrr&parentId=<id> */
export async function listAttachments(req: VercelRequest, res: VercelResponse) {
  const session = await requireAuth(req);
  const parentType = stringParam(req, 'parentType') as AttachmentParentType | undefined;
  const parentId = stringParam(req, 'parentId');
  if (!parentType || !(ATTACHMENT_PARENT_TYPES as readonly string[]).includes(parentType)) throw badRequest('Invalid parentType');
  if (!parentId || !ObjectId.isValid(parentId)) throw badRequest('Invalid parentId');

  const perms = permissionsForParent(parentType);
  if (!session.permissions.includes(perms.view)) throw forbidden(`Missing permission: ${perms.view}`);

  const col = await collection<AttachmentDoc>(COLLECTIONS.attachments);
  const items = await col.find({ parentType, parentId: new ObjectId(parentId) }).sort({ createdAt: -1 }).limit(50).toArray();
  json(res, 200, { items: items.map(serializeAttachment) });
}

/** POST /api/ops?resource=attachments  { parentType, parentId, filename, contentType, data: base64 } */
export async function createAttachment(req: VercelRequest, res: VercelResponse) {
  const session = await requireAuth(req);
  if (!env.blobReadWriteToken) throw badRequest('File storage is not configured on this deployment');
  const body = validate<{ parentType: string; parentId: string; filename: string; contentType: string }>(
    {
      parentType: { type: 'enum', values: ATTACHMENT_PARENT_TYPES, required: true },
      parentId: { type: 'string', required: true, max: 40 },
      filename: { type: 'string', required: true, max: 200 },
      contentType: { type: 'string', required: true, max: 100 },
    },
    req.body,
  );
  const parentType = body.parentType as AttachmentParentType;
  if (!ObjectId.isValid(body.parentId)) throw badRequest('Invalid parentId');
  const parentId = new ObjectId(body.parentId);

  const perms = permissionsForParent(parentType);
  if (!session.permissions.includes(perms.manage)) throw forbidden(`Missing permission: ${perms.manage}`);
  if (!(await parentExists(parentType, parentId))) throw notFound(`${parentType} not found`);

  const raw = req.body as Record<string, unknown>;
  const data = typeof raw.data === 'string' ? raw.data : '';
  if (!data) throw badRequest('Missing file data');
  if (!ALLOWED_TYPES.has(body.contentType)) throw badRequest('Only PDF, JPG, PNG or WEBP files are accepted');

  let buffer: Buffer;
  try {
    buffer = Buffer.from(data.includes(',') ? data.slice(data.indexOf(',') + 1) : data, 'base64');
  } catch {
    throw badRequest('File data is not valid base64');
  }
  if (buffer.length === 0) throw badRequest('File is empty');
  if (buffer.length > MAX_BYTES) throw badRequest(`File is too large — max ${Math.floor(MAX_BYTES / 1024 / 1024)}MB`);

  const pathname = `${parentType}/${String(parentId)}/${Date.now()}-${body.filename.replace(/[^\w.\-]+/g, '_')}`;
  const result = await put(pathname, buffer, {
    access: 'private',
    token: env.blobReadWriteToken,
    contentType: body.contentType,
    addRandomSuffix: false,
  });

  const now = new Date();
  const doc: AttachmentDoc = {
    filename: body.filename,
    contentType: body.contentType,
    size: buffer.length,
    blobPathname: result.pathname,
    parentType,
    parentId,
    uploadedBy: new ObjectId(session.id),
    uploadedByName: session.name,
    createdAt: now,
  };
  const col = await collection<AttachmentDoc>(COLLECTIONS.attachments);
  const inserted = await col.insertOne(doc);

  await writeAudit({ actor: session, action: 'attachment.uploaded', entity: parentType, entityId: body.parentId, meta: { filename: body.filename, size: buffer.length }, req });

  json(res, 201, { attachment: serializeAttachment({ ...doc, _id: inserted.insertedId }) });
}

/** GET /api/ops/:id?resource=attachments&action=download — streams the file back; never exposes the raw Blob URL. */
export async function downloadAttachment(req: VercelRequest, res: VercelResponse, id: ObjectId) {
  const session = await requireAuth(req);
  if (!env.blobReadWriteToken) throw notFound('File storage is not configured on this deployment');
  const col = await collection<AttachmentDoc>(COLLECTIONS.attachments);
  const attachment = await col.findOne({ _id: id });
  if (!attachment) throw notFound('Attachment not found');

  const perms = permissionsForParent(attachment.parentType);
  if (!session.permissions.includes(perms.view)) throw forbidden(`Missing permission: ${perms.view}`);

  const blob = await getBlob(attachment.blobPathname, { access: 'private', token: env.blobReadWriteToken });
  if (!blob || blob.statusCode !== 200) throw notFound('File is no longer available');

  res.status(200);
  res.setHeader('Content-Type', attachment.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename.replace(/"/g, '')}"`);
  res.setHeader('Content-Length', String(attachment.size));
  const reader = blob.stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(value);
  }
  res.end();
}

import { ObjectId, type Filter, type Sort } from 'mongodb';
import { collection } from '../_lib/db.ts';
import {
  COLLECTIONS,
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  LEAD_TEMPERATURES,
  PRODUCTS,
  SERVICE_TYPES,
  type LeadDoc,
} from '../_lib/models.ts';
import { json, route } from '../_lib/http.ts';
import { requirePermission } from '../_lib/auth.ts';
import { validate } from '../_lib/validation.ts';
import { csvParam, intParam, stringParam } from '../_lib/params.ts';
import { buildAttribution } from '../_lib/attribution.ts';
import { captureLead, serializeLead } from '../_lib/leadService.ts';
import { writeAudit } from '../_lib/audit.ts';

const SORTABLE: Record<string, keyof LeadDoc> = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  score: 'score',
  lastActivityAt: 'lastActivityAt',
  name: 'name',
  status: 'status',
};

export default route({
  // ---- List / search / filter / sort / paginate ----------------------------
  GET: async (req, res) => {
    const session = await requirePermission(req, 'leads:view');

    const page = intParam(req, 'page', 1, { min: 1 });
    const limit = intParam(req, 'limit', 25, { min: 1, max: 100 });
    const search = stringParam(req, 'q')?.trim();
    const sortKey = stringParam(req, 'sort') ?? 'createdAt';
    const sortDir = stringParam(req, 'dir') === 'asc' ? 1 : -1;

    const filter: Filter<LeadDoc> = { archived: { $ne: true } };
    if (stringParam(req, 'archived') === 'true') filter.archived = true;

    const statuses = csvParam(req, 'status').filter((s) => (LEAD_STATUSES as readonly string[]).includes(s));
    if (statuses.length) filter.status = { $in: statuses as LeadDoc['status'][] };

    const temps = csvParam(req, 'temperature').filter((t) => (LEAD_TEMPERATURES as readonly string[]).includes(t));
    if (temps.length) filter.temperature = { $in: temps as LeadDoc['temperature'][] };

    const products = csvParam(req, 'product').filter((p) => (PRODUCTS as readonly string[]).includes(p));
    if (products.length) filter.productInterest = { $in: products as LeadDoc['productInterest'][] };

    const sources = csvParam(req, 'source').filter((s) => (LEAD_SOURCES as readonly string[]).includes(s));
    if (sources.length) filter['attribution.source'] = { $in: sources };

    const industries = csvParam(req, 'industry');
    if (industries.length) filter.industry = { $in: industries };

    const tags = csvParam(req, 'tag');
    if (tags.length) filter.tags = { $all: tags };

    const assigned = stringParam(req, 'assignedTo');
    if (assigned === 'me') filter.assignedTo = new ObjectId(session.id);
    else if (assigned === 'unassigned') filter.assignedTo = null;
    else if (assigned && ObjectId.isValid(assigned)) filter.assignedTo = new ObjectId(assigned);

    if (search) filter.$text = { $search: search };

    const leads = await collection<LeadDoc>(COLLECTIONS.leads);
    const sort: Sort = search
      ? { relevance: { $meta: 'textScore' } }
      : { [SORTABLE[sortKey] ?? 'createdAt']: sortDir };

    const [items, total] = await Promise.all([
      leads
        .find(filter, search ? { projection: { relevance: { $meta: 'textScore' } } } : undefined)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      leads.countDocuments(filter),
    ]);

    json(res, 200, {
      items: items.map(serializeLead),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  },

  // ---- Manual lead creation by staff --------------------------------------
  POST: async (req, res) => {
    const session = await requirePermission(req, 'leads:create');

    const body = validate<Record<string, string>>(
      {
        name: { type: 'string', required: true, min: 2, max: 80 },
        email: { type: 'email' },
        phone: { type: 'phone', max: 40 },
        company: { type: 'string', max: 120 },
        jobTitle: { type: 'string', max: 80 },
        industry: { type: 'string', max: 80 },
        companySize: { type: 'string', max: 40 },
        product: { type: 'enum', values: PRODUCTS, default: 'Unspecified' },
        serviceType: { type: 'enum', values: SERVICE_TYPES, default: 'General' },
        budget: { type: 'string', max: 60 },
        timeline: { type: 'string', max: 60 },
        requirements: { type: 'string', max: 3000 },
        priority: { type: 'enum', values: LEAD_PRIORITIES, default: 'Medium' },
      },
      req.body,
    );

    if (!body.email && !body.phone) {
      json(res, 400, { error: 'Provide at least an email or phone number', code: 'bad_request' });
      return;
    }

    const attribution = buildAttribution(req, { source: 'Import' });
    const { lead, created } = await captureLead(
      {
        name: body.name,
        email: body.email,
        phone: body.phone,
        company: body.company,
        companySize: body.companySize,
        industry: body.industry,
        jobTitle: body.jobTitle,
        productInterest: body.product as LeadDoc['productInterest'],
        serviceType: body.serviceType as LeadDoc['serviceType'],
        budget: body.budget,
        timeline: body.timeline,
        requirements: body.requirements,
        attribution,
      },
      { type: 'contact', payload: { ...body, enteredBy: session.name } },
    );

    if (created && body.priority && body.priority !== 'Medium') {
      const leads = await collection<LeadDoc>(COLLECTIONS.leads);
      await leads.updateOne({ _id: lead._id }, { $set: { priority: body.priority as LeadDoc['priority'] } });
      lead.priority = body.priority as LeadDoc['priority'];
    }

    await writeAudit({
      actor: session,
      action: created ? 'lead.created' : 'lead.enriched',
      entity: 'lead',
      entityId: lead.ref,
      req,
      meta: { manual: true },
    });

    json(res, created ? 201 : 200, { lead: serializeLead(lead), deduplicated: !created });
  },
});

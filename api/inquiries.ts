import { route, json, getClientIp, badRequest } from './_lib/http.js';
import { validate } from './_lib/validation.js';
import { rateLimit } from './_lib/rateLimit.js';
import { buildAttribution } from './_lib/attribution.js';
import { captureLead } from './_lib/leadService.js';
import {
  PRODUCTS,
  SUBMISSION_TYPES,
  type ProductInterest,
  type ServiceType,
  type SubmissionType,
} from './_lib/models.js';
import { email as emailService, demoConfirmationEmail } from './_lib/email.js';

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];
const TIMELINES = ['Immediately', 'This quarter', '1-3 months', '3-6 months', '6+ months', 'Just researching'];

/**
 * Public multi-purpose inquiry endpoint: demo request, contact form, software
 * consultation, FBR invoicing inquiry, Cloud & AI inquiry, quote request. All
 * feed the same central lead system — no isolated tables. (demo_request used
 * to be its own /api/demo-requests function; folded in here to stay under
 * Vercel's Hobby-plan limit of 12 serverless functions.)
 */
const TYPE_TO_PRODUCT: Partial<Record<SubmissionType, ProductInterest>> = {
  erp_demo: 'ERP Suite',
  fbr_inquiry: 'FBR Invoicing',
  cloud_ai_inquiry: 'Cloud & AI',
  software_consultation: 'Custom Software',
};

const TYPE_TO_SERVICE: Partial<Record<SubmissionType, ServiceType>> = {
  contact: 'General',
  quote_request: 'Quote',
  software_consultation: 'Consultation',
  fbr_inquiry: 'Consultation',
  cloud_ai_inquiry: 'Consultation',
  erp_demo: 'Demo',
  demo_request: 'Demo',
};

export default route({
  POST: async (req, res) => {
    await rateLimit(req, { name: 'inquiry', limit: 8, windowMs: 10 * 60_000 });

    const body = validate<Record<string, string>>(
      {
        type: { type: 'enum', values: SUBMISSION_TYPES, required: true },
        name: { type: 'string', required: true, min: 2, max: 80 },
        email: { type: 'email', required: true },
        phone: { type: 'phone', max: 40 },
        company: { type: 'string', max: 120 },
        jobTitle: { type: 'string', max: 80 },
        industry: { type: 'string', max: 80 },
        businessType: { type: 'string', max: 80 },
        companySize: { type: 'enum', values: COMPANY_SIZES },
        product: { type: 'enum', values: PRODUCTS },
        timeline: { type: 'enum', values: TIMELINES },
        budget: { type: 'string', max: 60 },
        message: { type: 'string', max: 3000 },
        requirements: { type: 'string', max: 2000 },
        businessProblem: { type: 'string', max: 3000 },
        requiredSolution: { type: 'string', max: 2000 },
        currentSystem: { type: 'string', max: 200 },
        fbrRequirements: { type: 'string', max: 2000 },
        usersOrBranches: { type: 'string', max: 120 },
        preferredDate: { type: 'string', max: 60 },
        source: { type: 'string', max: 60 },
        utmSource: { type: 'string', max: 120 },
        utmMedium: { type: 'string', max: 120 },
        utmCampaign: { type: 'string', max: 160 },
        utmTerm: { type: 'string', max: 160 },
        utmContent: { type: 'string', max: 160 },
        landingPage: { type: 'string', max: 300 },
        referrer: { type: 'string', max: 300 },
        gclid: { type: 'string', max: 200 },
        fbclid: { type: 'string', max: 200 },
        website_url: { type: 'string', max: 200 },
      },
      req.body,
    );

    if (body.website_url) {
      json(res, 202, { ok: true, ref: null, deduplicated: false });
      return;
    }

    const type = body.type as SubmissionType;
    if (type === 'chatbot' || type === 'webinar_registration' || type === 'newsletter') {
      throw badRequest('Use the dedicated endpoint for this submission type');
    }

    const attribution = buildAttribution(req, body);
    const product =
      (body.product as ProductInterest) || TYPE_TO_PRODUCT[type] || 'Unspecified';
    const serviceType = TYPE_TO_SERVICE[type] ?? 'General';

    const requirements = [
      body.message,
      body.requirements,
      body.businessProblem && `Business problem: ${body.businessProblem}`,
      body.requiredSolution && `Required solution: ${body.requiredSolution}`,
      body.currentSystem && `Current system: ${body.currentSystem}`,
      body.fbrRequirements && `FBR requirements: ${body.fbrRequirements}`,
      body.usersOrBranches && `Users/branches: ${body.usersOrBranches}`,
      body.businessType && `Business type: ${body.businessType}`,
      body.preferredDate && `Preferred date: ${body.preferredDate}`,
    ]
      .filter(Boolean)
      .join('\n');

    const { lead, created } = await captureLead(
      {
        name: body.name,
        email: body.email,
        phone: body.phone,
        company: body.company,
        companySize: body.companySize,
        industry: body.industry,
        jobTitle: body.jobTitle,
        productInterest: product,
        serviceType,
        budget: body.budget,
        timeline: body.timeline,
        requirements,
        campaign: attribution.campaign,
        attribution,
      },
      {
        type,
        payload: body,
        ip: getClientIp(req),
        userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
      },
    );

    let emailConfirmation: string | undefined;
    if (type === 'demo_request') {
      const confirmation = await emailService.send({
        to: body.email,
        subject: 'We received your demo request — Momentum Logistics',
        html: demoConfirmationEmail(body.name, product === 'Unspecified' ? 'product' : product),
        replyTo: emailService.salesInbox,
      });
      emailConfirmation = confirmation.status;
    }

    json(res, created ? 201 : 200, {
      ok: true,
      ref: lead.ref,
      deduplicated: !created,
      ...(emailConfirmation ? { emailConfirmation } : {}),
    });
  },
});

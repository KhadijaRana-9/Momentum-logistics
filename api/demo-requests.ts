import { route, json, getClientIp } from './_lib/http.js';
import { validate } from './_lib/validation.js';
import { rateLimit } from './_lib/rateLimit.js';
import { buildAttribution } from './_lib/attribution.js';
import { captureLead } from './_lib/leadService.js';
import { PRODUCTS, type ProductInterest } from './_lib/models.js';
import { email as emailService, demoConfirmationEmail } from './_lib/email.js';

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];
const TIMELINES = ['Immediately', 'This quarter', '1-3 months', '3-6 months', '6+ months', 'Just researching'];

/**
 * Public "Request a Demo" endpoint.
 * Validates -> stores raw submission -> creates/updates the lead -> scores it ->
 * records activity -> best-effort confirmation email. Email failure never fails
 * the request; the lead is always persisted.
 */
export default route({
  POST: async (req, res) => {
    await rateLimit(req, { name: 'demo-request', limit: 6, windowMs: 10 * 60_000 });

    const body = validate<Record<string, string>>(
      {
        name: { type: 'string', required: true, min: 2, max: 80 },
        email: { type: 'email', required: true },
        phone: { type: 'phone', max: 40 },
        company: { type: 'string', max: 120 },
        jobTitle: { type: 'string', max: 80 },
        industry: { type: 'string', max: 80 },
        companySize: { type: 'enum', values: COMPANY_SIZES },
        product: { type: 'enum', values: PRODUCTS },
        timeline: { type: 'enum', values: TIMELINES },
        budget: { type: 'string', max: 60 },
        requirements: { type: 'string', max: 2000 },
        preferredDate: { type: 'string', max: 60 },
        // attribution (all optional)
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
        // honeypot
        website_url: { type: 'string', max: 200 },
      },
      req.body,
    );

    // Honeypot: silently accept but do nothing.
    if (body.website_url) {
      json(res, 202, { ok: true, ref: null, deduplicated: false });
      return;
    }

    const attribution = buildAttribution(req, body);
    const product = (body.product as ProductInterest) || 'Unspecified';

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
        serviceType: 'Demo',
        budget: body.budget,
        timeline: body.timeline,
        requirements: [body.requirements, body.preferredDate && `Preferred date: ${body.preferredDate}`]
          .filter(Boolean)
          .join('\n'),
        campaign: attribution.campaign,
        attribution,
      },
      {
        type: 'demo_request',
        payload: body,
        ip: getClientIp(req),
        userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
      },
    );

    const confirmation = await emailService.send({
      to: body.email,
      subject: 'We received your demo request — Momentum Logistics',
      html: demoConfirmationEmail(body.name, product === 'Unspecified' ? 'product' : product),
      replyTo: emailService.salesInbox,
    });

    json(res, created ? 201 : 200, {
      ok: true,
      ref: lead.ref,
      deduplicated: !created,
      emailConfirmation: confirmation.status,
      lead: { ref: lead.ref, temperature: lead.temperature },
    });
  },
});

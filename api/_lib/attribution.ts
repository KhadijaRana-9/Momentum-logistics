import type { VercelRequest } from '@vercel/node';
import { LEAD_SOURCES, type Attribution, type LeadSource } from './models.ts';
import { sanitizeText } from './validation.ts';

/**
 * Normalises marketing attribution from a client-supplied payload + request
 * headers into a stable Attribution object. Only non-PII fields are kept.
 */

const SOURCE_ALIASES: Record<string, LeadSource> = {
  google: 'Organic Search',
  organic: 'Organic Search',
  'google-ads': 'Google Ads',
  googleads: 'Google Ads',
  adwords: 'Google Ads',
  cpc: 'Google Ads',
  ppc: 'Google Ads',
  facebook: 'Facebook',
  fb: 'Facebook',
  meta: 'Facebook',
  instagram: 'Instagram',
  ig: 'Instagram',
  linkedin: 'LinkedIn',
  twitter: 'X/Twitter',
  x: 'X/Twitter',
  direct: 'Direct',
  referral: 'Referral',
  website: 'Website',
  'landing-page': 'Landing Page',
  landing: 'Landing Page',
  chatbot: 'Chatbot',
  webinar: 'Webinar',
};

function classifySource(input: {
  utmSource?: string;
  utmMedium?: string;
  referrer?: string;
  gclid?: string;
  fbclid?: string;
  explicit?: string;
}): LeadSource {
  if (input.explicit && (LEAD_SOURCES as readonly string[]).includes(input.explicit)) {
    return input.explicit as LeadSource;
  }
  if (input.gclid) return 'Google Ads';
  if (input.fbclid) return 'Facebook';

  const utm = (input.utmSource ?? '').toLowerCase().trim();
  if (utm && SOURCE_ALIASES[utm]) return SOURCE_ALIASES[utm];

  const medium = (input.utmMedium ?? '').toLowerCase().trim();
  if (medium && SOURCE_ALIASES[medium]) return SOURCE_ALIASES[medium];

  const ref = (input.referrer ?? '').toLowerCase();
  if (!ref) return utm ? 'Website' : 'Direct';
  if (ref.includes('google.')) return utm.includes('cpc') ? 'Google Ads' : 'Organic Search';
  if (ref.includes('bing.') || ref.includes('duckduckgo') || ref.includes('yahoo.')) return 'Organic Search';
  if (ref.includes('facebook.')) return 'Facebook';
  if (ref.includes('instagram.')) return 'Instagram';
  if (ref.includes('linkedin.')) return 'LinkedIn';
  if (ref.includes('t.co') || ref.includes('twitter.') || ref.includes('x.com')) return 'X/Twitter';
  return 'Referral';
}

export function buildAttribution(
  req: VercelRequest,
  payload: Record<string, unknown> = {},
): Attribution {
  const str = (k: string): string | undefined => {
    const v = payload[k];
    return typeof v === 'string' && v.trim() ? sanitizeText(v).slice(0, 300) : undefined;
  };

  const referrer = str('referrer') ?? (typeof req.headers.referer === 'string' ? req.headers.referer : undefined);
  const gclid = str('gclid');
  const fbclid = str('fbclid');

  const lastTouch = classifySource({
    utmSource: str('utmSource'),
    utmMedium: str('utmMedium'),
    referrer,
    gclid,
    fbclid,
    explicit: str('source'),
  });

  const firstTouch = classifySource({
    utmSource: str('firstUtmSource') ?? str('utmSource'),
    utmMedium: str('firstUtmMedium') ?? str('utmMedium'),
    referrer: str('firstReferrer') ?? referrer,
    explicit: str('firstTouchSource'),
  });

  return {
    source: lastTouch,
    medium: str('utmMedium'),
    campaign: str('utmCampaign') ?? str('campaign'),
    term: str('utmTerm'),
    content: str('utmContent'),
    landingPage: str('landingPage') ?? str('path'),
    referrer,
    firstTouchSource: firstTouch,
    lastTouchSource: lastTouch,
    gclid,
    fbclid,
  };
}

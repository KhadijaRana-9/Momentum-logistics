/**
 * Client-side marketing attribution capture.
 *
 * - First-touch UTM/referrer is stored once in localStorage and never overwritten.
 * - Last-touch is refreshed whenever the visitor lands with new campaign params.
 * - A stable anonymous id is generated for analytics (no PII, no fingerprinting).
 *
 * The resulting object is attached to every form submission and analytics event
 * so the backend can resolve source / campaign / landing page.
 */

const FIRST_TOUCH_KEY = 'ml_attr_first';
const LAST_TOUCH_KEY = 'ml_attr_last';
const ANON_KEY = 'ml_anon_id';

export interface AttributionPayload {
  anonymousId: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landingPage?: string;
  firstUtmSource?: string;
  firstUtmMedium?: string;
  firstReferrer?: string;
  firstTouchSource?: string;
}

interface TouchRecord {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landingPage?: string;
  at: string;
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode / storage disabled — attribution degrades to last-touch only */
  }
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getAnonymousId(): string {
  let id = safeGet(ANON_KEY);
  if (!id) {
    id = uuid();
    safeSet(ANON_KEY, id);
  }
  return id;
}

function readTouchFromUrl(): TouchRecord {
  const params = new URLSearchParams(window.location.search);
  const get = (k: string) => params.get(k) || undefined;
  return {
    utmSource: get('utm_source'),
    utmMedium: get('utm_medium'),
    utmCampaign: get('utm_campaign'),
    utmTerm: get('utm_term'),
    utmContent: get('utm_content'),
    gclid: get('gclid'),
    fbclid: get('fbclid'),
    referrer: document.referrer || undefined,
    landingPage: window.location.pathname + window.location.search,
    at: new Date().toISOString(),
  };
}

function hasCampaignSignal(t: TouchRecord): boolean {
  return Boolean(t.utmSource || t.utmMedium || t.utmCampaign || t.gclid || t.fbclid);
}

/** Call once on app start. Records first-touch (if absent) and refreshes last-touch. */
export function initAttribution(): void {
  if (typeof window === 'undefined') return;
  getAnonymousId();
  const current = readTouchFromUrl();

  if (!safeGet(FIRST_TOUCH_KEY)) {
    safeSet(FIRST_TOUCH_KEY, JSON.stringify(current));
  }
  const existingLast = safeGet(LAST_TOUCH_KEY);
  if (!existingLast || hasCampaignSignal(current)) {
    safeSet(LAST_TOUCH_KEY, JSON.stringify(current));
  }
}

export function getAttribution(): AttributionPayload {
  const first = parse(safeGet(FIRST_TOUCH_KEY));
  const last = parse(safeGet(LAST_TOUCH_KEY)) ?? (typeof window !== 'undefined' ? readTouchFromUrl() : undefined);

  return {
    anonymousId: getAnonymousId(),
    utmSource: last?.utmSource,
    utmMedium: last?.utmMedium,
    utmCampaign: last?.utmCampaign,
    utmTerm: last?.utmTerm,
    utmContent: last?.utmContent,
    gclid: last?.gclid,
    fbclid: last?.fbclid,
    referrer: last?.referrer,
    landingPage: last?.landingPage,
    firstUtmSource: first?.utmSource,
    firstUtmMedium: first?.utmMedium,
    firstReferrer: first?.referrer,
  };
}

function parse(raw: string | null): TouchRecord | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as TouchRecord;
  } catch {
    return undefined;
  }
}

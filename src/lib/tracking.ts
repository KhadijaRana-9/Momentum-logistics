import { config } from './config';
import { api } from './apiClient';
import { getAttribution } from './attribution';

/**
 * Centralised tracking. Every meaningful business event goes through `track()`.
 *
 * - Always: sent to our own /api/analytics/events (first-party, no consent needed
 *   for aggregate, no PII).
 * - Optionally: forwarded to GA4 / Google Ads / Meta Pixel, but ONLY when
 *   config.tracking.enabled is true and the relevant ID is configured. Scripts
 *   are injected lazily here — never scattered across components.
 */

type EventName =
  | 'page_view'
  | 'product_view'
  | 'cta_click'
  | 'demo_request'
  | 'quote_request'
  | 'contact_submit'
  | 'consultation_request'
  | 'chatbot_started'
  | 'chatbot_completed'
  | 'lead_created'
  | 'demo_scheduled'
  | 'conversion'
  | 'webinar_registered';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };
    _fbq?: unknown;
  }
}

let initialised = false;
let queue: { event: EventName; props?: Record<string, unknown> }[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function initTracking(): void {
  if (initialised || typeof window === 'undefined') return;
  initialised = true;

  if (!config.tracking.enabled) return;

  if (config.tracking.ga4Id) loadGa4(config.tracking.ga4Id, config.tracking.googleAdsId);
  if (config.tracking.metaPixelId) loadMetaPixel(config.tracking.metaPixelId);
}

function loadScript(src: string, attrs: Record<string, string> = {}): void {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
  document.head.appendChild(s);
}

function loadGa4(ga4Id: string, adsId?: string): void {
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', ga4Id, { anonymize_ip: true });
  if (adsId) window.gtag('config', adsId);
}

function loadMetaPixel(pixelId: string): void {
  /* Standard Meta Pixel bootstrap, guarded behind config.tracking.enabled. */
  const queue: unknown[] = [];
  const fbq = ((...args: unknown[]) => {
    queue.push(args);
  }) as NonNullable<Window['fbq']>;
  fbq.queue = queue;
  fbq.loaded = true;
  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;
  loadScript('https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', pixelId);
  fbq('track', 'PageView');
}

const THIRD_PARTY_MAP: Partial<Record<EventName, { ga?: string; fb?: string }>> = {
  demo_request: { ga: 'generate_lead', fb: 'Lead' },
  quote_request: { ga: 'generate_lead', fb: 'Lead' },
  consultation_request: { ga: 'generate_lead', fb: 'Lead' },
  contact_submit: { ga: 'contact', fb: 'Contact' },
  lead_created: { ga: 'generate_lead', fb: 'Lead' },
  conversion: { ga: 'conversion' },
  webinar_registered: { ga: 'sign_up', fb: 'CompleteRegistration' },
};

export function track(event: EventName, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  queue.push({ event, props });
  scheduleFlush();

  if (!config.tracking.enabled) return;

  const mapping = THIRD_PARTY_MAP[event];
  if (window.gtag && mapping?.ga) {
    window.gtag('event', mapping.ga, props ?? {});
    if (event === 'demo_request' && config.tracking.googleAdsId && config.tracking.googleAdsDemoLabel) {
      window.gtag('event', 'conversion', {
        send_to: `${config.tracking.googleAdsId}/${config.tracking.googleAdsDemoLabel}`,
      });
    }
  }
  if (window.fbq && mapping?.fb) {
    window.fbq('track', mapping.fb, props ?? {});
  }
}

export function trackPageView(path: string): void {
  track('page_view', { path });
  if (config.tracking.enabled && window.gtag && config.tracking.ga4Id) {
    window.gtag('event', 'page_view', { page_path: path });
  }
  if (config.tracking.enabled && window.fbq) {
    window.fbq('track', 'PageView');
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, 2000);
}

async function flush(): Promise<void> {
  flushTimer = null;
  if (queue.length === 0) return;
  const batch = queue.slice(0, 20);
  queue = queue.slice(20);

  const attr = getAttribution();
  try {
    await api.post('/analytics/events', {
      events: batch.map((e) => ({
        event: e.event,
        anonymousId: attr.anonymousId,
        path: (e.props?.path as string) ?? window.location.pathname,
        props: e.props,
        attribution: {
          source: attr.utmSource,
          medium: attr.utmMedium,
          campaign: attr.utmCampaign,
          landingPage: attr.landingPage,
        },
      })),
    });
  } catch {
    /* analytics is best-effort; drop the batch on failure */
  }
  if (queue.length > 0) scheduleFlush();
}

// Flush pending events when the tab is hidden/closed.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
}

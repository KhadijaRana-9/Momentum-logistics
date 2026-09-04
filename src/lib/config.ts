/**
 * Public runtime configuration.
 *
 * Only VITE_-prefixed variables are exposed to the browser by Vite. These are
 * non-secret identifiers (analytics/pixel IDs, the API base path). Server
 * secrets (Mongo URI, JWT secret, email/AI keys) never appear here.
 */

const env = import.meta.env;

export const config = {
  apiBase: (env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') || '/api',
  siteUrl: (env.VITE_SITE_URL as string | undefined) || 'https://momentum-logistics.vercel.app',
  companyName: 'Momentum Logistics',

  tracking: {
    ga4Id: (env.VITE_GA4_ID as string | undefined) || '',
    googleAdsId: (env.VITE_GOOGLE_ADS_ID as string | undefined) || '',
    googleAdsDemoLabel: (env.VITE_GOOGLE_ADS_DEMO_LABEL as string | undefined) || '',
    metaPixelId: (env.VITE_META_PIXEL_ID as string | undefined) || '',
    /** Master switch — tracking scripts only load when true AND an ID is present. */
    enabled: env.VITE_TRACKING_ENABLED === 'true',
  },

  chatbot: {
    /** The chatbot UI renders always; live AI replies require the server to be configured. */
    enabled: env.VITE_CHATBOT_ENABLED !== 'false',
  },
} as const;

export type AppConfig = typeof config;

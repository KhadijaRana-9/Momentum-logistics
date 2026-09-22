/**
 * Central access point for server-side environment variables.
 * Nothing here is ever sent to the browser. Missing values degrade gracefully
 * (features that need them report "not configured") rather than crashing boot.
 */

function opt(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== '' ? v.trim() : undefined;
}

function req(name: string): string {
  const v = opt(name);
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

export const env = {
  get mongoUri(): string {
    return req('MONGODB_URI');
  },
  get mongoDbName(): string {
    return opt('MONGODB_DB') ?? 'momentum';
  },
  get jwtSecret(): string {
    return req('AUTH_JWT_SECRET');
  },
  get jwtExpiresIn(): string {
    return opt('AUTH_JWT_EXPIRES_IN') ?? '7d';
  },
  get cookieDomain(): string | undefined {
    return opt('AUTH_COOKIE_DOMAIN');
  },
  get seedSecret(): string | undefined {
    return opt('SEED_SECRET');
  },
  /** Auto-populated by Vercel once a Blob store is linked to the project. */
  get blobReadWriteToken(): string | undefined {
    return opt('BLOB_READ_WRITE_TOKEN');
  },
  get isProd(): boolean {
    return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
  },
  /** Comma-separated list of extra origins allowed to call the API (rarely needed; same-origin by default). */
  get allowedOrigins(): string[] {
    return (opt('API_ALLOWED_ORIGINS') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  },
  // --- Email (optional) ---
  email: {
    get provider(): string | undefined {
      return opt('EMAIL_PROVIDER');
    },
    get apiKey(): string | undefined {
      return opt('EMAIL_API_KEY');
    },
    get from(): string | undefined {
      return opt('EMAIL_FROM');
    },
    get salesInbox(): string | undefined {
      return opt('SALES_NOTIFICATION_EMAIL');
    },
  },
  // --- AI chatbot (optional) ---
  ai: {
    get provider(): string | undefined {
      return opt('AI_PROVIDER');
    },
    get apiKey(): string | undefined {
      return opt('AI_API_KEY');
    },
    get model(): string | undefined {
      return opt('AI_MODEL');
    },
  },
};

export { opt as optionalEnv, req as requiredEnv };

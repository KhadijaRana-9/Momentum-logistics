import { env } from './env.js';

/**
 * Email service abstraction.
 *
 * There is no email provider wired yet. `isConfigured` is false until
 * EMAIL_PROVIDER + EMAIL_API_KEY + EMAIL_FROM are set, at which point a concrete
 * transport (Resend / SendGrid / SES) can be dropped into `send()`.
 *
 * Callers MUST treat email as best-effort: a failed or unconfigured send never
 * blocks lead capture. `send()` returns a result describing what happened so the
 * UI/logs can show the true state (never a fake "email sent").
 */

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export type EmailResult =
  | { status: 'sent'; provider: string; id?: string }
  | { status: 'skipped'; reason: 'not_configured' }
  | { status: 'error'; error: string };

export const email = {
  get isConfigured(): boolean {
    return Boolean(env.email.provider && env.email.apiKey && env.email.from);
  },

  get salesInbox(): string | undefined {
    return env.email.salesInbox;
  },

  async send(message: EmailMessage): Promise<EmailResult> {
    if (!this.isConfigured) {
      console.info('[email] skipped (no provider configured):', message.subject, '->', message.to);
      return { status: 'skipped', reason: 'not_configured' };
    }
    try {
      switch (env.email.provider) {
        case 'resend':
          return await sendViaResend(message);
        default:
          console.warn(`[email] unknown provider "${env.email.provider}" — treating as not configured`);
          return { status: 'skipped', reason: 'not_configured' };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'unknown error';
      console.error('[email] send failed', error);
      return { status: 'error', error };
    }
  },
};

async function sendViaResend(message: EmailMessage): Promise<EmailResult> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.email.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.email.from,
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    return { status: 'error', error: `Resend ${res.status}: ${body.slice(0, 200)}` };
  }
  const data = (await res.json()) as { id?: string };
  return { status: 'sent', provider: 'resend', id: data.id };
}

// --- templates ---------------------------------------------------------------

export function demoConfirmationEmail(name: string, product: string): EmailMessage['html'] {
  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#02202c">
      <h2 style="color:#003848">Thanks, ${escapeHtml(name)} — we've got your request</h2>
      <p>Our team will reach out shortly to schedule your ${escapeHtml(product)} demo.</p>
      <p style="color:#64748b;font-size:13px">Momentum Logistics · Enterprise Software Solutions</p>
    </div>`;
}

export function internalLeadNotificationEmail(params: {
  ref: string;
  name: string;
  company?: string;
  product: string;
  service: string;
  score: number;
  temperature: string;
}): EmailMessage['html'] {
  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#02202c">
      <h3 style="color:#003848">New ${escapeHtml(params.temperature)} lead — ${escapeHtml(params.ref)}</h3>
      <table style="font-size:14px;border-collapse:collapse">
        <tr><td style="padding:2px 12px 2px 0;color:#64748b">Name</td><td>${escapeHtml(params.name)}</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:#64748b">Company</td><td>${escapeHtml(params.company ?? '—')}</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:#64748b">Interest</td><td>${escapeHtml(params.product)} · ${escapeHtml(params.service)}</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:#64748b">Score</td><td>${params.score} (${escapeHtml(params.temperature)})</td></tr>
      </table>
    </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
}

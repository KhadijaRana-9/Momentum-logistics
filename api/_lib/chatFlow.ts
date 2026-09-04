import type { ChatSessionDoc, ProductInterest } from './models.js';
import { normalizeEmail } from './validation.js';

/**
 * Deterministic guided-qualification script used when no AI provider is
 * configured. Each step reads the visitor's last message, updates the session's
 * qualification/contact data, and returns the next prompt.
 */

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]{2,}/;
const PHONE_RE = /(\+?\d[\d\s-]{6,}\d)/;

type Step =
  | 'greeting'
  | 'product'
  | 'industry'
  | 'timeline'
  | 'budget'
  | 'name'
  | 'email'
  | 'phone'
  | 'done';

export interface FlowResult {
  reply: string;
  nextStep: Step;
  qualification: ChatSessionDoc['qualification'];
  contact: ChatSessionDoc['contact'];
  readyToCapture: boolean;
}

function detectProduct(text: string): ProductInterest | undefined {
  const t = text.toLowerCase();
  if (/\berp\b|resource planning|inventory|manufactur/.test(t)) return 'ERP Suite';
  if (/fbr|invoic|tax|fiscal|pos integration/.test(t)) return 'FBR Invoicing';
  if (/cloud|hosting|ai\b|artificial intelligence|automation|migrat/.test(t)) return 'Cloud & AI';
  if (/custom|bespoke|from scratch|tailor/.test(t)) return 'Custom Software';
  return undefined;
}

const TIMELINE_HINTS: Record<string, string> = {
  'this month': 'Immediately',
  immediately: 'Immediately',
  asap: 'Immediately',
  quarter: 'This quarter',
  'next month': 'This quarter',
  month: '1-3 months',
  research: 'Just researching',
  exploring: 'Just researching',
};

export const CHAT_GREETING =
  "Hi! I'm Momentum's assistant. I can explain our ERP, FBR-linked invoicing, and Cloud & AI solutions — and set up a demo. Which area are you interested in?";

export function advanceFlow(
  step: Step,
  message: string,
  session: Pick<ChatSessionDoc, 'qualification' | 'contact'>,
): FlowResult {
  const qualification = { ...session.qualification };
  const contact = { ...session.contact };
  const text = message.trim();
  const lower = text.toLowerCase();

  // Opportunistically capture email/phone whenever they appear.
  const emailMatch = text.match(EMAIL_RE);
  if (emailMatch && !contact.email) contact.email = normalizeEmail(emailMatch[0]);
  const phoneMatch = text.match(PHONE_RE);
  if (phoneMatch && !contact.phone) contact.phone = phoneMatch[0].trim();

  switch (step) {
    case 'greeting':
    case 'product': {
      const product = detectProduct(text);
      if (product) qualification.productInterest = product;
      return {
        reply: product
          ? `Great — ${product} is one of our core platforms. What industry is your business in (e.g. manufacturing, distribution, retail)?`
          : "We work across ERP, FBR invoicing and Cloud & AI. Could you tell me a bit about what you're trying to solve?",
        nextStep: product ? 'industry' : 'product',
        qualification,
        contact,
        readyToCapture: false,
      };
    }
    case 'industry': {
      if (text) qualification.industry = text.slice(0, 80);
      return {
        reply: 'Thanks. Roughly when are you looking to have a solution in place — immediately, this quarter, or still researching?',
        nextStep: 'timeline',
        qualification,
        contact,
        readyToCapture: false,
      };
    }
    case 'timeline': {
      const hint = Object.entries(TIMELINE_HINTS).find(([k]) => lower.includes(k));
      qualification.timeline = hint ? hint[1] : text.slice(0, 40) || 'Not specified';
      return {
        reply: 'Understood. Do you have an approximate budget range in mind? (You can say "not sure".)',
        nextStep: 'budget',
        qualification,
        contact,
        readyToCapture: false,
      };
    }
    case 'budget': {
      if (text && !/not sure|no|skip|dunno/i.test(lower)) qualification.budget = text.slice(0, 60);
      return {
        reply: "Perfect. I can have a specialist reach out with a tailored walkthrough. What's your name?",
        nextStep: 'name',
        qualification,
        contact,
        readyToCapture: false,
      };
    }
    case 'name': {
      if (text) contact.name = text.slice(0, 80);
      return {
        reply: `Thanks${contact.name ? `, ${contact.name}` : ''}. What's the best email to send the demo invite to?`,
        nextStep: contact.email ? 'phone' : 'email',
        qualification,
        contact,
        readyToCapture: false,
      };
    }
    case 'email': {
      if (!contact.email && emailMatch) contact.email = normalizeEmail(emailMatch[0]);
      if (!contact.email) {
        return {
          reply: "That doesn't look like an email address — could you double-check it?",
          nextStep: 'email',
          qualification,
          contact,
          readyToCapture: false,
        };
      }
      return {
        reply: 'Got it. And a phone number if you\'d like a call? (Optional — say "skip" to finish.)',
        nextStep: 'phone',
        qualification,
        contact,
        readyToCapture: false,
      };
    }
    case 'phone':
    case 'done': {
      const finished = Boolean(contact.email);
      return {
        reply: finished
          ? "Thanks — you're all set. Our team will be in touch shortly to schedule your demo. Anything else I can help with?"
          : "I still need an email to set up your demo. What's the best address?",
        nextStep: finished ? 'done' : 'email',
        qualification,
        contact,
        readyToCapture: finished,
      };
    }
    default:
      return { reply: CHAT_GREETING, nextStep: 'product', qualification, contact, readyToCapture: false };
  }
}

export type ChatStep = Step;

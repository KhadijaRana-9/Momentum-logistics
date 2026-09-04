import {
  type LeadDoc,
  type LeadTemperature,
  type ScoreFactor,
} from './models.ts';

/**
 * Deterministic, fully explainable lead scoring.
 *
 * The score is the clamped sum of independent factors. Every factor that fires
 * is stored on the lead (`scoreFactors`) so the CRM can show exactly why a lead
 * is Hot/Warm/Cold. No AI, no hidden weights.
 *
 * Thresholds: 0–39 Cold · 40–69 Warm · 70+ Hot
 */

export interface ScoreableLead {
  productInterest?: LeadDoc['productInterest'];
  serviceType?: LeadDoc['serviceType'];
  industry?: string;
  companySize?: string;
  isBusinessEmail?: boolean;
  budget?: string;
  timeline?: string;
  company?: string;
  phone?: string;
  attribution?: Partial<LeadDoc['attribution']>;
  submissionsCount?: number;
  activityCount?: number;
}

const HIGH_VALUE_PRODUCTS = new Set(['ERP Suite', 'Cloud & AI', 'Custom Software']);
const TARGET_INDUSTRIES = new Set([
  'Manufacturing', 'Retail', 'Distribution', 'Wholesale', 'Accounting', 'Logistics',
  'Pharmaceutical', 'FMCG', 'Construction', 'Textile', 'Import/Export',
]);
const NEAR_TERM = new Set(['Immediately', 'This month', 'This quarter', '1-3 months', '0-3 months']);
const LARGER_ORGS = new Set(['51-200', '201-500', '500+', '201-1000', '1000+']);

function budgetSignals(budget?: string): boolean {
  if (!budget) return false;
  const digits = budget.replace(/\D/g, '');
  return digits.length >= 5 || /lac|lakh|million|crore|\bm\b/i.test(budget);
}

export function scoreLead(lead: ScoreableLead): { score: number; factors: ScoreFactor[]; temperature: LeadTemperature } {
  const factors: ScoreFactor[] = [];
  const add = (label: string, points: number) => factors.push({ label, points });

  if (lead.serviceType === 'Demo') add('Requested a product demo', 25);
  else if (lead.serviceType === 'Consultation') add('Requested a consultation', 18);
  else if (lead.serviceType === 'Quote') add('Requested a quote', 20);

  if (lead.productInterest && lead.productInterest !== 'Unspecified') {
    add(`Named a product of interest (${lead.productInterest})`, 8);
    if (HIGH_VALUE_PRODUCTS.has(lead.productInterest)) add('High-value product interest', 10);
  }

  if (lead.isBusinessEmail) add('Business email address', 12);
  if (lead.company) add('Provided a company name', 6);
  if (lead.phone) add('Provided a phone number', 6);

  if (lead.industry && TARGET_INDUSTRIES.has(lead.industry)) add(`Target industry (${lead.industry})`, 10);
  if (lead.companySize && LARGER_ORGS.has(lead.companySize)) add(`Larger organisation (${lead.companySize} staff)`, 10);

  if (budgetSignals(lead.budget)) add('Budget indicated', 12);
  if (lead.timeline && NEAR_TERM.has(lead.timeline)) add(`Near-term timeline (${lead.timeline})`, 12);

  const src = lead.attribution?.source;
  if (src === 'Referral') add('Referral source', 10);
  else if (src === 'Google Ads' || src === 'LinkedIn') add(`Intent-rich channel (${src})`, 6);
  else if (src === 'Organic Search') add('Organic search', 4);
  if (lead.attribution?.campaign) add(`Attributed to campaign (${lead.attribution.campaign})`, 4);

  const submissions = lead.submissionsCount ?? 0;
  if (submissions >= 2) add(`Multiple form submissions (${submissions})`, Math.min(15, submissions * 5));
  const activities = lead.activityCount ?? 0;
  if (activities >= 4) add('Multiple recorded interactions', Math.min(12, Math.floor(activities / 2) * 2));

  const raw = factors.reduce((sum, f) => sum + f.points, 0);
  const score = Math.max(0, Math.min(100, raw));

  const temperature: LeadTemperature = score >= 70 ? 'Hot' : score >= 40 ? 'Warm' : 'Cold';
  return { score, factors, temperature };
}

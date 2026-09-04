import type { ProductInterest } from '@/pages/crm/types';

/**
 * Structured marketing content for the product landing pages.
 *
 * This lives in code for now but is shaped as data (not JSX) so it can be moved
 * behind an admin-managed CMS collection later without touching the page
 * components. No fabricated customers, stats, certifications or pricing appear
 * here — only product capability claims and generic industry context.
 */

export interface LandingContent {
  slug: string;
  product: Extract<ProductInterest, 'ERP Suite' | 'FBR Invoicing' | 'Cloud & AI'>;
  formVariant: 'erp_demo' | 'fbr_inquiry' | 'cloud_ai_inquiry';
  seo: { title: string; description: string; keywords: string[] };
  hero: { eyebrow: string; heading: string; subheading: string; primaryCta: string };
  valueProps: string[];
  benefits: { title: string; body: string }[];
  features: string[];
  useCases: string[];
  industries: string[];
  faq: { q: string; a: string }[];
}

export const LANDING_PAGES: Record<string, LandingContent> = {
  erp: {
    slug: 'erp',
    product: 'ERP Suite',
    formVariant: 'erp_demo',
    seo: {
      title: 'ERP Software Pakistan — Momentum Logistics ERP Suite',
      description:
        'Integrated ERP software for Pakistani manufacturing, distribution and retail businesses. Finance, inventory, procurement, sales and operations in one platform.',
      keywords: ['ERP solutions Pakistan', 'ERP software Pakistan', 'enterprise software solutions', 'manufacturing ERP'],
    },
    hero: {
      eyebrow: 'ERP Suite',
      heading: 'One connected system for finance, inventory and operations',
      subheading:
        'Momentum ERP unifies accounting, stock, procurement, sales and production so your team works from a single source of truth — built for the way businesses in Pakistan actually operate.',
      primaryCta: 'Request an ERP demo',
    },
    valueProps: [
      'Real-time financials and inventory',
      'FBR-ready invoicing built in',
      'Role-based access for every branch',
      'Deploys on cloud or on-premise',
    ],
    benefits: [
      { title: 'Close the books faster', body: 'Automated journals, bank reconciliation and multi-branch consolidation cut month-end from weeks to days.' },
      { title: 'Stop stock-outs and overbuying', body: 'Live stock positions, reorder points and demand history keep working capital under control.' },
      { title: 'See true product margins', body: 'Landed cost, production cost and per-SKU profitability instead of guesswork on a spreadsheet.' },
      { title: 'Give leadership one dashboard', body: 'Cash position, receivables, sales and operations in views tailored to each role.' },
    ],
    features: [
      'General ledger, AP/AR, multi-currency', 'Inventory & warehouse management', 'Procurement & supplier management',
      'Sales orders, quotations & CRM hooks', 'Manufacturing / BOM & work orders', 'Fixed assets & depreciation',
      'Payroll-ready HR module', 'Configurable approval workflows', 'Audit trail on every transaction',
    ],
    useCases: [
      'Manufacturers tracking raw material to finished goods',
      'Distributors managing multi-warehouse stock and credit customers',
      'Retail chains consolidating branch sales and purchasing',
      'Trading companies handling imports, landed cost and LC tracking',
    ],
    industries: ['Manufacturing', 'Distribution & Wholesale', 'Retail Chains', 'Import / Export', 'Construction Materials', 'FMCG'],
    faq: [
      { q: 'Can Momentum ERP handle FBR sales-tax invoicing?', a: 'Yes — FBR-linked invoicing is part of the platform, so tax invoices, returns data and POS integration are handled inside the same system.' },
      { q: 'Do you support on-premise deployment?', a: 'Both cloud and on-premise deployments are supported. We help you choose based on your infrastructure and compliance needs.' },
      { q: 'How long does implementation take?', a: 'It depends on scope and data readiness. We scope this precisely during the demo and discovery call rather than quoting a generic number.' },
      { q: 'Can we migrate data from our current system?', a: 'Yes. Master data and opening balances are migrated as part of onboarding, with reconciliation checkpoints before go-live.' },
    ],
  },
  'fbr-invoicing': {
    slug: 'fbr-invoicing',
    product: 'FBR Invoicing',
    formVariant: 'fbr_inquiry',
    seo: {
      title: 'FBR Invoicing Software — FBR Integrated Invoicing | Momentum Logistics',
      description:
        'FBR-integrated invoicing software for Pakistani businesses. Generate compliant tax invoices, integrate your POS, and prepare sales-tax returns without manual rework.',
      keywords: ['FBR invoicing software', 'FBR integrated invoicing', 'FBR POS integration', 'sales tax invoicing Pakistan'],
    },
    hero: {
      eyebrow: 'FBR-Linked Invoicing',
      heading: 'Compliant tax invoicing without the manual rework',
      subheading:
        'Issue FBR-compliant invoices, connect your points of sale, and keep sales-tax data return-ready — as a standalone module or part of the full ERP.',
      primaryCta: 'Talk to us about FBR invoicing',
    },
    valueProps: [
      'FBR-compliant invoice formats', 'POS / retail integration', 'Sales-tax return-ready data', 'Multi-branch, multi-user',
    ],
    benefits: [
      { title: 'Reduce compliance risk', body: 'Invoices follow the required format and numbering, with a full audit trail for every document.' },
      { title: 'Cut reconciliation time', body: 'Output and input tax are captured as transactions happen, so return preparation is a review, not a rebuild.' },
      { title: 'Connect the tills', body: 'Retail and POS sales flow into the same ledger as B2B invoices — one set of numbers.' },
      { title: 'Scale across branches', body: 'Central control with per-branch users, roles and reporting.' },
    ],
    features: [
      'FBR-format tax invoices & credit notes', 'Configurable tax rates & exemptions', 'POS integration hooks',
      'Buyer / supplier tax registration records', 'Sales-tax register & summaries', 'Invoice approval & void controls',
      'Bulk export for return filing', 'User activity and audit logging',
    ],
    useCases: [
      'Retailers needing FBR POS integration across outlets',
      'Wholesalers issuing high volumes of tax invoices',
      'Service businesses moving off manual invoice books',
      'Finance teams preparing monthly sales-tax returns',
    ],
    industries: ['Retail', 'Wholesale & Distribution', 'Restaurants & Hospitality', 'Services', 'Manufacturing'],
    faq: [
      { q: 'Is this a standalone product or part of the ERP?', a: 'Both. You can run FBR invoicing on its own and add other ERP modules later, or start with the full suite.' },
      { q: 'Can it integrate with our existing POS?', a: 'We provide integration hooks and assess your specific POS during the consultation. Actual connection depends on that system\'s API availability.' },
      { q: 'Does it file returns automatically?', a: 'It keeps your data return-ready and exportable. Filing itself remains with your tax team or consultant.' },
    ],
  },
  'cloud-ai': {
    slug: 'cloud-ai',
    product: 'Cloud & AI',
    formVariant: 'cloud_ai_inquiry',
    seo: {
      title: 'Cloud & AI Solutions for Business — Momentum Logistics',
      description:
        'Cloud hosting, migration and AI automation for Pakistani enterprises. Move core systems to the cloud and add practical AI where it delivers measurable value.',
      keywords: ['cloud solutions', 'AI solutions', 'cloud migration Pakistan', 'business automation', 'enterprise software solutions'],
    },
    hero: {
      eyebrow: 'Cloud & AI',
      heading: 'Modern infrastructure and practical AI, not hype',
      subheading:
        'We move business-critical systems to reliable cloud infrastructure and apply AI to the workflows where it actually pays back — document processing, forecasting, and support.',
      primaryCta: 'Discuss a cloud or AI project',
    },
    valueProps: ['Cloud migration & hosting', 'Managed infrastructure', 'Practical AI automation', 'Security & backups by default'],
    benefits: [
      { title: 'Improve uptime and access', body: 'Business systems available securely from any branch or device, with monitored infrastructure.' },
      { title: 'Lower the cost of scale', body: 'Right-sized cloud resources instead of over-provisioned servers you maintain yourself.' },
      { title: 'Automate the repetitive work', body: 'AI for invoice/document extraction, demand forecasting and first-line support — scoped to real ROI.' },
      { title: 'Keep data protected', body: 'Encryption, role-based access, automated backups and disaster-recovery planning built in.' },
    ],
    features: [
      'Cloud architecture & migration', 'Managed hosting & monitoring', 'Automated backup & disaster recovery',
      'Identity & access management', 'AI document / invoice extraction', 'Forecasting & analytics models',
      'Chatbot & support automation', 'Integration & API development',
    ],
    useCases: [
      'Moving an on-premise ERP or database to the cloud',
      'Standing up secure remote access for multi-branch teams',
      'Automating data entry from PDFs, invoices and forms',
      'Adding demand forecasting to inventory planning',
    ],
    industries: ['Manufacturing', 'Distribution', 'Retail', 'Financial Services', 'Logistics', 'Healthcare'],
    faq: [
      { q: 'Which cloud providers do you work with?', a: 'We are provider-agnostic and recommend based on your workload, budget and data-residency requirements.' },
      { q: 'Is our data used to train AI models?', a: 'No. Any AI features operate on your data for your use only; we do not train third-party models on your business data.' },
      { q: 'Can you start small?', a: 'Yes — most engagements begin with a single migration or one automation use case, then expand once value is proven.' },
    ],
  },
};

export const LANDING_SLUGS = Object.keys(LANDING_PAGES);

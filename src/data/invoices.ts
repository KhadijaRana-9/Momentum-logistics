import type { Invoice } from './types';

export const invoices: Invoice[] = [
  {
    id: 'INV-2026-1201', customerId: 'CUS-010', contractRef: 'CTR-UCP-2023-052', jobIds: ['JOB-2026-0073'], tripIds: ['TRP-2026-0201'],
    charges: [{ description: 'Freight — Sharjah to Kuwait City (FTL)', amount: 8400 }],
    additionalCharges: [{ description: 'Loading/unloading labour', amount: 250 }, { description: 'Border toll surcharge', amount: 120 }],
    discount: 0, taxRate: 5, status: 'Paid', issueDate: '2026-08-11', dueDate: '2026-09-10',
  },
  {
    id: 'INV-2026-1202', customerId: 'CUS-011', contractRef: 'CTR-MSD-2020-014', jobIds: ['JOB-2026-0074'], tripIds: ['TRP-2026-0202'],
    charges: [{ description: 'Freight — Abu Dhabi to Al Ain (Flatbed)', amount: 12600 }],
    additionalCharges: [{ description: 'Crane offload service', amount: 180 }],
    discount: 200, taxRate: 5, status: 'Pending Approval', issueDate: '2026-08-19', dueDate: '2026-09-18',
  },
  {
    id: 'INV-2026-1188', customerId: 'CUS-001', contractRef: 'CTR-AFT-2024-018', jobIds: ['JOB-2026-0055', 'JOB-2026-0056'], tripIds: ['TRP-2026-0140', 'TRP-2026-0141'],
    charges: [{ description: 'Freight — Dubai to Riyadh (x2 FTL)', amount: 22400 }],
    additionalCharges: [{ description: 'Detention charges', amount: 600 }],
    discount: 0, taxRate: 5, status: 'Overdue', issueDate: '2026-07-04', dueDate: '2026-08-03',
  },
  {
    id: 'INV-2026-1195', customerId: 'CUS-002', contractRef: 'CTR-ESI-2020-155', jobIds: ['JOB-2026-0061'], tripIds: ['TRP-2026-0152'],
    charges: [{ description: 'Freight — Steel coil transport, ICAD to Al Ain', amount: 14200 }],
    additionalCharges: [],
    discount: 0, taxRate: 5, status: 'Sent', issueDate: '2026-08-12', dueDate: '2026-09-11',
  },
  {
    id: 'INV-2026-1178', customerId: 'CUS-005', contractRef: 'CTR-SBC-2019-233', jobIds: ['JOB-2026-0048'], tripIds: ['TRP-2026-0128'],
    charges: [{ description: 'Freight — Bulk chemical tanker, Jubail to Doha', amount: 28900 }],
    additionalCharges: [{ description: 'ADR/HAZMAT handling', amount: 1200 }],
    discount: 500, taxRate: 5, status: 'Paid', issueDate: '2026-06-28', dueDate: '2026-07-28',
  },
  {
    id: 'INV-2026-1180', customerId: 'CUS-004', contractRef: 'CTR-ALM-2022-091', jobIds: ['JOB-2026-0051'], tripIds: ['TRP-2026-0131'],
    charges: [{ description: 'Freight — Cold chain, Riyadh to Dammam', amount: 9800 }],
    additionalCharges: [],
    discount: 0, taxRate: 5, status: 'Disputed', issueDate: '2026-07-15', dueDate: '2026-08-14',
  },
  {
    id: 'INV-2026-1210', customerId: 'CUS-009', contractRef: 'CTR-AGL-2021-007', jobIds: ['JOB-2026-0090'], tripIds: [],
    charges: [{ description: 'Freight — Project cargo, Sharjah to Jebel Ali', amount: 15400 }],
    additionalCharges: [{ description: 'Escort vehicle & permits', amount: 900 }],
    discount: 0, taxRate: 5, status: 'Draft', issueDate: '2026-08-20', dueDate: '2026-09-19',
  },
  {
    id: 'INV-2026-1165', customerId: 'CUS-007', contractRef: 'CTR-QTS-2022-101', jobIds: ['JOB-2026-0039'], tripIds: ['TRP-2026-0110'],
    charges: [{ description: 'Freight — Rebar export, Doha to Jebel Ali', amount: 17300 }],
    additionalCharges: [{ description: 'Port handling coordination', amount: 400 }],
    discount: 0, taxRate: 5, status: 'Paid', issueDate: '2026-06-10', dueDate: '2026-07-10',
  },
  {
    id: 'INV-2026-1191', customerId: 'CUS-003', contractRef: 'CTR-GCC-2023-012', jobIds: ['JOB-2026-0058'], tripIds: ['TRP-2026-0146'],
    charges: [{ description: 'Freight — Bulk aggregate, RAK to Abu Dhabi', amount: 6800 }],
    additionalCharges: [],
    discount: 0, taxRate: 5, status: 'Approved', issueDate: '2026-08-08', dueDate: '2026-09-07',
  },
  {
    id: 'INV-2026-1172', customerId: 'CUS-012', contractRef: 'CTR-NST-2021-066', jobIds: ['JOB-2026-0044', 'JOB-2026-0045'], tripIds: ['TRP-2026-0118', 'TRP-2026-0119'],
    charges: [{ description: 'Freight — Grocery distribution (x2 runs)', amount: 9600 }],
    additionalCharges: [],
    discount: 0, taxRate: 5, status: 'Overdue', issueDate: '2026-07-01', dueDate: '2026-07-31',
  },
];

export function getInvoice(id: string) {
  return invoices.find((i) => i.id === id);
}

export function invoiceSubtotal(inv: Invoice) {
  return (
    inv.charges.reduce((s, c) => s + c.amount, 0) +
    inv.additionalCharges.reduce((s, c) => s + c.amount, 0)
  );
}

export function invoiceTax(inv: Invoice) {
  return (invoiceSubtotal(inv) - inv.discount) * (inv.taxRate / 100);
}

export function invoiceTotal(inv: Invoice) {
  return invoiceSubtotal(inv) - inv.discount + invoiceTax(inv);
}

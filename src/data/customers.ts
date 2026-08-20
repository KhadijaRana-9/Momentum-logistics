import type { Customer } from './types';

export const customers: Customer[] = [
  { id: 'CUS-001', name: 'Al Futtaim Trading LLC', industry: 'Retail & Distribution', city: 'Dubai', contactName: 'Yousef Al Marzooqi', contactPhone: '+971 50 214 7783', contactEmail: 'y.marzooqi@alfuttaim-trading.ae', contractType: 'Contract', creditLimit: 1200000, outstandingBalance: 284500, activeSince: '2021-03-14' },
  { id: 'CUS-002', name: 'Emirates Steel Industries', industry: 'Manufacturing', city: 'Abu Dhabi', contactName: 'Rania Haddad', contactPhone: '+971 55 902 3341', contactEmail: 'rania.haddad@emiratessteel.com', contractType: 'Contract', creditLimit: 2500000, outstandingBalance: 612300, activeSince: '2019-07-02' },
  { id: 'CUS-003', name: 'Gulf Cement Company', industry: 'Construction Materials', city: 'Ras Al Khaimah', contactName: 'Khalid Al Suwaidi', contactPhone: '+971 52 118 6620', contactEmail: 'k.suwaidi@gulfcement.ae', contractType: 'Rate Card', creditLimit: 800000, outstandingBalance: 96200, activeSince: '2022-01-19' },
  { id: 'CUS-004', name: 'Almarai Logistics', industry: 'FMCG / Dairy', city: 'Riyadh', contactName: 'Faisal Al Otaibi', contactPhone: '+966 50 774 2291', contactEmail: 'f.otaibi@almarai.com', contractType: 'Contract', creditLimit: 1800000, outstandingBalance: 421900, activeSince: '2020-05-27' },
  { id: 'CUS-005', name: 'SABIC Distribution', industry: 'Petrochemicals', city: 'Jubail', contactName: 'Nourah Al Qahtani', contactPhone: '+966 55 331 8807', contactEmail: 'n.qahtani@sabic.com', contractType: 'Contract', creditLimit: 3200000, outstandingBalance: 894000, activeSince: '2018-11-08' },
  { id: 'CUS-006', name: 'Landmark Group', industry: 'Retail', city: 'Dubai', contactName: 'Aisha Al Bloushi', contactPhone: '+971 56 447 9012', contactEmail: 'aisha.bloushi@landmarkgroup.com', contractType: 'Spot', creditLimit: 450000, outstandingBalance: 38700, activeSince: '2023-02-11' },
  { id: 'CUS-007', name: 'Qatar Steel', industry: 'Manufacturing', city: 'Doha', contactName: 'Hamad Al Kuwari', contactPhone: '+974 55 620 4471', contactEmail: 'h.kuwari@qatarsteel.com.qa', contractType: 'Contract', creditLimit: 1600000, outstandingBalance: 203400, activeSince: '2021-09-30' },
  { id: 'CUS-008', name: 'Oman Cables Industry', industry: 'Manufacturing', city: 'Muscat', contactName: 'Salim Al Habsi', contactPhone: '+968 92 445 1183', contactEmail: 's.habsi@omancables.com', contractType: 'Rate Card', creditLimit: 650000, outstandingBalance: 71250, activeSince: '2022-06-04' },
  { id: 'CUS-009', name: 'Agility Project Logistics', industry: 'Freight Forwarding', city: 'Kuwait City', contactName: 'Mariam Al Sabah', contactPhone: '+965 60 118 8842', contactEmail: 'm.sabah@agility.com', contractType: 'Contract', creditLimit: 2100000, outstandingBalance: 567800, activeSince: '2019-04-16' },
  { id: 'CUS-010', name: 'Union Coop Supply Chain', industry: 'Retail', city: 'Sharjah', contactName: 'Omar Al Zaabi', contactPhone: '+971 54 883 2205', contactEmail: 'omar.zaabi@unioncoop.ae', contractType: 'Spot', creditLimit: 380000, outstandingBalance: 22150, activeSince: '2023-08-22' },
  { id: 'CUS-011', name: 'Masdar City Developers', industry: 'Construction', city: 'Abu Dhabi', contactName: 'Latifa Al Dhaheri', contactPhone: '+971 50 662 1197', contactEmail: 'l.dhaheri@masdarcity.ae', contractType: 'Contract', creditLimit: 1400000, outstandingBalance: 318600, activeSince: '2020-12-01' },
  { id: 'CUS-012', name: 'Nesto Hypermarket Group', industry: 'FMCG / Retail', city: 'Dubai', contactName: 'Vishal Menon', contactPhone: '+971 52 774 9930', contactEmail: 'vishal.menon@nestogroup.com', contractType: 'Contract', creditLimit: 950000, outstandingBalance: 145900, activeSince: '2021-10-13' },
];

export function getCustomer(id: string) {
  return customers.find((c) => c.id === id);
}

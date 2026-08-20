import type { Driver } from './types';

export const drivers: Driver[] = [
  { id: 'DRV-201', name: 'Mohammed Al Rashid', phone: '+971 50 112 8834', nationality: 'UAE', licenseNumber: 'UAE-DXB-88213', licenseExpiry: '2027-04-12', assignedVehicleId: 'VEH-101', status: 'On Trip', joinDate: '2018-02-19', totalTrips: 1284, rating: 4.8, incidents: 0, homeBranch: 'Dubai' },
  { id: 'DRV-202', name: 'Rajesh Kumar Nair', phone: '+971 55 221 6690', nationality: 'India', licenseNumber: 'UAE-DXB-71042', licenseExpiry: '2026-11-03', assignedVehicleId: 'VEH-102', status: 'On Trip', joinDate: '2019-06-05', totalTrips: 1102, rating: 4.6, incidents: 1, homeBranch: 'Dubai' },
  { id: 'DRV-203', name: 'Ahmed Hassan Ali', phone: '+971 52 887 4471', nationality: 'Egypt', licenseNumber: 'UAE-AUH-55302', licenseExpiry: '2026-09-27', assignedVehicleId: 'VEH-103', status: 'Active', joinDate: '2020-01-22', totalTrips: 876, rating: 4.7, incidents: 0, homeBranch: 'Abu Dhabi' },
  { id: 'DRV-204', name: 'Muhammad Iqbal Chaudhry', phone: '+971 56 334 9021', nationality: 'Pakistan', licenseNumber: 'UAE-SHJ-40218', licenseExpiry: '2025-12-15', assignedVehicleId: 'VEH-104', status: 'On Trip', joinDate: '2017-08-30', totalTrips: 1540, rating: 4.9, incidents: 0, homeBranch: 'Sharjah' },
  { id: 'DRV-205', name: 'Khalid Al Mansoori', phone: '+971 50 778 1123', nationality: 'UAE', licenseNumber: 'UAE-AUH-63389', licenseExpiry: '2027-02-08', assignedVehicleId: 'VEH-105', status: 'Active', joinDate: '2021-03-11', totalTrips: 512, rating: 4.5, incidents: 1, homeBranch: 'Abu Dhabi' },
  { id: 'DRV-206', name: 'Sunil Fernando', phone: '+971 54 220 5567', nationality: 'Sri Lanka', licenseNumber: 'UAE-DXB-29104', licenseExpiry: '2026-06-19', assignedVehicleId: 'VEH-106', status: 'On Trip', joinDate: '2019-10-14', totalTrips: 968, rating: 4.6, incidents: 0, homeBranch: 'Dubai' },
  { id: 'DRV-207', name: 'Abdullah Al Nuaimi', phone: '+971 52 990 3341', nationality: 'UAE', licenseNumber: 'UAE-RAK-18827', licenseExpiry: '2025-08-30', assignedVehicleId: 'VEH-107', status: 'Off Duty', joinDate: '2016-05-02', totalTrips: 2103, rating: 4.9, incidents: 0, homeBranch: 'Ras Al Khaimah' },
  { id: 'DRV-208', name: 'Ravi Shankar Reddy', phone: '+971 55 118 7723', nationality: 'India', licenseNumber: 'UAE-DXB-52967', licenseExpiry: '2027-01-05', assignedVehicleId: 'VEH-108', status: 'On Trip', joinDate: '2020-09-08', totalTrips: 734, rating: 4.4, incidents: 2, homeBranch: 'Dubai' },
  { id: 'DRV-209', name: 'Hassan Ali Al Balushi', phone: '+968 91 227 4498', nationality: 'Oman', licenseNumber: 'OM-MCT-30215', licenseExpiry: '2026-03-22', assignedVehicleId: 'VEH-109', status: 'Active', joinDate: '2018-11-27', totalTrips: 1345, rating: 4.7, incidents: 0, homeBranch: 'Muscat' },
  { id: 'DRV-210', name: 'Faisal Al Qahtani', phone: '+966 55 662 1187', nationality: 'Saudi Arabia', licenseNumber: 'SA-RUH-88541', licenseExpiry: '2027-07-14', assignedVehicleId: 'VEH-110', status: 'On Trip', joinDate: '2019-02-16', totalTrips: 1021, rating: 4.5, incidents: 1, homeBranch: 'Riyadh' },
  { id: 'DRV-211', name: 'Bilal Ahmed Sheikh', phone: '+971 50 447 6612', nationality: 'Pakistan', licenseNumber: 'UAE-DXB-91076', licenseExpiry: '2025-05-09', assignedVehicleId: null, status: 'Off Duty', joinDate: '2022-04-19', totalTrips: 287, rating: 4.3, incidents: 0, homeBranch: 'Dubai' },
  { id: 'DRV-212', name: 'Omar Al Sayed Mostafa', phone: '+971 56 883 2290', nationality: 'Egypt', licenseNumber: 'UAE-AUH-47732', licenseExpiry: '2026-10-01', assignedVehicleId: null, status: 'Suspended', joinDate: '2021-07-23', totalTrips: 445, rating: 3.9, incidents: 4, homeBranch: 'Abu Dhabi' },
];

export function getDriver(id: string | null | undefined) {
  return drivers.find((d) => d.id === id);
}

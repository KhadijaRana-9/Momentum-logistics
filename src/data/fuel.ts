import type { FuelVoucher } from './types';

export const fuelVouchers: FuelVoucher[] = [
  { id: 'FV-2026-5510', vehicleId: 'VEH-106', driverId: 'DRV-206', station: 'ADNOC — Sharjah Industrial 12', date: '2026-08-09', odometer: 355720, litres: 316, rate: 3.10, total: 979.6, fuelType: 'Diesel', tripId: 'TRP-2026-0201', receiptAttached: true },
  { id: 'FV-2026-5511', vehicleId: 'VEH-101', driverId: 'DRV-201', station: 'ADNOC — Mussafah', date: '2026-08-09', odometer: 181810, litres: 50, rate: 3.10, total: 155.0, fuelType: 'Diesel', tripId: 'TRP-2026-0202', receiptAttached: true },
  { id: 'FV-2026-5518', vehicleId: 'VEH-109', driverId: 'DRV-209', station: 'ENOC — Al Quoz', date: '2026-08-11', odometer: 224870, litres: 10, rate: 3.10, total: 31.0, fuelType: 'Diesel', tripId: 'TRP-2026-0205', receiptAttached: true },
  { id: 'FV-2026-5519', vehicleId: 'VEH-107', driverId: 'DRV-207', station: 'ADNOC — RAK Quarry Rd', date: '2026-08-11', odometer: 178435, litres: 34, rate: 3.10, total: 105.4, fuelType: 'Diesel', tripId: 'TRP-2026-0206', receiptAttached: true },
  { id: 'FV-2026-5524', vehicleId: 'VEH-104', driverId: 'DRV-204', station: 'Saudi Aramco — Riyadh North', date: '2026-08-20', odometer: 301600, litres: 80, rate: 2.18, total: 174.4, fuelType: 'Diesel', tripId: 'TRP-2026-0203', receiptAttached: true },
  { id: 'FV-2026-5525', vehicleId: 'VEH-110', driverId: 'DRV-210', station: 'Oman Oil — Muscat Bypass', date: '2026-08-20', odometer: 111900, litres: 95, rate: 2.62, total: 248.9, fuelType: 'Diesel', tripId: 'TRP-2026-0204', receiptAttached: false },
  { id: 'FV-2026-5502', vehicleId: 'VEH-102', driverId: 'DRV-202', station: 'ADNOC — Jebel Ali', date: '2026-08-06', odometer: 213900, litres: 340, rate: 3.10, total: 1054.0, fuelType: 'Diesel', receiptAttached: true },
  { id: 'FV-2026-5503', vehicleId: 'VEH-108', driverId: 'DRV-208', station: 'Woqod — Doha Industrial', date: '2026-08-05', odometer: 67500, litres: 280, rate: 2.31, total: 646.8, fuelType: 'Diesel', receiptAttached: true },
  { id: 'FV-2026-5490', vehicleId: 'VEH-103', driverId: 'DRV-203', station: 'ENOC — Al Ain Rd', date: '2026-08-02', odometer: 95100, litres: 60, rate: 3.10, total: 186.0, fuelType: 'Diesel', receiptAttached: true },
  { id: 'FV-2026-5488', vehicleId: 'VEH-105', driverId: 'DRV-205', station: 'ADNOC — Al Ain Industrial', date: '2026-07-30', odometer: 140200, litres: 210, rate: 3.10, total: 651.0, fuelType: 'Diesel', receiptAttached: true },
];

export function getFuelVoucher(id: string) {
  return fuelVouchers.find((f) => f.id === id);
}

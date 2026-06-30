/**
 * Ride product catalog and fare estimation for the demo.
 */
import { vehicles } from "./icons";

export interface RideType {
  id: string;
  name: string;
  blurb: string;
  capacity: number;
  vehicle: keyof typeof vehicles;
  /** fare multiplier & base used to derive a price from distance/time */
  base: number;
  perKm: number;
  perMin: number;
  etaMin: number; // minutes until pickup
  badge?: string;
}

export const RIDE_TYPES: RideType[] = [
  {
    id: "uberx",
    name: "UberX",
    blurb: "Affordable rides all to yourself",
    capacity: 4,
    vehicle: "sedan",
    base: 6,
    perKm: 2.4,
    perMin: 0.4,
    etaMin: 3,
    badge: "Faster",
  },
  {
    id: "comfort",
    name: "Comfort",
    blurb: "Newer cars with extra legroom",
    capacity: 4,
    vehicle: "sedan",
    base: 8,
    perKm: 3.0,
    perMin: 0.5,
    etaMin: 5,
  },
  {
    id: "green",
    name: "Uber Green",
    blurb: "Zero‑emission rides",
    capacity: 4,
    vehicle: "green",
    base: 6,
    perKm: 2.5,
    perMin: 0.42,
    etaMin: 4,
    badge: "Eco",
  },
  {
    id: "xl",
    name: "UberXL",
    blurb: "Affordable rides for groups up to 6",
    capacity: 6,
    vehicle: "suv",
    base: 10,
    perKm: 3.6,
    perMin: 0.6,
    etaMin: 6,
  },
  {
    id: "black",
    name: "Uber Black",
    blurb: "Premium rides in luxury cars",
    capacity: 4,
    vehicle: "luxury",
    base: 18,
    perKm: 5.2,
    perMin: 0.9,
    etaMin: 7,
  },
  {
    id: "moto",
    name: "Uber Moto",
    blurb: "Beat the traffic — quick & low cost",
    capacity: 1,
    vehicle: "moto",
    base: 3,
    perKm: 1.4,
    perMin: 0.2,
    etaMin: 2,
  },
];

export interface Fare {
  price: number;
  oldPrice?: number;
  tripMin: number;
}

/** Estimate fare from distance (km). Currency formatted by the caller. */
export function estimateFare(type: RideType, km: number): Fare {
  const tripMin = Math.max(4, Math.round(km * 2.4 + 3));
  const raw = type.base + km * type.perKm + tripMin * type.perMin;
  const price = Math.round(raw);
  // Occasionally show a struck-through "old" price for promo flavor.
  const promo = type.id === "uberx" || type.id === "green";
  return {
    price,
    oldPrice: promo ? Math.round(raw * 1.18) : undefined,
    tripMin,
  };
}

export const fmtSAR = (n: number) => `SAR ${n.toFixed(2)}`;

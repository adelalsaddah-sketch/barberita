/**
 * Synthetic geocoder for the demo ride app.
 * Maps place names to points on a virtual 1000x700 "city" plane so the map,
 * routing and fare estimates all work with no external API / key.
 */
export interface Point {
  x: number;
  y: number;
}

export interface Place {
  name: string;
  detail: string;
  pt: Point;
}

/** Curated saved/known places shown as suggestions. */
export const KNOWN_PLACES: Place[] = [
  { name: "Home", detail: "1024 Olive Street", pt: { x: 250, y: 480 } },
  { name: "Work", detail: "King Fahd Rd, Al Olaya Tower", pt: { x: 720, y: 220 } },
  { name: "King Khalid International Airport", detail: "Airport Rd (KKIA)", pt: { x: 880, y: 110 } },
  { name: "Kingdom Centre", detail: "Al Olaya, King Fahd Rd", pt: { x: 640, y: 300 } },
  { name: "Riyadh Park Mall", detail: "Northern Ring Branch Rd", pt: { x: 480, y: 150 } },
  { name: "Al Faisaliah Tower", detail: "Olaya District", pt: { x: 600, y: 360 } },
  { name: "Central Railway Station", detail: "Eastern Ring Rd", pt: { x: 820, y: 470 } },
  { name: "Boulevard Riyadh City", detail: "Hittin District", pt: { x: 320, y: 230 } },
  { name: "National Museum", detail: "Al Murabba", pt: { x: 430, y: 520 } },
  { name: "King Abdullah Park", detail: "Al Malaz", pt: { x: 560, y: 560 } },
  { name: "Diriyah Gate", detail: "At-Turaif, Diriyah", pt: { x: 140, y: 300 } },
  { name: "Granada Mall", detail: "Eastern Ring Rd", pt: { x: 780, y: 360 } },
];

/** Deterministic hash so a free-typed query always lands at the same spot. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** Resolve a query string to a place + point. */
export function geocode(query: string): Place {
  const q = query.trim().toLowerCase();
  if (!q) return { name: query, detail: "", pt: { x: 500, y: 350 } };

  const match = KNOWN_PLACES.find(
    (p) => p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase())
  );
  if (match) return match;

  // Place free text deterministically within the central region.
  const a = hash(q);
  const b = hash(q + "::y");
  return {
    name: query,
    detail: "Dropped pin",
    pt: { x: 180 + a * 660, y: 140 + b * 420 },
  };
}

/** Filter known places for the autocomplete dropdown. */
export function suggest(query: string): Place[] {
  const q = query.trim().toLowerCase();
  if (!q) return KNOWN_PLACES.slice(0, 6);
  return KNOWN_PLACES.filter(
    (p) =>
      p.name.toLowerCase().includes(q) || p.detail.toLowerCase().includes(q)
  ).slice(0, 6);
}

/** Straight-line distance scaled to kilometers for the city plane. */
export function distanceKm(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return (Math.hypot(dx, dy) / 1000) * 22; // ~22km across the plane
}

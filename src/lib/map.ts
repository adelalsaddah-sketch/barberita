/**
 * Self-contained SVG city map renderer in the Uber map style.
 * No tiles, no API keys — everything is drawn so it looks identical anywhere.
 *
 * Coordinate space is a virtual 1000 x 700 "city" plane (see places.ts).
 */
import type { Point } from "./places";
import { carTop } from "./icons";

const SVG = "http://www.w3.org/2000/svg";
export const WORLD = { w: 1000, h: 700 };

const GRID_X = [50, 150, 250, 350, 450, 550, 650, 750, 850, 950];
const GRID_Y = [50, 150, 250, 350, 450, 550, 650];

function el(name: string, attrs: Record<string, string | number> = {}) {
  const node = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function nearest(arr: number[], v: number) {
  return arr.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
}

/** Build a grid-following polyline between two points. */
export function routeBetween(a: Point, b: Point): Point[] {
  const midY = nearest(GRID_Y, (a.y + b.y) / 2);
  const midX = nearest(GRID_X, (a.x + b.x) / 2);
  const raw: Point[] = [
    { x: a.x, y: a.y },
    { x: a.x, y: midY },
    { x: midX, y: midY },
    { x: midX, y: b.y },
    { x: b.x, y: b.y },
  ];
  // drop consecutive duplicates
  return raw.filter(
    (p, i) => i === 0 || p.x !== raw[i - 1].x || p.y !== raw[i - 1].y
  );
}

/** Total length of a polyline in world units. */
export function routeLength(pts: Point[]) {
  return polylineLength(pts).len;
}

function polylineLength(pts: Point[]) {
  let len = 0;
  const segs: number[] = [];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    segs.push(d);
    len += d;
  }
  return { len, segs };
}

function pointAt(pts: Point[], segs: number[], dist: number) {
  let d = dist;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const t = segs[i] === 0 ? 0 : Math.min(1, d / segs[i]);
      const a = pts[i];
      const b = pts[i + 1];
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        angle: Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI) + 90,
      };
    }
    d -= segs[i];
  }
  const last = pts[pts.length - 1];
  return { x: last.x, y: last.y, angle: 0 };
}

interface TrafficCar {
  node: SVGGElement;
  horizontal: boolean;
  line: number; // fixed coordinate
  pos: number; // moving coordinate
  dir: number; // +1 / -1
  speed: number;
}

export class CityMap {
  private svg: SVGSVGElement;
  private gRoute: SVGGElement;
  private gMarkers: SVGGElement;
  private gTraffic: SVGGElement;
  private gDriver: SVGGElement;
  private traffic: TrafficCar[] = [];
  private raf = 0;
  private last = 0;
  private driverAnim:
    | { route: Point[]; segs: number[]; len: number; dist: number; speed: number; onProgress?: (frac: number) => void; onDone?: () => void }
    | null = null;

  constructor(container: HTMLElement) {
    this.svg = el("svg", {
      viewBox: `0 0 ${WORLD.w} ${WORLD.h}`,
      preserveAspectRatio: "xMidYMid slice",
      width: "100%",
      height: "100%",
    }) as SVGSVGElement;
    this.svg.style.display = "block";
    container.appendChild(this.svg);

    this.drawBase();
    this.gTraffic = el("g") as SVGGElement;
    this.gRoute = el("g") as SVGGElement;
    this.gMarkers = el("g") as SVGGElement;
    this.gDriver = el("g") as SVGGElement;
    this.svg.append(this.gTraffic, this.gRoute, this.gMarkers, this.gDriver);
  }

  private drawBase() {
    const cs = getComputedStyle(document.documentElement);
    const c = (name: string, fb: string) =>
      cs.getPropertyValue(name).trim() || fb;

    this.svg.appendChild(
      el("rect", { width: WORLD.w, height: WORLD.h, fill: c("--map-bg", "#e8eaed") })
    );

    // water
    this.svg.appendChild(
      el("path", {
        d: "M0 0 L320 0 C300 120 380 180 320 300 L0 360 Z",
        fill: c("--map-water", "#a9d3f5"),
        opacity: "0.85",
      })
    );
    // parks
    for (const [x, y, w, h] of [
      [560, 520, 220, 150],
      [120, 470, 150, 120],
    ]) {
      this.svg.appendChild(
        el("rect", { x, y, width: w, height: h, rx: 16, fill: c("--map-park", "#cfe7c4") })
      );
    }
    // city blocks (subtle)
    const block = c("--map-block", "#eef0f2");
    for (let gx = 0; gx < GRID_X.length - 1; gx++) {
      for (let gy = 0; gy < GRID_Y.length - 1; gy++) {
        if ((gx + gy) % 2 === 0) continue;
        this.svg.appendChild(
          el("rect", {
            x: GRID_X[gx] + 18,
            y: GRID_Y[gy] + 18,
            width: GRID_X[gx + 1] - GRID_X[gx] - 36,
            height: GRID_Y[gy + 1] - GRID_Y[gy] - 36,
            rx: 5,
            fill: block,
            opacity: "0.6",
          })
        );
      }
    }

    const road = c("--map-road", "#ffffff");
    const major = c("--map-road-major", "#fdf6da");
    for (const x of GRID_X)
      this.svg.appendChild(el("line", { x1: x, y1: 0, x2: x, y2: WORLD.h, stroke: road, "stroke-width": 12 }));
    for (const y of GRID_Y)
      this.svg.appendChild(el("line", { x1: 0, y1: y, x2: WORLD.w, y2: y, stroke: road, "stroke-width": 12 }));
    // major arteries
    this.svg.appendChild(el("line", { x1: 0, y1: 350, x2: WORLD.w, y2: 350, stroke: major, "stroke-width": 20 }));
    this.svg.appendChild(el("line", { x1: 550, y1: 0, x2: 550, y2: WORLD.h, stroke: major, "stroke-width": 20 }));
  }

  // ---------- markers & route ----------
  clearRoute() {
    this.gRoute.replaceChildren();
    this.gMarkers.replaceChildren();
  }

  showRoute(a: Point, b: Point): Point[] {
    this.clearRoute();
    const pts = routeBetween(a, b);
    const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
    // casing + main line for an Uber-like route
    this.gRoute.appendChild(
      el("path", { d, fill: "none", stroke: "#000", "stroke-width": 11, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: "0.18" })
    );
    this.gRoute.appendChild(
      el("path", { d, fill: "none", stroke: "#000", "stroke-width": 6, "stroke-linecap": "round", "stroke-linejoin": "round" })
    );
    this.addPickup(a);
    this.addDropoff(b);
    return pts;
  }

  private addPickup(p: Point) {
    const g = el("g", { transform: `translate(${p.x} ${p.y})` });
    const ring = el("circle", { r: 10, fill: "#000", opacity: "0.18" });
    const pulse = el("circle", { r: 10, fill: "none", stroke: "#000", "stroke-width": 2 });
    const a = el("animate", { attributeName: "r", values: "10;26", dur: "1.6s", repeatCount: "indefinite" });
    const a2 = el("animate", { attributeName: "opacity", values: "0.5;0", dur: "1.6s", repeatCount: "indefinite" });
    pulse.append(a, a2);
    const dot = el("circle", { r: 8, fill: "#fff", stroke: "#000", "stroke-width": 4 });
    g.append(ring, pulse, dot);
    this.gMarkers.appendChild(g);
  }

  private addDropoff(p: Point) {
    const g = el("g", { transform: `translate(${p.x} ${p.y})` });
    const pin = el("path", {
      d: "M0 0 C-13 -16 -20 -24 -20 -34 C-20 -47 -10 -55 0 -55 C10 -55 20 -47 20 -34 C20 -24 13 -16 0 0 Z",
      fill: "#000",
      transform: "scale(0.62)",
    });
    const hole = el("circle", { cx: 0, cy: -22, r: 6, fill: "#fff" });
    g.append(pin, hole);
    this.gMarkers.appendChild(g);
  }

  // ---------- traffic ----------
  startTraffic(n = 11) {
    this.gTraffic.replaceChildren();
    this.traffic = [];
    for (let i = 0; i < n; i++) {
      const horizontal = Math.random() > 0.5;
      const line = horizontal
        ? GRID_Y[Math.floor(Math.random() * GRID_Y.length)]
        : GRID_X[Math.floor(Math.random() * GRID_X.length)];
      const node = el("g") as SVGGElement;
      node.innerHTML = carTop("#2b2b2b");
      const svgInner = node.firstChild as SVGElement;
      svgInner.setAttribute("width", "26");
      svgInner.setAttribute("height", "26");
      svgInner.setAttribute("x", "-13");
      svgInner.setAttribute("y", "-13");
      svgInner.setAttribute("viewBox", "0 0 24 24");
      svgInner.setAttribute("overflow", "visible");
      this.gTraffic.appendChild(node);
      this.traffic.push({
        node,
        horizontal,
        line,
        pos: Math.random() * (horizontal ? WORLD.w : WORLD.h),
        dir: Math.random() > 0.5 ? 1 : -1,
        speed: 22 + Math.random() * 30,
      });
    }
    this.ensureLoop();
  }

  // ---------- driver ----------
  driveAlong(
    route: Point[],
    speed: number,
    onProgress?: (frac: number) => void,
    onDone?: () => void
  ) {
    const { len, segs } = polylineLength(route);
    this.gDriver.replaceChildren();
    const g = el("g") as SVGGElement;
    g.innerHTML = carTop("#000");
    const inner = g.firstChild as SVGElement;
    inner.setAttribute("width", "34");
    inner.setAttribute("height", "34");
    inner.setAttribute("x", "-17");
    inner.setAttribute("y", "-17");
    inner.setAttribute("overflow", "visible");
    this.gDriver.appendChild(g);
    (this.gDriver as any)._car = g;
    this.driverAnim = { route, segs, len, dist: 0, speed, onProgress, onDone };
    this.ensureLoop();
  }

  /** Place a parked driver car at a point (used while waiting). */
  placeDriverAt(p: Point, angle = 0) {
    this.gDriver.replaceChildren();
    const g = el("g", { transform: `translate(${p.x} ${p.y}) rotate(${angle})` }) as SVGGElement;
    g.innerHTML = carTop("#000");
    const inner = g.firstChild as SVGElement;
    inner.setAttribute("width", "34");
    inner.setAttribute("height", "34");
    inner.setAttribute("x", "-17");
    inner.setAttribute("y", "-17");
    inner.setAttribute("overflow", "visible");
    this.gDriver.appendChild(g);
  }

  clearDriver() {
    this.gDriver.replaceChildren();
    this.driverAnim = null;
  }

  // ---------- animation loop ----------
  private ensureLoop() {
    if (this.raf) return;
    this.last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;

      for (const car of this.traffic) {
        car.pos += car.dir * car.speed * dt;
        const max = car.horizontal ? WORLD.w : WORLD.h;
        if (car.pos > max + 30) car.pos = -30;
        if (car.pos < -30) car.pos = max + 30;
        const x = car.horizontal ? car.pos : car.line;
        const y = car.horizontal ? car.line : car.pos;
        const angle = car.horizontal ? (car.dir > 0 ? 90 : -90) : car.dir > 0 ? 180 : 0;
        car.node.setAttribute("transform", `translate(${x} ${y}) rotate(${angle})`);
      }

      const da = this.driverAnim;
      if (da) {
        da.dist += da.speed * dt;
        const car = (this.gDriver as any)._car as SVGGElement | undefined;
        const p = pointAt(da.route, da.segs, da.dist);
        car?.setAttribute("transform", `translate(${p.x} ${p.y}) rotate(${p.angle})`);
        da.onProgress?.(Math.min(1, da.dist / da.len));
        if (da.dist >= da.len) {
          this.driverAnim = null;
          da.onDone?.();
        }
      }

      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}

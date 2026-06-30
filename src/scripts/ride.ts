/**
 * Ride-booking flow controller.
 * A small state machine driving the panel UI and the live map through the
 * full Uber journey: where → choose → searching → enroute → on trip → arrived.
 */
import { CityMap, routeBetween, routeLength } from "../lib/map";
import {
  geocode,
  suggest,
  distanceKm,
  type Place,
  type Point,
} from "../lib/places";
import {
  RIDE_TYPES,
  estimateFare,
  fmtSAR,
  type RideType,
  type Fare,
} from "../lib/rides";
import { icons, vehicles } from "../lib/icons";

type Step = "where" | "choose" | "searching" | "enroute" | "ontrip" | "done";

interface Driver {
  name: string;
  rating: number;
  car: string;
  plate: string;
}

const DRIVERS: Driver[] = [
  { name: "Mohammed A.", rating: 4.95, car: "Toyota Camry · White", plate: "RUH 4821" },
  { name: "Sara K.", rating: 4.92, car: "Hyundai Sonata · Silver", plate: "RUH 7193" },
  { name: "David L.", rating: 4.89, car: "Lexus ES · Black", plate: "RUH 2056" },
  { name: "Aisha R.", rating: 4.97, car: "Kia K5 · Grey", plate: "RUH 6634" },
  { name: "Omar H.", rating: 4.9, car: "Honda Accord · White", plate: "RUH 3380" },
];

const state = {
  step: "where" as Step,
  pickup: null as Place | null,
  dropoff: null as Place | null,
  route: [] as Point[],
  selectedRideId: "uberx",
  payment: "cash" as "cash" | "card",
  driver: null as Driver | null,
  driverOrigin: null as Point | null,
  fare: null as Fare | null,
  activeField: "pickup" as "pickup" | "dropoff",
};

let map: CityMap;
const timers: number[] = [];
const sheet = document.getElementById("sheet")!;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
const clearTimers = () => {
  while (timers.length) clearTimeout(timers.pop());
};
const after = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

function selectedType(): RideType {
  return RIDE_TYPES.find((r) => r.id === state.selectedRideId) ?? RIDE_TYPES[0];
}
function tripKm() {
  return state.pickup && state.dropoff
    ? distanceKm(state.pickup.pt, state.dropoff.pt)
    : 0;
}

/* ─────────────────────── WHERE ─────────────────────── */
function renderWhere() {
  state.step = "where";
  clearTimers();
  map.clearDriver();
  sheet.innerHTML = `
    <div class="step">
      <h2 class="step-title">Get a ride</h2>
      <div class="route-fields">
        <label class="rf"><span class="glyph origin"></span>
          <input id="in-pickup" type="text" placeholder="Pickup location" autocomplete="off"
            value="${state.pickup ? esc(state.pickup.name) : ""}" /></label>
        <label class="rf"><span class="glyph dest"></span>
          <input id="in-dropoff" type="text" placeholder="Where to?" autocomplete="off"
            value="${state.dropoff ? esc(state.dropoff.name) : ""}" /></label>
      </div>
      <div class="suggestions" id="suggestions"></div>
      <div class="cta-wrap">
        <button class="btn btn-primary btn-block btn-lg" id="see-prices" disabled>See prices</button>
      </div>
    </div>`;

  const pickup = sheet.querySelector<HTMLInputElement>("#in-pickup")!;
  const dropoff = sheet.querySelector<HTMLInputElement>("#in-dropoff")!;
  const sug = sheet.querySelector<HTMLDivElement>("#suggestions")!;
  const cta = sheet.querySelector<HTMLButtonElement>("#see-prices")!;

  const refreshCta = () => {
    cta.disabled = !(pickup.value.trim() && dropoff.value.trim());
  };

  const renderSug = () => {
    const input = state.activeField === "pickup" ? pickup : dropoff;
    const list = suggest(input.value);
    sug.innerHTML = list
      .map(
        (p, i) => `
        <button class="sug" data-i="${i}">
          <span class="sug-ic"><span class="ic">${icons.pin}</span></span>
          <span class="sug-text"><strong>${esc(p.name)}</strong><small>${esc(
          p.detail
        )}</small></span>
        </button>`
      )
      .join("");
    sug.querySelectorAll<HTMLButtonElement>(".sug").forEach((btn) => {
      btn.addEventListener("click", () => {
        const place = list[Number(btn.dataset.i)];
        const target = state.activeField === "pickup" ? pickup : dropoff;
        target.value = place.name;
        if (state.activeField === "pickup") state.pickup = place;
        else state.dropoff = place;
        refreshCta();
        // jump to the empty field for a natural flow
        if (state.activeField === "pickup" && !dropoff.value) {
          state.activeField = "dropoff";
          dropoff.focus();
          renderSug();
        }
      });
    });
  };

  [
    [pickup, "pickup"],
    [dropoff, "dropoff"],
  ].forEach(([inp, field]) => {
    const el = inp as HTMLInputElement;
    el.addEventListener("focus", () => {
      state.activeField = field as "pickup" | "dropoff";
      renderSug();
    });
    el.addEventListener("input", () => {
      renderSug();
      refreshCta();
    });
  });

  cta.addEventListener("click", () => {
    state.pickup = geocode(pickup.value);
    state.dropoff = geocode(dropoff.value);
    state.route = map.showRoute(state.pickup.pt, state.dropoff.pt);
    renderChoose();
  });

  refreshCta();
  renderSug();
}

/* ─────────────────────── CHOOSE ─────────────────────── */
function renderChoose() {
  state.step = "choose";
  clearTimers();
  map.clearDriver();
  if (state.pickup && state.dropoff)
    state.route = map.showRoute(state.pickup.pt, state.dropoff.pt);

  const km = tripKm();
  const sel = selectedType();

  const rows = RIDE_TYPES.map((t) => {
    const fare = estimateFare(t, km);
    const selected = t.id === state.selectedRideId;
    return `
      <button class="ride-row" data-id="${t.id}" aria-selected="${selected}">
        <span class="veh">${vehicles[t.vehicle]}</span>
        <span class="ride-info">
          <span class="rn">${t.name}
            <span class="cap"><span class="ic">${icons.person}</span>${t.capacity}</span>
            ${t.badge ? `<span class="ride-badge">${t.badge}</span>` : ""}
          </span>
          <span class="meta"><span class="fast">${t.etaMin} min away</span> · ${esc(
      t.blurb
    )}</span>
        </span>
        <span class="ride-price">
          <span class="p">${fmtSAR(fare.price)}</span>
          ${fare.oldPrice ? `<span class="old">${fmtSAR(fare.oldPrice)}</span>` : ""}
        </span>
      </button>`;
  }).join("");

  const payIcon = state.payment === "cash" ? icons.cash : icons.card;
  const payLabel = state.payment === "cash" ? "Cash" : "Visa •••• 4242";

  sheet.innerHTML = `
    <div class="step">
      <div class="trip-summary">
        <span class="ts-line"><b>${esc(state.pickup?.name ?? "")}</b> → ${esc(
    state.dropoff?.name ?? ""
  )}</span>
        <button class="edit-link" id="edit-trip">Edit</button>
      </div>
      <h2 class="step-title">Choose a ride</h2>
      <div class="ride-list" id="ride-list">${rows}</div>
      <div class="pay-row" id="pay-row">
        <span class="pay-left"><span class="ic">${payIcon}</span>${payLabel}</span>
        <span class="ic chev">${icons.chevronRight}</span>
      </div>
      <div class="cta-wrap">
        <button class="btn btn-primary btn-block btn-lg" id="request">Request ${
          sel.name
        }</button>
      </div>
    </div>`;

  sheet.querySelector("#edit-trip")!.addEventListener("click", renderWhere);

  const requestBtn = sheet.querySelector<HTMLButtonElement>("#request")!;
  sheet.querySelectorAll<HTMLButtonElement>(".ride-row").forEach((row) => {
    row.addEventListener("click", () => {
      state.selectedRideId = row.dataset.id!;
      sheet
        .querySelectorAll(".ride-row")
        .forEach((r) => r.setAttribute("aria-selected", String(r === row)));
      requestBtn.textContent = `Request ${selectedType().name}`;
    });
  });

  sheet.querySelector("#pay-row")!.addEventListener("click", () => {
    state.payment = state.payment === "cash" ? "card" : "cash";
    renderChoose();
  });

  requestBtn.addEventListener("click", () => {
    state.fare = estimateFare(selectedType(), km);
    renderSearching();
  });
}

/* ─────────────────────── SEARCHING ─────────────────────── */
function renderSearching() {
  state.step = "searching";
  clearTimers();
  const t = selectedType();
  sheet.innerHTML = `
    <div class="step">
      <div class="status-banner">
        <div class="spinner"></div>
        <div>
          <h2 class="step-title" style="margin:0">Connecting you with a top driver…</h2>
          <p class="muted">Finding your ${esc(t.name)} nearby</p>
        </div>
      </div>
      <div class="cta-wrap">
        <button class="btn btn-secondary btn-block" id="cancel">Cancel</button>
      </div>
    </div>`;
  sheet.querySelector("#cancel")!.addEventListener("click", renderChoose);

  // pick a driver + an origin a short distance from pickup
  state.driver = DRIVERS[Math.floor(Math.random() * DRIVERS.length)];
  const pk = state.pickup!.pt;
  const ang = Math.random() * Math.PI * 2;
  const dist = 150 + Math.random() * 120;
  state.driverOrigin = {
    x: Math.max(60, Math.min(940, pk.x + Math.cos(ang) * dist)),
    y: Math.max(60, Math.min(640, pk.y + Math.sin(ang) * dist)),
  };
  map.placeDriverAt(state.driverOrigin);

  after(2400, renderEnroute);
}

/* ─────────────────────── ENROUTE (driver → pickup) ─────────────────────── */
function renderEnroute() {
  state.step = "enroute";
  clearTimers();
  const d = state.driver!;
  const t = selectedType();
  const initials = d.name.charAt(0);

  sheet.innerHTML = `
    <div class="step">
      <div class="status-banner">
        <div class="eta-pill"><b id="eta">${t.etaMin}</b><small>MIN AWAY</small></div>
        <div><h2 class="step-title" style="margin:0">${esc(
          d.name
        )} is on the way</h2>
        <p class="muted">Meet your driver at the pickup point</p></div>
      </div>
      <div class="driver-card">
        <div class="avatar">${initials}</div>
        <div class="driver-meta">
          <div class="dn">${esc(d.name)}</div>
          <div class="rating"><span class="ic">${icons.star}</span>${d.rating.toFixed(
    2
  )}</div>
        </div>
        <div class="plate"><div class="car">${esc(d.car)}</div>
          <span class="num">${esc(d.plate)}</span></div>
      </div>
      <div class="contact-row">
        <button class="round-btn" id="call"><span class="ic">${icons.phone}</span>Call</button>
        <button class="round-btn" id="msg"><span class="ic">${icons.message}</span>Message</button>
      </div>
      <div class="info-line"><span class="ic">${icons.shield}</span>Your trip is protected with safety features</div>
      <div class="cta-wrap">
        <button class="btn btn-secondary btn-block" id="cancel">Cancel trip</button>
      </div>
    </div>`;

  sheet.querySelector("#cancel")!.addEventListener("click", renderChoose);
  const etaEl = sheet.querySelector("#eta")!;

  const driverRoute = routeBetween(state.driverOrigin!, state.pickup!.pt);
  const dur = 7; // seconds (compressed)
  map.driveAlong(
    driverRoute,
    routeLength(driverRoute) / dur,
    (frac) => {
      etaEl.textContent = String(Math.max(1, Math.ceil((1 - frac) * t.etaMin)));
    },
    () => renderOnTrip()
  );
}

/* ─────────────────────── ON TRIP (pickup → dropoff) ─────────────────────── */
function renderOnTrip() {
  state.step = "ontrip";
  clearTimers();
  const d = state.driver!;
  const tripMin = state.fare?.tripMin ?? 8;

  sheet.innerHTML = `
    <div class="step">
      <div class="status-banner">
        <div class="eta-pill"><b id="eta">${tripMin}</b><small>MIN LEFT</small></div>
        <div><h2 class="step-title" style="margin:0">On trip</h2>
        <p class="muted">Heading to ${esc(state.dropoff?.name ?? "destination")}</p></div>
      </div>
      <div class="progress"><span id="bar"></span></div>
      <div class="driver-card" style="padding-top:4px">
        <div class="avatar">${d.name.charAt(0)}</div>
        <div class="driver-meta"><div class="dn">${esc(d.name)}</div>
          <div class="rating"><span class="ic">${icons.star}</span>${d.rating.toFixed(
    2
  )} · ${esc(d.car)}</div></div>
      </div>
      <div class="info-line"><span class="ic">${icons.shield}</span>Share trip status with a contact</div>
    </div>`;

  const bar = sheet.querySelector<HTMLSpanElement>("#bar")!;
  const etaEl = sheet.querySelector("#eta")!;

  // ensure the trip route is shown and drive it
  if (state.pickup && state.dropoff)
    state.route = map.showRoute(state.pickup.pt, state.dropoff.pt);
  const dur = 9;
  map.driveAlong(
    state.route,
    routeLength(state.route) / dur,
    (frac) => {
      bar.style.width = `${Math.round(frac * 100)}%`;
      etaEl.textContent = String(Math.max(1, Math.ceil((1 - frac) * tripMin)));
    },
    () => renderDone()
  );
}

/* ─────────────────────── DONE ─────────────────────── */
function renderDone() {
  state.step = "done";
  clearTimers();
  map.clearDriver();
  const price = state.fare?.price ?? 0;
  sheet.innerHTML = `
    <div class="step">
      <h2 class="step-title center">You've arrived 🎉</h2>
      <div class="fare-final">
        <div class="amt">${fmtSAR(price)}</div>
        <p class="muted">Paid with ${
          state.payment === "cash" ? "Cash" : "Visa •••• 4242"
        }</p>
      </div>
      <p class="center" style="margin-top:18px;font-weight:600">Rate your trip with ${esc(
        state.driver?.name ?? "your driver"
      )}</p>
      <div class="star-row" id="stars">
        ${[1, 2, 3, 4, 5]
          .map((n) => `<button data-n="${n}"><span class="ic">${icons.star}</span></button>`)
          .join("")}
      </div>
      <div class="cta-wrap">
        <button class="btn btn-primary btn-block btn-lg" id="done">Done</button>
      </div>
    </div>`;

  const stars = sheet.querySelectorAll<HTMLButtonElement>("#stars button");
  stars.forEach((btn) => {
    btn.addEventListener("click", () => {
      const n = Number(btn.dataset.n);
      stars.forEach((b) => b.classList.toggle("on", Number(b.dataset.n) <= n));
    });
  });

  sheet.querySelector("#done")!.addEventListener("click", () => {
    state.pickup = null;
    state.dropoff = null;
    state.route = [];
    state.driver = null;
    state.fare = null;
    map.clearRoute();
    map.clearDriver();
    renderWhere();
  });
}

/* ─────────────────────── boot ─────────────────────── */
function init() {
  const mapEl = document.getElementById("map")!;
  map = new CityMap(mapEl);
  map.startTraffic();

  const params = new URLSearchParams(location.search);
  const p = params.get("pickup");
  const d = params.get("dropoff");
  if (p && d) {
    state.pickup = geocode(p);
    state.dropoff = geocode(d);
    state.route = map.showRoute(state.pickup.pt, state.dropoff.pt);
    renderChoose();
  } else {
    if (p) state.pickup = geocode(p);
    if (d) state.dropoff = geocode(d);
    renderWhere();
  }
}

init();

# Uber — ride-hailing web app

A full Uber-style ride-hailing web application built with [Astro](https://astro.build/)
and deployed to Cloudflare Workers as a static site. It replicates Uber's
black-and-white "Base" design language — typography, colours, layout and the
core ride-booking experience.

> Educational / demonstration clone. Not affiliated with Uber Technologies Inc.
> Trademarks belong to their respective owners.

<!-- dash-content-start -->

## Features

- ✅ **Marketing landing page** — "Go anywhere with Uber" hero with a request-a-ride
  card, suggestion cards, driver & business sections, and app-download blocks.
- ✅ **Interactive ride-booking app** (`/ride`) with a complete journey:
  - Self-contained **SVG city map** (street grid, parks, water, animated traffic) —
    no map tiles, API keys or network needed, so it renders identically everywhere.
  - Location search with autocomplete suggestions and saved places.
  - **Ride selection** (UberX, Comfort, Uber Green, UberXL, Uber Black, Uber Moto)
    with vehicle art, capacities, ETAs and live fare estimates.
  - Payment toggle, request flow, **driver matching**, live **driver tracking**,
    on-trip progress and an arrival + rating screen.
- ✅ **Auth screens** — Uber-style log in / sign up with social options.
- ✅ **Drive with Uber** marketing page.
- ✅ Fully **responsive** — desktop split view collapses to a mobile bottom sheet.

## Project structure

```
src/
  layouts/Base.astro        # HTML shell, fonts, meta
  components/               # Logo, Navbar, SiteFooter, MapArt, AuthShell
  pages/
    index.astro             # Landing page
    ride.astro              # Ride-booking app shell + styles
    login.astro / signup.astro
    drive.astro
  scripts/ride.ts           # Ride flow state machine
  lib/
    map.ts                  # Self-contained SVG map renderer
    places.ts               # Synthetic geocoder + suggestions
    rides.ts                # Ride catalog + fare estimation
    icons.ts                # Inline SVG icon set + vehicle art
  styles/global.css         # Uber design system (tokens, buttons, utilities)
```

<!-- dash-content-end -->

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                           | Action                                       |
| :-------------------------------- | :------------------------------------------- |
| `npm install`                     | Installs dependencies                        |
| `npm run dev`                     | Starts local dev server at `localhost:4321`  |
| `npm run build`                   | Build your production site to `./dist/`      |
| `npm run preview`                 | Preview the build locally before deploying   |
| `npm run build && npm run deploy` | Deploy the production site to Cloudflare     |

## Tech notes

- The map is drawn entirely in SVG and animated with `requestAnimationFrame`, so
  there are **no external runtime dependencies** (no tiles, no API keys).
- Typography uses **Inter** (loaded from Google Fonts) as a close stand-in for
  Uber Move, gracefully falling back to the system font stack if unavailable.
- Everything is prerendered to static HTML; the interactive ride flow runs fully
  client-side.

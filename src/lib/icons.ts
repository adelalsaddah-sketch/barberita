/**
 * Inline SVG icon set used across Astro components and client scripts.
 * Every icon uses `currentColor` so it inherits text color.
 * Each export is a raw SVG string. Render in Astro with `set:html`.
 */

const wrap = (inner: string, vb = "0 0 24 24") =>
  `<svg viewBox="${vb}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${inner}</svg>`;

export const icons = {
  menu: wrap(
    '<path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  ),
  close: wrap(
    '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  ),
  search: wrap(
    '<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  ),
  chevronDown: wrap(
    '<path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  ),
  chevronRight: wrap(
    '<path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  ),
  chevronLeft: wrap(
    '<path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  ),
  arrowRight: wrap(
    '<path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  ),
  user: wrap(
    '<circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  ),
  star: wrap(
    '<path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.2l1-5.9L3.5 9.2l5.9-.8L12 3z" fill="currentColor"/>'
  ),
  clock: wrap(
    '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  ),
  calendar: wrap(
    '<rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2"/><path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  ),
  person: wrap(
    '<circle cx="12" cy="7" r="3.2" stroke="currentColor" stroke-width="2"/><path d="M6 20c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  ),
  card: wrap(
    '<rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/><path d="M2 9h20" stroke="currentColor" stroke-width="2"/><path d="M6 15h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  ),
  cash: wrap(
    '<rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="2"/>'
  ),
  shield: wrap(
    '<path d="M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  ),
  phone: wrap(
    '<path d="M5 4h3l2 5-2 1c1 2.5 2.5 4 5 5l1-2 5 2v3c0 1-1 2-2 2C12 20 4 12 3 6c0-1 1-2 2-2z" fill="currentColor"/>'
  ),
  message: wrap(
    '<path d="M4 5h16a1 1 0 011 1v9a1 1 0 01-1 1H9l-4 4v-4H4a1 1 0 01-1-1V6a1 1 0 011-1z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
  ),
  plus: wrap(
    '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  ),
  minus: wrap(
    '<path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  ),
  check: wrap(
    '<path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
  ),
  pin: wrap(
    '<path d="M12 22s7-6.3 7-12a7 7 0 10-14 0c0 5.7 7 12 7 12z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.5" stroke="currentColor" stroke-width="2"/>'
  ),
  square: wrap('<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>'),
  dot: wrap('<circle cx="12" cy="12" r="6" fill="currentColor"/>'),
  globe: wrap(
    '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18" stroke="currentColor" stroke-width="1.6"/>'
  ),
  bell: wrap(
    '<path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 19a2 2 0 004 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  ),
  promo: wrap(
    '<path d="M3 9l9-5 9 5v6l-9 5-9-5V9z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 12l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  ),
  package: wrap(
    '<path d="M21 8l-9-5-9 5 9 5 9-5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M3 8v8l9 5 9-5V8M12 13v8" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
  ),
  reserve: wrap(
    '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  ),
  rental: wrap(
    '<path d="M5 16l1.5-4.5A2 2 0 018.4 10h7.2a2 2 0 011.9 1.5L19 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="16" width="18" height="3" rx="1" stroke="currentColor" stroke-width="2"/>'
  ),
  // ---- Marketing / value icons ----
  briefcase: wrap(
    '<rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2"/>'
  ),
  wallet: wrap(
    '<rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M16 12h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  ),
  // ---- Social ----
  facebook: wrap(
    '<path d="M14 9h3V5h-3c-2.2 0-4 1.8-4 4v2H7v4h3v6h4v-6h3l1-4h-4V9c0-.6.4-1 1-1z" fill="currentColor"/>'
  ),
  x: wrap(
    '<path d="M4 3l7 9-7 9h2.5L13 14l5.5 7H21l-7.5-9.5L20.5 3H18l-5 6.5L8 3H4z" fill="currentColor"/>'
  ),
  instagram: wrap(
    '<rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>'
  ),
  linkedin: wrap(
    '<rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="2"/><path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 014 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  ),
  youtube: wrap(
    '<rect x="3" y="6" width="18" height="12" rx="4" stroke="currentColor" stroke-width="2"/><path d="M10 9.5l5 2.5-5 2.5v-5z" fill="currentColor"/>'
  ),
  google: wrap(
    '<path d="M21 12.2c0-.6 0-1.2-.2-1.8H12v3.6h5.1a4.4 4.4 0 01-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.1 2.7-7.1z" fill="#4285F4"/><path d="M12 21c2.5 0 4.6-.8 6.1-2.2l-3.1-2.4c-.8.6-1.9.9-3 .9-2.3 0-4.3-1.6-5-3.7H3.8v2.4A9 9 0 0012 21z" fill="#34A853"/><path d="M7 13.6a5.4 5.4 0 010-3.4V7.8H3.8a9 9 0 000 8.1L7 13.6z" fill="#FBBC05"/><path d="M12 6.9c1.3 0 2.5.5 3.4 1.4l2.6-2.6A9 9 0 003.8 7.8L7 10.2c.7-2.1 2.7-3.3 5-3.3z" fill="#EA4335"/>',
    "0 0 24 24"
  ),
  apple: wrap(
    '<path d="M16 12.5c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.9-3.6 2.2-1.5 2.7-.4 6.6 1.1 8.8.7 1 1.6 2.2 2.7 2.2s1.5-.7 2.8-.7 1.7.7 2.8.7 1.9-1 2.6-2c.8-1.2 1.2-2.3 1.2-2.4-.1 0-2.2-.9-2.2-3.7zM14 6c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .1 2-.5 2.5-1.2z" fill="currentColor"/>'
  ),
};

/* ---- Side-view vehicle silhouettes for the ride picker (viewBox 0 0 64 36) ---- */
export const vehicles: Record<string, string> = {
  sedan: `<svg viewBox="0 0 64 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 24c-2 0-3-1-3-3s1-3 3-4l5-1 6-6c1.6-1.6 3.4-2 6-2h12c3 0 4.6.8 6.4 3l3.6 4 5 1.4c2.4.7 4 1.8 4 4.6 0 2-1 3-3 3" fill="#111"/><path d="M20 9h9l3 5H18l2-5z" fill="#cfd6dd"/><path d="M31 9h6c2 0 3 .6 4 2l2 3h-9l-3-5z" fill="#cfd6dd"/><circle cx="17" cy="25" r="5" fill="#111"/><circle cx="17" cy="25" r="2.2" fill="#888"/><circle cx="47" cy="25" r="5" fill="#111"/><circle cx="47" cy="25" r="2.2" fill="#888"/></svg>`,
  suv: `<svg viewBox="0 0 64 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M5 25c-2 0-3-1-3-3v-4c0-2 1-3 3-3l4-1 5-6c1.4-1.6 3-2 5-2h18c2.6 0 4 .6 5.6 2.4L51 13l5 1c2.4.5 3 2 3 4v4c0 2-1 3-3 3" fill="#0a0a0a"/><path d="M16 6h8v8H10l4-6c.6-1.2 1-2 2-2z" fill="#cfd6dd"/><path d="M26 6h10c1.6 0 2.6.4 3.6 1.6L44 14H26V6z" fill="#cfd6dd"/><circle cx="17" cy="26" r="5.2" fill="#111"/><circle cx="17" cy="26" r="2.2" fill="#888"/><circle cx="47" cy="26" r="5.2" fill="#111"/><circle cx="47" cy="26" r="2.2" fill="#888"/></svg>`,
  luxury: `<svg viewBox="0 0 64 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4 24c-1.6 0-2-1-2-2.6 0-2 .8-3 3-3.6l6-1.6 7-5.4c1.8-1.4 3.6-1.8 6-1.8h13c3.4 0 5 1 7 3.4l3.2 3.8 4.4 1.2c2.4.6 3 1.8 3 4 0 1.8-1 2.6-2.6 2.6" fill="#000"/><path d="M22 11h9l2.4 5H19.5L22 11z" fill="#3a4654"/><path d="M33 11h6c2 0 3 .6 4.2 2.2L46 16h-10l-3-5z" fill="#3a4654"/><circle cx="17" cy="25" r="5" fill="#111"/><circle cx="17" cy="25" r="2" fill="#aaa"/><circle cx="48" cy="25" r="5" fill="#111"/><circle cx="48" cy="25" r="2" fill="#aaa"/></svg>`,
  moto: `<svg viewBox="0 0 64 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="14" cy="25" r="7" fill="none" stroke="#111" stroke-width="3"/><circle cx="50" cy="25" r="7" fill="none" stroke="#111" stroke-width="3"/><path d="M14 25l9-9h10l5 9" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 16l4-5h6" stroke="#111" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M38 16h8" stroke="#111" stroke-width="3" stroke-linecap="round"/></svg>`,
  green: `<svg viewBox="0 0 64 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 24c-2 0-3-1-3-3s1-3 3-4l5-1 6-6c1.6-1.6 3.4-2 6-2h12c3 0 4.6.8 6.4 3l3.6 4 5 1.4c2.4.7 4 1.8 4 4.6 0 2-1 3-3 3" fill="#0a7a3f"/><path d="M20 9h9l3 5H18l2-5z" fill="#bfeacb"/><path d="M31 9h6c2 0 3 .6 4 2l2 3h-9l-3-5z" fill="#bfeacb"/><circle cx="17" cy="25" r="5" fill="#111"/><circle cx="17" cy="25" r="2.2" fill="#888"/><circle cx="47" cy="25" r="5" fill="#111"/><circle cx="47" cy="25" r="2.2" fill="#888"/></svg>`,
};

/* Top-down car marker for the map (viewBox 0 0 24 24) */
export const carTop = (color = "#000") =>
  `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="2" width="10" height="20" rx="4" fill="${color}"/><rect x="8.5" y="5" width="7" height="5" rx="1.6" fill="#9fc3ef"/><rect x="8.5" y="14" width="7" height="4" rx="1.4" fill="#3b3b3b"/></svg>`;

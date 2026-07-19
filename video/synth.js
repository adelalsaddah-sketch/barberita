// Pure-Node PCM synthesizer for Pop Pop Bubble!
'use strict';
const SR = 44100;
const TAU = Math.PI * 2;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

// mulberry32 — deterministic noise so renders are reproducible
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 * 2 - 1; }; }

// RBJ biquad, processes buffer in place
function biquad(buf, type, f0, Q) {
  const w0 = TAU * Math.min(f0, SR * 0.45) / SR, cw = Math.cos(w0), sw = Math.sin(w0), al = sw / (2 * Q);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lp') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; }
  else if (type === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; }
  else { b0 = al; b1 = 0; b2 = -al; } // bp
  a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al;
  b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < buf.length; i++) {
    const x = buf[i], y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y; buf[i] = y;
  }
}

function adsr(buf, a, d, s, r, durSec) {
  const n = buf.length, aN = a * SR, dN = d * SR, rN = r * SR;
  const gateN = Math.min(n, Math.max(aN + dN, durSec * SR));
  for (let i = 0; i < n; i++) {
    let g;
    if (i < aN) g = i / aN;
    else if (i < aN + dN) g = 1 - (1 - s) * ((i - aN) / dN);
    else if (i < gateN) g = s;
    else g = s * Math.max(0, 1 - (i - gateN) / rN);
    buf[i] *= g;
  }
}

const saw = ph => 2 * (ph - Math.floor(ph + 0.5));
const tri = ph => 4 * Math.abs(ph - Math.floor(ph + 0.5)) - 1;

// each instrument: (e) => {buf, tail, send}
const INSTRUMENTS = {
  kick(e) {
    const n = Math.floor(0.22 * SR), buf = new Float32Array(n);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR, f = 45 + 130 * Math.exp(-t * 30);
      ph += f / SR;
      buf[i] = Math.sin(TAU * ph) * Math.exp(-t * 13) + (i < 40 ? (1 - i / 40) * 0.5 : 0);
    }
    return { buf, send: 0 };
  },
  clap(e) {
    const n = Math.floor(0.28 * SR), buf = new Float32Array(n), nz = rng(7);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      let env = Math.exp(-t * 22);
      for (const off of [0, 0.012, 0.024]) if (t >= off && t < off + 0.004) env = 1;
      buf[i] = nz() * env;
    }
    biquad(buf, 'bp', 1400, 1.2);
    return { buf, send: 0.12 };
  },
  hat(e) {
    const n = Math.floor(0.07 * SR), buf = new Float32Array(n), nz = rng(11);
    for (let i = 0; i < n; i++) buf[i] = nz() * Math.exp(-i / SR * 60);
    biquad(buf, 'hp', 7500, 0.8);
    return { buf, send: 0 };
  },
  bass(e) {
    const durN = Math.floor((e.dur + 0.1) * SR), buf = new Float32Array(durN);
    const f = mtof(e.midi);
    let p1 = 0, p2 = 0;
    for (let i = 0; i < durN; i++) {
      p1 += f / SR; p2 += (f / 2) / SR;
      buf[i] = saw(p1) * 0.6 + Math.sin(TAU * p2 * 2) * 0.45;
    }
    biquad(buf, 'lp', 520, 0.9);
    adsr(buf, 0.004, 0.09, 0.75, 0.06, e.dur);
    return { buf, send: 0 };
  },
  pluck(e) {
    const n = Math.floor((e.dur + 0.15) * SR), buf = new Float32Array(n);
    const f = mtof(e.midi);
    let p1 = 0, p2 = 0;
    for (let i = 0; i < n; i++) {
      p1 += f * 0.998 / SR; p2 += f * 1.002 / SR;
      buf[i] = (saw(p1) + saw(p2)) * 0.5 * Math.exp(-i / SR * 9);
    }
    biquad(buf, 'lp', 1900, 0.8);
    return { buf, send: 0.15 };
  },
  lead(e) {
    const n = Math.floor((e.dur + 0.15) * SR), buf = new Float32Array(n);
    const f0 = mtof(e.midi), f1 = e.glideTo ? mtof(e.glideTo) : f0;
    let p1 = 0, p2 = 0, p3 = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR, k = Math.min(1, t / Math.max(0.01, e.dur));
      const vib = t > 0.12 ? 1 + 0.007 * Math.sin(TAU * 5.5 * t) : 1;
      const f = f0 * Math.pow(f1 / f0, k) * vib;
      p1 += f * 0.996 / SR; p2 += f * 1.004 / SR; p3 += f / SR;
      buf[i] = (saw(p1) + saw(p2)) * 0.38 + Math.sin(TAU * p3) * 0.3;
    }
    biquad(buf, 'lp', 2600, 0.85);
    adsr(buf, 0.018, 0.1, 0.8, 0.09, e.dur);
    return { buf, send: 0.22 };
  },
  sparkle(e) {
    const n = Math.floor(0.35 * SR), buf = new Float32Array(n);
    const f = mtof(e.midi);
    let ph = 0;
    for (let i = 0; i < n; i++) { ph += f / SR; buf[i] = (tri(ph) * 0.6 + Math.sin(TAU * ph * 2) * 0.4) * Math.exp(-i / SR * 11); }
    return { buf, send: 0.5 };
  },
  popsfx(e) {
    const big = !!e.big;
    const n = Math.floor((big ? 0.45 : 0.12) * SR), buf = new Float32Array(n), nz = rng(3 + (e.midi | 0));
    const fStart = (big ? 750 : 950) * (1 + (e.midi % 12) * 0.03), fEnd = big ? 140 : 380;
    const sweepT = big ? 0.09 : 0.045;
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR, k = Math.min(1, t / sweepT);
      ph += (fStart * Math.pow(fEnd / fStart, k)) / SR;
      let s = Math.sin(TAU * ph) * Math.exp(-t * (big ? 11 : 35));
      if (i < 90) s += nz() * (1 - i / 90) * 0.8;             // click
      if (big) s += Math.sin(TAU * 70 * t) * Math.exp(-t * 9) * 0.8; // thump
      buf[i] = s;
    }
    return { buf, send: big ? 0.3 : 0.15 };
  },
  riser(e) {
    const n = Math.floor(e.dur * SR), buf = new Float32Array(n), nz = rng(5);
    const f0 = mtof(e.midi);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR, k = i / n;
      ph += f0 * Math.pow(4, k) / SR;
      buf[i] = Math.sin(TAU * ph) * 0.5 * k + nz() * 0.22 * k * k;
    }
    biquad(buf, 'hp', 500, 0.7);
    adsr(buf, 0.05, 0.01, 1, 0.15, e.dur);
    return { buf, send: 0.35 };
  },
};

const GAIN = { kick: 0.95, clap: 0.55, hat: 0.4, bass: 0.5, pluck: 0.32, lead: 0.62, sparkle: 0.3, popsfx: 0.85, riser: 0.5 };

function renderSong(events, duration) {
  const len = Math.ceil((duration + 2.5) * SR);
  const L = new Float32Array(len), R = new Float32Array(len);
  const sendL = new Float32Array(len), sendR = new Float32Array(len);
  for (const e of events) {
    const inst = INSTRUMENTS[e.inst];
    if (!inst) throw new Error('unknown instrument ' + e.inst);
    const { buf, send } = inst(e);
    const start = Math.floor(e.t * SR);
    const pan = e.pan || 0, gl = Math.min(1, 1 - pan) * e.vel * GAIN[e.inst], gr = Math.min(1, 1 + pan) * e.vel * GAIN[e.inst];
    for (let i = 0; i < buf.length && start + i < len; i++) {
      const s = buf[i];
      L[start + i] += s * gl; R[start + i] += s * gr;
      if (send) { sendL[start + i] += s * gl * send; sendR[start + i] += s * gr * send; }
    }
  }
  // ping-pong delay (dotted eighth @115bpm)
  const dN = Math.floor(0.391 * SR), fb = 0.34;
  for (let i = 0; i < len; i++) {
    const j = i - dN;
    if (j >= 0) { sendL[i] += sendR[j] * fb; sendR[i] += sendL[j] * fb; }
    if (j >= 0) { L[i] += sendR[j] * 0.5; R[i] += sendL[j] * 0.5; }
  }
  // soft clip master
  for (let i = 0; i < len; i++) { L[i] = Math.tanh(L[i] * 0.9); R[i] = Math.tanh(R[i] * 0.9); }
  // normalize to -1.2 dBFS
  let peak = 0;
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const norm = peak > 0 ? 0.87 / peak : 1;
  return { L, R, norm, len };
}

function writeWav(path, { L, R, norm, len }) {
  const fs = require('fs');
  const data = Buffer.alloc(len * 4);
  for (let i = 0; i < len; i++) {
    data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * norm * 32767))), i * 4);
    data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * norm * 32767))), i * 4 + 2);
  }
  const hdr = Buffer.alloc(44);
  hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + data.length, 4); hdr.write('WAVE', 8);
  hdr.write('fmt ', 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22);
  hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34);
  hdr.write('data', 36); hdr.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path, Buffer.concat([hdr, data]));
}

module.exports = { renderSong, writeWav, SR };

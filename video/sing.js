// Singing synthesis for Pop Pop Bubble! — espeak-ng phonemes + MBROLA diphone
// rendering, with per-syllable pitch/duration retargeted to the melody.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SR = 44100;
const MB_DB = { us1: '/usr/share/mbrola/us1/us1', us2: '/usr/share/mbrola/us2/us2' };
const CACHE = path.join(__dirname, 'dist', 'vocache');
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

// respellings so espeak pronounces isolated syllables correctly
const PRON = {
  pop: 'pop', ba: 'bay', by: 'bee', pan: 'pan', da: 'duh',
  mom: 'mom', my: 'mee', dad: 'dad', dy: 'dee',
  grand: 'grand', ma: 'mah', pa: 'pah',
  tee: 'tee', ny: 'nee', ti: 'tie',
  bub: 'bub', ble: 'bull',
  boun: 'bown', cy: 'see',
  big: 'big', and: 'and', wob: 'wob', bly: 'blee',
  spark: 'spark', ly: 'lee', swir: 'swur',
  the: 'thuh', gest: 'guest', e: 'eh', ver: 'vur',
  whoa: 'whoa', up: 'up', he: 'hee', goes: 'goze',
  it: 'it', all: 'all', to: 'tuh', ge: "[[g'E]]", ther: 'thur',
  ev: 'ev', ery: 'ree', bo: 'buh', rea: 'reh',
  one: 'one', two: 'two', three: 'three',
  hoo: 'hoo', ray: 'ray',
};
const VOWEL = /[aeiouAEIOU@{V]|r=/;

function phonemesFor(word, voice) {
  const out = execFileSync('espeak-ng', ['-v', 'mb-' + voice, '-q', '--pho', word], { encoding: 'utf8' });
  const ph = [];
  for (const line of out.trim().split('\n')) {
    const parts = line.trim().split(/\s+/);
    if (!parts[0] || parts[0] === '_') continue;
    ph.push({ sym: parts[0], dur: parseFloat(parts[1]) });
  }
  return ph;
}

// retarget phoneme durations + pitch to a note; returns .pho text
function buildPho(ph, durMs, hz, opts = {}) {
  const isV = p => VOWEL.test(p.sym);
  let natural = ph.reduce((a, p) => a + p.dur, 0);
  const vowels = ph.filter(isV);
  const target = Math.max(90, durMs * 0.94);
  if (vowels.length === 0) { ph.forEach(p => p.dur *= target / natural); }
  else if (natural < target) {
    const extra = (target - natural) / vowels.length;
    vowels.forEach(p => p.dur += extra);
  } else {
    const scale = target / natural;
    ph.forEach(p => { p.dur = Math.max(isV(p) ? 40 : 22, p.dur * scale); });
  }
  const total = ph.reduce((a, p) => a + p.dur, 0);
  // pitch contour across the whole syllable
  const f = pos => { // pos 0..1 over the full syllable
    let base = hz;
    if (opts.glideHz) base = hz * Math.pow(opts.glideHz / hz, pos);
    let v = base * (pos < 0.06 ? 0.97 + 0.5 * pos : 1); // tiny scoop-in
    if (opts.vib && pos > 0.35) v *= 1 + 0.02 * Math.sin(pos * total / 1000 * 2 * Math.PI * 5.2);
    return Math.round(v);
  };
  let acc = 0, lines = [];
  for (const p of ph) {
    const pts = [];
    for (const q of [0, 50, 100]) pts.push(q, f((acc + p.dur * q / 100) / total));
    lines.push(`${p.sym} ${Math.round(p.dur)} ${pts.join(' ')}`);
    acc += p.dur;
  }
  return lines.join('\n') + '\n_ 12\n';
}

function readWavMono(file) {
  const b = fs.readFileSync(file);
  const rate = b.readUInt32LE(24);
  let off = 12; // walk chunks to find 'data'
  while (off < b.length) {
    const id = b.toString('ascii', off, off + 4), sz = b.readUInt32LE(off + 4);
    if (id === 'data') {
      const n = Math.floor(sz / 2), s = new Float32Array(n);
      for (let i = 0; i < n; i++) s[i] = b.readInt16LE(off + 8 + i * 2) / 32768;
      return { s, rate };
    }
    off += 8 + sz + (sz % 2);
  }
  throw new Error('no data chunk in ' + file);
}

function resampleTo(s, from, to) {
  if (from === to) return s;
  const n = Math.floor(s.length * to / from), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i * from / to, j = Math.floor(x), k = x - j;
    out[i] = s[j] + (s[Math.min(j + 1, s.length - 1)] - s[j]) * k;
  }
  return out;
}

let counter = 0;
function synthSyl(sylRaw, midi, durMs, voice, opts = {}) {
  const syl = sylRaw.toLowerCase().replace(/[^a-z]/g, '');
  const word = PRON[syl] || syl || 'ah';
  const hz = Math.round(mtof(midi));
  const key = `${voice}-${word.replace(/[^a-z]/g, '')}-${hz}-${Math.round(durMs / 12)}-${opts.glideHz | 0}-${opts.vib ? 1 : 0}`;
  const cacheFile = path.join(CACHE, key + '.f32');
  if (fs.existsSync(cacheFile)) {
    const b = fs.readFileSync(cacheFile);
    return new Float32Array(b.buffer, b.byteOffset, b.length / 4);
  }
  const ph = phonemesFor(word, voice);
  const pho = buildPho(ph, durMs, hz, opts);
  const id = counter++;
  const phoF = path.join(CACHE, `t${id}.pho`), wavF = path.join(CACHE, `t${id}.wav`);
  fs.writeFileSync(phoF, pho);
  execFileSync('mbrola', [MB_DB[voice], phoF, wavF]);
  const { s, rate } = readWavMono(wavF);
  const out = resampleTo(s, rate, SR);
  // normalize each syllable so layers balance
  let peak = 0;
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) for (let i = 0; i < out.length; i++) out[i] *= 0.9 / peak;
  fs.rmSync(phoF); fs.rmSync(wavF);
  fs.writeFileSync(cacheFile, Buffer.from(out.buffer));
  return out;
}

// which syllables the kids' chorus doubles (an octave up)
const KID = new Set(['pop', 'one', 'two', 'three', 'hoo', 'ray', 'bub', 'ble']);

function renderVocalTrack(events, duration) {
  fs.mkdirSync(CACHE, { recursive: true });
  const len = Math.ceil((duration + 2.5) * SR);
  const L = new Float32Array(len), R = new Float32Array(len);
  const leads = events.filter(e => e.inst === 'lead' && e.syl);
  console.log(`singing ${leads.length} syllables…`);
  let done = 0;
  for (const e of leads) {
    const durMs = e.dur * 1000;
    const opts = {};
    if (e.glideTo) opts.glideHz = Math.round(mtof(e.glideTo));
    if (e.dur > 0.7 && !e.glideTo) opts.vib = true;
    const layers = [{ v: 'us1', midi: e.midi, gain: 1.0, dt: 0 }];
    const sylKey = e.syl.toLowerCase().replace(/[^a-z]/g, '');
    if (KID.has(sylKey)) layers.push({ v: 'us1', midi: e.midi + 12, gain: 0.55, dt: 0.012 });
    if (e.midi >= 76 && e.vel >= 1) layers.push({ v: 'us2', midi: e.midi - 12, gain: 0.4, dt: -0.01 }); // grown-up weight under big shouts
    for (const lay of layers) {
      const s = synthSyl(e.syl, lay.midi, durMs, lay.v, opts);
      const start = Math.floor((e.t + lay.dt) * SR);
      const g = lay.gain * (e.vel || 0.9);
      const width = lay.midi >= e.midi + 12 ? 0.35 : 0.15; // kids wider
      for (let i = 0; i < s.length && start + i < len; i++) {
        const fade = Math.min(1, i / 300, (s.length - i) / 300);
        const x = s[i] * g * fade;
        L[start + i] += x * (1 - width * 0.5); R[start + i] += x * (1 - width * 0.5);
        if (start + i + 700 < len) { L[start + i + 700] += x * width * 0.5; }
        if (start + i + 1100 < len) { R[start + i + 1100] += x * width * 0.5; }
      }
    }
    if (++done % 60 === 0) console.log(`  ${done}/${leads.length}`);
  }
  // normalize vocal bus
  let peak = 0;
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const norm = peak > 0 ? 1 / peak : 1;
  for (let i = 0; i < len; i++) { L[i] *= norm; R[i] *= norm; }
  return { L, R };
}

module.exports = { renderVocalTrack };

// Pop Pop Bubble! — song composition (single source of truth)
// 115 BPM synth-pop, ~2:01, key path C→C→D→D→E→F→C for escalation + seamless loop.
'use strict';

const BPM = 115;
const BEAT = 60 / BPM;            // 0.52174 s
const BAR = 4 * BEAT;             // 2.08696 s

// bars per section
const SECTIONS_DEF = [
  { name: 'intro',   bars: 4, key: 0 },
  { name: 'verse1',  bars: 8, key: 0, character: 'Baby' },
  { name: 'verse2',  bars: 8, key: 0, character: 'Mommy' },
  { name: 'verse3',  bars: 8, key: 2, character: 'Daddy' },
  { name: 'verse4',  bars: 8, key: 2, character: 'Grandma' },
  { name: 'verse5',  bars: 8, key: 4, character: 'Grandpa' },
  { name: 'gag',     bars: 4, key: 4 },
  { name: 'finale',  bars: 8, key: 5 },
  { name: 'outro',   bars: 2, key: 0 },
];

// adj syllables: [text, semitone offset, joinNext]
const VERSES = [
  { character: 'Baby',    adj: [['Tee', 0, 1], ['ny', 2], ['ti', 4, 1], ['ny', 5], ['bub', 7, 1], ['ble', 9]],           gesture: 'One finger… poke!' },
  { character: 'Mommy',   adj: [['Boun', 0, 1], ['cy', 2], ['boun', 4, 1], ['cy', 5], ['bub', 7, 1], ['ble', 9]],        gesture: 'Two fingers… poke poke!' },
  { character: 'Daddy',   adj: [['Big', 0], ['and', 2], ['wob', 4, 1], ['bly', 5], ['bub', 7, 1], ['ble', 9]],           gesture: 'Clap your hands!' },
  { character: 'Grandma', adj: [['Spark', 0, 1], ['ly', 2], ['swir', 4, 1], ['ly', 5], ['bub', 7, 1], ['ble', 9]],       gesture: 'Wiggle and clap!' },
  { character: 'Grandpa', adj: [['The', 0], ['big', 0, 1], ['gest', 2], ['bub', 4, 1], ['ble', 5], ['e', 7, 1], ['ver', 9]], gesture: 'Big arms… wait for it!' },
];

function build() {
  const ev = [];        // note events {inst, t (sec), dur (sec), midi, vel, pan, syl?, glideTo?}
  const pops = [];      // {t, size 0..1, big}
  const lyricSyls = []; // {t, dur, text, line} for karaoke
  const sections = [];

  let barCursor = 0;
  for (const s of SECTIONS_DEF) {
    sections.push({ ...s, startBar: barCursor, endBar: barCursor + s.bars,
      start: barCursor * BAR, end: (barCursor + s.bars) * BAR });
    barCursor += s.bars;
  }
  const totalBars = barCursor;
  const duration = totalBars * BAR;
  const S = Object.fromEntries(sections.map(s => [s.name, s]));

  const b2t = (bar, beat) => (bar * 4 + beat) * BEAT; // absolute bar + beat-in-bar → seconds
  const N = (inst, tBeatAbs, durBeats, midi, vel = 0.8, extra = {}) =>
    ev.push({ inst, t: tBeatAbs * BEAT, dur: durBeats * BEAT, midi, vel, ...extra });
  // absolute beat index helper
  const AB = (bar, beat) => bar * 4 + beat;

  const C4 = 60;
  const chordVerse = [0, -3, 0, -3, 5, 7, 5, 0]; // root offsets per bar: C Am C Am F G F C
  const chordType  = ['M', 'm', 'M', 'm', 'M', 'M', 'M', 'M'];

  // ---------- reusable blocks ----------
  function drums(bar, bars, opts) {
    for (let b = bar; b < bar + bars; b++) {
      for (let beat = 0; beat < 4; beat++) {
        const t = AB(b, beat);
        if (opts.kick === '4floor') N('kick', t, 0.2, 0, 0.95);
        else if (opts.kick === 'half' && (beat === 0 || beat === 2)) N('kick', t, 0.2, 0, 0.9);
        if (opts.clap && (beat === 1 || beat === 3)) N('clap', t, 0.2, 0.7);
        if (opts.hat === '8') { N('hat', t, 0.1, 0.35); N('hat', t + 0.5, 0.1, 0.22); }
        if (opts.hat === '16') for (let q = 0; q < 4; q++) N('hat', t + q * 0.25, 0.08, q === 0 ? 0.35 : 0.18);
      }
    }
  }
  function bassline(bar, bars, key, style) {
    for (let b = 0; b < bars; b++) {
      const root = C4 - 24 + key + chordVerse[b % 8];
      if (style === 'held') { N('bass', AB(bar + b, 0), 3.6, root, 0.75); }
      else for (let e = 0; e < 8; e++) { // bouncy 8ths root/root/oct
        const midi = root + (e % 4 === 2 ? 12 : 0);
        N('bass', AB(bar + b, e * 0.5), 0.42, midi, e % 2 ? 0.6 : 0.8);
      }
    }
  }
  function plucks(bar, bars, key) {
    for (let b = 0; b < bars; b++) {
      const root = C4 + key + chordVerse[b % 8];
      const third = root + (chordType[b % 8] === 'm' ? 3 : 4);
      for (const beat of [0.5, 1.5, 2.5, 3.5]) {
        N('pluck', AB(bar + b, beat), 0.4, root, 0.4, { pan: -0.3 });
        N('pluck', AB(bar + b, beat), 0.4, third, 0.35, { pan: 0.3 });
        N('pluck', AB(bar + b, beat), 0.4, root + 7, 0.32, { pan: 0.1 });
      }
    }
  }
  function sparkleArp(bar, bars, key, dir = 1) {
    const scale = [0, 4, 7, 12, 16, 19, 24]; // C maj arpeggio spread
    for (let b = 0; b < bars; b++) for (let s = 0; s < 8; s++) {
      const idx = dir > 0 ? s % scale.length : scale.length - 1 - (s % scale.length);
      N('sparkle', AB(bar + b, s * 0.5), 0.4, C4 + 12 + key + scale[idx], 0.28, { pan: (s % 2) ? 0.5 : -0.5 });
    }
  }
  function syl(tBeatAbs, durBeats, midi, text, line, vel = 0.92, joinNext = false) {
    N('lead', tBeatAbs, durBeats, midi, vel, { syl: text });
    lyricSyls.push({ t: tBeatAbs * BEAT, dur: durBeats * BEAT, text, line, joinNext });
  }

  // ---------- INTRO (bars 0–3) ----------
  sparkleArp(0, 2, 0, -1);
  N('popsfx', AB(0, 0), 0.3, 0, 0.5); N('popsfx', AB(1, 0), 0.3, 3, 0.5);
  // title chant "Pop! Pop! Bub-ble!"
  syl(AB(2, 0), 0.6, C4 + 7, 'Pop!', 'title');
  syl(AB(2, 1), 0.6, C4 + 7, 'Pop!', 'title');
  syl(AB(2, 2), 0.5, C4 + 9, 'Bub', 'title', 0.92, true);
  syl(AB(2, 2.5), 1.2, C4 + 7, 'ble!', 'title');
  pops.push({ t: b2t(2, 0), size: 0.15, big: false }, { t: b2t(2, 1), size: 0.15, big: false });
  drums(2, 1, { kick: 'half', hat: '8' });
  drums(3, 1, { kick: '4floor', clap: true, hat: '8' });
  bassline(2, 2, 0, 'bounce');

  // ---------- VERSES ----------
  VERSES.forEach((v, vi) => {
    const sec = S['verse' + (vi + 1)];
    const bar = sec.startBar, key = sec.key;
    const lineId = `v${vi + 1}`;
    const splitAt = v.character.length - 2;
    const nameSyls = [[v.character.slice(0, splitAt), 4, 1], [v.character.slice(splitAt), 4], ['pan', 7, 1], ['da', 7]];

    // 3 chant lines (bars 0-1, 2-3, 4-5)
    for (let L = 0; L < 3; L++) {
      const lb = bar + L * 2, lid = `${lineId}L${L}`;
      nameSyls.forEach(([txt, off, jn], i) => syl(AB(lb, i), 0.85, C4 + key + off, txt, lid, 0.92, !!jn));
      const popNotes = [[0, 1, 7], [1, 1, 7], [2, 0.5, 9], [2.5, 0.5, 7], [3, 0.5, 4], [3.5, 0.5, 2]];
      popNotes.forEach(([beat, dur, off], i) => {
        const join = i >= 2 && i % 2 === 0;
        const txt = join ? 'pop-' : 'pop';
        syl(AB(lb + 1, beat), dur * 0.85, C4 + key + off, txt, lid, 0.92, join);
        pops.push({ t: b2t(lb + 1, beat), size: 0.12 + vi * 0.03, big: false });
      });
    }
    // bar 6: ascending "bubble grows" run + riser
    const runBar = bar + 6, rid = `${lineId}run`;
    v.adj.forEach(([txt, off, jn], i) => syl(AB(runBar, i * 0.5), 0.45, C4 + key + off, txt, rid, 0.92, !!jn));
    N('riser', AB(runBar, 0), 4, C4 + key, 0.5);
    // bar 7: the payoff
    if (v.character !== 'Grandpa') {
      syl(AB(bar + 7, 0), 2, C4 + key + 12, 'POP!', `${lineId}pop`, 1.0);
      pops.push({ t: b2t(bar + 7, 0), size: 0.35 + vi * 0.15, big: true });
      N('popsfx', AB(bar + 7, 0), 0.5, key + vi, 1.0, { big: true });
      N('sparkle', AB(bar + 7, 1), 0.3, C4 + 24 + key, 0.3); N('sparkle', AB(bar + 7, 1.5), 0.3, C4 + 28 + key, 0.25);
    } else {
      // Grandpa: no pop — "WHOA!" gliss up into the gag
      syl(AB(bar + 7, 0), 4, C4 + key + 11, 'WHOA!', `${lineId}whoa`, 1.0);
      ev[ev.length - 1].glideTo = C4 + key + 23; // long upward glide (find the lead note just pushed via N inside syl)
    }
    // arrangement layers grow with each verse
    drums(bar, 6, vi === 0 ? { kick: 'half', clap: true } :
                  vi === 1 ? { kick: 'half', clap: true, hat: '8' } :
                  vi < 4   ? { kick: '4floor', clap: true, hat: '8' } :
                             { kick: '4floor', clap: true, hat: '16' });
    drums(runBar, 1, { kick: 'half', hat: '8' }); // breakdown on run bar
    if (v.character !== 'Grandpa') drums(bar + 7, 1, vi < 2 ? { kick: 'half', clap: true } : { kick: '4floor', clap: true, hat: '8' });
    bassline(bar, 7, key, vi === 0 ? 'held' : 'bounce');
    plucks(bar, 7, key);
    if (vi >= 1) sparkleArp(bar + (vi >= 3 ? 0 : 4), vi >= 3 ? 6 : 2, key);
  });

  // ---------- GAG (Grandpa lifts off) ----------
  {
    const g = S.gag, bar = g.startBar, key = g.key;
    N('riser', AB(bar, 0), 8, C4 + key + 12, 0.7);
    // "Up, up, up he goes!"
    syl(AB(bar + 2, 0), 0.8, C4 + key + 7, 'Up,', 'gag');
    syl(AB(bar + 2, 1), 0.8, C4 + key + 9, 'up,', 'gag');
    syl(AB(bar + 2, 2), 0.8, C4 + key + 11, 'up', 'gag');
    syl(AB(bar + 2, 3), 0.5, C4 + key + 12, 'he', 'gag');
    syl(AB(bar + 3, 0), 2.5, C4 + key + 16, 'goes!', 'gag', 1.0);
    N('bass', AB(bar, 0), 8, C4 - 24 + key, 0.5);
    for (let b = 0; b < 4; b++) N('sparkle', AB(bar + b, b % 2), 0.4, C4 + 24 + key + b * 2, 0.3);
  }

  // ---------- FINALE ----------
  {
    const f = S.finale, bar = f.startBar, key = f.key; // F
    drums(bar, 4, { kick: '4floor', clap: true, hat: '16' });
    bassline(bar, 4, key, 'bounce');
    plucks(bar, 4, key);
    sparkleArp(bar, 4, key);
    const say = (b, beat, dur, off, txt, line, vel = 0.95, jn = false) => {
      syl(AB(bar + b, beat), dur, C4 + key + off, txt, line, vel, jn);
    };
    // "Pop it all together!"  / "Everybody ready?"
    [['Pop', 0, 0, 4, 0], ['it', 0.5, 0, 4, 0], ['all', 1, 0, 7, 0], ['to', 2, 0, 9, 1], ['ge', 2.5, 0, 7, 1], ['ther!', 3, 0, 4, 0]]
      .forEach(([txt, beat, b, off, jn]) => say(b, beat, 0.45, off, txt, 'fin1', 0.95, !!jn));
    pops.push({ t: b2t(bar + 1, 1), size: 0.2, big: false }, { t: b2t(bar + 1, 3), size: 0.2, big: false });
    [['Ev', 0, 2, 4, 1], ['ery', 0.5, 2, 4, 1], ['bo', 1, 2, 7, 1], ['dy', 1.5, 2, 7, 0], ['rea', 2, 2, 9, 1], ['dy?', 3, 2, 9, 0]]
      .forEach(([txt, beat, b, off, jn]) => say(b, beat, 0.45, off, txt, 'fin2', 0.95, !!jn));
    // "One! Two! Three!"
    say(4, 0, 0.7, 7, 'One!', 'count'); say(4, 1, 0.7, 9, 'Two!', 'count'); say(4, 2, 1.2, 12, 'Three!', 'count');
    drums(bar + 4, 1, { kick: 'half' });
    // "POP! POP! POP!"
    for (let i = 0; i < 3; i++) {
      say(5, i, 0.8, [4, 9, 16][i], 'POP!', 'bigpop', 1.0);
      pops.push({ t: b2t(bar + 5, i), size: 0.8 + i * 0.1, big: true });
      N('popsfx', AB(bar + 5, i), 0.5, key + i * 2, 1.0, { big: true });
      N('kick', AB(bar + 5, i), 0.2, 0, 1.0);
    }
    // "Hoo-ray!"
    say(6, 0, 0.6, 12, 'Hoo', 'hooray', 0.95, true); say(6, 0.5, 3, 16, 'ray!', 'hooray', 1.0);
    drums(bar + 6, 2, { kick: '4floor', clap: true, hat: '8' });
    bassline(bar + 6, 2, key, 'bounce');
    sparkleArp(bar + 6, 2, key);
  }

  // ---------- OUTRO (loop back to C) ----------
  {
    const o = S.outro, bar = o.startBar;
    sparkleArp(bar, 2, 0, -1);
    N('bass', AB(bar, 0), 7, C4 - 24, 0.55);
    N('pluck', AB(bar, 0), 3, C4, 0.4); N('pluck', AB(bar, 0), 3, C4 + 4, 0.35); N('pluck', AB(bar, 0), 3, C4 + 7, 0.35);
    N('popsfx', AB(bar + 1, 2), 0.3, 0, 0.4);
  }

  // karaoke lines: group syllables by line id
  const lines = [];
  {
    const byLine = new Map();
    for (const s of lyricSyls) {
      if (!byLine.has(s.line)) { byLine.set(s.line, { syls: [] }); lines.push(byLine.get(s.line)); }
      byLine.get(s.line).syls.push(s);
    }
    for (const l of lines) {
      l.t = l.syls[0].t;
      l.end = Math.max(...l.syls.map(s => s.t + s.dur));
      l.text = l.syls.map(s => s.text + (s.joinNext ? '' : ' ')).join('').trim();
    }
  }

  const timeline = {
    bpm: BPM, beat: BEAT, bar: BAR, duration,
    sections,
    verses: VERSES.map((v, i) => ({ character: v.character, gesture: v.gesture,
      start: S['verse' + (i + 1)].start, end: S['verse' + (i + 1)].end, index: i })),
    pops, lines,
  };
  return { events: ev, timeline };
}

module.exports = { build, BPM, BEAT, BAR };

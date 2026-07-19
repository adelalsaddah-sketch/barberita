// Renders soundtrack.wav + timeline.json from song.js
'use strict';
const fs = require('fs');
const path = require('path');
const { build } = require('./song');
const { renderSong, writeWav, SR, GAIN } = require('./synth');

const { events, timeline } = build();
console.log(`events: ${events.length}, duration: ${timeline.duration.toFixed(2)}s, lines: ${timeline.lines.length}, pops: ${timeline.pops.length}`);

// sung vocals (MBROLA); synth lead becomes a soft double under the voice
let vocals = null;
if (!process.argv.includes('--instrumental')) {
  vocals = require('./sing').renderVocalTrack(events, timeline.duration);
  GAIN.lead = 0.18;
}
const out = renderSong(events, timeline.duration, vocals);
const dist = path.join(__dirname, 'dist');
fs.mkdirSync(dist, { recursive: true });
writeWav(path.join(dist, 'soundtrack.wav'), out);
fs.writeFileSync(path.join(dist, 'timeline.json'), JSON.stringify(timeline));

// sanity: per-second RMS so silent/broken sections are visible
const step = SR;
let report = [];
for (let s = 0; s * step < out.len; s++) {
  let acc = 0, n = 0;
  for (let i = s * step; i < Math.min((s + 1) * step, out.len); i++) { acc += out.L[i] * out.L[i]; n++; }
  report.push(Math.sqrt(acc / n));
}
console.log('per-sec RMS:', report.map(r => r > 0.15 ? '#' : r > 0.05 ? '+' : r > 0.005 ? '.' : ' ').join(''));
console.log('peak-normalized gain:', out.norm.toFixed(3));
console.log('lyric lines:');
for (const l of timeline.lines) console.log(`  ${l.t.toFixed(1).padStart(6)}s  ${l.text}`);

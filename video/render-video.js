// Renders animation.html frame-by-frame through Chromium and muxes with the soundtrack.
// Usage: node render-video.js            → full MP4
//        node render-video.js snap t1 t2 → save single-frame PNGs for inspection
'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const FPS = 30;
const FFMPEG = path.join(__dirname, 'node_modules/@ffmpeg-installer/linux-x64/ffmpeg');
const DIST = path.join(__dirname, 'dist');

async function boot() {
  const opts = { args: ['--force-color-profile=srgb', '--disable-lcd-text'] };
  const sysChromium = '/opt/pw-browsers/chromium';
  if (fs.existsSync(sysChromium)) opts.executablePath = sysChromium;
  const browser = await chromium.launch(opts);
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file://' + path.join(__dirname, 'animation.html'));
  const tl = JSON.parse(fs.readFileSync(path.join(DIST, 'timeline.json'), 'utf8'));
  await page.evaluate(t => window.__init(t), tl);
  return { browser, page, tl };
}

async function main() {
  const [, , mode, ...args] = process.argv;
  const { browser, page, tl } = await boot();

  if (mode === 'snap') {
    for (const ts of args) {
      const t = parseFloat(ts);
      const dataUrl = await page.evaluate(t => window.__frame(t), t);
      const f = path.join(DIST, `snap-${t.toFixed(2)}.png`);
      fs.writeFileSync(f, Buffer.from(dataUrl.split(',')[1], 'base64'));
      console.log('wrote', f);
    }
    await browser.close();
    return;
  }

  const durOut = tl.duration + 0.9; // let the final delay tail breathe
  const frames = Math.ceil(durOut * FPS);
  const out = path.join(DIST, 'pop-pop-bubble.mp4');
  const ff = spawn(FFMPEG, [
    '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', 'pipe:0',
    '-i', path.join(DIST, 'soundtrack.wav'),
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    const t = Math.min(f / FPS, tl.duration - 1 / FPS); // clamp: hold last real frame through the tail
    const dataUrl = await page.evaluate(t => window.__frame(t), t);
    const ok = ff.stdin.write(Buffer.from(dataUrl.split(',')[1], 'base64'));
    if (!ok) await new Promise(res => ff.stdin.once('drain', res));
    if (f % 300 === 0) console.log(`frame ${f}/${frames} (${((Date.now() - t0) / 1000).toFixed(0)}s elapsed)`);
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s → ${out}`);
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });

# Pop Pop Bubble! — video workspace

An original kids' music video engineered with Baby Shark's viral mechanics
(see ../PROPOSAL.md for the strategy and video/production-kit/PRODUCTION_KIT.md
for the studio handoff kit).

Everything is generated from code — no external assets:

| File | Role |
|---|---|
| `song.js` | The composition: lyrics, melody, structure, timings (single source of truth) |
| `synth.js` | Pure-Node PCM synthesizer (drums, bass, plucks, lead, SFX) |
| `render-audio.js` | `node render-audio.js` → `dist/soundtrack.wav` + `dist/timeline.json` |
| `animation.html` | Canvas animation; deterministic `renderFrame(t)` |
| `render-video.js` | `node render-video.js` → renders frames via headless Chromium, muxes `dist/pop-pop-bubble.mp4`. `node render-video.js snap <t…>` saves single-frame PNGs |

Build: `npm install` (needs Chromium for Playwright; a Linux ffmpeg comes from
`@ffmpeg-installer/linux-x64`), then run render-audio followed by render-video.

Preview interactively: serve this directory and open `animation.html?play`
(click once to start audio).

The soundtrack is an instrumental melody guide — real vocals are the first
human production step (production kit §7).

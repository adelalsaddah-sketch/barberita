# Run it on your phone & on the web

This is an [Astro](https://astro.build) web app. It can be tested three ways:
in a mobile browser, installed as a PWA "app", or wrapped into a real `.apk`.

---

## 1. Quick test on your phone (no deploy, ~30 seconds)

On a computer that's on the **same Wi‑Fi** as your phone:

```bash
npm install
npm run dev -- --host
```

Open the **Network** URL it prints (e.g. `http://192.168.x.x:4321/`) in your
phone's browser. The whole app works. (Install-to-home-screen is only offered
over HTTPS — see options 2/3 for that.)

---

## 2. Get a public web URL (and install as a PWA)

The app is already configured for **Cloudflare Workers**. From your machine:

```bash
npm install
npx wrangler login        # one-time browser sign-in (no token pasting)
npm run build
npx wrangler deploy       # prints a public https://…workers.dev URL
```

Prefer a dashboard? Any static host works — import this GitHub repo in
**Vercel** or **Netlify** (build command `npm run build`, output `dist`), or
drag the built `dist/` folder onto <https://app.netlify.com/drop>.

Once it's live over HTTPS, open it in **Chrome on Android** → menu →
**Install app / Add to Home screen**. It gets its own icon and runs full‑screen
like a native app — this is the recommended way to "test it like an app" without
an APK.

---

## 3. Get an installable `.apk` file

A GitHub Actions workflow builds one for you on GitHub's runners (which have the
Android SDK) — no Android Studio needed.

1. Go to the repo's **Actions** tab → **Build Android APK** → **Run workflow**
   (it also runs automatically on every push to the feature branch).
2. When it finishes, open the run and download the **`uber-debug-apk`** artifact.
3. Unzip it, copy `app-debug.apk` to your phone, and open it. Enable
   **"Install unknown apps"** for your file manager/browser when prompted.

The APK bundles the web build with [Capacitor](https://capacitorjs.com), so it
runs fully offline. It's *debug‑signed* — perfect for testing, not for the Play
Store.

### Build the APK locally instead

Requires Android Studio (or the Android SDK) + JDK 17:

```bash
npm install
npm run build
npm install -D @capacitor/cli @capacitor/core @capacitor/android
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Notes

- Internal routes use trailing slashes (`/ride/`) and `trailingSlash: "always"`
  so they resolve on strict static hosts **and** inside the Capacitor WebView.
- Educational/demo clone — not affiliated with Uber Technologies Inc.

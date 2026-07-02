// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://example.com",
  // Emit each page as a real `.html` file (e.g. /ride.html) and link to those
  // files directly. Capacitor's WebView routes every *extensionless* path back
  // to the root index.html (html5mode), so clean/dir URLs all showed the
  // landing page. Real .html paths have a "." in the last segment and are
  // served literally — works in the APK, on static hosts, and on Cloudflare.
  build: { format: "file" },
  trailingSlash: "never",
  integrations: [mdx(), sitemap()],
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
});

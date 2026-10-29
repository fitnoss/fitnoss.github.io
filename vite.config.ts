import fs from "node:fs"
import path from "node:path"
import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from "vite-plugin-pwa"

/** Serves data/videos.candidates.json to the dev-only video review page. */
function devFiles(): Plugin {
  return {
    name: "fitcraft-dev-files",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__dev/videos.candidates.json", (_req, res) => {
        const file = path.resolve(import.meta.dirname, "data/videos.candidates.json")
        res.setHeader("Content-Type", "application/json")
        res.end(fs.existsSync(file) ? fs.readFileSync(file) : "{}")
      })
    },
  }
}

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    tailwindcss(),
    devFiles(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.svg", "icons/*.png"],
      manifest: {
        name: "fitcraft",
        short_name: "fitcraft",
        description: "Exercise library, workout programs and training log. Works offline.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // App shell + exercise data are precached; images are cached as they are viewed.
        globPatterns: ["**/*.{js,css,html,svg,woff2}", "data/*.json", "locales/**/*.json"],
        globIgnores: ["img/**"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/img/ex/"),
            handler: "CacheFirst",
            options: { cacheName: "ex-images", expiration: { maxEntries: 4000 } },
          },
          {
            urlPattern: ({ url }) => url.hostname === "i.ytimg.com",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "yt-thumbs", expiration: { maxEntries: 300 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
})

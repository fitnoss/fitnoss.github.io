import { StrictMode, Suspense } from "react"
import { createRoot } from "react-dom/client"
import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill"
import flagsFont from "country-flag-emoji-polyfill/dist/TwemojiCountryFlags.woff2?url"
import "./index.css"
import { initI18n } from "@/shared/i18n"
import { applyAccent, applyTheme, useSettings } from "@/shared/storage/settings"
import { App } from "@/app/App"

// Short share links look like https://fitnoss.github.io/#<payload>; route them to /s/<payload>.
const hash = location.hash.slice(1)
if (/^[A-Za-z0-9_-]{4,}$/.test(hash)) history.replaceState(null, "", `#/s/${hash}`)

// Windows has emoji but draws flags as two letters; there it gets Twemoji's flags from our own copy.
if (/Windows NT/.test(navigator.userAgent)) {
  polyfillCountryFlagEmojis("Twemoji Country Flags", flagsFont)
}

applyTheme(useSettings.getState().theme)
applyAccent(useSettings.getState().accent)

initI18n().then(() => {
  const app = (
    <StrictMode>
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </StrictMode>
  )
  const root = createRoot(document.getElementById("root")!)
  if (import.meta.env.DEV && new URLSearchParams(location.search).has("profile")) {
    void import("@/features/dev/profiler").then(({ profileApp }) => root.render(profileApp(app)))
  } else root.render(app)
})

import { StrictMode, Suspense } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { initI18n } from "@/shared/i18n"
import { applyAccent, applyTheme, useSettings } from "@/shared/storage/settings"
import { App } from "@/app/App"

// Short share links look like https://fitnoss.github.io/#<payload>; route them to /s/<payload>.
const hash = location.hash.slice(1)
if (/^[A-Za-z0-9_-]{4,}$/.test(hash)) history.replaceState(null, "", `#/s/${hash}`)

applyTheme(useSettings.getState().theme)
applyAccent(useSettings.getState().accent)

initI18n().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </StrictMode>,
  )
})

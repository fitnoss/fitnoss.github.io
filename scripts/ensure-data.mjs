// Runs the data build once after a fresh clone (public/data is generated, not committed).
import { existsSync } from "node:fs"
import { execSync } from "node:child_process"

if (!existsSync(new URL("../public/data/exercises.json", import.meta.url)) ||
    !existsSync(new URL("../public/locales/en/exercise-names.json", import.meta.url))) {
  console.log("Generated exercise data is missing, running npm run data…")
  execSync("npm run data", { stdio: "inherit" })
}

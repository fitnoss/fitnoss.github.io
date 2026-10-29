/**
 * Translation report for every language in locales/index.json.
 *
 *   npm run i18n:check            report missing / extra keys and coverage
 *   npm run i18n:check -- ru      details for one language
 *
 * Fails only on broken JSON or keys that don't exist in English (typos).
 */
import fs from "node:fs/promises"
import path from "node:path"
import { compareUi } from "./i18n-lib"

const LOCALES = path.resolve(import.meta.dirname, "..", "locales")
const only = process.argv[2]

const read = async (file: string) => JSON.parse(await fs.readFile(path.join(LOCALES, file), "utf8"))

const languages: { code: string; nativeName: string }[] = await read("index.json")
const en = await read("en/ui.json")
const enExercises = Object.keys(
  JSON.parse(await fs.readFile(path.resolve(LOCALES, "..", "public/locales/en/exercises.json"), "utf8").catch(() => "{}")),
)
let failed = false

for (const { code, nativeName } of languages) {
  if (code === "en" || (only && only !== code)) continue
  let ui
  try {
    ui = await read(`${code}/ui.json`)
  } catch (e) {
    console.error(`✗ ${code}/ui.json: ${(e as Error).message}`)
    failed = true
    continue
  }
  const r = compareUi(en, ui, code)
  const ex: Record<string, { name?: string; steps?: string[]; machine?: boolean }> = await read(`${code}/exercises.json`).catch(() => ({}))
  const exDone = Object.values(ex).filter((t) => t.name && t.steps?.length).length
  const exMachine = Object.values(ex).filter((t) => t.machine).length

  console.log(`\n${nativeName} (${code})`)
  console.log(`  UI:        ${r.done}/${r.total} (${Math.round((r.done / r.total) * 100)}%)`)
  if (enExercises.length) {
    console.log(`  Exercises: ${exDone}/${enExercises.length} in locales/${code}/exercises.json, ${exMachine} machine-translated`)
  }
  if (r.missing.length) console.log(`  Missing:   ${only ? r.missing.join(", ") : r.missing.slice(0, 10).join(", ") + (r.missing.length > 10 ? ", …" : "")}`)
  if (r.extra.length) {
    console.log(`  ✗ Unknown keys (not in en/ui.json): ${r.extra.join(", ")}`)
    failed = true
  }
}

if (failed) process.exit(1)

/**
 * Builds everything the site serves from two kinds of exercise sources:
 *
 *   1. yuhonas/free-exercise-db (Unlicense), pinned to SOURCE_SHA
 *   2. content/exercises/<slug>/  — our own exercises, one folder each (see content/README.md)
 *
 *   npm run data            build public/ and append new ids to data/id-map.json
 *   npm run data -- --check same, but fail instead of changing data/id-map.json (CI)
 *
 * Inputs (committed):   content/, locales/, data/id-map.json, data/overrides.json, data/videos.json
 * Outputs (generated):  public/data/, public/img/ex/, public/locales/
 */
import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"
import { compareUi } from "./i18n-lib"

const SOURCE_REPO = "yuhonas/free-exercise-db"
const SOURCE_SHA = "f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5"
const RAW = `https://raw.githubusercontent.com/${SOURCE_REPO}/${SOURCE_SHA}`

const ROOT = path.resolve(import.meta.dirname, "..")
const CACHE = path.join(ROOT, ".cache", "fedb")
const CONTENT = path.join(ROOT, "content", "exercises")
const CONTENT_IMAGES = path.join(ROOT, "content", "images")
const LOCALES = path.join(ROOT, "locales")
const ID_MAP = path.join(ROOT, "data", "id-map.json")
const OVERRIDES = path.join(ROOT, "data", "overrides.json")
const VIDEOS = path.join(ROOT, "data", "videos.json")
const OUT_DATA = path.join(ROOT, "public", "data")
const OUT_LOCALES = path.join(ROOT, "public", "locales")
const OUT_IMG = path.join(ROOT, "public", "img", "ex")

/**
 * Two sizes per photo: s/ for list thumbnails (≤ 80 px on screen), l/ for the exercise page.
 * Changing these rebuilds every image (see .cache/img-settings.json).
 */
const IMG_SIZES = [
  { dir: "s", width: 360, quality: 78 },
  { dir: "l", width: 1000, quality: 82 },
] as const

/** Prefix for our own exercises in id-map.json, so they never collide with source ids. */
const LOCAL = "local/"

/**
 * The first codes are the most popular exercises: share links encode codes 0..63 in
 * 7 bits. Only used when id-map.json is created; afterwards new ids are appended.
 */
const TOP = [
  "Pushups", "Pullups", "Bodyweight_Squat", "Plank", "Barbell_Full_Squat", "Barbell_Bench_Press_-_Medium_Grip",
  "Barbell_Deadlift", "Chin-Up", "Dips_-_Triceps_Version", "Crunches", "Dumbbell_Lunges", "Standing_Military_Press",
  "Bent_Over_Barbell_Row", "Wide-Grip_Lat_Pulldown", "Barbell_Curl", "Dumbbell_Bicep_Curl", "Hammer_Curls",
  "Dumbbell_Bench_Press", "Incline_Dumbbell_Press", "Dumbbell_Shoulder_Press", "Side_Lateral_Raise",
  "One-Arm_Dumbbell_Row", "Romanian_Deadlift", "Leg_Press", "Leg_Extensions", "Lying_Leg_Curls",
  "Standing_Calf_Raises", "Seated_Cable_Rows", "Triceps_Pushdown", "Hanging_Leg_Raise", "Barbell_Hip_Thrust",
  "Butt_Lift_Bridge", "Goblet_Squat", "Mountain_Climbers", "Russian_Twist", "Dumbbell_Flyes", "Face_Pull",
  "Barbell_Incline_Bench_Press_-_Medium_Grip", "Close-Grip_Barbell_Bench_Press", "EZ-Bar_Skullcrusher",
  "Push-Ups_-_Close_Triceps_Position", "Dips_-_Chest_Version", "Inverted_Row", "Split_Squat_with_Dumbbells",
  "Dumbbell_Step_Ups", "Sumo_Deadlift", "Front_Barbell_Squat", "One-Arm_Kettlebell_Swings", "Arnold_Dumbbell_Press",
  "Upright_Barbell_Row", "Barbell_Shrug", "Dumbbell_Shrug", "Cable_Crossover", "Butterfly", "Reverse_Flyes",
  "Preacher_Curl", "Concentration_Curls", "Hyperextensions_Back_Extensions", "Superman", "Ab_Roller",
  "Reverse_Crunch", "Rope_Jumping", "Seated_Calf_Raise", "Hack_Squat",
]

export const CATEGORIES = ["strength", "stretching", "plyometrics", "powerlifting", "olympic weightlifting", "strongman", "cardio"]
export const LEVELS = ["beginner", "intermediate", "expert"]
export const MUSCLES = [
  "abdominals", "abductors", "adductors", "biceps", "calves", "chest", "forearms", "glutes", "hamstrings", "lats",
  "lower back", "middle back", "neck", "quadriceps", "shoulders", "traps", "triceps",
]
export const EQUIPMENT = ["body", "dumbbell", "barbell", "kettlebell", "bands", "cable", "machine", "ezbar", "medball", "fitball", "foamroll", "pullupbar", "parallelbars", "rings", "suspension", "bench", "plate", "other"]
export const PLACES = ["home", "bars", "dumbbell", "kettlebell", "bands", "gym"] as const
export type Place = (typeof PLACES)[number]

const SOURCE_EQUIP: Record<string, string> = {
  "body only": "body",
  barbell: "barbell",
  dumbbell: "dumbbell",
  cable: "cable",
  machine: "machine",
  kettlebells: "kettlebell",
  bands: "bands",
  "medicine ball": "medball",
  "exercise ball": "fitball",
  "foam roll": "foamroll",
  "e-z curl bar": "ezbar",
  other: "other",
}

type Source = {
  id: string
  name: string
  force: string | null
  level: string
  mechanic: string | null
  equipment: string | null
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  category: string
  images: string[]
}

type Text = { name: string; steps: string[]; machine?: boolean }
type Video = { yt: string; start?: number; end?: number; ru?: string }

/** content/exercises/<slug>/exercise.json */
export type LocalExercise = {
  category: string
  level: string
  mechanic?: "compound" | "isolation" | null
  force?: "push" | "pull" | "static" | null
  equipment: string
  equipmentExtra?: string[]
  primary: string[]
  secondary?: string[]
  places?: Place[]
  video?: Video
  i18n: Record<string, Text>
}

type Core = {
  c: number
  s: string
  cat: string
  lvl: string
  mech: string | null
  force: string | null
  eq: string
  eqExtra?: string[]
  pm: string[]
  sm: string[]
  pl: Place[]
  img: number
}

const BARS_RE = /pull-?ups?\b|pullup|chin-?up|hanging|muscle.?up|toes.?to.?bar|\bdips?\b|knees? to elbow|front lever|back lever|l-sit|inverted row/i
const NOT_BARS_RE = /bench dip|dip machine|jerk dip|band assisted|hanging bar good morning|weighted bench dip|pulldown/i
const IMAGE_RE = /\.(jpe?g|png|webp|gif|avif)$/i

export function derivePlaces(name: string, eq: string): Place[] {
  const places = new Set<Place>()
  const bars = BARS_RE.test(name) && !NOT_BARS_RE.test(name)
  if (bars || eq === "pullupbar" || eq === "parallelbars") places.add("bars")
  if (!bars && eq === "body") places.add("home")
  if (eq === "dumbbell") places.add("dumbbell")
  if (eq === "kettlebell") places.add("kettlebell")
  if (eq === "bands") places.add("bands")
  if (eq === "medball" || eq === "fitball" || eq === "foamroll") places.add("home")
  if (!["body", "bands"].includes(eq) || bars) places.add("gym")
  return [...places]
}

export function slugify(id: string) {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/** Returns a list of problems with a local exercise definition (empty = valid). */
export function validateLocal(slug: string, ex: LocalExercise): string[] {
  const errors: string[] = []
  const oneOf = (field: string, value: unknown, allowed: readonly string[]) => {
    if (!allowed.includes(value as string)) errors.push(`${field}: "${value}" is not one of ${allowed.join(", ")}`)
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errors.push(`folder name must be kebab-case (a-z, 0-9, -)`)
  oneOf("category", ex.category, CATEGORIES)
  oneOf("level", ex.level, LEVELS)
  oneOf("equipment", ex.equipment, EQUIPMENT)
  for (const equipment of ex.equipmentExtra ?? []) oneOf("equipmentExtra", equipment, EQUIPMENT)
  if (ex.mechanic != null) oneOf("mechanic", ex.mechanic, ["compound", "isolation"])
  if (ex.force != null) oneOf("force", ex.force, ["push", "pull", "static"])
  if (!ex.primary?.length) errors.push(`primary: at least one muscle is required`)
  for (const m of [...(ex.primary ?? []), ...(ex.secondary ?? [])]) oneOf("muscle", m, MUSCLES)
  for (const p of ex.places ?? []) oneOf("places", p, PLACES)
  if (!ex.i18n?.en?.name) errors.push(`i18n.en.name is required`)
  if (!ex.i18n?.en?.steps?.length) errors.push(`i18n.en.steps: at least one step is required`)
  if (ex.video && !/^[\w-]{11}$/.test(ex.video.yt)) errors.push(`video.yt must be an 11-character YouTube video id`)
  return errors
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return fallback
    throw new Error(`${path.relative(ROOT, file)}: ${(e as Error).message}`)
  }
}

async function exists(file: string) {
  return fs.access(file).then(
    () => true,
    () => false,
  )
}

async function fetchCached(url: string, file: string) {
  if (await exists(file)) return fs.readFile(file)
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url)
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer())
      await fs.mkdir(path.dirname(file), { recursive: true })
      await fs.writeFile(file, buf)
      return buf
    }
    if (attempt >= 3) throw new Error(`${res.status} ${url}`)
  }
}

async function pool<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  let i = 0
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) await fn(items[i++])
    }),
  )
}

async function loadLocal() {
  const dirs = (await exists(CONTENT)) ? await fs.readdir(CONTENT, { withFileTypes: true }) : []
  const result: { slug: string; dir: string; ex: LocalExercise; images: string[] }[] = []
  const problems: string[] = []
  for (const d of dirs) {
    if (!d.isDirectory() || d.name.startsWith("_")) continue
    const dir = path.join(CONTENT, d.name)
    const ex = await readJson<LocalExercise | null>(path.join(dir, "exercise.json"), null)
    if (!ex) {
      problems.push(`content/exercises/${d.name}: missing exercise.json`)
      continue
    }
    const images = (await fs.readdir(dir)).filter((f) => IMAGE_RE.test(f)).sort()
    for (const e of validateLocal(d.name, ex)) problems.push(`content/exercises/${d.name}: ${e}`)
    if (images.length === 0) console.warn(`content/exercises/${d.name}: no images, a placeholder will be shown`)
    result.push({ slug: d.name, dir, ex, images })
  }
  if (problems.length) throw new Error(`Invalid exercises:\n  ${problems.join("\n  ")}`)
  return result
}

async function main() {
  const check = process.argv.includes("--check")
  console.log(`Source: ${SOURCE_REPO}@${SOURCE_SHA.slice(0, 7)}`)
  const raw = await fetchCached(`${RAW}/dist/exercises.json`, path.join(CACHE, "exercises.json"))
  const source = JSON.parse(raw.toString("utf8")) as Source[]
  const sourceById = new Map(source.map((s) => [s.id, s]))
  const local = await loadLocal()
  const localById = new Map(local.map((l) => [LOCAL + l.slug, l]))
  const overrides = await readJson<Record<string, { places?: Place[]; equipment?: string; equipmentExtra?: string[]; hide?: boolean; images?: string[] }>>(OVERRIDES, {})
  for (const [id, override] of Object.entries(overrides)) {
    if (!sourceById.has(id)) throw new Error(`Unknown override ID: ${id}`)
    for (const image of override.images ?? []) {
      const file = path.resolve(CONTENT_IMAGES, image)
      const relative = path.relative(CONTENT_IMAGES, file)
      if (relative.startsWith("..") || path.isAbsolute(relative) || !IMAGE_RE.test(file) || !(await exists(file))) {
        throw new Error(`Invalid image override for ${id}: ${image}`)
      }
    }
    for (const equipment of [override.equipment, ...(override.equipmentExtra ?? [])].filter(Boolean)) {
      if (!EQUIPMENT.includes(equipment!)) throw new Error(`Unknown equipment for ${id}: ${equipment}`)
    }
  }
  const videos = await readJson<Record<string, Video>>(VIDEOS, {})
  const languages = await readJson<{ code: string }[]>(path.join(LOCALES, "index.json"), [{ code: "en" }])

  // --- codes: append-only, index in the array is the exercise code ---
  let idMap = await readJson<string[]>(ID_MAP, [])
  if (idMap.length === 0) {
    const levelRank: Record<string, number> = { beginner: 0, intermediate: 1, expert: 2 }
    const rest = source
      .filter((s) => !TOP.includes(s.id))
      .sort(
        (a, b) =>
          Number(a.category !== "strength") - Number(b.category !== "strength") ||
          levelRank[a.level] - levelRank[b.level] ||
          Number(a.mechanic !== "compound") - Number(b.mechanic !== "compound") ||
          a.id.localeCompare(b.id),
      )
    idMap = [...TOP, ...rest.map((s) => s.id)]
  }
  const known = new Set(idMap)
  const added = [...source.map((s) => s.id), ...localById.keys()].filter((id) => !known.has(id)).sort()
  if (added.length) {
    if (check) {
      throw new Error(
        `New exercises are missing from data/id-map.json:\n  ${added.join("\n  ")}\n` +
          `Run "npm run data" locally and commit data/id-map.json.`,
      )
    }
    console.log(`New exercises: ${added.join(", ")}`)
    idMap = [...idMap, ...added]
  }

  // --- build core + texts ---
  const core: Core[] = []
  const texts: Record<string, Record<string, Text>> = Object.fromEntries(languages.map((l) => [l.code, {}]))
  const sourceTexts: Record<string, Record<string, Text>> = {}
  for (const { code } of languages) {
    if (code !== "en") sourceTexts[code] = await readJson(path.join(LOCALES, code, "exercises.json"), {})
  }
  const outVideos: Record<string, Video> = {}
  // Source images are immutable (pinned SHA) and may be reused; local ones are always rebuilt.
  const images: { from: () => Promise<Buffer>; out: string; reuse: boolean }[] = []
  const slugs = new Set<string>()

  idMap.forEach((id, c) => {
    const s = sourceById.get(id)
    const l = localById.get(id)
    if (!s && !l) return // removed exercise: the code stays reserved so old links still decode
    const slug = l ? l.slug : slugify(id)
    if (slugs.has(slug)) throw new Error(`Duplicate slug "${slug}" (${id}); rename content/exercises/${slug}`)
    slugs.add(slug)

    if (s) {
      const o = overrides[id] ?? {}
      if (o.hide) return
      const eq = o.equipment ?? (s.equipment ? SOURCE_EQUIP[s.equipment] : "body")
      if (o.images) {
        o.images.forEach((img, n) => images.push({ from: () => fs.readFile(path.join(CONTENT_IMAGES, img)), out: `${c}-${n}.webp`, reuse: false }))
      } else {
        s.images.forEach((img, n) =>
          images.push({ from: () => fetchCached(`${RAW}/exercises/${img}`, path.join(CACHE, "img", img)), out: `${c}-${n}.webp`, reuse: true }),
        )
      }
      core.push({
        c,
        s: slug,
        cat: s.category,
        lvl: s.level,
        mech: s.mechanic,
        force: s.force,
        eq,
        ...(o.equipmentExtra?.length ? { eqExtra: o.equipmentExtra } : {}),
        pm: s.primaryMuscles,
        sm: s.secondaryMuscles,
        pl: o.places ?? derivePlaces(s.name, eq),
        img: (o.images ?? s.images).length,
      })
      texts.en[slug] = { name: s.name, steps: s.instructions }
      for (const lang of Object.keys(sourceTexts)) {
        const t = sourceTexts[lang][slug]
        if (t) texts[lang][slug] = t
      }
      if (videos[slug]) outVideos[slug] = videos[slug]
    } else if (l) {
      const ex = l.ex
      l.images.forEach((img, n) => images.push({ from: () => fs.readFile(path.join(l.dir, img)), out: `${c}-${n}.webp`, reuse: false }))
      core.push({
        c,
        s: slug,
        cat: ex.category,
        lvl: ex.level,
        mech: ex.mechanic ?? null,
        force: ex.force ?? null,
        eq: ex.equipment,
        ...(ex.equipmentExtra?.length ? { eqExtra: ex.equipmentExtra } : {}),
        pm: ex.primary,
        sm: ex.secondary ?? [],
        pl: ex.places ?? derivePlaces(ex.i18n.en.name, ex.equipment),
        img: l.images.length,
      })
      for (const [lang, t] of Object.entries(ex.i18n)) {
        texts[lang] ??= {}
        texts[lang][slug] = t
      }
      if (ex.video) outVideos[slug] = ex.video
    }
  })

  // --- images ---
  console.log(`Images: ${images.length}`)
  const settingsFile = path.join(ROOT, ".cache", "img-settings.json")
  const settings = JSON.stringify(IMG_SIZES)
  if ((await fs.readFile(settingsFile, "utf8").catch(() => "")) !== settings) {
    await fs.rm(OUT_IMG, { recursive: true, force: true })
  }
  for (const { dir } of IMG_SIZES) await fs.mkdir(path.join(OUT_IMG, dir), { recursive: true })
  await fs.mkdir(path.dirname(settingsFile), { recursive: true })
  await fs.writeFile(settingsFile, settings)
  let converted = 0
  await pool(images, 16, async ({ from, out, reuse }) => {
    const dests = IMG_SIZES.map((size) => ({ ...size, dest: path.join(OUT_IMG, size.dir, out) }))
    if (reuse && (await Promise.all(dests.map((d) => exists(d.dest)))).every(Boolean)) return
    const input = await from()
    for (const { dest, width, quality } of dests) {
      await sharp(input, { animated: false })
        .resize({ width, withoutEnlargement: true })
        .webp({ quality, smartSubsample: true })
        .toFile(dest)
    }
    if (++converted % 200 === 0) console.log(`  ${converted} converted`)
  })

  // --- write ---
  await fs.mkdir(OUT_DATA, { recursive: true })
  if (!check) await fs.writeFile(ID_MAP, "[\n" + idMap.map((id) => JSON.stringify(id)).join(",\n") + "\n]\n")
  await fs.writeFile(path.join(OUT_DATA, "exercises.json"), JSON.stringify(core))
  await fs.writeFile(path.join(OUT_DATA, "videos.json"), JSON.stringify(outVideos))
  await fs.rm(OUT_LOCALES, { recursive: true, force: true })
  await fs.cp(LOCALES, OUT_LOCALES, { recursive: true })
  for (const [lang, t] of Object.entries(texts)) {
    await fs.mkdir(path.join(OUT_LOCALES, lang), { recursive: true })
    await fs.writeFile(path.join(OUT_LOCALES, lang, "exercises.json"), JSON.stringify(t))
  }
  // Translation coverage shown next to each language in the app: UI strings and exercise texts, equally weighted.
  const coverage: Record<string, number> = {}
  const enUi = await readJson(path.join(LOCALES, "en", "ui.json"), {})
  for (const { code } of languages) {
    if (code === "en") continue
    const ui = compareUi(enUi, await readJson(path.join(LOCALES, code, "ui.json"), {}), code)
    const ex = core.filter((e) => texts[code]?.[e.s]?.name).length / Math.max(1, core.length)
    coverage[code] = Math.floor(((ui.done / Math.max(1, ui.total) + ex) / 2) * 100)
  }
  await fs.writeFile(path.join(OUT_LOCALES, "coverage.json"), JSON.stringify(coverage))

  console.log(`Done: ${core.length} exercises (${local.length} local), ${Object.keys(outVideos).length} videos`)
}

if (process.argv[1]?.endsWith("build-data.ts")) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  })
}

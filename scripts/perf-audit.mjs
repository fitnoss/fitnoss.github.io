// Run after npm run build: node scripts/perf-audit.mjs
// Node microbenchmarks are comparative diagnostics, not browser Web Vitals.
import fs from "node:fs"
import path from "node:path"
import { performance } from "node:perf_hooks"
import { gzipSync } from "node:zlib"
import MiniSearch from "minisearch"

const root = path.resolve(import.meta.dirname, "..")
const read = (file) => fs.readFileSync(path.join(root, file))
const json = (file) => JSON.parse(read(file).toString())
const size = (file) => {
  const data = read(file)
  return { file, bytes: data.length, gzipBytes: gzipSync(data).length }
}
const measure = (fn, iterations = 100) => {
  for (let i = 0; i < 10; i++) fn()
  const times = Array.from({ length: iterations }, () => {
    const start = performance.now()
    fn()
    return performance.now() - start
  }).sort((a, b) => a - b)
  return { medianMs: +times[Math.floor(times.length / 2)].toFixed(3), p95Ms: +times[Math.floor(times.length * .95)].toFixed(3) }
}

const html = read("dist/index.html").toString()
const initialFiles = [...html.matchAll(/(?:src|href)="\/(assets\/[^" ]+\.(?:js|css))"/g)].map((m) => `dist/${m[1]}`)
const assets = initialFiles.map(size)
const dataFiles = ["dist/data/exercises.json", "dist/data/videos.json", "dist/locales/index.json", ...["en", "ru"].flatMap((lang) => ["ui", "exercises"].map((file) => `dist/locales/${lang}/${file}.json`))]
const exercises = json("dist/data/exercises.json")
const en = json("dist/locales/en/exercises.json")
const ru = json("dist/locales/ru/exercises.json")
const names = Object.fromEntries(Object.entries(ru).map(([slug, text]) => [slug, { name: text.name }]))
const namesBuffer = Buffer.from(JSON.stringify(names))
const documents = exercises.map((ex) => ({ id: ex.c, name: ru[ex.s]?.name || en[ex.s]?.name || ex.s, en: en[ex.s]?.name || "" }))
// Match the application's current term processing and search options.
const ruEnding = /(иями|ями|ами|иях|ание|ания|ение|ения|ого|его|ому|ему|ыми|ими|ой|ей|ий|ый|ая|яя|ое|ее|ые|ие|ов|ев|ам|ям|ах|ях|ом|ем|ую|юю|а|я|ы|и|у|ю|е|о|ь)$/
const enEnding = /(ings|ing|es|s)$/
const stem = (term) => {
  const value = term.toLowerCase().replace(/ё/g, "е")
  const cut = value.replace(/[а-я]/.test(value) ? ruEnding : enEnding, "")
  return cut.length >= 3 ? cut : value
}
const buildIndex = () => {
  const index = new MiniSearch({ fields: ["name", "en"], processTerm: stem, searchOptions: { prefix: true, fuzzy: .2, boost: { name: 2 }, boostDocument: (id) => 1 + 1 / (1 + Number(id) / 40) } })
  index.addAll(documents)
  return index
}
const index = buildIndex()
const makeSession = (i) => ({ id: `perf-${i}`, title: "Тестовая тренировка", startedAt: 1793350800000 - i * 86400000, endedAt: 1793354400000 - i * 86400000, exercises: Array.from({ length: 8 }, (_, ex) => ({ ex: ex + 1, reps: "8-12", rest: 90, sets: Array.from({ length: 4 }, () => ({ reps: 10, weight: 60, done: true })) })) })
const historySerialization = [0, 100, 500, 1000].map((count) => {
  const history = Array.from({ length: count }, (_, i) => makeSession(i))
  const { endedAt: _endedAt, ...active } = makeSession(0)
  const state = { state: { history, active: { ...active, id: "active" }, rest: { endsAt: 1793354490000, total: 90 } }, version: 1 }
  const serialize = () => JSON.stringify(state)
  const serialized = serialize()
  return { sessions: count, bytes: Buffer.byteLength(serialized), utf16CodeUnits: serialized.length, stringify: measure(serialize) }
})
const images = ["s", "l"].map((kind) => {
  const dir = `dist/img/ex/${kind}`
  const lengths = fs.readdirSync(path.join(root, dir)).filter((name) => name.endsWith(".webp")).map((name) => fs.statSync(path.join(root, dir, name)).size).sort((a, b) => a - b)
  return { kind, count: lengths.length, bytes: lengths.reduce((a, b) => a + b, 0), medianBytes: lengths[Math.floor(lengths.length / 2)], p95Bytes: lengths[Math.floor(lengths.length * .95)] }
})
console.log(JSON.stringify({
  environment: { node: process.version, platform: process.platform, arch: process.arch },
  initialAssets: assets,
  initialTotal: { bytes: assets.reduce((n, a) => n + a.bytes, 0), gzipBytes: assets.reduce((n, a) => n + a.gzipBytes, 0) },
  data: dataFiles.map(size),
  ruNamesOnlyExperiment: { bytes: namesBuffer.length, gzipBytes: gzipSync(namesBuffer).length },
  images,
  search: { exercises: exercises.length, buildIndex: measure(buildIndex), queries: ["присед", "жим", "подтягивания", "squat"].map((q) => ({ q, results: index.search(q).length, ...measure(() => index.search(q)) })) },
  historySerialization,
}, null, 2))

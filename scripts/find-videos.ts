/**
 * Finds YouTube candidates for exercises that have no approved video yet.
 * Needs yt-dlp on PATH (https://github.com/yt-dlp/yt-dlp); it only queries search
 * metadata, nothing is downloaded.
 *
 *   npm run videos:find                 all exercises without a video
 *   npm run videos:find -- --limit 50   first 50 (most popular first)
 *
 * Writes data/videos.candidates.json (git-ignored, resumable). Review the candidates
 * on #/dev/videos in `npm run dev`, then save the result as data/videos.json.
 */
import { execFile } from "node:child_process"
import fs from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"

const run = promisify(execFile)
const ROOT = path.resolve(import.meta.dirname, "..")
const OUT = path.join(ROOT, "data", "videos.candidates.json")
const CHANNELS = path.join(ROOT, "data", "video-channels.json")

type Candidate = { id: string; title: string; channel: string; duration?: number }

const readJson = async <T>(file: string, fallback: T): Promise<T> =>
  JSON.parse(await fs.readFile(file, "utf8").catch(() => JSON.stringify(fallback))) as T

async function search(query: string, n: number): Promise<Candidate[]> {
  const { stdout } = await run("yt-dlp", [`ytsearch${n}:${query}`, "--flat-playlist", "--dump-json", "--no-warnings"], {
    maxBuffer: 16 * 1024 * 1024,
  })
  return stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .map((v) => ({ id: v.id, title: v.title, channel: v.channel ?? v.uploader ?? "", duration: v.duration }))
}

async function main() {
  try {
    await run("yt-dlp", ["--version"])
  } catch {
    console.error("yt-dlp not found. Install it (e.g. `pip install yt-dlp`) and try again.")
    process.exit(1)
  }
  const limitArg = process.argv.indexOf("--limit")
  const limit = limitArg > 0 ? Number(process.argv[limitArg + 1]) : Infinity

  const exercises: { c: number; s: string }[] = await readJson(path.join(ROOT, "public", "data", "exercises.json"), [])
  const en: Record<string, { name: string }> = await readJson(path.join(ROOT, "public", "locales", "en", "exercises.json"), {})
  if (!exercises.length) throw new Error("Run `npm run data` first")
  const approved: Record<string, unknown> = await readJson(path.join(ROOT, "data", "videos.json"), {})
  const preferred: string[] = (await readJson<string[]>(CHANNELS, [])).map((c) => c.toLowerCase())
  const out: Record<string, Candidate[]> = await readJson(OUT, {})

  const todo = exercises.filter((e) => !approved[e.s] && !out[e.s]).slice(0, limit)
  console.log(`Searching ${todo.length} exercises…`)
  for (const [i, ex] of todo.entries()) {
    const name = en[ex.s]?.name ?? ex.s
    try {
      const found = await search(`${name} exercise how to proper form`, 8)
      // Short demos from preferred channels first; skip shorts-length clips and very long videos.
      const score = (c: Candidate) =>
        (preferred.includes(c.channel.toLowerCase()) ? 0 : 10) + (c.duration && c.duration > 20 && c.duration < 900 ? 0 : 5)
      out[ex.s] = found.sort((a, b) => score(a) - score(b)).slice(0, 3)
      console.log(`${i + 1}/${todo.length} ${name}: ${out[ex.s].map((c) => c.channel).join(", ")}`)
    } catch (e) {
      console.warn(`${name}: ${(e as Error).message.split("\n")[0]}`)
    }
    if (i % 10 === 9) await fs.writeFile(OUT, JSON.stringify(out, null, 1))
  }
  await fs.writeFile(OUT, JSON.stringify(out, null, 1))
  console.log(`Saved ${Object.keys(out).length} exercises with candidates to data/videos.candidates.json`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

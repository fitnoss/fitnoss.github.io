/**
 * Creates content/exercises/<slug>/ from the template.
 *
 *   npm run new-exercise -- archer-pull-up
 */
import fs from "node:fs/promises"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const slug = process.argv[2]

if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error("Usage: npm run new-exercise -- <kebab-case-slug>")
  process.exit(1)
}

const dir = path.join(ROOT, "content", "exercises", slug)
try {
  await fs.access(dir)
  console.error(`content/exercises/${slug} already exists`)
  process.exit(1)
} catch {}

await fs.cp(path.join(ROOT, "content", "exercises", "_template"), dir, { recursive: true })
console.log(`Created content/exercises/${slug}/exercise.json
Next:
  1. Fill in exercise.json (remove "video" if you have none)
  2. Drop photos next to it: 0.jpg, 1.jpg (optional, any of jpg/png/webp)
  3. npm run data   — validates it and gives it a permanent code
  4. Commit the folder and data/id-map.json`)

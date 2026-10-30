// Local-only fixture for observing real download/clipboard failures in the production UI.
// Run `npm run build`, then `node scripts/ux-fault-server.mjs` and open the printed URL.
import http from "node:http"
import fs from "node:fs/promises"
import path from "node:path"

const port = Number(process.argv[2] ?? 5176)
const root = path.resolve(import.meta.dirname, "../dist")
const catalog = JSON.parse(await fs.readFile(path.join(root, "data/exercises.json"), "utf8")).slice(0, 2)
const mime = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".webmanifest": "application/manifest+json", ".woff2": "font/woff2", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".png": "image/png",
}
let failedImage = false

http.createServer(async (request, response) => {
  response.setHeader("Permissions-Policy", "clipboard-write=()")
  response.setHeader("Cache-Control", "no-store")
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname)
  if (pathname === "/data/exercises.json") {
    response.setHeader("Content-Type", "application/json")
    response.end(JSON.stringify(catalog))
    return
  }
  if (!failedImage && pathname === `/img/ex/l/${catalog[0].c}-0.webp`) {
    failedImage = true
    response.writeHead(503, { "Content-Type": "text/plain" })
    response.end("Intentional one-time image failure")
    return
  }
  const filename = path.resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`)
  if (!filename.startsWith(root + path.sep)) {
    response.writeHead(403).end()
    return
  }
  try {
    const bytes = await fs.readFile(filename)
    response.setHeader("Content-Type", mime[path.extname(filename)] ?? "application/octet-stream")
    response.end(bytes)
  } catch {
    response.writeHead(404).end()
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`UX failure fixture: http://127.0.0.1:${port}`)
  console.log("2 exercises only; one image fails once; clipboard writes are denied by Permissions-Policy.")
})

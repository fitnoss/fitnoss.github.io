import { useExerciseStore, useFavorites } from "@/entities/exercise/store"
import { imageUrl } from "@/entities/exercise/types"
import { useProgramStore } from "@/entities/program/store"
import type { Program } from "@/entities/program/types"
import { useSessionStore, type Session } from "@/entities/session/store"

type Backup = {
  app: "fitnoss"
  version: 1
  exportedAt: string
  programs: Program[]
  history: Session[]
  favorites: number[]
}

export function exportBackup() {
  const data: Backup = {
    app: "fitnoss",
    version: 1,
    exportedAt: new Date().toISOString(),
    programs: useProgramStore.getState().programs,
    history: useSessionStore.getState().history,
    favorites: useFavorites.getState().codes,
  }
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `fitnoss-backup-${data.exportedAt.slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

/** Merges a backup into local data; existing items with the same id are kept. */
export async function importBackup(file: File) {
  const data = JSON.parse(await file.text()) as Partial<Backup>
  if (data.app !== "fitnoss" || !Array.isArray(data.programs) || !Array.isArray(data.history)) {
    throw new Error("not a fitnoss backup")
  }
  const programs = useProgramStore.getState().programs
  const ids = new Set(programs.map((p) => p.id))
  useProgramStore.setState({ programs: [...programs, ...data.programs.filter((p) => !ids.has(p.id))] })
  useSessionStore.getState().importHistory(data.history)
  const fav = new Set([...useFavorites.getState().codes, ...(data.favorites ?? [])])
  useFavorites.setState({ codes: [...fav] })
  return { programs: data.programs.length, sessions: data.history.length }
}

export const IMAGE_CACHE = "ex-images"

/** Downloads every exercise image into the service-worker cache for offline use. */
export async function downloadAllImages(onProgress: (done: number, total: number) => void) {
  const { list } = useExerciseStore.getState()
  const urls = list.flatMap((ex) => Array.from({ length: ex.img }, (_, n) => new URL(imageUrl(ex, n), location.href).href))
  const cache = await caches.open(IMAGE_CACHE)
  let done = 0
  const queue = [...urls]
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (queue.length) {
        const url = queue.shift()!
        if (!(await cache.match(url))) {
          try {
            const res = await fetch(url)
            if (res.ok) await cache.put(url, res)
          } catch {}
        }
        onProgress(++done, urls.length)
      }
    }),
  )
}

import { useExerciseStore, useFavorites } from "@/entities/exercise/store"
import { imageUrl } from "@/entities/exercise/types"
import { useProgramStore } from "@/entities/program/store"
import type { Program, ProgramItem } from "@/entities/program/types"
import { useSessionStore, type Session, type SessionExercise, type SetLog } from "@/entities/session/store"
import { SET_TYPES, validEffort } from "@/entities/session/sets"

export type Backup = {
  app: "fitnoss"
  version: 1
  exportedAt: string
  programs: Program[]
  history: Session[]
  favorites: number[]
}

export const LAST_EXPORT = "fitnoss:last-export"
export const OFFLINE_STATUS = "fitnoss:offline-images"

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
  localStorage.setItem(LAST_EXPORT, data.exportedAt)
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

/** Validate and preview without changing local data. */
export async function readBackup(file: File): Promise<Backup> {
  const data = JSON.parse(await file.text()) as Backup
  if (data?.app !== "fitnoss" || data.version !== 1 || !Array.isArray(data.programs) || !Array.isArray(data.history) ||
      !data.programs.every((p) => typeof p?.id === "string" && typeof p.name === "string" &&
        Array.isArray(p.days) && p.days.length > 0 && p.days.every((d) =>
          typeof d?.name === "string" && Array.isArray(d.items) && d.items.every(validItem))) ||
      !data.history.every(validSession) ||
      (data.favorites !== undefined && (!Array.isArray(data.favorites) || !data.favorites.every(Number.isFinite)))) throw new Error("not a fitnoss backup")
  return data
}

const nonnegative = (value: number) => Number.isFinite(value) && value >= 0
const optionalNumber = (value?: number) => value === undefined || nonnegative(value)
const optionalText = (value?: string) => value === undefined || typeof value === "string"
const code = (value: number) => Number.isInteger(value) && value >= 0

function validItem(item: ProgramItem) {
  return code(item?.ex) && Number.isInteger(item.sets) && item.sets > 0 && typeof item.reps === "string" &&
    nonnegative(item.rest) && optionalNumber(item.weight) && optionalNumber(item.inc) && optionalText(item.note)
}

function validSet(set: SetLog) {
  return typeof set?.done === "boolean" && optionalNumber(set.weight) && optionalNumber(set.reps) &&
    (set.type === undefined || SET_TYPES.includes(set.type)) &&
    (set.effort === undefined || !!validEffort(set.effort))
}

function validExercise(exercise: SessionExercise) {
  return code(exercise?.ex) && typeof exercise.reps === "string" && nonnegative(exercise.rest) &&
    optionalText(exercise.note) && Array.isArray(exercise.sets) && exercise.sets.every(validSet)
}

function validSession(session: Session) {
  return typeof session?.id === "string" && typeof session.title === "string" && nonnegative(session.startedAt) &&
    optionalNumber(session.endedAt) && optionalNumber(session.pausedMs) &&
    Array.isArray(session.exercises) && session.exercises.every(validExercise) &&
    (session.unfinishedPlan === undefined || (Array.isArray(session.unfinishedPlan) && session.unfinishedPlan.every(validExercise)))
}

export function backupSummary(data: Backup) {
  const programs = new Set(useProgramStore.getState().programs.map((p) => p.id))
  const sessions = new Set(useSessionStore.getState().history.map((s) => s.id))
  const incomingPrograms = new Set(data.programs.map((p) => p.id))
  const incomingSessions = new Set(data.history.map((s) => s.id))
  return {
    programs: [...incomingPrograms].filter((id) => !programs.has(id)).length,
    sessions: [...incomingSessions].filter((id) => !sessions.has(id)).length,
    existing: [...incomingPrograms].filter((id) => programs.has(id)).length + [...incomingSessions].filter((id) => sessions.has(id)).length,
    favorites: new Set(data.favorites ?? []).size,
  }
}

/** Existing IDs are preserved; report actual additions. */
export function mergeBackup(data: Backup) {
  const summary = backupSummary(data)
  const programs = useProgramStore.getState().programs
  const ids = new Set(programs.map((p) => p.id))
  const added = data.programs.filter((p) => { if (ids.has(p.id)) return false; ids.add(p.id); return true })
  useProgramStore.setState({ programs: [...programs, ...added] })
  useSessionStore.getState().importHistory([...new Map(data.history.map((s) => [s.id, s])).values()])
  useFavorites.setState({ codes: [...new Set([...useFavorites.getState().codes, ...(data.favorites ?? [])])] })
  return summary
}

export async function importBackup(file: File) { return mergeBackup(await readBackup(file)) }

export const IMAGE_CACHE = "ex-images"

/** Downloads every exercise image into the service-worker cache for offline use. */
export async function downloadAllImages(onProgress: (done: number, total: number) => void) {
  const { list } = useExerciseStore.getState()
  if (!list.length) throw new Error("exercise catalog is not loaded")
  const urls = list.flatMap((ex) =>
    Array.from({ length: ex.img }, (_, n) => (["s", "l"] as const).map((size) => new URL(imageUrl(ex, n, size), location.href).href)).flat(),
  )
  const cache = await caches.open(IMAGE_CACHE)
  let done = 0
  let downloaded = 0
  let failed = 0
  const queue = [...urls]
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (queue.length) {
        const url = queue.shift()!
        try {
          if (!(await cache.match(url))) {
            const res = await fetch(url)
            if (!res.ok) throw new Error("download failed")
            await cache.put(url, res)
          }
          downloaded++
        } catch { failed++ }
        onProgress(++done, urls.length)
      }
    }),
  )
  const result = { downloaded, failed, total: urls.length, at: new Date().toISOString() }
  localStorage.setItem(OFFLINE_STATUS, JSON.stringify(result))
  return result
}

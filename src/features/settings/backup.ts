import { useExerciseStore, useFavorites } from "@/entities/exercise/store"
import { imageUrl } from "@/entities/exercise/types"
import { isCustomCode, mergeCustomExercises, useCustomExerciseStore, validCustomExercise, type CustomExercise } from "@/entities/exercise/custom"
import { useProgramStore } from "@/entities/program/store"
import { remapWorkout, type Program, type ProgramItem, type WorkoutMode } from "@/entities/program/types"
import { validDate, validSchedule, validTime, type ScheduleEntry } from "@/entities/program/schedule"
import { useSessionStore, type Session, type SessionExercise, type SetLog } from "@/entities/session/store"
import { SET_TYPES, validEffort } from "@/entities/session/sets"
import { listMeasurements, mergeMeasurements } from "@/entities/body/storage"
import { deserializeMeasurements, serializeMeasurements, type BodyBackupEntry } from "@/entities/body/backup"
import { uid } from "@/shared/lib/id"

export type Backup = {
  app: "fitnoss"
  version: 3
  exportedAt: string
  programs: Program[]
  schedule: ScheduleEntry[]
  customExercises: CustomExercise[]
  history: Session[]
  favorites: number[]
  measurements: BodyBackupEntry[]
}

export const LAST_EXPORT = "fitnoss:last-export"
export const OFFLINE_STATUS = "fitnoss:offline-images"

export async function createBackup(): Promise<Backup> {
  const { programs, schedule } = useProgramStore.getState()
  return {
    app: "fitnoss",
    version: 3,
    exportedAt: new Date().toISOString(),
    programs,
    schedule,
    customExercises: useCustomExerciseStore.getState().exercises,
    history: useSessionStore.getState().history,
    favorites: useFavorites.getState().codes,
    measurements: await serializeMeasurements(await listMeasurements()),
  }
}

export async function exportBackup() {
  const data = await createBackup()
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
  validateBackup(data)
  deserializeMeasurements(data.measurements)
  return data
}

function validateBackup(data: Backup) {
  if (data?.app !== "fitnoss" || data.version !== 3 || typeof data.exportedAt !== "string" ||
      !Number.isFinite(Date.parse(data.exportedAt)) || !Array.isArray(data.programs) ||
      !Array.isArray(data.history) || !Array.isArray(data.schedule) ||
      !Array.isArray(data.customExercises) || !data.customExercises.every(validCustomExercise) ||
      !Array.isArray(data.favorites) || !data.favorites.every(code)) throw new Error("not a fitnoss backup")
  const custom = new Set(data.customExercises.map((exercise) => exercise.code))
  if (custom.size !== data.customExercises.length) throw new Error("duplicate custom exercise")
  const known = (id: number) => !isCustomCode(id) || custom.has(id)
  const workouts = new Map<string, string>()
  const programs = uniqueById(data.programs, validProgram)
  for (const program of programs.values()) for (const day of program.days) {
    if (workouts.has(day.id) || !day.items.every((item) => known(item.ex))) throw new Error("invalid workout reference")
    workouts.set(day.id, program.id)
  }
  const schedule = uniqueById(data.schedule, validSchedule)
  for (const entry of schedule.values()) {
    if (!workouts.has(entry.workoutId)) throw new Error("missing workout for schedule entry")
  }
  for (const session of uniqueById(data.history, validSession).values()) {
    if (![...session.exercises, ...(session.unfinishedPlan ?? [])].every((exercise) => known(exercise.ex))) throw new Error("missing custom exercise in history")
    const entry = session.occurrence && schedule.get(session.occurrence.entryId)
    if (entry && entry.workoutId !== session.workoutId) throw new Error("invalid session occurrence")
  }
  if (!data.favorites.every(known)) throw new Error("missing favorite custom exercise")
}

function uniqueById<T extends { id: string }>(records: T[], valid: (record: T) => boolean) {
  const unique = new Map<string, T>()
  for (const record of records) {
    if (!valid(record)) throw new Error("invalid backup record")
    const previous = unique.get(record.id)
    if (previous && JSON.stringify(previous) !== JSON.stringify(record)) throw new Error("conflicting backup records")
    unique.set(record.id, record)
  }
  return unique
}

const nonnegative = (value: number) => Number.isFinite(value) && value >= 0
const optionalNumber = (value?: number) => value === undefined || nonnegative(value)
const optionalText = (value?: string) => value === undefined || typeof value === "string"
const code = (value: number) => Number.isInteger(value) && value >= 0 && value <= 0xFFFFFFFF
const id = (value?: string) => typeof value === "string" && !!value
const mode = (value?: WorkoutMode) => value === undefined || value === "detailed" || value === "checklist"
const timestamp = (value: number) => nonnegative(value) && Number.isFinite(new Date(value).getTime())
const target = (value: string, checklist: boolean) => typeof value === "string" &&
  ((checklist && value === "") || /^(?:\d{1,6}(?:-\d{1,6}|s)?|amrap|max)$/.test(value))

function validProgram(program: Program) {
  return id(program?.id) && typeof program.name === "string" && timestamp(program.createdAt) && timestamp(program.updatedAt) &&
    Array.isArray(program.days) && program.days.length > 0 && program.days.length <= 8 &&
    program.days.every((day) => id(day?.id) && typeof day.name === "string" && mode(day.mode) &&
      Array.isArray(day.items) && day.items.every((item) => validItem(item, day.mode === "checklist")))
}

function validItem(item: ProgramItem, checklist: boolean) {
  return code(item?.ex) && Number.isInteger(item.sets) && item.sets > 0 && item.sets <= 1000 && target(item.reps, checklist) &&
    nonnegative(item.rest) && optionalNumber(item.weight) && optionalNumber(item.inc) && optionalText(item.note) &&
    (item.superset === undefined || item.superset === true)
}

function validSet(set: SetLog) {
  return typeof set?.done === "boolean" && optionalNumber(set.weight) && optionalNumber(set.reps) &&
    (set.type === undefined || SET_TYPES.includes(set.type)) &&
    (set.effort === undefined || !!validEffort(set.effort))
}

function validExercise(exercise: SessionExercise, checklist: boolean, completed: boolean) {
  return code(exercise?.ex) && target(exercise.reps, checklist) && nonnegative(exercise.rest) &&
    optionalText(exercise.note) && Array.isArray(exercise.sets) && (checklist
      ? exercise.sets.length === 0 && (completed ? exercise.checked === true : typeof exercise.checked === "boolean")
      : exercise.checked === undefined && exercise.sets.every(validSet))
}

function validSession(session: Session) {
  const checklist = session?.mode === "checklist"
  return id(session?.id) && typeof session.title === "string" && timestamp(session.startedAt) && mode(session.mode) &&
    (session.endedAt === undefined || timestamp(session.endedAt)) && optionalNumber(session.pausedMs) &&
    (session.workoutId === undefined || id(session.workoutId)) &&
    (session.occurrence === undefined || (!!session.occurrence && id(session.workoutId) && id(session.occurrence.entryId) &&
      validDate(session.occurrence.date) && validTime(session.occurrence.time))) &&
    Array.isArray(session.exercises) && session.exercises.every((exercise) => validExercise(exercise, checklist, true)) &&
    (session.unfinishedPlan === undefined || (Array.isArray(session.unfinishedPlan) &&
      session.unfinishedPlan.every((exercise) => validExercise(exercise, checklist, false))))
}

export async function backupSummary(data: Backup) {
  const programs = new Set(useProgramStore.getState().programs.map((p) => p.id))
  const { active, history } = useSessionStore.getState()
  const sessions = new Set(history.map((s) => s.id))
  if (active) sessions.add(active.id)
  const incomingPrograms = new Set(data.programs.map((p) => p.id))
  const incomingSessions = new Set(data.history.map((s) => s.id))
  const measurements = new Set(data.measurements.length ? (await listMeasurements()).map((entry) => entry.id) : [])
  const incomingMeasurements = new Set(data.measurements.map((entry) => entry.id))
  const local = useCustomExerciseStore.getState().exercises
  const customExercises = mergeCustomExercises(local, data.customExercises).exercises.length - local.length
  const localSchedule = useProgramStore.getState().schedule
  const schedule = mergeProgramData(data, new Map()).schedule.length - localSchedule.length
  const scheduleIds = new Set(localSchedule.map((entry) => entry.id))
  const existing = [...incomingPrograms].filter((id) => programs.has(id)).length +
    [...incomingSessions].filter((id) => sessions.has(id)).length +
    [...incomingMeasurements].filter((id) => measurements.has(id)).length +
    [...new Set(data.schedule.map((entry) => entry.id))].filter((id) => scheduleIds.has(id)).length +
    data.customExercises.length - customExercises
  return {
    programs: [...incomingPrograms].filter((id) => !programs.has(id)).length,
    sessions: [...incomingSessions].filter((id) => !sessions.has(id)).length,
    measurements: [...incomingMeasurements].filter((id) => !measurements.has(id)).length,
    existing,
    favorites: new Set(data.favorites).size,
    customExercises,
    schedule,
  }
}

/** Existing IDs are preserved; report actual additions. */
export async function mergeBackup(data: Backup) {
  validateBackup(data)
  const summary = await backupSummary(data)
  // Commit photo data first, so a quota error leaves the existing localStorage stores alone.
  const measurements = data.measurements.length ? await mergeMeasurements(deserializeMeasurements(data.measurements)) : 0
  const local = useCustomExerciseStore.getState().exercises
  const { exercises, codes } = mergeCustomExercises(local, data.customExercises)
  const { programs, schedule, workoutIds } = mergeProgramData(data, codes)
  const exerciseCode = (code: number) => codes.get(code) ?? code
  const remapExercises = (items: SessionExercise[]) => items.map((item) => ({ ...item, ex: exerciseCode(item.ex) }))
  const sessions = data.history.map((session) => ({
    ...session,
    workoutId: session.workoutId ? (workoutIds.get(session.workoutId) ?? session.workoutId) : undefined,
    exercises: remapExercises(session.exercises),
    ...(session.unfinishedPlan ? { unfinishedPlan: remapExercises(session.unfinishedPlan) } : {}),
  }))
  const scheduleCount = schedule.length - useProgramStore.getState().schedule.length
  const programCount = programs.length - useProgramStore.getState().programs.length
  const sessionCount = useSessionStore.getState().history.length
  if (exercises.length !== local.length) useCustomExerciseStore.setState({ exercises })
  if (scheduleCount || programCount) useProgramStore.setState({ programs, schedule })
  useSessionStore.getState().importHistory(sessions)
  useFavorites.setState({ codes: [...new Set([...useFavorites.getState().codes, ...data.favorites.map(exerciseCode)])] })
  return { ...summary, measurements, schedule: scheduleCount, programs: programCount,
    sessions: useSessionStore.getState().history.length - sessionCount, customExercises: exercises.length - local.length }
}

function mergeProgramData(data: Backup, codes: ReadonlyMap<number, number>) {
  const current = useProgramStore.getState()
  const programs = new Map(current.programs.map((program) => [program.id, program]))
  const usedWorkouts = new Set(current.programs.flatMap((program) => program.days.map((day) => day.id)))
  const workoutIds = new Map<string, string>()
  for (const incoming of data.programs) {
    const local = programs.get(incoming.id)
    if (local) {
      for (const day of incoming.days) if (local.days.some((item) => item.id === day.id)) workoutIds.set(day.id, day.id)
      continue
    }
    const days = incoming.days.map((day) => {
      let id = day.id
      while (usedWorkouts.has(id)) id = uid()
      usedWorkouts.add(id)
      workoutIds.set(day.id, id)
      return { ...remapWorkout(day, codes), id }
    })
    programs.set(incoming.id, { ...incoming, days })
  }
  const schedule = new Map(current.schedule.map((entry) => [entry.id, entry]))
  for (const entry of data.schedule) {
    const workoutId = workoutIds.get(entry.workoutId)
    if (workoutId && !schedule.has(entry.id)) schedule.set(entry.id, { ...entry, workoutId })
  }
  return { programs: [...programs.values()], schedule: [...schedule.values()], workoutIds }
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

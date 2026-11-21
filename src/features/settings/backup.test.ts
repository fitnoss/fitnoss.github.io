import { IDBFactory } from "fake-indexeddb"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.hoisted(() => {
  const data = new Map<string, string>()
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value) },
    removeItem: (key: string) => { data.delete(key) },
  })
  vi.stubGlobal("window", { localStorage })
  vi.stubGlobal("location", { href: "https://fitnoss.test/" })
})
vi.mock("@/shared/storage/settings", () => ({ useSettings: { getState: () => ({ defaultRest: 90 }) } }))
vi.mock("@/shared/i18n", () => ({ fetchLocale: vi.fn() }))

import { useExerciseStore, useFavorites } from "@/entities/exercise/store"
import { useProgramStore } from "@/entities/program/store"
import { CUSTOM_CODE_START, useCustomExerciseStore } from "@/entities/exercise/custom"
import { useSessionStore } from "@/entities/session/store"
import { backupSummary, createBackup, downloadAllImages, mergeBackup, readBackup, type Backup } from "./backup"
import { listMeasurements, saveMeasurement } from "@/entities/body/storage"
import { serializeMeasurements } from "@/entities/body/backup"

beforeEach(() => {
  vi.stubGlobal("indexedDB", new IDBFactory())
  useProgramStore.setState({ programs: [], schedule: [] })
  useCustomExerciseStore.setState({ exercises: [] })
  useSessionStore.setState({ history: [], active: undefined, rest: undefined })
  useFavorites.setState({ codes: [] })
})

const backup = (): Backup => ({ app: "fitnoss", version: 3, exportedAt: "2026-10-31", programs: [], schedule: [], customExercises: [], history: [], favorites: [], measurements: [] })

describe("backup merge", () => {
  it("previews, merges and restores body photo bytes without replacing local measurements", async () => {
    const local = { id: "local", date: "2026-10-31", values: { weight: 75 }, updatedAt: 1 }
    const incoming = { ...local, id: "incoming", photo: new Blob(["photo"], { type: "image/jpeg" }) }
    await saveMeasurement(local)
    const data = { ...backup(), measurements: await serializeMeasurements([{ ...local, values: { weight: 60 } }, incoming, incoming]) }
    const parsed = await readBackup(new File([JSON.stringify(data)], "body.json"))
    expect(await listMeasurements()).toEqual([local])
    expect(await backupSummary(parsed)).toMatchObject({ measurements: 1, existing: 1 })
    expect(await mergeBackup(parsed)).toMatchObject({ measurements: 1 })
    const restored = await listMeasurements()
    expect(restored.find((entry) => entry.id === "local")?.values.weight).toBe(75)
    expect(await restored.find((entry) => entry.id === "incoming")?.photo?.text()).toBe("photo")
    expect(await mergeBackup(parsed)).toMatchObject({ measurements: 0 })
    const broken = { ...data, measurements: [{ ...data.measurements[0], values: { weight: -10 } }] }
    await expect(readBackup(new File([JSON.stringify(broken)], "broken.json"))).rejects.toThrow()
  })
  it("previews without changes, keeps local IDs and counts actual additions including input duplicates", async () => {
    const existing = useProgramStore.getState().create({ name: "Local", days: [{ name: "", items: [] }] })
    const incoming = { ...existing, id: "new", name: "New", days: [{ ...existing.days[0], id: "new-workout" }] }
    const data = { ...backup(), programs: [{ ...existing, name: "Overwrite" }, incoming, incoming], favorites: [1, 1, 2] }
    const parsed = await readBackup(new File([JSON.stringify(data)], "backup.json"))
    expect(useProgramStore.getState().programs).toEqual([existing])
    expect(await backupSummary(parsed)).toEqual({ programs: 1, sessions: 0, existing: 1, favorites: 2, measurements: 0, schedule: 0, customExercises: 0 })
    expect((await mergeBackup(parsed)).programs).toBe(1)
    expect(useProgramStore.getState().programs).toEqual([existing, incoming])
    expect(useFavorites.getState().codes).toEqual([1, 2])
    expect((await mergeBackup(parsed)).programs).toBe(0)
  })
  it("rejects malformed nested data before changing stores", async () => {
    const broken = { ...backup(), history: [{ id: "broken", exercises: null }] }
    await expect(readBackup(new File([JSON.stringify(broken)], "broken.json"))).rejects.toThrow()
    expect(useSessionStore.getState().history).toEqual([])
  })
  it("round-trips a resumable session and rejects an invalid pending plan", async () => {
    useSessionStore.getState().start({ title: "Partial", plan: { name: "", items: [{ ex: 1, sets: 2, reps: "8", rest: 60, note: "Pause" }] } })
    useSessionStore.getState().updateSet(0, 0, { done: true, weight: 60 })
    const saved = useSessionStore.getState().finish()!
    const data = { ...backup(), history: [saved] }
    const parsed = await readBackup(new File([JSON.stringify(data)], "resume.json"))
    useSessionStore.setState({ history: [] })
    await mergeBackup(parsed)
    expect(useSessionStore.getState().resume(saved.id)).toBe(true)
    expect(useSessionStore.getState().active!.exercises[0].sets.map((set) => set.done)).toEqual([true, false])
    expect(useSessionStore.getState().active!.exercises[0].note).toBe("Pause")
    const invalid = { ...data, history: [{ ...saved, unfinishedPlan: [{ ...saved.unfinishedPlan![0], sets: null }] }] }
    await expect(readBackup(new File([JSON.stringify(invalid)], "bad-plan.json"))).rejects.toThrow()
  })

  it("restores schedule and checklist history while remapping a conflicting custom exercise", async () => {
    const exercise = useCustomExerciseStore.getState().create({ name: "Wall reach", instructions: "Reach slowly." })
    const program = useProgramStore.getState().create({ name: "Home", days: [{ name: "Mobility", mode: "checklist",
      items: [{ ex: exercise.code, sets: 1, reps: "30s", rest: 0 }, { ex: exercise.code, sets: 1, reps: "", rest: 0 }] }] },
    [{ date: "2026-11-02", repeat: "weekly", weekdays: [0], time: "08:00" }])
    const entry = useProgramStore.getState().schedule[0]
    useSessionStore.getState().start({ title: "Mobility", workoutId: program.days[0].id,
      occurrence: { date: entry.date, entryId: entry.id }, plan: program.days[0] })
    useSessionStore.getState().toggleExercise(0)
    const session = useSessionStore.getState().finish()!
    useFavorites.setState({ codes: [exercise.code] })
    const data = await createBackup()
    useProgramStore.setState({ programs: [], schedule: [] })
    useSessionStore.setState({ history: [] })
    useCustomExerciseStore.setState({ exercises: [{ code: CUSTOM_CODE_START, name: "Local exercise" }] })
    useFavorites.setState({ codes: [CUSTOM_CODE_START] })
    const file = (backup: Backup) => new File([JSON.stringify(backup)], "backup.json")
    await expect(readBackup(file({ ...data, customExercises: [] }))).rejects.toThrow()
    await expect(readBackup(file({ ...data, schedule: [{ ...entry, workoutId: "missing" }] }))).rejects.toThrow()
    const parsed = await readBackup(file(data))
    expect(await mergeBackup(parsed)).toMatchObject({ schedule: 1, customExercises: 1, sessions: 1 })
    const code = CUSTOM_CODE_START + 1
    expect(useCustomExerciseStore.getState().exercises).toEqual([{ code: CUSTOM_CODE_START, name: "Local exercise" }, { ...exercise, code }])
    expect(useProgramStore.getState().programs[0].days[0].items.every((item) => item.ex === code)).toBe(true)
    expect(useProgramStore.getState().schedule).toEqual([entry])
    expect(useSessionStore.getState().history[0]).toMatchObject({ occurrence: session.occurrence, exercises: [{ ex: code, checked: true }],
      unfinishedPlan: [{ ex: code, checked: true }, { ex: code, checked: false }] })
    expect(useFavorites.getState().codes).toEqual([CUSTOM_CODE_START, code])
    expect(await mergeBackup(parsed)).toMatchObject({ programs: 0, schedule: 0, customExercises: 0, sessions: 0 })
  })
})

describe("offline image queue", () => {
  it("counts cached, downloaded and failed files separately, then retries only missing files", async () => {
    useExerciseStore.setState({ list: [{ c: 1, img: 2 } as never] })
    const saved = new Set(["https://fitnoss.test/img/ex/s/1-0.webp"])
    vi.stubGlobal("caches", { open: async () => ({ match: async (url: string) => saved.has(url), put: async (url: string) => { saved.add(url) } }) })
    const fetch = vi.fn(async (url: string) => ({ ok: !url.endsWith("l/1-1.webp") }))
    vi.stubGlobal("fetch", fetch)
    const progress = vi.fn()
    const partial = await downloadAllImages(progress)
    expect(partial).toMatchObject({ total: 4, downloaded: 3, failed: 1 })
    expect(progress).toHaveBeenLastCalledWith(4, 4)
    fetch.mockClear().mockImplementation(async () => ({ ok: true }))
    expect(await downloadAllImages(progress)).toMatchObject({ total: 4, downloaded: 4, failed: 0 })
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})

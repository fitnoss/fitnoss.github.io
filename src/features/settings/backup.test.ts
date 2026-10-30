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
import { useSessionStore } from "@/entities/session/store"
import { backupSummary, downloadAllImages, mergeBackup, readBackup, type Backup } from "./backup"

beforeEach(() => {
  useProgramStore.setState({ programs: [] })
  useSessionStore.setState({ history: [], active: undefined, rest: undefined })
  useFavorites.setState({ codes: [] })
})

const backup = (): Backup => ({ app: "fitnoss", version: 1, exportedAt: "2026-10-31", programs: [], history: [], favorites: [] })

describe("backup merge", () => {
  it("previews without changes, keeps local IDs and counts actual additions including input duplicates", async () => {
    const existing = useProgramStore.getState().create({ name: "Local", days: [{ name: "", items: [] }] })
    const incoming = { ...existing, id: "new", name: "New" }
    const data = { ...backup(), programs: [{ ...existing, name: "Overwrite" }, incoming, incoming], favorites: [1, 1, 2] }
    const parsed = await readBackup(new File([JSON.stringify(data)], "backup.json"))
    expect(useProgramStore.getState().programs).toEqual([existing])
    expect(backupSummary(parsed)).toEqual({ programs: 1, sessions: 0, existing: 1, favorites: 2 })
    expect(mergeBackup(parsed).programs).toBe(1)
    expect(useProgramStore.getState().programs).toEqual([existing, incoming])
    expect(useFavorites.getState().codes).toEqual([1, 2])
    expect(mergeBackup(parsed).programs).toBe(0)
  })
  it("rejects malformed nested data before changing stores", async () => {
    const broken = { ...backup(), history: [{ id: "broken", exercises: null }] }
    await expect(readBackup(new File([JSON.stringify(broken)], "broken.json"))).rejects.toThrow()
    expect(useSessionStore.getState().history).toEqual([])
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

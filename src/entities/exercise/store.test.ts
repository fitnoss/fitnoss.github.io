import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Exercise } from "./types"

const exercise = { c: 1, s: "squat" } as Exercise
const en = { squat: { name: "Squat" } }
const ru = { squat: { name: "Приседание" } }
const response = (data: unknown) => new Response(JSON.stringify(data))

beforeEach(() => {
  vi.resetModules()
  vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {}, removeItem: () => {} })
})
afterEach(() => vi.unstubAllGlobals())

function mockFetch(override?: (url: string) => Response | Promise<Response> | undefined) {
  const fetch = vi.fn((input: string | URL | Request) => {
    const url = String(input)
    const custom = override?.(url)
    if (custom) return Promise.resolve(custom)
    if (url.endsWith("data/exercises.json")) return Promise.resolve(response([exercise]))
    if (url.includes("/en/")) return Promise.resolve(response(en))
    if (url.includes("/ru/")) return Promise.resolve(response(ru))
    return Promise.resolve(response({}))
  })
  vi.stubGlobal("fetch", fetch)
  return fetch
}

describe("exercise data loading", () => {
  it("requests both name files before core resolves, shares requests, and leaves instructions unloaded", async () => {
    let resolveCore!: (value: Response) => void
    const core = new Promise<Response>((resolve) => { resolveCore = resolve })
    const fetch = mockFetch((url) => url.endsWith("data/exercises.json") ? core : undefined)
    const { useExerciseStore } = await import("./store")
    const first = useExerciseStore.getState().load("ru")
    const second = useExerciseStore.getState().load("ru")
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      "/data/exercises.json", "/data/videos.json",
      "/locales/en/exercise-names.json", "/locales/ru/exercise-names.json",
    ])
    expect(useExerciseStore.getState().ready).toBe(false)
    resolveCore(response([exercise]))
    await Promise.all([first, second])
    expect(useExerciseStore.getState()).toMatchObject({ ready: true, lang: "ru", en, local: ru })
    await useExerciseStore.getState().load("ru")
    expect(fetch).toHaveBeenCalledTimes(4)
  })

  it("does not let an older language request replace the latest selection", async () => {
    let resolveRussian!: (value: Response) => void
    const russian = new Promise<Response>((resolve) => { resolveRussian = resolve })
    mockFetch((url) => url.includes("/ru/") ? russian : undefined)
    const { useExerciseStore } = await import("./store")
    const old = useExerciseStore.getState().load("ru")
    await useExerciseStore.getState().load("en")
    resolveRussian(response(ru))
    await old
    expect(useExerciseStore.getState()).toMatchObject({ lang: "en", en, local: {} })
    await useExerciseStore.getState().load("ru")
    expect(useExerciseStore.getState()).toMatchObject({ lang: "ru", local: ru })
  })

  it("retries a failed core request", async () => {
    let fail = true
    mockFetch((url) => {
      if (url.endsWith("data/exercises.json") && fail) {
        fail = false
        return new Response("", { status: 503 })
      }
    })
    const { useExerciseStore } = await import("./store")
    await expect(useExerciseStore.getState().load("en")).rejects.toThrow("Could not load exercise catalog")
    await useExerciseStore.getState().load("en")
    expect(useExerciseStore.getState().ready).toBe(true)
  })

  it("loads instructions on demand and shares the language request", async () => {
    const texts = { squat: { name: "Приседание", steps: ["Присядьте."] } }
    const fetch = mockFetch((url) => url.endsWith("/ru/exercises.json") ? response(texts) : undefined)
    const { useExerciseStore, loadExerciseTexts } = await import("./store")
    await useExerciseStore.getState().load("ru")
    const first = loadExerciseTexts("ru")
    expect(loadExerciseTexts("ru")).toBe(first)
    expect(await first).toEqual(texts)
    expect(await loadExerciseTexts("ru")).toEqual(texts)
    expect(fetch.mock.calls.filter(([url]) => String(url).endsWith("/ru/exercises.json"))).toHaveLength(1)
  })

  it("allows retrying unavailable instructions and falls back to English steps", async () => {
    let fail = true
    mockFetch((url) => {
      if (url.endsWith("/ru/exercises.json") && fail) {
        fail = false
        return new Response("", { status: 503 })
      }
    })
    const { loadExerciseTexts, exerciseText } = await import("./store")
    expect(await loadExerciseTexts("ru")).toEqual({})
    expect(await loadExerciseTexts("ru")).toEqual(ru)
    expect(exerciseText({ en: { squat: { name: "Squat", steps: ["Squat down."] } }, local: { squat: { name: "Приседание", steps: [] } } }, exercise))
      .toMatchObject({ name: "Приседание", steps: ["Squat down."] })
  })
})

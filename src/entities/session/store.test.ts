import { beforeEach, describe, expect, it, vi } from "vitest"

vi.hoisted(() => {
  const data = new Map<string, string>()
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value) },
    removeItem: (key: string) => { data.delete(key) },
  })
  vi.stubGlobal("window", { localStorage })
})
vi.mock("@/shared/storage/settings", () => ({ useSettings: { getState: () => ({ defaultRest: 90 }) } }))

import { lastSets, useSessionStore } from "./store"

const store = () => useSessionStore.getState()
const start = () => store().start({ title: "Test", plan: { name: "", items: [{ ex: 1, sets: 2, reps: "5", rest: 90, weight: 60 }] } })
beforeEach(() => useSessionStore.setState({ history: [], active: undefined, rest: undefined }))

describe("set logging lifecycle", () => {
  it("persists completed warmups, types and effort through finish and rehydration", async () => {
    start()
    store().setWarmup(0, [{ weight: 20, reps: 5 }])
    store().toggleSet(0, 0)
    expect(store().rest).toBeUndefined()
    store().updateSet(0, 1, { type: "failure", effort: { scale: "rir", value: 0 } })
    store().toggleSet(0, 1)
    expect(store().rest).toBeDefined()
    const saved = store().finish()!
    expect(saved.exercises[0].sets).toHaveLength(2)
    expect(saved.exercises[0].sets[0].type).toBe("warmup")
    expect(saved.exercises[0].sets[1].effort).toEqual({ scale: "rir", value: 0 })
    const persisted = localStorage.getItem("fitnoss:sessions")!
    useSessionStore.setState({ history: [] })
    localStorage.setItem("fitnoss:sessions", persisted)
    await useSessionStore.persist.rehydrate()
    expect(store().history).toEqual([saved])
    expect(store().active).toBeUndefined()
    expect(store().rest).toBeUndefined()
  })
  it("prefills from main sets without copying prior effort or the drop weight", () => {
    start()
    store().updateSet(0, 0, { done: true, effort: { scale: "rpe", value: 9 } })
    store().updateSet(0, 1, { done: true, type: "drop", weight: 20 })
    store().setWarmup(0, [{ weight: 10, reps: 5 }])
    store().toggleSet(0, 0)
    store().finish()
    expect(lastSets(store().history, 1)).toHaveLength(1)
    start()
    expect(store().active!.exercises[0].sets).toEqual(Array.from({ length: 2 }, () => ({ weight: 60, reps: 5, done: false })))
    store().updateSet(0, 1, { type: "drop", weight: 15, effort: { scale: "rpe", value: 10 } })
    store().addSet(0)
    expect(store().active!.exercises[0].sets.at(-1)).toEqual({ weight: 60, reps: 5, done: false })
  })
})


describe("program note snapshots", () => {
  it("keeps the note in active and completed sessions after the program is edited", () => {
    const item = { ex: 1, sets: 1, reps: "8", rest: 90, note: "Pause at the bottom" }
    store().start({ title: "Note", plan: { name: "", items: [item] } })
    item.note = "Edited later"
    expect(store().active!.exercises[0].note).toBe("Pause at the bottom")
    store().toggleSet(0, 0)
    expect(store().finish()!.exercises[0].note).toBe("Pause at the bottom")
  })
  it("preserves notes when auto-progression prepares the sets", () => {
    store().start({ title: "Progression", plan: { name: "", items: [{ ex: 1, sets: 2, reps: "8", rest: 90, weight: 60, inc: 2.5, note: "Controlled tempo" }] } })
    expect(store().active!.exercises[0].note).toBe("Controlled tempo")
  })
})

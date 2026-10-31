import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

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
import { sessionDuration } from "./history"
import { HISTORY_KEY } from "./storage"

const store = () => useSessionStore.getState()
const start = () => store().start({ title: "Test", plan: { name: "", items: [{ ex: 1, sets: 2, reps: "5", rest: 90, weight: 60 }] } })
beforeEach(() => useSessionStore.setState({ history: [], active: undefined, rest: undefined }))
afterEach(() => vi.restoreAllMocks())

describe("set logging lifecycle", () => {
  it("writes only the live snapshot on set entry and combines checking a set with starting rest", async () => {
    const history = Array.from({ length: 1000 }, (_, i) => ({
      id: `history-${i}`, title: "History", startedAt: i, endedAt: i + 1, exercises: [],
    }))
    useSessionStore.setState({ history })
    start()
    const write = vi.spyOn(localStorage, "setItem")
    const stringify = vi.spyOn(JSON, "stringify")
    store().toggleSet(0, 0)
    expect(write).toHaveBeenCalledTimes(1)
    expect(write.mock.calls[0][0]).toBe("fitnoss:workout")
    expect(stringify).toHaveBeenCalledTimes(1)
    expect(stringify.mock.calls[0][0].state).not.toHaveProperty("history")
    expect(store().rest).toBeDefined()
    store().updateSet(0, 1, { weight: 70 })
    expect(write).toHaveBeenCalledTimes(2)
    expect(store().history).toBe(history)
    await useSessionStore.persist.rehydrate()
    expect(store().history).toEqual(history)
    expect(store().active!.exercises[0].sets[1].weight).toBe(70)
    expect(store().rest).toBeDefined()
  })

  it("persists history corrections independently of the live snapshot", async () => {
    start()
    store().toggleSet(0, 0)
    const saved = store().finish()!
    const write = vi.spyOn(localStorage, "setItem")
    expect(store().editHistory(saved, { ...saved, title: "Corrected" })).toBe(true)
    expect(write).toHaveBeenCalledTimes(1)
    expect(write.mock.calls[0][0]).toBe(HISTORY_KEY)
    await useSessionStore.persist.rehydrate()
    expect(store().history[0].title).toBe("Corrected")
    expect(store().active).toBeUndefined()
  })

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
    const persisted = localStorage.getItem(HISTORY_KEY)!
    useSessionStore.setState({ history: [] })
    localStorage.setItem(HISTORY_KEY, persisted)
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
  it("logs the visible seconds target and keeps repetition history separate from duration history", () => {
    start()
    store().updateSet(0, 0, { done: true, reps: 8 })
    store().finish()
    store().start({ title: "Hold", plan: { name: "", items: [{ ex: 1, sets: 1, reps: "30s", rest: 60 }] } })
    expect(store().active!.exercises[0].sets[0].reps).toBe(30)
    store().updateSet(0, 0, { done: true })
    store().finish()
    expect(lastSets(store().history, 1, "30s")![0].reps).toBe(30)
    expect(lastSets(store().history, 1, "8")![0].reps).toBe(8)
  })
})

describe("correcting and resuming saved workouts", () => {
  it("persists the pending plan and restores it without counting the pause as exercise time", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1000)
    start()
    store().updateSet(0, 0, { done: true, effort: { scale: "rpe", value: 8 } })
    now.mockReturnValue(61000)
    const saved = store().finish()!
    expect(saved.exercises[0].sets).toHaveLength(1)
    expect(saved.unfinishedPlan![0].sets).toHaveLength(2)
    await useSessionStore.persist.rehydrate()
    now.mockReturnValue(121000)
    expect(store().resume(saved.id)).toBe(true)
    expect(store().history).toEqual([])
    expect(store().active!.exercises[0].sets.map((set) => set.done)).toEqual([true, false])
    expect(store().active!.exercises[0].sets[0].effort).toEqual({ scale: "rpe", value: 8 })
    expect(sessionDuration(store().active!, 121000)).toBe(60000)
    store().updateSet(0, 1, { done: true })
    now.mockReturnValue(151000)
    const finished = store().finish()!
    expect(finished.unfinishedPlan).toBeUndefined()
    expect(sessionDuration(finished)).toBe(90000)
    expect(store().history).toHaveLength(1)
    expect(finished.id).toBe(saved.id)
  })

  it("never replaces another active workout or removes the saved record when resume fails", () => {
    start()
    store().updateSet(0, 0, { done: true })
    const saved = store().finish()!
    start()
    const active = store().active
    expect(store().resume(saved.id)).toBe(false)
    expect(store().active).toBe(active)
    expect(store().history).toEqual([saved])
    expect(store().resume("missing")).toBe(false)
  })

  it("keeps corrections through resume, leaves pending targets intact and rejects stale edits", () => {
    start()
    store().updateSet(0, 0, { done: true })
    const saved = store().finish()!
    const edited = structuredClone(saved)
    edited.title = "Corrected"
    edited.exercises[0].note = "Pause"
    edited.exercises[0].sets[0] = { done: true, weight: 75, reps: 7, type: "failure", effort: { scale: "rir", value: 0 } }
    expect(store().editHistory(saved, edited)).toBe(true)
    expect(store().editHistory(saved, { ...edited, title: "Stale" })).toBe(false)
    expect(store().history[0].title).toBe("Corrected")
    expect(store().resume(saved.id)).toBe(true)
    const exercise = store().active!.exercises[0]
    expect(exercise.note).toBe("Pause")
    expect(exercise.sets[0]).toEqual(edited.exercises[0].sets[0])
    expect(exercise.sets[1]).toEqual({ done: false, weight: 60, reps: 5 })
  })

  it("reopens old completed records without inventing missing plan data", () => {
    start()
    store().updateSet(0, 0, { done: true })
    const saved = store().finish()!
    delete saved.unfinishedPlan
    expect(store().resume(saved.id)).toBe(true)
    expect(store().active!.exercises).toEqual(saved.exercises)
  })
})

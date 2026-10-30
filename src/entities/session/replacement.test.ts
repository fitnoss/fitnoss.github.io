import { describe, expect, it } from "vitest"
import type { Exercise } from "@/entities/exercise/types"
import { groups, restAfter } from "@/entities/program/types"
import type { SessionExercise } from "./store"
import { replacementCandidates, replaceRemaining } from "./replacement"

const exercise = (c: number, patch: Partial<Exercise> = {}): Exercise => ({
  c, s: String(c), cat: "strength", lvl: "beginner", mech: "compound", force: "push",
  eq: "barbell", pm: ["chest"], sm: ["triceps"], pl: ["gym"], img: 1, ...patch,
})
const sessionExercise = (patch: Partial<SessionExercise> = {}): SessionExercise => ({
  ex: 1, reps: "8-12", rest: 90, progression: "up",
  sets: Array.from({ length: 3 }, () => ({ weight: 100, reps: 8, done: false })), ...patch,
})

describe("replacement candidates", () => {
  const source = exercise(1)
  const list = [source, exercise(2), exercise(3, { eq: "dumbbell" }),
    exercise(4, { pm: ["triceps"], sm: ["chest"] }), exercise(5, { cat: "stretching" }),
    exercise(6, { pm: ["shoulders", "chest"] })]

  it("requires a shared primary muscle, category and selected equipment; excludes itself", () => {
    expect(replacementCandidates(list, source, ["barbell"]).map((e) => e.c)).toEqual([2, 6])
    expect(replacementCandidates(list, source, ["dumbbell"]).map((e) => e.c)).toEqual([3])
    expect(replacementCandidates(list, source, ["barbell", "dumbbell"]).map((e) => e.c)).toEqual([2, 3, 6])
  })
  it("returns no suggestions when no equipment or primary muscles are available", () => {
    expect(replacementCandidates(list, source, [])).toEqual([])
    expect(replacementCandidates(list, { ...source, pm: [] }, ["barbell"])).toEqual([])
  })
  it("requires the additional band for assisted pull-ups rather than assuming a bar is enough", () => {
    const assisted = exercise(2, { eq: "pullupbar", eqExtra: ["bands"] })
    expect(replacementCandidates([assisted], source, ["pullupbar"])).toEqual([])
    expect(replacementCandidates([assisted], source, ["pullupbar", "bands"])).toEqual([assisted])
  })
})

describe("replacing remaining sets", () => {
  it("ignores typed warmups, preserves drop/failure types and clears effort on replacement", () => {
    const original = sessionExercise({ sets: [
      { done: false, type: "warmup", weight: 20, reps: 5 },
      { done: false, type: "failure", weight: 100, reps: 8, effort: { scale: "rir", value: 0 } },
      { done: false, type: "drop", weight: 70, reps: 8 },
    ] })
    const [next] = replaceRemaining(original, 2)
    expect(next.sets.map((s) => s.type)).toEqual(["failure", "drop"])
    expect(next.sets.every((s) => s.effort === undefined && s.weight === undefined && !s.done)).toBe(true)
  })
  it("preserves targets and rest, drops old weight, warmups and progression", () => {
    const original = sessionExercise()
    original.sets.unshift({ weight: 20, reps: 5, done: false, warmup: true })
    const before = structuredClone(original)
    expect(replaceRemaining(original, 2)).toEqual([{
      ex: 2, reps: "8-12", rest: 90,
      sets: Array.from({ length: 3 }, () => ({ reps: 12, weight: undefined, done: false })),
    }])
    expect(original).toEqual(before)
  })
  it("keeps completed sets under the old exercise code and fills only remaining work from the new history", () => {
    const original = sessionExercise()
    original.sets[0].done = true
    const history = [{ weight: 25, reps: 12, done: true }]
    const before = structuredClone(history)
    const [old, next] = replaceRemaining(original, 2, history)
    expect(old).toEqual({ ...original, sets: [original.sets[0]] })
    expect(next.sets).toEqual(Array.from({ length: 2 }, () => ({ weight: 25, reps: 12, done: false })))
    expect(next.ex).toBe(2)
    expect(history).toEqual(before)
  })
  it("retains completed warmups without transferring them to the new exercise", () => {
    const original = sessionExercise()
    original.sets.unshift({ weight: 20, reps: 5, done: true, warmup: true })
    const [old, next] = replaceRemaining(original, 2)
    expect(old.sets).toEqual([original.sets[0]])
    expect(next.sets).toHaveLength(3)
    expect(next.sets.some((s) => s.warmup)).toBe(false)
  })
  it("retains superset membership and rest at the end of the group", () => {
    const original = sessionExercise({ superset: true })
    original.sets[0].done = true
    const result = [sessionExercise({ ex: 3 }), ...replaceRemaining(original, 2), sessionExercise({ ex: 4, superset: true })]
    expect(groups(result)).toEqual([[0, 1, 2, 3]])
    expect(result.map((_, i) => restAfter(result, i))).toEqual([0, 0, 0, 90])
  })
  it("does not replace completed exercises or the same exercise", () => {
    const original = sessionExercise()
    expect(replaceRemaining(original, 1)).toEqual([original])
    original.sets.forEach((s) => { s.done = true })
    expect(replaceRemaining(original, 2)).toEqual([original])
  })
  it("uses time targets and history reps for AMRAP", () => {
    const history = [{ weight: 10, reps: 17, done: true }]
    expect(replaceRemaining(sessionExercise({ reps: "30s" }), 2, history)[0].sets[0].reps).toBe(30)
    expect(replaceRemaining(sessionExercise({ reps: "amrap" }), 2, history)[0].sets[0].reps).toBe(17)
  })
})

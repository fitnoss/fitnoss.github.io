import { create } from "zustand"
import { persist } from "zustand/middleware"
import { uid } from "@/shared/lib/id"
import { useSettings } from "@/shared/storage/settings"
import { DEFAULT_SCHEME, moveItem, removeItem, restAfter, targetReps, withLink, type ProgramDay, type ProgramItem } from "@/entities/program/types"
import { progression } from "./progression"
import { replaceRemaining } from "./replacement"
import { isMainSet, isWarmup, updateSetLog, type Effort, type SetType } from "./sets"

export type SetLog = {
  reps?: number
  weight?: number
  done: boolean
  /** Missing type means a working set. */
  type?: SetType
  effort?: Effort
  /** Legacy flag retained for existing workouts and backups. Use type for new sets. */
  warmup?: true
}

export type SessionExercise = {
  ex: number
  note?: string
  reps: string
  rest: number
  sets: SetLog[]
  /** Done back-to-back with the previous exercise, as in ProgramItem. */
  superset?: true
  /** Auto-progression moved the weight for this workout (see progression.ts). */
  progression?: "up" | "deload"
}

export type Session = {
  id: string
  title: string
  programId?: string
  day?: number
  startedAt: number
  endedAt?: number
  exercises: SessionExercise[]
}

export type RestTimer = { endsAt: number; total: number }

type State = {
  active?: Session
  history: Session[]
  rest?: RestTimer
  start: (opts: { title: string; programId?: string; day?: number; plan?: ProgramDay }) => void
  addExercise: (ex: number) => void
  removeExercise: (i: number) => void
  replaceExercise: (i: number, ex: number) => void
  moveExercise: (i: number, dir: -1 | 1) => void
  setRest: (i: number, seconds: number) => void
  /** Links exercise i to the previous one as a superset, or unlinks it. */
  toggleSuperset: (i: number) => void
  /** Puts these warm-up sets in front of exercise i, replacing any it has; an empty list removes them. */
  setWarmup: (i: number, sets: Pick<SetLog, "weight" | "reps">[]) => void
  updateSet: (i: number, j: number, patch: Partial<SetLog>) => void
  toggleSet: (i: number, j: number) => void
  addSet: (i: number) => void
  removeSet: (i: number, j: number) => void
  startRest: (seconds: number) => void
  adjustRest: (delta: number) => void
  stopRest: () => void
  finish: () => Session | undefined
  discard: () => void
  removeFromHistory: (id: string) => void
  importHistory: (sessions: Session[]) => void
}

/** Last logged sets for an exercise, used to prefill the next workout. */
export function lastSets(history: Session[], ex: number): SetLog[] | undefined {
  for (const s of history) {
    const sets = s.exercises.filter((e) => e.ex === ex).flatMap((e) => e.sets).filter((x) => x.done && isMainSet(x))
    if (sets.length) return sets
  }
}

function plannedExercise(history: Session[], it: Pick<ProgramItem, "ex" | "sets" | "reps" | "rest" | "weight" | "inc" | "note">): SessionExercise {
  const { ex, reps, rest } = it
  const auto = progression(history, it)
  if (auto) {
    const e: SessionExercise = { ex, reps, rest, ...(it.note ? { note: it.note } : {}), sets: auto.sets.map((s) => ({ ...s, done: false })) }
    if (auto.change) e.progression = auto.change
    return e
  }
  const prev = lastSets(history, ex)
  const target = targetReps(reps)
  return {
    ex,
    ...(it.note ? { note: it.note } : {}),
    reps,
    rest,
    sets: Array.from({ length: it.sets }, (_, j) => {
      const p = prev?.[Math.min(j, prev.length - 1)]
      return { reps: target ?? p?.reps, weight: p?.weight ?? it.weight, done: false }
    }),
  }
}

export const useSessionStore = create<State>()(
  persist(
    (set, get) => {
      const edit = (fn: (s: Session) => Session) => set((st) => (st.active ? { active: fn(st.active) } : {}))
      const editEx = (i: number, fn: (e: SessionExercise) => SessionExercise) =>
        edit((s) => ({ ...s, exercises: s.exercises.map((e, k) => (k === i ? fn(e) : e)) }))
      return {
        history: [],
        start: ({ title, programId, day, plan }) => {
          const { history } = get()
          set({
            rest: undefined,
            active: {
              id: uid(),
              title,
              programId,
              day,
              startedAt: Date.now(),
              exercises: (plan?.items ?? []).map((it) => withLink(plannedExercise(history, it), it.superset)),
            },
          })
        },
        addExercise: (ex) =>
          edit((s) => ({
            ...s,
            exercises: [
              ...s.exercises,
              plannedExercise(get().history, { ex, ...DEFAULT_SCHEME, rest: useSettings.getState().defaultRest }),
            ],
          })),
        removeExercise: (i) => edit((s) => ({ ...s, exercises: removeItem(s.exercises, i) })),
        replaceExercise: (i, ex) => edit((s) => ({
          ...s,
          exercises: s.exercises.flatMap((e, k) => k === i ? replaceRemaining(e, ex, lastSets(get().history, ex)) : [e]),
        })),
        moveExercise: (i, dir) => edit((s) => ({ ...s, exercises: moveItem(s.exercises, i, dir) })),
        setRest: (i, rest) => editEx(i, (e) => ({ ...e, rest })),
        toggleSuperset: (i) => i > 0 && editEx(i, (e) => withLink(e, e.superset ? undefined : true)),
        setWarmup: (i, warmup) =>
          editEx(i, (e) => ({
            ...e,
            sets: [...warmup.map((s) => ({ ...s, done: false, type: "warmup" as const })), ...e.sets.filter((s) => !isWarmup(s))],
          })),
        updateSet: (i, j, patch) => editEx(i, (e) => ({ ...e, sets: e.sets.map((x, k) => (k === j ? updateSetLog(x, patch) : x)) })),
        toggleSet: (i, j) => {
          const e = get().active?.exercises[i]
          if (!e) return
          const done = !e.sets[j].done
          get().updateSet(i, j, { done })
          const { exercises } = get().active!
          const isLastOfWorkout = exercises.every((x) => x.sets.every((s) => s.done))
          const rest = restAfter(exercises, i)
          if (done && rest > 0 && !isLastOfWorkout && !isWarmup(e.sets[j])) get().startRest(rest)
        },
        addSet: (i) =>
          editEx(i, (e) => {
            const last = e.sets.findLast((s) => isMainSet(s))
            return { ...e, sets: [...e.sets, { reps: last?.reps, weight: last?.weight, done: false }] }
          }),
        removeSet: (i, j) => editEx(i, (e) => ({ ...e, sets: e.sets.filter((_, k) => k !== j) })),
        startRest: (seconds) => set({ rest: { endsAt: Date.now() + seconds * 1000, total: seconds } }),
        adjustRest: (delta) =>
          set((st) => {
            if (!st.rest) return {}
            const endsAt = Math.max(Date.now(), st.rest.endsAt + delta * 1000)
            return { rest: { endsAt, total: Math.max(st.rest.total + delta, 1) } }
          }),
        stopRest: () => set({ rest: undefined }),
        finish: () => {
          const s = get().active
          if (!s) return
          const done: Session = {
            ...s,
            endedAt: Date.now(),
            exercises: s.exercises
              .map((e) => ({ ...e, sets: e.sets.filter((x) => x.done) }))
              .filter((e) => e.sets.length > 0),
          }
          set((st) => ({
            active: undefined,
            rest: undefined,
            history: done.exercises.length ? [done, ...st.history] : st.history,
          }))
          return done
        },
        discard: () => set({ active: undefined, rest: undefined }),
        removeFromHistory: (id) => set((st) => ({ history: st.history.filter((s) => s.id !== id) })),
        importHistory: (sessions) =>
          set((st) => {
            const ids = new Set(st.history.map((s) => s.id))
            const merged = [...st.history, ...sessions.filter((s) => !ids.has(s.id))]
            return { history: merged.sort((a, b) => b.startedAt - a.startedAt) }
          }),
      }
    },
    { name: "fitnoss:sessions", version: 1 },
  ),
)

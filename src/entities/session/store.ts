import { create } from "zustand"
import { persist } from "zustand/middleware"
import { uid } from "@/shared/lib/id"
import { useSettings } from "@/shared/storage/settings"
import { DEFAULT_SCHEME, targetReps, type ProgramDay } from "@/entities/program/types"

export type SetLog = { reps?: number; weight?: number; done: boolean }

export type SessionExercise = {
  ex: number
  reps: string
  rest: number
  sets: SetLog[]
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
  moveExercise: (i: number, dir: -1 | 1) => void
  setRest: (i: number, seconds: number) => void
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
    const found = s.exercises.find((e) => e.ex === ex && e.sets.some((x) => x.done))
    if (found) return found.sets.filter((x) => x.done)
  }
}

function plannedExercise(history: Session[], ex: number, sets: number, reps: string, rest: number): SessionExercise {
  const prev = lastSets(history, ex)
  const target = targetReps(reps)
  return {
    ex,
    reps,
    rest,
    sets: Array.from({ length: sets }, (_, j) => {
      const p = prev?.[Math.min(j, prev.length - 1)]
      return { reps: target ?? p?.reps, weight: p?.weight, done: false }
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
              exercises: (plan?.items ?? []).map((it) => plannedExercise(history, it.ex, it.sets, it.reps, it.rest)),
            },
          })
        },
        addExercise: (ex) =>
          edit((s) => ({
            ...s,
            exercises: [
              ...s.exercises,
              plannedExercise(get().history, ex, DEFAULT_SCHEME.sets, DEFAULT_SCHEME.reps, useSettings.getState().defaultRest),
            ],
          })),
        removeExercise: (i) => edit((s) => ({ ...s, exercises: s.exercises.filter((_, k) => k !== i) })),
        moveExercise: (i, dir) =>
          edit((s) => {
            const j = i + dir
            if (j < 0 || j >= s.exercises.length) return s
            const exercises = [...s.exercises]
            ;[exercises[i], exercises[j]] = [exercises[j], exercises[i]]
            return { ...s, exercises }
          }),
        setRest: (i, rest) => editEx(i, (e) => ({ ...e, rest })),
        updateSet: (i, j, patch) => editEx(i, (e) => ({ ...e, sets: e.sets.map((x, k) => (k === j ? { ...x, ...patch } : x)) })),
        toggleSet: (i, j) => {
          const e = get().active?.exercises[i]
          if (!e) return
          const done = !e.sets[j].done
          get().updateSet(i, j, { done })
          const isLastOfWorkout = get().active!.exercises.every((x) => x.sets.every((s) => s.done))
          if (done && e.rest > 0 && !isLastOfWorkout) get().startRest(e.rest)
        },
        addSet: (i) =>
          editEx(i, (e) => {
            const last = e.sets.at(-1)
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
    { name: "fitcraft:sessions", version: 1 },
  ),
)

/** Epley estimated one-rep max. */
export function e1rm(weight: number, reps: number) {
  if (!weight || !reps) return 0
  return reps === 1 ? weight : weight * (1 + reps / 30)
}

export function sessionVolume(s: Session) {
  return s.exercises.reduce((sum, e) => sum + e.sets.reduce((a, x) => a + (x.weight ?? 0) * (x.reps ?? 0), 0), 0)
}

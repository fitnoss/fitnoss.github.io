import { create } from "zustand"
import { persist } from "zustand/middleware"
import { uid } from "@/shared/lib/id"
import type { Program, ProgramData } from "./types"
import type { ScheduleEntry, ScheduleRule } from "./schedule"

type State = {
  programs: Program[]
  schedule: ScheduleEntry[]
  create: (data?: ProgramData, rules?: (ScheduleRule | undefined)[]) => Program
  update: (id: string, fn: (p: Program) => Program) => void
  remove: (id: string) => void
  duplicate: (id: string, suffix: string) => Program | undefined
  scheduleWorkout: (workoutId: string, rule: ScheduleRule, id?: string) => void
  removeSchedule: (id: string) => void
}

export const useProgramStore = create<State>()(
  persist(
    (set, get) => ({
      programs: [],
      schedule: [],
      create: (data, rules = []) => {
        const now = Date.now()
        const p: Program = {
          id: uid(),
          name: data?.name ?? "",
          days: (data?.days ?? [{ name: "", items: [] }]).map(({ name, items, mode }) => ({
            id: uid(), name, items: structuredClone(items), ...(mode ? { mode } : {}),
          })),
          createdAt: now,
          updatedAt: now,
        }
        const entries = p.days.flatMap((day, i) => rules[i] ? [{ ...rules[i], id: uid(), workoutId: day.id }] : [])
        set((s) => ({ programs: [p, ...s.programs], schedule: [...s.schedule, ...entries] }))
        return p
      },
      update: (id, fn) => set((s) => {
        const previous = s.programs.find((p) => p.id === id)
        if (!previous) return s
        const next = { ...fn(previous), updatedAt: Date.now() }
        const removed = previous.days.filter((day) => !next.days.some((d) => d.id === day.id))
        return {
          programs: s.programs.map((p) => p === previous ? next : p),
          schedule: removed.length ? s.schedule.filter((entry) => !removed.some((d) => d.id === entry.workoutId)) : s.schedule,
        }
      }),
      remove: (id) => set((s) => {
        const program = s.programs.find((p) => p.id === id)
        if (!program) return s
        const workouts = new Set(program.days.map((day) => day.id))
        return {
          programs: s.programs.filter((p) => p !== program),
          schedule: s.schedule.filter((entry) => !workouts.has(entry.workoutId)),
        }
      }),
      duplicate: (id, suffix) => {
        const src = get().programs.find((p) => p.id === id)
        if (!src) return
        return get().create({ name: `${src.name} ${suffix}`.trim(), days: src.days })
      },
      scheduleWorkout: (workoutId, rule, id) => set((s) => {
        if (!s.programs.some((program) => program.days.some((day) => day.id === workoutId))) return s
        const entry = { ...rule, id: id ?? uid(), workoutId }
        return { schedule: id ? s.schedule.map((old) => old.id === id ? entry : old) : [...s.schedule, entry] }
      }),
      removeSchedule: (id) => set((s) => ({ schedule: s.schedule.filter((entry) => entry.id !== id) })),
    }),
    { name: "fitnoss:programs", version: 2 },
  ),
)

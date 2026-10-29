import { create } from "zustand"
import { persist } from "zustand/middleware"
import { uid } from "@/shared/lib/id"
import type { Program, ProgramData } from "./types"

type State = {
  programs: Program[]
  create: (data?: ProgramData) => Program
  update: (id: string, fn: (p: Program) => Program) => void
  remove: (id: string) => void
  duplicate: (id: string, suffix: string) => Program | undefined
}

export const useProgramStore = create<State>()(
  persist(
    (set, get) => ({
      programs: [],
      create: (data) => {
        const now = Date.now()
        const p: Program = {
          id: uid(),
          name: data?.name ?? "",
          days: data?.days ?? [{ name: "", items: [] }],
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ programs: [p, ...s.programs] }))
        return p
      },
      update: (id, fn) =>
        set((s) => ({ programs: s.programs.map((p) => (p.id === id ? { ...fn(p), updatedAt: Date.now() } : p)) })),
      remove: (id) => set((s) => ({ programs: s.programs.filter((p) => p.id !== id) })),
      duplicate: (id, suffix) => {
        const src = get().programs.find((p) => p.id === id)
        if (!src) return
        return get().create({ name: `${src.name} ${suffix}`.trim(), days: structuredClone(src.days) })
      },
    }),
    { name: "fitnoss:programs", version: 1 },
  ),
)

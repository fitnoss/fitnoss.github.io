// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { MemoryRouter } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Exercise } from "@/entities/exercise/types"
import { WorkoutPage } from "./WorkoutPage"
import { useSessionStore } from "@/entities/session/store"
import { useSettings } from "@/shared/storage/settings"

const { renders, byCode, text, storage } = vi.hoisted(() => {
  const values = new Map<string, string>()
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) }, removeItem: (key: string) => { values.delete(key) } }
  vi.stubGlobal("localStorage", storage)
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  return {
    storage, renders: [] as number[],
    byCode: new Map(Array.from({ length: 12 }, (_, i) => [i + 1, { c: i + 1, s: `exercise-${i + 1}`, eq: "body", img: 1 } as Exercise])),
    text: (ex: Exercise | undefined) => ({ name: ex?.s ?? "Unknown" }),
  }
})
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock("@/entities/exercise/store", () => ({ useExercises: () => ({ byCode, text }) }))
vi.mock("@/features/programs/ExercisePicker", () => ({ ExercisePicker: () => null }))
vi.mock("@/shared/components/ExerciseImage", () => ({
  ExerciseImage: ({ ex, size, className }: { ex: Exercise; size?: string; className: string }) => {
    // Count the image rendered inside each real ExerciseCard, excluding the next-exercise preview.
    if (size === "l" || className.includes("size-14")) renders.push(ex.c)
    return <span />
  },
}))

let root: Root
let container: HTMLDivElement
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal("localStorage", storage)
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  HTMLElement.prototype.scrollTo = vi.fn()
  container = document.createElement("div")
  container.id = "page-scroll"
  document.body.append(container)
  root = createRoot(container)
  useSessionStore.setState({ active: undefined, history: [], rest: undefined })
  const plan = { name: "Day", items: Array.from({ length: 12 }, (_, i) => ({ ex: i + 1, sets: 4, reps: "8-12", rest: 90 })) }
  useSessionStore.getState().start({ title: "Perf workout", plan })
  useSessionStore.setState({ history: Array.from({ length: 1000 }, (_, i) => ({ id: `history-${i}`, title: "History", startedAt: i, endedAt: i + 1, exercises: [] })) })
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe.each(["list", "cards"] as const)("workout render isolation (%s)", (view) => {
  it("keeps twelve cards idle for thirty clock ticks and re-renders only an edited card", () => {
    useSettings.setState({ workoutView: view })
    act(() => root.render(<MemoryRouter><WorkoutPage /></MemoryRouter>))
    expect(new Set(renders).size).toBe(12)
    renders.length = 0
    act(() => vi.advanceTimersByTime(30_000))
    expect(container.textContent).toContain("0:30")
    expect(renders).toEqual([])
    act(() => useSessionStore.getState().updateSet(0, 0, { weight: 70 }))
    expect(renders).toEqual([1])
    renders.length = 0
    act(() => useSessionStore.getState().startRest(90))
    expect(renders).toEqual([])
    act(() => useSettings.setState({ sound: !useSettings.getState().sound }))
    expect(renders).toEqual([])
  })
})

it("makes added resistance explicit for bodyweight exercises and retains existing loads", () => {
  useSettings.setState({ workoutView: "list" })
  act(() => root.render(<MemoryRouter><WorkoutPage /></MemoryRouter>))
  expect(container.querySelector('[aria-label*="scheme.weight"]')).toBeNull()
  const add = [...container.querySelectorAll("button")].find((button) => button.textContent === "workout.addWeight")!
  act(() => add.click())
  expect(container.querySelector('[aria-label*="workout.addedWeight"]')).not.toBeNull()
  act(() => useSessionStore.getState().updateSet(0, 0, { weight: 5 }))
  act(() => root.unmount())
  root = createRoot(container)
  act(() => root.render(<MemoryRouter><WorkoutPage /></MemoryRouter>))
  expect((container.querySelector('[aria-label*="workout.addedWeight"]') as HTMLInputElement).value).toBe("5")
  expect(container.querySelector('a[aria-label="exercise.technique: exercise-1"]')).not.toBeNull()
})

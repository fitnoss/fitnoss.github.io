// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { expect, it, vi } from "vitest"
import { ExerciseMuscles } from "./ExerciseMuscles"
import { MuscleMap } from "@/shared/components/MuscleMap"

const { reads } = vi.hoisted(() => ({ reads: { count: 0 } }))
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock("@/shared/components/muscle-map-data", () => ({
  front: [{ muscle: "biceps", get points() { reads.count++; return ["0,0 1,0 1,1"] } }],
  back: [{ muscle: "chest", get points() { reads.count++; return ["0,0 1,0 1,1"] } }],
}))

it("keeps the SVG idle when only the technique text changes, and updates muscle roles", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  const container = document.createElement("div")
  const root = createRoot(container)
  const exercise = { pm: ["biceps"], sm: ["chest"] }
  reads.count = 0
  try {
    act(() => root.render(<><p>Loading</p><ExerciseMuscles exercise={exercise} /></>))
    const count = reads.count
    expect(container.querySelector("polygon")!.getAttribute("fill")).toBe("#3b82f6")
    act(() => root.render(<><p>Instructions loaded</p><ExerciseMuscles exercise={exercise} /></>))
    expect(reads.count).toBe(count)
    act(() => root.render(<><p>Instructions loaded</p><ExerciseMuscles exercise={{ pm: ["chest"], sm: ["biceps"] }} /></>))
    expect(reads.count).toBeGreaterThan(count)
    expect(container.querySelector("polygon")!.getAttribute("fill")).toBe("#f59e0b")
  } finally {
    act(() => root.unmount())
    vi.unstubAllGlobals()
  }
})

it("preserves selection, updated colors and click handlers on the shared map", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  const container = document.createElement("div")
  const root = createRoot(container)
  const colorFor = vi.fn(() => "red")
  let onSelect = vi.fn()
  const render = (selected?: string) => act(() => root.render(<MuscleMap colorFor={colorFor} selected={selected} onSelect={onSelect} />))
  try {
    render()
    colorFor.mockClear()
    render()
    expect(colorFor).not.toHaveBeenCalled()
    render("biceps")
    expect(container.querySelector("polygon")!.getAttribute("fill")).toBe("#3b82f6")
    onSelect = vi.fn()
    render("biceps")
    act(() => container.querySelector("g")!.dispatchEvent(new MouseEvent("click", { bubbles: true })))
    expect(onSelect).toHaveBeenCalledWith("biceps")
    act(() => root.render(<MuscleMap colorFor={() => "green"} onSelect={onSelect} />))
    expect(container.querySelector("polygon")!.getAttribute("fill")).toBe("green")
  } finally {
    act(() => root.unmount())
    vi.unstubAllGlobals()
  }
})

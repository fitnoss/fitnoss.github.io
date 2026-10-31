// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { describe, expect, it, vi } from "vitest"
import type { Exercise } from "@/entities/exercise/types"
import { ExerciseList } from "./ExerciseList"

const { range, renders } = vi.hoisted(() => ({ range: { start: 0 }, renders: [] as number[] }))
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    options: { scrollMargin: 0 }, getTotalSize: () => count * 80,
    getVirtualItems: () => Array.from({ length: Math.min(3, count - range.start) }, (_, offset) => ({ index: range.start + offset, start: (range.start + offset) * 80 })),
  }),
}))
vi.mock("@/shared/components/ExerciseImage", () => ({
  ExerciseImage: ({ ex }: { ex: Exercise }) => { renders.push(ex.c); return <span /> },
}))

describe.each([false, true])("virtual rows (sheet = %s)", (sheet) => {
  it("only renders new/changed rows as the window moves and keeps callbacks current", () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} })
    const container = document.createElement("div")
    const root = createRoot(container)
    const items = Array.from({ length: 5 }, (_, i) => ({ c: i + 1, pm: ["biceps"], eq: "body" } as Exercise))
    const scrollRef = sheet ? { current: container as HTMLElement | null } : undefined
    const selected = new Set<number>()
    let name = "Exercise 2"
    let onSelect = vi.fn()
    const onPreview = vi.fn()
    const render = () => act(() => root.render(<ExerciseList items={items} scrollRef={scrollRef}
      text={(ex) => ({ name: ex.c === 2 ? name : `Exercise ${ex.c}` })}
      onSelect={onSelect} onPreview={onPreview} isSelected={(ex) => selected.has(ex.c)} />))
    range.start = 0
    renders.length = 0
    try {
      render()
      expect(renders).toEqual([1, 2, 3])
      renders.length = 0
      range.start = 1
      render()
      expect(renders).toEqual([4])
      renders.length = 0
      render()
      expect(renders).toEqual([])
      selected.add(2)
      render()
      expect(renders).toEqual([2])
      expect(container.querySelector('[aria-pressed="true"]')).not.toBeNull()
      renders.length = 0
      name = "Переведённое название"
      render()
      expect(renders).toEqual([2])
      expect(container.textContent).toContain(name)
      onSelect = vi.fn()
      render()
      act(() => (container.querySelector('button[aria-pressed]') as HTMLButtonElement).click())
      expect(onSelect).toHaveBeenCalledWith(items[1])
      act(() => (container.querySelector('[aria-label="exercise.technique: Переведённое название"]') as HTMLButtonElement).click())
      expect(onPreview).toHaveBeenCalledWith(items[1])
    } finally {
      act(() => root.unmount())
      vi.unstubAllGlobals()
    }
  })
})

// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ExerciseImage } from "./ExerciseImage"
import type { Exercise } from "@/entities/exercise/types"

const ex = { c: 1, img: 2 } as Exercise
let container: HTMLDivElement
let root: Root
let intersect: IntersectionObserverCallback
let hidden: boolean
let reduced: boolean
let motion: EventTarget

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  hidden = false
  reduced = false
  motion = new EventTarget()
  Object.defineProperty(motion, "matches", { get: () => reduced })
  vi.stubGlobal("matchMedia", () => motion)
  vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden)
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { intersect = callback }
    observe() {}
    disconnect() {}
  })
  container = document.createElement("div")
  document.body.append(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const visible = (isIntersecting: boolean) => act(() => intersect([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver))

describe("exercise image work", () => {
  it("uses one frame and no timer for a thumbnail", () => {
    act(() => root.render(<ExerciseImage ex={ex} alt="Exercise" />))
    expect(container.querySelectorAll("img")).toHaveLength(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it("animates only while intersecting, visible and allowed by motion preferences", () => {
    act(() => root.render(<ExerciseImage ex={ex} alt="Exercise" animate priority />))
    const first = container.querySelector("img")!
    expect(first.getAttribute("loading")).toBe("eager")
    expect(first.getAttribute("fetchpriority")).toBe("high")
    expect(vi.getTimerCount()).toBe(0)
    visible(true)
    expect(vi.getTimerCount()).toBe(1)
    expect(container.querySelectorAll("img")).toHaveLength(2)
    expect(container.querySelectorAll("img")[1].getAttribute("loading")).toBe("lazy")
    act(() => vi.advanceTimersByTime(1100))
    expect(container.querySelectorAll("img")[1].className).toContain("opacity-100")
    visible(false)
    expect(vi.getTimerCount()).toBe(0)
    visible(true)
    hidden = true
    act(() => document.dispatchEvent(new Event("visibilitychange")))
    expect(vi.getTimerCount()).toBe(0)
    hidden = false
    act(() => document.dispatchEvent(new Event("visibilitychange")))
    expect(vi.getTimerCount()).toBe(1)
    reduced = true
    act(() => motion.dispatchEvent(new Event("change")))
    expect(vi.getTimerCount()).toBe(0)
    act(() => root.unmount())
    expect(vi.getTimerCount()).toBe(0)
    root = createRoot(container)
  })
})

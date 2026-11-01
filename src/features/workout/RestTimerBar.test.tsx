// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router"
import { expect, it, vi } from "vitest"

vi.hoisted(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  vi.stubGlobal("localStorage", { getItem: () => null, setItem() {}, removeItem() {} })
})
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

import { RestTimerBar } from "./RestTimerBar"
import { useSessionStore } from "@/entities/session/store"

it("keeps the rest deadline when controls are collapsed or the workout route changes", () => {
  vi.useFakeTimers()
  vi.setSystemTime(1_000_000)
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  const container = document.createElement("div")
  const root = createRoot(container)
  useSessionStore.setState({ active: undefined, history: [], rest: undefined })
  useSessionStore.getState().start({ title: "Test workout" })
  useSessionStore.getState().startRest(90)
  const endsAt = useSessionStore.getState().rest!.endsAt
  const click = (selector: string) => act(() => (container.querySelector(selector) as HTMLElement).click())
  try {
    act(() => root.render(<MemoryRouter initialEntries={["/ex/pushups"]}><RestTimerBar /></MemoryRouter>))
    expect(container.querySelector('[aria-label="workout.restPlus"]')).toBeNull()
    click("button[aria-expanded]")
    click('[aria-label="workout.restPlus"]')
    expect(useSessionStore.getState().rest!.endsAt).toBe(endsAt + 15_000)
    click("button[aria-expanded]")
    act(() => vi.advanceTimersByTime(45_000))
    expect(container.textContent).toContain("1:00")
    click('a[href="/workout"]')
    expect(container.querySelector('[aria-label="workout.skipRest"]')).not.toBeNull()
    expect(useSessionStore.getState().rest!.endsAt).toBe(endsAt + 15_000)
    click('[aria-label="workout.skipRest"]')
    expect(useSessionStore.getState().rest).toBeUndefined()
    expect(useSessionStore.getState().active?.title).toBe("Test workout")
  } finally {
    act(() => root.unmount())
    vi.useRealTimers()
    vi.unstubAllGlobals()
  }
})

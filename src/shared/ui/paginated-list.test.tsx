// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { expect, it, vi } from "vitest"
import { PaginatedList } from "./paginated-list"

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

it("bounds a thousand rows and keeps the last page valid after the archive shrinks", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  const container = document.createElement("div")
  const root = createRoot(container)
  const rows = Array.from({ length: 1000 }, (_, i) => i)
  const render = (items: number[]) => act(() => root.render(<PaginatedList items={items}>{(i) => <a key={i} href={`#${i}`}>Row {i}</a>}</PaginatedList>))
  try {
    render(rows)
    expect(container.querySelectorAll("a")).toHaveLength(20)
    expect(container.querySelector("a")!.textContent).toBe("Row 0")
    act(() => (container.querySelector('[aria-label="common.nextPage"]') as HTMLButtonElement).click())
    expect(container.querySelectorAll("a")).toHaveLength(20)
    expect(container.querySelector("a")!.textContent).toBe("Row 20")
    render(rows.slice(0, 5))
    expect(container.querySelectorAll("a")).toHaveLength(5)
    expect(container.querySelector("a")!.textContent).toBe("Row 0")
    expect(container.querySelector("nav")).toBeNull()
  } finally {
    act(() => root.unmount())
    vi.unstubAllGlobals()
  }
})

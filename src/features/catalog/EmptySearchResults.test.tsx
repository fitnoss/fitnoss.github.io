// @vitest-environment jsdom
import { act, useState } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter, useLocation } from "react-router"
import { describe, expect, it, vi } from "vitest"
import { EmptySearchResults } from "./EmptySearchResults"
import { EMPTY_FILTERS, useUrlFilters } from "./filters"

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

describe("empty search recovery", () => {
  it("removes conflicting conditions while retaining the URL query, and clears the query independently", () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
    const container = document.createElement("div")
    const root = createRoot(container)
    function Page() {
      const [filters, setFilters] = useUrlFilters()
      const { search } = useLocation()
      return <><output>{search}</output><EmptySearchResults filters={filters} onChange={setFilters} /></>
    }
    const click = (name: string) => act(() => {
      const button = [...container.querySelectorAll("button")].find((button) => button.textContent === name)
      expect(button).toBeDefined()
      button!.click()
    })
    try {
      act(() => root.render(<MemoryRouter initialEntries={["/exercises?q=squat&m=chest&fav=1&pl=gym"]}><Page /></MemoryRouter>))
      click("catalog.searchWithoutFilters")
      expect(container.querySelector("output")!.textContent).toBe("?q=squat")
      click("catalog.clearSearch")
      expect(container.querySelector("output")!.textContent).toBe("")
    } finally { act(() => root.unmount()); vi.unstubAllGlobals() }
  })

  it("does not discard other conditions when only the search text is cleared", () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
    const container = document.createElement("div")
    const root = createRoot(container)
    function Page() {
      const [filters, setFilters] = useState({ ...EMPTY_FILTERS, q: "squat", muscles: ["chest"] })
      return <><output>{JSON.stringify(filters)}</output><EmptySearchResults filters={filters} onChange={setFilters} /></>
    }
    try {
      act(() => root.render(<Page />))
      act(() => [...container.querySelectorAll("button")].find((button) => button.textContent === "catalog.clearSearch")!.click())
      expect(JSON.parse(container.querySelector("output")!.textContent!)).toMatchObject({ q: "", muscles: ["chest"] })
    } finally { act(() => root.unmount()); vi.unstubAllGlobals() }
  })
})

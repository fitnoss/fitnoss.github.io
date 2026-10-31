// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest"
import i18n, { initI18n, setLanguage } from "./index"

afterEach(() => vi.unstubAllGlobals())

it("boots Russian with one UI request and switches to bundled English without a request", async () => {
  vi.stubGlobal("localStorage", { getItem: () => "ru", setItem: () => {} })
  const fetch = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ common: { loading: "Загрузка…" } }))))
  vi.stubGlobal("fetch", fetch)
  await initI18n()
  expect(fetch.mock.calls).toHaveLength(1)
  expect(fetch).toHaveBeenCalledWith("/locales/ru/ui.json")
  expect(i18n.t("common.loading")).toBe("Загрузка…")
  expect(i18n.t("common.nextPage")).toBe("Next page")
  await setLanguage("en")
  expect(i18n.t("common.loading")).toBe("Loading…")
  expect(fetch).toHaveBeenCalledTimes(1)
})

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { contrastText } from "@/shared/lib/color"

export type Theme = "system" | "light" | "dark"

type Settings = {
  theme: Theme
  /** "#rrggbb", or null for the default black / white. */
  accent: string | null
  /** Rest in seconds for exercises added outside a program, and for the first exercise of a new program. */
  defaultRest: number
  barWeight: number
  plates: number[]
  sound: boolean
  vibration: boolean
  setTheme: (t: Theme) => void
  setAccent: (accent: string | null) => void
  set: (patch: Partial<Omit<Settings, "set" | "setTheme" | "setAccent">>) => void
}

export const DEFAULT_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      theme: "system",
      accent: null,
      defaultRest: 90,
      barWeight: 20,
      plates: DEFAULT_PLATES,
      sound: true,
      vibration: true,
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
      setAccent: (accent) => {
        set({ accent })
        applyAccent(accent)
      },
      set: (patch) => set(patch),
    }),
    { name: "fitnoss:settings", version: 1 },
  ),
)

export function isDark(theme: Theme) {
  return theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches)
}

export function applyTheme(theme: Theme) {
  try {
    localStorage.setItem("fitnoss:theme", theme)
  } catch {}
  const dark = isDark(theme)
  document.documentElement.classList.toggle("dark", dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#000000" : "#ffffff")
}

/**
 * Overrides the accent on <html>; `data-accent` also tints the background wash (see index.css).
 * The inline script in index.html repeats this before first paint from the same storage key.
 */
export function applyAccent(accent: string | null) {
  const root = document.documentElement
  try {
    if (accent) localStorage.setItem("fitnoss:accent", accent)
    else localStorage.removeItem("fitnoss:accent")
  } catch {}
  if (accent) {
    root.style.setProperty("--accent", accent)
    root.style.setProperty("--accent-fg", contrastText(accent))
    root.dataset.accent = ""
  } else {
    root.style.removeProperty("--accent")
    root.style.removeProperty("--accent-fg")
    delete root.dataset.accent
  }
}

matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => applyTheme(useSettings.getState().theme))

import { useEffect, useState } from "react"
import { languages } from "@/shared/i18n"

/** Share of UI strings and exercise texts translated per language, from public/locales/coverage.json. */
export function useTranslationCoverage() {
  const [coverage, setCoverage] = useState<Record<string, number>>({})
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}locales/coverage.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then(setCoverage)
      .catch(() => {})
  }, [])
  return Object.fromEntries(languages.map((l) => [l.code, coverage[l.code]]).filter(([, v]) => v !== undefined))
}

import i18n, { type BackendModule } from "i18next"
import { initReactI18next } from "react-i18next"

export type LanguageInfo = { code: string; name: string; nativeName: string }

const BASE = import.meta.env.BASE_URL
const STORAGE_KEY = "fitnoss:lang"

export let languages: LanguageInfo[] = [{ code: "en", name: "English", nativeName: "English" }]

export async function fetchLocale<T>(lng: string, file: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}locales/${lng}/${file}.json`)
    return res.ok ? ((await res.json()) as T) : null
  } catch {
    return null
  }
}

const backend: BackendModule = {
  type: "backend",
  init() {},
  read(lng, ns, cb) {
    fetchLocale<Record<string, unknown>>(lng, ns).then((data) => cb(null, data ?? {}))
  },
}

function detect(): string {
  const supported = languages.map((l) => l.code)
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && supported.includes(saved)) return saved
  } catch {}
  for (const tag of navigator.languages ?? [navigator.language]) {
    const code = tag.toLowerCase().split("-")[0]
    if (supported.includes(code)) return code
  }
  return "en"
}

export async function initI18n() {
  try {
    const res = await fetch(`${BASE}locales/index.json`)
    if (res.ok) languages = (await res.json()) as LanguageInfo[]
  } catch {}
  const lng = detect()
  document.documentElement.lang = lng
  await i18n
    .use(backend)
    .use(initReactI18next)
    .init({
      lng,
      fallbackLng: "en",
      supportedLngs: languages.map((l) => l.code),
      ns: ["ui"],
      defaultNS: "ui",
      interpolation: { escapeValue: false },
      returnEmptyString: false,
    })
}

export async function setLanguage(code: string) {
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {}
  document.documentElement.lang = code
  await i18n.changeLanguage(code)
}

export default i18n

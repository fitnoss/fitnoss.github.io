import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useSessionStore } from "@/entities/session/store"
import { toast } from "@/shared/ui/toast"
import { useSettings } from "@/shared/storage/settings"

let audio: AudioContext | null = null

function beep() {
  try {
    audio ??= new AudioContext()
    const now = audio.currentTime
    for (const [i, f] of [880, 880, 1320].entries()) {
      const o = audio.createOscillator()
      const g = audio.createGain()
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, now + i * 0.22)
      g.gain.exponentialRampToValueAtTime(0.3, now + i * 0.22 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.22 + 0.18)
      o.connect(g).connect(audio.destination)
      o.start(now + i * 0.22)
      o.stop(now + i * 0.22 + 0.2)
    }
  } catch {}
}

/** Unlocks audio on iOS: must be called from a user gesture. */
export function primeAudio() {
  try {
    audio ??= new AudioContext()
    if (audio.state === "suspended") audio.resume()
  } catch {}
}

/**
 * Counts down from the stored `endsAt`, so the timer is right even after the tab was
 * in the background or the page was reloaded.
 */
export function RestTimerBar() {
  const { t } = useTranslation()
  const rest = useSessionStore((s) => s.rest)
  const activeTitle = useSessionStore((s) => s.active?.title)
  const { pathname } = useLocation()
  const adjustRest = useSessionStore((s) => s.adjustRest)
  const stopRest = useSessionStore((s) => s.stopRest)
  const sound = useSettings((s) => s.sound)
  const vibration = useSettings((s) => s.vibration)
  const [now, setNow] = useState(Date.now())
  const [expanded, setExpanded] = useState(false)
  const fired = useRef<number | null>(null)

  useEffect(() => setExpanded(false), [pathname])

  useEffect(() => {
    setNow(Date.now())
    if (!rest) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [rest])

  const left = rest ? Math.max(0, Math.ceil((rest.endsAt - now) / 1000)) : 0

  useEffect(() => {
    if (!rest || rest.endsAt > Date.now() || fired.current === rest.endsAt) return
    fired.current = rest.endsAt
    if (vibration) navigator.vibrate?.([200, 100, 200, 100, 400])
    if (sound) beep()
    toast(t("workout.restDone"))
    stopRest()
  }, [left, rest, sound, vibration, stopRest, t])

  const away = activeTitle !== undefined && pathname !== "/workout"
  if (!rest && !away) return null
  const progress = rest ? Math.max(0, Math.min(1, 1 - (rest.endsAt - now) / (rest.total * 1000))) : 0
  const mm = Math.floor(left / 60)
  const ss = String(left % 60).padStart(2, "0")
  const pill = "h-11 rounded-control px-3 text-sm font-semibold tabular-nums bg-surface hairline hover:bg-surface-hover active:bg-surface-press"

  return (
    <section aria-label={t("workout.restControls")} className="bg-chrome z-40 shrink-0 border-t px-3 py-2">
      <div className="bg-page hairline rounded-panel relative mx-auto max-w-2xl overflow-hidden">
        <div className="bg-accent absolute inset-y-0 left-0 opacity-15 dark:opacity-25 transition-[width] duration-300 ease-linear" style={{ width: `${progress * 100}%` }} />
        <div className="relative flex flex-wrap items-center gap-2 p-2 pl-3">
          {away && <Link to="/workout" className="min-w-0 flex-1 py-1">
            <div className="truncate text-sm font-semibold">{activeTitle}</div>
            <div className="text-accent-ink text-sm">{t("home.continue")}</div>
          </Link>}
          {away && rest && <button type="button" className={pill + " flex items-center gap-1"} aria-expanded={expanded} aria-label={t("workout.adjustRest", { time: `${mm}:${ss}` })} onClick={() => setExpanded((value) => !value)}>
            {mm}:{ss} {expanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </button>}
          {rest && (!away || expanded) && <div className={away ? "flex w-full flex-wrap items-center gap-2" : "contents"}>
          {!away && <div className="min-w-16 flex-1">
            <div className="text-muted text-[11px] font-medium">{left > 0 ? t("workout.rest") : t("workout.restDone")}</div>
            <div className="text-[26px] leading-tight font-bold tabular-nums">
              {mm}:{ss}
            </div>
          </div>}
          <button type="button" className={pill} onClick={() => adjustRest(-15)} aria-label={t("workout.restMinus")}>
            −15
          </button>
          <button type="button" className={pill} onClick={() => adjustRest(15)} aria-label={t("workout.restPlus")}>
            +15
          </button>
          <button type="button" className={pill} onClick={stopRest} aria-label={t("workout.skipRest")}>{t("workout.skipRestShort")}</button>
          </div>}
        </div>
      </div>
    </section>
  )
}

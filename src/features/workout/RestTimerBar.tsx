import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { useSessionStore } from "@/entities/session/store"
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
  const { adjustRest, stopRest } = useSessionStore()
  const { sound, vibration } = useSettings()
  const [now, setNow] = useState(Date.now())
  const fired = useRef<number | null>(null)

  useEffect(() => {
    if (!rest) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [rest])

  const left = rest ? Math.max(0, Math.ceil((rest.endsAt - now) / 1000)) : 0

  useEffect(() => {
    if (!rest || left > 0 || fired.current === rest.endsAt) return
    fired.current = rest.endsAt
    if (vibration) navigator.vibrate?.([200, 100, 200, 100, 400])
    if (sound) beep()
    const id = setTimeout(stopRest, 1500)
    return () => clearTimeout(id)
  }, [left, rest, sound, vibration, stopRest])

  if (!rest) return null
  const progress = Math.min(1, 1 - (rest.endsAt - now) / (rest.total * 1000))
  const mm = Math.floor(left / 60)
  const ss = String(left % 60).padStart(2, "0")
  const pill = "h-10 rounded-full px-3.5 text-sm font-semibold tabular-nums bg-surface hairline hover:bg-surface-hover active:bg-surface-press"

  return (
    <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-40 transform-gpu px-3 pb-3 md:bottom-0 md:left-[6rem] md:pb-5">
      <div className="bg-page/85 hairline rounded-panel relative mx-auto max-w-md overflow-hidden shadow-2xl shadow-black/15 backdrop-blur-xl [animation:toast-in_.2s_ease-out] dark:shadow-black/50">
        <div className="bg-accent absolute inset-y-0 left-0 opacity-15 dark:opacity-25 transition-[width] duration-300 ease-linear" style={{ width: `${progress * 100}%` }} />
        <div className="relative flex items-center gap-1.5 p-2 pl-4">
          <div className="flex-1">
            <div className="text-muted text-[11px] font-medium">{left > 0 ? t("workout.rest") : t("workout.restDone")}</div>
            <div className="text-[26px] leading-tight font-bold tabular-nums">
              {mm}:{ss}
            </div>
          </div>
          <button type="button" className={pill} onClick={() => adjustRest(-15)}>
            −15
          </button>
          <button type="button" className={pill} onClick={() => adjustRest(15)}>
            +15
          </button>
          <button type="button" className={`${pill} flex w-10 items-center justify-center px-0`} onClick={stopRest} aria-label={t("workout.skipRest")}>
            <X className="size-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

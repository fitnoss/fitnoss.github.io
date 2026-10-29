import { useEffect } from "react"

/** Keeps the screen on during a workout where the Screen Wake Lock API is available. */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !("wakeLock" in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request("screen")
        if (cancelled) lock.release()
      } catch {}
    }
    const onVisible = () => document.visibilityState === "visible" && acquire()
    acquire()
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", onVisible)
      lock?.release().catch(() => {})
    }
  }, [enabled])
}

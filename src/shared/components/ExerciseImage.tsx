import { useEffect, useRef, useState, type RefObject } from "react"
import { Dumbbell } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { imageUrl, type Exercise, type ImageSize } from "@/entities/exercise/types"

function useVisibleAnimation(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  const [running, setRunning] = useState(false)
  useEffect(() => {
    setRunning(false)
    const element = ref.current
    if (!enabled || !element) return
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)")
    let visible = false
    const update = () => setRunning(visible && !document.hidden && !reducedMotion.matches)
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      update()
    })
    observer.observe(element)
    document.addEventListener("visibilitychange", update)
    reducedMotion.addEventListener("change", update)
    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", update)
      reducedMotion.removeEventListener("change", update)
    }
  }, [ref, enabled])
  return enabled && running
}

type Props = {
  ex: Exercise
  alt: string
  /** Cross-fade between the frames to show the movement. */
  animate?: boolean
  className?: string
  interval?: number
  /** Show one fixed frame instead of animating. */
  frame?: number
  size?: ImageSize
  /** Prioritize the first frame of the exercise's main photo. */
  priority?: boolean
}

/** Exercise photo(s). With two frames it loops start ↔ end position like a tiny GIF. */
export function ExerciseImage({ ex, alt, animate = false, className, interval = 1100, frame: fixed, size, priority = false }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [tick, setFrame] = useState(0)
  const frames = Math.min(ex.img, 2)
  const loop = useVisibleAnimation(ref, fixed === undefined && animate && frames > 1)
  const frame = fixed ?? (loop ? tick : 0)

  useEffect(() => {
    if (!loop) return
    const id = setInterval(() => setFrame((f) => (f + 1) % frames), interval)
    return () => clearInterval(id)
  }, [loop, frames, interval])

  if (ex.img === 0) {
    return (
      <div className={cn("bg-surface text-muted/50 flex items-center justify-center", className)}>
        <Dumbbell className="size-1/3" />
      </div>
    )
  }

  return (
    // The white backdrop sits on the <img>s, not here: a background on the rounded box itself
    // anti-aliases separately from the clipped images and leaks white pixels along the corners.
    // Each <img> also rounds itself (rounded-[inherit]): the opacity transition puts them on
    // their own compositor layers, which the parent's overflow clip trims 1–2px off the curve.
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      {Array.from({ length: frames }, (_, n) =>
        loop || n === 0 || n === frame ? (
          <img
            key={n}
            src={imageUrl(ex, n, size)}
            alt={n === 0 ? alt : ""}
            loading={priority && n === 0 ? "eager" : "lazy"}
            fetchPriority={priority && n === 0 ? "high" : "auto"}
            decoding="async"
            className={cn(
              "absolute inset-0 size-full rounded-[inherit] bg-white object-cover",
              loop && "transition-opacity duration-500",
              n === 0 || frame === n ? "opacity-100" : "opacity-0",
            )}
          />
        ) : null,
      )}
    </div>
  )
}

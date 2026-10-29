import { useEffect, useState } from "react"
import { Dumbbell } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { imageUrl, type Exercise } from "@/entities/exercise/types"

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)")

type Props = {
  ex: Exercise
  alt: string
  /** Cross-fade between the frames to show the movement. */
  animate?: boolean
  className?: string
  interval?: number
  /** Show one fixed frame instead of animating. */
  frame?: number
}

/** Exercise photo(s). With two frames it loops start ↔ end position like a tiny GIF. */
export function ExerciseImage({ ex, alt, animate = true, className, interval = 1100, frame: fixed }: Props) {
  const [tick, setFrame] = useState(0)
  const frames = Math.min(ex.img, 2)
  const loop = fixed === undefined && animate && frames > 1 && !reducedMotion.matches
  const frame = fixed ?? tick

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
    <div className={cn("relative overflow-hidden bg-white", className)}>
      {Array.from({ length: frames }, (_, n) => (
        <img
          key={n}
          src={imageUrl(ex, n)}
          alt={n === 0 ? alt : ""}
          loading="lazy"
          decoding="async"
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-500",
            n === 0 || frame === n ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
    </div>
  )
}

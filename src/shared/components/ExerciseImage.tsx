import { useEffect, useState } from "react"
import { Dumbbell } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { imageUrl, type Exercise, type ImageSize } from "@/entities/exercise/types"

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
  size?: ImageSize
}

/** Exercise photo(s). With two frames it loops start ↔ end position like a tiny GIF. */
export function ExerciseImage({ ex, alt, animate = true, className, interval = 1100, frame: fixed, size }: Props) {
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
    // The white backdrop sits on the <img>s, not here: a background on the rounded box itself
    // anti-aliases separately from the clipped images and leaks white pixels along the corners.
    // Each <img> also rounds itself (rounded-[inherit]): the opacity transition puts them on
    // their own compositor layers, which the parent's overflow clip trims 1–2px off the curve.
    <div className={cn("relative overflow-hidden", className)}>
      {Array.from({ length: frames }, (_, n) =>
        loop || n === 0 || n === frame ? (
          <img
            key={n}
            src={imageUrl(ex, n, size)}
            alt={n === 0 ? alt : ""}
            loading="lazy"
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

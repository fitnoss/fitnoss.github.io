import type { CSSProperties } from "react"
import { cn } from "@/shared/lib/utils"

const mask = (layer: "fill" | "lines"): CSSProperties => {
  const url = `url(${import.meta.env.BASE_URL}logo/${layer}.svg)`
  return { maskImage: url, WebkitMaskImage: url, maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "center" }
}

/**
 * fitcraft mark: the cat benching a barbell. Two mask layers (public/logo/) painted by the app theme,
 * so it inverts with the app's dark mode rather than the system's (unlike favicon.svg).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-block shrink-0", className)}>
      <span className="absolute inset-0 bg-white dark:bg-black" style={mask("fill")} />
      <span className="absolute inset-0 bg-black dark:bg-white" style={mask("lines")} />
    </span>
  )
}

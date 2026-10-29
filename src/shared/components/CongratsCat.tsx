import { Cat } from "lucide-react"
import { cn } from "@/shared/lib/utils"

/**
 * Celebration mark for toasts like "Workout saved" and "New record".
 * TODO: placeholder icon — replace with the cat SVG once it's drawn.
 */
export function CongratsCat({ className }: { className?: string }) {
  return (
    <span className={cn("bg-inverse-fg text-inverse flex size-7 shrink-0 items-center justify-center rounded-full", className)}>
      <Cat className="size-[18px]" strokeWidth={2.25} />
    </span>
  )
}

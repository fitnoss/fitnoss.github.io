import type { ComponentProps } from "react"
import { cn } from "@/shared/lib/utils"

/** Toggleable pill for filters and day tabs. */
export function Chip({ active, className, ...props }: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "rounded-control flex h-9 shrink-0 items-center gap-1.5 px-3.5 text-sm font-medium whitespace-nowrap transition-colors",
        active ? "bg-inverse text-inverse-fg" : "bg-surface hairline hover:bg-surface-hover",
        className,
      )}
      {...props}
    />
  )
}

/** Static label: muscles, level, equipment. */
export function Tag({ strong, className, ...props }: ComponentProps<"span"> & { strong?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-lg px-2.5 text-[13px] font-medium",
        strong ? "bg-inverse text-inverse-fg" : "bg-surface hairline text-fg",
        className,
      )}
      {...props}
    />
  )
}

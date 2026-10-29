import type { ReactNode } from "react"
import { cn } from "@/shared/lib/utils"

type Props<T extends string> = {
  value: T
  onChange: (v: T) => void
  options: readonly { value: T; label: ReactNode }[]
  size?: "sm" | "md"
  className?: string
}

/** One-of-N switch: a row of options in a tray, the chosen one inverted. */
export function Segmented<T extends string>({ value, onChange, options, size = "md", className }: Props<T>) {
  return (
    <div role="radiogroup" className={cn("bg-surface hairline rounded-control no-scrollbar flex gap-0.5 overflow-x-auto p-[3px]", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 shrink-0 rounded-[8px] font-medium whitespace-nowrap transition-colors",
            size === "sm" ? "h-8 px-1.5 text-[12.5px]" : "h-9 px-3 text-sm",
            o.value === value ? "bg-inverse text-inverse-fg" : "text-muted hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

import type { ReactNode } from "react"
import { cn } from "@/shared/lib/utils"

type Props<T extends string> = {
  value: T
  onChange: (v: T) => void
  options: readonly { value: T; label: ReactNode }[]
  size?: "sm" | "md"
  className?: string
  label?: string
}

/** One-of-N switch: a row of options in a tray, the chosen one inverted. */
export function Segmented<T extends string>({ value, onChange, options, size = "md", className, label }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("bg-surface hairline rounded-control no-scrollbar flex gap-0.5 overflow-x-auto p-[3px]", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          onKeyDown={(e) => {
            const i = options.findIndex((x) => x.value === o.value)
            const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % options.length : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + options.length) % options.length : e.key === "Home" ? 0 : e.key === "End" ? options.length - 1 : undefined
            if (next === undefined) return
            e.preventDefault()
            onChange(options[next].value)
            e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus()
          }}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 shrink-0 rounded-[8px] font-medium whitespace-nowrap transition-colors",
            size === "sm" ? "min-h-11 px-1.5 text-[12.5px]" : "min-h-11 px-3 text-sm",
            o.value === value ? "bg-inverse text-inverse-fg" : "text-muted hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

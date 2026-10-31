import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Chip } from "@/shared/ui/chip"
import { cn } from "@/shared/lib/utils"

type Props = {
  /** Rest in seconds; 0 means no rest. */
  value: number
  onChange: (seconds: number) => void
  /** Called after picking "No rest" or pressing Enter in the field. */
  onDone?: () => void
  max?: number
  autoFocus?: boolean
  className?: string
}

/** Share links store rest in 5 s steps, so the field snaps to them. */
const snap = (n: number) => Math.round(n / 5) * 5

/** "No rest" toggle plus a seconds field; typed values round to a multiple of 5 s on blur. */
export function RestInput({ value, onChange, onDone, max = 3600, autoFocus, className }: Props) {
  const { t } = useTranslation()
  const [text, setText] = useState(value ? String(value) : "")

  // Keep the entered duration visible when "No rest" disables the timer.
  useEffect(() => {
    if (value > 0 && snap(Number(text) || 0) !== value) setText(String(value))
  }, [value])

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Chip
        active={value === 0}
        className="h-11"
        onClick={() => {
          onChange(0)
          onDone?.()
        }}
      >
        {t("workout.noRest")}
      </Chip>
      <label className={cn(
        "bg-surface rounded-control hover:bg-surface-hover focus-within:bg-page flex h-11 w-[6.5rem] items-center gap-1 px-3.5 transition-colors focus-within:shadow-[inset_0_0_0_1.5px_var(--fg)]",
        value > 0 ? "shadow-[inset_0_0_0_1.5px_var(--fg)]" : "hairline",
      )}>
        <input
          inputMode="numeric"
          placeholder="90"
          autoFocus={autoFocus}
          value={text}
          aria-label={t("workout.rest")}
          className="placeholder:text-muted/60 h-5 min-w-0 flex-1 bg-transparent p-0 text-left text-base leading-5 font-medium tabular-nums outline-none"
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, String(max).length)
            const n = Math.min(max, Number(digits) || 0)
            setText(n ? String(n) : "")
            onChange(snap(n))
          }}
          onBlur={() => { if (value > 0) setText(String(value)) }}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return
            e.currentTarget.blur()
            onDone?.()
          }}
        />
        <span className="text-muted shrink-0 text-sm leading-5 font-medium">{t("workout.seconds")}</span>
      </label>
    </div>
  )
}

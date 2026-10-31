import { Minus, Plus } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { useTranslation } from "react-i18next"

type Props = {
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  format?: (v: number) => string
  label?: string
  className?: string
}

export function Stepper({ value, onChange, step = 1, min = 0, max = 9999, format, label, className }: Props) {
  const { t } = useTranslation()
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v * 100) / 100)))
  const btn = "hover:bg-surface-hover active:bg-surface-press flex size-10 items-center justify-center rounded-[9px] disabled:opacity-30"
  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      {label && <span className="text-muted text-xs font-medium">{label}</span>}
      <div className="bg-surface hairline rounded-control flex h-11 items-center p-0.5">
        <button type="button" className={btn} onClick={() => set(value - step)} disabled={value <= min} aria-label={t("common.decrease", { label })}>
          <Minus className="size-4" />
        </button>
        <span className="min-w-12 text-center text-[15px] font-semibold tabular-nums">{format ? format(value) : value}</span>
        <button type="button" className={btn} onClick={() => set(value + step)} disabled={value >= max} aria-label={t("common.increase", { label })}>
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  )
}

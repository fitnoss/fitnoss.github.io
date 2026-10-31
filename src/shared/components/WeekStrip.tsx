import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/utils"

type WeekDay = { active: boolean; content?: ReactNode; label?: string }

/** Monday–Sunday strip shared by program schedules and completed workouts. */
export function WeekStrip({ days, today }: { days: WeekDay[]; today: number }) {
  const { i18n } = useTranslation()
  const weekday = new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language, { weekday: "short" })
  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day, index) => {
        const name = weekday.format(new Date(2024, 0, 1 + index))
        return (
          <div key={index} className="flex flex-col items-center gap-1" title={day.label}>
            <span className={cn("text-[11px] font-medium", index === today ? "text-fg" : "text-muted")}>{name.charAt(0).toUpperCase() + name.slice(1)}</span>
            <span className={cn(
              "flex h-7 w-full items-center justify-center rounded-lg text-xs font-semibold tabular-nums",
              day.active ? "bg-inverse text-inverse-fg" : "bg-page",
              index === today && "ring-accent ring-2 ring-offset-0",
            )}>{day.content}</span>
          </div>
        )
      })}
    </div>
  )
}

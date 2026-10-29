import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { ChevronRight, Plus } from "lucide-react"
import { Sheet } from "@/shared/ui/sheet"
import { ExerciseImage } from "@/shared/components/ExerciseImage"
import { useExercises } from "@/entities/exercise/store"
import { useProgramStore } from "@/entities/program/store"
import { TEMPLATES } from "./templates"
import { formatWeekdays } from "./format"

const THUMBS = 6

type Props = { open: boolean; onOpenChange: (o: boolean) => void }

/** "New program": start from scratch or from one of the templates. */
export function NewProgramSheet({ open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const create = useProgramStore((s) => s.create)
  const { byCode } = useExercises()
  const lang = i18n.resolvedLanguage === "ru" ? "ru" : "en"

  const go = (id: string) => {
    onOpenChange(false)
    navigate(`/programs/${id}`)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t("programs.newTitle")} bodyClassName="space-y-5">
      <button
        type="button"
        className="bg-inverse text-inverse-fg flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-opacity active:opacity-80"
        onClick={() => go(create().id)}
      >
        <span className="bg-inverse-fg/15 flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Plus className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{t("programs.fromScratch")}</span>
          <span className="block text-sm opacity-70">{t("programs.fromScratchHint")}</span>
        </span>
      </button>

      <div className="space-y-2">
        <h3 className="text-muted px-1 text-[13px] font-semibold">{t("programs.templates")}</h3>
        {TEMPLATES.map((tpl) => {
          const weekdays = tpl.days.flatMap((d) => d.weekdays ?? []).sort((a, b) => a - b)
          const items = tpl.days.flatMap((d) => d.items)
          // Only exercises with photos: dumbbell placeholders say little about the template; the rest go into "+N".
          const photos = items.flatMap((it) => {
            const ex = byCode.get(it.ex)
            return ex?.img ? [ex] : []
          })
          const shown = photos.slice(0, THUMBS)
          return (
            <button
              key={tpl.id}
              type="button"
              className="bg-surface hairline hover:bg-surface-hover flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-colors"
              onClick={() => go(create({ name: tpl.name[lang], days: structuredClone(tpl.days) }).id)}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{tpl.name[lang]}</span>
                <span className="text-muted mt-0.5 block text-sm">{tpl.description[lang]}</span>
                <span className="text-muted mt-1.5 block text-xs tabular-nums">
                  {t("programs.daysCount", { count: tpl.days.length })} ·{" "}
                  {t("programs.exercisesCount", { count: tpl.days.reduce((n, d) => n + d.items.length, 0) })}
                  {weekdays.length > 0 && <> · {formatWeekdays(weekdays)}</>}
                </span>
                <span className="mt-3 flex gap-1">
                  {shown.map((ex, i) => (
                    <ExerciseImage key={i} ex={ex} alt="" animate={false} className="hairline size-9 shrink-0 rounded-[8px]" />
                  ))}
                  {items.length > shown.length && (
                    <span className="bg-page hairline text-muted flex size-9 shrink-0 items-center justify-center rounded-[8px] text-xs font-semibold tabular-nums">
                      +{items.length - shown.length}
                    </span>
                  )}
                </span>
              </span>
              <ChevronRight className="text-muted size-5 shrink-0" />
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}

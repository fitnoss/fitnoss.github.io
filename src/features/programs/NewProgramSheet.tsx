import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { exerciseEquipment, key, type Exercise } from "@/entities/exercise/types"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { ChevronRight, Plus } from "lucide-react"
import { Sheet } from "@/shared/ui/sheet"
import { ExerciseImage } from "@/shared/components/ExerciseImage"
import { useExercises } from "@/entities/exercise/store"
import { useProgramStore } from "@/entities/program/store"
import { ExerciseTechniqueSheet } from "@/features/catalog/ExerciseTechniqueSheet"
import { TEMPLATES } from "./templates"
import { dayName, formatScheme, formatWeekdays } from "./format"

const THUMBS = 6

type Props = { open: boolean; onOpenChange: (o: boolean) => void }

/** "New program": start from scratch or from one of the templates. */
export function NewProgramSheet({ open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const create = useProgramStore((s) => s.create)
  const { byCode, text } = useExercises()
  const [preview, setPreview] = useState<(typeof TEMPLATES)[number] | null>(null)
  const [exercisePreview, setExercisePreview] = useState<Exercise | null>(null)
  const lang = i18n.resolvedLanguage === "ru" ? "ru" : "en"

  const go = (id: string) => {
    onOpenChange(false)
    navigate(`/programs/${id}`)
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { setPreview(null); setExercisePreview(null); onOpenChange(o) }} title={preview ? preview.name[lang] : t("programs.newTitle")} bodyClassName="space-y-5" footer={preview && <div className="flex gap-2"><Button onClick={() => setPreview(null)}>{t("common.back")}</Button><Button variant="primary" className="flex-1" onClick={() => { const tpl = preview; setPreview(null); go(create({ name: tpl.name[lang], days: structuredClone(tpl.days) }).id) }}>{t("programs.useTemplate")}</Button></div>}>
      {preview ? <div className="space-y-5">
        <p className="text-muted text-sm">{preview.description[lang]}</p>
        <p className="text-sm">{t("exercise.equipment")}: {[...new Set(preview.days.flatMap((d) => d.items.flatMap((it) => {
          const exercise = byCode.get(it.ex)
          return exercise ? exerciseEquipment(exercise) : []
        })))].map((eq) => t("equipment." + key(eq))).join(", ")}</p>
        {preview.days.map((d, i) => <section key={i} className="space-y-2">
          <h3 className="font-semibold">{dayName(t, d.name, i)} · {formatWeekdays(d.weekdays ?? [])}</h3>
          {d.items.map((it, j) => {
            const ex = byCode.get(it.ex)
            return ex ? <button key={j} type="button" onClick={() => setExercisePreview(ex)}
              className="hover:bg-surface flex w-full items-center gap-3 rounded-xl p-2 text-left"
              aria-label={`${t("exercise.technique")}: ${text(ex).name}`}>
              <ExerciseImage ex={ex} alt="" className="hairline size-16 shrink-0 rounded-[10px]" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{text(ex).name}</span>
                <span className="text-muted mt-1 block text-xs">{formatScheme(t, it)}</span>
              </span>
              <ChevronRight className="text-muted size-4 shrink-0" />
            </button> : <div key={j} className="border-b py-2">
              <div className="text-sm">{text(ex).name}</div>
              <div className="text-muted text-xs">{formatScheme(t, it)}</div>
            </div>
          })}
        </section>)}
      </div> : <>
      <button
        type="button"
        className="bg-inverse text-inverse-fg flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-opacity active:opacity-80"
        onClick={() => { const p = create(); go(p.id) }}
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
            // The whole card picks the template (the button's ::after covers it); the photos on top open their exercises.
            <div
              key={tpl.id}
              className="bg-surface hairline hover:bg-surface-hover relative flex w-full items-center gap-3 rounded-2xl p-4 transition-colors"
            >
              <span className="min-w-0 flex-1">
                <button
                  type="button"
                  className="block text-left after:absolute after:inset-0 after:rounded-2xl"
                  onClick={() => setPreview(tpl)}
                >
                  <span className="block font-semibold">{tpl.name[lang]}</span>
                  <span className="text-muted mt-0.5 block text-sm">{tpl.description[lang]}</span>
                  <span className="text-muted mt-1.5 block text-xs tabular-nums">
                    {t("programs.daysCount", { count: tpl.days.length })} ·{" "}
                    {t("programs.exercisesCount", { count: tpl.days.reduce((n, d) => n + d.items.length, 0) })}
                    {weekdays.length > 0 && <> · {formatWeekdays(weekdays)}</>}
                  </span>
                </button>
                <span className="mt-3 flex gap-1">
                  {shown.map((ex, i) => (
                    <button key={i} type="button" onClick={() => setExercisePreview(ex)} className="relative shrink-0" aria-label={`${t("exercise.technique")}: ${text(ex).name}`}>
                      <ExerciseImage ex={ex} alt="" animate={false} className="hairline size-9 rounded-[8px]" />
                    </button>
                  ))}
                  {items.length > shown.length && (
                    <span className="bg-page hairline text-muted flex size-9 shrink-0 items-center justify-center rounded-[8px] text-xs font-semibold tabular-nums">
                      +{items.length - shown.length}
                    </span>
                  )}
                </span>
              </span>
              <ChevronRight className="text-muted size-5 shrink-0" />
            </div>
          )
        })}
      </div>
      </> }
      {exercisePreview && <ExerciseTechniqueSheet exercise={exercisePreview} onClose={() => setExercisePreview(null)} />}
    </Sheet>
  )
}

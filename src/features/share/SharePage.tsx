import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"
import { Download, Link2Off } from "lucide-react"
import { customCatalogExercise, isCustomCode, mergeCustomExercises, useCustomExerciseStore, type CustomExercise } from "@/entities/exercise/custom"
import { useExercises } from "@/entities/exercise/store"
import { key } from "@/entities/exercise/types"
import { useProgramStore } from "@/entities/program/store"
import { itemLabels, remapWorkout, restAfter } from "@/entities/program/types"
import { dayName, formatChecklistTarget, formatScheme } from "@/features/programs/format"
import { PageHeader } from "@/shared/components/PageHeader"
import { ExerciseImage } from "@/shared/components/ExerciseImage"
import { Button } from "@/shared/ui/button"
import { Tag } from "@/shared/ui/chip"
import { Empty, Panel, Section } from "@/shared/ui/panel"
import { toast } from "@/shared/ui/toast"
import { decodeShare } from "./codec/fitpack"

export function SharePage() {
  const { payload = "" } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { byCode, text, ready } = useExercises()
  const content = useMemo(() => {
    try { return decodeShare(payload) } catch { return null }
  }, [payload])
  const days = content?.kind === "program" ? content.program.days : content?.kind === "workout" ? [content.workout] : []
  const builtIn = days.flatMap((day) => day.items.filter((item) => !isCustomCode(item.ex)))
  const waiting = !ready && builtIn.length > 0
  const broken = !content || (ready && builtIn.some((item) => !byCode.has(item.ex)))
  if (broken) return <>
    <PageHeader title={t("share.openTitle")} back="/" />
    <Empty icon={<Link2Off />} title={t("share.broken")}>{t("share.brokenHint")}</Empty>
  </>

  const definitions = content.kind === "exercise" ? [content.exercise] : content.exercises
  const incoming = new Map(definitions.map((exercise) => [exercise.code, customCatalogExercise(exercise)]))
  const title = t(content.kind === "program" ? "share.openTitle" : content.kind === "workout" ? "share.openWorkout" : "share.openExercise")
  const name = content.kind === "exercise" ? content.exercise.name : content.kind === "workout" ? dayName(t, content.workout.name, 0) :
    content.program.name || t("programs.untitled")

  const save = () => {
    if (waiting) return
    try {
      const local = useCustomExerciseStore.getState().exercises
      const { exercises, codes } = mergeCustomExercises(local, definitions)
      if (exercises.length !== local.length) useCustomExerciseStore.setState({ exercises })
      if (content.kind === "exercise") {
        navigate(`/ex/custom-${codes.get(content.exercise.code)}`, { replace: true })
      } else {
        const program = useProgramStore.getState().create({
          name: content.kind === "program" ? content.program.name : name,
          days: days.map((day) => remapWorkout(day, codes)),
        })
        navigate(`/programs/${program.id}`, { replace: true })
      }
      toast.success(t(content.kind === "program" ? "share.saved" : content.kind === "workout" ? "share.savedWorkout" : "share.savedExercise"))
    } catch {
      toast.error(t("share.saveFailed"))
    }
  }

  return <>
    <PageHeader title={title} back="/" />
    <div className="space-y-5 px-4 pt-2 pb-8">
      <div className="space-y-1">
        <h2 className="text-[26px] leading-tight font-bold tracking-tight break-words">{name}</h2>
        {content.kind === "program" && <p className="text-muted text-sm">{t("programs.daysCount", { count: days.length })}</p>}
      </div>
      {content.kind === "exercise" ? <CustomExercisePreview exercise={content.exercise} /> :
        days.map((day, index) => {
          const checklist = day.mode === "checklist"
          const labels = itemLabels(day.items)
          return <Section key={index} title={content.kind === "workout" ? t("schedule.workoutExercises") : dayName(t, day.name, index)}
            action={<span className="text-muted text-xs">{t(checklist ? "schedule.checklist" : "schedule.detailed")}</span>}>
            <Panel className="divide-y overflow-hidden">
              {day.items.map((item, i) => {
                const exercise = incoming.get(item.ex) ?? byCode.get(item.ex)
                const scheme = checklist ? formatChecklistTarget(t, item.reps) : formatScheme(t, { ...item, rest: restAfter(day.items, i) })
                return <div key={i} className="flex items-center gap-3 p-2.5">
                  {exercise && <ExerciseImage ex={exercise} alt="" animate={false} className="hairline size-11 shrink-0 rounded-[10px]" />}
                  <div className="min-w-0">
                    <div className="text-[15px] leading-snug font-medium">
                      {!checklist && <span className="text-muted mr-1.5 tabular-nums">{labels[i]}</span>}
                      <span>{exercise ? text(exercise).name : t("common.loading")}</span>
                    </div>
                    {(scheme || item.note) && <div className="text-muted text-[13px]">{[scheme, item.note].filter(Boolean).join(" · ")}</div>}
                  </div>
                </div>
              })}
            </Panel>
          </Section>
        })}
      <Button variant="primary" size="lg" className="w-full" disabled={waiting} onClick={save}>
        <Download /> {t(content.kind === "program" ? "share.save" : content.kind === "workout" ? "share.saveWorkout" : "share.saveExercise")}
      </Button>
    </div>
  </>
}

function CustomExercisePreview({ exercise }: { exercise: CustomExercise }) {
  const { t } = useTranslation()
  return <>
    <div className="flex flex-wrap gap-1.5">
      {exercise.category && <Tag>{t(`category.${key(exercise.category)}`)}</Tag>}
      {exercise.equipment && <Tag>{t(`equipment.${exercise.equipment}`)}</Tag>}
      {exercise.muscles?.map((muscle) => <Tag key={muscle}>{t(`muscle.${key(muscle)}`)}</Tag>)}
    </div>
    {exercise.instructions && <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{exercise.instructions}</p>}
  </>
}

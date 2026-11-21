import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"
import { Check, Info, Plus, X } from "lucide-react"
import { useExercises } from "@/entities/exercise/store"
import { useSessionStore, type Session } from "@/entities/session/store"
import { ExercisePicker } from "@/features/programs/ExercisePicker"
import { formatChecklistTarget } from "@/features/programs/format"
import { ExerciseNote } from "@/shared/components/ExerciseNote"
import { PageHeader } from "@/shared/components/PageHeader"
import { Button, buttonClass } from "@/shared/ui/button"
import { confirmAction } from "@/shared/ui/confirm"
import { Menu, MenuItem } from "@/shared/ui/menu"
import { Panel } from "@/shared/ui/panel"
import { toast } from "@/shared/ui/toast"
import { useWakeLock } from "./useWakeLock"

export function ChecklistWorkout({ session }: { session: Session }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { byCode, text } = useExercises()
  const [picker, setPicker] = useState(false)
  const store = useSessionStore.getState()
  const done = session.exercises.filter((exercise) => exercise.checked).length
  const total = session.exercises.length
  useWakeLock(true)

  const finish = async () => {
    if (done < total && !await confirmAction(t(done ? "workout.confirmChecklistFinish" : "workout.confirmChecklistEmpty", { done, total }))) return
    const saved = store.finish()
    if (saved?.exercises.length) {
      toast.success(t("workout.saved"))
      navigate(`/progress/session/${saved.id}`)
    } else {
      toast(t("workout.nothingSaved"))
      navigate("/")
    }
  }

  return (
    <>
      <PageHeader title={<span className="block min-w-0">
        <span className="block truncate text-[17px]">{session.title}</span>
        <span className="text-muted block text-xs font-medium tabular-nums">{t("schedule.checklist")} · {done}/{total}</span>
      </span>} actions={<>
        <Button variant="primary" size="sm" onClick={finish}><Check /> {t("workout.finish")}</Button>
        <Menu><MenuItem danger onClick={async () => {
          if (!await confirmAction(t("workout.confirmDiscard"))) return
          store.discard()
          navigate("/")
        }}><X /> {t("workout.discard")}</MenuItem></Menu>
      </>} />
      <div className="space-y-3 px-4 pt-3 pb-8">
        <Panel className="divide-y overflow-hidden">
          {session.exercises.map((exercise, i) => {
            const ex = byCode.get(exercise.ex)
            const name = ex ? text(ex).name : t("exercise.unknown")
            const target = formatChecklistTarget(t, exercise.reps)
            return <div key={i} className="px-2">
              <div className="flex items-center gap-1">
                <label className="hover:bg-surface-hover rounded-control flex min-h-16 min-w-0 flex-1 cursor-pointer items-center gap-3 px-2 py-2.5">
                  <input type="checkbox" checked={!!exercise.checked} onChange={() => store.toggleExercise(i)}
                    className="size-5 shrink-0 accent-[var(--accent-ink)]" />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold">{name}</span>
                    {target && <span className="text-muted block text-sm">{target}</span>}
                  </span>
                </label>
                {ex && <Link to={`/ex/${ex.s}`} className={buttonClass("ghost", "icon")} aria-label={`${t("exercise.technique")} · ${name}`}><Info /></Link>}
              </div>
              {exercise.note && <div className="px-2 pb-2"><ExerciseNote note={exercise.note} /></div>}
            </div>
          })}
        </Panel>
        <Button className="w-full" onClick={() => setPicker(true)}><Plus /> {t("workout.addExercise")}</Button>
      </div>
      <ExercisePicker open={picker} onOpenChange={setPicker} onPick={(codes) => codes.forEach(store.addExercise)} />
    </>
  )
}

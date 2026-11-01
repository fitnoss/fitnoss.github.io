import { confirmAction } from "@/shared/ui/confirm"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router"
import { ListPlus, Pencil, Play, Trash2 } from "lucide-react"
import { PageHeader } from "@/shared/components/PageHeader"
import { ExerciseImage } from "@/shared/components/ExerciseImage"
import { ExerciseNote } from "@/shared/components/ExerciseNote"
import { LoggedSet } from "@/shared/components/LoggedSet"
import { Button } from "@/shared/ui/button"
import { Panel } from "@/shared/ui/panel"
import { toast } from "@/shared/ui/toast"
import { useExercises } from "@/entities/exercise/store"
import { usesBodyweight } from "@/entities/exercise/types"
import { useProgramStore } from "@/entities/program/store"
import { useSessionStore } from "@/entities/session/store"
import { sessionVolume, sessionSetCount } from "@/entities/session/stats"
import { isCountedSet } from "@/entities/session/sets"
import { parseReps } from "@/entities/program/types"
import { sessionDuration } from "@/entities/session/history"
import { SessionEditor } from "./SessionEditor"

export function SessionPage() {
  const { id = "" } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const s = useSessionStore((st) => st.history.find((x) => x.id === id))
  const remove = useSessionStore((st) => st.removeFromHistory)
  const createProgram = useProgramStore((st) => st.create)
  const { byCode, text } = useExercises()
  const active = useSessionStore((state) => state.active)
  const [editing, setEditing] = useState(false)

  if (!s) {
    return <PageHeader title={t("journal.notFound")} back="/progress" />
  }

  const minutes = Math.round(sessionDuration(s) / 60000)
  const sets = sessionSetCount(s)
  const volume = sessionVolume(s)

  return (
    <>
      <PageHeader
        title={s.title}
        back="/progress"
        actions={
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("common.delete")}
            onClick={async () => {
              if (!await confirmAction(t("journal.confirmDelete"))) return
              remove(s.id)
              navigate("/progress", { replace: true })
            }}
          >
            <Trash2 />
          </Button>
        }
      />
      <div className="space-y-3 px-4 pb-8">
        <div className="flex flex-wrap gap-2">
          <Button className="flex-1" onClick={() => setEditing(true)}><Pencil className="size-4" />{t("journal.editSession")}</Button>
          <Button className="flex-1" disabled={!!active} onClick={async () => {
            if (!await confirmAction(t("journal.confirmResume"))) return
            if (useSessionStore.getState().resume(s.id)) navigate("/workout")
            else toast.error(t("journal.resumeUnavailable"))
          }}><Play className="size-4" />{t(s.unfinishedPlan ? "journal.resumeSession" : "journal.reopenSession")}</Button>
        </div>
        {active && <p className="text-muted text-xs">{t("journal.resumeUnavailable")}</p>}
        <p className="text-muted px-1 text-sm first-letter:uppercase">
          {new Intl.DateTimeFormat(i18n.language, { dateStyle: "full", timeStyle: "short" }).format(s.startedAt)}
        </p>
        <Panel className="grid grid-cols-3 divide-x">
          {[
            [t("units.min", { n: minutes }), t("journal.duration")],
            [String(sets), t("journal.setsLabel")],
            [volume ? t("units.kg", { n: Math.round(volume) }) : "—", t("journal.volume")],
          ].map(([v, l]) => (
            <div key={l} className="px-2 py-3.5 text-center">
              <div className="text-[17px] font-bold tabular-nums">{v}</div>
              <div className="text-muted text-xs">{l}</div>
            </div>
          ))}
        </Panel>
        {s.exercises.map((e, i) => {
          const ex = byCode.get(e.ex)
          return (
            <Panel key={i} className="space-y-2.5 p-2.5">
              <Link to={`/progress/ex/${e.ex}`} className="flex items-center gap-3">
                {ex && <ExerciseImage ex={ex} alt="" animate={false} className="hairline size-11 shrink-0 rounded-[10px]" />}
                <div className="text-[15px] font-semibold">{text(ex).name}</div>
              </Link>
              <ExerciseNote note={e.note} />
              {usesBodyweight(ex) && e.sets.some((set) => set.weight !== undefined) && <p className="text-muted text-sm">{t("workout.addedWeightHint")}</p>}
              <div className="flex flex-wrap gap-1.5">
                {e.sets.map((x, j) => (
                  <LoggedSet key={j} set={x} timed={parseReps(e.reps).kind === "time"} bodyweight={usesBodyweight(ex)} />
                ))}
              </div>
            </Panel>
          )
        })}
        <Button
          className="w-full"
          size="lg"
          disabled={!s.exercises.some((e) => e.sets.some(isCountedSet))}
          onClick={() => {
            const p = createProgram({
              name: s.title,
              days: [{ name: "", items: s.exercises.filter((e) => e.sets.some(isCountedSet)).map((e) => ({ ex: e.ex, sets: e.sets.filter(isCountedSet).length, reps: e.reps, rest: e.rest, note: e.note })) }],
            })
            toast.success(t("journal.savedAsProgram"))
            navigate(`/programs/${p.id}`)
          }}
        >
          <ListPlus /> {t("journal.saveAsProgram")}
        </Button>
      </div>
      {editing && <SessionEditor session={s} onClose={() => setEditing(false)} />}
    </>
  )
}

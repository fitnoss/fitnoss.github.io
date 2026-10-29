import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router"
import { ListPlus, Trash2 } from "lucide-react"
import { PageHeader } from "@/shared/components/PageHeader"
import { ExerciseImage } from "@/shared/components/ExerciseImage"
import { Button } from "@/shared/ui/button"
import { Panel } from "@/shared/ui/panel"
import { toast } from "@/shared/ui/toast"
import { useExercises } from "@/entities/exercise/store"
import { useProgramStore } from "@/entities/program/store"
import { sessionVolume, useSessionStore } from "@/entities/session/store"

export function SessionPage() {
  const { id = "" } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const s = useSessionStore((st) => st.history.find((x) => x.id === id))
  const remove = useSessionStore((st) => st.removeFromHistory)
  const createProgram = useProgramStore((st) => st.create)
  const { byCode, text } = useExercises()

  if (!s) {
    return <PageHeader title={t("journal.notFound")} back="/progress" />
  }

  const minutes = s.endedAt ? Math.round((s.endedAt - s.startedAt) / 60000) : 0
  const sets = s.exercises.reduce((n, e) => n + e.sets.length, 0)
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
            onClick={() => {
              if (!confirm(t("journal.confirmDelete"))) return
              remove(s.id)
              navigate("/progress", { replace: true })
            }}
          >
            <Trash2 />
          </Button>
        }
      />
      <div className="space-y-3 px-4 pb-8">
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
              <div className="flex flex-wrap gap-1.5">
                {e.sets.map((x, j) => (
                  <span key={j} className="bg-page hairline rounded-lg px-2.5 py-1 text-[13px] font-medium tabular-nums">
                    {x.weight ? `${x.weight} × ` : ""}
                    {x.reps ?? "—"}
                  </span>
                ))}
              </div>
            </Panel>
          )
        })}
        <Button
          className="w-full"
          size="lg"
          onClick={() => {
            const p = createProgram({
              name: s.title,
              days: [{ name: "", items: s.exercises.map((e) => ({ ex: e.ex, sets: e.sets.length, reps: e.reps, rest: e.rest })) }],
            })
            toast.success(t("journal.savedAsProgram"))
            navigate(`/programs/${p.id}`)
          }}
        >
          <ListPlus /> {t("journal.saveAsProgram")}
        </Button>
      </div>
    </>
  )
}

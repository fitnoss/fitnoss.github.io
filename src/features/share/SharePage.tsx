import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router"
import { Download, Link2Off } from "lucide-react"
import { PageHeader } from "@/shared/components/PageHeader"
import { ExerciseImage } from "@/shared/components/ExerciseImage"
import { Button } from "@/shared/ui/button"
import { Empty, Panel, Section } from "@/shared/ui/panel"
import { toast } from "@/shared/ui/toast"
import { useExercises } from "@/entities/exercise/store"
import { useProgramStore } from "@/entities/program/store"
import { dayName, formatScheme } from "@/features/programs/format"
import { decodeProgram } from "./codec/fitpack"

export function SharePage() {
  const { payload = "" } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { byCode, text, ready } = useExercises()
  const create = useProgramStore((s) => s.create)

  const program = useMemo(() => {
    try {
      return decodeProgram(payload)
    } catch {
      return null
    }
  }, [payload])

  if (!program) {
    return (
      <>
        <PageHeader title={t("share.openTitle")} back="/programs" />
        <Empty icon={<Link2Off />} title={t("share.broken")}>
          {t("share.brokenHint")}
        </Empty>
      </>
    )
  }

  const total = program.days.reduce((n, d) => n + d.items.length, 0)

  return (
    <>
      <PageHeader title={t("share.openTitle")} back="/programs" />
      <div className="space-y-6 px-4 pb-8">
        <div className="space-y-4">
          <div>
            <h2 className="text-[26px] leading-tight font-bold tracking-tight">{program.name || t("programs.untitled")}</h2>
            <p className="text-muted mt-1 text-sm">
              {t("programs.daysCount", { count: program.days.length })} · {t("programs.exercisesCount", { count: total })}
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => {
              const p = create(program)
              toast.success(t("share.saved"))
              navigate(`/programs/${p.id}`, { replace: true })
            }}
          >
            <Download /> {t("share.save")}
          </Button>
        </div>
        {program.days.map((d, i) => (
          <Section key={i} title={dayName(t, d.name, i)}>
            <Panel className="divide-y overflow-hidden">
              {d.items.map((it, j) => {
                const ex = byCode.get(it.ex)
                return (
                  <Link key={j} to={ex ? `/ex/${ex.s}` : "#"} className="hover:bg-surface-hover flex items-center gap-3 p-2.5">
                    {ex ? (
                      <ExerciseImage ex={ex} alt="" animate={false} className="hairline size-12 shrink-0 rounded-[10px]" />
                    ) : (
                      <div className="bg-elevated size-12 shrink-0 rounded-[10px]" />
                    )}
                    <div className="min-w-0">
                      <div className="text-[15px] leading-snug font-medium">
                        <span className="text-muted mr-1.5 tabular-nums">{j + 1}</span>
                        {ready ? (ex ? text(ex).name : t("exercise.unknown")) : "…"}
                      </div>
                      <div className="text-muted text-[13px]">
                        {formatScheme(t, it)}
                        {it.note && ` · ${it.note}`}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </Panel>
          </Section>
        ))}
      </div>
    </>
  )
}

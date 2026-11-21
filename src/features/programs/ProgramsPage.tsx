import { lazy, Suspense, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation, useNavigate } from "react-router"
import { ChevronRight, Play, Plus } from "lucide-react"
import { PageHeader } from "@/shared/components/PageHeader"
import { Logo, Wordmark } from "@/shared/components/Logo"
import { Button } from "@/shared/ui/button"
import { Panel, Section } from "@/shared/ui/panel"
import { useProgramStore } from "@/entities/program/store"
import type { Program } from "@/entities/program/types"
import { useSessionStore } from "@/entities/session/store"
import { primeAudio } from "@/features/workout/RestTimerBar"
import { HomeCalendar } from "./HomeCalendar"
import { dayName } from "./format"

const NewProgramSheet = lazy(() => import("./NewProgramSheet").then((m) => ({ default: m.NewProgramSheet })))

export function ProgramsPage() {
  const { t } = useTranslation()
  const programs = useProgramStore((s) => s.programs)
  const active = useSessionStore((s) => s.active)
  const historyCount = useSessionStore((s) => s.history.length)
  const location = useLocation()
  const navigate = useNavigate()
  const [newOpen, setNewOpen] = useState<"new" | "templates" | null>(() => {
    const state = location.state as { newProgram?: boolean; templatesOnly?: boolean } | null
    return state?.newProgram ? (state.templatesOnly ? "templates" : "new") : null
  })
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navigate])

  return (
    <>
      <PageHeader title={<span className="flex items-center gap-3">
        <Logo className="h-12 w-14 md:h-16 md:w-[4.5rem]" /><Wordmark />
      </span>} />
      <div className="space-y-6 px-4 pb-8 sm:space-y-8">
        <HomeCalendar />
        <Section title={t("programs.myPrograms")} action={<Button size="sm" onClick={() => setNewOpen("new")}><Plus /> {t("programs.new")}</Button>}>
          {programs.length > 0 ? <div className="space-y-2">{programs.map((program) => <ProgramRow key={program.id} program={program} />)}</div> :
            <Panel className="text-muted px-4 py-3 text-sm">{t("programs.emptyText")}</Panel>}
          <Button className="w-full" onClick={() => setNewOpen("templates")}>{t("programs.pickTemplate")}</Button>
        </Section>
        {!active && <div className="space-y-2">
          <Button className="w-full" onClick={() => {
            primeAudio()
            useSessionStore.getState().start({ title: t("workout.free") })
            navigate("/workout")
          }}><Play /> {t("workout.startFree")}</Button>
          <p className="text-muted px-1 text-sm">{t("workout.freeHint")}</p>
        </div>}
        {historyCount >= 5 && !localStorage.getItem("fitnoss:last-export") && <Link to="/more?section=data" className="text-muted block text-sm underline underline-offset-4">{t("more.backupReminder")}</Link>}
      </div>
      {newOpen && <Suspense fallback={<p role="status" className="text-muted px-4 py-3 text-sm">{t("common.loading")}</p>}>
        <NewProgramSheet open templatesOnly={newOpen === "templates"} onOpenChange={(open) => !open && setNewOpen(null)} />
      </Suspense>}
    </>
  )
}

function ProgramRow({ program }: { program: Program }) {
  const { t } = useTranslation()
  return <Link to={`/programs/${program.id}`} className="block">
    <Panel className="hover:bg-surface-hover flex items-center gap-3 p-3.5 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{program.name || t("programs.untitled")}</div>
        <div className="text-muted mt-0.5 truncate text-sm">{program.days.map((day, index) => dayName(t, day.name, index)).join(" · ")}</div>
      </div>
      <ChevronRight className="text-muted size-5 shrink-0" />
    </Panel>
  </Link>
}

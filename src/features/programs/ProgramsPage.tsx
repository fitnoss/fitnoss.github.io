import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"
import { ChevronRight, ListChecks, Plus } from "lucide-react"
import { PageHeader } from "@/shared/components/PageHeader"
import { Button } from "@/shared/ui/button"
import { Empty, Panel, Section } from "@/shared/ui/panel"
import { useProgramStore } from "@/entities/program/store"
import { TEMPLATES } from "./templates"
import { dayName } from "./format"

export function ProgramsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { programs, create } = useProgramStore()
  const lang = i18n.resolvedLanguage === "ru" ? "ru" : "en"

  const newProgram = () => navigate(`/programs/${create().id}`)

  return (
    <>
      <PageHeader
        title={t("programs.title")}
        actions={
          <Button variant="primary" size="sm" className="h-9" onClick={newProgram}>
            <Plus /> {t("programs.new")}
          </Button>
        }
      />
      <div className="space-y-8 px-4 pb-8">
        {programs.length === 0 ? (
          <Panel>
            <Empty icon={<ListChecks />} title={t("programs.emptyTitle")}>
              {t("programs.emptyText")}
            </Empty>
          </Panel>
        ) : (
          <div className="space-y-2">
            {programs.map((p) => (
              <Link key={p.id} to={`/programs/${p.id}`} className="block">
                <Panel className="hover:bg-surface-hover flex items-center gap-3 p-4 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{p.name || t("programs.untitled")}</div>
                    <div className="text-muted mt-0.5 truncate text-sm">{p.days.map((d, i) => dayName(t, d.name, i)).join(" · ")}</div>
                  </div>
                  <div className="text-muted shrink-0 text-right text-xs leading-relaxed tabular-nums">
                    <div>{t("programs.daysCount", { count: p.days.length })}</div>
                    <div>{t("programs.exercisesCount", { count: p.days.reduce((n, d) => n + d.items.length, 0) })}</div>
                  </div>
                  <ChevronRight className="text-muted size-5 shrink-0" />
                </Panel>
              </Link>
            ))}
          </div>
        )}

        <Section title={t("programs.templates")}>
          <div className="grid gap-2 sm:grid-cols-2">
            {TEMPLATES.map((tpl) => (
              <Panel key={tpl.id} className="flex flex-col gap-3 p-4">
                <div className="flex-1">
                  <div className="font-semibold">{tpl.name[lang]}</div>
                  <div className="text-muted mt-0.5 text-sm">{tpl.description[lang]}</div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted text-xs tabular-nums">
                    {t("programs.daysCount", { count: tpl.days.length })} ·{" "}
                    {t("programs.exercisesCount", { count: tpl.days.reduce((n, d) => n + d.items.length, 0) })}
                  </span>
                  <Button
                    size="sm"
                    className="bg-page"
                    onClick={() => navigate(`/programs/${create({ name: tpl.name[lang], days: structuredClone(tpl.days) }).id}`)}
                  >
                    {t("programs.use")}
                  </Button>
                </div>
              </Panel>
            ))}
          </div>
        </Section>
      </div>
    </>
  )
}

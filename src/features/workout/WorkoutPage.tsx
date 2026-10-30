import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"
import { Check, GalleryHorizontalEnd, LayoutList, Play, Plus, X } from "lucide-react"
import { CongratsCat } from "@/shared/components/CongratsCat"
import { PageHeader } from "@/shared/components/PageHeader"
import { SupersetGroup } from "@/shared/components/SupersetGroup"
import { Button } from "@/shared/ui/button"
import { Chip } from "@/shared/ui/chip"
import { Menu, MenuItem } from "@/shared/ui/menu"
import { Panel, Section } from "@/shared/ui/panel"
import { toast } from "@/shared/ui/toast"
import { cn } from "@/shared/lib/utils"
import { useSettings } from "@/shared/storage/settings"
import { useProgramStore } from "@/entities/program/store"
import { groups } from "@/entities/program/types"
import { useSessionStore, type Session } from "@/entities/session/store"
import { ExercisePicker } from "@/features/programs/ExercisePicker"
import { dayName, formatWeekdays } from "@/features/programs/format"
import { CardsPager, CardsView, useCarousel } from "./CardsView"
import { ExerciseCard } from "./ExerciseCard"
import { RestTimerBar, primeAudio } from "./RestTimerBar"
import { useStartDay } from "./useStartDay"
import { useWakeLock } from "./useWakeLock"

export function WorkoutPage() {
  const active = useSessionStore((s) => s.active)
  return active ? <ActiveWorkout session={active} /> : <StartWorkout />
}

function StartWorkout() {
  const { t } = useTranslation()
  const programs = useProgramStore((s) => s.programs)
  const start = useSessionStore((s) => s.start)
  const startDay = useStartDay()

  return (
    <>
      <PageHeader title={t("workout.title")} />
      <div className="space-y-8 px-4 pb-8">
        <Button variant="primary" size="lg" className="h-14 w-full text-base" onClick={() => (primeAudio(), start({ title: t("workout.free") }))}>
          <Play className="size-5 fill-current" /> {t("workout.startFree")}
        </Button>
        {programs.length > 0 ? (
          <Section title={t("workout.fromProgram")}>
            <div className="space-y-2">
              {programs.map((p) => (
                <Panel key={p.id} className="space-y-3 p-4">
                  <div className="font-semibold">{p.name || t("programs.untitled")}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.days.map((d, i) => (
                      <Chip
                        key={i}
                        className="bg-page disabled:opacity-40"
                        disabled={!d.items.length}
                        onClick={() => startDay(p, i)}
                      >
                        <Play className="size-3 fill-current" /> {dayName(t, d.name, i)}
                        {d.weekdays?.length ? <span className="text-[13px] opacity-60">{formatWeekdays(d.weekdays)}</span> : null}
                      </Chip>
                    ))}
                  </div>
                </Panel>
              ))}
            </div>
          </Section>
        ) : (
          <p className="text-muted text-center text-sm">
            {t("workout.noPrograms")}{" "}
            <Link to="/" state={{ newProgram: true }} className="text-fg font-medium underline underline-offset-4">
              {t("workout.createProgram")}
            </Link>
          </p>
        )}
      </div>
    </>
  )
}

function useElapsed(since: number) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const s = Math.max(0, Math.floor((now - since) / 1000))
  const h = Math.floor(s / 3600)
  const m = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, "0")
  return `${h ? `${h}:` : ""}${m}:${String(s % 60).padStart(2, "0")}`
}

function ActiveWorkout({ session }: { session: Session }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { finish, discard, addExercise } = useSessionStore()
  const [pickerOpen, setPickerOpen] = useState(false)
  const elapsed = useElapsed(session.startedAt)
  const view = useSettings((s) => s.workoutView)
  const hasRest = useSessionStore((s) => !!s.rest)
  const setSettings = useSettings((s) => s.set)
  const carousel = useCarousel(session.exercises)
  useWakeLock(true)

  const doneSets = session.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
  const totalSets = session.exercises.reduce((n, e) => n + e.sets.length, 0)

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-col">
            <span className="truncate text-[17px] leading-tight font-semibold">{session.title}</span>
            <span className="text-muted mt-0.5 flex items-center gap-1.5 text-[13px] font-medium tabular-nums">
              <span className="text-accent">{elapsed}</span>·
              <span>
                {doneSets}/{totalSets}
              </span>
            </span>
          </span>
        }
        actions={
          <>
            <Button
              variant="primary"
              size="sm"
              className="h-9"
              onClick={() => {
                const done = finish()
                if (done && done.exercises.length) {
                  toast.success(t("workout.saved"), { icon: <CongratsCat /> })
                  navigate(`/progress/session/${done.id}`)
                } else toast(t("workout.nothingSaved"))
              }}
            >
              <Check /> {t("workout.finish")}
            </Button>
            <Menu>
              <div className="text-muted px-3 pt-1.5 pb-1 text-xs font-medium">{t("workout.view")}</div>
              {(["list", "cards"] as const).map((v) => (
                <MenuItem key={v} onClick={() => setSettings({ workoutView: v })} aria-checked={view === v} role="menuitemradio">
                  {v === "list" ? <LayoutList /> : <GalleryHorizontalEnd />}
                  <span className="flex-1">{t(v === "list" ? "workout.viewList" : "workout.viewCards")}</span>
                  {view === v && <Check className="text-accent" />}
                </MenuItem>
              ))}
              <div className="bg-line mx-2 my-1 h-px" />
              <MenuItem danger onClick={() => confirm(t("workout.confirmDiscard")) && discard()}>
                <X /> {t("workout.discard")}
              </MenuItem>
            </Menu>
          </>
        }
      >
        {view === "cards" ? (
          <CardsPager session={session} carousel={carousel} />
        ) : (
          <div className="bg-surface h-0.5">
            <div className="bg-accent h-full transition-[width] duration-300" style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} />
          </div>
        )}
      </PageHeader>
      {view === "cards" ? (
        <CardsView session={session} carousel={carousel} onAdd={() => setPickerOpen(true)} />
      ) : (
        <div className={cn("space-y-2 px-4 pt-3", hasRest ? "pb-24" : "pb-8")}>
          {groups(session.exercises).map((g) => {
            const cards = g.map((i) => {
              const e = session.exercises[i]
              return <ExerciseCard key={`${i}-${e.ex}`} e={e} i={i} last={i === session.exercises.length - 1} restsAfter={!session.exercises[i + 1]?.superset} />
            })
            return g.length > 1 ? <SupersetGroup key={`g${g[0]}`}>{cards}</SupersetGroup> : cards
          })}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="rounded-panel text-muted hover:text-fg hover:bg-surface flex h-14 w-full items-center justify-center gap-2 font-medium shadow-[inset_0_0_0_1.5px_var(--line)] transition-colors"
          >
            <Plus className="size-5" /> {t("workout.addExercise")}
          </button>
        </div>
      )}
      <RestTimerBar />
      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(codes) => {
          const first = session.exercises.length
          codes.forEach(addExercise)
          // In cards view, show the first of the new exercises.
          if (view === "cards") requestAnimationFrame(() => carousel.go(first))
        }}
      />
    </>
  )
}

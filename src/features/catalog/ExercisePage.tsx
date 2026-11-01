import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router"
import { ChartNoAxesColumn, ListPlus, Star, Timer } from "lucide-react"
import { PageHeader } from "@/shared/components/PageHeader"
import { ExerciseImage } from "@/shared/components/ExerciseImage"
import { Button, buttonClass } from "@/shared/ui/button"
import { Tag } from "@/shared/ui/chip"
import { Segmented } from "@/shared/ui/segmented"
import { Section } from "@/shared/ui/panel"
import { toast } from "@/shared/ui/toast"
import { cn } from "@/shared/lib/utils"
import { useExercises, useExerciseText, useFavorites } from "@/entities/exercise/store"
import { exerciseEquipment, key } from "@/entities/exercise/types"
import { useSessionStore } from "@/entities/session/store"
import { VideoPlayer, YoutubeSearchButton } from "@/features/video/VideoPlayer"
import { AddToProgramDrawer } from "@/features/programs/AddToProgramDrawer"
import { ExerciseMuscles } from "./ExerciseMuscles"
import { TechniqueFeedback } from "./TechniqueFeedback"

const tile = "h-auto flex-col gap-1.5 py-3.5 text-[13px] leading-tight whitespace-normal"

export function ExercisePage() {
  const { slug = "" } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { bySlug, ready, videos, lang, en } = useExercises()
  const fav = useFavorites()
  const [frame, setFrame] = useState<"anim" | "0" | "1">("anim")
  const [addOpen, setAddOpen] = useState(false)
  const activeWorkout = useSessionStore((s) => !!s.active)
  const addToWorkout = useSessionStore((s) => s.addExercise)
  const ex = bySlug.get(slug)
  const tx = useExerciseText(ex)

  if (!ready) return <PageHeader title="" back />
  if (!ex) {
    return (
      <>
        <PageHeader title={t("exercise.notFound")} back />
        <p className="text-muted p-8 text-center">{t("exercise.notFound")}</p>
      </>
    )
  }

  const isFav = fav.codes.includes(ex.c)
  const video = videos[ex.s]

  return (
    <>
      <PageHeader
        title={tx.name}
        wrapTitle
        back
        actions={
          <Button variant="ghost" size="icon" onClick={() => fav.toggle(ex.c)} aria-label={t("catalog.favorites")} aria-pressed={isFav}>
            <Star className={cn("size-[22px]", isFav && "fill-accent text-accent-ink")} />
          </Button>
        }
      />
      <div className="space-y-7 px-4 pb-8">
        <div className="space-y-2.5">
          <ExerciseImage
            animate
            priority
            ex={ex}
            alt={tx.name}
            frame={frame === "anim" ? undefined : Number(frame)}
            interval={1300}
            size="l"
            className="hairline rounded-panel aspect-[16/9] w-full object-contain"
          />
          {ex.img > 1 && (
            <Segmented
              size="sm"
              value={frame}
              onChange={setFrame}
              options={[
                { value: "anim", label: t("exercise.animation") },
                { value: "0", label: t("exercise.start") },
                { value: "1", label: t("exercise.end") },
              ]}
            />
          )}
        </div>

        <div className="space-y-3">
          <div>

            {lang !== "en" && en[ex.s]?.name && en[ex.s].name !== tx.name && <p className="text-muted mt-1 text-sm">{en[ex.s].name}</p>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ex.pl.map((p) => (
              <Tag key={p}>{t(`place.${p}`)}</Tag>
            ))}
            <Tag>{t(`level.${ex.lvl}`)}</Tag>
            <Tag>{t(`category.${key(ex.cat)}`)}</Tag>
            {ex.mech && <Tag>{t(`mechanic.${ex.mech}`)}</Tag>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant={activeWorkout ? "default" : "primary"} className={tile} onClick={() => setAddOpen(true)}>
            <ListPlus className="size-5" />
            {t("exercise.addToProgram")}
          </Button>
          <Button
            variant={activeWorkout ? "primary" : "default"}
            className={tile}
            onClick={() => {
              if (!activeWorkout) useSessionStore.getState().start({ title: t("workout.free") })
              addToWorkout(ex.c)
              toast.success(t("exercise.addedToWorkout"))
              navigate("/workout")
            }}
          >
            <Timer className="size-5" />
            {activeWorkout ? t("exercise.addToWorkout") : t("exercise.startWorkout")}
          </Button>
          <Link to={`/progress/ex/${ex.c}`} className={buttonClass("default", "md", tile)}>
            <ChartNoAxesColumn className="size-5" />
            {t("exercise.progress")}
          </Link>
        </div>

        <Section title={t("exercise.muscles")} hint={`${t("exercise.equipment")}: ${exerciseEquipment(ex).map((item) => t(`equipment.${item}`)).join(", ")}`}>
          <ExerciseMuscles exercise={ex} />
        </Section>

        <Section title={t("exercise.technique")}>
          {tx.loading && <p role="status" className="text-muted text-sm">{t("common.loading")}</p>}
          <ol className="space-y-3.5">
            {tx.steps.filter((s) => s.trim()).map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="bg-surface hairline text-accent-ink flex size-7 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold tabular-nums">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-[15px] leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
          {!tx.loading && <TechniqueFeedback key={ex.s} name={tx.name} slug={ex.s} machine={tx.machine} />}
        </Section>

        <Section title={t(video ? "video.title" : "video.searchTitle")}>
          {video ? <VideoPlayer video={video} lang={lang} title={tx.name} /> : null}
          <YoutubeSearchButton query={lang === "ru" ? tx.name : (en[ex.s]?.name ?? tx.name)} />
        </Section>
      </div>
      <AddToProgramDrawer exercise={ex.c} open={addOpen} onOpenChange={setAddOpen} />
    </>
  )
}

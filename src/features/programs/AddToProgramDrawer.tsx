import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { Plus } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Chip } from "@/shared/ui/chip"
import { Sheet } from "@/shared/ui/sheet"
import { toast } from "@/shared/ui/toast"
import { useProgramStore } from "@/entities/program/store"
import { DEFAULT_SCHEME } from "@/entities/program/types"
import { useExercises } from "@/entities/exercise/store"
import { ExerciseImage } from "@/shared/components/ExerciseImage"
import { dayName } from "./format"

type Props = { exercise: number; open: boolean; onOpenChange: (o: boolean) => void }

export function AddToProgramDrawer({ exercise, open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { programs, update, create } = useProgramStore()
  const { byCode, text } = useExercises()
  const ex = byCode.get(exercise)

  const add = (id: string, day: number) => {
    update(id, (p) => ({
      ...p,
      days: p.days.map((d, i) => (i === day ? { ...d, items: [...d.items, { ex: exercise, ...DEFAULT_SCHEME }] } : d)),
    }))
    onOpenChange(false)
    toast.success(t("programs.added"), {
      action: { label: t("common.open"), onClick: () => navigate(`/programs/${id}`) },
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("exercise.addToProgram")}
      footer={
        <Button
          className="w-full"
          variant={programs.length ? "default" : "primary"}
          size="lg"
          onClick={() => {
            const p = create({ name: "", days: [{ name: "", items: [{ ex: exercise, ...DEFAULT_SCHEME }] }] })
            onOpenChange(false)
            navigate(`/programs/${p.id}`)
          }}
        >
          <Plus /> {t(programs.length ? "programs.newWithExercise" : "programs.createWithExercise")}
        </Button>
      }
      bodyClassName="space-y-5"
    >
      {!programs.length && <div className="space-y-4">
        {ex && <div className="bg-surface hairline flex items-center gap-3 rounded-xl p-3">
          <ExerciseImage ex={ex} alt="" className="size-16 shrink-0 rounded-lg" />
          <p className="text-sm font-medium">{text(ex).name}</p>
        </div>}
        <div className="space-y-1">
          <h3 className="font-semibold">{t("programs.noProgramsYet")}</h3>
          <p className="text-muted text-sm">{t("programs.firstProgramHint")}</p>
        </div>
      </div>}
      {programs.map((p) => (
        <div key={p.id}>
          <div className="mb-2 text-sm font-semibold">{p.name || t("programs.untitled")}</div>
          <div className="flex flex-wrap gap-1.5">
            {p.days.map((d, i) => (
              <Chip key={i} onClick={() => add(p.id, i)}>
                <Plus className="text-muted size-4" />
                {dayName(t, d.name, i)}
              </Chip>
            ))}
          </div>
        </div>
      ))}
    </Sheet>
  )
}

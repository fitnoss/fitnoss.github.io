import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"
import { ArrowDown, ArrowUp, ChevronDown, Copy, Pencil, Play, Plus, Share, Trash2 } from "lucide-react"
import { PageHeader } from "@/shared/components/PageHeader"
import { ExerciseImage } from "@/shared/components/ExerciseImage"
import { Button } from "@/shared/ui/button"
import { Chip } from "@/shared/ui/chip"
import { Input } from "@/shared/ui/field"
import { Menu, MenuItem } from "@/shared/ui/menu"
import { Panel } from "@/shared/ui/panel"
import { Sheet } from "@/shared/ui/sheet"
import { toast } from "@/shared/ui/toast"
import { cn } from "@/shared/lib/utils"
import { useSettings } from "@/shared/storage/settings"
import { useExercises } from "@/entities/exercise/store"
import { useProgramStore } from "@/entities/program/store"
import { DEFAULT_SCHEME, type Program, type ProgramDay, type ProgramItem } from "@/entities/program/types"
import { useSessionStore } from "@/entities/session/store"
import { DAY_NAMES } from "@/features/share/codec/fitpack"
import { ShareDrawer } from "@/features/share/ShareDrawer"
import { ExercisePicker } from "./ExercisePicker"
import { ItemEditor } from "./ItemEditor"
import { dayName, formatScheme } from "./format"

const MAX_DAYS = 8

export function ProgramEditorPage() {
  const { id = "" } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const program = useProgramStore((s) => s.programs.find((p) => p.id === id))
  const { update, remove, duplicate } = useProgramStore()
  const [day, setDay] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [dayDialog, setDayDialog] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const startWorkout = useSessionStore((s) => s.start)
  const hasActive = useSessionStore((s) => !!s.active)

  if (!program) {
    return (
      <>
        <PageHeader title={t("programs.notFound")} back="/programs" />
        <p className="text-muted p-8 text-center">{t("programs.notFound")}</p>
      </>
    )
  }

  const d = Math.min(day, program.days.length - 1)
  const current = program.days[d]
  const set = (fn: (p: Program) => Program) => update(program.id, fn)
  const setDayData = (fn: (day: ProgramDay) => ProgramDay) =>
    set((p) => ({ ...p, days: p.days.map((x, i) => (i === d ? fn(x) : x)) }))
  const setItems = (items: ProgramItem[]) => setDayData((x) => ({ ...x, items }))

  const addDay = () => {
    if (program.days.length >= MAX_DAYS) return
    set((p) => ({ ...p, days: [...p.days, { name: "", items: [] }] }))
    setDay(program.days.length)
    setExpanded(null)
  }

  const move = (i: number, dir: -1 | 1) => {
    const items = [...current.items]
    ;[items[i], items[i + dir]] = [items[i + dir], items[i]]
    setItems(items)
    setExpanded(i + dir)
  }

  const start = () => {
    if (hasActive && !confirm(t("workout.replaceActive"))) return
    startWorkout({ title: `${program.name || t("programs.untitled")} · ${dayName(t, current.name, d)}`, programId: program.id, day: d, plan: current })
    navigate("/workout")
  }

  return (
    <>
      <PageHeader
        title={program.name || t("programs.untitled")}
        back="/programs"
        actions={
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShareOpen(true)}
              disabled={!program.days.some((x) => x.items.length)}
              aria-label={t("share.title")}
            >
              <Share />
            </Button>
            <Menu>
              <MenuItem
                onClick={() => {
                  const copy = duplicate(program.id, t("programs.copySuffix"))
                  if (copy) navigate(`/programs/${copy.id}`, { replace: true })
                }}
              >
                <Copy /> {t("programs.duplicate")}
              </MenuItem>
              <MenuItem
                danger
                onClick={() => {
                  if (!confirm(t("programs.confirmDelete"))) return
                  remove(program.id)
                  navigate("/programs", { replace: true })
                }}
              >
                <Trash2 /> {t("common.delete")}
              </MenuItem>
            </Menu>
          </>
        }
      >
        <div className="px-4 pb-2.5">
          <Input
            value={program.name}
            onChange={(e) => set((p) => ({ ...p, name: e.target.value }))}
            placeholder={t("programs.namePlaceholder")}
            maxLength={60}
            className="h-12 text-[17px] font-semibold"
          />
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3">
          {program.days.map((x, i) => (
            <Chip
              key={i}
              active={i === d}
              onClick={() => {
                if (i === d) setDayDialog(true)
                else {
                  setDay(i)
                  setExpanded(null)
                }
              }}
            >
              {dayName(t, x.name, i)}
              {i === d && <Pencil className="size-3.5 opacity-70" />}
            </Chip>
          ))}
          {program.days.length < MAX_DAYS && (
            <Chip onClick={addDay} className="text-muted bg-transparent shadow-[inset_0_0_0_1px_var(--line)]">
              <Plus className="size-4" /> {t("programs.addDay")}
            </Chip>
          )}
        </div>
      </PageHeader>

      <div className="space-y-2 px-4 pt-1 pb-8">
        {current.items.map((it, i) => (
          <ItemCard
            key={`${i}-${it.ex}`}
            item={it}
            index={i}
            open={expanded === i}
            onToggle={() => setExpanded(expanded === i ? null : i)}
            onChange={(next) => setItems(current.items.map((x, k) => (k === i ? next : x)))}
            onMove={i > 0 || i < current.items.length - 1 ? (dir) => move(i, dir) : undefined}
            canUp={i > 0}
            canDown={i < current.items.length - 1}
            onRemove={() => {
              setItems(current.items.filter((_, k) => k !== i))
              setExpanded(null)
            }}
          />
        ))}

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="rounded-panel text-muted hover:text-fg hover:bg-surface flex h-14 w-full items-center justify-center gap-2 font-medium shadow-[inset_0_0_0_1.5px_var(--line)] transition-colors"
        >
          <Plus className="size-5" /> {t("programs.addExercises")}
        </button>

        {current.items.length > 0 && (
          <Button variant="primary" size="lg" className="mt-4 h-14 w-full" onClick={start}>
            <Play className="size-4 fill-current" /> {t("programs.startDay", { day: dayName(t, current.name, d) })}
          </Button>
        )}
      </div>

      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(codes) => {
          const last = current.items.at(-1)
          const scheme = last ? { sets: last.sets, reps: last.reps, rest: last.rest } : { ...DEFAULT_SCHEME, rest: useSettings.getState().defaultRest }
          setItems([...current.items, ...codes.map((ex) => ({ ex, ...scheme }))])
          toast.success(t("picker.added", { count: codes.length }))
        }}
      />
      <DaySheet
        open={dayDialog}
        onOpenChange={setDayDialog}
        day={current}
        index={d}
        canDelete={program.days.length > 1}
        onRename={(name) => setDayData((x) => ({ ...x, name }))}
        onDelete={() => {
          set((p) => ({ ...p, days: p.days.filter((_, i) => i !== d) }))
          setDay(Math.max(0, d - 1))
          setDayDialog(false)
        }}
      />
      <ShareDrawer program={program} open={shareOpen} onOpenChange={setShareOpen} />
    </>
  )
}

function ItemCard({
  item,
  index,
  open,
  onToggle,
  onChange,
  onMove,
  canUp,
  canDown,
  onRemove,
}: {
  item: ProgramItem
  index: number
  open: boolean
  onToggle: () => void
  onChange: (it: ProgramItem) => void
  onMove?: (dir: -1 | 1) => void
  canUp: boolean
  canDown: boolean
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const { byCode, text } = useExercises()
  const ex = byCode.get(item.ex)

  return (
    <Panel className={cn("overflow-hidden transition-colors", !open && "hover:bg-surface-hover")}>
      <button type="button" className="flex w-full items-center gap-3 p-2.5 pr-4 text-left" onClick={onToggle} aria-expanded={open}>
        {ex ? (
          <ExerciseImage ex={ex} alt="" animate={false} className="hairline size-14 shrink-0 rounded-[10px]" />
        ) : (
          <div className="bg-elevated size-14 shrink-0 rounded-[10px]" />
        )}
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-[15px] leading-snug font-medium">
            <span className="text-muted mr-1.5 tabular-nums">{index + 1}</span>
            {ex ? text(ex).name : t("exercise.unknown")}
          </div>
          <div className="text-muted mt-0.5 text-[13px]">{formatScheme(t, item)}</div>
        </div>
        <ChevronDown className={cn("text-muted size-5 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-2.5 pb-2.5">
          <div className="bg-page rounded-control p-2.5">
            <ItemEditor item={item} onChange={onChange} />
          </div>
          <div className="flex items-center gap-1 pt-2">
            {onMove && (
              <>
                <Button variant="ghost" size="icon-sm" disabled={!canUp} onClick={() => onMove(-1)} aria-label={t("workout.moveUp")}>
                  <ArrowUp className="size-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" disabled={!canDown} onClick={() => onMove(1)} aria-label={t("workout.moveDown")}>
                  <ArrowDown className="size-4" />
                </Button>
              </>
            )}
            <Button variant="danger" size="sm" className="ml-auto" onClick={onRemove}>
              <Trash2 className="size-4" /> {t("programs.removeExercise")}
            </Button>
          </div>
        </div>
      )}
    </Panel>
  )
}

function DaySheet({
  open,
  onOpenChange,
  day,
  index,
  canDelete,
  onRename,
  onDelete,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  day: ProgramDay
  index: number
  canDelete: boolean
  onRename: (name: string) => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const presets = DAY_NAMES.filter(Boolean)
  const custom = day.name.startsWith("@") ? "" : day.name
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={dayName(t, day.name, index)}
      bodyClassName="space-y-4"
      footer={
        <div className="flex gap-2">
          {canDelete && (
            <Button variant="danger" onClick={() => confirm(t("programs.confirmDeleteDay")) && onDelete()}>
              <Trash2 className="size-4" /> {t("programs.deleteDay")}
            </Button>
          )}
          <Button variant="primary" className="ml-auto min-w-28" onClick={() => onOpenChange(false)}>
            {t("common.done")}
          </Button>
        </div>
      }
    >
      <Input
        value={custom}
        placeholder={t("programs.dayNamePlaceholder", { n: index + 1 })}
        maxLength={40}
        onChange={(e) => onRename(e.target.value)}
        onBlur={(e) => {
          // Typed a preset name? Store the token so links stay short and get translated.
          const v = e.target.value.trim().toLowerCase()
          const match = presets.find((p) => t(`dayPreset.${p.slice(1)}`).toLowerCase() === v)
          if (match) onRename(match)
        }}
      />
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <Chip key={p} active={day.name === p} onClick={() => onRename(p)}>
            {t(`dayPreset.${p.slice(1)}`)}
          </Chip>
        ))}
      </div>
    </Sheet>
  )
}

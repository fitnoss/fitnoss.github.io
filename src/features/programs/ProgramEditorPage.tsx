import { confirmAction } from "@/shared/ui/confirm"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams, useSearchParams } from "react-router"
import { ArrowDown, ArrowUp, CalendarDays, ChevronDown, Copy, Link2, Pencil, Play, Plus, Share, Trash2 } from "lucide-react"
import { PageHeader } from "@/shared/components/PageHeader"
import { ExerciseImage } from "@/shared/components/ExerciseImage"
import { SupersetGroup } from "@/shared/components/SupersetGroup"
import { Button } from "@/shared/ui/button"
import { Chip } from "@/shared/ui/chip"
import { Input } from "@/shared/ui/field"
import { Menu, MenuItem } from "@/shared/ui/menu"
import { Panel } from "@/shared/ui/panel"
import { Sheet } from "@/shared/ui/sheet"
import { toast } from "@/shared/ui/toast"
import { cn } from "@/shared/lib/utils"
import { uid } from "@/shared/lib/id"
import { dateValue } from "@/shared/lib/calendar"
import { useSettings } from "@/shared/storage/settings"
import { useExercises } from "@/entities/exercise/store"
import { useProgramStore } from "@/entities/program/store"
import {
  DEFAULT_SCHEME,
  groups,
  itemLabels,
  moveItem,
  removeItem,
  withLink,
  type Program,
  type ProgramDay,
  type ProgramItem,
  type WorkoutMode,
} from "@/entities/program/types"
import { DAY_NAMES } from "@/features/share/codec/fitpack"
import { ShareDrawer } from "@/features/share/ShareDrawer"
import { ExercisePicker } from "./ExercisePicker"
import { ItemEditor } from "./ItemEditor"
import { ProgramVolume } from "./ProgramVolume"
import { useStartDay } from "@/features/workout/useStartDay"
import { dayName, formatChecklistTarget, formatScheme } from "./format"
import { ScheduleSheet, WorkoutModeControl } from "./ScheduleSheet"

const MAX_DAYS = 8
const editorStates = new Map<string, { workoutId?: string; expanded: number | null; editing: boolean }>()

export function ProgramEditorPage() {
  const { id = "" } = useParams()
  const [query] = useSearchParams()
  const workoutId = query.get("workout") ?? undefined
  return <ProgramEditor key={`${id}/${workoutId ?? ""}`} id={id} initialWorkoutId={workoutId} />
}

function ProgramEditor({ id, initialWorkoutId }: { id: string; initialWorkoutId?: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const program = useProgramStore((s) => s.programs.find((p) => p.id === id))
  const { update, remove, duplicate } = useProgramStore()
  const [workoutId, setWorkoutId] = useState(initialWorkoutId ?? editorStates.get(id)?.workoutId)
  const [editing, setEditing] = useState(initialWorkoutId ? false : editorStates.get(id)?.editing ?? !program?.days.some((d) => d.items.length))
  const [pickerOpen, setPickerOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState<"program" | "workout" | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [dayDialog, setDayDialog] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(initialWorkoutId ? null : editorStates.get(id)?.expanded ?? null)
  useEffect(() => { editorStates.set(id, { workoutId, expanded, editing }) }, [id, workoutId, expanded, editing])
  const startDay = useStartDay()

  if (!program) {
    return (
      <>
        <PageHeader title={t("programs.notFound")} back="/" />
        <p className="text-muted p-8 text-center">{t("programs.notFound")}</p>
      </>
    )
  }

  const d = Math.max(0, program.days.findIndex((day) => day.id === workoutId))
  const current = program.days[d]
  const checklist = current.mode === "checklist"
  const set = (fn: (p: Program) => Program) => update(program.id, fn)
  const setDayData = (fn: (day: ProgramDay) => ProgramDay) =>
    set((p) => ({ ...p, days: p.days.map((x) => (x.id === current.id ? fn(x) : x)) }))
  const setItems = (items: ProgramItem[]) => setDayData((x) => ({ ...x, items }))

  const addDay = () => {
    if (program.days.length >= MAX_DAYS) return
    const id = uid()
    set((p) => ({ ...p, days: [...p.days, { id, name: "", items: [] }] }))
    setWorkoutId(id)
    setExpanded(null)
  }

  const move = (i: number, dir: -1 | 1) => {
    setItems(moveItem(current.items, i, dir))
    setExpanded(i + dir)
  }

  /** Links item k to the one above it as a superset, or unlinks them. */
  const toggleLink = (k: number) => setItems(current.items.map((x, j) => (j === k ? withLink(x, x.superset ? undefined : true) : x)))

  const labels = checklist ? current.items.map((_, i) => String(i + 1)) : itemLabels(current.items)
  const card = (i: number) => {
    const it = current.items[i]
    return (
      <ItemCard
        key={`${i}-${it.ex}`}
        item={it}
        checklist={checklist}
        label={labels[i]}
        inSuperset={!!current.items[i + 1]?.superset}
        open={editing && expanded === i}
        onToggle={() => { setEditing(true); setExpanded(expanded === i ? null : i) }}
        onChange={(next) => setItems(current.items.map((x, k) => (k === i ? next : x)))}
        onMove={current.items.length > 1 ? (dir) => move(i, dir) : undefined}
        canUp={i > 0}
        canDown={i < current.items.length - 1}
        linkUp={!checklist && i > 0 ? { linked: !!it.superset, toggle: () => toggleLink(i) } : undefined}
        linkDown={!checklist && i < current.items.length - 1 ? { linked: !!current.items[i + 1].superset, toggle: () => toggleLink(i + 1) } : undefined}
        onRemove={() => {
          const before = current.items
          const after = removeItem(current.items, i)
          setItems(after)
          toast(t("workout.exerciseRemoved"), { action: { label: t("common.undo"), onClick: () => {
            update(program.id, (p) => ({ ...p, days: p.days.map((x) => x.id === current.id && x.items === after ? { ...x, items: before } : x) }))
          } } })
          setExpanded(null)
        }}
      />
    )
  }

  return (
    <>
      <PageHeader
        title={<span className="block min-w-0"><span className="block truncate">{program.name || t("programs.untitled")}</span><span className="text-muted block truncate text-xs font-normal">{dayName(t, current.name, d)}</span></span>}
        back="/"
        actions={
          <>
            {editing ? <Button variant="primary" size="sm" onClick={() => setEditing(false)}>{t("common.done")}</Button> : <Button
              variant="ghost"
              size="icon"
              onClick={() => setShareOpen("program")}
              disabled={!program.days.some((x) => x.items.length)}
              aria-label={t("share.title")}
            >
              <Share />
            </Button>}
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
                onClick={async () => {
                  if (!await confirmAction(t("programs.confirmDelete"))) return
                  remove(program.id)
                  navigate("/", { replace: true })
                }}
              >
                <Trash2 /> {t("common.delete")}
              </MenuItem>
            </Menu>
          </>
        }
      />
      <div className="pt-2">
        {editing && <div className="px-4 pb-2.5">
          <Input
            aria-label={t("programs.namePlaceholder")}
            value={program.name}
            onChange={(e) => set((p) => ({ ...p, name: e.target.value }))}
            placeholder={t("programs.namePlaceholder")}
            maxLength={60}
            className="h-12 text-[17px] font-semibold"
          />
        </div>}
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-2">
          {program.days.map((x, i) => (
            <Chip
              key={x.id}
              active={i === d}
              onClick={() => {
                if (i === d && editing) setDayDialog(true)
                else {
                  setWorkoutId(x.id)
                  setExpanded(null)
                }
              }}
            >
              {dayName(t, x.name, i)}
              {i === d && editing && <Pencil className="size-3.5 opacity-70" />}
            </Chip>
          ))}
          {editing && program.days.length < MAX_DAYS && (
            <Chip onClick={addDay} className="text-muted bg-transparent shadow-[inset_0_0_0_1px_var(--line)]">
              <Plus className="size-4" /> {t("programs.addDay")}
            </Chip>
          )}
        </div>
      </div>

      <div className="space-y-2 px-4 pt-1 pb-8">
        <div className="flex flex-wrap items-center gap-2 pb-2">
          {!editing && <Button className="flex-1" onClick={() => setEditing(true)}>{t("programs.edit")}</Button>}
          {!editing && current.items.length > 0 && <Button variant="primary" className="flex-1" onClick={() => startDay(program, d)}><Play className="size-4" />{t("home.start")}</Button>}
          <Button size="sm" disabled={!current.items.length} onClick={() => setScheduleOpen(true)}><CalendarDays /> {t("schedule.plan")}</Button>
          <Menu label={t("schedule.workoutMenu")}>
            <MenuItem onClick={() => setDayDialog(true)}><Pencil /> {t("schedule.workoutSettings")}</MenuItem>
            <MenuItem disabled={!current.items.length} onClick={() => setShareOpen("workout")}><Share /> {t("share.workout")}</MenuItem>
          </Menu>
        </div>
        {editing && <p role="status" className="text-muted pb-1 text-xs">{t("programs.autosaved")}</p>}
        <p className="text-muted px-1 pb-1 text-xs">{t(checklist ? "schedule.checklist" : "schedule.detailed")}</p>
        {checklist ? current.items.map((_, i) => card(i)) :
          groups(current.items).map((g) => (g.length > 1 ? <SupersetGroup key={`g${g[0]}`}>{g.map(card)}</SupersetGroup> : card(g[0])))}

        {editing && <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="rounded-panel text-muted hover:text-fg hover:bg-surface flex h-14 w-full items-center justify-center gap-2 font-medium shadow-[inset_0_0_0_1.5px_var(--line)] transition-colors"
        >
          <Plus className="size-5" /> {t("programs.addExercises")}
        </button>}
        {program.days.some((day) => day.mode !== "checklist") && <ProgramVolume program={program} />}
      </div>

      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(codes) => {
          const last = current.items.at(-1)
          const scheme = checklist ? { sets: 1, reps: "", rest: 0 } :
            last ? { sets: last.sets, reps: last.reps, rest: last.rest } : { ...DEFAULT_SCHEME, rest: useSettings.getState().defaultRest }
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
        onMode={(mode) => setDayData((x) => ({ ...x, mode, items: mode === "detailed" ?
          x.items.map((item) => ({ ...item, reps: item.reps || DEFAULT_SCHEME.reps })) : x.items }))}
        onRename={(name) => setDayData((x) => ({ ...x, name }))}
        onDelete={() => {
          set((p) => ({ ...p, days: p.days.filter((_, i) => i !== d) }))
          setWorkoutId(program.days[d - 1]?.id ?? program.days[d + 1]?.id)
          setDayDialog(false)
        }}
      />
      {scheduleOpen && <ScheduleSheet workoutId={current.id} date={dateValue(new Date())} onClose={() => setScheduleOpen(false)} />}
      {shareOpen && <ShareDrawer source={shareOpen === "program" ? { kind: "program", program } :
        { kind: "workout", workout: { ...current, name: current.name.trim() || dayName(t, current.name, d) } }}
        open onOpenChange={(open) => !open && setShareOpen(null)} />}
    </>
  )
}

function ItemCard({
  item,
  checklist,
  label,
  inSuperset,
  open,
  onToggle,
  onChange,
  onMove,
  canUp,
  canDown,
  linkUp,
  linkDown,
  onRemove,
}: {
  item: ProgramItem
  checklist: boolean
  label: string
  /** The next exercise continues this superset. */
  inSuperset: boolean
  open: boolean
  onToggle: () => void
  onChange: (it: ProgramItem) => void
  onMove?: (dir: -1 | 1) => void
  canUp: boolean
  canDown: boolean
  /** Superset with the exercise above / below; absent at the ends of the day. */
  linkUp?: SupersetToggle
  linkDown?: SupersetToggle
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const { byCode, text } = useExercises()
  const ex = byCode.get(item.ex)
  const scheme = checklist ? formatChecklistTarget(t, item.reps) : formatScheme(t, inSuperset ? { ...item, rest: 0 } : item)

  return (
    <Panel className={cn("overflow-hidden transition-colors", !open && "hover:bg-surface-hover")}>
      <div className="flex items-center">
        {ex ? (
          <Link to={`/ex/${ex.s}`} className="shrink-0 py-2.5 pl-2.5" aria-label={text(ex).name}>
            <ExerciseImage ex={ex} alt="" animate={false} className="hairline size-14 rounded-[10px]" />
          </Link>
        ) : (
          <div className="bg-elevated my-2.5 ml-2.5 size-14 shrink-0 rounded-[10px]" />
        )}
        <button type="button" className="flex min-w-0 flex-1 items-center gap-3 self-stretch py-2.5 pr-4 pl-3 text-left" onClick={onToggle} aria-expanded={open}>
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-[15px] leading-snug font-medium">
            <span className="text-muted mr-1.5 tabular-nums">{label}</span>
            {ex ? text(ex).name : t("exercise.unknown")}
          </div>
          {scheme && <div className="text-muted mt-0.5 text-[13px]">{scheme}</div>}
        </div>
        <ChevronDown className={cn("text-muted size-5 shrink-0 transition-transform", open && "rotate-180")} />
        </button>
      </div>
      {open && (
        <div className="px-2.5 pb-2.5">
          <div className="bg-page rounded-control p-2.5">
            <ItemEditor item={item} checklist={checklist} onChange={onChange} inSuperset={inSuperset} />
          </div>
          {(linkUp || linkDown) && (
            <div className="flex items-center gap-1.5 pt-3 pl-1">
              <Link2 className="text-muted size-4" />
              <span className="text-muted mr-0.5 text-[13px] font-medium">{t("programs.supersetWith")}</span>
              {linkUp && <LinkToggle dir="up" {...linkUp} />}
              {linkDown && <LinkToggle dir="down" {...linkDown} />}
            </div>
          )}
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

type SupersetToggle = { linked: boolean; toggle: () => void }

/** Arrow toggle in the "Superset with:" row: lit while linked to the exercise above / below. */
function LinkToggle({ dir, linked, toggle }: SupersetToggle & { dir: "up" | "down" }) {
  const { t } = useTranslation()
  const Arrow = dir === "up" ? ArrowUp : ArrowDown
  const label = linked ? (dir === "up" ? "programs.unlinkUp" : "programs.unlinkDown") : dir === "up" ? "programs.linkUp" : "programs.linkDown"
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={linked}
      aria-label={t(label)}
      title={t(label)}
      className={cn(
        "rounded-control flex size-11 items-center justify-center transition-colors",
        linked ? "bg-accent text-accent-fg" : "bg-page text-muted hover:text-fg shadow-[inset_0_0_0_1px_var(--line)]",
      )}
    >
      <Arrow className="size-4" />
    </button>
  )
}

function DaySheet({
  open,
  onOpenChange,
  day,
  index,
  canDelete,
  onMode,
  onRename,
  onDelete,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  day: ProgramDay
  index: number
  canDelete: boolean
  onMode: (mode: WorkoutMode) => void
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
            <Button variant="danger" onClick={async () => await confirmAction(t("programs.confirmDeleteDay")) && onDelete()}>
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
        aria-label={t("schedule.workoutName")}
        value={custom}
        placeholder={t("programs.dayNamePlaceholder", { n: index + 1 })}
        maxLength={60}
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
      <WorkoutModeControl value={day.mode ?? "detailed"} onChange={onMode} />
    </Sheet>
  )
}

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router"
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
} from "@/entities/program/types"
import { DAY_NAMES } from "@/features/share/codec/fitpack"
import { ShareDrawer } from "@/features/share/ShareDrawer"
import { ExercisePicker } from "./ExercisePicker"
import { ItemEditor } from "./ItemEditor"
import { useStartDay } from "@/features/workout/useStartDay"
import { dayName, formatScheme, formatWeekdays, weekdayName } from "./format"

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
  const startDay = useStartDay()

  if (!program) {
    return (
      <>
        <PageHeader title={t("programs.notFound")} back="/" />
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
    setItems(moveItem(current.items, i, dir))
    setExpanded(i + dir)
  }

  /** A weekday belongs to one day of the program: picking it here takes it from the others. */
  const setWeekdays = (weekdays: number[]) =>
    set((p) => ({
      ...p,
      days: p.days.map((x, i) => {
        const own = i === d ? weekdays : (x.weekdays ?? []).filter((wd) => !weekdays.includes(wd))
        const { weekdays: _, ...rest } = x
        return own.length ? { ...rest, weekdays: [...own].sort() } : rest
      }),
    }))

  /** Links item k to the one above it as a superset, or unlinks them. */
  const toggleLink = (k: number) => setItems(current.items.map((x, j) => (j === k ? withLink(x, x.superset ? undefined : true) : x)))

  const labels = itemLabels(current.items)
  const card = (i: number) => {
    const it = current.items[i]
    return (
      <ItemCard
        key={`${i}-${it.ex}`}
        item={it}
        label={labels[i]}
        inSuperset={!!current.items[i + 1]?.superset}
        open={expanded === i}
        onToggle={() => setExpanded(expanded === i ? null : i)}
        onChange={(next) => setItems(current.items.map((x, k) => (k === i ? next : x)))}
        onMove={current.items.length > 1 ? (dir) => move(i, dir) : undefined}
        canUp={i > 0}
        canDown={i < current.items.length - 1}
        linkUp={i > 0 ? { linked: !!it.superset, toggle: () => toggleLink(i) } : undefined}
        linkDown={i < current.items.length - 1 ? { linked: !!current.items[i + 1].superset, toggle: () => toggleLink(i + 1) } : undefined}
        onRemove={() => {
          setItems(removeItem(current.items, i))
          setExpanded(null)
        }}
      />
    )
  }

  return (
    <>
      <PageHeader
        title={program.name || t("programs.untitled")}
        back="/"
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
                  navigate("/", { replace: true })
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
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-2">
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
              {x.weekdays?.length ? <span className="text-[13px] opacity-60">{formatWeekdays(x.weekdays)}</span> : null}
              {i === d && <Pencil className="size-3.5 opacity-70" />}
            </Chip>
          ))}
          {program.days.length < MAX_DAYS && (
            <Chip onClick={addDay} className="text-muted bg-transparent shadow-[inset_0_0_0_1px_var(--line)]">
              <Plus className="size-4" /> {t("programs.addDay")}
            </Chip>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDayDialog(true)}
          className={cn(
            "mx-4 mb-2.5 flex items-center gap-1.5 text-[13px] font-medium transition-colors",
            "text-muted hover:text-fg",
          )}
        >
          <CalendarDays className="size-4" />
          {t(current.weekdays?.length ? "programs.editWeekdays" : "programs.setWeekdays")}
        </button>
      </PageHeader>

      <div className="space-y-2 px-4 pt-1 pb-8">
        {groups(current.items).map((g) => (g.length > 1 ? <SupersetGroup key={`g${g[0]}`}>{g.map(card)}</SupersetGroup> : card(g[0])))}

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="rounded-panel text-muted hover:text-fg hover:bg-surface flex h-14 w-full items-center justify-center gap-2 font-medium shadow-[inset_0_0_0_1.5px_var(--line)] transition-colors"
        >
          <Plus className="size-5" /> {t("programs.addExercises")}
        </button>

        {current.items.length > 0 && (
          <Button variant="primary" size="lg" className="mt-4 h-14 w-full" onClick={() => startDay(program, d)}>
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
        takenWeekdays={program.days.flatMap((x, i) => (i === d ? [] : (x.weekdays ?? [])))}
        onWeekdays={setWeekdays}
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
          <div className="text-muted mt-0.5 text-[13px]">{formatScheme(t, inSuperset ? { ...item, rest: 0 } : item)}</div>
        </div>
        <ChevronDown className={cn("text-muted size-5 shrink-0 transition-transform", open && "rotate-180")} />
        </button>
      </div>
      {open && (
        <div className="px-2.5 pb-2.5">
          <div className="bg-page rounded-control p-2.5">
            <ItemEditor item={item} onChange={onChange} inSuperset={inSuperset} />
          </div>
          {(linkUp || linkDown) && (
            <div className="flex items-center gap-1.5 pt-2 pl-1">
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
        "rounded-control flex size-8 items-center justify-center transition-colors",
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
  takenWeekdays,
  onWeekdays,
  onRename,
  onDelete,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  day: ProgramDay
  index: number
  canDelete: boolean
  /** Weekdays other days of the program are on; picking one moves it here. */
  takenWeekdays: number[]
  onWeekdays: (weekdays: number[]) => void
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
      <div className="space-y-2 pt-2">
        <div className="text-muted text-xs font-medium">{t("programs.weekdays")}</div>
        <div className="grid grid-cols-7 gap-1.5">
          {[0, 1, 2, 3, 4, 5, 6].map((wd) => {
            const on = !!day.weekdays?.includes(wd)
            const taken = !on && takenWeekdays.includes(wd)
            return (
              <button
                key={wd}
                type="button"
                aria-pressed={on}
                onClick={() => onWeekdays(on ? day.weekdays!.filter((x) => x !== wd) : [...(day.weekdays ?? []), wd])}
                className={cn(
                  "rounded-control relative flex h-11 items-center justify-center text-sm font-semibold transition-colors",
                  on ? "bg-inverse text-inverse-fg" : "bg-surface hairline hover:bg-surface-hover",
                  taken && "text-muted",
                )}
              >
                {weekdayName(wd)}
                {taken && <span className="bg-muted absolute bottom-1.5 size-1 rounded-full" />}
              </button>
            )
          })}
        </div>
        <p className="text-muted text-xs leading-relaxed">{t("programs.weekdaysHint")}</p>
      </div>
    </Sheet>
  )
}

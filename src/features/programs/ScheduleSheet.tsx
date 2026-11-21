import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Trash2 } from "lucide-react"
import { useExercises } from "@/entities/exercise/store"
import { useProgramStore } from "@/entities/program/store"
import { DEFAULT_SCHEME, weekdayOf, type WorkoutMode } from "@/entities/program/types"
import { validDate, validTime, type ScheduleEntry, type ScheduleRule } from "@/entities/program/schedule"
import { useSettings } from "@/shared/storage/settings"
import { calendarDate } from "@/shared/lib/calendar"
import { Button } from "@/shared/ui/button"
import { Chip } from "@/shared/ui/chip"
import { confirmAction } from "@/shared/ui/confirm"
import { DatePicker } from "@/shared/ui/date-picker"
import { Field, Input } from "@/shared/ui/field"
import { Segmented } from "@/shared/ui/segmented"
import { Select } from "@/shared/ui/select"
import { Sheet } from "@/shared/ui/sheet"
import { ExercisePicker } from "./ExercisePicker"
import { dayName, weekdayName } from "./format"

const NEW_WORKOUT = "new"

type Props = {
  date: string
  workoutId?: string
  entry?: ScheduleEntry
  onClose: () => void
  onSave?: (date: string) => void
}

export function ScheduleSheet({ date: initialDate, workoutId, entry, onClose, onSave }: Props) {
  const { t } = useTranslation()
  const { programs, create, scheduleWorkout, removeSchedule } = useProgramStore()
  const { byCode, text } = useExercises()
  const workouts = programs.flatMap((program) => program.days.flatMap((day, index) => {
    if (!day.items.length && day.id !== entry?.workoutId) return []
    const name = dayName(t, day.name, index)
    return [{
      value: day.id,
      label: program.name && program.name !== name ? `${program.name} · ${name}` : name,
    }]
  }))
  const [workout, setWorkout] = useState(entry?.workoutId ?? workoutId ?? workouts[0]?.value ?? NEW_WORKOUT)
  const [date, setDate] = useState(entry?.date ?? initialDate)
  const [repeat, setRepeat] = useState<ScheduleRule["repeat"]>(entry?.repeat ?? "once")
  const [weekdays, setWeekdays] = useState(entry?.repeat === "weekly" ? entry.weekdays : [weekdayOf(calendarDate(date))])
  const [anyTime, setAnyTime] = useState(!entry?.time)
  const [time, setTime] = useState(entry?.time ?? "09:00")
  const [name, setName] = useState("")
  const [mode, setMode] = useState<WorkoutMode>("detailed")
  const [codes, setCodes] = useState<number[]>([])
  const [picker, setPicker] = useState(false)
  const addNew = workout === NEW_WORKOUT
  const canSave = validDate(date) && (anyTime || validTime(time)) && (repeat === "once" || weekdays.length > 0) &&
    (addNew ? !!name.trim() && codes.length > 0 : workouts.some((option) => option.value === workout))

  const save = () => {
    if (!canSave) return
    const timing = { date, ...(anyTime ? {} : { time }) }
    const rule: ScheduleRule = repeat === "once" ? { ...timing, repeat } : { ...timing, repeat, weekdays: [...weekdays].sort() }
    if (addNew) {
      const scheme = mode === "checklist" ? { sets: 1, reps: "", rest: 0 } : { ...DEFAULT_SCHEME, rest: useSettings.getState().defaultRest }
      const items = codes.map((ex) => ({ ...scheme, ex }))
      create({ name: name.trim(), days: [{ name: name.trim(), items, mode }] }, [rule])
    } else {
      scheduleWorkout(workout, rule, entry?.id)
    }
    onSave?.(date)
    onClose()
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()} title={t(entry ? "schedule.edit" : "schedule.plan")}
      description={entry?.repeat === "weekly" ? t("schedule.editWeeklyHint") : undefined}
      bodyClassName="space-y-4" footer={<div className="flex gap-2">
        {entry && <Button variant="ghost" size="icon" className="text-danger" aria-label={t("schedule.remove")} onClick={async () => {
          if (!await confirmAction(t(entry.repeat === "weekly" ? "schedule.confirmRemoveWeekly" : "schedule.confirmRemove"))) return
          removeSchedule(entry.id)
          onClose()
        }}><Trash2 /></Button>}
        <Button variant="primary" className="flex-1" onClick={save} disabled={!canSave}>{t("common.save")}</Button>
      </div>}>
      <div className="space-y-1.5">
        <p className="text-muted text-xs font-medium">{t("schedule.workout")}</p>
        <Select label={t("schedule.workout")} value={workout} onChange={setWorkout}
          disabled={!!entry || !!workoutId} options={[...workouts, { value: NEW_WORKOUT, label: t("schedule.createWorkout") }]} />
      </div>
      {addNew && <div className="space-y-3">
        <Field label={t("schedule.workoutName")}><Input value={name} maxLength={60} onChange={(event) => setName(event.target.value)} /></Field>
        <WorkoutModeControl value={mode} onChange={setMode} />
        {codes.length > 0 && <ul className="space-y-1">
          {codes.map((code) => <li key={code} className="flex items-center justify-between gap-2 text-sm">
            <span>{text(byCode.get(code)).name}</span>
            <Button variant="ghost" size="icon" aria-label={`${t("common.delete")} · ${text(byCode.get(code)).name}`}
              onClick={() => setCodes((list) => list.filter((value) => value !== code))}><Trash2 className="size-4" /></Button>
          </li>)}
        </ul>}
        <Button className="w-full" onClick={() => setPicker(true)}><Plus /> {t("programs.addExercises")}</Button>
      </div>}
      <Segmented label={t("schedule.repeat")} value={repeat} onChange={setRepeat}
        options={[{ value: "once", label: t("schedule.once") }, { value: "weekly", label: t("schedule.weekly") }]} />
      <DatePicker value={date} label={t(repeat === "weekly" ? "schedule.startDate" : "schedule.date")} onChange={(next) => {
        if (repeat === "once") setWeekdays([weekdayOf(calendarDate(next))])
        setDate(next)
      }} />
      {repeat === "weekly" && <fieldset className="space-y-2">
        <legend className="text-muted text-xs font-medium">{t("schedule.weekdays")}</legend>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, day) => <Chip key={day} className="justify-center px-0" active={weekdays.includes(day)}
            aria-label={weekdayName(day, "long")} onClick={() => setWeekdays((current) => current.includes(day)
              ? current.filter((value) => value !== day) : [...current, day])}>{weekdayName(day)}</Chip>)}
        </div>
      </fieldset>}
      <label className="flex min-h-10 items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-[var(--accent-ink)]" checked={anyTime} onChange={(event) => setAnyTime(event.target.checked)} />
        {t("schedule.anyTime")}
      </label>
      {!anyTime && <Field label={t("schedule.time")}><Input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></Field>}
      <ExercisePicker open={picker} onOpenChange={setPicker} onPick={(selected) => setCodes((current) => [...new Set([...current, ...selected])])} />
    </Sheet>
  )
}

export function WorkoutModeControl({ value, onChange }: { value: WorkoutMode; onChange: (mode: WorkoutMode) => void }) {
  const { t } = useTranslation()
  return <div className="space-y-1.5">
    <p className="text-muted text-xs font-medium">{t("schedule.mode")}</p>
    <Segmented size="sm" label={t("schedule.mode")} value={value} onChange={onChange}
      options={[{ value: "detailed", label: t("schedule.detailed") }, { value: "checklist", label: t("schedule.checklist") }]} />
  </div>
}

import type { TFunction } from "i18next"
import i18n from "@/shared/i18n"
import { canProgress, itemLabels, parseReps, restAfter, type ProgramData, type ProgramItem, type Reps } from "@/entities/program/types"

export function formatRepsLabel(t: TFunction, reps: Reps) {
  const p = parseReps(reps)
  switch (p.kind) {
    case "reps":
      return String(p.n)
    case "range":
      return `${p.a}–${p.b}`
    case "time":
      return formatDuration(t, p.s)
    case "amrap":
      return "AMRAP"
    case "max":
      return t("reps.max")
  }
}

export function formatDuration(t: TFunction, s: number) {
  if (s < 60) return t("units.sec", { n: s })
  const m = Math.floor(s / 60)
  const r = s % 60
  return r ? t("units.minSec", { m, s: r }) : t("units.min", { n: m })
}

export function formatScheme(t: TFunction, it: Pick<ProgramItem, "sets" | "reps" | "rest" | "weight" | "inc">) {
  const parts = [`${it.sets} × ${formatRepsLabel(t, it.reps)}`]
  if (it.weight) parts.push(t("units.kg", { n: it.weight }))
  if (it.inc && canProgress(it.reps)) parts.push(t("scheme.stepShort", { n: it.inc }))
  if (it.rest) parts.push(t("scheme.restShort", { d: formatDuration(t, it.rest) }))
  return parts.join(" · ")
}

/** Weekday in the UI language, 0 = Monday: "Пн" / "Mon", "понедельник" / "Monday", "П" / "M". */
export function weekdayName(wd: number, style: "narrow" | "short" | "long" = "short") {
  // 1 Jan 2024 was a Monday.
  const name = new Intl.DateTimeFormat(i18n.resolvedLanguage ?? "en", { weekday: style }).format(new Date(2024, 0, 1 + wd))
  return style === "long" ? name : name.charAt(0).toUpperCase() + name.slice(1)
}

export function formatWeekdays(weekdays: number[] | undefined) {
  return (weekdays ?? []).map((wd) => weekdayName(wd)).join(", ")
}

export function dayName(t: TFunction, name: string, index: number) {
  if (name.startsWith("@")) return t(`dayPreset.${name.slice(1)}`)
  return name.trim() || t("programs.dayN", { n: index + 1 })
}

/** Plain-text version of a program for messengers. */
export function programToText(
  t: TFunction,
  p: ProgramData,
  exName: (code: number) => string,
  link?: string,
) {
  const lines: string[] = []
  lines.push(p.name.trim() || t("programs.untitled"))
  p.days.forEach((d, i) => {
    const when = formatWeekdays(d.weekdays)
    lines.push("", `${dayName(t, d.name, i)}${when ? ` (${when})` : ""}:`)
    const labels = itemLabels(d.items)
    d.items.forEach((it, j) => {
      const scheme = formatScheme(t, { ...it, rest: restAfter(d.items, j) })
      lines.push(`${labels[j]}. ${exName(it.ex)} — ${scheme}${it.note ? ` (${it.note})` : ""}`)
    })
  })
  if (link) lines.push("", link)
  return lines.join("\n")
}

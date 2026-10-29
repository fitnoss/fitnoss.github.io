import type { TFunction } from "i18next"
import { parseReps, type ProgramData, type ProgramItem, type Reps } from "@/entities/program/types"

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

export function formatScheme(t: TFunction, it: Pick<ProgramItem, "sets" | "reps" | "rest" | "weight">) {
  const parts = [`${it.sets} × ${formatRepsLabel(t, it.reps)}`]
  if (it.weight) parts.push(t("units.kg", { n: it.weight }))
  if (it.rest) parts.push(`⏱ ${formatDuration(t, it.rest)}`)
  return parts.join(" · ")
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
  lines.push(`🏋️ ${p.name.trim() || t("programs.untitled")}`)
  p.days.forEach((d, i) => {
    lines.push("", `📅 ${dayName(t, d.name, i)}`)
    d.items.forEach((it, j) => {
      lines.push(`${j + 1}. ${exName(it.ex)} — ${formatScheme(t, it)}${it.note ? ` (${it.note})` : ""}`)
    })
  })
  if (link) lines.push("", link)
  return lines.join("\n")
}

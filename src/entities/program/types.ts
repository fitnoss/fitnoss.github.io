/**
 * Reps token: "10", "8-12", "30s" (seconds hold), "amrap", "max".
 */
export type Reps = string

export type ProgramItem = {
  ex: number
  sets: number
  reps: Reps
  rest: number
  weight?: number
  note?: string
  /** Done back-to-back with the previous exercise (a superset); only the last one of the group rests. */
  superset?: true
}

export type ProgramDay = {
  /** Empty name means "Day N" in the viewer's language. */
  name: string
  items: ProgramItem[]
  /** Weekdays this day is scheduled on, sorted, 0 = Monday … 6 = Sunday. */
  weekdays?: number[]
}

export type Program = {
  id: string
  name: string
  days: ProgramDay[]
  createdAt: number
  updatedAt: number
}

/** What a share link carries: a program without local metadata. */
export type ProgramData = Pick<Program, "name" | "days">

export const DEFAULT_SCHEME = { sets: 3, reps: "10", rest: 90 } as const

export type ParsedReps =
  | { kind: "reps"; n: number }
  | { kind: "range"; a: number; b: number }
  | { kind: "time"; s: number }
  | { kind: "amrap" }
  | { kind: "max" }

export function parseReps(r: Reps): ParsedReps {
  if (r === "amrap" || r === "max") return { kind: r }
  let m = /^(\d+)s$/.exec(r)
  if (m) return { kind: "time", s: Number(m[1]) }
  m = /^(\d+)-(\d+)$/.exec(r)
  if (m) return { kind: "range", a: Number(m[1]), b: Number(m[2]) }
  const n = Number(r)
  return Number.isFinite(n) && n > 0 ? { kind: "reps", n: Math.round(n) } : { kind: "reps", n: 10 }
}

export function formatReps(p: ParsedReps): Reps {
  switch (p.kind) {
    case "reps":
      return String(p.n)
    case "range":
      return `${p.a}-${p.b}`
    case "time":
      return `${p.s}s`
    default:
      return p.kind
  }
}

/** The number of reps a set targets, used to prefill the workout logger. */
export function targetReps(r: Reps): number | undefined {
  const p = parseReps(r)
  if (p.kind === "reps") return p.n
  if (p.kind === "range") return p.b
  return undefined
}

type Linked = { superset?: true; rest: number }

/** Indices grouped into supersets: [[0], [1, 2], [3]]. */
export function groups(items: { superset?: true }[]): number[][] {
  const out: number[][] = []
  items.forEach((it, i) => {
    if (it.superset && out.length) out.at(-1)!.push(i)
    else out.push([i])
  })
  return out
}

/** "1", "2a", "2b", "3": the position of each item, with supersets lettered. */
export function itemLabels(items: { superset?: true }[]): string[] {
  const labels: string[] = []
  groups(items).forEach((g, n) => g.forEach((i, k) => (labels[i] = g.length > 1 ? `${n + 1}${"abcdefghij"[k] ?? k + 1}` : String(n + 1))))
  return labels
}

/** Rest after item i: none while a superset continues with the next exercise. */
export function restAfter(items: Linked[], i: number) {
  return items[i + 1]?.superset ? 0 : items[i].rest
}

/**
 * Swaps items i and i + dir. Superset links stay with the positions, so moving an exercise
 * reorders it inside its superset, or moves it into the neighbouring one.
 */
export function moveItem<T extends { superset?: true }>(items: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir
  if (j < 0 || j >= items.length) return items
  const out = [...items]
  ;[out[i], out[j]] = [withLink(items[j], items[i].superset), withLink(items[i], items[j].superset)]
  return out
}

/** Removes item i; if it led a superset, the next exercise leads it now. */
export function removeItem<T extends { superset?: true }>(items: T[], i: number): T[] {
  const out = items.filter((_, k) => k !== i)
  if (out[i] && !items[i].superset) out[i] = withLink(out[i], undefined)
  return out
}

export function withLink<T extends { superset?: true }>(it: T, superset: true | undefined): T {
  const { superset: _, ...rest } = it
  return (superset ? { ...rest, superset } : rest) as T
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayOf(date: Date) {
  return (date.getDay() + 6) % 7
}

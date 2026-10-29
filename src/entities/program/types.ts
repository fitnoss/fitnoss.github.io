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
}

export type ProgramDay = {
  /** Empty name means "Day N" in the viewer's language. */
  name: string
  items: ProgramItem[]
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

import { parseReps, restAfter, type ProgramDay, type ProgramItem } from "@/entities/program/types"

// Exercise codes come from data/id-map.json (they never change).
const it = (ex: number, sets: number, reps: string, rest: number): ProgramItem => ({ ex, sets, reps, rest })
/** The same, done back-to-back with the previous exercise. */
const ss = (ex: number, sets: number, reps: string, rest: number): ProgramItem => ({ ...it(ex, sets, reps, rest), superset: true })

// Weekdays: 0 = Monday … 6 = Sunday. Templates come scheduled, so "Start workout" works right away.

type Template = {
  id: string
  name: { ru: string; en: string }
  description: { ru: string; en: string }
  experience: { ru: string; en: string }
  /** Supports needed by the selected variations, beyond their main equipment. */
  extraEquipment?: string[]
  days: ProgramDay[]
}

export const TEMPLATES: Template[] = [
  {
    id: "home",
    name: { ru: "Дома без инвентаря", en: "Home, no equipment" },
    description: { ru: "Всё тело, 3 раза в неделю", en: "Full body, 3× a week" },
    experience: { ru: "Уверенные отжимания, включая отжимания уголком; знакомы с бёрпи", en: "Comfortable with push-ups, including pike push-ups, and familiar with burpees" },
    days: [
      {
        name: "@fullbody",
        weekdays: [0, 2, 4],
        items: [it(0, 3, "12", 60), it(2, 3, "20", 60), it(31, 3, "15", 60), it(879, 3, "8", 90), it(876, 3, "10", 90), it(3, 3, "45s", 60), it(878, 3, "30s", 60)],
      },
    ],
  },
  {
    id: "bars",
    name: { ru: "Турник и брусья", en: "Pull-up bar & dips" },
    description: { ru: "Верх тела и пресс на площадке", en: "Upper body & core outdoors" },
    experience: { ru: "Умеете подтягиваться и отжиматься на брусьях без помощи", en: "Able to perform unassisted pull-ups and dips" },
    days: [
      {
        name: "@upper",
        weekdays: [1, 3, 5],
        items: [it(1, 4, "max", 120), it(8, 4, "max", 120), it(42, 3, "12", 90), it(7, 3, "8", 90), it(29, 3, "12", 60), it(877, 2, "45s", 60)],
      },
    ],
  },
  {
    id: "ppl",
    extraEquipment: ["bench"],
    name: { ru: "Push / Pull / Legs в зале", en: "Push / Pull / Legs (gym)" },
    description: { ru: "Классический сплит на 3 дня", en: "Classic 3-day split" },
    experience: { ru: "Знакомы с приседанием, жимом и становой тягой со штангой", en: "Familiar with barbell squats, bench presses and deadlifts" },
    days: [
      { name: "@push", weekdays: [0], items: [it(5, 4, "6-8", 180), it(18, 3, "8-12", 120), it(19, 3, "8-12", 120), it(20, 3, "15", 60), ss(28, 3, "12", 60)] },
      { name: "@pull", weekdays: [2], items: [it(6, 3, "5", 180), it(1, 4, "8", 120), it(12, 3, "8-12", 120), it(36, 3, "15", 60), it(14, 3, "10", 60), it(16, 3, "12", 60)] },
      { name: "@legs", weekdays: [4], items: [it(4, 4, "6-8", 180), it(22, 3, "8-12", 120), it(23, 3, "12", 120), it(25, 3, "12", 90), it(26, 4, "15", 60)] },
    ],
  },
  {
    id: "dumbbells",
    extraEquipment: ["bench"],
    name: { ru: "Гантели дома", en: "Dumbbells at home" },
    description: { ru: "Верх / низ, 2–4 раза в неделю", en: "Upper / lower, 2–4× a week" },
    experience: { ru: "Знакомы с жимами, тягами и выпадами с гантелями", en: "Familiar with dumbbell presses, rows and lunges" },
    days: [
      { name: "@upper", weekdays: [0, 3], items: [it(17, 4, "10", 90), it(21, 4, "10", 90), it(19, 3, "10", 90), it(20, 3, "15", 60), it(15, 3, "12", 60), ss(16, 3, "12", 60)] },
      { name: "@lower", weekdays: [1, 4], items: [it(917, 4, "12", 90), it(43, 3, "10", 90), it(44, 3, "12", 90), it(31, 3, "15", 60), it(34, 3, "20", 60)] },
    ],
  },
]

/** A planning range, not a measured duration: 3–5 s/rep, 20–45 s for open-ended sets. */
export function templateDuration(days: ProgramDay[]) {
  if (!days.length) return { min: 0, max: 0 }
  const ranges = days.map((day) => {
    let min = 0, max = 0
    day.items.forEach((item, i) => {
      const reps = parseReps(item.reps)
      const low = reps.kind === "time" ? reps.s : reps.kind === "reps" ? reps.n * 3 : reps.kind === "range" ? reps.a * 3 : 20
      const high = reps.kind === "time" ? reps.s : reps.kind === "reps" ? reps.n * 5 : reps.kind === "range" ? reps.b * 5 : 45
      const rest = restAfter(day.items, i) * Math.max(0, item.sets - (i === day.items.length - 1 ? 1 : 0))
      min += low * item.sets + rest
      max += high * item.sets + rest
    })
    return { min, max }
  })
  return {
    min: Math.max(5, Math.floor(Math.min(...ranges.map((r) => r.min)) / 300) * 5),
    max: Math.max(5, Math.ceil(Math.max(...ranges.map((r) => r.max), 0) / 300) * 5),
  }
}

import type { ProgramDay, ProgramItem } from "@/entities/program/types"

// Exercise codes come from data/id-map.json (they never change).
const it = (ex: number, sets: number, reps: string, rest: number): ProgramItem => ({ ex, sets, reps, rest })

type Template = {
  id: string
  name: { ru: string; en: string }
  description: { ru: string; en: string }
  days: ProgramDay[]
}

export const TEMPLATES: Template[] = [
  {
    id: "home",
    name: { ru: "Дома без инвентаря", en: "Home, no equipment" },
    description: { ru: "Всё тело, 3 раза в неделю", en: "Full body, 3× a week" },
    days: [
      {
        name: "@fullbody",
        items: [it(0, 3, "12", 60), it(2, 3, "20", 60), it(31, 3, "15", 60), it(879, 3, "8", 90), it(876, 3, "10", 90), it(3, 3, "45s", 60), it(878, 3, "30s", 60)],
      },
    ],
  },
  {
    id: "bars",
    name: { ru: "Турник и брусья", en: "Pull-up bar & dips" },
    description: { ru: "Верх тела и пресс на площадке", en: "Upper body & core outdoors" },
    days: [
      {
        name: "@upper",
        items: [it(1, 4, "max", 120), it(8, 4, "max", 120), it(42, 3, "12", 90), it(7, 3, "8", 90), it(29, 3, "12", 60), it(877, 2, "45s", 60)],
      },
    ],
  },
  {
    id: "ppl",
    name: { ru: "Push / Pull / Legs в зале", en: "Push / Pull / Legs (gym)" },
    description: { ru: "Классический сплит на 3 дня", en: "Classic 3-day split" },
    days: [
      { name: "@push", items: [it(5, 4, "6-8", 180), it(18, 3, "8-12", 120), it(19, 3, "8-12", 120), it(20, 3, "15", 60), it(28, 3, "12", 60)] },
      { name: "@pull", items: [it(6, 3, "5", 180), it(1, 4, "8", 120), it(12, 3, "8-12", 120), it(36, 3, "15", 60), it(14, 3, "10", 60), it(16, 3, "12", 60)] },
      { name: "@legs", items: [it(4, 4, "6-8", 180), it(22, 3, "8-12", 120), it(23, 3, "12", 120), it(25, 3, "12", 90), it(26, 4, "15", 60)] },
    ],
  },
  {
    id: "dumbbells",
    name: { ru: "Гантели дома", en: "Dumbbells at home" },
    description: { ru: "Верх / низ, 2–4 раза в неделю", en: "Upper / lower, 2–4× a week" },
    days: [
      { name: "@upper", items: [it(17, 4, "10", 90), it(21, 4, "10", 90), it(19, 3, "10", 90), it(20, 3, "15", 60), it(15, 3, "12", 60), it(16, 3, "12", 60)] },
      { name: "@lower", items: [it(32, 4, "12", 90), it(43, 3, "10", 90), it(44, 3, "12", 90), it(31, 3, "15", 60), it(34, 3, "20", 60)] },
    ],
  },
]

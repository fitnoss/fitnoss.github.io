import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import type { Program } from "@/entities/program/types"
import { useSessionStore } from "@/entities/session/store"
import { dayName } from "@/features/programs/format"
import { primeAudio } from "./RestTimerBar"

/** Starts day `index` of a program (asking before replacing a running workout) and opens it. */
export function useStartDay() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (program: Program, index: number) => {
    const { active, start } = useSessionStore.getState()
    if (active && !confirm(t("workout.replaceActive"))) return
    primeAudio()
    const day = program.days[index]
    start({ title: `${program.name || t("programs.untitled")} · ${dayName(t, day.name, index)}`, programId: program.id, day: index, plan: day })
    navigate("/workout")
  }
}

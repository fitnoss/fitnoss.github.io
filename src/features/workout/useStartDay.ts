import { confirmAction } from "@/shared/ui/confirm"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import type { Program } from "@/entities/program/types"
import type { ScheduledOccurrence } from "@/entities/program/schedule"
import { useSessionStore } from "@/entities/session/store"
import { dayName } from "@/features/programs/format"
import { primeAudio } from "./RestTimerBar"

/** Starts day `index` of a program (asking before replacing a running workout) and opens it. */
export function useStartDay() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return async (program: Program, index: number, occurrence?: ScheduledOccurrence) => {
    const { active, start } = useSessionStore.getState()
    if (occurrence && active?.occurrence?.entryId === occurrence.entryId && active.occurrence.date === occurrence.date) {
      navigate("/workout")
      return
    }
    if (active && !await confirmAction(t("workout.replaceActive"))) return
    if (useSessionStore.getState().active?.id !== active?.id) return
    primeAudio()
    const day = program.days[index]
    const name = dayName(t, day.name, index)
    const title = program.name && program.name !== name ? `${program.name} · ${name}` : name
    start({ title, programId: program.id, workoutId: day.id, occurrence, plan: day })
    navigate("/workout")
  }
}

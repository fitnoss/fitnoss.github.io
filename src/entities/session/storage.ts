import type { PersistStorage, StorageValue } from "zustand/middleware"
import type { RestTimer, Session } from "./store"

export type SavedSessions = { active?: Session; rest?: RestTimer; history: Session[] }
export const HISTORY_KEY = "fitnoss:history"

/** Persist the archive only when its reference changes, independently of live set entry. */
export function sessionStorage(getStorage: () => Storage = () => localStorage): PersistStorage<SavedSessions> {
  let savedHistory: Session[] | undefined
  let savedActive: Session | undefined
  let savedRest: RestTimer | undefined
  let hasWorkout = false
  return {
    getItem(name) {
      const storage = getStorage()
      const workoutJson = storage.getItem(name)
      const historyJson = storage.getItem(HISTORY_KEY)
      if (!workoutJson && !historyJson) return null
      const workout = workoutJson ? JSON.parse(workoutJson) as StorageValue<Omit<SavedSessions, "history">> : undefined
      const archive = historyJson ? JSON.parse(historyJson) as StorageValue<Pick<SavedSessions, "history">> : undefined
      savedHistory = archive?.state.history ?? []
      savedActive = workout?.state.active
      savedRest = workout?.state.rest
      hasWorkout = !!workoutJson
      return {
        state: { history: savedHistory, active: savedActive, rest: savedRest },
        version: workout?.version ?? archive?.version,
      }
    },
    setItem(name, { state, version }) {
      const storage = getStorage()
      // Archive first: finishing must save results before removing the active snapshot.
      if (state.history !== savedHistory) {
        storage.setItem(HISTORY_KEY, JSON.stringify({ state: { history: state.history }, version }))
        savedHistory = state.history
      }
      if (!hasWorkout || state.active !== savedActive || state.rest !== savedRest) {
        storage.setItem(name, JSON.stringify({ state: { active: state.active, rest: state.rest }, version }))
        savedActive = state.active
        savedRest = state.rest
        hasWorkout = true
      }
    },
    removeItem(name) {
      const storage = getStorage()
      storage.removeItem(name)
      storage.removeItem(HISTORY_KEY)
      savedHistory = undefined
      savedActive = undefined
      savedRest = undefined
      hasWorkout = false
    },
  }
}

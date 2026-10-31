import { lazy } from "react"
import { HashRouter, Navigate, Route, Routes } from "react-router"
import { ConfirmationDialog } from "@/shared/ui/confirm"
import { Toaster } from "@/shared/ui/toast"
import { Layout } from "./Layout"
import { ProgramsPage } from "@/features/programs/ProgramsPage"
import { UpdatePrompt } from "@/features/settings/UpdatePrompt"

const CatalogPage = lazy(() => import("@/features/catalog/CatalogPage").then((m) => ({ default: m.CatalogPage })))
const ExercisePage = lazy(() => import("@/features/catalog/ExercisePage").then((m) => ({ default: m.ExercisePage })))
const ProgramEditorPage = lazy(() => import("@/features/programs/ProgramEditorPage").then((m) => ({ default: m.ProgramEditorPage })))
const SharePage = lazy(() => import("@/features/share/SharePage").then((m) => ({ default: m.SharePage })))
const WorkoutPage = lazy(() => import("@/features/workout/WorkoutPage").then((m) => ({ default: m.WorkoutPage })))
const JournalPage = lazy(() => import("@/features/journal/JournalPage").then((m) => ({ default: m.JournalPage })))
const SessionPage = lazy(() => import("@/features/journal/SessionPage").then((m) => ({ default: m.SessionPage })))
const MorePage = lazy(() => import("@/features/settings/MorePage").then((m) => ({ default: m.MorePage })))
const AboutPage = lazy(() => import("@/features/settings/AboutPage").then((m) => ({ default: m.AboutPage })))
const ExerciseProgressPage = lazy(() =>
  import("@/features/journal/ExerciseProgressPage").then((m) => ({ default: m.ExerciseProgressPage })),
)
const CalculatorsPage = lazy(() => import("@/features/calculators/CalculatorsPage").then((m) => ({ default: m.CalculatorsPage })))
const VideoReviewPage = import.meta.env.DEV ? lazy(() => import("@/features/dev/VideoReviewPage")) : null

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ProgramsPage />} />
          <Route path="exercises" element={<CatalogPage />} />
          <Route path="ex/:slug" element={<ExercisePage />} />
          <Route path="programs" element={<Navigate to="/" replace />} />
          <Route path="programs/:id" element={<ProgramEditorPage />} />
          <Route path="s/:payload" element={<SharePage />} />
          {/* Short share links: https://fitnoss.github.io/#<payload> */}
          <Route path=":payload" element={<SharePage />} />
          <Route path="workout" element={<WorkoutPage />} />
          <Route path="progress" element={<JournalPage />} />
          <Route path="progress/session/:id" element={<SessionPage />} />
          <Route path="progress/ex/:code" element={<ExerciseProgressPage />} />
          <Route path="more" element={<MorePage />} />
          <Route path="more/calc" element={<CalculatorsPage />} />
          <Route path="more/about" element={<AboutPage />} />
          {VideoReviewPage && <Route path="dev/videos" element={<VideoReviewPage />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <ConfirmationDialog />
      <Toaster />
      <UpdatePrompt />
    </HashRouter>
  )
}

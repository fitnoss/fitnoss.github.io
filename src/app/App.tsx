import { lazy } from "react"
import { HashRouter, Navigate, Route, Routes } from "react-router"
import { ConfirmationDialog } from "@/shared/ui/confirm"
import { Toaster } from "@/shared/ui/toast"
import { Layout } from "./Layout"
import { CatalogPage } from "@/features/catalog/CatalogPage"
import { ExercisePage } from "@/features/catalog/ExercisePage"
import { ProgramsPage } from "@/features/programs/ProgramsPage"
import { ProgramEditorPage } from "@/features/programs/ProgramEditorPage"
import { SharePage } from "@/features/share/SharePage"
import { WorkoutPage } from "@/features/workout/WorkoutPage"
import { JournalPage } from "@/features/journal/JournalPage"
import { SessionPage } from "@/features/journal/SessionPage"
import { MorePage } from "@/features/settings/MorePage"
import { AboutPage } from "@/features/settings/AboutPage"
import { UpdatePrompt } from "@/features/settings/UpdatePrompt"

// Heavier pages (charts) load on demand.
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

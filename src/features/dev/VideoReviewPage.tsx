/**
 * Dev-only page (npm run dev → #/dev/videos) to review YouTube candidates found by
 * `npm run videos:find`. Approved choices are downloaded as videos.json; put that file
 * into data/videos.json and run `npm run data`.
 */
import { useEffect, useMemo, useState } from "react"
import { Check, Download, X } from "lucide-react"
import { PageHeader } from "@/shared/components/PageHeader"
import { ExerciseImage } from "@/shared/components/ExerciseImage"
import { Button } from "@/shared/ui/button"
import { Panel } from "@/shared/ui/panel"
import { Input } from "@/shared/ui/field"
import { useExercises } from "@/entities/exercise/store"
import type { Video } from "@/entities/exercise/types"

type Candidate = { id: string; title: string; channel: string; duration?: number }

const STORAGE = "fitnoss:dev:videos"

export default function VideoReviewPage() {
  const { list, text, videos } = useExercises()
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({})
  const [chosen, setChosen] = useState<Record<string, Video | null>>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE) ?? "{}")
    } catch {
      return {}
    }
  })
  const [showDone, setShowDone] = useState(false)

  useEffect(() => {
    fetch("/__dev/videos.candidates.json")
      .then((r) => (r.ok ? r.json() : {}))
      .then(setCandidates)
      .catch(() => {})
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(chosen))
  }, [chosen])

  const merged = { ...videos, ...chosen }
  const queue = useMemo(
    () => list.filter((ex) => candidates[ex.s]?.length && (showDone || !(ex.s in merged))).slice(0, 30),
    [list, candidates, showDone, merged], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const download = () => {
    const out = Object.fromEntries(Object.entries(merged).filter(([, v]) => v)) as Record<string, Video>
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2) + "\n"], { type: "application/json" }))
    a.download = "videos.json"
    a.click()
  }

  return (
    <>
      <PageHeader
        title="Video review"
        back="/more"
        actions={
          <Button variant="primary" size="sm" onClick={download}>
            <Download className="size-4" /> videos.json
          </Button>
        }
      />
      <div className="space-y-4 px-4 pb-8">
        <p className="text-muted text-xs">
          Candidates: {Object.keys(candidates).length} · approved: {Object.values(merged).filter(Boolean).length} ·{" "}
          <button className="underline" onClick={() => setShowDone((v) => !v)}>
            {showDone ? "hide reviewed" : "show reviewed"}
          </button>
        </p>
        {Object.keys(candidates).length === 0 && (
          <p className="text-sm">
            No candidates. Run <code>npm run videos:find</code> first.
          </p>
        )}
        {queue.map((ex) => (
          <Panel key={ex.c} className="space-y-3 p-3">
            <div className="flex items-center gap-3">
              <ExerciseImage ex={ex} alt="" className="hairline size-20 shrink-0 rounded-[10px]" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{text(ex).name}</div>
                <div className="text-muted text-xs">{ex.s}</div>
              </div>
              <Button size="icon" variant="ghost" title="No good video" onClick={() => setChosen((c) => ({ ...c, [ex.s]: null }))}>
                <X className="size-5" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {candidates[ex.s].map((cand) => {
                const picked = merged[ex.s]?.yt === cand.id
                return (
                  <div key={cand.id} className="space-y-1">
                    <iframe
                      className="aspect-video w-full rounded-md"
                      src={`https://www.youtube-nocookie.com/embed/${cand.id}`}
                      loading="lazy"
                      allowFullScreen
                    />
                    <div className="line-clamp-2 text-xs">{cand.title}</div>
                    <div className="text-muted text-[11px]">
                      {cand.channel}
                      {cand.duration ? ` · ${Math.round(cand.duration)}s` : ""}
                    </div>
                    <div className="flex gap-1">
                      <Input
                        placeholder="start s"
                        className="h-8 text-base"
                        inputMode="numeric"
                        defaultValue={picked ? (merged[ex.s]?.start ?? "") : ""}
                        onBlur={(e) =>
                          picked && setChosen((c) => ({ ...c, [ex.s]: { ...merged[ex.s]!, start: Number(e.target.value) || undefined } }))
                        }
                      />
                      <Button
                        size="sm"
                        variant={picked ? "primary" : "default"}
                        onClick={() => setChosen((c) => ({ ...c, [ex.s]: { yt: cand.id } }))}
                      >
                        <Check className="size-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>
        ))}
      </div>
    </>
  )
}

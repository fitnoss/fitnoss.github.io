import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ExternalLink, Play, SquarePlay } from "lucide-react"
import { buttonClass } from "@/shared/ui/button"
import type { Video } from "@/entities/exercise/types"

/**
 * YouTube facade: shows the thumbnail and loads the iframe only after a tap,
 * so the page stays light and nothing is requested from YouTube until then.
 */
export function VideoPlayer({ video, lang, title }: { video: Video; lang: string; title: string }) {
  const { t } = useTranslation()
  const [playing, setPlaying] = useState(false)
  const id = lang === "ru" && video.ru ? video.ru : video.yt
  const params = new URLSearchParams({ autoplay: "1", playsinline: "1", rel: "0", modestbranding: "1" })
  if (video.start) params.set("start", String(video.start))
  if (video.end) params.set("end", String(video.end))

  return (
    <div className="hairline rounded-panel relative aspect-video overflow-hidden bg-black">
      {playing ? (
        <iframe
          className="absolute inset-0 size-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?${params}`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <button type="button" className="group absolute inset-0" onClick={() => setPlaying(true)} aria-label={t("video.play")}>
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            className="size-full object-cover opacity-85 transition-opacity group-hover:opacity-100"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg backdrop-blur transition-transform group-hover:scale-105">
              <Play className="ml-1 size-7 fill-current" />
            </span>
          </span>
        </button>
      )}
    </div>
  )
}

export function YoutubeSearchButton({ query }: { query: string }) {
  const { t } = useTranslation()
  return (
    <a
      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${query} ${t("video.searchSuffix")}`)}`}
      target="_blank"
      rel="noreferrer"
      className={buttonClass("default", "md", "w-full")}
    >
      <SquarePlay className="text-[#ff0033]" />
      {t("video.search")}
      <span className="sr-only">{t("video.externalSearch")}</span><ExternalLink className="size-4" aria-hidden="true" />
    </a>
  )
}

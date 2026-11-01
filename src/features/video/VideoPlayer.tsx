import { useState, type ReactNode } from "react"
import { Trans, useTranslation } from "react-i18next"
import { ExternalLink, Play } from "lucide-react"
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

function YoutubeBrand({ children }: { children?: ReactNode }) {
  return <span className="inline-flex items-center gap-1">
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" focusable="false">
      <rect x="1" y="4" width="22" height="16" rx="4.5" fill="#ff0033" />
      <path d="m10 8 6 4-6 4Z" fill="#fff" />
    </svg>
    {children}
  </span>
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
      <Trans t={t} i18nKey="video.search" components={{ youtube: <YoutubeBrand /> }} />
      <span className="sr-only">{t("video.externalSearch")}</span><ExternalLink className="size-4" aria-hidden="true" />
    </a>
  )
}

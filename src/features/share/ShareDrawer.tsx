import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, Copy, FileText, Share } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Sheet } from "@/shared/ui/sheet"
import { useExercises } from "@/entities/exercise/store"
import type { ProgramData } from "@/entities/program/types"
import { programToText } from "@/features/programs/format"
import { encodeProgram } from "./codec/fitpack"
import { QrCode } from "./QrCode"

export function shareUrl(p: ProgramData) {
  return `${location.origin}${import.meta.env.BASE_URL}#${encodeProgram(p)}`
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

type Props = { program: ProgramData; open: boolean; onOpenChange: (o: boolean) => void }

export function ShareDrawer({ program, open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const { byCode, text } = useExercises()
  const [manual, setManual] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  useEffect(() => { if (open) { setManual(null); setMessage(null); setCopied(false) } }, [open])
  const url = useMemo(() => (open ? shareUrl(program) : ""), [open, program])
  const plain = () => programToText(t, program, (c) => text(byCode.get(c)).name, url)

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("share.title")}
      bodyClassName="space-y-3"
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="primary"
            onClick={async () => {
              if (await copy(url)) {
                setManual(null)
                setMessage(t("share.copied"))
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              } else { setManual(url); setMessage(t("share.copyFailed")) }
            }}
          >
            {copied ? <Check /> : <Copy />}
            {copied ? t("share.copied") : t("share.copyLink")}
          </Button>
          <Button
            onClick={async () => {
              const value = plain()
              if (await copy(value)) { setManual(null); setMessage(t("share.textCopied")) }
              else { setManual(value); setMessage(t("share.copyFailed")) }
            }}
          >
            <FileText /> {t("share.copyText")}
          </Button>
          {"share" in navigator && (
            <Button
              variant="ghost"
              className="col-span-2"
              onClick={() => navigator.share({ title: program.name || "fitnoss", text: plain() }).catch((error: unknown) => {
                if (error instanceof DOMException && error.name === "AbortError") return
                setManual(plain())
                setMessage(t("share.shareFailed"))
              })}
            >
              <Share /> {t("share.native")}
            </Button>
          )}
        </div>
      }
    >
      <p className="text-muted text-sm">{t("share.copyHint")}</p>
      {message && <p role={manual ? "alert" : "status"} className={manual ? "text-danger text-sm" : "text-muted text-sm"}>{message}</p>}
      {manual && <label className="block text-sm">{t("share.manualCopy")}<textarea readOnly value={manual} onFocus={(e) => e.target.select()} className="bg-surface mt-2 min-h-28 w-full rounded-xl p-3 text-base" /></label>}
      <div className="mx-auto flex size-56 items-center justify-center overflow-hidden rounded-2xl bg-white p-1">
        {url && <QrCode value={url} className="size-full" />}
      </div>
      <div className="bg-surface hairline rounded-control p-3 font-mono text-[12.5px] leading-relaxed font-medium break-all select-all">{url}</div>
    </Sheet>
  )
}

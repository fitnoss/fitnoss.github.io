import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, Copy, FileText, Share } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Sheet } from "@/shared/ui/sheet"
import { toast } from "@/shared/ui/toast"
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
  const [copied, setCopied] = useState(false)
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
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }
            }}
          >
            {copied ? <Check /> : <Copy />}
            {copied ? t("share.copied") : t("share.copyLink")}
          </Button>
          <Button
            onClick={async () => {
              if (await copy(plain())) toast.success(t("share.textCopied"))
            }}
          >
            <FileText /> {t("share.copyText")}
          </Button>
          {"share" in navigator && (
            <Button
              variant="ghost"
              className="col-span-2"
              onClick={() => navigator.share({ title: program.name || "fitnoss", text: plain() }).catch(() => {})}
            >
              <Share /> {t("share.native")}
            </Button>
          )}
        </div>
      }
    >
      <div className="mx-auto flex size-56 items-center justify-center overflow-hidden rounded-2xl bg-white p-1">
        {url && <QrCode value={url} className="size-full" />}
      </div>
      <div className="bg-surface hairline rounded-control p-3 font-mono text-[12.5px] leading-relaxed font-medium break-all select-all">{url}</div>
    </Sheet>
  )
}

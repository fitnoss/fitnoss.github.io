import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ExternalLink, MessageSquareWarning } from "lucide-react"
import { Button, buttonClass } from "@/shared/ui/button"
import { Sheet } from "@/shared/ui/sheet"

/** Provenance is separate from editorial review; a manual translation is not a technique review. */
export function TechniqueFeedback({ name, slug, machine }: { name: string; slug: string; machine?: boolean }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const issue = new URLSearchParams({
    title: `${t("exercise.reportIssue")}: ${name}`,
    body: `${name}\n${slug}\n\n${message.trim()}`,
  })
  return <div className="space-y-2">
    <p className="text-muted text-sm">{t(machine ? "exercise.translationMachine" : "exercise.catalogText")} · {t("exercise.reviewNotRecorded")}</p>
    <Button size="sm" variant="ghost" onClick={() => setOpen(true)}><MessageSquareWarning className="size-4" />{t("exercise.reportIssue")}</Button>
    <Sheet open={open} onOpenChange={setOpen} title={t("exercise.reportIssue")} footer={
      message.trim() ? <a href={`https://github.com/fitnoss/fitnoss.github.io/issues/new?${issue}`} target="_blank" rel="noreferrer" className={buttonClass("primary", "lg", "w-full")}>
        {t("exercise.openIssue")} <ExternalLink className="size-4" />
      </a> : <Button variant="primary" size="lg" className="w-full" disabled>{t("exercise.openIssue")}</Button>
    }>
      <p className="mb-3 font-medium">{name}</p>
      <label className="block space-y-2 text-sm">
        <span>{t("exercise.issueDescription")}</span>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} rows={5}
          className="bg-surface hairline rounded-control w-full resize-y p-3 text-base" />
      </label>
      <p className="text-muted mt-3 text-sm">{t("exercise.issueHint")}</p>
    </Sheet>
  </div>
}

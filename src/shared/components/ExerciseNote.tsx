import { useTranslation } from "react-i18next"

export function ExerciseNote({ note }: { note?: string }) {
  const { t } = useTranslation()
  if (!note) return null
  if (note.length <= 100 && note.split("\n").length <= 2) {
    return <p className="bg-page rounded-control px-3 py-2 text-sm whitespace-pre-wrap">{note}</p>
  }
  return <details className="bg-page rounded-control px-3 py-2 text-sm">
    <summary className="min-h-11 cursor-pointer py-2">{t("scheme.note")}: {note.slice(0, 80)}…</summary>
    <p className="pt-2 whitespace-pre-wrap">{note}</p>
  </details>
}

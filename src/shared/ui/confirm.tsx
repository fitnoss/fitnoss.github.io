import { useSyncExternalStore } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "./button"
import { Sheet } from "./sheet"

type Request = { message: string; resolve: (value: boolean) => void }
let requests: Request[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

/** Shared confirmation for destructive actions, including actions inside another sheet. */
export function confirmAction(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    requests = [...requests, { message, resolve }]
    emit()
  })
}

export function ConfirmationDialog() {
  const { t } = useTranslation()
  const request = useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    () => requests[0],
  )
  const answer = (value: boolean) => {
    requests = requests.slice(1)
    request?.resolve(value)
    emit()
  }
  return (
    <Sheet open={!!request} onOpenChange={(open) => !open && answer(false)} title={t("common.confirmTitle")}
      footer={<div className="flex gap-2">
        <Button onClick={() => answer(false)}>{t("common.cancel")}</Button>
        <Button variant="primary" onClick={() => answer(true)}>{t("common.confirm")}</Button>
      </div>}>
      <p>{request?.message}</p>
    </Sheet>
  )
}

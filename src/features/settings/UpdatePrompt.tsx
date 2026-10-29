import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useRegisterSW } from "virtual:pwa-register/react"
import { toast } from "@/shared/ui/toast"

export function UpdatePrompt() {
  const { t } = useTranslation()
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!needRefresh) return
    toast(t("pwa.update"), {
      duration: Infinity,
      action: { label: t("pwa.reload"), onClick: () => updateServiceWorker(true) },
    })
  }, [needRefresh, t, updateServiceWorker])

  return null
}

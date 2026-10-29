import { useTranslation } from "react-i18next"
import { ExternalLink } from "lucide-react"
import { PageHeader } from "@/shared/components/PageHeader"
import { Logo } from "@/shared/components/Logo"
import { Section } from "@/shared/ui/panel"
import { buttonClass } from "@/shared/ui/button"

const REPO = "https://github.com/fitcraft/fitcraft.github.io"
const link = "text-fg underline underline-offset-4 hover:opacity-70"

export function AboutPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t("about.title")} back="/more" />
      <div className="space-y-8 px-4 pb-10 text-[15px] leading-relaxed">
        <div className="space-y-3 pt-2">
          <Logo className="h-24 w-28" />
          <h2 className="text-[26px] font-bold tracking-tight">fitcraft</h2>
          <p>{t("about.text")}</p>
          <p className="text-muted">{t("about.privacy")}</p>
          <a href={REPO} target="_blank" rel="noreferrer" className={buttonClass("default", "md", "mt-1")}>
            <ExternalLink /> GitHub
          </a>
        </div>
        <Section title={t("about.credits")}>
          <div className="text-muted space-y-2">
            <p>
              {t("about.exerciseData")}{" "}
              <a className={link} href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noreferrer">
                free-exercise-db
              </a>{" "}
              (Unlicense).
            </p>
            <p>{t("about.videos")}</p>
            <p>
              {t("about.license")}{" "}
              <a className={link} href={`${REPO}/blob/main/THIRD_PARTY_NOTICES.md`} target="_blank" rel="noreferrer">
                THIRD_PARTY_NOTICES
              </a>
            </p>
          </div>
        </Section>
        <Section title={t("about.disclaimerTitle")}>
          <p className="text-muted">{t("about.disclaimer")}</p>
        </Section>
      </div>
    </>
  )
}

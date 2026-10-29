import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Calculator, ChevronRight, CloudDownload, Download, Info, Upload, Video } from "lucide-react"
import { PageHeader } from "@/shared/components/PageHeader"
import { RestInput } from "@/shared/components/RestInput"
import { Button } from "@/shared/ui/button"
import { Panel, Section } from "@/shared/ui/panel"
import { Segmented } from "@/shared/ui/segmented"
import { Switch } from "@/shared/ui/switch"
import { toast } from "@/shared/ui/toast"
import { languages, setLanguage } from "@/shared/i18n"
import { useSettings, type Theme } from "@/shared/storage/settings"
import { AccentPicker } from "./AccentPicker"
import { downloadAllImages, exportBackup, importBackup } from "./backup"
import { useTranslationCoverage } from "./coverage"

/**
 * Flags next to each language in the picker; English is spoken on both sides of the Atlantic.
 * Native emoji, so each device draws its own (Windows gets Twemoji's, see main.tsx).
 */
const FLAGS: Record<string, string[]> = { ru: ["🇷🇺"], en: ["🇬🇧", "🇺🇸"] }

function Row({ icon: Icon, children, to }: { icon: typeof Info; children: React.ReactNode; to: string }) {
  return (
    <Link to={to} className="hover:bg-surface-hover flex h-[52px] items-center gap-3 px-4">
      <Icon className="text-muted size-5" />
      <span className="flex-1 text-[15px] font-medium">{children}</span>
      <ChevronRight className="text-muted size-4" />
    </Link>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex h-[52px] cursor-pointer items-center justify-between gap-3 px-4">
      <span className="text-[15px] font-medium">{label}</span>
      <Switch checked={checked} onChange={onChange} />
    </label>
  )
}

export function MorePage() {
  const { t, i18n } = useTranslation()
  const settings = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dl, setDl] = useState<{ done: number; total: number } | null>(null)
  const coverage = useTranslationCoverage()

  return (
    <>
      <PageHeader title={t("more.title")} />
      <div className="space-y-8 px-4 pb-10">
        <Panel className="divide-y overflow-hidden">
          <Row icon={Calculator} to="/more/calc">
            {t("calc.title")}
          </Row>
          <Row icon={Info} to="/more/about">
            {t("about.title")}
          </Row>
          {import.meta.env.DEV && (
            <Row icon={Video} to="/dev/videos">
              Video review (dev)
            </Row>
          )}
        </Panel>

        <Section title={t("more.theme")}>
          <Segmented
            value={settings.theme}
            onChange={(v: Theme) => settings.setTheme(v)}
            options={(["system", "light", "dark"] as const).map((th) => ({ value: th, label: t(`more.themes.${th}`) }))}
          />
          <AccentPicker />
        </Section>

        <Section title={t("more.workout")} hint={t("more.defaultRestHint")}>
          <Panel className="divide-y overflow-hidden">
            <div className="flex min-h-[60px] flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2.5 pr-2.5 pl-4">
              <span className="text-[15px] font-medium">{t("more.defaultRest")}</span>
              <RestInput value={settings.defaultRest} onChange={(defaultRest) => settings.set({ defaultRest })} />
            </div>
            <Toggle label={t("more.sound")} checked={settings.sound} onChange={(sound) => settings.set({ sound })} />
            <Toggle label={t("more.vibration")} checked={settings.vibration} onChange={(vibration) => settings.set({ vibration })} />
          </Panel>
        </Section>

        <Section
          title={t("more.language")}
          hint={
            <a
              href="https://github.com/fitnoss/fitnoss.github.io/blob/main/CONTRIBUTING.md#translations"
              target="_blank"
              rel="noreferrer"
              className="hover:text-fg underline underline-offset-4"
            >
              {t("more.helpTranslate")}
            </a>
          }
        >
          <Segmented
            value={i18n.resolvedLanguage ?? "en"}
            onChange={setLanguage}
            options={languages.map((l) => ({
              value: l.code,
              label: (
                <span className="inline-flex items-center gap-1.5">
                  {FLAGS[l.code] && (
                    <span aria-hidden className="inline-flex gap-1">
                      {FLAGS[l.code].map((f) => (
                        <span key={f}>{f}</span>
                      ))}
                    </span>
                  )}
                  {l.nativeName}
                  {coverage[l.code] !== undefined && coverage[l.code] < 100 && <span className="text-[11px] opacity-60">{coverage[l.code]}%</span>}
                </span>
              ),
            }))}
          />
        </Section>

        <Section title={t("more.data")} hint={t("more.dataHint")}>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={exportBackup}>
              <Download /> {t("more.export")}
            </Button>
            <Button onClick={() => fileRef.current?.click()}>
              <Upload /> {t("more.import")}
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ""
              if (!file) return
              try {
                const r = await importBackup(file)
                toast.success(t("more.imported", r))
              } catch {
                toast.error(t("more.importFailed"))
              }
            }}
          />
        </Section>

        <Section title={t("more.offline")} hint={t("more.offlineHint")}>
          {dl ? (
            <Panel className="space-y-2 p-4">
              <div className="bg-page h-1.5 overflow-hidden rounded-full">
                <div className="bg-accent h-full transition-[width]" style={{ width: `${(dl.done / Math.max(1, dl.total)) * 100}%` }} />
              </div>
              <p className="text-muted text-xs tabular-nums">
                {dl.done} / {dl.total}
              </p>
            </Panel>
          ) : (
            <Button
              className="w-full"
              disabled={!("caches" in window)}
              onClick={async () => {
                setDl({ done: 0, total: 0 })
                await downloadAllImages((done, total) => setDl({ done, total }))
                toast.success(t("more.offlineDone"))
                setDl(null)
              }}
            >
              <CloudDownload /> {t("more.offlineDownload")}
            </Button>
          )}
        </Section>
      </div>
    </>
  )
}

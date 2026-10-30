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
import { useExercises } from "@/entities/exercise/store"
import { useSettings, type Theme } from "@/shared/storage/settings"
import { AccentPicker } from "./AccentPicker"
import { Sheet } from "@/shared/ui/sheet"
import { backupSummary, downloadAllImages, exportBackup, readBackup, mergeBackup, LAST_EXPORT, OFFLINE_STATUS, type Backup } from "./backup"
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

export function SettingsPage({ section = "settings" }: { section?: "settings" | "data" | "offline" }) {
  const { t, i18n } = useTranslation()
  const settings = useSettings()
  const { ready } = useExercises()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dl, setDl] = useState<{ done: number; total: number } | null>(null)
  const [pendingBackup, setPendingBackup] = useState<Backup | null>(null)
  const [lastExport, setLastExport] = useState(() => localStorage.getItem(LAST_EXPORT))
  const [offlineResult, setOfflineResult] = useState<{ downloaded: number; failed: number; total: number; at: string } | null>(() => {
    try { return JSON.parse(localStorage.getItem(OFFLINE_STATUS) ?? "null") } catch { return null }
  })
  const coverage = useTranslationCoverage()

  return (
    <>
      <PageHeader title={t(section === "settings" ? "more.settings" : `more.${section}`)} back="/more" />
      <div className="space-y-8 px-4 pb-10">


        {section === "settings" && <>
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

        </>}
        {section === "data" && <Section title={t("more.data")} hint={t("more.dataHint")}>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => { exportBackup(); setLastExport(localStorage.getItem(LAST_EXPORT)) }}>
              <Download /> {t("more.export")}
            </Button>
            <Button onClick={() => fileRef.current?.click()}>
              <Upload /> {t("more.import")}
            </Button>
          </div>
          <p className="text-muted text-xs">{t("more.backupContents")}</p>
          <p className="text-muted text-xs">{lastExport ? t("more.lastExport", { date: new Date(lastExport).toLocaleString(i18n.language) }) : t("more.neverExported")}</p>
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
                setPendingBackup(await readBackup(file))
              } catch {
                toast.error(t("more.importFailed"))
              }
            }}
          />
        </Section>}

        {section === "offline" && <Section title={t("more.offline")} hint={t("more.offlineHint")}>
          {offlineResult && <p role="status" className="text-sm">{t("more.offlineStatus", offlineResult)} · {new Date(offlineResult.at).toLocaleDateString(i18n.language)}</p>}
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
              disabled={!ready || !("caches" in window)}
              onClick={async () => {
                setDl({ done: 0, total: 0 })
                try {
                  const result = await downloadAllImages((done, total) => setDl({ done, total }))
                  setOfflineResult(result)
                  if (result.failed) toast.error(t("more.offlinePartial", result))
                  else toast.success(t("more.offlineDone"))
                } catch { toast.error(t("more.offlineFailed")) }
                finally { setDl(null) }
              }}
            >
              <CloudDownload /> {t(offlineResult?.failed ? "more.offlineRetry" : "more.offlineDownload")}
            </Button>
          )}
        </Section>}
      </div>
      <Sheet open={!!pendingBackup} onOpenChange={(o) => !o && setPendingBackup(null)} title={t("more.import")} footer={
        <div className="flex gap-2"><Button onClick={() => setPendingBackup(null)}>{t("common.cancel")}</Button><Button variant="primary" onClick={() => {
          if (!pendingBackup) return
          const result = mergeBackup(pendingBackup)
          setPendingBackup(null)
          toast.success(t("more.imported", result))
        }}>{t("more.merge")}</Button></div>
      }>{pendingBackup && <div className="space-y-3"><p>{t("more.mergeHint")}</p><p>{t("more.importPreview", backupSummary(pendingBackup))}</p><p className="text-muted text-sm">{t("more.backupContents")}</p></div>}</Sheet>
    </>
  )
}

export function MorePage() {
  const { t } = useTranslation()
  return <><PageHeader title={t("more.title")} /><div className="px-4 pb-8"><Panel className="divide-y overflow-hidden">
    <Row icon={Info} to="/more/settings">{t("more.settings")}</Row>
    <Row icon={Calculator} to="/more/calc">{t("calc.title")}</Row>
    <Row icon={Download} to="/more/data">{t("more.data")}</Row>
    <Row icon={CloudDownload} to="/more/offline">{t("more.offline")}</Row>
    <Row icon={Info} to="/more/about">{t("about.title")}</Row>
    {import.meta.env.DEV && <Row icon={Video} to="/dev/videos">Video review (dev)</Row>}
  </Panel></div></>
}

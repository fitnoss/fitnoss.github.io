/** Shared helpers for translation coverage (used by build-data.ts and i18n-check.ts). */

type Tree = { [k: string]: string | Tree }

const PLURAL = /_(zero|one|two|few|many|other)$/

export function flatten(tree: Tree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (typeof v === "string") out[key] = v
    else Object.assign(out, flatten(v, key))
  }
  return out
}

/**
 * Compares a language's UI strings with English. Plural keys are compared by base key,
 * and the language must have every plural form its grammar needs (Intl.PluralRules).
 */
export function compareUi(en: Tree, other: Tree, lang: string) {
  const enKeys = flatten(en)
  const otherKeys = flatten(other)
  const forms = new Intl.PluralRules(lang).resolvedOptions().pluralCategories
  const missing: string[] = []
  const extra: string[] = []
  const bases = new Set<string>()
  let total = 0
  let done = 0

  for (const k of Object.keys(enKeys)) {
    const base = k.replace(PLURAL, "")
    if (base !== k) {
      if (bases.has(base)) continue
      bases.add(base)
      for (const f of forms) {
        total++
        if (otherKeys[`${base}_${f}`]) done++
        else missing.push(`${base}_${f}`)
      }
    } else {
      total++
      if (otherKeys[k]) done++
      else missing.push(k)
    }
  }
  for (const k of Object.keys(otherKeys)) {
    const base = k.replace(PLURAL, "")
    if (!(k in enKeys) && !bases.has(base)) extra.push(k)
  }
  return { missing, extra, total, done }
}

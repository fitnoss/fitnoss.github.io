export const BODY_METRICS = ["weight", "neck", "shoulders", "chest", "waist", "hips", "upperArm", "forearm", "thigh", "calf"] as const
export type BodyMetric = typeof BODY_METRICS[number]
export type BodyMeasurement = {
  id: string
  date: string
  values: Partial<Record<BodyMetric, number>>
  photo?: Blob
  updatedAt: number
}

export function localDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

export function validBodyDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
}

export function validBodyValues(values: unknown): values is BodyMeasurement["values"] {
  return !!values && typeof values === "object" && !Array.isArray(values) &&
    Object.entries(values).every(([key, value]) => BODY_METRICS.includes(key as BodyMetric) &&
      typeof value === "number" && Number.isFinite(value) && value > 0 && value <= (key === "weight" ? 1000 : 500))
}

export function validMeasurement(entry: BodyMeasurement) {
  return typeof entry?.id === "string" && entry.id.length > 0 && validBodyDate(entry.date) &&
    validBodyValues(entry.values) && Number.isFinite(entry.updatedAt) && entry.updatedAt >= 0 &&
    (entry.photo === undefined || (entry.photo instanceof Blob && ["image/jpeg", "image/png", "image/webp"].includes(entry.photo.type) && entry.photo.size > 0 && entry.photo.size <= 3_000_000)) &&
    (Object.keys(entry.values).length > 0 || !!entry.photo)
}

export function sortMeasurements(entries: BodyMeasurement[]) {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt || a.id.localeCompare(b.id))
}

export function metricHistory(entries: BodyMeasurement[], metric: BodyMetric) {
  return sortMeasurements(entries).reverse().flatMap((entry) => {
    const value = entry.values[metric]
    return value === undefined ? [] : [{ id: entry.id, date: entry.date, value }]
  })
}

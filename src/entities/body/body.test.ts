import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { deserializeMeasurements, serializeMeasurements } from "./backup"
import { deleteMeasurement, listMeasurements, mergeMeasurements, saveMeasurement } from "./storage"
import { localDate, metricHistory, validBodyDate, validMeasurement, type BodyMeasurement } from "./types"

beforeEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("fitnoss-body")
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
})
const entry = (id = "one", date = "2026-10-31"): BodyMeasurement => ({ id, date, values: { weight: 75.5, waist: 80 }, updatedAt: 100 })

describe("body measurements", () => {
  it("persists measurements and photo bytes across independent database connections", async () => {
    const photo = new Blob([new Uint8Array([1, 2, 3, 255])], { type: "image/jpeg" })
    await saveMeasurement({ ...entry(), photo })
    const [saved] = await listMeasurements()
    expect(saved.values).toEqual({ weight: 75.5, waist: 80 })
    expect(saved.photo?.type).toBe("image/jpeg")
    expect(await saved.photo?.arrayBuffer()).toEqual(await photo.arrayBuffer())
    await saveMeasurement({ ...saved, values: { waist: 79.5 }, photo: undefined })
    expect(await listMeasurements()).toEqual([{ ...entry(), values: { waist: 79.5 }, photo: undefined }])
    await deleteMeasurement("one")
    expect(await listMeasurements()).toEqual([])
  })

  it("round-trips photos in a JSON backup and preserves local IDs on repeated imports", async () => {
    const local = entry()
    await saveMeasurement(local)
    const incoming = { ...entry("two", "2026-10-30"), photo: new Blob(["photo"], { type: "image/png" }) }
    const serialized = JSON.parse(JSON.stringify(await serializeMeasurements([{ ...local, values: { weight: 1 } }, incoming, incoming])))
    const decoded = deserializeMeasurements(serialized)
    expect(await mergeMeasurements(decoded)).toBe(1)
    expect(await mergeMeasurements(decoded)).toBe(0)
    const result = await listMeasurements()
    expect(result[0]).toEqual(local)
    expect(await result[1].photo?.text()).toBe("photo")
  })

  it("validates all incoming records before writing any of them", async () => {
    await expect(mergeMeasurements([entry(), { ...entry("two"), values: { weight: -1 } }])).rejects.toThrow()
    expect(await listMeasurements()).toEqual([])
    for (const photo of ["data:image/svg+xml;base64,PHN2Zz4=", "https://example.org/photo.jpg", "data:image/jpeg;base64,!"]) {
      expect(() => deserializeMeasurements([{ ...entry(), photo }])).toThrow()
    }
    expect(validMeasurement({ ...entry(), values: {} })).toBe(false)
    expect(validMeasurement({ ...entry(), values: { weight: NaN } })).toBe(false)
    expect(validMeasurement({ ...entry(), values: {}, photo: new Blob(["photo"], { type: "image/jpeg" }) })).toBe(true)
    expect(validBodyDate("2026-02-30")).toBe(false)
    expect(validBodyDate("2028-02-29")).toBe(true)
    expect(localDate(new Date(2026, 9, 31, 0, 1))).toBe("2026-10-31")
  })

  it("sorts by the measurement date and skips missing metrics without carrying values forward", () => {
    const records = [entry("late", "2026-10-31"), { ...entry("photo", "2026-10-30"), values: {} }, { ...entry("early", "2026-10-29"), values: { weight: 76 } }]
    expect(metricHistory(records, "weight").map((point) => point.value)).toEqual([76, 75.5])
    expect(metricHistory(records, "waist").map((point) => point.id)).toEqual(["late"])
    expect(metricHistory(records, "neck")).toEqual([])
  })

  it("rejects failed writes instead of reporting an unsaved entry as saved", async () => {
    const put = vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(() => { throw new DOMException("Full", "QuotaExceededError") })
    try { await expect(saveMeasurement(entry())).rejects.toThrow("Full") }
    finally { put.mockRestore() }
    expect(await listMeasurements()).toEqual([])
  })
})

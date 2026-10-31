import { validMeasurement, type BodyMeasurement } from "./types"

export type BodyBackupEntry = Omit<BodyMeasurement, "photo"> & { photo?: string }

export async function serializeMeasurements(entries: BodyMeasurement[]): Promise<BodyBackupEntry[]> {
  return Promise.all(entries.map(async ({ photo, ...entry }) => {
    if (!photo) return entry
    const bytes = new Uint8Array(await photo.arrayBuffer())
    let binary = ""
    for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192))
    return { ...entry, photo: `data:${photo.type};base64,${btoa(binary)}` }
  }))
}

export function deserializeMeasurements(entries: BodyBackupEntry[]): BodyMeasurement[] {
  if (!Array.isArray(entries)) throw new Error("Invalid body backup")
  return entries.map((entry) => {
    let photo: Blob | undefined
    if (entry?.photo !== undefined) {
      if (typeof entry.photo !== "string" || entry.photo.length > 4_000_100) throw new Error("Invalid photo")
      const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(entry.photo)
      if (!match) throw new Error("Invalid photo")
      photo = new Blob([Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0))], { type: match[1] })
    }
    const decoded = { ...entry, photo }
    if (!validMeasurement(decoded)) throw new Error("Invalid body measurement")
    return decoded
  })
}

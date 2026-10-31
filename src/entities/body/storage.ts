import { sortMeasurements, validMeasurement, type BodyMeasurement } from "./types"

const DATABASE = "fitnoss-body"
const STORE = "measurements"

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    let blocked = false
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" })
    request.onerror = () => reject(request.error)
    request.onblocked = () => { blocked = true; reject(new Error("Body database is blocked")) }
    request.onsuccess = () => {
      const db = request.result
      if (blocked) { db.close(); return }
      db.onversionchange = () => db.close()
      resolve(db)
    }
  })
}

/** Resolve only on transaction commit, including quota/abort errors for photo writes. */
async function transaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore, result: (value: T) => void) => void): Promise<T> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    let value: T
    tx.oncomplete = () => { db.close(); resolve(value) }
    tx.onabort = () => { db.close(); reject(tx.error ?? new Error("Body transaction aborted")) }
    tx.onerror = () => { /* onabort reports the failed transaction */ }
    try { run(tx.objectStore(STORE), (next) => { value = next }) }
    catch (error) { tx.abort(); reject(error) }
  })
}

export async function listMeasurements() {
  return sortMeasurements(await transaction<BodyMeasurement[]>("readonly", (store, result) => {
    const request = store.getAll()
    request.onsuccess = () => result(request.result)
  }))
}

export async function saveMeasurement(entry: BodyMeasurement) {
  if (!validMeasurement(entry)) throw new Error("Invalid body measurement")
  await transaction<void>("readwrite", (store) => { store.put(entry) })
}

export async function deleteMeasurement(id: string) {
  await transaction<void>("readwrite", (store) => { store.delete(id) })
}

/** Check and add in one transaction, preserving local entries (and their photos). */
export async function mergeMeasurements(entries: BodyMeasurement[]) {
  if (!entries.every(validMeasurement)) throw new Error("Invalid body measurements")
  return transaction<number>("readwrite", (store, result) => {
    const request = store.getAllKeys()
    request.onsuccess = () => {
      const ids = new Set(request.result)
      let added = 0
      for (const entry of entries) {
        if (ids.has(entry.id)) continue
        ids.add(entry.id)
        store.add(entry)
        added++
      }
      result(added)
    }
  })
}

import { describe, expect, it } from "vitest"
import { groups, itemLabels, moveItem, removeItem, restAfter } from "./types"

const s = true as const
const list = (...links: (true | undefined)[]) => links.map((superset, i) => (superset ? { id: i, rest: 60, superset } : { id: i, rest: 60 }))
const ids = (items: { id: number }[]) => items.map((x) => x.id)
const links = (items: { superset?: true }[]) => items.map((x) => !!x.superset)

describe("supersets", () => {
  it("groups and labels linked exercises", () => {
    const items = list(undefined, undefined, s, s, undefined)
    expect(groups(items)).toEqual([[0], [1, 2, 3], [4]])
    expect(itemLabels(items)).toEqual(["1", "2a", "2b", "2c", "3"])
  })

  it("rests only after the last exercise of a superset", () => {
    const items = list(undefined, s, undefined)
    expect([0, 1, 2].map((i) => restAfter(items, i))).toEqual([0, 60, 60])
  })

  it("moves exercises while the links stay in place", () => {
    const items = list(undefined, s, undefined)
    const up = moveItem(items, 2, -1)
    expect(ids(up)).toEqual([0, 2, 1])
    expect(links(up)).toEqual([false, true, false])
    expect(moveItem(items, 0, -1)).toBe(items)
  })

  it("hands the lead of a superset to the next exercise on removal", () => {
    const items = list(undefined, undefined, s, s)
    const out = removeItem(items, 1)
    expect(ids(out)).toEqual([0, 2, 3])
    expect(links(out)).toEqual([false, false, true])
    expect(links(removeItem(items, 2))).toEqual([false, false, true])
  })
})

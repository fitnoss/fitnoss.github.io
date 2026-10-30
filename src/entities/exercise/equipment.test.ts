import { describe, expect, it } from "vitest"
import fs from "node:fs"
import { derivePlaces, EQUIPMENT } from "../../../scripts/build-data"
import { EQUIPMENT as CLIENT_EQUIPMENT } from "./types"

const overrides = JSON.parse(fs.readFileSync(new URL("../../../data/overrides.json", import.meta.url), "utf8"))

describe("reviewed equipment metadata", () => {
  it("uses the same equipment vocabulary in the build and filters", () => {
    expect(EQUIPMENT).toEqual(CLIENT_EQUIPMENT)
  })
  it("distinguishes parallel bars from rings and includes the band required for assisted pull-ups", () => {
    expect(overrides["Dips_-_Chest_Version"].equipment).toBe("parallelbars")
    expect(overrides.Ring_Dips.equipment).toBe("rings")
    expect(overrides.Muscle_Up.equipment).toBe("rings")
    expect(overrides["Band_Assisted_Pull-Up"]).toMatchObject({ equipment: "pullupbar", equipmentExtra: ["bands"] })
  })
  it("does not label a pull-up bar as a home exercise without equipment", () => {
    expect(derivePlaces("One Handed Hang", "pullupbar")).toEqual(["bars", "gym"])
    expect(overrides["Knee_Hip_Raise_On_Parallel_Bars"].equipment).toBe("machine")
  })
})

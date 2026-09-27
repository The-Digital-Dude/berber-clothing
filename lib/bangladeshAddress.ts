// Bangladesh Division / District / Thana data, sourced from the
// `all-bangladeshi-addresses` package (8 divisions, 64 districts, 610
// thana-level entries — this package's thana lists include BOTH rural
// upazilas and metropolitan police thanas, e.g. Dhaka's list correctly
// includes Gulshan, Dhanmondi, Mirpur Model, Banani, Uttara East/West,
// not just its 5 rural upazilas — this is what makes it usable for a
// real "Area/Thana" field where most customers are in city areas.
import { allDivisionEN, districtENOf, thanasENOf, allDistrictEN } from "all-bangladeshi-addresses"

// The package's raw data spells this district "Coxsbazar" — correct it
// for display/storage while still calling into the package with the
// original spelling internally.
const DISPLAY_OVERRIDES: Record<string, string> = { Coxsbazar: "Cox's Bazar" }
const REVERSE_OVERRIDES: Record<string, string> = Object.fromEntries(
  Object.entries(DISPLAY_OVERRIDES).map(([raw, display]) => [display, raw])
)
const toDisplay = (raw: string) => DISPLAY_OVERRIDES[raw] || raw
const toRaw = (display: string) => REVERSE_OVERRIDES[display] || display

export const DIVISIONS: string[] = allDivisionEN()

export const ALL_DISTRICTS: string[] = allDistrictEN().map(toDisplay).sort()

export const DISTRICTS_BY_DIVISION: Record<string, string[]> = Object.fromEntries(
  DIVISIONS.map((division) => [division, districtENOf(division).map(toDisplay).sort()])
)

export function getDistricts(division: string): string[] {
  return DISTRICTS_BY_DIVISION[division] || []
}

export function getAreaSuggestions(district: string): string[] {
  if (!district) return []
  return [...thanasENOf(toRaw(district))].sort()
}

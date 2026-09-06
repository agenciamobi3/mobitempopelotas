export const REGIONAL_DEFESA_CIVIL_STATIONS = {
  "turucu-rs": ["DCRS-00126"],
  "cristal-rs": ["DCRS-00125"],
  "jaguarao-rs": ["DCRS-00115"],
  "arroio-grande-rs": ["DCRS-00050", "DCRS-00111"],
  "bage-rs": ["DCRS-00041"],
  "capao-do-leao-rs": ["DCRS-00063"],
  "santa-vitoria-do-palmar-rs": ["DCRS-00049"],
} as const;

export type RegionalDefesaCivilCitySlug = keyof typeof REGIONAL_DEFESA_CIVIL_STATIONS;

export function regionalDefesaCivilStationCodes(citySlug: string): readonly string[] | null {
  if (!(citySlug in REGIONAL_DEFESA_CIVIL_STATIONS)) return null;
  return REGIONAL_DEFESA_CIVIL_STATIONS[citySlug as RegionalDefesaCivilCitySlug];
}

export const REGIONAL_DEFESA_CIVIL_STATIONS = {
  "turucu-rs": ["DCRS-00126"],
  "cristal-rs": ["DCRS-00125"],
  "jaguarao-rs": ["DCRS-00115"],
  "arroio-grande-rs": ["DCRS-00050", "DCRS-00111"],
  "bage-rs": ["DCRS-00041"],
  "capao-do-leao-rs": ["DCRS-00063"],
  "santa-vitoria-do-palmar-rs": ["DCRS-00049"],
} as const;

export const REGIONAL_DEFESA_CIVIL_DEDICATED_PAGES = {
  "jaguarao-rs": {
    path: "/nivel-do-rio-jaguarao",
    label: "Ver nível do Rio Jaguarão",
    stationCode: "DCRS-00115",
  },
  "capao-do-leao-rs": {
    path: "/nivel-do-canal-sao-goncalo",
    label: "Ver nível do Canal São Gonçalo",
    stationCode: "DCRS-00063",
  },
} as const;

export type RegionalDefesaCivilCitySlug = keyof typeof REGIONAL_DEFESA_CIVIL_STATIONS;
export type RegionalDefesaCivilDedicatedCitySlug = keyof typeof REGIONAL_DEFESA_CIVIL_DEDICATED_PAGES;

export function regionalDefesaCivilStationCodes(citySlug: string): readonly string[] | null {
  if (!(citySlug in REGIONAL_DEFESA_CIVIL_STATIONS)) return null;
  return REGIONAL_DEFESA_CIVIL_STATIONS[citySlug as RegionalDefesaCivilCitySlug];
}

export function regionalDefesaCivilDedicatedPage(citySlug: string) {
  if (!(citySlug in REGIONAL_DEFESA_CIVIL_DEDICATED_PAGES)) return null;
  return REGIONAL_DEFESA_CIVIL_DEDICATED_PAGES[citySlug as RegionalDefesaCivilDedicatedCitySlug];
}

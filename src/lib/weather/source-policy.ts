export const WEATHER_SOURCE_REQUEST_TIMEOUT_MS = {
  embrapa: 2_200,
  inmet: 3_200,
  cppmet: 2_400,
} as const;

export const OFFICIAL_SOURCE_DEADLINE_MS = {
  embrapa: 2_600,
  inmet: 3_600,
  inmetForecast: 4_000,
  cppmet: 2_800,
} as const;

export const WEATHER_SOURCE_REQUEST_TIMEOUT_MS = {
  embrapa: 1_600,
  inmet: 1_600,
  cppmet: 1_500,
} as const;

export const OFFICIAL_SOURCE_DEADLINE_MS = {
  embrapa: 1_900,
  inmet: 1_900,
  cppmet: 1_800,
} as const;

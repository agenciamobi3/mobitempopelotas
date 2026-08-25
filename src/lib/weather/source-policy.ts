export const WEATHER_SOURCE_REQUEST_TIMEOUT_MS = {
  embrapa: 4_000,
  inmet: 4_000,
  cppmet: 3_500,
} as const;

export const OFFICIAL_SOURCE_DEADLINE_MS = {
  embrapa: 4_500,
  inmet: 4_500,
  cppmet: 4_000,
} as const;

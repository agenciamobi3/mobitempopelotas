import type { WeatherData } from "@/production/lib/weather-data";

export const PORTAL_FOOTER_SOURCE = {
  name: "Tempo Pelotas",
  url: "/status-dos-dados",
  isFallback: false,
} satisfies WeatherData["source"];

import type { WeatherData } from "@/production/lib/weather-data";

export const PORTAL_FOOTER_SOURCE = {
  name: "Tempo Pelotas",
  url: "/metodologia",
  isFallback: false,
} satisfies WeatherData["source"];

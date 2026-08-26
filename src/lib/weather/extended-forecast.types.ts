import type { DailyForecast } from "./types";

export type ExtendedForecastStatus = "live" | "partial" | "unavailable";

export type ExtendedForecastData = {
  status: ExtendedForecastStatus;
  days: DailyForecast[];
  source: {
    name: "Open-Meteo";
    url: string;
    fetchedAt: string;
    model: "Open-Meteo Best Match";
    requestedDays: 15;
    returnedDays: number;
  };
  message: string | null;
};

import type { DailyForecast } from "./types";

export type ExtendedForecastStatus = "live" | "partial" | "unavailable";

export type ExtendedForecastModel =
  | "Open-Meteo Best Match"
  | "NOAA GFS"
  | "Open-Meteo Extended Cache"
  | "Open-Meteo 7-day Cache";

export type ExtendedForecastData = {
  status: ExtendedForecastStatus;
  days: DailyForecast[];
  source: {
    name: "Open-Meteo";
    url: string;
    fetchedAt: string;
    model: ExtendedForecastModel;
    requestedDays: 15;
    returnedDays: number;
  };
  message: string | null;
};

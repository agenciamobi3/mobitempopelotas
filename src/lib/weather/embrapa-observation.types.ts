export const EMBRAPA_MONITOR_URL =
  "https://agromet.cpact.embrapa.br/online/Current_Monitor.htm";

export type EmbrapaObservationStatus = "live" | "partial" | "unavailable";

export type TimedObservation = {
  value: number | null;
  time: string | null;
};

export type EmbrapaObservationData = {
  status: EmbrapaObservationStatus;
  current: {
    temperature: number | null;
    humidity: number | null;
    feelsLike: number | null;
    dewPoint: number | null;
    pressure: number | null;
    pressureTrend: string | null;
    windDirection: string | null;
    windSpeed: number | null;
    sunrise: string | null;
    sunset: string | null;
  };
  extremes: {
    temperatureMin: TimedObservation;
    temperatureMax: TimedObservation;
    humidityMin: TimedObservation;
    humidityMax: TimedObservation;
    dewPointMin: TimedObservation;
    dewPointMax: TimedObservation;
    windSpeedMax: TimedObservation;
  };
  accumulated: {
    rainDaily: number | null;
    rainMonthly: number | null;
    rainAnnual: number | null;
    evapotranspirationDaily: number | null;
    evapotranspirationMonthly: number | null;
    evapotranspirationAnnual: number | null;
  };
  source: {
    name: "Embrapa Clima Temperado";
    station: "Posto Meteorológico da Sede";
    url: string;
    latitude: number;
    longitude: number;
    altitude: number;
    fetchedAt: string;
    observationTime: string | null;
  };
  error: string | null;
};

export type CurrentObservationStatus = "live" | "unavailable";

export type CurrentWeatherObservation = {
  status: CurrentObservationStatus;
  station: {
    code: string | null;
    name: string;
    basin: string | null;
    region: string | null;
    latitude: number | null;
    longitude: number | null;
    altitudeM: number | null;
    distanceFromPelotasKm: number | null;
  };
  current: {
    temperature: number | null;
    feelsLike: number | null;
    humidity: number | null;
    pressure: number | null;
    windSpeed: number | null;
    windGust: number | null;
    windDirection: string | null;
    windDirectionDegrees: number | null;
  };
  rain: {
    h1Mm: number | null;
    h3Mm: number | null;
    h6Mm: number | null;
    h12Mm: number | null;
    h24Mm: number | null;
  };
  source: {
    name: "Defesa Civil RS — Rede de Monitoramento Hidrometeorológico";
    url: string;
    documentationUrl: string;
    fetchedAt: string;
    observedAt: string | null;
  };
  error: string | null;
};

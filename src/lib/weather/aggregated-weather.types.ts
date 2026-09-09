import type {
  CppmetForecastItem,
  InmetAlert,
  InmetForecastPeriod,
  InmetStationReference,
  OfficialSourceStatus,
} from "./official-sources.types";
import type { CurrentWeatherObservation } from "./current-observation.types";
import type { DailyForecast, ForecastSourceKey, HourlyForecast, WeatherIconName } from "./types";

export type { ForecastSourceKey };

export type NowObservationSourceKey = "embrapa" | "defesa-civil-rs";
export type WeatherSourceKey = "defesa-civil-rs" | "inmet" | "cppmet" | ForecastSourceKey;
export type WeatherDataSourceKey = WeatherSourceKey | NowObservationSourceKey;

export type AggregatedWeatherStatus = "live" | "degraded" | "unavailable";
export type WeatherConfidence = "high" | "medium" | "low";
export type WeatherSourceHealthStatus = OfficialSourceStatus | "stale";

export type AggregatedCurrentWeather = {
  city: string;
  state: string;
  temperature: number | null;
  feelsLike: number | null;
  condition: string | null;
  humidity: number | null;
  pressure: number | null;
  windSpeed: number | null;
  windGust: number | null;
  windDirection: string | null;
  visibilityKm: number | null;
  sunrise: string | null;
  sunset: string | null;
  observedAt: string | null;
  icon: WeatherIconName | null;
};

export type AggregatedCurrentField = Exclude<keyof AggregatedCurrentWeather, "city" | "state">;

export type AggregatedCurrentProvenance = Partial<
  Record<AggregatedCurrentField, WeatherDataSourceKey>
>;

export type WeatherDiscrepancyField =
  | "temperature"
  | "feelsLike"
  | "humidity"
  | "pressure"
  | "windSpeed"
  | "minimum"
  | "maximum";

export type WeatherDiscrepancy = {
  scope: "current" | "daily";
  field: WeatherDiscrepancyField;
  severity: "notice" | "significant";
  referenceSource: WeatherDataSourceKey;
  comparisonSource: WeatherDataSourceKey;
  referenceValue: number;
  comparisonValue: number;
  difference: number;
  unit: "°C" | "%" | "hPa" | "km/h";
  day: string | null;
};

export type WeatherSourceHealth = {
  source: WeatherSourceKey;
  status: WeatherSourceHealthStatus;
  role: "observation" | "forecast" | "alerts" | "forecast-context" | "official";
  fetchedAt: string;
  usable: boolean;
  reason: string | null;
};

export type AggregatedNowObservation = {
  primarySource: NowObservationSourceKey;
  selectedSource: NowObservationSourceKey | null;
  fallbackUsed: boolean;
  sourceName: string | null;
  stationName: string | null;
  sourceUrl: string | null;
  observedAt: string | null;
};

export type AggregatedWeatherQuality = {
  score: number;
  confidence: WeatherConfidence;
  currentSource: NowObservationSourceKey | null;
  forecastSource: ForecastSourceKey | null;
  forecastProvider: string | null;
  degradedSources: WeatherSourceKey[];
  observationAgeMinutes: number | null;
  discrepancies: WeatherDiscrepancy[];
  notes: string[];
};

export type AggregatedWeatherData = {
  status: AggregatedWeatherStatus;
  current: AggregatedCurrentWeather | null;
  currentProvenance: AggregatedCurrentProvenance;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  observation: CurrentWeatherObservation;
  now?: AggregatedNowObservation;
  alerts: InmetAlert[];
  inmetForecast: InmetForecastPeriod[];
  inmetStation: InmetStationReference["station"];
  officialForecast: CppmetForecastItem[];
  sources: Record<WeatherSourceKey, WeatherSourceHealth>;
  quality: AggregatedWeatherQuality;
  source: {
    name: "MOBI Tempo Pelotas";
    kind: "aggregated";
    fetchedAt: string;
  };
  message: string | null;
};
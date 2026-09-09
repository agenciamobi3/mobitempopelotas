import type { CurrentWeatherObservation } from "./current-observation.types";
import { fetchOfficialWeatherSources } from "./official-sources.server";
import type { InmetForecastPeriod } from "./official-sources.types";
import { fetchPelotasWeather, type WeatherBaselineData } from "./weather-baseline.server";
import type { CurrentWeather, DailyForecast, ForecastSourceKey, WeatherHomeData } from "./types";
import type {
  AggregatedCurrentWeather,
  AggregatedWeatherData,
  NowObservationSourceKey,
  WeatherConfidence,
  WeatherDataSourceKey,
  WeatherDiscrepancy,
  WeatherDiscrepancyField,
  WeatherSourceHealth,
  WeatherSourceKey,
} from "./aggregated-weather.types";
import {
  FORECAST_PROVIDER_LABELS,
  createProviderHealth,
  deriveTraceability,
} from "./weather-traceability";
import { OBSERVATION_MAX_AGE_MINUTES } from "./current-observation";
import { localForecastDateKey } from "./daily-temperature-reconciliation";
import { fetchNowSourceResolution } from "./now-source.server";

const TIMEZONE = "America/Sao_Paulo";

const SOURCE_LABELS: Record<WeatherSourceKey, string> = {
  "defesa-civil-rs": "Defesa Civil RS",
  inmet: "INMET",
  cppmet: "CPPMet",
  "open-meteo": "Open-Meteo",
  "met-norway": "MET Norway",
};

function addDiscrepancy(
  discrepancies: WeatherDiscrepancy[],
  options: {
    scope: "current" | "daily";
    field: WeatherDiscrepancyField;
    referenceSource: WeatherDataSourceKey;
    comparisonSource: WeatherDataSourceKey;
    referenceValue: number | null;
    comparisonValue: number | null;
    noticeThreshold: number;
    significantThreshold: number;
    unit: WeatherDiscrepancy["unit"];
    day?: string;
  },
) {
  if (options.referenceValue === null || options.comparisonValue === null) return;

  const difference = Math.abs(options.referenceValue - options.comparisonValue);
  if (difference < options.noticeThreshold) return;

  discrepancies.push({
    scope: options.scope,
    field: options.field,
    severity: difference >= options.significantThreshold ? "significant" : "notice",
    referenceSource: options.referenceSource,
    comparisonSource: options.comparisonSource,
    referenceValue: options.referenceValue,
    comparisonValue: options.comparisonValue,
    difference: Number(difference.toFixed(1)),
    unit: options.unit,
    day: options.day ?? null,
  });
}

function compareCurrentSources(
  baseline: CurrentWeather | null,
  current: AggregatedCurrentWeather | null,
  comparisonSource: NowObservationSourceKey | null,
  referenceKey: ForecastSourceKey,
) {
  const discrepancies: WeatherDiscrepancy[] = [];
  if (!baseline || !current || !comparisonSource) return discrepancies;

  addDiscrepancy(discrepancies, {
    scope: "current",
    field: "temperature",
    referenceSource: referenceKey,
    comparisonSource,
    referenceValue: baseline.temperature,
    comparisonValue: current.temperature,
    noticeThreshold: 2.5,
    significantThreshold: 5,
    unit: "°C",
  });
  addDiscrepancy(discrepancies, {
    scope: "current",
    field: "feelsLike",
    referenceSource: referenceKey,
    comparisonSource,
    referenceValue: baseline.feelsLike,
    comparisonValue: current.feelsLike,
    noticeThreshold: 3,
    significantThreshold: 6,
    unit: "°C",
  });
  addDiscrepancy(discrepancies, {
    scope: "current",
    field: "humidity",
    referenceSource: referenceKey,
    comparisonSource,
    referenceValue: baseline.humidity,
    comparisonValue: current.humidity,
    noticeThreshold: 12,
    significantThreshold: 25,
    unit: "%",
  });
  addDiscrepancy(discrepancies, {
    scope: "current",
    field: "pressure",
    referenceSource: referenceKey,
    comparisonSource,
    referenceValue: baseline.pressure,
    comparisonValue: current.pressure,
    noticeThreshold: 4,
    significantThreshold: 8,
    unit: "hPa",
  });
  addDiscrepancy(discrepancies, {
    scope: "current",
    field: "windSpeed",
    referenceSource: referenceKey,
    comparisonSource,
    referenceValue: baseline.windSpeed,
    comparisonValue: current.windSpeed,
    noticeThreshold: 12,
    significantThreshold: 25,
    unit: "km/h",
  });

  return discrepancies;
}

function weekdayKey(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/-feira/g, "")
    .replace(/[^a-z]/g, "");

  const aliases: Record<string, string> = {
    dom: "domingo",
    domingo: "domingo",
    seg: "segunda",
    segunda: "segunda",
    ter: "terca",
    terca: "terca",
    qua: "quarta",
    quarta: "quarta",
    qui: "quinta",
    quinta: "quinta",
    sex: "sexta",
    sexta: "sexta",
    sab: "sabado",
    sabado: "sabado",
  };

  return aliases[normalized] ?? normalized;
}

function currentWeekdayKey() {
  return weekdayKey(
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      timeZone: TIMEZONE,
    }).format(new Date()),
  );
}

function dailyWeekdayKey(day: DailyForecast) {
  return day.weekday.toLowerCase() === "hoje" ? currentWeekdayKey() : weekdayKey(day.weekday);
}

function compareDailyForecasts(
  daily: DailyForecast[],
  officialForecast: AggregatedWeatherData["officialForecast"],
  referenceKey: ForecastSourceKey,
) {
  const discrepancies: WeatherDiscrepancy[] = [];
  const dailyByWeekday = new Map(daily.map((day) => [dailyWeekdayKey(day), day]));

  for (const officialDay of officialForecast) {
    const baselineDay = dailyByWeekday.get(weekdayKey(officialDay.day));
    if (!baselineDay) continue;

    addDiscrepancy(discrepancies, {
      scope: "daily",
      field: "minimum",
      referenceSource: referenceKey,
      comparisonSource: "cppmet",
      referenceValue: baselineDay.min,
      comparisonValue: officialDay.minimum,
      noticeThreshold: 3,
      significantThreshold: 5,
      unit: "°C",
      day: officialDay.day,
    });
    addDiscrepancy(discrepancies, {
      scope: "daily",
      field: "maximum",
      referenceSource: referenceKey,
      comparisonSource: "cppmet",
      referenceValue: baselineDay.max,
      comparisonValue: officialDay.maximum,
      noticeThreshold: 3,
      significantThreshold: 5,
      unit: "°C",
      day: officialDay.day,
    });
  }

  return discrepancies;
}

function compareInmetForecasts(
  daily: DailyForecast[],
  periods: InmetForecastPeriod[],
  referenceKey: ForecastSourceKey,
) {
  const discrepancies: WeatherDiscrepancy[] = [];
  const dailyByDate = new Map(
    daily.map((day, index) => [day.dateIso ?? localForecastDateKey(index), day]),
  );
  const officialByDate = new Map<string, { minimum: number | null; maximum: number | null }>();

  for (const period of periods) {
    const date = period.date?.slice(0, 10);
    if (!date) continue;
    const existing = officialByDate.get(date) ?? { minimum: null, maximum: null };
    const minimum =
      period.minimum === null
        ? existing.minimum
        : existing.minimum === null
          ? period.minimum
          : Math.min(existing.minimum, period.minimum);
    const maximum =
      period.maximum === null
        ? existing.maximum
        : existing.maximum === null
          ? period.maximum
          : Math.max(existing.maximum, period.maximum);
    officialByDate.set(date, { minimum, maximum });
  }

  for (const [date, officialDay] of officialByDate) {
    const baselineDay = dailyByDate.get(date);
    if (!baselineDay) continue;

    addDiscrepancy(discrepancies, {
      scope: "daily",
      field: "minimum",
      referenceSource: referenceKey,
      comparisonSource: "inmet",
      referenceValue: baselineDay.min,
      comparisonValue: officialDay.minimum,
      noticeThreshold: 3,
      significantThreshold: 5,
      unit: "°C",
      day: date,
    });
    addDiscrepancy(discrepancies, {
      scope: "daily",
      field: "maximum",
      referenceSource: referenceKey,
      comparisonSource: "inmet",
      referenceValue: baselineDay.max,
      comparisonValue: officialDay.maximum,
      noticeThreshold: 3,
      significantThreshold: 5,
      unit: "°C",
      day: date,
    });
  }

  return discrepancies;
}

function calculateQualityScore(options: {
  baseline: WeatherHomeData;
  observationUsable: boolean;
  inmetAlertsLive: boolean;
  inmetForecastLive: boolean;
  inmetStationLive: boolean;
  cppmetLive: boolean;
  discrepancies: WeatherDiscrepancy[];
}) {
  let score = 0;
  if (options.observationUsable) score += 30;
  if (options.baseline.hourly.length > 0) score += 20;
  if (options.baseline.daily.length > 0) score += 20;
  if (options.inmetAlertsLive) score += 5;
  if (options.inmetForecastLive) score += 10;
  if (options.inmetStationLive) score += 5;
  if (options.cppmetLive) score += 10;

  const notices = options.discrepancies.filter((item) => item.severity === "notice").length;
  const significant = options.discrepancies.filter(
    (item) => item.severity === "significant",
  ).length;
  score -= Math.min(15, notices + significant * 4);

  return Math.max(0, Math.min(100, score));
}

function confidenceFromScore(score: number): WeatherConfidence {
  if (score >= 85) return "high";
  if (score >= 55) return "medium";
  return "low";
}

function createSources(
  baseline: WeatherBaselineData,
  observation: CurrentWeatherObservation,
  official: Awaited<ReturnType<typeof fetchOfficialWeatherSources>>,
  observationAgeMinutes: number | null,
  observationUsable: boolean,
): Record<WeatherSourceKey, WeatherSourceHealth> {
  const observationIsStale =
    observation.status === "live" &&
    observationAgeMinutes !== null &&
    observationAgeMinutes > OBSERVATION_MAX_AGE_MINUTES;
  const inmetServices = [official.inmet, official.inmetForecast, official.inmetStation];
  const inmetLiveCount = inmetServices.filter((source) => source.status === "live").length;
  const inmetErrors = Array.from(
    new Set(inmetServices.map((source) => source.error).filter((error): error is string => Boolean(error))),
  );
  const inmetFetchedAt =
    inmetServices.map((source) => source.source.fetchedAt).sort().at(-1) ?? new Date().toISOString();

  return {
    "open-meteo": createProviderHealth(baseline.providers["open-meteo"], "open-meteo"),
    "met-norway": createProviderHealth(baseline.providers["met-norway"], "met-norway"),
    "defesa-civil-rs": {
      source: "defesa-civil-rs",
      status: observationIsStale ? "stale" : observation.status,
      role: "observation",
      fetchedAt: observation.source.fetchedAt,
      usable: observationUsable,
      reason: observationIsStale
        ? `Leitura com mais de ${OBSERVATION_MAX_AGE_MINUTES} minutos.`
        : observation.error,
    },
    inmet: {
      source: "inmet",
      status:
        inmetLiveCount === inmetServices.length
          ? "live"
          : inmetLiveCount > 0
            ? "partial"
            : "unavailable",
      role: "official",
      fetchedAt: inmetFetchedAt,
      usable: inmetLiveCount > 0,
      reason: inmetErrors.length ? inmetErrors.join(" ") : null,
    },
    cppmet: {
      source: "cppmet",
      status: official.cppmet.status,
      role: "forecast-context",
      fetchedAt: official.cppmet.source.fetchedAt,
      usable: official.cppmet.status === "live" && official.cppmet.items.length > 0,
      reason: official.cppmet.error,
    },
  };
}

function buildNotes(options: {
  currentSource: NowObservationSourceKey | null;
  selectedForecastKey: ForecastSourceKey;
  usingContingency: boolean;
  sources: Record<WeatherSourceKey, WeatherSourceHealth>;
  discrepancies: WeatherDiscrepancy[];
  inmetForecastLive: boolean;
  inmetStationName: string | null;
}) {
  const notes: string[] = [];

  if (options.usingContingency) {
    notes.push("Open-Meteo não respondeu; a previsão foi assumida pela contingência do MET Norway.");
  } else {
    const contingencyKey: ForecastSourceKey =
      options.selectedForecastKey === "open-meteo" ? "met-norway" : "open-meteo";
    if (!options.sources[contingencyKey].usable) {
      notes.push("Contingência do MET Norway indisponível no momento; Open-Meteo segue como fonte ativa.");
    }
  }
  if (
    options.currentSource !== "embrapa" &&
    options.sources["defesa-civil-rs"].status === "stale"
  ) {
    notes.push(
      "A leitura observacional de contingência está desatualizada; nenhum valor de modelo foi apresentado como observação.",
    );
  }
  if (options.inmetForecastLive) {
    notes.push("A previsão oficial municipal do INMET complementa a grade horária do Open-Meteo.");
  }
  if (options.inmetStationName) {
    notes.push(
      `O INMET identificou ${options.inmetStationName} como estação de referência; seus metadados não substituem a medição atual selecionada.`,
    );
  }
  if (options.sources.cppmet.usable) {
    notes.push("O CPPMet/UFPel permanece como contexto meteorológico regional.");
  }
  if (options.discrepancies.length > 0) {
    notes.push("Foram detectadas diferenças relevantes entre observação e previsão disponíveis.");
  }

  return notes;
}

function buildMessage(
  status: AggregatedWeatherData["status"],
  degradedSources: WeatherSourceKey[],
) {
  if (status === "unavailable") {
    return "Não foi possível obter condições atuais nem previsão meteorológica.";
  }
  if (status === "degraded") {
    const labels = degradedSources.map((source) => SOURCE_LABELS[source]).join(", ");
    return labels
      ? `Dados disponíveis em modo degradado. Fontes com restrição: ${labels}.`
      : "Dados disponíveis em modo degradado.";
  }
  return null;
}

export async function fetchAggregatedPelotasWeather(): Promise<AggregatedWeatherData> {
  const [baseline, official, now] = await Promise.all([
    fetchPelotasWeather(),
    fetchOfficialWeatherSources(),
    fetchNowSourceResolution(),
  ]);

  const observation = now.defesaCivilObservation;
  const observationUsable = now.current !== null;
  const current = now.current;
  const currentProvenance = now.provenance;
  const observationAgeMinutes = now.observationAgeMinutes;

  // Observação e previsão são séries distintas. A observação nunca sobrescreve hourly[0].
  const hourly = baseline.hourly;

  const discrepancies = [
    ...compareCurrentSources(baseline.current, current, now.selectedSource, baseline.source.key),
    ...compareInmetForecasts(baseline.daily, official.inmetForecast.periods, baseline.source.key),
    ...compareDailyForecasts(baseline.daily, official.cppmet.items, baseline.source.key),
  ];
  const sources = createSources(
    baseline,
    observation,
    official,
    now.defesaCivilAgeMinutes,
    now.defesaCivilUsable,
  );

  const score = calculateQualityScore({
    baseline,
    observationUsable,
    inmetAlertsLive: official.inmet.status === "live",
    inmetForecastLive: official.inmetForecast.status === "live",
    inmetStationLive: official.inmetStation.status === "live",
    cppmetLive: official.cppmet.status === "live",
    discrepancies,
  });
  const confidence = confidenceFromScore(score);
  const hasWeatherData = current !== null || hourly.length > 0 || baseline.daily.length > 0;

  const {
    selectedForecastKey,
    usingContingency,
    degradedSources,
    status,
    forecastSource,
    forecastProvider,
  } = deriveTraceability({
    baseline,
    sources,
    currentSource: now.selectedSource,
    confidence,
    hasWeatherData,
  });

  const normalizedCurrentSource = now.selectedSource;

  return {
    status,
    current,
    currentProvenance,
    hourly,
    daily: baseline.daily,
    observation,
    now: {
      primarySource: now.primarySource,
      selectedSource: now.selectedSource,
      fallbackUsed: now.fallbackUsed,
      sourceName: now.sourceName,
      stationName: now.stationName,
      sourceUrl: now.sourceUrl,
      observedAt: now.observedAt,
    },
    alerts: official.inmet.alerts,
    inmetForecast: official.inmetForecast.periods,
    inmetStation: official.inmetStation.station,
    officialForecast: official.cppmet.items,
    sources,
    quality: {
      score,
      confidence,
      currentSource: normalizedCurrentSource,
      forecastSource,
      forecastProvider,
      degradedSources,
      observationAgeMinutes,
      discrepancies,
      notes: buildNotes({
        currentSource: normalizedCurrentSource,
        selectedForecastKey,
        usingContingency,
        sources,
        discrepancies,
        inmetForecastLive: official.inmetForecast.status === "live",
        inmetStationName: official.inmetStation.station?.name ?? null,
      }),
    },
    source: {
      name: "MOBI Tempo Pelotas",
      kind: "aggregated",
      fetchedAt: new Date().toISOString(),
    },
    message: buildMessage(status, degradedSources),
  };
}

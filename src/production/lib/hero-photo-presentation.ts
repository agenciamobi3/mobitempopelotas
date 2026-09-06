import type { WeatherData, WeatherIconName } from "@/production/lib/weather-data";

export type HeroPhotoKind =
  | "rain"
  | "fog"
  | "clear"
  | "clear-night"
  | "partly-cloudy-light"
  | "partly-cloudy-dense"
  | "cloudy";

export type HeroPhotoPresentation = {
  kind: HeroPhotoKind;
  src: string;
  position: string;
  credit: string;
};

const heroPhotos = {
  rain: {
    kind: "rain",
    src: "/weather/hero/pelotas-laranjal-chuva.webp",
    position: "center 48%",
    credit: "Acervo Tempo Pelotas",
  },
  fog: {
    kind: "fog",
    src: "/weather/hero/pelotas-nevoeiro-centro.webp",
    position: "center 48%",
    credit: "Acervo Tempo Pelotas",
  },
  clear: {
    kind: "clear",
    src: "/weather/hero/pelotas-laranjal-ceu-aberto.webp",
    position: "center 58%",
    credit: "Acervo Tempo Pelotas · Praia do Laranjal",
  },
  "clear-night": {
    kind: "clear-night",
    src: "/weather/hero/pelotas-laranjal-ceu-aberto-noite.webp",
    position: "center 54%",
    credit: "Acervo Tempo Pelotas · Praia do Laranjal · noite",
  },
  "partly-cloudy-light": {
    kind: "partly-cloudy-light",
    src: "/weather/hero/pelotas parcialmente nublado centro.jpg",
    position: "center 50%",
    credit: "Acervo Tempo Pelotas · Centro de Pelotas",
  },
  "partly-cloudy-dense": {
    kind: "partly-cloudy-dense",
    src: "/weather/hero/pelotas-parcialmente-nublado.avif",
    position: "center 50%",
    credit: "Acervo Tempo Pelotas",
  },
  cloudy: {
    kind: "cloudy",
    src: "/weather/hero/pelotas-parcialmente-nublado.avif",
    position: "center 50%",
    credit: "Acervo Tempo Pelotas",
  },
} satisfies Record<HeroPhotoKind, HeroPhotoPresentation>;

const partlyCloudyDayAlternate = {
  src: "/weather/hero/pelotas-dia-parcialmente-bulado.png",
  position: "center 50%",
  credit: "Acervo Tempo Pelotas · Pelotas · dia",
} as const;

const partlyCloudyMadrugadaAlternate = {
  src: "/weather/hero/pelotas-madrugada-parcialmente-nublado.png",
  position: "center 50%",
  credit: "Acervo Tempo Pelotas · Pelotas · madrugada",
} as const;

const PELOTAS_TIME_ZONE = "America/Sao_Paulo";
const MADRUGADA_END_HOUR = 7;

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function currentCloudCover(weather: WeatherData) {
  const cloudCover = weather.hourly[0]?.cloudCover;
  return typeof cloudCover === "number" && Number.isFinite(cloudCover) ? cloudCover : null;
}

function localHourFromTimestamp(value: string | null | undefined) {
  const timestamp = value?.trim();
  if (!timestamp) return null;

  const localIso = timestamp.match(/^\d{4}-\d{2}-\d{2}T(\d{2}):/);
  const hasExplicitZone = /(?:z|[+-]\d{2}:\d{2})$/i.test(timestamp);
  if (localIso && !hasExplicitZone) {
    const hour = Number(localIso[1]);
    return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: PELOTAS_TIME_ZONE,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
  );
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
}

function currentPelotasHour(weather: WeatherData) {
  return (
    localHourFromTimestamp(weather.hourly[0]?.timestamp) ??
    localHourFromTimestamp(weather.current.updatedAt) ??
    localHourFromTimestamp(weather.current.source.observedAt)
  );
}

function usesAlternateRotationSlot(weather: WeatherData) {
  const hour = currentPelotasHour(weather);
  return hour !== null && hour % 2 === 0;
}

function partlyCloudyDayPhoto(weather: WeatherData, legacy: HeroPhotoPresentation) {
  if (!usesAlternateRotationSlot(weather)) return legacy;
  return {
    kind: legacy.kind,
    ...partlyCloudyDayAlternate,
  } satisfies HeroPhotoPresentation;
}

function partlyCloudyNightPhoto(weather: WeatherData) {
  const hour = currentPelotasHour(weather);
  if (
    hour !== null &&
    hour >= 0 &&
    hour < MADRUGADA_END_HOUR &&
    usesAlternateRotationSlot(weather)
  ) {
    return {
      kind: "partly-cloudy-dense",
      ...partlyCloudyMadrugadaAlternate,
    } satisfies HeroPhotoPresentation;
  }
  return heroPhotos["partly-cloudy-dense"];
}

export function resolveHeroPhoto({
  weather,
  icon,
  officialSummary,
}: {
  weather: WeatherData;
  icon: WeatherIconName;
  officialSummary?: string | null;
}): HeroPhotoPresentation {
  const hasVisualWeatherSource = Boolean(
    weather.current.icon || weather.hourly[0]?.icon || weather.daily[0]?.icon,
  );
  const conditionText = normalizeText(
    weather.current.condition ?? (!hasVisualWeatherSource ? officialSummary : null),
  );

  if (
    (icon === "cloud" || icon === "partly-cloudy" || icon === "partly-cloudy-night") &&
    /nevoeiro|neblina|nevoa|cerração|cerracao/.test(conditionText)
  ) {
    return heroPhotos.fog;
  }

  if (icon === "rain" || icon === "storm") {
    return heroPhotos.rain;
  }

  const isClearNight =
    icon !== "partly-cloudy-night" &&
    /ceu (aberto|limpo).*noite|noite.*ceu (aberto|limpo)/.test(conditionText);

  if (isClearNight || icon === "moon") {
    return heroPhotos["clear-night"];
  }

  if (icon === "sun") {
    return heroPhotos.clear;
  }

  if (icon === "partly-cloudy") {
    const cloudCover = currentCloudCover(weather);
    const legacy =
      cloudCover !== null && cloudCover >= 50
        ? heroPhotos["partly-cloudy-dense"]
        : heroPhotos["partly-cloudy-light"];
    return partlyCloudyDayPhoto(weather, legacy);
  }

  if (icon === "partly-cloudy-night") {
    return partlyCloudyNightPhoto(weather);
  }

  return heroPhotos.cloudy;
}

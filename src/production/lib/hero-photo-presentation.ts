import type { WeatherData, WeatherIconName } from "@/production/lib/weather-data";

export type HeroPhotoKind =
  | "rain"
  | "storm"
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
  storm: {
    kind: "storm",
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

const partlyCloudyLaranjalDayAlternate = {
  src: "/weather/hero/pelotas-laranjal-parcialmente-nublado-sol-entre-nuvens.png",
  position: "center 50%",
  credit: "Acervo Tempo Pelotas · Praia do Laranjal · sol entre nuvens",
} as const;

const partlyCloudyFimDeTardeAlternate = {
  src: "/weather/hero/pelotas-fim-de-tarde-poucas-nuvens.png",
  position: "center 50%",
  credit: "Acervo Tempo Pelotas · Pelotas · fim de tarde",
} as const;

const partlyCloudyMadrugadaAlternate = {
  src: "/weather/hero/pelotas-madrugada-parcialmente-nublado.png",
  position: "center 50%",
  credit: "Acervo Tempo Pelotas · Pelotas · madrugada",
} as const;

const cloudyMiddayAlternate = {
  src: "/weather/hero/pelotas-meio-dia-nublado.png",
  position: "center 50%",
  credit: "Acervo Tempo Pelotas · Pelotas · meio-dia",
} as const;

const rainNightAlternate = {
  src: "/weather/hero/pelotas-noite-chuva.png",
  position: "center 50%",
  credit: "Acervo Tempo Pelotas · Pelotas · noite",
} as const;

const stormNightAlternate = {
  src: "/weather/hero/pelotas-noite-tempestade.png",
  position: "center 50%",
  credit: "Acervo Tempo Pelotas · Pelotas · noite",
} as const;

const PELOTAS_TIME_ZONE = "America/Sao_Paulo";
const DAY_START_HOUR = 7;
const NIGHT_START_HOUR = 19;
const MADRUGADA_END_HOUR = 7;
const MIDDAY_START_HOUR = 11;
const MIDDAY_END_HOUR = 15;
const FIM_DE_TARDE_START_HOUR = 16;
const FIM_DE_TARDE_END_HOUR = 19;

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

function isNightHour(hour: number | null) {
  return hour !== null && (hour < DAY_START_HOUR || hour >= NIGHT_START_HOUR);
}

function isMiddayHour(hour: number | null) {
  return hour !== null && hour >= MIDDAY_START_HOUR && hour < MIDDAY_END_HOUR;
}

function usesAlternateRotationSlot(weather: WeatherData) {
  const hour = currentPelotasHour(weather);
  return hour !== null && hour % 2 === 0;
}

function partlyCloudyDayRotationSlot(weather: WeatherData) {
  const hour = currentPelotasHour(weather);
  return hour === null ? null : hour % 3;
}

function partlyCloudyDayPhoto(
  weather: WeatherData,
  legacy: HeroPhotoPresentation,
  cloudCover: number | null,
) {
  const hour = currentPelotasHour(weather);
  const isFewCloudsLateAfternoon =
    hour !== null &&
    cloudCover !== null &&
    cloudCover < 50 &&
    hour >= FIM_DE_TARDE_START_HOUR &&
    hour < FIM_DE_TARDE_END_HOUR;

  if (isFewCloudsLateAfternoon) {
    const lateAfternoonSlot = (hour - FIM_DE_TARDE_START_HOUR) % 3;
    if (lateAfternoonSlot === 1) {
      return {
        kind: legacy.kind,
        ...partlyCloudyFimDeTardeAlternate,
      } satisfies HeroPhotoPresentation;
    }
    if (lateAfternoonSlot === 2) {
      return {
        kind: legacy.kind,
        ...partlyCloudyDayAlternate,
      } satisfies HeroPhotoPresentation;
    }
    return legacy;
  }

  const rotationSlot = partlyCloudyDayRotationSlot(weather);
  if (rotationSlot === 1) {
    return {
      kind: legacy.kind,
      ...partlyCloudyDayAlternate,
    } satisfies HeroPhotoPresentation;
  }
  if (rotationSlot === 2) {
    return {
      kind: legacy.kind,
      ...partlyCloudyLaranjalDayAlternate,
    } satisfies HeroPhotoPresentation;
  }
  return legacy;
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

function rainPhoto(weather: WeatherData) {
  if (!isNightHour(currentPelotasHour(weather))) return heroPhotos.rain;
  return {
    kind: "rain",
    ...rainNightAlternate,
  } satisfies HeroPhotoPresentation;
}

function stormPhoto(weather: WeatherData) {
  if (!isNightHour(currentPelotasHour(weather))) return heroPhotos.storm;
  return {
    kind: "storm",
    ...stormNightAlternate,
  } satisfies HeroPhotoPresentation;
}

function cloudyPhoto(weather: WeatherData) {
  const hour = currentPelotasHour(weather);
  if (hour !== null && hour >= 0 && hour < MADRUGADA_END_HOUR) {
    return {
      kind: "cloudy",
      ...partlyCloudyMadrugadaAlternate,
    } satisfies HeroPhotoPresentation;
  }
  if (!isMiddayHour(hour)) return heroPhotos.cloudy;
  return {
    kind: "cloudy",
    ...cloudyMiddayAlternate,
  } satisfies HeroPhotoPresentation;
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

  if (icon === "rain") {
    return rainPhoto(weather);
  }

  if (icon === "storm") {
    return stormPhoto(weather);
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
    return partlyCloudyDayPhoto(weather, legacy, cloudCover);
  }

  if (icon === "partly-cloudy-night") {
    return partlyCloudyNightPhoto(weather);
  }

  return cloudyPhoto(weather);
}

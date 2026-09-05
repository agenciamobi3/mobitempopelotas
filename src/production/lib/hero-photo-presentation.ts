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
    return cloudCover !== null && cloudCover >= 50
      ? heroPhotos["partly-cloudy-dense"]
      : heroPhotos["partly-cloudy-light"];
  }

  if (icon === "partly-cloudy-night") {
    return heroPhotos["partly-cloudy-dense"];
  }

  return heroPhotos.cloudy;
}

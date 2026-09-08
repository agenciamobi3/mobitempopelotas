import type { WeatherCameraData } from "./cameras.types";

export function createUnavailableWeatherCameras(
  warning = "As câmeras estão temporariamente indisponíveis.",
): WeatherCameraData {
  return {
    cameras: [],
    source: {
      name: "Fontes públicas de câmeras",
      url: "/status-dos-dados",
      fetchedAt: new Date().toISOString(),
    },
    warning,
  };
}

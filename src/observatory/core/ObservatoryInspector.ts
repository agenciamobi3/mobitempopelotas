export const OBSERVATORY_INSPECTOR_BOUNDS = {
  south: -35.5,
  north: -28,
  west: -57.5,
  east: -48.5,
} as const;

export type ObservatoryInspectorPoint = {
  latitude: number;
  longitude: number;
};

export type ObservatoryInspectorHour = {
  timestamp: string;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  relativeHumidityPercent: number | null;
  dewPointC: number | null;
  pressureHpa: number | null;
  precipitationProbabilityPercent: number | null;
  precipitationMm: number | null;
  cloudCoverPercent: number | null;
  windSpeedKmh: number | null;
  windGustKmh: number | null;
  windDirectionDegrees: number | null;
};

export function normalizeObservatoryInspectorPoint(
  point: ObservatoryInspectorPoint,
): ObservatoryInspectorPoint | null {
  const { latitude, longitude } = point;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (
    latitude < OBSERVATORY_INSPECTOR_BOUNDS.south ||
    latitude > OBSERVATORY_INSPECTOR_BOUNDS.north ||
    longitude < OBSERVATORY_INSPECTOR_BOUNDS.west ||
    longitude > OBSERVATORY_INSPECTOR_BOUNDS.east
  ) {
    return null;
  }

  return {
    latitude: Number(latitude.toFixed(4)),
    longitude: Number(longitude.toFixed(4)),
  };
}

export function selectObservatoryInspectorHour(
  hours: readonly ObservatoryInspectorHour[],
  referenceAt: string | null,
): ObservatoryInspectorHour | null {
  if (hours.length === 0) return null;

  const requested = Date.parse(referenceAt ?? new Date().toISOString());
  if (!Number.isFinite(requested)) return null;

  let selected: ObservatoryInspectorHour | null = null;
  for (const hour of hours) {
    const timestamp = Date.parse(hour.timestamp);
    if (!Number.isFinite(timestamp)) continue;
    if (timestamp <= requested) selected = hour;
    if (timestamp > requested) break;
  }

  return selected;
}

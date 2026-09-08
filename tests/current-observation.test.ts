import assert from "node:assert/strict";
import test from "node:test";

import type { DefesaCivilHydroStation } from "../src/lib/hydrology/defesa-civil-rs.server.ts";
import {
  PELOTAS_CURRENT_STATION_CODES,
  selectDefesaCivilCurrentStation,
} from "../src/lib/weather/defesa-civil-current.server.ts";
import {
  OBSERVATION_MAX_AGE_MINUTES,
  canUseCurrentObservation,
  deriveObservedCurrent,
  getObservationAgeMinutes,
} from "../src/lib/weather/current-observation.ts";
import type { CurrentWeatherObservation } from "../src/lib/weather/current-observation.types.ts";

function makeCurrentObservation(
  overrides: Partial<CurrentWeatherObservation> = {},
  currentOverrides: Partial<CurrentWeatherObservation["current"]> = {},
): CurrentWeatherObservation {
  const base: CurrentWeatherObservation = {
    status: "live",
    station: {
      code: "DCRS-00039",
      name: "Estação Pelotas",
      basin: "Lagoa dos Patos",
      region: "Sul",
      latitude: -31.77,
      longitude: -52.34,
      altitudeM: 12,
      distanceFromPelotasKm: 3,
    },
    current: {
      temperature: 21.4,
      feelsLike: 20.9,
      humidity: 78,
      dewPoint: null,
      pressure: 1013.5,
      windSpeed: 12.3,
      windGust: 25.8,
      windDirection: "SE",
      windDirectionDegrees: 135,
    },
    rain: {
      h1Mm: 0.4,
      h3Mm: 1.2,
      h6Mm: 2.1,
      h12Mm: 3.3,
      h24Mm: 7.8,
    },
    source: {
      name: "Defesa Civil RS — Rede de Monitoramento Hidrometeorológico",
      url: "https://redehidrometeorologica.defesacivil.rs.gov.br/Mapa",
      documentationUrl: "https://sistemas.defesacivil.rs.gov.br/api-redehidrometeorologica",
      fetchedAt: "2026-09-08T04:20:00.000Z",
      observedAt: "2026-09-08T04:15:00.000Z",
    },
    error: null,
    ...overrides,
  };

  base.current = { ...base.current, ...currentOverrides };
  return base;
}

function makeStation(
  code: string,
  ageMinutes: number,
  distanceFromPelotasKm: number,
  overrides: Partial<DefesaCivilHydroStation> = {},
): DefesaCivilHydroStation {
  return {
    code,
    name: `Estação ${code}`,
    basin: "Lagoa dos Patos",
    region: "Sul",
    latitude: -31.77,
    longitude: -52.34,
    altitudeM: 12,
    distanceFromPelotasKm,
    observedAt: "2026-09-08T04:15:00.000Z",
    ageMinutes,
    freshness: "recent",
    classification: "BOTH",
    capabilities: {
      riverLevel: true,
      rain: true,
      pressure: true,
      humidity: true,
      wind: true,
      temperature: true,
    },
    river: { name: null, levelM: null, trend: null, drainageArea: null },
    rain: {
      h1Mm: 0.4,
      h3Mm: 1.2,
      h6Mm: 2.1,
      h12Mm: 3.3,
      h24Mm: 7.8,
      h48Mm: 10,
      h72Mm: 12,
      h96Mm: 13,
      h120Mm: 14,
      h144Mm: 15,
      h168Mm: 16,
    },
    weather: {
      temperatureC: 21.4,
      apparentTemperatureC: 20.9,
      humidityPct: 78,
      pressureHpa: 1013.5,
      solarRadiationKwhM2: null,
      windAverageKmh: 12.3,
      windMaximumKmh: 25.8,
      windDirectionDeg: 135,
    },
    ...overrides,
  };
}

test("observação válida da Defesa Civil vira Agora sem herdar previsão", () => {
  const observation = makeCurrentObservation();
  const { usable, current, provenance } = deriveObservedCurrent(observation, 10);

  assert.equal(usable, true);
  assert.ok(current);
  assert.equal(current!.temperature, 21);
  assert.equal(current!.condition, null);
  assert.equal(current!.icon, null);
  assert.equal(current!.visibilityKm, null);
  assert.equal(current!.windGust, 26, "rajada medida deve permanecer independente do vento médio");
  assert.equal(provenance.temperature, "defesa-civil-rs");
  assert.equal(provenance.windGust, "defesa-civil-rs");
  assert.equal(provenance.observedAt, "defesa-civil-rs");
});

test("observação indisponível não recebe fallback de modelo no Agora", () => {
  const observation = makeCurrentObservation({ status: "unavailable", error: "timeout" });
  const { usable, current, provenance } = deriveObservedCurrent(observation, null);

  assert.equal(usable, false);
  assert.equal(current, null);
  assert.deepEqual(provenance, {});
});

test("observação acima de 30 minutos não é apresentada como atual", () => {
  const observation = makeCurrentObservation();
  assert.equal(
    canUseCurrentObservation(observation, OBSERVATION_MAX_AGE_MINUTES + 0.1),
    false,
  );
  assert.equal(canUseCurrentObservation(observation, OBSERVATION_MAX_AGE_MINUTES), true);
});

test("idade da observação usa observedAt e não fetchedAt", () => {
  const observation = makeCurrentObservation();
  const age = getObservationAgeMinutes(observation, new Date("2026-09-08T04:25:00.000Z"));
  assert.equal(age, 10);
});

test("selector do Agora aceita somente estações confirmadas em Pelotas", () => {
  assert.deepEqual([...PELOTAS_CURRENT_STATION_CODES], ["DCRS-00039", "DCRS-00062"]);

  const nonPelotas = makeStation("DCRS-00063", 1, 1);
  const pelotas = makeStation("DCRS-00039", 12, 5);
  const selected = selectDefesaCivilCurrentStation([nonPelotas, pelotas]);

  assert.equal(selected?.code, "DCRS-00039");
});

test("selector não cai para outra cidade quando Pelotas está stale", () => {
  const stalePelotas = makeStation("DCRS-00039", 31, 3, { freshness: "delayed" });
  const freshNeighbor = makeStation("DCRS-00063", 2, 2);

  assert.equal(selectDefesaCivilCurrentStation([stalePelotas, freshNeighbor]), null);
});

test("entre estações válidas de Pelotas, a leitura mais recente prevalece", () => {
  const olderNear = makeStation("DCRS-00039", 20, 2);
  const newerFarther = makeStation("DCRS-00062", 5, 8);

  assert.equal(
    selectDefesaCivilCurrentStation([olderNear, newerFarther])?.code,
    "DCRS-00062",
  );
});

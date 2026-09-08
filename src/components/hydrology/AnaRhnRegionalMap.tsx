"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";

import type {
  AnaRhnHydrographyCollection,
  AnaRhnHydrographyData,
} from "@/lib/hydrology/ana-rhn-hydrography.server";
import type { AnaRhnRegionalStation } from "@/lib/hydrology/ana-rhn-regional.server";

import styles from "./AnaRhnRegionalMap.module.css";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const WATER_SOURCE_ID = "ana-rhn-water-bodies";
const WATER_FILL_LAYER_ID = "ana-rhn-water-bodies-fill";
const WATER_LINE_LAYER_ID = "ana-rhn-water-bodies-outline";
const RIVERS_SOURCE_ID = "ana-rhn-rivers";
const RIVERS_LAYER_ID = "ana-rhn-rivers-line";
const RIVERS_LABEL_LAYER_ID = "ana-rhn-rivers-label";
const SOURCE_ID = "ana-rhn-regional-stations";
const LAYER_ID = "ana-rhn-regional-stations-layer";
const PELOTAS_SOURCE_ID = "ana-rhn-pelotas-reference";
const PELOTAS_LAYER_ID = "ana-rhn-pelotas-reference-layer";
const PELOTAS: [number, number] = [-52.3371, -31.7719];

type MapGeoJsonData = Parameters<GeoJSONSource["setData"]>[0];

function asMapGeoJson(collection: AnaRhnHydrographyCollection) {
  return collection as unknown as MapGeoJsonData;
}

function collection(stations: AnaRhnRegionalStation[]) {
  return {
    type: "FeatureCollection" as const,
    features: stations.map((station) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [station.longitude, station.latitude],
      },
      properties: {
        id: station.id,
        code: station.code ?? "Código não informado",
        name: station.name,
        municipality: station.municipality ?? "Município não informado",
        river: station.river ?? station.subBasin ?? station.basin ?? "Curso d'água não informado",
        operating: station.operating === true ? "yes" : station.operating === false ? "no" : "unknown",
      },
    })),
  };
}

function boundsForStations(stations: AnaRhnRegionalStation[]): [[number, number], [number, number]] {
  const longitudes = stations.map((station) => station.longitude).concat(PELOTAS[0]);
  const latitudes = stations.map((station) => station.latitude).concat(PELOTAS[1]);
  return [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ];
}

const pelotasCollection = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: PELOTAS },
      properties: { name: "Pelotas" },
    },
  ],
};

export function AnaRhnRegionalMap({
  stations,
  hydrography,
}: {
  stations: AnaRhnRegionalStation[];
  hydrography: AnaRhnHydrographyData;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const stationCollection = useMemo(() => collection(stations), [stations]);
  const initialCollectionRef = useRef(stationCollection);
  const initialBoundsRef = useRef(boundsForStations(stations));
  const initialHydrographyRef = useRef(hydrography);
  const hasHydrography =
    hydrography.rivers.features.length > 0 || hydrography.waterBodies.features.length > 0;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    let styleLoaded = false;

    void import("maplibre-gl")
      .then((maplibregl) => {
        if (cancelled || !containerRef.current) return;

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          bounds: initialBoundsRef.current,
          fitBoundsOptions: { padding: 48, maxZoom: 9.2 },
          minZoom: 5,
          maxZoom: 14,
          cooperativeGestures: true,
          attributionControl: {},
        });
        mapRef.current = map;
        map.dragRotate.disable();
        map.touchZoomRotate.disableRotation();
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

        map.once("load", () => {
          if (cancelled) return;
          try {
            styleLoaded = true;
            const initialHydrography = initialHydrographyRef.current;

            if (initialHydrography.waterBodies.features.length > 0) {
              map.addSource(WATER_SOURCE_ID, {
                type: "geojson",
                data: asMapGeoJson(initialHydrography.waterBodies),
                attribution: "Massas d'água: ANA / SNIRH",
              });
              map.addLayer({
                id: WATER_FILL_LAYER_ID,
                type: "fill",
                source: WATER_SOURCE_ID,
                paint: {
                  "fill-color": "#17bdcc",
                  "fill-opacity": 0.16,
                },
              });
              map.addLayer({
                id: WATER_LINE_LAYER_ID,
                type: "line",
                source: WATER_SOURCE_ID,
                paint: {
                  "line-color": "#078997",
                  "line-width": 0.8,
                  "line-opacity": 0.48,
                },
              });
            }

            if (initialHydrography.rivers.features.length > 0) {
              map.addSource(RIVERS_SOURCE_ID, {
                type: "geojson",
                data: asMapGeoJson(initialHydrography.rivers),
                attribution: "Rios principais: ANA / SNIRH",
              });
              map.addLayer({
                id: RIVERS_LAYER_ID,
                type: "line",
                source: RIVERS_SOURCE_ID,
                paint: {
                  "line-color": "#087f91",
                  "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.8, 9, 1.6, 13, 2.6],
                  "line-opacity": 0.78,
                },
              });
              map.addLayer({
                id: RIVERS_LABEL_LAYER_ID,
                type: "symbol",
                source: RIVERS_SOURCE_ID,
                minzoom: 7,
                filter: ["all", ["has", "name"], ["!=", ["get", "name"], ""]],
                layout: {
                  "symbol-placement": "line",
                  "text-field": ["get", "name"],
                  "text-size": 10,
                  "text-letter-spacing": 0.02,
                  "text-max-angle": 35,
                },
                paint: {
                  "text-color": "#0b6572",
                  "text-halo-color": "#f8fafc",
                  "text-halo-width": 1.4,
                },
              });

              map.on("click", RIVERS_LAYER_ID, (event) => {
                const feature = event.features?.[0];
                const name = feature?.properties?.name;
                if (typeof name !== "string" || !name.trim()) return;
                new maplibregl.Popup({ closeButton: true, maxWidth: "280px" })
                  .setLngLat(event.lngLat)
                  .setText(name)
                  .addTo(map);
              });
            }

            map.addSource(SOURCE_ID, {
              type: "geojson",
              data: initialCollectionRef.current,
              attribution: "ANA / SNIRH / Rede Hidrometeorológica Nacional",
            });
            map.addLayer({
              id: LAYER_ID,
              type: "circle",
              source: SOURCE_ID,
              paint: {
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 5, 9, 8, 13, 11],
                "circle-color": [
                  "match",
                  ["get", "operating"],
                  "yes",
                  "#5e2ced",
                  "no",
                  "#94a3b8",
                  "#64748b",
                ],
                "circle-opacity": 0.92,
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 2,
              },
            });

            map.addSource(PELOTAS_SOURCE_ID, {
              type: "geojson",
              data: pelotasCollection,
            });
            map.addLayer({
              id: PELOTAS_LAYER_ID,
              type: "circle",
              source: PELOTAS_SOURCE_ID,
              paint: {
                "circle-radius": 7,
                "circle-color": "#17bdcc",
                "circle-stroke-color": "#071e2f",
                "circle-stroke-width": 2,
              },
            });

            map.on("click", LAYER_ID, (event) => {
              const feature = event.features?.[0];
              if (!feature || feature.geometry.type !== "Point") return;
              const coordinates = feature.geometry.coordinates as [number, number];
              const properties = feature.properties as Record<string, unknown>;
              const name = typeof properties.name === "string" ? properties.name : "Estação";
              const municipality =
                typeof properties.municipality === "string"
                  ? properties.municipality
                  : "Município não informado";
              const code =
                typeof properties.code === "string" ? properties.code : "Código não informado";
              const river =
                typeof properties.river === "string"
                  ? properties.river
                  : "Curso d'água não informado";

              new maplibregl.Popup({ closeButton: true, maxWidth: "320px" })
                .setLngLat(coordinates)
                .setText(`${name} · ${municipality} · ${code} · ${river}`)
                .addTo(map);
            });

            map.on("mouseenter", LAYER_ID, () => {
              map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", LAYER_ID, () => {
              map.getCanvas().style.cursor = "";
            });
            if (initialHydrography.rivers.features.length > 0) {
              map.on("mouseenter", RIVERS_LAYER_ID, () => {
                map.getCanvas().style.cursor = "pointer";
              });
              map.on("mouseleave", RIVERS_LAYER_ID, () => {
                map.getCanvas().style.cursor = "";
              });
            }

            setLoaded(true);
          } catch (error) {
            console.warn("Mapa regional ANA/RHN isolado após falha no carregamento:", error);
            setFailed(true);
          }
        });

        map.on("error", () => {
          if (!styleLoaded) setFailed(true);
        });
      })
      .catch((error) => {
        console.warn("MapLibre do inventário ANA/RHN não pôde ser iniciado:", error);
        setFailed(true);
      });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    try {
      const source = mapRef.current.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      source?.setData(stationCollection);

      const riversSource = mapRef.current.getSource(RIVERS_SOURCE_ID) as GeoJSONSource | undefined;
      riversSource?.setData(asMapGeoJson(hydrography.rivers));
      const waterSource = mapRef.current.getSource(WATER_SOURCE_ID) as GeoJSONSource | undefined;
      waterSource?.setData(asMapGeoJson(hydrography.waterBodies));

      if (stations.length > 0) {
        mapRef.current.fitBounds(boundsForStations(stations), {
          padding: 48,
          maxZoom: 9.2,
          duration: 450,
        });
      }
    } catch (error) {
      console.warn("Mapa regional ANA/RHN isolado após falha de atualização:", error);
      setFailed(true);
    }
  }, [hydrography.rivers, hydrography.waterBodies, loaded, stationCollection, stations]);

  return (
    <div className={styles.shell}>
      <div
        ref={containerRef}
        className={styles.map}
        aria-label="Mapa das estações da Rede Hidrometeorológica Nacional, rios principais e massas d'água oficiais próximos de Pelotas"
      />
      <div className={`${styles.loading}${loaded || failed ? ` ${styles.hidden}` : ""}`}>
        <span aria-hidden="true" />
        <strong>Carregando estações da rede nacional</strong>
      </div>
      {failed ? (
        <div className={styles.fallback}>
          <strong>O mapa não pôde ser carregado</strong>
          <span>As estações e seus dados cadastrais continuam disponíveis logo abaixo.</span>
        </div>
      ) : null}
      <div className={styles.caption}>
        <strong>{stations.length} estações no recorte regional</strong>
        <span>
          {hasHydrography
            ? "Estações, rios e massas d’água: ANA / SNIRH · base cartográfica: OpenFreeMap."
            : "Estações: ANA / SNIRH · base cartográfica: OpenFreeMap."}
        </span>
      </div>
    </div>
  );
}

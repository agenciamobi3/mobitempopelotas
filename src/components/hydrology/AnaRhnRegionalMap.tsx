"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";

import type { AnaRhnRegionalStation } from "@/lib/hydrology/ana-rhn-regional.server";

import styles from "./AnaRhnRegionalMap.module.css";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const SOURCE_ID = "ana-rhn-regional-stations";
const LAYER_ID = "ana-rhn-regional-stations-layer";
const PELOTAS_SOURCE_ID = "ana-rhn-pelotas-reference";
const PELOTAS_LAYER_ID = "ana-rhn-pelotas-reference-layer";
const PELOTAS: [number, number] = [-52.3371, -31.7719];

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

export function AnaRhnRegionalMap({ stations }: { stations: AnaRhnRegionalStation[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const stationCollection = useMemo(() => collection(stations), [stations]);
  const initialCollectionRef = useRef(stationCollection);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    let styleLoaded = false;

    void import("maplibre-gl")
      .then((maplibregl) => {
        if (cancelled || !containerRef.current) return;

        const longitudes = stations.map((station) => station.longitude).concat(PELOTAS[0]);
        const latitudes = stations.map((station) => station.latitude).concat(PELOTAS[1]);
        const bounds: [[number, number], [number, number]] = [
          [Math.min(...longitudes), Math.min(...latitudes)],
          [Math.max(...longitudes), Math.max(...latitudes)],
        ];

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          bounds,
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
  }, [stations]);

  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    try {
      const source = mapRef.current.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      source?.setData(stationCollection);

      if (stations.length > 0) {
        const longitudes = stations.map((station) => station.longitude).concat(PELOTAS[0]);
        const latitudes = stations.map((station) => station.latitude).concat(PELOTAS[1]);
        mapRef.current.fitBounds(
          [
            [Math.min(...longitudes), Math.min(...latitudes)],
            [Math.max(...longitudes), Math.max(...latitudes)],
          ],
          { padding: 48, maxZoom: 9.2, duration: 450 },
        );
      }
    } catch (error) {
      console.warn("Mapa regional ANA/RHN isolado após falha de atualização:", error);
      setFailed(true);
    }
  }, [loaded, stationCollection, stations]);

  return (
    <div className={styles.shell}>
      <div
        ref={containerRef}
        className={styles.map}
        aria-label="Mapa das estações da Rede Hidrometeorológica Nacional encontradas próximas de Pelotas"
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
        <span>Pontos: ANA / SNIRH · base cartográfica: OpenFreeMap.</span>
      </div>
    </div>
  );
}

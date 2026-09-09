"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";

import type { RedemetStormFrame, RedemetStormPoint } from "@/lib/redemet/redemet.types";

import styles from "./StormMapFrame.module.css";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const STORM_SOURCE_ID = "redemet-storm-points";
const STORM_LAYER_ID = "redemet-storm-points-layer";
const PELOTAS_COORDINATES: [number, number] = [-52.3376, -31.7654];
const REGIONAL_BOUNDS: [[number, number], [number, number]] = [
  [-57.7, -36.2],
  [-46.8, -27.2],
];

function stormGeoJson(points: RedemetStormPoint[]) {
  return {
    type: "FeatureCollection" as const,
    features: points.map((point, index) => ({
      type: "Feature" as const,
      id: index,
      properties: {},
      geometry: {
        type: "Point" as const,
        coordinates: [point.longitude, point.latitude],
      },
    })),
  };
}

export function StormMapFrame({ frame }: { frame: RedemetStormFrame }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);
  const frameRef = useRef(frame);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  frameRef.current = frame;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    void import("maplibre-gl")
      .then((maplibregl) => {
        if (cancelled || !containerRef.current) return;

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          bounds: REGIONAL_BOUNDS,
          fitBoundsOptions: { padding: 24, maxZoom: 5.2 },
          minZoom: 3,
          maxZoom: 10,
          cooperativeGestures: true,
          attributionControl: {},
        });

        mapRef.current = map;
        map.dragRotate.disable();
        map.touchZoomRotate.disableRotation();
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

        map.once("load", () => {
          if (cancelled) return;

          map.addSource(STORM_SOURCE_ID, {
            type: "geojson",
            data: stormGeoJson(frameRef.current.points),
          });

          const firstSymbolLayer = map.getStyle().layers?.find((layer) => layer.type === "symbol")?.id;
          map.addLayer(
            {
              id: STORM_LAYER_ID,
              type: "circle",
              source: STORM_SOURCE_ID,
              paint: {
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 4, 7, 7],
                "circle-color": "#5e2ced",
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 1.5,
                "circle-opacity": 0.86,
              },
            },
            firstSymbolLayer,
          );

          const markerElement = document.createElement("div");
          markerElement.className = styles.pelotasMarker;
          const markerDot = document.createElement("i");
          markerDot.setAttribute("aria-hidden", "true");
          const markerLabel = document.createElement("span");
          markerLabel.textContent = "Pelotas";
          markerElement.append(markerDot, markerLabel);
          markerRef.current = new maplibregl.Marker({ element: markerElement, anchor: "left" })
            .setLngLat(PELOTAS_COORDINATES)
            .addTo(map);

          setMapLoaded(true);
        });

        map.on("error", () => setFailed(true));
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || failed) return;
    const source = mapRef.current.getSource(STORM_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(stormGeoJson(frame.points));
  }, [failed, frame, mapLoaded]);

  return (
    <div className={styles.shell} data-map-ready={mapLoaded && !failed}>
      <div
        ref={containerRef}
        className={`${styles.map}${failed ? ` ${styles.hidden}` : ""}`}
        role="region"
        aria-label={`Mapa regional da coleta de atividade elétrica com ${frame.points.length} ${frame.points.length === 1 ? "ocorrência" : "ocorrências"} recebidas.`}
      />

      {!failed && !mapLoaded ? (
        <div className={styles.loading} aria-live="polite">
          <span aria-hidden="true" />
          <strong>Carregando mapa da atividade elétrica</strong>
        </div>
      ) : null}

      {failed ? (
        <div className={styles.fallback} role="status">
          <strong>Mapa temporariamente indisponível</strong>
          <span>A contagem e o horário da coleta continuam válidos.</span>
        </div>
      ) : mapLoaded && frame.points.length === 0 ? (
        <div className={styles.empty} role="status">
          Nenhum raio detectado nesta coleta.
        </div>
      ) : null}

      {mapLoaded && !failed ? (
        <div className={styles.caption}>
          <strong>Ocorrências recebidas pela STSC</strong>
          <span>Pelotas marcada apenas como referência geográfica.</span>
        </div>
      ) : null}
    </div>
  );
}

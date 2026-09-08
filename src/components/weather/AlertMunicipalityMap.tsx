"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

import type { InmetAlert } from "@/lib/weather/official-sources.types";

import styles from "./AlertMunicipalityMap.module.css";

const PELOTAS: [number, number] = [-52.3376, -31.7654];
const SOURCE_ID = "featured-alert-city";
const LAYER_ID = "featured-alert-city-layer";
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

function broaderAreaLabel(alert: InmetAlert) {
  const places = alert.municipalities.length ? alert.municipalities : alert.areas;
  if (!places.length) {
    return alert.relevance === "regional"
      ? "O aviso foi classificado como regional, sem lista territorial detalhada disponível."
      : "O aviso foi classificado como estadual, sem lista territorial detalhada disponível.";
  }

  const visible = places.slice(0, 8);
  const remaining = places.length - visible.length;
  return remaining > 0 ? `${visible.join(", ")} e mais ${remaining}` : visible.join(", ");
}

export function AlertMunicipalityMap({ alert }: { alert: InmetAlert }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const includesPelotas = alert.relevance === "pelotas";

  useEffect(() => {
    if (!includesPelotas || !containerRef.current || mapRef.current) return;
    let cancelled = false;

    void import("maplibre-gl")
      .then((maplibregl) => {
        if (cancelled || !containerRef.current) return;
        const map = new maplibregl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          center: PELOTAS,
          zoom: 7.2,
          minZoom: 5,
          maxZoom: 12,
          cooperativeGestures: true,
          attributionControl: {},
        });
        mapRef.current = map;
        map.dragRotate.disable();
        map.touchZoomRotate.disableRotation();
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
        map.once("load", () => {
          if (cancelled) return;
          map.addSource(SOURCE_ID, {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: { name: "Pelotas" },
                  geometry: { type: "Point", coordinates: PELOTAS },
                },
              ],
            },
          });
          map.addLayer({
            id: LAYER_ID,
            type: "circle",
            source: SOURCE_ID,
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 12, 9, 22],
              "circle-color":
                alert.severity === "great-danger"
                  ? "#b91c1c"
                  : alert.severity === "danger"
                    ? "#f27035"
                    : "#eab308",
              "circle-opacity": 0.32,
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 3,
            },
          });
          setLoaded(true);
        });
        map.on("error", () => setFailed(true));
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [alert.severity, includesPelotas]);

  if (!includesPelotas) {
    return (
      <div className={`${styles.shell} ${styles.broader}`} role="note">
        <div className={styles.broaderContent}>
          <span>{alert.relevance === "regional" ? "Abrangência regional" : "Abrangência estadual"}</span>
          <strong>Pelotas não foi marcada diretamente neste aviso</strong>
          <p>{broaderAreaLabel(alert)}</p>
          <small>
            O portal não desenha uma área no mapa sem geometria oficial suficiente. Confira a lista
            territorial e o aviso original antes de interpretar a abrangência local.
          </small>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <div
        ref={containerRef}
        className={styles.map}
        aria-label="Mapa de referência com a localização de Pelotas para o aviso"
      />
      <div className={`${styles.loading}${loaded || failed ? ` ${styles.hidden}` : ""}`}>
        <span aria-hidden="true" />
        <strong>Carregando mapa de referência</strong>
      </div>
      {failed ? (
        <div className={styles.fallback}>
          <strong>Pelotas está citada diretamente no aviso</strong>
          <span>O mapa não pôde ser carregado, mas os dados territoriais continuam disponíveis.</span>
        </div>
      ) : null}
      <div className={styles.caption}>
        <strong>Pelotas citada no aviso</strong>
        <span>
          {alert.areas[0] || alert.municipalities[0] || "Abrangência municipal informada pelo INMET"}
        </span>
        <small>O ponto no mapa é referência de localização e não representa o limite total do aviso.</small>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";

import { regionalCityPath, type RegionalCityGroup } from "@/lib/regional-cities";
import type { RegionalCityOverviewItem } from "@/lib/weather/regional-cities-overview.types";

import "./RegionalCitiesMap.css";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const DEFAULT_CENTER: [number, number] = [-53.15, -32.05];

const GROUP_CLASS: Record<RegionalCityGroup, string> = {
  "Pelotas e entorno": "pelotas",
  "Costa Doce": "costa",
  "Fronteira Sul": "fronteira",
  Campanha: "campanha",
};

type RegionalCitiesMapProps = {
  items: RegionalCityOverviewItem[];
};

type MapLibreModule = typeof import("maplibre-gl");

function markerLabel(item: RegionalCityOverviewItem) {
  const temperature =
    item.temperature === null ? "temperatura indisponível" : `${item.temperature} graus`;
  return `${item.city.name}: ${temperature}, ${item.condition}. Abrir previsão local.`;
}

function createMarkerElement(item: RegionalCityOverviewItem) {
  const link = document.createElement("a");
  link.className = `regional-overview-map__marker is-${GROUP_CLASS[item.city.group]}`;
  link.href = regionalCityPath(item.city);
  link.setAttribute("aria-label", markerLabel(item));
  link.title = `${item.city.name} · ${item.temperature === null ? "—" : `${item.temperature}°`} · ${item.condition}`;

  const temperature = document.createElement("strong");
  temperature.textContent = item.temperature === null ? "—" : `${item.temperature}°`;

  const city = document.createElement("span");
  city.textContent = item.city.name;

  link.append(temperature, city);
  return link;
}

function itemBounds(items: RegionalCityOverviewItem[]) {
  if (items.length === 0) return null;

  let minLongitude = items[0]!.city.longitude;
  let maxLongitude = minLongitude;
  let minLatitude = items[0]!.city.latitude;
  let maxLatitude = minLatitude;

  for (const item of items.slice(1)) {
    minLongitude = Math.min(minLongitude, item.city.longitude);
    maxLongitude = Math.max(maxLongitude, item.city.longitude);
    minLatitude = Math.min(minLatitude, item.city.latitude);
    maxLatitude = Math.max(maxLatitude, item.city.latitude);
  }

  return [
    [minLongitude, minLatitude],
    [maxLongitude, maxLatitude],
  ] as [[number, number], [number, number]];
}

function fitMapToItems(map: MapLibreMap, items: RegionalCityOverviewItem[], animate: boolean) {
  if (items.length === 0) return;

  if (items.length === 1) {
    map.easeTo({
      center: [items[0]!.city.longitude, items[0]!.city.latitude],
      zoom: 7.2,
      duration: animate ? 450 : 0,
    });
    return;
  }

  const bounds = itemBounds(items);
  if (!bounds) return;

  map.fitBounds(bounds, {
    padding: { top: 62, right: 62, bottom: 62, left: 62 },
    maxZoom: 7,
    duration: animate ? 450 : 0,
  });
}

function FallbackCityNavigation({ items }: RegionalCitiesMapProps) {
  return (
    <nav
      className="regional-overview-map__fallback"
      aria-label="Navegação alternativa pelas cidades do mapa"
    >
      <div>
        <strong>Mapa indisponível no momento</strong>
        <span>Use esta lista para abrir as mesmas cidades pelo teclado ou leitor de tela.</span>
      </div>
      {items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={item.city.slug}>
              <a href={regionalCityPath(item.city)} aria-label={markerLabel(item)}>
                <strong>{item.city.name}</strong>
                <span>
                  {item.temperature === null ? "—" : `${item.temperature}°`} · {item.condition}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhuma cidade corresponde aos filtros atuais.</p>
      )}
    </nav>
  );
}

export function RegionalCitiesMap({ items }: RegionalCitiesMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const maplibreRef = useRef<MapLibreModule | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const initializingRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || initializingRef.current) return;

    let cancelled = false;
    initializingRef.current = true;

    const initialize = async () => {
      try {
        const maplibregl = await import("maplibre-gl");
        if (cancelled || !mapContainerRef.current) return;
        maplibreRef.current = maplibregl;

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: MAP_STYLE,
          center: DEFAULT_CENTER,
          zoom: 4.7,
          minZoom: 4,
          maxZoom: 11,
          cooperativeGestures: true,
          attributionControl: true,
        });
        mapRef.current = map;

        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        map.on("load", () => {
          if (cancelled) return;
          setHasError(false);
          setIsLoaded(true);
        });
        map.on("error", () => {
          if (!cancelled && !map.loaded()) setHasError(true);
        });
      } catch {
        if (!cancelled) setHasError(true);
      } finally {
        initializingRef.current = false;
      }
    };

    void initialize();

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      maplibreRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreRef.current;
    if (!map || !maplibregl || !isLoaded) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = items.map((item) =>
      new maplibregl.Marker({
        element: createMarkerElement(item),
        anchor: "center",
      })
        .setLngLat([item.city.longitude, item.city.latitude])
        .addTo(map),
    );

    fitMapToItems(map, items, true);
  }, [isLoaded, items]);

  return (
    <section
      className="regional-overview-map"
      id="regional-city-map"
      aria-labelledby="regional-map-title"
    >
      <header className="regional-overview-map__header">
        <div>
          <span>Mapa regional</span>
          <h2 id="regional-map-title">24 cidades em uma leitura espacial</h2>
          <p>
            Os pontos usam o mesmo resumo meteorológico da lista. Clique em uma cidade para abrir
            sua previsão local; a busca e os filtros acima também ajustam o enquadramento do mapa.
          </p>
        </div>
        <strong aria-live="polite">{items.length} visíveis</strong>
      </header>

      <div className="regional-overview-map__frame">
        <div
          ref={mapContainerRef}
          className="regional-overview-map__canvas"
          role="region"
          aria-hidden={hasError}
          aria-label={`Mapa com ${items.length} cidades visíveis da Região Sul do Rio Grande do Sul`}
        />
        {!isLoaded && !hasError ? (
          <div className="regional-overview-map__state" aria-live="polite">
            Carregando mapa regional…
          </div>
        ) : null}
        {hasError ? <FallbackCityNavigation items={items} /> : null}
      </div>

      <footer className="regional-overview-map__footer">
        <div className="regional-overview-map__legend" aria-label="Agrupamentos regionais">
          <span className="is-pelotas">Pelotas e entorno</span>
          <span className="is-costa">Costa Doce</span>
          <span className="is-fronteira">Fronteira Sul</span>
          <span className="is-campanha">Campanha</span>
        </div>
        <small>Temperaturas: estimativa Open-Meteo · mapa-base: OpenFreeMap</small>
      </footer>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";

import type { RegionalCityOverviewItem } from "@/lib/weather/regional-cities-overview.types";

import "./RegionalCitiesMapDeferred.css";

type RegionalCitiesMapDeferredProps = {
  items: RegionalCityOverviewItem[];
};

type RegionalMapComponent = ComponentType<RegionalCitiesMapDeferredProps>;

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
  };
};

function observerMargin() {
  const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true;
  if (saveData) return "0px";
  return window.matchMedia("(max-width: 760px)").matches ? "80px 0px" : "180px 0px";
}

export function RegionalCitiesMapDeferred({ items }: RegionalCitiesMapDeferredProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [MapComponent, setMapComponent] = useState<RegionalMapComponent | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || MapComponent) return;

    let cancelled = false;
    let observer: IntersectionObserver | null = null;

    const loadMap = () => {
      if (cancelled || MapComponent) return;
      observer?.disconnect();
      observer = null;
      void import("./RegionalCitiesMap").then((module) => {
        if (!cancelled) setMapComponent(() => module.RegionalCitiesMap);
      });
    };

    if (typeof IntersectionObserver === "undefined") {
      loadMap();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) loadMap();
        },
        { rootMargin: observerMargin() },
      );
      observer.observe(sentinel);
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [MapComponent]);

  return (
    <div ref={sentinelRef} className="regional-map-deferred">
      {MapComponent ? (
        <MapComponent items={items} />
      ) : (
        <section
          className="regional-map-deferred__placeholder"
          aria-label="Mapa regional carregado sob demanda"
        >
          <div>
            <span>Mapa regional</span>
            <strong>O mapa será carregado quando entrar na área visível.</strong>
            <small>
              A lista e os dados das cidades têm prioridade; o mapa interativo é carregado depois
              para reduzir o custo inicial, especialmente em celulares.
            </small>
          </div>
        </section>
      )}
    </div>
  );
}

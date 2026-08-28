"use client";

import {
  Component,
  useEffect,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";

import type { RegionalCityOverviewItem } from "@/lib/weather/regional-cities-overview.types";

import { RegionalCitiesMap } from "./RegionalCitiesMap";
import "./RegionalCitiesMapDeferred.css";
import "./RegionalCitiesMapFallback.css";

type RegionalCitiesMapDeferredProps = {
  items: RegionalCityOverviewItem[];
};

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
  };
};

type RegionalMapErrorBoundaryProps = {
  children: ReactNode;
};

type RegionalMapErrorBoundaryState = {
  failed: boolean;
};

function observerMargin() {
  const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true;
  if (saveData) return "0px";
  return window.matchMedia("(max-width: 760px)").matches ? "80px 0px" : "180px 0px";
}

function RegionalMapFallback() {
  return (
    <section
      className="regional-map-deferred__placeholder"
      aria-label="Mapa regional temporariamente indisponível"
      role="status"
    >
      <div>
        <span>Mapa regional</span>
        <strong>A lista de cidades continua disponível.</strong>
        <small>
          O mapa interativo não pôde ser aberto neste navegador agora. Use a lista logo abaixo para
          consultar as mesmas cidades sem interromper a página.
        </small>
      </div>
    </section>
  );
}

class RegionalMapErrorBoundary extends Component<
  RegionalMapErrorBoundaryProps,
  RegionalMapErrorBoundaryState
> {
  state: RegionalMapErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): RegionalMapErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("Mapa regional isolado após falha local:", error, info.componentStack);
  }

  render() {
    return this.state.failed ? <RegionalMapFallback /> : this.props.children;
  }
}

export function RegionalCitiesMapDeferred({ items }: RegionalCitiesMapDeferredProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || shouldRenderMap) return;

    let observer: IntersectionObserver | null = null;

    const showMap = () => {
      observer?.disconnect();
      observer = null;
      setShouldRenderMap(true);
    };

    if (typeof IntersectionObserver === "undefined") {
      showMap();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) showMap();
        },
        { rootMargin: observerMargin() },
      );
      observer.observe(sentinel);
    }

    return () => observer?.disconnect();
  }, [shouldRenderMap]);

  return (
    <div ref={sentinelRef} className="regional-map-deferred">
      {shouldRenderMap ? (
        <RegionalMapErrorBoundary>
          <RegionalCitiesMap items={items} />
        </RegionalMapErrorBoundary>
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

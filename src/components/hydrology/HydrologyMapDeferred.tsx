"use client";

import { Component, useState, type ErrorInfo, type ReactNode } from "react";
import { MapPinned } from "lucide-react";

import "./HydrologyMapDeferred.css";

type HydrologyMapDeferredProps = {
  label: string;
  title: string;
  description: string;
  fallbackDescription: string;
  children: ReactNode;
};

type HydrologyMapErrorBoundaryProps = {
  label: string;
  fallbackDescription: string;
  children: ReactNode;
};

type HydrologyMapErrorBoundaryState = {
  failed: boolean;
};

function HydrologyMapFallback({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <div className="hydrology-map-deferred__placeholder is-fallback" role="status">
      <MapPinned aria-hidden="true" />
      <div>
        <span>{label}</span>
        <strong>O mapa interativo não pôde ser aberto.</strong>
        <small>{description}</small>
      </div>
    </div>
  );
}

class HydrologyMapErrorBoundary extends Component<
  HydrologyMapErrorBoundaryProps,
  HydrologyMapErrorBoundaryState
> {
  state: HydrologyMapErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): HydrologyMapErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("Mapa hidrológico isolado após falha local:", error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <HydrologyMapFallback
          label={this.props.label}
          description={this.props.fallbackDescription}
        />
      );
    }
    return this.props.children;
  }
}

export function HydrologyMapDeferred({
  label,
  title,
  description,
  fallbackDescription,
  children,
}: HydrologyMapDeferredProps) {
  const [requested, setRequested] = useState(false);

  if (requested) {
    return (
      <HydrologyMapErrorBoundary label={label} fallbackDescription={fallbackDescription}>
        {children}
      </HydrologyMapErrorBoundary>
    );
  }

  return (
    <div className="hydrology-map-deferred__placeholder" role="region" aria-label={label}>
      <MapPinned aria-hidden="true" />
      <div>
        <span>{label}</span>
        <strong>{title}</strong>
        <small>{description}</small>
        <button type="button" onClick={() => setRequested(true)}>
          Carregar mapa
        </button>
      </div>
    </div>
  );
}

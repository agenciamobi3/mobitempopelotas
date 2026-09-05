"use client";

import { AlertTriangle } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

type HydrologySectionBoundaryProps = {
  label: string;
  children: ReactNode;
};

type HydrologySectionBoundaryState = {
  failed: boolean;
};

class HydrologySectionErrorBoundary extends Component<
  HydrologySectionBoundaryProps,
  HydrologySectionBoundaryState
> {
  state: HydrologySectionBoundaryState = { failed: false };

  static getDerivedStateFromError(): HydrologySectionBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn(`Seção hidrológica isolada após falha local (${this.props.label}):`, error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <section className="hydrology-v2-unavailable" role="status" aria-label={`${this.props.label} temporariamente indisponível`}>
        <AlertTriangle aria-hidden="true" />
        <div>
          <strong>{this.props.label} não pôde ser exibida nesta atualização</strong>
          <p>
            A falha ficou isolada nesta fonte. As demais medições e informações da situação das águas
            continuam disponíveis na página.
          </p>
        </div>
      </section>
    );
  }
}

export function HydrologySectionBoundary({ label, children }: HydrologySectionBoundaryProps) {
  return (
    <HydrologySectionErrorBoundary label={label}>
      {children}
    </HydrologySectionErrorBoundary>
  );
}

import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import "./RouteLoadingOverlay.css";

const SHOW_DELAY_MS = 190;
const MIN_VISIBLE_MS = 280;

export function RouteLoadingOverlay() {
  const isLoading = useRouterState({ select: (state) => state.isLoading });
  const [visible, setVisible] = useState(false);
  const hasSettledInitialLoadRef = useRef(!isLoading);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleSinceRef = useRef<number | null>(null);

  useEffect(() => {
    const clearShowTimer = () => {
      if (showTimerRef.current !== null) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
    };
    const clearHideTimer = () => {
      if (hideTimerRef.current !== null) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    if (!hasSettledInitialLoadRef.current) {
      if (!isLoading) hasSettledInitialLoadRef.current = true;
      return () => {
        clearShowTimer();
        clearHideTimer();
      };
    }

    if (isLoading) {
      clearHideTimer();
      if (!visible && showTimerRef.current === null) {
        showTimerRef.current = setTimeout(() => {
          showTimerRef.current = null;
          visibleSinceRef.current = performance.now();
          setVisible(true);
        }, SHOW_DELAY_MS);
      }
    } else {
      clearShowTimer();
      if (visible) {
        const shownAt = visibleSinceRef.current ?? performance.now();
        const elapsed = performance.now() - shownAt;
        const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
        clearHideTimer();
        hideTimerRef.current = setTimeout(() => {
          hideTimerRef.current = null;
          visibleSinceRef.current = null;
          setVisible(false);
        }, remaining);
      }
    }

    return () => {
      clearShowTimer();
      clearHideTimer();
    };
  }, [isLoading, visible]);

  return (
    <div
      className="route-loading-overlay"
      data-visible={visible ? "true" : "false"}
      aria-hidden={!visible}
      onWheel={visible ? (event) => event.preventDefault() : undefined}
      onTouchMove={visible ? (event) => event.preventDefault() : undefined}
    >
      <div className="route-loading-overlay__content" role="status" aria-live="polite" aria-busy={visible}>
        <img
          className="route-loading-overlay__logo"
          src="/brand/tempo-pelotas-purple.svg"
          alt="Tempo Pelotas"
          width={344}
          height={50}
          decoding="async"
          draggable={false}
        />
        <p>Carregando...</p>
        <span className="route-loading-overlay__progress" aria-hidden="true">
          <i />
        </span>
      </div>
    </div>
  );
}

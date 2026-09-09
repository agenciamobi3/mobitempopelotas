import { useEffect, useState } from "react";

import { getRedemetOverview } from "@/lib/redemet/redemet.functions";
import type {
  RedemetImageLayerResponse,
  RedemetOverview,
  RedemetStormLayerResponse,
} from "@/lib/redemet/redemet.types";

type RedemetLayer = RedemetImageLayerResponse | RedemetStormLayerResponse;

function hasFrames(layer: RedemetLayer) {
  return layer.available && layer.frames.length > 0;
}

export function hasPrimaryRedemetCollections(data: RedemetOverview) {
  return hasFrames(data.radar) && hasFrames(data.satellite) && hasFrames(data.storms);
}

function chooseLayer<T extends RedemetLayer>(baseline: T, recovered: T): T {
  if (recovered.frames.length > 0) return recovered;
  if (baseline.frames.length > 0) return baseline;
  return recovered;
}

export function mergeRedemetOverview(
  baseline: RedemetOverview,
  recovered: RedemetOverview,
): RedemetOverview {
  return {
    radar: chooseLayer(baseline.radar, recovered.radar),
    satellite: chooseLayer(baseline.satellite, recovered.satellite),
    inmetSatellite: chooseLayer(baseline.inmetSatellite, recovered.inmetSatellite),
    storms: chooseLayer(baseline.storms, recovered.storms),
  };
}

function runServerRecovery<T>(run: () => Promise<T>) {
  return Promise.resolve().then(run);
}

/**
 * O documento público continua com teto curto no SSR. Depois da hidratação,
 * quando radar, satélite selecionado ou STSC não chegaram dentro desse teto,
 * fazemos uma única consulta completa ao backend e aproveitamos as coletas que
 * terminarem depois. O antigo painel INMET complementar deixou de ser uma
 * coleção pública obrigatória, portanto sua ausência isolada não força recovery.
 * Uma coleta já recebida nunca é apagada por uma tentativa posterior vazia.
 */
export function useRedemetOverviewBrowserRecovery(baseline: RedemetOverview) {
  const [data, setData] = useState(baseline);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    let active = true;
    setData(baseline);

    if (hasPrimaryRedemetCollections(baseline)) {
      setIsRecovering(false);
      return () => {
        active = false;
      };
    }

    setIsRecovering(true);
    void runServerRecovery(() => getRedemetOverview())
      .then((recovered) => {
        if (!active) return;
        setData((current) => mergeRedemetOverview(current, recovered));
      })
      .catch(() => {
        // A página permanece utilizável com as coletas que já chegaram no SSR.
      })
      .finally(() => {
        if (active) setIsRecovering(false);
      });

    return () => {
      active = false;
    };
  }, [baseline]);

  return { data, isRecovering };
}

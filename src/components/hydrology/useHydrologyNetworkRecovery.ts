import { useEffect, useState } from "react";

import { getDefesaCivilHydroData } from "@/lib/hydrology/defesa-civil-rs.functions";
import type { DefesaCivilHydroData } from "@/lib/hydrology/defesa-civil-rs.server";
import { getSaceGuaibaData } from "@/lib/hydrology/sace-guaiba.functions";
import type { SaceGuaibaData } from "@/lib/hydrology/sace-guaiba.server";

function canReplaceSace(data: SaceGuaibaData) {
  return data.status === "live" || data.status === "partial";
}

function canReplaceDefesaCivil(data: DefesaCivilHydroData) {
  return data.status === "live" || data.status === "partial" || data.status === "disabled";
}

export function useHydrologyNetworkRecovery(
  baselineSace: SaceGuaibaData,
  baselineDefesaCivil: DefesaCivilHydroData,
) {
  const [sace, setSace] = useState(baselineSace);
  const [defesaCivil, setDefesaCivil] = useState(baselineDefesaCivil);

  useEffect(() => {
    let active = true;
    setSace(baselineSace);

    if (baselineSace.status !== "unavailable") {
      return () => {
        active = false;
      };
    }

    void getSaceGuaibaData()
      .then((nextData) => {
        if (!active || !canReplaceSace(nextData)) return;
        setSace(nextData);
      })
      .catch(() => {
        // A página preserva o fallback inicial sem transformar falha de integração em normalidade.
      });

    return () => {
      active = false;
    };
  }, [baselineSace]);

  useEffect(() => {
    let active = true;
    setDefesaCivil(baselineDefesaCivil);

    if (baselineDefesaCivil.status !== "unavailable") {
      return () => {
        active = false;
      };
    }

    void getDefesaCivilHydroData()
      .then((nextData) => {
        if (!active || !canReplaceDefesaCivil(nextData)) return;
        setDefesaCivil(nextData);
      })
      .catch(() => {
        // A recuperação é independente; falha aqui não afeta SACE, meteorologia ou demais blocos.
      });

    return () => {
      active = false;
    };
  }, [baselineDefesaCivil]);

  return { sace, defesaCivil };
}

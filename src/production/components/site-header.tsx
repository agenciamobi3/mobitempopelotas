"use client";

import { useEffect } from "react";

import { HomeEditorialHeader } from "@/production/components/home-editorial-header";
import type { InmetAlertSeverity } from "@/production/lib/inmet-alerts";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

type SiteHeaderProps = {
  advisoryLevel?: AdvisoryLevel;
  officialAlertSeverity?: InmetAlertSeverity;
  variant?: "default" | "hero";
};

/**
 * Mantém o foco do teclado previsível ao fechar um painel do header com Escape.
 *
 * O HomeEditorialHeader é responsável por alterar o estado aberto/fechado. Este
 * guard observa onde o foco estava antes do fechamento e, no frame seguinte,
 * devolve-o ao controle que possui aria-controls para aquele painel. Assim um
 * link dentro de um painel que acabou de receber `hidden` não permanece como
 * elemento ativo invisível.
 */
function HeaderEscapeFocusRestorer() {
  useEffect(() => {
    const restoreFocus = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      const activeElement = document.activeElement;
      if (!(activeElement instanceof HTMLElement)) return;

      const controlledPanel = activeElement.closest<HTMLElement>(
        '#tp-mobile-menu, [id^="tp-mega-"]',
      );
      if (!controlledPanel?.id) return;

      const controller = document.querySelector<HTMLElement>(
        `[aria-controls="${controlledPanel.id}"]`,
      );
      if (!controller) return;

      window.requestAnimationFrame(() => {
        controller.focus({ preventScroll: true });
      });
    };

    document.addEventListener("keydown", restoreFocus, true);
    return () => document.removeEventListener("keydown", restoreFocus, true);
  }, []);

  return null;
}

/**
 * Header público único do Tempo Pelotas.
 *
 * A Home passou a ser a fonte visual do cabeçalho do portal; páginas internas,
 * dedicadas e institucionais reutilizam exatamente a mesma composição para
 * evitar duas identidades de navegação concorrentes. `variant` é preservado
 * apenas por compatibilidade com chamadas existentes.
 */
export function SiteHeader({
  advisoryLevel = "normal",
  officialAlertSeverity = "unknown",
}: SiteHeaderProps) {
  return (
    <>
      <HeaderEscapeFocusRestorer />
      <HomeEditorialHeader
        advisoryLevel={advisoryLevel}
        officialAlertSeverity={officialAlertSeverity}
      />
    </>
  );
}

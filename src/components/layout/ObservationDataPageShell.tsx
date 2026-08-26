import type { ReactNode } from "react";

import { PORTAL_FOOTER_SOURCE } from "@/components/layout/footer-source";
import { SiteFooter } from "@/production/components/site-footer";
import { SiteHeader } from "@/production/components/site-header";

type ObservationDataPageShellProps = {
  children: ReactNode;
  pageClassName?: string;
};

/**
 * Shell para páginas de observação de dados meteorológicos.
 *
 * Diferente do WeatherShell, não pressupõe previsão, alertas ou experiência
 * operacional de tempo. Ele é destinado a estações, sensores e painéis de
 * observação que possuem seus próprios módulos de dados.
 */
export function ObservationDataPageShell({
  children,
  pageClassName = "",
}: ObservationDataPageShellProps) {
  return (
    <div className={["site-shell", "site-shell--observation", pageClassName].filter(Boolean).join(" ")}>
      <SiteHeader variant="default" />
      <main id="conteudo-principal" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter source={PORTAL_FOOTER_SOURCE} />
    </div>
  );
}

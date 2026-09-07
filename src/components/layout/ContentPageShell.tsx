import type { ReactNode } from "react";

import {
  HistoricalCollaborationPrompt,
  HistoricalCollaborationSection,
} from "@/components/history/HistoricalCollaboration";
import { PORTAL_FOOTER_SOURCE } from "@/components/layout/footer-source";
import type { HistoricalCollaborationContext } from "@/lib/history/historical-collaboration";
import { SiteFooter } from "@/production/components/site-footer";
import { SiteHeader } from "@/production/components/site-header";

import "./InternalWeatherPageShell.css";

type ContentPageShellProps = {
  children: ReactNode;
  pageClassName?: string;
  historicalCollaboration?: HistoricalCollaborationContext;
  showHistoricalCollaborationPrompt?: boolean;
};

/**
 * Shell leve para páginas institucionais/editoriais.
 * Não carrega inteligência meteorológica, alertas, mapas ou dados de clima.
 */
export function ContentPageShell({
  children,
  pageClassName = "",
  historicalCollaboration,
  showHistoricalCollaborationPrompt = true,
}: ContentPageShellProps) {
  return (
    <div className={["site-shell", "site-shell--content", pageClassName].filter(Boolean).join(" ")}>
      <SiteHeader variant="default" />
      <main id="conteudo-principal" tabIndex={-1}>
        {historicalCollaboration && showHistoricalCollaborationPrompt ? (
          <HistoricalCollaborationPrompt context={historicalCollaboration} />
        ) : null}
        {children}
        {historicalCollaboration ? (
          <HistoricalCollaborationSection context={historicalCollaboration} />
        ) : null}
      </main>
      <SiteFooter source={PORTAL_FOOTER_SOURCE} />
    </div>
  );
}

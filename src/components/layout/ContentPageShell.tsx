import type { ReactNode } from "react";

import { SiteFooter } from "@/production/components/site-footer";
import { SiteHeader } from "@/production/components/site-header";

import "./InternalWeatherPageShell.css";

type ContentPageShellProps = {
  children: ReactNode;
  pageClassName?: string;
};

/**
 * Shell leve para páginas institucionais/editoriais.
 * Não carrega inteligência meteorológica, alertas, mapas ou dados de clima.
 */
export function ContentPageShell({ children, pageClassName = "" }: ContentPageShellProps) {
  return (
    <div className={["site-shell", "site-shell--content", pageClassName].filter(Boolean).join(" ")}>
      <SiteHeader variant="default" />
      <main id="conteudo-principal" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter source="Tempo Pelotas" />
    </div>
  );
}

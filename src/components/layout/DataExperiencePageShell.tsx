import type { ReactNode } from "react";

import { SiteFooter } from "@/production/components/site-footer";
import { SiteHeader } from "@/production/components/site-header";

type DataExperiencePageShellProps = {
  children: ReactNode;
  pageClassName?: string;
};

/**
 * Shell para páginas que apresentam dados e metodologia,
 * mas não devem herdar toda a experiência meteorológica operacional.
 */
export function DataExperiencePageShell({
  children,
  pageClassName = "",
}: DataExperiencePageShellProps) {
  return (
    <div className={["site-shell", "site-shell--data", pageClassName].filter(Boolean).join(" ")}>
      <SiteHeader variant="default" />
      <main id="conteudo-principal" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter source="Tempo Pelotas" />
    </div>
  );
}

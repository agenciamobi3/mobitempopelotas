import { useEffect } from "react";

const SPA_ALLOWED_PREFIXES = ["/conta", "/painel", "/auth", "/login", "/admin"];

function shouldKeepSpaNavigation(pathname: string) {
  return SPA_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isModifiedClick(event: MouseEvent) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

/**
 * O portal público prioriza consistência entre HTML e runtime depois de deploys.
 * Links públicos same-origin usam navegação de documento completo para nunca
 * depender de route chunks mantidos em memória por uma aba antiga.
 *
 * Áreas autenticadas continuam liberadas para navegação SPA. Um link interno
 * específico também pode optar por SPA com data-spa-navigation="true".
 */
export function PublicDocumentNavigationGuard() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || isModifiedClick(event)) return;
      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.getAttribute("data-spa-navigation") === "true") return;

      let destination: URL;
      try {
        destination = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (destination.origin !== window.location.origin) return;
      if (shouldKeepSpaNavigation(destination.pathname)) return;

      const current = new URL(window.location.href);
      const sameDocument =
        destination.pathname === current.pathname &&
        destination.search === current.search &&
        destination.hash !== current.hash;
      if (sameDocument) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(destination.href);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}

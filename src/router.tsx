import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // O documento não rola em window/html/body: ViewportScrollRoot é o único
    // viewport vertical e faz o reset de rota de forma determinística.
    scrollRestoration: false,
    // O portal público navega por documento completo. Preload por intenção faria
    // hover/foco em um <Link> disparar loaders SPA antes do clique capturado pelo
    // PublicDocumentNavigationGuard, reabrindo exatamente o caminho instável que
    // estamos retirando do fluxo público. Áreas autenticadas seguem SPA quando
    // navegadas, apenas sem prefetch global especulativo.
    defaultPreload: false,
    defaultStaleTime: 60 * 1_000,
  });

  return router;
};

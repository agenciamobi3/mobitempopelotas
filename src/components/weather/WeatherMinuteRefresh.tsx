// A atualização global por router.invalidate() foi retirada do caminho público.
//
// O portal público navega por documentos completos para preservar consistência
// entre HTML/runtime depois de deploys. Invalidar a árvore inteira a cada minuto
// reabria loaders via SPA e podia promover uma oscilação transitória de fonte ou
// transporte ao boundary global, mesmo quando a página já estava saudável.
//
// Dados correntes continuam sendo atualizados pelos coletores/caches centrais e
// por carregamentos explícitos de página. Componentes que precisarem de refresh
// em segundo plano devem fazê-lo de forma isolada, sem invalidar a rota inteira.
export function WeatherMinuteRefresh() {
  return null;
}

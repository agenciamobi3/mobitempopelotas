# Tempo Pelotas — estado atual do projeto

Última atualização: 27/08/2026  
Branch operacional: `main`  
Domínio canônico: `https://tempopelotas.com.br`

## 1. Papel deste documento

Este arquivo é a fonte de verdade de alto nível do Tempo Pelotas. Detalhes técnicos ficam nos documentos especializados em `docs/`; código ativo, workflows e migrations prevalecem sobre documentação histórica.

Regras permanentes:

- mudanças estruturais de página pública, fonte, SEO/indexação, runtime, banco, autenticação ou deploy atualizam este arquivo no mesmo conjunto;
- não versionar HAR bruto, cookies, tokens, secrets ou URLs autenticadas;
- observação, previsão, alerta oficial, reanálise e dado derivado permanecem semanticamente separados;
- indisponibilidade nunca vira valor zero, situação normal ou diagnóstico automático;
- `main` é a branch operacional; não reescrever histórico publicado.

## 2. Visão executiva

Tempo Pelotas é um portal meteorológico e hidrológico regional para Pelotas e Zona Sul do Rio Grande do Sul. Combina previsão, observação local, chuva, vento, meteograma, alertas oficiais, radar/satélite, hidrologia, histórico, câmeras, páginas municipais e conteúdo editorial/SEO.

| Domínio | Estado | Observação |
| --- | --- | --- |
| Portal público | Ativo | Produção em `tempopelotas.com.br` |
| Home / Hoje / Amanhã / 7 dias | Ativo | Rotas públicas dedicadas; Home possui fallback final contra falha de transporte da inteligência meteorológica |
| Previsão de 15 dias | Ativo | Open-Meteo diário dedicado, separado do contrato de 7 dias e com degradação independente das chamadas públicas |
| Chuva / vento / meteograma | Ativo | Contratos resilientes e estados degradados explícitos |
| Alertas | Ativo | INMET, preservando validade, abrangência e instruções |
| Embrapa Clima Temperado | Ativo | Observação local, extremos e acumulados |
| REDEMET / DECEA | Ativo com dependência externa | Radar, satélite e trovoadas; contingência oficial quando prevista pelo contrato |
| Hidrologia | Ativo | Laranjal, Lagoa dos Patos, Guaíba, SACE e rede regional |
| Defesa Civil RS | Ativo | Hidrometeorologia regional com kill switch server-side |
| Histórico climático | Ativo | Histórico recente e Historical Data Layer em expansão |
| Enchentes 1941 / 2024 | Ativo | Páginas históricas com fontes institucionais e limites semânticos |
| Câmeras | Ativo com dependência externa | Live/replay com degradação explícita |
| Central Regional | Ativo | Pelotas + 23 páginas municipais aprovadas |
| SEO técnico | Ativo | Canonical, sitemap, robots, OG/Twitter, Schema.org e links internos |
| Conta / Google | Parcial operacional | Fundação implementada; E2E real com duas contas ainda pendente |
| Free / PRO | Fundação pronta | Entitlements existem; billing comercial ainda não existe |
| Weather AI | Ativo controlado | Snapshot server-side, orçamento e fallback determinístico |
| Gate geográfico / CSP / rate limit | Ativo | Segurança em camada de aplicação; smokes reais ainda precisam ser confirmados |
| Navegação pública entre deploys | Hardening ativo | Links públicos usam documento completo; recuperação fresca e boundary não fatal |
| Service worker / offline PWA | Temporariamente aposentado | Manifest e conectividade permanecem; `/sw.js` não é mais registrado |
| Web Push | Suspenso | Código preservado, manager fora do root |
| Qualidade / CI | Gates versionados, execução pendente | GitHub Actions continua sem evidência de execução normal dos steps |

## 3. Stack e operação

Stack principal: React 19, TypeScript 5.8, TanStack Start/Router, Vite 8, Nitro, Tailwind CSS 4, Supabase JS/SSR, MapLibre GL, Recharts e Zod. Node 24 é usado nos workflows. Lovable é o ambiente conectado de sincronização/publicação; o Supabase oficial permanece externo ao Lovable.

Scripts principais: `npm run build`, `npm test`, `npm run test:contracts`, `npm run test:routes`, `npm run routes:check`, `npm run typecheck`, `npm run lint`, `npm run quality:browser`, `npm run quality:assets`, `npm run runtime:check` e `npm run cutover:smoke`.

Rotas que renderizam `InternalWeatherPageShell` ou `ContentPageShell` são standalone em `SiteLayout`, evitando header/footer/main duplicados. O contrato possui teste automático.

## 4. Rotas públicas indexáveis

`src/lib/public-routes.ts` é a fonte programática do sitemap. Inventário atual: **48 URLs indexáveis**, sendo **25 fixas + 23 municipais**. Pelotas usa a Home como página regional principal.

Rotas fixas:

- `/`;
- `/tempo-hoje-pelotas`;
- `/tempo-amanha-pelotas`;
- `/previsao-7-dias-pelotas`;
- `/previsao-15-dias-pelotas`;
- `/chuva-em-pelotas`;
- `/vento-em-pelotas`;
- `/meteograma-pelotas`;
- `/alertas`;
- `/radar-e-satelite-pelotas`;
- `/mapa-de-geadas-rio-grande-do-sul`;
- `/situacao-hidrologica-pelotas`;
- `/nivel-da-lagoa-dos-patos-laranjal`;
- `/nivel-do-guaiba`;
- `/estacao-embrapa-pelotas`;
- `/clima-em-pelotas`;
- `/historico-climatico-pelotas`;
- `/enchente-1941-pelotas`;
- `/enchente-2024-pelotas-laranjal`;
- `/cameras-ao-vivo-pelotas`;
- `/tempo-na-regiao-sul-rs`;
- `/blog`;
- `/status-dos-dados`;
- `/metodologia`;
- `/privacidade-e-dados`.

Municípios aprovados: Capão do Leão, Canguçu, Morro Redondo, Turuçu, Arroio do Padre, Pedro Osório, Cerrito, Piratini, Rio Grande, São José do Norte, São Lourenço do Sul, Cristal, Jaguarão, Arroio Grande, Herval, Santa Vitória do Palmar, Chuí, Pinheiro Machado, Pedras Altas, Bagé, Candiota, Aceguá e Dom Pedrito. Nenhuma cidade nova é indexada sem o publication gate.

## 5. Previsão meteorológica

O contrato compartilhado usa Open-Meteo para previsão detalhada e MET Norway como contingência quando aplicável. Home, Hoje, Amanhã e 7 dias preservam o horizonte e a semântica do contrato consolidado.

`/previsao-15-dias-pelotas` usa chamada independente, somente com campos diários, timeout próprio e estados `live|partial|unavailable`. Dias 1–7 e 8–15 são separados visualmente; a página atende também a intenção de 10 dias sem criar URL redundante. Não existe previsão diária artificial de 30 dias: dias 16–30 só serão publicados quando houver contrato de tendência adequado.

Em 27/08/2026 o loader público de 15 dias deixou de exigir sucesso conjunto de `getWeatherIntelligence()` e `getPelotasExtendedForecast()`. `src/lib/weather/extended-forecast-page-loader.ts` usa `Promise.allSettled` e degrada cada domínio para seu contrato `unavailable`: uma falha de transporte na inteligência compartilhada não elimina a série estendida, e uma falha da server function estendida não derruba o shell meteorológico. Nenhuma falha é convertida em zero ou previsão fictícia.

## 6. Observação e fontes oficiais

Embrapa Clima Temperado é a referência principal de observação local quando utilizável. Modelo numérico não substitui silenciosamente observação ausente.

INMET é usado para avisos oficiais, previsão complementar, estação/referências e produtos específicos como geadas. Falha de consulta não equivale a ausência de risco.

CPPMet/UFPel é contexto regional complementar. SIMAGRO RS permanece como visualização de modelo em meteograma, sem OCR de imagens.

REDEMET/DECEA fornece radar, satélite e STSC/trovoadas. Imagem recente não é automaticamente chamada de “tempo real”; timestamp da fonte prevalece. O canal Visível não recebe fallback infravermelho. Contingências preservam `provider`/produto/origem reais.

## 7. Chuva, vento e estados degradados

`/chuva-em-pelotas` separa chuva observada, prevista, acumulados regionais e aviso oficial. Observado e previsto não são somados automaticamente.

Vento e Chuva usam `src/lib/weather/public-weather-page-loader.ts` com `Promise.allSettled`: falha de inteligência meteorológica ou meteograma degrada somente aquela camada para contrato `unavailable`, sem inventar valores nem derrubar a rota inteira.

A Home mantém a hidrologia diferida e isolada em sua própria Promise, mas agora também protege o caminho meteorológico crítico: uma rejeição de transporte de `getWeatherIntelligence()` é convertida em `createUnavailableWeatherIntelligence()`. O portal continua renderizando o shell público com estado indisponível explícito em vez de abrir o boundary global.

## 8. Hidrologia

A Estação Laranjal é referência operacional local apresentada para Pelotas. Nível, horário, idade, tendência e variações são preservados sem transformar leitura atrasada em valor atual.

`/nivel-do-guaiba` reutiliza o contrato server-side já existente e mantém Cais Mauá e Gasômetro como referências independentes. Nível do Guaíba não é convertido automaticamente em diagnóstico para Pelotas nem cotas são transferidas entre réguas.

Defesa Civil RS permanece ativa com kill switch. ANA/RHN continua em validação; estação, parâmetro, unidade, datum/referência, timezone e governança precisam ser confirmados antes de substituir fontes existentes.

## 9. Histórico e memória das cheias

O Historical Data Layer mantém separação entre `observation`, `forecast`, `reanalysis` e `derived`.

`/historico-climatico-pelotas` representa histórico meteorológico recente, enquanto `/clima-em-pelotas` representa clima/climatologia. As duas intenções permanecem separadas.

`/enchente-1941-pelotas` usa pesquisa documental UCPel/UFPel/Prefeitura e trata 2,88 m como referência histórica contextual do Canal São Gonçalo, não como cota transferível à Estação Laranjal ou a outras réguas. A página de 2024 permanece como registro histórico. As duas páginas têm ligação recíproca.

## 10. Central Regional

`/tempo-na-regiao-sul-rs` é o hub das 24 cidades aprovadas. O resumo usa consulta Open-Meteo em lote, rotulada como estimativa de modelo. Busca, filtros, lista e mapa reutilizam o mesmo dataset; avisos INMET ficam nas páginas municipais individuais.

Em 27/08/2026 a Central Regional recebeu hardening adicional após um erro público observado nessa rota:

- `RegionalCitiesMap` deixou de ser carregado por um `import()` próprio no wrapper; a renderização continua adiada por `IntersectionObserver`, mas o módulo é importado estaticamente;
- `maplibre-gl` continua sendo a camada dinâmica interna, com tratamento local;
- um `RegionalMapErrorBoundary` local impede que erro do mapa alcance o boundary global;
- se o mapa falhar, a lista, busca, filtros e links das cidades permanecem disponíveis;
- o fallback informa explicitamente que a lista continua funcional.

Perfis editoriais municipais específicos só são mantidos quando existe contexto factual próprio. FAQ genérico em massa permanece proibido pelo gate anti-template.

## 11. SEO e pesquisa de intenção

Arquitetura por horizonte:

- agora: Home;
- hoje/por hora: `/tempo-hoje-pelotas`;
- amanhã: `/tempo-amanha-pelotas`;
- 7 dias/semana: `/previsao-7-dias-pelotas`;
- 10/15 dias: `/previsao-15-dias-pelotas`;
- 20/30 dias: não publicado.

O princípio permanece: não criar URL quase duplicada apenas para trocar palavra-chave, número ou dia. Cada URL precisa de utilidade e contrato próprios.

A fase atual é de refinamento das 48 URLs existentes. Páginas permanentes de sexta/sábado continuam bloqueadas até existir evidência suficiente de Search Console; o conector continua indisponível por assinatura. O cluster hidrológico liga Laranjal ↔ Situação das Águas ↔ Guaíba ↔ 1941 ↔ 2024. O diretório global também expõe 15 dias e páginas hidrológicas/históricas.

Em 27/08/2026 o header principal foi alinhado ao inventário já publicado, sem criar novas URLs: o menu `Previsão` passa a expor diretamente `/previsao-15-dias-pelotas`, e o menu `Águas` passa a expor `/nivel-do-guaiba` e `/enchente-1941-pelotas` além do Laranjal, situação hidrológica e enchente de 2024. Os mesmos itens alimentam a navegação móvel e entram nos `activePaths` correspondentes, reforçando descoberta, contexto e ligação interna entre os ativos existentes.

## 12. Conta, Free e PRO

Fundação existente: Google Identity Services + Supabase Auth por ID Token, sessão SSR, `/conta`, `/painel` autenticado/noindex, preferências/consentimentos, exportação/exclusão, `account_access` e entitlements centralizados.

Billing comercial ainda não existe. PRO não deve ser apresentado como disponível para compra antes de produto, preço, provedor, webhook e entitlement automatizado estarem implantados e validados.

Direção: o portal público informa; a conta Free organiza e acompanha; o PRO analisa, compara e aprofunda. Dado oficial público não deve ser escondido apenas para monetização.

## 13. IA

Weather AI não é dependência do front público. Opera por snapshots server-side, fingerprint, cache, teto de chamadas e fallback determinístico. IA futura não pode criar, alterar ou substituir aviso oficial.

## 14. Segurança

Ativo:

- secrets server-side;
- gate geográfico de visitantes em hosts de produção;
- CSP global com allowlist explícita;
- firewall de aplicação com guards de método/tamanho;
- rate limiting distribuído para rotas sensíveis de conta/push;
- RLS no Supabase externo;
- proxy/allowlist para integrações externas;
- logs sanitizados;
- resposta geográfica bloqueada autocontida e `noindex`.

Um WAF gerenciado de edge/provedor não está configurado e não deve ser confundido com o firewall em camada de aplicação. Smokes reais de produção e compatibilidade da CSP com integrações ainda precisam ser observados.

## 15. Navegação pública e coerência entre deploys

Relatos reais de usuários em 27/08/2026 mostraram o boundary global durante navegação entre páginas, inclusive em `/tempo-na-regiao-sul-rs`. A política operacional foi alterada para privilegiar confiabilidade acima de SPA/PWA.

### 15.1. HTML

Documentos HTML públicos fora de embeds recebem `no-store/no-cache`, `CDN-Cache-Control: no-store`, `Pragma: no-cache` e `Expires: 0`, para que HTML de um deploy não continue apontando para runtime de outro.

### 15.2. Navegação pública por documento completo

`src/components/navigation/PublicDocumentNavigationGuard.tsx` é montado no root. Depois da hidratação, links internos públicos same-origin são capturados antes do TanStack Router e passam por `window.location.assign()`. Cada troca pública obtém um novo documento e o runtime atual do deploy.

Exceções preservadas: links externos, downloads, target externo, cliques modificados, navegação somente por hash, `/conta`, `/painel`, `/auth`, `/login`, `/admin` e opt-out explícito `data-spa-navigation="true"`.

As áreas autenticadas podem continuar SPA; o portal público não depende mais de route chunks antigos para trocar de página.

### 15.3. Recuperação automática fresca

`src/lib/stale-client-recovery.ts` usa `__tp_recover=<timestamp>` e `location.replace()` para no máximo uma tentativa por URL lógica em 60 segundos. O parâmetro não participa da chave lógica e é removido com `history.replaceState` depois de hidratação bem-sucedida.

Erros de asset, falhas transitórias e qualquer erro que alcance o root depois da hidratação recebem uma única tentativa controlada (`asset|navigation|runtime`). Offline não força navegação.

### 15.4. Boundary global não fatal

O root continua registrando o erro na telemetria, mas não mostra mais `Erro inesperado` nem `Não foi possível carregar esta página`.

O fallback público usa a mensagem neutra `Carregando a versão mais recente do Tempo Pelotas` e oferece anchors nativas para Agora, Hoje, 7 dias, Chuva, Radar, Situação das Águas e Região. Mesmo se a recuperação automática for bloqueada pela trava de loop ou o erro persistir, a pessoa não fica presa em um router cliente quebrado.

Documento especializado: `docs/NAVIGATION_RUNTIME_RECOVERY_2026-08-27.md`.

## 16. Service worker / PWA / Web Push

O service worker foi **temporariamente aposentado do runtime público** em 27/08/2026. `PwaManager` não chama mais `serviceWorker.register("/sw.js")`.

Na hidratação, `PwaManager` executa apenas cleanup controlado:

- consulta registrations existentes;
- desregistra somente workers same-origin cujo script seja `/sw.js` do Tempo Pelotas;
- remove somente caches prefixados por `tempo-pelotas-`;
- usa operações tolerantes a falha;
- não recarrega a página apenas por fazer a limpeza.

`public/sw.js` v9 permanece versionado como artefato dormente, não como worker ativo. Manifest, metadados móveis e `PwaAppExperience` permanecem; a camada de conectividade tolera ausência de registration.

A instalação/offline via worker só deve retornar depois de uma janela real de estabilidade e testes específicos com abas antigas durante deploys. Até lá: **robustez > SPA/PWA**.

Web Push continua suspenso. `PushNotificationsManager` não é montado no root.

## 17. Testes e GitHub Actions

Contratos relevantes versionados:

- `tests/public-route-resilience.test.ts`: recuperação com cache-buster, trava de 60 s, tentativa `runtime`, navegação pública por documento, preservação das áreas autenticadas, boundary não fatal, isolamento do mapa e loaders Vento/Chuva;
- `tests/home-deferred-hydrology.test.ts`: hidrologia diferida, degradação local do bloco de águas e fallback final da inteligência meteorológica da Home;
- `tests/fifteen-day-forecast.test.ts`: consulta estendida dedicada, estados `live|partial|unavailable`, ligação 7→15 dias e degradação independente entre inteligência meteorológica e previsão estendida;
- `tests/pwa-app-refinement.test.ts`: ausência de novo registro de SW, cleanup restrito ao Tempo Pelotas, manifest e conectividade preservados;
- `tests/service-worker-static-cache.test.ts`: documenta o contrato do arquivo v9 preservado/dormente;
- `tests/standalone-route-shell.test.ts`: evita shells duplicados;
- `tests/seo-content-accessibility.test.ts` e `tests/seo-editorial-enrichment.test.ts`: contratos de intenção, semântica e links;
- `tests/regional-city-editorial.test.ts`: gate anti-template;
- `tests/header-keyboard-accessibility.test.ts`: ARIA/foco de menus e presença no header das rotas de 15 dias, Guaíba, Enchente de 1941 e Enchente de 2024;
- `tests/source-resilience-regressions.test.ts`: contratos INMET/REDEMET;
- `tests/screenshot-layout-regressions.test.ts`: regressões visuais detectadas no domínio.

O workflow `Qualidade` executa `tests/header-keyboard-accessibility.test.ts` em etapa própria, além de `tests/public-route-resilience.test.ts`, contratos rápidos e demais gates especializados. `tests/fifteen-day-forecast.test.ts` e `tests/home-deferred-hydrology.test.ts` permanecem dentro de `test:contracts`. Depois seguem `routes:check`, build, relatório de assets, rotas, TypeScript, lint, preview e Browser Quality Smoke. Os runs recentes continuam sem evidência de steps executados normalmente (`runner_id=0` / `steps=[]` em observações anteriores). **Não declarar CI, build ou testes aprovados sem execução real.**

## 18. Deploy e Supabase

`main` é a branch operacional e sincroniza com Lovable. Supabase é externo ao Lovable. Migration versionada só é considerada aplicada após validação no ambiente oficial; publicação de código não prova alteração de banco.

As rodadas de 15 dias, Guaíba, Enchente de 1941, refinamento SEO e hardening de navegação não adicionam migration, Edge Function, secret ou variável de ambiente.

O hardening atual altera somente o runtime de navegação/cliente: não muda fonte meteorológica/hidrológica, regra de alerta, sitemap, canonical, autenticação ou dados de produção.

## 19. Qualidade de navegador

`scripts/browser-quality-smoke.mjs` usa Chrome/Chromium via CDP e cobre rotas representativas em mobile/tablet/desktop, verificando estrutura, H1/main, foco, controles, rótulos, imagens, overflow e comportamento do menu. TTFB/FCP/LCP/CLS são métricas de laboratório, não CrUX.

`scripts/build-asset-report.mjs` mede JS/CSS/imagens/fontes e gzip. Budgets rígidos dependem de baseline executado.

## 20. Pesquisa futura

GeoInfo Embrapa permanece em trilha própria de descoberta/licenciamento. CPTEC/SIGMA permanece fora do runtime público até nova revisão. Nenhuma dessas trilhas deve entrar no caminho crítico da previsão sem gate de fonte, licença, escala e semântica.

## 21. Pendências prioritárias

1. Confirmar publicação da rodada de hardening de navegação no domínio canônico e validar repetidamente a troca entre páginas públicas em desktop/mobile/anônimo.
2. Validar uma aba mantida aberta durante um novo deploy e confirmar que a próxima navegação pública busca documento/runtime atual sem exibir a antiga tela fatal.
3. Confirmar no navegador que `/sw.js` não permanece registrado após a hidratação da nova versão e que caches `tempo-pelotas-*` antigos são removidos.
4. Restaurar os runners do GitHub Actions e executar suíte completa, `routes:check`, build, TypeScript e Browser Quality Smoke.
5. Validar `/previsao-15-dias-pelotas`, `/nivel-do-guaiba` e `/enchente-1941-pelotas` no domínio, inclusive mobile, canonical e sitemap.
6. Recapturar Search Console para priorizar CTR/refinamentos e decidir sexta/sábado.
7. Concluir E2E de autenticação com duas contas descartáveis.
8. Continuar Historical Data Layer, ANA/RHN e semântica da Defesa Civil RS.
9. Validar smokes de segurança, CSP, gate geográfico e rate limiting no ambiente real.
10. Manter Web Push suspenso e service worker público aposentado até estabilidade comprovada.
11. Só publicar 30 dias quando existir contrato de tendência adequado para dias 16–30.
12. Manter GeoInfo e CPTEC/SIGMA fora do runtime até seus gates próprios.

## 22. Documentos especializados principais

| Documento | Finalidade |
| --- | --- |
| `MIGRATION_MATRIX.md` | Migração, paridade e pendências históricas |
| `WEATHER_PAGE_IDENTITY.md` | Identidade das páginas meteorológicas |
| `docs/PUBLIC_ROUTE_RESILIENCE.md` | Fallbacks e orçamento de latência |
| `docs/NAVIGATION_RUNTIME_RECOVERY_2026-08-27.md` | Navegação pública, cache, recuperação, SW aposentado e isolamento de chunks |
| `docs/REDEMET_OPERATIONS.md` | Operação REDEMET |
| `docs/SOURCE_RESILIENCE_INMET_REDEMET_2026-08-27.md` | Contingências INMET/REDEMET |
| `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md` | Rede hidrometeorológica Defesa Civil RS |
| `docs/ANA_RHN_INTEGRATION.md` | ANA/RHN e gates de estação |
| `docs/HISTORICAL_DATA_INVENTORY.md` | Histórico, governança e coletores |
| `docs/FLOOD_1941_RESEARCH_2026-08-27.md` | Base documental da enchente de 1941 |
| `docs/SEO_GSC_BASELINE_2026-08-16.md` | Baseline Search Console |
| `docs/SEO_SEARCH_INTENT_PLAN_2026-08-26.md` | Arquitetura de intenção SEO |
| `docs/SEO_TRENDS_EVIDENCE_2026-08-26.md` | Evidência sanitizada do Trends |
| `docs/SEO_REFINEMENT_ENRICHMENT_2026-08-27.md` | Refinamento das URLs existentes |
| `docs/QUALITY_A11Y_CWV_2026-08-27.md` | Acessibilidade, responsividade e métricas de laboratório |
| `docs/FORECAST_15_DAY_IMPLEMENTATION_2026-08-26.md` | Previsão de 15 dias |
| `docs/EMBRAPA_GEOINFO_DATASET_SURVEY_2026-08-26.md` | GeoInfo Embrapa |
| `docs/DATA_ACCESS_PUBLIC_FREE_PRO_PLAN.md` | Política Público/Free/PRO |
| `docs/ACCOUNT_AND_PRO_ARCHITECTURE.md` | Arquitetura de conta/PRO |
| `docs/auth-account.md` | Autenticação e direitos do titular |
| `docs/weather-ai-snapshots.md` | Weather AI persistido |
| `docs/CPTEC_SIGMA_RESEARCH.md` | Pesquisa futura CPTEC/SIGMA |
| `docs/PRODUCTION_CUTOVER.md` | Runbook de produção |
| `docs/RUNTIME_READINESS.md` | Preflight do runtime |

## 23. Regra de manutenção

Uma pessoa deve conseguir abrir este arquivo e responder rapidamente: quais páginas existem, de onde vêm os dados, o que é observação/previsão/alerta, quais integrações estão ativas, como o runtime público opera, o que está parcial/suspenso e quais pendências impedem declarar uma camada concluída.

Quando o detalhe ultrapassar esse nível, ele permanece no documento especializado e é apenas referenciado aqui.

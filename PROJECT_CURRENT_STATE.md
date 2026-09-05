# Tempo Pelotas — estado atual do projeto

Última atualização: 05/09/2026  
Branch operacional: `main`  
Domínio canônico e único de produção: `https://tempopelotas.com.br`

## 1. Fonte de verdade e regras permanentes

Este arquivo descreve o estado operacional atual. Evidências e histórico detalhado ficam nos documentos especializados em `docs/`; código ativo, migrations aplicadas e runtime publicado prevalecem sobre documentação antiga.

Regras permanentes:

- não versionar secrets, cookies, HARs, URLs autenticadas ou tokens;
- observação, previsão, alerta oficial, reanálise e dado derivado permanecem semanticamente separados;
- indisponibilidade nunca vira zero, normalidade ou diagnóstico automático;
- timeout, HTTP 403, falha de parsing ou bloqueio de integração não provam indisponibilidade global da fonte pública;
- dados correntes usam `no-store/no-cache`; last-good conserva timestamp e idade reais;
- uma régua/cota não é convertida para outra referência sem metadados suficientes;
- navegabilidade pública prevalece sobre disponibilidade instantânea de integrações externas;
- fonte tecnicamente disponível não é automaticamente habilitada se o produto já possui cobertura suficiente;
- diagnóstico técnico pode permanecer em logs/contratos internos, mas não deve ser exposto como copy pública;
- `main` é operacional e histórico publicado não é reescrito.

## 2. Estado executivo

| Domínio | Estado atual |
| --- | --- |
| Portal público | **Rodada de estabilização de regressões em 30/08**; código sincronizado no Lovable e publicação direta solicitada |
| Runtime marker | `/api/runtime-version` permanece estático e `no-store/noindex`; validar cortes novos também por `x-deployment-id` |
| Home / Hoje / Amanhã / 7 dias | **Shell-first + recuperação real após hidratação**: documento inicial não aguarda fontes externas |
| Recuperação meteorológica | Primeiro consulta a consolidação server-side, permitindo usar MET Norway/Embrapa e outras contingências; Open-Meteo direto no navegador permanece como fallback adicional |
| Home hidrológica | Loader inicial continua sem fontes externas; após hidratação consulta Laranjal, Guaíba e rede da Lagoa em isolamento client-side |
| Boundary público | Auto-reload apenas para asset obsoleto ou falha transitória; exceção real não é mais mascarada como “versão mais recente” |
| Open-Meteo | Principal; direto=`operational`, contingência/last-good recente=`partial`, sem previsão utilizável=`offline` |
| MET Norway | Contingência compartilhada quando aplicável; deve alimentar as páginas shell-first quando Open-Meteo falhar |
| Embrapa | Observação local centralizada + recuperação client-side |
| INMET meteorológico | `operational` após priorização da rota municipal funcional |
| Radar / satélite / STSC | Probes independentes; APIs públicas sanitizam erros antes de entregá-los ao navegador |
| GOES / INMET | HTTP 403/404 server-side descreve a integração, não indisponibilidade pública global; diagnóstico bruto não deve aparecer na UI |
| Hidrologia | Laranjal, Guaíba, Lagoa dos Patos e Defesa Civil degradam independentemente |
| ANA / SNIRH / RHN | **Readiness/cross-check somente**, sem terceira ingestão do Laranjal nesta fase |
| Historical Data Layer | Ativo; classes `observation`, `forecast`, `reanalysis`, `derived` separadas |
| Monitor de status | Supabase `pg_cron` + `pg_net`, a cada 10 min; 14 serviços |
| MOBI Ticket | **Consumidor P1 source-ready / runtime unchanged**; loader canônico entra por canário e preserva fallback P0 |
| Widget Builder | **Fundação V1 publicada**: conta cria e gerencia widgets responsivos por token público |
| Widget modules V1 | Nível do Laranjal + Tempo agora em Pelotas |
| Free / PRO | Entitlements existem; Free nasce sem limite de widgets nesta fase; billing comercial ainda não existe |
| Central Regional | Pelotas + 23 páginas municipais indexáveis |
| SEO técnico | 49 URLs indexáveis, canonical/sitemap/robots/Schema/BreadcrumbList ativos |
| História das cheias | Rotas dedicadas para 1941, 2015 e 2024; 2015 usa a série oficial “Cheias 2015” com cronologia e caveats de régua/referência |
| Conta / Google | Fundação operacional parcial; E2E completo com contas descartáveis ainda pendente |
| Service Worker / Web Push | Suspensos até estabilidade sustentada |
| GitHub Actions | **Bloqueado antes dos steps**; não declarar suíte/build/typecheck executados |

## 3. Stack e budgets públicos

Stack: React 19, TypeScript 5.8, TanStack Start/Router, Vite 8, Nitro, Tailwind CSS 4, Supabase JS/SSR, MapLibre GL, Recharts e Zod. Lovable sincroniza/publica o repositório; o Supabase oficial é externo ao Lovable.

Budgets atuais:

- Home/Hoje/Amanhã/7 dias: nenhuma fonte externa no loader inicial;
- inteligência meteorológica compartilhada chamada após hidratação: teto interno de 5 s;
- loaders meteorológicos secundários: 2,5 s por dependência;
- loaders hidrológicos dedicados: 2,5 s por dependência;
- Radar: 2,8 s;
- previsão de 15 dias: 2,8 s.

O shell-first existe para manter o documento navegável. Ele **não pode** significar “entregar objeto indisponível e nunca recuperar o dado real”.

## 4. Rodada de estabilização pública — 30/08/2026

A revisão visual em produção revelou quatro regressões de produto que haviam sido introduzidas enquanto a arquitetura de resiliência era expandida.

### 4.1 Home meteorológica presa em atualização

O loader da Home parte corretamente de `createUnavailableWeatherIntelligence()` para não bloquear o documento. Porém a recuperação de previsão no navegador dependia principalmente de uma consulta direta ao Open-Meteo.

Em 30/08 o monitor público mostrava Open-Meteo offline ao mesmo tempo em que MET Norway permanecia ativo. Mesmo assim a Home continuava em “Atualizando dados meteorológicos...”.

Correção na `main`:

- `ProductionHome` consulta `getWeatherIntelligence()` após hidratação quando o baseline não possui dado utilizável;
- essa server function usa a consolidação já existente e pode aproveitar MET Norway, Embrapa e demais contingências;
- a recuperação direta de Open-Meteo continua como tentativa adicional, sem bloquear documento.

### 4.2 Hoje / Amanhã / 7 dias recuperavam somente parte da tela

`InternalWeatherPageShell` fazia recuperação client-side para header/hero, mas os componentes principais das páginas continuavam recebendo o objeto vazio vindo do loader shell-first.

Correção:

- `src/production/lib/weather-intelligence-browser-recovery.ts` centraliza a recuperação consolidada após hidratação;
- `InternalWeatherPageShell` usa esse contrato;
- o shell aceita children como função e entrega `recoveredData` ao conteúdo;
- `/tempo-hoje-pelotas`, `/tempo-amanha-pelotas` e `/previsao-7-dias-pelotas` passaram a renderizar seus componentes principais com o mesmo dado recuperado usado pelo shell.

### 4.3 Home hidrológica estava programada para parecer indisponível

O loader inicial da Home contém, por design shell-first:

```text
Promise.resolve({ status: "unavailable" })
```

Esse valor não representa uma consulta real às fontes. O problema era que a UI convertia esse baseline diretamente em “Dados hidrológicos temporariamente indisponíveis”.

Correção:

- o loader permanece sem chamadas externas;
- ao receber o baseline `unavailable`, `HomeWaterClientRecovery` consulta após hidratação:
  - Laranjal;
  - Guaíba;
  - rede regional da Lagoa dos Patos;
- enquanto recupera, mostra estado de atualização;
- somente uma falha real dessa recuperação mantém o fallback de indisponibilidade.

### 4.4 Diagnóstico REDEMET vazava para a interface pública

O `WeatherMap` pode exibir `activeLayer.data.error`. O adaptador de satélite mantinha diagnósticos sanitizados tecnicamente, porém inadequados para visitante, incluindo contagem de imagens, chaves do payload, hosts candidatos e erros HTTP das tentativas de contingência.

Correção na borda pública:

- `/api/redemet/satellite` preserva internamente o diagnóstico, mas substitui falhas por mensagem operacional pública;
- `/api/redemet/radar` faz o mesmo;
- `/api/redemet/storms` faz o mesmo;
- exceção de produto do canal visível por ausência de luz solar continua com explicação específica, pois é informação útil ao visitante.

### 4.5 Boundary global não pode fingir atualização

Antes deste corte, qualquer erro que chegasse ao boundary global podia disparar uma navegação fresca e era apresentado como “Carregando a versão mais recente do Tempo Pelotas”. Isso escondia exceções reais de aplicação sob uma mensagem de sincronização.

Agora:

- stale asset → uma tentativa controlada de documento fresco;
- erro transitório de navegação/rede → uma tentativa controlada;
- erro real de runtime → não entra em reload automático;
- o boundary mostra “Falha de navegação / Não foi possível concluir esta página”, oferece retry e atalhos diretos.

## 5. Navegação, rotas e SEO

`src/lib/public-routes.ts` mantém **49 URLs indexáveis = 26 fixas + 23 municipais**. Nenhuma nova cidade entra sem publication gate.

`/enchente-2015-pelotas` é uma página histórica pública dedicada baseada principalmente na série oficial “Cheias 2015” da Prefeitura de Pelotas. A página preserva cada boletim como fotografia temporal, não compara cotas antigas com réguas atuais sem metadados compatíveis e usa o G1 apenas como registro contemporâneo complementar para o dia do decreto.

`/`, `/tempo-hoje-pelotas`, `/tempo-amanha-pelotas` e `/previsao-7-dias-pelotas` continuam shell-first. O menu público usa anchors nativas; preload SPA global por intenção e invalidação periódica da árvore permanecem retirados.

O boundary global é contenção excepcional, não loading normal. Se ele permanecer visível, deve comunicar uma falha real em vez de afirmar que uma atualização está em andamento sem evidência.

Rotas de conta e embeds que possuem shell próprio permanecem em `standaloneRoutes`. `/widgets` e `/embed/widget` também são standalone para impedir shell duplicado e manter o iframe limpo.

## 6. Meteorologia e monitor operacional

### Open-Meteo / MET Norway

Open-Meteo é a previsão principal. A rota de 15 dias nunca inventa dias 8–15; janela incompleta real é `partial`.

A contingência persistida preserva last-good com timestamp original. O monitor possui leitura read-only independente do cache e usa esta semântica:

- origem direta utilizável: `operational`;
- fallback ou last-good recente/utilizável: `partial`;
- nenhuma previsão utilizável: `offline`.

A recuperação das páginas shell-first não pode ignorar MET Norway quando essa contingência estiver operacional.

Produção já comprovou um caso anterior de degradação: em 29/08/2026 05:46:29 UTC a origem direta falhou, o last-good de 05:40:11 UTC tinha 6,3 min e o serviço foi corretamente registrado como `partial`, não `offline`.

### INMET

A previsão municipal de Pelotas prioriza `/previsao/4314407`, que responde com contrato válido. `/api/forecast/4314407`, quando 404, permanece apenas como contingência.

O produto de satélite INMET que recusa integração server-side permanece um estado da integração do Tempo Pelotas; não deve ser descrito como indisponibilidade global do serviço público do INMET.

### REDEMET

Radar, STSC, satélite REDEMET e GOES/INMET têm probes independentes. Radar/STSC utilizáveis são `operational`; satélite REDEMET sem produto, mas com API responsiva, pode ser `partial`; falha real/timeout é `offline` da integração.

Erros técnicos detalhados continuam úteis para operação, testes e diagnóstico, mas as APIs consumidas pela UI pública devem retornar copy sanitizada.

## 7. Hidrologia e política ANA/RHN

O Laranjal já possui **duas fontes de coleta do projeto**. Por decisão de produto, ANA/RHN não será adicionada como terceira fonte nesta fase.

Estação ANA/RHN LARANJAL `87955001`:

- parâmetro `Nivel`;
- unidade confirmada `cm`;
- timezone confirmado `America/Sao_Paulo`;
- referência vertical específica continua `unconfirmed`;
- `collection_enabled=false`;
- `publicMeasurementIngestionEnabled=false`;
- `collectionStrategy=readiness-cross-check-only`;
- `ingestionDeferredByProductPolicy=true`;
- `activationRequiresExplicitProductDecision=true`;
- `coveredByExistingSourceCount=2`;
- zero medições ANA/RHN no Historical Data Layer.

As interfaces públicas `CotasReferencia2` e `EstacaoInventarioFluviometrica` não expõem RN, datum, benchmark ou zero vertical específico da estação. Mesmo que essa referência seja confirmada futuramente, isso não habilita ingestão automaticamente.

Documento especializado: `docs/ANA_RHN_INTEGRATION.md`.

## 8. Historical Data Layer

O arquivo canônico separa `observation`, `forecast`, `reanalysis` e `derived`. Fontes novas entram com governança explícita antes de qualquer ingestão.

O `historical-events-capture` roda pelo `cron.job` 8 a cada 10 minutos. A versão 2 deduplica eventos STSC pela chave `(source_key,event_type,source_record_id)` antes do upsert.

## 9. Widget Builder — fundação V1

Objetivo: transformar cadastro em utilidade prática e preparar um futuro plano pago por módulos, sem criar billing agora.

A área autenticada fica em `/widgets` e é descoberta pelo módulo “Gerador de widgets” em `/painel`.

Fluxo V1:

1. usuário autenticado escolhe módulo habilitado;
2. define o nome do widget;
3. cria o widget vinculado à própria conta;
4. vê a prévia;
5. copia o snippet de incorporação;
6. pode pausar ou reativar o widget.

Módulos iniciais do `Widget Registry`:

- `nivel-laranjal` — nível/tendência do Laranjal;
- `status-tempo-agora` — temperatura observada e condição atual em Pelotas.

Não existe HTML/JS arbitrário definido pelo usuário. Novos módulos entram pelo registry e por entitlement controlado.

### Free nesta fase

`AccountEntitlements` possui `widgetsAccess`, `widgetsCreate`, `widgetsMax`, `widgetsLaranjal`, `widgetsCurrentWeather`, `widgetsAdvancedThemes` e `widgetsRemoveBranding`.

Free atualmente:

- acesso/criação habilitados;
- `widgetsMax=null` — sem limite de quantidade nesta fase;
- Laranjal e Tempo Agora habilitados;
- marca Tempo Pelotas mantida;
- sem billing.

`widgetsAdvancedThemes` e `widgetsRemoveBranding` são infraestrutura de evolução. Remoção de marca ainda não é funcionalidade publicada e não deve ser anunciada como disponível.

### Banco, RLS e token público

Migration aplicada: `20260829061000_create_user_widgets.sql`.

`public.user_widgets` possui `user_id`, `public_token` UUID aleatório, tipo, título, tema, config controlada, status e versão.

Segurança validada no Supabase oficial:

- RLS ativa;
- quatro policies de owner;
- `anon` sem `SELECT` na tabela;
- autenticado pode operar apenas os próprios registros;
- público resolve somente token ativo pela RPC `get_public_widget(uuid)`;
- RPC não retorna `user_id`;
- token inexistente retorna zero linhas.

### Embed responsivo

Snippet canônico:

```html
<script src="https://tempopelotas.com.br/widgets/embed.js" data-widget="UUID_PUBLICO" async></script>
```

`/widgets/embed.js` cria iframe para `/embed/widget?token=...`, largura 100% e ajusta altura com `postMessage`. O listener valida origem canônica, `contentWindow`, token e tipo da mensagem.

`/embed/widget` é `noindex`, aceita frame externo apenas como superfície dedicada de embed, não carrega header/footer global e não revela dados de conta para token inválido/inativo.

E2E autenticado de criação/pausa/reativação em browser real continua pendente até haver conta descartável apropriada para teste.

Documento especializado: `docs/WIDGET_BUILDER_ARCHITECTURE.md`.

## 10. Segurança, runtime e MOBI Ticket

Ativos: secrets server-side, RLS, gate geográfico, CSP, firewall de aplicação, rate limiting distribuído, allowlists/proxies de fontes, logs sanitizados e endpoint de runtime `no-store/noindex`.

O relaxamento de `frame-ancestors` é restrito às superfícies de embed. Páginas normais, inclusive `/widgets`, continuam com `SAMEORIGIN`/`frame-ancestors 'self'`.

### MOBI Ticket / suporte do portal

O root público monta `MobiTicketWidgetLoader` globalmente.

Estado correto:

```text
Tempo consumer source       = ready_for_p1_canary
Tempo production runtime    = unchanged
Core P1 migration           = source_only_not_applied
Core support-widget-config  = source_ready_not_deployed
Core loader v1.1            = source_ready_not_published
```

Com `VITE_MOBI_TICKET_WIDGET_TOKEN`, o consumidor está preparado para o loader canônico remoto. Sem a variável, preserva temporariamente o fallback P0. O valor real da chave pública de instalação não é versionado e o consumidor não possui `service_role` ou acesso administrativo ao Core.

Documento especializado: `docs/MOBI_TICKET_CORE_INTEGRATION_2026-08-29.md`.

## 11. Testes e deploy

Contratos versionados cobrem shell-first, navegação, cache, Open-Meteo, MET Norway, Embrapa, INMET, 15 dias, hidrologia, REDEMET, Historical Data Layer, ANA/RHN, Widget Builder e MOBI Ticket.

A rodada de 30/08 atualizou especificamente:

- `tests/home-deferred-hydrology.test.ts` — garante que o loader inicial não consulta fontes e que a Home recupera águas reais após hidratação;
- `tests/public-navigation-stability.test.ts` — garante recuperação meteorológica consolidada, propagação para Hoje/Amanhã/7 dias e impede auto-reload de exceção real de runtime;
- `tests/source-resilience-regressions.test.ts` — mantém diagnóstico interno, mas exige sanitização nas APIs públicas de satélite, radar e trovoadas.

A rodada histórica de 05/09 adicionou `tests/flood-2015-historical-page.test.ts` para proteger os principais marcos documentados, a hierarquia de fontes e os caveats de comparação de níveis de 2015.

GitHub Actions continua bloqueado antes dos steps; portanto contrato versionado não equivale a suíte executada. O projeto Lovable sincronizou os novos arquivos e foi acionado um deploy direto após este corte. O smoke do domínio canônico continua obrigatório antes de declarar a regressão encerrada.

## 12. Próximas prioridades

1. Executar smoke no domínio canônico após a publicação desta rodada: Home, Hoje, Amanhã, 7 dias, situação hidrológica, radar/satélite e transição entre menus.
2. Confirmar que, com Open-Meteo indisponível e MET Norway ativo, Home/Hoje/Amanhã/7 dias deixam o estado “Atualizando” e mostram previsão de contingência.
3. Confirmar que a Home deixa de mostrar indisponibilidade hidrológica sem uma tentativa real das três fontes.
4. Confirmar que nenhum endpoint/mapa público exibe `Diagnóstico atual`, chaves de payload, hosts candidatos ou HTTP interno.
5. Fazer E2E autenticado do Widget Builder com conta descartável: criar, visualizar, copiar, pausar e reativar.
6. Adicionar novos módulos ao registry **um por vez**, somente depois da rodada de estabilidade; candidatos: 7 dias, chuva e vento.
7. Executar o canário MOBI Ticket somente após o Core aplicar/publicar o P1.
8. Resolver provisionamento do GitHub Actions e executar suíte completa, routes check, TypeScript, build e browser smoke.
9. Concluir E2E geral de autenticação com duas contas descartáveis.
10. Manter Service Worker/Web Push suspensos até estabilidade sustentada.

## 13. Documentos principais

- `docs/WIDGET_BUILDER_ARCHITECTURE.md` — gerador de widgets, RLS, embed e evolução por módulos;
- `docs/MOBI_TICKET_CORE_INTEGRATION_2026-08-29.md` — consumidor MOBI Ticket, fallback P0 e canário P1;
- `docs/PUBLIC_ROUTE_RESILIENCE.md` — shell-first e budgets;
- `docs/NAVIGATION_RUNTIME_RECOVERY_2026-08-27.md` — navegação e recuperação;
- `docs/DATA_STATUS_MONITOR_RECOVERY_2026-08-28.md` — scheduler e monitor;
- `docs/ANA_RHN_INTEGRATION.md` — contrato ANA/RHN e política readiness-only;
- `docs/HISTORICAL_DATA_INVENTORY.md` — arquivo histórico;
- `docs/FLOODS_2001_2015_RESEARCH_2026-09-05.md` — base documental das cheias de 2001 e 2015 e limites editoriais;
- `docs/REDEMET_OPERATIONS.md` — REDEMET;
- `docs/SOURCE_RESILIENCE_INMET_REDEMET_2026-08-27.md` — contingências;
- `docs/FORECAST_15_DAY_IMPLEMENTATION_2026-08-26.md` — previsão de 15 dias;
- `docs/SEO_REFINEMENT_ENRICHMENT_2026-08-27.md` — SEO;
- `docs/PRODUCTION_CUTOVER.md` — runbook de produção.

## 14. Regra de manutenção

Este arquivo deve responder rapidamente: o que está publicado, quais fontes alimentam o portal, o que está parcial/suspenso, quais decisões de produto limitam integrações, quais módulos de conta existem, quais regressões foram identificadas e qual é o próximo trabalho real. Histórico detalhado permanece nos documentos especializados.
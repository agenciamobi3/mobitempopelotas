# Tempo Pelotas — estado atual do projeto

Última atualização: 29/08/2026  
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
- `main` é operacional e histórico publicado não é reescrito.

## 2. Estado executivo

| Domínio | Estado atual |
| --- | --- |
| Portal público | **P0 de navegação estabilizado** no domínio canônico |
| Runtime marker | `/api/runtime-version` permanece estático e `no-store/noindex`; validar cortes novos também por `x-deployment-id` |
| Home / Hoje / Amanhã / 7 dias | **Shell-first**: documento inicial não aguarda fontes externas |
| Home sem dado inicial | “Atualizando dados meteorológicos...” durante recuperação; indisponibilidade somente após tentativa real |
| Open-Meteo | Principal; direto=`operational`, contingência/last-good recente=`partial`, sem previsão utilizável=`offline` |
| MET Norway | Contingência compartilhada quando aplicável |
| Embrapa | Observação local centralizada + recuperação client-side |
| INMET meteorológico | `operational` após priorização da rota municipal funcional |
| Radar REDEMET | Probe independente |
| STSC | Probe independente; eventos históricos deduplicados antes do upsert |
| Satélite REDEMET | `partial` quando a API responde sem produto utilizável |
| GOES / INMET | HTTP 403 server-side tratado como `implementation`, não como indisponibilidade pública global |
| Hidrologia | Laranjal, Guaíba, Lagoa dos Patos e Defesa Civil degradam independentemente |
| ANA / SNIRH / RHN | **Readiness/cross-check somente**, sem terceira ingestão do Laranjal nesta fase |
| Historical Data Layer | Ativo; classes `observation`, `forecast`, `reanalysis`, `derived` separadas |
| Monitor de status | Supabase `pg_cron` + `pg_net`, a cada 10 min; 14 serviços |
| MOBI Ticket | **Consumidor P1 source-ready / runtime unchanged**; loader canônico entra por canário e preserva fallback P0 |
| Widget Builder | **Fundação V1 publicada**: conta cria e gerencia widgets responsivos por token público |
| Widget modules V1 | Nível do Laranjal + Tempo agora em Pelotas |
| Free / PRO | Entitlements existem; Free nasce sem limite de widgets nesta fase; billing comercial ainda não existe |
| Central Regional | Pelotas + 23 páginas municipais indexáveis |
| SEO técnico | 48 URLs indexáveis, canonical/sitemap/robots/Schema/BreadcrumbList ativos |
| Conta / Google | Fundação operacional parcial; E2E completo com contas descartáveis ainda pendente |
| Service Worker / Web Push | Suspensos até estabilidade sustentada |
| GitHub Actions | **Bloqueado antes dos steps**; não declarar suíte/build/typecheck executados |

## 3. Stack e budgets públicos

Stack: React 19, TypeScript 5.8, TanStack Start/Router, Vite 8, Nitro, Tailwind CSS 4, Supabase JS/SSR, MapLibre GL, Recharts e Zod. Lovable sincroniza/publica o repositório; o Supabase oficial é externo ao Lovable.

Budgets atuais:

- Home/Hoje/Amanhã/7 dias: nenhuma fonte externa no loader inicial;
- loaders meteorológicos secundários: 2,5 s por dependência;
- loaders hidrológicos: 2,5 s por dependência;
- Radar: 2,8 s;
- previsão de 15 dias: 2,8 s;
- inteligência meteorológica compartilhada: teto interno de 5 s.

## 4. Navegação, rotas e SEO

`src/lib/public-routes.ts` mantém **48 URLs indexáveis = 25 fixas + 23 municipais**. Nenhuma nova cidade entra sem publication gate.

`/`, `/tempo-hoje-pelotas`, `/tempo-amanha-pelotas` e `/previsao-7-dias-pelotas` são shell-first. O menu público usa anchors nativas; preload SPA global por intenção e invalidação periódica da árvore foram retirados. O boundary “Carregando a versão mais recente do Tempo Pelotas” é contenção excepcional, não loading normal.

Rotas de conta e embeds que possuem shell próprio permanecem em `standaloneRoutes`. `/widgets` e `/embed/widget` também são standalone para impedir shell duplicado e manter o iframe limpo.

## 5. Meteorologia e monitor operacional

### Open-Meteo

Open-Meteo é a previsão principal. A rota de 15 dias nunca inventa dias 8–15; janela incompleta real é `partial`.

A contingência persistida preserva last-good com timestamp original. O monitor possui leitura read-only independente do cache e usa esta semântica:

- origem direta utilizável: `operational`;
- fallback ou last-good recente/utilizável: `partial`;
- nenhuma previsão utilizável: `offline`.

Produção comprovou o caso de degradação: em 29/08/2026 05:46:29 UTC a origem direta falhou, o last-good de 05:40:11 UTC tinha 6,3 min e o serviço foi corretamente registrado como `partial`, não `offline`.

### INMET

A previsão municipal de Pelotas prioriza `/previsao/4314407`, que responde com contrato válido. `/api/forecast/4314407`, atualmente 404, permanece apenas como contingência. Após a correção, `weather-inmet` passou a `operational` no monitor real.

O produto de satélite INMET que recusa integração server-side com HTTP 403 permanece `implementation`; isso descreve a integração do Tempo Pelotas, não o serviço público do INMET.

### REDEMET

Radar, STSC, satélite REDEMET e GOES/INMET têm probes independentes. Radar/STSC utilizáveis são `operational`; satélite REDEMET sem produto, mas com API responsiva, é `partial`; falha real/timeout é `offline` da integração.

## 6. Hidrologia e política ANA/RHN

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

## 7. Historical Data Layer

O arquivo canônico separa `observation`, `forecast`, `reanalysis` e `derived`. Fontes novas entram com governança explícita antes de qualquer ingestão.

O `historical-events-capture` roda pelo `cron.job` 8 a cada 10 minutos. A versão 2 deduplica eventos STSC pela chave `(source_key,event_type,source_record_id)` antes do upsert. Execução automática comprovada em 29/08/2026 05:40 UTC: 464 entradas → 245 chaves únicas → 245 persistidas, `success=true`, `error=null`.

## 8. Widget Builder — fundação V1

Objetivo: transformar cadastro em utilidade prática e preparar um futuro plano pago por módulos, sem criar billing agora.

### Produto atual

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

`AccountEntitlements` possui:

- `widgetsAccess`;
- `widgetsCreate`;
- `widgetsMax`;
- `widgetsLaranjal`;
- `widgetsCurrentWeather`;
- `widgetsAdvancedThemes`;
- `widgetsRemoveBranding`.

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
- token inexistente retorna zero linhas;
- smoke transacional confirmou: ativo resolve 1; pausado resolve 0; transação revertida sem deixar widget em conta real.

### Embed responsivo

Snippet canônico:

```html
<script src="https://tempopelotas.com.br/widgets/embed.js" data-widget="UUID_PUBLICO" async></script>
```

`/widgets/embed.js` cria iframe para `/embed/widget?token=...`, largura 100% e ajusta altura com `postMessage`. O listener valida origem canônica, `contentWindow`, token e tipo da mensagem.

`/embed/widget`:

- é `noindex`;
- aceita frame externo somente por ser superfície dedicada de embed;
- não carrega header/footer do portal;
- token inválido/inativo mostra “Widget indisponível” sem dados da conta.

Validação em produção no domínio canônico, deployment `415e524024efd758db97555044a3db7239af314e4993bbe2488417feb895ddcf`:

- `/widgets`: HTTP 200 e login para visitante não autenticado;
- `/widgets/embed.js`: HTTP 200 e canonical correto;
- `/embed/widget` com token inválido: HTTP 200, `X-Frame-Options` ausente, `frame-ancestors *`, `noindex`, sem header/footer global.

E2E autenticado de criação/pausa/reativação em browser real continua pendente até haver conta descartável apropriada para teste.

Documento especializado: `docs/WIDGET_BUILDER_ARCHITECTURE.md`.

## 9. Segurança e runtime

Ativos: secrets server-side, RLS, gate geográfico, CSP, firewall de aplicação, rate limiting distribuído, allowlists/proxies de fontes, logs sanitizados e endpoint de runtime `no-store/noindex`.

O relaxamento de `frame-ancestors` é restrito às superfícies de embed. Páginas normais, inclusive `/widgets`, continuam com `SAMEORIGIN`/`frame-ancestors 'self'`.

WAF gerenciado de edge não deve ser confundido com firewall de aplicação.

### MOBI Ticket / suporte do portal

O root público já monta `MobiTicketWidgetLoader` globalmente. Em 29/08 o consumidor foi preparado para o P1 do Core sem alterar o runtime publicado:

- `source=tempo_pelotas` permanece fixo;
- com `VITE_MOBI_TICKET_WIDGET_TOKEN`, usa `https://agenciamobi.com.br/widgets/mobi-support-widget-loader.js` e `data-config-mode=remote`;
- sem a variável, preserva temporariamente `https://agenciamobi.com.br/widget/mobi-ticket.js` como fallback P0;
- o valor real da chave pública de instalação não é versionado;
- o consumidor não possui `service_role`, acesso ao banco Core ou autorização administrativa;
- categorias/copy locais funcionam como fallback enquanto a configuração pública P1 do Core não estiver disponível.

Estado correto:

```text
Tempo consumer source       = ready_for_p1_canary
Tempo production runtime    = unchanged
Core P1 migration           = source_only_not_applied
Core support-widget-config  = source_ready_not_deployed
Core loader v1.1            = source_ready_not_published
```

Documento especializado: `docs/MOBI_TICKET_CORE_INTEGRATION_2026-08-29.md`.

## 10. Testes e deploy

Contratos versionados cobrem shell-first, navegação, cache, Open-Meteo, Embrapa, INMET, 15 dias, hidrologia, REDEMET, Historical Data Layer, ANA/RHN, a fundação do Widget Builder e a migração do consumidor MOBI Ticket para o loader canônico.

`tests/widget-builder-foundation.test.ts` protege entitlements Free, registry, RLS/RPC, owner gates, canonical do embed, protocolo responsivo, política de frame, isolamento de shell e descoberta pelo painel. Está incluído em `test:contracts`.

`tests/analytics-communication-runtime.test.ts` protege a montagem global do MOBI Ticket, idle loading, loader canônico, fallback legado, `source=tempo_pelotas`, variável de instalação sem valor versionado e ausência de credenciais administrativas.

GitHub Actions continua falhando antes dos steps; portanto teste versionado não significa suíte executada. Lovable comprova sincronização/build/publicação do corte, mas não substitui CI completa.

## 11. Próximas prioridades

1. Fazer E2E autenticado do Widget Builder com conta descartável: criar, visualizar, copiar, pausar e reativar.
2. Adicionar novos módulos ao registry **um por vez**, começando por 7 dias, chuva e vento, sem duplicar infraestrutura.
3. Executar o canário MOBI Ticket somente após o Core aplicar/publicar o P1: configurar a chave `tempo_pelotas`, publicar o portal e confirmar primeiro ticket real portal→Core.
4. Manter Free generoso e observar uso real antes de definir limites ou plano pago.
5. Investigar satélite REDEMET somente pela disponibilidade real do produto/API; não aumentar budgets sem evidência.
6. Reintroduzir resumo hidrológico da Home apenas como recuperação isolada/client-side.
7. Resolver provisionamento do GitHub Actions e executar suíte completa, routes check, TypeScript, build e browser smoke.
8. Concluir E2E geral de autenticação com duas contas descartáveis.
9. Manter Service Worker/Web Push suspensos até estabilidade sustentada.

## 12. Documentos principais

- `docs/WIDGET_BUILDER_ARCHITECTURE.md` — gerador de widgets, RLS, embed e evolução por módulos;
- `docs/MOBI_TICKET_CORE_INTEGRATION_2026-08-29.md` — consumidor MOBI Ticket, fallback P0 e canário P1;
- `docs/PUBLIC_ROUTE_RESILIENCE.md` — shell-first e budgets;
- `docs/NAVIGATION_RUNTIME_RECOVERY_2026-08-27.md` — navegação e recuperação;
- `docs/DATA_STATUS_MONITOR_RECOVERY_2026-08-28.md` — scheduler e monitor;
- `docs/ANA_RHN_INTEGRATION.md` — contrato ANA/RHN e política readiness-only;
- `docs/HISTORICAL_DATA_INVENTORY.md` — arquivo histórico;
- `docs/REDEMET_OPERATIONS.md` — REDEMET;
- `docs/SOURCE_RESILIENCE_INMET_REDEMET_2026-08-27.md` — contingências;
- `docs/FORECAST_15_DAY_IMPLEMENTATION_2026-08-26.md` — previsão de 15 dias;
- `docs/SEO_REFINEMENT_ENRICHMENT_2026-08-27.md` — SEO;
- `docs/PRODUCTION_CUTOVER.md` — runbook de produção.

## 13. Regra de manutenção

Este arquivo deve responder rapidamente: o que está publicado, quais fontes alimentam o portal, o que está parcial/suspenso, quais decisões de produto limitam integrações, quais módulos de conta existem e qual é o próximo trabalho real. Histórico detalhado permanece nos documentos especializados.
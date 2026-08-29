# Tempo Pelotas — estado atual do projeto

Última atualização: 29/08/2026  
Branch operacional: `main`  
Domínio canônico: `https://tempopelotas.com.br`

## 1. Fonte de verdade e regras permanentes

Este arquivo resume o estado operacional atual. Evidências e histórico detalhado ficam em `docs/`; código ativo, migrations aplicadas e runtime publicado prevalecem sobre documentação antiga.

Regras permanentes:

- não versionar secrets, cookies, HARs, URLs autenticadas ou tokens;
- observação, previsão, alerta oficial, reanálise e dado derivado permanecem semanticamente separados;
- indisponibilidade nunca vira zero, normalidade ou diagnóstico automático;
- timeout, HTTP 403, falha de parsing ou bloqueio de integração não provam indisponibilidade global da fonte pública;
- dados correntes usam resposta `no-store/no-cache`; last-good conserva timestamp e idade reais;
- uma régua/cota não é convertida para outra referência sem metadados suficientes;
- navegabilidade pública prevalece sobre disponibilidade instantânea de integrações externas;
- fonte tecnicamente disponível não é automaticamente habilitada se o produto já possui cobertura suficiente;
- `main` é operacional e histórico publicado não é reescrito.

## 2. Estado executivo

| Domínio | Estado atual |
| --- | --- |
| Portal público | **P0 de navegação estabilizado** no domínio canônico |
| Runtime publicado | `2026-08-29-ana-rhn-contract-v2`; `/api/runtime-version` estático, `no-store`, `noindex` |
| Home / Hoje / Amanhã / 7 dias | **Shell-first**: documento inicial não aguarda fontes externas |
| Home sem dado inicial | “Atualizando dados meteorológicos...” durante recuperação; indisponibilidade somente após tentativa real |
| Open-Meteo | Previsão principal; direto=`operational`, contingência/last-good recente=`partial`, sem previsão utilizável=`offline` |
| MET Norway | Contingência compartilhada quando aplicável |
| Embrapa | Observação local centralizada e recuperação client-side |
| INMET meteorológico | `operational` após priorização da rota municipal funcional; integrações individuais continuam semanticamente separadas |
| Radar REDEMET | Probe independente; `operational` na última verificação registrada |
| STSC | Probe independente; `operational` na última verificação registrada |
| Satélite REDEMET | `partial` quando a API responde sem produto utilizável |
| GOES / INMET | 403 server-side tratado como `implementation` da integração, não como indisponibilidade do produto público INMET |
| Hidrologia local/regional | Laranjal, Guaíba, Lagoa e Defesa Civil degradam por domínio |
| ANA / SNIRH / RHN | **Readiness/cross-check somente; sem ingestão planejada nesta fase**. Laranjal já coberto por duas fontes de coleta |
| Historical Data Layer | Ativo; eventos STSC deduplicados pela chave canônica antes do upsert; cron automático comprovado |
| Monitor de status | Supabase `pg_cron` + `pg_net`, a cada 10 min; 14 serviços |
| Central Regional | Pelotas + 23 páginas municipais indexáveis |
| SEO técnico | 48 URLs indexáveis, canonical/sitemap/robots/Schema/BreadcrumbList ativos |
| Conta / Google | Fundação parcial operacional; E2E com duas contas pendente |
| Free / PRO | Entitlements existem; billing comercial ainda não existe |
| Weather AI | Fora do caminho crítico das rotas shell-first |
| Service worker / Web Push | SW aposentado temporariamente; Web Push suspenso |
| GitHub Actions | **Bloqueado antes dos steps**; não declarar build/test/typecheck executados |
| Search Console | Recaptura pendente enquanto o conector estiver sem plano ativo |

## 3. Stack e budgets públicos

Stack: React 19, TypeScript 5.8, TanStack Start/Router, Vite 8, Nitro, Tailwind CSS 4, Supabase JS/SSR, MapLibre GL, Recharts e Zod. Lovable sincroniza/publica o repositório; o Supabase oficial é externo ao Lovable.

Budgets atuais:

- Home/Hoje/Amanhã/7 dias: nenhuma fonte externa no loader inicial;
- loaders meteorológicos secundários: 2,5 s por dependência;
- loaders hidrológicos: 2,5 s por dependência;
- Radar: 2,8 s;
- previsão de 15 dias: 2,8 s;
- inteligência meteorológica compartilhada: teto interno de 5 s.

## 4. Rotas públicas e SEO

`src/lib/public-routes.ts` mantém **48 URLs indexáveis = 25 fixas + 23 municipais**. Nenhuma nova cidade entra sem publication gate; prioridade continua sendo qualidade e estabilidade das URLs existentes.

## 5. Navegação pública

`/`, `/tempo-hoje-pelotas`, `/tempo-amanha-pelotas` e `/previsao-7-dias-pelotas` são shell-first. Depois da hidratação, previsão e observação entram de forma independente.

O menu público usa anchors nativas; preload SPA global por intenção e invalidação periódica da árvore foram retirados. O boundary “Carregando a versão mais recente do Tempo Pelotas” é contenção excepcional, não loading normal.

## 6. Meteorologia e fontes oficiais

### Open-Meteo / MET Norway

Open-Meteo é a previsão principal. A rota de 15 dias nunca inventa dias 8–15; janela incompleta real é marcada como `partial`.

A contingência Open-Meteo foi endurecida em 29/08/2026: runtime sem `SUPABASE_MODE` explícito pode inferir `external` somente quando URL e chave pública realmente existem; `mock` explícito continua soberano. Quando a chamada direta falha, o servidor tenta o last-good persistido e só atualiza pela Edge quando necessário. O snapshot conserva `fetched_at/last_success_at` reais e não transforma previsão antiga em dado “agora”.

O monitor possui uma leitura read-only independente da contingência persistida. A semântica operacional é deliberadamente mais estrita que a disponibilidade do conteúdo:

- origem direta Open-Meteo utilizável: `operational`;
- resposta servida por fallback ou origem direta falhou com last-good persistido utilizável e recente: `partial`;
- nenhuma previsão direta/fallback nem last-good recente utilizável: `offline`.

O last-good usado pelo monitor precisa conter forecast diário utilizável e ter no máximo 30 minutos. Em produção, a coleta de 29/08/2026 05:46:29 UTC capturou exatamente o caso de degradação: a origem direta falhou, o last-good de 05:40:11 UTC tinha 6,3 minutos e `weather-open-meteo` foi corretamente registrado como `partial`, não `offline`.

### Embrapa

Embrapa Clima Temperado é a principal observação local quando utilizável. Pageview não dispara coleta persistente.

### INMET

INMET fornece avisos, previsão complementar, estação e produtos específicos. Falha de uma integração é descrita apenas como falha daquela integração.

A previsão municipal de Pelotas prioriza `/previsao/4314407`, que respondeu com contrato válido; `/api/forecast/4314407`, atualmente 404, permanece apenas como contingência. Após a correção, `weather-inmet` passou a `operational` no monitor real.

## 7. REDEMET / radar / satélite

`src/lib/status/data-status-redemet-probes.server.ts` mede Radar, satélite REDEMET, STSC e GOES/INMET independentemente, com teto de 5 s.

Semântica:

- Radar/STSC com quadro utilizável: `operational`;
- satélite REDEMET respondendo sem produto: `partial`;
- timeout/falha real: `offline` da integração;
- GOES/INMET com HTTP 403 server-side: `implementation`, sem afirmar indisponibilidade pública global.

Na coleta real de 29/08/2026 05:46 UTC, Radar e STSC estavam `operational`; satélite REDEMET permaneceu `partial` por resposta sem imagem utilizável.

## 8. Hidrologia e política ANA/RHN

### Cobertura atual do Laranjal

O Laranjal já é coberto por **duas fontes de coleta do projeto**. Por decisão de produto, a ANA/RHN **não será adicionada como terceira fonte de ingestão nesta fase**.

### ANA / SNIRH / RHN — LARANJAL 87955001

Identidade confirmada:

- código `87955001`;
- LARANJAL, Pelotas/RS;
- estação fluviométrica e telemétrica;
- responsável e operadora UFPel;
- parâmetro `Nivel`;
- unidade confirmada: `cm`;
- timezone confirmado: `America/Sao_Paulo`;
- referência vertical: `unconfirmed`.

As interfaces públicas oficiais `CotasReferencia2` e `EstacaoInventarioFluviometrica` foram inspecionadas integralmente. Não expõem RN, datum, benchmark ou zero vertical específico da estação. `Status_Dado = Sem dados de referencia` refere-se às cotas classificatórias da camada, não ao datum vertical.

A referência vertical continua como limitação semântica documentada, mas **não é mais o único passo antes de ativar coleta**, porque a ingestão foi adiada por política de produto.

Estado no Supabase oficial:

- `source_key=ana-rhn`;
- station `ana-rhn-laranjal-87955001`;
- `unitStatus=confirmed`, `unit=cm`;
- `timezoneStatus=confirmed`, `timezone=America/Sao_Paulo`;
- `verticalReferenceStatus=unconfirmed`;
- `collection_enabled=false`;
- `publicMeasurementIngestionEnabled=false`;
- `collectionStrategy=readiness-cross-check-only`;
- `ingestionDeferredByProductPolicy=true`;
- `activationRequiresExplicitProductDecision=true`;
- `coveredByExistingSourceCount=2`;
- **zero medições ANA/RHN**.

Mesmo que a referência vertical seja confirmada futuramente, isso não habilita coleta automaticamente. Qualquer ativação futura exige decisão explícita sobre o papel de uma terceira fonte para o Laranjal.

Documento especializado: `docs/ANA_RHN_INTEGRATION.md`.

## 9. Monitor de status

O monitor usa `pg_cron` + `pg_net` a cada 10 minutos. ANA/RHN permanece `state=implementation`, fora do cálculo do `overall`.

A mensagem pública ANA deve informar readiness/cross-check sem ingestão nesta fase, porque o Laranjal já possui duas fontes de coleta. Unidade e timezone estão confirmados; referência vertical continua não confirmada.

Em 29/08/2026 05:37 UTC o monitor ainda produziu um falso `weather-open-meteo=offline` durante uma falha transitória, apesar da política de last-good. Esse caso motivou a separação explícita entre saúde da origem direta e saúde da contingência persistida.

Prova pós-correção em produção, 29/08/2026 05:46:29 UTC:

- `weather-open-meteo=partial`; origem direta falhou e last-good real de 05:40:11 UTC foi preservado, idade 6,3 min;
- `weather-inmet=operational`;
- `redemet-radar=operational`;
- `redemet-stsc=operational`;
- `inmet-satellite=implementation`;
- `ana-rhn=implementation`;
- `redemet-satellite=partial` por ausência de imagem utilizável na resposta da API;
- `overall=partial`.

Essa amostra comprova que o monitor não promove mais uma falha transitória do Open-Meteo a `offline` enquanto houver last-good recente e utilizável.

## 10. Historical Data Layer

O arquivo canônico separa `observation`, `forecast`, `reanalysis` e `derived`. Fontes novas permanecem com governança explícita antes de qualquer ingestão.

A migration `defer_ana_rhn_ingestion_by_product_policy` registra a decisão de manter ANA/RHN em readiness/cross-check e exige decisão explícita para eventual ativação futura.

O coletor `historical-events-capture` é executado automaticamente pelo `cron.job` 8 a cada 10 minutos. Em 29/08/2026 foi identificado que o STSC podia repetir, no mesmo lote, a mesma chave `(source_key,event_type,source_record_id)`, fazendo o PostgreSQL rejeitar o `ON CONFLICT DO UPDATE` com “cannot affect row a second time”. A Edge Function versão 2 deduplica o lote pela própria chave canônica antes do upsert e registra `inputRows`, `deduplicatedRows` e `droppedDuplicates`.

Provas de produção após o deploy da versão 2:

- execução manual `id=2989`, 05:33:51 UTC: 462 entradas STSC → 243 chaves canônicas, 219 duplicatas descartadas, 243 persistidas, `success=true`, `error=null`;
- execução pelo mesmo wrapper usado pelo cron `id=2991`, 05:36:58 UTC: 364 → 217, 147 duplicatas descartadas, `success=true`, `error=null`;
- execução **automática** do `cron.job` 8 `id=2993`, 05:40:02 UTC: 464 → 245, 219 duplicatas descartadas, 245 persistidas, `success=true`, `error=null`.

A execução automática encerra o incidente: a deduplicação não depende de smoke manual e está ativa no caminho operacional real.

## 11. Segurança e runtime

Ativo: secrets server-side, RLS, gate geográfico, CSP, firewall de aplicação, rate limiting distribuído, allowlists/proxies de fontes, logs sanitizados e endpoint de runtime `no-store/noindex`.

WAF gerenciado de edge não deve ser confundido com firewall de aplicação.

## 12. Testes e deploy

Contratos versionados cobrem shell-first, navegação, cache, Open-Meteo, semântica da contingência Open-Meteo no monitor, Embrapa, 15 dias, hidrologia, REDEMET, status histórico, deduplicação de eventos históricos e ANA/RHN.

GitHub Actions continua falhando antes dos steps; portanto testes versionados não significam suíte executada. Lovable comprova sincronização/build de preview, não substitui CI completa.

O corte da semântica de contingência Open-Meteo foi sincronizado no Lovable e publicado no domínio canônico; a troca do `x-deployment-id` foi confirmada antes do smoke de 05:46 UTC.

## 13. Prioridades imediatas

1. Manter ANA/RHN em readiness/cross-check; **não gastar o caminho crítico do projeto tentando ativar uma terceira coleta do Laranjal agora**.
2. Investigar satélite REDEMET somente pela disponibilidade real do produto/API; não aumentar budgets nem marcar o portal como indisponível quando a API responde sem imagem.
3. Reintroduzir resumo hidrológico da Home apenas como recuperação isolada/client-side.
4. Resolver provisionamento do GitHub Actions e executar suíte completa, routes check, TypeScript, build e browser smoke.
5. Concluir E2E de autenticação com duas contas descartáveis.
6. Recapturar Search Console quando o conector estiver disponível.
7. Manter Service Worker e Web Push suspensos até estabilidade sustentada.

## 14. Documentos principais

- `docs/PUBLIC_ROUTE_RESILIENCE.md` — shell-first e budgets;
- `docs/NAVIGATION_RUNTIME_RECOVERY_2026-08-27.md` — navegação e recuperação;
- `docs/DATA_STATUS_MONITOR_RECOVERY_2026-08-28.md` — scheduler e histórico do monitor;
- `docs/ANA_RHN_INTEGRATION.md` — contrato ANA/RHN e política readiness-only;
- `docs/HISTORICAL_DATA_INVENTORY.md` — arquivo histórico;
- `docs/REDEMET_OPERATIONS.md` — REDEMET;
- `docs/SOURCE_RESILIENCE_INMET_REDEMET_2026-08-27.md` — contingências;
- `docs/FORECAST_15_DAY_IMPLEMENTATION_2026-08-26.md` — previsão de 15 dias;
- `docs/SEO_REFINEMENT_ENRICHMENT_2026-08-27.md` — SEO;
- `docs/PRODUCTION_CUTOVER.md` — runbook de produção.

## 15. Regra de manutenção

Este arquivo deve permitir responder rapidamente: o que está publicado, quais fontes alimentam o portal, o que está parcial/suspenso, quais decisões de produto limitam novas integrações e qual é o próximo trabalho real. Histórico detalhado permanece nos documentos especializados.
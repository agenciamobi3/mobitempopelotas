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
| Open-Meteo | Previsão principal; falha degrada localmente |
| MET Norway | Contingência compartilhada quando aplicável |
| Embrapa | Observação local centralizada e recuperação client-side |
| INMET meteorológico | Integrações individuais; falha parcial não equivale a INMET globalmente fora |
| Radar REDEMET | Probe independente |
| STSC | Probe independente |
| Satélite REDEMET | `partial` quando a API responde sem produto utilizável |
| GOES / INMET | 403 server-side tratado como falha da integração, não do portal público INMET |
| Hidrologia local/regional | Laranjal, Guaíba, Lagoa e Defesa Civil degradam por domínio |
| ANA / SNIRH / RHN | **Readiness/cross-check somente; sem ingestão planejada nesta fase**. Laranjal já coberto por duas fontes de coleta |
| Historical Data Layer | Ativo; separa `observation`, `forecast`, `reanalysis` e `derived` |
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

### Embrapa

Embrapa Clima Temperado é a principal observação local quando utilizável. Pageview não dispara coleta persistente.

### INMET

INMET fornece avisos, previsão complementar, estação e produtos específicos. Falha de uma integração é descrita apenas como falha daquela integração.

## 7. REDEMET / radar / satélite

`src/lib/status/data-status-redemet-probes.server.ts` mede Radar, satélite REDEMET, STSC e GOES/INMET independentemente, com teto de 5 s.

Semântica:

- Radar/STSC com quadro utilizável: `operational`;
- satélite REDEMET respondendo sem produto: `partial`;
- timeout/falha real: `offline` da integração;
- GOES/INMET 403: `offline` da integração server-side, sem afirmar indisponibilidade pública global.

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

## 10. Historical Data Layer

O arquivo canônico separa `observation`, `forecast`, `reanalysis` e `derived`. Fontes novas permanecem com governança explícita antes de qualquer ingestão.

A migration `defer_ana_rhn_ingestion_by_product_policy` registra a decisão de manter ANA/RHN em readiness/cross-check e exige decisão explícita para eventual ativação futura.

## 11. Segurança e runtime

Ativo: secrets server-side, RLS, gate geográfico, CSP, firewall de aplicação, rate limiting distribuído, allowlists/proxies de fontes, logs sanitizados e endpoint de runtime `no-store/noindex`.

WAF gerenciado de edge não deve ser confundido com firewall de aplicação.

## 12. Testes e deploy

Contratos versionados cobrem shell-first, navegação, cache, Open-Meteo, Embrapa, 15 dias, hidrologia, REDEMET, status histórico e ANA/RHN.

GitHub Actions continua falhando antes dos steps; portanto testes versionados não significam suíte executada. Lovable comprova sincronização/build de preview, não substitui CI completa.

## 13. Prioridades imediatas

1. Manter ANA/RHN em readiness/cross-check; **não gastar o caminho crítico do projeto tentando ativar uma terceira coleta do Laranjal agora**.
2. Continuar hardening de Open-Meteo/INMET/REDEMET com evidência real, sem aumento cego de budgets.
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

# Tempo Pelotas — estado atual do projeto

Última atualização: 29/08/2026  
Branch operacional: `main`  
Domínio canônico: `https://tempopelotas.com.br`

## 1. Fonte de verdade e regras permanentes

Este arquivo resume o estado operacional atual. Detalhes, evidências e histórico ficam em `docs/`; código ativo, migrations aplicadas e runtime publicado prevalecem sobre documentação antiga.

Regras que não devem ser quebradas:

- não versionar secrets, cookies, HARs, URLs autenticadas ou tokens;
- observação, previsão, alerta oficial, reanálise e dado derivado permanecem semanticamente separados;
- indisponibilidade nunca vira zero, normalidade ou diagnóstico automático;
- timeout, HTTP 403, falha de parsing ou bloqueio de integração não provam indisponibilidade global de uma fonte pública;
- dados correntes usam resposta `no-store/no-cache`; last-good conserva timestamp e idade reais;
- uma régua/cota não é convertida para outra referência sem metadados que sustentem a transformação;
- navegabilidade pública prevalece sobre a disponibilidade instantânea de qualquer integração externa;
- `main` é operacional e o histórico publicado não é reescrito.

## 2. Estado executivo

| Domínio | Estado atual |
| --- | --- |
| Portal público | **P0 de navegação estabilizado** no domínio canônico |
| Runtime publicado | Release identificável `2026-08-29-ana-rhn-readiness-v1`; `/api/runtime-version` é estático, `no-store` e `noindex` |
| Home / Hoje / Amanhã / 7 dias | **Shell-first**: documento inicial não aguarda fontes externas |
| Home sem dado inicial | Mostra “Atualizando dados meteorológicos...” durante o budget de recuperação; indisponibilidade só aparece após tentativa real |
| Open-Meteo | Previsão principal; falha degrada localmente e não bloqueia documento shell-first |
| MET Norway | Contingência compartilhada quando aplicável |
| Embrapa | Observação local centralizada; leitura pública read-only e recuperável após hidratação |
| INMET meteorológico | Integrações individuais preservadas; estado parcial não equivale a INMET globalmente indisponível |
| Radar REDEMET | Probe independente operacional em validações recentes |
| STSC | Probe independente operacional em validações recentes |
| Satélite REDEMET | `partial` quando a API responde sem produto utilizável; não recebe lookback arbitrário |
| GOES / INMET | Integração server-side pode retornar HTTP 403; isso não afirma indisponibilidade do portal INMET |
| Hidrologia local/regional | Laranjal, Guaíba, Lagoa e Defesa Civil degradam por domínio |
| ANA / SNIRH / RHN | **Readiness ativo, ingestão bloqueada**. Estação LARANJAL `87955001`; unidade e timezone confirmados, referência vertical ainda pendente |
| Historical Data Layer | Ativo, separando `observation`, `forecast`, `reanalysis` e `derived` |
| Monitor de status | Supabase `pg_cron` + `pg_net`, a cada 10 min; 14 serviços; histórico stale bloqueado após 30 min |
| Central Regional | Pelotas + 23 páginas municipais indexáveis |
| SEO técnico | 48 URLs indexáveis, canonical/sitemap/robots/Schema/BreadcrumbList ativos |
| Conta / Google | Fundação parcial operacional; E2E com duas contas ainda pendente |
| Free / PRO | Entitlements existem; billing comercial ainda não existe |
| Weather AI | Controlado e fora do caminho crítico das rotas shell-first |
| Service worker / Web Push | SW aposentado temporariamente; Web Push suspenso |
| GitHub Actions | **Bloqueado antes dos steps**; não declarar build/test/typecheck executados enquanto os jobs continuarem sem steps |
| Search Console | Recaptura pendente enquanto o conector estiver sem plano ativo |

## 3. Stack e operação

React 19, TypeScript 5.8, TanStack Start/Router, Vite 8, Nitro, Tailwind CSS 4, Supabase JS/SSR, MapLibre GL, Recharts e Zod. Lovable sincroniza/publica o repositório; o Supabase oficial é externo ao Lovable.

Scripts principais: `npm run build`, `npm test`, `npm run test:contracts`, `npm run test:routes`, `npm run routes:check`, `npm run typecheck`, `npm run lint`, `npm run quality:browser`, `npm run runtime:check` e `npm run cutover:smoke`.

Budgets públicos atuais:

- Home/Hoje/Amanhã/7 dias: nenhuma fonte externa no loader inicial;
- loaders meteorológicos secundários: 2,5 s por dependência;
- loaders hidrológicos: 2,5 s por dependência;
- Radar: 2,8 s por domínio;
- previsão de 15 dias: 2,8 s por domínio;
- inteligência meteorológica compartilhada: teto interno de 5 s.

## 4. Rotas públicas e SEO

`src/lib/public-routes.ts` é a fonte do sitemap. Inventário: **48 URLs indexáveis = 25 fixas + 23 municipais**.

Rotas fixas principais incluem Home, Hoje, Amanhã, 7 dias, 15 dias, Chuva, Vento, Meteograma, Alertas, Radar/Satélite, Geadas, Situação Hidrológica, Laranjal, Guaíba, Embrapa, Clima, Histórico, Enchentes 1941/2024, Câmeras, Região Sul RS, Blog, Status dos Dados, Metodologia e Privacidade.

Municípios aprovados: Capão do Leão, Canguçu, Morro Redondo, Turuçu, Arroio do Padre, Pedro Osório, Cerrito, Piratini, Rio Grande, São José do Norte, São Lourenço do Sul, Cristal, Jaguarão, Arroio Grande, Herval, Santa Vitória do Palmar, Chuí, Pinheiro Machado, Pedras Altas, Bagé, Candiota, Aceguá e Dom Pedrito.

Nenhuma nova cidade entra sem publication gate. O foco permanece na qualidade das URLs existentes.

## 5. Navegação e shell-first

As rotas `/`, `/tempo-hoje-pelotas`, `/tempo-amanha-pelotas` e `/previsao-7-dias-pelotas` entregam HTML independente de Open-Meteo, Embrapa, INMET, CPPMet e hidrologia no primeiro loader.

Depois da hidratação, a recuperação meteorológica reforça previsão e observação de forma independente. Modelo numérico não vira observação medida.

O menu público principal usa anchors nativas e a navegação pública é endurecida por documento completo. Preload SPA global por intenção e invalidação periódica da árvore foram retirados. O boundary “Carregando a versão mais recente do Tempo Pelotas” é contenção excepcional, não loading normal.

## 6. Previsão, observação e fontes oficiais

### Open-Meteo / MET Norway

Open-Meteo é a previsão principal. A rota de 15 dias usa chamada diária dedicada e nunca inventa dias 8–15. Se apenas 7 dias reais estiverem preservados, o estado é `partial` e `returnedDays` representa o que existe.

### Embrapa

Embrapa Clima Temperado é a referência principal de observação local quando utilizável. `/api/weather/embrapa` apenas lê o centralizador no pageview. Campos não fornecidos pela estação permanecem nulos.

### INMET

INMET permanece usado para avisos oficiais, previsão complementar, estação e produtos específicos. Falha de uma integração é descrita como falha daquela integração.

## 7. REDEMET / radar / satélite

O monitor não usa a composição editorial da página como prova de disponibilidade. `src/lib/status/data-status-redemet-probes.server.ts` mede Radar, satélite REDEMET, STSC e GOES/INMET independentemente, com teto de 5 s.

O coletor base não chama mais `getRedemetOverview()`, evitando trabalho duplicado.

Semântica atual:

- Radar/STSC com quadro utilizável: `operational`;
- REDEMET Satellite respondendo sem produto: `partial`;
- timeout/falha real de integração: `offline` da integração;
- GOES/INMET 403: `offline` da integração server-side, sem afirmar indisponibilidade pública global.

## 8. Hidrologia e ANA/RHN

### Fontes já operacionais

Laranjal/LabHidroSens, rede da Lagoa dos Patos, Guaíba e Defesa Civil RS permanecem independentes. Cada régua conserva sua própria referência.

### ANA / SNIRH / RHN — estação LARANJAL 87955001

A estação foi confirmada em serviços públicos oficiais do SNIRH/ANA:

- código: `87955001`;
- nome: LARANJAL;
- tipo: fluviométrica e telemétrica;
- município: Pelotas/RS;
- responsável e operadora: UFPel;
- parâmetro observado no último-dado público: `Nivel`;
- valor bruto observado em diagnóstico cruzado: `116.00`;
- unidade confirmada para cota/nível: **cm**;
- timezone confirmado para esta série: **`America/Sao_Paulo`**;
- referência vertical/zero da régua: **ainda não confirmada**.

A confirmação de unidade e timezone foi feita por evidência cruzada entre o ArcGIS público, o contrato oficial atual do HidroWebService e uma consulta diagnóstica ao serviço legado oficial. O serviço legado **não** é dependência de runtime.

No inventário público da estação, `Altitude=null`, `EscalaNivel=Não` e `RegistradorNivel=Não`. Portanto não existe base pública suficiente para converter `116 cm` em altitude, cota sobre o nível do mar ou referência equivalente.

Estado no Supabase oficial:

- `historical_data_sources.source_key = ana-rhn`;
- estação `ana-rhn-laranjal-87955001` registrada;
- `unitStatus=confirmed`, `unit=cm`;
- `timezoneStatus=confirmed`, `timezone=America/Sao_Paulo`;
- `verticalReferenceStatus=unconfirmed`;
- `collection_enabled=false`;
- `paid_access_allowed=false`;
- `publicMeasurementIngestionEnabled=false`;
- **zero medições ANA/RHN** no arquivo canônico.

O probe ANA participa apenas de readiness. Seu estado permanece `implementation`, portanto não entra no cálculo de disponibilidade do runtime. A primeira medição só pode ser gravada depois de confirmar a referência vertical específica da estação ou definir formalmente que o produto será publicado exclusivamente como cota relativa de régua com essa limitação documentada.

Documento de referência: `docs/ANA_RHN_INTEGRATION.md`.

## 9. Monitor de status

O monitor usa `pg_cron` + `pg_net` a cada 10 minutos. A migration do scheduler está aplicada no Supabase oficial. Uma coleta real no runtime `2026-08-29-ana-rhn-readiness-v1` persistiu 14 serviços e manteve `ana-rhn` como `implementation`.

A lacuna histórica anterior foi encerrada sem fabricar uma indisponibilidade contínua. Se nenhuma nova amostra for persistida por mais de 30 minutos, o histórico é tratado como stale.

## 10. Historical Data Layer

O arquivo canônico separa:

- `observation`;
- `forecast`;
- `reanalysis`;
- `derived`.

Fontes novas permanecem com `paid_access_allowed=false` até revisão de governança/redistribuição. A integração ANA segue essa regra.

## 11. Segurança e runtime

Ativo:

- secrets server-side;
- RLS;
- gate geográfico;
- CSP;
- firewall de aplicação;
- rate limiting distribuído para rotas sensíveis;
- proxies/allowlists de fontes;
- logs sanitizados;
- `/api/runtime-version` estático, `no-store` e `noindex`.

WAF gerenciado de edge não deve ser confundido com firewall de aplicação.

## 12. Testes e deploy

Contratos relevantes incluem shell-first, navegação por documento, políticas de cache, Open-Meteo, Embrapa, 15 dias, hidrologia, REDEMET, status histórico e ANA/RHN.

GitHub Actions continua falhando antes dos steps. Portanto a existência dos testes versionados não é declaração de execução. O Lovable comprova sincronização/build de preview, não substitui CI completa.

## 13. Prioridades imediatas

1. **Fechar a referência vertical da ANA/RHN LARANJAL 87955001** por evidência específica da estação/UFPel/ANA; não usar referência de estação vizinha ou código histórico diferente.
2. Depois disso, decidir o contrato de ingestão ANA: valor bruto em cm, referência, timestamp, QC, deduplicação e janela stale.
3. Só então habilitar coleta ANA e inserir a primeira `observation` no Historical Data Layer.
4. Revalidar `/status-dos-dados` após publicação do detalhe atualizado: ANA deve continuar `implementation` e mencionar apenas referência vertical como gate semântico restante quando o probe responder.
5. Continuar hardening de Open-Meteo/INMET/REDEMET sem aumentar budgets sem evidência.
6. Reintroduzir resumo hidrológico da Home apenas como recuperação isolada/client-side.
7. Resolver provisionamento do GitHub Actions e executar suíte completa, routes check, TypeScript, build e browser smoke.
8. Concluir E2E de autenticação com duas contas descartáveis.
9. Recapturar Search Console quando o conector estiver disponível.
10. Manter Service Worker e Web Push suspensos até estabilidade sustentada.

## 14. Documentos principais

- `docs/PUBLIC_ROUTE_RESILIENCE.md` — shell-first e budgets públicos;
- `docs/NAVIGATION_RUNTIME_RECOVERY_2026-08-27.md` — navegação e recuperação de runtime;
- `docs/DATA_STATUS_MONITOR_RECOVERY_2026-08-28.md` — scheduler e histórico do monitor;
- `docs/ANA_RHN_INTEGRATION.md` — contrato ANA/RHN e gates semânticos;
- `docs/HISTORICAL_DATA_INVENTORY.md` — arquivo histórico e governança;
- `docs/REDEMET_OPERATIONS.md` — REDEMET;
- `docs/SOURCE_RESILIENCE_INMET_REDEMET_2026-08-27.md` — contingências oficiais;
- `docs/FORECAST_15_DAY_IMPLEMENTATION_2026-08-26.md` — previsão de 15 dias;
- `docs/SEO_REFINEMENT_ENRICHMENT_2026-08-27.md` — SEO das URLs existentes;
- `docs/PRODUCTION_CUTOVER.md` — runbook de produção.

## 15. Regra de manutenção

Este arquivo deve permitir responder rapidamente: o que está publicado, quais fontes alimentam o portal, o que está parcial/suspenso, quais contratos semânticos estão fechados e qual é o bloqueio real para o próximo passo. Histórico detalhado permanece fora deste arquivo.

# Tempo Pelotas — estado atual do projeto

Última atualização: 29/08/2026  
Branch operacional: `main`  
Domínio canônico: `https://tempopelotas.com.br`

## 1. Papel deste documento

Este arquivo é a fonte de verdade de alto nível do Tempo Pelotas. Detalhes técnicos e histórico permanecem nos documentos especializados em `docs/`; código ativo, migrations e runtime publicado prevalecem sobre documentação histórica.

Regras permanentes:

- mudanças estruturais de página pública, fonte, SEO/indexação, runtime, banco, autenticação ou deploy atualizam este arquivo;
- não versionar HAR bruto, cookies, tokens, secrets ou URLs autenticadas;
- observação, previsão, alerta oficial, reanálise e dado derivado permanecem semanticamente separados;
- indisponibilidade nunca vira valor zero, situação normal ou diagnóstico automático;
- timeout, HTTP 403, falha de parsing ou bloqueio da integração não provam indisponibilidade global da fonte pública;
- superfícies de condição/status **agora** não servem resposta HTTP velha por `max-age`/`stale-while-revalidate`; last-good só pode reaparecer com timestamp/idade reais e estado stale/degradado explícito;
- navegabilidade pública prevalece sobre disponibilidade instantânea de qualquer integração externa;
- `main` é a branch operacional; histórico publicado não é reescrito.

## 2. Estado executivo

Tempo Pelotas é um portal meteorológico e hidrológico regional para Pelotas e Zona Sul do Rio Grande do Sul, com previsão, observação local, chuva, vento, alertas, radar/satélite, hidrologia, histórico, câmeras, páginas municipais e conteúdo editorial/SEO.

| Domínio | Estado atual |
| --- | --- |
| Portal público / navegação | **P0 estabilizado no domínio canônico**. Smoke externo recente confirmou 16/16 rotas principais com HTTP 200 e sem boundary global no documento |
| Home / Hoje / Amanhã / 7 dias | **Shell-first ativo**. Primeiro documento não depende de fontes externas; previsão e observação entram progressivamente depois da hidratação |
| Home shell-first | O estado inicial comunica **“Atualizando dados meteorológicos...”** durante o budget de recuperação; “temporariamente indisponíveis” só aparece depois de tentativa sem dado utilizável |
| Previsão de 15 dias | Ativa; Open-Meteo diário dedicado e fallback parcial apenas com dias reais preservados; nenhum dia 8–15 é inventado |
| Chuva / vento / meteograma | Ativos com budgets públicos e degradação independente |
| Alertas | Ativos com semântica oficial do INMET preservada |
| Embrapa | Ativa; observação centralizada read-only no pageview, recuperável no navegador nas rotas shell-first |
| Radar REDEMET | **Operacional** no probe real mais recente |
| STSC / trovoadas | **Operacional** no probe real mais recente |
| Satélite REDEMET | **Parcial**: API responde, mas `data` veio vazio na referência atual e na hora UTC anterior; não é classificado como fonte globalmente offline |
| GOES / INMET | **Integração server-side offline por HTTP 403**; isso não afirma indisponibilidade do portal público do INMET |
| Hidrologia | Ativa; Laranjal, Guaíba, Lagoa e Defesa Civil degradam por domínio |
| Defesa Civil RS | Operacional no recorte regional; kill switch preservado |
| ANA / RHN | **Em implementação/validação**; ainda não substitui fontes existentes |
| Monitor de status | Ativo via Supabase `pg_cron` + `pg_net`; quatro camadas Radar/Satélite são medidas por probes independentes |
| Central Regional | Ativa: Pelotas + 23 páginas municipais indexáveis |
| SEO técnico | Ativo: canonical, sitemap, robots, OG/Twitter, Schema.org, links internos e BreadcrumbList regional |
| Conta / Google | Fundação parcial operacional; E2E real com duas contas segue pendente |
| Free / PRO | Fundação de entitlement pronta; billing comercial ainda não existe |
| Weather AI | Ativo controlado; não participa do primeiro documento das rotas shell-first |
| Gate geográfico / CSP / rate limit | Ativos em aplicação; smokes completos ainda pendentes |
| Service worker / Web Push | Service worker aposentado temporariamente; Web Push suspenso |
| GitHub Actions | **Bloqueado antes dos steps**. Jobs recentes nascem sem execução normal; não declarar testes/build/typecheck aprovados ou reprovados |
| Search Console | Recaptura bloqueada enquanto o GSC Wizard estiver sem plano ativo |

## 3. Stack e operação

Stack principal: React 19, TypeScript 5.8, TanStack Start/Router, Vite 8, Nitro, Tailwind CSS 4, Supabase JS/SSR, MapLibre GL, Recharts e Zod. Lovable sincroniza/publica a aplicação; o Supabase oficial é externo ao Lovable.

Scripts principais: `npm run build`, `npm test`, `npm run test:contracts`, `npm run test:routes`, `npm run routes:check`, `npm run typecheck`, `npm run lint`, `npm run quality:browser`, `npm run quality:assets`, `npm run runtime:check` e `npm run cutover:smoke`.

Política de cache:

- respostas correntes usam `no-store/no-cache`;
- caches internos, snapshots e last-good podem preservar a última amostra real;
- timestamp, idade e estado original nunca são reescritos para parecer atuais.

Política de latência:

- Home, Hoje, Amanhã e 7 dias não aguardam fontes externas no loader inicial;
- loaders meteorológicos secundários: 2,5 s por dependência;
- loaders hidrológicos: 2,5 s por dependência;
- Radar público: 2,8 s por domínio;
- previsão de 15 dias: 2,8 s por domínio;
- inteligência meteorológica compartilhada mantém budget interno próprio de 5 s.

## 4. Rotas públicas e SEO

`src/lib/public-routes.ts` é a fonte programática do sitemap. Inventário atual: **48 URLs indexáveis = 25 fixas + 23 municipais**.

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

Municípios aprovados: Capão do Leão, Canguçu, Morro Redondo, Turuçu, Arroio do Padre, Pedro Osório, Cerrito, Piratini, Rio Grande, São José do Norte, São Lourenço do Sul, Cristal, Jaguarão, Arroio Grande, Herval, Santa Vitória do Palmar, Chuí, Pinheiro Machado, Pedras Altas, Bagé, Candiota, Aceguá e Dom Pedrito.

As páginas municipais possuem perfil editorial específico e BreadcrumbList Tempo Pelotas → Região → Município. Nenhuma cidade nova é indexada sem publication gate. O foco atual é qualidade das 48 URLs existentes, não expansão em massa.

## 5. Shell-first e navegação pública

As quatro rotas mais acessadas entregam contrato local antes de consultar fontes:

- `/`;
- `/tempo-hoje-pelotas`;
- `/tempo-amanha-pelotas`;
- `/previsao-7-dias-pelotas`.

Depois da hidratação, `useOpenMeteoIntelligenceRecovery()` recupera de forma independente:

1. previsão Open-Meteo;
2. observação Embrapa via endpoint read-only centralizado.

Modelo numérico não vira observação. Campos não fornecidos pela estação permanecem nulos.

Na Home, ausência de dado no primeiro contrato não é mais comunicada imediatamente como falha. `ProductionHome` mantém uma janela de **12,25 s** alinhada ao ciclo de recuperação e mostra “Atualizando dados meteorológicos...”. Só depois desse período, se continuar sem dado utilizável, muda para “Dados meteorológicos temporariamente indisponíveis”. Atalhos e navegação permanecem disponíveis nos dois estados.

Validação real de 29/08/2026 no domínio canônico confirmou:

- `/api/runtime-version` HTTP 200 no novo deployment;
- Home HTTP 200;
- primeiro HTML contém “Atualizando dados meteorológicos...”;
- primeiro HTML não contém os títulos antigo/confirmado de indisponibilidade;
- texto de que a página permanece navegável está presente.

A navegação pública continua endurecida por documento completo. Menu principal usa anchors nativas; preload SPA global e invalidação periódica foram retirados. O boundary “Carregando a versão mais recente do Tempo Pelotas” é exceção de recuperação, nunca loading normal.

O root possui uma única tentativa de reload de documento fresco quando um erro alcança o boundary, inclusive se o runtime cliente ainda não conseguiu marcar prontidão. `sessionStorage` impede loop.

## 6. Previsão e observação

### 6.1. Open-Meteo e MET Norway

Open-Meteo é a previsão numérica principal; MET Norway é contingência compartilhada quando aplicável. Falha de uma fonte não deve destruir o documento.

Na previsão de 15 dias:

- chamada direta diária: 2,2 s;
- página: 2,8 s por domínio;
- se a chamada de 15 dias falhar ou retornar zero dias utilizáveis, a rota pode reutilizar o payload Open-Meteo preservado;
- somente os dias reais existentes são publicados como `partial`;
- `requestedDays` permanece 15 e `returnedDays` representa o que realmente existe;
- dias 8–15 nunca são extrapolados, repetidos ou inventados.

### 6.2. Embrapa

Embrapa Clima Temperado é a referência principal de observação local quando utilizável. `/api/weather/embrapa` usa `no-store` e lê o centralizador persistido sem disparar coleta durante o pageview.

Nas rotas shell-first, a observação é recuperada depois da hidratação. Temperatura, umidade, pressão, vento e demais campos só recebem proveniência Embrapa quando realmente fornecidos pela observação.

### 6.3. INMET meteorológico

INMET continua usado para avisos oficiais, previsão complementar, estação e produtos específicos. No monitor mais recente, a família meteorológica INMET estava parcial; o estado reflete integrações individuais e não é transformado em afirmação de indisponibilidade global.

## 7. Radar e satélite

A página `/radar-e-satelite-pelotas` mantém composição editorial resiliente, mas **monitoramento operacional não depende mais do loader da página**.

`src/lib/status/data-status-redemet-probes.server.ts` mede independentemente:

- Radar REDEMET;
- satélite REDEMET `realcada`;
- STSC/trovoadas;
- GOES/INMET.

Cada probe tem teto operacional de 5 s e persiste o motivo sanitizado da falha. O coletor base não chama mais `getRedemetOverview()`; isso remove a antiga coleta duplicada antes dos probes independentes.

Último smoke real após essa otimização persistiu todos os **14 serviços** esperados e manteve:

- `redemet-radar`: `operational`, com quadro utilizável;
- `redemet-stsc`: `operational`, com dois quadros utilizáveis;
- `redemet-satellite`: `partial`;
- `inmet-satellite`: `offline` da integração server-side por HTTP 403.

### 7.1. Satélite REDEMET

A API respondeu com estrutura `status`, `message`, `data`, porém `data` veio como array vazio. O adapter registra somente diagnóstico estrutural sanitizado: existência de bounds, quantidade de imagens aceitas, hostnames candidatos e nomes de chaves; API key e URL autenticada não são registradas.

Quando a referência atual retorna sucesso sem imagem utilizável, existe **uma única tentativa** usando `data=YYYYMMDDHH` para a hora UTC anterior, com budget compartilhado. Em produção, tanto a referência atual quanto a hora anterior retornaram `data: []`.

Não existe lookback por várias horas. O portal não “caça” imagem velha para simular produto atual. Como a API respondeu mas não forneceu produto, o monitor classifica a integração como `partial`, não `offline` global.

### 7.2. GOES / INMET

Produto integrado: `GOES / S / IV` (`GOES — infravermelho`). O adapter tentou o contexto HTTP esperado e uma tentativa controlada sem `Origin`; a integração server-side retornou HTTP 403.

O monitor registra explicitamente que o 403 é recusa daquela integração e **não confirma indisponibilidade do portal público do INMET**.

## 8. Hidrologia e histórico

Laranjal, Guaíba, rede regional da Lagoa dos Patos e Defesa Civil RS permanecem independentes. Respostas correntes são `no-store`; last-good conserva timestamp/idade real.

A Home não recoloca hidrologia no loader crítico. Se o resumo for reintroduzido, deve ser recuperação isolada/client-side.

`/nivel-do-guaiba` mantém Cais Mauá e Gasômetro como referências independentes. Cotas de uma régua não são transferidas automaticamente para outra nem convertidas em diagnóstico para Pelotas.

Historical Data Layer separa `observation`, `forecast`, `reanalysis` e `derived`. As páginas de enchentes de 1941 e 2024 mantêm contexto histórico e limites semânticos.

### 8.1. ANA / RHN

ANA/RHN é a próxima frente estrutural relevante. O acesso está concedido, mas a integração pública permanece em implantação. Antes de substituir ou complementar fontes existentes é obrigatório confirmar:

- estação e identificador;
- parâmetro;
- unidade;
- datum/referência vertical;
- timezone;
- frequência e latência;
- governança/proveniência;
- comportamento de lacunas e last-good.

Documentos-base: `docs/ANA_RHN_INTEGRATION.md`, `docs/HISTORICAL_DATA_INVENTORY.md` e `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md`.

## 9. Monitor de status

A migration `20260828170000_data_status_supabase_scheduler.sql` está aplicada no Supabase oficial. `pg_cron` + `pg_net` disparam `/api/cron/data-status` a cada 10 minutos. O histórico fica stale após 30 minutos sem nova amostra.

O cron e `/status-dos-dados` usam o mesmo wrapper com probes independentes de Radar/Satélite. A coleta base cobre meteorologia, Embrapa e hidrologia; os quatro serviços Radar/Satélite entram uma única vez pelos probes próprios.

Amostra real de 29/08/2026 após remoção da duplicidade persistiu 14 serviços, incluindo ANA/RHN como `implementation`. Portanto a otimização não reduziu cobertura do monitor.

## 10. Segurança, conta e IA

Ativo:

- secrets server-side;
- gate geográfico de visitantes em hosts de produção;
- CSP com allowlist;
- guards de método/tamanho;
- rate limiting distribuído em rotas sensíveis;
- RLS no Supabase;
- proxies/allowlists de integração;
- logs sanitizados;
- resposta geográfica bloqueada `noindex`.

WAF gerenciado de edge não deve ser confundido com firewall da aplicação.

Conta/Google e entitlements possuem fundação implementada, mas E2E real com duas contas e billing comercial permanecem pendentes.

Weather AI opera por snapshot server-side/fallback determinístico e nunca é requisito do primeiro documento público. IA não cria nem altera aviso oficial.

## 11. Service worker e Web Push

Service worker permanece temporariamente aposentado. O runtime remove registrations próprias antigas e caches `tempo-pelotas-*` de forma tolerante a falha. Manifest permanece. Web Push continua suspenso.

## 12. Qualidade e CI

Contratos adicionados/reforçados nesta fase incluem:

- `tests/public-navigation-stability.test.ts`;
- `tests/open-meteo-browser-recovery.test.ts`;
- `tests/home-shell-first-status.test.ts`;
- `tests/fifteen-day-forecast.test.ts`;
- `tests/redemet-performance.test.ts`;
- `tests/data-status-redemet-probes.test.ts`;
- `tests/source-resilience-regressions.test.ts`;
- contratos hidrológicos, regionais e SEO existentes.

`tests/home-shell-first-status.test.ts` e `tests/data-status-redemet-probes.test.ts` estão incluídos em `test:contracts`.

O GitHub Actions continua falhando **antes da execução normal dos steps**, com jobs sem steps/logs utilizáveis. A reconstrução de preview do Lovable comprova sincronização/build daquele ambiente, mas não substitui `npm test`, build, typecheck, lint ou Browser Quality Smoke completos. Não declarar esses gates aprovados/reprovados até existir execução real.

## 13. Deploy e diagnóstico de release

`/api/runtime-version` responde um identificador estático, `no-store` e `noindex`, sem depender de fonte externa. Ele é usado para confirmar propagação de deployment no domínio oficial.

Validações reais recentes confirmaram o release shell-first no domínio canônico e mudanças sucessivas do `x-deployment-id` após publicação. O P0 não está mais aguardando confirmação de cutover básico.

Commits funcionais recentes relevantes:

- `b494b202` — recovery do boundary mesmo antes do runtime pronto;
- `bb8efa4e` — preservar previsão parcial real quando Open-Meteo 15 dias falha;
- `8f252b42` / `5267500d` — probes independentes e persistência Radar/Satélite;
- `99106a70` — tentativa única da hora UTC anterior no satélite REDEMET;
- `9c162cce` — satélite REDEMET responsivo sem produto passa a `partial`;
- `689a010a` — Home distingue atualização inicial de indisponibilidade confirmada;
- `fa8da8d0` — remove coleta REDEMET duplicada do status base.

## 14. Pendências prioritárias

1. **Historical Data Layer / ANA-RHN:** validar contrato de estação/parâmetro/unidade/datum/timezone e implementar ingestão sem substituir prematuramente as fontes atuais.
2. Validar em navegador real desktop/mobile a recuperação Embrapa/Open-Meteo nas rotas shell-first e a permanência da Home durante recuperação longa.
3. Manter acompanhamento dos satélites: REDEMET `partial` enquanto responder sem produto; GOES/INMET como falha de integração 403 até existir rota server-side utilizável. Não ampliar lookback arbitrariamente.
4. Reintroduzir resumo hidrológico da Home apenas como enhancement isolado, nunca no loader inicial.
5. Validar páginas municipais enriquecidas em desktop/mobile/anônimo e BreadcrumbList via navegador/fonte renderizada.
6. Recapturar Search Console quando o conector voltar a estar disponível; não abrir novas cidades sem evidência.
7. Resolver o provisionamento/execução do GitHub Actions e então rodar suíte completa, `routes:check`, build, TypeScript, lint e Browser Quality Smoke.
8. Concluir E2E de autenticação com duas contas descartáveis.
9. Validar smokes de segurança, CSP, gate geográfico e rate limiting no ambiente real.
10. Manter Web Push suspenso e service worker aposentado até estabilidade sustentada.
11. Não publicar previsão de 30 dias até existir contrato específico de tendência para dias 16–30.

## 15. Documentos especializados principais

| Documento | Finalidade |
| --- | --- |
| `MIGRATION_MATRIX.md` | Migração, paridade e pendências históricas |
| `WEATHER_PAGE_IDENTITY.md` | Identidade das páginas meteorológicas |
| `docs/PUBLIC_ROUTE_RESILIENCE.md` | Shell-first, fallbacks e budgets públicos |
| `docs/NAVIGATION_RUNTIME_RECOVERY_2026-08-27.md` | Navegação, recovery e SW aposentado |
| `docs/DATA_STATUS_MONITOR_RECOVERY_2026-08-28.md` | Monitor histórico e scheduler Supabase |
| `docs/REDEMET_OPERATIONS.md` | Operação REDEMET |
| `docs/SOURCE_RESILIENCE_INMET_REDEMET_2026-08-27.md` | Contingências INMET/REDEMET |
| `docs/INMET_SATELLITE_PRODUCTS_2026-08-23.md` | Produtos GOES/INMET |
| `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md` | Rede Defesa Civil RS |
| `docs/ANA_RHN_INTEGRATION.md` | ANA/RHN e gates de estação |
| `docs/HISTORICAL_DATA_INVENTORY.md` | Histórico, governança e coletores |
| `docs/FLOOD_1941_RESEARCH_2026-08-27.md` | Base documental da enchente de 1941 |
| `docs/SEO_GSC_BASELINE_2026-08-16.md` | Baseline Search Console |
| `docs/SEO_SEARCH_INTENT_PLAN_2026-08-26.md` | Arquitetura de intenção SEO |
| `docs/SEO_REFINEMENT_ENRICHMENT_2026-08-27.md` | Refinamento das URLs atuais |
| `docs/SEO_REGIONAL_EDITORIAL_COMPLETION_2026-08-28.md` | Conteúdo/Breadcrumb municipal |
| `docs/QUALITY_A11Y_CWV_2026-08-27.md` | Acessibilidade e Browser Quality |
| `docs/FORECAST_15_DAY_IMPLEMENTATION_2026-08-26.md` | Previsão de 15 dias |
| `docs/ACCOUNT_AND_PRO_ARCHITECTURE.md` | Conta/PRO |
| `docs/PRODUCTION_CUTOVER.md` | Runbook de produção |
| `docs/RUNTIME_READINESS.md` | Preflight de runtime |

## 16. Regra de manutenção

Uma pessoa deve conseguir abrir este arquivo e responder rapidamente: quais páginas existem, de onde vêm os dados, o que é observação/previsão/alerta, quais integrações estão operacionais/parciais, como o runtime público opera e qual é a próxima prioridade.

Detalhe histórico fica nos documentos especializados; este arquivo deve permanecer compacto e atual.
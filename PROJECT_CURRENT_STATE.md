# Tempo Pelotas — estado atual do projeto

Última atualização: 28/08/2026  
Branch operacional: `main`  
Domínio canônico: `https://tempopelotas.com.br`

## 1. Papel deste documento

Este arquivo é a fonte de verdade de alto nível do Tempo Pelotas. Detalhes técnicos ficam nos documentos especializados em `docs/`; código ativo, workflows e migrations prevalecem sobre documentação histórica.

Regras permanentes:

- mudanças estruturais de página pública, fonte, SEO/indexação, runtime, banco, autenticação ou deploy atualizam este arquivo no mesmo conjunto;
- não versionar HAR bruto, cookies, tokens, secrets ou URLs autenticadas;
- observação, previsão, alerta oficial, reanálise e dado derivado permanecem semanticamente separados;
- indisponibilidade nunca vira valor zero, situação normal ou diagnóstico automático;
- falha, timeout, HTTP 403 ou parsing da integração não devem ser apresentados como prova de indisponibilidade global da fonte pública;
- superfícies que afirmam mostrar condição, nível ou status **agora** não podem servir uma resposta HTTP antiga por `max-age`/`stale-while-revalidate`; em falha de coleta, a última amostra real persistida pode permanecer visível somente com seu horário/idade originais e estado stale/degradado explícito;
- **navegabilidade pública prevalece sobre a disponibilidade de uma camada externa**: um loader lento deve degradar seu domínio, não reter ou derrubar o documento inteiro;
- `main` é a branch operacional; não reescrever histórico publicado.

## 2. Visão executiva

Tempo Pelotas é um portal meteorológico e hidrológico regional para Pelotas e Zona Sul do Rio Grande do Sul. Combina previsão, observação local, chuva, vento, meteograma, alertas oficiais, radar/satélite, hidrologia, histórico, câmeras, páginas municipais e conteúdo editorial/SEO.

| Domínio | Estado | Observação |
| --- | --- | --- |
| Portal público | **P0 de estabilidade em publicação** | Prioridade atual é navegação previsível; documento deve abrir antes de integrações lentas |
| Home / Hoje / Amanhã / 7 dias | Ativo com hardening P0 | Home limita meteorologia a 2,5 s; loaders meteorológicos públicos compartilhados limitam cada dependência a 2,5 s |
| Previsão de 15 dias | Ativo | Open-Meteo diário dedicado; contingência pode reutilizar até 7 dias reais como janela parcial; budget local de página de 2,8 s por dependência |
| Chuva / vento / meteograma | Ativo | Domínios independentes com teto público de 2,5 s e fallback explícito |
| Alertas | Ativo | INMET, preservando validade/abrangência e com fallback final da rota |
| Previsão municipal INMET | Hardening em validação | Timeouts ampliados e chamadas alinhadas ao contexto do portal; falha da integração não é rotulada como INMET globalmente fora |
| Embrapa Clima Temperado | Ativo | Observação, saúde do coletor e histórico de 24 h degradam independentemente |
| Dados correntes / “Agora” | Hardening ativo | Respostas correntes usam `no-store/no-cache`; última amostra real persistida continua permitida com timestamp/idade originais |
| REDEMET / DECEA | Hardening em validação | Radar, satélite e STSC usam contratos resilientes; página de Radar possui budget local de 2,8 s |
| Satélite GOES / INMET | Hardening em validação | Adapter aceita JSON/base64, contexto HTTP do portal e distingue erro da integração de indisponibilidade pública |
| Hidrologia | Ativo com hardening P0 | Laranjal, Guaíba, Lagoa, SACE e Defesa Civil degradam independentemente; loaders públicos têm teto de 2,5 s por dependência |
| Monitor de status | Ativo via Supabase | `pg_cron` + `pg_net` executam coleta a cada 10 min; histórico stale é bloqueado após 30 min sem nova amostra |
| Defesa Civil RS | Ativo | Hidrometeorologia regional com kill switch server-side |
| Histórico climático | Ativo | Histórico recente e Historical Data Layer em expansão; falha de transporte gera estado indisponível |
| Enchentes 1941 / 2024 | Ativo | Páginas históricas com fontes institucionais e limites semânticos |
| Câmeras | Ativo com dependência externa | Câmera e meteorologia degradam independentemente; live/replay preservados |
| Central Regional | Ativo | Pelotas + 23 páginas municipais; fallback mantém diretório e páginas indexáveis navegáveis |
| SEO técnico | Ativo | Canonical, sitemap, robots, OG/Twitter, Schema.org, links internos, BreadcrumbList regional e cobertura editorial municipal completa |
| Conta / Google | Parcial operacional | Fundação implementada; E2E real com duas contas ainda pendente |
| Free / PRO | Fundação pronta | Entitlements existem; billing comercial ainda não existe |
| Weather AI | Ativo controlado | Snapshot server-side, orçamento e fallback determinístico |
| Gate geográfico / CSP / rate limit | Ativo | Segurança em camada de aplicação; smokes reais ainda precisam ser confirmados |
| Navegação pública | **Hotfix P0 na `main`** | Links públicos usam documento completo; invalidação global por minuto foi retirada; boundary global é contenção excepcional |
| Service worker / offline PWA | Temporariamente aposentado | Manifest e conectividade permanecem; `/sw.js` não é mais registrado |
| Web Push | Suspenso | Código preservado, manager fora do root |
| Qualidade / CI | Gates versionados, runner não executa steps | Runs recentes criam job e falham antes de qualquer step; não há evidência de teste/build executado |

## 3. Stack e operação

Stack principal: React 19, TypeScript 5.8, TanStack Start/Router, Vite 8, Nitro, Tailwind CSS 4, Supabase JS/SSR, MapLibre GL, Recharts e Zod. Node 24 é usado nos workflows. Lovable é o ambiente conectado de sincronização/publicação; o Supabase oficial permanece externo ao Lovable.

Scripts principais: `npm run build`, `npm test`, `npm run test:contracts`, `npm run test:routes`, `npm run routes:check`, `npm run typecheck`, `npm run lint`, `npm run quality:browser`, `npm run quality:assets`, `npm run runtime:check` e `npm run cutover:smoke`.

Rotas que renderizam `InternalWeatherPageShell` ou `ContentPageShell` são standalone em `SiteLayout`, evitando header/footer/main duplicados.

A política de cache diferencia **resposta pública corrente** de **cache/persistência de fonte**. `src/lib/current-data-cache.ts` define `Cache-Control: no-store, no-cache, must-revalidate`, `CDN-Cache-Control: no-store`, `Pragma: no-cache` e `Expires: 0` para superfícies de “Agora”. Coletores, snapshots, last-known e caches internos continuam permitidos para preservar a última amostra real sem transformar uma visita em coleta obrigatória.

A política de latência também diferencia **budget de fonte** de **budget de documento público**. Fontes podem usar budgets internos maiores; a navegação pública usa limites menores e devolve fallback quando eles são atingidos.

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

`src/lib/weather/public-weather-page-loader.ts` é a barreira final das páginas meteorológicas públicas. Depois do hotfix P0 de 28/08, `loadPublicWeatherPage()` e cada domínio de `loadPublicWeatherWithMeteogram()` possuem **budget local de 2,5 s**. Uma server function lenta ou rejeitada recebe `createUnavailableWeatherIntelligence()`/fallback de meteograma em vez de alcançar o boundary global.

A barreira interna da inteligência meteorológica continua em **5 s**. Esse teto interno é deliberadamente maior que o teto de documento público: ele atende composição e outras camadas, mas não obriga o visitante a esperar os 5 s.

Os budgets das fontes oficiais permanecem calibrados separadamente: previsão municipal INMET até 4 s, requests atual/histórico em torno de 3,2 s e 2,8 s, e fontes auxiliares com seus próprios limites. Um timeout é descrito como falha daquela integração, não como indisponibilidade global da fonte.

### 5.1. Home

A Home possui contrato próprio para impedir que o caminho principal fique retido por dependências:

- meteorologia principal: **2,5 s**;
- bloco hidrológico: continua diferido e recebe **3,5 s**;
- câmera continua como aprimoramento progressivo após carregamento.

Se uma camada não responder, a Home abre com seu estado indisponível sem inventar valor.

### 5.2. Previsão de 15 dias

`/previsao-15-dias-pelotas` usa chamada independente, somente com campos diários, timeout próprio e estados `live|partial|unavailable`. Dias 1–7 e 8–15 são separados visualmente. Não existe previsão diária artificial de 30 dias.

`src/lib/weather/extended-forecast-page-loader.ts` executa meteorologia compartilhada e janela estendida através de dependências já protegidas e usa **budget local de 2,8 s por domínio**. A página degrada cada domínio independentemente.

A consulta estendida direta mantém timeout de **2,2 s**. Se falhar, tiver payload incompatível ou zero dias utilizáveis, pode reutilizar o cache Open-Meteo preservado. Como o contrato compartilhado preserva 7 dias, a rota publica somente os dias reais disponíveis como `partial`, mantendo `requestedDays: 15`; dias 8–15 nunca são criados ou repetidos.

### 5.3. Contingência Open-Meteo

O fluxo atual é:

1. origem Open-Meteo direta;
2. se utilizável, retornar;
3. em falha, tentar o último payload validado do cache privado `weather_provider_payload_cache`;
4. somente quando o cache não puder atender, consultar configuração/token e chamar a Edge Function;
5. se nada puder atender, preservar `unavailable`.

O cache preserva o timestamp real. O fallback Edge possui budget próprio de 1,6 s. O monitor já confirmou em produção que a leitura cache-first entrou no runtime e que Open-Meteo voltou a ser classificado como operacional em amostras reais.

## 6. Observação e fontes oficiais

Embrapa Clima Temperado é a referência principal de observação local quando utilizável. Modelo numérico não substitui silenciosamente observação ausente.

A resposta pública corrente da meteorologia consolidada e `/api/weather/embrapa` usa `no-store`. `getCentralEmbrapaObservation()` continua lendo a amostra persistida e pode devolver a última leitura válida quando a coleta corrente falha. O horário/idade da observação prevalece; uma leitura antiga não recebe timestamp novo por causa de uma nova visita.

O monitor operacional foi desacoplado da composição completa do Weather AI. A saúde da Embrapa é medida pelo próprio centralizador persistido; após o ajuste, amostras reais passaram a classificá-la como operacional de forma consistente.

INMET permanece usado para avisos oficiais, previsão complementar, estação/referências e produtos específicos como geadas. Falha de consulta não equivale a ausência de risco.

### 6.1. GOES / INMET

O produto integrado permanece `GOES / S / IV`, apresentado como `GOES — infravermelho`. HTTP 403 recebido pelo backend é recusa daquela chamada server-side, não prova de que o portal público do INMET esteja fora.

O adapter envia contexto esperado pelo portal e pode fazer uma tentativa controlada sem `Origin`. O proxy `/api/redemet/image` aceita imagem binária ou JSON contendo `base64`, valida assinatura JPEG/PNG/WebP/GIF, host e limite de 12 MB antes de devolver bytes ao navegador.

### 6.2. REDEMET / DECEA

REDEMET/DECEA fornece radar, satélite e STSC/trovoadas. Imagem recente não é automaticamente chamada de “tempo real”; timestamp da fonte prevalece. Canal Visível não recebe fallback infravermelho.

Radar e STSC usam autenticação por query `api_key`. Satélite REDEMET também usa `api_key` exclusivamente server-side, com allowlist e sem log da URL autenticada.

`src/lib/redemet/redemet.functions.ts` consulta Radar, satélite REDEMET, GOES/INMET e STSC de forma independente. O overview mantém seu budget interno, mas `src/lib/redemet/radar-page-loader.ts` limita o **documento público a 2,8 s por domínio**. Uma fonte lenta passa a estado indisponível naquele carregamento sem impedir a página de abrir.

O last-good REDEMET em memória permanece uma conveniência de processo, não fonte persistente de verdade. O monitor de status deve continuar evoluindo para probes independentes das integrações, sem usar a composição editorial da página como prova de disponibilidade global.

## 7. Chuva, vento e estados degradados

`/chuva-em-pelotas` separa chuva observada, prevista, acumulados regionais e aviso oficial. Observado e previsto não são somados automaticamente.

Vento, Chuva e Meteograma usam o loader compartilhado com `settlePageDependency()`: as dependências são executadas em paralelo, cada uma com fallback e teto de 2,5 s. Uma camada lenta não derruba as demais.

Clima e Histórico recente usam fallback explícito. Câmeras possuem fallback próprio; câmera não bloqueia meteorologia principal.

## 8. Hidrologia

A Estação Laranjal é referência operacional local apresentada para Pelotas. Nível, horário, idade, tendência e variações são preservados sem transformar leitura atrasada em valor atual.

As respostas correntes de Laranjal, Guaíba e rede da Lagoa usam `no-store/no-cache`. Cache/persistência da fonte continua separado; se não houver nova coleta, a última amostra válida só pode aparecer com horário/idade originais e estado stale/degradado.

`src/lib/hydrology/public-hydrology-page-loader.ts` centraliza os fallbacks. No hotfix P0, todas as dependências públicas receberam **budget local de 2,5 s**: meteorologia, Laranjal, Guaíba, Lagoa, SACE e Defesa Civil. A composição usa dependências protegidas; falha ou atraso de uma não alcança o boundary global.

`/nivel-do-guaiba` mantém Cais Mauá e Gasômetro como referências independentes. Nível do Guaíba não é convertido automaticamente em diagnóstico para Pelotas nem cotas são transferidas entre réguas.

Defesa Civil RS permanece ativa com kill switch. ANA/RHN continua em validação; estação, parâmetro, unidade, datum/referência, timezone e governança precisam ser confirmados antes de substituir fontes existentes.

## 9. Histórico e memória das cheias

O Historical Data Layer mantém separação entre `observation`, `forecast`, `reanalysis` e `derived`.

`/historico-climatico-pelotas` representa histórico meteorológico recente; `/clima-em-pelotas` representa clima/climatologia. Falhas viram estado indisponível, não números simulados.

`/enchente-1941-pelotas` usa pesquisa documental e trata 2,88 m como referência histórica contextual do Canal São Gonçalo, não como cota transferível à Estação Laranjal ou outras réguas. A página de 2024 permanece como registro histórico. As duas páginas têm ligação recíproca.

## 10. Central Regional

`/tempo-na-regiao-sul-rs` é o hub das 24 cidades aprovadas. O resumo usa Open-Meteo em lote, rotulado como estimativa de modelo. Se a visão regional falha, o fallback mantém as 24 cidades e seus links disponíveis sem inventar temperatura, chuva ou vento.

`RegionalCitiesMap` possui boundary próprio; falha do mapa não derruba lista, busca, filtros ou links.

As 23 páginas municipais indexáveis possuem perfil editorial específico, title/description/hero/bloco editorial próprios e `BreadcrumbList` Tempo Pelotas → Região → Município. FAQ genérico em massa permanece proibido pelo gate anti-template.

## 11. SEO e pesquisa de intenção

Arquitetura por horizonte:

- agora: Home;
- hoje/por hora: `/tempo-hoje-pelotas`;
- amanhã: `/tempo-amanha-pelotas`;
- 7 dias/semana: `/previsao-7-dias-pelotas`;
- 10/15 dias: `/previsao-15-dias-pelotas`;
- 20/30 dias: não publicado.

A fase atual é de refinamento das 48 URLs existentes. A cobertura editorial municipal está completa; expansão deve ser guiada por Search Console/publication gate. O GSC Wizard segue bloqueado por assinatura enquanto não houver plano ativo.

## 12. Conta, Free e PRO

Fundação existente: Google Identity Services + Supabase Auth por ID Token, sessão SSR, `/conta`, `/painel` autenticado/noindex, preferências/consentimentos, exportação/exclusão, `account_access` e entitlements centralizados.

Billing comercial ainda não existe. PRO não deve ser apresentado como disponível para compra antes de produto, preço, provedor, webhook e entitlement automatizado estarem implantados e validados.

## 13. IA

Weather AI não é dependência do front público. Opera por snapshots server-side, fingerprint, cache, teto de chamadas e fallback determinístico. IA não pode criar, alterar ou substituir aviso oficial.

## 14. Segurança

Ativo:

- secrets server-side;
- gate geográfico de visitantes em hosts de produção;
- CSP global com allowlist explícita;
- firewall de aplicação com guards de método/tamanho;
- rate limiting distribuído para rotas sensíveis de conta/push;
- RLS no Supabase externo;
- proxies/allowlists para integrações externas;
- logs sanitizados;
- resposta geográfica bloqueada autocontida e `noindex`.

WAF gerenciado de edge/provedor não está configurado e não deve ser confundido com firewall de aplicação.

## 15. Navegação pública e coerência entre deploys

Relatos reais de navegação em 27–28/08/2026 mostraram o boundary global durante troca de páginas. Em 28/08 o problema voltou a ser reproduzido em produção com a tela **“Carregando a versão mais recente do Tempo Pelotas”** aparecendo como se fosse parte da navegação. Isso foi classificado como **P0 de produto**, porque impede uso normal do portal.

A regra operacional é: **robustez e navegação > SPA/PWA > disponibilidade instantânea de uma fonte externa**.

### 15.1. HTML e dados correntes

Documentos HTML públicos fora de embeds recebem `no-store/no-cache`, `CDN-Cache-Control: no-store`, `Pragma: no-cache` e `Expires: 0`.

Dados correntes de observação, nível e status seguem a mesma semântica de `no-store`; previsão, histórico e conteúdo editorial podem manter caches próprios quando adequados.

### 15.2. Navegação pública por documento completo

`src/components/navigation/PublicDocumentNavigationGuard.tsx` captura links internos públicos same-origin antes do TanStack Router e usa `window.location.assign()`. Cada troca pública busca novo documento/runtime.

Exceções: áreas autenticadas (`/conta`, `/painel`, `/auth`, `/login`, `/admin`), links externos, downloads, target externo, cliques modificados, navegação por hash e opt-out `data-spa-navigation="true"`.

### 15.3. Invalidação global periódica aposentada

`WeatherMinuteRefresh` **não executa mais `router.invalidate()`**, `setInterval()` nem refresh global em foco/visibilidade/online.

A invalidação de toda a árvore a cada 60 s contradizia a navegação pública por documento completo: uma página já saudável podia reabrir loaders via SPA e cair no boundary por uma oscilação transitória sem qualquer ação do visitante.

Atualizações em segundo plano futuras devem ser específicas do componente/domínio. Coletores e cron continuam atualizando caches centrais sem invalidar a rota inteira.

### 15.4. Budgets P0 do documento

Para evitar que dependências externas retenham o SSR público:

- Home meteorologia: 2,5 s;
- Home hidrologia diferida: 3,5 s;
- loaders meteorológicos públicos compartilhados: 2,5 s por dependência;
- loaders hidrológicos públicos: 2,5 s por dependência;
- Radar: 2,8 s por domínio;
- previsão de 15 dias: 2,8 s por domínio.

Ao atingir o teto, o domínio degrada para fallback `unavailable` já previsto. Isso não reduz o budget interno da fonte nem prova indisponibilidade do serviço oficial.

### 15.5. Recuperação automática fresca

`src/lib/stale-client-recovery.ts` usa `__tp_recover=<timestamp>` e `location.replace()` para no máximo uma tentativa por URL lógica em 60 s. O parâmetro é removido depois da hidratação bem-sucedida.

### 15.6. Boundary global

O root continua registrando telemetria e oferecendo contenção segura, mas a tela **“Carregando a versão mais recente do Tempo Pelotas” é excepcional**. Ela não é loading screen, não é passo esperado de navegação e sua aparição em uso normal é regressão P0.

Documento especializado: `docs/PUBLIC_ROUTE_RESILIENCE.md` e `docs/NAVIGATION_RUNTIME_RECOVERY_2026-08-27.md`.

## 16. Service worker / PWA / Web Push

O service worker permanece temporariamente aposentado. `PwaManager` não registra `/sw.js`; na hidratação, apenas remove registrations próprias antigas e caches `tempo-pelotas-*` de forma tolerante a falha.

`public/sw.js` permanece como artefato dormente. Manifest e experiência móvel permanecem. Web Push continua suspenso.

## 17. Testes e GitHub Actions

Contratos relevantes versionados:

- `tests/public-navigation-stability.test.ts`: ausência de invalidação global por minuto, navegação por documento, budgets P0 de meteorologia/hidrologia/Radar/15 dias e Home;
- `tests/public-route-resilience.test.ts`: fallback meteorológico, recuperação de runtime e navegação pública;
- `tests/current-data-cache-policy.test.ts`: política `no-store` das superfícies correntes;
- `tests/home-deferred-hydrology.test.ts`: hidrologia diferida e degradação local da Home;
- `tests/fifteen-day-forecast.test.ts`: consulta estendida e contingência real/parcial;
- `tests/hydrology-overview-page.test.ts`: composição hidrológica e fallbacks;
- `tests/radar-satellite-retail.test.ts` e `tests/redemet-performance.test.ts`: contratos REDEMET;
- `tests/source-resilience-regressions.test.ts`: INMET/REDEMET/GOES;
- contratos regionais/SEO e demais testes especializados permanecem versionados.

`tests/public-navigation-stability.test.ts` foi incluído no script explícito `test:contracts` além de já ser coberto pelo glob de `npm test`.

O GitHub Actions segue bloqueado antes da execução normal do runner. Runs recentes criam jobs com `steps=null`/sem logs. **Não declarar CI, build, typecheck ou testes aprovados/reprovados sem execução real.**

## 18. Deploy e Supabase

`main` é a branch operacional e sincroniza com Lovable. Supabase é externo ao Lovable. Migration só é considerada aplicada após validação no ambiente oficial.

A migration `20260828170000_data_status_supabase_scheduler.sql` foi aplicada no Supabase oficial. O monitor de `/status-dos-dados` usa `pg_cron` + `pg_net` a cada 10 minutos. O histórico possui freshness de 30 minutos e a lacuna anterior não foi convertida em indisponibilidade fictícia.

O hotfix P0 de 28/08 altera runtime público, loaders, teste e documentação; não altera fonte meteorológica, secret, migration, sitemap, canonical ou regra de alerta. Seu objetivo é impedir que latência/transporte de uma camada externa derrube o documento público.

Commits funcionais principais desta rodada:

- `dde771e5` — retirar invalidação global das páginas públicas;
- `0c917e77` — limitar loaders meteorológicos públicos a 2,5 s;
- `9eb42a88` — limitar loaders hidrológicos públicos a 2,5 s;
- `32fbaad5` — Radar público a 2,8 s;
- `c9122b5b` — previsão estendida pública a 2,8 s;
- `c3fad5d6` — Home com 2,5 s para meteorologia e 3,5 s para hidrologia diferida;
- `3c897c8b` — contrato de regressão da navegação pública.

## 19. Qualidade de navegador

`scripts/browser-quality-smoke.mjs` usa Chrome/Chromium via CDP e cobre rotas representativas em mobile/tablet/desktop. TTFB/FCP/LCP/CLS são métricas de laboratório, não CrUX.

A validação P0 deve incluir navegação repetida pelos menus principais e permanência em aba aberta durante deploy, além de acesso direto às rotas críticas.

## 20. Pesquisa futura

GeoInfo Embrapa e CPTEC/SIGMA permanecem fora do runtime público até seus gates próprios. Nenhuma pesquisa futura entra no caminho crítico enquanto a estabilidade pública não estiver comprovada.

## 21. Pendências prioritárias

1. **Publicar e validar o hotfix P0 de navegação no domínio canônico.** Repetir navegação por Agora → Hoje → 7 dias → Radar → Situação das Águas → Região, em desktop/mobile e com aba mantida aberta. A tela global de atualização não pode aparecer em fluxo normal.
2. Confirmar tempos de resposta/fallback de Home, Hoje, Amanhã, 7 dias, Radar, 15 dias, Laranjal, Guaíba e Situação das Águas; uma fonte lenta deve degradar antes de derrubar o documento.
3. Confirmar no navegador que não ocorre mais invalidação automática da página depois de 60 s de permanência.
4. Confirmar política de “Agora”: observação, níveis e status sem cache de resposta; última amostra válida conserva horário/idade reais.
5. Só depois da estabilidade de navegação, retomar probes independentes de Radar/STSC/satélites e investigação dos dois satélites ainda degradados.
6. Validar páginas municipais enriquecidas em desktop/mobile/anônimo.
7. Recapturar Search Console quando o conector estiver disponível; não abrir novas cidades sem evidência.
8. Resolver provisionamento/execução do GitHub Actions e então executar suíte completa, `routes:check`, build, TypeScript e Browser Quality Smoke.
9. Concluir E2E de autenticação com duas contas descartáveis.
10. Continuar Historical Data Layer, ANA/RHN e semântica da Defesa Civil RS após o P0.
11. Validar smokes de segurança, CSP, gate geográfico e rate limiting no ambiente real.
12. Manter Web Push suspenso e service worker aposentado até estabilidade comprovada.
13. Só publicar 30 dias quando existir contrato de tendência adequado para dias 16–30.

## 22. Documentos especializados principais

| Documento | Finalidade |
| --- | --- |
| `MIGRATION_MATRIX.md` | Migração, paridade e pendências históricas |
| `WEATHER_PAGE_IDENTITY.md` | Identidade das páginas meteorológicas |
| `docs/PUBLIC_ROUTE_RESILIENCE.md` | Fallbacks, budgets de fonte e budgets locais de página |
| `docs/NAVIGATION_RUNTIME_RECOVERY_2026-08-27.md` | Navegação pública, recuperação, SW aposentado e isolamento de chunks |
| `docs/DATA_STATUS_MONITOR_RECOVERY_2026-08-28.md` | Monitor histórico, scheduler Supabase, lacuna e freshness |
| `docs/REDEMET_OPERATIONS.md` | Operação REDEMET |
| `docs/SOURCE_RESILIENCE_INMET_REDEMET_2026-08-27.md` | Contingências INMET/REDEMET |
| `docs/INMET_SATELLITE_PRODUCTS_2026-08-23.md` | Produtos GOES/INMET |
| `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md` | Rede hidrometeorológica Defesa Civil RS |
| `docs/ANA_RHN_INTEGRATION.md` | ANA/RHN e gates de estação |
| `docs/HISTORICAL_DATA_INVENTORY.md` | Histórico, governança e coletores |
| `docs/FLOOD_1941_RESEARCH_2026-08-27.md` | Base documental da enchente de 1941 |
| `docs/SEO_GSC_BASELINE_2026-08-16.md` | Baseline Search Console |
| `docs/SEO_SEARCH_INTENT_PLAN_2026-08-26.md` | Arquitetura de intenção SEO |
| `docs/SEO_TRENDS_EVIDENCE_2026-08-26.md` | Evidência sanitizada do Trends |
| `docs/SEO_REFINEMENT_ENRICHMENT_2026-08-27.md` | Refinamento das URLs existentes |
| `docs/SEO_REGIONAL_EDITORIAL_COMPLETION_2026-08-28.md` | Cobertura editorial e BreadcrumbList municipal |
| `docs/QUALITY_A11Y_CWV_2026-08-27.md` | Acessibilidade, responsividade e métricas |
| `docs/FORECAST_15_DAY_IMPLEMENTATION_2026-08-26.md` | Previsão de 15 dias |
| `docs/DATA_ACCESS_PUBLIC_FREE_PRO_PLAN.md` | Política Público/Free/PRO |
| `docs/ACCOUNT_AND_PRO_ARCHITECTURE.md` | Arquitetura de conta/PRO |
| `docs/auth-account.md` | Autenticação e direitos do titular |
| `docs/weather-ai-snapshots.md` | Weather AI persistido |
| `docs/PRODUCTION_CUTOVER.md` | Runbook de produção |
| `docs/RUNTIME_READINESS.md` | Preflight do runtime |

## 23. Regra de manutenção

Uma pessoa deve conseguir abrir este arquivo e responder rapidamente: quais páginas existem, de onde vêm os dados, o que é observação/previsão/alerta, quais integrações estão ativas, como o runtime público opera, o que está parcial/suspenso e quais pendências impedem declarar uma camada concluída.

Quando o detalhe ultrapassar esse nível, ele permanece no documento especializado e é apenas referenciado aqui.

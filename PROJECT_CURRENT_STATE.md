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
- `main` é a branch operacional; não reescrever histórico publicado.

## 2. Visão executiva

Tempo Pelotas é um portal meteorológico e hidrológico regional para Pelotas e Zona Sul do Rio Grande do Sul. Combina previsão, observação local, chuva, vento, meteograma, alertas oficiais, radar/satélite, hidrologia, histórico, câmeras, páginas municipais e conteúdo editorial/SEO.

| Domínio | Estado | Observação |
| --- | --- | --- |
| Portal público | Ativo | Produção em `tempopelotas.com.br` |
| Home / Hoje / Amanhã / 7 dias | Ativo | Rotas dedicadas com fallback final contra rejeição de transporte da inteligência meteorológica |
| Previsão de 15 dias | Ativo | Open-Meteo diário dedicado; falha da consulta direta pode reutilizar até 7 dias reais preservados pela contingência Open-Meteo como janela parcial; budget local de 4 s por dependência |
| Chuva / vento / meteograma | Ativo | Contratos resilientes e estados degradados explícitos |
| Alertas | Ativo | INMET, preservando validade/abrangência e com fallback final da rota |
| Previsão municipal INMET | Hardening em validação | Timeouts ampliados e chamadas alinhadas ao contexto do portal; falha da integração não é rotulada como INMET globalmente fora |
| Embrapa Clima Temperado | Ativo | Observação, saúde do coletor e histórico de 24 h degradam independentemente |
| Dados correntes / “Agora” | Hardening em publicação | `main` aplica `no-store/no-cache` nas respostas correntes de meteorologia consolidada, Embrapa, Laranjal, Guaíba, rede da Lagoa e status; persistência interna/última amostra válida permanece permitida com timestamp real |
| REDEMET / DECEA | Hardening em validação | Radar, satélite e STSC usam contratos resilientes; página de Radar possui budget local de 4 s sem reduzir os deadlines internos das fontes |
| Satélite GOES / INMET | Hardening em validação | Adapter aceita resposta JSON/base64, headers de contexto do portal e distingue HTTP 403 da integração de indisponibilidade pública |
| Hidrologia | Ativo | Laranjal, Guaíba, Lagoa, SACE e Defesa Civil degradam independentemente nas páginas públicas |
| Monitor de status | Ativo via Supabase | `pg_cron` + `pg_net` executam coleta a cada 10 min no Supabase oficial; histórico stale é bloqueado após 30 min sem nova amostra |
| Defesa Civil RS | Ativo | Hidrometeorologia regional com kill switch server-side |
| Histórico climático | Ativo | Histórico recente e Historical Data Layer em expansão; falha de transporte gera estado indisponível |
| Enchentes 1941 / 2024 | Ativo | Páginas históricas com fontes institucionais e limites semânticos |
| Câmeras | Ativo com dependência externa | Câmera e meteorologia degradam independentemente; live/replay preservados |
| Central Regional | Ativo | Pelotas + 23 páginas municipais; fallback mantém diretório navegável e as 23 páginas municipais indexáveis possuem perfil editorial próprio |
| SEO técnico | Ativo | Canonical, sitemap, robots, OG/Twitter, Schema.org, links internos, BreadcrumbList regional e cobertura editorial municipal completa |
| Conta / Google | Parcial operacional | Fundação implementada; E2E real com duas contas ainda pendente |
| Free / PRO | Fundação pronta | Entitlements existem; billing comercial ainda não existe |
| Weather AI | Ativo controlado | Snapshot server-side, orçamento e fallback determinístico |
| Gate geográfico / CSP / rate limit | Ativo | Segurança em camada de aplicação; smokes reais ainda precisam ser confirmados |
| Navegação pública entre deploys | Hardening ativo | Links públicos usam documento completo; recuperação fresca e boundary não fatal |
| Service worker / offline PWA | Temporariamente aposentado | Manifest e conectividade permanecem; `/sw.js` não é mais registrado |
| Web Push | Suspenso | Código preservado, manager fora do root |
| Qualidade / CI | Gates versionados, runner não executa steps | Runs recentes criam job e falham antes de qualquer step; não há evidência de teste/build executado |

## 3. Stack e operação

Stack principal: React 19, TypeScript 5.8, TanStack Start/Router, Vite 8, Nitro, Tailwind CSS 4, Supabase JS/SSR, MapLibre GL, Recharts e Zod. Node 24 é usado nos workflows. Lovable é o ambiente conectado de sincronização/publicação; o Supabase oficial permanece externo ao Lovable.

Scripts principais: `npm run build`, `npm test`, `npm run test:contracts`, `npm run test:routes`, `npm run routes:check`, `npm run typecheck`, `npm run lint`, `npm run quality:browser`, `npm run quality:assets`, `npm run runtime:check` e `npm run cutover:smoke`.

Rotas que renderizam `InternalWeatherPageShell` ou `ContentPageShell` são standalone em `SiteLayout`, evitando header/footer/main duplicados. O contrato possui teste automático.

A política de cache diferencia **resposta pública corrente** de **cache/persistência de fonte**. `src/lib/current-data-cache.ts` define `Cache-Control: no-store, no-cache, must-revalidate`, `CDN-Cache-Control: no-store`, `Pragma: no-cache` e `Expires: 0` para superfícies de “Agora”. Coletores, snapshots, last-known e caches internos continuam permitidos para não transformar visita de usuário em coleta obrigatória e para preservar a última amostra real quando a fonte falha.

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

`src/lib/weather/public-weather-page-loader.ts` fornece a barreira final das páginas meteorológicas públicas. Hoje, Amanhã, 7 dias e Alertas usam `loadPublicWeatherPage()`: se a própria server function rejeitar no transporte, a rota recebe `createUnavailableWeatherIntelligence()` em vez de alcançar o boundary global. Vento, Chuva e Meteograma preservam o loader composto com degradação independente das séries secundárias.

Em 28/08/2026 os budgets das fontes oficiais foram recalibrados após evidência de falsos estados `unavailable` por timeout. A barreira global da inteligência meteorológica passou de 3 s para 5 s; o orçamento da previsão municipal INMET passou para 4 s e os requests atual/histórico receberam 3,2 s e 2,8 s respectivamente. A rota histórica entra de forma escalonada após 650 ms. O objetivo é continuar limitando latência sem transformar resposta pública apenas mais lenta em “fonte fora”.

A previsão municipal INMET preserva duas rotas conhecidas: a atual `/api/forecast/<IBGE>` e a histórica `/previsao/<IBGE>`. As requisições server-side usam contexto HTTP compatível com o portal de previsão (`Origin`, `Referer`, idiomas e user-agent de navegador). Um HTTP ou timeout agora é descrito como falha da integração naquela atualização, não como indisponibilidade global do serviço INMET.

`/previsao-15-dias-pelotas` usa chamada independente, somente com campos diários, timeout próprio e estados `live|partial|unavailable`. Dias 1–7 e 8–15 são separados visualmente; a página atende também a intenção de 10 dias sem criar URL redundante. Não existe previsão diária artificial de 30 dias: dias 16–30 só serão publicados quando houver contrato de tendência adequado.

O loader público de 15 dias não exige sucesso conjunto de `getWeatherIntelligence()` e `getPelotasExtendedForecast()`. `src/lib/weather/extended-forecast-page-loader.ts` usa `Promise.allSettled` e degrada cada domínio para seu contrato `unavailable`: falha na inteligência compartilhada não elimina a série estendida e falha da previsão estendida não derruba o shell meteorológico. Em 28/08 foi acrescentado um **budget local de página de 4 s por dependência**, menor que o teto global de 5 s, para liberar o SSR antes de uma integração lenta reter a rota. Esse budget não reduz os timeouts internos das fontes.

A consulta estendida direta mantém timeout de **2,2 s**. Se ela falha, recebe payload incompatível ou normaliza zero dias utilizáveis, `src/lib/weather/extended-forecast.server.ts` tenta `fetchOpenMeteoPayloadViaEdge()`. A Edge Function existente continua com o contrato compartilhado de **7 dias**; os dias reais compatíveis do cache podem ser publicados como `partial`, com `requestedDays: 15` e `returnedDays` igual à quantidade realmente recebida. Nenhum dia 8–15 é criado, repetido ou extrapolado. O fallback Edge possui orçamento de **1,6 s** e só entra depois da tentativa direta.

Esse budget foi ampliado em 28/08 depois de evidência operacional: logs reais da Edge `open-meteo-forecast` mostraram respostas HTTP 200 chegando a **1,125 s**. Como o mesmo budget do cliente cobre leitura da configuração no Supabase, transporte e chamada da Edge, o teto anterior de 900 ms podia cancelar uma contingência válida e produzir falso `unavailable`. O fluxo continua **origem Open-Meteo direta primeiro → Edge/Supabase apenas como contingência**; os tetos de página/global permanecem 4 s/5 s.

## 6. Observação e fontes oficiais

Embrapa Clima Temperado é a referência principal de observação local quando utilizável. Modelo numérico não substitui silenciosamente observação ausente. A página dedicada usa `src/lib/weather/embrapa-station-page-loader.ts`: meteorologia consolidada, saúde do coletor e histórico de 24 horas são resolvidos com `Promise.allSettled`, cada um com estado indisponível próprio.

A resposta pública corrente da meteorologia consolidada e `/api/weather/embrapa` usa a política `no-store`. Isso não remove a centralização da Embrapa: `getCentralEmbrapaObservation()` continua lendo a amostra persistida e pode devolver a última leitura válida quando a coleta corrente falha. O horário/idade da própria observação prevalece; uma amostra antiga não ganha um timestamp novo só porque a página foi aberta agora.

INMET é usado para avisos oficiais, previsão complementar, estação/referências e produtos específicos como geadas. Falha de consulta não equivale a ausência de risco. `/mapa-de-geadas-rio-grande-do-sul` usa `src/lib/inmet/frost-page-loader.ts`, separando a disponibilidade dos registros observados do INMET da disponibilidade da inteligência meteorológica usada no shell.

### 6.1. GOES / INMET

O produto integrado permanece `GOES / S / IV` e é apresentado como `GOES — infravermelho`. A investigação de 28/08/2026 mostrou que um HTTP 403 recebido pelo backend do Tempo Pelotas deve ser tratado como **recusa daquela chamada server-side**, não como prova de que `satelite.inmet.gov.br` esteja fora.

`src/lib/weather/inmet-satellite.server.ts` foi ajustado para enviar o contexto esperado pelo portal público e realizar uma única tentativa sem `Origin` quando a primeira chamada recebe 403. As mensagens de diagnóstico agora deixam explícita a diferença entre erro da integração e indisponibilidade do serviço público.

O proxy `/api/redemet/image` também foi corrigido: endpoints do `apisat.inmet.gov.br` podem entregar JSON contendo imagem no campo `base64`. O proxy anterior aceitava apenas bytes de imagem, o que podia classificar uma resposta válida como indisponível. O proxy atual aceita imagem binária ou JSON/base64, decodifica server-side, valida assinatura JPEG/PNG/WebP/GIF, host e limite de 12 MB antes de devolver a imagem ao navegador.

### 6.2. REDEMET / DECEA

REDEMET/DECEA fornece radar, satélite e STSC/trovoadas. Imagem recente não é automaticamente chamada de “tempo real”; timestamp da fonte prevalece. O canal Visível não recebe fallback infravermelho.

A rodada de 28/08/2026 corrigiu uma assimetria entre produtos: Radar e STSC já usavam autenticação pela query `api_key`, enquanto o satélite ainda passava pelo cliente genérico com `X-Api-Key`. O adaptador `src/lib/redemet/redemet-satellite-resilient.server.ts` agora usa `api_key` exclusivamente no servidor, mantém allowlist de hosts, não registra a URL autenticada e interpreta recursivamente `path/url/imagem/image/arquivo/src` e bounds do payload.

`src/lib/redemet/redemet.functions.ts` deixou de usar diretamente o cliente genérico antigo para o satélite realçado. O overview consulta REDEMET e INMET separadamente, com last-good por fonte, orçamento de 4,5 s e seleção posterior por `selectOfficialSatelliteResult()`. Realçado/IR podem usar GOES/INMET como contingência oficial; Visível continua sem fallback infravermelho.

`src/lib/redemet/radar-page-loader.ts` usa `Promise.allSettled`, e `src/lib/redemet/redemet-fallback.ts` mantém radar, satélites e STSC como indisponíveis/sem frames quando a server function falha, sem criar imagem simulada nem eliminar o contexto meteorológico restante. O loader público ganhou em 28/08 um **budget local de 4 s por dependência**: o overview REDEMET mantém seu budget interno de 4,5 s e a inteligência meteorológica mantém 5 s, mas a renderização pública não precisa aguardar todo esse teto para degradar o domínio atrasado.

CPPMet/UFPel é contexto regional complementar. SIMAGRO RS permanece como visualização de modelo em meteograma, sem OCR de imagens.

## 7. Chuva, vento e estados degradados

`/chuva-em-pelotas` separa chuva observada, prevista, acumulados regionais e aviso oficial. Observado e previsto não são somados automaticamente.

Vento e Chuva usam `src/lib/weather/public-weather-page-loader.ts` com `Promise.allSettled`: falha de inteligência meteorológica ou meteograma degrada somente aquela camada para contrato `unavailable`, sem inventar valores nem derrubar a rota inteira.

A Home mantém a hidrologia diferida e isolada em sua própria Promise, mas também protege o caminho meteorológico crítico: rejeição de transporte de `getWeatherIntelligence()` é convertida em `createUnavailableWeatherIntelligence()`.

Clima e Histórico recente usam fallback histórico explícito. Câmeras usam fallback próprio para o catálogo e a inteligência meteorológica, preservando ausência de player/imagem sem material demonstrativo.

## 8. Hidrologia

A Estação Laranjal é referência operacional local apresentada para Pelotas. Nível, horário, idade, tendência e variações são preservados sem transformar leitura atrasada em valor atual.

As respostas correntes de `getLaranjalLevelData()`, `getGuaibaObservation()` e `getLagoonMonitoringNetwork()` usam a política `no-store/no-cache`: CDN/browser/server-function não devem reapresentar uma resposta velha como nível “agora”. O cache/persistência pertencente às próprias fontes continua separado. Se uma integração não conseguir nova leitura, a última amostra conhecida pode continuar disponível somente com horário/idade originais e estado stale/degradado explícito.

`src/lib/hydrology/public-hydrology-page-loader.ts` centraliza os contratos indisponíveis e a composição das páginas. `/nivel-da-lagoa-dos-patos-laranjal` isola meteorologia e Estação Laranjal; `/situacao-hidrologica-pelotas` resolve meteorologia, Laranjal, Guaíba, rede da Lagoa, SACE e Defesa Civil RS com `Promise.allSettled`; `/nivel-do-guaiba` possui uma barreira final contra rejeição da server function. Uma fonte que falha fica `unavailable` sem zerar leitura e sem impedir as demais.

`/nivel-do-guaiba` mantém Cais Mauá e Gasômetro como referências independentes. Nível do Guaíba não é convertido automaticamente em diagnóstico para Pelotas nem cotas são transferidas entre réguas.

Defesa Civil RS permanece ativa com kill switch. ANA/RHN continua em validação; estação, parâmetro, unidade, datum/referência, timezone e governança precisam ser confirmados antes de substituir fontes existentes.

## 9. Histórico e memória das cheias

O Historical Data Layer mantém separação entre `observation`, `forecast`, `reanalysis` e `derived`.

`/historico-climatico-pelotas` representa histórico meteorológico recente, enquanto `/clima-em-pelotas` representa clima/climatologia. As duas intenções permanecem separadas e seus loaders preservam estado `unavailable` em falha de transporte, sem completar lacunas com números simulados.

`/enchente-1941-pelotas` usa pesquisa documental UCPel/UFPel/Prefeitura e trata 2,88 m como referência histórica contextual do Canal São Gonçalo, não como cota transferível à Estação Laranjal ou a outras réguas. A página de 2024 permanece como registro histórico. As duas páginas têm ligação recíproca.

## 10. Central Regional

`/tempo-na-regiao-sul-rs` é o hub das 24 cidades aprovadas. O resumo usa consulta Open-Meteo em lote, rotulada como estimativa de modelo. O loader já possui `try/catch` próprio: se a visão regional falha, o fallback mantém as 24 cidades e seus links disponíveis, sem inventar temperatura, chuva ou vento.

A Central Regional também mantém isolamento do mapa: `RegionalCitiesMap` é renderizado de forma adiada, `maplibre-gl` fica na camada dinâmica interna e `RegionalMapErrorBoundary` impede que erro do mapa alcance o boundary global. Se o mapa falha, lista, busca, filtros e links das cidades permanecem disponíveis.

As **23 páginas municipais indexáveis** possuem perfil editorial específico. Os 12 perfis que ainda dependiam do texto-base — Morro Redondo, Turuçu, Arroio do Padre, Pedro Osório, Cerrito, Cristal, Arroio Grande, Herval, Pinheiro Machado, Pedras Altas, Candiota e Aceguá — foram enriquecidos em 28/08/2026. O catálogo adicional fica em `src/lib/regional-city-editorial-expansion.ts` e é consumido pelo helper editorial existente.

Cada perfil possui meta description, descrição do hero, título editorial, introdução e pelo menos quatro fatos/orientações próprios. O conteúdo usa contexto geográfico já cadastrado no projeto e mantém previsão por coordenadas separada de observação local. FAQ genérico em massa e FAQPage parametrizado continuam proibidos pelo gate anti-template.

As páginas municipais também emitem `BreadcrumbList` JSON-LD com a sequência **Tempo Pelotas → Tempo na Região Sul → Tempo em <município>**, usando `createBreadcrumbListJsonLd` e `serializeJsonLd`. O `WebPage` com `Place`/`GeoCoordinates` existente foi preservado; nenhum FAQ/schema artificial foi adicionado.

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

A cobertura editorial regional está completa nas 23 URLs municipais indexáveis. A próxima expansão regional deve ser guiada por consultas/impressões/CTR reais e pelo publication gate, não por geração automática de texto ou abertura de novas cidades apenas para ampliar o sitemap.

O header principal está alinhado ao inventário publicado: `Previsão` expõe `/previsao-15-dias-pelotas`, e `Águas` expõe `/nivel-do-guaiba` e `/enchente-1941-pelotas` além de Laranjal, situação hidrológica e enchente de 2024. O mesmo inventário alimenta a navegação móvel.

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

Essa regra de documento é complementada pela regra de **dados correntes**: mesmo quando uma server function é chamada separadamente, condição meteorológica observada, nível hidrológico e status operacional corrente usam os mesmos princípios de `no-store`. Previsões, séries históricas e conteúdo editorial continuam com caches próprios quando adequados.

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

- `tests/public-route-resilience.test.ts`: recuperação com cache-buster, navegação pública por documento, boundary não fatal, isolamento do mapa, loaders Vento/Chuva, fallback final de Hoje/Amanhã/7 dias/Alertas e budgets atuais da inteligência meteorológica;
- `tests/current-data-cache-policy.test.ts`: política `no-store` das superfícies correntes e preservação da leitura central da Embrapa como origem/fallback real;
- `tests/home-deferred-hydrology.test.ts`: hidrologia diferida, degradação local do bloco de águas e fallback final da Home;
- `tests/fifteen-day-forecast.test.ts`: consulta estendida dedicada, degradação independente, contingência Edge/Supabase como janela parcial e budget local de 4 s do loader;
- `tests/hydrology-overview-page.test.ts`: seis domínios da situação hidrológica com `Promise.allSettled`, preservando referências e Defesa Civil;
- `tests/seo-guaiba-page.test.ts`: semântica das réguas e fallback de transporte da página do Guaíba;
- `tests/radar-satellite-retail.test.ts`: REDEMET e meteorologia desacoplados;
- `tests/redemet-performance.test.ts`: janelas compactas, autenticação operacional de radar/STSC, overview de satélite e budget local de 4 s da página pública de Radar;
- `tests/source-resilience-regressions.test.ts`: timeout da previsão INMET, contexto HTTP, distinção do 403, proxy JSON/base64 do GOES, autenticação `api_key` do satélite REDEMET e seleção de contingência;
- `tests/embrapa-station-page.test.ts`: observação, saúde e histórico da Embrapa desacoplados;
- `tests/frost-monitoring-page.test.ts`: geada observada e meteorologia desacopladas;
- `tests/weather-history-page.test.ts` e `tests/climate-page.test.ts`: histórico/clima e estados indisponíveis;
- `tests/camera-monitoring-page.test.ts`: câmera e meteorologia com falhas independentes;
- `tests/pwa-app-refinement.test.ts`: ausência de novo registro de SW e cleanup restrito;
- `tests/standalone-route-shell.test.ts`: evita shells duplicados;
- `tests/seo-content-accessibility.test.ts` e `tests/seo-editorial-enrichment.test.ts`: intenção, semântica e links;
- `tests/regional-city-editorial.test.ts`: gate anti-template e contrato visual/editorial regional;
- `tests/regional-city-editorial-completeness.test.ts`: exige perfil específico nas 23 páginas municipais indexáveis, conteúdo mínimo útil, introduções/títulos distintos, ausência de FAQ massificado e BreadcrumbList Home → Região → Município;
- `tests/header-keyboard-accessibility.test.ts`: ARIA/foco e inventário do header;
- `tests/screenshot-layout-regressions.test.ts`: regressões visuais detectadas no domínio.

O contrato regional está incluído em `test:contracts`. Em 28/08/2026 a inspeção do run **Qualidade `33150035842`** encontrou o job criado com `conclusion=failure`, porém `steps=[]`; o run agendado **Weather AI snapshots `33176033843`** exibiu o mesmo padrão de job sem steps. O log do job de Qualidade não estava disponível como blob. A evidência é compatível com falha **antes da execução normal do runner**, e não com um teste, build ou typecheck que tenha iniciado e falhado. **Não declarar CI, build, typecheck ou testes aprovados/reprovados sem execução real.** O run `Qualidade 33187566952`, disparado pelo hardening de latência, repetiu o mesmo padrão com job criado e `steps=null`. Depois, o run **Data source status monitor `33193023493`**, já na rodada do scheduler, criou os jobs de coleta e segurança com `steps=null` e sem logs. Isso reforça que o bloqueio antecede os comandos do workflow e também explica por que o monitor histórico deixou de persistir quando dependia exclusivamente do Actions.

## 18. Deploy e Supabase

`main` é a branch operacional e sincroniza com Lovable. Supabase é externo ao Lovable. Migration versionada só é considerada aplicada após validação no ambiente oficial; publicação de código não prova alteração de banco.

A rodada SEO regional de 28/08 altera conteúdo editorial, BreadcrumbList JSON-LD e contratos de teste das páginas municipais existentes. Não cria rota, migration, Edge Function, secret ou variável de ambiente; não muda sitemap, canonical, coordenadas, código IBGE, fonte meteorológica, cota hidrológica, regra de alerta ou autenticação.

O hardening adicional de latência de 28/08 altera somente os loaders públicos de 15 dias e Radar, seus contratos de teste e a documentação de resiliência. Não altera fonte, autenticação, sitemap, migration, secret ou payload meteorológico; limita a espera do SSR a 4 s por dependência e mantém os budgets internos já calibrados.

A contingência adicional da previsão estendida reutiliza apenas o payload Open-Meteo de 7 dias já preservado pela Edge/Supabase quando a chamada direta de 15 dias falha. Ela não altera a Edge Function, não muda `forecast_days=7` do contrato compartilhado, não cria migration/secret e não inventa a segunda semana; apenas degrada a rota de zero dias para uma janela parcial quando houver cache real compatível. Em 28/08 o budget desse caminho Edge/Supabase foi recalibrado de 900 ms para 1,6 s com base em latência HTTP 200 observada em produção.

O monitor persistido de `/status-dos-dados` havia parado após **23/08/2026 17:52 UTC** porque seu agendamento periódico dependia exclusivamente do GitHub Actions. A migration `20260828170000_data_status_supabase_scheduler.sql` foi **aplicada no Supabase oficial em 28/08/2026**. O agendamento primário agora usa `pg_cron` + `pg_net` a cada 10 minutos e autenticação por token privado armazenado no próprio banco. `CRON_SECRET` e GitHub OIDC permanecem como caminhos operacionais secundários/manual.

A aplicação foi validada no ambiente oficial: o job `tempo-pelotas-data-status-monitor` ficou ativo, um smoke retornou HTTP 200 e persistiu nova amostra, e o cron executou automaticamente sem GitHub às **17:10 UTC**. O histórico possui ainda uma barreira de freshness de 30 minutos; se a última amostra persistida envelhecer além desse limite, os percentuais/incidentes deixam de ser apresentados como histórico corrente até uma nova coleta.

A lacuna 23–28/08 não foi convertida em vários dias fictícios de indisponibilidade. Incidentes que permaneciam abertos antes da retomada foram encerrados no respectivo `last_seen_at`; se a fonte continua degradada após o retorno do monitor, nasce um novo incidente a partir do timestamp efetivamente observado agora.

A política de dados correntes adicionada em `main` não remove snapshots nem last-known. Ela altera a resposta pública de meteorologia consolidada, Embrapa, Laranjal, Guaíba, rede da Lagoa e status para `no-store/no-cache`, preservando o timestamp original da amostra que a camada de fonte devolver.

## 19. Qualidade de navegador

`scripts/browser-quality-smoke.mjs` usa Chrome/Chromium via CDP e cobre rotas representativas em mobile/tablet/desktop, verificando estrutura, H1/main, foco, controles, rótulos, imagens, overflow e comportamento do menu. TTFB/FCP/LCP/CLS são métricas de laboratório, não CrUX.

`scripts/build-asset-report.mjs` mede JS/CSS/imagens/fontes e gzip. Budgets rígidos dependem de baseline executado.

## 20. Pesquisa futura

GeoInfo Embrapa permanece em trilha própria de descoberta/licenciamento. CPTEC/SIGMA permanece fora do runtime público até nova revisão. Nenhuma dessas trilhas deve entrar no caminho crítico da previsão sem gate de fonte, licença, escala e semântica.

## 21. Pendências prioritárias

1. Confirmar a publicação da rodada de 28/08 no domínio canônico e retestar especificamente: contingência Open-Meteo de 1,6 s, previsão municipal INMET, GOES/INMET, satélite REDEMET Realçado/IR/Visível, Radar e STSC. Diferenciar resposta da integração de disponibilidade do portal oficial.
2. Validar no domínio canônico a política de “Agora”: meteorologia observada, `/api/weather/embrapa`, Laranjal, Guaíba, rede da Lagoa e `/status-dos-dados` devem responder sem `max-age`/`stale-while-revalidate`; em falha de fonte, a última amostra válida deve manter timestamp/idade reais e rótulo stale/degradado.
3. Usar o monitor recém-restaurado para separar falso `offline` de falha real em Embrapa e na oscilação Radar/STSC; não recalibrar novos timeouts sem evidência de amostras sucessivas.
4. Validar amostra das páginas municipais enriquecidas em desktop/mobile/anônimo, com atenção a title, description, hero, bloco editorial, BreadcrumbList e links de cidades próximas.
5. Recapturar Search Console para priorizar CTR/refinamentos das 48 URLs existentes; a cobertura editorial municipal já está completa e não justifica novas cidades sem evidência. O GSC Wizard continua bloqueado por assinatura enquanto não houver plano ativo.
6. Validar repetidamente Hoje, Amanhã, 7 dias, Alertas, Radar, Geadas, Embrapa, Laranjal, Guaíba, Situação das Águas, Metodologia e Histórico em desktop/mobile/anônimo.
7. Validar uma aba mantida aberta durante novo deploy e confirmar que a próxima navegação pública busca documento/runtime atual sem exibir a antiga tela fatal.
8. Confirmar no navegador que `/sw.js` não permanece registrado e que caches `tempo-pelotas-*` antigos são removidos.
9. Resolver a falha de provisionamento/execução do GitHub Actions que cria jobs sem steps e então executar suíte completa, `routes:check`, build, TypeScript e Browser Quality Smoke.
10. Validar `/previsao-15-dias-pelotas` após publicação da contingência, confirmando janela direta de 15 dias quando disponível e janela parcial real quando a consulta direta falhar; validar também `/nivel-do-guaiba` e `/enchente-1941-pelotas` em mobile, canonical e sitemap.
11. Concluir E2E de autenticação com duas contas descartáveis.
12. Continuar Historical Data Layer, ANA/RHN e semântica da Defesa Civil RS.
13. Validar smokes de segurança, CSP, gate geográfico e rate limiting no ambiente real.
14. Manter Web Push suspenso e service worker público aposentado até estabilidade comprovada.
15. Só publicar 30 dias quando existir contrato de tendência adequado para dias 16–30.
16. Manter GeoInfo e CPTEC/SIGMA fora do runtime até seus gates próprios.

## 22. Documentos especializados principais

| Documento | Finalidade |
| --- | --- |
| `MIGRATION_MATRIX.md` | Migração, paridade e pendências históricas |
| `WEATHER_PAGE_IDENTITY.md` | Identidade das páginas meteorológicas |
| `docs/PUBLIC_ROUTE_RESILIENCE.md` | Fallbacks, budgets de fonte e budgets locais de página |
| `docs/NAVIGATION_RUNTIME_RECOVERY_2026-08-27.md` | Navegação pública, cache, recuperação, SW aposentado e isolamento de chunks |
| `docs/DATA_STATUS_MONITOR_RECOVERY_2026-08-28.md` | Recuperação do monitor histórico, scheduler Supabase, lacuna e freshness |
| `docs/REDEMET_OPERATIONS.md` | Operação REDEMET |
| `docs/SOURCE_RESILIENCE_INMET_REDEMET_2026-08-27.md` | Contingências INMET/REDEMET |
| `docs/INMET_SATELLITE_PRODUCTS_2026-08-23.md` | Produtos GOES/INMET e diagnóstico da integração server-side |
| `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md` | Rede hidrometeorológica Defesa Civil RS |
| `docs/ANA_RHN_INTEGRATION.md` | ANA/RHN e gates de estação |
| `docs/HISTORICAL_DATA_INVENTORY.md` | Histórico, governança e coletores |
| `docs/FLOOD_1941_RESEARCH_2026-08-27.md` | Base documental da enchente de 1941 |
| `docs/SEO_GSC_BASELINE_2026-08-16.md` | Baseline Search Console |
| `docs/SEO_SEARCH_INTENT_PLAN_2026-08-26.md` | Arquitetura de intenção SEO |
| `docs/SEO_TRENDS_EVIDENCE_2026-08-26.md` | Evidência sanitizada do Trends |
| `docs/SEO_REFINEMENT_ENRICHMENT_2026-08-27.md` | Refinamento das URLs existentes |
| `docs/SEO_REGIONAL_EDITORIAL_COMPLETION_2026-08-28.md` | Conclusão da cobertura editorial e BreadcrumbList das 23 páginas municipais indexáveis |
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
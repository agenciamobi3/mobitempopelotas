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
- nas rotas públicas críticas, o primeiro documento deve ser independente de integrações externas sempre que existir recuperação progressiva segura no navegador;
- `main` é a branch operacional; não reescrever histórico publicado.

## 2. Visão executiva

Tempo Pelotas é um portal meteorológico e hidrológico regional para Pelotas e Zona Sul do Rio Grande do Sul. Combina previsão, observação local, chuva, vento, meteograma, alertas oficiais, radar/satélite, hidrologia, histórico, câmeras, páginas municipais e conteúdo editorial/SEO.

| Domínio | Estado | Observação |
| --- | --- | --- |
| Portal público | **P0 de estabilidade em publicação/validação** | Prioridade atual é navegação previsível; documento deve existir antes de integrações lentas |
| Home / Hoje / Amanhã / 7 dias | **Shell-first na `main`** | Primeiro loader não consulta fonte externa; entrega contrato local imediatamente e recupera previsão/observação depois da hidratação |
| Recuperação meteorológica no navegador | Ativa em hardening | Open-Meteo recupera previsão; `/api/weather/embrapa` recupera a observação real centralizada sem transformar modelo em observação |
| Previsão de 15 dias | Ativo | Open-Meteo diário dedicado; contingência pode reutilizar até 7 dias reais preservados como janela parcial; budget local de página de 2,8 s por dependência |
| Chuva / vento / meteograma | Ativo | Domínios independentes com teto público de 2,5 s e fallback explícito |
| Alertas | Ativo | INMET, preservando validade/abrangência e com fallback final da rota |
| Previsão municipal INMET | Hardening em validação | Timeouts ampliados e chamadas alinhadas ao contexto do portal; falha da integração não é rotulada como INMET globalmente fora |
| Embrapa Clima Temperado | Ativo | Centralizador read-only no pageview; observação pode ser recuperada após hidratação nas rotas shell-first |
| Dados correntes / “Agora” | Hardening ativo | Respostas correntes usam `no-store/no-cache`; última amostra real persistida continua permitida com timestamp/idade originais |
| REDEMET / DECEA | Hardening em validação | Radar, satélite e STSC usam contratos resilientes; página de Radar possui budget local de 2,8 s |
| Satélite GOES / INMET | Hardening em validação | Adapter aceita JSON/base64, contexto HTTP do portal e distingue erro da integração de indisponibilidade pública |
| Hidrologia | Ativo com hardening P0 | Páginas hidrológicas degradam por domínio com teto de 2,5 s; a Home não bloqueia mais seu primeiro documento por hidrologia |
| Monitor de status | Ativo via Supabase | `pg_cron` + `pg_net` executam coleta a cada 10 min; histórico stale é bloqueado após 30 min sem nova amostra |
| Defesa Civil RS | Ativo | Hidrometeorologia regional com kill switch server-side |
| Histórico climático | Ativo | Histórico recente e Historical Data Layer em expansão; falha de transporte gera estado indisponível |
| Enchentes 1941 / 2024 | Ativo | Páginas históricas com fontes institucionais e limites semânticos |
| Câmeras | Ativo com dependência externa | Câmera e meteorologia degradam independentemente; live/replay preservados |
| Central Regional | Ativo | Pelotas + 23 páginas municipais; fallback mantém diretório e páginas indexáveis navegáveis |
| SEO técnico | Ativo | Canonical, sitemap, robots, OG/Twitter, Schema.org, links internos, BreadcrumbList regional e cobertura editorial municipal completa |
| Conta / Google | Parcial operacional | Fundação implementada; E2E real com duas contas ainda pendente |
| Free / PRO | Fundação pronta | Entitlements existem; billing comercial ainda não existe |
| Weather AI | Ativo controlado | Snapshot server-side, orçamento e fallback determinístico; não é requisito do primeiro documento público shell-first |
| Gate geográfico / CSP / rate limit | Ativo | Segurança em camada de aplicação; smokes reais ainda precisam ser confirmados |
| Navegação pública | **Hotfix P0 na `main`** | Menu principal usa anchors nativas; preload SPA global e invalidação periódica foram retirados; links públicos restantes usam documento completo |
| Diagnóstico de release | Ativo | `/api/runtime-version` responde release estática, `no-store` e `noindex`, sem depender de fonte externa |
| Service worker / offline PWA | Temporariamente aposentado | Manifest e conectividade permanecem; `/sw.js` não é mais registrado |
| Web Push | Suspenso | Código preservado, manager fora do root |
| Qualidade / CI | Gates versionados, runner não executa steps | Runs recentes criam job e falham antes de qualquer step; não há evidência de teste/build executado |

## 3. Stack e operação

Stack principal: React 19, TypeScript 5.8, TanStack Start/Router, Vite 8, Nitro, Tailwind CSS 4, Supabase JS/SSR, MapLibre GL, Recharts e Zod. Node 24 é usado nos workflows. Lovable é o ambiente conectado de sincronização/publicação; o Supabase oficial permanece externo ao Lovable.

Scripts principais: `npm run build`, `npm test`, `npm run test:contracts`, `npm run test:routes`, `npm run routes:check`, `npm run typecheck`, `npm run lint`, `npm run quality:browser`, `npm run quality:assets`, `npm run runtime:check` e `npm run cutover:smoke`.

Rotas que renderizam `InternalWeatherPageShell` ou `ContentPageShell` são standalone em `SiteLayout`, evitando header/footer/main duplicados.

A política de cache diferencia **resposta pública corrente** de **cache/persistência de fonte**. `src/lib/current-data-cache.ts` define `Cache-Control: no-store, no-cache, must-revalidate`, `CDN-Cache-Control: no-store`, `Pragma: no-cache` e `Expires: 0` para superfícies de “Agora”. Coletores, snapshots, last-known e caches internos continuam permitidos para preservar a última amostra real sem transformar uma visita em coleta obrigatória.

A política de latência diferencia **budget de fonte**, **budget de página** e, nas rotas críticas, **independência do primeiro documento**. Home, Hoje, Amanhã e 7 dias não aguardam nenhuma server function meteorológica/hidrológica no loader inicial. Rotas secundárias que ainda precisam de SSR com dados usam budgets locais menores que os budgets internos das fontes.

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

O contrato de dados continua usando Open-Meteo para previsão detalhada e MET Norway como contingência quando aplicável. O que mudou no P0 é **onde a espera acontece**.

### 5.1. Home, Hoje, Amanhã e 7 dias: shell-first

As quatro rotas mais acessadas não chamam mais `getWeatherIntelligence()` nem `loadPublicWeatherPage()` no loader inicial:

- `/` devolve `createInitialHomeData()`, com `createUnavailableWeatherIntelligence()` e hidrologia localmente indisponível;
- `/tempo-hoje-pelotas` devolve `createUnavailableWeatherIntelligence()`;
- `/tempo-amanha-pelotas` devolve `createUnavailableWeatherIntelligence()`;
- `/previsao-7-dias-pelotas` devolve `createUnavailableWeatherIntelligence()`.

Isso garante que o primeiro HTML não dependa de Open-Meteo, Embrapa, INMET, CPPMet, Supabase meteorológico, Laranjal, Guaíba ou rede da Lagoa.

Depois da hidratação, `useOpenMeteoIntelligenceRecovery()` opera como reforço progressivo. O hook mantém o nome histórico, mas agora recupera duas camadas independentes:

1. previsão de 7 dias diretamente do Open-Meteo;
2. observação atual por `/api/weather/embrapa`, que lê o centralizador da Embrapa e preserva o timestamp real.

As duas respostas são fundidas com atualização funcional de estado; a que chegar por último não apaga a anterior. Falha de qualquer recuperação permanece local e não pode derrubar o documento já renderizado.

Modelo numérico não vira observação: a temperatura/umidade/pressão/vento atuais só recebem proveniência `embrapa` quando o endpoint central entrega uma observação utilizável. Condição, rajada e visibilidade não são inventadas quando a estação não fornece esses campos.

A hidrologia resumida da Home foi retirada do caminho crítico do primeiro documento. Enquanto o reforço específico da Home não estiver reintroduzido de forma client-side/isolada, o bloco pode degradar para indisponível e direcionar o visitante às páginas hidrológicas dedicadas. Isso é preferível a reter a Home inteira.

### 5.2. Rotas meteorológicas secundárias

`src/lib/weather/public-weather-page-loader.ts` continua sendo a barreira final para rotas que ainda fazem composição server-side. `loadPublicWeatherPage()` e cada domínio de `loadPublicWeatherWithMeteogram()` usam **budget local de 2,5 s** e devolvem contrato indisponível em falha/timeout.

Chuva, Vento e Meteograma preservam degradação independente. Alertas continua usando `loadPublicWeatherPage()` para o shell meteorológico, mantendo a semântica oficial dos avisos separada.

A barreira interna da inteligência meteorológica continua em **5 s**. Esse teto interno atende composição, caches e outras camadas; não define mais o tempo do primeiro documento das quatro rotas shell-first.

Os budgets das fontes oficiais permanecem calibrados separadamente: previsão municipal INMET até 4 s, requests atual/histórico em torno de 3,2 s e 2,8 s e fontes auxiliares com seus próprios limites. Um timeout descreve falha daquela integração, não indisponibilidade global da fonte.

### 5.3. Previsão de 15 dias

`/previsao-15-dias-pelotas` usa chamada independente, somente com campos diários, timeout próprio e estados `live|partial|unavailable`. Dias 1–7 e 8–15 são separados visualmente. Não existe previsão diária artificial de 30 dias.

`src/lib/weather/extended-forecast-page-loader.ts` executa meteorologia compartilhada e janela estendida através de dependências protegidas e usa **budget local de 2,8 s por domínio**. A página degrada cada domínio independentemente.

A consulta estendida direta mantém timeout de **2,2 s**. Se falhar, tiver payload incompatível ou zero dias utilizáveis, pode reutilizar o cache Open-Meteo preservado. Como o contrato compartilhado preserva 7 dias, a rota publica somente os dias reais disponíveis como `partial`, mantendo `requestedDays: 15`; dias 8–15 nunca são criados ou repetidos.

### 5.4. Contingência Open-Meteo

No servidor, o fluxo compartilhado continua:

1. origem Open-Meteo direta;
2. se utilizável, retornar;
3. em falha, tentar o último payload validado do cache privado `weather_provider_payload_cache`;
4. somente quando o cache não puder atender, consultar configuração/token e chamar a Edge Function;
5. se nada puder atender, preservar `unavailable`.

O cache preserva o timestamp real. O fallback Edge possui budget próprio de 1,6 s. Nas rotas shell-first, esse fluxo server-side não participa do primeiro documento; a previsão pública é reforçada diretamente no navegador depois da hidratação.

## 6. Observação e fontes oficiais

Embrapa Clima Temperado é a referência principal de observação local quando utilizável. Modelo numérico não substitui silenciosamente observação ausente.

A resposta pública `/api/weather/embrapa` usa `no-store` e chama `getCentralEmbrapaObservation()`, que apenas lê o centralizador persistido no pageview. O endpoint não dispara coleta nem lease. A última leitura válida conserva horário/idade originais.

No shell-first, a observação Embrapa é solicitada **depois da hidratação**, com timeout client-side próprio de 3 s. Quando utilizável, a recuperação preenche `current`, `currentProvenance`, `observation`, `sources.embrapa`, `quality.currentSource` e idade da observação. Campos não fornecidos pela estação permanecem nulos; nenhum valor de Open-Meteo é promovido silenciosamente a observação atual.

O monitor operacional permanece desacoplado da composição completa do Weather AI. A saúde da Embrapa é medida pelo próprio centralizador persistido.

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

`src/lib/hydrology/public-hydrology-page-loader.ts` centraliza os fallbacks. As dependências públicas usam **budget local de 2,5 s**: meteorologia, Laranjal, Guaíba, Lagoa, SACE e Defesa Civil. A composição usa dependências protegidas; falha ou atraso de uma não alcança o boundary global.

A Home não consulta mais essas fontes no loader inicial. A decisão é deliberada durante o P0: indisponibilidade temporária do resumo de águas é preferível a bloquear o documento principal. As páginas hidrológicas dedicadas continuam sendo a referência para leitura completa enquanto o reforço isolado da Home não for reintroduzido.

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

O shell-first não remove conteúdo editorial, `head()`, canonical, JSON-LD, FAQ editorial aprovada ou links internos das rotas críticas. O primeiro documento continua semanticamente indexável mesmo quando os valores meteorológicos dinâmicos entram progressivamente depois da hidratação.

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

`/api/runtime-version` é um endpoint operacional estático, sem secret e sem dependência externa. Responde `no-store` e `X-Robots-Tag: noindex, nofollow`; serve apenas para confirmar qual corte de runtime atingiu a publicação.

## 15. Navegação pública e coerência entre deploys

Relatos reais de navegação em 27–28/08/2026 mostraram o boundary global durante troca de páginas. Em 28/08 o problema voltou a ser reproduzido em produção com a tela **“Carregando a versão mais recente do Tempo Pelotas”** aparecendo como se fosse parte da navegação. Isso foi classificado como **P0 de produto**, porque impede uso normal do portal.

A regra operacional é: **robustez e navegação > SPA/PWA > disponibilidade instantânea de uma fonte externa**.

### 15.1. HTML e dados correntes

Documentos HTML públicos fora de embeds recebem `no-store/no-cache`, `CDN-Cache-Control: no-store`, `Pragma: no-cache` e `Expires: 0`.

Dados correntes de observação, nível e status seguem a mesma semântica de `no-store`; previsão, histórico e conteúdo editorial podem manter caches próprios quando adequados.

### 15.2. Navegação pública por documento completo

`src/components/navigation/PublicDocumentNavigationGuard.tsx` captura links internos públicos same-origin antes do TanStack Router e usa `window.location.assign()`. Cada troca pública busca novo documento/runtime.

O menu editorial principal desktop/mobile foi ainda mais endurecido: `src/production/components/home-editorial-header.tsx` não importa mais `Link` do TanStack. Seus destinos públicos são anchors nativas `<a href>`, preservando classes, `aria-current`, parâmetros regionais e estado visual sem passar pelo router cliente.

Exceções do guard: áreas autenticadas (`/conta`, `/painel`, `/auth`, `/login`, `/admin`), links externos, downloads, target externo, cliques modificados, navegação por hash e opt-out `data-spa-navigation="true"`.

### 15.3. Preload e invalidação global aposentados

`src/router.tsx` usa `defaultPreload: false`. O antigo `defaultPreload: "intent"` com delay zero permitia que hover/foco disparasse loaders SPA antes do clique; isso contrariava a política de documento completo e podia abrir o caminho do boundary sem o visitante ter navegado.

`WeatherMinuteRefresh` **não executa mais `router.invalidate()`**, `setInterval()` nem refresh global em foco/visibilidade/online. Uma página saudável não deve reabrir toda a árvore de loaders automaticamente depois de 60 s.

Atualizações em segundo plano futuras devem ser específicas do componente/domínio. Coletores e cron continuam atualizando caches centrais sem invalidar a rota inteira.

### 15.4. Shell-first e budgets P0

A política atual possui dois níveis:

**Sem dependência externa no primeiro loader:**

- Home;
- Tempo hoje;
- Tempo amanhã;
- Previsão de 7 dias.

Essas páginas entregam fallback local imediato e recuperam dados reais depois da hidratação. Portanto o primeiro documento não possui budget de 2,5/3,5/5 s de fonte: ele não espera pela fonte.

**SSR ainda composto, com teto local:**

- loaders meteorológicos públicos compartilhados: 2,5 s por dependência;
- loaders hidrológicos públicos: 2,5 s por dependência;
- Radar: 2,8 s por domínio;
- previsão de 15 dias: 2,8 s por domínio.

Ao atingir o teto, o domínio degrada para fallback `unavailable`. Isso não reduz o budget interno da fonte nem prova indisponibilidade do serviço oficial.

### 15.5. Recuperação progressiva de dados

Nas quatro rotas shell-first, a recuperação meteorológica acontece em `useEffect`, depois que o documento já foi entregue:

- Open-Meteo: previsão horária/7 dias;
- Embrapa: `/api/weather/embrapa`, observação centralizada read-only.

Os requests possuem cancelamento/timeout e falham silenciosamente do ponto de vista da navegação. A UI mantém o contrato indisponível quando não há resposta utilizável. Estado de previsão e observação é combinado funcionalmente para evitar corrida em que uma resposta apague a outra.

### 15.6. Recuperação automática fresca

`src/lib/stale-client-recovery.ts` usa `__tp_recover=<timestamp>` e `location.replace()` para no máximo uma tentativa por URL lógica em 60 s. O parâmetro é removido depois da hidratação bem-sucedida.

### 15.7. Boundary global

O root continua registrando telemetria e oferecendo contenção segura, mas a tela **“Carregando a versão mais recente do Tempo Pelotas” é excepcional**. Ela não é loading screen, não é passo esperado de navegação e sua aparição em uso normal é regressão P0.

Documento especializado: `docs/PUBLIC_ROUTE_RESILIENCE.md` e `docs/NAVIGATION_RUNTIME_RECOVERY_2026-08-27.md`.

## 16. Service worker / PWA / Web Push

O service worker permanece temporariamente aposentado. `PwaManager` não registra `/sw.js`; na hidratação, apenas remove registrations próprias antigas e caches `tempo-pelotas-*` de forma tolerante a falha.

`public/sw.js` permanece como artefato dormente. Manifest e experiência móvel permanecem. Web Push continua suspenso.

## 17. Testes e GitHub Actions

Contratos relevantes versionados:

- `tests/public-navigation-stability.test.ts`: ausência de invalidação global, anchors nativas no menu, `defaultPreload: false`, shell-first da Home/Hoje/Amanhã/7 dias e budgets das rotas secundárias;
- `tests/public-route-resilience.test.ts`: fallback meteorológico, recuperação de runtime, navegação por documento e separação entre rotas shell-first e rotas ainda protegidas pelo loader compartilhado;
- `tests/home-deferred-hydrology.test.ts`: Home sem meteorologia/hidrologia externa no primeiro loader e degradação local do bloco de águas;
- `tests/open-meteo-browser-recovery.test.ts`: recuperação de previsão no navegador, preservação de observação existente e recuperação da observação real da Embrapa sem criar campos não fornecidos;
- `tests/current-data-cache-policy.test.ts`: política `no-store` das superfícies correntes;
- `tests/fifteen-day-forecast.test.ts`: consulta estendida e contingência real/parcial;
- `tests/hydrology-overview-page.test.ts`: composição hidrológica e fallbacks;
- `tests/radar-satellite-retail.test.ts` e `tests/redemet-performance.test.ts`: contratos REDEMET;
- `tests/source-resilience-regressions.test.ts`: INMET/REDEMET/GOES;
- contratos regionais/SEO e demais testes especializados permanecem versionados.

`tests/public-navigation-stability.test.ts` está incluído no script explícito `test:contracts`; `tests/open-meteo-browser-recovery.test.ts` também já pertence ao gate explícito existente.

O GitHub Actions segue bloqueado antes da execução normal do runner. Runs recentes criam jobs com `steps=null`/sem logs. **Não declarar CI, build, typecheck ou testes aprovados/reprovados sem execução real.** A reconstrução de preview pelo Lovable comprova sincronização/build do ambiente de preview, mas não substitui a suíte local/CI completa.

## 18. Deploy e Supabase

`main` é a branch operacional e sincroniza com Lovable. Supabase é externo ao Lovable. Migration só é considerada aplicada após validação no ambiente oficial.

A migration `20260828170000_data_status_supabase_scheduler.sql` foi aplicada no Supabase oficial. O monitor de `/status-dos-dados` usa `pg_cron` + `pg_net` a cada 10 minutos. O histórico possui freshness de 30 minutos e a lacuna anterior não foi convertida em indisponibilidade fictícia.

O hotfix P0 de 28/08 altera runtime público, loaders, recuperação client-side, testes e documentação; não altera secret, migration, sitemap, canonical ou regra de alerta. Seu objetivo é impedir que latência/transporte de uma camada externa derrube ou retenha o documento público.

Commits funcionais principais desta rodada incluem:

- `dde771e5` — retirar invalidação global das páginas públicas;
- `0c917e77` — limitar loaders meteorológicos públicos a 2,5 s;
- `9eb42a88` — limitar loaders hidrológicos públicos a 2,5 s;
- `32fbaad5` — Radar público a 2,8 s;
- `c9122b5b` — previsão estendida pública a 2,8 s;
- `2ceaa2d7` — desativar preload SPA global por intenção;
- `00e1d0f0` — usar anchors nativas no menu público principal;
- `4ea282b8` — retirar fontes externas do loader inicial da Home;
- `9bc21962` — tornar Hoje shell-first;
- `e4fe13ac` — tornar Amanhã shell-first;
- `d0796a0d` — tornar 7 dias shell-first;
- `0a4d1cb8` — endpoint estático de versão do runtime;
- `960b6ff5` — recuperar observação Embrapa depois do shell público;
- `d0d1798c` — proteger a recuperação client-side da Embrapa em contrato de teste.

A publicação do corte shell-first segue em validação no domínio canônico. O endpoint `/api/runtime-version` identifica este corte como `2026-08-28-p0-shell-first-v1`; só considerar a produção alinhada quando esse release estiver acessível no domínio e as rotas críticas forem retestadas.

## 19. Qualidade de navegador

`scripts/browser-quality-smoke.mjs` usa Chrome/Chromium via CDP e cobre rotas representativas em mobile/tablet/desktop. TTFB/FCP/LCP/CLS são métricas de laboratório, não CrUX.

A validação P0 deve incluir navegação repetida pelos menus principais e permanência em aba aberta durante deploy, além de acesso direto às rotas críticas. O teste deve observar primeiro se o documento abre; disponibilidade de uma fonte específica é uma dimensão separada.

## 20. Pesquisa futura

GeoInfo Embrapa e CPTEC/SIGMA permanecem fora do runtime público até seus gates próprios. Nenhuma pesquisa futura entra no caminho crítico enquanto a estabilidade pública não estiver comprovada.

## 21. Pendências prioritárias

1. **Confirmar a publicação do release `2026-08-28-p0-shell-first-v1` e validar a navegação no domínio canônico.** Repetir Agora → Hoje → Amanhã → 7 dias → Radar → Situação das Águas → Região → Agora em desktop/mobile e com aba mantida aberta. A tela global de atualização não pode aparecer em fluxo normal.
2. Confirmar que Home, Hoje, Amanhã e 7 dias entregam o documento antes das recuperações Open-Meteo/Embrapa e que falha dessas recuperações não altera a navegabilidade.
3. Validar no navegador que a recuperação Embrapa mantém timestamp real e que previsão Open-Meteo não é apresentada como observação medida.
4. Reintroduzir o resumo hidrológico da Home somente como recuperação isolada/client-side; não recolocá-lo no loader crítico.
5. Confirmar no navegador que não ocorre preload por hover/foco nem invalidação automática depois de 60 s de permanência.
6. Confirmar política de “Agora”: observação, níveis e status sem cache de resposta; última amostra válida conserva horário/idade reais.
7. Só depois da estabilidade de navegação, retomar probes independentes de Radar/STSC/satélites e investigação dos dois satélites ainda degradados.
8. Validar páginas municipais enriquecidas em desktop/mobile/anônimo.
9. Recapturar Search Console quando o conector estiver disponível; não abrir novas cidades sem evidência.
10. Resolver provisionamento/execução do GitHub Actions e então executar suíte completa, `routes:check`, build, TypeScript e Browser Quality Smoke.
11. Concluir E2E de autenticação com duas contas descartáveis.
12. Continuar Historical Data Layer, ANA/RHN e semântica da Defesa Civil RS após o P0.
13. Validar smokes de segurança, CSP, gate geográfico e rate limiting no ambiente real.
14. Manter Web Push suspenso e service worker aposentado até estabilidade comprovada.
15. Só publicar 30 dias quando existir contrato de tendência adequado para dias 16–30.

## 22. Documentos especializados principais

| Documento | Finalidade |
| --- | --- |
| `MIGRATION_MATRIX.md` | Migração, paridade e pendências históricas |
| `WEATHER_PAGE_IDENTITY.md` | Identidade das páginas meteorológicas |
| `docs/PUBLIC_ROUTE_RESILIENCE.md` | Shell-first, fallbacks, budgets de fonte e budgets locais de página |
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

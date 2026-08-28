# Resiliência das rotas públicas

## Objetivo

Evitar que páginas públicas do Tempo Pelotas sejam substituídas pelo `errorComponent` global por falhas transitórias que podem ser degradadas com segurança.

A estratégia cobre três classes diferentes de falha:

1. falha de dados no servidor, especialmente na consolidação meteorológica compartilhada;
2. dependência externa lenta o bastante para estourar o orçamento de uma navegação pública;
3. cliente desatualizado após deploy, quando o navegador tenta carregar um chunk/module que já não existe na versão publicada.

O `errorComponent` global continua existindo como última barreira para erros de programação ou falhas que não possam ser recuperadas com segurança.

## 1. Falha de dados meteorológicos

Grande parte das páginas meteorológicas públicas consome `getWeatherIntelligence()`.

A camada interna já possui timeouts e estados `unavailable` para várias fontes, mas uma exceção inesperada acima desses adapters ainda podia rejeitar a server function e derrubar a rota inteira.

`src/lib/weather/weather-intelligence.functions.ts` contém a última barreira de exceção. Quando `fetchWeatherIntelligence()` falha de forma inesperada, a server function devolve `createUnavailableWeatherIntelligence()` em vez de propagar a exceção para o router.

O fallback está em `src/lib/weather/weather-intelligence-fallback.ts` e segue estas regras:

- `status: unavailable`;
- `current: null`;
- séries horária e diária vazias;
- alertas, previsões oficiais e contextos auxiliares vazios;
- todas as fontes marcadas como indisponíveis e não utilizáveis;
- score de qualidade zero e confiança baixa;
- brief determinístico, sem chamada de IA;
- nenhum valor meteorológico demonstrativo ou inventado.

A interface pública já possui estados vazios/indisponíveis e deve continuar navegável mesmo sem dados utilizáveis.

## 2. Orçamento de latência

A auditoria identificou uma causa sistêmica importante: o caminho compartilhado de previsão continha dependências capazes de permanecer ativas por dezenas de segundos. Como várias páginas públicas dependem de `getWeatherIntelligence()`, uma fonte lenta podia afetar diversas rotas ao mesmo tempo.

O contrato atual prioriza disponibilidade da página sem transformar uma fonte pública apenas mais lenta em falsa indisponibilidade:

- `getWeatherIntelligence()` possui prazo máximo de **5 segundos** para a consolidação completa;
- Open-Meteo direto usa timeout de **1,8 segundo** e mantém a validação estrutural canônica antes da normalização;
- MET Norway usa timeout de **1,8 segundo**;
- a contingência Open-Meteo via Supabase/Edge só é consultada quando a origem direta estiver indisponível e possui orçamento total de **900 ms**, compartilhado entre leitura de configuração e chamada da Edge Function;
- `WEATHER_SOURCE_REQUEST_TIMEOUT_MS` define requests de **2,2 s para Embrapa**, **3,2 s para INMET** e **2,4 s para CPPMet**;
- `OFFICIAL_SOURCE_DEADLINE_MS` preserva tetos de **2,6 s para Embrapa**, **3,6 s para INMET**, **4 s para previsão municipal INMET** e **2,8 s para CPPMet**;
- ao atingir o prazo global, a página recebe o contrato `unavailable` seguro em vez de aguardar indefinidamente ou cair no error boundary.

Esses limites não convertem uma fonte lenta em dado válido. Eles encerram trabalho de rede sempre que possível e permitem que a interface assuma seu estado de indisponibilidade.

### 2.1. Budget de página separado do budget de fonte

Algumas rotas agregam mais de uma server function independente. Nelas, o teto interno de cada fonte não deve se transformar automaticamente no tempo máximo do SSR público.

Em 28/08/2026 foram adicionadas barreiras locais de **4 segundos por dependência** em:

- `src/lib/weather/extended-forecast-page-loader.ts`, usado por `/previsao-15-dias-pelotas`;
- `src/lib/redemet/radar-page-loader.ts`, usado por `/radar-e-satelite-pelotas`.

As duas rotas continuam usando `Promise.allSettled` e preservam degradação independente. A diferença é que a página pode devolver o fallback daquele domínio antes do teto de 5 s da inteligência meteorológica compartilhada ou do teto de 4,5 s do overview REDEMET.

Esse budget local **não reduz** os deadlines internos das fontes e não afirma que a fonte pública esteja indisponível. Ele limita apenas o quanto aquela renderização pública espera antes de usar um contrato já previsto como `unavailable`.

### 2.2. Open-Meteo direto antes de Edge/Supabase

A navegação pública não consulta mais Supabase/Edge antes da origem meteorológica principal.

O fluxo é:

1. consultar Open-Meteo diretamente com timeout curto e validação de schema;
2. se a resposta for utilizável, retornar imediatamente;
3. somente se a origem direta estiver `unavailable`, tentar a contingência `open-meteo-forecast`;
4. se a contingência também falhar, preservar o estado `unavailable` da origem direta.

Isso retira banco e Edge Function do caminho comum de uma pageview saudável sem eliminar a contingência já existente.

### 2.3. Embrapa cache-first no pageview

`getCentralEmbrapaObservation()` é leitura cache-first/read-only no caminho público:

- a leitura da linha central do Supabase possui timeout de **800 ms**;
- se existir observação armazenada, ela é devolvida mesmo quando antiga;
- a camada de agregação continua responsável por calcular a idade e não usa uma leitura stale como condição atual;
- o pageview não chama `refreshCentralEmbrapaObservation()` e não reivindica lease nem escreve histórico;
- atualização, lease e persistência continuam pertencendo ao coletor/cron existente;
- se não houver linha central ou a leitura do banco falhar, a fonte direta da Embrapa continua disponível como contingência dentro do timeout oficial.

Assim, visitar uma página não dispara trabalho de coleta persistente.

### 2.4. INMET sem fan-out excessivo

O enriquecimento RSS/CAP do INMET deixou de abrir dezenas de requisições de detalhe durante uma pageview.

O limite permanece em **8** detalhes por tentativa, com deadline de enriquecimento de **1,8 segundo**. Os identificadores já encontrados no feed/base municipal são priorizados; somente vagas restantes são preenchidas pelos primeiros detalhes válidos do RSS, sem duplicação.

Falha ou lentidão no enriquecimento não invalida os avisos obtidos pelo feed base.

## 3. Cliente desatualizado após deploy

O portal usa Vite/TanStack e possui chunks versionados. Quando uma aba permanece aberta durante um deploy, ela pode continuar com o shell antigo e, ao navegar para outra rota, solicitar um chunk que foi substituído. Erros típicos incluem:

- `Failed to fetch dynamically imported module`;
- `Error loading dynamically imported module`;
- `ChunkLoadError`;
- falhas de preload de módulo/CSS.

`src/lib/stale-client-recovery.ts` trata assinaturas conhecidas desse cenário e também uma tentativa fresca controlada para falhas transitórias de navegação/runtime depois da hidratação.

A recuperação possui entradas no evento `vite:preloadError` e no `errorComponent` global. Quando a assinatura é compatível com cliente desatualizado ou falha transitória recuperável, o navegador navega para um documento fresco com `__tp_recover=<timestamp>`.

Para impedir loop, a tentativa é registrada em `sessionStorage` por URL lógica e só pode ocorrer automaticamente uma vez dentro de uma janela de 60 segundos. Depois de hidratação bem-sucedida, o parâmetro de recuperação é removido com `history.replaceState`.

## 4. Central Regional

`/tempo-na-regiao-sul-rs` possui ainda uma barreira própria porque seu contrato deve preservar o diretório das 24 cidades mesmo quando todas as fontes da visão resumida falharem.

Esse fallback cria itens `unavailable` para todo `PUBLIC_REGIONAL_CITIES`, com métricas nulas e links municipais preservados. O mapa também possui boundary próprio e não pode derrubar lista, busca, filtros ou links. A estratégia detalhada do provedor/snapshot continua em `docs/REGIONAL_WEATHER_FALLBACK.md`.

## 5. Evolução dos budgets

No incidente de 25/08/2026, páginas que dependiam do pipeline meteorológico compartilhado atingiram timeout enquanto rotas menos dependentes continuaram respondendo. A investigação encontrou uma combinação de contingência Open-Meteo muito longa, budgets extensos em fontes auxiliares, refresh da Embrapa no pageview e fan-out do RSS do INMET.

A primeira resposta operacional reduziu agressivamente a barreira compartilhada até **3 segundos**. Em 28/08/2026, após evidência de falsos estados `unavailable` causados por respostas oficiais apenas mais lentas, o teto da inteligência meteorológica foi recalibrado para **5 segundos** e os budgets individuais das fontes oficiais foram ampliados de forma controlada.

A proteção de latência passou então a existir em duas camadas:

1. budgets internos suficientemente realistas para não declarar uma fonte fora cedo demais;
2. budgets locais de página em agregadores sensíveis, como 15 dias e Radar, que liberam o SSR em até 4 s por dependência e degradam somente o domínio atrasado.

Isso evita voltar ao erro original de esperar dezenas de segundos sem reintroduzir o efeito colateral de classificar latência normal como indisponibilidade pública.

A recuperação de chunks antigos permanece necessária como segunda causa possível, especialmente em abas mantidas abertas durante deploys frequentes.

## 6. O que não fazer

- Não transformar erro de programação arbitrário em dado meteorológico válido.
- Não inserir temperatura, chuva, vento, nível, alerta ou timestamp fictício para preencher a interface.
- Não aplicar recarga automática indiscriminada ou criar loop de recuperação.
- Não criar uma chamada externa por página quando a camada compartilhada já possui fallback.
- Não reduzir ou aumentar timeouts de fontes oficiais sem evidência operacional; budget de fonte e budget de SSR são contratos diferentes.
- Não disparar coleta, lease ou persistência apenas porque um visitante abriu uma página pública.
- Não remover o `errorComponent` global: ele continua necessário como contenção final e telemetria.

## 7. Testes

`tests/public-route-resilience.test.ts` cobre o fallback meteorológico, a barreira global atual de 5 s, budgets das fontes, recuperação de runtime, navegação pública por documento, isolamento do mapa e loaders meteorológicos básicos.

`tests/fifteen-day-forecast.test.ts` protege a consulta estendida dedicada, a degradação independente e o budget local de 4 s do loader público de 15 dias.

`tests/redemet-performance.test.ts` protege os budgets internos do overview REDEMET e o budget local de 4 s da página pública de Radar, mantendo explícita a diferença entre latência upstream e tempo máximo de espera do SSR.

O workflow `quality.yml` executa `test:contracts`, que inclui os contratos de 15 dias e REDEMET, além da etapa dedicada de resiliência pública. A aprovação continua condicionada a execução real dos runners; um workflow criado sem steps não prova build ou testes aprovados nem reprovados.

## 8. Operação e diagnóstico

Quando uma página pública voltar a cair no erro global ou exceder o tempo esperado, classificar primeiro a falha:

- **dados:** conferir server function, fonte externa e fallback correspondente;
- **latência:** conferir se uma dependência ultrapassou o budget interno ou o budget local da página e se o fallback entrou antes do timeout da hospedagem/crawler;
- **asset/chunk:** conferir se ocorreu logo após deploy e se o erro corresponde a módulo dinâmico/preload;
- **programação/render:** tratar como bug real, sem mascarar com fallback genérico;
- **infra/runtime:** conferir deploy, logs e disponibilidade da aplicação.

A resiliência deve manter o portal navegável quando a informação externa estiver indisponível, mas sem esconder defeitos reais de código ou afirmar indisponibilidade global de uma fonte a partir de uma única integração.

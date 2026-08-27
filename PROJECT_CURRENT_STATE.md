# Tempo Pelotas — estado atual do projeto

Última atualização: 27/08/2026  
Branch operacional: `main`  
Domínio canônico: `https://tempopelotas.com.br`

## 1. Papel deste documento

Este arquivo é a fonte de verdade de alto nível sobre o estado atual do Tempo Pelotas: o que está ativo, parcial, suspenso, quais fontes sustentam cada domínio e quais pendências continuam abertas.

Detalhes técnicos permanecem nos documentos especializados em `docs/`. Código ativo em `src/`, workflows e migrations prevalecem sobre documentação antiga. `_legacy/` é somente referência histórica.

Regras permanentes:

- mudanças estruturais de página pública, fonte, SEO/indexação, runtime, banco, autenticação ou deploy devem atualizar este arquivo no mesmo conjunto;
- não versionar HARs brutos, cookies, tokens, chaves, secrets ou URLs autenticadas;
- observação, previsão, alerta oficial, reanálise e dado derivado permanecem semanticamente separados;
- indisponibilidade de fonte nunca deve virar valor zero, situação normal ou diagnóstico automático.

## 2. Visão executiva

O Tempo Pelotas é um portal meteorológico e hidrológico regional focado em Pelotas e Zona Sul do Rio Grande do Sul. Combina previsão, observação local, chuva, vento, meteograma, alertas oficiais, radar/satélite, trovoadas, hidrologia, histórico, câmeras, páginas regionais e conteúdo editorial/SEO.

Estado geral:

| Domínio | Estado | Observação |
| --- | --- | --- |
| Portal público | Ativo | Produção em `tempopelotas.com.br` |
| Home meteorológica | Ativa | Condição atual, próximas horas, tendência, alertas e monitoramento |
| Hoje / amanhã / 7 dias | Ativo | Rotas dedicadas e indexáveis |
| Previsão de 15 dias | Implementada em 26/08/2026 | Consulta diária Open-Meteo dedicada, separada do contrato global de 7 dias |
| Chuva / vento / meteograma | Ativo | Chance, volume, direção, rajadas e leitura horária estruturada |
| Alertas oficiais | Ativo | INMET, com validade, abrangência e instruções preservadas |
| Embrapa Clima Temperado | Ativo | Observação local, extremos e acumulados observados |
| REDEMET / DECEA | Ativo com dependência externa | Radar, satélite e STSC/trovoadas |
| Hidrologia | Ativo | Laranjal, Lagoa dos Patos, Guaíba com página dedicada, SACE e rede regional |
| Defesa Civil RS | Ativo público | Hidrometeorologia regional com kill switch server-side |
| Histórico climático | Ativo | Janela pública e Historical Data Layer privado em expansão |
| Enchente de 1941 | Implementada em 27/08/2026 | Registro documental de Pelotas com referência histórica do São Gonçalo e fontes UCPel/UFPel/Prefeitura |
| Enchente de 2024 | Ativo | Registro histórico permanente |
| Câmeras | Ativo com dependência externa | Live/replay com estados explícitos; descoberta e player visual da Home são diferidos para não disputar o caminho crítico |
| Central Regional | Ativo | 24 cidades no inventário: Pelotas + 23 páginas municipais |
| SEO técnico | Ativo | Canonical, sitemap, robots, OG/Twitter, Schema.org, snippets por intenção, entidades geográficas e links internos globais |
| Qualidade de navegador | Gate versionado, execução pendente | Acessibilidade estrutural, responsividade, peso do build e Web Vitals de laboratório; não há aprovação enquanto os runners não executarem o workflow |
| Conta / login Google | Parcial operacional | Fundação implementada; E2E real com duas contas ainda pendente |
| Free / PRO | Fundação pronta | Entitlements existem; billing comercial ainda não existe |
| Weather AI | Ativo controlado | Snapshot server-side, orçamento e fallback determinístico |
| Gate geográfico / CSP / rate limit | Ativo | Segurança em camada de aplicação; smoke real ainda deve ser confirmado |
| PWA / instalação e offline | Ativo técnico | Manifest, instalação/atualização e experiência offline permanecem ativos; registro do service worker ocorre após `load` + idle para não disputar o primeiro render |
| Web Push | Suspenso | Código preservado, mas `PushNotificationsManager` foi retirado do root e não consulta configuração global enquanto suspenso |
| GeoInfo Embrapa | Pesquisa documentada | Camada temática futura; não integra o forecast de 15 dias |
| CPTEC / SIGMA | Pesquisa futura | Fora do runtime público até nova revisão |

## 3. Stack e operação

Aplicação principal:

- React 19;
- TypeScript 5.8;
- TanStack Start / Router;
- Vite 8;
- Nitro;
- Tailwind CSS 4;
- Supabase JS/SSR;
- MapLibre GL;
- Recharts;
- Zod;
- Node.js 24 nos workflows;
- Lovable como ambiente conectado de publicação/sincronização.

Scripts operacionais principais:

- `npm run dev`;
- `npm run build`;
- `npm test`;
- `npm run test:contracts`;
- `npm run test:routes`;
- `npm run routes:generate`;
- `npm run routes:check`;
- `npm run typecheck`;
- `npm run lint`;
- `npm run quality:browser`;
- `npm run quality:a11y`;
- `npm run quality:assets`;
- `npm run runtime:check`;
- `npm run cutover:smoke`.

GitHub `main` permanece a fonte de versionamento. Lovable não substitui o Supabase externo e não deve ser usado para provisionar banco paralelo.

Rotas que renderizam `InternalWeatherPageShell` ou `ContentPageShell` são tratadas como standalone em `SiteLayout`, evitando um segundo header/footer global. Em 27/08/2026 esse contrato foi corrigido para incluir 15 dias, Guaíba, Enchente de 1941 e Quem Somos e passou a ter teste automático que varre as rotas com shell próprio.

O header público também recebeu proteção específica de teclado: ao fechar um megamenu ou menu móvel com `Escape` enquanto o foco está dentro do painel, o foco retorna ao controle que abriu aquele painel. O estado aberto/fechado continua pertencendo ao `HomeEditorialHeader`; a camada de restauração de foco não cria uma segunda fonte de estado.

## 4. Rotas públicas indexáveis

`src/lib/public-routes.ts` é a fonte programática do sitemap.

Inventário após a publicação da página histórica de 1941: **48 URLs indexáveis**, sendo **25 rotas fixas** e **23 páginas municipais**. Pelotas usa a Home como página regional principal. As rodadas posteriores de refinamento/enriquecimento não criaram novas URLs e mantiveram esse inventário.

### Rotas fixas

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

### Páginas municipais

Inventário aprovado: Capão do Leão, Canguçu, Morro Redondo, Turuçu, Arroio do Padre, Pedro Osório, Cerrito, Piratini, Rio Grande, São José do Norte, São Lourenço do Sul, Cristal, Jaguarão, Arroio Grande, Herval, Santa Vitória do Palmar, Chuí, Pinheiro Machado, Pedras Altas, Bagé, Candiota, Aceguá e Dom Pedrito.

Cada município possui slug, IBGE, coordenadas, grupo regional e descriptor em `src/lib/regional-cities.ts`. Nenhuma cidade nova deve ser indexada sem passar pelo publication gate.

## 5. Arquitetura de previsão

### 5.1. Contrato meteorológico compartilhado

O fluxo principal usa Open-Meteo como previsão detalhada e MET Norway como contingência quando aplicável. O contrato Open-Meteo compartilhado continua com:

- `forecast_days=7`;
- até 24 horas públicas da série horária rica;
- temperatura, precipitação, vento e campos atmosféricos normalizados;
- timezone `America/Sao_Paulo`.

Esse contrato atende Home, Hoje, Amanhã, 7 dias e demais superfícies que dependem da inteligência meteorológica consolidada.

`getWeatherIntelligence()` possui fallback seguro e orçamento de latência para evitar que fonte externa lenta derrube várias rotas ao mesmo tempo.

### 5.2. Previsão de 15 dias

A rota `/previsao-15-dias-pelotas` usa uma chamada independente em:

- `src/lib/weather/extended-forecast.server.ts`;
- `src/lib/weather/extended-forecast.functions.ts`;
- `src/lib/weather/extended-forecast.types.ts`.

Contrato:

- 15 dias solicitados ao Open-Meteo;
- somente campos diários: weather code, mínima, máxima, chance máxima de chuva, volume diário e rajada máxima;
- sem série horária adicional e sem duplicar `current`;
- timeout próprio de 2,2 s;
- cache público de 5 min + `stale-while-revalidate` de 5 min;
- estados `live`, `partial` e `unavailable`;
- dia com campo obrigatório ausente não é preenchido com zero.

A página atende explicitamente as intenções de 10 e 15 dias na mesma URL. Não existe página separada de 10 dias, porque os primeiros dez dias já pertencem à mesma série diária e uma rota adicional seria redundante.

A interface separa dias 1–7 de dias 8–15 e explica que a incerteza aumenta com o horizonte. Não existe percentual artificial de confiança. Alertas do INMET não são extrapolados para datas sem aviso publicado.

A página de 7 dias possui ligação explícita para a janela de 15 dias. O diretório global do rodapé também passou a expor a previsão de 15 dias como próximo horizonte, reforçando descoberta e rastreamento interno sem criar URL redundante de 10 dias.

Documento especializado: `docs/FORECAST_15_DAY_IMPLEMENTATION_2026-08-26.md`.

### 5.3. Previsão de 30 dias

Ainda não implementada. O plano aprovado continua sendo:

- até 15 dias: previsão diária;
- dias 16–30: somente tendência de longo prazo quando existir contrato de dados adequado.

Não publicar 30 cards diários com precisão inexistente.

## 6. Observação e fontes oficiais

### Embrapa Clima Temperado

Fonte principal de observação meteorológica local quando utilizável:

- temperatura;
- umidade;
- sensação;
- pressão;
- vento;
- acumulados observados;
- extremos diários;
- histórico próprio.

Modelo numérico não substitui silenciosamente uma observação local ausente.

### INMET

Usado para:

- avisos meteorológicos oficiais;
- previsão oficial complementar;
- estação de referência;
- mapa/registros de geadas;
- histórico horário da A887 no arquivo próprio.

Severidade, validade, abrangência e instruções pertencem à fonte oficial. Ausência ou falha da consulta não equivale a ausência de risco.

### CPPMet / UFPel

Contexto regional complementar de previsão. Não substitui silenciosamente a grade detalhada principal.

### SIMAGRO RS

WRF/GFS/GFS Agro permanecem como visualização gráfica complementar em `/meteograma-pelotas`. Não há OCR ou extração numérica de pixels.

## 7. Chuva e precipitação acumulada

`/chuva-em-pelotas` mantém separados:

- chuva observada: Embrapa;
- acumulados regionais: Defesa Civil RS quando disponíveis e recentes;
- chuva prevista: Open-Meteo;
- aviso oficial: INMET.

Observado e previsto não são somados automaticamente, pois as janelas podem se sobrepor. Acumulados regionais pertencem à estação identificada e não representam automaticamente toda Pelotas.

A página também responde visivelmente à intenção `Vai chover hoje em Pelotas?` usando os valores dinâmicos de chance e volume já exibidos, sem gravar uma resposta meteorológica fixa em conteúdo editorial. A navegação de aprofundamento liga Chuva a Radar, Situação das Águas, Laranjal e alertas oficiais.

## 8. REDEMET e monitoramento visual

Integração server-side com `REDEMET_API_KEY` somente no servidor.

Ativo:

- radar, com Santiago como estação preferencial e Canguçu como fallback quando houver imagem válida;
- satélite realçada, infravermelho e visível;
- STSC/trovoadas com filtro regional e distância aproximada até Pelotas;
- proxy controlado para imagens externas;
- allowlists e HTTPS obrigatório.

Radar, satélite e STSC são monitoramento/observação visual. STSC não é alerta oficial e distância não representa intensidade ou trajetória.

Em 27/08/2026, `/radar-e-satelite-pelotas` foi refinada para cobrir explicitamente a intenção `radar de chuva em Pelotas`. Quando o conteúdo usa a ideia de “agora”, ela significa o **quadro mais recente disponível**, sempre subordinado ao timestamp da fonte; imagem atrasada não é apresentada como tempo real. Os valores meteorológicos exibidos ao lado continuam sendo previsão independente das imagens REDEMET.

Documento: `docs/REDEMET_OPERATIONS.md`.

## 9. Hidrologia

### Laranjal / Lagoa dos Patos

A Estação Laranjal é a referência operacional local apresentada para Pelotas. O portal preserva nível, horário, idade da leitura, tendência e variações recentes sem converter leitura atrasada em valor atual.

A página do Laranjal responde também à intenção `nível em tempo real`, mas de forma estrita: ela descreve a leitura mais recente recebida, sempre acompanhada de horário e estado de atualização. Dado atrasado ou indisponível nunca é chamado de medição atual em tempo real.

A rede da Lagoa agrega pontos como Rio Grande/FURG, São Lourenço do Sul, Arambaré, São José do Norte e Itapuã. Réguas distintas não devem ser comparadas por simples subtração sem referência compatível.

### Guaíba / SACE

A rota indexável `/nivel-do-guaiba` foi publicada em 27/08/2026 como página operacional dedicada do eixo hidrológico regional. Ela reutiliza o contrato server-side já existente, sem criar coletor novo:

- Cais Mauá / MetSul-TideSat como série preferencial quando utilizável;
- Usina do Gasômetro / Nível Guaíba como referência independente e contingência do contrato atual;
- estado `live`, `stale` ou `unavailable`;
- horário e idade da leitura;
- tendência em cm/h;
- variação em 24 h;
- mínimo, média e máximo da janela disponível;
- Cais Mauá e Gasômetro preservados como réguas e referências próprias.

A página não transforma nível do Guaíba em diagnóstico automático para Pelotas e não transfere cotas entre estações. O Guaíba é apresentado como parte do sistema regional conectado à Lagoa dos Patos.

O contexto do SACE continua preservando a classificação da própria estação. Situação elevada em outro ponto não é convertida automaticamente em risco para Pelotas.

O diretório global do rodapé aponta diretamente para `/nivel-do-guaiba`, conectando a página operacional ao cluster Laranjal → situação das águas → Guaíba. A malha editorial também conecta o Guaíba aos registros de 1941 e 2024, sempre preservando as referências próprias das réguas atuais e históricas.

### Defesa Civil RS

Integração pública GraphQL server-side ativa por padrão. `DEFESA_CIVIL_HYDRO_ENABLED=false` funciona como kill switch.

Conforme a estação, podem existir:

- nível de rio;
- tendência informada pela fonte;
- acumulados de chuva de 1 h a 168 h;
- temperatura, sensação, umidade e pressão;
- vento, rajada, direção e radiação.

Capacidade de sensores não é classificação de risco. Timestamps futuros incompatíveis são rejeitados.

### ANA / RHN

Acesso autorizado e integração em validação. Não substituir fontes atuais sem validar código da estação, parâmetro, unidade, referência vertical, timezone, timestamp e governança.

Documentos principais:

- `docs/ANA_RHN_INTEGRATION.md`;
- `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md`;
- `docs/SEO_TRENDS_HYDROLOGY_GROUP1_2026-08-26.md`;
- `docs/SEO_TRENDS_HYDROLOGY_GROUP2_2026-08-26.md`;
- `docs/SEO_TRENDS_HYDROLOGY_GROUP3_2026-08-26.md`.

## 10. Histórico e patrimônio de dados

O Historical Data Layer mantém separação explícita entre:

- `observation`;
- `forecast`;
- `reanalysis`;
- `derived`.

Já existem, em diferentes estágios, observações Embrapa, extremos diários, hidrologia ambiental, forecast runs ricos Open-Meteo/MET Norway, eventos estruturados e histórico INMET A887.

`historical_data_sources.paid_access_allowed` permanece bloqueado por padrão até revisão específica de uso pago/exportável.

A rota `/historico-climatico-pelotas` é definida como **histórico meteorológico recente de 30 dias** e não chama esse período de climatologia ou normal climática. A rota `/clima-em-pelotas` mantém a intenção de clima de longo prazo, estações do ano, climatologia e Normais Climatológicas do INMET. As duas páginas possuem ligação recíproca e explicam explicitamente a diferença entre período recente e referência climática. A rota `/enchente-2024-pelotas-laranjal` preserva o registro histórico de 2024.

A rota `/enchente-1941-pelotas` foi implementada em 27/08/2026 após pesquisa documental própria. Ela usa o acervo Nelson Nobre Magalhães preservado pela UCPel, trabalho de pesquisadores da UFPel e registros oficiais da Prefeitura para explicar a referência histórica de 2,88 m associada ao Canal São Gonçalo, a documentação fotográfica da duração da cheia e a comparação controlada com 2024. A página não trata 2,88 m como cota da Estação Laranjal nem transfere a referência para outras réguas.

As páginas de 1941 e 2024 possuem links recíprocos e ambas foram incluídas no diretório global “Águas” do rodapé, formando uma sequência histórica rastreável junto das páginas operacionais atuais. A página de situação hidrológica também aponta para os dois registros históricos, fechando a navegação entre situação atual e memória das grandes cheias.

Documentos:

- `docs/HISTORICAL_DATA_INVENTORY.md`;
- `docs/FLOOD_1941_RESEARCH_2026-08-27.md`.

## 11. GeoInfo Embrapa

Levantamento técnico concluído em `docs/EMBRAPA_GEOINFO_DATASET_SURVEY_2026-08-26.md`.

Decisão:

- GeoNetwork/CSW/GeoNode servem para descoberta de metadados;
- GeoServer WMS/WFS/WCS/WMTS pode futuramente alimentar camadas temáticas;
- datasets devem passar por gate de licença, escala, data, semântica e uso comercial;
- GeoInfo não substitui Embrapa estação, Open-Meteo, INMET, REDEMET ou hidrologia operacional;
- GeoInfo não faz parte do critical path da previsão de 15 dias.

Candidatos futuros incluem água disponível no solo, erodibilidade, suscetibilidade/vulnerabilidade à erosão e erosividade climatológica da chuva.

## 12. Central Regional

`/tempo-na-regiao-sul-rs` permanece como hub das 24 cidades aprovadas.

Características:

- consulta Open-Meteo em lote para as coordenadas cadastradas;
- resumo de modelo claramente rotulado como estimativa;
- busca e filtros regionais;
- mapa MapLibre reutilizando o mesmo dataset;
- avisos INMET permanecem nas páginas municipais individuais;
- fallback acessível mantém links das cidades se o mapa falhar;
- nenhuma expansão municipal é automática.

As páginas regionais usam Open-Meteo por coordenada própria e alertas INMET pelo código municipal. Onze municípios possuem perfil editorial local específico: Rio Grande, São José do Norte, São Lourenço do Sul, Canguçu, Piratini, Dom Pedrito, Bagé, Jaguarão, Santa Vitória do Palmar, Chuí e Capão do Leão. Esses perfis usam contexto factual distinto do município; as demais cidades continuam no contrato editorial comum.

Uma camada concorrente chegou a aplicar FAQ praticamente igual e `FAQPage` a todas as páginas municipais. Essa camada foi removida na revisão de 27/08/2026 por ser excessivamente templated. O gate atual permite perfis locais distintos, mas bloqueia FAQ em massa que apenas substitua o nome do município sem evidência e conteúdo próprios.

Em 27/08/2026, o schema editorial do hub regional foi refinado para descrever explicitamente previsão por cidade, mapa meteorológico regional e temperatura/chuva/vento por município. A mudança não altera o inventário de 24 cidades, o fallback nem os dados consultados.

Documento de gate: `docs/REGIONAL_CITY_PUBLICATION_GATE.md`.

## 13. SEO e pesquisa de intenção

Arquitetura atual por horizonte:

- agora: Home;
- hoje/por hora: `/tempo-hoje-pelotas`;
- amanhã: `/tempo-amanha-pelotas`;
- 7 dias/semana: `/previsao-7-dias-pelotas`;
- 10/15 dias: `/previsao-15-dias-pelotas`;
- 20/30 dias: ainda não publicado.

Princípio: não criar URLs quase duplicadas apenas para trocar número, dia ou palavra-chave. A intenção deve ter utilidade, fonte e contrato próprios.

Os levantamentos do Google Trends de 26/08/2026 estão documentados sem HAR bruto no repositório. A evidência reforçou 15 dias, hidrologia/enchente, Guaíba, sexta/sábado e consultas regionais.

Em 27/08/2026, `/nivel-do-guaiba` avançou como URL operacional com contrato de dados já existente e utilidade hidrológica distinta. Na sequência, `/enchente-1941-pelotas` passou pelo gate documental e foi publicada como ativo histórico: a canonical não inclui `Laranjal` porque a base forte levantada sustenta Pelotas, Praça do Porto e Canal São Gonçalo, sem ampliar territorialmente o fato histórico além das fontes.

A rodada seguinte reforçou links internos globais sem abrir novas URLs: o rodapé passa a expor `/previsao-15-dias-pelotas`, `/nivel-do-guaiba`, `/enchente-1941-pelotas` e `/enchente-2024-pelotas-laranjal`. A navegação contextual das páginas históricas também permanece recíproca.

Em 27/08/2026, a fase passou de expansão para refinamento das 48 URLs existentes. A Home assumiu explicitamente a intenção `agora`, enquanto `/tempo-hoje-pelotas` ficou com `hoje / por hora`; Chuva passou a responder visivelmente `Vai chover hoje em Pelotas?`; a malha interna conecta Hoje → 7 dias → 15 dias, Chuva → Radar → Situação das Águas → Laranjal e o cluster Laranjal ↔ Guaíba ↔ 1941 ↔ 2024. O refinamento não altera a separação entre observação, previsão, alerta e histórico.

Na mesma janela, perfis editoriais locais foram ampliados para alguns municípios já publicados. Eles foram preservados por terem contexto factual distinto de costa, Lagoa dos Patos, Campanha, Serra do Sudeste, fronteira ou relação regional; essa ampliação não é tratada como nova evidência de demanda. O Search Console continua indisponível por assinatura, portanto novos perfis, novas cidades e decisões por dia da semana continuam dependentes de evidência posterior. O FAQ/schema genérico aplicado em massa às cidades foi removido para evitar conteúdo templated.

A continuação da rodada refinou mais cinco URLs existentes: `/tempo-amanha-pelotas` passou a ter camada editorial e FAQ próprios para a decisão do próximo dia; `/previsao-7-dias-pelotas` passou a cobrir também a intenção de previsão da semana; `/previsao-15-dias-pelotas` consolidou explicitamente 10 e 15 dias sem URL duplicada; `/vento-em-pelotas` passou a cobrir vento hoje, direção e rajadas por hora preservando observação x previsão; e `/radar-e-satelite-pelotas` reforçou a intenção radar de chuva, tratando “agora” como a imagem mais recente disponível com timestamp, sem chamar quadro atrasado de tempo real. Nenhuma dessas mudanças criou nova fonte, coletor ou rota.

A terceira parte da rodada separou intenções que ainda estavam próximas: `/meteograma-pelotas` passou a assumir **meteograma e previsão horária detalhada por até 48h**, diferenciando-se de Hoje; `/clima-em-pelotas` passou a assumir **clima, estações do ano e climatologia**; `/historico-climatico-pelotas` passou a assumir **histórico meteorológico recente de 30 dias**; `/mapa-de-geadas-rio-grande-do-sul` passou a trazer “mapa de geadas observadas” no snippet e continua explicitamente não preditivo; e `/alertas` passou a explicitar **Alertas do INMET em Pelotas e região**, com ligação contextual à hidrologia sem converter aviso meteorológico em diagnóstico de inundação. `/estacao-embrapa-pelotas` foi revisada e permaneceu inalterada por já possuir intenção própria de observação local.

A auditoria final das páginas de apoio manteve `/cameras-ao-vivo-pelotas`, `/blog` e `/metodologia` sem mudanças por já estarem semanticamente maduras. `/privacidade-e-dados` teve um `<main>` aninhado removido porque `ContentPageShell` já fornece o elemento principal; `/status-dos-dados` ganhou schema editorial, breadcrumbs e entidades coerentes com disponibilidade/incidentes; e o hub regional ganhou entidades mais descritivas sem novas cidades. Essas mudanças não alteram política de privacidade, coleta de conta, monitoramento operacional ou integrações.

As páginas permanentes de sexta/sábado continuam condicionadas ao gate de intenção e Search Console; não devem ser publicadas apenas com o sinal isolado do Trends.

Documentos:

- `docs/SEO_GSC_BASELINE_2026-08-16.md`;
- `docs/SEO_SEARCH_INTENT_PLAN_2026-08-26.md`;
- `docs/SEO_TRENDS_EVIDENCE_2026-08-26.md`;
- `docs/SEO_CONTENT_SOURCE_IMPLEMENTATION_PLAN_2026-08-26.md`;
- `docs/SEO_REFINEMENT_ENRICHMENT_2026-08-27.md`;
- `docs/FLOOD_1941_RESEARCH_2026-08-27.md`.

## 14. Conta, Free e PRO

Fundação existente:

- Google Identity Services + Supabase Auth por ID Token;
- sessão SSR;
- `/conta`;
- `/painel` autenticado/noindex;
- preferências e consentimentos;
- exportação e exclusão;
- `account_access` com `free|pro`;
- entitlements centralizados.

Billing comercial ainda não existe. Não apresentar PRO como disponível para compra até produto/preço/provedor/webhook/entitlement automatizado estarem implantados e validados.

Direção:

> O portal público informa. A conta Free organiza e acompanha. O PRO analisa, compara e aprofunda.

O PRO deve monetizar processamento, histórico permitido, comparação, personalização, derivados e ferramentas — não esconder dado oficial público apenas para cobrar acesso.

Documentos:

- `docs/auth-account.md`;
- `docs/ACCOUNT_AND_PRO_ARCHITECTURE.md`;
- `docs/DATA_ACCESS_PUBLIC_FREE_PRO_PLAN.md`.

## 15. IA

IA não é dependência do front público.

O Weather AI existente opera por snapshots server-side, fingerprint, cache, teto de chamadas e fallback determinístico. Novas utilidades públicas não devem chamar IA por pageview.

IA PRO futura deve ter quota por utilidade, orçamento, cache, persistência, logs sanitizados, fallback e kill switch. Nenhuma IA pode criar, alterar ou substituir aviso oficial.

Documento: `docs/weather-ai-snapshots.md`.

## 16. Segurança e runtime

Ativo:

- secrets somente server-side quando aplicável;
- gate geográfico de visitantes em hosts de produção;
- CSP global com allowlist explícita;
- guards de método/tamanho para rotas sensíveis;
- rate limiting distribuído para conta/push;
- RLS no Supabase externo;
- proxy/allowlist para integrações externas;
- logs sanitizados;
- resposta geográfica bloqueada autocontida e `noindex`.

Um WAF gerenciado de edge/provedor não está configurado e não deve ser confundido com o firewall em camada de aplicação.

## 17. GitHub Actions e árvore de rotas

O workflow `Qualidade` deveria executar, entre outros gates:

1. template de ambiente;
2. `test:contracts`;
3. testes especializados, incluindo teclado/foco do header e a câmera ao vivo diferida da Home;
4. `routes:check`;
5. build;
6. relatório de peso dos assets do build;
7. testes de rotas;
8. TypeScript;
9. lint incremental;
10. preview local do build;
11. Browser Quality Smoke com relatório de acessibilidade, responsividade e Web Vitals de laboratório.

Estado em 26/08/2026: os runs recentes continuam terminando antes de qualquer step, com `runner_id=0` e `steps=[]`. Isso é falha de infraestrutura/execução do Actions e não evidencia resultado dos testes do código. Os gates de navegador e de peso do build foram versionados em 27/08/2026, mas **não devem ser descritos como executados ou aprovados** enquanto esse bloqueio persistir.

Em 27/08/2026, `src/routeTree.gen.ts` foi regenerado de acordo com `scripts/generate-route-tree.mjs` para incorporar `/nivel-do-guaiba` e `/enchente-1941-pelotas`. A reprodução determinística do estado anterior gerou exatamente o mesmo blob SHA já versionado antes da alteração, confirmando equivalência com o gerador oficial; a nova saída foi então versionada sem alterar o script. A dívida de árvore desatualizada foi removida no código, embora `routes:check` ainda precise ser executado em um runner funcional para confirmação executável.

`tests/standalone-route-shell.test.ts` protege o contrato de composição: qualquer módulo de rota que renderize `InternalWeatherPageShell` ou `ContentPageShell` deve constar no conjunto standalone de `SiteLayout`, evitando dois headers, dois footers e dois elementos `main` na mesma página.

`tests/seo-content-accessibility.test.ts`, já incluído em `test:contracts`, protege a separação de intenção `agora` x `hoje`, a resposta editorial `Vai chover hoje em Pelotas?`, o caveat de `tempo real` no Laranjal e ligações do cluster hidrológico/histórico.

`tests/seo-editorial-enrichment.test.ts`, também incluído em `test:contracts`, protege Home/Hoje, Chuva, Amanhã, 7/15 dias, Vento, Radar, Meteograma, Clima, Histórico, Alertas, Geadas, o cluster Laranjal/Guaíba/1941/2024 e a existência de perfis regionais específicos, sem exigir FAQ genérico. O contrato verifica, entre outros pontos, 10/15 dias na mesma URL, observado x previsto no vento, imagem recente x tempo real no radar, Meteograma 48h x Hoje, Clima/Climatologia x histórico recente, geada observada x previsão futura, ausência de `<main>` duplicado em Privacidade, schema do Status dos Dados e entidades do hub regional. `tests/regional-city-editorial.test.ts` reforça o gate anti-template e impede que `FAQPage` genérico volte a ser renderizado em todas as cidades.

`tests/header-keyboard-accessibility.test.ts` protege o contrato ARIA dos menus e a restauração de foco ao fechar um painel com `Escape`.

`tests/home-live-camera-hero.test.ts` protege a cadeia progressiva da câmera do Laranjal: descoberta de câmera em idle, ausência da câmera no SSR, validação de transmissão HTTPS/live, player decorativo em idle/lazy, supressão em Save-Data/2G/offline/reduced-motion e manutenção do link editorial para a página de câmeras.

`tests/analytics-communication-runtime.test.ts` protege analytics e comunicação: a fila `dataLayer/gtag` permanece disponível desde o SSR, pageviews SPA continuam explícitos, o download externo do GA4 é diferido para idle com fallback e as flags de privacidade/publicidade continuam desativadas. O mesmo contrato mantém Web Push fora do root enquanto suspenso e o MOBI Ticket global diferido.

`tests/pwa-app-refinement.test.ts` protege que o PWA continue montado com manifest e metadados móveis, preserve registro de `/sw.js`, escopo `/` e `updateViaCache: "none"`, mas só inicie o registro do service worker depois de `window.load` e período ocioso do navegador. O teste também preserva a política de navegação live network-first e a separação entre PWA e Web Push.

`scripts/browser-quality-smoke.mjs` é o gate de navegador atual e não depende de Playwright. Ele usa Chrome/Chromium via Chrome DevTools Protocol e cobre inicialmente nove rotas representativas em 320×720, 768×1024 e 1280×900. O gate bloqueia regressões estruturais como idioma/title ausentes, quantidade incorreta de H1 ou `<main>`, skip link invisível ao foco, IDs duplicados, controles sem nome, campos sem rótulo, imagens sem `alt`, overflow horizontal e falha de fechamento/restauração de foco no menu. Ele registra TTFB, FCP, LCP e CLS como **métricas de laboratório**. Nesta etapa, os limiares recomendados de performance geram avisos por padrão; não devem ser apresentados como CrUX ou Core Web Vitals de campo.

`scripts/build-asset-report.mjs` mede os arquivos públicos gerados pelo build, separa JavaScript/CSS/imagens/fontes/outros, calcula gzip para JS/CSS e lista os maiores arquivos. Não há budget rígido antes do primeiro baseline. O workflow prevê salvar `artifacts/build-assets` e `artifacts/browser-quality` no artifact `quality-reports-*` para inspeção.

O nome histórico `scripts/accessibility-editorial-smoke.mjs` permanece como alias para o Browser Quality Smoke, evitando duas implementações divergentes e eliminando a dependência não declarada de Playwright que existia no script antigo.

Esses contratos estão versionados, mas não devem ser descritos como executados enquanto os runners permanecerem indisponíveis.

## 18. Deploy e Supabase

Disciplina atual:

- `main` é a branch operacional;
- commits na branch conectada sincronizam com Lovable;
- não usar force-push/rebase destrutivo em histórico publicado;
- Supabase é externo ao Lovable;
- migrations versionadas devem ser aplicadas e validadas separadamente no ambiente oficial;
- nunca declarar migration aplicada apenas porque o código foi publicado;
- alterações de banco exigem revisão de RLS/grants e validação do schema real.

As implementações de 15 dias, Guaíba e da página histórica de 1941 não exigem migration, Edge Function ou nova variável de ambiente. As rodadas posteriores de refinamento SEO também não criaram nova URL, fonte, coletor, migration, Edge Function, secret ou variável de ambiente. A correção semântica de Privacidade e os enriquecimentos de Status/hub regional também não alteram runtime de dados ou autenticação.

A fase de qualidade adicionou contratos de frontend/CI/documentação, adiou o JavaScript externo do MOBI Ticket e do GA4 para período ocioso do navegador, retirou Web Push do root enquanto suspenso, adiou o registro do service worker para depois de `load + idle` e tornou a câmera visual da Home totalmente progressiva: descoberta em idle e player em idle/lazy com supressão em condições de economia de dados/conectividade/reduced-motion. No GA4, o bootstrap `dataLayer/gtag`, a medição explícita de pageviews SPA, o ID e as flags de privacidade permanecem preservados. Essas mudanças não alteram fonte meteorológica/hidrológica, banco ou autenticação.

## 19. PWA / Web Push

O PWA de instalação/atualização permanece ativo tecnicamente: `PwaManager` continua registrando `/sw.js`, mas o registro agora só é iniciado depois de `window.load` e período ocioso do navegador, evitando disputar o primeiro render. O manifest permanece no head, os listeners de instalação/atualização continuam ativos desde a hidratação e `PwaAppExperience` mantém comportamento de standalone/conectividade. A política network-first das páginas vivas e a tela offline informativa permanecem inalteradas. Isso não transforma dados antigos em condições meteorológicas atuais.

Web Push permanece suspenso. `PushNotificationsManager.tsx` e as APIs de configuração/inscrição são preservados, mas o manager não é montado em `src/routes/__root.tsx`; portanto o runtime público não solicita `/api/push/config` nem apresenta o launcher de notificações enquanto essa função não for reativada de forma controlada.

Reativação de Web Push depende de teste real de service worker, subscribe/unsubscribe, permissões, rolagem, Chrome normal/anônimo/mobile e ausência de regressões de UI.

## 20. Pesquisa futura CPTEC / SIGMA

A pesquisa técnica existe em `docs/CPTEC_SIGMA_RESEARCH.md`, mas permanece fora do runtime público até nova revisão. Não criar dependência pública de WMS/produtos SIGMA nesta fase.

## 21. Pendências prioritárias

Pendências reais, não funcionalidades declaradas como prontas:

1. restaurar os runners do GitHub Actions e executar a suíte completa, incluindo `routes:check`, relatório de assets e Browser Quality Smoke sobre o build de produção;
2. validar `/previsao-15-dias-pelotas`, `/nivel-do-guaiba` e `/enchente-1941-pelotas` no domínio publicado, inclusive mobile, estados degradados aplicáveis, sitemap e canonical;
3. recapturar Search Console para medir CTR da Home, Hoje, Amanhã, Chuva, 7 dias, 15 dias, Vento, Radar, Meteograma, Alertas, Geadas, Clima e Histórico, acompanhar o cluster hidrológico, priorizar refinamentos quantitativos por município e decidir sexta/sábado;
4. concluir E2E de autenticação com duas contas descartáveis;
5. auditar cobertura/gaps do Historical Data Layer e continuar backfills seguros;
6. definir rollups e APIs históricas server-side;
7. continuar validação ANA/RHN e inventário/semântica da Defesa Civil RS;
8. validar os smokes de segurança, CSP, gate geográfico e rate limiting no ambiente real;
9. executar os baselines de peso/navegador já versionados, concluir auditoria manual WCAG 2.2 AA, responsividade ampla/zoom-reflow e obter medição confiável de Core Web Vitals de campo antes de endurecer thresholds de performance;
10. manter Web Push suspenso até validação controlada; preservar PWA ativo sem esconder dados meteorológicos atuais atrás de cache;
11. avançar páginas por dia da semana somente com intenção/dado suficiente e sem doorway pages;
12. criar previsão de 30 dias somente quando existir camada de tendência adequada para dias 16–30;
13. manter GeoInfo Embrapa em trilha própria de descoberta/licenciamento antes de uso público/comercial;
14. retomar CPTEC/SIGMA apenas na janela de revisão planejada.

## 22. Documentos especializados principais

| Documento | Finalidade |
| --- | --- |
| `MIGRATION_MATRIX.md` | Migração, paridade e pendências históricas |
| `WEATHER_PAGE_IDENTITY.md` | Identidade e consistência visual das páginas meteorológicas |
| `docs/PUBLIC_ROUTE_RESILIENCE.md` | Fallbacks e orçamento de latência das rotas públicas |
| `docs/REDEMET_OPERATIONS.md` | Operação REDEMET |
| `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md` | Rede hidrometeorológica Defesa Civil RS |
| `docs/ANA_RHN_INTEGRATION.md` | ANA/RHN e gates de estação |
| `docs/HISTORICAL_DATA_INVENTORY.md` | Histórico, governança e coletores |
| `docs/FLOOD_1941_RESEARCH_2026-08-27.md` | Base documental e limites editoriais da enchente de 1941 |
| `docs/SEO_GSC_BASELINE_2026-08-16.md` | Baseline Search Console |
| `docs/SEO_SEARCH_INTENT_PLAN_2026-08-26.md` | Arquitetura de intenção SEO |
| `docs/SEO_TRENDS_EVIDENCE_2026-08-26.md` | Evidência sanitizada do Trends |
| `docs/SEO_CONTENT_SOURCE_IMPLEMENTATION_PLAN_2026-08-26.md` | Intenção x fonte x etapas |
| `docs/SEO_REFINEMENT_ENRICHMENT_2026-08-27.md` | Refinamento de snippets, links internos, entidades e perfis regionais sem FAQ genérico nem novas URLs |
| `docs/QUALITY_A11Y_CWV_2026-08-27.md` | Baseline de acessibilidade, responsividade, peso do build e Web Vitals de laboratório |
| `docs/FORECAST_15_DAY_IMPLEMENTATION_2026-08-26.md` | Implementação da previsão de 15 dias |
| `docs/EMBRAPA_GEOINFO_DATASET_SURVEY_2026-08-26.md` | Levantamento GeoInfo Embrapa |
| `docs/DATA_ACCESS_PUBLIC_FREE_PRO_PLAN.md` | Política Público/Free/PRO/REVIEW |
| `docs/ACCOUNT_AND_PRO_ARCHITECTURE.md` | Arquitetura de conta e PRO |
| `docs/auth-account.md` | Autenticação e direitos do titular |
| `docs/weather-ai-snapshots.md` | Weather AI persistido |
| `docs/CPTEC_SIGMA_RESEARCH.md` | Pesquisa futura CPTEC/SIGMA |
| `docs/PRODUCTION_CUTOVER.md` | Runbook de produção |
| `docs/RUNTIME_READINESS.md` | Preflight do runtime |
| `docs/NAVIGATION_RUNTIME_RECOVERY_2026-08-27.md` | Coerência de HTML, service worker, chunks e recuperação de navegação entre deploys |

## 23. Regra de manutenção

Uma pessoa deve conseguir abrir este arquivo e responder rapidamente:

- quais páginas existem;
- de onde vêm os dados;
- o que é observação, previsão e alerta;
- quais integrações estão ativas;
- como o produto opera;
- o que está parcial ou suspenso;
- quais pendências impedem declarar determinada camada como concluída.

Quando o detalhe ultrapassar esse nível, ele deve permanecer no documento especializado correspondente e ser apenas referenciado aqui.

## 24. Correções visuais identificadas no domínio publicado

Em 27/08/2026, screenshots do domínio público evidenciaram três regressões de apresentação, todas corrigidas no código sem alterar contratos de dados:

- a grade de sete horas da Home passa a ficar contida no frame a partir de `880px`, deixando a rolagem horizontal para viewports mais estreitos;
- o estado de camada REDEMET indisponível na Home deixa de herdar simultaneamente `top/bottom` e texto claro do mapa-base, passando a ser um card compacto e legível sobre o mapa;
- o aviso municipal do INMET passa a possuir layout autocontido nas páginas regionais, sem depender de regras `home-inmet-alerts` escopadas ao shell da Home, eliminando concatenação visual de rótulos, valores e ações.

`tests/screenshot-layout-regressions.test.ts`, incluído em `test:contracts`, protege esses três contratos. Nenhuma rota, sitemap, fonte meteorológica/hidrológica, regra de severidade do alerta, coletor, banco ou autenticação foi modificada.

A correção está versionada, mas a validação visual pós-deploy ainda deve ser feita no domínio publicado e o CI continua sem ser considerado aprovado enquanto o runner não executar os steps normalmente.

## 25. Resiliência de fontes após a revisão de produção

A mesma revisão de 27/08/2026 mostrou que parte dos estados degradados não era apenas visual. A política de fontes foi fortalecida sem trocar a natureza dos dados apresentados.

Na previsão municipal oficial do INMET, `src/lib/weather/inmet-forecast-resilient.server.ts` passa a priorizar a rota municipal atual observada para o código IBGE de Pelotas e mantém a rota histórica já usada pelo projeto como contingência. A segunda tentativa entra de forma escalonada após 450 ms ou imediatamente quando a primeira falha. O deadline global do agregado oficial permanece em **1,9 s**, evitando transformar a contingência em regressão de TTFB. Se as duas rotas falharem, o estado continua `unavailable`; nenhum outro provedor é apresentado como previsão oficial do INMET.

No satélite, `src/lib/redemet/redemet-satellite-resilient.server.ts` preserva REDEMET/DECEA como primeira escolha para Realçado e Infravermelho. Se essa camada não estiver utilizável dentro do orçamento, GOES/INMET pode assumir como contingência oficial, com `provider`, produto e `sourceLabel` identificando explicitamente a origem real. O canal **Visível não recebe fallback infravermelho**, porque isso mudaria a semântica do produto escolhido. Quando as duas fontes falham, o estado degradado permanece visível e conserva o diagnóstico.

A Home também passou a apresentar o bloco como “Monitoramento meteorológico”, declarar `REDEMET / DECEA + INMET` como fontes e descrever as imagens como observações recentes atualizadas conforme disponibilidade, em vez de generalizar todo o bloco como “tempo real”.

`tests/source-resilience-regressions.test.ts`, incluído em `test:contracts`, protege prioridade/fallback do INMET, deadline, preferência REDEMET, contingência GOES/INMET e a proibição de substituir Visível por infravermelho. O documento especializado é `docs/SOURCE_RESILIENCE_INMET_REDEMET_2026-08-27.md`.

Esta rodada não adiciona rota pública, migration, Edge Function, secret ou variável de ambiente. A validação de produção e a execução da suíte permanecem pendentes enquanto o runner do GitHub Actions não voltar a executar normalmente.

## 26. Coerência de navegação e cache entre deploys

Em 27/08/2026, relatos de usuários e captura do domínio publicado mostraram ocorrências recorrentes do boundary global e mensagens de conteúdo não encontrado durante a navegação entre páginas. A investigação tratou o problema como incoerência de versão entre HTML, runtime cliente, chunks lazy e server functions, e não como falha isolada da página de Vento.

O runtime público agora possui três barreiras complementares:

- documentos HTML SSR, fora de embeds, recebem `Cache-Control: no-store, no-cache, max-age=0, must-revalidate`, `CDN-Cache-Control: no-store`, `Pragma: no-cache` e `Expires: 0`, evitando que HTML de uma publicação antiga continue apontando para assets de outra;
- `public/sw.js` passou para a geração `tempo-pelotas-v9`, usa `skipWaiting()` e `clients.claim()`, preserva a geração atual e uma geração anterior do próprio Tempo Pelotas durante a transição, mantém assets com hash reutilizáveis entre essas gerações, força navegação de documento com `cache: no-store` e recarrega abas antigas quando um worker novo assume;
- se um asset versionado solicitado por uma aba antiga não estiver em cache e responder `404` ou `410`, o worker navega novamente o próprio cliente, com trava por `clientId` para não repetir a recuperação na mesma execução.

A limpeza do service worker ficou restrita a chaves com prefixo do Tempo Pelotas; caches pertencentes a outras camadas não devem ser eliminados por essa rotina. Arquivos em `/brand/`, que não têm a mesma garantia de hash dos bundles, continuam usando revalidação de rede em vez do cache-first entre gerações.

No React/TanStack, `src/lib/stale-client-recovery.ts` continua como segunda linha de recuperação para erros de chunk, preload, fetch e server functions, com uma recarga protegida por URL/janela e sem loop. `/vento-em-pelotas` e `/chuva-em-pelotas` usam `src/lib/weather/public-weather-page-loader.ts` com `Promise.allSettled`, de modo que uma falha de transporte de uma das consultas não promove automaticamente toda a rota ao boundary global.

`tests/service-worker-static-cache.test.ts`, `tests/pwa-app-refinement.test.ts` e `tests/public-route-resilience.test.ts` protegem os contratos correspondentes. A build conectada do Lovable foi reconstruída após as alterações e uma nova publicação foi disparada, mas a propagação final no domínio canônico e a execução do GitHub Actions ainda precisam ser confirmadas separadamente; os runners continuam sem ser considerados aprovados enquanto não executarem os steps.

Documento especializado: `docs/NAVIGATION_RUNTIME_RECOVERY_2026-08-27.md`.

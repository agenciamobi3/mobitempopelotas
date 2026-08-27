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
| Câmeras | Ativo com dependência externa | Live/replay com estados explícitos |
| Central Regional | Ativo | 24 cidades no inventário: Pelotas + 23 páginas municipais |
| SEO técnico | Ativo | Canonical, sitemap, robots, OG/Twitter, Schema.org e links internos globais |
| Conta / login Google | Parcial operacional | Fundação implementada; E2E real com duas contas ainda pendente |
| Free / PRO | Fundação pronta | Entitlements existem; billing comercial ainda não existe |
| Weather AI | Ativo controlado | Snapshot server-side, orçamento e fallback determinístico |
| Gate geográfico / CSP / rate limit | Ativo | Segurança em camada de aplicação; smoke real ainda deve ser confirmado |
| PWA / Web Push | Suspenso | Código preservado; reativação depende de validação controlada |
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
- `npm run runtime:check`;
- `npm run cutover:smoke`.

GitHub `main` permanece a fonte de versionamento. Lovable não substitui o Supabase externo e não deve ser usado para provisionar banco paralelo.

Rotas que renderizam `InternalWeatherPageShell` ou `ContentPageShell` são tratadas como standalone em `SiteLayout`, evitando um segundo header/footer global. Em 27/08/2026 esse contrato foi corrigido para incluir 15 dias, Guaíba, Enchente de 1941 e Quem Somos e passou a ter teste automático que varre as rotas com shell próprio.

## 4. Rotas públicas indexáveis

`src/lib/public-routes.ts` é a fonte programática do sitemap.

Inventário após a publicação da página histórica de 1941: **48 URLs indexáveis**, sendo **25 rotas fixas** e **23 páginas municipais**. Pelotas usa a Home como página regional principal.

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

A nova página atende as intenções de 10 e 15 dias na mesma URL. Não existe página separada de 10 dias.

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

## 8. REDEMET e monitoramento visual

Integração server-side com `REDEMET_API_KEY` somente no servidor.

Ativo:

- radar, com Santiago como estação preferencial e Canguçu como fallback quando houver imagem válida;
- satélite realçada, infravermelho e visível;
- STSC/trovoadas com filtro regional e distância aproximada até Pelotas;
- proxy controlado para imagens externas;
- allowlists e HTTPS obrigatório.

Radar, satélite e STSC são monitoramento/observação visual. STSC não é alerta oficial e distância não representa intensidade ou trajetória.

Documento: `docs/REDEMET_OPERATIONS.md`.

## 9. Hidrologia

### Laranjal / Lagoa dos Patos

A Estação Laranjal é a referência operacional local apresentada para Pelotas. O portal preserva nível, horário, idade da leitura, tendência e variações recentes sem converter leitura atrasada em valor atual.

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

O diretório global do rodapé passou a apontar diretamente para `/nivel-do-guaiba`, conectando a página operacional ao cluster Laranjal → situação das águas → Guaíba.

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

A rota `/historico-climatico-pelotas` apresenta janela pública recente sem chamar 30 dias recentes de “normal climatológica”. A rota `/enchente-2024-pelotas-laranjal` preserva o registro histórico de 2024.

A rota `/enchente-1941-pelotas` foi implementada em 27/08/2026 após pesquisa documental própria. Ela usa o acervo Nelson Nobre Magalhães preservado pela UCPel, trabalho de pesquisadores da UFPel e registros oficiais da Prefeitura para explicar a referência histórica de 2,88 m associada ao Canal São Gonçalo, a documentação fotográfica da duração da cheia e a comparação controlada com 2024. A página não trata 2,88 m como cota da Estação Laranjal nem transfere a referência para outras réguas.

As páginas de 1941 e 2024 possuem links recíprocos e ambas foram incluídas no diretório global “Águas” do rodapé, formando uma sequência histórica rastreável junto das páginas operacionais atuais.

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

As páginas regionais usam Open-Meteo por coordenada própria e alertas INMET pelo código municipal. Rio Grande, Canguçu, Dom Pedrito, Jaguarão e Capão do Leão possuem camada editorial local reforçada.

Documento de gate: `docs/REGIONAL_CITY_PUBLICATION_GATE.md`.

## 13. SEO e pesquisa de intenção

Arquitetura atual por horizonte:

- agora: Home;
- hoje/por hora: `/tempo-hoje-pelotas`;
- amanhã: `/tempo-amanha-pelotas`;
- 7 dias: `/previsao-7-dias-pelotas`;
- 10/15 dias: `/previsao-15-dias-pelotas`;
- 20/30 dias: ainda não publicado.

Princípio: não criar URLs quase duplicadas apenas para trocar número, dia ou palavra-chave. A intenção deve ter utilidade, fonte e contrato próprios.

Os levantamentos do Google Trends de 26/08/2026 estão documentados sem HAR bruto no repositório. A evidência reforçou 15 dias, hidrologia/enchente, Guaíba, sexta/sábado e consultas regionais.

Em 27/08/2026, `/nivel-do-guaiba` avançou como URL operacional com contrato de dados já existente e utilidade hidrológica distinta. Na sequência, `/enchente-1941-pelotas` passou pelo gate documental e foi publicada como ativo histórico: a canonical não inclui `Laranjal` porque a base forte levantada sustenta Pelotas, Praça do Porto e Canal São Gonçalo, sem ampliar territorialmente o fato histórico além das fontes.

A rodada seguinte reforçou links internos globais sem abrir novas URLs: o rodapé passa a expor `/previsao-15-dias-pelotas`, `/nivel-do-guaiba`, `/enchente-1941-pelotas` e `/enchente-2024-pelotas-laranjal`. A navegação contextual das páginas históricas também permanece recíproca.

As páginas permanentes de sexta/sábado continuam condicionadas ao gate de intenção e Search Console; não devem ser publicadas apenas com o sinal isolado do Trends.

Documentos:

- `docs/SEO_GSC_BASELINE_2026-08-16.md`;
- `docs/SEO_SEARCH_INTENT_PLAN_2026-08-26.md`;
- `docs/SEO_TRENDS_EVIDENCE_2026-08-26.md`;
- `docs/SEO_CONTENT_SOURCE_IMPLEMENTATION_PLAN_2026-08-26.md`;
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
3. testes especializados;
4. `routes:check`;
5. build;
6. testes de rotas;
7. TypeScript;
8. lint incremental.

Estado em 26/08/2026: os runs recentes continuam terminando antes de qualquer step, com `runner_id=0` e `steps=[]`. Isso é falha de infraestrutura/execução do Actions e não evidencia resultado dos testes do código.

Em 27/08/2026, `src/routeTree.gen.ts` foi regenerado de acordo com `scripts/generate-route-tree.mjs` para incorporar `/nivel-do-guaiba` e `/enchente-1941-pelotas`. A reprodução determinística do estado anterior gerou exatamente o mesmo blob SHA já versionado antes da alteração, confirmando equivalência com o gerador oficial; a nova saída foi então versionada sem alterar o script. A dívida de árvore desatualizada foi removida no código, embora `routes:check` ainda precise ser executado em um runner funcional para confirmação executável.

`tests/standalone-route-shell.test.ts` passa a proteger o contrato de composição: qualquer módulo de rota que renderize `InternalWeatherPageShell` ou `ContentPageShell` deve constar no conjunto standalone de `SiteLayout`, evitando dois headers, dois footers e dois elementos `main` na mesma página.

## 18. Deploy e Supabase

Disciplina atual:

- `main` é a branch operacional;
- commits na branch conectada sincronizam com Lovable;
- não usar force-push/rebase destrutivo em histórico publicado;
- Supabase é externo ao Lovable;
- migrations versionadas devem ser aplicadas e validadas separadamente no ambiente oficial;
- nunca declarar migration aplicada apenas porque o código foi publicado;
- alterações de banco exigem revisão de RLS/grants e validação do schema real.

As implementações de 15 dias, Guaíba e da página histórica de 1941 não exigem migration, Edge Function ou nova variável de ambiente.

## 19. PWA / Web Push

Código preservado, ativação pública suspensa. Reativação depende de teste real de service worker, subscribe/unsubscribe, permissões, rolagem, Chrome normal/anônimo/mobile e ausência de regressões de UI.

## 20. Pesquisa futura CPTEC / SIGMA

A pesquisa técnica existe em `docs/CPTEC_SIGMA_RESEARCH.md`, mas permanece fora do runtime público até nova revisão. Não criar dependência pública de WMS/produtos SIGMA nesta fase.

## 21. Pendências prioritárias

Pendências reais, não funcionalidades declaradas como prontas:

1. restaurar os runners do GitHub Actions e executar a suíte completa, incluindo `routes:check` sobre a árvore já regenerada;
2. validar `/previsao-15-dias-pelotas`, `/nivel-do-guaiba` e `/enchente-1941-pelotas` no domínio publicado, inclusive mobile, estados degradados aplicáveis, sitemap e canonical;
3. concluir E2E de autenticação com duas contas descartáveis;
4. auditar cobertura/gaps do Historical Data Layer e continuar backfills seguros;
5. definir rollups e APIs históricas server-side;
6. continuar validação ANA/RHN e inventário/semântica da Defesa Civil RS;
7. validar os smokes de segurança, CSP, gate geográfico e rate limiting no ambiente real;
8. concluir auditoria WCAG 2.2 AA, Core Web Vitals e responsividade ampla;
9. manter PWA/Web Push suspenso até validação controlada;
10. avançar páginas por dia da semana somente com intenção/dado suficiente e sem doorway pages;
11. criar previsão de 30 dias somente quando existir camada de tendência adequada para dias 16–30;
12. manter GeoInfo Embrapa em trilha própria de descoberta/licenciamento antes de uso público/comercial;
13. retomar CPTEC/SIGMA apenas na janela de revisão planejada.

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
| `docs/FORECAST_15_DAY_IMPLEMENTATION_2026-08-26.md` | Implementação da previsão de 15 dias |
| `docs/EMBRAPA_GEOINFO_DATASET_SURVEY_2026-08-26.md` | Levantamento GeoInfo Embrapa |
| `docs/DATA_ACCESS_PUBLIC_FREE_PRO_PLAN.md` | Política Público/Free/PRO/REVIEW |
| `docs/ACCOUNT_AND_PRO_ARCHITECTURE.md` | Arquitetura de conta e PRO |
| `docs/auth-account.md` | Autenticação e direitos do titular |
| `docs/weather-ai-snapshots.md` | Weather AI persistido |
| `docs/CPTEC_SIGMA_RESEARCH.md` | Pesquisa futura CPTEC/SIGMA |
| `docs/PRODUCTION_CUTOVER.md` | Runbook de produção |
| `docs/RUNTIME_READINESS.md` | Preflight do runtime |

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
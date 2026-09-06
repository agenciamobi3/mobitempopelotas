# Tempo Pelotas — estado atual do projeto

Última atualização: 05/09/2026  
Branch operacional: `main`  
Domínio canônico e único de produção: `https://tempopelotas.com.br`

## 1. Fonte de verdade e regras permanentes

Este arquivo descreve o estado operacional atual. Evidências e histórico detalhado ficam nos documentos especializados em `docs/`; código ativo, migrations aplicadas e runtime publicado prevalecem sobre documentação antiga.

Regras permanentes:

- não versionar secrets, cookies, HARs, URLs autenticadas ou tokens;
- observação, previsão, alerta oficial, reanálise e dado derivado permanecem semanticamente separados;
- indisponibilidade nunca vira zero, normalidade ou diagnóstico automático;
- timeout, HTTP 403, falha de parsing ou bloqueio de integração não provam indisponibilidade global da fonte pública;
- dados correntes usam `no-store/no-cache`; last-good conserva timestamp e idade reais;
- uma régua/cota não é convertida para outra referência sem metadados suficientes;
- navegabilidade pública prevalece sobre disponibilidade instantânea de integrações externas;
- fonte tecnicamente disponível não é automaticamente habilitada se o produto já possui cobertura suficiente;
- diagnóstico técnico pode permanecer em logs/contratos internos, mas não deve ser exposto como copy pública;
- `main` é operacional e histórico publicado não é reescrito.

## 2. Estado executivo

| Domínio | Estado atual |
| --- | --- |
| Portal público | Produção ativa em `tempopelotas.com.br`; Lovable sincroniza a `main` e publica o frontend |
| Runtime marker | `/api/runtime-version` permanece estático e `no-store/noindex`; validar cortes novos também por SHA/deployment quando disponível |
| Home / Hoje / Amanhã / 7 dias | Shell-first + recuperação meteorológica após hidratação nas superfícies que usam esse contrato |
| Página hidrológica | `/situacao-hidrologica-pelotas` estabilizada; usa snapshot resiliente do loader e fontes regionais isoladas |
| Mapas hidrológicos | SACE e Defesa Civil carregam automaticamente, com boundary local e callbacks MapLibre contidos |
| Defesa Civil RS | Payload live normalizado; formatação de cartões não pode lançar por casas decimais; capacidade oficial define se um campo é exibido como nível |
| Open-Meteo | Principal; contingência/last-good preserva estado e timestamp sem mascarar falha |
| MET Norway | Contingência compartilhada quando aplicável |
| Embrapa | Observação local centralizada |
| INMET meteorológico | Avisos/previsão integrados com semântica oficial preservada |
| Radar / satélite / STSC | Probes independentes e copy pública sanitizada |
| Hidrologia | Laranjal, Guaíba, Lagoa dos Patos, SACE e Defesa Civil degradam independentemente |
| Localidades da Lagoa | Hub `/nivel-da-lagoa-dos-patos` + páginas próprias verificadas para Rio Grande, São Lourenço do Sul, Arambaré, São José do Norte e Itapuã/Viamão |
| Meteorologia + hidrologia regional | Rio Grande, São Lourenço do Sul e São José do Norte preservam a página meteorológica e recebem módulo de águas independente com link para a página hidrológica |
| ANA / SNIRH / RHN | Readiness/cross-check somente, sem terceira ingestão do Laranjal nesta fase |
| Historical Data Layer | Ativo; classes `observation`, `forecast`, `reanalysis`, `derived` separadas |
| Monitor de status | Supabase `pg_cron` + `pg_net`, a cada 10 min; 14 serviços |
| Widget Builder | Fundação V1 publicada; conta cria e gerencia widgets responsivos por token público |
| Central Regional | Pelotas + 23 páginas municipais indexáveis |
| SEO técnico | **58 URLs indexáveis = 35 fixas + 23 municipais** no inventário da `main`, com canonical/sitemap/robots/Schema/BreadcrumbList |
| Arquivo de enchentes | Hub `/historia-das-enchentes-pelotas` + páginas dedicadas para **1941, 2001, 2015 e 2024** |
| 2001 | Página pública marcada como **pesquisa em andamento**; lacunas permanecem explícitas |
| 2015 | Diário documental com medições por data/horário, inventário dos boletins, fontes municipais e imprensa contemporânea complementar |
| Colaboração histórica | Fluxo autenticado e moderado para fontes, fotos, documentos, relatos, medições e correções |
| Consentimento do acervo | Compartilhar para análise é obrigatório; autorização de reprodução pública é **separada e opcional** |
| Conta / Google | Fundação operacional parcial; E2E completo com contas descartáveis ainda pendente |
| Service Worker / Web Push | Suspensos até estabilidade sustentada |
| GitHub Actions | **Bloqueado antes dos steps**; não declarar suíte/build/typecheck executados quando o job vier sem steps |

## 3. Stack e budgets públicos

Stack: React 19, TypeScript 5.8, TanStack Start/Router, Vite 8, Nitro, Tailwind CSS 4, Supabase JS/SSR, MapLibre GL, Recharts e Zod. Lovable sincroniza/publica o repositório; o Supabase oficial é externo ao Lovable.

Budgets atuais:

- Home/Hoje/Amanhã/7 dias: nenhuma fonte externa no loader inicial quando em modo shell-first;
- inteligência meteorológica compartilhada após hidratação: teto interno de 5 s;
- loaders meteorológicos secundários: 2,5 s por dependência;
- loaders hidrológicos dedicados: 2,5 s por dependência;
- Radar: 2,8 s;
- previsão de 15 dias: 2,8 s.

O shell-first existe para manter o documento navegável. Ele não pode significar “entregar objeto indisponível e nunca recuperar o dado real”.

## 4. Estabilidade pública e hidrologia

### 4.1 Regressões de 30/08

A rodada de 30/08 corrigiu regressões em recuperação meteorológica, Home hidrológica, copy pública de diagnósticos REDEMET e comportamento do boundary global. Exceção real de runtime não deve ser mascarada como “versão mais recente”.

### 4.2 Página `/situacao-hidrologica-pelotas` — causa raiz de 05/09

A falha intermitente que derrubava a página foi isolada com HAR real do domínio canônico.

O HAR mostrou:

- documento e chunks da rota com HTTP 200;
- SACE e Defesa Civil respondendo em estado live;
- crash antes do carregamento do chunk MapLibre.

Causa raiz confirmada em `DefesaCivilHydroNetwork.tsx`: um cartão chamava `formatNumber(distanceFromPelotasKm, 0)` para distância decimal. A implementação podia produzir `maximumFractionDigits=0` com `minimumFractionDigits=1`, combinação inválida para `Intl.NumberFormat`, lançando `RangeError` durante o render.

Correções permanentes:

- `minimumFractionDigits` nunca pode superar `maximumFractionDigits`;
- número não finito degrada para `—`;
- `station.capabilities.riverLevel` é a autoridade para decidir se uma estação expõe nível;
- valor bruto/sentinela em campo incompatível com a capacidade oficial não promove uma estação meteorológica a hidrológica;
- mapas do SACE e Defesa Civil voltaram a carregar automaticamente, mas permanecem em boundaries locais e callbacks MapLibre contidos;
- uma falha de mapa ou integração regional não deve derrubar a rota inteira.

## 5. Navegação, rotas, SEO e arquivo histórico

`src/lib/public-routes.ts` mantém **58 URLs indexáveis = 35 fixas + 23 municipais**. Nenhuma nova cidade ou estação entra sem publication gate ou associação editorial verificada.

### 5.1 Cluster público da Lagoa dos Patos

O núcleo hidrológico indexável da Lagoa é:

```text
/nivel-da-lagoa-dos-patos
  ├─ /nivel-da-lagoa-dos-patos/rio-grande
  ├─ /nivel-da-lagoa-dos-patos/sao-lourenco-do-sul
  ├─ /nivel-da-lagoa-dos-patos/arambare
  ├─ /nivel-da-lagoa-dos-patos/sao-jose-do-norte
  └─ /nivel-da-lagoa-dos-patos/itapua-viamao
```

Regras do cluster:

- registry canônico: `src/lib/hydrology/hydrology-localities.ts`;
- cada página local nasce de associação verificada com uma estação da Rede de Monitoramento do Nível da Lagoa dos Patos;
- cards da rede regional só recebem link quando `station.id` possui localidade no registry; estação sem mapeamento continua visível sem destino inventado;
- Guaíba permanece no destino canônico `/nivel-do-guaiba` e não ganha páginas duplicadas por régua;
- referências locais, cotas e máximas históricas permanecem ligadas à própria estação e não são convertidas entre cidades;
- o hub `/nivel-da-lagoa-dos-patos` explica que não existe um único “nível da Lagoa” aplicável a todos os pontos.

Integração com meteorologia:

- `/tempo-em/rio-grande-rs`, `/tempo-em/sao-lourenco-do-sul-rs` e `/tempo-em/sao-jose-do-norte-rs` continuam respondendo à intenção meteorológica;
- title/H1 meteorológicos permanecem focados em previsão, chuva e vento;
- um módulo de águas é carregado separadamente e aponta para a página hidrológica própria;
- falha da consulta hidrológica não deve bloquear nem redefinir a previsão meteorológica;
- Arambaré e Itapuã/Viamão possuem páginas hidrológicas sem criar artificialmente páginas meteorológicas nesta rodada.

Descoberta pública do cluster:

- menu `Águas → Agora` inclui “Nível da Lagoa dos Patos”;
- Home `Explore o portal` inclui o panorama da Lagoa;
- rodapé “Águas” inclui o panorama;
- cards da Rede da Lagoa são navegáveis quando a localidade é verificada;
- card do Guaíba aponta para `/nivel-do-guaiba`;
- `src/routeTree.gen.ts` foi reconciliado com o hub e a rota dinâmica local.

A próxima onda da hidrologia regional é a Rede da Defesa Civil RS. Não criar páginas nominais em massa antes de confirmar `estação → município/localidade → rio/bacia → utilidade editorial`. Proximidade geográfica isolada não é critério suficiente.

### 5.2 Arquivo histórico de enchentes

O núcleo histórico público é:

```text
/historia-das-enchentes-pelotas
  ├─ /enchente-1941-pelotas
  ├─ /enchente-2001-pelotas
  ├─ /enchente-2015-pelotas
  └─ /enchente-2024-pelotas-laranjal
```

O hub foi criado para descoberta por estudantes, moradores e pesquisadores. Ele explica como usar fontes, por que cotas de anos diferentes não devem ser comparadas sem estação/régua/datum/referência e por que uma lacuna documental deve permanecer declarada em vez de ser estimada.

Descoberta pública:

- `Águas → Memória e contexto` inclui “História das enchentes” e os quatro anos;
- rodapé “Águas” inclui o hub e os registros individuais;
- cada página histórica possui navegação cruzada e convite à colaboração;
- `/contribuir` é `noindex` e usa a conta gratuita do Tempo Pelotas.

A página de 2001 é pública mesmo com pesquisa aberta. Isso é intencional: conteúdo sustentado por fontes pode ser publicado com lacunas explícitas, sem esperar uma reconstrução impossível de 100% do acervo.

## 6. Arquivo colaborativo de enchentes

Todas as páginas dedicadas de 1941, 2001, 2015 e 2024 usam o componente reutilizável de colaboração.

Fluxo público:

1. o visitante lê o registro;
2. o topo mostra “Enviar uma contribuição”;
3. o fim da página mostra “Ajude a completar esta história” e exemplos de materiais úteis;
4. `/contribuir?pagina=...` preserva o contexto do ano;
5. sem sessão, a pessoa entra pela conta gratuita e retorna ao mesmo formulário;
6. escolhe visualmente o tipo de contribuição: foto, documento, fonte/notícia, depoimento, medição/marca de água, correção ou outro material;
7. a contribuição entra como `pending` e nunca altera automaticamente a página pública.

Governança e privacidade:

- tabela: `public.historical_contributions`;
- bucket privado: `historical-contributions`;
- até 5 anexos por contribuição, máximo 15 MB cada;
- RLS limita leitura/escrita do colaborador aos próprios registros;
- anexos permanecem privados durante revisão;
- exportação e exclusão de conta cobrem contribuições e anexos;
- `rights_confirmed=true` significa que o colaborador pode compartilhar o material para análise;
- `publication_authorized` é opcional e separado;
- sem autorização de publicação, o material pode servir como pista privada de pesquisa, mas o arquivo não deve ser reproduzido publicamente sem nova autorização.

Migrations aplicadas no Supabase oficial:

- `20260905203358_create_historical_contributions`;
- `allow_review_without_publication_consent` em 05/09/2026, removendo a exigência de `publication_authorized=true` para submissão.

## 7. Enchente de 2015 — estado documental

A página `/enchente-2015-pelotas` usa a série municipal “Cheias 2015” como espinha dorsal e imprensa contemporânea apenas como complemento identificado.

Regras editoriais permanentes:

- cada boletim é uma fotografia temporal, não ponto de uma curva inventada;
- valores restatados por boletim posterior permanecem identificados como tal;
- reportagem citando Defesa Civil não é renomeada como boletim municipal;
- `~1.300 famílias` significa total atendido no episódio, não simultaneamente desabrigado;
- a frase jornalística “2,25 m acima do normal” não entra na série calibrada sem metadados compatíveis;
- não comparar diretamente régua/cota de 2015 com 2024 sem estação, datum, zero e referência vertical.

Marcos já incorporados incluem 14/10, auge 18–19/10, leituras de 20, 21, 22, 26, 27 e 28/10, boletim indexado de 29/10, conclusão do dique em 30/10, estabilização em 03/11, limpeza em 05/11 e balanço de 06/11.

Dique emergencial:

- notícia de 25/10: projeto anunciado com aproximadamente **2 km de extensão e 3 m de largura**;
- notícia de 30/10: obra concluída descrita com **1,8 km de comprimento e 3 m de altura**, além de **comporta móvel de 6 m**;
- no fim de 30/10, a Prefeitura registrou que as águas começavam a baixar no Valverde e Novo Valverde;
- as duas descrições são preservadas separadamente, sem tentar transformá-las numa única dimensão.

Boletins ainda sem corpo recuperado: 27/10 às 11h e 19h, 28/10 às 18h e 29/10 às 11h. A existência permanece documentada no índice, sem números inventados.

## 8. Meteorologia e monitor operacional

Open-Meteo é a previsão principal. MET Norway atua como contingência quando aplicável. Embrapa permanece como observação local centralizada. INMET fornece avisos e produtos oficiais conforme contratos específicos.

Radar, STSC, satélite REDEMET e GOES/INMET têm probes independentes. Falha da integração do Tempo Pelotas não deve ser descrita como indisponibilidade global do serviço público.

Erros técnicos detalhados continuam úteis para operação e testes, mas as APIs consumidas pela UI pública devem retornar copy sanitizada.

## 9. Hidrologia e política ANA/RHN

O Laranjal já possui duas fontes de coleta do projeto. Por decisão de produto, ANA/RHN não será adicionada como terceira fonte nesta fase.

Estação ANA/RHN LARANJAL `87955001`:

- parâmetro `Nivel`;
- unidade confirmada `cm`;
- timezone confirmado `America/Sao_Paulo`;
- referência vertical específica continua `unconfirmed`;
- `collection_enabled=false`;
- `publicMeasurementIngestionEnabled=false`;
- `collectionStrategy=readiness-cross-check-only`;
- `ingestionDeferredByProductPolicy=true`;
- `activationRequiresExplicitProductDecision=true`;
- `coveredByExistingSourceCount=2`;
- zero medições ANA/RHN no Historical Data Layer.

Documento especializado: `docs/ANA_RHN_INTEGRATION.md`.

## 10. Historical Data Layer

O arquivo canônico separa `observation`, `forecast`, `reanalysis` e `derived`. Fontes novas entram com governança explícita antes de qualquer ingestão.

O `historical-events-capture` roda pelo `cron.job` 8 a cada 10 minutos. A versão 2 deduplica eventos STSC pela chave `(source_key,event_type,source_record_id)` antes do upsert.

## 11. Widget Builder, conta e embeds

A área autenticada fica em `/widgets` e é descoberta pelo módulo “Gerador de widgets” em `/painel`.

Módulos V1:

- `nivel-laranjal` — nível/tendência do Laranjal;
- `status-tempo-agora` — temperatura observada e condição atual em Pelotas.

Free atualmente:

- acesso/criação habilitados;
- `widgetsMax=null`;
- Laranjal e Tempo Agora habilitados;
- marca Tempo Pelotas mantida;
- sem billing.

`/widgets/embed.js` cria iframe para `/embed/widget?token=...`; o listener valida origem, `contentWindow`, token e tipo da mensagem. `/embed/widget` é `noindex` e não carrega shell público duplicado.

E2E autenticado completo continua pendente.

Documento especializado: `docs/WIDGET_BUILDER_ARCHITECTURE.md`.

## 12. Segurança, runtime e MOBI Ticket

Ativos: secrets server-side, RLS, gate geográfico, CSP, firewall de aplicação, rate limiting distribuído, allowlists/proxies de fontes, logs sanitizados e endpoint de runtime `no-store/noindex`.

O relaxamento de `frame-ancestors` é restrito às superfícies de embed. Páginas normais continuam com política restritiva.

Estado MOBI Ticket:

```text
Tempo consumer source       = ready_for_p1_canary
Tempo production runtime    = unchanged
Core P1 migration           = source_only_not_applied
Core support-widget-config  = source_ready_not_deployed
Core loader v1.1            = source_ready_not_published
```

Documento especializado: `docs/MOBI_TICKET_CORE_INTEGRATION_2026-08-29.md`.

## 13. Testes, CI e deploy

Contratos versionados cobrem meteorologia, navegação, hidrologia, REDEMET, dados históricos, widgets, páginas de enchentes e colaboração comunitária.

Na rodada de 05/09 foram adicionados/atualizados contratos para:

- página histórica de 2001;
- diário documental de 2015 e conclusão do dique em 30/10;
- hub `/historia-das-enchentes-pelotas`;
- navegação do hub em header/footer/sitemap;
- colaboração histórica moderada;
- separação entre consentimento para análise e autorização de reprodução pública;
- resiliência da página hidrológica e cartões live da Defesa Civil;
- mapas SACE/Defesa Civil automáticos com isolamento local;
- registry de cinco localidades verificadas da Lagoa dos Patos;
- hub e páginas hidrológicas locais indexáveis;
- links dos cards regionais apenas para estações mapeadas;
- associação independente entre páginas meteorológicas e páginas hidrológicas de Rio Grande, São Lourenço do Sul e São José do Norte;
- descoberta do panorama da Lagoa no menu Águas e na Home.

`src/routeTree.gen.ts` foi reconciliado com `/nivel-da-lagoa-dos-patos` e `/nivel-da-lagoa-dos-patos/$localitySlug` usando o contrato do gerador versionado. O comando `routes:check` não foi executado nesta rodada por falta de executor funcional.

**Importante:** o GitHub Actions continua apresentando runs que terminam antes de iniciar os steps (`steps: null`). Nessa condição, não declarar testes, build, typecheck, lint, routes check ou browser E2E como executados. Contrato versionado não equivale a suíte executada.

O Lovable pode sincronizar/publicar commits mesmo quando o workflow do GitHub não executa. Publicação deve ser confirmada separadamente do estado de CI.

## 14. Próximas prioridades

1. Fazer smoke no domínio canônico de `/nivel-da-lagoa-dos-patos` e das cinco páginas locais após propagação do deploy.
2. Executar `routes:check`, `tests/hydrology-localities.test.ts`, build e typecheck assim que houver executor funcional.
3. Auditar a fotografia live das estações da Defesa Civil RS e montar uma matriz explícita `estação → município/localidade → rio/bacia → capacidades → página meteorológica existente → elegível ou não a SEO`.
4. Não publicar páginas automáticas da Defesa Civil sem associação editorial verificada; proximidade a uma cidade não basta.
5. Continuar resgate dos corpos perdidos dos boletins de 27–29/10/2015 e registrar qualquer nova leitura apenas quando documentalmente sustentada.
6. Continuar a pesquisa de 2001 em Biblioteca Pública, imprensa local, Prefeitura/Defesa Civil, Sanep, UFPel, Embrapa, FURG, Marinha e acervos particulares.
7. Incorporar galerias documentais de fotos por enchente com autoria, origem, data/local aproximados e situação de autorização.
8. Criar superfície administrativa de moderação das contribuições, sem permitir edição automática do arquivo público.
9. Fazer E2E autenticado do Widget Builder e do fluxo de contribuição com conta descartável.
10. Manter Service Worker/Web Push suspensos até estabilidade sustentada.

## 15. Documentos principais

- `docs/FLOODS_2001_2015_RESEARCH_2026-09-05.md` — base documental das cheias de 2001 e 2015 e limites editoriais;
- `docs/FLOOD_2015_OFFICIAL_BULLETIN_INVENTORY_2026-09-05.md` — inventário de boletins oficiais de 2015 e lacunas de recuperação;
- `docs/HISTORICAL_DATA_INVENTORY.md` — arquivo histórico;
- `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md` — integração e critérios de publicação da Rede da Defesa Civil RS;
- `docs/WIDGET_BUILDER_ARCHITECTURE.md` — gerador de widgets, RLS, embed e evolução por módulos;
- `docs/MOBI_TICKET_CORE_INTEGRATION_2026-08-29.md` — consumidor MOBI Ticket, fallback P0 e canário P1;
- `docs/PUBLIC_ROUTE_RESILIENCE.md` — shell-first e budgets;
- `docs/NAVIGATION_RUNTIME_RECOVERY_2026-08-27.md` — navegação e recuperação;
- `docs/DATA_STATUS_MONITOR_RECOVERY_2026-08-28.md` — scheduler e monitor;
- `docs/ANA_RHN_INTEGRATION.md` — contrato ANA/RHN e política readiness-only;
- `docs/REDEMET_OPERATIONS.md` — REDEMET;
- `docs/SOURCE_RESILIENCE_INMET_REDEMET_2026-08-27.md` — contingências;
- `docs/FORECAST_15_DAY_IMPLEMENTATION_2026-08-26.md` — previsão de 15 dias;
- `docs/SEO_REFINEMENT_ENRICHMENT_2026-08-27.md` — SEO;
- `docs/PRODUCTION_CUTOVER.md` — runbook de produção.

## 16. Regra de manutenção

Este arquivo deve responder rapidamente: o que está publicado, quais fontes alimentam o portal, o que está parcial/suspenso, quais decisões de produto limitam integrações, quais módulos de conta existem, quais regressões foram identificadas e qual é o próximo trabalho real. Histórico detalhado permanece nos documentos especializados.
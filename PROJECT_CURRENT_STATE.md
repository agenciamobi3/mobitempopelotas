# Tempo Pelotas — estado atual do projeto

Última atualização: 06/09/2026  
Branch operacional: `main`  
Domínio canônico e único de produção: `https://tempopelotas.com.br`

## 1. Fonte de verdade e regras permanentes

Este arquivo descreve o estado operacional atual. Evidências, pesquisas e histórico detalhado ficam nos documentos especializados em `docs/`; código ativo, migrations aplicadas e runtime publicado prevalecem sobre documentação antiga.

Regras permanentes:

- não versionar secrets, cookies, HARs, URLs autenticadas, tokens ou headers de sessão;
- observação, previsão, alerta oficial, reanálise e dado derivado permanecem semanticamente separados;
- indisponibilidade nunca vira zero, normalidade ou diagnóstico automático;
- timeout, HTTP 403, falha de parsing ou bloqueio de integração não provam indisponibilidade global da fonte pública;
- dados correntes usam política de cache compatível com sua recência; last-good conserva timestamp e idade reais;
- uma régua, cota ou referência vertical não é convertida para outra sem metadados suficientes;
- fonte tecnicamente disponível não é automaticamente habilitada se o produto já possui cobertura suficiente;
- proximidade geográfica não autoriza associação editorial de uma estação a uma cidade, rio ou página;
- diagnóstico técnico pode permanecer em logs e contratos internos, mas não deve ser exposto como copy pública;
- `main` é operacional e histórico publicado não é reescrito.

## 2. Estado executivo

| Domínio | Estado atual |
| --- | --- |
| Portal público | Produção ativa em `tempopelotas.com.br`; Lovable sincroniza a `main` e publica o frontend |
| Runtime marker | `/api/runtime-version` permanece estático e `no-store/noindex`; não usar sozinho como prova de deploy novo |
| Home / Hoje / Amanhã / 7 dias | Shell-first + recuperação meteorológica após hidratação nas superfícies que usam esse contrato |
| Página hidrológica | `/situacao-hidrologica-pelotas` estabilizada; usa snapshot resiliente e fontes regionais isoladas |
| Mapas hidrológicos | SACE e Defesa Civil permanecem isolados por boundary local; falha de mapa não deve derrubar a rota |
| Defesa Civil RS | Payload normalizado; sete páginas meteorológicas recebem módulo local aprovado |
| Páginas Defesa Civil dedicadas | `/nivel-do-rio-jaguarao` e `/nivel-do-canal-sao-goncalo` existem na `main`, com fonte, horário, tendência, chuva, FAQ, canonical e Schema próprios |
| Descoberta Defesa Civil | Páginas meteorológicas aprovadas e cartões da rede apontam para páginas dedicadas somente quando o registry associa exatamente o `stationCode` |
| Open-Meteo | Principal; contingência/last-good preserva estado e timestamp sem mascarar falha |
| MET Norway | Contingência compartilhada quando aplicável |
| Embrapa | Observação local centralizada |
| INMET | Avisos/produtos oficiais conforme contrato de cada integração |
| Radar / satélite / STSC | Probes independentes e copy pública sanitizada |
| Hidrologia | Laranjal, Guaíba, Lagoa dos Patos, SACE e Defesa Civil degradam independentemente |
| Localidades da Lagoa | Hub `/nivel-da-lagoa-dos-patos` + páginas verificadas de Rio Grande, São Lourenço do Sul, Arambaré, São José do Norte e Itapuã/Viamão |
| ANA / SNIRH / RHN | Readiness/cross-check somente para o Laranjal; sem terceira ingestão nesta fase |
| Historical Data Layer | Ativo; classes `observation`, `forecast`, `reanalysis`, `derived` separadas |
| Monitor de status | Supabase `pg_cron` + `pg_net`, a cada 10 min; 14 serviços |
| Widget Builder | Fundação V1 publicada; conta cria e gerencia widgets responsivos por token público |
| Central Regional | Pelotas + 23 páginas municipais indexáveis |
| SEO técnico | **60 URLs indexáveis = 37 fixas + 23 municipais** no inventário da `main`, com canonical/sitemap/robots/Schema/BreadcrumbList conforme a superfície |
| Arquivo de enchentes | Hub `/historia-das-enchentes-pelotas` + páginas dedicadas de 1941, 2001, 2015 e 2024 |
| Colaboração histórica | Fluxo autenticado e moderado para fontes, fotos, documentos, relatos, medições e correções |
| Moderação histórica | V1 dentro de `/painel`, fail-closed por allowlist server-side; revisa fila e anexos privados sem publicar automaticamente |
| Conta / Google | Fundação operacional parcial; E2E completo com contas descartáveis ainda pendente |
| Service Worker / Web Push | Suspensos até estabilidade sustentada |
| GitHub Actions | Bloqueado antes dos steps em runs recentes; não declarar suíte/build/typecheck executados quando o job vier com `steps: null` |

## 3. Stack e budgets públicos

Stack principal: React 19, TypeScript 5.8, TanStack Start/Router, Vite 8, Nitro, Tailwind CSS 4, Supabase JS/SSR, MapLibre GL, Recharts e Zod. Lovable sincroniza/publica o repositório; o Supabase oficial é externo ao Lovable.

Budgets atuais:

- Home/Hoje/Amanhã/7 dias: nenhuma fonte externa no loader inicial quando em modo shell-first;
- inteligência meteorológica compartilhada após hidratação: teto interno de 5 s;
- loaders meteorológicos secundários: 2,5 s por dependência;
- loaders hidrológicos dedicados: 2,5 s por dependência;
- Radar: 2,8 s;
- previsão de 15 dias: 2,8 s.

O shell-first existe para manter o documento navegável. Ele não pode significar entregar objeto indisponível e nunca recuperar o dado real.

## 4. Estabilidade pública e hidrologia

### 4.1 Regressão da página hidrológica corrigida em 05/09

A falha intermitente de `/situacao-hidrologica-pelotas` foi isolada com HAR real do domínio canônico.

Causa raiz confirmada em `DefesaCivilHydroNetwork.tsx`: `formatNumber(distanceFromPelotasKm, 0)` podia produzir `maximumFractionDigits=0` com `minimumFractionDigits=1`, combinação inválida para `Intl.NumberFormat`.

Proteções permanentes:

- `minimumFractionDigits` nunca supera `maximumFractionDigits`;
- número não finito degrada para `—`;
- `station.capabilities.riverLevel` é a autoridade para decidir se uma estação expõe nível;
- valor bruto/sentinela em campo incompatível não promove estação meteorológica a hidrológica;
- falha de mapa ou integração regional não derruba a rota inteira.

### 4.2 Rede da Defesa Civil RS

O recorte regional usa a Rede de Monitoramento Hidrometeorológico da Defesa Civil RS como fonte oficial complementar.

Páginas meteorológicas atualmente enriquecidas por estação verificada:

| Página | Estação |
| --- | --- |
| `/tempo-em/turucu-rs` | `DCRS-00126` |
| `/tempo-em/cristal-rs` | `DCRS-00125` |
| `/tempo-em/jaguarao-rs` | `DCRS-00115` |
| `/tempo-em/arroio-grande-rs` | `DCRS-00050`, `DCRS-00111` |
| `/tempo-em/bage-rs` | `DCRS-00041` |
| `/tempo-em/capao-do-leao-rs` | `DCRS-00063` |
| `/tempo-em/santa-vitoria-do-palmar-rs` | `DCRS-00049` |

O registry `src/lib/hydrology/defesa-civil-regional-pages.ts` mantém dois conceitos separados:

- `REGIONAL_DEFESA_CIVIL_STATIONS`: páginas meteorológicas que recebem módulo da rede;
- `REGIONAL_DEFESA_CIVIL_DEDICATED_PAGES`: intenções hidrológicas que passaram pelo publication gate e podem receber URL própria.

Somente duas promoções estão aprovadas:

1. `DCRS-00115` → `/nivel-do-rio-jaguarao`;
2. `DCRS-00063` → `/nivel-do-canal-sao-goncalo`.

A descoberta nos cartões da própria rede é resolvida por `stationCode` exato. Nome da estação, distância de Pelotas ou proximidade de município não criam link.

Documento de gate: `docs/DEFESA_CIVIL_DEDICATED_PAGE_GATE_2026-09-05.md`.

### 4.3 Rio Jaguarão

`/nivel-do-rio-jaguarao` responde à intenção autônoma de nível do Rio Jaguarão e usa a estação `DCRS-00115`.

Contratos:

- não confundir nível informado pela estação com cota de inundação;
- manter horário e estado de recência da leitura;
- tendência é texto da fonte, não classificação de risco criada pelo Tempo Pelotas;
- ausência de leitura não vira zero;
- JSON-LD declara Jaguarão/RS como `contentLocation`;
- a página meteorológica `/tempo-em/jaguarao-rs` permanece canônica para previsão do tempo.

### 4.4 Canal São Gonçalo

`/nivel-do-canal-sao-goncalo` responde à intenção do Canal São Gonçalo usando `DCRS-00063`, estação da Eclusa em Capão do Leão.

Contratos:

- a página é do Canal São Gonçalo, não uma página genérica de “nível em Capão do Leão”;
- a régua da Eclusa não herda automaticamente cotas publicadas para o Cais do Porto em Pelotas;
- valores de réguas distintas não são comparados por simples subtração;
- JSON-LD declara a Eclusa/Capão do Leão como localização do conteúdo;
- `/tempo-em/capao-do-leao-rs` continua respondendo à intenção meteorológica.

## 5. Navegação, rotas e SEO

`src/lib/public-routes.ts` mantém **60 URLs indexáveis = 37 fixas + 23 municipais**.

Nenhuma cidade, estação ou keyword ganha URL apenas porque existe dado disponível. Uma nova página precisa de:

1. intenção autônoma;
2. fonte/objeto inequívocos;
3. conteúdo suficientemente distinto;
4. referência de medição compreensível;
5. canonical e Schema corretos;
6. links internos úteis;
7. teste que impeça expansão acidental.

### 5.1 Cluster da Lagoa dos Patos

Núcleo indexável:

```text
/nivel-da-lagoa-dos-patos
  ├─ /nivel-da-lagoa-dos-patos/rio-grande
  ├─ /nivel-da-lagoa-dos-patos/sao-lourenco-do-sul
  ├─ /nivel-da-lagoa-dos-patos/arambare
  ├─ /nivel-da-lagoa-dos-patos/sao-jose-do-norte
  └─ /nivel-da-lagoa-dos-patos/itapua-viamao
```

Regras:

- registry canônico: `src/lib/hydrology/hydrology-localities.ts`;
- cada página local nasce de associação verificada com uma estação da Rede da Lagoa;
- card sem mapeamento continua visível sem destino inventado;
- Guaíba permanece em `/nivel-do-guaiba`;
- referências locais, cotas e máximas históricas permanecem ligadas à própria estação;
- o hub explica que não existe um único “nível da Lagoa” aplicável a todos os pontos.

Integração meteorológica:

- Rio Grande, São Lourenço do Sul e São José do Norte preservam suas páginas `/tempo-em/...`;
- módulo hidrológico é carregado separadamente;
- falha de água não bloqueia nem redefine previsão meteorológica;
- Arambaré e Itapuã/Viamão possuem página hidrológica sem criação artificial de página meteorológica.

### 5.2 Descoberta pública

A navegação pública mantém separação entre previsão, águas e memória. O cluster hidrológico é descoberto por header/footer, hubs, páginas meteorológicas relacionadas e cartões de redes quando existe associação editorial verificada.

As páginas de Jaguarão e São Gonçalo já estão no inventário público/sitemap da `main`. A confirmação de propagação no domínio canônico continua pendente e deve ser tratada separadamente do estado do GitHub.

O smoke externo em 06/09 encontrou a rede regional da Lagoa ativa em snapshot público, mas buscas exatas ainda não retornaram as cinco URLs locais do cluster. Isso é tratado como pendência de descoberta/indexação, não como prova de 404 ou motivo para criar URLs substitutas.

## 6. Arquivo histórico de enchentes

Núcleo público:

```text
/historia-das-enchentes-pelotas
  ├─ /enchente-1941-pelotas
  ├─ /enchente-2001-pelotas
  ├─ /enchente-2015-pelotas
  └─ /enchente-2024-pelotas-laranjal
```

Regras editoriais:

- fonte histórica é identificada por origem e contexto;
- cotas de anos diferentes não são comparadas sem estação, datum, zero e referência vertical;
- lacuna documental permanece declarada, nunca estimada para “fechar” uma linha do tempo;
- 2001 permanece publicado como pesquisa em andamento;
- 2015 usa a série municipal “Cheias 2015” como espinha dorsal e imprensa contemporânea apenas como complemento identificado.

Boletins de 2015 ainda sem corpo recuperado: 27/10 às 11h e 19h, 28/10 às 18h e 29/10 às 11h.

## 7. Arquivo colaborativo e moderação

As páginas de 1941, 2001, 2015 e 2024 usam o componente reutilizável de colaboração.

Fluxo do colaborador:

1. visitante lê o registro;
2. pode enviar contribuição contextualizada;
3. sem sessão, entra pela conta gratuita e retorna ao formulário;
4. escolhe tipo de material;
5. contribuição entra como `pending`;
6. nenhuma submissão edita automaticamente o arquivo público.

Governança:

- tabela `public.historical_contributions`;
- bucket privado `historical-contributions`;
- até 5 anexos, máximo 15 MB cada;
- RLS limita o colaborador aos próprios registros;
- `rights_confirmed=true` autoriza compartilhar para análise;
- `publication_authorized` é separado e opcional;
- sem autorização de publicação, o material pode orientar pesquisa privada, mas não deve ser reproduzido publicamente.

Migrations relevantes:

- `20260905203358_create_historical_contributions`;
- `allow_review_without_publication_consent` em 05/09/2026.

### 7.1 Moderação V1

A V1 operacional está integrada ao `/painel`, sem criar rota indexável separada.

Autorização:

- sessão Supabase normal obrigatória;
- allowlist `MOBI_PORTAL_ADMIN_EMAILS` lida somente no servidor;
- `createSupabaseAdminClient()` somente é criado após autorização;
- ausência da allowlist ou do secret administrativo resulta em `unavailable` e o módulo não aparece;
- usuário autenticado fora da allowlist recebe `forbidden` e o componente retorna `null`.

Fila:

- busca somente `pending` e `reviewing`;
- mostra os 50 itens ativos mais recentes;
- anexos permanecem privados e recebem URL assinada por 10 minutos somente para operador autorizado;
- o painel não precisa expor e-mail/UUID do colaborador.

Decisões permitidas:

- `reviewing`;
- `accepted` para pesquisa;
- `rejected`.

A ação administrativa altera somente `status`, `moderation_note` e `reviewed_at`. Ela não altera `publication_authorized`, `rights_confirmed`, anexos ou conteúdo enviado.

`accepted` não significa publicação. Nenhuma contribuição modifica as páginas de enchentes automaticamente.

Documento: `docs/HISTORICAL_MODERATION_V1.md`.

## 8. Meteorologia e monitor operacional

Open-Meteo é a previsão principal. MET Norway atua como contingência quando aplicável. Embrapa permanece como observação local centralizada. INMET fornece avisos e produtos oficiais conforme contratos específicos.

Radar, STSC, satélite REDEMET e GOES/INMET têm probes independentes. Falha da integração do Tempo Pelotas não deve ser descrita como indisponibilidade global do serviço público.

Erros técnicos detalhados são úteis para operação e testes; APIs consumidas pela UI pública devem retornar copy sanitizada.

## 9. Política ANA/RHN

O Laranjal já possui duas fontes de coleta do projeto. ANA/RHN não será adicionada como terceira fonte nesta fase.

Estação ANA/RHN LARANJAL `87955001`:

- parâmetro `Nivel`;
- unidade confirmada `cm`;
- timezone `America/Sao_Paulo`;
- referência vertical específica permanece `unconfirmed`;
- `collection_enabled=false`;
- `publicMeasurementIngestionEnabled=false`;
- `collectionStrategy=readiness-cross-check-only`;
- `ingestionDeferredByProductPolicy=true`;
- `activationRequiresExplicitProductDecision=true`;
- `coveredByExistingSourceCount=2`;
- zero medições ANA/RHN no Historical Data Layer.

Documento: `docs/ANA_RHN_INTEGRATION.md`.

## 10. Historical Data Layer

O arquivo canônico separa `observation`, `forecast`, `reanalysis` e `derived`. Fontes novas entram com governança explícita antes de qualquer ingestão.

`historical-events-capture` roda pelo `cron.job` 8 a cada 10 minutos. A versão 2 deduplica eventos STSC pela chave `(source_key,event_type,source_record_id)` antes do upsert.

## 11. Widget Builder e conta

Área autenticada: `/widgets`, descoberta pelo módulo “Gerador de widgets” em `/painel`.

Módulos V1:

- `nivel-laranjal`;
- `status-tempo-agora`.

Free atualmente:

- acesso/criação habilitados;
- `widgetsMax=null`;
- Laranjal e Tempo Agora habilitados;
- marca Tempo Pelotas mantida;
- sem billing.

`/widgets/embed.js` cria iframe para `/embed/widget?token=...`; o listener valida origem, `contentWindow`, token e tipo da mensagem. `/embed/widget` é `noindex` e não carrega shell público duplicado.

E2E autenticado completo continua pendente.

Documento: `docs/WIDGET_BUILDER_ARCHITECTURE.md`.

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

Documento: `docs/MOBI_TICKET_CORE_INTEGRATION_2026-08-29.md`.

## 13. Testes, CI e deploy

Contratos versionados cobrem meteorologia, navegação, hidrologia, REDEMET, dados históricos, widgets, enchentes e colaboração comunitária.

Na onda da Defesa Civil RS, os contratos também protegem:

- capability flags oficiais;
- formatação segura de números;
- ausência de zero sintético;
- sete associações meteorológicas aprovadas;
- somente duas páginas hidrológicas dedicadas;
- localidade correta no JSON-LD das duas páginas;
- descoberta por `stationCode` exato nos cartões da rede;
- ausência de links dedicados para as cinco candidatas não promovidas.

Na moderação histórica V1, os contratos protegem:

- allowlist exclusivamente server-side e fail-closed;
- cliente administrativo somente depois da autorização;
- fila restrita a `pending`/`reviewing`;
- links de anexos assinados por 10 minutos;
- decisões limitadas a `reviewing`, `accepted`, `rejected`;
- nenhum update de moderação em `publication_authorized`, `rights_confirmed` ou conteúdo enviado;
- painel invisível para snapshot não autorizado;
- `/painel` permanece `noindex, nofollow`.

`src/routeTree.gen.ts` inclui as duas páginas dedicadas e o inventário `src/lib/public-routes.ts` inclui ambas no sitemap.

GitHub Actions continua apresentando runs que terminam antes dos steps (`steps: null`). Nessa condição, não declarar testes, build, typecheck, lint, `routes:check` ou browser E2E como executados.

O Lovable pode sincronizar/publicar commits mesmo quando o workflow do GitHub não executa. Deploy deve ser confirmado separadamente.

## 14. Próximas prioridades

1. Confirmar propagação no domínio canônico de `/nivel-do-rio-jaguarao` e `/nivel-do-canal-sao-goncalo`, incluindo status HTTP, canonical, Schema, sitemap e links internos.
2. Confirmar o smoke do hub `/nivel-da-lagoa-dos-patos` e das cinco páginas locais quando houver ferramenta capaz de abrir as URLs diretamente; buscas exatas ainda não as retornaram em 06/09.
3. Executar `routes:check`, testes da Lagoa/Defesa Civil/moderação, build e typecheck assim que houver executor funcional.
4. Observar Search Console antes de promover outra estação da Defesa Civil; o conector GSC Wizard está bloqueado por assinatura expirada nesta rodada.
5. Manter Turuçu, Cristal, Arroio Grande, Bagé e Santa Vitória do Palmar somente com módulo meteorológico/hidrometeorológico até novo gate editorial.
6. Configurar `MOBI_PORTAL_ADMIN_EMAILS` no runtime e validar a Moderação V1 com conta autorizada e contribuição descartável antes de uso editorial real.
7. Continuar resgate dos corpos perdidos dos boletins de 27–29/10/2015.
8. Continuar pesquisa documental da enchente de 2001.
9. Incorporar galerias documentais por enchente com autoria, origem, data/local aproximados e situação de autorização.
10. Depois da validação da moderação V1, adicionar paginação/filtros e um fluxo editorial separado de publicação para materiais autorizados.
11. Fazer E2E autenticado do Widget Builder e do fluxo de contribuição com conta descartável.
12. Manter Service Worker/Web Push suspensos até estabilidade sustentada.

## 15. Documentos principais

- `docs/DEFESA_CIVIL_DEDICATED_PAGE_GATE_2026-09-05.md` — gate editorial das páginas dedicadas da Defesa Civil;
- `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md` — integração da Rede da Defesa Civil RS;
- `docs/HISTORICAL_MODERATION_V1.md` — autorização, fila, anexos privados e decisões da moderação;
- `docs/FLOODS_2001_2015_RESEARCH_2026-09-05.md` — base documental das cheias de 2001 e 2015;
- `docs/FLOOD_2015_OFFICIAL_BULLETIN_INVENTORY_2026-09-05.md` — inventário dos boletins de 2015;
- `docs/HISTORICAL_DATA_INVENTORY.md` — arquivo histórico;
- `docs/WIDGET_BUILDER_ARCHITECTURE.md` — widgets, RLS e embeds;
- `docs/MOBI_TICKET_CORE_INTEGRATION_2026-08-29.md` — consumidor MOBI Ticket e canário P1;
- `docs/PUBLIC_ROUTE_RESILIENCE.md` — shell-first e budgets;
- `docs/NAVIGATION_RUNTIME_RECOVERY_2026-08-27.md` — navegação e recuperação;
- `docs/DATA_STATUS_MONITOR_RECOVERY_2026-08-28.md` — scheduler e monitor;
- `docs/ANA_RHN_INTEGRATION.md` — política readiness-only da ANA/RHN;
- `docs/REDEMET_OPERATIONS.md` — REDEMET;
- `docs/SOURCE_RESILIENCE_INMET_REDEMET_2026-08-27.md` — contingências;
- `docs/FORECAST_15_DAY_IMPLEMENTATION_2026-08-26.md` — previsão de 15 dias;
- `docs/SEO_REFINEMENT_ENRICHMENT_2026-08-27.md` — SEO;
- `docs/PRODUCTION_CUTOVER.md` — runbook de produção.

## 16. Regra de manutenção

Este arquivo deve responder rapidamente: o que existe na `main`, o que foi confirmado no runtime, quais fontes alimentam o portal, o que está parcial/suspenso, quais decisões de produto limitam integrações e qual é o próximo trabalho real.

Não confundir três estados diferentes:

1. código versionado na `main`;
2. deploy propagado no domínio canônico;
3. URL descoberta/indexada por mecanismos de busca.

Histórico detalhado permanece nos documentos especializados.

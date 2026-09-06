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
| Mapas hidrológicos | SACE e Defesa Civil permanecem isolados por boundary local; falha de mapa não derruba a rota |
| Defesa Civil RS | Payload normalizado; sete páginas meteorológicas recebem módulo local aprovado |
| Páginas Defesa Civil dedicadas | `/nivel-do-rio-jaguarao` e `/nivel-do-canal-sao-goncalo` existem na `main`, com fonte, horário, tendência, chuva, FAQ, canonical e Schema próprios |
| Descoberta Defesa Civil | As duas páginas aprovadas aparecem no megamenu Águas, no footer, nas páginas meteorológicas relacionadas e nos cartões da rede somente por `stationCode` exato; as outras cinco candidatas não recebem URL própria |
| Open-Meteo | Principal; contingência/last-good preserva estado e timestamp sem mascarar falha |
| MET Norway | Contingência compartilhada quando aplicável |
| Embrapa | Observação local centralizada; snapshot central vale no máximo 75 s e amostra com mais de 30 min nunca é publicada como `Agora` |
| INMET | Avisos/produtos oficiais conforme contrato de cada integração |
| Radar / satélite / STSC | Probes independentes e copy pública sanitizada |
| Hidrologia | Laranjal, Guaíba, Lagoa dos Patos, SACE e Defesa Civil degradam independentemente |
| Localidades da Lagoa | Hub `/nivel-da-lagoa-dos-patos` + páginas verificadas de Rio Grande, São Lourenço do Sul, Arambaré, São José do Norte e Itapuã/Viamão |
| ANA / SNIRH / RHN | `87955001` permanece readiness/cross-check atual; série histórica `87955000` foi recuperada em bruto e consistido para pesquisa, sem terceira ingestão de runtime |
| Historical Data Layer | Ativo; classes `observation`, `forecast`, `reanalysis`, `derived` separadas |
| Monitor de status | Supabase `pg_cron` + `pg_net`, a cada 10 min; 14 serviços |
| Widget Builder | Fundação V1 publicada; conta cria e gerencia widgets responsivos por token público |
| Central Regional | Pelotas + 23 páginas municipais indexáveis |
| SEO técnico | **60 URLs indexáveis = 37 fixas + 23 municipais** no inventário da `main`, com canonical/sitemap/robots/Schema/BreadcrumbList conforme a superfície |
| Arquivo de enchentes | Hub `/historia-das-enchentes-pelotas` + páginas dedicadas de 1941, 2001, 2015 e 2024 |
| Colaboração histórica | Fluxo autenticado para fontes, fotos, documentos, relatos, medições e correções; submissão nunca altera automaticamente o arquivo público |
| Moderação histórica | V1 dentro de `/painel`, fail-closed, com e-mail confirmado + allowlist server-only; estados finais não são reabertos pela mesma ação |
| Conta / Google | Fundação operacional parcial; E2E completo com contas descartáveis ainda pendente |
| Service Worker / Web Push | Suspensos até estabilidade sustentada |
| GitHub Actions | Runs recentes continuam encerrando antes dos steps, com `steps: null`; não declarar suíte/build/typecheck executados nessa condição |

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

### 4.1 Página hidrológica

A regressão intermitente de `/situacao-hidrologica-pelotas` foi isolada em 05/09. Em `DefesaCivilHydroNetwork.tsx`, `formatNumber(distanceFromPelotasKm, 0)` podia produzir `maximumFractionDigits=0` com `minimumFractionDigits=1`, combinação inválida para `Intl.NumberFormat`.

Proteções permanentes:

- `minimumFractionDigits` nunca supera `maximumFractionDigits`;
- número não finito degrada para `—`;
- `station.capabilities.riverLevel` é autoridade para decidir se a estação expõe nível;
- valor bruto/sentinela incompatível não promove estação meteorológica a hidrológica;
- falha de mapa ou integração regional não derruba a rota inteira.

### 4.2 Rede da Defesa Civil RS

Páginas meteorológicas enriquecidas por estação verificada:

| Página | Estação |
| --- | --- |
| `/tempo-em/turucu-rs` | `DCRS-00126` |
| `/tempo-em/cristal-rs` | `DCRS-00125` |
| `/tempo-em/jaguarao-rs` | `DCRS-00115` |
| `/tempo-em/arroio-grande-rs` | `DCRS-00050`, `DCRS-00111` |
| `/tempo-em/bage-rs` | `DCRS-00041` |
| `/tempo-em/capao-do-leao-rs` | `DCRS-00063` |
| `/tempo-em/santa-vitoria-do-palmar-rs` | `DCRS-00049` |

`src/lib/hydrology/defesa-civil-regional-pages.ts` separa:

- `REGIONAL_DEFESA_CIVIL_STATIONS`: páginas meteorológicas que recebem módulo da rede;
- `REGIONAL_DEFESA_CIVIL_DEDICATED_PAGES`: intenções hidrológicas aprovadas para URL própria.

Somente duas promoções estão aprovadas:

1. `DCRS-00115` → `/nivel-do-rio-jaguarao`;
2. `DCRS-00063` → `/nivel-do-canal-sao-goncalo`.

A associação pública usa `stationCode` exato. Nome da estação, distância de Pelotas ou proximidade geográfica não criam link.

### 4.3 Rio Jaguarão

`/nivel-do-rio-jaguarao` usa `DCRS-00115` e preserva estes contratos:

- nível da estação não é tratado como cota de inundação;
- horário e recência ficam visíveis;
- tendência é texto da fonte, não classificação de risco do Tempo Pelotas;
- ausência de leitura não vira zero;
- JSON-LD declara Jaguarão/RS como `contentLocation`;
- `/tempo-em/jaguarao-rs` continua canônica para previsão meteorológica.

### 4.4 Canal São Gonçalo

`/nivel-do-canal-sao-goncalo` usa `DCRS-00063`, estação da Eclusa em Capão do Leão.

Contratos:

- a página responde ao Canal São Gonçalo, não a um genérico “nível em Capão do Leão”;
- a régua da Eclusa não herda cotas publicadas para outras réguas;
- valores de réguas distintas não são comparados por simples subtração;
- JSON-LD declara Eclusa/Capão do Leão como localização do conteúdo;
- `/tempo-em/capao-do-leao-rs` continua respondendo à intenção meteorológica.

## 5. Navegação, rotas e SEO

`src/lib/public-routes.ts` mantém **60 URLs indexáveis = 37 fixas + 23 municipais**.

Uma nova página só nasce quando há intenção autônoma, fonte inequívoca, conteúdo distinto, referência de medição compreensível, canonical/Schema corretos, links internos úteis e teste que impeça expansão acidental.

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

Registry canônico: `src/lib/hydrology/hydrology-localities.ts`.

Regras:

- cada página local nasce de associação verificada com uma estação;
- card sem mapeamento continua visível sem destino inventado;
- Guaíba permanece em `/nivel-do-guaiba`;
- referências locais, cotas e máximas históricas permanecem ligadas à própria estação;
- o hub explica que não existe um único “nível da Lagoa” aplicável a todos os pontos;
- falha de água não bloqueia nem redefine as páginas meteorológicas relacionadas.

### 5.2 Descoberta pública

As páginas de Jaguarão e São Gonçalo estão no inventário público/sitemap da `main`, no megamenu Águas, no footer e em links contextuais aprovados. A confirmação de propagação no domínio canônico continua separada do estado do GitHub e do Lovable.

O smoke externo em 06/09 encontrou a rede regional da Lagoa ativa em snapshot público, mas buscas exatas ainda não retornaram as cinco URLs locais do cluster. Isso continua sendo pendência de descoberta/indexação, não prova de 404 e não motivo para criar URLs substitutas.

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
- camada bruta e camada consistida são preservadas separadamente quando ambas existem;
- valor consistido marcado como estimado continua identificado como estimado;
- lacuna documental permanece declarada, nunca estimada para “fechar” cronologia;
- análise posterior não é convertida em boletim contemporâneo.

### 6.1 Evento de 2001

`/enchente-2001-pelotas` permanece marcado como pesquisa em andamento. A pesquisa meteorológica e hidrológica agora possui seis camadas principais:

1. **Folha de S.Paulo, 09/10/2001**: registro contemporâneo para classificação como ciclone extratropical, vento de 105 km/h em Pelotas, avanço aproximado de 600 m no Laranjal e cerca de 3 mil pessoas isoladas na Z3;
2. **Prefeitura de Pelotas, 22/10/2001**: registro municipal contemporâneo de fortes ventos, invasão das águas, danos e recuperação;
3. **ANA/Hidro 87955000**: exportação direta da série de cotas, com 08/10/2001 preservado como 300 cm às 07h, 280 cm às 17h e média diária bruta de 290 cm; na camada consistida, o mesmo dia aparece com 190 cm e status Estimado;
4. **PMSB de Rio Grande, 2013**: recompilação anterior da série ANA que registra 2,90 m no dia 08/10/2001; após a recuperação do Hidro, esse número é tratado como compatível com a camada bruta, não como cota consistida definitiva;
5. **Faculdade de Meteorologia da UFPel, análise posterior específica**: estudo do evento de 08/10/2001 com Análise Final NCEP 1° x 1° em intervalos de 6 h e dados horários de pressão, direção e velocidade do vento da Praticagem da Barra de Rio Grande entre 05 e 08/10/2001;
6. **POPA, 10/02/2005**: contexto hidrodinâmico geral posterior sobre influência do vento Nordeste nos níveis da Lagoa.

O MDB da `87955000` registra em 29/06/2018 que os dados fluviométricos foram alterados no âmbito do Contrato ANA nº 10/2015 para análise de consistência. Esse histórico prova uma intervenção formal de consistência, mas não explica tecnicamente a correção específica de 290 cm para 190 cm em 08/10/2001.

O mesmo MDB registra em 05/10/2017 alteração do campo altitude para `-0,02 m`, descrita como altitude do zero da régua levantado em campo, e em março de 2018 registra substituição/renumeração de lances de régua. Por isso, `-0,02 m` não é retroprojetado para 2001 sem a cadeia de nivelamento/RNs aplicável ao período.

A relação operacional dos códigos também avançou:

- em 30/04/2026, a `87955000` teve o tipo telemétrico retirado, mantendo a identidade F/convencional;
- o MDB da `87955001` registra cadastro em 08/06/2026 como `LARANJAL` / `TELEMÉTRICA`;
- os ZIPs CSV/TXT fornecidos para `87955001` não contêm série `Cotas`;
- isso sustenta papéis distintos de régua histórica e telemetria atual, mas não prova compartilhamento de zero, RN ou datum.

A análise UFPel associa a interação da Alta Subtropical do Atlântico Sul com baixa pressão sobre o norte da Argentina ao aumento do gradiente de pressão e ao fortalecimento dos ventos de leste/nordeste. O trabalho relaciona a sequência desses ventos à redução do escoamento da Lagoa para o oceano, ao deslocamento de água para a costa oeste e à inundação. Essa camada é acadêmica e posterior, não boletim operacional contemporâneo.

Acosta et al., **Análise sinótica do evento ocorrido em 08/10/2001 na região sudeste da Lagoa dos Patos**, XII Congresso Brasileiro de Meteorologia, 2002, e Cruz et al., **Estudo sinótico do sistema meteorológico ocorrido no extremo sul do Brasil no dia 08/10/2001**, XIV Congresso Brasileiro de Meteorologia, 2006, estão bibliograficamente confirmados/citados pela UFPel, mas seus textos integrais originais ainda não foram recuperados para uso direto.

Lacunas que permanecem:

- relatório/entregável técnico que explique a revisão de 290 cm bruto para 190 cm consistido/estimado em 08/10/2001;
- ficha histórica, RNs e nivelamentos da `87955000` que permitam definir o referencial aplicável a 2001;
- relação documental vertical entre `87955000` e `87955001`, se existir;
- boletins meteorológicos operacionais contemporâneos de outubro de 2001;
- corpos integrais de Acosta 2002 e Cruz 2006.

Documentos:

- `docs/FLOOD_2001_WIND_CONTEXT_2026-09-06.md`;
- `docs/LARANJAL_HIDRO_EXPORT_AUDIT_2026-09-06.md`;
- `docs/ANA_RHN_INTEGRATION.md`.

### 6.2 Evento de 2015

A série municipal “Cheias 2015” permanece a espinha dorsal; imprensa contemporânea é complemento identificado, nunca substituto silencioso de boletim.

Corpos ainda não recuperados:

- 27/10 às 11h;
- 27/10 às 19h;
- 28/10 às 18h;
- 29/10 às 11h.

Uma nova tentativa de recuperação foi executada em 06/09/2026. Índice e links históricos continuam comprovando a existência das edições, mas não houve recuperação dos corpos. Nenhum novo nível, tendência ou número de desabrigados foi inferido. A busca web pública chegou ao limite útil; próximos caminhos são acervo institucional, backup do CMS/banco de notícias municipal, Defesa Civil, Sanep, hemerotecas e arquivos locais.

Documentos:

- `docs/FLOOD_2015_OFFICIAL_BULLETIN_INVENTORY_2026-09-05.md`;
- `docs/FLOOD_2015_BULLETIN_RECOVERY_ATTEMPT_2026-09-06.md`.

## 7. Arquivo colaborativo e moderação

As páginas de 1941, 2001, 2015 e 2024 usam o componente reutilizável de colaboração.

Governança:

- tabela `public.historical_contributions`;
- bucket privado `historical-contributions`;
- até 5 anexos, máximo 15 MB cada;
- RLS limita colaborador aos próprios registros;
- `rights_confirmed=true` autoriza compartilhar para análise;
- `publication_authorized` é separado e opcional;
- contribuição entra como `pending` e nunca edita automaticamente o arquivo público.

### 7.1 Moderação V1

A V1 vive dentro de `/painel`, sem rota indexável separada.

Autorização fail-closed:

- sessão Supabase normal obrigatória;
- e-mail da conta precisa estar confirmado;
- allowlist `MOBI_PORTAL_ADMIN_EMAILS` é lida somente no servidor;
- `createSupabaseAdminClient()` só é criado depois da autorização;
- ausência de allowlist/secret, e-mail não confirmado ou usuário fora da allowlist impede consulta administrativa;
- `.env.example` contém apenas `MOBI_PORTAL_ADMIN_EMAILS=` vazio, sem identidade real versionada;
- não existe e não deve existir variante `VITE_*` da allowlist.

Fila:

- consulta somente `pending` e `reviewing`;
- mostra os 50 itens ativos mais recentes;
- anexos permanecem privados e recebem URL assinada por 10 minutos somente para operador autorizado;
- painel não precisa expor e-mail/UUID do colaborador.

Decisões permitidas: `reviewing`, `accepted`, `rejected`.

A ação altera somente `status`, `moderation_note` e `reviewed_at`. Ela não altera `publication_authorized`, `rights_confirmed`, anexos ou conteúdo enviado.

Somente registros cujo estado atual ainda é `pending` ou `reviewing` podem ser moderados. `accepted` e `rejected` são estados finais nesta V1 e não podem ser reabertos pela mesma ação administrativa.

`accepted` significa aceito para pesquisa, não publicação.

Documento: `docs/HISTORICAL_MODERATION_V1.md`.

## 8. Meteorologia e monitor operacional

Open-Meteo é a previsão principal. MET Norway atua como contingência quando aplicável. Embrapa permanece como observação local centralizada. INMET fornece avisos e produtos oficiais conforme contratos específicos.

Em 06/09/2026 foi reproduzida na Home uma regressão de recência: o shell/fallback carregava corretamente e, depois da hidratação, uma leitura central antiga da Embrapa era promovida novamente a `Agora`. O snapshot observado era de **05/09 às 08:56**.

A auditoria do Supabase confirmou que:

- `weather_collector_settings.enabled=true`;
- o cron `tempo-pelotas-embrapa-every-minute` permanecia ativo em `* * * * *`;
- o último sucesso estava em 05/09 11:56 UTC;
- novas tentativas continuavam ocorrendo em 06/09;
- o coletor acumulava mais de mil falhas consecutivas com `The operation was aborted due to timeout`;
- os incidentes privados `consecutive-failures` e `stale-reading` estavam abertos.

Correção permanente:

- snapshot central da Embrapa só é caminho rápido por **75 segundos**;
- acima disso, perde autoridade e o pageview tenta somente leitura direta, sem lease ou persistência;
- a amostra meteorológica continua sujeita ao limite editorial de **30 minutos** definido em `current-observation.ts`;
- observação mais velha ou não utilizável faz `/api/weather/embrapa` responder 503 e não pode virar `currentSource=embrapa`;
- se a Embrapa estiver sem leitura recente, o Hero pode degradar para **Previsão**, mas não mostra last-known como `Agora`.

A falha atual do coletor é uma pendência operacional separada da correção de apresentação: restaurar a coleta volta a fornecer observação, mas a indisponibilidade da fonte não autoriza o portal a publicar cache antigo como atual.

Radar, STSC, satélite REDEMET e GOES/INMET têm probes independentes. Falha da integração do Tempo Pelotas não deve ser descrita como indisponibilidade global do serviço público.

Documento: `docs/PUBLIC_ROUTE_RESILIENCE.md`.

## 9. Política ANA/RHN

O Laranjal já possui duas fontes de coleta do projeto. ANA/RHN não será adicionada como terceira fonte nesta fase.

### 9.1 Estação atual 87955001

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

### 9.2 Estação histórica 87955000

- arquivos Hidro bruto/consistido recuperados para pesquisa;
- 08/10/2001: 290 cm bruto e 190 cm consistido/estimado;
- histórico de consistência formal registrado em 29/06/2018;
- pista cadastral de zero da régua em `-0,02 m` em 2017 não é retroprojetada para 2001;
- tipo telemétrico retirado em 30/04/2026;
- série não é anexada ao station key `ana-rhn-laranjal-87955001`.

A `87955001`, cadastrada como telemétrica em 08/06/2026, permanece separada da série histórica até documentação de zero/RN/datum que autorize qualquer junção.

Documento: `docs/ANA_RHN_INTEGRATION.md`.

## 10. Historical Data Layer

O arquivo canônico separa `observation`, `forecast`, `reanalysis` e `derived`. Fontes novas entram com governança explícita antes de ingestão.

`historical-events-capture` roda pelo `cron.job` 8 a cada 10 minutos. A versão 2 deduplica eventos STSC pela chave `(source_key,event_type,source_record_id)` antes do upsert.

Se a série histórica ANA 87955000 for importada futuramente, bruto e consistido devem permanecer distinguíveis por proveniência/status; um não deve sobrescrever silenciosamente o outro.

## 11. Widget Builder e conta

Área autenticada: `/widgets`, descoberta pelo módulo “Gerador de widgets” em `/painel`.

Módulos V1:

- `nivel-laranjal`;
- `status-tempo-agora`.

Free: criação habilitada, `widgetsMax=null`, os dois módulos habilitados, marca Tempo Pelotas mantida e sem billing.

`/widgets/embed.js` cria iframe para `/embed/widget?token=...`; listener valida origem, `contentWindow`, token e tipo da mensagem. `/embed/widget` é `noindex`.

E2E autenticado completo continua pendente.

## 12. Segurança, runtime e MOBI Ticket

Ativos: secrets server-side, RLS, gate geográfico, CSP, firewall de aplicação, rate limiting distribuído, allowlists/proxies de fontes, logs sanitizados e endpoint de runtime `no-store/noindex`.

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

Na Defesa Civil RS, os contratos protegem:

- capability flags oficiais;
- formatação segura e ausência de zero sintético;
- sete associações meteorológicas aprovadas;
- somente duas páginas hidrológicas dedicadas;
- localidade correta no JSON-LD;
- descoberta por `stationCode` exato;
- ausência de links dedicados para as cinco candidatas não promovidas.

Na observação Embrapa/Home, os contratos agora protegem:

- snapshot central com janela máxima de 75 segundos;
- fallback direto sem `refreshCentralEmbrapaObservation()` e sem persistência no pageview;
- limite de 30 minutos para a amostra poder ser publicada como atual;
- HTTP 503 em `/api/weather/embrapa` quando a observação não é publicável;
- ausência de invalidação global por minuto;
- cache antigo não volta a ser promovido a `Agora` durante a recuperação da Home.

Na enchente de 2001, os contratos agora protegem:

- 300 cm às 07h e 280 cm às 17h na camada bruta de 08/10/2001;
- média diária bruta de 290 cm;
- média diária consistida de 190 cm com status Estimado;
- proibição de voltar a apresentar 2,90 m como única cota definitiva;
- rastreabilidade do processo de consistência de 2018 sem inventar a justificativa específica da correção;
- `-0,02 m` de 2017 como pista de zero, sem retroprojeção automática para 2001;
- separação operacional `87955000` histórica/convencional versus `87955001` telemétrica atual;
- proibição de usar `87955001` para recalibrar o histórico.

Na moderação histórica V1, os contratos protegem:

- allowlist server-only e fail-closed;
- e-mail confirmado;
- cliente administrativo somente após autorização;
- fila restrita a `pending`/`reviewing`;
- links assinados por 10 minutos;
- estados finais não reabertos pela ação V1;
- nenhum update em consentimento/publicação/conteúdo;
- painel invisível para snapshot não autorizado;
- `/painel` permanece `noindex, nofollow`.

`.github/workflows/quality.yml` chama explicitamente contratos de moderação, Defesa Civil, navegação/rodapé e enchente de 2001. `npm test` também descobre os testes de frescor da Embrapa pelo glob geral.

GitHub Actions segue apresentando runs que terminam antes do checkout/steps (`steps: null`). Nessa condição, não declarar testes, build, typecheck, lint, `routes:check` ou browser E2E como executados.

### 13.1 Lovable e propagação

O Lovable sincroniza os commits funcionais da `main`; estado de Git, build Lovable, propagação no domínio canônico e indexação continuam tratados separadamente.

Devem permanecer distintos:

1. código versionado na `main`;
2. commit absorvido/buildado pelo Lovable;
3. deploy propagado em `tempopelotas.com.br`;
4. URL descoberta/indexada por mecanismo de busca.

## 14. Próximas prioridades

1. Restaurar a saúde do coletor central da Embrapa e identificar a causa dos timeouts consecutivos, mantendo o Hero em modo degradado até existir observação realmente recente.
2. Confirmar propagação no domínio canônico de `/nivel-do-rio-jaguarao` e `/nivel-do-canal-sao-goncalo`, incluindo HTTP, canonical, Schema, sitemap e links internos.
3. Confirmar o smoke do hub `/nivel-da-lagoa-dos-patos` e das cinco páginas locais quando houver ferramenta capaz de abrir as URLs diretamente; buscas exatas ainda não as retornaram em 06/09.
4. Executar `routes:check`, testes da Lagoa/Defesa Civil/moderação/enchente de 2001/Embrapa, build e typecheck assim que houver executor funcional.
5. Observar Search Console antes de promover outra estação da Defesa Civil; não expandir automaticamente Turuçu, Cristal, Arroio Grande, Bagé ou Santa Vitória do Palmar.
6. Configurar `MOBI_PORTAL_ADMIN_EMAILS` no runtime e validar a Moderação V1 com conta autorizada, e-mail confirmado e contribuição descartável.
7. Recuperar os quatro corpos perdidos de 2015 por acervo institucional, backup do CMS/banco municipal, Defesa Civil, Sanep ou hemeroteca; não repetir inferência web já esgotada.
8. Localizar boletins meteorológicos contemporâneos de outubro de 2001.
9. Tentar recuperar os textos integrais de Acosta et al. 2002 e Cruz et al. 2006.
10. Localizar o relatório/entregável da consistência da `87955000` que explique a revisão de 290 cm bruto para 190 cm consistido/estimado em 08/10/2001 e recuperar os nivelamentos/RNs aplicáveis ao período.
11. Obter documento oficial que esclareça a continuidade operacional/vertical entre `87955000` e `87955001`, se existir, sem fundir as séries antes disso.
12. Incorporar galerias documentais por enchente com autoria, origem, data/local aproximados e situação de autorização.
13. Depois da validação da moderação V1, adicionar paginação/filtros e fluxo editorial separado de publicação.
14. Fazer E2E autenticado do Widget Builder e do fluxo de contribuição com conta descartável.
15. Manter Service Worker/Web Push suspensos até estabilidade sustentada.

## 15. Documentos principais

- `docs/DEFESA_CIVIL_DEDICATED_PAGE_GATE_2026-09-05.md` — gate editorial das páginas dedicadas da Defesa Civil;
- `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md` — integração da Rede da Defesa Civil RS;
- `docs/HISTORICAL_MODERATION_V1.md` — autorização, fila, anexos privados e decisões da moderação;
- `docs/FLOODS_2001_2015_RESEARCH_2026-09-05.md` — base documental das cheias de 2001 e 2015;
- `docs/FLOOD_2001_WIND_CONTEXT_2026-09-06.md` — análise UFPel, série Hidro bruto/consistido, relação entre códigos e lacunas da enchente de 2001;
- `docs/LARANJAL_HIDRO_EXPORT_AUDIT_2026-09-06.md` — auditoria sanitizada dos arquivos Hidro 87955000/87955001 recebidos em 06/09;
- `docs/FLOOD_2015_OFFICIAL_BULLETIN_INVENTORY_2026-09-05.md` — inventário dos boletins de 2015;
- `docs/FLOOD_2015_BULLETIN_RECOVERY_ATTEMPT_2026-09-06.md` — tentativa de recuperação dos quatro corpos ainda ausentes;
- `docs/HISTORICAL_DATA_INVENTORY.md` — arquivo histórico;
- `docs/WIDGET_BUILDER_ARCHITECTURE.md` — widgets, RLS e embeds;
- `docs/MOBI_TICKET_CORE_INTEGRATION_2026-08-29.md` — consumidor MOBI Ticket e canário P1;
- `docs/PUBLIC_ROUTE_RESILIENCE.md` — shell-first, budgets e contrato fresh-only do Hero/Embrapa;
- `docs/NAVIGATION_RUNTIME_RECOVERY_2026-08-27.md` — navegação e recuperação;
- `docs/DATA_STATUS_MONITOR_RECOVERY_2026-08-28.md` — scheduler e monitor;
- `docs/ANA_RHN_INTEGRATION.md` — política readiness-only da ANA/RHN e separação 87955000/87955001;
- `docs/REDEMET_OPERATIONS.md` — REDEMET;
- `docs/SOURCE_RESILIENCE_INMET_REDEMET_2026-08-27.md` — contingências;
- `docs/FORECAST_15_DAY_IMPLEMENTATION_2026-08-26.md` — previsão de 15 dias;
- `docs/SEO_REFINEMENT_ENRICHMENT_2026-08-27.md` — SEO;
- `docs/PRODUCTION_CUTOVER.md` — runbook de produção.

## 16. Regra de manutenção

Este arquivo deve responder rapidamente: o que existe na `main`, o que foi confirmado no runtime, quais fontes alimentam o portal, o que está parcial/suspenso, quais decisões de produto limitam integrações e qual é o próximo trabalho real.

Não confundir estado de código, build/sincronização, deploy canônico e descoberta/indexação. Histórico detalhado permanece nos documentos especializados.
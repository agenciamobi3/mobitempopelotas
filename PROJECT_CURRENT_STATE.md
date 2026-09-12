# Tempo Pelotas — estado atual do projeto

Última atualização: 12/09/2026  
Branch operacional: `main`  
Domínio canônico e único de produção: `https://tempopelotas.com.br`

## 1. Fonte de verdade e regras permanentes

Este arquivo é o inventário operacional do estado atual. Evidências, pesquisas, decisões históricas e runbooks detalhados ficam em `docs/`; código ativo, migrations aplicadas e runtime confirmado prevalecem sobre documentação antiga.

Regras permanentes:

- não versionar secrets, cookies, HARs, URLs autenticadas, tokens ou headers de sessão;
- observação, previsão, alerta oficial, reanálise e dado derivado permanecem semanticamente separados;
- indisponibilidade nunca vira zero, normalidade ou diagnóstico automático;
- timeout, HTTP 403, falha de parsing ou bloqueio da integração do Tempo Pelotas não provam indisponibilidade global da fonte pública;
- last-known conserva o timestamp e a idade reais; dado antigo nunca volta a ser apresentado como `Agora`;
- vento médio nunca substitui rajada ausente;
- uma régua, cota ou referência vertical não é convertida para outra sem metadados suficientes;
- proximidade geográfica não autoriza associar uma estação a cidade, rio ou página;
- diagnóstico técnico pode existir em logs e contratos internos, mas não deve vazar como copy pública;
- `main` é operacional e histórico publicado não é reescrito.

## 2. Estado executivo

| Domínio | Estado atual |
| --- | --- |
| Portal público | Produção ativa em `tempopelotas.com.br`; estado do Git, build/sincronização e propagação no domínio são provas separadas |
| Header público | `SiteHeader` reutiliza `HomeEditorialHeader`; a antiga implementação paralela `src/components/layout/Header.tsx` e seu CSS foram removidos em 08/09; `Explorar` voltou a descobrir a página da Estação Embrapa em 09/09 |
| Footer público | Uma implementação compartilhada em `SiteFooter` → `Footer`; não publica inventário completo de fornecedores em todas as páginas |
| Transparência pública | `/status-dos-dados` é a página canônica de origem, uso, estado e horário das fontes; usa leitura editorial aberta em linhas, `ServiceStatus.state` descreve a integração e `dataCondition` descreve separadamente a condição publicável do dado para Laranjal, Guaíba, rede regional da Lagoa, Defesa Civil RS e ANA `87955001`; critérios gerais ficam no fechamento da página |
| Rota de compatibilidade aposentada | `/metodologia` permanece redirect 301 para `/status-dos-dados`; `/estacao-embrapa-pelotas` voltou em 09/09 como página interna real, `noindex`, fora do sitemap, descoberta no megamenu `Explorar` e ainda sem promoção no footer |
| SEO técnico | **58 URLs indexáveis = 35 fixas + 23 municipais** em `src/lib/public-routes.ts`; a página Embrapa restaurada e o Observatório interno não alteram esse inventário |
| Observatório PRO | Fase 1 em andamento em `/observatorio`: entitlement `observatoryAccess` (`Free=false`, `PRO ativo=true`), gate server-side, cache privado/no-store, robots estrito, shell standalone, contratos de camada, `LayerManager` e `RenderGovernor` abstrato já estão na `main`; rota segue fora de sitemap/navegação/public-routes e ainda **não possui Cesium, globo, base ou terreno reais** |
| Observação atual | Rede de Monitoramento Hidrometeorológico da Defesa Civil RS; apenas estações confirmadas de Pelotas com leitura de até 30 min podem compor o `Agora` |
| Embrapa | Coletor operacional/scheduler continuam aposentados; `/estacao-embrapa-pelotas` voltou como consulta server-side direta, somente leitura, à página pública da Embrapa, sem alterar a fonte do `Agora` |
| Previsão | Open-Meteo principal; MET Norway contingência quando aplicável |
| Página Hoje | `/tempo-hoje-pelotas` usa hero editorial próprio e sem fotografia; chama de leitura atual somente `current` observacional, identifica fonte/horário e, quando a medição local falta, rotula a série horária explicitamente como `Previsão da próxima hora`; corpo principal usa capítulos abertos e o Schema não anuncia mais a Embrapa como observação atual |
| Página Amanhã | `/tempo-amanha-pelotas` usa hero editorial claro em largura total, sem fotografia/tiles antigos e sem repetir o provedor no hero; mantém condição, temperatura, chuva, rajadas, comparação Hoje x Amanhã e FAQ; o contexto INMET/CPPMet-UFPel só aparece quando existe previsão real para amanhã, e o matcher textual da UFPel normaliza abreviações da recuperação diária (`Qui` → `quinta`, etc.) para não produzir falso estado de ausência |
| Página 15 dias | `/previsao-15-dias-pelotas` usa hero editorial próprio, sem foto/tiles/CTAs retail e sem herdar `TodayRetailHero`; corpo aberto preserva cards apenas nos dias individuais; a precedência global antiga que tratava a rota como retail foi removida, enquanto a barreira do corpo editorial permanece |
| Página Chuva | `/chuva-em-pelotas` usa hero editorial dedicado sem fotografia/CTAs e rail próprio; mantém chuva medida em 24 h separada do volume previsto hoje e em 7 dias, sem transformar chance ausente em zero ou somar janelas/origens diferentes |
| Página Vento | `/vento-em-pelotas` usa hero editorial dedicado sem fotografia/CTAs e rail próprio; só publica `Vento medido agora` quando há observação real e usa `Previsão da próxima hora` quando a medição falta; vento sustentado não substitui rajada ausente |
| INMET | Avisos e produtos oficiais conforme o contrato de cada integração; pipeline Gmail para previsão estruturada continua fail-closed para entrega |
| Radar / satélite / STSC | `/radar-e-satelite-pelotas` mantém radar REDEMET georreferenciado, satélite REDEMET, satélite INMET e STSC com horários reais, sequência e recuperação pós-hidratação; a página dedicada agora expõe seletor `Realçado`/`Infravermelho`/`Visível`, inicia em `realcada`, busca IR/Visível sob demanda em janela de 4 imagens, preserva a fonte real e não duplica o INMET quando ele assume como contingência; o canal Visível permanece REDEMET, nunca recebe fallback infravermelho e, sem luz solar, mostra estado de espera e a próxima janela recebida sem fabricar timestamp; ausência de quadro STSC com horário não vira zero raios; timeout interno do radar está em 4,2 s, abaixo dos 4,5 s do overview e 5 s do probe |
| Hidrologia | Laranjal, Lagoa dos Patos, Guaíba, SACE e Defesa Civil degradam independentemente; `/situacao-hidrologica-pelotas` usa inventário/cartografia ANA/SNIRH e concentra a explicação metodológica num fechamento curto; `/nivel-da-lagoa-dos-patos-laranjal` mostra ficha cadastral `87955001` e cronologia documentada do monitoramento no Trapiche, sem promover esses recursos a medição ANA |
| ANA 87955001 | Readiness/cross-check somente; inventário registra telemetria iniciada em 08/06/2026; `publishableMeasurement=false`; gate vertical exige referência confirmada, nivelamento/RN específico recuperado e continuidade vertical com `87955000` comprovada antes de qualquer reconsideração técnica |
| Enchente de 2001 | `/enchente-2001-pelotas` preserva 290 cm bruto e 190 cm consistido/estimado e pode exibir `Indice`/`Notas` da camada ANA `NotasConsistencia` somente quando houver registro real para `87955000`; isso não é nota do evento nem explicação da revisão |
| Defesa Civil dedicada | `/nivel-do-rio-jaguarao` e `/nivel-do-canal-sao-goncalo` são as duas intenções hidrológicas regionais promovidas para URL própria |
| Lagoa dos Patos | Hub + cinco localidades verificadas: Rio Grande, São Lourenço do Sul, Arambaré, São José do Norte e Itapuã/Viamão |
| Arquivo de enchentes | Hub + páginas de 1941, 2001, 2015 e 2024 |
| Historical Data Layer | Ativo; classes `observation`, `forecast`, `reanalysis` e `derived` separadas |
| Monitor de status | Supabase `pg_cron` + `pg_net`; monitoramento das fontes permanece separado da apresentação pública |
| Widget Builder | Fundação V1 publicada; conta cria e gerencia widgets por token público |
| Conta / Google | Fundação operacional parcial; E2E completo com contas descartáveis continua pendente |
| Service Worker / Web Push | Suspensos até estabilidade sustentada |
| GitHub Actions | Pushes atuais voltaram a abrir runs; a execução do Observatório precisa ser avaliada pelos steps/conclusão antes de declarar build/typecheck/testes aprovados |

## 3. Stack e budgets públicos

Stack principal: React 19, TypeScript 5.8, TanStack Start/Router, Vite 8, Nitro, Tailwind CSS 4, Supabase JS/SSR, MapLibre GL, Recharts e Zod.

**Cesium ainda não faz parte das dependências instaladas.** A arquitetura do Observatório prevê CesiumJS exclusivamente na superfície `/observatorio`, por lazy import, sem substituir MapLibre no portal convencional. A instalação foi adiada até poder atualizar `package.json`, `package-lock.json` e `bun.lock` de forma coerente com `npm ci`.

Budgets atuais:

- Home/Hoje/Amanhã/7 dias: shell-first quando aplicável;
- inteligência meteorológica compartilhada após hidratação: teto interno de 5 s;
- loaders meteorológicos secundários: 2,5 s por dependência;
- loaders hidrológicos dedicados: 2,5 s por dependência;
- Radar: 2,8 s no documento inicial;
- Radar pode fazer uma única recuperação no navegador quando a composição REDEMET não termina dentro do budget, sem apagar quadros já recebidos;
- previsão de 15 dias: 2,8 s.

Shell-first mantém a rota navegável durante a recuperação. Não autoriza transformar fallback em estado final quando a informação real ainda pode chegar.

## 4. Observação meteorológica e Embrapa

A observação atual da Home continua consolidada na Rede de Monitoramento Hidrometeorológico da Defesa Civil RS.

Contrato atual:

- seleção limitada às estações confirmadas de Pelotas;
- códigos atualmente protegidos por contrato: `DCRS-00039` e `DCRS-00062`;
- leitura com mais de 30 minutos não pode ser publicada como atual;
- previsão não preenche o `Agora` como se fosse medição;
- ausência de rajada permanece ausência de rajada;
- fonte e horário acompanham a leitura quando disponíveis.

A integração operacional antiga da Embrapa continua aposentada pela migration `20260908060000_retire_embrapa_collector.sql`.

A migration:

- desagenda `tempo-pelotas-embrapa-every-minute` e `tempo-pelotas-embrapa-collector` quando existentes;
- remove `weather_collector_settings` da estação `embrapa-cpact-sede-pelotas`;
- marca o snapshot operacional final como indisponível e encerra leases;
- resolve incidentes operacionais antigos sem apagar o histórico;
- remove trigger/funções específicas de espelhamento e coleta;
- preserva `weather_station_observations` e demais dados históricos já armazenados.

Em 09/09, após a página pública `Current_Monitor.htm` voltar a responder, a rota `/estacao-embrapa-pelotas` foi restaurada como **consulta isolada e somente leitura**. Ela usa um reader server-side próprio com timeout de 5 s, cache de 5 min e parser `windows-1252`, sem religar cron, collector, lease ou configuração antiga do Supabase.

Compatibilidade e limites atuais:

- `/estacao-embrapa-pelotas` voltou a renderizar página real;
- a rota permanece `noindex` e fora do sitemap; voltou ao megamenu `Explorar`, mas segue fora do footer enquanto a estabilidade da fonte é revalidada;
- `/api/weather/embrapa` continua `410 retired` e não voltou a oferecer a integração antiga;
- o reader restaurado não grava no banco nem reativa histórico automático;
- a Home e o `Agora` continuam usando a Rede da Defesa Civil RS;
- previsão Open-Meteo/MET Norway nunca preenche uma leitura ausente da Embrapa como se fosse observação;
- a página interna pode degradar para `partial` ou `unavailable` sem afetar as demais superfícies meteorológicas.

Documento da restauração: `docs/EMBRAPA_PAGE_RESTORATION_2026-09-09.md`.

Documentos históricos sobre o antigo coletor continuam válidos como registro do que existia, não como descrição do reader atual.

## 5. Transparência, navegação e shell público

### 5.1 Página canônica de dados e fontes

`/status-dos-dados` concentra a informação pública sobre:

- nome e instituição responsável por cada fonte;
- finalidade da fonte no portal;
- estado da última verificação;
- horário da verificação;
- acesso à fonte original quando aplicável;
- critérios de publicação de observação, previsão, alerta, radar/satélite e hidrologia;
- histórico de disponibilidade e incidentes quando disponível.

A copy pública usa estados compreensíveis. Termos como probe, upstream, readiness, kill switch, last-good e detalhes de arquitetura não devem ser necessários para o visitante entender se um dado está disponível.

`ServiceStatus` admite `dataCondition?: string` para separar “integração respondendo” de “condição do dado/medição”. O monitor agora preenche e a interface renderiza esse campo somente em cinco serviços com semântica suficiente: nível do Laranjal, nível do Guaíba, rede regional da Lagoa dos Patos, observação atual da Defesa Civil RS e ANA `87955001`. Previsão, INMET, CPPMet, radar e satélite permanecem sem `dataCondition` nesta fase. A ANA pode aparecer como `Em implantação` enquanto a condição do dado informa separadamente que a medição não é publicada por referência vertical específica não confirmada; `sourceDataStatus` não é usado como selo público de qualidade nem abre o gate vertical.

A apresentação pública foi reorganizada em 08/09 para uma leitura editorial aberta. O hero ficou mais compacto, o resumo de estados virou uma faixa, e cada fonte ocupa uma única linha com três zonas no desktop: identidade, conteúdo/condição do dado e metadados de estado/horário/origem. A antiga grade de duas colunas foi aposentada. O histórico usa faixas e linhas abertas, e `Critérios de publicação` permanece no fim da página como fechamento educativo, depois das fontes e dos incidentes/disponibilidade.

### 5.2 Rotas de compatibilidade e páginas em revalidação

- `/metodologia` → 301 para `/status-dos-dados`;
- `/estacao-embrapa-pelotas` → página interna ativa, `noindex`, fora do sitemap, descoberta no megamenu `Explorar` e ainda sem promoção no footer;
- `/observatorio` → ferramenta interna PRO em Fase 1, `noindex/noarchive/nosnippet/noimageindex`, fora do sitemap, header, megamenu, footer e `public-routes`; não é superfície pública de descoberta.

A página Embrapa voltou como superfície funcional, não como restauração automática do antigo produto operacional. Reindexação, retorno ao footer e eventual uso como observação principal são decisões separadas.

### 5.3 Header e footer

O header público canônico é `src/production/components/home-editorial-header.tsx`, entregue por `SiteHeader`.

Áreas principais:

- Agora;
- Previsão;
- Satélites e Radares;
- Águas;
- Região;
- Explorar;
- Avisos.

`Explorar` concentra clima, Estação Embrapa, câmeras, geadas, histórico, blog e `Dados e fontes`. `/metodologia` e `/observatorio` continuam ausentes do menu público.

A implementação paralela `src/components/layout/Header.tsx` e `Header.css` foi removida depois da migração dos contratos para o header canônico. Isso evita duas árvores de navegação divergirem novamente.

O footer compartilhado mantém descoberta editorial e aponta a transparência para `/status-dos-dados`; a lista completa de fornecedores não é repetida em todas as páginas. A página Embrapa ainda não foi reintroduzida no footer e o Observatório não é promovido publicamente nesta fase.

### 5.4 Proteção contra shell duplicado

Rotas que renderizam shell próprio precisam estar no conjunto standalone de `SiteLayout`.

A regressão de header/footer duplicados foi corrigida para, entre outras superfícies, `/nivel-do-canal-sao-goncalo` e `/nivel-do-rio-jaguarao`. O contrato `tests/standalone-route-shell.test.ts` detecta shells próprios por:

- `InternalWeatherPageShell`;
- `ContentPageShell`;
- `DataExperiencePageShell`;
- `ObservationDataPageShell`;
- uso direto de `SiteHeader` + `SiteFooter`.

`/observatorio` foi incluída explicitamente em `standaloneRoutes` para que seu shell PRO não receba header/footer público por cima. A rota `/estacao-embrapa-pelotas` usa o shell genérico de página interna do `SiteLayout` e não deve ser adicionada ao conjunto standalone enquanto não renderizar shell próprio. A rota legada `/metodologia` permanece na lista standalone por compatibilidade, embora hoje redirecione antes de renderizar conteúdo.

## 6. SEO, rotas públicas e descoberta

`src/lib/public-routes.ts` mantém **58 URLs indexáveis = 35 fixas + 23 municipais**.

Uma URL nova só nasce quando existe:

- intenção de busca autônoma;
- fonte inequívoca;
- conteúdo distinto;
- referência de medição compreensível quando houver medição;
- canonical e Schema corretos;
- links internos úteis;
- contrato que impeça expansão acidental.

`/estacao-embrapa-pelotas` voltou funcionalmente, mas **não voltou ao inventário indexável**. Enquanto a fonte é revalidada, a rota usa `noindex`, permanece fora de `src/lib/public-routes.ts` e do sitemap. A presença no megamenu é somente descoberta interna e não altera esse contrato de indexação. `/metodologia` continua redirect de compatibilidade.

`/observatorio` também não integra o inventário indexável. O recurso é autenticado/PRO, possui robots estrito e permanece deliberadamente ausente de descoberta pública durante o desenvolvimento.

O estado de código, o build/sincronização, a propagação em `tempopelotas.com.br` e a descoberta/indexação por buscadores são provas diferentes.

## 7. Hidrologia

### 7.1 Laranjal

O contrato local não mistura séries com referências verticais diferentes:

1. **LabHidroSens/UFPel** permanece prioritário enquanto a leitura estiver `live`;
2. se o Lab estiver `stale` ou `unavailable`, consulta **CIEX/FURG — Pelotas (`sensor_7`)**;
3. se ambas as consultas correntes falharem, pode preservar last-known do próprio Lab, sempre com estado/timestamp reais.

CIEX/FURG:

- página pública: `https://monitoramentolagoadospatos.com.br/`;
- API: `https://api-medidas-porto-7bni.onrender.com`;
- leitura atual: `/dados/sensor_7`;
- série recente: `/dados/sensor_7/grafico`;
- unidade recebida: `cm`;
- exibição em `m` é apenas conversão dimensional `cm → m`;
- referência declarada: Referencial vertical brasileiro — Marégrafo de Imbituba/SC.

LabHidroSens e CIEX/FURG não são recalibrados um pelo outro e seus valores absolutos não são subtraídos como se compartilhassem datum.

`/nivel-da-lagoa-dos-patos-laranjal` também consulta o cadastro oficial ANA/SNIRH da estação `87955001` por `CodigoAdicional` exato. Essa ficha usa somente metadados cadastrais como nome, município, rio/bacia, responsável, operadora, situação, equipamentos e datas publicadas. Ela não solicita valor atual, horário do último dado ou status da medição e não participa do seletor LabHidroSens → CIEX/FURG.

A mesma página traz uma cronologia editorial do monitoramento no Trapiche. Há três marcos editoriais fixos e um quarto marco cadastral gerado dinamicamente quando o inventário da ANA devolve início válido da telemetria:

- **09/05/2024** — trabalho técnico da UFPel/HidroSens registra medidor ultrassônico instalado no Trapiche durante a enchente, transmissão LoRaWAN e leitura máxima de 2,79 m segundo a régua local;
- **27/06/2025** — Prefeitura de Pelotas informa instalação, por Defesa Civil e Engenharia Hídrica/UFPel, de sensor de nível da ANA próximo ao Trapiche;
- **08/06/2026** — o inventário público ANA/SNIRH registra `LARANJAL 87955001` como identidade telemétrica, sob responsabilidade e operação da UFPel; a interface deriva esse marco de `EstacaoTelemetricaInicio` e não fixa a data manualmente;
- **16/08/2026** — monitoramento de Pelotas passa a integrar a rede CIEX/FURG, com dados enviados ao campus Anglo da UFPel e posteriormente disponibilizados para ANA e CIEX conforme relato do HidroSens.

A cronologia é contexto, não junção de séries. O trabalho de 2024 afirma que os medidores foram comparados com réguas linimétricas locais e explicita referência a Imbituba para a régua do **Canal São Gonçalo**, mas não declara a mesma referência para a régua do Trapiche no trecho recuperado. O marco de 08/06/2026 liga diretamente o código `87955001` à identidade telemétrica atual, mas não prova que o sensor anunciado em 2025 seja o mesmo hardware: o anúncio municipal não publicou código de estação, número de série, RN ou memória de instalação.

A remoção do código ThingsBoard só deve ocorrer após confirmação externa de encerramento definitivo do LabHidroSens. Se isso ocorrer, a limpeza deve ser completa, sem manter código-fantasma.

### 7.2 Rede Defesa Civil RS

Páginas meteorológicas enriquecidas por associação verificada:

| Página | Estação |
| --- | --- |
| `/tempo-em/turucu-rs` | `DCRS-00126` |
| `/tempo-em/cristal-rs` | `DCRS-00125` |
| `/tempo-em/jaguarao-rs` | `DCRS-00115` |
| `/tempo-em/arroio-grande-rs` | `DCRS-00050`, `DCRS-00111` |
| `/tempo-em/bage-rs` | `DCRS-00041` |
| `/tempo-em/capao-do-leao-rs` | `DCRS-00063` |
| `/tempo-em/santa-vitoria-do-palmar-rs` | `DCRS-00049` |

Somente duas intenções hidrológicas foram promovidas:

- `DCRS-00115` → `/nivel-do-rio-jaguarao`;
- `DCRS-00063` → `/nivel-do-canal-sao-goncalo`.

A associação pública usa `stationCode` exato. Distância, nome parecido ou proximidade não criam link dedicado.

### 7.3 Lagoa dos Patos

Cluster indexável:

```text
/nivel-da-lagoa-dos-patos
  ├─ /nivel-da-lagoa-dos-patos/rio-grande
  ├─ /nivel-da-lagoa-dos-patos/sao-lourenco-do-sul
  ├─ /nivel-da-lagoa-dos-patos/arambare
  ├─ /nivel-da-lagoa-dos-patos/sao-jose-do-norte
  └─ /nivel-da-lagoa-dos-patos/itapua-viamao
```

Registry canônico: `src/lib/hydrology/hydrology-localities.ts`.

Cada ponto preserva a própria referência. O portal não publica um “nível único da Lagoa” aplicável a todas as localidades.

### 7.4 ANA / RHN

A ANA/RHN tem quatro papéis distintos no produto:

1. **leitura atual do Laranjal** — `87955001` permanece readiness/cross-check, sem terceira ingestão pública nesta fase; `publishableMeasurement=false` permanece obrigatório;
2. **ficha cadastral da 87955001** — `/nivel-da-lagoa-dos-patos-laranjal` consulta a estação exata no inventário público da RHN e mostra somente metadados cadastrais concretos, sem solicitar `Ult_Dado`, `Data_ult_dado`, `Status_Dado` ou qualquer medição;
3. **contexto regional público** — `/situacao-hidrologica-pelotas` consulta o inventário oficial de estações em até 180 km de Pelotas e pode desenhar rios principais e massas d'água das camadas públicas ANA/SNIRH;
4. **consistência histórica da 87955000** — `/enchente-2001-pelotas` consulta `NotasConsistencia/MapServer/0` exclusivamente para a estação histórica e só apresenta `Indice` e `Notas` quando a fonte devolve registro real aproveitável.

A ficha `87955001` é cadastral e fail-closed. Campos ausentes não viram conteúdo de preenchimento e a seção some se a estação não aparecer ou o contrato da fonte não puder ser validado. O antigo aviso genérico de “integração em implantação” foi removido da página do Laranjal em favor dessa informação concreta.

Em `/situacao-hidrologica-pelotas`, o antigo `OfficialDataAccessNotice` genérico também foi retirado. A explicação fica no fim da página em um fechamento curto, com quatro cuidados: não equiparar réguas sem referência comum, respeitar o horário da leitura, não transformar o inventário ANA em nova medição do Laranjal e seguir autoridades nas decisões de segurança.

O gate de medição da `87955001` foi endurecido após auditoria dos HARs, das camadas públicas e da cronologia documental do Trapiche. O adapter mantém três bloqueios independentes:

- `vertical-reference-unconfirmed`;
- `station-specific-leveling-not-recovered`;
- `historical-current-vertical-continuity-unproven`.

O tráfego do Hidro-Telemetria confirma que existe uma superfície de ficha de estação e identifica a `87955001`, mas a captura disponível não recupera o documento específico de RNs/nivelamento necessário. A camada `CotasReferencia2` fornece nível/status, porém não publica RN, benchmark, altitude do zero da régua, datum vertical ou cadeia de nivelamento.

Uma investigação adicional do HAR recuperou o contrato de navegação da linha `LARANJAL 87955001`: os atalhos da estação usam `setCodEstacao(this,314652131,87955001)` e a ficha aponta para `EstacoesCadastro.aspx`. O valor `314652131` é preservado apenas como **seletor observado na interface**; sua semântica interna não é inferida nem publicada como ID, coordenada, RN ou referência. Os demais HARs fornecidos não contêm esse seletor/código e não recuperaram a ficha específica com nivelamento.

O inventário da RHN registra a identidade `87955001` como telemétrica com início em **08/06/2026**, sob responsabilidade/operação da UFPel. Esse é o primeiro marco documental recuperado que liga diretamente o código à identidade telemétrica atual do Laranjal. Ele não fecha o elo com o sensor ANA anunciado pela Prefeitura em 27/06/2025, porque a notícia não publica código ANA, número de série, ficha de instalação, RN ou memória de nivelamento. Nas superfícies públicas pesquisadas em 08/09/2026, esse documento de ligação não foi localizado.

Referências `WGS_1984`/`D_WGS_1984` observadas em requests cartográficos pertencem ao sistema espacial do mapa e não são aceitas como datum vertical da régua. Da mesma forma, `Altitude` cadastral isolada do inventário não é tratada como altitude do zero da régua.

A pista de `-0,02 m` registrada em 2017 para a identidade histórica `87955000` não é transferida para `87955001` sem documento que comprove RN, zero físico e continuidade de nivelamento. Um status de dado `Normal`, `Aprovado` ou equivalente também não remove o gate vertical.

A cronologia 2024–2026 comprova evolução do monitoramento físico no Trapiche e aproxima os contextos HidroSens, ANA e CIEX/FURG, mas não comprova identidade de hardware nem continuidade vertical entre eles.

O inventário regional publica somente metadados concretos devolvidos pela rede, como nome, município, rio/bacia, responsável, operadora, situação cadastral e instrumentos. Proximidade não cria associação automática com uma página ou régua.

Cartografia oficial usada no mapa regional:

- `RiosPrincipais/MapServer/0` — rios principais, com nome `NORIOCOMP` quando publicado;
- `Hidrografia/MapServer/2` — massas d'água, com `NOME_ESP`/`NOME_ALT` quando publicados.

As geometrias são recortadas e simplificadas somente para desenho no mapa. Não produzem medição, distância hidrológica, área de risco, alerta ou diagnóstico de inundação. Inventário, rios e massas d'água degradam isoladamente.

Para `NotasConsistencia`, o portal preserva a classificação publicada pela própria camada nos estados `OTIMO`, `BOM`, `RAZOAVEL`, `RUIM` e `PESSIMO` e a nota `Notas` sem inventar denominador, percentual ou escala. Os campos `c1` a `c16` não são consultados nem interpretados porque a definição pública da camada não documenta sua semântica individual.

Essa avaliação pertence à estação/série histórica, não à enchente de 08/10/2001. Ela não explica automaticamente a diferença entre 290 cm bruto e 190 cm consistido/estimado, não resolve a referência vertical de 2001 e não autoriza fundir `87955000` com `87955001`. Se a consulta falhar, não houver registro ou não houver classificação/nota útil, a seção pública fica ausente.

A série histórica `87955000` foi recuperada para pesquisa e continua separada da telemetria atual até existir documentação de zero/RN/datum que autorize qualquer junção.

Detalhes: `docs/ANA_RHN_INTEGRATION.md`, `docs/ANA_RHN_REGIONAL_INVENTORY_2026-09-08.md`, `docs/ANA_RHN_CONSISTENCY_87955000_2026-09-08.md`, `docs/ANA_RHN_LARANJAL_87955001_PROFILE_2026-09-08.md`, `docs/ANA_RHN_VERTICAL_REFERENCE_GATE_87955001_2026-09-08.md`, `docs/LARANJAL_MONITORING_TIMELINE_2024_2026.md` e `docs/LARANJAL_HIDRO_EXPORT_AUDIT_2026-09-06.md`.

## 8. Radar, satélite e alertas

`/radar-e-satelite-pelotas` mantém radar REDEMET georreferenciado, satélite REDEMET, satélite INMET e STSC como produtos complementares, com horários reais, sequência de imagens e recuperação pós-hidratação.

Contrato atualizado em 08/09/2026:

- janela pública inicial compacta de 4 imagens no satélite Realçado, 4 imagens de radar e 6 leituras STSC;
- SSR com budget de 2,8 s no documento inicial;
- uma recuperação pós-hidratação quando a composição inicial estiver incompleta, cobrindo também `inmetSatellite` como coleção visível;
- merge conservador, sem apagar quadros já recebidos;
- a página dedicada inicia em `Realçado` e expõe seletor acessível para `Realçado`, `Infravermelho` e `Visível`;
- `Infravermelho` e `Visível` são consultados sob demanda no endpoint existente `/api/redemet/satellite?type=<tipo>&frames=4`, com cancelamento da consulta anterior em troca rápida e cache de sessão da última resposta recebida;
- fonte, produto, quantidade de imagens e horário do resumo/painel principal acompanham o produto selecionado em vez de permanecer presos ao Realçado do loader;
- quando Realçado ou Infravermelho usam o INMET como contingência, a mesma coleta INMET não é contada nem renderizada novamente como painel complementar;
- o canal Visível nunca recebe fallback infravermelho; durante a noite, a resposta `availabilityReason=daylight` vira estado público `Aguardando luz solar`, podendo mostrar `nextExpectedAt` com formatação específica de horário futuro e sem inventar uma coleta;
- falha do fetch client-side sem cache produz camada vazia com `updatedAt` vazio; nenhum `new Date()` é usado para fabricar atualização;
- ausência de quadro STSC com horário utilizável não vira zero raios: zeros só aparecem quando existe quadro válido com zero pontos;
- timeout interno do radar está em 4,2 s, abaixo do teto de 4,5 s do overview e de 5 s do probe independente;
- satélite/radar/trovoada não viram alerta oficial;
- falha de integração não vira afirmação de indisponibilidade global da fonte.

Antes dessas correções, o status público observado mostrava radar REDEMET oscilante, satélite REDEMET e STSC operacionais e satélite INMET complementar sem coleta utilizável; isso descreve a integração do portal naquele momento, não a disponibilidade global das instituições.

Rajada ausente no contexto do radar permanece `Não informado`; vento sustentado não é usado como substituto.

INMET continua sendo a origem dos avisos meteorológicos oficiais consumidos pelo portal. Falha na consulta deve aparecer como indisponibilidade de confirmação, nunca como “sem alerta”.

Referências: `docs/REDEMET_RADAR_SATELLITE_AUDIT_2026-09-08.md` e `tests/redemet-data-display-audit.test.ts`.

## 9. Pipeline INMET por Gmail

O pipeline de previsões por e-mail do INMET está preparado sem IA e reutiliza o App Connector Gmail em rota server-only protegida por `CRON_SECRET`.

Estado:

- fluxo normal `task=inmet-gmail` é fail-closed enquanto `INMET_GMAIL_PUSH_ENABLED` não for exatamente `true`;
- `task=inmet-gmail-check` pode validar a integração sem disparar Web Push;
- o e-mail funciona como gatilho; números públicos vêm da previsão estruturada do INMET;
- autenticação exige evidência direta alinhada ao domínio `inmet.gov.br`;
- várias mensagens válidas são coalescidas para a mais recente;
- deduplicação usa conteúdo público + data local;
- previsão normal permanece `daily_summary`, não é promovida automaticamente a `weather_alerts`;
- scheduler versionado chama o fluxo a cada 10 minutos, mas execução real não está comprovada enquanto GitHub Actions não alocar steps.

Documento: `docs/INMET_GMAIL_PUSH.md`.

## 10. Arquivo histórico e colaboração

Núcleo de enchentes:

```text
/historia-das-enchentes-pelotas
  ├─ /enchente-1941-pelotas
  ├─ /enchente-2001-pelotas
  ├─ /enchente-2015-pelotas
  └─ /enchente-2024-pelotas-laranjal
```

Regras:

- fonte histórica permanece identificada;
- lacuna documental não é preenchida por inferência;
- análise posterior não é convertida em boletim contemporâneo;
- bruto e consistido permanecem distinguíveis quando ambos existem;
- cotas de anos/estações diferentes não são comparadas sem referência suficiente.

A pesquisa de 2001 preserva separadamente 290 cm bruto e 190 cm consistido/estimado em 08/10/2001, sem apresentar 2,90 m como única cota definitiva. A relação vertical entre `87955000` e `87955001` continua não comprovada. A nova consulta `NotasConsistencia` acrescenta somente metadado oficial de consistência da estação quando disponível; não é usada para escolher silenciosamente uma das duas versões históricas.

Em 2015, quatro corpos de boletins municipais continuam não recuperados; próximos caminhos são acervo institucional, backup do CMS/banco municipal, Defesa Civil, Sanep e hemerotecas.

Colaboração histórica:

- tabela `public.historical_contributions`;
- bucket privado `historical-contributions`;
- até 5 anexos, máximo 15 MB cada;
- RLS limita o colaborador aos próprios registros;
- envio entra como `pending` e nunca altera automaticamente a página pública;
- autorização de publicação é separada de `rights_confirmed`.

Moderação V1 vive em `/painel`, exige sessão, e-mail confirmado e allowlist server-only `MOBI_PORTAL_ADMIN_EMAILS`. `accepted` e `rejected` são estados finais na V1 e aceitação para pesquisa não significa publicação.

## 11. Historical Data Layer

O arquivo canônico separa:

- `observation`;
- `forecast`;
- `reanalysis`;
- `derived`.

Fontes novas exigem governança antes de ingestão. O histórico Embrapa já armazenado não é apagado pela aposentadoria do coletor; a página restaurada não voltou a alimentar automaticamente esse arquivo.

Se a série ANA `87955000` for importada futuramente, bruto e consistido precisam continuar distinguíveis por proveniência/status.

## 12. Widget Builder, conta, Observatório e segurança

Área autenticada de widgets: `/widgets`, descoberta em `/painel`.

Módulos V1:

- `nivel-laranjal`;
- `status-tempo-agora`.

`/widgets/embed.js` cria iframe para `/embed/widget?token=...`; `/embed/widget` é `noindex`.

A fundação do Observatório PRO usa o mesmo sistema de conta já existente, sem criar autenticação paralela. `src/lib/auth/account-access.ts` deriva `observatoryAccess` do acesso efetivo; `src/observatory/data/observatory-access.functions.ts` resolve usuário e entitlement no servidor e falha fechado. Visitante é redirecionado a `/conta?next=/observatorio`; Free recebe estado privado sem montar `ObservatoryShell`; PRO ativo recebe o shell interno. Nenhuma migration ou alteração de Supabase foi necessária nesta fatia.

Segurança ativa inclui RLS, secrets server-side, gate geográfico quando aplicável, CSP, rate limiting, allowlists/proxies de fontes e logs sanitizados. O Observatório acrescenta `Cache-Control: private, no-store`, `Vary: Cookie, Authorization` e `X-Robots-Tag` estrito na fundação de acesso.

E2E autenticado completo de Widget Builder, conta, contribuição e Observatório continua pendente.

## 13. Testes, CI e deploy

Contratos versionados cobrem meteorologia, navegação, shells, hidrologia, REDEMET, histórico, widgets, enchentes e colaboração.

A consolidação de 08–12/09 atualizou contratos para:

- `/status-dos-dados` como única superfície pública indexável de transparência;
- `dataCondition` público em `/status-dos-dados` separado de `state`/`detail` e restrito nesta fase a Laranjal, Guaíba, rede regional da Lagoa, Defesa Civil RS e ANA `87955001`; o contrato `tests/data-status-data-condition.test.ts` impede espalhar a semântica para outras fontes sem definição própria;
- visual editorial de `/status-dos-dados` em linhas abertas, sem antiga grade de duas colunas, com condição do dado separada do badge de estado, histórico em faixas/linhas e critérios de publicação no fechamento; protegido por `tests/data-status-editorial-visual.test.ts`;
- redirect 301 de `/metodologia` mantido;
- `/estacao-embrapa-pelotas` restaurada em 09/09 como página interna real, com reader server-side direto, `noindex`, fora do sitemap e do footer, novamente descoberta no megamenu `Explorar` e sem reativar o coletor aposentado; protegida por `tests/embrapa-station-page.test.ts` e pelo contrato de separação em `tests/retired-weather-source-cleanup.test.ts`;
- fundação silenciosa do Observatório em `/observatorio`, com entitlement PRO, gate server-side, robots estrito, shell standalone, contratos de camada, `LayerManager` e `RenderGovernor`; protegida por `tests/observatory-foundation.test.ts`, incluído em `npm run test:contracts`; o teste também impede declarar Cesium instalado antes de os lockfiles serem atualizados corretamente;
- header canônico `HomeEditorialHeader` sem implementação paralela e com a Estação Embrapa novamente em `Explorar > Observação e contexto`;
- footer compartilhado sem inventário repetido de fornecedores;
- overlay fotográfico da Home em preto neutro, com opacidade geral reduzida e blur de 10 px mascarado para desaparecer antes da área direita da fotografia; protegido por `tests/home-hero-overlay-and-recovery.test.ts`;
- proteção contra shell duplicado em rotas autocontidas;
- `/tempo-hoje-pelotas` com hero editorial route-scoped, sem fotografia/tiles/CTAs, separação explícita entre observação atual e próxima hora prevista, corpo aberto e referência SEO antiga da Embrapa removida;
- `/tempo-amanha-pelotas` com hero editorial sem fotografia/tiles e sem rótulo de provedor, corpo aberto e índice de capítulos visualmente reduzido; contexto INMET/CPPMet-UFPel só é renderizado quando há conteúdo real, e o matcher da previsão textual CPPMet normaliza dias abreviados da recuperação diária (`Qui`/`Sex` etc.) para os nomes completos antes da comparação;
- `/previsao-15-dias-pelotas` com hero editorial próprio, rail independente do shell genérico, sem foto/tiles/CTAs `TodayRetailHero`, capítulos principais abertos e rótulos heurísticos de risco removidos; a precedência retail antiga foi aposentada;
- `/chuva-em-pelotas` com hero editorial dedicado, rail próprio e separação de chuva observada em 24 h, prevista hoje e prevista em 7 dias, sem transformar ausência em zero;
- `/vento-em-pelotas` com hero editorial dedicado, rail próprio e distinção entre vento observado e previsão da próxima hora; vento sustentado não substitui rajada ausente;
- `/radar-e-satelite-pelotas` com seletor `Realçado`/`Infravermelho`/`Visível`, Realçado vindo do loader recuperável, IR/Visível consultados sob demanda, AbortController em troca rápida, estado noturno específico do Visível, horário futuro formatado separadamente, contingência INMET sem duplicação e fallback client-side sem timestamp fabricado; protegido por `tests/redemet-data-display-audit.test.ts`;
- contratos antigos de mapa REDEMET reconciliados com a implementação MapLibre atual: gesto cooperativo, player interativo na faixa inferior e controles nativos dentro da área real do mapa, sem reintroduzir `pointer-events:none` no player;
- aposentadoria da pilha fotográfica compartilhada `TodayRetailHero.css`, `TodayRetailHeroPhoto.css`, `TodayRetailHeroRefinement.css` e `today-retail-hero-backgrounds.ts`; `InternalWeatherCleanHero.css` fica restrito ao Meteograma;
- inventário regional ANA/SNIRH em `/situacao-hidrologica-pelotas`, com mapa MapLibre, hidrografia oficial opcional e separação explícita da medição atual do Laranjal;
- fechamento educativo de `/situacao-hidrologica-pelotas` reduzido a regras de interpretação realmente necessárias, sem `OfficialDataAccessNotice` genérico no meio da experiência;
- `NotasConsistencia` da histórica `87955000` em `/enchente-2001-pelotas`, fail-closed e sem interpretar `c1` a `c16` ou converter `Notas` em percentual/nota de escala inventada;
- ficha cadastral exata da `87955001` em `/nivel-da-lagoa-dos-patos-laranjal`, sem solicitar medição ANA e sem participar do seletor de nível atual;
- gate vertical da `87955001` com três bloqueios independentes e prova negativa explícita contra uso de WGS 84, `Altitude` cadastral isolada ou status de qualidade como referência da régua;
- cronologia editorial 2024–2026 do monitoramento no Trapiche com datas e fontes nomeadas, incluindo marco cadastral dinâmico da telemetria `87955001`, sem fabricar continuidade de hardware, zero, RN ou datum entre HidroSens, ANA, CIEX/FURG e os códigos `87955000`/`87955001`.

### 13.1 GitHub Actions

Os pushes da fundação do Observatório voltaram a abrir runs do workflow `Qualidade` em 12/09. Isso é diferente do estado observado em 08/09, quando jobs encerravam sem steps.

Até a execução atual concluir e os jobs/steps serem inspecionados, não declarar `npm test`, build, typecheck, lint, `routes:check` ou browser E2E como aprovados para esta entrega.

### 13.2 Estado de deploy

Manter separados:

1. código versionado na `main`;
2. commit absorvido/buildado pela plataforma de deploy;
3. deploy propagado em `tempopelotas.com.br`;
4. URL descoberta/indexada por mecanismo de busca.

Não usar crawler, runtime marker isolado ou screenshot de preview como prova única de propagação canônica.

## 14. Próximas prioridades

1. Fechar a própria Fase 1 do Observatório: instalar Cesium pelo fluxo normal quando houver executor/créditos para regenerar `package-lock.json` e `bun.lock`, materializar assets, criar `ObservatoryViewer`, base keyless, Re:Earth Terrain com fallback, lazy import e validação de CSP/build sem iniciar radar/satélite/STSC antes disso.
2. Executar typecheck e os contratos de navegação/transparência assim que houver executor funcional, sem corrigir falhas fora do escopo apenas para produzir verde.
3. Confirmar no domínio canônico o redirect 301 de `/metodologia` e a reabertura `noindex` de `/estacao-embrapa-pelotas`, incluindo leitura real, estado indisponível, atalho no megamenu e permanência fora do sitemap.
4. Observar a estabilidade do `Current_Monitor.htm` em leituras consecutivas antes de discutir retorno da Embrapa ao `Agora`, ao histórico automático, ao sitemap/indexação ou ao footer.
5. Confirmar propagação de `/nivel-do-rio-jaguarao` e `/nivel-do-canal-sao-goncalo`, incluindo HTTP, canonical, Schema, sitemap e links internos.
6. Confirmar o smoke do hub `/nivel-da-lagoa-dos-patos` e das cinco páginas locais.
7. Observar Search Console antes de promover outra estação da Defesa Civil; não expandir automaticamente Turuçu, Cristal, Arroio Grande, Bagé ou Santa Vitória do Palmar.
8. Configurar `MOBI_PORTAL_ADMIN_EMAILS` no runtime e validar Moderação V1 com conta autorizada e contribuição descartável.
9. Fazer E2E autenticado do Widget Builder e do fluxo de contribuição com conta descartável.
10. Executar manualmente o workflow INMET Gmail em modo `check` quando houver runner funcional e comprovar uma mensagem real de previsão de Pelotas antes de reativar Web Push.
11. Confirmar externamente o destino do LabHidroSens; somente com encerramento definitivo comprovado remover ThingsBoard e promover CIEX/FURG a fonte local única.
12. Continuar a recuperação documental das enchentes de 2001 e 2015 pelos caminhos institucionais já identificados.
13. Validar visualmente a família `/tempo-hoje-pelotas`, `/tempo-amanha-pelotas`, `/previsao-7-dias-pelotas`, `/previsao-15-dias-pelotas`, `/chuva-em-pelotas` e `/vento-em-pelotas` em desktop e mobile depois da propagação, conferindo rails, primeira dobra, estados indisponíveis e responsividade sem tratar preview isolado como prova de produção.
14. Validar no preview/domínio o inventário e a hidrografia ANA de `/situacao-hidrologica-pelotas`, o retorno real de `Indice`/`Notas` para `87955000`, a ficha `87955001` e a cronologia 2024–2026 em `/nivel-da-lagoa-dos-patos-laranjal`.
15. Para `87955001`, priorizar a recuperação de ficha de estação/ficha de campo e documentação de RN/nivelamento do sensor. Também buscar documento que ligue explicitamente o sensor ANA anunciado em 27/06/2025 ao código `87955001`; o início cadastral de telemetria em 08/06/2026 e o seletor de ficha observado no HAR estreitam a investigação, mas não substituem essa prova.
16. Validar no preview e no domínio canônico o novo desenho editorial de `/status-dos-dados`, incluindo a linha `Condição do dado`, responsividade das linhas de fonte, histórico aberto e estados live/stale/unavailable, sem tratar preview isolado como prova de produção.
17. Validar no preview e no domínio canônico `/radar-e-satelite-pelotas` depois da propagação: alternância Realçado/IR/Visível, estado noturno do Visível com próxima janela quando recebida, fonte/horário mudando com o produto, contingência INMET sem duplicação, radar REDEMET carregando/sequenciando, STSC distinguindo ausência de coleta de zero real e estabilidade do radar com budget interno de 4,2 s.
18. Manter Service Worker/Web Push suspensos até estabilidade sustentada.

## 15. Documentos principais

- `docs/TEMPO_PELOTAS_OBSERVATORIO_3D_ARCHITECTURE.md` — arquitetura e fases do Observatório PRO;
- `docs/TEMPO_PELOTAS_OBSERVATORIO_FOUNDATION_2026-09-12.md` — estado executável da Fase 1, entregas e pendências do runtime Cesium;
- `docs/DEFESA_CIVIL_DEDICATED_PAGE_GATE_2026-09-05.md` — gate editorial de páginas dedicadas;
- `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md` — integração da Rede Defesa Civil RS;
- `docs/PUBLIC_ROUTE_RESILIENCE.md` — resiliência, budgets e estados de dados;
- `docs/DATA_STATUS_MONITOR_RECOVERY_2026-08-28.md` — monitor e scheduler;
- `docs/DATA_STATUS_EDITORIAL_REFRESH_2026-09-08.md` — contrato visual/editorial da central pública de dados e fontes;
- `docs/EMBRAPA_PAGE_RESTORATION_2026-09-09.md` — retorno isolado da página interna da Embrapa, sem reativar collector/Home;
- `docs/REDEMET_OPERATIONS.md` — radar, satélite e STSC;
- `docs/REDEMET_RADAR_SATELLITE_AUDIT_2026-09-08.md` — auditoria da coleta, exibição, contingências e seletor Realçado/IR/Visível da página dedicada;
- `docs/SOURCE_RESILIENCE_INMET_REDEMET_2026-08-27.md` — contingências das fontes;
- `docs/ANA_RHN_INTEGRATION.md` — política ANA/RHN e separação 87955000/87955001;
- `docs/ANA_RHN_REGIONAL_INVENTORY_2026-09-08.md` — inventário e cartografia regional ANA/SNIRH;
- `docs/ANA_RHN_CONSISTENCY_87955000_2026-09-08.md` — contrato da camada de consistência da estação histórica 87955000;
- `docs/ANA_RHN_LARANJAL_87955001_PROFILE_2026-09-08.md` — ficha cadastral pública da estação 87955001 sem ingestão de medição;
- `docs/ANA_RHN_VERTICAL_REFERENCE_GATE_87955001_2026-09-08.md` — auditoria do gate de zero/RN/datum da telemetria atual;
- `docs/LARANJAL_MONITORING_TIMELINE_2024_2026.md` — cronologia documentada do monitoramento no Trapiche, sem equivalência automática entre equipamentos e referências;
- `docs/LARANJAL_HIDRO_EXPORT_AUDIT_2026-09-06.md` — auditoria dos arquivos Hidro;
- `docs/HISTORICAL_DATA_INVENTORY.md` — arquivo histórico;
- `docs/HISTORICAL_MODERATION_V1.md` — moderação histórica;
- `docs/FLOOD_2001_WIND_CONTEXT_2026-09-06.md` — pesquisa da enchente de 2001;
- `docs/FLOOD_2015_OFFICIAL_BULLETIN_INVENTORY_2026-09-05.md` — inventário dos boletins de 2015;
- `docs/FLOOD_2015_BULLETIN_RECOVERY_ATTEMPT_2026-09-06.md` — recuperação de boletins de 2015;
- `docs/WIDGET_BUILDER_ARCHITECTURE.md` — widgets, RLS e embeds;
- `docs/INMET_GMAIL_PUSH.md` — integração Gmail/INMET;
- `docs/MOBI_TICKET_CORE_INTEGRATION_2026-08-29.md` — consumidor MOBI Ticket;
- `docs/SEO_REFINEMENT_ENRICHMENT_2026-08-27.md` — SEO;
- `docs/TODAY_PAGE_VISUAL_REFRESH_2026-09-08.md` — contrato visual e semântico da página de hoje;
- `docs/TOMORROW_PAGE_VISUAL_REFRESH_2026-09-08.md` — contrato visual editorial da página de amanhã;
- `docs/FIFTEEN_DAY_PAGE_VISUAL_REFRESH_2026-09-08.md` — contrato visual editorial da previsão de 15 dias;
- `docs/RAIN_WIND_HERO_EDITORIAL_REFRESH_2026-09-08.md` — contrato dos heroes editoriais dedicados de chuva e vento;
- `docs/PRODUCTION_CUTOVER.md` — runbook de produção.

## 16. Regra de manutenção

Este arquivo deve responder rapidamente:

- o que existe na `main`;
- o que foi confirmado no runtime;
- quais fontes estão ativas, aposentadas, parciais ou suspensas;
- quais URLs são canônicas, redirects ou não indexáveis;
- quais decisões de produto limitam integrações;
- qual é o próximo trabalho real.

Não confundir código, build/sincronização, deploy canônico e descoberta/indexação. Histórico detalhado permanece nos documentos especializados.
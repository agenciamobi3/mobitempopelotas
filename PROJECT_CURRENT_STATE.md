# Tempo Pelotas — estado atual do projeto

Última atualização: 08/09/2026  
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
| Header público | `SiteHeader` reutiliza `HomeEditorialHeader`; a antiga implementação paralela `src/components/layout/Header.tsx` e seu CSS foram removidos em 08/09 |
| Footer público | Uma implementação compartilhada em `SiteFooter` → `Footer`; não publica inventário completo de fornecedores em todas as páginas |
| Transparência pública | `/status-dos-dados` é a página canônica de origem, uso, estado e horário das fontes |
| Rotas aposentadas | `/metodologia` e `/estacao-embrapa-pelotas` permanecem apenas como redirects 301 para `/status-dos-dados`; não são páginas indexáveis nem destinos de descoberta pública |
| SEO técnico | **58 URLs indexáveis = 35 fixas + 23 municipais** em `src/lib/public-routes.ts` |
| Observação atual | Rede de Monitoramento Hidrometeorológico da Defesa Civil RS; apenas estações confirmadas de Pelotas com leitura de até 30 min podem compor o `Agora` |
| Embrapa | Integração operacional aposentada em 08/09; histórico já armazenado é preservado, mas scheduler, configuração e automações específicas foram desligados/removidos |
| Previsão | Open-Meteo principal; MET Norway contingência quando aplicável |
| Página Amanhã | `/tempo-amanha-pelotas` usa hero editorial claro em largura total, sem fotografia/tiles antigos; mantém condição, temperatura, chuva, rajadas, comparação Hoje x Amanhã, contexto INMET/UFPel, FAQ e recuperação shell-first |
| INMET | Avisos e produtos oficiais conforme o contrato de cada integração; pipeline Gmail para previsão estruturada continua fail-closed para entrega |
| Radar / satélite / STSC | Página dedicada usa coletas reais e horário da própria fonte, com recuperação pós-hidratação quando o SSR não conclui a composição no budget |
| Hidrologia | Laranjal, Lagoa dos Patos, Guaíba, SACE e Defesa Civil degradam independentemente; `/situacao-hidrologica-pelotas` usa inventário/cartografia ANA/SNIRH e `/nivel-da-lagoa-dos-patos-laranjal` mostra ficha cadastral `87955001` e cronologia documentada do monitoramento no Trapiche, sem promover esses recursos a medição ANA |
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
| GitHub Actions | Runs recentes ainda terminam antes dos steps; em 08/09 a run de Qualidade `34280146623` concluiu `failure` com `steps: null` |

## 3. Stack e budgets públicos

Stack principal: React 19, TypeScript 5.8, TanStack Start/Router, Vite 8, Nitro, Tailwind CSS 4, Supabase JS/SSR, MapLibre GL, Recharts e Zod.

Budgets atuais:

- Home/Hoje/Amanhã/7 dias: shell-first quando aplicável;
- inteligência meteorológica compartilhada após hidratação: teto interno de 5 s;
- loaders meteorológicos secundários: 2,5 s por dependência;
- loaders hidrológicos dedicados: 2,5 s por dependência;
- Radar: 2,8 s no documento inicial;
- Radar pode fazer uma única recuperação no navegador quando a composição REDEMET não termina dentro do budget, sem apagar quadros já recebidos;
- previsão de 15 dias: 2,8 s.

Shell-first mantém a rota navegável durante a recuperação. Não autoriza transformar fallback em estado final quando a informação real ainda pode chegar.

## 4. Observação meteorológica e aposentadoria da Embrapa

A observação atual foi consolidada na Rede de Monitoramento Hidrometeorológico da Defesa Civil RS.

Contrato atual:

- seleção limitada às estações confirmadas de Pelotas;
- códigos atualmente protegidos por contrato: `DCRS-00039` e `DCRS-00062`;
- leitura com mais de 30 minutos não pode ser publicada como atual;
- previsão não preenche o `Agora` como se fosse medição;
- ausência de rajada permanece ausência de rajada;
- fonte e horário acompanham a leitura quando disponíveis.

A integração operacional da Embrapa foi aposentada pela migration `20260908060000_retire_embrapa_collector.sql`.

A migration:

- desagenda `tempo-pelotas-embrapa-every-minute` e `tempo-pelotas-embrapa-collector` quando existentes;
- remove `weather_collector_settings` da estação `embrapa-cpact-sede-pelotas`;
- marca o snapshot operacional final como indisponível e encerra leases;
- resolve incidentes operacionais antigos sem apagar o histórico;
- remove trigger/funções específicas de espelhamento e coleta;
- preserva `weather_station_observations` e demais dados históricos já armazenados.

Compatibilidade:

- `/estacao-embrapa-pelotas` → 301 para `/status-dos-dados`;
- endpoints antigos da Embrapa não voltam a oferecer a integração como fonte atual;
- menus, footer, atalhos da Home e links editoriais não promovem mais a estação aposentada.

Documentos históricos sobre o antigo coletor continuam válidos como registro do que existia, não como descrição do runtime atual.

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

### 5.2 Rotas de compatibilidade

- `/metodologia` → 301 para `/status-dos-dados`;
- `/estacao-embrapa-pelotas` → 301 para `/status-dos-dados`.

Essas rotas podem permanecer no route tree por compatibilidade, mas não pertencem ao inventário indexável, ao megamenu, ao footer nem ao smoke visual de páginas reais.

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

`Explorar` concentra clima, câmeras, geadas, histórico, blog e `Dados e fontes`. Não mantém atalhos para a estação Embrapa ou metodologia antiga.

A implementação paralela `src/components/layout/Header.tsx` e `Header.css` foi removida depois da migração dos contratos para o header canônico. Isso evita duas árvores de navegação divergirem novamente.

O footer compartilhado mantém descoberta editorial e aponta a transparência para `/status-dos-dados`; a lista completa de fornecedores não é repetida em todas as páginas.

### 5.4 Proteção contra shell duplicado

Rotas que renderizam shell próprio precisam estar no conjunto standalone de `SiteLayout`.

A regressão de header/footer duplicados foi corrigida para, entre outras superfícies, `/nivel-do-canal-sao-goncalo` e `/nivel-do-rio-jaguarao`. O contrato `tests/standalone-route-shell.test.ts` detecta shells próprios por:

- `InternalWeatherPageShell`;
- `ContentPageShell`;
- `DataExperiencePageShell`;
- `ObservationDataPageShell`;
- uso direto de `SiteHeader` + `SiteFooter`.

A rota legada `/metodologia` permanece na lista standalone por compatibilidade, embora hoje redirecione antes de renderizar conteúdo.

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

Não reintroduzir `/metodologia` ou `/estacao-embrapa-pelotas` no sitemap para preservar URLs antigas. Compatibilidade é resolvida pelos redirects permanentes.

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

O gate de medição da `87955001` foi endurecido após auditoria dos HARs, das camadas públicas e da cronologia documental do Trapiche. O adapter mantém três bloqueios independentes:

- `vertical-reference-unconfirmed`;
- `station-specific-leveling-not-recovered`;
- `historical-current-vertical-continuity-unproven`.

O tráfego do Hidro-Telemetria confirma que existe uma superfície de ficha de estação e identifica a `87955001`, mas a captura disponível não recupera o documento específico de RNs/nivelamento necessário. A camada `CotasReferencia2` fornece nível/status, porém não publica RN, benchmark, altitude do zero da régua, datum vertical ou cadeia de nivelamento.

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

`/radar-e-satelite-pelotas` mantém radar, satélite e STSC como produtos complementares, com horário real da própria fonte.

Contrato:

- janela pública compacta de 4 imagens e 6 leituras STSC;
- SSR com budget de 2,8 s;
- uma recuperação pós-hidratação quando a composição inicial estiver incompleta;
- merge conservador, sem apagar quadros já recebidos;
- satélite/radar/trovoada não viram alerta oficial;
- falha de integração não vira afirmação de indisponibilidade global da fonte.

Rajada ausente no contexto do radar permanece `Não informado`; vento sustentado não é usado como substituto.

INMET continua sendo a origem dos avisos meteorológicos oficiais consumidos pelo portal. Falha na consulta deve aparecer como indisponibilidade de confirmação, nunca como “sem alerta”.

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

Fontes novas exigem governança antes de ingestão. O histórico Embrapa já armazenado não é apagado pela aposentadoria da fonte operacional.

Se a série ANA `87955000` for importada futuramente, bruto e consistido precisam continuar distinguíveis por proveniência/status.

## 12. Widget Builder, conta e segurança

Área autenticada de widgets: `/widgets`, descoberta em `/painel`.

Módulos V1:

- `nivel-laranjal`;
- `status-tempo-agora`.

`/widgets/embed.js` cria iframe para `/embed/widget?token=...`; `/embed/widget` é `noindex`.

Segurança ativa inclui RLS, secrets server-side, gate geográfico quando aplicável, CSP, rate limiting, allowlists/proxies de fontes e logs sanitizados.

E2E autenticado completo de Widget Builder, conta e contribuição continua pendente.

## 13. Testes, CI e deploy

Contratos versionados cobrem meteorologia, navegação, shells, hidrologia, REDEMET, histórico, widgets, enchentes e colaboração.

A consolidação de 08/09 atualizou contratos para:

- `/status-dos-dados` como única superfície pública indexável de transparência;
- redirects 301 de `/metodologia` e `/estacao-embrapa-pelotas`;
- ausência dessas rotas na descoberta pública e no smoke visual de páginas reais;
- header canônico `HomeEditorialHeader` sem implementação paralela;
- footer compartilhado sem inventário repetido de fornecedores;
- retirada de links públicos para a antiga Estação Embrapa;
- proteção contra shell duplicado em rotas autocontidas;
- `/tempo-amanha-pelotas` com hero editorial sem fotografia/tiles, corpo aberto e índice de capítulos visualmente reduzido, preservando dados, fontes, SEO e estados indisponíveis;
- inventário regional ANA/SNIRH em `/situacao-hidrologica-pelotas`, com mapa MapLibre, hidrografia oficial opcional e separação explícita da medição atual do Laranjal;
- `NotasConsistencia` da histórica `87955000` em `/enchente-2001-pelotas`, fail-closed e sem interpretar `c1` a `c16` ou converter `Notas` em percentual/nota de escala inventada;
- ficha cadastral exata da `87955001` em `/nivel-da-lagoa-dos-patos-laranjal`, sem solicitar medição ANA e sem participar do seletor de nível atual;
- gate vertical da `87955001` com três bloqueios independentes e prova negativa explícita contra uso de WGS 84, `Altitude` cadastral isolada ou status de qualidade como referência da régua;
- cronologia editorial 2024–2026 do monitoramento no Trapiche com datas e fontes nomeadas, incluindo marco cadastral dinâmico da telemetria `87955001`, sem fabricar continuidade de hardware, zero, RN ou datum entre HidroSens, ANA, CIEX/FURG e os códigos `87955000`/`87955001`.

O smoke visual interno não trata mais redirects aposentados como páginas que deveriam possuir H1, shell e namespace visual próprios.

### 13.1 GitHub Actions

A infraestrutura do runner continua sendo uma limitação externa. Na run `34280146623`, ligada ao commit `02cb7c59f8fb3083f8c4433e1f4b2608fa7ad707`, o job `Testes, build, rotas, typecheck, lint e navegador` terminou como `failure` com `steps: null`.

Enquanto isso persistir, não declarar `npm test`, build, typecheck, lint, `routes:check` ou browser E2E como executados pelo GitHub Actions.

### 13.2 Estado de deploy

Manter separados:

1. código versionado na `main`;
2. commit absorvido/buildado pela plataforma de deploy;
3. deploy propagado em `tempopelotas.com.br`;
4. URL descoberta/indexada por mecanismo de busca.

Não usar crawler, runtime marker isolado ou screenshot de preview como prova única de propagação canônica.

## 14. Próximas prioridades

1. Executar typecheck e os contratos de navegação/transparência assim que houver executor funcional, sem corrigir falhas fora do escopo apenas para produzir verde.
2. Confirmar no domínio canônico os redirects 301 de `/metodologia` e `/estacao-embrapa-pelotas`, além de canonical/sitemap de `/status-dos-dados`.
3. Confirmar propagação de `/nivel-do-rio-jaguarao` e `/nivel-do-canal-sao-goncalo`, incluindo HTTP, canonical, Schema, sitemap e links internos.
4. Confirmar o smoke do hub `/nivel-da-lagoa-dos-patos` e das cinco páginas locais.
5. Observar Search Console antes de promover outra estação da Defesa Civil; não expandir automaticamente Turuçu, Cristal, Arroio Grande, Bagé ou Santa Vitória do Palmar.
6. Configurar `MOBI_PORTAL_ADMIN_EMAILS` no runtime e validar Moderação V1 com conta autorizada e contribuição descartável.
7. Fazer E2E autenticado do Widget Builder e do fluxo de contribuição com conta descartável.
8. Executar manualmente o workflow INMET Gmail em modo `check` quando houver runner funcional e comprovar uma mensagem real de previsão de Pelotas antes de reativar Web Push.
9. Confirmar externamente o destino do LabHidroSens; somente com encerramento definitivo comprovado remover ThingsBoard e promover CIEX/FURG a fonte local única.
10. Continuar a recuperação documental das enchentes de 2001 e 2015 pelos caminhos institucionais já identificados.
11. Validar visualmente `/tempo-amanha-pelotas` em desktop e mobile no domínio canônico após a propagação do novo bundle, sem tratar preview isolado como prova de produção.
12. Validar no preview/domínio o inventário e a hidrografia ANA de `/situacao-hidrologica-pelotas`, o retorno real de `Indice`/`Notas` para `87955000`, a ficha `87955001` e a cronologia 2024–2026 em `/nivel-da-lagoa-dos-patos-laranjal`.
13. Para `87955001`, priorizar a recuperação de ficha de estação/ficha de campo e documentação de RN/nivelamento do sensor. Também buscar documento que ligue explicitamente o sensor ANA anunciado em 27/06/2025 ao código `87955001`; o início cadastral de telemetria em 08/06/2026 estreita a sequência, mas não substitui essa prova.
14. Manter Service Worker/Web Push suspensos até estabilidade sustentada.

## 15. Documentos principais

- `docs/DEFESA_CIVIL_DEDICATED_PAGE_GATE_2026-09-05.md` — gate editorial de páginas dedicadas;
- `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md` — integração da Rede Defesa Civil RS;
- `docs/PUBLIC_ROUTE_RESILIENCE.md` — resiliência, budgets e estados de dados;
- `docs/DATA_STATUS_MONITOR_RECOVERY_2026-08-28.md` — monitor e scheduler;
- `docs/REDEMET_OPERATIONS.md` — radar, satélite e STSC;
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
- `docs/TOMORROW_PAGE_VISUAL_REFRESH_2026-09-08.md` — contrato visual editorial da página de amanhã;
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
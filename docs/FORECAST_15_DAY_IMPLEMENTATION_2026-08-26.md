# Previsão de 15 dias — implementação

Data original: 26/08/2026  
Última atualização: 09/09/2026  
Status: implementada na `main`; contingência estendida implantada no Supabase de produção; validação executável do app continua dependente da restauração dos runners do GitHub Actions  
Rota: `/previsao-15-dias-pelotas`

## 1. Objetivo

Atender a intenção de busca por previsão do tempo em Pelotas para 10 e 15 dias com uma única página útil, sem criar páginas quase idênticas apenas para trocar o número do horizonte.

A página de 15 dias complementa, e não substitui:

- `/tempo-hoje-pelotas`;
- `/tempo-amanha-pelotas`;
- `/previsao-7-dias-pelotas`.

Os primeiros 10 dias da mesma janela respondem à intenção de 10 dias. Não existe rota separada `/previsao-10-dias-pelotas`.

## 2. Fontes e contrato de coleta

A previsão estendida possui contrato próprio, diário e independente do fluxo de 7 dias.

Ordem operacional atual:

1. Open-Meteo Forecast API / Best Match, 15 dias;
2. Open-Meteo GFS API / NOAA GFS, 15 dias;
3. cache/Edge Function dedicada `open-meteo-extended-forecast`;
4. cache Open-Meteo compartilhado de 7 dias, somente como último recurso parcial.

A consulta estendida usa apenas:

- código meteorológico;
- temperatura mínima;
- temperatura máxima;
- probabilidade máxima de precipitação;
- precipitação acumulada prevista no dia;
- rajada máxima prevista.

Não há `current` nem séries `hourly` no contrato estendido.

Arquivos centrais:

- `src/lib/weather/extended-forecast.server.ts`;
- `src/lib/weather/extended-forecast.functions.ts`;
- `src/lib/weather/extended-forecast.types.ts`;
- `src/lib/weather/open-meteo-extended-edge.server.ts`;
- `supabase/functions/open-meteo-extended-forecast/index.ts`.

Decisão arquitetural permanente:

> Não aumentar o `forecast_days=7` do contrato Open-Meteo compartilhado pelo portal.

Home, Hoje, Amanhã e a página de 7 dias continuam usando o fluxo existente. A previsão de 15 dias permanece uma superfície própria e leve.

A documentação oficial do Open-Meteo permite horizonte de até 16 dias nas APIs utilizadas. A página solicita 15.

## 3. Performance, contingência e falha

A chamada estendida possui:

- Best Match e NOAA GFS consultados em paralelo;
- timeout direto de 2,2 s por candidato;
- budget interno total de 2,55 s;
- tentativa da Edge estendida limitada ao tempo restante, com teto de 900 ms;
- contingência legada limitada ao tempo restante, com teto de 500 ms;
- `cache: no-store` nas consultas upstream diretas;
- cache público do server function por 5 minutos;
- `stale-while-revalidate` por mais 5 minutos;
- teto público da página de 2,8 s por dependência em `extended-forecast-page-loader.ts`;
- estado `live` somente quando 15 dias utilizáveis são recebidos;
- estado `partial` quando apenas parte da janela pode ser publicada;
- estado `unavailable` quando não existe dia utilizável.

Entre respostas utilizáveis, vence a janela com maior número de dias. Em empate, a prioridade operacional preserva Best Match antes de GFS e das contingências.

Se Best Match ou GFS entregarem os 15 dias, a função retorna sem esperar as camadas Edge.

Regras permanentes:

- `requestedDays` permanece 15;
- `returnedDays` informa somente dias efetivamente recebidos;
- nenhum dia 8–15 é inventado ou extrapolado;
- o timestamp real da fonte/cache é preservado quando disponível;
- ausência de campo obrigatório não vira zero;
- o cache legado de 7 dias nunca é rotulado como janela completa de 15 dias.

A arquitetura detalhada de resiliência está em `docs/FORECAST_15_DAY_RESILIENCE_2026-09-09.md`.

## 4. Cache estendido no Supabase

O provider dedicado é:

`open-meteo-extended`

A migration `20260909192047_add_open_meteo_extended_cache.sql`:

- adiciona o provider ao cache meteorológico;
- cria a linha inicial;
- cria `get_public_open_meteo_extended_cache_snapshot()`;
- mantém a tabela privada;
- expõe somente payload meteorológico público e timestamps necessários à contingência.

Em 09/09/2026 a migration foi aplicada no Supabase de produção e a Edge Function `open-meteo-extended-forecast` foi implantada como versão 1.

Uma chamada controlada de aquecimento retornou HTTP 200, `cacheStatus: refreshed` e persistiu 15 datas, de 09/09/2026 a 23/09/2026, originadas de Open-Meteo Best Match. O provider ficou em estado `live`.

A versão remota da migration é `20260909192047`; o arquivo local usa a mesma versão para evitar drift no histórico de migrations.

A proveniência continua armazenada internamente em `source.model`, mesmo que o nome da fonte não seja exibido na interface pública.

## 5. Semântica editorial

A página mantém os 15 dias em uma única superfície de previsão, dividida visualmente em duas partes.

### Primeira semana

Mostra os sete dias mais próximos e mantém link para `/previsao-7-dias-pelotas`, onde esse horizonte possui contexto próprio.

### Segunda semana

Mostra os dias seguintes somente quando realmente recebidos. A orientação adicional permanece curta:

> Pode mudar mais. Confira de novo perto da data.

Não existe percentual artificial de confiança nem bloco explicativo duplicando a previsão.

Quando apenas a primeira semana está disponível, a segunda informa que os dias 8–15 ainda não chegaram naquela atualização.

## 6. Copy e hierarquia atuais

A página passou pela mesma normalização editorial aplicada às páginas Hoje, Amanhã e 7 dias.

Foram removidos:

- `EditorialContentSection` duplicada;
- FAQ editorial repetindo a própria previsão;
- bloco “Resumo dos próximos 15 dias”;
- bloco “Como usar a previsão”;
- bloco “A confiança não é igual em toda a janela”;
- tags automáticas do tipo “Dia 3”, “Dia 8”;
- rótulos artificiais de risco como `Acompanhar` e `Mais chuva/vento`;
- cards finais usados apenas para repetir navegação ou fonte;
- nome da fonte no hero e no rodapé da seção de chuva/rajadas.

A sequência pública atual é:

1. hero editorial da previsão estendida;
2. aviso oficial quando aplicável;
3. previsão dos próximos 15 dias;
4. temperaturas dos próximos 15 dias;
5. chuva e rajadas;
6. atualização e navegação curta.

Nos cards diários, os marcadores especiais ficam restritos a `Hoje` e `Amanhã`.

## 7. Estrutura visual atual

A rota não usa `WeatherSplitHero`.

`FifteenDayForecastHero.tsx` usa uma superfície editorial própria, sem fotografia, sem CTAs retail e sem cards decorativos redundantes. O hero concentra:

- título e descrição;
- quantidade real de dias disponíveis;
- faixa térmica da janela;
- maior volume de chuva;
- rajada máxima;
- horário de atualização, sem expor o nome do modelo na interface.

O corpo usa a classe raiz `fifteen-day-page` e o contrato visual de `InternalWeatherPageShell`.

A previsão diária está organizada assim:

- primeira semana: até 7 cards no desktop amplo;
- segunda semana: grade própria dentro da mesma seção;
- temperaturas: tendência compacta com faixas por dia;
- extremos de temperatura: resumo em linha;
- chuva e vento: duas colunas separadas por linha;
- rodapé: atualização e links curtos, sem novo card de fonte.

No mobile, grades e tendências reduzem progressivamente para duas e depois uma coluna.

## 8. Alertas oficiais

A página usa `InternalWeatherPageShell` e preserva o contexto oficial já existente do portal, mas a previsão diária de 15 dias não inventa nem extrapola alertas do INMET.

Regra:

> previsão do modelo != aviso oficial.

Um aviso só vale conforme validade, abrangência e severidade publicadas pela fonte oficial.

## 9. SEO e links internos

Metadata atual:

- title: `Previsão do tempo em Pelotas: 10 e 15 dias`;
- description: previsão de 10 e 15 dias com mínima, máxima, chance e volume de chuva, rajadas e maior incerteza na segunda semana;
- canonical: `/previsao-15-dias-pelotas`.

A página trabalha a intenção de 10 dias dentro da mesma URL de 15 dias.

Links internos atuais:

- 7 dias → 15 dias por `ForecastHorizonBridge`;
- 15 dias → 7 dias;
- 15 dias → amanhã;
- 15 dias → chuva;
- 15 dias → vento.

A rota permanece em `PUBLIC_ROUTES` com atualização diária.

## 10. Contratos automatizados

`tests/fifteen-day-forecast.test.ts` protege, entre outros pontos:

- consulta diária dedicada de 15 dias;
- permanência do contrato global em 7 dias;
- ausência de payload horário na chamada estendida;
- estados `live`, `partial` e `unavailable`;
- preservação de `requestedDays: 15`;
- teto público de 2,8 s por dependência;
- hero sem fotografia, CTAs ou fonte exposta;
- uma única superfície para primeira e segunda semana;
- ausência de rótulos artificiais de risco;
- estrutura das grades e tendências;
- rodapé compacto sem nome da fonte;
- links internos e sitemap.

`tests/open-meteo-extended-forecast.test.ts` adiciona contratos para:

- endpoint NOAA GFS;
- horizonte de 15 dias;
- provider/cache estendido separado;
- RPC pública restrita;
- ordem Best Match → GFS na Edge;
- seleção da janela mais ampla;
- preservação da contingência legada de 7 dias.

`tests/seo-editorial-enrichment.test.ts` protege que a página não recupere a antiga camada editorial explicadora.

## 11. Segurança

A tabela `weather_provider_payload_cache` permanece privada.

A RPC pública da previsão estendida é `SECURITY DEFINER` por decisão explícita para permitir leitura pública apenas do último payload meteorológico e timestamps. O Supabase Advisor sinaliza esse padrão genericamente, mas nenhum token de coletor, lease ou configuração interna é retornado pela função.

Avisos do Advisor relacionados a outras tabelas e funções não fazem parte desta implementação.

## 12. Route tree e CI

O projeto possui gerador próprio em `scripts/generate-route-tree.mjs`; build, typecheck e testes regeneram ou verificam a árvore conforme seus scripts.

GitHub Actions continua apresentando runs que podem encerrar antes do checkout/steps. Nessa condição não é correto declarar build, typecheck, lint ou suíte como executados.

Isso não autoriza alterar contratos apenas para obter um status visualmente verde.

## 13. Fora do escopo

Não foram implementados:

- página separada de 10 dias;
- página de 20 dias;
- página de 30 dias;
- previsão horária de 15 dias;
- previsão sazonal/subsazonal;
- extrapolação de alertas oficiais;
- novas cidades.

## 14. Próximo gate

Quando houver executor funcional:

1. executar contratos da previsão estendida;
2. executar `routes:check`;
3. executar build;
4. executar typecheck;
5. executar lint incremental;
6. validar a rota publicada em desktop e mobile;
7. conferir janela completa de 15 dias;
8. simular estado `partial`, garantindo que a segunda semana nunca seja preenchida artificialmente.

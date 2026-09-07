# Previsão de 15 dias — implementação

Data original: 26/08/2026  
Última atualização: 07/09/2026  
Status: implementada na `main`; validação executável do CI continua dependente da restauração dos runners do GitHub Actions  
Rota: `/previsao-15-dias-pelotas`

## 1. Objetivo

Atender a intenção de busca por previsão do tempo em Pelotas para 10 e 15 dias com uma única página útil, sem criar páginas quase idênticas apenas para trocar o número do horizonte.

A página de 15 dias complementa, e não substitui:

- `/tempo-hoje-pelotas`;
- `/tempo-amanha-pelotas`;
- `/previsao-7-dias-pelotas`.

Os primeiros 10 dias da mesma janela respondem à intenção de 10 dias. Não existe rota separada `/previsao-10-dias-pelotas`.

## 2. Fonte e contrato de coleta

Fonte operacional: Open-Meteo Forecast API, modelo `Best Match`.

A consulta estendida usa somente campos diários necessários à página:

- código meteorológico;
- temperatura mínima;
- temperatura máxima;
- probabilidade máxima de precipitação;
- precipitação acumulada prevista no dia;
- rajada máxima prevista.

A consulta fica em:

- `src/lib/weather/extended-forecast.server.ts`;
- `src/lib/weather/extended-forecast.functions.ts`;
- `src/lib/weather/extended-forecast.types.ts`.

Decisão arquitetural permanente:

> Não aumentar o `forecast_days=7` do contrato Open-Meteo compartilhado pelo portal.

Home, Hoje, Amanhã e a página de 7 dias continuam usando o fluxo existente. A chamada de 15 dias é independente e diária, evitando ampliar o payload das superfícies mais acessadas.

## 3. Performance, contingência e falha

A chamada estendida possui:

- timeout direto próprio;
- `cache: no-store` na consulta upstream;
- cache público do server function por 5 minutos;
- `stale-while-revalidate` por mais 5 minutos;
- teto público da página de **2,8 segundos por dependência**, aplicado por `extended-forecast-page-loader.ts`;
- estado `live` quando os 15 dias utilizáveis são recebidos;
- estado `partial` quando somente parte da janela está disponível;
- estado `unavailable` quando nenhum dia utilizável pode ser publicado.

O loader público inicia `getWeatherIntelligence()` e `getPelotasExtendedForecast()` em paralelo e degrada cada domínio separadamente. A navegação não precisa esperar o limite interno das integrações para receber HTML utilizável.

Se a consulta direta de 15 dias falhar, receber resposta inválida ou não produzir nenhum dia utilizável, `extended-forecast.server.ts` pode usar a contingência Open-Meteo já existente via Edge/Supabase.

Essa contingência preserva a janela real disponível, normalmente até 7 dias, sem inventar a segunda semana.

Regras:

- o contrato continua declarando `requestedDays: 15`;
- `returnedDays` informa somente os dias efetivamente recebidos;
- nenhum dia 8–15 é inventado ou extrapolado;
- o `fetchedAt` preservado pela fonte é reutilizado quando disponível;
- se consulta direta e contingência falharem, o estado permanece `unavailable`;
- ausência de campo obrigatório não vira zero.

## 4. Semântica editorial

A página mantém os 15 dias em **uma única superfície de previsão**, dividida visualmente em duas partes:

### Primeira semana

Mostra os sete dias mais próximos e mantém link para `/previsao-7-dias-pelotas`, onde esse horizonte possui contexto próprio.

### Segunda semana

Mostra os dias seguintes quando realmente recebidos. A única orientação adicional é curta:

> Pode mudar mais. Confira de novo perto da data.

Não existe percentual artificial de confiança nem um bloco separado explicando “como interpretar” cada faixa de dias.

Quando a contingência entrega somente a primeira semana, a segunda mostra apenas que os dias ainda não chegaram naquela atualização.

## 5. Copy e hierarquia atuais

Em 07/09/2026 a página passou pela mesma normalização editorial aplicada às páginas Hoje, Amanhã, 7 dias e ao arquivo histórico de enchentes.

Foram removidos:

- `EditorialContentSection` duplicada;
- FAQ editorial repetindo a própria previsão;
- bloco “Resumo dos próximos 15 dias”;
- bloco “Como usar a previsão”;
- bloco “A confiança não é igual em toda a janela”;
- tags automáticas do tipo “Dia 3”, “Dia 8”;
- cards finais usados apenas para repetir navegação e fonte.

A sequência pública ficou:

1. hero retail;
2. previsão dos próximos 15 dias;
3. temperaturas dos próximos 15 dias;
4. chuva e rajadas;
5. fonte, atualização e links curtos.

Nos dias comuns não aparece selo. Marcadores ficam restritos a estados úteis: `Hoje`, `Amanhã`, `Acompanhar` e `Mais chuva/vento`.

## 6. Estrutura visual atual

A rota não usa mais `WeatherSplitHero`.

`FifteenDayForecastHero.tsx` utiliza a família visual retail já adotada em Hoje, Amanhã e 7 dias, reaproveitando a estrutura de `TodayRetailHero`:

- fotografia meteorológica contextual;
- título e descrição curtos;
- faixa de temperatura em destaque;
- chuva e rajadas;
- atualização e fonte;
- destaques meteorológicos sem painel técnico separado.

O corpo usa a classe raiz `fifteen-day-page`, portanto entra no contrato visual atual de `InternalWeatherPageShell` e da barreira de precedência editorial.

A previsão diária foi organizada assim:

- primeira semana: até 7 cards na mesma faixa no desktop amplo;
- segunda semana: grade própria, dentro da **mesma seção** de previsão;
- temperaturas: duas colunas compactas em telas amplas;
- extremos de temperatura: resumo em linha, sem três novos cards;
- chuva e vento: duas colunas separadas por linha, sem card dentro de card;
- fonte e navegação final: rodapé leve, sem nova caixa visual.

No mobile, grades e tendências passam progressivamente para duas e depois uma coluna.

Arquivos principais:

- `src/components/weather/FifteenDayForecastHero.tsx`;
- `src/components/weather/FifteenDayForecastHero.css`;
- `src/components/weather/FifteenDayForecastPage.tsx`;
- `src/components/weather/FifteenDayForecastPage.css`;
- `src/components/layout/InternalWeatherPageShell.css`.

## 7. Alertas oficiais

A página usa `InternalWeatherPageShell` e preserva o contexto oficial já existente do portal, mas a previsão diária dos 15 dias não inventa nem extrapola alertas do INMET.

Regra:

> previsão do modelo != aviso oficial.

Um aviso só vale conforme validade, abrangência e severidade publicadas pela fonte oficial.

## 8. SEO e links internos

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

A rota permanece em `PUBLIC_ROUTES` com atualização diária. A contagem global de URLs deve ser lida em `PROJECT_CURRENT_STATE.md`.

## 9. Contratos automatizados

`tests/fifteen-day-forecast.test.ts` protege:

- consulta dedicada de 15 dias;
- permanência do contrato global em 7 dias;
- ausência de payload horário na chamada estendida;
- estados `live`, `partial` e `unavailable`;
- contingência como janela parcial sem inventar a segunda semana;
- preservação de `requestedDays: 15`;
- teto público de 2,8 s por dependência;
- hero retail sem `WeatherSplitHero`;
- uma única superfície para primeira e segunda semana;
- copy curta para o horizonte mais distante;
- ausência de rótulos genéricos de dia;
- 7 cards da primeira semana no desktop amplo;
- resumo de temperaturas em linha;
- chuva e vento sem cards internos redundantes;
- rodapé compacto de fonte e navegação;
- link 7 → 15;
- entrada no sitemap.

`tests/seo-editorial-enrichment.test.ts` protege também que a página não recupere a antiga camada editorial explicadora.

O teste está incluído nos contratos do projeto. `tests/public-routes.test.ts` continua tratando a rota como página pública essencial.

## 10. Route tree e CI

O projeto possui gerador próprio em `scripts/generate-route-tree.mjs`; build, typecheck e testes regeneram ou verificam a árvore conforme seus scripts.

GitHub Actions continua apresentando runs que encerram antes do checkout/steps, com `steps: null`. Nessa condição não é correto declarar build, typecheck, lint ou suíte como executados.

Isso não autoriza alterar contratos apenas para obter um status visualmente verde.

## 11. Fora do escopo

Não foram implementados:

- página separada de 10 dias;
- página de 20 dias;
- página de 30 dias;
- previsão horária de 15 dias;
- previsão sazonal/subsazonal;
- nova fonte meteorológica;
- extrapolação de alertas oficiais;
- novas cidades.

## 12. Próximo gate

Quando houver executor funcional:

1. executar contratos da previsão estendida;
2. executar `routes:check`;
3. executar build;
4. executar typecheck;
5. executar lint incremental;
6. validar a rota publicada em desktop e mobile;
7. conferir janela completa de 15 dias;
8. conferir também o estado `partial`, garantindo que a segunda semana nunca seja preenchida artificialmente.

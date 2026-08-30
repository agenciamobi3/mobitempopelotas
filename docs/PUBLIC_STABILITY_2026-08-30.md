# Estabilidade pública — 30/08/2026

## Incidente observado

Durante a rodada de estabilização, o monitor operacional registrava simultaneamente:

- Open-Meteo offline;
- MET Norway ativo;
- Embrapa ativo;
- INMET ativo.

Apesar disso, Home e páginas shell-first podiam permanecer em estados de atualização após a hidratação.

## Causa estrutural

`weather-baseline.server.ts` executava Open-Meteo resiliente e MET Norway em paralelo, mas aguardava ambos com `Promise.all` antes de selecionar o baseline.

O MET Norway possui timeout curto e podia retornar uma previsão utilizável rapidamente. Porém o caminho resiliente do Open-Meteo encadeia:

1. origem direta;
2. leitura do last-good persistido;
3. leitura de settings;
4. eventual refresh pela Edge Function.

Em uma indisponibilidade prolongada da origem, esse caminho podia exceder o deadline global de 5 segundos de `getWeatherIntelligence()`. Assim, uma fonte de contingência saudável podia ficar inutilizada porque a consolidação inteira expirava antes de chegar a `selectBaseline()`.

## Correção

Foi criado `OPEN_METEO_BASELINE_DEADLINE_MS = 3_200` em `weather-baseline.server.ts`.

O Open-Meteo continua sendo tentado primeiro e mantém sua cadeia resiliente, mas deixa de bloquear o baseline após 3,2 segundos. O MET Norway continua em paralelo e pode assumir imediatamente em `selectBaseline()` quando estiver `live`.

O deadline de 3,2 segundos permanece abaixo do deadline global de 5 segundos da inteligência meteorológica.

## Proteções adicionadas

- teste de seleção garantindo que MET Norway vence quando Open-Meteo está indisponível;
- contrato garantindo que o deadline do baseline permaneça abaixo do deadline global;
- `scripts/public-stability-smoke.mjs` para smoke com navegador real;
- cobertura do smoke protegida pelo `test:contracts` existente;
- runtime release desta rodada: `2026-08-30-public-stability-met-norway-v1`.

## Rotas cobertas pelo smoke

- `/`
- `/tempo-hoje-pelotas`
- `/tempo-amanha-pelotas`
- `/previsao-7-dias-pelotas`
- `/situacao-hidrologica-pelotas`
- `/radar-e-satelite-pelotas`
- `/alertas`

O smoke espera 7 segundos nas rotas shell-first e falha se estados transitórios de atualização permanecerem depois desse prazo. Também falha se o boundary global antigo voltar a aparecer ou se diagnósticos internos da REDEMET vazarem para Radar/Satélite.

Execução local/canônica:

```bash
CANDIDATE_URL=https://tempopelotas.com.br node scripts/public-stability-smoke.mjs
```

Opcionalmente ajuste:

- `CHROME_PATH` para indicar Chrome/Chromium;
- `STABILITY_RECOVERY_WAIT_MS` para mudar a janela de recuperação;
- `STABILITY_PAGE_WAIT_MS` para páginas sem recuperação shell-first.

## Commits principais

- `4b107ffb9ac4f696bbdd71cb572355cbd8aa2567` — libera MET Norway do tempo total do Open-Meteo;
- `e1e0059d2f9428efe0f562514227e8cd052299f7` — protege o orçamento e a seleção de contingência;
- `203941afb532112b30dece74396eceb5c02ff6ea` — adiciona smoke público real;
- `d3ec8b26fe9d7634a8156ec85cc43c29d6466df1` — protege cobertura do smoke;
- `b934a58dec63ef298beaa3a4d492e1dd63d3377d` / `78aaa547fd75bbaf09eebd12ff23746cc806cf10` — atualizam o identificador público do runtime.

## Próximo passo

Após o release aparecer no domínio canônico, executar o smoke em `https://tempopelotas.com.br` durante o incidente Open-Meteo offline / MET Norway ativo. Se Home, Hoje, Amanhã ou 7 dias ainda permanecerem em atualização, investigar o transporte da server function/hidratação; o baseline server-side já não deve mais impedir a contingência.

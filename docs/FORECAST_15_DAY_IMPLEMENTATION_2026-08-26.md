# Previsão de 15 dias — implementação

Data: 26/08/2026  
Último hardening: 28/08/2026  
Status: implementada na camada de código; validação executável do CI depende da restauração dos runners do GitHub Actions  
Rota: `/previsao-15-dias-pelotas`

## 1. Objetivo

Atender a intenção de busca por previsão do tempo em Pelotas para 10 e 15 dias com uma única página útil, sem criar páginas quase idênticas apenas para trocar o número do horizonte.

A página de 15 dias complementa, e não substitui:

- `/tempo-hoje-pelotas`;
- `/tempo-amanha-pelotas`;
- `/previsao-7-dias-pelotas`.

Os primeiros 10 dias da nova janela respondem à intenção de 10 dias. Não existe rota separada `/previsao-10-dias-pelotas`.

## 2. Fonte e contrato de coleta

Fonte operacional: Open-Meteo Forecast API, modelo `Best Match`.

A documentação oficial do Open-Meteo permite até 16 dias no endpoint padrão. O Tempo Pelotas solicita 15 dias e usa somente campos diários necessários à página:

- código meteorológico;
- temperatura mínima;
- temperatura máxima;
- probabilidade máxima de precipitação;
- precipitação acumulada prevista no dia;
- rajada máxima prevista.

A consulta estendida fica em:

- `src/lib/weather/extended-forecast.server.ts`;
- `src/lib/weather/extended-forecast.functions.ts`;
- `src/lib/weather/extended-forecast.types.ts`.

Decisão arquitetural permanente desta camada:

> Não aumentar o `forecast_days=7` do contrato Open-Meteo compartilhado pelo portal.

Home, Hoje, Amanhã e a página de 7 dias continuam usando o fluxo existente, inclusive o limite público de 24 horas da série horária. A chamada de 15 dias é independente e diária, evitando carregar centenas de pontos horários desnecessários.

## 3. Performance, contingência e falha

A chamada estendida possui:

- timeout direto próprio de 2,2 segundos;
- `cache: no-store` na consulta upstream;
- cache público do server function por 5 minutos;
- `stale-while-revalidate` por mais 5 minutos;
- budget local de página de 4 segundos por dependência;
- estado `live` quando os 15 dias utilizáveis são recebidos;
- estado `partial` quando a fonte entrega somente parte da janela;
- estado `unavailable` quando nenhum dia utilizável pode ser publicado.

Em 28/08/2026 foi adicionada uma contingência sem alterar a Edge Function existente. Se a consulta direta de 15 dias falhar, receber resposta inválida ou não produzir nenhum dia utilizável, `extended-forecast.server.ts` tenta `fetchOpenMeteoPayloadViaEdge()`.

Essa Edge Function já preserva em Supabase o payload Open-Meteo compartilhado de **7 dias** usado pelo portal. O payload contém as mesmas séries diárias obrigatórias da página estendida. Portanto, quando a consulta de 15 dias não está disponível, o loader pode reutilizar os dias reais preservados pela contingência e publicar uma janela `partial` — normalmente até 7 dias — em vez de transformar toda a página em zero dias.

Regras da contingência:

- o contrato continua declarando `requestedDays: 15`;
- `returnedDays` informa somente os dias efetivamente recebidos;
- a mensagem pública identifica que a consulta direta de 15 dias não respondeu e que a janela exibida veio da contingência Open-Meteo;
- nenhum dia 8–15 é inventado ou extrapolado a partir do cache de 7 dias;
- o `fetchedAt` preservado pela Edge é reutilizado quando disponível;
- se a consulta direta e a contingência falharem, o estado permanece `unavailable`;
- o fluxo direto de 15 dias continua prioritário; a Edge é somente contingência.

O orçamento sequencial nominal permanece contido pela barreira local da página: até 2,2 s na tentativa direta e até 1,6 s no caminho Edge/Supabase. Em logs reais de 28/08, a própria Edge `open-meteo-forecast` chegou a 1,125 s com HTTP 200; por isso o antigo teto de 900 ms foi ampliado. Se o custo combinado se aproximar de 4 s, o loader público continua autorizado a degradar aquela dependência antes de reter o SSR além do budget da página.

Ausência de um campo obrigatório do dia não vira zero. O dia incompleto é descartado e a resposta pode se tornar `partial`.

## 4. Semântica editorial

A página diferencia explicitamente:

### Dias 1–7

Horizonte mais próximo. Há link para a página detalhada de 7 dias.

### Dias 8–15

Horizonte estendido. A interface informa que temperatura, chuva e vento podem sofrer ajustes maiores conforme novas rodadas de modelo entram.

Não foi criado um percentual artificial de “confiança”. A explicação é qualitativa:

- 1–3 dias: decisões mais específicas;
- 4–7 dias: planejamento geral e acompanhamento de ajustes;
- 8–15 dias: tendência diária para organização antecipada e confirmação posterior.

Quando somente a contingência de 7 dias estiver disponível, a seção 8–15 permanece sem dias. A interface não replica os primeiros dias nem completa a segunda semana artificialmente.

## 5. Alertas oficiais

A página usa `InternalWeatherPageShell` e, portanto, preserva o contexto oficial já existente do portal, mas a previsão diária dos 15 dias não inventa nem extrapola alertas do INMET.

Regra:

> previsão do modelo != aviso oficial.

Um alerta só vale conforme a validade, abrangência e severidade publicadas pela fonte oficial.

## 6. SEO e links internos

Metadata principal:

- Title: `Previsão do tempo em Pelotas para 15 dias | Tempo Pelotas`;
- description: previsão dos próximos 15 dias com mínima, máxima, chance de chuva, volume previsto e vento;
- canonical: `/previsao-15-dias-pelotas`.

A página trabalha também a intenção de 10 dias sem URL duplicada.

Links internos aplicados:

- 7 dias -> 15 dias por `ForecastHorizonBridge`;
- 15 dias -> 7 dias;
- 15 dias -> hoje;
- 15 dias -> amanhã;
- 15 dias -> chuva em Pelotas.

A rota permanece em `PUBLIC_ROUTES` com atualização diária. O inventário atual do projeto deve ser lido em `PROJECT_CURRENT_STATE.md`; este documento não é a fonte mestre da contagem global de URLs.

## 7. Componentes públicos

Componentes principais:

- `FifteenDayForecastHero.tsx` — primeira dobra e resumo da janela;
- `FifteenDayForecastPage.tsx` — resumo, cards diários, separação 1–7 / 8–15, incerteza e fonte;
- `ForecastHorizonBridge.tsx` — ligação da página de 7 dias para a janela estendida.

O visual reutiliza `WeatherSplitHero` e a identidade das páginas meteorológicas atuais; não foi criada uma segunda linguagem visual para a rota.

## 8. Contratos automatizados

`tests/fifteen-day-forecast.test.ts` protege:

- consulta dedicada de 15 dias;
- permanência do contrato global em 7 dias;
- ausência de payload horário na chamada estendida;
- estados `live`, `partial` e `unavailable`;
- contingência Edge/Supabase como janela parcial quando a consulta direta falha;
- preservação de `requestedDays: 15` sem inventar 7 como horizonte solicitado;
- cache próprio;
- budget local de 4 s do loader público;
- combinação do shell atual com o contrato estendido;
- separação visual dias 1–7 e 8–15;
- comunicação de incerteza;
- link 7 -> 15;
- entrada no sitemap.

`tests/public-route-resilience.test.ts` protege também o budget de 1,6 s da contingência Edge. `tests/open-meteo-edge.test.ts` confirma a prioridade da chamada direta antes do fallback e evita que o contrato histórico “Edge primeiro” volte à suíte.

O teste está incluído em `npm run test:contracts`. `tests/public-routes.test.ts` também trata a rota como página essencial.

## 9. Route tree e CI

O projeto possui um gerador próprio em `scripts/generate-route-tree.mjs`; `build`, `typecheck`, `test` e `test:routes` regeneram a árvore antes da execução.

O arquivo versionado `src/routeTree.gen.ts` já estava em formato divergente do template atual do gerador antes desta rodada. Em 28/08/2026, novos runs do workflow `Qualidade` continuaram criando o job sem qualquer step executado. Assim, a confirmação executável de `routes:check`, build, typecheck e suíte completa permanece bloqueada pela execução do GitHub Actions, não por evidência de falha de um teste específico.

Isso não autoriza alterar o gerador para esconder a divergência.

## 10. Fora do escopo desta rodada

Não foram implementados nesta etapa:

- página separada de 10 dias;
- página de 20 dias;
- página de 30 dias;
- previsão horária de 15 dias;
- previsão sazonal/subsazonal;
- nova fonte meteorológica externa;
- mudança da Edge Function `open-meteo-forecast` para 15 dias;
- integração GeoInfo Embrapa ao forecast;
- extrapolação de alertas oficiais;
- novas cidades.

O GeoInfo Embrapa permanece na trilha independente documentada em `docs/EMBRAPA_GEOINFO_DATASET_SURVEY_2026-08-26.md`.

## 11. Próximo gate

Antes de iniciar `/previsao-30-dias-pelotas` ou páginas por dia da semana, executar quando o runner estiver disponível:

1. `npm run runtime:check:example`;
2. `npm run test:contracts`;
3. `npm run routes:generate` e confirmar diff esperado de `src/routeTree.gen.ts`;
4. `npm run routes:check`;
5. `npm run build`;
6. `npm run test:routes`;
7. `npm run typecheck`;
8. lint incremental;
9. smoke da rota publicada, verificando tanto a janela direta de 15 dias quanto a contingência parcial.

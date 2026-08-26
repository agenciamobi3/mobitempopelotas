# Open-Meteo — plano de migração para modalidade comercial / controlada

Data: 26/08/2026  
Status: plano técnico; não executar troca de endpoint/segredo antes da modalidade ser definida  
Dependência: `docs/OPEN_METEO_SERVICE_USAGE_REVIEW_2026-08-26.md`

## 1. Objetivo

Preparar a migração das integrações atuais do Open-Meteo para uma modalidade compatível com o uso do Tempo Pelotas sem:

- expor API key no navegador;
- transformar o portal em proxy aberto para coordenadas arbitrárias;
- quebrar Home, Hoje, Amanhã, 7 dias, 15 dias, meteograma ou páginas regionais;
- misturar a migração do forecast padrão com a futura Seasonal Forecast API;
- remover a atribuição pública já existente.

Este documento não ativa plano, não cria segredo e não muda runtime.

## 2. Princípio arquitetural

Toda credencial comercial deve permanecer server-side.

Fluxo alvo:

`browser -> rota/função controlada do Tempo Pelotas -> Open-Meteo customer/self-host -> parser tipado -> resposta sanitizada`

Para loaders e serviços já server-side:

`loader/server function -> Open-Meteo access layer -> customer/self-host -> parser existente`

Não deve existir:

`browser -> customer-api?apikey=...`

nem:

`/api/open-meteo?lat=qualquer&lon=qualquer`.

## 3. Configuração server-side proposta

Quando a modalidade for decidida, criar um contrato único. Nomes sugeridos — revisar antes de implementar:

```text
OPEN_METEO_ACCESS_MODE=customer | self-hosted
OPEN_METEO_API_KEY=
OPEN_METEO_BASE_URL=
OPEN_METEO_SEASONAL_BASE_URL=
```

Regras:

- nenhuma variável usa `VITE_`;
- `OPEN_METEO_API_KEY` só existe em `customer`;
- URLs podem ter defaults internos conhecidos para customer e overrides apenas quando necessário;
- self-host deve usar URLs explícitas;
- nenhum log imprime query string que contenha chave;
- `.env.example` recebe somente nomes e comentários, nunca valor real;
- runtime deve falhar de forma explícita se `customer` for selecionado sem chave.

Não manter um modo `free` como fallback silencioso em produção comercial. Se houver um modo público para desenvolvimento/teste, ele deve ser explícito e bloqueado pelo readiness de produção.

## 4. Camada central sugerida

Arquivo candidato:

`src/lib/weather/open-meteo-access.server.ts`

Responsabilidades:

- resolver modo de acesso;
- construir URL de Forecast API;
- construir URL de Seasonal Forecast API quando habilitada;
- adicionar API key somente no servidor;
- preservar parâmetros meteorológicos definidos pelos adapters, não duplicá-los;
- sanitizar erro/log;
- expor helpers testáveis de configuração;
- nunca ser importado por módulo client-side.

Não mover parsers meteorológicos para essa camada. O acesso deve conhecer transporte/configuração; cada domínio continua responsável por sua normalização.

## 5. Matriz de migração das chamadas atuais

### 5.1. Server-side — migração direta para a access layer

| Superfície | Estado atual | Migração alvo |
| --- | --- | --- |
| `src/lib/weather/open-meteo.server.ts` | Forecast API pública | usar builder server-side central |
| `src/lib/weather/extended-forecast.server.ts` | Forecast API pública, 15 dias | usar builder central; manter chamada diária enxuta |
| `src/lib/weather/meteogram.server.ts` | Forecast API pública | usar builder central |
| `src/routes/api/weather/hourly-precipitation.ts` | rota server-side -> Forecast API | usar builder central |
| `src/lib/weather/regional-cities-overview.server.ts` | consulta regional em lote | usar builder central; preservar batch multi-coordinate |
| `src/lib/weather/regional-city-weather.server.ts` | previsão municipal server-side | usar builder central |
| `src/lib/weather/regional-city-weather-resilient.server.ts` | fallback/resiliência municipal | usar builder central |
| futura tendência 16–30 dias | ainda inexistente | Seasonal builder somente depois do gate comercial |

A migração não deve alterar os contratos de dados dessas superfícies na mesma rodada.

### 5.2. Browser-side — não pode receber API key

#### `src/production/lib/open-meteo-browser-recovery.ts`

Hoje constrói URL pública e consulta o Open-Meteo diretamente do navegador.

Alvo:

- substituir a consulta externa por endpoint interno fixo para Pelotas;
- endpoint retorna apenas o payload necessário à recuperação existente;
- cache server/CDN;
- sem coordenadas arbitrárias fornecidas pelo visitante;
- manter timeout e abort no browser para a chamada ao próprio portal.

Rota candidata:

`/api/weather/open-meteo-recovery`

Contrato fixo para Pelotas. Não aceitar `lat`/`lon` públicos.

#### `src/lib/weather/regional-city-weather-client.ts`

Hoje constrói Forecast API diretamente no browser para a cidade.

Alvo:

`/api/weather/regional-recovery?citySlug=<slug-aprovado>`

Regras:

- `citySlug` deve ser resolvido exclusivamente pelo registry `regional-cities.ts`;
- rejeitar slug desconhecido;
- não aceitar latitude/longitude do cliente;
- preservar o publication gate;
- resposta pode conter apenas current/hourly/daily necessários ao recovery;
- cache por slug;
- aplicar rate limit apropriado para impedir abuso da assinatura;
- não retornar API key, URL customer completa ou headers upstream.

## 6. Supabase Edge Functions

Chamadas identificadas:

- `supabase/functions/open-meteo-forecast/index.ts`;
- `supabase/functions/regional-weather-overview/index.ts`;
- `supabase/functions/forecast-open-meteo-capture/index.ts`.

Essas funções rodam fora do processo TanStack e não podem depender implicitamente do env do host web.

Quando a modalidade customer for escolhida:

- configurar segredo equivalente no ambiente oficial do Supabase;
- usar `Deno.env.get(...)` somente server-side;
- centralizar um helper Deno compartilhável se o projeto já suportar esse padrão, ou manter função pequena e consistente por Edge Function;
- não versionar o valor;
- validar readiness separadamente no Supabase;
- não declarar a migração concluída apenas porque o GitHub/Lovable recebeu o código.

A captura histórica deve continuar separando `captured_at` de eventual horário de rodada/modelo.

## 7. Segurança do proxy de recuperação

A nova recuperação não pode funcionar como proxy meteorológico aberto.

Bloqueios obrigatórios:

- Pelotas: coordenadas fixas no servidor;
- cidades: apenas slugs existentes e publicáveis;
- métodos permitidos: `GET`/`HEAD` conforme contrato;
- limite de tamanho de resposta/upstream;
- timeout upstream;
- cache para reduzir consumo;
- rate limit por cliente para endpoints públicos de recuperação;
- query allowlist;
- nenhuma URL externa fornecida pelo usuário;
- nenhum parâmetro `apikey` aceito do cliente;
- erro upstream sanitizado;
- sem CORS aberto para uso como API de terceiros nesta fase.

## 8. Seasonal Forecast API — contrato separado

A previsão de 30 dias não deve reutilizar o adapter diário como se o EC46 fosse apenas `forecast_days=30`.

Criar domínio próprio somente após o acesso comercial/permitido estar pronto:

- `src/lib/weather/subseasonal-trend.types.ts`;
- `src/lib/weather/subseasonal-trend.server.ts`;
- `src/lib/weather/subseasonal-trend.functions.ts`.

Primeiro contrato candidato:

```text
model = ecmwf_ec46_ensemble_mean
weekly = temperature_2m_mean,
         temperature_2m_anomaly,
         precipitation_mean,
         precipitation_anomaly
```

O parser deve preservar:

- início/fim da semana;
- valores numéricos recebidos;
- unidade;
- modelo;
- data/hora de captura;
- horizonte;
- estado `live | partial | unavailable`;
- indicação de que o produto não possui bias correction quando isso continuar verdadeiro na fonte.

A camada editorial não deve chamar anomalia de alerta, probabilidade de chuva em um dia ou previsão de bairro.

## 9. Tradução de anomalias — gate separado

Não criar thresholds arbitrários apenas para produzir rótulos bonitos.

Antes do componente público, definir em documento/teste:

- banda neutra para temperatura;
- banda neutra para precipitação;
- tratamento de valores exatamente no limite;
- comportamento para valor ausente;
- linguagem permitida;
- proibição de termos absolutos como `vai chover`, `não vai chover`, `frio garantido`, `calor garantido` no horizonte 16–30.

Até essa regra existir, a API interna pode preservar o valor bruto, mas a UI de 30 dias não deve ser publicada.

## 10. Atribuição

A atribuição básica ao Open-Meteo já aparece no footer compartilhado via `PUBLIC_DATA_SOURCE_LINKS.openMeteo` e `FOOTER_SOURCE_GROUPS`.

Na migração:

- preservar o link público para Open-Meteo;
- revisar embeds/JSON/API que não exibem o footer;
- páginas de 15 e 30 dias devem citar a fonte no próprio conteúdo, além do footer;
- eventual customer endpoint não deve ser exibido como link público com chave;
- link de atribuição continua apontando para a superfície pública apropriada da fonte.

## 11. Ordem recomendada de implementação

### Fase A — decisão e configuração

1. escolher `customer` ou `self-hosted`;
2. confirmar plano/API necessários;
3. criar secrets no host e, quando aplicável, no Supabase;
4. atualizar `.env.example` sem valores reais;
5. adicionar readiness para impedir modo inválido em produção.

### Fase B — server-side sem mudança de produto

1. criar `open-meteo-access.server.ts`;
2. migrar `open-meteo.server.ts`;
3. migrar 15 dias;
4. migrar meteograma/hora a hora;
5. migrar regional server-side;
6. validar que os payloads normalizados não mudaram.

### Fase C — browser recovery

1. criar recovery fixo de Pelotas;
2. criar recovery por slug regional allowlisted;
3. aplicar cache/rate limit;
4. trocar os dois fetches diretos do browser;
5. teste que proíba `api.open-meteo.com` e `customer-*.open-meteo.com` em módulos client-side.

### Fase D — Supabase

1. configurar segredo oficial;
2. migrar Edge Functions;
3. smoke de captura e overview;
4. confirmar que nenhum segredo aparece em log/resposta.

### Fase E — 30 dias

1. habilitar Seasonal access;
2. smoke real do EC46;
3. parser semanal tipado;
4. thresholds editoriais aprovados/testados;
5. página 30 dias;
6. ligação 15 -> 30;
7. sitemap/canonical/schema;
8. atualizar `PROJECT_CURRENT_STATE.md` para 47 URLs somente quando a rota realmente entrar.

## 12. Critérios de aceite da migração

A frente só pode ser chamada de concluída quando:

- nenhum segredo Open-Meteo existe em bundle/browser;
- módulos client-side não consultam customer endpoint diretamente;
- browser recovery funciona por rotas internas restritas;
- slugs desconhecidos não viram consultas arbitrárias;
- loaders públicos continuam degradando com segurança;
- Home/Hoje/Amanhã/7d/15d mantêm o mesmo contrato meteorológico;
- Edge Functions usam o mesmo modo de acesso aprovado;
- atribuição permanece visível;
- logs não contêm API key;
- readiness acusa configuração incompleta;
- testes bloqueiam regressão para chave no cliente;
- a Seasonal API só entra depois do gate específico de plano/licença.

## 13. Fora de escopo desta fundação

- compra automática de plano;
- criação de conta Open-Meteo;
- versionamento de segredo;
- implementação da página de 30 dias antes do gate;
- self-host de modelos meteorológicos sem decisão operacional;
- transformação de EC46 em previsão diária fictícia.

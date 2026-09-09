# Meteograma de Pelotas — resiliência e enriquecimento

Data: 09/09/2026  
Rota: `/meteograma-pelotas`

## Objetivo

Evitar que uma série horária secundária ausente derrube todo o meteograma e ampliar a utilidade da página sem misturar previsão com observação.

## Diagnóstico confirmado

A consulta pública de 48 horas do Open-Meteo foi verificada em 09/09/2026 e respondeu HTTP 200 para Pelotas com 48 horários. No teste controlado estavam presentes, entre outros campos:

- temperatura e sensação;
- umidade e ponto de orvalho;
- probabilidade e volume de precipitação;
- pressão ao nível do mar;
- nuvens totais, baixas, médias e altas;
- visibilidade;
- CAPE;
- altura da camada limite;
- vento, rajadas e direção.

Portanto valores ausentes vistos na página publicada não significavam necessariamente ausência na fonte. O caminho dedicado podia perder o budget público e a interface passava a usar o conjunto horário compartilhado, que possui contrato menor.

## Cadeia atual

A previsão horária dedicada usa duas candidatas independentes:

1. Open-Meteo Best Match, 48 horas;
2. NOAA GFS via Open-Meteo, 48 horas.

As duas são consultadas em paralelo com timeout interno menor que o deadline público da página. Entre respostas utilizáveis, vence a que entrega a maior janela; em empate, Best Match preserva a prioridade.

O schema exige somente o núcleo necessário para manter uma série horária utilizável. Variáveis atmosféricas secundárias são opcionais e permanecem `null` quando não vierem. Ausência de uma delas não invalida as demais séries.

A rota passou a usar `loadPublicWeatherWithMeteogram()`, que limita e degrada de forma independente a inteligência meteorológica compartilhada e o meteograma dedicado.

## Cache

- janela completa de 48 h: cache público de 5 min, com stale-while-revalidate;
- janela menor porém utilizável: cache curto de 1 min;
- indisponível: `no-store`.

Assim, uma falha ou janela incompleta não fica retida por vários minutos depois da recuperação do upstream.

## Enriquecimento público

Foi acrescentado um resumo editorial de 48 horas com derivados objetivos, sempre calculados apenas sobre valores existentes:

- faixa de temperatura;
- chuva acumulada prevista na janela;
- maior chance de chuva;
- maior rajada;
- menor visibilidade;
- tendência da pressão entre primeiro e último valor conhecido;
- maior CAPE.

Quando o volume de chuva não está completo, a interface informa quantos horários possuem valor em vez de completar a soma com zero.

Nenhum desses derivados é promovido a aviso oficial ou classificação de risco.

## SIMAGRO RS

Os meteogramas gráficos WRF, GFS e GFS Agro continuam complementares. Se uma imagem não renderizar no navegador, a página agora oferece acesso direto ao arquivo gráfico e ao portal do SIMAGRO RS, sem proxy, OCR ou reconstrução de valores.

## Regras permanentes

- meteograma é previsão, não observação;
- indisponibilidade não vira zero;
- série ausente não apaga séries válidas;
- janela menor não é preenchida artificialmente até 48 horas;
- SIMAGRO continua sendo camada visual de modelagem complementar;
- proveniência técnica permanece disponível nos contratos internos e nas páginas de transparência do portal.

## Arquivos principais

- `src/lib/weather/meteogram.server.ts`;
- `src/lib/weather/meteogram.functions.ts`;
- `src/lib/weather/public-weather-page-loader.ts`;
- `src/routes/meteograma-pelotas.tsx`;
- `src/components/weather/MeteogramForecastHighlights.tsx`;
- `src/components/weather/MeteogramForecastHighlights.css`;
- `src/components/weather/SimagroModelProducts.tsx`;
- `tests/meteogram-page.test.ts`.

## Validação

A disponibilidade real do upstream de 48 horas foi verificada por chamada HTTP controlada em 09/09/2026. Build, typecheck e suíte geral só devem ser declarados como PASS após execução real em runner funcional.

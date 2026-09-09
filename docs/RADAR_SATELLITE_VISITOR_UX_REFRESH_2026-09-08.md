# Radar e satélite — refinamento de UX do visitante — 08/09/2026

## Objetivo

A rota `/radar-e-satelite-pelotas` foi ajustada para funcionar como uma página pública de consulta visual, não como documentação de integração. A informação técnica de governança continua em `/status-dos-dados` e nos documentos operacionais.

## Comparação radar x previsão

`RadarForecastContext` agora mostra a própria imagem georreferenciada do radar no mesmo bloco da previsão horária comparada. A imagem mantém horário e origem REDEMET/DECEA. Os valores ao lado continuam explicitamente previsão, sem serem apresentados como medição do radar.

## Atividade elétrica STSC

O player de coletas STSC agora possui uma superfície visual real em `StormMapFrame`:

- mapa MapLibre regional;
- Pelotas marcada apenas como referência geográfica;
- pontos desenhados a partir das coordenadas recebidas na coleta selecionada;
- mudança do slider/player atualiza o mapa;
- frame válido com zero pontos continua sendo zero real e mostra o mapa sem ocorrências;
- ausência de frame utilizável continua diferente de zero.

## Satélite complementar

O painel público complementar genérico do INMET foi retirado. Em seu lugar a página apresenta um segundo produto da REDEMET:

- normalmente, `Infravermelho` complementa o produto selecionado;
- quando o visitante seleciona `Infravermelho`, `Realçado` ocupa a segunda visualização para evitar duplicação;
- uma resposta INMET não é rotulada como REDEMET;
- INMET continua podendo aparecer identificado quando for efetivamente a contingência do produto selecionado pelo contrato do backend.

A descrição pública de `Realçado` foi reduzida para:

> Use a sequência para comparar contrastes e temperaturas de topo de nuvem.

## Acabamento visual

A antiga barreira global de precedência ainda força grandes capítulos de radar para `border-radius: 0`. Como outras rotas ainda dependem dessa barreira, foi criado `src/production/styles/radar-satellite-editorial-final.css`, carregado depois dela.

Esse contrato é exclusivo de radar/satélite e restaura:

- radius suave de 18 px em desktop e 14 px em mobile;
- fundos claros e não decorativos;
- bordas discretas;
- painéis de satélite e instrumentos internos com geometria própria;
- ausência de sombras e gradientes decorativos.

## Previsão de 7 dias

Na mesma rodada, `ForecastHorizonBridge` em `/previsao-7-dias-pelotas` passou a ser um card inteiro clicável para `/previsao-15-dias-pelotas`, com fundo claro não branco, borda suave, radius e estados de hover/foco.

## Contratos

A rodada é protegida principalmente por:

- `tests/redemet-data-display-audit.test.ts`;
- `tests/radar-satellite-retail.test.ts`;
- `tests/internal-cta-radar-ux-2026-09-08.test.ts`;
- `tests/visitor-language-menu-pages.test.ts`.

Não declarar execução de testes/build pelo GitHub Actions quando o runner encerrar antes de fornecer steps.
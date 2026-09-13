# Tempo Pelotas Observatório — Comparação por Opacidade

Data: 13/09/2026  
Estado: implementação empilhada sobre o Comparador A/B por cortina  
Branch de trabalho: `work/observatory-comparison-opacity`

## Objetivo

Adicionar ao Comparador A/B do Observatório PRO um segundo modo visual sem criar outro viewer, outra câmera, outra fonte de dados ou outra timeline.

O modo **Opacidade** mantém A como base e sobrepõe B no mesmo `CesiumWidget`. O usuário continua escolhendo horários independentes para A e B, mas em vez de mover uma cortina vertical controla quanto do lado B aparece sobre o lado A.

## Contrato de produto

- `Cortina` continua sendo o modo padrão e preserva o split `LEFT/RIGHT` do Cesium;
- `Opacidade` usa as mesmas imagens, os mesmos timestamps e os mesmos estados A/B;
- A permanece como base;
- B é renderizado acima de A e recebe um fator global `opacityMix` entre `0` e `1`;
- `0%` deixa somente A visível;
- `100%` aplica a opacidade original configurada para B;
- o controle não altera permanentemente a opacidade canônica da camada;
- trocar A ↔ B também troca qual cenário é base e qual cenário é sobreposição;
- a timeline continua editando somente o lado selecionado;
- radar e satélite continuam sendo as únicas camadas comparáveis nesta fase;
- raios, alertas e hidrologia permanecem fora do comparador até existir contrato visual apropriado.

## Estado

`ObservatoryComparisonState` passa a aceitar:

```ts
{
  mode: "swipe" | "opacity",
  splitPosition: number,
  opacityMix: number,
  a: { selectedAt, layers },
  b: { selectedAt, layers },
}
```

`opacityMix` é normalizado entre `0` e `1` e inicia em `0.5`.

## Runtime Cesium

O modo não cria um segundo `CesiumWidget`.

No modo `swipe`:

- A usa `SplitDirection.LEFT`;
- B usa `SplitDirection.RIGHT`;
- `scene.splitPosition` continua controlado pela cortina.

No modo `opacity`:

- A e B usam `SplitDirection.NONE`;
- A mantém a opacidade própria da camada;
- B recebe `layer.opacity * opacityMix`;
- depois que os dois providers estão prontos, B é elevado acima de A com `imageryLayers.raiseToTop` para evitar que a ordem assíncrona dos downloads altere a semântica visual.

O runtime continua preservando a imagery anterior até o novo `SingleTileImageryProvider` estar pronto e mantém a proteção por geração contra renders antigos.

## UX

O toolbar do comparador ganha dois modos:

- `Cortina`;
- `Opacidade`.

No modo Opacidade:

- a cortina deixa de ser exibida;
- surge um slider `B sobre A` de 0% a 100%;
- A/B continuam selecionáveis para edição temporal;
- `Trocar A ↔ B` continua disponível;
- sair da comparação restaura o viewer normal sem recarregar a rota.

## Limites semânticos

O slider não representa probabilidade, intensidade meteorológica ou diferença quantitativa. Ele apenas controla a transparência visual do lado B.

A ferramenta não deve inferir automaticamente deslocamento, velocidade, volume de chuva ou causalidade a partir da sobreposição.

## Contratos

`tests/observatory-comparison.test.ts` cobre:

- normalização de `mode` e `opacityMix`;
- manutenção de um único Cesium;
- ausência de split no modo Opacidade;
- B renderizado acima de A;
- controle explícito `B sobre A`;
- preservação dos contratos de races, cache temporal e falhas de imagery herdados do Swipe.

## Dependência de promoção

Esta fase é empilhada sobre `work/observatory-comparison-ab`. Não deve ser promovida diretamente para `main` enquanto as fundações anteriores estiverem abertas.

Nenhuma nova fonte, API, provider externo ou dependência foi adicionada.

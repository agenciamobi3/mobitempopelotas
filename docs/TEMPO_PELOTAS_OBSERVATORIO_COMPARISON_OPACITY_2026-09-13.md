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
- depois de cada atualização raster, todos os overlays B ativos são elevados novamente acima de todos os layers A com `imageryLayers.raiseToTop`, de modo que radar e satélite não dependam da ordem em que seus downloads terminam;
- alterar somente `opacityMix` usa `setLayerOpacity()` na imagery B já existente e não recria `SingleTileImageryProvider`.

A troca de cada par A/B usa `setImageLayerGroup()`: os providers são preparados antes da remoção da imagery anterior e a substituição acontece somente se todo o grupo continuar na geração atual. Se um provider falhar, o último par íntegro permanece visível e o estado pode degradar sem apagar a comparação vigente.

A fase também herda o controle de revisão do conteúdo temporal do Swipe. Se uma recarga substitui o cache de radar ou satélite, callbacks que começaram sobre o resultado antigo não podem publicar `status`, `observedAt` ou `detail` depois que a fonte mais nova venceu.

## Semente temporal

A entrada A/B usa apenas timestamps pertencentes a radar ou satélite habilitados. O horário inicial é o último quadro comparável no mesmo instante ou anterior ao horário global selecionado.

Se o horário global antecede todos os quadros comparáveis disponíveis, a semente é `null` e o botão permanece indisponível. O comparador não avança silenciosamente para uma observação futura apenas para abrir.

## UX

O toolbar do comparador ganha dois modos:

- `Cortina`;
- `Opacidade`.

No modo Opacidade:

- a cortina deixa de ser exibida;
- surge um slider `B sobre A` de 0% a 100%;
- o slider modifica somente o alpha visual de B;
- A/B continuam selecionáveis para edição temporal;
- `Trocar A ↔ B` continua disponível;
- sair da comparação restaura o viewer normal sem recarregar a rota.

Ao voltar de `Opacidade` para `Cortina`, os providers são materializados novamente com o split nativo adequado ao modo. `opacityMix` não entra na chave que recria os providers, portanto o arraste do slider permanece uma operação visual barata.

## Limites semânticos

O slider não representa probabilidade, intensidade meteorológica ou diferença quantitativa. Ele apenas controla a transparência visual do lado B.

A ferramenta não deve inferir automaticamente deslocamento, velocidade, volume de chuva ou causalidade a partir da sobreposição.

## Contratos

`tests/observatory-comparison.test.ts` cobre:

- normalização de `mode` e `opacityMix`;
- manutenção de um único Cesium;
- ausência de split no modo Opacidade;
- troca A/B por grupo atômico de imagery;
- todos os overlays B acima de todos os A ativos;
- controle explícito `B sobre A`;
- alteração de alpha sem reload de provider durante o slider;
- semente raster sem avanço para o futuro;
- invalidação de callbacks por revisão da fonte temporal;
- preservação do último par em falha de provider;
- primeira carga realmente sem cache ainda podendo terminar em `unavailable`;
- preservação dos contratos de races e cache herdados do Swipe.

## Dependência de promoção

Esta fase é empilhada sobre `work/observatory-comparison-ab`. Não deve ser promovida diretamente para `main` enquanto as fundações anteriores estiverem abertas.

Nenhuma nova fonte, API, provider externo ou dependência foi adicionada.
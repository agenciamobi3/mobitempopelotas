# Tempo Pelotas Observatório — Comparador A/B

Data: 12/09/2026  
Estado: fundação em implementação  
Branch de trabalho: `work/observatory-comparison-ab`

## Objetivo

Adicionar ao Observatório PRO um modo de comparação temporal e visual inspirado no padrão de comparação do NASA Worldview, sem criar um segundo mapa, um segundo relógio global ou uma arquitetura paralela.

A primeira entrega será o modo **Swipe**: uma única câmera Cesium, uma cortina vertical e dois estados meteorológicos independentes, chamados A e B.

O objetivo comercial não é cobrar pelo dado público. O valor está na ferramenta que permite confrontar dois momentos, composições ou produtos no mesmo espaço geográfico.

## Princípios

- um único Cesium e uma única câmera;
- a câmera é compartilhada entre A e B;
- A e B podem usar horários diferentes;
- o comparador não substitui a timeline global normal;
- ao sair do modo comparação, o Observatório volta ao estado normal sem recarregar a rota;
- a primeira fase compara apenas camadas raster já compatíveis com `ImageryLayer`: radar e satélite;
- raios, alertas, hidrologia e outras primitivas ficam fora da primeira fase até existir contrato de split equivalente e cientificamente claro;
- nenhuma nova fonte de dados é criada;
- nenhum dado público é removido ou transferido para paywall;
- o comparador permanece dentro do gate PRO existente.

## Modelo de estado

`src/observatory/core/ObservatoryComparison.ts` define a fundação tipada.

Cada lado preserva:

- `selectedAt` próprio;
- estado de ativação das camadas;
- opacidade das camadas.

A câmera não é duplicada nos lados. Ela pertence ao viewer compartilhado.

Estado inicial:

```ts
{
  version: 1,
  mode: "swipe",
  splitPosition: 0.5,
  a: { selectedAt, layers },
  b: { selectedAt, layers },
}
```

A posição da cortina deve ficar entre 10% e 90% da largura para que nenhum lado desapareça completamente por acidente.

## Renderização Cesium

A implementação deve usar o mecanismo nativo de divisão de imagery do Cesium, preferencialmente `ImagerySplitDirection.LEFT` e `ImagerySplitDirection.RIGHT`, com `scene.splitPosition` controlado pela UI.

Evitar dois `CesiumWidget` lado a lado. Isso dobraria WebGL, terreno, câmera, memória e sincronização sem necessidade.

Para cada camada raster comparável, o runtime deve poder manter duas instâncias simultâneas, por exemplo:

```text
compare:a:radar
compare:b:radar
compare:a:satellite
compare:b:satellite
```

O lado A usa split LEFT e o lado B usa split RIGHT.

As camadas normais do Observatório devem ser ocultadas ou suspensas enquanto o comparador estiver ativo para evitar sobreposição ambígua.

## UX da primeira versão

A entrada deve ser simples e voltada ao visitante, sem jargão técnico.

Ação sugerida no header ou junto à timeline:

`Comparar`

Ao ativar:

- A inicia com o estado atual do Observatório;
- B inicia com o mesmo estado, mas pode receber outro horário;
- uma barra vertical aparece sobre o globo;
- rótulos discretos `A` e `B` identificam os lados;
- o usuário arrasta a barra horizontalmente;
- cada lado mostra seu horário de forma clara;
- deve existir ação `Trocar A ↔ B`;
- deve existir ação `Sair da comparação`.

Não abrir modal grande se a interação couber no workspace atual.

## Timeline

O modo normal continua com um único `selectedTimelineAt`.

No modo comparação, cada lado precisa de um timestamp independente:

```text
A: 12/09 18:10
B: 12/09 19:00
```

A timeline pode editar o lado atualmente selecionado. Um seletor compacto `A | B` define qual lado recebe a alteração.

A seleção de frame continua usando os contratos temporais canônicos existentes. Não criar endpoints de radar ou satélite exclusivos para o comparador.

## Cenários compartilháveis

O recurso deve ser compatível com a arquitetura de cenários compartilháveis introduzida no PR #135.

A primeira versão não precisa serializar comparação no link se isso aumentar demais o escopo. O contrato deve, porém, evitar decisões que impeçam adicionar posteriormente:

```text
#comparison=<estado A/B>
```

Quando essa serialização vier, câmera continuará sendo compartilhada.

## Limites científicos e editoriais

O comparador mostra diferenças visuais entre duas observações ou produtos. Ele não deve inferir causalidade automaticamente.

Exemplos válidos:

- radar 18:10 × radar 19:00;
- satélite 14:00 × satélite 17:00;
- radar antes × depois de um evento;
- satélite em dois horários.

Exemplos que exigem contrato adicional:

- transformar diferença visual em estimativa automática de chuva;
- afirmar deslocamento ou velocidade sem cálculo validado;
- comparar produtos de referências incompatíveis como se fossem equivalentes.

## Contratos mínimos para considerar a fase pronta

- fundação tipada coberta por `tests/observatory-comparison.test.ts`;
- runtime mantém imagery A e B simultaneamente;
- `scene.splitPosition` responde ao controle visual;
- A e B usam uma única câmera;
- timeline altera apenas o lado selecionado;
- sair do modo comparação restaura o viewer normal;
- mobile mantém controle utilizável por toque;
- `prefers-reduced-motion` continua respeitado;
- nenhuma dependência nova é necessária para a primeira fase;
- testes do Observatório, typecheck e build devem ser executados antes de promoção.

## Próximas extensões depois do Swipe

Somente após o Swipe estar estável:

1. modo `Opacity`, alternando ou misturando A/B;
2. modo `Spy`, com lente circular;
3. presets `Antes / Depois`;
4. comparação de eventos históricos;
5. serialização completa do comparador em cenário compartilhável;
6. suporte a pontos e vetores quando o runtime tiver contrato de split apropriado.

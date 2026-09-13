# Escopo de revisão — Comparador por Opacidade

A revisão desta fase deve permanecer restrita ao segundo modo visual do Comparador A/B.

Verificar:

- um único `CesiumWidget` e uma única câmera;
- A permanece como base e B como sobreposição;
- `opacityMix` não altera a opacidade canônica persistida da camada;
- B é elevado acima de A depois que ambos os providers ficam prontos;
- troca entre `swipe` e `opacity` não deixa split antigo aplicado às novas imagery;
- A/B continuam com timestamps independentes e a timeline edita somente o lado selecionado;
- a entrada A/B usa somente contexto temporal de radar/satélite habilitado;
- falhas temporais preservam cache existente, mas publicam `degraded`;
- saída da comparação restaura o viewer normal;
- controle `B sobre A` permanece acessível;
- compartilhamento normal continua desabilitado durante A/B, pois o codec ainda não serializa comparação.

Fora de escopo nesta fase: Spy, serialização `#comparison`, vetores/pontos divididos, modelos numéricos, vento, novas fontes ou novas APIs.

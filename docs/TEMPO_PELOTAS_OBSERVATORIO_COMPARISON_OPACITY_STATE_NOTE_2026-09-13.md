# Nota de estado — Comparador A/B por Opacidade

Data: 13/09/2026

Esta entrega permanece **empilhada**, não publicada na `main` e não propagada ao domínio canônico.

Dependências de promoção:

1. PR #135, cenários compartilháveis, precisa ser validado e incorporado;
2. PR #137, Comparador A/B por Cortina, precisa concluir revisão e validação executável;
3. somente depois a fase Opacidade pode ser considerada candidata a promoção.

Na branch `work/observatory-comparison-opacity`, o Observatório reutiliza o mesmo `CesiumWidget`, câmera, fontes temporais e estado A/B do Swipe. O modo `opacity` mantém A como base e sobrepõe B com `opacityMix` normalizado, sem criar nova fonte, API ou dependência.

A entrada no comparador herda o gate temporal endurecido da base: o cenário A/B só nasce de um timestamp pertencente a radar ou satélite habilitado, resolvendo o instante global para o último quadro raster comparável que não esteja no futuro, com fallback para o primeiro quadro posterior.

Falhas de atualização temporal com cache preservam o quadro/timestamp já carregado, mas publicam estado `degraded`; uma primeira carga realmente sem cache continua podendo falhar como `unavailable`.

Este documento complementa `PROJECT_CURRENT_STATE.md` enquanto a fase permanece empilhada e ainda não integra o estado operacional da `main`.

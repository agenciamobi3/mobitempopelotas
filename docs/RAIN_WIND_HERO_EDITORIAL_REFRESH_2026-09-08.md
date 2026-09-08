# Chuva e Vento — heroes editoriais dedicados de 08/09/2026

## Objetivo

As rotas `/chuva-em-pelotas` e `/vento-em-pelotas` deixaram de reutilizar o hero retail fotográfico herdado de Tempo Hoje.

Cada rota agora possui DOM e CSS próprios, no mesmo sistema editorial usado pela família principal de previsão. A mudança reduz chrome promocional sem alterar os contratos meteorológicos.

## Chuva em Pelotas

O `RainRetailHero.tsx` atual é um hero editorial dedicado.

A primeira dobra mostra:

- maior chance de chuva nas próximas 12 horas, quando publicada;
- chuva medida em 24 horas, somente quando a leitura da Defesa Civil RS está publicável;
- volume previsto para hoje;
- volume acumulado previsto na janela disponível de 7 dias.

### Medido e previsto permanecem separados

A chuva medida em 24 horas chega ao hero pelo contrato da rota e só é usada quando a observação está `live` e a fonte da Defesa Civil RS está utilizável.

Esse valor não é somado silenciosamente ao volume previsto. A interface continua identificando medição e previsão como grandezas de janelas/origens diferentes.

Chance ausente permanece ausente. Chance publicada como zero não vira pico artificial. Volume acumulado zero é apresentado como ausência de volume previsto, não como dado faltante.

### Visual

O hero de chuva:

- não usa fotografia;
- não usa créditos fotográficos;
- não usa `today-retail-hero__*`;
- não possui tiles auxiliares ou CTAs dentro da primeira dobra;
- usa `RainRetailHero.css` como contrato visual exclusivo;
- usa rail de 1440/48 px, compacto de 1180/32 px e gutter móvel de 20 px;
- mantém três fatos em faixa plana com divisórias.

## Vento em Pelotas

O `WindRetailHero.tsx` atual também possui DOM e CSS próprios.

A primeira dobra mostra:

- vento atual somente quando existe observação real publicável;
- maior rajada prevista nas próximas 24 horas;
- média das velocidades horárias previstas nas próximas 24 horas;
- maior rajada diária publicada na janela de 7 dias.

### Observação x previsão

O vento é chamado de `Vento medido agora` somente quando:

- `current.available` é verdadeiro;
- `current.source.kind === "observation"`;
- `current.windSpeed` está informado.

Se essa observação não estiver disponível e houver série horária, a interface muda explicitamente para `Previsão da próxima hora`.

Vento sustentado não substitui rajada ausente. Rajada `null` continua não informada; valor publicado menor ou igual a zero é descrito como `Sem rajadas`.

### Visual

O hero de vento:

- não usa fotografia;
- não usa créditos fotográficos;
- não usa o DOM compartilhado de Tempo Hoje;
- não possui tiles ou CTAs promocionais;
- usa `WindRetailHero.css` como contrato visual exclusivo;
- segue o mesmo rail e os mesmos breakpoints editoriais da família de previsão;
- apresenta três fatos em faixa plana.

## Aposentadoria da pilha retail fotográfica

Depois da migração de Hoje, Chuva e Vento, deixaram de existir consumidores de produção para a antiga pilha:

- `TodayRetailHero.css`;
- `TodayRetailHeroPhoto.css`;
- `TodayRetailHeroRefinement.css`;
- `today-retail-hero-backgrounds.ts`.

Esses arquivos foram removidos. O shared clean hero também foi reduzido ao único consumidor remanescente: Meteograma.

A barreira global de precedência continua protegendo os corpos editoriais de Chuva, Vento e 15 dias contra CSS lazy antigo, mas não interfere mais nos heroes dessas rotas.

## Corpo das páginas

Esta rodada não reescreveu os cálculos ou a hierarquia funcional dos corpos de Chuva e Vento. Os componentes existentes continuam responsáveis pelas séries horárias, semanais, proveniência, direção, acumulação e contexto oficial.

A migração desta rodada concentra-se na primeira dobra e na eliminação da dependência visual fotográfica compartilhada.

## Validação

Os contratos de fonte foram atualizados para proteger:

- DOM dedicado;
- ausência da pilha fotográfica;
- rail próprio;
- estados desconhecido/zero;
- separação medição x previsão de chuva;
- separação observação x previsão de vento;
- ausência de substituição de rajada por vento sustentado.

Código na `main`, absorção pela plataforma, propagação no domínio canônico e validação visual continuam sendo provas distintas.

# Tempo Pelotas Observatório — Comparador A/B

Data: 12/09/2026  
Estado: Swipe implementado na branch empilhada; revisão e validação executável pendentes  
Branch de trabalho: `work/observatory-comparison-ab`

## Objetivo

Adicionar ao Observatório PRO um modo de comparação temporal e visual inspirado no padrão de comparação do NASA Worldview, sem criar um segundo mapa, um segundo relógio global ou uma arquitetura paralela.

A primeira entrega é o modo **Swipe**: uma única câmera Cesium, uma cortina vertical e dois estados meteorológicos independentes, chamados A e B.

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

A posição da cortina fica entre 10% e 90% da largura para que nenhum lado desapareça completamente por acidente.

## Renderização Cesium

A implementação usa o mecanismo nativo de divisão de imagery da versão atual do Cesium: `SplitDirection.LEFT` e `SplitDirection.RIGHT`, com `scene.splitPosition` controlado pela UI.

Evitar dois `CesiumWidget` lado a lado é uma decisão permanente desta fase. Isso dobraria WebGL, terreno, câmera, memória e sincronização sem necessidade.

Para cada camada raster comparável, o runtime mantém duas instâncias simultâneas, por exemplo:

```text
compare:a:radar
compare:b:radar
compare:a:satellite
compare:b:satellite
```

O lado A usa split LEFT e o lado B usa split RIGHT.

As camadas normais do Observatório são ocultadas enquanto o comparador está ativo para evitar sobreposição ambígua. Raios, alertas e hidrologia não são falsamente duplicados nesta primeira fase.

### Concorrência e invalidação de quadros

A renderização A/B não pode substituir um lado antes de saber se o outro quadro do mesmo par também está pronto. Em trocas rápidas de horário, principalmente durante o play, uma atualização parcial permitiria misturar um A novo com um B antigo ou reintroduzir imagery depois da saída do comparador.

O runtime agora expõe `setImageLayerGroup()`. Para cada par A/B, todas as gerações são registradas antes da espera, os `SingleTileImageryProvider` são preparados em conjunto e nenhuma imagery anterior é removida até que todos os providers do grupo estejam prontos e ainda pertençam à geração atual. Só então o grupo antigo é substituído. Se qualquer provider falhar, o par já renderizado permanece intacto.

Além da revisão de seleção temporal, cada fonte temporal possui uma revisão própria de conteúdo. Quando uma recarga substitui `temporalLayersRef.current[id]`, a revisão da fonte avança. Callbacks que começaram sobre um cache antigo precisam validar tanto a revisão da timeline quanto a revisão da fonte antes de publicar `status`, `observedAt` ou `detail`. Assim, metadados de um resultado antigo não podem sobrescrever um quadro mais novo que já venceu a corrida no runtime.

A carga inicial da série temporal mantém a proteção estrutural. Depois do `await`, a revisão das camadas, a revisão da seleção temporal e a revisão do conteúdo da fonte precisam continuar compatíveis com a geração que iniciou o render.

### Falha ao carregar um novo quadro

A troca de horário pode falhar mesmo quando a série temporal já foi carregada, por exemplo se a imagem do quadro selecionado deixar de responder durante o play.

Se já existe um par A/B válido, uma falha transitória não o remove. O runtime mantém a imagery anterior, o viewer conserva o último `observedAt` efetivamente renderizado e publica `degraded`. A interface deixa claro que a atualização falhou sem apagar uma comparação válida que ainda está na tela.

Quando uma recarga de série substitui temporariamente o cache, mas a materialização do novo quadro falha, o viewer restaura o último resultado temporal utilizável e avança novamente a revisão da fonte para invalidar callbacks que dependiam do resultado descartado. Uma primeira carga realmente sem cache e sem imagery válida continua podendo terminar em `unavailable`.

## UX da primeira versão

A entrada usa a ação `Comparar` no header.

Ao ativar:

- A inicia com o estado atual do Observatório;
- B inicia com o mesmo estado, mas pode receber outro horário;
- uma barra vertical aparece sobre o globo;
- rótulos discretos `A` e `B` identificam os lados;
- o usuário arrasta a barra horizontalmente com mouse ou toque;
- teclado também move a divisão com as setas esquerda/direita;
- cada lado mostra seu horário;
- `A | B` define qual lado a timeline está editando;
- `Trocar A ↔ B` inverte os estados;
- `Sair da comparação` restaura o viewer normal sem recarregar a rota.

O botão `Comparar` só fica disponível quando radar ou satélite habilitado possui um quadro comparável coerente com o horário global. A semente usa o último quadro raster no mesmo instante ou anterior ao horário selecionado. Se o horário global for anterior ao primeiro frame disponível de radar/satélite, a semente é `null` e a entrada permanece desabilitada. O comparador nunca avança silenciosamente A/B para um quadro futuro apenas para conseguir abrir.

As camadas ficam congeladas no painel enquanto a comparação está ativa. Isso evita alterar silenciosamente a composição que originou A e B.

### Acessibilidade da cortina

O divisor é um controle focável com `role="slider"`, nome, mínimo, máximo e valor atual. O ancestral do slider não usa `aria-hidden`; apenas elementos puramente decorativos recebem esse atributo. Assim o controle continua descobrível e anunciado por tecnologias assistivas enquanto permanece operável por teclado.

## Timeline

O modo normal continua com um único `selectedTimelineAt`.

No modo comparação, cada lado tem timestamp independente:

```text
A: 12/09 18:10
B: 12/09 19:00
```

A timeline edita apenas o lado selecionado. Play, anterior, próximo, slider e `Ir para agora` obedecem ao lado A ou B ativo sem mover o outro.

A seleção de frame continua usando `loadObservatoryTemporalLayer` e `selectTemporalFrame`. Não existem endpoints exclusivos de radar ou satélite para o comparador.

## Cenários compartilháveis

O recurso é construído sobre a arquitetura de cenários compartilháveis introduzida no PR #135.

A primeira versão deliberadamente não serializa comparação no link. Enquanto o modo A/B estiver ativo, a ação normal de compartilhar cenário fica desabilitada para não gerar um link semanticamente incompleto.

Uma fase posterior pode introduzir:

```text
#comparison=<estado A/B>
```

Quando essa serialização vier, a câmera continuará sendo compartilhada.

## Limites científicos e editoriais

O comparador mostra diferenças visuais entre duas observações ou produtos. Ele não infere causalidade automaticamente.

Exemplos válidos:

- radar 18:10 × radar 19:00;
- satélite 14:00 × satélite 17:00;
- radar antes × depois de um evento;
- satélite em dois horários.

Exemplos que exigem contrato adicional:

- transformar diferença visual em estimativa automática de chuva;
- afirmar deslocamento ou velocidade sem cálculo validado;
- comparar produtos de referências incompatíveis como se fossem equivalentes.

## Contratos da fase Swipe

- fundação tipada coberta por `tests/observatory-comparison.test.ts`;
- runtime mantém imagery A e B simultaneamente;
- pares A/B são preparados e substituídos como grupo atômico, sem composição parcialmente atualizada quando um provider falha;
- `scene.splitPosition` responde ao controle visual;
- A e B usam uma única câmera e um único `CesiumWidget`;
- callbacks temporais validam revisão da timeline e revisão do conteúdo da fonte;
- carga inicial temporal só publica ou limpa estado se a geração estrutural e temporal ainda for válida;
- falha de atualização com cache preserva imagery e último timestamp efetivamente renderizado, publicando `degraded`;
- primeira carga realmente sem cache continua podendo publicar `unavailable`;
- comparação não usa frame futuro como semente quando o horário global precede todos os quadros raster disponíveis;
- timeline altera apenas o lado selecionado;
- sair do modo comparação restaura o viewer normal;
- mobile mantém controle utilizável por toque;
- teclado consegue mover a cortina;
- slider da cortina permanece na árvore de acessibilidade;
- `prefers-reduced-motion` continua respeitado;
- nenhuma dependência, fonte ou API nova é necessária;
- o workflow dedicado inclui o contrato do comparador;
- testes do Observatório, typecheck e build precisam ser executados antes de promoção.

## Validação e promoção

O PR #137 permanece deliberadamente empilhado sobre `work/observatory-share-scenarios`. Não deve ser promovido diretamente para `main` antes da estabilização do PR #135.

As revisões automáticas foram usadas como barreira de endurecimento do runtime. Além dos primeiros pontos de acessibilidade, entrada temporal e estado mestre, a implementação agora cobre rejeições de provider, invalidação por seleção temporal, falhas antes da materialização da imagem, semente raster sem salto para o futuro e invalidação de callbacks que usaram cache substituído. A troca A/B também passou a ser atômica por grupo de imagery para conservar o último par íntegro durante falhas transitórias.

A validação executável continua obrigatória. Ausência de runner GitHub-hosted não deve ser reinterpretada como aprovação nem como falha funcional do comparador.

## Próximas extensões depois do Swipe

Somente após o Swipe estar estável:

1. modo `Opacity`, alternando ou misturando A/B;
2. modo `Spy`, com lente circular;
3. presets `Antes / Depois`;
4. comparação de eventos históricos;
5. serialização completa do comparador em cenário compartilhável;
6. suporte a pontos e vetores quando o runtime tiver contrato de split apropriado.
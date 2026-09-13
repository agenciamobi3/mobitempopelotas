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

A renderização A/B não deve iniciar B somente depois de A concluir. Em trocas rápidas de horário, principalmente durante o play, isso abriria uma janela para um render antigo começar o lado B depois de um render mais novo ou até depois da saída do comparador.

A implementação atual inicia as chamadas `setImageLayer()` de A e B no mesmo ciclo e somente depois aguarda `Promise.all()`. Como o runtime registra a geração da camada antes do primeiro `await`, qualquer render posterior ou remoção invalida corretamente as promises antigas. Um quadro antigo não pode reaparecer no lado B depois da limpeza do comparador.

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

O botão `Comparar` só fica disponível depois que radar ou satélite está ativo **e** existe um timestamp temporal real. Isso impede criar A/B com `selectedAt=null` durante o primeiro carregamento e evita rótulos `Horário indisponível` enquanto a imagem já caiu silenciosamente no frame mais recente.

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
- `scene.splitPosition` responde ao controle visual;
- A e B usam uma única câmera e um único `CesiumWidget`;
- renders A/B são iniciados antes do primeiro `await`, preservando a invalidação por geração do runtime;
- comparação não inicia sem timestamp temporal real;
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

A revisão automática do commit anterior apontou quatro itens: race de render A/B, slider dentro de `aria-hidden`, entrada antes de existir timestamp e ausência do comparador no estado mestre. Os quatro foram tratados em código, contratos e documentação nesta branch.

A validação executável continua obrigatória. Ausência de runner GitHub-hosted não deve ser reinterpretada como aprovação nem como falha funcional do comparador.

## Próximas extensões depois do Swipe

Somente após o Swipe estar estável:

1. modo `Opacity`, alternando ou misturando A/B;
2. modo `Spy`, com lente circular;
3. presets `Antes / Depois`;
4. comparação de eventos históricos;
5. serialização completa do comparador em cenário compartilhável;
6. suporte a pontos e vetores quando o runtime tiver contrato de split apropriado.

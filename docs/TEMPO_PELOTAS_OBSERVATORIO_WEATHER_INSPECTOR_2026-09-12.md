# Tempo Pelotas Observatório — Weather Inspector

Data: 12/09/2026  
Estado: primeira fase implementada na branch empilhada  
Branch de trabalho: `work/observatory-weather-inspector`

## Objetivo

Adicionar ao Observatório PRO uma ferramenta de inspeção meteorológica por ponto. O usuário ativa `Inspecionar ponto`, clica no globo e recebe a previsão horária modelada para aquela coordenada, sincronizada com o horário selecionado na timeline do Observatório.

A ideia nasce da investigação do projeto `weatherman`, mas a implementação do Tempo Pelotas é própria e usa a arquitetura existente do Observatório.

## Regra semântica principal

O inspetor não transforma previsão de modelo em observação.

Radar, satélite, raios, alertas e hidrologia continuam seguindo seus contratos próprios. O painel do inspetor identifica explicitamente os valores como **dados modelados** e informa que eles não são uma medição feita por estação meteorológica.

Fonte da primeira fase: Open-Meteo `Best Match`, consumido como previsão horária por coordenada.

## Fluxo de uso

1. O usuário ativa `Inspecionar ponto` no header do Observatório.
2. O cursor do globo passa a indicar modo de inspeção.
3. Um clique no terreno é convertido pelo Cesium em latitude/longitude.
4. O ponto é normalizado e validado dentro da área regional permitida.
5. O servidor confirma novamente o entitlement do Observatório.
6. A consulta horária é feita no Open-Meteo.
7. O painel escolhe o último horário modelado que não esteja no futuro em relação ao relógio global selecionado.
8. Alterar a timeline troca o horário exibido no painel sem refazer a consulta enquanto a série carregada continuar suficiente.

## Área atendida

A primeira fase não cria um proxy meteorológico global aberto. A consulta fica limitada a uma caixa regional ampla em torno do Rio Grande do Sul e áreas vizinhas:

```text
latitude:  -35,5 a -28,0
longitude: -57,5 a -48,5
```

As coordenadas são arredondadas a quatro casas decimais antes da consulta.

## Dados exibidos

O painel mostra, quando publicados pela fonte:

- temperatura;
- sensação térmica;
- probabilidade e volume de chuva;
- vento e direção;
- rajada;
- umidade relativa;
- pressão ao nível do mar;
- cobertura de nuvens.

Ponto de orvalho também é preservado no contrato de dados para uso posterior, mesmo sem ocupar espaço na primeira interface compacta.

## Sincronização temporal

O inspetor não cria outro relógio.

A série Open-Meteo chega em resolução horária. Para o `selectedTimelineAt` do Observatório, a seleção usa o último horário do modelo que não esteja no futuro em relação à referência escolhida. Isso segue o mesmo princípio temporal conservador já usado nas camadas observacionais.

Exemplo:

```text
Timeline: 22:37
Modelo disponível: 22:00, 23:00
Inspetor usa: 22:00
```

Se o relógio do Observatório estiver antes do primeiro horário disponível na série carregada, o inspetor não antecipa o primeiro frame do modelo. Nesse caso o painel fica sem horário utilizável para aquela referência, em vez de mostrar previsão futura como se ela correspondesse ao instante selecionado.

## Cesium

`observatory-cesium-runtime.ts` passa a expor `subscribeMapClick`.

O clique usa:

- `ScreenSpaceEventHandler`;
- `ScreenSpaceEventType.LEFT_CLICK`;
- `camera.getPickRay`;
- `scene.globe.pick`;
- `Cartographic.fromCartesian`.

Isso mantém um único `CesiumWidget`. O ponto selecionado é desenhado como uma pequena primitive própria e removido ao desligar o inspetor ou entrar no comparador A/B.

## Segurança e acesso

A consulta do ponto não confia apenas no gate visual da rota.

`resolveObservatoryAccessForRequest()` centraliza a resolução do acesso atual e é reutilizado pelo server function do inspetor. Usuário sem entitlement recebe resposta fechada antes de qualquer consulta upstream.

Não foi criada chave externa, migration ou segredo novo.

## Relação com o Comparador A/B

O Weather Inspector fica desativado durante o Comparador A/B na primeira fase.

Misturar um único painel modelado com dois tempos independentes A/B criaria ambiguidade. Uma fase posterior pode definir um contrato explícito de inspeção A/B, mas isso não é inferido automaticamente agora.

Ao entrar no comparador, o modo de inspeção e o ponto selecionado são limpos.

## Cenários compartilháveis

O ponto do inspetor é transitório e não entra no codec V1 de cenário compartilhável. Compartilhar continua preservando câmera, tempo, camadas e opacidades, sem fingir que o painel de inspeção faz parte do estado persistido.

Uma versão futura pode incluir uma seleção de ponto somente depois de existir contrato versionado próprio.

## Resiliência

A consulta é feita apenas por clique, nunca por `mousemove` ou hover contínuo.

A UI usa revisão de requisição para ignorar respostas antigas se o usuário escolher outro ponto rapidamente. Falha ou timeout da fonte produz estado indisponível no painel sem alterar as camadas observacionais já visíveis.

## Contratos

`tests/observatory-inspector.test.ts` protege:

- bounds regionais e normalização das coordenadas;
- seleção temporal conservadora e ausência de frame futuro quando a referência precede a série;
- uso do mesmo gate PRO do Observatório;
- clique Cesium convertido em coordenada;
- manutenção de um único `CesiumWidget`;
- assinatura de clique somente quando a ferramenta está ativa;
- marcador do ponto;
- separação explícita entre dados modelados e observação;
- incompatibilidade deliberada com o modo A/B nesta fase.

O workflow dedicado do Observatório inclui o novo contrato.

## Próximas extensões

Depois da primeira fase estar validada:

1. gráfico temporal de 12 a 24 horas para o ponto;
2. detalhamento de ponto de orvalho e camadas de nuvens;
3. comparação do ponto entre dois modelos, quando houver proveniência clara;
4. inspector de observações reais quando existir estação identificável sob o clique;
5. modo A/B com dois horários modelados explicitamente separados;
6. trajetória/rota sobre Lagoa e costa com amostragem espacial validada.

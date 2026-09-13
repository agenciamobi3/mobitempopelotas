# Tempo Pelotas Observatório — cenários compartilháveis

Data: 12/09/2026  
Estado: implementação pronta para validação no PR #135  
Rota: `/observatorio`  
Entitlement: `observatoryAccess`

## Objetivo

Permitir que uma análise do Observatório PRO seja transportada em um único link sem criar banco, endpoint de persistência ou autenticação paralela.

O cenário representa o contexto de análise, não uma cópia dos dados meteorológicos. As fontes continuam sendo carregadas pelos contratos canônicos do Tempo Pelotas.

## Estado transportado

O formato versionado V1 preserva:

- instante global selecionado na timeline;
- camadas ativadas e desativadas;
- opacidade por camada;
- longitude, latitude e altitude da câmera Cesium;
- heading, pitch e roll da câmera.

O payload é serializado em `#scenario=...`. O fragmento não é enviado ao servidor e, portanto, não altera o gate PRO, cache ou contratos de backend.

## Segurança e validação

`src/observatory/core/ObservatoryScenario.ts`:

- aceita somente a versão conhecida;
- aceita somente IDs canônicos do catálogo do Observatório;
- normaliza opacidade e limites da câmera;
- limita o payload a 4096 caracteres;
- falha fechado para JSON, estrutura ou versão inválidos.

A URL compartilhada não contém secret, token de sessão ou dado privado da conta.

## Fluxo de autenticação

Um cenário pode ser aberto por um visitante ainda sem sessão. Como o fragmento `#scenario=...` não chega ao servidor, o redirect de `/observatorio` continua usando apenas `/conta?next=/observatorio`.

No navegador, `GoogleLoginCard` preserva exclusivamente o parâmetro `scenario` do fragmento atual e o reaplica ao `nextPath` já validado por `safeNextPath`. Dessa forma:

1. o link chega a `/observatorio#scenario=...`;
2. o servidor redireciona o visitante para `/conta?next=/observatorio`;
3. o navegador mantém o fragmento durante o redirect;
4. após o login Google, o card extrai somente `scenario` do fragmento;
5. o destino continua restrito pelo `safeNextPath` same-origin;
6. o navegador volta para `/observatorio#scenario=...`;
7. o gate PRO roda normalmente antes de o shell avançado ser montado.

Não foi criada API de transporte do cenário e nenhum hash é promovido a parâmetro server-side.

## Restauração temporal

Radar, satélite e raios possuem séries independentes e podem terminar o carregamento em ordens diferentes.

Ao abrir um cenário com várias camadas temporais ativas, o horário solicitado não é consumido quando a primeira fonte responde. O shell mantém:

- conjunto das fontes temporais esperadas pelo cenário;
- conjunto das fontes que já assentaram, inclusive quando uma delas termina vazia ou indisponível;
- timestamp originalmente solicitado.

Somente quando todas as fontes temporais ativas do cenário assentam o Observatório resolve o horário solicitado contra a união final de timestamps disponíveis. Isso evita abrir um cenário em um frame aproximado apenas porque a fonte que continha o timestamp exato respondeu por último.

Depois da restauração inicial, o relógio volta ao comportamento normal e permanece único para todas as camadas temporais ativas.

## Câmera Cesium

O runtime expõe:

- `getCameraState`;
- `setCameraState`;
- `subscribeCameraChange`.

A câmera é capturada ao final do movimento e restaurada quando o cenário é aberto. O link reconstrói a mesma região e orientação, não apenas a rota `/observatorio`.

## UI

O header do Observatório contém `Compartilhar`.

Ao acionar:

- o estado atual é normalizado;
- a URL completa é construída no navegador;
- Clipboard API é usada quando disponível;
- existe fallback de cópia para ambientes sem permissão da Clipboard API;
- o botão informa `Link copiado` ou falha de cópia.

## Contratos

`tests/observatory-scenario.test.ts` protege:

- round-trip do codec;
- falha fechada;
- IDs e limites canônicos;
- restauração de câmera;
- espera por todas as fontes temporais esperadas;
- preservação do cenário através do login sem abrir redirect externo.

`.github/workflows/observatory-foundation.yml` inclui o contrato do cenário junto dos demais contratos do Observatório.

## Relação com dados públicos

O cenário não privatiza nem replica os dados públicos. Ele transporta a ferramenta de leitura construída sobre os mesmos contratos que alimentam as superfícies públicas.

O valor PRO está na composição, navegação espacial, sincronização temporal e possibilidade de compartilhar a análise preparada.

## Próxima evolução

O Comparador A/B deve reutilizar esta fundação de estado, mas sua serialização completa fica para fase própria. Enquanto um modo de comparação não possuir codec completo, o produto não deve gerar link que pareça preservar um estado A/B incompleto.

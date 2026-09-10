# Tempo Pelotas — arquitetura do gerador de widgets

Última atualização: 10/09/2026  
Estado: fundação publicada; 5 módulos; aparência, apresentação, blocos controlados e prévia real versionados

## Objetivo

Permitir que uma pessoa autenticada crie widgets responsivos para incorporar em sites externos sem copiar lógica de fontes, expor credenciais ou depender do CSS/JavaScript do site hospedeiro.

A personalização existe para encaixar o widget visualmente no site do usuário, mas continua sendo uma superfície controlada pelo Tempo Pelotas. Não há editor de CSS, HTML ou JavaScript arbitrário.

## Política Free desta fase

A conta Free permanece propositalmente generosa:

- acesso e criação de widgets: habilitados;
- quantidade: sem limite nesta fase (`widgetsMax=null`);
- cinco módulos atuais habilitados;
- quatro estilos predefinidos habilitados;
- ajustes de cor, cantos e densidade habilitados;
- apresentações Cartão, Compacto e Horizontal habilitadas;
- escolha de blocos visíveis habilitada;
- prévia real antes da criação habilitada;
- marca Tempo Pelotas mantida;
- billing comercial inexistente nesta frente.

Uma futura segmentação PRO deve ocorrer por entitlement e nunca transformar dado público do portal em dado privado.

## Módulos

O `Widget Registry` em `src/lib/widgets/widget-registry.ts` permanece a fonte de verdade dos módulos gerenciáveis:

1. `nivel-laranjal` — nível da Lagoa dos Patos no Laranjal;
2. `status-tempo-agora` — temperatura observada e condição atual;
3. `previsao-7-dias` — sete dias consolidados;
4. `chuva-pelotas` — observação e previsão de chuva mantidas separadas;
5. `vento-pelotas` — vento e rajadas atuais e previstos.

As fontes e regras meteorológicas/hidrológicas continuam nos serviços originais. O builder controla apresentação, não a verdade do dado.

## Aparência controlada

`src/lib/widgets/widget-appearance.ts` centraliza os presets e tokens seguros.

Presets atuais:

- `tempo-dark` — Tempo Dark;
- `clean-light` — Claro Editorial;
- `soft-glass` — Glass Suave;
- `minimal-neutral` — Minimal.

Ajustes permitidos:

- `accentColor`: HEX de seis dígitos;
- `radius`: inteiro entre 0 e 36 px;
- `density`: `comfortable|compact`.

Não são aceitos CSS livre, HTML customizado, JavaScript do usuário, URL arbitrária de fonte/imagem ou remoção da marca no Free.

## Apresentação e blocos

`src/lib/widgets/widget-content.ts` centraliza a segunda camada de configuração.

Apresentações permitidas:

- `card` — Cartão: largura equilibrada para páginas e colunas;
- `compact` — Compacto: até aproximadamente 420 px, adequado a sidebar, rodapé e grids estreitos;
- `horizontal` — Horizontal: ocupa a largura disponível e reorganiza os blocos em faixas/colunas quando há espaço.

Em telas estreitas o modo Horizontal volta a uma coluna para não criar overflow.

Os blocos configuráveis são fechados por módulo:

- `nivel-laranjal`: movimento recente, gráfico recente, horário da leitura;
- `status-tempo-agora`: ícone e descrição da condição; temperatura permanece como núcleo do módulo;
- `previsao-7-dias`: chuva, rajadas e horário de atualização; dias e mínima/máxima permanecem como núcleo;
- `chuva-pelotas`: chuva observada, previsão de hoje e próximas horas;
- `vento-pelotas`: vento atual, rajada atual e próximas horas.

O editor impede desligar o último bloco configurável. O servidor também valida cada chave contra o catálogo do módulo, portanto um cliente adulterado não consegue persistir um bloco inventado.

## Prévia real antes de criar

O builder não usa uma maquete com temperatura ou previsão fictícia. A prévia aponta para o mesmo renderer `/embed/widget` e utiliza as mesmas funções de dados do widget definitivo.

Uma definição efêmera é formada apenas com parâmetros enumerados e validados:

- módulo;
- preset;
- cor;
- raio;
- densidade;
- apresentação;
- blocos permitidos.

A definição recebe `publicToken=preview`, não cria registro no banco e não aceita código arbitrário. O payload é carregado pelas mesmas funções reais:

- `getLaranjalLevelData`;
- `getObsWeatherStatus`;
- `getAggregatedPelotasWeather`.

O iframe devolve sua altura pelo mesmo protocolo `tempo-pelotas-widget`. O builder valida origem, `contentWindow`, token e tipo da mensagem antes de ajustar a altura. Widgets já salvos usam o mesmo mecanismo na prévia do painel.

## Persistência e compatibilidade

A migration `20260829061000_create_user_widgets.sql` continua suficiente. Nenhuma migration adicional é necessária para aparência/apresentação porque `user_widgets.config` já é JSON controlado pelo produto.

Estrutura relevante:

- `config.appearance`: preset, cor, raio e densidade;
- `config.content`: apresentação e lista de blocos visíveis.

Criação e edição fazem merge no JSON para não destruir futuras configurações. Atualização de widget existente usa owner + versão atual como condição, evitando sobrescrita silenciosa concorrente.

Widgets antigos sem `config.content` recebem `card` + todos os blocos do módulo. Widgets sem `config.appearance` continuam usando o fallback legado de tema. Assim não há migração destrutiva dos registros existentes.

## Segurança

Permanece válido:

- RLS em `user_widgets`;
- usuário autenticado só altera os próprios widgets;
- `anon` não recebe `SELECT` na tabela;
- o público resolve apenas widget ativo pela RPC `get_public_widget(uuid)`;
- a RPC não retorna `user_id`;
- token inválido ou widget pausado não revela metadados privados;
- aparência e conteúdo exigem entitlement de personalização;
- `visibleBlocks` é validado contra o catálogo do tipo do widget;
- nenhum campo aceita CSS/HTML/JavaScript fornecido pelo usuário.

## Fluxo do usuário

Em `/widgets`:

1. escolhe o módulo;
2. define um nome;
3. escolhe um preset visual;
4. refina cor, cantos e densidade;
5. escolhe Cartão, Compacto ou Horizontal;
6. liga/desliga apenas os blocos permitidos para aquele módulo;
7. vê a prévia real antes de gravar;
8. cria o widget;
9. copia o snippet;
10. posteriormente reabre **Personalizar widget**, salva nova versão, pausa ou reativa.

O snippet público não muda quando a pessoa edita aparência ou conteúdo.

## Contrato de incorporação

```html
<script
  src="https://tempopelotas.com.br/widgets/embed.js"
  data-widget="UUID_PUBLICO"
  async
></script>
```

`public/widgets/embed.js` cria iframe isolado, usa largura 100%, valida mensagens pela origem/token/frame e ajusta a altura. O CSS do site hospedeiro não é injetado dentro do widget e o CSS do widget não escapa para o site.

O renderer marca sua raiz com:

- `data-widget-preset`;
- `data-widget-scheme`;
- `data-widget-density`;
- `data-widget-presentation`.

`ManagedWidgetAppearance.css` transforma esses atributos em layout responsivo. A personalização nunca altera fonte, unidade, horário, proveniência ou semântica dos dados.

## Entitlements

`AccountEntitlements` continua contendo os gates de acesso, criação, módulos, temas avançados e remoção de marca. Nesta fase `widgetsAdvancedThemes=true` no Free e também governa apresentação/blocos controlados. `widgetsRemoveBranding=false` permanece separado.

## Testes

`tests/widget-builder-foundation.test.ts` protege a fundação V1.

`tests/widget-builder-appearance.test.ts` protege presets, tokens, HEX, radius, density, owner, versionamento, isolamento e acessibilidade visual. Esse arquivo também importa o contrato da camada de conteúdo para que o step dedicado do workflow cubra a experiência completa do builder.

`tests/widget-builder-content.test.ts` protege:

- as três apresentações permitidas;
- defaults e normalização por módulo;
- rejeição de blocos inventados;
- preservação de outras chaves em `config`;
- impossibilidade de desligar o último bloco no editor;
- persistência por owner e versão;
- prévia real antes de criar;
- validação das mensagens do iframe;
- autoaltura de previews salvos;
- uso das mesmas funções de dados no preview e no widget definitivo;
- aplicação dos blocos nos cinco módulos;
- responsividade do modo Horizontal.

## Gate atual

O workflow `Qualidade` continua configurado para executar o contrato de personalização em step dedicado, seguido de build, rotas, TypeScript, lint e navegador. Em 10/09/2026 os runs observados ainda encerravam antes do primeiro step (`runner_id=0`, `steps=[]`). Enquanto isso persistir, vermelho sem steps significa indisponibilidade do runner, não reprovação do código.

Antes de restringir qualquer recurso do Free, deve-se observar uso real e definir a proposta do futuro plano pago.

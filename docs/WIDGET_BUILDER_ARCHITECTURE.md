# Tempo Pelotas — arquitetura do gerador de widgets

Última atualização: 29/08/2026  
Estado: fundação V1 publicada; expansão meteorológica em validação

## Objetivo

Permitir que uma pessoa autenticada no Tempo Pelotas crie widgets responsivos para incorporar em sites externos sem copiar lógica de fontes, expor credenciais ou depender do CSS/JavaScript do site hospedeiro.

A fundação também prepara o produto para uma futura camada paga por módulos. Billing comercial não faz parte deste workset.

## Política de produto da fase atual

A camada Free nasce propositalmente generosa para estimular cadastro, uso real e aprendizado de produto:

- acesso ao gerador: habilitado;
- criação: habilitada;
- quantidade de widgets: sem limite nesta fase (`widgetsMax=null`);
- Nível do Laranjal: habilitado;
- Tempo agora em Pelotas: habilitado;
- Previsão de 7 dias: habilitada no registry e em validação de publicação;
- marca Tempo Pelotas: mantida;
- billing: inexistente;
- bloqueio por plano: somente infraestrutura, ainda sem venda comercial.

Uma futura mudança para PRO deve ocorrer pelos entitlements centrais, módulo por módulo, sem alterar o caráter público dos dados que já são públicos no portal.

## Módulos

O `Widget Registry` em `src/lib/widgets/widget-registry.ts` é a fonte de verdade para módulos gerenciáveis.

1. `nivel-laranjal`
   - reutiliza o componente responsivo já existente do nível da Lagoa dos Patos no Laranjal;
   - entitlement: `widgetsLaranjal`.

2. `status-tempo-agora`
   - reutiliza o widget compacto já existente de temperatura observada + condição;
   - entitlement: `widgetsCurrentWeather`.

3. `previsao-7-dias`
   - usa a consolidação meteorológica já existente em `getAggregatedPelotasWeather`;
   - exibe os sete primeiros dias com mínima, máxima, chuva e rajada;
   - possui renderer compacto próprio em `SevenDayForecastWidget`;
   - atualiza a prévia periodicamente sem criar uma nova integração de fonte;
   - entitlement: `widgetsSevenDayForecast`.

Novos módulos entram no registry antes de aparecerem no gerador. Não há HTML/JavaScript arbitrário definido pelo usuário.

## Persistência e segurança

A migration `20260829061000_create_user_widgets.sql` cria `public.user_widgets`.

Cada registro possui:

- `user_id` privado;
- `public_token` UUID aleatório e único;
- `widget_type`;
- título interno/de acessibilidade;
- `theme`;
- `config` JSON controlado pelo produto;
- estado `active|inactive`;
- versão;
- timestamps.

Regras:

- RLS ligada;
- usuário autenticado só lê/cria/altera/exclui os próprios widgets;
- `anon` não recebe `SELECT` na tabela;
- o público resolve somente widgets ativos pela RPC `get_public_widget(uuid)`;
- a RPC não retorna `user_id`;
- token inválido, inexistente ou widget pausado não revela metadados da conta.

Validação no Supabase oficial em 29/08/2026 confirmou:

- RLS ativa;
- quatro policies de owner;
- `anon_select=false` na tabela;
- `authenticated_select=true`;
- `anon` pode executar apenas a RPC pública;
- token UUID inexistente retornou zero linhas;
- a tabela `user_widgets` continuava com zero registros antes da expansão de 7 dias, portanto nenhuma conta real foi usada silenciosamente para validar a feature.

## Fluxo do usuário

A área autenticada está em `/widgets` e é descoberta pelo módulo “Gerador de widgets” em `/painel`.

Fluxo:

1. usuário escolhe um módulo habilitado;
2. define o nome do widget;
3. cria o registro vinculado à própria conta;
4. recebe uma prévia;
5. copia o snippet;
6. pode pausar ou reativar o widget.

O V1 grava `theme=auto`. A infraestrutura de tema existe, mas personalização visual avançada ainda não está exposta como funcionalidade completa.

## Contrato de incorporação

Snippet canônico:

```html
<script
  src="https://tempopelotas.com.br/widgets/embed.js"
  data-widget="UUID_PUBLICO"
  async
></script>
```

O domínio público do embed é sempre `https://tempopelotas.com.br`.

`public/widgets/embed.js`:

- cria um iframe isolado;
- usa largura `100%`;
- valida `postMessage` pela origem canônica, pelo `contentWindow` do iframe e pelo token;
- ajusta a altura automaticamente;
- não injeta estilos do Tempo Pelotas no documento hospedeiro.

O renderer `/embed/widget?token=...`:

- é `noindex`;
- resolve apenas token ativo;
- seleciona o módulo pelo registry;
- reutiliza componentes controlados pelo Tempo Pelotas;
- envia a altura com `ResizeObserver`;
- recebe `frame-ancestors *` somente porque é uma superfície dedicada de embed;
- força `Cache-Control: no-store` e `CDN-Cache-Control: no-store` no wrapper de resposta para que pausa/reativação não fique presa em cache intermediário.

As páginas normais do portal não têm sua política de frame relaxada por causa desta feature. Os embeds públicos fixos continuam com a política de cache anterior.

## Entitlements preparados

`AccountEntitlements` contém:

- `widgetsAccess`;
- `widgetsCreate`;
- `widgetsMax`;
- `widgetsLaranjal`;
- `widgetsCurrentWeather`;
- `widgetsSevenDayForecast`;
- `widgetsAdvancedThemes`;
- `widgetsRemoveBranding`.

`widgetsAdvancedThemes` e `widgetsRemoveBranding` são infraestrutura de evolução. Remoção de marca ainda não está implementada no renderer V1 e não deve ser anunciada como disponível.

## Evolução planejada

Próximos candidatos naturais, sujeitos à estabilidade/licença/semântica de cada fonte:

- chuva e acumulados;
- vento e rajadas;
- nível do Guaíba;
- rede regional da Lagoa dos Patos;
- alertas oficiais;
- radar;
- widgets compostos.

Antes de restringir qualquer módulo Free, observar uso real e definir proposta de valor do futuro plano pago.

## Gates de validação

1. `/widgets`, `/widgets/embed.js` e `/embed/widget` estão versionados e já tiveram publicação funcional observada;
2. o renderer gerenciado está codificado como `no-store`, mas a prova externa dos headers no domínio canônico ainda deve ser repetida por um cliente HTTP que exponha cabeçalhos;
3. o E2E autenticado completo continua pendente até existir uma conta descartável apropriada; contas reais não serão usadas silenciosamente;
4. `previsao-7-dias` foi implementado de forma staged na `main`, reutilizando a consolidação existente e sem escrita em `user_widgets`;
5. só depois da validação visual/publicação desse módulo avançar para chuva e, em seguida, vento.

GitHub Actions não é gate operacional até 01/09/2026. Até essa data, a validação desta frente usa inspeção de código, contratos versionados, sincronização GitHub → Lovable, smoke de publicação quando disponível e verificações no Supabase que não alterem contas reais.

## Testes

`tests/widget-builder-foundation.test.ts` protege:

- Free aberto nesta fase;
- módulos registrados;
- entitlement próprio da previsão de 7 dias;
- RLS/RPC pública;
- gates de sessão/entitlement/owner;
- canonical do embed;
- protocolo responsivo por `postMessage`;
- liberação de frame apenas na rota dedicada;
- `no-store` no renderer gerenciado;
- reutilização da consolidação meteorológica no módulo de 7 dias;
- descoberta pelo painel.

O contrato está incluído em `test:contracts`. Enquanto GitHub Actions estiver fora do gate até 01/09/2026, versionar o teste não equivale a declarar sua execução.

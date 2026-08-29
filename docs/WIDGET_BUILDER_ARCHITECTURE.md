# Tempo Pelotas — arquitetura do gerador de widgets

Última atualização: 29/08/2026  
Estado: fundação V1 em implantação/publicação

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
- marca Tempo Pelotas: mantida;
- billing: inexistente;
- bloqueio por plano: somente infraestrutura, ainda sem venda comercial.

Uma futura mudança para PRO deve ocorrer pelos entitlements centrais, módulo por módulo, sem alterar o caráter público dos dados que já são públicos no portal.

## Módulos V1

O `Widget Registry` em `src/lib/widgets/widget-registry.ts` é a fonte de verdade para módulos gerenciáveis.

Módulos iniciais:

1. `nivel-laranjal`
   - reutiliza o componente responsivo já existente do nível da Lagoa dos Patos no Laranjal;
   - entitlement: `widgetsLaranjal`.

2. `status-tempo-agora`
   - reutiliza o widget compacto já existente de temperatura observada + condição;
   - entitlement: `widgetsCurrentWeather`.

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
- token UUID inexistente retornou zero linhas.

## Fluxo do usuário

A área autenticada está em `/widgets` e é descoberta pelo módulo “Gerador de widgets” em `/painel`.

Fluxo V1:

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
- recebe `frame-ancestors *` somente porque é uma superfície dedicada de embed.

As páginas normais do portal não têm sua política de frame relaxada por causa desta feature.

## Entitlements preparados

`AccountEntitlements` agora contém:

- `widgetsAccess`;
- `widgetsCreate`;
- `widgetsMax`;
- `widgetsLaranjal`;
- `widgetsCurrentWeather`;
- `widgetsAdvancedThemes`;
- `widgetsRemoveBranding`.

`widgetsAdvancedThemes` e `widgetsRemoveBranding` são infraestrutura de evolução. Remoção de marca ainda não está implementada no renderer V1 e não deve ser anunciada como disponível.

## Evolução planejada

Candidatos naturais, sujeitos à estabilidade/licença/semântica de cada fonte:

- previsão de 7 dias;
- chuva e acumulados;
- vento e rajadas;
- nível do Guaíba;
- rede regional da Lagoa dos Patos;
- alertas oficiais;
- radar;
- widgets compostos.

Antes de restringir qualquer módulo Free, observar uso real e definir proposta de valor do futuro plano pago.

## Gates antes de ampliar módulos

1. publicar e validar `/widgets` no domínio canônico;
2. validar `/widgets/embed.js` e `/embed/widget` com headers de frame corretos;
3. realizar E2E autenticado com conta descartável quando o fluxo de autenticação estiver pronto para teste completo;
4. confirmar criação, pausa e reativação no browser real;
5. só então adicionar 7 dias/chuva/vento ao registry.

## Testes

`tests/widget-builder-foundation.test.ts` protege:

- Free aberto nesta fase;
- módulos iniciais;
- RLS/RPC pública;
- gates de sessão/entitlement/owner;
- canonical do embed;
- protocolo responsivo por `postMessage`;
- liberação de frame apenas na rota dedicada;
- descoberta pelo painel.

O contrato está incluído em `test:contracts`. Enquanto GitHub Actions continuar bloqueado antes dos steps, versionar o teste não equivale a declarar sua execução.

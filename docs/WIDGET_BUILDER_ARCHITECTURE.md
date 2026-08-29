# Tempo Pelotas — arquitetura do gerador de widgets

Última atualização: 29/08/2026  
Estado: fundação V1 publicada; expansão meteorológica com 5 módulos versionada

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
- Previsão de 7 dias: habilitada;
- Chuva em Pelotas: habilitada;
- Vento e rajadas: habilitado;
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
   - usa `getAggregatedPelotasWeather`;
   - exibe sete dias com mínima, máxima, chuva e rajadas;
   - renderer compacto: `SevenDayForecastWidget`;
   - entitlement: `widgetsSevenDayForecast`.

4. `chuva-pelotas`
   - usa a mesma consolidação meteorológica do portal;
   - mantém chuva observada da Embrapa separada da chuva prevista;
   - exibe chance e volume das próximas horas sem somar janelas incompatíveis;
   - renderer compacto: `RainWidget`;
   - entitlement: `widgetsRain`.

5. `vento-pelotas`
   - usa a consolidação meteorológica existente;
   - exibe vento e rajada atuais mais tendência horária de velocidade e rajadas;
   - renderer compacto: `WindWidget`;
   - entitlement: `widgetsWind`.

Não há HTML/JavaScript arbitrário definido pelo usuário.

A validação de criação deixou de repetir uma enumeração manual dos módulos: `widget.functions.ts` valida o valor contra `isWidgetType`, derivado do próprio registry. Isso evita que um novo módulo apareça no gerador mas seja rejeitado pelo endpoint de criação por desalinhamento entre listas.

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
- `user_widgets` estava com zero registros durante esta rodada; nenhuma conta real foi usada silenciosamente para criar widgets de teste.

## Fluxo do usuário

A área autenticada está em `/widgets` e é descoberta pelo módulo “Gerador de widgets” em `/painel`.

Fluxo:

1. usuário escolhe um módulo habilitado;
2. define o nome do widget;
3. cria o registro vinculado à própria conta;
4. recebe uma prévia;
5. copia o snippet;
6. pode pausar ou reativar o widget.

Se a sessão expirar durante a criação, o login retorna para `/widgets`. A antiga referência incorreta a `/conta/widgets` foi removida.

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
- `widgetsRain`;
- `widgetsWind`;
- `widgetsAdvancedThemes`;
- `widgetsRemoveBranding`.

`widgetsAdvancedThemes` e `widgetsRemoveBranding` são infraestrutura de evolução. Remoção de marca ainda não está implementada no renderer V1 e não deve ser anunciada como disponível.

## Evolução planejada

Com os cinco módulos-base cobertos, os próximos candidatos naturais são:

- nível do Guaíba;
- rede regional da Lagoa dos Patos;
- alertas oficiais;
- radar;
- widgets compostos;
- opções de apresentação/configuração controladas pelo registry.

Antes de restringir qualquer módulo Free, observar uso real e definir proposta de valor do futuro plano pago.

## Gates de validação

1. `/widgets`, `/widgets/embed.js` e `/embed/widget` estão versionados e já tiveram publicação funcional observada em rodadas anteriores;
2. o renderer gerenciado está codificado como `no-store`, mas a prova externa dos headers no domínio canônico ainda deve ser repetida por um cliente HTTP que exponha cabeçalhos;
3. o E2E autenticado completo continua pendente até existir uma conta descartável apropriada; contas reais não serão usadas silenciosamente;
4. Previsão de 7 dias, Chuva e Vento reutilizam a consolidação meteorológica existente, sem novas credenciais e sem escrita extra de dados meteorológicos;
5. em 29/08/2026 o Lovable aceitou novo deploy da expansão; a sincronização GitHub → Lovable é verificada pelos arquivos críticos antes de cada publicação.

GitHub Actions não é gate operacional até 01/09/2026. Até essa data, a validação desta frente usa inspeção de código, contratos versionados, sincronização GitHub → Lovable, smoke de publicação quando disponível e verificações no Supabase que não alterem contas reais.

## Testes

`tests/widget-builder-foundation.test.ts` protege:

- Free aberto nesta fase;
- cinco módulos registrados;
- entitlements por módulo;
- criação derivada de `isWidgetType`, sem enum paralela;
- RLS/RPC pública;
- gates de sessão/entitlement/owner;
- retorno correto ao gerador após login;
- canonical do embed;
- protocolo responsivo por `postMessage`;
- liberação de frame apenas na rota dedicada;
- `no-store` no renderer gerenciado;
- reutilização da consolidação meteorológica no módulo de 7 dias;
- separação entre chuva observada e prevista;
- vento e rajadas atuais + tendência horária;
- descoberta pelo painel.

O contrato está incluído em `test:contracts`. Enquanto GitHub Actions estiver fora do gate até 01/09/2026, versionar o teste não equivale a declarar sua execução.

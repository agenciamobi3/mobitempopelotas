# Tempo Pelotas — arquitetura do gerador de widgets

Última atualização: 10/09/2026  
Estado: fundação publicada; 5 módulos; V2 de aparência predefinida e editável versionada

## Objetivo

Permitir que uma pessoa autenticada no Tempo Pelotas crie widgets responsivos para incorporar em sites externos sem copiar lógica de fontes, expor credenciais ou depender do CSS/JavaScript do site hospedeiro.

A personalização visual deve ajudar o widget a se integrar ao site do usuário sem abrir uma superfície de HTML/CSS arbitrário. Billing comercial não faz parte deste workset.

## Política de produto da fase atual

A camada Free permanece propositalmente generosa para estimular cadastro, uso real e aprendizado de produto:

- acesso ao gerador: habilitado;
- criação: habilitada;
- quantidade de widgets: sem limite nesta fase (`widgetsMax=null`);
- Nível do Laranjal: habilitado;
- Tempo agora em Pelotas: habilitado;
- Previsão de 7 dias: habilitada;
- Chuva em Pelotas: habilitada;
- Vento e rajadas: habilitado;
- estilos predefinidos e ajustes visuais controlados: habilitados;
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

A validação de criação não repete uma enumeração manual dos módulos: `widget.functions.ts` valida o valor contra `isWidgetType`, derivado do próprio registry. Isso evita desalinhamento entre gerador e endpoint.

## V2 de aparência

`src/lib/widgets/widget-appearance.ts` centraliza a aparência permitida. O usuário começa por um preset e pode ajustar somente tokens seguros.

Presets Free atuais:

1. `tempo-dark` — Tempo Dark, escuro e editorial;
2. `clean-light` — Claro Editorial, adequado a sites institucionais claros;
3. `soft-glass` — Glass Suave, translúcido para páginas com fotografia/gradientes;
4. `minimal-neutral` — Minimal, mais compacto e com pouco ornamento.

Ajustes permitidos:

- `accentColor`: HEX de 6 dígitos;
- `radius`: inteiro entre 0 e 36 px;
- `density`: `comfortable|compact`.

Não são aceitos:

- CSS livre;
- `style` arbitrário vindo do browser;
- HTML customizado;
- JavaScript do usuário;
- URL de fonte/imagem arbitrária;
- remoção de marca no Free.

Selecionar outro preset restaura os defaults coerentes daquela base. Depois disso, cor, cantos e densidade podem ser refinados.

O builder apresenta uma amostra imediata. Em widgets existentes, o usuário abre **Personalizar estilo**, altera os tokens e salva; a versão do widget é incrementada e a prévia real é recarregada com `?v=<version>` sem mudar o snippet público.

## Persistência e segurança

A migration `20260829061000_create_user_widgets.sql` cria `public.user_widgets`.

Cada registro possui:

- `user_id` privado;
- `public_token` UUID aleatório e único;
- `widget_type`;
- título interno/de acessibilidade;
- `theme` legado/compatibilidade (`auto|light|dark`);
- `config` JSON controlado pelo produto;
- estado `active|inactive`;
- versão;
- timestamps.

A V2 não exige migration nova. A aparência é armazenada em `config.appearance`, preservando futuras configurações de conteúdo no mesmo objeto. `theme` continua preenchido como compatibilidade e é derivado do esquema do preset.

Regras:

- RLS ligada;
- usuário autenticado só lê/cria/altera/exclui os próprios widgets;
- `anon` não recebe `SELECT` na tabela;
- o público resolve somente widgets ativos pela RPC `get_public_widget(uuid)`;
- a RPC não retorna `user_id`;
- token inválido, inexistente ou widget pausado não revela metadados da conta;
- atualização de aparência exige `widgetsAdvancedThemes` e owner;
- update visual usa a versão atual como condição, evitando sobrescrita silenciosa concorrente;
- atualização visual faz merge em `config`, não apaga chaves de conteúdo futuras.

Widgets antigos sem `config.appearance` permanecem válidos: `theme=light` é interpretado como `clean-light`; os demais temas legados usam `tempo-dark` como fallback seguro.

## Fluxo do usuário

A área autenticada está em `/widgets` e é descoberta pelo módulo “Gerador de widgets” em `/painel`.

Fluxo de criação:

1. usuário escolhe um módulo habilitado;
2. define o nome do widget;
3. escolhe um dos quatro estilos predefinidos;
4. refina cor de destaque, arredondamento e densidade;
5. cria o registro vinculado à própria conta;
6. recebe a prévia real;
7. copia o snippet;
8. pode reabrir o editor visual, salvar nova versão, pausar ou reativar o widget.

Se a sessão expirar durante criação/edição, o login retorna para `/widgets`.

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
- normaliza `config.appearance` no servidor;
- converte o preset em design tokens/CSS variables controladas;
- marca o wrapper com `data-widget-preset`, `data-widget-scheme` e `data-widget-density`;
- aplica `ManagedWidgetAppearance.css` somente dentro do iframe;
- reutiliza componentes controlados pelo Tempo Pelotas;
- envia a altura com `ResizeObserver`;
- recebe `frame-ancestors *` somente porque é uma superfície dedicada de embed;
- força `Cache-Control: no-store` e `CDN-Cache-Control: no-store` no wrapper de resposta para que pausa/reativação e mudanças visuais não fiquem presas em cache intermediário.

As páginas normais do portal não têm sua política de frame relaxada por causa desta feature. Os embeds públicos fixos continuam com a política de cache anterior.

## Entitlements

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

Nesta fase, `widgetsAdvancedThemes=true` no Free. Isso libera presets e tokens de aparência controlados. `widgetsRemoveBranding=false` permanece separado e a marca Tempo Pelotas continua presente.

## Evolução planejada

Depois da V2 visual, os próximos candidatos naturais são:

- opções controladas de conteúdo por módulo, como densidade informacional e métricas exibidas;
- nível do Guaíba;
- rede regional da Lagoa dos Patos;
- alertas oficiais;
- radar;
- widgets compostos.

A próxima camada de configuração deve continuar obedecendo à mesma regra: opções enumeradas pelo produto, sem código arbitrário fornecido pelo usuário.

Antes de restringir qualquer módulo Free, observar uso real e definir proposta de valor do futuro plano pago.

## Gates de validação

1. `/widgets`, `/widgets/embed.js` e `/embed/widget` estão versionados e já tiveram publicação funcional observada em rodadas anteriores;
2. a V2 visual precisa passar pelos contratos, build, typecheck e navegador quando o runner do GitHub Actions voltar a receber jobs normalmente;
3. o E2E autenticado de criação + edição deve usar conta descartável apropriada; contas reais não serão modificadas silenciosamente;
4. Previsão de 7 dias, Chuva e Vento continuam reutilizando a consolidação meteorológica existente, sem novas credenciais e sem escrita extra de dados meteorológicos;
5. a personalização não altera fonte, unidade, horário, proveniência ou semântica do dado.

Em 10/09/2026 o workflow `Qualidade` continuava apresentando falha de infraestrutura antes do primeiro step (`runner_id=0`, `steps=[]`) em runs anteriores. Enquanto esse estado persistir, uma conclusão vermelha sem steps não deve ser interpretada como reprovação do código.

## Testes

`tests/widget-builder-foundation.test.ts` continua protegendo a fundação V1.

`tests/widget-builder-appearance.test.ts` protege a V2:

- quatro presets atuais;
- entitlement de temas avançados no Free;
- defaults dos presets;
- normalização de HEX, radius e density;
- rejeição/fallback de configuração inválida;
- merge que preserva outras chaves do `config`;
- design tokens do renderer;
- presença dos controles radio/color/range/density;
- edição de widgets existentes;
- versionamento otimista por owner;
- ausência de HTML/CSS arbitrário;
- aplicação isolada no renderer;
- responsividade 4 → 2 → 1, foco, reduced motion e forced colors.

O workflow `Qualidade` executa o contrato de aparência em step dedicado além dos contratos rápidos da fundação.

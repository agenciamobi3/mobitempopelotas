# SEO — log de implementação

Data: 26/08/2026  
Branch: `main`

## Etapa 1 — ativos hidrológicos existentes

Status: **implementação iniciada**.

Esta primeira rodada aplica o plano de intenção de busca sem criar novas URLs e sem alterar coletores.

### `/nivel-da-lagoa-dos-patos-laranjal`

Objetivo SEO/produto:

- absorver de forma natural as buscas `nível da Lagoa dos Patos hoje` e `nível da Lagoa dos Patos Pelotas`;
- preservar a URL canônica existente;
- responder já na primeira dobra com última leitura, horário, estado de atualização, tendência e variações de 1 h, 6 h e 24 h;
- manter explícito que a referência pertence à Estação Laranjal e não representa toda a Lagoa nem uma cota oficial de inundação.

Mudanças desta rodada:

- title e description aproximados da linguagem observada no Google Trends;
- H1 e abertura da primeira dobra orientados à intenção `hoje`;
- FAQ visível para `Qual é o nível da Lagoa dos Patos hoje em Pelotas?`;
- structured data acompanha somente conteúdo visível;
- nenhuma alteração no coletor LabHidroSens/UFPel.

### `/situacao-hidrologica-pelotas`

Objetivo SEO/produto:

- absorver as intenções `enchente em Pelotas hoje` e `risco de enchente em Pelotas` sem criar páginas redundantes;
- não transformar leitura de régua, previsão meteorológica ou classificação regional em diagnóstico automático para Pelotas;
- colocar uma resposta rápida antes da exploração detalhada das redes.

Mudanças desta rodada:

- title e description em formato de pergunta, sem afirmar que existe enchente;
- novo bloco `Há enchente em Pelotas hoje?` logo após o hero;
- resumo do estado da Estação Laranjal, disponibilidade da rede da Lagoa e transmissão/classificação do SACE;
- links diretos para alertas oficiais e nível do Laranjal;
- FAQ para `Há enchente em Pelotas hoje?` e `Existe risco de enchente em Pelotas?`;
- ausência, atraso e falta de transmissão continuam sem ser convertidos em normalidade ou segurança.

## Contratos preservados

- observação local continua separada de previsão;
- classificação do SACE pertence a cada estação;
- valores de réguas diferentes não são convertidos entre si;
- nenhum nível isolado gera diagnóstico de enchente para Pelotas;
- comunicações de segurança continuam remetendo à Defesa Civil e autoridades competentes;
- nenhuma nova URL entra no sitemap nesta etapa.

## Testes adicionados

`tests/seo-hydrology-search-intent.test.ts`

O contrato cobre:

- preservação das URLs canônicas existentes;
- linguagem `hoje` na página do Laranjal;
- pergunta `enchente em Pelotas hoje` sem afirmação automática;
- estados `live`, `stale` e `unavailable`;
- proibição de frases que impliquem segurança ou diagnóstico inferido;
- responsividade e acessibilidade básica do novo bloco.

## Próximas etapas planejadas

Após validar esta rodada:

1. otimização de chuva acumulada e páginas regionais existentes;
2. serviço dedicado de previsão estendida e `/previsao-15-dias-pelotas`;
3. páginas por dia da semana conforme fechamento do Trends;
4. página operacional do Guaíba;
5. demais frentes condicionadas a fonte/contrato próprio.

# SEO — log de implementação

Data: 26/08/2026  
Última atualização: 27/08/2026  
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

## Etapa 2 — chuva, páginas regionais e 15 dias

Status em 27/08/2026: **concluída no estado atual do produto**.

- `/chuva-em-pelotas` foi enriquecida com separação entre chuva observada, acumulados regionais e previsão, sem criar URL redundante;
- páginas municipais existentes receberam intenção direta e priorização editorial sem expansão automática do inventário;
- `/previsao-15-dias-pelotas` foi publicada com contrato diário independente e estados degradados explícitos;
- a intenção de 10 dias continua atendida pela mesma página de 15 dias, evitando canibalização.

Referências:

- `docs/P0_RAIN_REGIONAL_OPTIMIZATION_2026-08-26.md`;
- `docs/FORECAST_15_DAY_IMPLEMENTATION_2026-08-26.md`;
- `PROJECT_CURRENT_STATE.md`.

## Etapa 3 — página operacional do Guaíba

Status em 27/08/2026: **implementada na `main`; validação publicada ainda pendente**.

Nova URL canônica:

- `/nivel-do-guaiba`.

Objetivo SEO/produto:

- responder à intenção distinta `nível do Guaíba hoje` sem transformar o Tempo Pelotas em portal meteorológico de Porto Alegre;
- fortalecer o cluster hidrológico que já é o principal ativo orgânico do baseline de Search Console;
- conectar Guaíba -> Lagoa dos Patos -> Pelotas preservando a semântica de cada régua;
- evitar páginas redundantes como `/nivel-do-guaiba-hoje` ou `/nivel-guaiba-porto-alegre`.

Contrato de dados reutilizado, sem novo coletor:

- Cais Mauá / MetSul-TideSat como série preferencial quando utilizável;
- Usina do Gasômetro / Nível Guaíba como referência independente e contingência do contrato atual;
- `live`, `stale` e `unavailable`;
- nível, horário, idade da leitura, tendência em cm/h e variação em 24 h;
- mínimo, média e máximo da janela disponível;
- Cais Mauá e Gasômetro preservados como réguas e cotas próprias.

Interface publicada no código:

- primeira dobra orientada a `Nível do Guaíba hoje`;
- identificação da estação e fonte;
- evolução recente em gráfico leve;
- cartões separados para Cais Mauá e Gasômetro;
- links para fonte e metodologia;
- bloco editorial e FAQ visíveis;
- links internos para situação hidrológica de Pelotas, nível do Laranjal, Enchente de 2024 e alertas.

SEO técnico:

- canonical própria via `createPageHead()`;
- `WebPage`/conteúdo editorial e `FAQPage` coerentes com conteúdo visível;
- entrada em `PUBLIC_ROUTES` com atualização horária;
- inventário público passa de 46 para 47 URLs indexáveis;
- `/situacao-hidrologica-pelotas` passa a apontar explicitamente para a página dedicada do Guaíba.

Regras protegidas:

- Cais Mauá e Gasômetro não são fundidos em uma série única;
- cotas/referências não são transferidas entre estações;
- nível do Guaíba não vira diagnóstico automático de enchente ou segurança para Pelotas;
- dado atrasado continua identificado como atrasado;
- indisponibilidade não vira `0` nem situação normal.

Teste específico:

- `tests/seo-guaiba-page.test.ts` protege canonical, separação das réguas, semântica de risco, horário/status e fonte.

Nenhuma migration, Edge Function, secret, variável de ambiente ou coletor foi criada nesta etapa.

## Gate das páginas por dia da semana

O Trends de 26/08/2026 trouxe sinal direto para sexta-feira e sábado, mas o plano exige cruzamento com Search Console antes de abrir uma URL permanente.

Na retomada de 27/08/2026, a consulta ao conector do Search Console não pôde ser executada porque o serviço conectado estava sem assinatura ativa. Essa indisponibilidade não deve ser tratada como evidência positiva nem negativa de demanda.

Decisão:

- não publicar `/previsao-sabado-pelotas` nem `/previsao-sexta-feira-pelotas` apenas com o sinal isolado do Trends;
- manter o gate até existir evidência de GSC suficiente para justificar conteúdo distinto e evitar doorway pages;
- usar o baseline de 16/08/2026 apenas como referência histórica, não como substituto de uma leitura nova.

## Próximas etapas planejadas

1. regenerar a árvore de rotas pelo gerador existente e executar os gates de build/typecheck/testes quando houver runner/local disponível;
2. validar `/nivel-do-guaiba` no domínio publicado, inclusive mobile, canonical, sitemap e estados `stale/unavailable`;
3. recapturar Search Console para decidir sexta/sábado;
4. avançar pesquisa documental da Enchente de 1941;
5. manter 30 dias, Canal São Gonçalo e páginas de evento condicionados aos contratos de fonte definidos no plano.

# Regional Candidates

## Objetivo

Separar cidades em estudo do inventário regional publicado do Tempo Pelotas.

`RegionalCandidate` é um registro interno de planejamento. A existência de um candidato não cria rota pública, não adiciona entrada ao sitemap e não autoriza indexação.

## Estados

### candidate

Cidade identificada para estudo. Pode ter dados ainda não validados e permanece totalmente fora da superfície pública.

### approved

Candidatura aprovada para iniciar cadastro técnico. `approved` não significa publicação: a próxima etapa é criar um `RegionalCity` com `coverage: "draft"` e iniciar o readiness.

### rejected

Candidatura arquivada. O registro pode ser mantido para preservar histórico de decisão e evitar reavaliações sem contexto.

## Prioridade

- `high`: forte justificativa para entrar na próxima rodada de validação;
- `medium`: relevante, mas não bloqueia a expansão principal;
- `low`: oportunidade futura ou dependente de novas fontes/dados.

Prioridade não substitui readiness e nunca promove uma cidade automaticamente.

## Motivos

Os motivos aceitos são:

- `hydrology`: relevância para leitura hidroclimática regional;
- `regional_relevance`: continuidade territorial ou importância para a cobertura regional;
- `population`: potencial de utilidade por concentração populacional;
- `seo`: oportunidade editorial e de descoberta orgânica.

Esses motivos são sinais internos de priorização, não afirmações editoriais para publicação.

## Dados oficiais

O campo `ibgeCode` é opcional no estágio inicial de candidato. Ele somente deve ser preenchido após validação explícita em fonte oficial. A ausência do código não impede o estudo, mas impede promoção técnica segura.

Na primeira onda, os códigos IBGE de Guaíba, Barra do Ribeiro, Tapes, Arambaré e Camaquã foram conferidos no portal Cidades e Estados do IBGE em 2026-08-23. Essa validação confirma a identidade municipal e é registrada separadamente das demais frentes técnicas.

## Registro técnico de validação

`src/lib/regional-candidate-validation.ts` mantém evidências separadas do inventário de candidatos para evitar que um dado existente seja confundido com um dado validado.

Cada candidato possui quatro frentes:

- `ibge`: identidade municipal e código oficial;
- `coordinates`: coordenadas da sede que serão usadas como referência inicial pelas integrações meteorológicas;
- `weather`: disponibilidade e comportamento das fontes meteorológicas para o ponto;
- `hydrology`: contexto e fontes hidrológicas realmente aplicáveis ao município.

Cada frente usa `pending`, `validated` ou `blocked`. Um campo só pode ser marcado como `validated` quando houver evidência rastreável. Proximidade geográfica, nome da cidade ou expectativa de cobertura não contam como validação.

Quando `coordinates` estiver como `validated`, o registro também deve carregar `coordinatesValue` com latitude, longitude, referência `city-seat` e datum `SIRGAS 2000`. O gate não considera o status isolado suficiente.

### Situação da primeira onda em 2026-08-23

| Município | IBGE | Coordenadas | Meteorologia | Hidrologia |
| --- | --- | --- | --- | --- |
| Guaíba | validated | validated | validated | pending |
| Barra do Ribeiro | validated | validated | validated | pending |
| Tapes | validated | validated | validated | pending |
| Arambaré | validated | validated | validated | validated |
| Camaquã | validated | validated | validated | pending |

Nenhuma dessas cidades foi aprovada ou promovida para `RegionalCity` nesta etapa.

### Evidência cartográfica consolidada

As coordenadas das sedes dos cinco municípios foram confirmadas nos Mapas Municipais do IBGE, edição 04/2021, em sistema geodésico SIRGAS 2000:

- Guaíba: latitude `-30.11`, longitude `-51.31`;
- Barra do Ribeiro: latitude `-30.29`, longitude `-51.3`;
- Tapes: latitude `-30.67`, longitude `-51.39`;
- Arambaré: latitude `-30.91`, longitude `-51.5`;
- Camaquã: latitude `-30.85`, longitude `-51.81`.

Os arquivos oficiais usados como evidência estão registrados diretamente em `regional-candidate-validation.ts`.

### Validação meteorológica da primeira onda

A compatibilidade da primeira onda com a fonte meteorológica principal foi validada em 2026-08-23 usando o mesmo contrato operacional empregado pela visão regional do Tempo Pelotas:

- endpoint `https://api.open-meteo.com/v1/forecast`;
- consulta única em lote para os cinco pontos;
- `cell_selection=land`;
- timezone `America/Sao_Paulo` por localidade;
- temperatura atual, código meteorológico e vento;
- mínima, máxima e probabilidade máxima de precipitação do dia.

A chamada retornou `HTTP 200`, sem timeout, com cinco respostas e campos meteorológicos utilizáveis para todos os pontos. Essa validação comprova compatibilidade técnica do provedor para as coordenadas avaliadas; não transforma previsão modelada em observação local e não substitui a validação hidrológica específica.

### Validação hidrológica

A frente hidrológica não é liberada apenas porque um município está próximo da Lagoa dos Patos, do Guaíba ou de uma estação existente. É preciso provar que a fonte é aplicável ao contexto que será apresentado e registrar limitações para evitar tratar uma estação vizinha como nível municipal.

Arambaré foi a primeira cidade da onda a cumprir esse critério. O Historical Data Layer já possui a estação direta `lagoon-arambare`, vinculada ao Monitoramento da Lagoa dos Patos, classificada como `water-level`, ativa e com observações `water_level` em centímetros chegando com qualidade `live`. Isso valida a existência de uma fonte hidrológica diretamente aplicável ao município; não autoriza, por si só, publicar limiares de inundação ou classificação de risco sem validação específica dessas referências.

As demais permanecem pendentes por motivos explícitos:

- **Guaíba:** o portal já integra referências de nível do Lago Guaíba no Gasômetro/Cais Mauá, em Porto Alegre. São contexto regional, não proxy automático do nível na cidade de Guaíba;
- **Barra do Ribeiro:** está no eixo Guaíba/Lagoa dos Patos, mas ainda não existe estação municipal direta validada no inventário do portal;
- **Tapes:** estações da Lagoa dos Patos em Arambaré e São Lourenço do Sul são úteis para contexto, mas não devem representar Tapes automaticamente;
- **Camaquã:** a bacia do Camaquã possui monitoramento oficial e a estação Passo do Mendonça é uma referência conhecida do Rio Camaquã, porém o vínculo operacional correto para a página municipal ainda precisa ser validado.

## Gate para draft

A entrada no cadastro técnico exige, no mínimo:

1. candidatura explicitamente `approved`;
2. código IBGE validado;
3. coordenadas validadas com evidência rastreável;
4. valor de latitude/longitude consistente e acompanhado de referência/datum.

Mesmo atendendo esse gate, a cidade entra como `coverage: "draft"`, sem rota pública e sem indexação. Meteorologia e hidrologia continuam sendo validadas antes de qualquer promoção para `basic` ou `complete`.

## Builder seguro de promoção

`src/lib/regional-candidate-promotion.ts` implementa a avaliação `candidate → RegionalCity(draft)` sem alterar automaticamente `REGIONAL_CITIES`.

O builder exige:

- status `approved`;
- identidade IBGE validada;
- coordenadas validadas com valor completo;
- ausência de conflito de `slug` no inventário regional;
- ausência de conflito de código IBGE no inventário regional;
- `descriptor` editorial informado explicitamente.

A `rationale` interna do candidato nunca é reutilizada como `descriptor` público. Isso evita transformar justificativas de planejamento, SEO ou prioridade em conteúdo editorial exposto ao usuário.

Quando todos os requisitos são atendidos, o builder produz apenas um objeto de pré-cadastro com:

- `coverage: "draft"`;
- `indexable: false`;
- coordenadas copiadas exclusivamente da evidência validada;
- grupo regional e descriptor fornecidos explicitamente no momento da promoção.

Esse objeto ainda não entra no inventário automaticamente. A inclusão em `REGIONAL_CITIES` permanece uma alteração deliberada, versionada e revisável.

## Promoção

O fluxo obrigatório é:

`candidate → approved → RegionalCity(draft) → basic → complete`

Para promover um candidato aprovado:

1. validar nome, slug, UF, código IBGE e coordenadas;
2. executar a avaliação do builder de promoção e resolver qualquer motivo de bloqueio;
3. revisar o grupo regional e produzir descriptor editorial próprio;
4. criar o registro em `REGIONAL_CITIES` com `coverage: "draft"` e `indexable: false`;
5. iniciar o `RegionalCityReadiness`;
6. validar meteorologia e contexto hidrológico;
7. promover para `basic` somente após os requisitos básicos;
8. promover para `complete` somente após conteúdo, SEO, imagens e demais requisitos definidos pelo readiness.

## Isolamento

`REGIONAL_CANDIDATES` e `REGIONAL_CITIES` são inventários distintos. Um mesmo slug não pode existir nos dois ao mesmo tempo.

Os testes de contrato devem garantir que candidatos permaneçam fora de `PUBLIC_REGIONAL_CITIES` e `INDEXABLE_REGIONAL_CITIES` até uma promoção explícita, que todo candidato da onda ativa possua um registro técnico de validação correspondente e que o builder nunca produza uma cidade pública/indexável.

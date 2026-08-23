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

Na primeira onda, os códigos IBGE de Guaíba, Barra do Ribeiro, Tapes, Arambaré e Camaquã foram conferidos no portal Cidades e Estados do IBGE em 2026-08-23. Essa validação confirma somente a identidade municipal; ela não valida coordenadas, cobertura meteorológica ou contexto hidrológico.

## Registro técnico de validação

`src/lib/regional-candidate-validation.ts` mantém evidências separadas do inventário de candidatos para evitar que um dado existente seja confundido com um dado validado.

Cada candidato possui quatro frentes:

- `ibge`: identidade municipal e código oficial;
- `coordinates`: coordenadas que serão usadas pelas integrações meteorológicas;
- `weather`: disponibilidade e comportamento das fontes meteorológicas para o ponto;
- `hydrology`: contexto e fontes hidrológicas realmente aplicáveis ao município.

Cada frente usa `pending`, `validated` ou `blocked`. Um campo só pode ser marcado como `validated` quando houver evidência rastreável. Proximidade geográfica, nome da cidade ou expectativa de cobertura não contam como validação.

### Situação da primeira onda em 2026-08-23

| Município | IBGE | Coordenadas | Meteorologia | Hidrologia |
| --- | --- | --- | --- | --- |
| Guaíba | validated | pending | pending | pending |
| Barra do Ribeiro | validated | pending | pending | pending |
| Tapes | validated | pending | pending | pending |
| Arambaré | validated | pending | pending | pending |
| Camaquã | validated | pending | pending | pending |

Nenhuma dessas cidades foi aprovada ou promovida para `RegionalCity` nesta etapa.

## Gate para draft

A entrada no cadastro técnico exige, no mínimo:

1. candidatura explicitamente `approved`;
2. código IBGE validado;
3. coordenadas validadas com evidência rastreável.

Mesmo atendendo esse gate, a cidade entra como `coverage: "draft"`, sem rota pública e sem indexação. Meteorologia e hidrologia continuam sendo validadas antes de qualquer promoção para `basic` ou `complete`.

## Promoção

O fluxo obrigatório é:

`candidate → approved → RegionalCity(draft) → basic → complete`

Para promover um candidato aprovado:

1. validar nome, slug, UF, código IBGE e coordenadas;
2. criar o registro em `REGIONAL_CITIES` com `coverage: "draft"`;
3. iniciar o `RegionalCityReadiness`;
4. validar meteorologia e contexto hidrológico;
5. promover para `basic` somente após os requisitos básicos;
6. promover para `complete` somente após conteúdo, SEO, imagens e demais requisitos definidos pelo readiness.

## Isolamento

`REGIONAL_CANDIDATES` e `REGIONAL_CITIES` são inventários distintos. Um mesmo slug não pode existir nos dois ao mesmo tempo.

Os testes de contrato devem garantir que candidatos permaneçam fora de `PUBLIC_REGIONAL_CITIES` e `INDEXABLE_REGIONAL_CITIES` até uma promoção explícita, e que todo candidato da onda ativa possua um registro técnico de validação correspondente.

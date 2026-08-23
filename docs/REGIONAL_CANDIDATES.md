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

O campo `ibgeCode` é opcional no estágio de candidato. Ele somente deve ser preenchido após validação explícita em fonte oficial. A ausência do código não impede o estudo, mas impede promoção técnica segura.

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

Os testes de contrato devem garantir que candidatos permaneçam fora de `PUBLIC_REGIONAL_CITIES` e `INDEXABLE_REGIONAL_CITIES` até uma promoção explícita.

# Regional Candidates

## Objetivo

Separar cidades em estudo do inventário regional publicado do Tempo Pelotas.

`RegionalCandidate` é um registro interno de planejamento. A existência de um candidato não cria rota pública, não adiciona entrada ao sitemap e não autoriza indexação.

## Nova camada: evidência hidrológica

A validação hidrológica possui contrato próprio em:

`src/lib/regional-candidate-hydrology.ts`

Ela existe separada da validação geral porque proximidade geográfica não significa representação hidrológica municipal.

Regras:

- estação diretamente aplicável ao município pode ser validada;
- estação próxima serve apenas como contexto até validação técnica;
- não são criados alertas, limiares ou interpretações de risco sem fonte específica.

## Situação da primeira onda

| Município | Hidrologia |
| --- | --- |
| Guaíba | pending |
| Barra do Ribeiro | pending |
| Tapes | pending |
| Arambaré | validated |
| Camaquã | pending |

Arambaré permanece como primeiro caso validado por possuir fonte diretamente relacionada ao contexto municipal.

## Gate de promoção

A promoção continua seguindo:

`candidate → approved → RegionalCity(draft) → basic → complete`

A validação hidrológica não cria publicação automática. Ela apenas fornece uma evidência técnica necessária para as etapas posteriores.

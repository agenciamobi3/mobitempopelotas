# Regional Hydrology Readiness

## Objetivo

Formalizar a validação hidrológica das cidades candidatas antes de qualquer promoção para superfície pública.

A existência de água próxima, uma bacia compartilhada ou uma estação regional não significa automaticamente que existe dado municipal aplicável.

## Estados

Cada candidato pode possuir uma avaliação hidrológica:

- `validated`: existe fonte diretamente aplicável ao contexto municipal;
- `pending`: existe contexto regional, mas falta evidência suficiente;
- `blocked`: a fonte avaliada não deve ser usada para representar o município.

## Critério de validação

Uma cidade somente pode avançar quando houver:

1. fonte identificada;
2. relação técnica documentada com o município;
3. tipo de dado conhecido;
4. limitações registradas.

## Primeira onda

| Município | Estado |
| --- | --- |
| Arambaré | validated |
| Guaíba | pending |
| Barra do Ribeiro | pending |
| Tapes | pending |
| Camaquã | pending |

## Regra de segurança

Nunca utilizar:

- estação vizinha como nível municipal sem validação;
- contexto de bacia como observação local;
- proximidade geográfica como evidência.

## Relação com promoção

A hidrologia é uma etapa obrigatória antes da criação de um `RegionalCity(draft)` quando o produto pretende apresentar informações hidrológicas locais.

Fluxo:

`candidate → approved → draft → readiness → basic → complete`

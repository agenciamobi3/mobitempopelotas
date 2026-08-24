# Regional Candidate Readiness Report

## Objetivo

Este relatório consolida a avaliação de maturidade dos municípios candidatos sem promover nenhuma cidade para a superfície pública.

O fluxo permanece:

```
candidate
  ↓
approved
  ↓
RegionalCity(draft)
  ↓
basic
  ↓
complete
```

## Primeira onda avaliada

| Município | Status atual | Resultado esperado |
| --- | --- | --- |
| Guaíba | candidate | bloqueado até evidência hidrológica direta |
| Barra do Ribeiro | candidate | bloqueado até evidência hidrológica direta |
| Tapes | candidate | bloqueado até evidência hidrológica direta |
| Arambaré | candidate | candidato mais próximo do próximo ciclo |
| Camaquã | candidate | bloqueado até evidência hidrológica direta |

## Critério de promoção

Uma cidade não deve avançar apenas por possuir:

- código IBGE;
- coordenadas;
- dados meteorológicos.

A promoção depende do readiness consolidado, incluindo evidências técnicas necessárias para o contexto da cidade.

## Estado arquitetural

O relatório existe como documentação operacional. Ele não altera `REGIONAL_CITIES`, não cria rotas públicas, não altera sitemap e não modifica indexação.

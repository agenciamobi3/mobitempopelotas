# Tempo Pelotas — SEO/GEO rodada 1 com dados externos reais

Data: 29/08/2026  
Branch: `main`  
Contexto: GSC Wizard temporariamente bloqueado por `payment_required`; rodada executada com dados reais externos, sem inventar métricas privadas.

## Fontes usadas nesta rodada

1. Ubersuggest, base Brasil / português.
2. Semrush, base Brasil.
3. SERP pública e páginas indexadas observadas em 29/08/2026.
4. Código e conteúdo atuais do domínio canônico `https://tempopelotas.com.br`.

O GSC continua sendo a fonte preferencial para cliques, impressões, CTR e pares query+página da propriedade. Os dados externos desta rodada servem para descobrir oportunidades e validar intenção enquanto o acesso privado não está disponível.

## Estado orgânico observado

### Ubersuggest

No snapshot consultado:

- tráfego orgânico estimado: 23;
- Domain Authority: 1;
- backlinks detectados: 0;
- referring domains detectados: 0.

O conjunto retornado mostrou, entre outras, estas consultas:

| Query | Volume | Posição observada | Landing page |
| --- | ---: | ---: | --- |
| `previsão do tempo laranjal pelotas` | 480 | 13 no relatório de domínio / 11 na SERP detalhada | `/nivel-da-lagoa-dos-patos-laranjal` |
| `previsão do tempo pelotas embrapa` | 260 | 19 | `/` |
| `previsão do tempo embrapa pelotas` | 260 | 17 | `/metodologia` |
| `tempo amanhã em pelotas` | 590 | 44 | `/tempo-amanha-pelotas` |
| `tempo para pelotas hoje` | 390 | 48 | `/tempo-hoje-pelotas` |
| `quantos graus está em pelotas agora` | 720 | 66 | `/chuva-em-pelotas` |

Os números são estimativas do fornecedor e não substituem dados do Search Console.

### Semrush

O snapshot `domain_rank` para a base `br` retornou:

- 333 palavras-chave orgânicas;
- tráfego orgânico estimado: 410;
- 10 keywords nas posições 11–20;
- 21 keywords nas posições 21–30;
- 77 keywords nas posições 31–40;
- 92 keywords associadas a SERPs com AI Overview;
- 313 keywords associadas a SERPs com People Also Ask.

A tentativa de abrir o relatório detalhado `resource_organic` foi bloqueada em seguida por saldo de API (`API UNITS BALANCE IS ZERO`). O resumo já confirma que existe massa crítica orgânica além do pequeno recorte do Ubersuggest.

## Oportunidade priorizada: previsão do tempo no Laranjal

A consulta `previsão do tempo laranjal pelotas` tem intenção meteorológica clara e volume estimado relevante. O domínio já aparecia próximo da primeira página, porém com a URL de nível da Lagoa.

Isso é um conflito semântico:

- `/nivel-da-lagoa-dos-patos-laranjal` deve responder a nível, tendência, horário e referência hidrológica;
- uma pessoa buscando previsão do tempo no Laranjal espera temperatura, chuva, vento e horizonte futuro.

A decisão foi criar **uma única URL específica**, sustentada pela demanda observada, sem abrir páginas de bairros em massa.

## Implementação

Nova URL:

`/tempo-laranjal-pelotas`

Características:

- title: `Previsão do tempo no Laranjal, Pelotas: hoje e 7 dias`;
- canonical próprio;
- meta description orientada à intenção meteorológica;
- `Place` específico do Laranjal, contido em `City` Pelotas;
- coordenadas de referência da orla: `-31.7715, -52.2361`;
- previsão por Open-Meteo para as coordenadas do Laranjal;
- estado inicial shell-first, com dados recuperados no navegador;
- temperatura, sensação, umidade, vento, rajada e direção atuais rotulados como **estimativa de modelo**;
- sete dias com mínima, máxima, chance/volume de chuva e rajada;
- link para `/nivel-da-lagoa-dos-patos-laranjal`;
- link para `/alertas`;
- explicação visível de que previsão meteorológica e medição de nível são naturezas diferentes;
- proveniência em JSON-LD com `citation`/`isBasedOn`;
- inclusão no sitemap com atualização horária;
- inclusão no `llms.txt`.

A página hidrológica passou a apontar de volta para a previsão meteorológica, com texto explícito para não confundir previsão e nível da Lagoa.

## Regra anti-doorway preservada

Esta mudança não cria um gerador de páginas por bairro.

Uma nova localidade intraurbana só deve ganhar URL indexável quando houver simultaneamente:

1. intenção de busca distinta comprovada por dados;
2. utilidade real diferente da página municipal;
3. referência geográfica própria;
4. conteúdo e semântica próprios;
5. ausência de conflito com uma URL existente.

Laranjal atende esses critérios por ser uma área de orla com busca própria e contexto meteorológico/hidrológico distinto.

## Próximas oportunidades já detectadas

### Embrapa

Há duas variantes de cerca de 260 buscas/mês aparecendo em Home e Metodologia. Antes de alterar titles, a próxima rodada deve decidir qual página deve ser dona da intenção `Embrapa + tempo Pelotas`.

A tendência recomendada é reforçar `/estacao-embrapa-pelotas` como página de **observação local**, sem prometer que a Embrapa é a fonte da previsão futura.

### Temperatura agora

`quantos graus está em pelotas agora` apareceu apontando para `/chuva-em-pelotas`, posição distante. A Home já possui intenção correta de condição atual e deve ser reforçada como dona desse cluster, sem transformar Chuva em página genérica de temperatura.

### Autoridade

O sinal de autoridade externa ainda é baixo no Ubersuggest. Depois dos quick wins on-page, a frente deve trabalhar citações e links editoriais legítimos, priorizando fontes e organizações locais relacionadas a meteorologia, turismo, universidades, imprensa e serviços públicos, sem compra ou rede artificial de links.

## Medição futura

Quando o GSC Wizard voltar:

- comparar a nova URL do Laranjal com a antiga landing page para a query;
- acompanhar impressões, posição, CTR e cliques;
- confirmar se a URL meteorológica passa a assumir a intenção;
- verificar se a página de nível perde somente as impressões meteorológicas indesejadas, preservando suas queries hidrológicas;
- usar 28 dias antes x 28 dias depois, respeitando o atraso normal do Search Console.

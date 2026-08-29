# Tempo Pelotas — rodadas SEO + GEO orientadas por GSC

Data de início: 29/08/2026  
Branch operacional: `main`  
Objetivo: evoluir SEO e GEO com decisões baseadas em dados reais do Google Search Console, evitando expansão artificial de URLs e alterações de snippet feitas por intuição.

## Estado do acesso ao GSC

Na abertura desta frente, o conector GSC Wizard respondeu `payment_required`: o trial/assinatura da conta vinculada terminou e as ferramentas MCP não liberaram `list_sites` nem métricas privadas.

Consequências:

- nenhum número de clique, impressão, CTR ou posição foi inventado;
- nenhuma query foi presumida como vencedora ou perdedora;
- titles/descriptions competitivos não foram alterados sem evidência;
- a rodada de preparação técnica pôde seguir porque não depende de hipótese de ranking.

Quando o acesso for restabelecido, a primeira coleta deve usar a propriedade real do domínio canônico e trabalhar, no mínimo, com os últimos 28 dias consolidados e o período anterior equivalente.

## Rodada 0 — fundação técnica GEO sem alterar intenção de busca

Implementada em 29/08/2026.

### Proveniência em JSON-LD

`createEditorialPageJsonLd` passa a aceitar `citations` e, quando presentes, publica:

- `citation` como referências `CreativeWork` com URL;
- `isBasedOn` com as URLs das fontes públicas.

As URLs de fonte foram centralizadas em `src/lib/seo-source-citations.ts`.

Páginas inicialmente cobertas:

- `/tempo-hoje-pelotas`;
- `/tempo-amanha-pelotas`;
- `/previsao-7-dias-pelotas`;
- `/chuva-em-pelotas`;
- `/vento-em-pelotas`.

A mudança não altera title, meta description, canonical, sitemap, conteúdo editorial ou regras de cálculo.

### `llms.txt`

Foi criado `public/llms.txt` como camada auxiliar de legibilidade para agentes e sistemas que optem por consultar esse formato.

O arquivo:

- identifica domínio, idioma e cobertura geográfica;
- aponta páginas canônicas centrais;
- aponta metodologia e status dos dados;
- lista fontes públicas principais;
- documenta regras semânticas críticas: observação != previsão, previsão != alerta, indisponível != zero, leitura atrasada != atual;
- orienta a preservar fonte e timestamp ao citar o Tempo Pelotas.

`llms.txt` não deve ser tratado como fator confirmado de ranking do Google. Ele é uma superfície auxiliar de interoperabilidade/GEO, enquanto canonical, conteúdo visível, links, dados estruturados e desempenho orgânico continuam sendo a base de SEO.

### Contrato

`tests/geo-machine-readability.test.ts` protege a existência da proveniência, das fontes públicas e das regras essenciais do `llms.txt`.

## Rodada 1 — coleta real no GSC

Executar assim que o GSC Wizard voltar a responder.

Coletar:

1. resumo do site, últimos 28 dias x 28 dias anteriores;
2. top queries por cliques e impressões;
3. top páginas por cliques e impressões;
4. queries em posições 4–20 com volume suficiente para ganho rápido;
5. páginas com muita impressão e CTR abaixo do comportamento normal do próprio domínio;
6. pares query+página para identificar canibalização;
7. evolução mensal/semanal de queries e páginas para detectar decay;
8. mobile x desktop;
9. Brasil e demais países para conferir ruído geográfico;
10. sitemap x páginas que realmente recebem impressões.

Se GA4 estiver vinculado no GSC Wizard, também coletar:

- landing pages orgânicas combinando GSC + GA4;
- tráfego vindo de ChatGPT, Perplexity, Copilot, Gemini, Claude e outros assistentes, entendendo que Google AI Overviews/AI Mode não possuem referrer distinto.

## Priorização das próximas alterações

A ordem não deve ser definida por gosto editorial, e sim por oportunidade observada:

### A. Quick wins

Queries com posição média aproximadamente 4–15, boa impressão e CTR recuperável.

Ações possíveis:

- ajuste de title/description;
- resposta direta mais cedo na página;
- headings alinhados à linguagem real da query;
- links internos com contexto;
- reforço de entidade e fonte.

### B. CTR

Páginas já visíveis que recebem muitas impressões e poucos cliques.

Antes de editar, separar:

- problema de snippet;
- intenção informacional satisfeita diretamente na SERP;
- ranking baixo dentro da mesma média agregada;
- query desalinhada com a landing page.

### C. Canibalização

Quando a mesma query relevante alternar entre páginas, preservar a arquitetura já definida e reforçar a página dona da intenção em vez de criar outra URL.

Exemplos de fronteiras já existentes:

- Home = agora/condição atual;
- Hoje = planejamento e previsão por hora do dia;
- Amanhã = próximo dia;
- 7 dias = semana;
- 15 dias = horizonte estendido;
- Chuva = observada + prevista, com janelas separadas;
- Vento = velocidade/direção/rajadas;
- Clima = climatologia;
- Histórico = período meteorológico recente.

### D. GEO

Com dados reais, observar quais páginas já atraem tráfego por questões explicativas e reforçar nelas:

- resposta curta e factual perto do início;
- entidade geográfica explícita;
- fonte original;
- timestamp/idade do dado;
- distinção entre medição, previsão e derivação;
- links para metodologia e fonte primária.

Evitar produzir blocos artificiais de perguntas apenas para ampliar schema.

## Regra permanente desta frente

Nenhuma rodada orientada por GSC deve criar páginas em massa, trocar títulos de páginas vencedoras ou consolidar URLs sem comparar dados reais antes e depois.

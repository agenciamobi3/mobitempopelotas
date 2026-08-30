# Tempo Pelotas — SEO/GEO com dados externos e analytics reais

Data: 29/08/2026  
Branch: `main`  
Contexto: GSC Wizard temporariamente bloqueado por `payment_required`; rodadas executadas com dados reais externos e analytics do deploy, sem inventar métricas privadas.

## Fontes usadas

1. Ubersuggest, base Brasil / português.
2. Semrush, base Brasil.
3. SERP pública e páginas indexadas observadas em 29/08/2026.
4. Analytics do projeto publicado no Lovable, janela 02/08–30/08/2026.
5. Código e conteúdo atuais do domínio canônico `https://tempopelotas.com.br`.

O GSC continua sendo a fonte preferencial para cliques, impressões, CTR e pares query+página da propriedade. Os dados alternativos servem para descobrir oportunidades e validar intenção enquanto o acesso privado não está disponível.

## Estado orgânico observado

### Ubersuggest

No snapshot consultado:

- tráfego orgânico estimado: 23;
- Domain Authority: 1;
- backlinks detectados: 0;
- referring domains detectados: 0;
- referring domains `.gov/.edu` detectados: 0.

O conjunto retornado mostrou, entre outras, estas consultas:

| Query | Volume | Posição observada | Landing page / sinal |
| --- | ---: | ---: | --- |
| `previsão do tempo laranjal pelotas` | 480 | 13 no relatório de domínio / 11 na SERP detalhada | `/nivel-da-lagoa-dos-patos-laranjal` |
| `previsão do tempo pelotas embrapa` | 260 | 19 | `/` |
| `previsão do tempo embrapa pelotas` | 260 | 17 em um snapshot de domínio | `/metodologia` |
| `tempo amanhã em pelotas` | 590 | 44 | `/tempo-amanha-pelotas` |
| `tempo para pelotas hoje` | 390 | 48 | `/tempo-hoje-pelotas` |
| `quantos graus está em pelotas agora` | 720 | 66 em um snapshot | `/chuva-em-pelotas` |

Uma consulta posterior por página também encontrou `quantos graus está em pelotas agora` associada à Home, posição 83. Isso reforça que os snapshots do fornecedor podem variar e que o GSC será necessário para medir canibalização de forma definitiva. A arquitetura, porém, já deixa claro que a Home é dona de `agora/temperatura atual`.

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

## Analytics reais do deploy

Janela consultada: 02/08/2026 a 30/08/2026.

Totais brutos:

- 1.834 visitantes;
- 3.274 pageviews;
- 1,79 pageviews por visita;
- bounce rate agregado: 86%;
- 963 acessos mobile e 870 desktop na classificação por dispositivo;
- 1.675 acessos classificados como Brasil.

Esses totais **não devem ser usados diretamente como KPI de SEO editorial**, porque incluem embeds e tráfego de desenvolvimento.

### Páginas com mais pageviews

1. `/embed/nivel-laranjal` — 864;
2. `/` — 598;
3. `/nivel-da-lagoa-dos-patos-laranjal` — 253;
4. `/situacao-hidrologica-pelotas` — 87;
5. `/tempo-hoje-pelotas` — 41;
6. `/previsao-7-dias-pelotas` — 26;
7. `/alertas` — 26;
8. `/cameras-ao-vivo-pelotas` — 20;
9. `/chuva-em-pelotas` — 18;
10. `/tempo-na-regiao-sul-rs` — 14.

Somente o embed responde por 864 dos 3.274 pageviews. Excluindo essa superfície técnica, restam 2.410 pageviews em páginas não-embed nessa janela.

### Origens identificadas

- `praiadolaranjal.tur.br` — 862;
- Direct — 400;
- `lovable.dev` — 366;
- `google.com` — 137;
- `lm.facebook.com` — 16;
- `facebook.com` — 6;
- Google app (`com.google.android.googlequicksearchbox`) — 4;
- `search.google.com` — 4;
- `chatgpt.com` — 2;
- `l.facebook.com` — 1.

O conjunto de referências explicitamente identificado como Google soma pelo menos 145 nessa leitura. Isso é tráfego de referência atribuído pelo analytics do deploy, não equivalente a cliques orgânicos medidos pelo GSC.

O domínio `praiadolaranjal.tur.br` responde quase exatamente pelo volume do iframe do nível do Laranjal. Portanto, esse tráfego deve ser tratado como **distribuição de widget**, não como 862 visitas editoriais independentes ao portal.

### Consequências para SEO/GEO

- análises de bounce rate e páginas/visita devem excluir `/embed/*` antes de qualquer decisão editorial;
- `lovable.dev` deve ser separado como tráfego de desenvolvimento/preview;
- Google já produz tráfego identificável mesmo com rankings ainda modestos;
- Laranjal é o principal ponto de distribuição real do produto e merece navegação editorial própria;
- a integração por widget demonstra utilidade externa, mas não deve ser manipulada para criar backlinks artificiais;
- links editoriais naturais de parceiros são preferíveis a links injetados automaticamente por widgets.

Como consequência, `/tempo-laranjal-pelotas` também foi incluída no diretório global do footer, no grupo `Previsão`, dando à nova landing um caminho interno sitewide e semanticamente coerente.

## Concorrência orgânica observada

O Ubersuggest encontrou como concorrentes por sobreposição de keywords:

- `msn.com` — 16 keywords em comum;
- `tempo.com` — 17;
- `accuweather.com` — 17;
- `ufpel.edu.br` — 16;
- `clicrbs.com.br` — 17.

Esses domínios possuem escalas e perfis muito diferentes. A presença de UFPel e ClicRBS no conjunto é especialmente relevante por contexto regional; MSN, Tempo.com e AccuWeather funcionam mais como referência de competição SERP do que como modelo editorial local.

## Rodada 1 — previsão do tempo no Laranjal

### Oportunidade

A consulta `previsão do tempo laranjal pelotas` tem intenção meteorológica clara e volume estimado relevante. O domínio já aparecia próximo da primeira página, porém com a URL de nível da Lagoa.

Isso é um conflito semântico:

- `/nivel-da-lagoa-dos-patos-laranjal` deve responder a nível, tendência, horário e referência hidrológica;
- uma pessoa buscando previsão do tempo no Laranjal espera temperatura, chuva, vento e horizonte futuro.

A decisão foi criar **uma única URL específica**, sustentada pela demanda observada, sem abrir páginas de bairros em massa.

### Implementação

Nova URL:

`/tempo-laranjal-pelotas`

Características:

- title: `Previsão do tempo no Laranjal, Pelotas: hoje e 7 dias`;
- canonical próprio;
- meta description orientada à intenção meteorológica;
- `Place` específico do Laranjal, contido em `City` Pelotas;
- coordenadas de referência da orla: `-31.7715, -52.2361`;
- previsão por Open-Meteo para as coordenadas do Laranjal;
- dados recuperados no navegador sem bloquear o HTML inicial;
- temperatura, sensação, umidade, vento, rajada e direção atuais rotulados como **estimativa de modelo**;
- sete dias com mínima, máxima, chance/volume de chuva e rajada;
- link para `/nivel-da-lagoa-dos-patos-laranjal`;
- link para `/alertas`;
- explicação visível de que previsão meteorológica e medição de nível são naturezas diferentes;
- proveniência em JSON-LD com `citation`/`isBasedOn`;
- inclusão no sitemap com atualização horária;
- inclusão no `llms.txt`;
- inclusão no diretório global do footer.

A página hidrológica passou a apontar de volta para a previsão meteorológica, com texto explícito para não confundir previsão e nível da Lagoa.

### Regra anti-doorway preservada

Esta mudança não cria um gerador de páginas por bairro.

Uma nova localidade intraurbana só deve ganhar URL indexável quando houver simultaneamente:

1. intenção de busca distinta comprovada por dados;
2. utilidade real diferente da página municipal;
3. referência geográfica própria;
4. conteúdo e semântica próprios;
5. ausência de conflito com uma URL existente.

Laranjal atende esses critérios por ser uma área de orla com busca própria e contexto meteorológico/hidrológico distinto.

## Rodada 2 — Home e Estação Embrapa

### Temperatura agora

A Home já possui title, description e entidades corretas para:

- `tempo agora em Pelotas`;
- `temperatura atual em Pelotas`;
- `sensação térmica em Pelotas`.

Por isso não foi criada outra URL nem alterado o snippet por intuição. A mudança foi estrutural: a Home passou a expor `CORE_WEATHER_CITATIONS` no JSON-LD editorial, alinhando sua proveniência à das páginas Hoje, Amanhã e 7 dias.

### Embrapa

As queries `previsão do tempo pelotas embrapa` e `previsão do tempo embrapa pelotas` mostraram demanda estimada de aproximadamente 260 buscas/mês. A SERP pública é fortemente orientada à entidade Embrapa e dados meteorológicos locais.

A página `/estacao-embrapa-pelotas` é a landing semanticamente correta para **observação local da Embrapa**, mas não deve afirmar que a Embrapa produz a previsão futura usada pelo portal.

Implementação:

- `citation`/`isBasedOn` para metodologia e fonte Embrapa;
- `Place` específico do Posto Meteorológico da Sede;
- `Dataset` para as medições observacionais apresentadas pelo Tempo Pelotas;
- `dateModified` derivado do horário real da observação/coleta quando disponível;
- `temporalCoverage` derivado da janela histórica carregada;
- variáveis estruturadas: temperatura, umidade, pressão, vento e chuva;
- texto do Dataset explicita que ele **não representa a previsão meteorológica das próximas horas**;
- `llms.txt` passou a listar a página como superfície de observação e fonte.

O title e a meta description da Estação Embrapa foram preservados nesta rodada. A próxima alteração de snippet depende de evidência mais forte de GSC ou de SERP.

## Autoridade externa — diagnóstico

O Ubersuggest confirmou novamente:

- DA 1;
- 0 backlinks;
- 0 referring domains;
- 0 referring domains `.gov/.edu`.

A tentativa de abrir o relatório de backlink opportunities atingiu o limite diário de relatórios da conta do fornecedor. O diagnóstico principal, porém, já é suficiente: **autoridade externa é hoje um gargalo estrutural**.

### Direção recomendada

Não comprar links e não criar rede artificial.

Priorizar ativos que mereçam citação natural:

- páginas históricas documentadas sobre enchentes de Pelotas/Laranjal;
- monitoramento do nível da Lagoa e contexto regional;
- Estação Embrapa com proveniência e histórico;
- widgets gratuitos para sites locais;
- páginas regionais realmente distintas;
- metodologia e status transparente das fontes;
- materiais públicos úteis para imprensa, turismo, universidades, associações e projetos locais.

O objetivo é transformar o Tempo Pelotas em **fonte local citável**, e não apenas em mais uma página que replica previsão.

## Contratos adicionados/atualizados

- `tests/geo-machine-readability.test.ts`;
- `tests/laranjal-weather-seo.test.ts`;
- `tests/footer-editorial-navigation.test.ts` atualizado para exigir a nova landing do Laranjal.

Os dois contratos SEO/GEO novos foram incluídos em `test:contracts`, preservando também os testes adicionados por outras frentes concorrentes na `main`.

GitHub Actions continua fora do gate operacional até 01/09/2026; inclusão no script não equivale a afirmar execução hoje.

## Medição futura

Quando o GSC Wizard voltar:

- comparar a nova URL do Laranjal com a antiga landing page para a query;
- acompanhar impressões, posição, CTR e cliques;
- confirmar se a URL meteorológica passa a assumir a intenção;
- verificar se a página de nível perde somente as impressões meteorológicas indesejadas, preservando suas queries hidrológicas;
- medir Home para `agora/temperatura` e confirmar se outras URLs deixam de aparecer indevidamente;
- medir a Estação Embrapa para queries de observação/Embrapa e separar essas consultas de previsão futura;
- segmentar analytics excluindo embeds e tráfego de desenvolvimento;
- usar 28 dias antes x 28 dias depois, respeitando o atraso normal do Search Console.

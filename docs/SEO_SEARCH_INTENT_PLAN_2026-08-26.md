# Plano SEO por intenção de busca — Tempo Pelotas

Data de criação: 26/08/2026  
Última ampliação: 26/08/2026  
Status: planejamento — não implementar automaticamente sem nova rodada de revisão  
Branch de referência: `main`

## 1. Objetivo

Registrar a estratégia de páginas para buscas de previsão do tempo identificadas nas sugestões do Google, preservando o plano para receber novas intenções antes da implementação.

O plano deve usar essas sugestões como sinais de linguagem e de intenção, não como prova isolada de volume de busca. Antes de transformar qualquer termo em nova URL, cruzar com arquitetura atual, Search Console, utilidade real ao visitante e capacidade de responder com dados próprios ou fontes confiáveis.

### Primeiro lote observado — Pelotas

- previsão do tempo em Pelotas para 10 dias;
- previsão do tempo Pelotas por hora;
- previsão do tempo Pelotas amanhã;
- previsão do tempo Pelotas 15 dias;
- previsão do tempo Pelotas 30 dias;
- previsão do tempo Pelotas hoje;
- previsão do tempo Pelotas 20 dias;
- previsão do tempo Pelotas agora.

### Segundo lote observado — sugestões relacionadas

- tempo porto alegre;
- tempo rio grande;
- previsão do tempo em pelotas para 10 dias;
- tempo santa maria rs;
- tempo canguçu;
- previsão do tempo em pelotas amanhã;
- tempo camaquã;
- tempo dom pedrito;
- tempo uruguaiana;
- tempo cassino.

Princípio: responder bem à intenção do visitante, sem criar várias páginas quase iguais apenas para trocar um número, uma cidade ou uma palavra-chave.

## 2. Arquitetura proposta para Pelotas

| Intenção de busca | Destino planejado | Situação |
| --- | --- | --- |
| previsão Pelotas agora | `/` | existente; pequeno refinamento de title/copy |
| previsão Pelotas hoje | `/tempo-hoje-pelotas` | existente |
| previsão Pelotas por hora | `/tempo-hoje-pelotas` | existente |
| previsão Pelotas amanhã | `/tempo-amanha-pelotas` | existente |
| previsão Pelotas 7 dias | `/previsao-7-dias-pelotas` | existente |
| previsão Pelotas 10 dias | `/previsao-15-dias-pelotas` | nova página, com seção dedicada aos 10 primeiros dias |
| previsão Pelotas 15 dias | `/previsao-15-dias-pelotas` | nova página principal de médio prazo |
| previsão Pelotas 20 dias | `/previsao-30-dias-pelotas` | nova página de longo prazo, com seção própria para 20 dias |
| previsão Pelotas 30 dias | `/previsao-30-dias-pelotas` | nova página de longo prazo |

Não criar, neste plano, URLs independentes para 10 e 20 dias. A intenção deve ser atendida dentro das páginas de 15 e 30 dias para evitar conteúdo duplicado e canibalização.

## 3. Página nova — previsão de 15 dias

### URL

`/previsao-15-dias-pelotas`

### Title

`Previsão do tempo em Pelotas para 15 dias | Tempo Pelotas`

### Meta description

`Veja a previsão do tempo em Pelotas para os próximos 15 dias, com mínima, máxima, chance de chuva, volume previsto e vento.`

### H1

`Previsão do tempo em Pelotas para os próximos 15 dias`

### Abertura pronta para produção

> Veja como o tempo pode se comportar em Pelotas nas próximas duas semanas. Compare temperatura, chuva e vento dia a dia. Os primeiros dias costumam mudar menos; quanto mais distante a data, maior a chance de a previsão ser atualizada.

A primeira dobra deve responder imediatamente à busca. Evitar abrir a página com explicações institucionais, metodologia ou termos técnicos.

### Informações nos cards diários

Usar rótulos simples:

- Máxima;
- Mínima;
- Chance de chuva;
- Volume de chuva;
- Vento;
- Rajadas.

Evitar siglas e termos técnicos na primeira leitura.

### Seção — Previsão para os próximos 10 dias em Pelotas

Texto pronto:

> Se você está procurando a previsão do tempo em Pelotas para 10 dias, use os primeiros dez dias desta página. Eles mostram a evolução prevista da temperatura, da chuva e do vento para cada data.
>
> Para compromissos importantes, confira novamente a previsão quando o dia estiver mais perto. Mudanças de chuva, vento e temperatura são normais conforme entram informações mais recentes.

Objetivo: atender explicitamente a busca por 10 dias sem criar outra URL.

### Seção — E do 11º ao 15º dia?

Texto pronto:

> Os últimos dias desta previsão ajudam a enxergar a tendência das próximas duas semanas, mas podem mudar mais do que os primeiros dias. Use essa parte para planejamento geral e volte a conferir quando a data estiver mais próxima.
>
> Se você precisa decidir o horário de uma viagem, evento, trabalho ao ar livre ou outra atividade sensível ao tempo, consulte também a previsão de 7 dias e, depois, a previsão do próprio dia.

### Seção — Vai chover nos próximos 15 dias em Pelotas?

Texto pronto:

> Os dias com possibilidade de chuva aparecem na previsão acima com a chance de ocorrência e o volume estimado. Chance de chuva e quantidade de chuva não são a mesma coisa: um dia pode ter boa chance de chover e ainda assim ter baixo volume previsto.
>
> Como a chuva pode mudar de horário e de local, acompanhe as atualizações e consulte o radar quando o período estiver próximo.

### Seção — Como ficam as temperaturas nos próximos 15 dias?

Texto pronto:

> As temperaturas mínima e máxima ajudam a comparar os dias mais frios e mais quentes do período. Elas representam a faixa prevista para cada dia e não significam que a temperatura ficará nesses valores durante o dia inteiro.
>
> Mudanças de vento, nebulosidade, chuva e passagem de frentes podem alterar a previsão ao longo da semana.

### Seção — O vento também pode mudar

Texto pronto:

> A página mostra o vento previsto e as rajadas quando essa informação está disponível. Em dias com mudança de tempo, as rajadas podem ser bem mais fortes que o vento médio. Para atividades ao ar livre, vale conferir essa informação novamente perto do horário.

### Perguntas e respostas

#### A previsão de 15 dias pode mudar?

Sim. Quanto mais distante estiver a data, maior a possibilidade de ajuste. Por isso, os primeiros dias devem ter mais peso em decisões práticas.

#### Existe previsão do tempo para Pelotas por 10 dias?

Sim. Os primeiros dez dias desta página mostram a previsão diária de temperatura, chuva e vento para Pelotas.

#### É possível saber agora se vai chover daqui a duas semanas?

Existe uma previsão, mas ela ainda pode mudar. Para datas distantes, use a informação como tendência e confirme novamente quando o dia estiver mais próximo.

#### Qual página devo usar para amanhã?

Para amanhã, use a página de previsão específica do próximo dia. Ela reúne as informações mais úteis para planejamento imediato.

#### E se eu quiser saber o tempo para 20 ou 30 dias?

Para períodos maiores, consulte a tendência das próximas semanas. Depois de cerca de duas semanas, não é adequado tratar cada dia distante como uma previsão fechada.

## 4. Página nova — previsão de 30 dias

### URL

`/previsao-30-dias-pelotas`

### Title

`Previsão do tempo em Pelotas para 30 dias: próximas semanas`

### Meta description

`Veja o que já pode ser previsto para Pelotas nos próximos 15 dias e acompanhe a tendência do tempo para as semanas seguintes.`

### H1

`Previsão do tempo em Pelotas para os próximos 30 dias`

### Abertura pronta para produção

> Uma previsão para 30 dias não tem a mesma precisão de uma previsão para amanhã. Por isso, o Tempo Pelotas separa o que já pode ser mostrado dia a dia do que ainda deve ser acompanhado como tendência.
>
> Nos primeiros 15 dias você encontra a previsão por data. Depois disso, mostramos a tendência das semanas seguintes sem apresentar um dia distante como se já fosse uma certeza.

### Explicação visual simples

**Até 15 dias**  
Previsão dia a dia.

**Do 16º ao 30º dia**  
Tendência para as próximas semanas.

Não usar na interface principal termos como `ensemble`, `anomalia`, `percentil`, nomes internos de modelos ou siglas técnicas. Esses detalhes podem ficar na metodologia.

### Seção — Previsão para os próximos 15 dias

Texto pronto:

> Para os primeiros 15 dias, consulte a previsão diária com temperatura mínima e máxima, chuva e vento. Essa é a parte mais detalhada desta visão de longo prazo.

Não duplicar toda a página de 15 dias. Exibir um resumo e um CTA claro para `/previsao-15-dias-pelotas`.

CTA sugerido: `Ver a previsão completa de 15 dias`.

### Seção — Previsão do tempo em Pelotas para 20 dias

Texto pronto:

> Se você chegou aqui procurando a previsão para 20 dias, os primeiros 15 dias já podem ser consultados individualmente. Para os dias seguintes, o mais útil é observar a tendência da semana, porque ainda existe bastante espaço para mudança.
>
> Essa visão serve para planejamento antecipado, como viagens, eventos e atividades ao ar livre. Para decidir horários ou confirmar chuva em uma data específica, volte a consultar quando o período estiver mais próximo.

Objetivo: responder diretamente à busca por 20 dias sem criar `/previsao-20-dias-pelotas`.

### Seção — Tendência para a terceira semana

A interface deve traduzir os dados de longo prazo para linguagem simples.

Exemplos de rótulos:

**Temperatura**  
Tendência de temperaturas mais altas / próximas do esperado / mais baixas.

**Chuva**  
Sinal de período mais chuvoso / sem sinal claro / mais seco.

**Quanto essa informação pode mudar**  
A tendência ainda pode mudar conforme a semana se aproxima.

Os textos finais devem ser derivados dos dados reais. Nunca fixar uma tendência no código ou na copy.

### Seção — E para 30 dias?

Texto pronto:

> Para um mês inteiro, não é possível afirmar com segurança como estará o tempo em cada data. O que podemos acompanhar é o sinal geral das próximas semanas: períodos com maior ou menor chance de chuva, tendência de frio ou calor e mudanças importantes que começarem a aparecer nos modelos.
>
> Se você tem um compromisso marcado para daqui a três ou quatro semanas, use esta página para acompanhar a tendência. Quando faltar cerca de uma semana, passe a acompanhar a previsão de 7 dias. No dia anterior, consulte a previsão de amanhã.

### Seção — Por que a previsão muda?

Texto pronto:

> A atmosfera está sempre mudando. Uma pequena diferença hoje pode alterar o caminho de uma frente, a quantidade de chuva ou a temperatura vários dias depois. Por isso, previsões mais distantes precisam ser atualizadas conforme novas informações entram.
>
> Uma mudança na previsão não significa que o serviço estava errado. Significa que agora existem informações mais recentes sobre o que pode acontecer.

### Perguntas e respostas

#### Existe previsão do tempo confiável para 30 dias?

É possível acompanhar tendências para as próximas semanas, mas não é adequado tratar cada um dos 30 dias como uma previsão fechada. Quanto mais distante a data, maior a possibilidade de mudança.

#### Dá para saber se vai chover daqui a 20 dias?

Podemos acompanhar se existe um sinal de período mais ou menos chuvoso. Para afirmar chuva em uma data específica, é melhor esperar a data se aproximar.

#### Por que alguns sites mostram o tempo dia a dia por um mês?

Alguns serviços estendem projeções para períodos longos. Esses valores podem mudar bastante. O Tempo Pelotas prefere separar previsão diária de tendência para não passar uma precisão que ainda não existe.

#### Quando devo voltar para conferir?

Para planejamento geral, acompanhe as atualizações semanais. Quando faltar uma semana, consulte a previsão de 7 dias. Um ou dois dias antes, use as páginas de hoje e amanhã.

#### Posso usar a previsão de 30 dias para marcar um evento?

Ela ajuda a acompanhar a tendência, mas não deve ser usada sozinha para escolher horário ou tomar decisões sensíveis à chuva e ao vento com tanta antecedência.

## 5. Ajustes nas páginas existentes

### Home — intenção `agora`

Title atual a revisar:

`Tempo Pelotas — Previsão do tempo em Pelotas`

Candidato para teste:

`Tempo agora em Pelotas — previsão do tempo | Tempo Pelotas`

Meta description proposta:

`Veja a temperatura agora em Pelotas, condição do tempo, chuva, vento, previsão das próximas horas e avisos oficiais.`

Não criar uma nova página `/tempo-agora-pelotas`. A Home deve continuar sendo a resposta principal para a intenção `agora`.

### `/tempo-hoje-pelotas`

Manter como página principal para:

- previsão do tempo Pelotas hoje;
- previsão do tempo Pelotas por hora;
- temperatura agora dentro do contexto do dia;
- chuva e vento nas próximas horas.

Não duplicar essa intenção em novas páginas.

### `/tempo-amanha-pelotas`

Manter como página exclusiva para amanhã.

### `/previsao-7-dias-pelotas`

Manter a URL e a intenção atuais.

Adicionar, quando a página de 15 dias existir, um bloco simples:

**Quer olhar mais adiante?**

> Veja a previsão para os próximos 15 dias em Pelotas e acompanhe como temperatura, chuva e vento podem evoluir na semana seguinte.

CTA: `Ver previsão de 15 dias`.

## 6. Jornada de links internos

Fluxo recomendado:

`Agora` → `Hoje / por hora` → `Amanhã` → `7 dias` → `15 dias` → `30 dias`

Links devem aparecer conforme o contexto, sem transformar todas as páginas em listas extensas de destinos.

A página de 30 dias deve sempre devolver o visitante para horizontes mais próximos quando a decisão exigir mais precisão.

## 7. Diretrizes de linguagem

Todo conteúdo dessa frente deve:

- falar primeiro com a pessoa que chegou pela busca;
- usar frases curtas e diretas;
- usar `chuva`, `vento`, `temperatura`, `mínima`, `máxima`, `rajadas`, `dias` e `semanas` em vez de termos técnicos quando possível;
- explicar incerteza sem assustar e sem prometer precisão inexistente;
- diferenciar claramente previsão diária de tendência de longo prazo;
- não inventar números, datas, condições ou tendências;
- não usar blocos genéricos de SEO sem função para o visitante;
- não repetir a mesma copy apenas trocando `10`, `15`, `20` ou `30`;
- manter informações técnicas detalhadas na metodologia quando necessárias.

## 8. Diretrizes técnicas para implementação futura

### Previsão de 15 dias

O runtime atual de Open-Meteo usado pelo portal está configurado com `forecast_days: "7"`. A página de 15 dias não deve aumentar automaticamente o payload de todas as rotas existentes.

Criar um contrato próprio de previsão estendida que solicite somente os dados necessários para essa página.

Antes da implementação, validar novamente o limite atual suportado pela fonte e o contrato retornado em produção.

### Previsão de 30 dias

Não produzir 30 cards diários apenas para satisfazer a palavra-chave.

A página só deve entrar em produção quando existir uma fonte/contrato adequado para tendência de semanas 3 e 4, mantendo separação clara entre:

- previsão diária;
- tendência de longo prazo;
- observação;
- histórico.

Validar fonte, licença, estabilidade, frequência de atualização e representação correta da incerteza antes de integrar.

### Componentes

Respeitar `WEATHER_PAGE_IDENTITY.md`:

1. reutilizar componentes existentes;
2. parametrizar antes de criar alternativa visual;
3. criar adaptadores para diferenças de fonte;
4. criar componente novo somente quando a semântica realmente for diferente.

### SEO e navegação

Quando as novas rotas forem implementadas:

- adicionar em `src/lib/public-routes.ts`;
- incluir no sitemap;
- revisar canonical;
- incluir breadcrumbs;
- revisar JSON-LD apenas com conteúdo realmente visível;
- adicionar links internos contextuais;
- adicionar testes de contrato SEO/rotas;
- atualizar `PROJECT_CURRENT_STATE.md` na mesma rodada estrutural.

## 9. Ordem sugerida de implementação

1. reunir novas sugestões de busca antes de fechar a arquitetura;
2. revisar todas as intenções em conjunto;
3. fechar mapa de URLs para evitar duplicação;
4. implementar/refinar Home, hoje, amanhã e 7 dias apenas onde necessário;
5. criar contrato de previsão estendida;
6. implementar `/previsao-15-dias-pelotas`;
7. validar busca, UX, payload e estabilidade;
8. integrar fonte adequada para tendência de longo prazo;
9. implementar `/previsao-30-dias-pelotas`;
10. atualizar sitemap, navegação, testes e documentação mestre;
11. acompanhar Search Console por consulta e página antes de abrir novas URLs semelhantes.

## 10. Expansão regional orientada pelas novas sugestões do Google

O segundo lote mostra que o Google relaciona a intenção do usuário não apenas a Pelotas, mas também a outras cidades do Rio Grande do Sul. Isso é útil para descobrir novas frentes, mas não significa que o Tempo Pelotas deva publicar páginas para todo o Estado de uma vez.

O inventário atual possui 24 cidades regionais aprovadas e indexáveis. A expansão já possui gate próprio `draft -> basic -> complete`. Novas localidades devem entrar por esse fluxo e só chegar à indexação depois de dados, conteúdo local, mobile, SEO e operação estarem validados.

### 10.1 Buscas já cobertas pela arquitetura atual

#### `tempo rio grande`

Destino atual:

`/tempo-em/rio-grande-rs`

Ação planejada:

- manter a URL;
- revisar o title para conter naturalmente `Tempo em Rio Grande hoje` ou formulação equivalente sem perder a marca;
- garantir H1 direto para quem procura o tempo na cidade;
- manter temperatura, chuva, vento, alertas e previsão em destaque;
- reforçar copy local ligada à posição entre Lagoa dos Patos e oceano, somente com afirmações sustentáveis;
- criar links contextuais para São José do Norte, Pelotas e, futuramente, Cassino quando essa frente existir.

Copy de abertura candidata:

> Veja o tempo em Rio Grande agora e a previsão para as próximas horas e dias. Confira temperatura, chance de chuva, vento e avisos que podem afetar a cidade.

#### `tempo canguçu`

Destino atual:

`/tempo-em/cangucu-rs`

Ação planejada:

- manter a URL;
- reforçar `Tempo em Canguçu` no title/H1 sem keyword stuffing;
- destacar previsão local por coordenadas;
- usar contexto simples sobre área rural e Serra do Sudeste somente onde for útil;
- manter links para Pelotas, Morro Redondo, Piratini e cidades próximas.

Copy de abertura candidata:

> Veja o tempo em Canguçu agora e a previsão para os próximos dias. Acompanhe temperatura, chuva, vento e mudanças previstas para o município.

#### `tempo dom pedrito`

Destino atual:

`/tempo-em/dom-pedrito-rs`

Ação planejada:

- manter a URL;
- reforçar title/H1 para `Tempo em Dom Pedrito`;
- priorizar chuva, vento, mínima e máxima;
- usar contexto de atividades rurais apenas como utilidade ao visitante, sem transformar a página em texto genérico sobre agronegócio.

Copy de abertura candidata:

> Veja o tempo em Dom Pedrito agora e a previsão para os próximos dias. Confira temperatura, chuva, vento e as principais mudanças esperadas para o município.

### 10.2 Melhor candidato imediato de expansão municipal

#### `tempo camaquã`

Camaquã não faz parte das 24 cidades atuais. É o candidato mais coerente deste lote para uma próxima onda regional porque amplia naturalmente a cobertura da Costa Doce e se conecta geograficamente ao eixo já existente de Cristal e São Lourenço do Sul.

Destino candidato:

`/tempo-em/camaqua-rs`

Não publicar diretamente como `complete`.

Fluxo planejado:

1. cadastrar como `draft`;
2. validar código IBGE, coordenadas e dados meteorológicos;
3. preparar descriptor e copy local próprios;
4. validar avisos aplicáveis;
5. testar visual/mobile e navegação regional;
6. promover para `basic` se for útil validar publicamente sem indexação;
7. promover para `complete` somente depois da revisão SEO final.

Copy de abertura candidata:

> Veja o tempo em Camaquã agora e a previsão para os próximos dias. Confira temperatura, chuva, vento e mudanças previstas para a cidade e arredores.

Title candidato:

`Tempo em Camaquã hoje: previsão, chuva e vento | Tempo Pelotas`

H1 candidato:

`Tempo em Camaquã hoje`

### 10.3 Localidade especial — Cassino

`tempo cassino` merece tratamento separado porque Cassino não deve ser cadastrado como se fosse um município apenas para caber em `regional-cities.ts`.

A intenção é local e meteorologicamente útil, especialmente por se tratar de área costeira. Antes de publicar, criar ou estender um contrato próprio de localidades dentro de municípios, evitando misturar município, bairro, praia e balneário na mesma estrutura sem distinção.

Destino candidato:

`/tempo-no-cassino-rs`

Alternativa a validar antes da implementação:

`/tempo-no-cassino-rio-grande-rs`

Preferir a URL mais curta somente se canonical, breadcrumbs e conteúdo deixarem claro que se trata do Cassino em Rio Grande/RS.

Copy de abertura candidata:

> Veja o tempo no Cassino agora e a previsão para as próximas horas e dias. Confira temperatura, chance de chuva, vento e mudanças previstas para a área da praia.

Se a página for criada, deve usar coordenadas próprias do Cassino e não apenas repetir os dados do centro de Rio Grande.

### 10.4 Cidades maiores fora do recorte regional atual

As sugestões também trouxeram:

- `tempo porto alegre`;
- `tempo santa maria rs`;
- `tempo uruguaiana`.

Essas cidades não fazem parte do inventário regional atual e representam uma decisão de produto maior: deixar de ser apenas um portal de Pelotas/Zona Sul e começar a disputar buscas meteorológicas em escala estadual.

Não publicar essas páginas apenas porque apareceram na sugestão relacionada.

Manter como candidatos de expansão futura e exigir pelo menos um dos sinais abaixo antes de avançar:

- impressões reais no Search Console;
- crescimento de buscas por cidades fora da Zona Sul;
- decisão explícita de transformar o produto em cobertura estadual;
- capacidade operacional para manter conteúdo, dados e navegação coerentes em todo o RS.

Prioridade provisória dentro desse grupo:

1. Porto Alegre — maior potencial de demanda, mas também maior concorrência e maior distância do posicionamento atual;
2. Santa Maria — relevante como centro regional do Estado;
3. Uruguaiana — útil se houver decisão de abrir um eixo Fronteira Oeste.

A existência dessas sugestões deve ser registrada e monitorada, não convertida automaticamente em páginas.

### 10.5 Ordem de prioridade regional após este lote

1. otimizar as páginas já existentes de Rio Grande, Canguçu e Dom Pedrito para a linguagem exata vista nas buscas;
2. preparar Camaquã no gate `draft`;
3. desenhar o contrato correto para localidades como Cassino;
4. acompanhar Search Console e novas sugestões;
5. só depois decidir sobre Porto Alegre, Santa Maria e Uruguaiana.

### 10.6 Regra para páginas municipais

Não criar uma página apenas com nome da cidade trocado.

Cada página promovida a `complete` deve ter:

- coordenadas próprias;
- código IBGE quando for município;
- previsão realmente consultada para aquele local;
- title e H1 claros;
- uma abertura própria e simples;
- contexto local útil e verificável;
- cidades próximas coerentes;
- avisos oficiais aplicáveis quando disponíveis;
- canonical correto;
- sitemap apenas depois do gate de publicação;
- testes de rota e SEO.

## 11. O que aprendemos com as sugestões relacionadas

As sugestões do Google servem como um mapa de linguagem real do usuário.

Elas mostram três tipos de oportunidade diferentes:

1. **páginas já existentes que podem ser melhor alinhadas à forma como as pessoas buscam**, como Rio Grande, Canguçu e Dom Pedrito;
2. **lacunas regionais coerentes**, como Camaquã e potencialmente Cassino;
3. **expansão de escopo**, como Porto Alegre, Santa Maria e Uruguaiana, que só deve acontecer se os dados de busca e a estratégia do produto justificarem.

A prioridade é capturar demanda sem diluir a autoridade local do Tempo Pelotas.

## 12. Pendências para as próximas rodadas

Este documento permanece aberto para incorporar novas sugestões de busca antes da implementação.

Para cada nova busca, decidir explicitamente:

- se já existe uma página que responde bem;
- se a página existente precisa apenas de copy/seção adicional;
- se a intenção justifica uma URL própria;
- se é município, bairro, praia, balneário ou outro tipo de localidade;
- qual dado real será necessário para responder;
- quais páginas podem canibalizar essa intenção;
- como o visitante deve seguir para horizontes mais próximos ou mais detalhados;
- se a oportunidade pertence ao recorte regional atual ou representa expansão estadual.

Não iniciar a criação das novas páginas até concluir essa consolidação das sugestões recebidas.
# Tempo Pelotas — refinamento e enriquecimento SEO

Data: 27/08/2026  
Branch: `main`  
Escopo: enriquecimento das URLs existentes, sem expansão artificial do sitemap.

## Objetivo

Esta rodada consolida a fase posterior à criação das páginas de 15 dias, Guaíba e Enchente de 1941. O foco deixa de ser abrir novas URLs e passa a ser aumentar utilidade, cobertura semântica, clareza editorial e conectividade interna das páginas que já possuem intenção própria.

O inventário permanece em **48 URLs indexáveis**, sendo **25 rotas fixas e 23 páginas municipais**. Nenhuma URL nova foi criada nesta rodada.

## 1. Home x Hoje

A Home assume de forma explícita a intenção de condição imediata:

- `tempo agora em Pelotas`;
- `temperatura atual em Pelotas`;
- `sensação térmica em Pelotas`.

A rota `/tempo-hoje-pelotas` permanece responsável pela intenção de planejamento dentro do dia:

- tempo hoje;
- previsão por hora;
- temperatura e sensação;
- chuva, volume, vento e avisos ao longo do dia.

A malha interna conecta:

`Home → Hoje → Amanhã → 7 dias → 15 dias`.

A separação evita que Home e Hoje tentem responder exatamente ao mesmo conjunto de termos com páginas quase equivalentes.

## 2. Chuva

`/chuva-em-pelotas` foi enriquecida para responder de forma visível a intenções complementares sem fabricar dado fixo:

- `Vai chover hoje em Pelotas?`;
- `Quanto choveu hoje em Pelotas?`;
- chance de chuva;
- volume previsto;
- chuva observada;
- relação entre chuva forte e acompanhamento hidrológico.

A semântica permanece protegida:

- chuva observada e chuva prevista são blocos diferentes;
- o acumulado observado não é somado automaticamente ao previsto, porque as janelas podem se sobrepor;
- acumulado regional pertence à estação identificada;
- chuva forte isolada não vira diagnóstico automático de elevação da Lagoa ou de inundação.

A navegação passa a conectar:

`Chuva → Radar → Situação das Águas → Laranjal → Alertas`.

## 3. Cluster hidrológico e histórico

O cluster foi reforçado sem alterar coletores ou referências:

`Laranjal ↔ Situação das Águas ↔ Guaíba ↔ Enchente de 1941 ↔ Enchente de 2024`.

Regras mantidas:

- Cais Mauá e Gasômetro continuam réguas próprias;
- a Estação Laranjal mantém sua referência local;
- a marca histórica de 2,88 m associada ao Canal São Gonçalo em 1941 não é transferida para Laranjal ou Guaíba;
- níveis atuais não são comparados diretamente com marcas históricas sem referência compatível;
- leitura do Guaíba não é convertida automaticamente em risco para Pelotas;
- leitura atrasada continua identificada como atrasada.

A página do Guaíba passou a apontar também para o registro histórico de 1941, além de 2024 e das páginas operacionais atuais.

## 4. Páginas regionais

O inventário municipal não foi expandido. O trabalho ocorreu dentro das páginas já aprovadas.

Agora **11 municípios possuem perfil editorial local específico**:

1. Rio Grande;
2. São José do Norte;
3. São Lourenço do Sul;
4. Canguçu;
5. Piratini;
6. Capão do Leão;
7. Jaguarão;
8. Santa Vitória do Palmar;
9. Chuí;
10. Bagé;
11. Dom Pedrito.

Os perfis específicos tratam características geográficas e de uso da previsão que já pertencem ao cadastro editorial do projeto, sem transformar modelo numérico em observação local.

As páginas municipais preservam:

- title e description com intenção direta da própria cidade;
- previsão consultada para as coordenadas cadastradas do município;
- avisos oficiais consultados pelo código municipal do INMET;
- contexto explícito de que a previsão representa a coordenada de referência e pode variar dentro do município;
- entidade `Place` com `GeoCoordinates` no JSON-LD da página;
- links geográficos para cidades próximas.

### Decisão anti-doorway

Não foi criado FAQ parametrizado em massa para as 23 páginas municipais. O projeto já possui contrato automatizado que impede esse padrão sem evidência específica.

A expansão editorial regional deve ocorrer cidade por cidade, com contexto útil e distintivo. Não se deve gerar perguntas e respostas quase idênticas apenas substituindo o nome do município para ampliar texto ou schema.

O helper genérico de FAQ que havia ficado sem uso durante uma edição intermediária foi removido do código, mantendo a decisão explícita e reduzindo superfície morta.

## 5. Amanhã, semana, 10/15 dias, vento e radar

A segunda parte da rodada refinou cinco URLs já existentes, sem alterar o inventário do sitemap.

### `/tempo-amanha-pelotas`

A página de amanhã passou a assumir de forma mais explícita a intenção de **decisão do próximo dia**. Além do conteúdo operacional já existente, recebeu camada editorial e FAQ visível para explicar:

- temperatura mínima e máxima de amanhã;
- chance e volume de chuva;
- vento e rajadas;
- diferença entre consultar amanhã e consultar a janela semanal;
- necessidade de confirmar novamente a previsão conforme o horário se aproxima.

A malha de aprofundamento conecta Amanhã a Hoje, Chuva, 7 dias, 15 dias e alertas oficiais.

### `/previsao-7-dias-pelotas`

A rota semanal continua sendo a URL canônica para o horizonte de sete dias e passou a cobrir explicitamente também a intenção natural de **previsão da semana**.

Não foi criada uma segunda URL para “semana”. A página permanece orientada à comparação entre dias e mantém a ponte para o horizonte de 15 dias.

### `/previsao-15-dias-pelotas`

A rota consolida as intenções de **10 dias e 15 dias** na mesma experiência. O portal não cria uma página de 10 dias que repetiria os primeiros dez cards da previsão estendida.

A segunda semana continua apresentada com cautela maior. A página não sugere que o dia 15 possui a mesma previsibilidade do dia 2 e não extrapola alertas oficiais para datas sem aviso publicado.

### `/vento-em-pelotas`

A intenção editorial foi refinada para cobrir de forma direta:

- `vento em Pelotas hoje`;
- direção do vento;
- rajadas por hora;
- diferença entre vento médio e rajada;
- diferença entre direção observada e direção prevista.

Observação de estação e previsão de modelo permanecem separadas. A página não transforma resumo de rajada em alerta oficial.

### `/radar-e-satelite-pelotas`

A página passou a explicitar melhor a intenção **radar de chuva em Pelotas** e o uso da imagem mais recente disponível.

A palavra “agora” só deve ser interpretada como **quadro mais recente retornado pela fonte**, sempre acompanhado de horário. Uma imagem atrasada não é renomeada como tempo real. Radar, satélite e STSC continuam separados da previsão por hora e dos alertas oficiais.

## 6. Meteograma, alertas, geadas, clima e histórico recente

A terceira parte da rodada atacou sobreposição semântica entre páginas já maduras, em vez de criar novas URLs.

### `/meteograma-pelotas`

O meteograma passa a assumir explicitamente a intenção **previsão hora a hora detalhada por até 48 horas**. Isso o diferencia da rota Hoje, que continua orientada ao resumo prático do dia.

O conteúdo explica a diferença entre as duas experiências e reforça que ponto de orvalho, nuvens por camada, visibilidade, pressão, vento, rajadas e CAPE são variáveis de previsão de modelo. Os produtos WRF/GFS do SIMAGRO permanecem como imagens complementares, sem OCR nem mistura numérica.

### `/clima-em-pelotas`

A página de clima passa a explicitar **estações do ano e climatologia**, além das Normais Climatológicas do INMET. O objetivo é evitar que a URL de clima concorra com o histórico recente.

A página reforça que climatologia exige séries longas, período de referência e controle de qualidade. Os últimos 30 dias podem contextualizar o presente, mas não definem o clima normal da cidade.

### `/historico-climatico-pelotas`

A rota passa a usar de forma explícita a expressão **histórico meteorológico de 30 dias**, deixando claro no title, description e FAQ que se trata de comportamento recente.

A página não chama o período de climatologia, normal climática ou recorde histórico oficial. O link para `/clima-em-pelotas` explica a diferença entre as duas intenções.

### `/mapa-de-geadas-rio-grande-do-sul`

O title foi alinhado à intenção **mapa de geadas observadas**, preservando a semântica de dado passado. A página continua deixando explícito que os pontos representam estações e não a área total atingida, e que o mapa não é previsão para a próxima madrugada.

A malha editorial conecta o mapa à previsão de amanhã e de 7 dias sem misturar observação passada com risco futuro.

### `/alertas`

O snippet passa a explicitar **Alertas do INMET em Pelotas e região**. A lógica de avisos não foi alterada: validade, abrangência, severidade e orientações continuam pertencendo ao INMET.

A página passa a ligar também para a situação hidrológica em episódios de chuva persistente ou enchente, com caveat de que um alerta meteorológico não é convertido automaticamente em diagnóstico de nível ou inundação.

### `/estacao-embrapa-pelotas`

A página foi revisada nesta rodada, mas não precisou de mudança. Ela já possui intenção própria e bem separada: **observação local de estação**, com horário, idade da leitura, chuva, vento, histórico de 24 horas e saúde operacional dos dados.

## 7. Páginas de apoio e transparência

A última parte da rodada revisou as páginas que sustentam navegação, transparência e confiança do portal. A regra foi não adicionar conteúdo onde não havia ganho real.

### `/privacidade-e-dados`

Foi corrigida uma estrutura HTML inválida: a rota usava `ContentPageShell`, que já fornece o `<main id="conteudo-principal">`, e ainda renderizava outro `<main>` dentro dele.

O contêiner interno passou a ser um `div`, preservando classes, conteúdo e comportamento. A correção melhora semântica e acessibilidade sem alterar política, coleta de dados ou fluxo de conta.

### `/status-dos-dados`

A página já possuía conteúdo operacional forte, com estados por integração, histórico de incidentes, disponibilidade e explicação de falhas parciais. O refinamento adicionou `createEditorialPageJsonLd`, breadcrumbs e entidades `about` coerentes com o conteúdo visível.

Nenhuma coleta, regra de disponibilidade, incidente, manutenção ou estado operacional foi alterado.

### `/tempo-na-regiao-sul-rs`

O hub regional manteve a mesma URL, as mesmas 24 cidades e o mesmo fallback. O schema editorial passou a descrever melhor a função da página como **previsão por cidade e mapa meteorológico regional**, sem gerar nova rota municipal, FAQ genérico ou conteúdo automático.

### Páginas revisadas sem mudança

- `/cameras-ao-vivo-pelotas`: já diferencia transmissão ao vivo, gravação e vídeo sem horário confirmado; não foi forçada a usar “ao vivo” no title porque nem todas as câmeras estão necessariamente live.
- `/blog`: já identifica claramente o feed CPPMet/UFPel e mantém links para as publicações originais; não recebeu texto artificial.
- `/metodologia`: já possui descrição aprofundada das fontes, horários, fallback, diferenças entre medição/previsão/resumo e limites de uso; permaneceu inalterada.

## 8. Dados estruturados e entidades

O enriquecimento busca coerência entre conteúdo visível e schema. Não são adicionadas respostas ocultas apenas para motores de busca.

Nas páginas regionais atuais:

- `WebPage` identifica title, description, URL e data de atualização;
- `Place` e `GeoCoordinates` descrevem a localidade cadastrada;
- `isPartOf` conecta a página ao `WebSite` Tempo Pelotas.

FAQPage e FAQ templado não são adicionados em massa. Se uma cidade justificar perguntas próprias no futuro, elas devem nascer de conteúdo realmente específico e passar pelo mesmo gate editorial.

Nas páginas editoriais principais, `about` foi refinado para refletir intenções e entidades efetivamente tratadas pelo conteúdo. A página de Status dos Dados também passa a expor breadcrumbs e entidades de disponibilidade/monitoramento sem transformar estado operacional em conteúdo estático.

## 9. Testes de contrato

Além dos testes especializados já existentes, foi adicionado:

- `tests/seo-editorial-enrichment.test.ts`.

O contrato protege:

- separação Home/Agora x Hoje/Por hora;
- links Hoje → 7 dias → 15 dias;
- intenção `Vai chover hoje em Pelotas?`;
- conexão de Chuva com hidrologia e Laranjal;
- separação entre chuva observada e prevista;
- cluster Laranjal/Guaíba/1941/2024;
- proibição de transferir referências históricas para réguas atuais;
- existência de pelo menos dez perfis editoriais regionais específicos;
- ausência de FAQ/schema FAQ parametrizado em massa nas páginas municipais;
- camada editorial própria da página de amanhã;
- papel de 7 dias como previsão semanal;
- consolidação de 10 e 15 dias em uma única URL;
- separação entre vento observado e vento previsto;
- tratamento de radar como imagem recente com timestamp, sem prometer tempo real quando a fonte estiver atrasada;
- distinção Meteograma 48h x Hoje;
- distinção Clima/Climatologia x Histórico meteorológico de 30 dias;
- mapa de geadas como observação passada e não previsão futura;
- alertas como avisos oficiais do INMET, sem converter indisponibilidade em ausência de risco;
- ausência de `<main>` duplicado em Privacidade;
- schema/breadcrumbs da página de Status dos Dados;
- entidade e papel de previsão por cidade no hub regional.

O teste foi incluído em `test:contracts`. Os contratos estão versionados, mas a suíte completa ainda depende da restauração dos runners do GitHub Actions. Esta documentação **não declara os testes como executados**.

## 10. O que não foi feito

Esta rodada deliberadamente não:

- criou páginas de sexta-feira ou sábado;
- criou previsão de 20/30 dias;
- adicionou municípios ao inventário;
- criou doorway pages;
- criou FAQ parametrizado em massa para cidades;
- alterou Open-Meteo, Embrapa, INMET, REDEMET, SACE, Defesa Civil ou coletores hidrológicos;
- alterou política de privacidade, autenticação ou dados da conta;
- alterou monitoramento, incidentes ou regras do Status dos Dados;
- criou migration, Edge Function, secret ou variável de ambiente;
- alterou a árvore de rotas, porque nenhuma rota nova foi criada.

## 11. Gate de Search Console

A indisponibilidade atual do conector de Search Console não impede refinamentos estruturais que melhoram páginas existentes, mas continua bloqueando decisões dependentes de evidência nova de consulta/CTR.

Permanecem condicionadas a nova captura de Search Console:

- decisão final sobre páginas permanentes de sexta-feira/sábado;
- medição de CTR após os novos snippets de Home, Hoje, Amanhã, Chuva, 7 dias, 15 dias, Vento, Radar, Meteograma, Alertas, Geadas, Clima e Histórico;
- priorização quantitativa da próxima rodada por município.

## Decisão

**Continuar refinando as 48 URLs existentes antes de expandir o inventário.**

Com a arquitetura de intenção principal agora mais bem delimitada, a próxima rodada deve migrar do refinamento textual para validação executável e de experiência: runners/CI, domínio publicado, acessibilidade, Core Web Vitals, responsividade e Search Console. Novas URLs continuam exigindo intenção, fonte e utilidade próprias.

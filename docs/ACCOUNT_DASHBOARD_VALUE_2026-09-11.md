# Tempo Pelotas — evolução do painel cadastrado

Data: 11/09/2026
Estado: fases 1, 2 e 3 implementadas no `main`

## Princípio de produto

A área autenticada não deve existir apenas como passagem para recursos públicos ou como vitrine de funcionalidades PRO.

A regra adotada é:

- **Free cria hábito e organização pessoal**;
- **PRO amplia profundidade, automação e capacidade de trabalho**;
- dados públicos básicos continuam públicos;
- a conta reorganiza e contextualiza os dados em torno da pessoa;
- recursos pagos não devem empobrecer artificialmente a experiência gratuita.

## Fase 1 — Painel Vivo Free

O `/painel` se apresenta como **Meu Tempo Pelotas**.

A ordem padrão de leitura é:

1. identidade e camada da conta;
2. resumo vivo pessoal;
3. favoritos vivos do usuário;
4. área `Para meu site`;
5. próximas camadas de profundidade;
6. ferramentas internas condicionais já existentes.

A partir da fase 3, os itens 2, 3 e 4 formam o workspace personalizável. Essa continua sendo a ordem inicial para contas novas, mas o usuário pode reorganizá-la.

## Snapshot vivo compartilhado

A meteorologia do Painel Vivo e os Favoritos Vivos usam uma única Server Function autenticada: `getAccountDashboardLiveSnapshot`.

Esse snapshot:

- autentica a sessão no servidor;
- lê os favoritos reais de `user_favorites` sob RLS;
- devolve resposta privada e `no-store`;
- carrega a consolidação meteorológica canônica do portal;
- consulta hidrologia somente quando algum favorito salvo exige aquela fonte;
- normaliza o resultado em contratos pequenos próprios da interface do painel;
- tolera falha isolada de cada fonte sem preencher o painel com valores demonstrativos.

A interface não envia uma lista arbitrária de recursos para o servidor dizendo o que deve ser enriquecido. O servidor deriva essa necessidade dos favoritos persistidos da própria conta.

## Resumo meteorológico pessoal

A meteorologia é obtida por `fetchAggregatedPelotasWeather`, a mesma consolidação usada pelo runtime público.

O snapshot transforma essa consolidação com os adaptadores canônicos do portal e entrega ao `AccountLiveOverview`:

- temperatura atual medida quando existe observação utilizável;
- fallback explícito para previsão quando não há medição atual;
- condição meteorológica usando os mesmos rótulos de apresentação do portal;
- mínima e máxima do dia;
- chance e volume de chuva previstos;
- maior chance de chuva nas próximas seis horas;
- vento/rajada de destaque nas próximas seis horas;
- quantidade de avisos oficiais relevantes para Pelotas;
- links para aprofundar cada leitura nas páginas públicas correspondentes.

O componente não dispara uma segunda consulta meteorológica própria. Painel Vivo e Favoritos Vivos compartilham o mesmo snapshot.

## Fase 2 — Favoritos Vivos

Os favoritos continuam privados por usuário, mas os itens salvos deixam de ser necessariamente apenas atalhos.

Quando existe um contrato de dados seguro para aquele recurso, o card salvo mostra no próprio `/painel`:

- estado da leitura;
- valor principal;
- contexto ou tendência permitida pela fonte;
- informação complementar;
- horário da observação quando aplicável;
- origem do dado;
- acesso à página pública completa.

A primeira versão enriquece:

### Previsão de 7 dias

Usa a mesma previsão meteorológica consolidada do Painel Vivo e mostra o resumo de hoje, incluindo mínima, máxima, condição, chance de chuva e volume previsto.

### Nível da Lagoa no Laranjal

Usa `fetchSelectedLaranjalLevelData`, preservando o seletor já adotado pelo portal entre a fonte principal, contingência CIEX/FURG e último dado conhecido quando aplicável.

O card pode mostrar nível, tendência recente e variação de seis horas porque essas grandezas já são derivadas da própria série canônica desse recurso.

### Nível do Guaíba

Usa `fetchGuaibaObservation` e mantém a mesma seleção e proveniência da página pública.

O card pode mostrar nível, variação em 24 horas e tendência recente porque essas informações já fazem parte do contrato da série monitorada.

### Canal São Gonçalo

Usa a Rede de Monitoramento Hidrometeorológico da Defesa Civil RS e seleciona a estação `DCRS-00063`, a mesma usada pela página pública da Eclusa em Capão do Leão.

O painel reproduz apenas nível, chuva quando disponível, horário/freshness e a tendência textual informada pela própria fonte.

### Rio Jaguarão

Usa a mesma rede oficial e seleciona a estação `DCRS-00115`, já adotada pela página pública correspondente.

A semântica é a mesma do São Gonçalo: nenhuma tendência é inventada a partir de um único ponto.

### Situação das águas

Quando esse recurso é favorito, o card resume a disponibilidade da rede regional da Defesa Civil RS com número de leituras recentes e estações regionais na consulta.

Ele reforça que cada régua continua sendo interpretada dentro da própria referência.

## Recursos que continuam como atalhos

Nem todo favorito precisa fingir uma leitura viva.

Enquanto não houver um resumo estruturado que realmente acrescente valor, recursos como radar/satélite, câmeras e gerador de widgets continuam funcionando como atalhos normais dentro da área de favoritos.

Essa escolha é deliberada: ausência de semântica confiável não deve ser substituída por um selo genérico de “online” ou por informação pouco útil.

## Integridade hidrológica

Favoritos Vivos não criam classificação de risco própria.

Para São Gonçalo e Jaguarão, onde o produto não possui um limiar oficial específico para transformar a régua em cota de atenção ou inundação, o painel não produz rótulos como risco baixo, risco alto ou inundação iminente.

O painel preserva:

- estação;
- unidade;
- horário;
- freshness;
- nível recebido;
- chuva recebida;
- tendência textual da fonte, quando existente.

Laranjal e Guaíba podem apresentar variações já calculadas pelas suas séries canônicas, sem extrapolar isso para uma categoria de risco.

## Eficiência de consulta

A Server Function sempre busca meteorologia porque ela alimenta o resumo principal.

As outras fontes são condicionais:

- Laranjal somente quando `laranjal-level` está salvo;
- Guaíba somente quando `guaiba-level` está salvo;
- Defesa Civil RS uma única vez quando existe qualquer favorito entre `regional-waters`, `sao-goncalo-level` e `jaguarao-level`.

Assim, vários favoritos da mesma rede compartilham a mesma consulta.

Cada fonte possui prazo de execução e falha isolada. Uma fonte hidrológica indisponível não derruba a meteorologia nem os demais favoritos.

## Atualização após favoritar

A mutação continua sendo feita pela Server Function existente `setAccountFavorite`, que valida catálogo, sessão, entitlement e proprietário.

Após uma inclusão ou remoção bem-sucedida, o componente solicita novamente o snapshot vivo. Dessa forma um recurso compatível pode se transformar em card vivo sem recarregar toda a página.

Se esse refresh falhar, a interface encerra o estado de carregamento e mantém os favoritos como caminhos navegáveis. Não existe loading permanente.

## Fase 3 — Painel personalizável

O `/painel` agora possui um modo explícito **Personalizar painel**.

A personalização não altera os dados nem cria uma segunda versão das fontes. Ela muda somente a composição da interface autenticada.

### Seções reorganizáveis

O usuário pode mudar a ordem das três seções que formam o workspace da conta:

- `Painel Vivo`;
- `Favoritos Vivos`;
- `Para meu site`.

A ordem padrão continua `Painel Vivo → Favoritos Vivos → Para meu site`.

`Próximas camadas` e ferramentas internas condicionais ficam fora desse workspace nesta fase. Isso evita misturar recursos ainda em evolução com a área pessoal configurável.

### Cards reorganizáveis

Dentro do Painel Vivo, podem ser reorganizados:

- Tempo agora;
- resumo de hoje;
- próximas horas;
- avisos oficiais.

Dentro de Favoritos Vivos, a ordem dos recursos salvos também pode ser alterada. A ordenação é mantida para todo o catálogo canônico, então um favorito removido e adicionado novamente recupera sua posição persistida sempre que ela continuar válida.

### Tamanhos de card

Cards do Painel Vivo e Favoritos Vivos podem usar três larguras:

- `compact`: uma unidade da grade;
- `medium`: duas unidades;
- `wide`: largura total da grade.

No mobile todas as opções degradam para uma única coluna. O tamanho persistido continua guardado e volta a produzir diferença quando a viewport comporta a grade.

### Drag and drop sem depender do mouse

No desktop, as seções e os cards podem ser movidos pelas alças de arraste usando o Drag and Drop nativo do navegador.

O drag não é o único mecanismo. Cada item também possui:

- mover para cima;
- mover para baixo;
- seletor de tamanho quando aplicável.

Isso preserva uso por teclado e dá um caminho determinístico em telas touch, onde o Drag and Drop HTML nativo não deve ser tratado como a única interação.

### Edição transacional na interface

Alterações de layout ficam locais durante o modo de personalização.

O usuário possui ações explícitas:

- `Salvar layout`;
- `Cancelar`;
- `Padrão`.

O sistema não dispara uma escrita de banco a cada movimento do mouse.

Cancelar restaura a última versão salva. `Padrão` prepara a configuração inicial e ainda exige `Salvar layout` para persistir.

## Persistência do layout

Não foi criada uma nova tabela.

A migration `20260911063644_add_account_dashboard_layout.sql` adiciona `dashboard_layout jsonb` em `public.user_preferences`.

A coluna:

- pertence à mesma linha privada da conta;
- continua protegida pelas políticas RLS já existentes de `user_preferences`;
- aceita somente objeto JSON no banco;
- possui limite de 16 KiB;
- não guarda meteorologia, hidrologia nem cópias dos dados do portal;
- armazena somente ordem, tamanhos e versão do layout.

O contrato de aplicação é `DashboardLayout` versão `1`.

A validação do servidor limita:

- IDs de seção conhecidos;
- IDs dos cards meteorológicos conhecidos;
- favoritos pertencentes ao catálogo canônico;
- tamanhos `compact`, `medium` ou `wide`;
- ausência de itens duplicados;
- chaves de tamanho pertencentes a cards conhecidos.

Quando um layout antigo ou incompleto é carregado, `normalizeDashboardLayout` preserva as escolhas válidas e acrescenta novos itens padrão que tenham surgido em versões posteriores do produto.

## Salvamento seguro

`saveAccountDashboardLayout`:

- exige sessão autenticada;
- usa o cliente da própria requisição, não `service_role`;
- grava somente `user_preferences` da linha cujo `user_id` é o titular autenticado;
- devolve resposta privada e `no-store`;
- tenta reparar `ensure_current_user_account_foundation` se a linha de preferências estiver ausente antes de repetir o salvamento.

## LGPD

O layout personalizado passa a fazer parte da exportação de dados da conta.

A exportação foi elevada para `export_version: 1.4` e inclui `dashboard_layout` dentro das preferências do titular.

## Para meu site

O gerador de widgets continua disponível no Free.

Ele permanece na área **Para meu site**, junto da distribuição e analytics dos widgets. A mudança é de arquitetura da experiência, não de entitlement.

Agora o próprio usuário pode decidir se essa seção aparece antes ou depois de Painel Vivo e Favoritos Vivos.

## Próximas camadas

Com Painel Vivo, Favoritos Vivos e personalização estabelecidos, a sequência recomendada passa a ser:

1. preferências temáticas que alterem prioridade e conteúdo do resumo, não apenas posição;
2. resumo diário personalizado;
3. histórico pessoal curto no Free;
4. enriquecimento seguro de radar e câmeras quando houver um estado útil a mostrar;
5. reavaliação segura da experiência de notificações, respeitando o estado atual da infraestrutura de push;
6. histórico profundo, comparações, regras avançadas, exportações e análises como candidatos naturais ao PRO.

## Web Push

O código de Web Push existente não foi reativado nesta fase.

Há infraestrutura preservada no repositório, mas contratos atuais mantêm o gerenciador fora do shell global enquanto a funcionalidade estiver suspensa. A evolução do painel não deve contornar essa decisão. Qualquer retorno de alertas personalizados deve ocorrer em uma etapa própria, com revisão de runtime, consentimento, preferências e entrega.

## Proteções

`tests/free-account-favorites.test.ts`, `tests/account-live-dashboard.test.ts` e `tests/account-dashboard-personalization.test.ts` protegem que:

- o valor pessoal continue sendo a ordem padrão do Free;
- Painel Vivo e Favoritos Vivos usem o mesmo snapshot autenticado;
- os favoritos sejam lidos do usuário autenticado sob RLS;
- a resposta personalizada seja privada e sem cache compartilhado;
- meteorologia venha da consolidação real;
- hidrologia seja consultada apenas quando necessária;
- São Gonçalo use `DCRS-00063`;
- Jaguarão use `DCRS-00115`;
- nenhuma classificação de risco seja inventada;
- uma falha de transporte não deixe o painel em carregamento infinito;
- o layout seja versionado e validado;
- o banco limite o JSON e não crie tabela paralela;
- salvamento seja restrito ao usuário autenticado;
- seções e cards aceitem Drag and Drop;
- existam alternativas de movimento por botões;
- tamanhos sejam restritos a três estados conhecidos;
- mobile degrade tamanhos para uma coluna;
- foco visível e alto contraste sejam preservados;
- `dashboard_layout` faça parte da exportação LGPD.

Os testes focados fazem parte de `npm run test:contracts`.

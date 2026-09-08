# /status-dos-dados — refinamento editorial de 08/09/2026

## Objetivo

Transformar `/status-dos-dados` em uma central pública de transparência legível por visitantes comuns, sem perder o contrato técnico já existente de estado, horário, origem, histórico e `dataCondition`.

A página deve responder rapidamente:

1. qual é o estado geral das fontes;
2. quem fornece cada conjunto de dados;
3. para que aquela fonte é usada no Tempo Pelotas;
4. quando ela foi verificada;
5. quando houver semântica suficiente, qual é a condição real do dado recebido;
6. qual foi a disponibilidade recente e quais incidentes foram detectados.

## Hierarquia pública

A ordem pública é:

1. hero compacto com título e verificação geral;
2. faixa de contagem dos estados;
3. fontes atuais, agrupadas por meteorologia/avisos, radar/satélite e hidrologia;
4. incidentes e disponibilidade;
5. critérios de publicação no fechamento educativo.

Os critérios ficam depois dos dados e do histórico. A experiência não interrompe cada fonte para explicar conceitos gerais.

## Fontes como linhas editoriais

A antiga grade de duas colunas foi aposentada.

Cada fonte passa a ocupar uma linha aberta com três zonas no desktop:

- identidade: instituição e nome da fonte;
- conteúdo: uso no portal, detalhe quando necessário e `dataCondition` quando disponível;
- metadados: estado da integração, horário da verificação e link para a origem.

Não há cards independentes, sombras ou fundos decorativos por fonte. A separação acontece por espaço, tipografia e divisórias.

Em telas menores a linha degrada para duas colunas e depois uma coluna, preservando a mesma ordem semântica.

## Estado da integração x condição do dado

`ServiceStatus.state` continua respondendo sobre a integração.

`dataCondition` responde sobre o dado daquela verificação e permanece restrito nesta fase a:

- nível do Laranjal;
- nível do Guaíba;
- rede regional da Lagoa dos Patos;
- Defesa Civil RS;
- ANA `87955001`.

A condição do dado aparece como uma linha editorial própria, sem virar novo badge, sem cor de risco e sem criar classificação de qualidade inexistente.

Para a ANA, `Em implantação` pode coexistir com uma condição informando que existe medição na fonte, mas ela não é publicada como nível do Laranjal enquanto a referência vertical específica não estiver confirmada.

## Histórico

O histórico mantém:

- disponibilidade de 24 h;
- disponibilidade de até 7 dias;
- incidentes em andamento;
- manutenções programadas;
- incidentes recentes;
- tabela de disponibilidade por fonte.

A apresentação usa faixas e linhas abertas. Metadados de incidentes não devem voltar a ser uma matriz de cards com fundos independentes.

## Copy

A copy pública deve permanecer direta e factual.

Evitar no conteúdo principal termos internos como `probe`, `upstream`, `readiness`, `cross-check`, `last-good`, `kill switch` ou nomenclatura de arquitetura.

Quando um detalhe técnico for necessário para governança, ele pode permanecer em contratos internos e documentação, mas o visitante deve receber a consequência concreta daquele detalhe.

## Proteções

`tests/data-status-editorial-visual.test.ts` protege:

- hero compacto no rail público;
- ausência da antiga grade de duas colunas de fontes;
- estrutura identidade → conteúdo → metadados;
- `dataCondition` como linha editorial própria;
- critérios de publicação no fim;
- histórico aberto sem matriz de cards.

`tests/data-status-data-condition.test.ts` continua protegendo a semântica e o escopo de `dataCondition`.

## Estado de validação

Código e contratos foram versionados na `main` em 08/09/2026.

Git, sincronização do Lovable, build e propagação em `tempopelotas.com.br` são provas diferentes. Não considerar o novo visual validado no domínio canônico sem inspeção real após a propagação do bundle.

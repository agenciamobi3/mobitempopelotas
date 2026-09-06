# Enchente de 2001 — contexto meteorológico, hidrodinâmico e série histórica

Data da pesquisa: 06/09/2026  
Aplicação: `/enchente-2001-pelotas`

## 1. Análise específica do evento — UFPel

**Análise das condições meteorológicas associadas a um caso de vento extremo na região sul da Laguna dos Patos**  
Autores: Leila Pinheiro de Castro; Mateus da Silva Teixeira  
Instituição: Faculdade de Meteorologia — UFPel  
Arquivo: Anais SIIEPE/UFPel, diretório 2013  
URL: `https://anais-siiepe.ufpel.edu.br/2013/CE_02822.pdf`

O trabalho tem como objeto explícito o evento de inundação da costa oeste da Laguna dos Patos ocorrido em **08/10/2001**.

### Dados e método declarados

O estudo utiliza:

- Análise Final do NCEP com resolução horizontal de 1° x 1°, em intervalos de 6 horas, de 05 a 08/10/2001;
- dados horários de pressão barométrica, velocidade e direção do vento da estação da Praticagem da Barra de Rio Grande entre 05 e 08/10/2001;
- campos de pressão ao nível médio do mar, gradiente de pressão e vento a 10 m para acompanhar a evolução antes e depois da máxima rajada.

### Mecanismo descrito

A análise identifica a Alta Subtropical do Atlântico Sul estacionária no oceano e uma baixa pressão sobre o norte da Argentina. A interação entre esses sistemas aumentou o gradiente de pressão sobre o Rio Grande do Sul e fortaleceu ventos do quadrante leste-nordeste.

Para 08/10 às 00 UTC, o trabalho descreve o avanço da baixa pelo oeste do estado e o aumento do gradiente de pressão. Os autores associam a sequência de dias de vento de leste-nordeste à inundação da costa oeste da Lagoa, argumentando que esses ventos dificultaram a perda de massa d'água para o oceano e deslocaram água para a costa oeste por atrito com a superfície.

As conclusões registram que:

- vento de nordeste e leste pode ter impedido o escoamento da Lagoa dos Patos para o Oceano Atlântico;
- o atrito do vento com a superfície contribuiu para a inundação da costa oeste;
- a interação da ASAS com a baixa sobre a Argentina produziu forte gradiente de pressão que impulsionou ventos de nordeste sobre a região.

### Posição na hierarquia editorial

Esta é uma **análise acadêmica posterior específica do evento**, não um boletim meteorológico operacional publicado durante a emergência. Ela pode sustentar a explicação posterior do mecanismo atmosférico/hidrodinâmico, mas não substitui a procura por boletins contemporâneos de INMET, Marinha, Defesa Civil ou outros órgãos.

O próprio trabalho referencia pesquisas anteriores diretamente ligadas ao episódio, incluindo:

- Acosta et al., **Análise sinótica do evento ocorrido em 08/10/2001 na região sudeste da Lagoa dos Patos**, XII Congresso Brasileiro de Meteorologia, 2002;
- Cruz et al., **Estudo sinótico do sistema meteorológico ocorrido no extremo sul do Brasil no dia 08/10/2001**, XIV Congresso Brasileiro de Meteorologia, 2006.

A existência bibliográfica desses trabalhos foi confirmada, mas seus textos integrais originais ainda não foram recuperados para uso direto.

## 2. Contexto geral posterior — POPA

**O balanço das águas da Lagoa dos Patos — A influência dos ventos no nível**  
Autor: Danilo Chagas Ribeiro  
Data: 10/02/2005  
Acervo: POPA  
URL: `https://acervo.popa.com.br/diversos/ventos_lpatos.htm`

O texto é posterior à enchente e não é registro do episódio de outubro de 2001.

O artigo descreve de forma geral que o nível da Lagoa dos Patos responde ao regime de ventos e às chuvas. No trecho sobre o “Nordestão”, informa que, quando o vento Nordeste sopra, o nível tende a cair ao norte e crescer ao sul por represamento no Canal da Feitoria, com o efeito alterado durante períodos de chuva na bacia do Guaíba.

Esse material funciona apenas como contexto hidrodinâmico geral e ajuda a interpretar a linguagem local preservada pela Prefeitura em 2002.

## 3. Série histórica do Laranjal — ANA 87955000

A pesquisa hidrológica localizou uma série histórica específica para a estação **Laranjal 87955000**.

O **Relatório de Caracterização Municipal do Plano Municipal de Saneamento Básico de Rio Grande** recompila dados da ANA e informa para `87955000`:

- nome: Laranjal;
- município: Pelotas;
- responsável: ANA;
- operação: CPRM;
- dado disponível: cota;
- período no inventário: 1984–2012;
- cerca de 2% de falhas;
- série detalhada de 13/09/1984 a 30/06/2012;
- cota média aproximada: 0,63 m;
- **cota máxima de 2,90 m em 08/10/2001**.

A própria ANA, em comunicado sobre a cheia de maio de 2024, identificou Pelotas na Lagoa dos Patos como **estação Laranjal, código 87955000**.

Documentação recente do Serviço Geológico do Brasil também identifica `87955000` como LARANJAL/Pelotas e classifica a cota como **não nivelada**, com leitura feita diretamente na seção de réguas existente.

Consequência editorial:

- `2,90 m` é uma leitura da régua histórica `87955000`;
- não é altitude de 2,90 m sobre o nível do mar;
- não é automaticamente “2,90 m acima do normal”;
- não é cota de inundação universal para todo o Laranjal;
- não deve ser comparada por simples subtração com outras réguas ou anos sem comprovar zero, RN, datum e continuidade do referencial.

### 3.1 O código atual 87955001 não é unido à série histórica

O adapter de readiness atual do Tempo Pelotas consulta a camada pública `CotasReferencia2` do SNIRH para **LARANJAL 87955001**, cujo payload validado no projeto informa UFPel como responsável e operadora.

A pesquisa desta rodada encontrou documentação oficial para `87955000` e evidência pública atual do projeto para `87955001`, mas **não encontrou documento oficial que declare relação de continuidade entre os dois códigos**.

Até prova documental:

- `87955000` = régua histórica usada para 2001;
- `87955001` = estação pública atual usada para readiness/cross-check;
- não transferir histórico, zero, datum, RN ou cota classificatória entre elas;
- não usar proximidade numérica para inferir equivalência.

Documento operacional complementar: `docs/ANA_RHN_INTEGRATION.md`.

## 4. O que as fontes NÃO autorizam afirmar

Mesmo com a análise específica da UFPel, o contexto POPA e a cota histórica localizada, não se deve:

- substituir a velocidade de 105 km/h publicada contemporaneamente pela Folha por estimativa posterior;
- transformar `2,90 m` em altitude ou nível acima do mar;
- inventar o zero/datum da régua `87955000`;
- presumir continuidade de referencial entre `87955000` e `87955001`;
- calcular quanto do avanço de aproximadamente 600 m foi produzido por cada mecanismo;
- afirmar que “nordestão” é sinônimo técnico de “ciclone extratropical”;
- tratar análise posterior como boletim operacional emitido em 08/10/2001.

## 5. Hierarquia editorial atual

1. **Folha de S.Paulo, 09/10/2001** — registro contemporâneo do sistema e dos principais números do episódio;
2. **Prefeitura de Pelotas, 22/10/2001** — registro municipal contemporâneo dos impactos e da recuperação;
3. **ANA 87955000, recompilada no PMSB de Rio Grande** — evidência hidrológica posterior da série histórica e do pico de 2,90 m em 08/10/2001;
4. **SGB** — confirmação moderna da identidade `87955000` e da natureza não nivelada da cota;
5. **Prefeitura de Pelotas, 18/10/2002** — memória municipal retrospectiva que usa o termo local “nordestão”;
6. **UFPel/SIIEPE, análise posterior específica** — reconstrução acadêmica do mecanismo de 05 a 08/10/2001 com dados NCEP e da Praticagem de Rio Grande;
7. **POPA, 10/02/2005** — contexto hidrodinâmico geral sobre a influência do vento Nordeste no balanço de nível da Lagoa.

## 6. Trilhas de recuperação meteorológica/acadêmica

### 6.1 Acosta et al. — XII CBMet, 2002

Referência confirmada:

**ACOSTA, R.; PINTO, L. B.; TATSCH, J. D.; SARAIVA, J. M. B.; CAMPOS, C. R. J. Análise sinótica do evento ocorrido em 08/10/2001 na região sudeste da Lagoa dos Patos. XII Congresso Brasileiro de Meteorologia, Foz do Iguaçu, 2002.**

O portal UFSMPublica classifica a produção como **Trabalho em Evento - Completo**, reforçando que existiu texto integral nos anais/CD-ROM.

Referências preservadas de outros trabalhos do XII CBMet confirmam que o antigo `cbmet.com` distribuía artigos em URLs do padrão:

`http://www.cbmet.com/cbm-files/<grupo>-<hash>.pdf`

O hash específico de Acosta não foi localizado. Não adivinhar o identificador.

Próximos caminhos: SBMet, CD-ROM do XII CBMet em bibliotecas universitárias, acervo dos autores, UFPel/UFSM e captura histórica somente quando índice/caminho exato for recuperado.

### 6.2 Cruz et al. — XIV CBMet, 2006

**CRUZ, P.; FARIAS, J.; CARVALHO, M. H.; FOSTER, P. Estudo sinótico do sistema meteorológico ocorrido no extremo sul do Brasil no dia 08/10/2001. XIV Congresso Brasileiro de Meteorologia, Florianópolis, 2006.**

O título identifica explicitamente 08/10/2001, mas o corpo integral não foi recuperado. Nenhuma conclusão adicional é atribuída a Cruz et al. sem o texto.

### 6.3 Noble, Pinto e Campos — XI CIC/UFPel, 2002

**NOBLE, D. V.; PINTO, L. B.; CAMPOS, C. R. J. Ocorrência de fenômenos meteorológicos observados na costa brasileira: um estudo de caso de ressaca ocorrido na região sudeste da Lagoa dos Patos. XI Congresso de Iniciação Científica da UFPel, Pelotas, 2002.**

O corpo não foi recuperado e o registro bibliográfico consultado não informa a data da ressaca. É apenas **candidato de acervo** e não é associado automaticamente a 08/10/2001.

### 6.4 Fernandes, Pinto e Campos — I SIBRADEN, 2004

**FERNANDES, D. S.; PINTO, L. B.; CAMPOS, C. R. J. Análise sinótica de um ciclone extratropical que atingiu a cidade de Pelotas-RS. I Simpósio Brasileiro de Desastres Naturais, Florianópolis, 2004, p. 697-703.**

O corpo integral não foi recuperado e a referência bibliográfica não identifica a data do ciclone analisado. O artigo não é tratado como estudo de outubro de 2001 sem essa prova.

### 6.5 CPTEC/INPE — Climanálise de outubro de 2001

Edição identificada:

**CLIMANÁLISE. Boletim de Monitoramento e Análise Climática. Cachoeira Paulista: INPE/CPTEC, v. 16, n. 10, out. 2001, p. 3-27.**

Endereços históricos:

- `http://climanalise.cptec.inpe.br/~rclimanl/boletim/1001/index.html`;
- `http://climanalise.cptec.inpe.br/~rclimanl/boletim/pdf/pdf01/out01.pdf`.

Um artigo de 2024 registra acesso ao índice em 25/04/2023. Na pesquisa de 06/09/2026, índice e PDF não entregaram o corpo. Uma compilação baseada no Climanálise contabiliza seis sistemas frontais no Brasil em outubro de 2001, mas esse número mensal não identifica o sistema de 08/10 em Pelotas e não é usado como explicação específica.

### 6.6 Falsa pista resolvida — Carvalho e Frassoni, 2003

**CARVALHO, Maria Helena de; FRASSONI DOS SANTOS, Ariane. Estudo de um caso de chuvas intensas em Pelotas-RS. XI SBSR, Belo Horizonte, 2003, p. 439-446.**

O trabalho original mostra que o caso ocorreu entre **31/08 e 03/09/2001**, com 147,4 mm em Pelotas, CCM e posterior ciclogênese no Atlântico. Ele não pertence à cronologia de 08/10/2001 e permanece separado.

## 7. Recuperação do arquivo bruto ANA 87955000

A cota histórica foi localizada em recompilação oficial/municipal da série ANA, mas o objetivo de proveniência é obter a resposta bruta/consistida da própria base HIDRO e a ficha de estação.

### 7.1 API moderna

A ANA documenta a rota:

`GET /EstacoesTelemetricas/HidroSerieCotas/v1`

para séries de cota de estações convencionais, informando código e período de até 366 dias.

O acesso automatizado moderno exige autorização. O manual orienta solicitar credenciais em `hidro@ana.gov.br`, com identificação do usuário/instituição, CPF/CNPJ e e-mail.

Quando houver credencial oficial, a consulta desejada é:

- estação: `87955000`;
- período: outubro de 2001;
- recuperar versões bruta e consistida quando disponíveis;
- preservar flags de consistência e datas originais;
- recuperar também inventário/ficha da estação e metadados de lances de régua/zero/RN.

Nenhuma credencial deve ser colocada em código, docs, logs ou Git.

### 7.2 Serviço legado

O `ServiceANA` ainda publica a definição de `HidroSerieHistorica`, que aceita código, período, `tipoDados=1` para cota e `nivelConsistencia=1|2` para bruto/consistido.

A própria ANA informa que esse serviço, tecnologicamente defasado e apoiado em base secundária, teve suporte prorrogado apenas até **30/06/2026**. Em 06/09/2026 suas páginas de definição ainda são rastreáveis, mas ele não deve virar dependência nova do Tempo Pelotas.

Pode servir apenas como pista arquivística/manual caso a ANA ainda o mantenha acessível, nunca como runtime novo.

## 8. Lacunas que permanecem abertas

A pesquisa resolveu a antiga lacuna genérica de “não existe série local”: há uma série histórica `87955000` e um pico documentado de 2,90 m no próprio 08/10/2001.

Restam:

1. arquivo bruto/consistido original da ANA para outubro de 2001;
2. ficha histórica da `87955000`, especialmente zero da régua, RN/datum, lances e eventuais mudanças de referencial;
3. relação documental entre `87955000` e `87955001`, se houver;
4. boletins meteorológicos contemporâneos de outubro de 2001, especialmente o corpo do Climanálise v.16 n.10 e cartas/boletins de 07 a 09/10;
5. textos integrais de Acosta 2002 e Cruz 2006;
6. identificação temporal dos candidatos Noble 2002 e Fernandes 2004.

Nenhuma referência bibliográfica sem corpo e nenhuma relação entre códigos sem documento oficial são promovidas à página pública como fato.

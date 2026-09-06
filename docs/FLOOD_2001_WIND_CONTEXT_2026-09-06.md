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

A série histórica da estação **Laranjal 87955000** foi recuperada diretamente dos arquivos Hidro fornecidos para auditoria em 06/09/2026.

As exportações CSV e TXT são idênticas e o próprio cabeçalho do Hidro define:

- `NivelConsistencia=1` = Bruto;
- `NivelConsistencia=2` = Consistido;
- `MediaDiaria=1` = média diária;
- `TipoMedicaoCotas=1` = Escala;
- `Status=1` = Real;
- `Status=2` = Estimado.

### 3.1 08/10/2001: bruto e consistido divergem

Para o dia 8 de outubro de 2001:

| Camada | Registro | Cota | Status |
| --- | --- | ---: | --- |
| Bruto | 07:00 | 300 cm | Real |
| Bruto | 17:00 | 280 cm | Real |
| Bruto | média diária | **290 cm** | Real |
| Consistido | média diária | **190 cm** | **Estimado** |

Na linha consistida, a máxima mensal também é 190 cm, o dia da máxima é 8 e os campos de status de máxima/mínima/média estão marcados como estimados.

O **Relatório de Caracterização Municipal do Plano Municipal de Saneamento Básico de Rio Grande**, publicado em 2013, recompila a série ANA e registra **2,90 m em 08/10/2001**. Depois da recuperação dos arquivos Hidro atuais, esse valor deve ser apresentado como compatível com a **camada bruta** da série, e não como uma cota definitiva já consistida.

Consequência editorial:

- `2,90 m` permanece publicado como valor bruto;
- `1,90 m` é publicado como valor consistido atualmente exportado;
- `1,90 m` é explicitamente marcado como **estimado**;
- o portal não escolhe silenciosamente uma das camadas como “a cota verdadeira”;
- bruto e consistido não são sobrescritos um pelo outro na documentação histórica.

### 3.2 A consistência de 2018 é rastreável, mas a correção específica ainda não

O MDB da `87955000` registra em **29/06/2018** que os dados fluviométricos da estação foram alterados no âmbito do **Contrato ANA nº 10/2015**, cujo objeto era a análise de consistência de dados fluviométricos.

Isso comprova que houve uma etapa formal de consistência sobre a série. O histórico textual consultado, porém, não explica por que o dia 08/10/2001 foi alterado de 290 cm bruto para 190 cm consistido.

Próxima fonte desejada: relatório/entregável do Contrato ANA nº 10/2015 ou outra memória técnica que documente a correção aplicada a outubro de 2001.

### 3.3 Pista sobre o zero da régua

O histórico do MDB registra em **05/10/2017** alteração do campo altitude de `5,00 m` para **`-0,02 m`**, descrita como a altitude correspondente ao zero da régua levantado em campo pela entidade operadora.

Em **30/03/2018**, o histórico registra substituição das réguas e numeração dos lances `0–1`, `1–2` e `2–3 m`.

Por isso, `-0,02 m` é uma pista cadastral importante, mas **não é retroprojetado para 2001**. Sem os levantamentos de RN/nivelamento e a cadeia de continuidade do referencial, o portal não converte 190 ou 290 cm em altitude absoluta.

Documentação recente do SGB também identifica `87955000` como LARANJAL/Pelotas e classifica a cota como **não nivelada**, com leitura feita diretamente na seção de réguas existente.

## 4. Relação 87955000 ↔ 87955001

Os arquivos fornecidos permitem refinar a relação operacional sem fundir os códigos.

### 87955000

O histórico registra em **30/04/2026** solicitação da CPLAR/SGH para corrigir o tipo/coleta para **F apenas**, retirando `T`, a data da coleta telemétrica e a descrição `TELEMÉTRICA`.

### 87955001

O MDB registra:

- cadastro em **08/06/2026**;
- nome `LARANJAL`;
- descrição `TELEMÉTRICA`.

Os ZIPs CSV e TXT fornecidos para `87955001` estão vazios, sem arquivo de série `Cotas` dentro deles.

### Interpretação adotada

- `87955000` = identidade convencional/histórica da régua e da série de cotas;
- `87955001` = identidade telemétrica recente usada pelo adapter atual de readiness/cross-check;
- a sucessão operacional é compatível com a separação de papéis convencional e telemétrico no Laranjal;
- nenhum arquivo analisado demonstra que os dois códigos compartilham o mesmo zero, RN ou datum vertical.

Portanto:

- não concatenar as séries automaticamente;
- não transferir zero/datum/RN entre códigos;
- não usar `87955001` para recalibrar 2001;
- não usar proximidade numérica para inferir equivalência vertical.

Documento operacional complementar: `docs/ANA_RHN_INTEGRATION.md`.

Documento da auditoria dos arquivos: `docs/LARANJAL_HIDRO_EXPORT_AUDIT_2026-09-06.md`.

## 5. O que as fontes NÃO autorizam afirmar

Mesmo com a análise específica da UFPel, o contexto POPA e a série Hidro recuperada, não se deve:

- substituir a velocidade de 105 km/h publicada contemporaneamente pela Folha por estimativa posterior;
- chamar `2,90 m` de valor consistido;
- esconder que `1,90 m` está marcado como estimado;
- transformar 190 ou 290 cm em altitude ou nível acima do mar;
- aplicar retroativamente o `-0,02 m` de 2017 à leitura de 2001 sem cadeia de nivelamento;
- presumir continuidade de referencial entre `87955000` e `87955001`;
- calcular quanto do avanço de aproximadamente 600 m foi produzido por cada mecanismo;
- afirmar que “nordestão” é sinônimo técnico de “ciclone extratropical”;
- tratar análise posterior como boletim operacional emitido em 08/10/2001.

## 6. Hierarquia editorial atual

1. **Folha de S.Paulo, 09/10/2001** — registro contemporâneo do sistema e dos principais números do episódio;
2. **Prefeitura de Pelotas, 22/10/2001** — registro municipal contemporâneo dos impactos e da recuperação;
3. **ANA/Hidro 87955000** — série bruta e consistida recuperada para 08/10/2001, preservando 290 cm bruto e 190 cm consistido/estimado;
4. **PMSB de Rio Grande, 2013** — recompilação anterior da série ANA, útil para documentar o valor de 2,90 m disponível à época;
5. **SGB** — confirmação moderna da identidade `87955000` e da natureza não nivelada da cota;
6. **Prefeitura de Pelotas, 18/10/2002** — memória municipal retrospectiva que usa o termo local “nordestão”;
7. **UFPel/SIIEPE, análise posterior específica** — reconstrução acadêmica do mecanismo de 05 a 08/10/2001 com dados NCEP e da Praticagem de Rio Grande;
8. **POPA, 10/02/2005** — contexto hidrodinâmico geral sobre a influência do vento Nordeste no balanço de nível da Lagoa.

## 7. Trilhas de recuperação meteorológica/acadêmica

### 7.1 Acosta et al. — XII CBMet, 2002

Referência confirmada:

**ACOSTA, R.; PINTO, L. B.; TATSCH, J. D.; SARAIVA, J. M. B.; CAMPOS, C. R. J. Análise sinótica do evento ocorrido em 08/10/2001 na região sudeste da Lagoa dos Patos. XII Congresso Brasileiro de Meteorologia, Foz do Iguaçu, 2002.**

O portal UFSMPublica classifica a produção como **Trabalho em Evento - Completo**, reforçando que existiu texto integral nos anais/CD-ROM.

Referências preservadas de outros trabalhos do XII CBMet confirmam que o antigo `cbmet.com` distribuía artigos em URLs do padrão:

`http://www.cbmet.com/cbm-files/<grupo>-<hash>.pdf`

O hash específico de Acosta não foi localizado. Não adivinhar o identificador.

Próximos caminhos: SBMet, CD-ROM do XII CBMet em bibliotecas universitárias, acervo dos autores, UFPel/UFSM e captura histórica somente quando índice/caminho exato for recuperado.

### 7.2 Cruz et al. — XIV CBMet, 2006

**CRUZ, P.; FARIAS, J.; CARVALHO, M. H.; FOSTER, P. Estudo sinótico do sistema meteorológico ocorrido no extremo sul do Brasil no dia 08/10/2001. XIV Congresso Brasileiro de Meteorologia, Florianópolis, 2006.**

O título identifica explicitamente 08/10/2001, mas o corpo integral não foi recuperado. Nenhuma conclusão adicional é atribuída a Cruz et al. sem o texto.

### 7.3 Noble, Pinto e Campos — XI CIC/UFPel, 2002

**NOBLE, D. V.; PINTO, L. B.; CAMPOS, C. R. J. Ocorrência de fenômenos meteorológicos observados na costa brasileira: um estudo de caso de ressaca ocorrido na região sudeste da Lagoa dos Patos. XI Congresso de Iniciação Científica da UFPel, Pelotas, 2002.**

O corpo não foi recuperado e o registro bibliográfico consultado não informa a data da ressaca. É apenas **candidato de acervo** e não é associado automaticamente a 08/10/2001.

### 7.4 Fernandes, Pinto e Campos — I SIBRADEN, 2004

**FERNANDES, D. S.; PINTO, L. B.; CAMPOS, C. R. J. Análise sinótica de um ciclone extratropical que atingiu a cidade de Pelotas-RS. I Simpósio Brasileiro de Desastres Naturais, Florianópolis, 2004, p. 697-703.**

O corpo integral não foi recuperado e a referência bibliográfica não identifica a data do ciclone analisado. O artigo não é tratado como estudo de outubro de 2001 sem essa prova.

### 7.5 CPTEC/INPE — Climanálise de outubro de 2001

Edição identificada:

**CLIMANÁLISE. Boletim de Monitoramento e Análise Climática. Cachoeira Paulista: INPE/CPTEC, v. 16, n. 10, out. 2001, p. 3-27.**

Endereços históricos:

- `http://climanalise.cptec.inpe.br/~rclimanl/boletim/1001/index.html`;
- `http://climanalise.cptec.inpe.br/~rclimanl/boletim/pdf/pdf01/out01.pdf`.

Um artigo de 2024 registra acesso ao índice em 25/04/2023. Na pesquisa de 06/09/2026, índice e PDF não entregaram o corpo. Uma compilação baseada no Climanálise contabiliza seis sistemas frontais no Brasil em outubro de 2001, mas esse número mensal não identifica o sistema de 08/10 em Pelotas e não é usado como explicação específica.

### 7.6 Falsa pista resolvida — Carvalho e Frassoni, 2003

**CARVALHO, Maria Helena de; FRASSONI DOS SANTOS, Ariane. Estudo de um caso de chuvas intensas em Pelotas-RS. XI SBSR, Belo Horizonte, 2003, p. 439-446.**

O trabalho original mostra que o caso ocorreu entre **31/08 e 03/09/2001**, com 147,4 mm em Pelotas, CCM e posterior ciclogênese no Atlântico. Ele não pertence à cronologia de 08/10/2001 e permanece separado.

## 8. Lacunas que permanecem abertas

A antiga lacuna “não existe série local” foi encerrada. Os arquivos Hidro bruto e consistido da `87955000` foram recuperados.

Restam:

1. relatório/entregável da consistência que explique especificamente a revisão de 290 cm para 190 cm em 08/10/2001;
2. ficha histórica da `87955000`, RNs, lances e nivelamentos que permitam saber qual referencial é aplicável a 2001;
3. relação documental vertical entre `87955000` e `87955001`, se existir;
4. boletins meteorológicos contemporâneos de outubro de 2001, especialmente o corpo do Climanálise v.16 n.10 e cartas/boletins de 07 a 09/10;
5. textos integrais de Acosta 2002 e Cruz 2006;
6. identificação temporal dos candidatos Noble 2002 e Fernandes 2004.

Nenhuma relação entre códigos sem documento, nenhuma conversão vertical sem nivelamento e nenhuma referência bibliográfica sem corpo são promovidas à página pública como fato.

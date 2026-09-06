# Laranjal — auditoria dos arquivos Hidro 87955000 e 87955001

Data da auditoria: 06/09/2026  
Escopo: arquivos exportados pelo sistema Hidro/ANA fornecidos para análise do Tempo Pelotas.

## 1. Regra de tratamento

Os arquivos brutos não são versionados no repositório. Este documento registra apenas conclusões técnicas sanitizadas necessárias ao produto.

O arquivo `by_region_BR_20260905-0109_20260906-0109.csv` foi identificado pelo remetente como arquivo intruso e foi **desconsiderado integralmente**.

Arquivos considerados:

- exportações CSV, TXT e MDB da estação `87955000`;
- exportações CSV, TXT e MDB da estação `87955001`;
- inventário RHN/Hidro de 31/08/2026;
- `Banco_Hidro_Vazio.mdb`, usado somente como referência estrutural;
- Plano de Trabalho da Operação da Rede Hidrometeorológica Nacional 2023.

## 2. Estação 87955000 — série de cotas

As exportações `87955000_Cotas.csv` e `87955000_Cotas.txt` são byte a byte idênticas. O cabeçalho do próprio Hidro define:

- `NivelConsistencia=1` = **Bruto**;
- `NivelConsistencia=2` = **Consistido**;
- `MediaDiaria=1` = média diária;
- `TipoMedicaoCotas=1` = escala;
- `Status=1` = Real;
- `Status=2` = Estimado;
- `Status=3` = Duvidoso;
- `Status=4` = Régua Seca.

### 2.1 Outubro de 2001

Para a linha mensal iniciada em `01/10/2001`, o dia 8 aparece assim:

| Camada | Registro | Cota do dia 08 | Status |
| --- | --- | ---: | --- |
| Bruto | leitura 07:00 | 300 cm | 1 = Real |
| Bruto | leitura 17:00 | 280 cm | 1 = Real |
| Bruto | média diária | **290 cm** | 1 = Real |
| Consistido | média diária | **190 cm** | **2 = Estimado** |

Na linha consistida, `Maxima=190`, `DiaMaxima=8` e os campos de status da máxima/mínima/média também estão marcados como `2 = Estimado`.

Consequência editorial obrigatória:

- `2,90 m` não é apagado: é o valor da **série bruta** para 08/10/2001;
- `1,90 m` é o valor da **série consistida** atualmente exportada para o mesmo dia;
- o valor consistido está marcado como **estimado**;
- o Tempo Pelotas não escolhe silenciosamente um dos dois como “a cota verdadeira” sem o relatório técnico que explique a correção;
- o relatório municipal de 2013 que registra 2,90 m permanece útil como fotografia da série/recompilação disponível à época, mas deixa de ser tratado como evidência de um valor definitivo já consistido.

## 3. Histórico cadastral e de consistência da 87955000

O MDB da estação preserva registros operacionais relevantes.

### 05/10/2017

O histórico informa alteração do campo altitude de `5,00 m` para `-0,02 m`, descrita como a altitude correspondente ao **zero da régua levantado em campo** pela entidade operadora.

Esse registro não autoriza aplicar retroativamente `-0,02 m` à série de 2001. A continuidade do referencial precisa ser comprovada porque o próprio histórico documenta intervenções posteriores na régua.

### 30/03/2018

O histórico registra substituição das réguas e numeração dos lances `0–1`, `1–2` e `2–3 m`.

### 29/06/2018

O histórico registra que os **dados fluviométricos da estação foram alterados** no âmbito do Contrato ANA nº 10/2015, cujo objeto era a **análise de consistência de dados fluviométricos**.

Esse registro torna a diferença bruto/consistido de 08/10/2001 rastreável a uma etapa formal de consistência, mas não informa, no texto histórico consultado, a justificativa específica para a alteração de `290 cm` para `190 cm` naquele dia.

### 30/04/2026

O histórico registra solicitação da CPLAR/SGH para corrigir o tipo/coleta da estação para **F apenas**, retirando `T`, além de retirar a data da coleta telemétrica e a descrição `TELEMÉTRICA`.

Consequência: a `87955000` permanece tratada pelo Tempo Pelotas como a identidade histórica/convecional da régua e de sua série de cotas.

## 4. Estação 87955001 — identidade telemétrica recente

O MDB `87955001` registra:

- data de cadastro: **08/06/2026**;
- nome: `LARANJAL`;
- descrição: `TELEMÉTRICA`.

As exportações CSV e TXT entregues para `87955001` são ZIPs vazios, sem arquivo de série de `Cotas` dentro deles.

O MDB da `87955001` tem somente **8.192 bytes** a mais que o `Banco_Hidro_Vazio.mdb` fornecido como referência. Isso é coerente com um cadastro recente sem série convencional exportada nesses arquivos, mas o tamanho do arquivo, isoladamente, não é usado como prova de ausência de qualquer dado em outros sistemas da ANA.

## 5. Relação 87955000 ↔ 87955001

Os arquivos agora permitem refinar a interpretação operacional:

- `87955000` preserva a série histórica de escala/cota e possui histórico de décadas;
- em 30/04/2026, o tipo telemétrico foi explicitamente retirado da `87955000`, mantendo-a como `F`;
- em 08/06/2026, a `87955001` foi cadastrada como `LARANJAL` com descrição `TELEMÉTRICA`;
- o adapter atual do Tempo Pelotas consulta `87955001` para readiness/cross-check;
- a página histórica de 2001 usa exclusivamente a série `87955000`.

Isso sustenta a existência de **papéis operacionais distintos, convencional/histórico e telemétrico atual**, no mesmo contexto de monitoramento do Laranjal.

Ainda não há, nos arquivos analisados, declaração suficiente para afirmar que os dois códigos compartilham:

- o mesmo zero de régua;
- a mesma RN;
- o mesmo datum vertical;
- uma transformação matemática direta entre leituras;
- uma série contínua que possa ser concatenada sem metadados adicionais.

Portanto os códigos permanecem separados no modelo de dados e na comunicação pública.

## 6. Plano de Operação RHN 2023 — implicações

O Plano de Trabalho da RHN-ANA reforça que a qualidade de séries fluviométricas depende de manutenção e controle do referencial físico da estação. Entre as diretrizes estão:

- manutenção/reinstalação de réguas e verificação das RNs;
- nivelamento geométrico completo de RNs e réguas em visitas periódicas;
- verificação do nivelamento da régua correspondente ao nível da água;
- análise preliminar e correção de dados para reduzir erros nas séries históricas;
- manutenção de instrumentação telemétrica quando ela coexistir com um ponto convencional de monitoramento.

Essas regras reforçam por que não se deve transformar uma cota de régua em altitude ou concatenar códigos sem documentação do referencial.

## 7. Contrato editorial adotado

Para `/enchente-2001-pelotas`:

- mostrar **290 cm bruto** e **190 cm consistido/estimado** para 08/10/2001;
- quando útil, mostrar as leituras brutas de 300 cm às 07h e 280 cm às 17h;
- deixar explícito que ambos os valores pertencem à `87955000`;
- explicar que o histórico do MDB registra processo formal de consistência em 2018;
- não usar `87955001` para corrigir ou recalibrar 2001;
- não converter nenhuma dessas cotas em altitude sem fechar zero/RN/datum aplicável ao período;
- manter o `-0,02 m` de 2017 como pista cadastral, não como conversão retroativa automática.

## 8. Próximas lacunas

1. localizar o relatório/entregável do Contrato ANA nº 10/2015 que explique a consistência aplicada à `87955000`, especialmente outubro de 2001;
2. recuperar ficha de estação, RNs, lances e históricos de nivelamento que permitam determinar o referencial aplicável a 08/10/2001;
3. obter documento oficial que descreva a relação operacional e vertical entre `87955000` e `87955001`, se existir;
4. preservar separadamente os valores bruto e consistido no Historical Data Layer caso essa série venha a ser importada futuramente.

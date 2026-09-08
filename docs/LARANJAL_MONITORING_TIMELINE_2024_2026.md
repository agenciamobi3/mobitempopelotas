# Cronologia do monitoramento no Trapiche do Laranjal — 2024 a 2026

Data de consolidação: 08/09/2026

## Objetivo

Registrar marcos documentados da evolução do monitoramento de nível no Trapiche da Praia do Laranjal sem transformar equipamentos, códigos ou referências de épocas diferentes em uma única série hidrológica.

A cronologia é usada como contexto público em `/nivel-da-lagoa-dos-patos-laranjal`.

## 9 de maio de 2024 — medidor HidroSens no Trapiche

O trabalho técnico **“Análise dos fatores influentes na variação do nível da água no estuário da Lagoa dos Patos, durante a inundação de maio 2024”**, apresentado no I Congresso Nacional da Associação Brasileira de Engenharia Hídrica, é assinado por pesquisadores da UFPel/HidroSens, incluindo Leonardo Contreira Pereira, Letícia Silva Costa e José Eduardo das Neves Fonseca.

O trabalho registra que:

- o HidroSens instalou medidores em corpos hídricos de Pelotas durante a enchente de maio de 2024;
- os medidores foram instalados junto a réguas linimétricas usadas como referência de comparação das leituras;
- um medidor ultrassônico foi instalado no Trapiche da Praia do Laranjal;
- no Trapiche não havia rede elétrica nem Wi-Fi disponível;
- o equipamento usou duas baterias de 7 Ah e transmissão LoRaWAN para um gateway a aproximadamente 2,5 km;
- o medidor da Lagoa dos Patos foi instalado em 09/05/2024;
- o maior valor registrado no período foi **2,79 m segundo a régua local**.

A publicação informa explicitamente referência ao marco de Imbituba para a régua local do **Canal São Gonçalo**, mas não declara no mesmo trecho qual datum geodésico/vertical é aplicado à régua do Trapiche do Laranjal.

Consequência: a frase geral de que os medidores estavam junto a réguas linimétricas referenciadas não autoriza o Tempo Pelotas a assumir que a régua do Trapiche estava referenciada ao mesmo marco do Canal São Gonçalo.

Fonte:

- I CONABREH 2024: `https://static.even3.com/anais/937195.pdf?v=638936884795718411`

## 27 de junho de 2025 — anúncio de sensor da ANA próximo ao Trapiche

A Prefeitura Municipal de Pelotas informou que a Secretaria de Defesa Civil, em conjunto com o curso de Engenharia Hídrica da UFPel, instalava um **sensor da Agência Nacional de Águas e Saneamento Básico** de acompanhamento de nível próximo ao Trapiche da Praia do Laranjal.

O objetivo público informado era ampliar:

- o banco de dados;
- a capacidade de monitoramento das águas;
- a conexão das informações de Pelotas com outros pontos da região Sul.

A notícia não publica:

- código ANA da estação;
- zero da régua;
- RN;
- datum vertical;
- memória de nivelamento;
- prova de continuidade com o medidor HidroSens de 2024.

Fonte:

- Prefeitura Municipal de Pelotas: `https://www.pelotas.rs.gov.br/noticia/prefeitura-realiza-acoes-preventivas-no-laranjal`

A mesma informação foi republicada pelo Sanep.

## 8 de junho de 2026 — cadastro ANA registra a identidade telemétrica 87955001

O inventário público da Rede Hidrometeorológica Nacional registra a estação `LARANJAL` com código adicional `87955001` como estação telemétrica sob responsabilidade e operação da UFPel.

Na evidência cadastral consolidada no projeto:

- `EstacaoTelemetrica=Sim`;
- `EstacaoTelemetricaInicio=08/06/2026`;
- `Descricao=LARANJAL TELEMÉTRICA`;
- responsável: UFPel;
- operadora: UFPel;
- município: Pelotas/RS;
- corpo hídrico: Lagoa dos Patos.

Esse é o primeiro marco documental recuperado que liga diretamente o código **87955001** à identidade telemétrica atual do Laranjal.

Ele não prova, porém, que a estação cadastrada em junho de 2026 seja exatamente o mesmo hardware anunciado pela Prefeitura em junho de 2025. O anúncio municipal não publicou código de estação, número de série, RN, zero da régua ou documento de instalação que permita fechar essa identidade.

Fonte:

- inventário público ANA/SNIRH — Rede Hidrometeorológica Nacional, consultado pelo adapter `ana-rhn-laranjal-profile.server.ts`.

A seção pública não fixa essa data em código: o marco é gerado a partir de `EstacaoTelemetricaInicio` quando o cadastro `87955001` responde e contém uma data válida.

## 16 de agosto de 2026 — monitoramento de Pelotas na rede CIEX/FURG

Reportagem do A Hora do Sul registra que o nível da Lagoa no Laranjal passou a integrar o monitoramento do CIEX/FURG.

A reportagem informa que:

- o radar/medidor permanece no Trapiche do Laranjal;
- a parceria HidroSens/UFPel com a FURG remonta à enchente de 2024;
- o equipamento passou por ajustes de autonomia energética;
- os dados coletados são enviados ao campus Anglo da UFPel;
- depois são disponibilizados para a ANA e para o CIEX.

Essa etapa explica a presença atual de Pelotas no ecossistema CIEX/FURG, mas não cria equivalência vertical entre a série CIEX/FURG, o medidor HidroSens e a estação ANA `87955001`.

Fonte:

- A Hora do Sul, 16/08/2026: `https://ahoradosul.com.br/conteudos/2026/08/16/nivel-da-lagoa-no-laranjal-passa-a-integrar-monitoramento-do-ciex-furg/`

## Relação entre o sensor anunciado em 2025 e a estação 87955001

As evidências agora formam uma sequência mais estreita:

1. em 27/06/2025, Prefeitura e UFPel anunciam um sensor da ANA próximo ao Trapiche;
2. em 08/06/2026, o inventário ANA passa a registrar a identidade telemétrica `87955001` no Laranjal, sob responsabilidade/operação da UFPel;
3. em agosto de 2026, o monitoramento de Pelotas aparece integrado ao CIEX/FURG e os dados do HidroSens são descritos como disponibilizados à ANA e ao CIEX.

Essa sequência é compatível com uma evolução do mesmo ecossistema de monitoramento, mas **não é prova documental de identidade de hardware**.

Nas superfícies públicas pesquisadas em 08/09/2026 não foi localizado documento que relacione explicitamente o sensor anunciado em 2025 ao código `87955001` por número de série, código ANA, ficha de instalação ou memória de nivelamento.

Portanto, o portal não afirma que:

- o sensor anunciado pela Prefeitura em 2025 seja exatamente o mesmo hardware cadastrado como `87955001`;
- a estação `87955001` reutilize o mesmo zero físico da régua observada pelo HidroSens em 2024;
- o sensor telemétrico compartilhe RN ou datum com a histórica `87955000`;
- a referência vertical da rede CIEX/FURG possa ser aplicada a qualquer uma dessas outras séries.

Até existir documentação específica, hardware, códigos de estação, réguas e referências permanecem semanticamente separados.

## Uso público

Componentes:

- `src/components/hydrology/LaranjalMonitoringHistory.tsx`
- `src/components/hydrology/LaranjalMonitoringHistory.module.css`

A seção pública apresenta três marcos editoriais fixos e acrescenta dinamicamente o marco cadastral da `87955001` quando o inventário ANA devolve `EstacaoTelemetricaInicio` válido.

Não exibe:

- tags genéricas;
- valores ANA atuais;
- inferência de datum;
- equivalência entre sensores;
- diagnóstico de inundação.

Contrato:

- `tests/laranjal-monitoring-history.test.ts`

## Relação com o gate vertical

O documento `docs/ANA_RHN_VERTICAL_REFERENCE_GATE_87955001_2026-09-08.md` continua sendo a fonte de verdade para eventual uso da medição ANA.

Esta cronologia acrescenta contexto histórico e vínculo cadastral com o código atual, mas não altera:

- `verticalReference=null`;
- `publishableMeasurement=false`;
- `station-specific-leveling-not-recovered`;
- `historical-current-vertical-continuity-unproven`.

# Defesa Civil RS — inventário regional de estações para auditoria editorial

Data do snapshot: 05/09/2026  
Origem: resposta pública normalizada do Tempo Pelotas capturada durante diagnóstico real de `/situacao-hidrologica-pelotas`  
Estado: **fotografia documental para auditoria; não é registry de publicação nem autorização automática de SEO**

## 1. Objetivo

Registrar a fotografia nominal das estações da Rede de Monitoramento Hidrometeorológico da Defesa Civil RS que chegaram ao recorte regional do Tempo Pelotas em 05/09/2026 e separar:

- estações com correspondência nominal forte a município que já possui página meteorológica;
- estações cujo próprio nome envolve mais de um município/localidade e, portanto, exigem revisão;
- estações de municípios que ainda não fazem parte do inventário meteorológico público do Tempo Pelotas.

Este documento existe para impedir publicação por aproximação. **Proximidade geográfica, prefixo textual ou presença no recorte de 320 km não bastam, isoladamente, para criar uma página hidrológica indexável.**

## 2. Snapshot executivo

Na captura utilizada nesta auditoria, o payload regional continha **36 estações**:

- 34 classificadas como `BOTH` pela capacidade informada/normalizada;
- 2 classificadas como `METEOROLOGY`;
- nenhuma promovida a página pública apenas por esta classificação.

A classificação descreve capacidade de dados. Ela não representa risco, qualidade editorial, município canônico, conexão hidrológica com Pelotas ou aptidão automática a SEO.

## 3. Correspondências fortes com cidades meteorológicas já publicadas

As estações abaixo possuem nome igual ao município ou prefixo nominal suficientemente claro para iniciar revisão editorial. “Candidata” significa **candidata à avaliação**, não página autorizada.

| Código | Estação | Bacia informada | Classe | Página meteorológica existente | Estado editorial |
| --- | --- | --- | --- | --- | --- |
| `DCRS-00063` | Capão do Leão - Eclusa - Canal São Gonçalo | Lagoa Mirim e Canal São Gonçalo | BOTH | `/tempo-em/capao-do-leao-rs` | CANDIDATA |
| `DCRS-00039` | Pelotas - Colônia Z3 | Lagoa Mirim e Canal São Gonçalo | BOTH | `/` | CANDIDATA, mas Pelotas já possui cluster hidrológico próprio |
| `DCRS-00062` | Pelotas - Arroio Pelotas | Lagoa Mirim e Canal São Gonçalo | METEOROLOGY | `/` | METEO apenas nesta fotografia |
| `DCRS-00038` | Rio Grande | Lagoa Mirim e Canal São Gonçalo | BOTH | `/tempo-em/rio-grande-rs` | CANDIDATA, mas Rio Grande já possui estação FURG CCMAR no cluster da Lagoa |
| `DCRS-00126` | Turuçu | Rio Camaquã | BOTH | `/tempo-em/turucu-rs` | CANDIDATA |
| `DCRS-00111` | Arroio Grande - Santa Isabel do Sul | Lagoa Mirim e Canal São Gonçalo | BOTH | `/tempo-em/arroio-grande-rs` | CANDIDATA, revisar localidade Santa Isabel do Sul |
| `DCRS-00045` | São Lourenço do Sul | Rio Camaquã | BOTH | `/tempo-em/sao-lourenco-do-sul-rs` | CANDIDATA, mas já existe estação própria no cluster da Lagoa |
| `DCRS-00040` | São Lourenço do Sul - Arroio São Lourenço | Rio Camaquã | BOTH | `/tempo-em/sao-lourenco-do-sul-rs` | CANDIDATA a contexto fluvial separado |
| `DCRS-00125` | Cristal | Rio Camaquã | BOTH | `/tempo-em/cristal-rs` | CANDIDATA |
| `DCRS-00050` | Arroio Grande | Lagoa Mirim e Canal São Gonçalo | BOTH | `/tempo-em/arroio-grande-rs` | CANDIDATA |
| `DCRS-00115` | Jaguarão | Lagoa Mirim e Canal São Gonçalo | BOTH | `/tempo-em/jaguarao-rs` | CANDIDATA |
| `DCRS-00041` | Bagé | Rio Negro | BOTH | `/tempo-em/bage-rs` | CANDIDATA |
| `DCRS-00049` | Santa Vitória do Palmar - Lagoa Mirim | Lagoa Mirim e Canal São Gonçalo | BOTH | `/tempo-em/santa-vitoria-do-palmar-rs` | CANDIDATA |

Antes de qualquer publicação, cada candidata precisa validar: município/localidade real, corpo hídrico observado, unidade do nível, referência/zero da régua quando aplicável, consistência temporal, utilidade editorial e ausência de página canônica já melhor atendida por outra fonte.

## 4. Nomes compostos que não podem ser atribuídos automaticamente

| Código | Estação | Bacia informada | Classe | Páginas meteorológicas potencialmente relacionadas | Estado editorial |
| --- | --- | --- | --- | --- | --- |
| `DCRS-00052` | Cerrito - Pedro Osório | Lagoa Mirim e Canal São Gonçalo | BOTH | `/tempo-em/cerrito-rs`, `/tempo-em/pedro-osorio-rs` | REVISAR município/localidade e corpo hídrico |
| `DCRS-00042` | Piratini - Cerrito | Lagoa Mirim e Canal São Gonçalo | BOTH | `/tempo-em/piratini-rs`, `/tempo-em/cerrito-rs` | REVISAR município/localidade e corpo hídrico |
| `DCRS-00051` | Piratini - Herval | Lagoa Mirim e Canal São Gonçalo | BOTH | `/tempo-em/piratini-rs`, `/tempo-em/herval-rs` | REVISAR município/localidade e corpo hídrico |

Nenhuma dessas três deve usar “primeiro nome = município da estação” como regra automática.

## 5. Estações fora do inventário meteorológico municipal atual

Estas estações estavam no snapshot regional, mas o município/localidade não possui página meteorológica no conjunto atual de 24 cidades ou requer outro tratamento editorial.

| Código | Estação | Bacia informada | Classe |
| --- | --- | --- | --- |
| `DCRS-00112` | Amaral Ferrador | Rio Camaquã | BOTH |
| `DCRS-00128` | Santana da Boa Vista | Rio Camaquã | BOTH |
| `DCRS-00090` | Dom Feliciano | Rio Camaquã | BOTH |
| `DCRS-00053` | Arambaré | Rio Camaquã | BOTH |
| `DCRS-00089` | Cerro Grande do Sul | Rio Camaquã | BOTH |
| `DCRS-00066` | Encruzilhada do Sul | Baixo Jacuí | BOTH |
| `DCRS-00037` | Mostardas | Litoral Médio | BOTH |
| `DCRS-00088` | Sertão Santana (H) | Lago Guaíba | BOTH |
| `DCRS-00118` | Cachoeira do Sul - Arroio Irapuá | Baixo Jacuí | BOTH |
| `DCRS-00067` | Lavras do Sul | Rio Camaquã | BOTH |
| `DCRS-00054` | Barra do Ribeiro - Lago Guaíba | Lago Guaíba | BOTH |
| `DCRS-00113` | Cachoeira do Sul - Centro | Baixo Jacuí | METEOROLOGY |
| `DCRS-00028` | Rio Pardo - Rio Jacuí | Baixo Jacuí | BOTH |
| `DCRS-00105` | Viamão - Reserva Estadual (H) | Lago Guaíba | BOTH |
| `DCRS-00101` | Rio Pardo (H) | Rio Pardo | BOTH |
| `DCRS-00044` | Viamão - Itapuã | Lago Guaíba | BOTH |
| `DCRS-00093` | General Câmara/São Jeronimo | Baixo Jacuí | BOTH |
| `DCRS-00033` | Porto Alegre - Ipanema | Lago Guaíba | BOTH |
| `DCRS-00032` | Charqueadas | Baixo Jacuí | BOTH |
| `DCRS-00122` | Porto Alegre - Cristal | Lago Guaíba | BOTH |

Observações importantes:

- Arambaré já possui página hidrológica no cluster específico da Rede de Monitoramento do Nível da Lagoa dos Patos; não criar uma segunda página concorrente por causa desta estação da Defesa Civil.
- Viamão/Itapuã também já possui destino hidrológico no cluster da Lagoa. Uma futura leitura da Defesa Civil deve ser tratada como fonte/estação adicional somente depois de validar referência e intenção editorial.
- Porto Alegre já possui `/nivel-do-guaiba`, que é o destino canônico para Guaíba/Cais Mauá/Gasômetro; novas estações da Defesa Civil não justificam automaticamente novas páginas concorrentes.

## 6. Cidades meteorológicas atuais sem correspondência nominal forte neste snapshot

No inventário municipal atual, não apareceu nesta fotografia uma estação com associação nominal forte para:

- Canguçu;
- Morro Redondo;
- Arroio do Padre;
- São José do Norte pela Defesa Civil, embora já exista estação no cluster da Lagoa;
- Chuí;
- Pinheiro Machado;
- Pedras Altas;
- Candiota;
- Aceguá;
- Dom Pedrito.

Isso não significa ausência de dados em outras redes, ausência permanente na Defesa Civil ou inexistência de estação. Significa apenas que esta fotografia regional não sustenta associação automática.

## 7. Gate para transformar uma estação em página ou módulo municipal

Uma estação só pode ser promovida quando todos os itens relevantes estiverem resolvidos:

1. identidade oficial da estação e código;
2. município/localidade confirmados sem inferência por distância;
3. rio, lagoa, canal ou reservatório identificado de forma suficientemente segura;
4. capacidade hidrológica oficial presente;
5. unidade do nível validada;
6. referência/zero/cota tratados de forma correta quando usados publicamente;
7. horário e estado de atualização preservados;
8. página canônica existente verificada para evitar duplicação;
9. intenção de busca distinta da página meteorológica;
10. conteúdo suficiente para não produzir página rasa;
11. fonte e créditos explícitos;
12. ausência nunca convertida em zero ou normalidade.

## 8. Estratégia de publicação sugerida

### Onda A — enriquecer páginas meteorológicas sem criar novas URLs

Após validação técnica da estação, candidatos naturais são Turuçu, Cristal, Jaguarão, Arroio Grande, Bagé, Capão do Leão e Santa Vitória do Palmar. O bloco hidrológico deve carregar de forma independente e não alterar title/H1 meteorológicos.

### Onda B — páginas hidrológicas próprias quando houver intenção clara

Criar URL própria somente quando o corpo hídrico e a consulta tiverem intenção de busca autônoma, por exemplo nível de rio/canal/lagoa em determinada localidade. A página meteorológica atua como distribuidora de autoridade, não como concorrente.

### Onda C — localidades fora das 24 cidades atuais

Avaliar separadamente Arambaré/Viamão já cobertos pelo cluster da Lagoa e municípios como Barra do Ribeiro, Cachoeira do Sul ou Rio Pardo. Não ampliar a Central Regional meteorológica só para justificar uma página hidrológica.

## 9. Limitações deste snapshot

- é uma fotografia de uma consulta real, não catálogo permanente da rede;
- estações podem entrar, sair, mudar nome, capacidade ou disponibilidade;
- a classificação `BOTH` não valida a unidade nem a referência do campo de nível;
- nomes compostos não são prova de jurisdição municipal;
- valores numéricos capturados não são transcritos neste inventário porque a finalidade aqui é identidade/publicação, não criar uma série histórica paralela;
- qualquer publicação futura deve usar o runtime atual e manter a fonte oficial como autoridade da leitura.

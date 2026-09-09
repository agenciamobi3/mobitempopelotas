# Tempo Pelotas — evoluções futuras do portal

Última atualização: 09/09/2026  
Branch de referência: `main`  
Status deste documento: **arquivo mestre de evoluções futuras e oportunidades estratégicas**

## 1. Objetivo

Este documento registra ideias, fontes, integrações e capacidades com potencial real para evoluir o Tempo Pelotas sem confundir descoberta com implementação.

Ele existe para preservar oportunidades que merecem ser retomadas depois, especialmente quando o portal já está próximo de fechar uma etapa e uma integração nova poderia aumentar risco, escopo ou regressões.

Regras:

- registrar aqui não autoriza alteração imediata de runtime, banco, loaders, UI ou páginas públicas;
- prioridade estratégica e prioridade de implementação são coisas diferentes;
- uma evolução pode ser classificada como muito valiosa e, ainda assim, permanecer deliberadamente fora do ciclo atual;
- provas de conceito devem começar isoladas quando houver risco de afetar integrações maduras;
- observação, previsão, alerta oficial, reanálise e dado derivado continuam semanticamente separados;
- nenhuma nova fonte hidrológica autoriza comparar cotas, réguas ou referências verticais incompatíveis;
- quando uma evolução virar funcionalidade real, o estado operacional deve ser consolidado também em `PROJECT_CURRENT_STATE.md` e na documentação especializada correspondente.

Estados sugeridos para futuras entradas:

- `registrada` — oportunidade preservada, sem implementação;
- `pesquisa` — investigação técnica permitida, sem impacto público;
- `POC isolado` — prova de conceito fora do fluxo público;
- `validada` — utilidade e limites comprovados;
- `planejada` — integração aprovada para ciclo futuro;
- `implementada` — já incorporada ao produto e transferida para a documentação operacional;
- `descartada` — não seguirá adiante, mantendo o motivo registrado.

---

## 2. Open-Meteo como plataforma ambiental ampliada

**Origem:** `open-meteo/open-meteo`  
**Prioridade estratégica:** ALTÍSSIMA  
**Prioridade de implementação agora:** BAIXA  
**Estado:** `registrada`  
**Decisão atual:** não alterar o runtime público nesta etapa.

### Oportunidade

O Tempo Pelotas já utiliza Open-Meteo para previsão meteorológica, mas o projeto aberto cobre um conjunto muito maior de capacidades, incluindo Weather, Historical, Air Quality, Marine, Elevation e Flood API, além da possibilidade futura de self-host.

A oportunidade de maior interesse imediato é hidrológica: explorar o Flood API / GloFAS como camada de **previsão regional de vazões**, complementar às fontes observacionais e oficiais já utilizadas pelo portal.

A camada modelada não deve substituir ANA, SGB/SACE, Defesa Civil, LabHidroSens/UFPel, FURG/Portos RS nem qualquer outra fonte observacional ou oficial.

### Enquadramento semântico obrigatório

O Flood API não deve ser apresentado como `nível previsto da Lagoa dos Patos` nem convertido em uma leitura equivalente à régua do Laranjal.

Uso futuro aceitável:

- previsão modelada de vazões em rios/bacias relevantes;
- contexto de antecedência hidrológica regional;
- comparação histórica entre cenário modelado e observações reais;
- pesquisa interna sobre relações temporais entre chuva, vazões, Guaíba, Lagoa dos Patos e leituras locais.

Uso não autorizado:

- transformar vazão modelada em cota da Lagoa;
- publicar alerta oficial próprio a partir do modelo;
- misturar Forecast API meteorológica e Flood API em um único valor sem proveniência;
- substituir fonte observada quando ela estiver indisponível.

### Arquitetura futura sugerida

Quando a pesquisa for retomada, preferir integração irmã e isolada, por exemplo:

```text
src/lib/hydrology/open-meteo-flood.server.ts
src/lib/hydrology/open-meteo-flood.functions.ts
```

A primeira etapa deve ser uma auditoria de mapeamento hidrológico entre a hidrografia ANA/SNIRH e células/rios representados pelo GloFAS. Não assumir que a latitude/longitude de Pelotas identifica automaticamente o curso d'água adequado.

Sequência segura sugerida:

1. mapear bacias e rios relevantes para o sistema regional;
2. testar células/coordenadas candidatas;
3. validar qual rio o modelo representa em cada ponto;
4. criar POC isolado, sem UI pública e sem migration obrigatória;
5. comparar previsões modeladas com observações existentes;
6. só então decidir se a fonte merece integração pública.

### Self-host

Self-host permanece evolução de longo prazo. Não é tarefa do ciclo atual.

O objetivo futuro seria reduzir dependência operacional de uma única API pública e estudar infraestrutura própria quando volume, custos, termos de uso ou resiliência justificarem. Antes disso, devem ser avaliados licenciamento, dados utilizados, cache, armazenamento, operação e diferença entre hospedar apenas a API e manter também datasets/modelos próprios.

### Guardrail do ciclo atual

Não mexer agora em:

- adapter Open-Meteo meteorológico existente;
- loaders hidrológicos públicos;
- `/situacao-hidrologica-pelotas`;
- páginas de nível da Lagoa/Guaíba;
- migrations;
- contratos de observação atuais;
- classificação pública de risco.

**Gatilho de retomada:** estabilidade sustentada do ciclo atual e disponibilidade para uma POC isolada sem pressionar o fechamento do portal.

---

## 3. Arquivo hidrológico oficial da ANA e catálogo próprio de estações

**Origens principais:**

- `anagovbr/dados-estacoes-hidro`;
- `anagovbr/hidro-dados-estacoes-convencionais`.

**Prioridade estratégica:** ALTÍSSIMA  
**Prioridade de implementação agora:** MÉDIA para pesquisa/backfill isolado; BAIXA para exposição pública nova  
**Estado:** `pesquisa`  
**Decisão atual:** pode ser explorado sem tocar no runtime público.

### Descoberta verificada em 09/09/2026

O repositório `anagovbr/hidro-dados-estacoes-convencionais` preserva um histórico Git muito extenso das séries convencionais da ANA, mas a árvore principal foi esvaziada em 18/12/2025 com a remoção de `fluviometricas/`, `pluviometricas/`, inventário, descrição de arquivos e README.

Portanto, seu maior valor atual para o Tempo Pelotas é de **arquivo histórico/backfill via histórico Git**, não de dataset vivo no HEAD.

O repositório `anagovbr/dados-estacoes-hidro`, por outro lado, permanece ativo e recebe sincronizações automáticas. Em 09/09/2026 foi confirmada a atualização da pasta `hidroobserva`, incluindo `hidroobserva/HidroObserva_RS.zip`.

### Valor para o Tempo Pelotas

Essas fontes podem alimentar um catálogo hidrológico próprio, normalizado e rastreável, sem substituir os sistemas oficiais de consulta em tempo real.

Modelo conceitual desejado:

```text
estação
→ operador/responsável
→ município/UF
→ rio
→ bacia/sub-bacia
→ variável
→ período disponível
→ resolução
→ referência vertical / datum
→ situação da referência
→ consistência / qualidade
→ última observação disponível
```

A `última observação` e o período disponível devem preferencialmente ser derivados da série armazenada (`MIN(observed_at)` / `MAX(observed_at)`) em vez de duplicados como metadados manuais que possam ficar desatualizados.

### Encaixe arquitetural

A evolução deve reutilizar a Historical Data Layer existente em vez de criar um arquivo paralelo.

Estruturas já adequadas ao objetivo:

- `historical_data_sources`;
- `historical_stations`;
- `historical_measurements`;
- classes `observation`, `forecast`, `reanalysis` e `derived`;
- `quality_flag`;
- `source_record_id`;
- `metadata` para proveniência adicional.

O catálogo pode enriquecer `historical_stations.metadata` ou, se a escala justificar, ganhar tabelas próprias de inventário/variáveis/referências em uma evolução posterior. Não criar nova modelagem antes de inspecionar o formato real dos arquivos da ANA.

### Referência vertical e consistência

A experiência com as estações ANA `87955000` e `87955001` continua sendo regra para esta evolução.

Ter uma série de nível não significa que ela possa ser comparada diretamente a outra estação.

O catálogo deve conseguir representar, no mínimo:

```text
verticalReference.status
= confirmed
= partial
= unknown
= incompatible
```

Bruto e consistido devem permanecer distinguíveis. Nenhum backfill pode sobrescrever silenciosamente um valor bruto por um consistido ou vice-versa.

### Primeira pesquisa segura

Começar pelo Rio Grande do Sul e por um escopo pequeno:

1. inspecionar `HidroObserva_RS.zip`;
2. documentar formato, inventário e variáveis reais;
3. identificar estações de Pelotas e bacias regionalmente relevantes;
4. cruzar uma estação já conhecida pelo Tempo Pelotas com os metadados recuperados;
5. validar identidade, período, qualidade, consistência e referência;
6. produzir relatório antes de qualquer ingestão em massa;
7. somente depois desenhar o backfill.

### Possibilidades futuras

Depois de validado, o catálogo pode sustentar:

- histórico de longo prazo por estação;
- backfill oficial para eventos históricos;
- validação cruzada de séries já usadas pelo portal;
- descoberta de estações regionais úteis;
- inventário de cobertura temporal;
- distinção entre séries brutas e consistidas;
- pesquisa de eventos extremos;
- documentação de referências verticais;
- seleção mais segura de fontes para novas páginas e análises.

### Guardrail do ciclo atual

A pesquisa pode avançar como ingestão offline/backfill experimental, mas sem alterar por consequência automática:

- `Agora`;
- nível publicado do Laranjal;
- ANA `87955001` e seu gate vertical;
- SACE;
- Defesa Civil;
- rede da Lagoa dos Patos;
- loaders públicos;
- páginas atuais;
- status público das fontes.

**Gatilho de retomada:** análise do `HidroObserva_RS.zip` e validação de uma estação conhecida, mantendo toda a primeira rodada fora do fluxo público.

---

## 4. Regra para as próximas descobertas

Novas ideias podem ser acrescentadas diretamente a este arquivo usando a estrutura:

```text
Nome da evolução
Origem
Prioridade estratégica
Prioridade de implementação agora
Estado
Valor esperado
Riscos
Encaixe no projeto atual
Guardrails
Primeiro experimento seguro
Gatilho de retomada
```

A intenção é permitir acumular boas descobertas sem transformar cada descoberta em nova frente de desenvolvimento.

# Tempo Pelotas — evoluções futuras do portal

Última atualização: 09/09/2026  
Branch de referência: `main`  
Status deste documento: **arquivo mestre de evoluções futuras e oportunidades estratégicas**

## 1. Objetivo

Este documento registra ideias, fontes, integrações e capacidades com potencial real para evoluir o Tempo Pelotas sem confundir descoberta com implementação.

Regras permanentes:

- registrar aqui não autoriza alteração imediata de runtime, banco, loaders, UI ou páginas públicas;
- prioridade estratégica e prioridade de implementação são coisas diferentes;
- uma evolução pode ser muito valiosa e permanecer deliberadamente fora do ciclo atual;
- provas de conceito começam isoladas quando houver risco de afetar integrações maduras;
- observação, previsão, alerta oficial, reanálise e dado derivado permanecem semanticamente separados;
- nenhuma nova fonte hidrológica autoriza comparar cotas, réguas ou referências verticais incompatíveis;
- diagnóstico técnico de uma biblioteca não vira automaticamente classificação pública de qualidade;
- quando uma evolução virar funcionalidade real, o estado operacional deve ser consolidado em `PROJECT_CURRENT_STATE.md` e na documentação especializada correspondente.

Estados usados neste arquivo:

- `registrada` — oportunidade preservada, sem implementação;
- `pesquisa` — investigação técnica permitida, sem impacto público;
- `POC isolado` — prova de conceito fora do fluxo público;
- `validada` — utilidade e limites comprovados;
- `planejada` — integração aprovada para ciclo futuro;
- `implementada` — incorporada ao produto e transferida para documentação operacional;
- `descartada` — não seguirá adiante, com motivo preservado.

---

## 2. Open-Meteo como plataforma ambiental ampliada

**Origem:** `open-meteo/open-meteo`  
**Prioridade estratégica:** ALTÍSSIMA  
**Prioridade de implementação agora:** BAIXA  
**Estado:** `registrada`  
**Decisão atual:** não alterar o runtime público nesta etapa.

O Tempo Pelotas já utiliza Open-Meteo para previsão meteorológica, mas o projeto cobre capacidades adicionais como Historical, Air Quality, Marine, Elevation e Flood API, além da possibilidade futura de self-host.

A oportunidade de maior interesse é explorar Flood API / GloFAS como camada de **previsão regional de vazões**, complementar às fontes observacionais e oficiais. Essa camada não deve substituir ANA, SGB/SACE, Defesa Civil, LabHidroSens/UFPel, FURG/Portos RS nem ser rotulada como nível previsto da Lagoa dos Patos.

Uso futuro aceitável:

- previsão modelada de vazões em rios e bacias relevantes;
- contexto de antecedência hidrológica regional;
- comparação histórica entre cenário modelado e observações reais;
- pesquisa interna sobre relações temporais entre chuva, vazões, Guaíba, Lagoa dos Patos e leituras locais.

Primeiro experimento seguro:

1. mapear bacias e rios relevantes com apoio da hidrografia ANA/SNIRH;
2. testar células/coordenadas candidatas do modelo;
3. validar qual curso d'água cada ponto representa;
4. criar POC isolado sem UI pública;
5. comparar previsão modelada com observações existentes;
6. só então decidir sobre integração pública.

Self-host permanece evolução de longo prazo. Deve ser reconsiderado somente quando volume, custos, termos de uso ou resiliência justificarem estudar operação própria.

**Guardrail do ciclo atual:** não alterar adapter meteorológico Open-Meteo, loaders hidrológicos, `/situacao-hidrologica-pelotas`, páginas de nível, migrations ou classificação pública de risco.

**Gatilho de retomada:** estabilidade sustentada do ciclo atual e espaço para POC isolada.

---

## 3. Arquivo hidrológico oficial da ANA e catálogo próprio de estações

**Origens:** `anagovbr/dados-estacoes-hidro` e `anagovbr/hidro-dados-estacoes-convencionais`  
**Prioridade estratégica:** ALTÍSSIMA  
**Prioridade de implementação agora:** MÉDIA para pesquisa/backfill isolado; BAIXA para exposição pública nova  
**Estado:** `pesquisa`  
**Decisão atual:** pode ser explorado sem tocar no runtime público.

Em 09/09/2026 foi verificado que `hidro-dados-estacoes-convencionais` preserva um histórico Git extenso, mas sua árvore principal foi esvaziada em 18/12/2025. Seu valor atual é principalmente de arquivo histórico/backfill via histórico Git.

`anagovbr/dados-estacoes-hidro` permanece ativo e recebe sincronizações automáticas. Foi confirmada a presença e atualização de `hidroobserva/HidroObserva_RS.zip`.

Objetivo de longo prazo: construir um catálogo hidrológico próprio e rastreável:

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

A evolução deve reutilizar a Historical Data Layer existente, principalmente `historical_data_sources`, `historical_stations`, `historical_measurements`, `quality_flag`, `source_record_id` e `metadata`.

`MIN(observed_at)` e `MAX(observed_at)` devem ser preferidos para derivar cobertura temporal e última observação, evitando metadados duplicados que possam ficar desatualizados.

Referência vertical deve admitir pelo menos:

```text
confirmed
partial
unknown
incompatible
```

Bruto e consistido permanecem distintos. Nenhum backfill pode sobrescrever silenciosamente uma versão pela outra.

Primeiro experimento seguro:

1. inspecionar `HidroObserva_RS.zip`;
2. documentar formato, inventário e variáveis reais;
3. identificar Pelotas e bacias regionalmente relevantes;
4. cruzar uma estação já conhecida pelo portal;
5. validar identidade, período, qualidade, consistência e referência;
6. produzir relatório antes de ingestão em massa.

**Guardrail do ciclo atual:** não alterar `Agora`, nível do Laranjal, gate ANA `87955001`, SACE, Defesa Civil, rede da Lagoa, loaders ou status público das fontes.

**Gatilho de retomada:** validação de uma estação conhecida a partir do pacote do RS.

---

## 4. pyHidroWeb como worker de normalização e diagnóstico ANA

**Origem:** `duartejr/pyHidroWeb`  
**Prioridade estratégica:** ALTÍSSIMA  
**Prioridade de implementação agora:** MÉDIA para POC de worker isolado; BAIXA para consumo público direto  
**Estado:** `pesquisa`  
**Decisão atual:** não colocar Python no frontend; estudar como serviço auxiliar desacoplado.

O pyHidroWeb é especialmente alinhado à fase atual da hidrologia porque normaliza diferentes caminhos de acesso aos dados ANA para um contrato diário comum. A versão atual documenta aquisição por HidroWebService autenticada e WebService legado, leitura de XML, JSON e arquivos HidroWeb, além de cota, vazão, chuva, análises, curvas-chave, seções transversais e diagnósticos fluviométricos.

Contrato normalizado de referência:

```text
station_code | date | variable | value | unit | consistency_level | source_status | source
```

A biblioteca distingue `consistency_level=2` como consistido e `consistency_level=1` como bruto, resolvendo duplicatas com preferência pelo consistido. Para o Tempo Pelotas, essa lógica é útil como referência de ingestão, mas o portal deve continuar preservando bruto e consistido como proveniências distintas quando a rastreabilidade histórica exigir.

Arquitetura preferida:

```text
ANA / HidroWeb / arquivos históricos
            ↓
worker hidrológico Python isolado
            ↓
JSON normalizado e auditável
            ↓
Supabase / Historical Data Layer / Nitro
            ↓
Tempo Pelotas
```

Possíveis responsabilidades do worker:

- normalizar XML, JSON, CSV/ZIP e respostas dos serviços ANA;
- produzir inventário de estação e produtos disponíveis;
- separar cota, vazão e chuva;
- preservar nível de consistência e origem;
- recuperar curvas-chave e seções quando aplicável;
- gerar diagnósticos internos de disponibilidade e coerência;
- alimentar backfill e validação cruzada.

Relação com `/status-dos-dados`: o worker pode fortalecer a evidência interna usada para separar disponibilidade da integração e condição real dos dados. Porém, diagnósticos da biblioteca não devem virar automaticamente badge público, selo de qualidade ou autorização de publicação.

A biblioteca também mantém um retrato interno estático de inventário e medições, útil para diagnóstico offline, mas qualquer dado embutido deve ser tratado como snapshot com data de referência, nunca como estado atual da ANA.

Primeiro experimento seguro:

1. executar o worker fora do frontend e fora do loader público;
2. processar uma estação ANA já conhecida pelo portal;
3. comparar saída XML, JSON e/ou arquivo histórico para o mesmo período;
4. verificar bruto versus consistido;
5. gerar somente JSON e relatório, sem gravação automática;
6. só depois avaliar integração com Historical Data Layer.

**Guardrail do ciclo atual:** não trocar adapters TypeScript existentes por Python e não introduzir dependência síncrona do worker nas páginas públicas.

**Gatilho de retomada:** necessidade real de unificar múltiplos formatos ANA ou acelerar o catálogo/backfill da seção anterior.

---

## 5. Herbie e acesso direto a modelos numéricos

**Origem:** `blaylockbk/Herbie`  
**Prioridade estratégica:** ALTÍSSIMA PARA 2027  
**Prioridade de implementação agora:** MUITO BAIXA  
**Estado:** `registrada`  
**Horizonte:** 2027, depois da consolidação operacional e histórica do portal.

Herbie permite acessar diretamente dados de modelos numéricos de previsão e baixar arquivos completos ou subconjuntos de variáveis. O projeto documenta mais de 15 modelos e inclui, entre outros, GFS, GEFS, ECMWF IFS e ECMWF AIFS, com busca em diferentes infraestruturas de dados e leitura para xarray.

A evolução desejada não é simplesmente trocar Open-Meteo por GRIB bruto. É criar uma camada independente de **comparação entre modelos**.

Pergunta futura central:

```text
GFS, GEFS, IFS e AIFS estão contando uma história semelhante para Pelotas?
```

Produtos possíveis:

- convergência ou divergência entre modelos;
- faixa prevista de temperatura e precipitação;
- dispersão entre cenários;
- evolução da concordância conforme o evento se aproxima;
- identificação de mudanças bruscas entre rodadas;
- suporte a uma futura linguagem editorial de incerteza.

Exemplo conceitual futuro:

```text
Cenário mais estável
Os principais modelos convergem para chuva durante a tarde.
```

ou:

```text
Cenário ainda incerto
Os modelos divergem sobre horário e volume de chuva.
```

Regra científica importante: **concordância entre modelos não é, sozinha, confiança calibrada**. Modelos podem compartilhar vieses ou errar juntos. Qualquer futura classificação `confiança alta/média/baixa` deve combinar dispersão entre modelos com desempenho histórico verificado contra observações. Por isso, esta evolução deve ser construída junto da camada de verificação descrita na seção `nci/scores`.

Arquitetura futura preferida:

```text
Herbie / fontes oficiais de modelo
       ↓
worker NWP / GRIB
       ↓
extração apenas das variáveis e pontos necessários
       ↓
forecast snapshots por modelo e rodada
       ↓
verificação + consenso + dispersão
       ↓
JSON editorial para o Tempo Pelotas
```

O frontend não deve baixar ou processar GRIB.

Primeiro experimento seguro em 2027:

1. escolher temperatura e precipitação para Pelotas;
2. consultar duas fontes/modelos inicialmente, não quatro de uma vez;
3. armazenar snapshots de rodada, lead time e valor previsto;
4. comparar com observação real;
5. adicionar modelos gradualmente;
6. somente depois testar linguagem pública de convergência/divergência.

**Guardrail:** Herbie não substitui a previsão atual antes de existir histórico comparativo suficiente.

**Gatilho de retomada:** Historical Data Layer madura, observações confiáveis e pipeline de verificação consolidado.

---

## 6. nci/scores e verificação meteorológica própria

**Origem:** `nci/scores`  
**Prioridade estratégica:** ALTA  
**Prioridade de implementação agora:** MÉDIA para conceitos e métricas simples; BAIXA para dependência Python  
**Estado:** `pesquisa`  
**Decisão atual:** usar o projeto como referência científica; não é necessário instalar a biblioteca no runtime.

O Tempo Pelotas já possui a semente de avaliação da previsão. O `scores` amplia isso para uma estrutura científica muito mais completa. O projeto reúne mais de 75 métricas, técnicas estatísticas e ferramentas de processamento para previsões contínuas, probabilísticas, categóricas e espaciais.

A estratégia recomendada é implementar em SQL/TypeScript apenas as métricas que respondam perguntas reais do portal.

Primeiro conjunto sugerido:

### Temperatura

- MAE por horizonte (`+1`, `+2`, `+3` dias etc.);
- RMSE quando fizer sentido penalizar erros maiores;
- bias para identificar tendência sistemática de superestimar ou subestimar.

### Chuva como evento

- Probability of Detection / taxa de detecção;
- False Alarm Ratio / falso alarme;
- Critical Success Index ou métrica equivalente para acerto do evento;
- matriz de contingência por limiar de precipitação.

### Probabilidade de chuva

- Brier Score, quando houver probabilidade prevista comparável com evento observado;
- calibração/reliability em estágio posterior, com amostra suficiente.

### Fase posterior

- Heidke Skill Score;
- Gilbert/Equitable Threat Score;
- métricas probabilísticas e espaciais somente quando o produto tiver dados e amostra adequados.

Exemplo futuro de transparência:

```text
Open-Meteo
Erro médio de temperatura em +2 dias: 1,3 °C
Detecção de chuva acima do limiar definido: 74%
Falso alarme: 11%
```

Toda métrica pública deve informar período analisado, tamanho da amostra, horizonte, variável e limiar. Não publicar um percentual isolado que pareça universal.

A rota `/metodologia` está aposentada e redireciona para `/status-dos-dados`. Portanto, esta evolução não deve reativá-la por acidente. Resultados futuros podem entrar em `Dados e fontes` de forma resumida ou justificar uma página própria de desempenho da previsão quando houver histórico suficiente.

Essa camada também é pré-requisito para transformar convergência de GFS/GEFS/IFS/AIFS em uma futura medida de confiança mais defensável.

Primeiro experimento seguro:

1. definir claramente observação de referência;
2. escolher um provedor e um horizonte;
3. calcular MAE/bias de temperatura e matriz de contingência de chuva;
4. validar os resultados manualmente em uma amostra;
5. armazenar métricas agregadas sem publicar;
6. só depois desenhar copy pública.

**Guardrail:** métrica não pode esconder ausência, mudança de estação, alteração de fonte observacional ou amostra insuficiente.

**Gatilho de retomada:** volume histórico suficiente para que as métricas deixem de ser anedóticas.

---

## 7. Meteostat para histórico, climatologia e descoberta de estações

**Origens:** `meteostat/meteostat` e `meteostat/weather-stations`  
**Prioridade estratégica:** MÉDIA  
**Prioridade de implementação agora:** BAIXA  
**Estado:** `registrada`  
**Decisão atual:** fonte complementar; não superar INMET nem observações locais oficiais na hierarquia do portal.

Meteostat é útil para pesquisa histórica e climatológica. A biblioteca documenta busca de estações próximas, acesso a séries históricas e interpolação. O repositório `weather-stations` mantém um diretório global aberto com localização, altitude, identificadores, região e timezone, além de dumps de inventário.

Usos possíveis:

- descoberta de estações próximas;
- comparação de inventários;
- cross-check de séries históricas;
- climatologia complementar;
- investigação de lacunas;
- apoio a pesquisas de eventos históricos.

Hierarquia recomendada:

```text
observação oficial/local validada
        ↓
INMET e demais fontes oficiais pertinentes
        ↓
Meteostat como apoio histórico/cross-check
```

Interpolação exige atenção especial. Um valor interpolado é **dado derivado**, não observação da estação. Se algum dia for armazenado, deve usar `data_class=derived` ou contrato equivalente, com método, estações de origem e parâmetros preservados em metadata.

O diretório de estações pode ser cruzado com o catálogo próprio do Tempo Pelotas, mas identificadores semelhantes não autorizam merge automático entre estações de redes diferentes.

Primeiro experimento seguro:

1. listar estações Meteostat próximas de Pelotas;
2. cruzar coordenadas e identificadores com INMET/ICAO/WMO quando disponíveis;
3. comparar uma pequena série histórica com a fonte oficial correspondente;
4. medir divergências;
5. decidir se existe valor adicional suficiente para ingestão.

**Guardrail:** nunca preencher automaticamente uma observação pública ausente com interpolação Meteostat sem rotulá-la como derivada e sem política explícita.

**Gatilho de retomada:** necessidade concreta de climatologia, descoberta de estações ou cross-check histórico não atendida pelas fontes prioritárias.

---

## 8. Relação entre as evoluções registradas

As descobertas não são quatro frentes isoladas. Elas formam camadas que podem amadurecer em sequência:

```text
ANA datasets + pyHidroWeb
        ↓
catálogo e histórico hidrológico próprio

observações + histórico de previsões
        ↓
nci/scores
        ↓
desempenho verificável por fonte e horizonte
        ↓
Herbie / modelos brutos em 2027
        ↓
comparação multimodelo + incerteza calibrada

Meteostat
        ↓
apoio histórico, climatologia e descoberta

Open-Meteo Flood
        ↓
previsão hidrológica modelada regional
```

Essa sequência evita implementar a camada sofisticada antes de existir histórico e observação capazes de avaliá-la.

---

## 9. Regra para as próximas descobertas

Novas ideias podem ser acrescentadas usando a estrutura:

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

A intenção é acumular boas descobertas sem transformar cada uma em uma nova frente imediata de desenvolvimento.

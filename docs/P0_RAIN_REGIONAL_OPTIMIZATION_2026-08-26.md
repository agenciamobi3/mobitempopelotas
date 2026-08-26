# P0 — chuva acumulada e otimização regional — 26/08/2026

Status: implementado em branch de validação antes do avanço para `/previsao-15-dias-pelotas`.

## 1. Chuva acumulada

A rota existente `/chuva-em-pelotas` foi enriquecida sem criar nova URL.

Semântica obrigatória:

- **chuva observada hoje**: acumulado diário publicado pela estação da Embrapa Clima Temperado;
- **chuva observada no mês**: acumulado mensal publicado pela mesma estação;
- **acumulado regional em 24 h**: leitura de cada estação da Rede de Monitoramento Hidrometeorológico da Defesa Civil RS;
- **volume previsto hoje**: previsão do modelo meteorológico para o dia;
- **total previsto em 7 dias**: soma dos volumes diários da janela de previsão existente.

Observação e previsão nunca são somadas como se fossem a mesma série. As janelas podem se sobrepor e os pontos de medição regionais não representam automaticamente toda Pelotas.

A consulta da Defesa Civil RS permanece fora do loader crítico da página de chuva. Ela é carregada como enriquecimento progressivo no cliente, preservando a primeira renderização mesmo quando a fonte regional estiver lenta ou indisponível.

A rota `/alertas` passou a explicar explicitamente que aviso oficial não é medição de acumulado e direciona para a página de chuva quando a intenção do visitante é saber quanto já choveu.

## 2. Páginas regionais existentes

Nenhuma cidade, URL ou rota indexável nova foi criada nesta rodada.

As páginas municipais existentes passam a usar a intenção direta:

- H1: `Tempo em {cidade} hoje`;
- título: `Tempo em {cidade} hoje: previsão, chuva e vento`;
- descrição: previsão para as próximas horas e 7 dias, temperatura, chuva, vento e avisos do INMET.

A camada técnica continua a mesma: previsão por coordenadas reais via Open-Meteo, avisos municipais do INMET por código IBGE, canonical da própria cidade e geometadados da cidade solicitada.

Receberam contexto editorial próprio nesta primeira priorização:

- Rio Grande;
- Canguçu;
- Dom Pedrito;
- Jaguarão;
- Capão do Leão.

O texto específico reutiliza apenas características já cadastradas no inventário regional e explica como usar chuva, temperatura, vento, rajadas e avisos sem criar afirmações meteorológicas locais não sustentadas pelos dados.

## 3. Contratos preservados

- Pelotas continua consolidada na Home e `/tempo-em/pelotas-rs` permanece redirecionada;
- o inventário regional continua com as mesmas 24 cidades aprovadas, sendo Pelotas + 23 páginas municipais;
- `HomeForecastStory`, `WeatherSplitHero`, alertas e capítulos compartilhados continuam reutilizados;
- nenhuma alteração foi feita em `src/routeTree.gen.ts`;
- nenhuma nova fonte, migration, secret ou variável de ambiente foi criada.

## 4. Próximo gate

A próxima funcionalidade nova permanece `/previsao-15-dias-pelotas`.

Ela só deve iniciar após a validação executável deste P0. O gate desejado continua:

1. contratos rápidos;
2. build de produção;
3. contrato das rotas públicas;
4. typecheck;
5. lint incremental.

Se o GitHub Actions continuar encerrando jobs antes de executar os steps, registrar a limitação como infraestrutura externa e não interpretar a ausência de execução como build verde.

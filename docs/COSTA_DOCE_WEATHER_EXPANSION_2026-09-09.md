# Expansão meteorológica da Costa Doce — 09/09/2026

## Objetivo

Fechar a cobertura meteorológica das 25 cidades adotadas pelo Tempo Pelotas para o recorte Costa Doce do Rio Grande do Sul, preservando a separação entre previsão meteorológica, observação e hidrologia.

## Recorte Costa Doce

O inventário regional considera:

Arambaré, Arroio do Padre, Arroio Grande, Barra do Ribeiro, Camaquã, Canguçu, Cerro Grande do Sul, Chuí, Cristal, Dom Feliciano, Guaíba, Jaguarão, Mariana Pimentel, Morro Redondo, Mostardas, Pelotas, Piratini, Rio Grande, Santa Vitória do Palmar, São José do Norte, São Lourenço do Sul, Sertão Santana, Tapes, Tavares e Turuçu.

## Cobertura hidrológica integrada da Lagoa dos Patos

Dentro desse recorte, cinco cidades possuem hoje uma leitura de nível integrada ao Tempo Pelotas:

- Arambaré
- Pelotas, pela Estação Laranjal
- Rio Grande
- São José do Norte
- São Lourenço do Sul

A estação de Itapuã/Viamão continua fazendo parte da rede regional da Lagoa, mas Viamão não integra este recorte de 25 municípios.

## Expansão meteorológica concluída

As 11 cidades que faltavam no módulo regional foram cadastradas, validadas e promovidas para `coverage: complete`:

- Arambaré — `arambare-rs`
- Barra do Ribeiro — `barra-do-ribeiro-rs`
- Camaquã — `camaqua-rs`
- Cerro Grande do Sul — `cerro-grande-do-sul-rs`
- Dom Feliciano — `dom-feliciano-rs`
- Guaíba — `guaiba-rs`
- Mariana Pimentel — `mariana-pimentel-rs`
- Mostardas — `mostardas-rs`
- Sertão Santana — `sertao-santana-rs`
- Tapes — `tapes-rs`
- Tavares — `tavares-rs`

Com a promoção, o inventário regional passa a ter 35 cidades públicas e 35 cidades elegíveis à indexação. As 25 cidades do recorte Costa Doce agora possuem destino meteorológico no portal.

## Evidências do gate

O gate final ficou registrado em `src/lib/regional-city-readiness-costa-doce.ts`.

Para as 11 cidades novas foram validados:

- código municipal no IBGE;
- coordenadas municipais cadastradas no registry;
- resposta meteorológica utilizável no runtime de produção;
- consulta de avisos municipais do INMET pelo código IBGE;
- perfil editorial local próprio;
- SEO e metadados pela rota regional compartilhada;
- contrato visual regional orientado por dados, sem exigir fotografia municipal específica;
- contexto hidrológico revisado sem afirmar medição de nível onde ela não existe;
- navegação regional e páginas próximas calculadas pelas coordenadas do município;
- contingência da visão regional por snapshot/Edge Function.

Em 09/09/2026, após a implantação da versão 2 da Edge Function `regional-weather-overview`, o runtime gerou snapshot `live` com 35/35 cidades públicas. As 11 novas cidades da Costa Doce retornaram dados meteorológicos utilizáveis.

Os códigos IBGE das 11 cidades foram conferidos no portal Cidades e Estados do IBGE em 09/09/2026. Para Cerro Grande do Sul e Dom Feliciano, as referências à bacia do rio Camaquã foram confrontadas com a listagem pública da SEMA/FEPAM, evitando associação hidrológica inventada.

## Semântica hidrológica

`hydrologyEvidenceValidated` não significa que a cidade possua uma estação de nível integrada.

Neste gate, significa que qualquer menção a Lagoa, Guaíba, rio Camaquã ou contexto costeiro foi revisada e permanece semanticamente separada de uma medição hidrológica.

A regra continua:

- previsão de chuva não é nível de rio ou lagoa;
- vento previsto não é observação de estação;
- uma cidade sem nível integrado não recebe valor estimado a partir de outra estação;
- referências verticais diferentes não são convertidas automaticamente.

## Arambaré

Arambaré possui associação bidirecional entre a página meteorológica e a página local de nível da Lagoa. A medição hidrológica e a previsão meteorológica continuam produtos semanticamente separados.

## Contingência do resumo regional

A Edge Function regional rejeita snapshots persistidos cujo número ou ordem de cidades não corresponda ao inventário atual. Isso impede que o portal devolva silenciosamente um snapshot antigo de 24 cidades após a expansão para 35.

## Estado final desta etapa

- Costa Doce definida no portal: 25 cidades;
- cidades da Costa Doce com página meteorológica: 25/25;
- cidades da Costa Doce com nível da Lagoa integrado: 5/25;
- inventário meteorológico regional total: 35 cidades;
- cidades públicas: 35;
- cidades indexáveis: 35;
- novas páginas ainda em `basic`: 0.

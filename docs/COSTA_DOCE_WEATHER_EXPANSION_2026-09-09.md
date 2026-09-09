# Expansão meteorológica da Costa Doce — 09/09/2026

## Objetivo

Fechar a cobertura meteorológica das 25 cidades adotadas pelo Tempo Pelotas para o recorte Costa Doce do Rio Grande do Sul, sem antecipar indexação de páginas que ainda não passaram pelo gate completo do projeto.

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

## Novas páginas meteorológicas

Foram cadastradas como `coverage: basic` e `indexable: false`:

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

O estado `basic` permite que a rota exista e seja testada, mas mantém `noindex, follow` e impede entrada no sitemap enquanto o gate completo não for concluído.

## Gate já atendido nesta etapa

Para as 11 cidades novas:

- código IBGE cadastrado e validado;
- coordenadas municipais cadastradas e validadas;
- consulta meteorológica por coordenadas integrada ao mesmo contrato regional;
- consulta municipal de avisos do INMET preparada pelo código IBGE;
- perfil editorial local próprio, sem reaproveitar texto genérico;
- integração ao resumo regional em lote;
- páginas mantidas fora da indexação.

Em 09/09/2026, após a implantação da versão 2 da Edge Function `regional-weather-overview`, o runtime gerou snapshot `live` com 35/35 cidades públicas e as 11 novas cidades da Costa Doce retornaram dados meteorológicos utilizáveis.

## Gate ainda necessário para `complete`

A promoção de cada cidade para `coverage: complete` deve continuar individual e explícita. Antes de indexar, revisar pelo menos:

- contexto e evidência hidrológica realmente aplicáveis à cidade, sem criar associação artificial com a Lagoa;
- revisão editorial final e intenção de busca local;
- SEO final;
- imagem/identidade visual quando exigida pelo contrato editorial;
- navegação e referências regionais;
- comportamento da página com forecast ou INMET indisponível.

Não promover em lote apenas porque a previsão numérica está funcionando.

## Contingência do resumo regional

A Edge Function regional passou a rejeitar snapshots persistidos cujo número ou ordem de cidades não corresponda ao inventário atual. Isso evita devolver silenciosamente o antigo snapshot de 24 cidades depois da expansão para 35 cidades públicas.

## Arambaré

Arambaré agora possui associação bidirecional entre a página meteorológica e a página local de nível da Lagoa. A medição hidrológica e a previsão meteorológica continuam produtos semanticamente separados.

# Auditoria de radar, satélite e STSC — 08/09/2026

## Escopo

Auditoria da rota pública `/radar-e-satelite-pelotas` e das integrações que a alimentam, cobrindo coleta server-side, parsing, segurança do proxy de imagens, contingência, timestamps, recuperação pós-hidratação, renderização e estados sem dado.

A auditoria diferencia quatro situações: produto oficial existente, integração do Tempo Pelotas capaz de consultá-lo, coleta realmente recebida nesta atualização e informação exibida ao visitante. Uma falha na integração não é convertida em afirmação de indisponibilidade global da instituição.

## Contratos confirmados

### Radar REDEMET

- credencial permanece server-only em `REDEMET_API_KEY`;
- autenticação do produto de radar segue o contrato observado nos HARs por `api_key` na requisição server-side;
- a seleção da estação ocorre sobre a resposta oficial, sem rotular Santiago como Canguçu;
- Santiago (`sg`) permanece candidato operacional principal e Canguçu (`cn`) alternativa quando houver imagem útil;
- produtos são tentados em ordem, começando por `maxcappi`;
- um quadro só é aceito para a página de Pelotas quando seus bounds realmente contêm as coordenadas de Pelotas;
- o PNG oficial é entregue pelo proxy sanitizado e georreferenciado sobre MapLibre usando os bounds do próprio quadro;
- se o mapa/base falhar, a imagem oficial bruta permanece como fallback.

### Satélite REDEMET

O backend mantém três produtos com semântica própria:

- `realcada` — infravermelho realçado;
- `ir` — infravermelho;
- `vis` — visível.

`realcada` e `ir` podem receber GOES/INMET como contingência oficial quando a REDEMET não entrega camada utilizável. `vis` nunca recebe fallback infravermelho. A rota pública `/api/redemet/satellite` preserva essa distinção.

A composição principal da página dedicada continua usando `realcada`. IR e Visível permanecem capacidades do endpoint e não são, neste checkpoint, um seletor da interface dedicada.

### Satélite INMET

O adaptador atual usa GOES / Região Sul / produto `IV` e permanece separado da REDEMET. A integração:

- reproduz o contexto HTTP necessário ao portal público;
- em HTTP 403 faz somente a contingência controlada definida no adapter;
- não interpreta 403 como prova de indisponibilidade pública do INMET;
- aceita imagem direta ou resposta JSON/base64;
- o proxy valida host, tamanho e assinatura binária antes de entregar a imagem ao navegador.

O INMET documenta publicamente produtos de infravermelho termal, vapor d'água, visível e topo de nuvens, com atualização do serviço informada como diária a cada 15 minutos. O Tempo Pelotas só publica códigos de produto que foram tecnicamente validados; não inventa códigos para produtos adicionais.

### STSC / atividade elétrica

- a janela de animação é solicitada upstream com `anima`;
- a composição dedicada pede seis quadros, enquanto o endpoint público aceita até doze;
- timestamps sem zona no contrato STSC são tratados como UTC antes da apresentação em `America/Sao_Paulo`;
- pontos são filtrados para o recorte regional de até 450 km de Pelotas;
- um quadro válido com zero pontos continua sendo uma observação válida de zero ocorrências naquele quadro;
- zero ocorrências não é aviso de segurança nem substitui alertas oficiais.

## Correções aplicadas nesta auditoria

### 1. Contingência INMET não pode aparecer duas vezes

`getRedemetOverview()` mantém `satellite` como a camada selecionada e `inmetSatellite` como coleta independente. Quando a REDEMET falhava e o INMET assumia a contingência, `satellite` já passava a representar a própria camada INMET, enquanto a interface ainda renderizava `inmetSatellite` novamente.

A interface agora detecta `data.satellite.provider === "INMET"` e:

- identifica a camada selecionada como `Satélite INMET · contingência`;
- não cria uma segunda linha/painel com a mesma coleta;
- não infla a contagem de fontes/conjuntos disponíveis;
- mantém origem, produto, horário e link oficial do provedor realmente usado.

O histórico derivado segue a mesma regra.

### 2. Ausência de quadro STSC não é zero raios

A leitura derivada de distância usava lista vazia tanto para “quadro válido sem pontos” quanto para “nenhum quadro com horário utilizável”. Isso podia apresentar zero nas três faixas mesmo sem coleta.

Agora existem dois estados distintos:

- quadro válido + zero pontos: `Nenhum raio detectado na última coleta recebida`, com contagens 0;
- sem quadro utilizável: `Sem coleta STSC com horário utilizável`, com contagens `—` e explicação explícita de que isso não equivale a zero raios.

### 3. Recuperação do navegador inclui o satélite INMET

A rota abre com teto SSR curto de 2,8 s. Antes, a recuperação pós-hidratação era dispensada quando radar, satélite selecionado e STSC já haviam chegado, mesmo que o painel INMET independente tivesse ficado vazio no SSR.

A completude agora exige as quatro coleções que podem aparecer ao visitante: radar, satélite selecionado, satélite INMET e STSC. A recuperação continua ocorrendo uma única vez e nunca apaga um quadro já recebido com uma tentativa posterior vazia.

### 4. Budget interno do radar alinhado ao pipeline

O adapter de radar abortava sozinho em 2,4 s, embora:

- o overview dê até 4,5 s para cada camada;
- o probe independente de status dê até 5 s;
- o SSR da página tenha teto próprio de 2,8 s e recuperação posterior.

Esse desalinhamento impedia o radar de usar boa parte do orçamento já reservado para recuperação/monitoramento. O budget interno foi ajustado para 4,2 s, ainda abaixo dos tetos de 4,5 s e 5 s. O SSR inicial continua limitado a 2,8 s; portanto a navegação inicial não ficou mais lenta por causa dessa alteração.

## Evidência operacional observada antes das correções

A versão pública de `/status-dos-dados` consultada em 08/09/2026 registrava, na verificação das 03:32:

- radar REDEMET sem dado utilizável naquela verificação e vários incidentes curtos de restauração/falha;
- satélite REDEMET operacional;
- STSC operacional;
- satélite INMET complementar sem dado utilizável pela integração.

Na janela publicada de até sete dias, o monitor mostrava aproximadamente 49% para radar REDEMET, 98,1% para satélite REDEMET e 98,6% para STSC. Esses números descrevem o comportamento da integração do Tempo Pelotas e não provam disponibilidade global das plataformas oficiais.

O baixo índice do radar, combinado ao antigo timeout interno de 2,4 s e aos incidentes curtos, justificou alinhar o budget. Isso não prova que todos os eventos históricos tenham sido causados por timeout; respostas sem produto, latência upstream e outras falhas transitórias continuam possíveis.

O satélite INMET complementar aparecia sem coleta utilizável. O código permanece fail-closed: enquanto a integração não entregar imagem válida, a página não fabrica quadro, horário ou substitui silenciosamente o produto por outra fonte.

## Segurança revisada

`/api/redemet/image` continua exigindo:

- URL REDEMET em host allowlisted ou tokens INMET válidos;
- HTTPS;
- revalidação do host após redirect;
- tipo de imagem permitido;
- tamanho máximo de 12 MB;
- detecção da assinatura binária para payload base64 do INMET;
- `nosniff` e `noindex`.

A chave REDEMET não é retornada ao browser.

## Recursos de interface confirmados

- imagem de radar georreferenciada e fallback bruto;
- marcador de Pelotas;
- horário real do quadro e estado de frescor;
- anterior/próxima coleta;
- slider da sequência;
- reproduzir/pausar;
- voltar ao quadro mais recente;
- abrir imagem oficial pelo proxy;
- satélite REDEMET/contingência e INMET com fonte explícita;
- STSC com sequência temporal e contagem de pontos;
- distâncias STSC derivadas somente quando existe quadro válido;
- comparação radar × previsão em bloco separado, sem dizer que os números foram medidos pelo radar;
- estados vazios sem preenchimento manual;
- recuperação pós-hidratação após o budget curto do SSR.

## Capacidade existente ainda não promovida a controle da página

O endpoint de satélite já suporta Realçado, Infravermelho e Visível, incluindo a regra de luz solar do canal Visível. A página dedicada, porém, usa Realçado como camada REDEMET principal e não oferece seletor entre os três produtos.

Isso não é erro de coleta da camada atual. É uma capacidade técnica existente que pode ser promovida em uma próxima evolução da interface, desde que o seletor preserve produto, fonte, horário, estado noturno do Visível e contingência sem duplicação.

## Contratos

A auditoria é protegida por `tests/redemet-data-display-audit.test.ts`, além dos contratos já existentes de performance, resiliência, timezone, mapa, daylight e visual da página dedicada.

Não declarar validação de build/testes pelo GitHub Actions enquanto os jobs continuarem terminando antes de executar steps.

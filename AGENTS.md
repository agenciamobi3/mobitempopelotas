<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Fonte de verdade do projeto

Antes de alterações amplas, leia `PROJECT_CURRENT_STATE.md`. Ele é o inventário mestre do estado atual do Tempo Pelotas.

`docs/PORTAL_EVOLUTIONS.md` é o arquivo mestre das evoluções futuras, descobertas estratégicas e oportunidades ainda não incorporadas ao runtime. Registrar uma ideia ali não a transforma em pendência operacional nem autoriza implementação imediata.

`MIGRATION_MATRIX.md` continua sendo a matriz histórica de migração/paridade; não deve ser usado isoladamente para responder o que existe hoje no produto.

Atualize `PROJECT_CURRENT_STATE.md` no mesmo conjunto de mudanças sempre que houver alteração estrutural em páginas públicas, cidades atendidas, funcionalidades ativas/suspensas, fontes de dados, integrações, APIs, crons/workflows, banco/auth, SEO/indexação, variáveis de ambiente estruturais, deploy/runtime ou pendências relevantes.

Documentos especializados em `docs/` continuam sendo a fonte detalhada de cada subsistema. Quando houver divergência entre documentação e código ativo, reconcilie a documentação na mesma mudança.

Nunca versione HARs brutos, cookies, tokens, chaves, secrets, headers autenticados ou URLs contendo credenciais. Use apenas conclusões técnicas sanitizadas em documentos do repositório.

## Copy pública e voz editorial

O Tempo Pelotas é um projeto da MOBI feito dentro da comunidade e para uso da comunidade. A voz pública não deve soar como governo, força de segurança, autoridade distante ou instituição que fala de fora para "a população".

### Regra de clareza

- escreva para que um leitor com autonomia de leitura equivalente à 6ª série consiga entender o assunto sozinho;
- isso não significa infantilizar o texto: mantenha tom adulto, natural, direto e respeitoso;
- prefira frases curtas, palavras comuns e uma ideia principal por frase;
- antes de criar uma explicação, glossário, card, aviso ou nota, tente reescrever a frase original de forma mais simples;
- não explique palavras e conceitos que o contexto já torna compreensíveis;
- evite analogias infantis, tom de cartilha e excesso de didatismo.

### Regra contra poluição editorial

- não use etiquetas genéricas apenas para preencher hierarquia visual, como "Arquivo aberto à comunidade", "Memória pública com rastreabilidade" ou equivalentes sem informação concreta;
- títulos, subtítulos, badges e chamadas devem dizer algo útil sobre o conteúdo, o período, o lugar, a fonte ou a ação disponível;
- não empilhe uma camada "para leigos" sobre um texto que continua técnico: simplifique o próprio texto principal;
- uma explicação não deve exigir outra explicação para ser entendida;
- ícones e pequenos elementos visuais devem ajudar a identificar tipos de informação, etapas ou ações reais; não espalhe ícones apenas como decoração nem repita o mesmo sinal onde o texto já separa bem o conteúdo.

### Termos técnicos e precisão

- use termo técnico somente quando ele for necessário para manter precisão factual;
- quando necessário, apresente o termo no contexto, com a menor explicação suficiente para a leitura seguir;
- preserve datas, locais, fontes, medições, incertezas e diferenças entre estações, réguas ou referências;
- nunca simplifique uma informação a ponto de criar uma conclusão falsa. Exemplo: uma leitura de 2,88 m em uma régua do Canal São Gonçalo não significa 2,88 m de água em toda Pelotas;
- detalhes de método e rastreabilidade podem vir depois do fato principal. O visitante não deve precisar entender a metodologia para entender o que aconteceu.

### Ordem recomendada para páginas históricas

1. o que aconteceu;
2. onde e por quanto tempo, quando isso estiver documentado;
3. os números que ajudam a entender o evento;
4. como esses números ou fatos foram confirmados;
5. fontes, método e limites da documentação.

### Voz de comunidade

- fale na primeira pessoa do projeto apenas quando isso ajudar a explicar uma decisão editorial;
- em pedidos de colaboração, prefira chamadas concretas como "Tem fotos ou documentos desta enchente?" em vez de tratar "a comunidade" como um grupo externo;
- a MOBI e o Tempo Pelotas fazem parte da comunidade local. A copy deve refletir proximidade, serviço e responsabilidade, não autoridade institucional.

## Redes sociais

As regras de social media ficam separadas da documentação geral do agente.

Quando a tarefa envolver **criação de arte para redes sociais**, leia obrigatoriamente:

1. `docs/social/README.md` — índice e ordem de leitura;
2. `docs/social/ART_GUIDE.md` — fonte de verdade visual específica do Tempo Pelotas;
3. `docs/social/EDITORIAL_GUIDE.md` — seleção de pauta e validação factual, quando houver conteúdo atual;
4. `docs/social/tempo-pelotas-ideias-posts.csv` — banco editorial de 350 ideias, quando a tarefa envolver escolha de assunto.

`docs/social/ART_SYSTEM_TEMPLATE.md` é o **modelo reutilizável para implantação desse sistema em outros projetos da MOBI**. Ele não substitui `ART_GUIDE.md` e não deve ser tratado como identidade visual do Tempo Pelotas.

### Regras rápidas que nunca podem ser ignoradas

- logotipo oficial de artes: `https://tempopelotas.com.br/brand/tempo-pelotas-purple.svg`;
- não redesenhar ou deformar o logotipo por IA;
- feed principal: `4:5`, preferencialmente `1080 × 1350 px`;
- domínio/CTA institucional: `tempopelotas.com.br`;
- não inventar previsão, medição, alerta, nível, radar, timestamp ou qualquer dado factual;
- radar, satélite, mapas, gráficos, hidrologia e câmeras devem usar material real quando representarem dados do produto;
- separar sempre previsão, observação, monitoramento e alerta oficial;
- antes de publicar informação atual, validar as fontes vigentes do produto.

O `AGENTS.md` deve permanecer como índice operacional. Não duplicar aqui o manual completo de identidade, composição visual ou planejamento editorial; atualizar os arquivos de `docs/social/` correspondentes.

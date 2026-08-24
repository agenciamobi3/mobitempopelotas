export function TempoPelotasAboutPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <section>
        <h1 className="text-3xl font-bold">Tempo Pelotas</h1>
        <p className="mt-4 text-lg">
          Uma plataforma de disseminação de informações meteorológicas,
          ambientais e hidrológicas para Pelotas e região.
        </p>
        <p className="mt-3">
          O projeto busca aproximar dados técnicos da comunidade, organizando
          informações importantes sobre o tempo, clima, água e eventos extremos
          em uma experiência digital simples e acessível.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Informação para a comunidade</h2>
        <p className="mt-3">
          O portal organiza dados meteorológicos, previsões, alertas,
          monitoramento regional, conteúdos educativos e informações históricas
          em um ambiente digital acessível.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Tecnologia desenvolvida pela MOBI</h2>
        <p className="mt-3">
          O Tempo Pelotas é um projeto tecnológico desenvolvido pela MOBI -
          Marketing Inteligente, utilizando integração de APIs, processamento de
          dados e interfaces digitais para aproximar informações técnicas da
          população.
        </p>
        <p className="mt-3">
          A plataforma permite criar painéis, páginas municipais, visualizações
          regionais e novas camadas de informação conforme a evolução do projeto.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Como os dados chegam até você</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div>
            <h3 className="font-semibold">Fontes oficiais</h3>
            <p className="mt-2">
              Dados provenientes de sistemas públicos e redes de monitoramento.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Integração tecnológica</h3>
            <p className="mt-2">
              APIs e processos automatizados organizam diferentes informações.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Processamento</h3>
            <p className="mt-2">
              Dados são estruturados para facilitar interpretação e consulta.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Informação acessível</h3>
            <p className="mt-2">
              Usuários encontram dados meteorológicos e ambientais em um único local.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Fontes de dados</h2>
        <p className="mt-3">
          A plataforma utiliza informações disponibilizadas por sistemas e
          instituições de monitoramento meteorológico, ambiental e hidrológico.
          Entre as referências estão:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>Instituto Nacional de Meteorologia (INMET).</li>
          <li>Embrapa Clima Temperado.</li>
          <li>UFPEL e centros de pesquisa meteorológica.</li>
          <li>Sistemas públicos de monitoramento e alertas.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">O que você encontra</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>Painel meteorológico e previsão do tempo.</li>
          <li>Informações regionais e páginas municipais.</li>
          <li>Monitoramento hidrológico e conteúdos educativos.</li>
          <li>Históricos de eventos climáticos importantes.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Transparência</h2>
        <p className="mt-3">
          O Tempo Pelotas atua como plataforma de organização e disseminação de
          informações. A tecnologia desenvolvida pela MOBI facilita o acesso aos
          dados, mas os registros meteorológicos e alertas permanecem vinculados
          às fontes responsáveis.
        </p>
        <p className="mt-3">
          Alertas oficiais e orientações de emergência devem sempre ser
          acompanhados junto aos órgãos públicos responsáveis.
        </p>
      </section>
    </main>
  );
}

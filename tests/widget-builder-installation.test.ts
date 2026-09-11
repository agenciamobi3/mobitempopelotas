import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const builder = readFileSync("src/components/widgets/WidgetBuilder.tsx", "utf8");
const guide = readFileSync("src/components/widgets/WidgetInstallGuide.tsx", "utf8");
const guideCss = readFileSync("src/components/widgets/WidgetInstallGuide.css", "utf8");

test("guia oferece instalação contextual sem gerar outro snippet", () => {
  assert.match(guide, /WordPress \/ Elementor/);
  assert.match(guide, /HTML comum/);
  assert.match(guide, /Outros construtores/);
  assert.match(guide, /embedCode: string/);
  assert.match(guide, /\{embedCode\}/);
  assert.match(guide, /onCopy/);
  assert.doesNotMatch(guide, /document\.createElement|dangerouslySetInnerHTML|innerHTML|srcDoc/);
});

test("WordPress e Elementor recebem instruções simples no ponto correto da página", () => {
  assert.match(guide, /arraste o widget HTML/);
  assert.match(guide, /bloco HTML personalizado/);
  assert.match(guide, /sem separar a tag <script>/);
  assert.match(guide, /sem colar em um bloco de texto comum/);
});

test("HTML comum e construtores evitam locais que quebrariam a incorporação", () => {
  assert.match(guide, /Não coloque o código em um arquivo CSS nem no <head>/);
  assert.match(guide, /HTML, Embed, Código, Custom HTML/);
  assert.match(guide, /Evite campos de texto rico, CSS personalizado ou cabeçalho global/);
  assert.match(guide, /Se a plataforma bloquear scripts/);
});

test("recomendação de espaço acompanha a apresentação escolhida", () => {
  assert.match(guide, /presentation === "compact"/);
  assert.match(guide, /320–420 px/);
  assert.match(guide, /presentation === "horizontal"/);
  assert.match(guide, /680 px ou mais/);
  assert.match(guide, /480–760 px/);
  assert.match(guide, /Em telas menores ele volta para uma coluna/);
});

test("builder substitui o copiar isolado pelo guia e abre o recém-criado", () => {
  assert.match(builder, /import \{ WidgetInstallGuide \}/);
  assert.match(builder, /const \[latestCreatedId, setLatestCreatedId\] = useState<string \| null>\(null\)/);
  assert.match(builder, /setLatestCreatedId\(result\.widget\.id\)/);
  assert.match(builder, /<WidgetInstallGuide/);
  assert.match(builder, /embedCode=\{widget\.embedCode\}/);
  assert.match(builder, /presentation=\{widget\.content\.presentation\}/);
  assert.match(builder, /copied=\{copiedId === widget\.id\}/);
  assert.match(builder, /onCopy=\{\(\) => copyEmbed\(widget\)\}/);
  assert.match(builder, /defaultOpen=\{latestCreatedId === widget\.id\}/);
  assert.doesNotMatch(builder, /<code className="widget-builder-code">\{widget\.embedCode\}<\/code>[\s\S]*copiedId === widget\.id \? "Copiado"/);
});

test("guia usa disclosure, botões pressionáveis e estado de abertura controlado", () => {
  assert.match(guide, /<details/);
  assert.match(guide, /open=\{open\}/);
  assert.match(guide, /onToggle=\{\(event\) => setOpen\(event\.currentTarget\.open\)\}/);
  assert.match(guide, /role="group"/);
  assert.match(guide, /aria-label="Escolher ambiente de instalação"/);
  assert.match(guide, /aria-pressed=\{item\.key === target\}/);
  assert.match(guide, /aria-live="polite"/);
});

test("layout da instalação permanece legível em mobile e alto contraste", () => {
  assert.match(guideCss, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(guideCss, /@media \(max-width: 680px\)/);
  assert.match(guideCss, /grid-template-columns:\s*1fr/);
  assert.match(guideCss, /focus-visible/);
  assert.match(guideCss, /prefers-reduced-motion: reduce/);
  assert.match(guideCss, /forced-colors: active/);
});

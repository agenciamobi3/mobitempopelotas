import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const collaboration = readFileSync(
  "src/components/history/HistoricalCollaborationContainer.css",
  "utf8",
);
const collaborationSource = readFileSync(
  "src/components/history/HistoricalCollaboration.tsx",
  "utf8",
);
const footerViewport = readFileSync(
  "src/production/components/site-footer-viewport.css",
  "utf8",
);
const footerWrapper = readFileSync(
  "src/production/components/site-footer.tsx",
  "utf8",
);
const headerViewport = readFileSync(
  "src/production/components/home-editorial-header-viewport.css",
  "utf8",
);
const headerWrapper = readFileSync(
  "src/production/components/site-header.tsx",
  "utf8",
);

test("historical collaboration follows the canonical public container", () => {
  assert.match(collaborationSource, /HistoricalCollaborationContainer\.css/);
  assert.match(collaboration, /--tp-home-container-max,\s*1440px/);
  assert.match(collaboration, /--tp-home-container-gutter,\s*48px/);
  assert.match(collaboration, /--tp-home-container-compact-max,\s*1180px/);
  assert.match(collaboration, /--tp-home-container-compact-gutter,\s*32px/);
  assert.match(collaboration, /--tp-home-container-mobile-gutter,\s*20px/);
  assert.doesNotMatch(collaboration, /width:\s*min\(1180px/);
});

test("footer backgrounds are full bleed while content stays on the canonical grid", () => {
  assert.match(footerWrapper, /site-footer-viewport\.css/);
  assert.match(footerViewport, /\.tp-public-service-strip,[\s\S]*\.tp-home-footer-shell/);
  assert.match(footerViewport, /width:\s*100vw/);
  assert.match(footerViewport, /margin-left:\s*-50vw/);
  assert.match(footerViewport, /--tp-home-container-max,\s*1440px/);
  assert.match(footerViewport, /--tp-home-container-gutter,\s*48px/);
  assert.match(footerViewport, /--tp-home-container-compact-max,\s*1180px/);
  assert.match(footerViewport, /--tp-home-container-mobile-gutter,\s*20px/);
  assert.doesNotMatch(footerViewport, /!important/);
});

test("sticky public header fills the viewport while its inner grid remains canonical", () => {
  assert.match(headerWrapper, /home-editorial-header-viewport\.css/);
  assert.match(headerViewport, /\.tp-home-header\s*\{/);
  assert.match(headerViewport, /width:\s*100vw/);
  assert.match(headerViewport, /margin-left:\s*calc\(50%\s*-\s*50vw\)/);
  assert.match(headerViewport, /margin-right:\s*calc\(50%\s*-\s*50vw\)/);
  assert.doesNotMatch(headerViewport, /!important/);
});

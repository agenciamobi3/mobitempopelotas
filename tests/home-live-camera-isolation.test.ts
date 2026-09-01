import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const liveBackground = readFileSync(
  "src/production/components/home-live-camera-background.tsx",
  "utf8",
);

test("live camera player is isolated from weather hero rerenders", () => {
  assert.match(liveBackground, /import \{ memo, useEffect, useMemo, useState \} from "react"/);
  assert.match(liveBackground, /export const HomeLiveCameraBackground = memo\(/);
  assert.match(
    liveBackground,
    /\(previous, next\) => previous\.embedUrl === next\.embedUrl/,
  );
  assert.match(liveBackground, /\[embedUrl\]/);
  assert.match(liveBackground, /key=\{`\$\{embedUrl\}-\$\{attempt\}`\}/);
  assert.doesNotMatch(liveBackground, /weather|temperature|pressure|humidity|alert/i);
});

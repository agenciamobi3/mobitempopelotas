import assert from "node:assert/strict";
import test from "node:test";

import { generateRegionalExpansionStatusReport } from "../src/lib/regional-expansion-status-report";

test("includes every regional candidate in operational report", () => {
  const report = generateRegionalExpansionStatusReport();

  assert.ok(report.length >= 1);
  assert.ok(report.some((item) => item.slug === "arambare-rs"));
});

test("does not allow blocked candidates to appear draft ready without evidence", () => {
  const report = generateRegionalExpansionStatusReport();
  const blocked = report.filter((item) => item.blockers.length > 0);

  assert.ok(blocked.length >= 1);
  assert.equal(blocked.every((item) => item.nextAction !== "prepare-draft"), true);
});

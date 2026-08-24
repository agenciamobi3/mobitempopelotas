import test from "node:test";
import assert from "node:assert/strict";
import { generateRegionalCandidateReadinessReport } from "../src/lib/regional-candidate-readiness-report";

 test("report includes every regional candidate", () => {
  const report = generateRegionalCandidateReadinessReport();

  assert.equal(report.length, 5);
  assert.ok(report.some((item) => item.slug === "arambare-rs"));
});

test("report preserves blocking reasons", () => {
  const report = generateRegionalCandidateReadinessReport();
  const guaiba = report.find((item) => item.slug === "guaiba-rs");

  assert.ok(guaiba);
  assert.ok(guaiba.missing.includes("hydrology-evidence"));
});

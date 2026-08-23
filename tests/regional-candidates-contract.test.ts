import assert from "node:assert/strict";
import test from "node:test";

import {
  REGIONAL_CANDIDATES,
  isRegionalCandidateApproved,
  type RegionalCandidate,
} from "../src/lib/regional-candidates.ts";
import {
  INDEXABLE_REGIONAL_CITIES,
  PUBLIC_REGIONAL_CITIES,
  REGIONAL_CITIES,
} from "../src/lib/regional-cities.ts";

function candidate(overrides: Partial<RegionalCandidate> = {}): RegionalCandidate {
  return {
    slug: "cidade-candidata-rs",
    name: "Cidade Candidata",
    state: "RS",
    priority: "medium",
    reasons: ["regional_relevance"],
    status: "candidate",
    rationale: "Registro interno para teste do pipeline de expansão.",
    ...overrides,
  };
}

test("candidatos permanecem fora do inventário público e indexável", () => {
  const publicSlugs = new Set(PUBLIC_REGIONAL_CITIES.map((city) => city.slug));
  const indexableSlugs = new Set(INDEXABLE_REGIONAL_CITIES.map((city) => city.slug));

  for (const item of REGIONAL_CANDIDATES) {
    assert.equal(publicSlugs.has(item.slug), false);
    assert.equal(indexableSlugs.has(item.slug), false);
  }
});

test("inventário de candidatos não pode reutilizar slug de RegionalCity", () => {
  const citySlugs = new Set(REGIONAL_CITIES.map((city) => city.slug));

  for (const item of REGIONAL_CANDIDATES) {
    assert.equal(citySlugs.has(item.slug), false);
  }
});

test("inventário de candidatos não contém slugs duplicados", () => {
  const slugs = REGIONAL_CANDIDATES.map((item) => item.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test("aprovação é explícita e não acontece apenas por existir no cadastro", () => {
  assert.equal(isRegionalCandidateApproved(candidate()), false);
  assert.equal(
    isRegionalCandidateApproved(candidate({ status: "approved" })),
    true,
  );
});

test("código IBGE pode permanecer ausente até validação oficial", () => {
  const item = candidate();
  assert.equal(item.ibgeCode, undefined);
});

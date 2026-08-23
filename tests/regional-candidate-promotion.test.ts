import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateRegionalCandidateDraftPromotion,
  type RegionalCandidateDraftInput,
} from "../src/lib/regional-candidate-promotion.ts";
import {
  findRegionalCandidateValidation,
} from "../src/lib/regional-candidate-validation.ts";
import {
  REGIONAL_CANDIDATES,
  type RegionalCandidate,
} from "../src/lib/regional-candidates.ts";

const DRAFT_INPUT: RegionalCandidateDraftInput = {
  group: "Costa Doce",
  descriptor: "município em validação técnica para futura cobertura regional",
};

function candidateBySlug(slug: string) {
  const candidate = REGIONAL_CANDIDATES.find((item) => item.slug === slug);
  assert.ok(candidate);
  return candidate;
}

function approved(candidate: RegionalCandidate): RegionalCandidate {
  return { ...candidate, status: "approved" };
}

test("candidato ainda não aprovado não pode produzir draft", () => {
  const candidate = candidateBySlug("barra-do-ribeiro-rs");
  const result = evaluateRegionalCandidateDraftPromotion(candidate, DRAFT_INPUT);

  assert.equal(result.ready, false);
  assert.equal(result.draft, null);
  assert.ok(result.reasons.includes("not-approved"));
});

test("aprovação com coordenadas pendentes continua bloqueada", () => {
  const candidate = approved(candidateBySlug("guaiba-rs"));
  const result = evaluateRegionalCandidateDraftPromotion(candidate, DRAFT_INPUT);

  assert.equal(result.ready, false);
  assert.ok(result.reasons.includes("coordinates-not-validated"));
});

test("promoção válida produz somente um draft não indexável", () => {
  const candidate = approved(candidateBySlug("barra-do-ribeiro-rs"));
  const validation = findRegionalCandidateValidation(candidate.slug);
  assert.ok(validation);

  const result = evaluateRegionalCandidateDraftPromotion(
    candidate,
    DRAFT_INPUT,
    validation,
  );

  assert.equal(result.ready, true);
  if (!result.ready) return;

  assert.equal(result.draft.slug, candidate.slug);
  assert.equal(result.draft.ibgeCode, candidate.ibgeCode);
  assert.equal(result.draft.coverage, "draft");
  assert.equal(result.draft.indexable, false);
  assert.equal(result.draft.group, "Costa Doce");
  assert.equal(
    result.draft.latitude,
    validation.coordinatesValue?.latitude,
  );
  assert.equal(
    result.draft.longitude,
    validation.coordinatesValue?.longitude,
  );
});

test("descritor editorial precisa ser informado explicitamente", () => {
  const candidate = approved(candidateBySlug("tapes-rs"));
  const result = evaluateRegionalCandidateDraftPromotion(candidate, {
    group: "Costa Doce",
    descriptor: "   ",
  });

  assert.equal(result.ready, false);
  assert.ok(result.reasons.includes("descriptor-empty"));
});

test("rationale interna do candidato não é usada como descriptor público", () => {
  const candidate = approved(candidateBySlug("tapes-rs"));
  const result = evaluateRegionalCandidateDraftPromotion(candidate, DRAFT_INPUT);

  assert.equal(result.ready, true);
  if (!result.ready) return;

  assert.notEqual(result.draft.descriptor, candidate.rationale);
  assert.equal(result.draft.descriptor, DRAFT_INPUT.descriptor);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  REGIONAL_CANDIDATES,
  type RegionalCandidate,
} from "../src/lib/regional-candidates.ts";
import {
  REGIONAL_CANDIDATE_VALIDATIONS,
  findRegionalCandidateValidation,
  isRegionalCandidateIdentityValidated,
  isRegionalCandidateReadyForDraft,
  regionalCandidateValidationCoverage,
  type RegionalCandidateTechnicalValidation,
} from "../src/lib/regional-candidate-validation.ts";

function approvedCandidate(
  candidate: RegionalCandidate,
): RegionalCandidate {
  return { ...candidate, status: "approved" };
}

test("primeira onda possui evidência de validação para todos os candidatos", () => {
  const coverage = regionalCandidateValidationCoverage();
  assert.deepEqual(coverage.missingValidations, []);
  assert.deepEqual(coverage.orphanValidations, []);
});

test("códigos IBGE validados têm sete dígitos e são únicos", () => {
  const codes = REGIONAL_CANDIDATES.map((candidate) => candidate.ibgeCode);

  for (const code of codes) {
    assert.match(code ?? "", /^\d{7}$/);
  }

  assert.equal(new Set(codes).size, codes.length);
});

test("identidade municipal da primeira onda está validada", () => {
  for (const candidate of REGIONAL_CANDIDATES) {
    assert.equal(isRegionalCandidateIdentityValidated(candidate), true);
  }
});

test("nenhum candidato pode virar draft enquanto coordenadas estiverem pendentes", () => {
  for (const candidate of REGIONAL_CANDIDATES) {
    assert.equal(isRegionalCandidateReadyForDraft(approvedCandidate(candidate)), false);
  }
});

test("aprovação sozinha não contorna o gate técnico", () => {
  const candidate = approvedCandidate(REGIONAL_CANDIDATES[0]);
  const current = findRegionalCandidateValidation(candidate.slug);
  assert.ok(current);

  const validationWithoutCoordinates: RegionalCandidateTechnicalValidation = {
    ...current,
    coordinates: { status: "pending" },
  };

  assert.equal(
    isRegionalCandidateReadyForDraft(candidate, validationWithoutCoordinates),
    false,
  );
});

test("gate de draft exige aprovação, IBGE e coordenadas validadas", () => {
  const candidate = approvedCandidate(REGIONAL_CANDIDATES[0]);
  const current = findRegionalCandidateValidation(candidate.slug);
  assert.ok(current);

  const validated: RegionalCandidateTechnicalValidation = {
    ...current,
    coordinates: {
      status: "validated",
      checkedAt: "2026-08-23",
      source: "test-fixture",
    },
  };

  assert.equal(isRegionalCandidateReadyForDraft(candidate, validated), true);
});

test("registro de validações não possui slugs duplicados", () => {
  const slugs = REGIONAL_CANDIDATE_VALIDATIONS.map((validation) => validation.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

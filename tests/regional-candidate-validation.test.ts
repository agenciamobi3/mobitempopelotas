import assert from "node:assert/strict";
import test from "node:test";

import {
  REGIONAL_CANDIDATES,
  type RegionalCandidate,
} from "../src/lib/regional-candidates.ts";
import {
  REGIONAL_CANDIDATE_VALIDATIONS,
  findRegionalCandidateValidation,
  hasValidatedRegionalCandidateCoordinates,
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

test("coordenadas validadas sempre carregam valor, referência e datum", () => {
  const validated = REGIONAL_CANDIDATE_VALIDATIONS.filter(
    (validation) => validation.coordinates.status === "validated",
  );

  assert.ok(validated.length > 0);

  for (const validation of validated) {
    assert.equal(hasValidatedRegionalCandidateCoordinates(validation), true);
    assert.ok(validation.coordinates.source);
    assert.ok(validation.coordinates.checkedAt);
    assert.equal(validation.coordinatesValue?.reference, "city-seat");
    assert.equal(validation.coordinatesValue?.datum, "SIRGAS 2000");
  }
});

test("status validated sem valor de coordenada não satisfaz o gate", () => {
  const current = findRegionalCandidateValidation("barra-do-ribeiro-rs");
  assert.ok(current);

  const inconsistent: RegionalCandidateTechnicalValidation = {
    ...current,
    coordinates: { ...current.coordinates, status: "validated" },
    coordinatesValue: undefined,
  };

  assert.equal(hasValidatedRegionalCandidateCoordinates(inconsistent), false);
});

test("candidatos com coordenadas ainda pendentes continuam bloqueados para draft", () => {
  const pending = REGIONAL_CANDIDATES.filter((candidate) => {
    const validation = findRegionalCandidateValidation(candidate.slug);
    return validation?.coordinates.status === "pending";
  });

  assert.ok(pending.length > 0);

  for (const candidate of pending) {
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
    coordinatesValue: undefined,
  };

  assert.equal(
    isRegionalCandidateReadyForDraft(candidate, validationWithoutCoordinates),
    false,
  );
});

test("gate de draft exige aprovação, IBGE e coordenadas validadas", () => {
  const sourceCandidate = REGIONAL_CANDIDATES.find(
    (candidate) => candidate.slug === "barra-do-ribeiro-rs",
  );
  assert.ok(sourceCandidate);

  const candidate = approvedCandidate(sourceCandidate);
  const current = findRegionalCandidateValidation(candidate.slug);
  assert.ok(current);
  assert.equal(hasValidatedRegionalCandidateCoordinates(current), true);
  assert.equal(isRegionalCandidateReadyForDraft(candidate, current), true);
});

test("registro de validações não possui slugs duplicados", () => {
  const slugs = REGIONAL_CANDIDATE_VALIDATIONS.map((validation) => validation.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

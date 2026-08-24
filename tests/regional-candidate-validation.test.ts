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

  assert.equal(validated.length, REGIONAL_CANDIDATES.length);

  for (const validation of validated) {
    assert.equal(hasValidatedRegionalCandidateCoordinates(validation), true);
    assert.ok(validation.coordinates.source);
    assert.ok(validation.coordinates.checkedAt);
    assert.equal(validation.coordinatesValue?.reference, "city-seat");
    assert.equal(validation.coordinatesValue?.datum, "SIRGAS 2000");
  }
});

test("fonte meteorológica principal foi validada para toda a primeira onda", () => {
  for (const validation of REGIONAL_CANDIDATE_VALIDATIONS) {
    assert.equal(validation.weather.status, "validated");
    assert.equal(validation.weather.source, "https://api.open-meteo.com/v1/forecast");
    assert.ok(validation.weather.checkedAt);
    assert.ok(validation.weather.note);
  }
});

test("hidrologia só avança quando existe fonte diretamente aplicável", () => {
  const arambare = findRegionalCandidateValidation("arambare-rs");
  assert.ok(arambare);
  assert.equal(arambare.hydrology.status, "validated");
  assert.equal(arambare.hydrology.source, "https://monitoramentolagoadospatos.com.br/");
  assert.ok(arambare.hydrology.checkedAt);
  assert.match(arambare.hydrology.note ?? "", /lagoon-arambare/);

  const pending = REGIONAL_CANDIDATE_VALIDATIONS.filter(
    (validation) => validation.slug !== "arambare-rs",
  );
  assert.equal(pending.length, REGIONAL_CANDIDATES.length - 1);
  for (const validation of pending) {
    assert.equal(validation.hydrology.status, "pending");
    assert.ok(validation.hydrology.note);
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

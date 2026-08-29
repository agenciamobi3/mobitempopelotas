import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const collector = readFileSync(
  "supabase/functions/historical-events-capture/index.ts",
  "utf8",
);

test("deduplica o lote pela mesma chave canônica usada pelo upsert", () => {
  assert.match(collector, /function canonicalEventKey\(row: JsonRecord\)/);
  assert.match(collector, /row\.source_key/);
  assert.match(collector, /row\.event_type/);
  assert.match(collector, /row\.source_record_id/);
  assert.match(collector, /function deduplicateEventRows\(rows: JsonRecord\[\]\)/);
  assert.match(collector, /unique\.set\(key, row\)/);
  assert.match(
    collector,
    /onConflict: "source_key,event_type,source_record_id"/,
  );

  const persistenceFlow = collector.slice(
    collector.indexOf("for (const item of sourceResults)"),
  );
  const inputIndex = persistenceFlow.indexOf("const inputRows = item.result.value");
  const dedupeIndex = persistenceFlow.indexOf("const rows = deduplicateEventRows(inputRows)");
  const upsertIndex = persistenceFlow.indexOf(".upsert(rows,");

  assert.ok(inputIndex >= 0, "o lote original deve ser preservado para auditoria");
  assert.ok(dedupeIndex > inputIndex, "a deduplicação deve ocorrer depois da leitura do lote");
  assert.ok(upsertIndex > dedupeIndex, "o upsert só pode receber o lote deduplicado");
});

test("registra telemetria das duplicatas descartadas", () => {
  assert.match(
    collector,
    /const droppedDuplicates = Math\.max\(0, inputRows\.length - rows\.length\)/,
  );
  assert.match(collector, /inputRows: inputRows\.length/);
  assert.match(collector, /deduplicatedRows: rows\.length/);
  assert.match(collector, /droppedDuplicates/);
});

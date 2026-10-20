import test from "node:test";
import assert from "node:assert/strict";
import { checkSaveEnvelope, normalizeManualSaveSlots, normalizeSpecimens } from "../src/game/save-validation.ts";

const specimen = (overrides = {}) => ({ id: "specimen-1", speciesId: "alocasia-polly", nickname: "Polly", location: "Greenhouse", health: 80, stage: "Juvenile", value: 100, protected: false, variegation: 20, ...overrides });
const save = (overrides = {}) => ({ version: 7, specimens: [specimen()], cash: 100, research: 0, day: 1, savedAt: 123, ...overrides });

test("save envelope accepts supported legacy versions and rejects malformed top-level fields", () => {
  for (const version of [1, 2, 3, 4, 5, 6, 7]) assert.equal(checkSaveEnvelope(save({ version })).valid, true);
  assert.equal(checkSaveEnvelope(null).valid, false);
  assert.equal(checkSaveEnvelope(save({ version: 99 })).valid, false);
  assert.equal(checkSaveEnvelope(save({ specimens: {} })).valid, false);
  assert.equal(checkSaveEnvelope(save({ cash: Number.NaN })).valid, false);
});

test("specimen recovery drops invalid and duplicate records while preserving and clamping valid ones", () => {
  const result = normalizeSpecimens([specimen({ health: 140, value: -5, variegation: 101 }), { id: "broken" }, specimen({ id: "specimen-1" })]);
  assert.equal(result.specimens.length, 1);
  assert.equal(result.dropped, 2);
  assert.equal(result.repaired, 1);
  assert.equal(result.specimens[0].health, 100);
  assert.equal(result.specimens[0].value, 0);
  assert.equal(result.specimens[0].variegation, 100);
});

test("unknown or malformed manual slots normalize to three safe empty/valid slots", () => {
  const result = normalizeManualSaveSlots({ "1": save(), "2": { version: 77 }, "3": "broken", extra: save() });
  assert.equal(checkSaveEnvelope(result["1"]).valid, true);
  assert.equal(result["2"], null);
  assert.equal(result["3"], null);
  assert.deepEqual(normalizeManualSaveSlots(null), { "1": null, "2": null, "3": null });
});


import { normalizeBreedingProjectRelations } from "../src/game/save-validation.ts";

const project = (overrides = {}) => ({
  id: "project-1", parentAId: "parent-a", parentBId: "parent-b",
  startedDay: 1, completesOnDay: 6, cost: 20, status: "active",
  lineId: "line-1", failureChance: 0.1, ...overrides,
});

test("breeding relationship recovery repairs active parent reservations and clears orphan reservations", () => {
  const a = specimen({ id: "parent-a" });
  const b = specimen({ id: "parent-b", reservedByProjectId: "missing-project" });
  const orphan = specimen({ id: "orphan", reservedByProjectId: "missing-project" });
  const result = normalizeBreedingProjectRelations([a, b, orphan], [project()]);
  assert.equal(result.dropped, 0);
  assert.equal(result.specimens.find((item) => item.id === "parent-a")?.reservedByProjectId, "project-1");
  assert.equal(result.specimens.find((item) => item.id === "parent-b")?.reservedByProjectId, "project-1");
  assert.equal(result.specimens.find((item) => item.id === "orphan")?.reservedByProjectId, undefined);
  assert.equal(result.repaired, 3);
});

test("breeding relationship recovery drops orphaned, duplicate-parent, duplicate-id and conflicting active projects", () => {
  const parents = [specimen({ id: "parent-a" }), specimen({ id: "parent-b" }), specimen({ id: "parent-c" })];
  const result = normalizeBreedingProjectRelations(parents, [
    project(),
    project({ id: "project-2", parentAId: "parent-a", parentBId: "parent-c" }),
    project({ id: "project-3", parentAId: "missing", parentBId: "parent-c" }),
    project({ id: "project-4", parentAId: "parent-a", parentBId: "parent-a" }),
    project(),
  ]);
  assert.equal(result.projects.length, 1);
  assert.equal(result.dropped, 4);
});

test("breeding relationship recovery rejects invalid project values but retains historical closed projects without live parents", () => {
  const result = normalizeBreedingProjectRelations([], [
    project({ status: "completed", parentAId: "sold-a", parentBId: "sold-b" }),
    project({ id: "bad-cost", cost: -1 }),
    project({ id: "bad-chance", failureChance: 1.5 }),
  ]);
  assert.equal(result.projects.length, 1);
  assert.equal(result.projects[0].status, "completed");
  assert.equal(result.dropped, 2);
});

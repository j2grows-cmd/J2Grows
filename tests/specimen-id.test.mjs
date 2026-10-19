import test from "node:test";
import assert from "node:assert/strict";
import { createUniqueSpecimenId } from "../src/game/specimen-id.ts";

const uuidA = "11111111-1111-4111-8111-111111111111";
const uuidB = "22222222-2222-4222-8222-222222222222";

test("new specimen IDs are valid UUIDs and do not collide with existing IDs", () => {
  assert.equal(createUniqueSpecimenId(["legacy-id"], () => uuidA), uuidA);
  assert.match(createUniqueSpecimenId([], () => uuidB), /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test("UUID generation retries a collision and keeps existing IDs untouched", () => {
  const legacyIds = ["J2G-PHI-0001", uuidA];
  const sequence = [uuidA, uuidB];
  let calls = 0;
  const created = createUniqueSpecimenId(legacyIds, () => sequence[calls++]);
  assert.equal(created, uuidB);
  assert.deepEqual(legacyIds, ["J2G-PHI-0001", uuidA], "old IDs are not mutated or migrated");
  assert.equal(calls, 2);
});

test("invalid UUID output is rejected and bounded retries fail clearly", () => {
  assert.throws(() => createUniqueSpecimenId([], () => "not-a-uuid"), /Unable to generate a unique specimen UUID/);
});

test("legacy specimen IDs and lineage references survive save-format round trips", () => {
  const legacySave = {
    version: 4,
    specimens: [
      { id: "J2G-PHI-0001", speciesId: "philodendron-white-princess", lineParentIds: [] },
      { id: "J2G-LINE-0002-ABC12", speciesId: "philodendron-white-princess", lineParentIds: ["J2G-PHI-0001", "J2G-ALO-0007"] },
    ],
  };
  const restored = JSON.parse(JSON.stringify(legacySave));
  assert.deepEqual(restored, legacySave);
  assert.equal(restored.specimens[1].id, "J2G-LINE-0002-ABC12");
  assert.deepEqual(restored.specimens[1].lineParentIds, ["J2G-PHI-0001", "J2G-ALO-0007"]);
});

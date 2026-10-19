import test from "node:test";
import assert from "node:assert/strict";
import { canCreateOffset } from "../src/game/propagation-eligibility.ts";

test("offsets are only available from mature or breeding-ready plants", () => {
  assert.equal(canCreateOffset("Corm"), false);
  assert.equal(canCreateOffset("Seedling"), false);
  assert.equal(canCreateOffset("Juvenile"), false);
  assert.equal(canCreateOffset("Growing"), false);
  assert.equal(canCreateOffset("Mature"), true);
  assert.equal(canCreateOffset("Breeding-ready"), true);
  assert.equal(canCreateOffset("Unknown"), false);
});

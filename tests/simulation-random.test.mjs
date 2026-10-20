import test from "node:test";
import assert from "node:assert/strict";
import { createEventRandom } from "../src/game/random.ts";

test("named simulation events replay the same random stream", () => {
  const first = createEventRandom("save-seed-42", "day:9:specimen:plant-1");
  const replay = createEventRandom("save-seed-42", "day:9:specimen:plant-1");
  assert.deepEqual(Array.from({ length: 32 }, first), Array.from({ length: 32 }, replay));
});

test("simulation events are isolated from one another", () => {
  const specimenA = createEventRandom("save-seed-42", "day:9:specimen:plant-1");
  const specimenB = createEventRandom("save-seed-42", "day:9:specimen:plant-2");
  assert.notDeepEqual(Array.from({ length: 8 }, specimenA), Array.from({ length: 8 }, specimenB));
});

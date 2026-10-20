import test from "node:test";
import assert from "node:assert/strict";
import { createSeededRandom, randomInteger } from "../src/game/random.ts";

test("seeded streams produce the same sequence for the same seed", () => {
  const first = createSeededRandom("j2grows-save-123");
  const second = createSeededRandom("j2grows-save-123");
  assert.deepEqual(Array.from({ length: 20 }, first), Array.from({ length: 20 }, second));
});

test("different seeds produce different streams", () => {
  const first = createSeededRandom("greenhouse-a");
  const second = createSeededRandom("greenhouse-b");
  assert.notDeepEqual(Array.from({ length: 8 }, first), Array.from({ length: 8 }, second));
});

test("seeded values always stay in the half-open interval [0, 1)", () => {
  const random = createSeededRandom(42);
  for (let index = 0; index < 1000; index += 1) {
    const value = random();
    assert.ok(value >= 0 && value < 1);
  }
});

test("randomInteger respects inclusive bounds and deterministic streams", () => {
  const first = createSeededRandom(9);
  const second = createSeededRandom(9);
  const a = Array.from({ length: 100 }, () => randomInteger(first, 2, 5));
  const b = Array.from({ length: 100 }, () => randomInteger(second, 2, 5));
  assert.deepEqual(a, b);
  assert.ok(a.every((value) => value >= 2 && value <= 5));
  assert.throws(() => randomInteger(first, 3.2, 7), RangeError);
  assert.throws(() => randomInteger(first, 8, 7), RangeError);
});

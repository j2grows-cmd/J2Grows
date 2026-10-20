import test from "node:test";
import assert from "node:assert/strict";
import { advanceEstablishedGrowthStage, calculateDailyHealth } from "../src/game/simulation.ts";

test("daily health responds to poor, adequate and excellent conditions within 0-100", () => {
  assert.equal(calculateDailyHealth(80, 20), 75);
  assert.equal(calculateDailyHealth(80, 40), 78);
  assert.equal(calculateDailyHealth(80, 65), 80);
  assert.equal(calculateDailyHealth(80, 80), 82);
  assert.equal(calculateDailyHealth(99, 80), 100);
  assert.equal(calculateDailyHealth(0, 20), 0);
  assert.equal(calculateDailyHealth(120, 80), 100);
});

test("established growth transitions use health gates and reset stage days", () => {
  assert.deepEqual(advanceEstablishedGrowthStage("Corm / Seedling", 4, 40, 1, 1), { stage: "Juvenile", stageDays: 0, transition: "seedling-established" });
  assert.equal(advanceEstablishedGrowthStage("Juvenile", 9, 39, 1, 1).stage, "Juvenile");
  assert.equal(advanceEstablishedGrowthStage("Juvenile", 9, 40, 1, 1).stage, "Growing");
  assert.equal(advanceEstablishedGrowthStage("Growing", 20, 50, 1, 1).stage, "Mature");
  assert.equal(advanceEstablishedGrowthStage("Mature", 13, 70, 1, 1).stage, "Breeding-ready");
});

test("species and environment factors alter growth duration deterministically", () => {
  assert.equal(advanceEstablishedGrowthStage("Juvenile", 9, 80, 1, 1).stage, "Growing");
  assert.equal(advanceEstablishedGrowthStage("Juvenile", 9, 80, 1.25, 1).stage, "Juvenile");
  assert.equal(advanceEstablishedGrowthStage("Juvenile", 9, 80, 1, 1.2).stage, "Juvenile");
  const first = advanceEstablishedGrowthStage("Growing", 4, 70, 0.9, 0.85);
  const second = advanceEstablishedGrowthStage("Growing", 4, 70, 0.9, 0.85);
  assert.deepEqual(first, second);
});

import test from "node:test";
import assert from "node:assert/strict";
import { advanceEstablishedGrowthStage, advancePropagationPhase, calculateDailyHealth } from "../src/game/simulation.ts";

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

test("propagation phase advancement is pure and deterministic across the cutting lifecycle", () => {
  const cutting = { method: "cutting", phase: "Cutting", daysInPhase: 0, daysToSprout: 1, daysToEstablish: 1, daysToJuvenile: 1 };
  const rooting = advancePropagationPhase(cutting, 0, 0);
  assert.equal(rooting.transition, "cutting-rooting");
  assert.deepEqual(rooting.propagation, { ...cutting, phase: "Rooting", daysInPhase: 0 });
  const newGrowth = advancePropagationPhase(rooting.propagation, 0, 0);
  assert.equal(newGrowth.transition, "rooting-new-growth");
  const established = advancePropagationPhase(newGrowth.propagation, 0, 0);
  assert.equal(established.transition, "propagation-established");
  assert.equal(established.propagation, undefined);
});

test("propagation delays respond to conditions and bench upgrades while corm phases remain explicit", () => {
  const cutting = { method: "cutting", phase: "Cutting", daysInPhase: 0, daysToSprout: 2, daysToEstablish: 2 };
  assert.equal(advancePropagationPhase(cutting, 2, 0).transition, "no-transition");
  assert.equal(advancePropagationPhase(cutting, 0, 2).transition, "cutting-rooting");
  const corm = { method: "corm", phase: "Corm", daysInPhase: 1, daysToSprout: 2, daysToEstablish: 2 };
  assert.equal(advancePropagationPhase(corm, 0, 0).transition, "corm-sprouting");
  const sprouting = advancePropagationPhase(corm, 0, 0).propagation;
  assert.equal(advancePropagationPhase(sprouting, 0, 0).transition, "no-transition");
  assert.equal(advancePropagationPhase({ ...sprouting, daysInPhase: 1 }, 0, 0).transition, "propagation-established");
});

test("90-day healthy simulation remains bounded and reaches breeding readiness reproducibly", () => {
  const run = () => {
    let health = 80;
    let stage = "Juvenile";
    let stageDays = 0;
    for (let day = 1; day <= 90; day += 1) {
      health = calculateDailyHealth(health, 80);
      const next = advanceEstablishedGrowthStage(stage, stageDays, health, 1, 1);
      stage = next.stage;
      stageDays = next.stageDays;
      assert.ok(health >= 0 && health <= 100);
      assert.ok(stageDays >= 0);
    }
    return { health, stage, stageDays };
  };
  assert.deepEqual(run(), run());
  assert.equal(run().stage, "Breeding-ready");
});

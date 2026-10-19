import test from "node:test";
import assert from "node:assert/strict";
import {
  GROWTH_STAGES, canBreed, calculateBreedingCost, breedingDurationDays,
  breedingFailureChance, calculateElapsedDays, advanceClock, mutationChance,
  mutationOccurs, mutationConfirmed, stableAcrossGenerations, canUnlockResearch,
  unlockResearch, RESEARCH_TREE, geneticLineValue, inheritTraits, applyTraitTargeting,
  calculateTargetedBreedingCost, calculateTargetedFailureChance,
} from "../src/game/progression.ts";
import { createGeneticProfile, DEFAULT_ENVIRONMENT } from "../src/game/genetics.ts";

test("the agreed five growth stages are explicit and ordered", () => {
  assert.deepEqual(GROWTH_STAGES, ["Corm / Seedling", "Juvenile", "Growing", "Mature", "Breeding-ready"]);
});

test("only available, healthy breeding-ready plants can breed", () => {
  assert.equal(canBreed("Breeding-ready", "Breeding-ready", 80, 70), true);
  assert.equal(canBreed("Mature", "Breeding-ready", 80, 70), false);
  assert.equal(canBreed("Breeding-ready", "Breeding-ready", 0, 70), false);
  assert.equal(canBreed("Breeding-ready", "Breeding-ready", 80, 70, true, false), false);
});

test("breeding cost scales with rarity and complexity and discounts are bounded", () => {
  assert.ok(calculateBreedingCost("Mythic", "Mythic") > calculateBreedingCost("Common", "Common"));
  assert.ok(calculateBreedingCost("Rare", "Rare", 2) > calculateBreedingCost("Rare", "Rare", 1));
  assert.ok(calculateBreedingCost("Common", "Common", 1, 100) >= 1);
});

test("breeding duration and failure risk respond to upgrades and research", () => {
  assert.ok(breedingDurationDays(5, 25) < breedingDurationDays(5, 0));
  assert.ok(breedingFailureChance(3, 85) < breedingFailureChance(0, 30));
});

test("elapsed time rejects clock rollback and caps offline progress at fourteen days", () => {
  assert.equal(calculateElapsedDays(1000, 2000), 0);
  assert.equal(calculateElapsedDays(1000 + 30 * 86400000, 1000), 14);
  assert.deepEqual(advanceClock({ day: 3, lastProcessedAt: 10, lastOfflineDays: 0 }, 2, 50), { day: 5, lastProcessedAt: 50, lastOfflineDays: 2 });
});

test("mutation odds remain rare and route-specific", () => {
  const growth = mutationChance("growth", DEFAULT_ENVIRONMENT);
  const propagation = mutationChance("propagation", DEFAULT_ENVIRONMENT);
  const breeding = mutationChance("breeding", DEFAULT_ENVIRONMENT);
  assert.ok(growth < propagation && propagation < breeding);
  assert.equal(mutationOccurs("growth", DEFAULT_ENVIRONMENT, 0, 0, () => 0), true);
  assert.equal(mutationOccurs("growth", DEFAULT_ENVIRONMENT, 0, 0, () => 1), false);
});

test("mutation discovery requires evidence and stability takes three generations", () => {
  assert.equal(mutationConfirmed(2), false);
  assert.equal(mutationConfirmed(3), true);
  assert.equal(stableAcrossGenerations(2), false);
  assert.equal(stableAcrossGenerations(3), true);
});

test("targeted breeding probabilistically biases a chosen trait and applies cost/risk trade-offs", () => {
  const parentA = { variegationPotential: 90, stability: 50, hiddenPotential: 45, growthPotential: 55, mutationGenePresent: false, mutationIds: [] };
  const parentB = { variegationPotential: 40, stability: 75, hiddenPotential: 60, growthPotential: 35, mutationGenePresent: true, mutationIds: [] };
  const inherited = { variegationPotential: 50, stability: 60, hiddenPotential: 55, growthPotential: 45, mutationGenePresent: false, mutationIds: [] };
  const targeted = applyTraitTargeting(inherited, parentA, parentB, "variegationPotential", () => 0);
  assert.equal(targeted.variegationPotential, 62, "a successful targeting roll nudges the trait towards the stronger parent");
  assert.equal(targeted.stability, inherited.stability, "unselected traits remain unchanged");
  const missed = applyTraitTargeting(inherited, parentA, parentB, "variegationPotential", () => 0.99);
  assert.equal(missed.variegationPotential, inherited.variegationPotential, "targeting can fail to improve the selected trait");
  assert.equal(applyTraitTargeting(inherited, parentA, parentB, undefined, () => 0), inherited);
  assert.equal(calculateTargetedBreedingCost(20, false), 20);
  assert.equal(calculateTargetedBreedingCost(20, true), 25);
  assert.equal(calculateTargetedFailureChance(0.1, false), 0.1);
  assert.equal(calculateTargetedFailureChance(0.1, true), 0.18);
});

test("research tree enforces prerequisites and consumes points", () => {
  const initial = { points: 20, unlocked: [], completed: [] };
  assert.equal(canUnlockResearch("inheritance-mapping", initial), false);
  const first = unlockResearch("field-notes", initial);
  assert.deepEqual(first, { points: 10, unlocked: ["field-notes"], completed: ["field-notes"] });
  assert.equal(unlockResearch("field-notes", first), null);
  assert.ok(RESEARCH_TREE.length >= 8);
});

test("trait inheritance is bounded and line value rewards demonstrated potential", () => {
  const parentA = createGeneticProfile(() => 0.4);
  const parentB = createGeneticProfile(() => 0.6);
  const child = inheritTraits(parentA, parentB, () => 0.5);
  for (const key of ["variegationPotential", "stability", "hiddenPotential", "growthPotential"]) {
    assert.ok(child[key] >= 0 && child[key] <= 100);
  }
  assert.ok(geneticLineValue(20, 100, 1.6, 90, 1) > geneticLineValue(20, 100, 1.6, 20, 0));
});

import test from "node:test";
import assert from "node:assert/strict";
import { SPECIES_ECONOMY, getSpeciesEconomy, STARTING_CASH } from "../src/game/catalog.ts";
import { calculateHealthFactor, calculateMaturityFactor, calculateSpecimenValue, environmentalSuitability, getShopAvailability, growVariegation, inheritGenetics, observePlant, analyseGenetics } from "../src/game/genetics.ts";

test("catalogue has exactly 99 unique species and positive prices", () => {
  assert.equal(SPECIES_ECONOMY.length, 99);
  assert.equal(new Set(SPECIES_ECONOMY.map((item) => item.name.toLowerCase())).size, 99);
  assert.ok(SPECIES_ECONOMY.every((item) => item.basePrice > 0));
  assert.equal(STARTING_CASH, 100);
  assert.equal(getSpeciesEconomy("Alocasia Amazonica")?.basePrice, 15);
});

test("health and maturity valuation bands follow the proposed rules", () => {
  assert.equal(calculateHealthFactor(100), 1);
  assert.equal(calculateHealthFactor(89), 0.85);
  assert.equal(calculateHealthFactor(74), 0.6);
  assert.equal(calculateHealthFactor(49), 0.3);
  assert.equal(calculateHealthFactor(24), 0.1);
  assert.equal(calculateHealthFactor(0), 0);
  assert.equal(calculateMaturityFactor("Juvenile"), 1);
  assert.equal(calculateMaturityFactor("Growing"), 1.25);
  assert.equal(calculateMaturityFactor("Mature"), 1.6);
});

test("strong stable variegation is worth more than weak unstable variegation", () => {
  const base = { basePrice: 20, health: 100, stage: "Juvenile" };
  const strong = calculateSpecimenValue({ ...base, variegationStrength: 80, stability: 90 });
  const weak = calculateSpecimenValue({ ...base, variegationStrength: 15, stability: 25 });
  assert.ok(strong > weak);
  assert.equal(calculateSpecimenValue({ ...base, variegationStrength: 80, stability: 90, health: 0 }), 0);
});

test("inheritance blends parental profiles with bounded variation", () => {
  const a = { variegationPotential: 90, stability: 80, hiddenPotential: 75, growthPotential: 60, mutationIds: ["a"] };
  const b = { variegationPotential: 50, stability: 60, hiddenPotential: 45, growthPotential: 40, mutationIds: ["b"] };
  const child = inheritGenetics(a, b, () => 0.5);
  assert.equal(child.variegationPotential, 70);
  assert.equal(child.stability, 70);
  assert.deepEqual(child.mutationIds, ["a", "b"]);
});

test("environment changes suitability and variegation expression is bounded", () => {
  const profile = { variegationPotential: 80, stability: 70, hiddenPotential: 50, growthPotential: 50, mutationIds: [] };
  const good = { light: 65, nutrition: 65, humidity: 65, health: 100 };
  const poor = { light: 0, nutrition: 0, humidity: 0, health: 20 };
  assert.ok(environmentalSuitability(good) > environmentalSuitability(poor));
  const result = growVariegation(profile, good, 70, () => 0.5);
  assert.ok(result.expression >= 0 && result.expression <= 100);
  assert.equal(result.reverted, false);
});

test("observation earns research and genetic analysis spends it", () => {
  const record = {
    genetics: { variegationPotential: 70, stability: 80, hiddenPotential: 75, growthPotential: 50, mutationIds: [] },
    expression: 70, environment: { light: 65, nutrition: 65, humidity: 65, health: 100 },
    observations: [], research: { points: 0, observationCount: 0, analysisLevel: 0, discoveredTraits: [], mutations: [] },
  };
  const observed = observePlant(record);
  assert.equal(observed.research.points, 2);
  assert.equal(observed.research.observationCount, 1);
  assert.equal(analyseGenetics(observed, 25), null);
  const funded = { ...observed, research: { ...observed.research, points: 30 } };
  const analysed = analyseGenetics(funded, 25);
  assert.ok(analysed);
  assert.equal(analysed.research.points, 5);
  assert.ok(analysed.research.discoveredTraits.includes("stability-profile"));
});

test("rarity affects shop availability", () => {
  assert.equal(getShopAvailability("Common", () => 0.5), true);
  assert.equal(getShopAvailability("Mythic", () => 0.5), false);
});

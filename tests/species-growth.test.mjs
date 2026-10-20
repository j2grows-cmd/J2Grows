import test from "node:test";
import assert from "node:assert/strict";
import { calculateSpeciesSuitability, getSpeciesCareProfile, speciesGrowthDurationFactor } from "../src/game/species-growth.ts";

test("species profiles differ by genus and cultivation difficulty", () => {
  assert.notEqual(getSpeciesCareProfile("Alocasia zebrina").preferredHumidity, getSpeciesCareProfile("Monstera deliciosa").preferredHumidity);
  assert.ok(speciesGrowthDurationFactor("Alocasia zebrina", "Advanced") > speciesGrowthDurationFactor("Alocasia zebrina", "Easy"));
});

test("species suitability rewards genus-appropriate conditions and remains bounded", () => {
  const environment = { light: 62, humidity: 78, nutrition: 70, health: 100 };
  const alocasia = calculateSpeciesSuitability("Alocasia zebrina", "Moderate", environment);
  const monstera = calculateSpeciesSuitability("Monstera deliciosa", "Moderate", environment);
  assert.ok(alocasia > monstera);
  assert.ok(alocasia >= 0 && alocasia <= 100);
  assert.equal(calculateSpeciesSuitability("unknown plant", "Moderate", { ...environment, health: 100 }), calculateSpeciesSuitability("Unknown plant", "Moderate", { ...environment, health: 100 }));
});
import test from "node:test";
import assert from "node:assert/strict";
import { auditSpeciesEconomy, getSpeciesEconomy, SPECIES_ECONOMY } from "../src/game/catalog.ts";
import { species } from "../src/data.ts";

test("economy catalogue has valid prices, unique normalized names and complete fallback coverage", () => {
  const audit = auditSpeciesEconomy();
  assert.equal(audit.total, SPECIES_ECONOMY.length);
  assert.deepEqual(audit.duplicateNames, []);
  assert.deepEqual(audit.invalidPrices, []);
  assert.ok(species.length > 0);
  assert.equal(new Set(species.map((plant) => plant.id)).size, species.length, "offline species IDs must be unique");
  assert.ok(SPECIES_ECONOMY.every((row) => row.basePrice > 0 && Number.isFinite(row.basePrice)));
  assert.ok(audit.lowConfidenceNames.length > 0, "low-confidence prices remain explicitly reviewable");
});

test("economy lookup prefers exact names and refuses ambiguous suffix matches", () => {
  assert.equal(getSpeciesEconomy("Philodendron Luxurians")?.basePrice, 45);
  assert.equal(getSpeciesEconomy("Alocasia Amazonica")?.basePrice, 15);
  assert.equal(getSpeciesEconomy("luxurians"), undefined, "shared epithets must not silently borrow another genus price");
});

test("rarity gaps are reported rather than filled with invented catalogue entries", () => {
  const audit = auditSpeciesEconomy();
  assert.ok(audit.missingRarityTiers.includes("Mythic"));
});

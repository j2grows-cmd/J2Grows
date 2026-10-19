import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSpeciesRow, normalizeSpeciesRows } from "../src/game/supabase-catalog.ts";

const valid = { id: "alocasia-frydek", name: "Alocasia Frydek", scientific_name: "Alocasia micholitziana", family: "Araceae", difficulty: "Moderate", rarity: "Rare", image_path: "species/alocasia-frydek/hero.png", summary: "A velvet-leaf aroid", light: "Bright indirect", humidity: "High", water: "Keep evenly moist", traits: ["Velvet", "Variegated"] };

test("normalizes valid rows and retains safe metadata", () => {
  assert.deepEqual(normalizeSpeciesRow(valid), { ...valid, traits: ["Velvet", "Variegated"] });
});

test("rejects non-records and rows without a valid ID or name", () => {
  assert.equal(normalizeSpeciesRow(null), null);
  assert.equal(normalizeSpeciesRow([]), null);
  assert.equal(normalizeSpeciesRow({ ...valid, id: "../unsafe" }), null);
  assert.equal(normalizeSpeciesRow({ ...valid, name: " " }), null);
});

test("defaults missing traits and optional fields and rejects unsafe image paths", () => {
  const row = normalizeSpeciesRow({ id: "monstera-albo", name: "Monstera Albo", traits: null, image_path: "../private.png", difficulty: "impossible", rarity: "mythic" });
  assert.ok(row);
  assert.deepEqual(row.traits, []);
  assert.equal(row.image_path, "");
  assert.equal(row.difficulty, null);
  assert.equal(row.rarity, null);
  assert.equal(row.summary, null);
  assert.equal(normalizeSpeciesRow({ ...valid, image_path: "species/hero.svg" })?.image_path, "");
});

test("filters malformed and duplicate records without discarding valid neighbours", () => {
  const rows = normalizeSpeciesRows([valid, null, { ...valid, name: "Duplicate" }, { ...valid, id: "philodendron-pink-princess", name: "Pink Princess", traits: ["Pink", 7, "Pink"] }]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].name, "Alocasia Frydek");
  assert.equal(rows[1].name, "Pink Princess");
  assert.deepEqual(rows[1].traits, ["Pink"]);
  assert.deepEqual(normalizeSpeciesRows({ not: "an array" }), []);
});

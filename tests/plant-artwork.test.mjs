import test from "node:test";
import assert from "node:assert/strict";
import { getFallbackArtworkType, resolvePlantArtwork } from "../src/game/plant-artwork.ts";

test("missing plant artwork selects a matching existing genus illustration", () => {
  assert.equal(getFallbackArtworkType("alocasia-frydek"), "alocasia");
  assert.equal(getFallbackArtworkType("Monstera Thai Constellation"), "monstera");
  assert.equal(getFallbackArtworkType("philodendron-pink-princess"), "philodendron");
  assert.equal(getFallbackArtworkType("anthurium-luxurians"), "anthurium");
  assert.equal(getFallbackArtworkType("unknown-species"), "hero");
});

test("a valid image URL takes priority over local or genus fallback artwork", () => {
  assert.equal(resolvePlantArtwork("https://cdn.example.test/hero.png", "alocasia-frydek", "hero"), "https://cdn.example.test/hero.png");
  assert.equal(resolvePlantArtwork("", "alocasia-frydek", "dragon"), "dragon");
  assert.equal(resolvePlantArtwork(null, "alocasia-frydek"), "alocasia");
  assert.equal(resolvePlantArtwork("not-a-url", "unknown-species"), "hero");
});

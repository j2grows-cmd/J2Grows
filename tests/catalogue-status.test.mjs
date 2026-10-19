import test from "node:test";
import assert from "node:assert/strict";
import { getArtworkStatusSummary, getCatalogueSourceLabel } from "../src/game/catalogue-status.ts";

test("labels each catalogue source accurately", () => {
  assert.equal(getCatalogueSourceLabel("supabase-table"), "Supabase species table");
  assert.equal(getCatalogueSourceLabel("storage-folders"), "Supabase Storage folders");
  assert.equal(getCatalogueSourceLabel("local"), "Local prototype data");
});

test("separates loaded remote images, pending images and fallback artwork", () => {
  const species = [
    { id: "remote-loaded", image: "https://cdn.example/plant.png" },
    { id: "remote-pending", image: "http://cdn.example/plant.png" },
    { id: "remote-broken", image: "https://cdn.example/broken.png" },
    { id: "local-art", image: "alocasia" },
  ];
  assert.deepEqual(getArtworkStatusSummary(species, { "remote-loaded": "loaded", "remote-broken": "fallback" }), { loaded: 1, pending: 1, fallback: 2, total: 4 });
});

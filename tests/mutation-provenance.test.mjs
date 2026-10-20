import test from "node:test";
import assert from "node:assert/strict";
import { createMutation } from "../src/game/genetics.ts";
import { genomeFromPhenotype, phenotypeFromGenome } from "../src/game/alleles.ts";
import { createSeededRandom } from "../src/game/random.ts";

test("legacy numeric traits migrate to a reproducible diploid genome", () => {
  const profile = { variegationPotential: 80, stability: 70, growthPotential: 40, hiddenPotential: 60 };
  const genome = genomeFromPhenotype(profile);
  assert.deepEqual(phenotypeFromGenome(genome), profile);
  assert.deepEqual(genomeFromPhenotype(profile), genome);
});

test("mutation records retain origin, tissue distribution, day and parent mutation provenance", () => {
  const mutation = createMutation(createSeededRandom("mutation-provenance"), {
    origin: "breeding", tissueDistribution: "whole-plant", originDay: 12, parentMutationIds: ["parent-mut-a", "parent-mut-b", "parent-mut-a"],
  });
  assert.equal(mutation.origin, "breeding");
  assert.equal(mutation.tissueDistribution, "whole-plant");
  assert.equal(mutation.originDay, 12);
  assert.deepEqual(mutation.parentMutationIds, ["parent-mut-a", "parent-mut-b"]);
});

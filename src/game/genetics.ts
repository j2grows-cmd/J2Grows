import type { RarityTier } from "./catalog.ts";

export type GeneticProfile = {
  /** Inherited propensity for visible variegation, 0–100. */
  variegationPotential: number;
  /** Inherited ability to preserve a pattern across growth, 0–100. */
  stability: number;
  /** Latent trait potential gradually revealed by research, 0–100. */
  hiddenPotential: number;
  growthPotential: number;
  mutationIds: string[];
};

export type PlantEnvironment = {
  light: number;
  nutrition: number;
  humidity: number;
  health: number;
  temperature?: number;
  autoCare?: boolean;
  lightHours?: number;
};

export type MutationCategory = "colour" | "morphology" | "growth" | "novelty";
export type MutationInheritance = "stable" | "unstable" | "mixed";

export type PlantMutation = {
  id: string;
  name: string;
  category: MutationCategory;
  rarity: "Minor" | "Unusual" | "Rare" | "Exceptional" | "Novel cultivar";
  inheritance: MutationInheritance;
  stability: number;
  detected: boolean;
  beneficial: boolean | null;
};

export type ResearchState = {
  points: number;
  observationCount: number;
  analysisLevel: number;
  discoveredTraits: string[];
  mutations: PlantMutation[];
};

export type SpecimenGenetics = {
  genetics: GeneticProfile;
  expression: number;
  environment: PlantEnvironment;
  observations: number[];
  research: ResearchState;
};

export const DEFAULT_ENVIRONMENT: PlantEnvironment = {
  light: 65, nutrition: 65, humidity: 65, health: 100,
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const varied = (value: number, random: () => number, spread = 8) => clamp(value + (random() * 2 - 1) * spread);


export function createSpecimenGenetics(expression = 0, random: () => number = Math.random): SpecimenGenetics {
  const genetics = createGeneticProfile(random);
  genetics.variegationPotential = clamp(Math.max(expression, genetics.variegationPotential));
  return {
    genetics,
    expression: clamp(expression),
    environment: { ...DEFAULT_ENVIRONMENT },
    observations: expression > 0 ? [clamp(expression)] : [],
    research: { points: 0, observationCount: 0, analysisLevel: 0, discoveredTraits: [], mutations: [] },
  };
}

export function createGeneticProfile(random: () => number = Math.random): GeneticProfile {
  return {
    variegationPotential: random() < 0.15 ? clamp(10 + random() * 20) : 0,
    stability: clamp(35 + random() * 45),
    hiddenPotential: clamp(20 + random() * 70),
    growthPotential: clamp(30 + random() * 60),
    mutationIds: [],
  };
}

/** Hybrid inheritance: parental traits blend, vary, and can rarely mutate. */
export function inheritGenetics(parentA: GeneticProfile, parentB: GeneticProfile, random: () => number = Math.random): GeneticProfile {
  const average = (a: number, b: number) => (a + b) / 2;
  const mutationIds = [...new Set([...parentA.mutationIds, ...parentB.mutationIds])];
  const child: GeneticProfile = {
    variegationPotential: varied(average(parentA.variegationPotential, parentB.variegationPotential), random, 12),
    stability: varied(average(parentA.stability, parentB.stability), random, 10),
    hiddenPotential: varied(average(parentA.hiddenPotential, parentB.hiddenPotential), random, 18),
    growthPotential: varied(average(parentA.growthPotential, parentB.growthPotential), random, 12),
    mutationIds,
  };
  if (random() < 0.025) {
    const mutation = (random() < 0.5 ? "spontaneous-colour-shift" : "spontaneous-morphology") + "-" + Math.round(random() * 1e9).toString(36);
    child.mutationIds = [...new Set([...child.mutationIds, mutation])];
    if (mutation.startsWith("spontaneous-colour-shift-")) child.variegationPotential = varied(Math.max(child.variegationPotential, 55), random, 20);
    else child.growthPotential = varied(child.growthPotential, random, 28);
  }
  return child;
}

export function environmentalSuitability(environment: PlantEnvironment): number {
  const lightScore = 100 - Math.abs(clamp(environment.light) - 65) * 1.5;
  const nutritionScore = 100 - Math.abs(clamp(environment.nutrition) - 65) * 1.3;
  const humidityScore = 100 - Math.abs(clamp(environment.humidity) - 65) * 1.1;
  return clamp((lightScore + nutritionScore + humidityScore + clamp(environment.health)) / 4);
}

/** Environment affects expression and future risk; it never guarantees a perfect leaf. */
export function growVariegation(profile: GeneticProfile, environment: PlantEnvironment, previousExpression: number, random: () => number = Math.random): { expression: number; reverted: boolean; suitability: number } {
  const suitability = environmentalSuitability(environment);
  if (profile.variegationPotential < 20 && previousExpression < 15) return { expression: 0, reverted: false, suitability: Math.round(suitability) };
  const environmentalModifier = (suitability - 50) * 0.22;
  const baseline = profile.variegationPotential * 0.72 + previousExpression * 0.28;
  const reversionRisk = clamp(42 - profile.stability * 0.32 + (100 - suitability) * 0.35, 1, 75) / 100;
  const reverted = random() < reversionRisk;
  const expression = clamp(baseline + environmentalModifier + (reverted ? -8 - random() * 12 : (random() - 0.5) * 8));
  return { expression: Math.round(expression), reverted, suitability: Math.round(suitability) };
}

export function observePlant(record: SpecimenGenetics, expression = record.expression): SpecimenGenetics {
  const observations = [...record.observations, clamp(expression)].slice(-24);
  const observationCount = record.research.observationCount + 1;
  const points = record.research.points + 2 + (observations.length >= 3 ? 1 : 0);
  const mutations = record.research.mutations.map((mutation) => mutation.detected ? mutation : { ...mutation, evidenceCount: (mutation.evidenceCount ?? 0) + 1, detected: (mutation.evidenceCount ?? 0) + 1 >= 3 });
  const discoveries = [...record.research.discoveredTraits];
  if (observations.length >= 3 && observations.every((value) => value >= 60) && !discoveries.includes("consistent-high-variegation")) {
    discoveries.push("consistent-high-variegation");
  }
  return {
    ...record,
    expression: clamp(expression),
    observations,
    research: { ...record.research, points, observationCount, discoveredTraits: discoveries, mutations },
  };
}

export function analyseGenetics(record: SpecimenGenetics, cost = 25): SpecimenGenetics | null {
  if (record.research.points < cost) return null;
  const nextLevel = record.research.analysisLevel + 1;
  const discoveries = [...record.research.discoveredTraits];
  if (nextLevel >= 1 && !discoveries.includes("stability-profile")) discoveries.push("stability-profile");
  if (nextLevel >= 2 && record.genetics.hiddenPotential >= 60 && !discoveries.includes("hidden-potential")) discoveries.push("hidden-potential");
  if (nextLevel >= 3 && !discoveries.includes("inheritance-profile")) discoveries.push("inheritance-profile");
  return {
    ...record,
    research: { ...record.research, points: record.research.points - cost, analysisLevel: nextLevel, discoveredTraits: discoveries },
  };
}

export function createMutation(random: () => number = Math.random): PlantMutation {
  const categories: MutationCategory[] = ["colour", "morphology", "growth", "novelty"];
  const roll = random();
  const rarity: PlantMutation["rarity"] = roll < 0.58 ? "Minor" : roll < 0.83 ? "Unusual" : roll < 0.96 ? "Rare" : roll < 0.995 ? "Exceptional" : "Novel cultivar";
  const category = categories[Math.floor(random() * categories.length)];
  const stability = Math.round(clamp(20 + random() * 80));
  const inheritance: MutationInheritance = stability >= 75 ? "stable" : stability < 40 ? "unstable" : "mixed";
  const names: Record<MutationCategory, string[]> = {
    colour: ["Colour shift", "Sector variegation", "Pattern mutation"],
    morphology: ["Leaf-form variation", "Texture variation", "Growth-habit shift"],
    growth: ["Compact growth", "Vigorous growth", "Slow-growth phenotype"],
    novelty: ["Novel trait combination", "Unusual cultivar candidate", "Unclassified phenotype"],
  };
  const choices = names[category];
  return {
    id: `mutation-${Math.round(random() * 1e9).toString(36)}`,
    name: choices[Math.floor(random() * choices.length)],
    category,
    rarity,
    inheritance,
    stability,
    detected: false,
    beneficial: null,
  };
}

export function naturalMutationChance(profile: GeneticProfile, environment: PlantEnvironment): number {
  // Research and care can influence odds modestly, never guarantee a mutation.
  return Math.min(0.04, 0.004 + profile.hiddenPotential / 10000 + environmentalSuitability(environment) / 20000);
}

export function shouldDiscoverMutation(profile: GeneticProfile, environment: PlantEnvironment, researchLevel: number, random: () => number = Math.random): boolean {
  const chance = Math.min(0.12, naturalMutationChance(profile, environment) * (1 + Math.max(0, researchLevel) * 0.35));
  return random() < chance;
}

export function calculateHealthFactor(health: number): number {
  if (health <= 0) return 0;
  if (health < 25) return 0.1;
  if (health < 50) return 0.3;
  if (health < 75) return 0.6;
  if (health < 90) return 0.85;
  return 1;
}

export function calculateMaturityFactor(stage: "Juvenile" | "Growing" | "Mature"): number {
  return stage === "Mature" ? 1.6 : stage === "Growing" ? 1.25 : 1;
}

/** Multipliers are balance-tuning defaults; keep each property independent to avoid double-counting. */
export function calculateSpecimenValue(input: {
  basePrice: number;
  health: number;
  stage: "Corm / Seedling" | "Juvenile" | "Growing" | "Mature" | "Breeding-ready";
  variegationStrength: number;
  stability: number;
  geneticsBonus?: number;
  discoveryBonus?: number;
}): number {
  const strengthFactor = 1 + clamp(input.variegationStrength) / 100 * 1.25;
  const stabilityFactor = clamp(input.variegationStrength) > 0 ? 0.7 + clamp(input.stability) / 100 * 0.8 : 1;
  const geneticsFactor = Math.min(2, Math.max(1, input.geneticsBonus ?? 1));
  const discoveryFactor = Math.max(1, input.discoveryBonus ?? 1);
  const raw = input.basePrice * calculateHealthFactor(input.health) * calculateMaturityFactor(input.stage)
    * strengthFactor * stabilityFactor * geneticsFactor * discoveryFactor;
  return Math.max(0, Math.round(raw));
}

export function getShopAvailability(rarity: RarityTier, random: () => number = Math.random): boolean {
  const chance: Record<RarityTier, number> = {
    Common: 0.82, Uncommon: 0.48, Rare: 0.22, "Very Rare": 0.09, "Ultra Rare": 0.035, Mythic: 0.01,
  };
  return random() < chance[rarity];
}

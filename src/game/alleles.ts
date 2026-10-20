export type GeneticLocusName = "variegation" | "stability" | "growth" | "hiddenPotential";
export type Allele = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";
export type GeneticLocus = { maternal: Allele; paternal: Allele };
export type GeneticGenome = Record<GeneticLocusName, GeneticLocus>;

const LOCUS_NAMES: GeneticLocusName[] = ["variegation", "stability", "growth", "hiddenPotential"];
const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const allele = (value: number): Allele => String(Math.max(0, Math.min(10, Math.round(value)))) as Allele;
const numericAllele = (value: Allele) => Number(value);

export function createGenome(random: () => number): GeneticGenome {
  const make = (): GeneticLocus => ({ maternal: allele(Math.floor(random() * 11)), paternal: allele(Math.floor(random() * 11)) });
  return { variegation: make(), stability: make(), growth: make(), hiddenPotential: make() };
}

export function phenotypeFromGenome(genome: GeneticGenome): { variegationPotential: number; stability: number; growthPotential: number; hiddenPotential: number } {
  const expression = (locus: GeneticLocus) => clamp(Math.round((numericAllele(locus.maternal) + numericAllele(locus.paternal)) * 5));
  return {
    variegationPotential: expression(genome.variegation),
    stability: expression(genome.stability),
    growthPotential: expression(genome.growth),
    hiddenPotential: expression(genome.hiddenPotential),
  };
}

/** Mendelian transmission: one allele from each parent per locus, with a seeded stream. */
export function inheritGenome(parentA: GeneticGenome, parentB: GeneticGenome, random: () => number): GeneticGenome {
  const choose = (locus: GeneticLocus): Allele => random() < 0.5 ? locus.maternal : locus.paternal;
  return Object.fromEntries(LOCUS_NAMES.map((name) => [name, {
    maternal: choose(parentA[name]),
    paternal: choose(parentB[name]),
  }])) as GeneticGenome;
}

export function normalizeGenome(value: unknown): GeneticGenome | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const raw = value as Record<string, unknown>;
  const result = {} as GeneticGenome;
  for (const name of LOCUS_NAMES) {
    const locus = raw[name];
    if (!locus || typeof locus !== "object" || Array.isArray(locus)) return undefined;
    const pair = locus as Record<string, unknown>;
    for (const side of ["maternal", "paternal"] as const) {
      if (typeof pair[side] !== "string" || !/^(?:10|[0-9])$/.test(pair[side] as string)) return undefined;
    }
    result[name] = { maternal: pair.maternal as Allele, paternal: pair.paternal as Allele };
  }
  return result;
}

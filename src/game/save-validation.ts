import type { Specimen } from "../data.ts";

const VALID_STAGES = new Set(["Corm / Seedling", "Juvenile", "Growing", "Mature", "Breeding-ready"]);
const VALID_PROPAGATION_METHODS = new Set(["corm", "cutting", "division", "tissue-culture"]);
const VALID_PROPAGATION_PHASES = new Set(["Corm", "Sprouting", "Establishing", "Cutting", "Rooting", "New Growth"]);

export type SpecimenRecovery = { specimens: Specimen[]; dropped: number; repaired: number };
export type SaveEnvelopeCheck = { valid: boolean; reason?: string };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finite(value: unknown, fallback: number, min: number, max: number, integer = false): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const clamped = Math.min(max, Math.max(min, value));
  return integer ? Math.floor(clamped) : clamped;
}

function validGenetics(value: unknown): Specimen["genetics"] | undefined {
  if (!isRecord(value) || !isRecord(value.genetics) || !isRecord(value.research) || !Array.isArray(value.research.mutations)) return undefined;
  const profile = value.genetics;
  if (!["variegationPotential", "stability", "hiddenPotential", "growthPotential"].every((key) => typeof profile[key] === "number" && Number.isFinite(profile[key]))) return undefined;
  if (!Array.isArray(profile.mutationIds) || !Array.isArray(value.observations) || !isRecord(value.environment)) return undefined;
  const environmentKeys = ["light", "nutrition", "humidity", "health"];
  if (!environmentKeys.every((key) => typeof value.environment![key] === "number" && Number.isFinite(value.environment![key]))) return undefined;
  const research = value.research;
  if (!["points", "observationCount", "analysisLevel"].every((key) => typeof research[key] === "number" && Number.isFinite(research[key])) || !Array.isArray(research.discoveredTraits)) return undefined;
  const mutations = research.mutations.filter((item) => isRecord(item) && typeof item.id === "string" && typeof item.category === "string").map((item) => ({ ...item, strength: finite(item.strength, 20, 0, 100), detected: item.detected === true }));
  const environment = Object.fromEntries(environmentKeys.map((key) => [key, finite(value.environment![key], 65, 0, 100)]));
  return {
    genetics: {
      variegationPotential: finite(profile.variegationPotential, 0, 0, 100),
      stability: finite(profile.stability, 50, 0, 100),
      hiddenPotential: finite(profile.hiddenPotential, 50, 0, 100),
      growthPotential: finite(profile.growthPotential, 50, 0, 100),
      mutationGenePresent: typeof profile.mutationGenePresent === "boolean" ? profile.mutationGenePresent : false,
      mutationIds: profile.mutationIds.filter((item): item is string => typeof item === "string"),
    },
    expression: finite(value.expression, 0, 0, 100),
    environment: environment as Specimen["genetics"] extends infer G ? G extends { environment: infer E } ? E : never : never,
    observations: value.observations.map((item) => finite(item, 0, 0, 100)),
    research: { points: finite(research.points, 0, 0, 1_000_000_000), observationCount: finite(research.observationCount, 0, 0, 1_000_000, true), analysisLevel: finite(research.analysisLevel, 0, 0, 3, true), discoveredTraits: research.discoveredTraits.filter((item): item is string => typeof item === "string"), mutations },
  } as Specimen["genetics"];
}

export function normalizeSpecimens(value: unknown): SpecimenRecovery {
  if (!Array.isArray(value)) return { specimens: [], dropped: 0, repaired: 0 };
  const specimens: Specimen[] = [];
  let dropped = 0;
  let repaired = 0;
  const ids = new Set<string>();
  for (const raw of value) {
    if (!isRecord(raw) || typeof raw.id !== "string" || !raw.id.trim() || typeof raw.speciesId !== "string" || !raw.speciesId.trim() || typeof raw.nickname !== "string" || typeof raw.location !== "string" || !VALID_STAGES.has(String(raw.stage)) || typeof raw.protected !== "boolean") {
      dropped++;
      continue;
    }
    if (ids.has(raw.id)) { dropped++; continue; }
    const health = finite(raw.health, 100, 0, 100);
    const valueAmount = finite(raw.value, 0, 0, 1_000_000_000);
    const variegation = finite(raw.variegation, 0, 0, 100);
    if ([raw.health, raw.value, raw.variegation].some((item) => typeof item !== "number" || !Number.isFinite(item)) || health !== raw.health || valueAmount !== raw.value || variegation !== raw.variegation) repaired++;
    const specimen: Specimen = {
      id: raw.id, speciesId: raw.speciesId, nickname: raw.nickname.slice(0, 120), location: raw.location.slice(0, 160),
      health, stage: raw.stage as Specimen["stage"], value: valueAmount, protected: raw.protected, variegation,
      ...(typeof raw.dead === "boolean" ? { dead: raw.dead } : {}),
      ...(typeof raw.discovered === "boolean" ? { discovered: raw.discovered } : {}),
      ...(typeof raw.geneticLineId === "string" ? { geneticLineId: raw.geneticLineId } : {}),
      ...(Array.isArray(raw.lineParentIds) ? { lineParentIds: raw.lineParentIds.filter((item): item is string => typeof item === "string") } : {}),
      ...(isRecord(raw.stabilityGenerations) ? { stabilityGenerations: Object.fromEntries(Object.entries(raw.stabilityGenerations).filter(([, n]) => typeof n === "number" && Number.isFinite(n)).map(([key, n]) => [key, finite(n, 0, 0, 1_000_000, true)])) } : {}),
      ...(Array.isArray(raw.stableMutationIds) ? { stableMutationIds: raw.stableMutationIds.filter((item): item is string => typeof item === "string") } : {}),
      ...(typeof raw.reservedByProjectId === "string" ? { reservedByProjectId: raw.reservedByProjectId } : {}),
      ...(typeof raw.generation === "number" && Number.isFinite(raw.generation) ? { generation: finite(raw.generation, 0, 0, 1000, true) } : {}),
      ...(typeof raw.stageDays === "number" && Number.isFinite(raw.stageDays) ? { stageDays: finite(raw.stageDays, 0, 0, 1_000_000, true) } : {}),
      ...(typeof raw.lastObservedDay === "number" && Number.isFinite(raw.lastObservedDay) ? { lastObservedDay: finite(raw.lastObservedDay, 0, 0, 1_000_000_000, true) } : {}),
      ...(typeof raw.mutationAnalysisCompleted === "boolean" ? { mutationAnalysisCompleted: raw.mutationAnalysisCompleted } : {}),
      ...(typeof raw.lastCormHarvestYear === "number" && Number.isFinite(raw.lastCormHarvestYear) ? { lastCormHarvestYear: finite(raw.lastCormHarvestYear, 0, 0, 1_000_000, true) } : {}),
      ...(typeof raw.purchasePrice === "number" && Number.isFinite(raw.purchasePrice) ? { purchasePrice: finite(raw.purchasePrice, 0, 0, 1_000_000_000) } : {}),
    };
    if (isRecord(raw.propagation) && VALID_PROPAGATION_METHODS.has(String(raw.propagation.method)) && VALID_PROPAGATION_PHASES.has(String(raw.propagation.phase))) {
      specimen.propagation = { method: raw.propagation.method as NonNullable<Specimen["propagation"]>["method"], phase: raw.propagation.phase as NonNullable<Specimen["propagation"]>["phase"], daysInPhase: finite(raw.propagation.daysInPhase, 0, 0, 1_000_000, true), daysToSprout: finite(raw.propagation.daysToSprout, 1, 1, 1000, true), daysToEstablish: finite(raw.propagation.daysToEstablish, 1, 1, 1000, true), ...(typeof raw.propagation.daysToJuvenile === "number" && Number.isFinite(raw.propagation.daysToJuvenile) ? { daysToJuvenile: finite(raw.propagation.daysToJuvenile, 1, 1, 1000, true) } : {}) };
    } else if (raw.propagation !== undefined) repaired++;
    const genetics = validGenetics(raw.genetics);
    if (raw.genetics !== undefined && !genetics) repaired++;
    if (genetics) specimen.genetics = genetics;
    ids.add(raw.id);
    specimens.push(specimen);
  }
  return { specimens, dropped, repaired };
}

export function checkSaveEnvelope(value: unknown): SaveEnvelopeCheck {
  if (!isRecord(value)) return { valid: false, reason: "Save data is not an object." };
  if (![1, 2, 3, 4, 5, 6, 7].includes(Number(value.version))) return { valid: false, reason: "Save version is missing or unsupported." };
  if (!Array.isArray(value.specimens)) return { valid: false, reason: "Specimen collection is missing or malformed." };
  for (const key of ["cash", "research", "day", "savedAt"]) if (typeof value[key] !== "number" || !Number.isFinite(value[key])) return { valid: false, reason: `Save field '${key}' is missing or invalid.` };
  return { valid: true };
}

export function normalizeManualSaveSlots(value: unknown): Record<string, unknown | null> {
  const slots: Record<string, unknown | null> = { "1": null, "2": null, "3": null };
  if (!isRecord(value)) return slots;
  for (const key of Object.keys(slots)) {
    const candidate = value[key];
    if (candidate === null || candidate === undefined) continue;
    if (checkSaveEnvelope(candidate).valid) slots[key] = candidate;
  }
  return slots;
}

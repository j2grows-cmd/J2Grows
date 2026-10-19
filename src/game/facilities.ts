import type { PlantEnvironment } from "./genetics.ts";

export type FacilityLevels = {
  propagationBench: number;
  environmentalController: number;
};

export type FacilityName = "Propagation bench" | "Environmental controller" | "Analysis workstation";

export const MAX_FACILITY_LEVEL = 3;
const BASE_COST: Record<FacilityName, number> = {
  "Propagation bench": 1200,
  "Environmental controller": 2400,
  "Analysis workstation": 35,
};

export function getFacilityLevel(name: FacilityName, levels: FacilityLevels, analysisEquipmentLevel: number): number {
  if (name === "Propagation bench") return clampLevel(levels.propagationBench);
  if (name === "Environmental controller") return clampLevel(levels.environmentalController);
  return clampLevel(analysisEquipmentLevel);
}

function clampLevel(level: number): number {
  return Number.isFinite(level) ? Math.max(0, Math.min(MAX_FACILITY_LEVEL, Math.floor(level))) : 0;
}

export function nextFacilityUpgradeCost(name: string, levels: FacilityLevels, analysisEquipmentLevel: number): number | null {
  if (!(name in BASE_COST)) return null;
  const facilityName = name as FacilityName;
  const level = getFacilityLevel(facilityName, levels, analysisEquipmentLevel);
  if (level >= MAX_FACILITY_LEVEL) return null;
  return BASE_COST[facilityName] * (level + 1);
}

export function canPurchaseFacilityUpgrade(name: string, levels: FacilityLevels, analysisEquipmentLevel: number, cash: number): boolean {
  const cost = nextFacilityUpgradeCost(name, levels, analysisEquipmentLevel);
  return cost !== null && Number.isFinite(cash) && cash >= cost;
}

export function applyEnvironmentalController(environment: PlantEnvironment, level: number): PlantEnvironment {
  const bonus = clampLevel(level) * 5;
  const improve = (value: number) => Math.max(0, Math.min(100, value + bonus));
  return { ...environment, light: improve(environment.light), nutrition: improve(environment.nutrition), humidity: improve(environment.humidity) };
}

/** Each bench level removes one day from propagation phases, never reducing a phase below one day. */
export function propagationDaysRequired(baseDays: number, benchLevel: number): number {
  const safeBase = Number.isFinite(baseDays) ? Math.max(1, Math.ceil(baseDays)) : 1;
  return Math.max(1, safeBase - clampLevel(benchLevel));
}

export function weeklyFacilityOperatingCost(levels: FacilityLevels, analysisEquipmentLevel: number, routineAutomationUnlocked: boolean): number {
  return clampLevel(analysisEquipmentLevel) * 5 + clampLevel(levels.propagationBench) * 3 + clampLevel(levels.environmentalController) * 5 + (routineAutomationUnlocked ? 10 : 0);
}

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, Beaker, Bell,
  BookOpen, Building2, Check, ChevronDown, ChevronRight, Database, Gamepad2,
  CircleDollarSign, Clock3, Droplets, FlaskConical, Flower2, Gauge, Home, Leaf,
  Menu, Microscope, Plus, Search, Settings, ShieldCheck, ShoppingBag,
  Sprout, Sun, Thermometer, TrendingUp, Users, Wallet, X, Zap
} from "lucide-react";
import { findSpecies, initialSpecimens, setSpeciesCatalog, species as prototypeSpecies, type Species, type Specimen } from "./data";
import { createUniqueSpecimenId } from "./game/specimen-id.ts";
import { createEventRandom } from "./game/random.ts";
import { assessCrossEligibility, createBreedingIdentity } from "./game/breeding.ts";
import { advanceEstablishedGrowthStage, advancePropagationPhase, calculateDailyHealth } from "./game/simulation.ts";
import { applyEnvironmentalController, canPurchaseFacilityUpgrade, nextFacilityUpgradeCost, normalizeFacilityLevels, weeklyFacilityOperatingCost, type FacilityLevels, type FacilityName } from "./game/facilities.ts";
import { advanceStaffDay, canStartStaffTraining, DEFAULT_STAFF_STATE, effectiveStaffCareCondition, normalizeStaffState, startStaffTraining, STAFF_TRAINING_COST, weeklyStaffOperatingCost, type StaffState } from "./game/staff.ts";
import { getFallbackArtworkType } from "./game/plant-artwork.ts";
import { canCreateOffset } from "./game/propagation-eligibility.ts";
import { checkSaveEnvelope, isRecord, normalizeBreedingProjectRelations, normalizeManualSaveSlots, normalizeSpecimens } from "./game/save-validation.ts";
import { loadSpeciesCatalog } from "./supabase";
import { getArtworkStatusSummary, getCatalogueSourceLabel, type ArtworkState, type CatalogueSource } from "./game/catalogue-status";
import { auditSpeciesEconomy, getSpeciesEconomy, getShopAvailability, STARTING_CASH, type RarityTier } from "./game/catalog";
import { estimateRecoverySales, projectOperatingCash } from "./game/economy.ts";
import { analyseGenetics, createMutation, createSpecimenGenetics, growVariegation, observePlant, calculateSpecimenValue, DEFAULT_ENVIRONMENT, type PlantEnvironment, type SpecimenGenetics } from "./game/genetics";
import { applyTraitTargeting, breedingDurationDays, breedingFailureChance, calculateBreedingCost, calculateTargetedBreedingCost, calculateTargetedFailureChance, canBreed, inheritTraits, mutationOccurs, type BreedingProject, type TargetableTrait, RESEARCH_TREE, canUnlockResearch, unlockResearch, assessMutationStability } from "./game/progression";

type PropagationMethod = "cutting" | "division" | "corm" | "tissue-culture";

function propagationCost(method: PropagationMethod, rarity: RarityTier): number {
  const costs: Record<PropagationMethod, Record<RarityTier, number>> = {
    division: { Common: 2, Uncommon: 3, Rare: 4, "Very Rare": 5, "Ultra Rare": 7, Mythic: 10 },
    corm: { Common: 2, Uncommon: 3, Rare: 4, "Very Rare": 5, "Ultra Rare": 7, Mythic: 10 },
    cutting: { Common: 4, Uncommon: 5, Rare: 7, "Very Rare": 10, "Ultra Rare": 12, Mythic: 15 },
    "tissue-culture": { Common: 10, Uncommon: 15, Rare: 20, "Very Rare": 30, "Ultra Rare": 40, Mythic: 60 },
  };
  return costs[method][rarity];
}

type Page = "Dashboard" | "Plant Catalogue" | "Specimen Record" | "Breeding" | "Research" | "Greenhouse" | "Facilities" | "Staff" | "Shop" | "Finances" | "Settings";
const nav: { label: Page; icon: typeof Home }[] = [
  { label: "Dashboard", icon: Home }, { label: "Plant Catalogue", icon: Sprout },
  { label: "Breeding", icon: Flower2 }, { label: "Research", icon: FlaskConical },
  { label: "Greenhouse", icon: Leaf }, { label: "Facilities", icon: Building2 },
  { label: "Staff", icon: Users }, { label: "Shop", icon: ShoppingBag }, { label: "Finances", icon: CircleDollarSign },
];

function money(value: number) {
  let compact = false;
  try { compact = (JSON.parse(localStorage.getItem("j2grows.preferences.v1") || "{}") as Partial<UserPreferences>).compactNumbers === true; } catch { /* Use full values when preferences cannot be read. */ }
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: compact ? 1 : 0, notation: compact ? "compact" : "standard", compactDisplay: "short" }).format(value);
}

function PlantArt({ type, large = false, fallbackType = "hero", onImageStatus }: { type: string; large?: boolean; fallbackType?: string; onImageStatus?: (status: "loaded" | "fallback") => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => { setImageFailed(false); }, [type]);
  const isUrl = type.startsWith("https://") || type.startsWith("http://");
  if (isUrl && !imageFailed) {
    return <div className={`plant-art ${large ? "plant-art-large" : ""}`} role="img" aria-label="Plant species image"><img src={type} alt="" loading="lazy" onLoad={() => onImageStatus?.("loaded")} onError={() => { setImageFailed(true); onImageStatus?.("fallback"); }} /></div>;
  }
  const artworkType = isUrl ? fallbackType : type;
  return <div className={`plant-art art-${artworkType} ${large ? "plant-art-large" : ""}`} aria-label="Botanical plant artwork">
    <span className="art-leaf leaf-one" /><span className="art-leaf leaf-two" /><span className="art-leaf leaf-three" /><span className="art-leaf leaf-four" /><span className="art-stem" />
    <span className="art-vein vein-one" /><span className="art-vein vein-two" /><span className="art-vein vein-three" />
    <span className="art-glow" />
  </div>;
}

function Metric({ label, value, detail, icon: Icon, tone = "green" }: { label: string; value: string; detail: string; icon: typeof Leaf; tone?: string }) {
  return <div className="metric-card"><div className={`metric-icon tone-${tone}`}><Icon size={19} /></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>;
}

type GameSave = {
  version: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  simulationSeed: string;
  specimens: Specimen[];
  breedingProjects: BreedingProject[];
  cash: number;
  research: number;
  day: number;
  projectStarted: boolean;
  analysisTargetSpecimenId?: string;
  analysisStartedDay?: number;
  savedAt: number;
  analysisEquipmentLevel: number;
  greenhouseEnvironment?: PlantEnvironment;
  researchUnlocks?: string[];
  facilityLevels?: FacilityLevels;
  staffState?: StaffState;
  offlineProgressEnabled?: boolean;
};

const TUTORIAL_SHOP_PLANTS: Species[] = [
  { id: "alocasia-polly", name: "Alocasia Polly", latin: "Alocasia × amazonica", family: "Araceae", difficulty: "Moderate", rarity: "Common", basePrice: 15, image: "alocasia", summary: "A compact Alocasia with dramatic arrow-shaped leaves and contrasting pale veins.", light: "Bright, indirect", humidity: "60–80%", water: "Keep lightly moist, never waterlogged", traits: ["Arrow-shaped leaves", "Contrasting veins", "Compact growth"] },
  { id: "anthurium-magnificum", name: "Anthurium Magnificum", latin: "Anthurium magnificum", family: "Araceae", difficulty: "Moderate", rarity: "Uncommon", basePrice: 20, image: "anthurium", summary: "A velvety Anthurium with large heart-shaped leaves and striking pale veins.", light: "Bright, indirect", humidity: "60–80%", water: "Allow the upper mix to partly dry", traits: ["Velvety leaves", "Large foliage", "Prominent veins"] },
  { id: "monstera-adansonii", name: "Monstera Adansonii", latin: "Monstera adansonii", family: "Araceae", difficulty: "Easy", rarity: "Common", basePrice: 15, image: "monstera", summary: "A climbing Monstera with distinctive fenestrated leaves.", light: "Bright, indirect", humidity: "50–70%", water: "Water when the upper mix begins to dry", traits: ["Fenestrated leaves", "Climbing", "Fast-growing"] },
  { id: "philodendron-birkin", name: "Philodendron Birkin", latin: "Philodendron 'Birkin'", family: "Araceae", difficulty: "Easy", rarity: "Uncommon", basePrice: 18, image: "philodendron", summary: "A compact Philodendron with elegant pale pinstripes.", light: "Bright, indirect", humidity: "50–70%", water: "Water when the upper mix begins to dry", traits: ["Pinstriped leaves", "Compact growth", "Upright habit"] },
];

type UserPreferences = {
  masterVolume: number; musicVolume: number; effectsVolume: number; muted: boolean;
  visualQuality: "high" | "balanced" | "low"; uiScale: number; reducedMotion: boolean; highContrast: boolean;
  showTutorial: boolean; confirmNewGame: boolean; compactNumbers: boolean; notifications: boolean;
};
const PREFERENCES_KEY = "j2grows.preferences.v1";
const DEFAULT_PREFERENCES: UserPreferences = { masterVolume: 80, musicVolume: 65, effectsVolume: 85, muted: false, visualQuality: "high", uiScale: 100, reducedMotion: false, highContrast: false, showTutorial: true, confirmNewGame: true, compactNumbers: false, notifications: true };
function clampPreference(value: unknown, fallback: number, min: number, max: number): number { const numeric=typeof value==="number"?value:Number(value); return Number.isFinite(numeric)?Math.max(min,Math.min(max,numeric)):fallback; }

function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const saved = JSON.parse(raw) as Partial<UserPreferences>;
    return { ...DEFAULT_PREFERENCES, ...saved, masterVolume: Math.max(0, Math.min(100, Number(saved.masterVolume ?? 80))), musicVolume: Math.max(0, Math.min(100, Number(saved.musicVolume ?? 65))), effectsVolume: Math.max(0, Math.min(100, Number(saved.effectsVolume ?? 85))), uiScale: Math.max(80, Math.min(120, Number(saved.uiScale ?? 100))), visualQuality: ["high","balanced","low"].includes(String(saved.visualQuality)) ? saved.visualQuality as UserPreferences["visualQuality"] : "high" };
  } catch { return DEFAULT_PREFERENCES; }
}

const SAVE_KEY = "j2grows.prototype.save.v1";

const SAVE_BACKUP_KEY = `${SAVE_KEY}.recovery-backup`;

function backupRawSave(raw: string, reason: string) {
  try {
    localStorage.setItem(SAVE_BACKUP_KEY, JSON.stringify({ backedUpAt: Date.now(), reason, raw }));
  } catch { /* Recovery still proceeds if browser storage is full/unavailable. */ }
}

function freshGameSave(recoveryNotice = ""): GameSave & { offlineDays: number; recoveryNotice: string } {
  return { version: 9, simulationSeed: `j2grows-${Date.now().toString(36)}`, specimens: [], breedingProjects: [], cash: STARTING_CASH, research: 0, day: 1, projectStarted: false, savedAt: Date.now(), analysisEquipmentLevel: 0, greenhouseEnvironment: { ...DEFAULT_ENVIRONMENT }, facilityLevels: { propagationBench: 0, environmentalController: 0 }, staffState: { ...DEFAULT_STAFF_STATE }, offlineProgressEnabled: false, offlineDays: 0, recoveryNotice };
}

function loadGameSave(): GameSave & { offlineDays: number; recoveryNotice: string } {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return freshGameSave();
    let parsed: unknown;
    try { parsed = JSON.parse(raw) as unknown; }
    catch {
      backupRawSave(raw, "The autosave was not valid JSON.");
      return freshGameSave("Your autosave was damaged. A recovery backup was saved and a fresh game was started.");
    }
    const envelope = checkSaveEnvelope(parsed);
    if (!envelope.valid || !isRecord(parsed)) {
      backupRawSave(raw, envelope.reason ?? "The autosave structure was invalid.");
      return freshGameSave("Your autosave could not be safely loaded. A recovery backup was saved and a fresh game was started.");
    }
    const recovered = normalizeSpecimens(parsed.specimens);
    const projectRecovery = normalizeBreedingProjectRelations(recovered.specimens, parsed.breedingProjects);
    recovered.specimens = projectRecovery.specimens;
    const validProjects = projectRecovery.projects;
    const droppedProjects = projectRecovery.dropped;
    const offlineProgressEnabled = false;
    const offlineDays = 0;
    const simulationSeed = typeof parsed.simulationSeed === "string" && parsed.simulationSeed.length > 0 ? parsed.simulationSeed : `migrated-${String(parsed.savedAt)}-${String(parsed.day)}`;
    const savedFacilityLevels = normalizeFacilityLevels(parsed.facilityLevels as unknown as Partial<FacilityLevels> | null | undefined);
    const savedStaffState = normalizeStaffState(parsed.staffState as unknown as Partial<StaffState> | null | undefined);
    const noticeParts: string[] = [];
    if (recovered.dropped || recovered.repaired || droppedProjects || projectRecovery.repaired) {
      backupRawSave(raw, `Recovered save: skipped ${recovered.dropped} invalid/duplicate specimen(s), repaired ${recovered.repaired} specimen(s), and skipped ${droppedProjects} invalid breeding project(s), repaired ${projectRecovery.repaired} relationship(s).`);
      if (recovered.dropped) noticeParts.push(`${recovered.dropped} invalid specimen(s) skipped`);
      if (recovered.repaired) noticeParts.push(`${recovered.repaired} specimen(s) repaired`);
      if (droppedProjects) noticeParts.push(`${droppedProjects} invalid breeding project(s) skipped`);
      if (projectRecovery.repaired) noticeParts.push(`${projectRecovery.repaired} breeding relationship(s) repaired`);
    }
    const cash = Math.min(1_000_000_000, Math.max(0, parsed.cash as number));
    const research = Math.min(1_000_000_000, Math.max(0, parsed.research as number));
    const day = Math.min(1_000_000_000, Math.max(1, Math.floor(parsed.day as number)));
    if (cash !== parsed.cash || research !== parsed.research || day !== parsed.day) {
      backupRawSave(raw, "Recovered save with out-of-range cash, research or day values.");
      noticeParts.push("invalid economy/day values were clamped");
    }
    const analysisStartedDay = typeof parsed.analysisStartedDay === "number" && Number.isFinite(parsed.analysisStartedDay) && day - parsed.analysisStartedDay < 3 ? Math.max(1, Math.floor(parsed.analysisStartedDay)) : undefined;
    const analysisTargetSpecimenId = typeof parsed.analysisTargetSpecimenId === "string" && recovered.specimens.some((item) => item.id === parsed.analysisTargetSpecimenId) && analysisStartedDay !== undefined ? parsed.analysisTargetSpecimenId : undefined;
    const projectStarted = Boolean(parsed.projectStarted && analysisTargetSpecimenId && analysisStartedDay !== undefined);
    const recoveryNotice = noticeParts.length ? `Save recovery completed: ${noticeParts.join("; ")}. A backup of the original save was retained in this browser.` : "";
    return {
      version: 9,
      simulationSeed,
      specimens: recovered.specimens,
      breedingProjects: validProjects as unknown as BreedingProject[],
      researchUnlocks: Array.isArray(parsed.researchUnlocks) ? parsed.researchUnlocks.filter((item): item is string => typeof item === "string") : [],
      cash, research, day, projectStarted, analysisTargetSpecimenId, analysisStartedDay,
      savedAt: Date.now(),
      analysisEquipmentLevel: typeof parsed.analysisEquipmentLevel === "number" && Number.isFinite(parsed.analysisEquipmentLevel) ? Math.max(0, Math.min(3, Math.floor(parsed.analysisEquipmentLevel))) : 0,
      greenhouseEnvironment: isRecord(parsed.greenhouseEnvironment) ? {
        light: typeof parsed.greenhouseEnvironment.light === "number" && Number.isFinite(parsed.greenhouseEnvironment.light) ? Math.max(0, Math.min(100, parsed.greenhouseEnvironment.light)) : DEFAULT_ENVIRONMENT.light,
        nutrition: typeof parsed.greenhouseEnvironment.nutrition === "number" && Number.isFinite(parsed.greenhouseEnvironment.nutrition) ? Math.max(0, Math.min(100, parsed.greenhouseEnvironment.nutrition)) : DEFAULT_ENVIRONMENT.nutrition,
        humidity: typeof parsed.greenhouseEnvironment.humidity === "number" && Number.isFinite(parsed.greenhouseEnvironment.humidity) ? Math.max(0, Math.min(100, parsed.greenhouseEnvironment.humidity)) : DEFAULT_ENVIRONMENT.humidity,
        health: typeof parsed.greenhouseEnvironment.health === "number" && Number.isFinite(parsed.greenhouseEnvironment.health) ? Math.max(0, Math.min(100, parsed.greenhouseEnvironment.health)) : DEFAULT_ENVIRONMENT.health,
      } : { ...DEFAULT_ENVIRONMENT },
      facilityLevels: savedFacilityLevels, staffState: savedStaffState, offlineProgressEnabled, offlineDays, recoveryNotice,
    };
  } catch {
    if (raw) backupRawSave(raw, "The autosave could not be read safely.");
    return freshGameSave(raw ? "Your autosave could not be read safely. A recovery backup was saved and a fresh game was started." : "");
  }
}
function App() {
  const loadedSave = useMemo(() => loadGameSave(), []);
  const [catalogSpecies, setCatalogSpecies] = useState<Species[]>(prototypeSpecies);
  const tutorialShopSpecies = useMemo(() => TUTORIAL_SHOP_PLANTS.map((fallback) => catalogSpecies.find((plant) => plant.id === fallback.id || plant.name.toLowerCase() === fallback.name.toLowerCase()) ?? fallback), [catalogSpecies]);
  const [catalogSource, setCatalogSource] = useState<CatalogueSource>("local");
  useEffect(() => {
    let cancelled = false;
    loadSpeciesCatalog().then((catalog) => {
      if (cancelled) return;
      setSpeciesCatalog(catalog.species);
      setCatalogSpecies(catalog.species);
      setCatalogSource(catalog.source);
    });
    return () => { cancelled = true; };
  }, []);
  const [page, setPage] = useState<Page>("Dashboard");
  const [mainMenuOpen, setMainMenuOpen] = useState(true);
  const [mainMenuSettingsOpen, setMainMenuSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"Audio" | "Graphics & Display" | "Accessibility" | "Gameplay" | "Data & System">("Audio");
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences());
  const [audioTestMessage, setAudioTestMessage] = useState("");
  useEffect(() => { try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)); } catch { /* Settings remain active for this session if storage is unavailable. */ } }, [preferences]);
  useEffect(() => { document.documentElement.style.setProperty("--j2g-ui-scale", String(preferences.uiScale / 100)); document.documentElement.style.zoom = String(preferences.uiScale / 100); document.documentElement.classList.toggle("j2g-reduced-motion", preferences.reducedMotion); document.documentElement.classList.toggle("j2g-high-contrast", preferences.highContrast); document.documentElement.dataset.visualQuality = preferences.visualQuality; return () => { document.documentElement.style.removeProperty("--j2g-ui-scale"); document.documentElement.style.removeProperty("zoom"); document.documentElement.classList.remove("j2g-reduced-motion", "j2g-high-contrast"); delete document.documentElement.dataset.visualQuality; }; }, [preferences.uiScale, preferences.reducedMotion, preferences.highContrast, preferences.visualQuality]);
  const [specimens, setSpecimens] = useState<Specimen[]>(loadedSave.specimens.map((specimen) => ({ ...specimen, genetics: specimen.genetics ?? createSpecimenGenetics(specimen.variegation, createEventRandom(loadedSave.simulationSeed, "save-migration:" + specimen.id)) })));
  const [breedingProjects, setBreedingProjects] = useState<BreedingProject[]>(loadedSave.breedingProjects ?? []);
  const [researchUnlocks, setResearchUnlocks] = useState<string[]>(loadedSave.researchUnlocks ?? []);
  const [cash, setCash] = useState(loadedSave.cash);
  const [research, setResearch] = useState(loadedSave.research);
  const [greenhouseEnvironment, setGreenhouseEnvironment] = useState<PlantEnvironment>(loadedSave.greenhouseEnvironment ?? { ...DEFAULT_ENVIRONMENT });
  const [facilityLevels, setFacilityLevels] = useState<FacilityLevels>(loadedSave.facilityLevels ?? { propagationBench: 0, environmentalController: 0 });
  const [staffState, setStaffState] = useState<StaffState>(normalizeStaffState(loadedSave.staffState));
  const [simulationSeed, setSimulationSeed] = useState(loadedSave.simulationSeed);
  const [saveSlots, setSaveSlots] = useState<Record<string, GameSave | null>>(() => {
    const slotsKey = "j2grows.manual-save-slots.v1";
    try {
      const raw = localStorage.getItem(slotsKey);
      if (!raw) return { "1": null, "2": null, "3": null };
      const parsed: unknown = JSON.parse(raw);
      const normalized = normalizeManualSaveSlots(parsed);
      if (!isRecord(parsed) || JSON.stringify(normalized) !== JSON.stringify(parsed)) {
        try { localStorage.setItem(`${slotsKey}.recovery-backup`, JSON.stringify({ backedUpAt: Date.now(), raw, reason: "One or more manual save slots were malformed." })); } catch { /* Keep usable slots even if backup storage fails. */ }
      }
      return normalized as Record<string, GameSave | null>;
    } catch {
      try { const raw = localStorage.getItem(slotsKey); if (raw) localStorage.setItem(`${slotsKey}.recovery-backup`, JSON.stringify({ backedUpAt: Date.now(), raw, reason: "Manual save slots were not valid JSON." })); } catch { /* Recovery remains available in memory. */ }
      return { "1": null, "2": null, "3": null };
    }
  });
  const [day, setDay] = useState(loadedSave.day);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All plants");
  const [selected, setSelected] = useState<string>(initialSpecimens[0].id);
  const [notice, setNotice] = useState(loadedSave.recoveryNotice || (loadedSave.offlineDays > 0 ? `Welcome back. ${loadedSave.offlineDays} simulated day(s) of eligible offline progress applied.` : ""));
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [projectStarted, setProjectStarted] = useState(loadedSave.projectStarted);
  const [analysisTargetSpecimenId, setAnalysisTargetSpecimenId] = useState<string | undefined>(loadedSave.analysisTargetSpecimenId);
  const [analysisStartedDay, setAnalysisStartedDay] = useState<number | undefined>(loadedSave.analysisStartedDay);
  const [analysisEquipmentLevel, setAnalysisEquipmentLevel] = useState(loadedSave.analysisEquipmentLevel);
  const [showMenu, setShowMenu] = useState(false);
  const [instituteName, setInstituteName] = useState(() => {
    try { return localStorage.getItem("j2grows.institute.name.v1") || ""; } catch { return ""; }
  });
  const [instituteNameDraft, setInstituteNameDraft] = useState(() => {
    try { return localStorage.getItem("j2grows.institute.name.v1") || ""; } catch { return ""; }
  });
  const tutorialSteps: { page: Page; title: string; body: string; tip: string }[] = [
    { page: "Dashboard", title: "Name your institute", body: "Every great botanical institution starts with a name. Choose one that will appear throughout your nursery.", tip: "You can change this later by replaying the introduction or through the institution settings." },
    { page: "Shop", title: "Acquire your first plant", body: "Choose an affordable plant from today’s shop stock. It becomes your first living specimen and source for your first propagation.", tip: "Compare the base price with your available funds before choosing a plant." },
    { page: "Specimen Record", title: "Practise propagation", body: "Use the protected mature demonstration plant to practise propagation straight away. Your ordinary shop purchase remains juvenile, and every normal corm or cutting still requires a mature parent.", tip: "Stem cuttings reset their parent to juvenile and trigger recovery. The demonstration plant is protected so it cannot be accidentally sold." },
    { page: "Greenhouse", title: "Give your new plant time to establish", body: "Advance one simulated day to let your new specimen establish and record its first growth cycle.", tip: "Growing conditions affect new growth, but they do not guarantee a particular outcome." },
    { page: "Specimen Record", title: "Record your first observation", body: "Record the new growth on your propagated plant. Observations build research evidence and help reveal variegation stability over time.", tip: "Mutations are rare and not guaranteed. Research improves your understanding rather than forcing a result." },
  ];
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialOpen, setTutorialOpen] = useState(() => {
    try { return loadPreferences().showTutorial && localStorage.getItem("j2grows.tutorial.completed.v1") !== "true"; }
    catch { return true; }
  });
  useEffect(() => {
    if (!tutorialOpen) return;
    const handleTutorialKey = (event: KeyboardEvent) => { if (event.key === "Escape") finishTutorial(); };
    window.addEventListener("keydown", handleTutorialKey);
    return () => window.removeEventListener("keydown", handleTutorialKey);
  }, [tutorialOpen]);
  useEffect(() => {
    if (!tutorialOpen) return;
    document.querySelectorAll(".tutorial-spotlight-target").forEach((element) => element.classList.remove("tutorial-spotlight-target"));
    const navTarget = (label: string) => Array.from(document.querySelectorAll(".nav-item")).find((element) => element.textContent?.trim() === label) ?? null;
    const cardTarget = (nickname: string) => Array.from(document.querySelectorAll(".catalogue-card")).find((element) => element.textContent?.includes(nickname))?.querySelector(".catalogue-art-button") ?? null;
    const pageTarget = tutorialStep === 0
      ? document.querySelector(".tutorial-inline-name")
      : tutorialStep === 1
        ? page === "Shop" ? document.querySelector(".shop-listing .button-primary:not(:disabled)") : navTarget("Shop")
        : tutorialStep === 2
          ? page === "Specimen Record"
            ? Array.from(document.querySelectorAll(".detail-section")).find((element) => element.querySelector("h3")?.textContent?.includes("Propagation methods"))?.querySelector(".propagation-actions button") ?? null
            : page === "Plant Catalogue" ? cardTarget("Tutorial Demonstration") : navTarget("Plant Catalogue")
          : tutorialStep === 3
            ? page === "Greenhouse" ? document.querySelector(".season-card button") : navTarget("Greenhouse")
            : page === "Specimen Record"
              ? document.querySelector(".detail-section .propagation-actions button:first-child")
              : page === "Plant Catalogue" ? cardTarget("First Cutting") ?? cardTarget("First Corm") : navTarget("Plant Catalogue");
    const shopStockPanel = tutorialStep === 1 && page === "Shop"
      ? document.querySelector(".page-content section.panel .shop-listing")?.closest("section.panel") ?? null
      : null;
    const shopRows = shopStockPanel
      ? Array.from(shopStockPanel.querySelectorAll(".shop-listing"))
      : [];
    const shopPriceTargets = shopStockPanel
      ? Array.from(shopStockPanel.querySelectorAll(".tutorial-shop-price"))
      : [];
    const shopBuyTargets = shopStockPanel
      ? Array.from(shopStockPanel.querySelectorAll(".shop-listing .button-primary"))
      : [];
    const shopTargets = [...shopPriceTargets, ...shopBuyTargets];
    const highlightTargets: Element[] = shopTargets.length ? shopTargets : pageTarget ? [pageTarget] : [];
    const target = shopPriceTargets[0] ?? shopBuyTargets[0] ?? pageTarget ?? document.querySelector(".tutorial-footer .button-primary");
    if (!target) return;
    shopRows.forEach((element) => element.classList.add("tutorial-spotlight-clear"));
    highlightTargets.forEach((element) => element.classList.add("tutorial-spotlight-target"));
    if (tutorialStep > 0) target.scrollIntoView({ block: "center", behavior: "smooth" });
    const guide = document.querySelector(".tutorial-dialog") as HTMLElement | null;
    if (guide) {
      guide.style.position = "fixed";
      guide.style.left = "0";
      guide.style.right = "auto";
      guide.style.top = "0";
      guide.style.bottom = "auto";
      const guideWidth = guide.offsetWidth;
      const guideHeight = guide.offsetHeight;
      const gap = 14;
      const margin = 12;
      let left: number;
      let top: number;
      if (shopStockPanel && shopPriceTargets.length) {
        const firstPrice = shopPriceTargets[0].getBoundingClientRect();
        const lastPrice = shopPriceTargets[shopPriceTargets.length - 1].getBoundingClientRect();
        left = firstPrice.left - guideWidth - gap;
        top = (firstPrice.top + lastPrice.bottom - guideHeight) / 2;
        left = Math.max(margin, Math.min(window.innerWidth - guideWidth - margin, left));
      } else if (shopStockPanel) {
        const panelRect = shopStockPanel.getBoundingClientRect();
        left = Math.max(margin, Math.min(window.innerWidth - guideWidth - margin, panelRect.right - guideWidth));
        top = panelRect.bottom + gap + guideHeight <= window.innerHeight - margin
          ? panelRect.bottom + gap
          : Math.max(margin, panelRect.top - guideHeight - gap);
      } else {
        const rect = target.getBoundingClientRect();
        const rightSpace = window.innerWidth - rect.right - gap;
        const leftSpace = rect.left - gap;
        left = rightSpace >= guideWidth || rightSpace >= leftSpace
          ? rect.right + gap
          : rect.left - guideWidth - gap;
        top = rect.top + rect.height / 2 - guideHeight / 2;
        if (left < margin || left + guideWidth > window.innerWidth - margin) {
          left = Math.max(margin, Math.min(window.innerWidth - guideWidth - margin, rect.left + rect.width / 2 - guideWidth / 2));
          const fitsBelow = rect.bottom + gap + guideHeight <= window.innerHeight - margin;
          top = fitsBelow ? rect.bottom + gap : rect.top - guideHeight - gap;
        }
      }
      top = Math.max(margin, Math.min(window.innerHeight - guideHeight - margin, top));
      guide.style.left = `${left}px`;
      guide.style.top = `${top}px`;
    }
    return () => {
      highlightTargets.forEach((element) => element.classList.remove("tutorial-spotlight-target"));
      shopRows.forEach((element) => element.classList.remove("tutorial-spotlight-clear"));
    };
  }, [tutorialOpen, tutorialStep, page]);
  function saveInstituteName() {
    const name = instituteNameDraft.trim().slice(0, 40);
    if (!name) { announce("Enter a name for your institute to continue."); return; }
    setInstituteName(name);
    setInstituteNameDraft(name);
    try { localStorage.setItem("j2grows.institute.name.v1", name); } catch { /* Keep the name for this session. */ }
    setTutorialStep(1);
    announce(`${name} is ready to grow. Select Shop from the left menu to continue.`);
  }

  function specimenValue(specimen: Specimen, plantName = findSpecies(specimen.speciesId).name): number {
    const economy = getSpeciesEconomy(specimen.speciesId) ?? getSpeciesEconomy(plantName);
    const record = specimen.genetics ?? createSpecimenGenetics(specimen.variegation, createEventRandom(simulationSeed, "fallback-genetics:" + day + ":" + specimen.id));
    const calculated = calculateSpecimenValue({
      basePrice: economy?.basePrice ?? findSpecies(specimen.speciesId).basePrice ?? 15,
      health: specimen.health,
      stage: specimen.stage,
      variegationStrength: specimen.variegation,
      stability: record.genetics.stability,
      geneticsBonus: Math.min(2, 1 + Math.max(0, record.genetics.growthPotential - 50) / 100 + ((record.research.analysisLevel >= 2) ? record.genetics.hiddenPotential / 200 : 0)),
      discoveryBonus: specimen.discovered ? 1.1 : 1,
    });
    if (specimen.purchasePrice !== undefined) {
      const stageMultiplier = specimen.stage === "Mature" ? 1.6 : specimen.stage === "Growing" ? 1.25 : 1;
      return Math.min(calculated, Math.round(specimen.purchasePrice * 0.8 * stageMultiplier));
    }
    return calculated;
  }

  function acquireSpecies(plant: Species, starter = false) {
    const cost = getSpeciesEconomy(plant.id)?.basePrice ?? getSpeciesEconomy(plant.name)?.basePrice ?? plant.basePrice ?? 15;
    if (cash < cost) { announce(`Not enough funds. ${plant.name} costs ${money(cost)}.`); return; }
    const usedIds = new Set(specimens.map((item) => item.id));
    const id = createUniqueSpecimenId(usedIds);
    usedIds.add(id);
    const genetics = createSpecimenGenetics(0, createEventRandom(simulationSeed, "purchase-genetics:" + day + ":" + id));
    const specimen: Specimen = {
      id, speciesId: plant.id, nickname: plant.name, location: "Home greenhouse",
      health: 100, stage: "Juvenile", value: 0, purchasePrice: cost, protected: false,
      variegation: 0, discovered: false, genetics,
    };
    specimen.value = specimenValue(specimen, plant.name);
    setCash((current) => current - cost);
    if (starter) {
      // A protected mature demonstration specimen lets the tutorial teach propagation
      // without bypassing the normal maturity requirement for ordinary shop plants.
      const demoId = createUniqueSpecimenId(usedIds);
      const demonstration: Specimen = {
        ...specimen,
        id: demoId,
        nickname: `Tutorial Demonstration · ${plant.name}`,
        location: "Tutorial Greenhouse",
        health: 100,
        stage: "Mature",
        stageDays: 21,
        value: 0,
        purchasePrice: undefined,
        protected: true,
        propagation: undefined,
        genetics: createSpecimenGenetics(0, createEventRandom(simulationSeed, "tutorial-demo-genetics:" + day + ":" + demoId)),
      };
      demonstration.value = specimenValue(demonstration, plant.name);
      setSpecimens((current) => [...current, specimen, demonstration]);
      setSelected(demoId);
      setTutorialStep(2);
      announce(`${plant.name} acquired. Select Plant Catalogue from the left menu to open the demonstration plant record. A protected mature demonstration plant is ready for the tutorial; normal shop plants remain juvenile.`);
    } else {
      setSpecimens((current) => [...current, specimen]);
      setSelected(id);
      announce(`${plant.name} acquired for ${money(cost)}. Its base price is ${money(cost)}; individual value will change with growth and genetics.`);
    }
  }


  function takeTutorialCutting() {
    const parent = specimens.find((item) => item.id === selected) ?? specimens[0];
    if (!parent) { setTutorialStep(1); announce("Acquire your first plant before propagating it."); return; }
    const existingOffspring = specimens.find((item) => ["First Cutting", "First Corm", "First Mutation"].includes(item.nickname));
    if (existingOffspring) {
      setTutorialStep(3); setSelected(existingOffspring.id); return;
    }
    const genus = findSpecies(parent.speciesId).latin.split(" ")[0].toLowerCase();
    const isAlocasia = genus === "alocasia";
    if (isAlocasia && parent.stage !== "Mature") {
      announce("Alocasia corms can only be harvested from a mature plant. Grow your parent plant to maturity first.");
      setSelected(parent.id); setPage("Specimen Record");
      return;
    }
    const cost = isAlocasia ? 2 : 4;
    if (cash < cost) { announce(`You need ${money(cost)} for propagation supplies.`); return; }
    const tutorialRandom = createEventRandom(simulationSeed, "tutorial-propagation:" + day + ":" + parent.id);
    const offspring: Specimen = {
      id: createUniqueSpecimenId(specimens.map((item) => item.id)),
      speciesId: parent.speciesId, nickname: isAlocasia ? "First Corm" : "First Cutting",
      location: isAlocasia ? "Corm Nursery" : "Propagation Bench",
      health: isAlocasia ? 75 : 85, stage: "Juvenile",
      propagation: isAlocasia ? { method: "corm", phase: "Corm", daysInPhase: 0, daysToSprout: 2 + Math.floor(tutorialRandom() * 4), daysToEstablish: 3 + Math.floor(tutorialRandom() * 3) } : { method: "cutting", phase: "Establishing", daysInPhase: 0, daysToSprout: 0, daysToEstablish: 2 + Math.floor(tutorialRandom() * 3) },
      value: 0,
      protected: false, variegation: parent.variegation, discovered: false, genetics: parent.genetics ? { ...parent.genetics, genetics: { ...parent.genetics.genetics, mutationIds: [...parent.genetics.genetics.mutationIds] }, observations: [], research: { points: 0, observationCount: 0, analysisLevel: 0, discoveredTraits: [], mutations: parent.genetics.research.mutations.map((mutation) => ({ ...mutation, detected: false })) } } : createSpecimenGenetics(parent.variegation, tutorialRandom),
    };
    offspring.value = specimenValue(offspring);
    setCash((current) => current - cost);
    setSpecimens((current) => [...current.map((item) => {
      if (item.id !== parent.id || isAlocasia) return item;
      const recoveringParent: Specimen = {
        ...item,
        stage: "Juvenile",
        stageDays: 0,
        health: Math.max(35, item.health - 15),
        location: "Recovery · Greenhouse",
      };
      recoveringParent.value = specimenValue(recoveringParent);
      return recoveringParent;
    }), offspring]);
    setSelected(offspring.id);
    setTutorialStep(3);
    announce(isAlocasia ? "First Alocasia corm started. Click Greenhouse in the left menu to continue." : "First cutting taken. Click Greenhouse in the left menu to continue.");
  }

  function growTutorialCutting() {
    const cutting = specimens.find((item) => ["First Cutting", "First Corm", "First Mutation"].includes(item.nickname));
    if (!cutting) { setTutorialStep(1); announce("Acquire a plant and propagate it first."); return; }
    const nextSpecimens = advanceDay();
    const nextCutting = nextSpecimens.find((item) => item.id === cutting.id);
    setSelected(cutting.id);
    if (nextCutting?.propagation) {
      setTutorialStep(3);
      announce(nextCutting.propagation.phase === "Corm"
        ? "One day passed. The corm is still establishing; advance another day and check its conditions."
        : "One day passed. A shoot is developing; give it more time to establish.");
      return;
    }
    setTutorialStep(4);
    announce("Your propagated specimen has established. Click Plant Catalogue in the left menu, then open its record to observe it.");
  }

  function recordTutorialObservation() {
    const cutting = specimens.find((item) => ["First Cutting", "First Corm", "First Mutation"].includes(item.nickname));
    if (!cutting) { announce("Propagate your first plant before discovering a mutation."); return; }
    const record = cutting.genetics ?? createSpecimenGenetics(cutting.variegation, createEventRandom(simulationSeed, "cutting-analysis:" + day + ":" + cutting.id));
    const observed = observePlant(record, cutting.variegation, false);
    const updated = { ...cutting, genetics: observed, value: specimenValue(cutting) };
    setSpecimens((current) => current.map((item) => item.id === cutting.id ? updated : item));
    setResearch((current) => current + 2);
    setSelected(cutting.id);
    finishTutorial();
    announce("Growth observation recorded. Research evidence added; future mutations remain rare and uncertain.");
  }

  function finishTutorial() {
    setTutorialOpen(false);
    try { localStorage.setItem("j2grows.tutorial.completed.v1", "true"); } catch { /* Tutorial can still be dismissed for this session. */ }
  }

  useEffect(() => {
    try {
      const save: GameSave = { version: 9, simulationSeed, specimens, breedingProjects, cash, research, day, projectStarted, analysisTargetSpecimenId, analysisStartedDay, analysisEquipmentLevel, greenhouseEnvironment, researchUnlocks, facilityLevels, staffState, offlineProgressEnabled: false, savedAt: Date.now() };
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      setNotice("Local save unavailable. Your progress may not persist in this browser.");
    }
  }, [specimens, breedingProjects, cash, research, day, projectStarted, analysisTargetSpecimenId, analysisStartedDay, analysisEquipmentLevel, greenhouseEnvironment, researchUnlocks, facilityLevels, staffState]);

  useEffect(() => {
    try { localStorage.setItem("j2grows.manual-save-slots.v1", JSON.stringify(saveSlots)); }
    catch { setNotice("Manual save slots could not be written to browser storage."); }
  }, [saveSlots]);

  function saveToSlot(slot: string) {
    const save: GameSave = { version: 9, simulationSeed, specimens, breedingProjects, cash, research, day, projectStarted, analysisTargetSpecimenId, analysisStartedDay, analysisEquipmentLevel, greenhouseEnvironment, researchUnlocks, facilityLevels, staffState, offlineProgressEnabled: false, savedAt: Date.now() };
    setSaveSlots((current) => ({ ...current, [slot]: save }));
    announce(`Saved the current game to slot ${slot}.`);
  }

  function loadFromSlot(slot: string) {
    const save = saveSlots[slot];
    if (!save) { announce(`Save slot ${slot} is empty.`); return; }
    setSpecimens(save.specimens.map((item) => ({ ...item, genetics: item.genetics ?? createSpecimenGenetics(item.variegation, createEventRandom(save.simulationSeed, "manual-load:" + item.id)) })));
    setBreedingProjects(save.breedingProjects ?? []);
    setResearchUnlocks(save.researchUnlocks ?? []);
    setCash(save.cash); setResearch(save.research); setDay(save.day);
    setProjectStarted(Boolean(save.projectStarted && save.analysisTargetSpecimenId && save.analysisStartedDay !== undefined)); setAnalysisTargetSpecimenId(save.analysisTargetSpecimenId); setAnalysisStartedDay(save.analysisStartedDay); setAnalysisEquipmentLevel(Math.max(0, Math.min(3, save.analysisEquipmentLevel ?? 0)));
    setGreenhouseEnvironment(save.greenhouseEnvironment ?? { ...DEFAULT_ENVIRONMENT });
    setFacilityLevels(normalizeFacilityLevels(save.facilityLevels));
    setStaffState(normalizeStaffState(save.staffState));
    setSimulationSeed(typeof save.simulationSeed === "string" ? save.simulationSeed : `migrated-${String(save.savedAt)}-${String(save.day)}`);
    setSelected(save.specimens[0]?.id ?? "");
    announce(`Loaded save slot ${slot}.`);
  }

  const activeSpecimen = specimens.find((item) => item.id === selected) ?? specimens[0];
  const activeSpecies = activeSpecimen ? findSpecies(activeSpecimen.speciesId) : findSpecies(initialSpecimens[0].speciesId);

  const filteredSpecimens = useMemo(() => specimens.filter((specimen) => {
    const plant = findSpecies(specimen.speciesId);
    const matchesQuery = `${plant.name} ${plant.latin} ${specimen.id} ${specimen.nickname}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "All plants" || (filter === "Protected" && specimen.protected) || (filter === "Needs attention" && specimen.health < 80) || (filter === "Ready to sell" && !specimen.protected);
    return matchesQuery && matchesFilter;
  }), [specimens, query, filter]);

  function announce(message: string) {
    setNotice(message);
    if (preferences.notifications) setNotificationsOpen(true);
  }

  function resetGame() {
    const confirmed = window.confirm("Reset J2Grows? This permanently replaces your current local save with a fresh game and cannot be undone.");
    if (!confirmed) return;
    try { localStorage.removeItem(SAVE_KEY); localStorage.setItem("j2grows.tutorial.completed.v1", "true"); } catch { /* State can still reset for this session. */ }
    setSpecimens([]);
    setBreedingProjects([]);
    setResearchUnlocks([]);
    setGreenhouseEnvironment({ ...DEFAULT_ENVIRONMENT });
    setCash(STARTING_CASH);
    setResearch(0);
    setDay(1);
    setProjectStarted(false);
    setAnalysisTargetSpecimenId(undefined);
    setAnalysisStartedDay(undefined);
    setAnalysisEquipmentLevel(0);
    setFacilityLevels({ propagationBench: 0, environmentalController: 0 });
    setStaffState({ ...DEFAULT_STAFF_STATE });
    setSimulationSeed(`j2grows-${Date.now().toString(36)}`);
    setSelected("");
    setInstituteName("");
    setInstituteNameDraft("");
    try { localStorage.removeItem("j2grows.institute.name.v1"); } catch { /* Session state is still reset. */ }
    setQuery("");
    setFilter("All plants");
    setPage("Dashboard");
    setMainMenuOpen(true);
    setTutorialStep(0);
    setTutorialOpen(false);
    setNotice("");
    setNotificationsOpen(false);
  }

  function advanceDay(): Specimen[] {
    const nextDay = day + 1;
    const nextStaffState = advanceStaffDay(staffState);
    let mutationMessage = "";
    const nextSpecimens = specimens.map((specimen) => {
      const random = createEventRandom(simulationSeed, `day:${nextDay}:specimen:${specimen.id}`);
      if (specimen.dead || specimen.health <= 0) return { ...specimen, health: 0, dead: true, value: 0 };
      const simulationEnvironment = applyEnvironmentalController(greenhouseEnvironment, facilityLevels.environmentalController);
      const staffCondition = effectiveStaffCareCondition(simulationEnvironment, nextStaffState);
      const environmentalMean = simulationEnvironment.autoCare ? Math.max(60, staffCondition) : staffCondition;
      const health = calculateDailyHealth(specimen.health, environmentalMean);
      const record = specimen.genetics ?? createSpecimenGenetics(specimen.variegation, createEventRandom(simulationSeed, "fallback-genetics:" + day + ":" + specimen.id));
      const environment = { ...simulationEnvironment, health };
      const growth = growVariegation(record.genetics, environment, specimen.variegation, random);
      let nextRecord: SpecimenGenetics = { ...record, environment, expression: growth.expression };
      let nextVariegation = growth.expression;
      let discovered = specimen.discovered;
      if (mutationOccurs("growth", environment, Math.floor(research / 50), analysisEquipmentLevel * 0.001, random)) {
        const mutation = createMutation(random, { origin: "growth", tissueDistribution: "sectoral", originDay: nextDay });
        mutation.detected = false;
        nextRecord = { ...nextRecord, genetics: { ...nextRecord.genetics, mutationIds: [...new Set([...nextRecord.genetics.mutationIds, mutation.id])] }, research: { ...nextRecord.research, mutations: [...nextRecord.research.mutations, mutation] } };
        if (mutation.category === "colour") { nextVariegation = Math.min(100, Math.max(nextVariegation, 35 + Math.round(random() * 35))); nextRecord = { ...nextRecord, genetics: { ...nextRecord.genetics, variegationPotential: Math.max(nextRecord.genetics.variegationPotential, nextVariegation) } }; }
        mutationMessage += ` A potential ${mutation.category} mutation occurred in ${specimen.nickname}; record observations to confirm it.`;
      }
      let propagation = specimen.propagation;
      let stage = specimen.stage;
      let stageDays = specimen.stageDays ?? 0;
      let location = specimen.location;
      let growthMessage = "";
      const suitability = (simulationEnvironment.light + simulationEnvironment.nutrition + simulationEnvironment.humidity + health) / 4;
      const conditionFactor = suitability < 45 ? 1.5 : suitability < 65 ? 1.2 : suitability >= 85 ? 0.85 : 1;
      const genus = findSpecies(specimen.speciesId).latin.split(" ")[0].toLowerCase();
      const speciesFactor = genus === "anthurium" ? 1.25 : genus === "alocasia" ? 1.1 : ["monstera", "philodendron"].includes(genus) ? 0.9 : 1;
      if (propagation) {
        const delay = suitability < 45 ? 2 : suitability < 65 ? 1 : 0;
        const progress = advancePropagationPhase(propagation, delay, facilityLevels.propagationBench);
        propagation = progress.propagation;
        if (progress.transition === "cutting-rooting") { location = "Propagation Bench · Rooting"; growthMessage = ` ${specimen.nickname} has begun rooting.`; }
        else if (progress.transition === "rooting-new-growth") { location = "Propagation Bench · New Growth"; growthMessage = ` ${specimen.nickname} is showing new growth.`; }
        else if (progress.transition === "corm-sprouting") { location = "Corm Nursery · Sprouting"; growthMessage = ` ${specimen.nickname} has started sprouting.`; }
        else if (progress.transition === "propagation-established") {
          stage = "Juvenile";
          stageDays = 0;
          location = specimen.propagation?.phase === "New Growth" ? "Greenhouse · Establishing" : specimen.propagation?.phase === "Sprouting" ? "Greenhouse · Establishing" : "Greenhouse";
          growthMessage = ` ${specimen.nickname} has established as a juvenile plant.`;
        }
        if (propagation?.phase === "Sprouting") stage = "Juvenile";
      }else {
        const progress = advanceEstablishedGrowthStage(stage, stageDays, health, speciesFactor, conditionFactor);
        stage = progress.stage;
        stageDays = progress.stageDays;
        const transitionMessages = {
          "seedling-established": ` ${specimen.nickname} has established from seedling to juvenile growth.`,
          "juvenile-growing": ` ${specimen.nickname} has entered the growing stage.`,
          "growing-mature": ` ${specimen.nickname} has reached maturity.`,
          "mature-breeding-ready": ` ${specimen.nickname} is now breeding-ready.`,
        };
        growthMessage = progress.transition ? transitionMessages[progress.transition] : "";
      }
      const updated = { ...specimen, health, dead: health <= 0, stage, stageDays, location, propagation, variegation: nextVariegation, discovered, genetics: { ...nextRecord, expression: nextVariegation, environment } };
      if (growthMessage) mutationMessage += growthMessage;
      return { ...updated, value: specimenValue(updated) };
    });
    const activeProjects = breedingProjects.filter((project) => project.status === "active");
    const finishedIds = new Set<string>();
    const completedChildren: Specimen[] = [];
    const completedProjects = activeProjects.map((project) => {
      const random = createEventRandom(simulationSeed, `day:${nextDay}:breeding:${project.id}`);
      if (project.completesOnDay > nextDay) return project;
      const parentA = nextSpecimens.find((item) => item.id === project.parentAId);
      const parentB = nextSpecimens.find((item) => item.id === project.parentBId);
      finishedIds.add(project.id);
      if (!parentA || !parentB || parentA.dead || parentB.dead || parentA.health <= 0 || parentB.health <= 0) {
        mutationMessage += ` Breeding project ${project.id} was cancelled because a parent died; its cost was lost.`;
        return { ...project, status: "cancelled" as const };
      }
      if (random() < project.failureChance) {
        mutationMessage += ` Breeding project ${project.id} failed; its cost was lost, but both parents survived.`;
        return { ...project, status: "cancelled" as const };
      }
      const recordA = parentA.genetics ?? createSpecimenGenetics(parentA.variegation, createEventRandom(simulationSeed, "fallback-genetics:" + day + ":" + parentA.id));
      const recordB = parentB.genetics ?? createSpecimenGenetics(parentB.variegation, createEventRandom(simulationSeed, "fallback-genetics:" + day + ":" + parentB.id));
      const inherited = applyTraitTargeting(inheritTraits(recordA.genetics, recordB.genetics, random), recordA.genetics, recordB.genetics, project.targetTrait, random);
      const generation = Math.max(parentA.generation ?? 0, parentB.generation ?? 0) + 1;
      const inheritedMutationIds = inherited.mutationIds;
      const stabilityGenerations = Object.fromEntries(inheritedMutationIds.map((mutationId) => [mutationId, Math.max(parentA.stabilityGenerations?.[mutationId] ?? 0, parentB.stabilityGenerations?.[mutationId] ?? 0) + 1]));
      const inheritedMutationRecords = [...recordA.research.mutations, ...recordB.research.mutations]
        .filter((mutation, index, all) => inheritedMutationIds.includes(mutation.id) && all.findIndex((candidate) => candidate.id === mutation.id) === index)
        .map((mutation) => ({ ...mutation, detected: false, evidenceCount: 0 }));
      const stableMutationIds = inheritedMutationIds.filter((mutationId) => {
        const mutation = inheritedMutationRecords.find((record) => record.id === mutationId);
        return Boolean(mutation && assessMutationStability(stabilityGenerations[mutationId] ?? 0, mutation.stability).stable);
      });
      const childId = createUniqueSpecimenId([...nextSpecimens, ...completedChildren].map((item) => item.id));
      const childVariation = Math.round(inherited.variegationPotential);
      const child: Specimen = {
        id: childId, speciesId: parentA.speciesId, nickname: `Genetic Line ${generation} · ${completedChildren.length + 1}`,
        location: "Propagation Bench", health: 88, stage: "Corm / Seedling", stageDays: 0,
        geneticLineId: project.lineId, lineParentIds: [parentA.id, parentB.id], generation, stabilityGenerations, stableMutationIds,
        value: 0, protected: false, variegation: childVariation, discovered: false,
        genetics: { ...createSpecimenGenetics(childVariation, random), genetics: inherited, research: { points: 0, observationCount: 0, analysisLevel: 0, discoveredTraits: stableMutationIds.length ? ["multi-generation-stability"] : [], mutations: inheritedMutationRecords } },
      };
      if (mutationOccurs("breeding", child.genetics!.environment, researchUnlocks.includes("mutation-screening") ? 2 : 0, researchUnlocks.includes("mutation-screening") ? 0.01 : 0, random)) {
        const mutation = createMutation(random, { origin: "breeding", tissueDistribution: "whole-plant", originDay: nextDay, parentMutationIds: [...recordA.genetics.mutationIds, ...recordB.genetics.mutationIds] });
        mutation.detected = false;
        child.genetics = { ...child.genetics!, genetics: { ...child.genetics!.genetics, mutationIds: [...new Set([...child.genetics!.genetics.mutationIds, mutation.id])] }, research: { ...child.genetics!.research, mutations: [...child.genetics!.research.mutations, mutation] } };
        mutationMessage += ` A potential mutation appeared in ${child.nickname}; recorded evidence is needed to confirm it.`;
      }
      child.value = specimenValue(child);
      completedChildren.push(child);
      if (researchUnlocks.includes("batch-breeding")) {
        for (let batchIndex = 2; batchIndex <= 3; batchIndex += 1) {
          const batchProfile = applyTraitTargeting(inheritTraits(recordA.genetics, recordB.genetics, random), recordA.genetics, recordB.genetics, project.targetTrait, random);
          const batchChild: Specimen = {
            ...child,
            id: createUniqueSpecimenId([...nextSpecimens, ...completedChildren].map((item) => item.id)),
            nickname: `Genetic Line ${generation} · ${completedChildren.length}`,
            variegation: Math.round(batchProfile.variegationPotential),
            genetics: { ...createSpecimenGenetics(batchProfile.variegationPotential, random), genetics: batchProfile, research: { points: 0, observationCount: 0, analysisLevel: 0, discoveredTraits: [], mutations: inheritedMutationRecords.map((mutation) => ({ ...mutation, detected: false, evidenceCount: 0 })) } },
            stabilityGenerations: { ...stabilityGenerations },
            stableMutationIds: [...stableMutationIds],
          };
          batchChild.value = specimenValue(batchChild);
          completedChildren.push(batchChild);
        }
        mutationMessage += " Batch breeding produced three offspring after the research unlock.";
      }
      mutationMessage += ` Breeding completed: ${child.nickname} was created from both recorded parents.`;
      return { ...project, status: "completed" as const };
    });
    const releasedSpecimens = nextSpecimens.map((item) => item.reservedByProjectId && finishedIds.has(item.reservedByProjectId) ? { ...item, reservedByProjectId: undefined } : item);
    let finalSpecimens = [...releasedSpecimens, ...completedChildren];
    if (projectStarted && analysisTargetSpecimenId && analysisStartedDay !== undefined && nextDay - analysisStartedDay >= 3) {
      const target = finalSpecimens.find((item) => item.id === analysisTargetSpecimenId);
      if (!target || target.dead || target.health <= 0) {
        mutationMessage += " Mutation Analysis could not be completed because its target specimen is no longer available.";
      } else {
        const completedTarget: Specimen = { ...target, mutationAnalysisCompleted: true };
        const record = completedTarget.genetics ?? createSpecimenGenetics(completedTarget.variegation, createEventRandom(simulationSeed, "mutation-analysis-genetics:" + completedTarget.id));
        if (record.genetics.mutationGenePresent) {
          const analysisRandom = createEventRandom(simulationSeed, "mutation-analysis:" + target.id);
          const existingLatent = record.research.mutations.find((candidate) => record.genetics.mutationIds.includes(candidate.id) && !candidate.detected);
          // New saves discover a mutation that already exists in the latent record. Only legacy saves
          // missing a latent record receive a deterministic compatibility record.
          const mutation = existingLatent
            ? { ...existingLatent, detected: true, evidenceCount: Math.max(3, existingLatent.evidenceCount ?? 0) }
            : { ...createMutation(analysisRandom, { origin: "legacy", tissueDistribution: "unknown", originDay: nextDay }), detected: true, evidenceCount: 3 };
          const geneticsRecord = {
            ...record,
            genetics: { ...record.genetics, mutationIds: [...new Set([...record.genetics.mutationIds, mutation.id])] },
            research: {
              ...record.research,
              mutations: [...record.research.mutations.filter((candidate) => candidate.id !== mutation.id), mutation],
              discoveredTraits: [...new Set([...record.research.discoveredTraits, "mutation-details"])],
            },
          };
          completedTarget.genetics = geneticsRecord;
          completedTarget.discovered = true;
          mutationMessage += ` Mutation Analysis confirmed existing ${mutation.name} (${mutation.rarity}) in ${completedTarget.nickname}.`;
        }else {
          mutationMessage += ` Mutation Analysis found no detectable mutation gene in ${completedTarget.nickname}. This specimen cannot be analysed again.`;
        }
        completedTarget.value = specimenValue(completedTarget);
        finalSpecimens = finalSpecimens.map((item) => item.id === completedTarget.id ? completedTarget : item);
      }
      setProjectStarted(false);
      setAnalysisTargetSpecimenId(undefined);
      setAnalysisStartedDay(undefined);
    }
    setStaffState(nextStaffState);
    const weeklyOperatingCost = weeklyFacilityOperatingCost(facilityLevels, analysisEquipmentLevel, researchUnlocks.includes("routine-automation")) + weeklyStaffOperatingCost(nextStaffState);
    if (nextDay % 7 === 0 && weeklyOperatingCost > 0) {
      setCash((current) => current - weeklyOperatingCost);
      mutationMessage += ` Weekly facility operating costs: £${weeklyOperatingCost}.`;
    }
    setDay(nextDay);
    setSpecimens(finalSpecimens);
    setBreedingProjects((current) => current.map((project) => completedProjects.find((finished) => finished.id === project.id) ?? project));
    announce(`Day ${nextDay}: plant growth and conditions were processed. Research comes from recorded events, not time alone.${mutationMessage}`);
    return finalSpecimens;
  }

  function observeSelectedSpecimen() {
    if (!activeSpecimen) return;
    if (activeSpecimen.dead || activeSpecimen.health <= 0) { announce("Dead specimens cannot produce new observation evidence."); return; }
    if (activeSpecimen.lastObservedDay === day) {
      announce(`${activeSpecimen.nickname} has already been observed today. Advance a day before recording another observation.`);
      return;
    }
    const record = activeSpecimen.genetics ?? createSpecimenGenetics(activeSpecimen.variegation, createEventRandom(simulationSeed, "active-specimen-genetics:" + day + ":" + activeSpecimen.id));
    const observed = observePlant(record, activeSpecimen.variegation, researchUnlocks.includes("mutation-screening") && analysisEquipmentLevel > 0);
    const discovered = observed.research.mutations.some((mutation) => mutation.detected);
    const updated = { ...activeSpecimen, genetics: observed, lastObservedDay: day, discovered: Boolean(activeSpecimen.discovered || discovered) };
    updated.value = specimenValue(updated);
    setSpecimens((current) => current.map((item) => item.id === activeSpecimen.id ? updated : item));
    setResearch((current) => current + 2);
    announce(discovered && !activeSpecimen.discovered
      ? `Observation recorded. Sufficient evidence confirmed a mutation in ${activeSpecimen.nickname}.`
      : `Observation recorded for ${activeSpecimen.nickname}. Evidence added to its field record.`);
  }

  function analyseSelectedSpecimen() {
    if (!activeSpecimen) return;
    if (activeSpecimen.dead || activeSpecimen.health <= 0) { announce("Dead specimens cannot undergo further genetic analysis."); return; }
    const record = activeSpecimen.genetics ?? createSpecimenGenetics(activeSpecimen.variegation);
    if (record.research.analysisLevel >= 3) {
      announce(`${activeSpecimen.nickname} has completed all available genetic analysis levels.`);
      return;
    }
    if (record.research.observationCount < 3) { announce("Record at least three observations on this specimen before analysis."); return; }
    const analysisCost = 25;
    if (research < analysisCost) { announce(`Analysis level ${record.research.analysisLevel + 1} costs ${analysisCost} global research points.`); return; }
    if (record.research.points < analysisCost) { announce(`This specimen needs ${analysisCost} evidence points before analysis.`); return; }
    let analysed = analyseGenetics(record, analysisCost);
    if (!analysed) { announce("More recorded specimen evidence is needed before analysis."); return; }
    const equipmentCanConfirmWeakMutations = researchUnlocks.includes("mutation-screening") && analysisEquipmentLevel > 0;
    if (equipmentCanConfirmWeakMutations) {
      analysed = {
        ...analysed,
        research: {
          ...analysed.research,
          mutations: analysed.research.mutations.map((mutation) => mutation.detected || mutation.strength > 20
            ? mutation
            : { ...mutation, detected: true, evidenceCount: Math.max(1, mutation.evidenceCount ?? 0) }),
        },
      };
    }
    setResearch((current) => current - analysisCost);
    setSpecimens((current) => current.map((item) => {
      if (item.id !== activeSpecimen.id) return item;
      const updated = { ...item, genetics: analysed, discovered: Boolean(item.discovered || analysed.research.mutations.some((mutation) => mutation.detected)) };
      return { ...updated, value: specimenValue(updated) };
    }));
    announce(`Analysis complete for ${activeSpecimen.nickname}. Analysis level ${analysed.research.analysisLevel} unlocked.${equipmentCanConfirmWeakMutations ? " Equipped mutation screening confirmed eligible low-strength mutations." : ""}`);
  }

  function purchaseSpecies(plant: Species) {
    acquireSpecies(plant);
  }

  function propagateSpecimen(parent: Specimen, method: PropagationMethod) {
    const plant = findSpecies(parent.speciesId);
    const genus = plant.latin.split(" ")[0].toLowerCase();
    const allowed = !parent.dead && !parent.reservedByProjectId && ((method === "division" && canCreateOffset(parent.stage)) || method === "tissue-culture"
      || (method === "cutting" && ["monstera", "philodendron", "anthurium"].includes(genus) && (parent.stage === "Mature" || parent.stage === "Breeding-ready"))
      || (method === "corm" && genus === "alocasia" && (parent.stage === "Mature" || parent.stage === "Breeding-ready")));
    if (!allowed) {
      announce(method === "division" && !parent.dead && !parent.reservedByProjectId && !canCreateOffset(parent.stage)
        ? "Offsets can only be taken from mature or breeding-ready plants. Grow this specimen to maturity first."
        : method === "cutting"
        ? ["monstera", "philodendron", "anthurium"].includes(genus)
          ? "Stem cuttings can only be taken from a mature plant. Grow this specimen to maturity first."
          : "Stem cuttings are available for Monstera, Philodendron and Anthurium in this game."
        : method === "corm" && genus === "alocasia"
          ? "You can only harvest corms from a mature Alocasia. Grow this plant to maturity first."
          : "Corm propagation is reserved for Alocasia.");
      return;
    }
    if (method === "corm" && parent.lastCormHarvestYear === Math.floor((day - 1) / 365)) { announce("This Alocasia has already yielded a corm this simulation-calendar year."); return; }
    const rarity = (getSpeciesEconomy(plant.id)?.rarity ?? getSpeciesEconomy(plant.name)?.rarity ?? plant.rarity) as Species["rarity"];
    const details: Record<PropagationMethod, { prefix: string; label: string; location: string; health: number; nickname: string }> = {
      cutting: { prefix: "CUT", label: "Cutting", location: "Propagation Bench", health: 85, nickname: "Cutting" },
      division: { prefix: "DIV", label: "Division / offset", location: "Propagation Bench", health: 90, nickname: "Division" },
      corm: { prefix: "COR", label: "Corm", location: "Corm Nursery", health: 75, nickname: "Corm" },
      "tissue-culture": { prefix: "TC", label: "Tissue culture", location: "Tissue Culture Lab", health: 70, nickname: "Tissue Culture" },
    };
    const detail = { ...details[method], cost: propagationCost(method, rarity) };
    const propagationRandom = createEventRandom(simulationSeed, "propagation:" + day + ":" + parent.id + ":" + method + ":" + specimens.length);
    const count = method === "cutting" ? 1 + Math.floor(propagationRandom() * 3) : 1;
    const totalCost = detail.cost * count;
    if (cash < totalCost) { announce(`Not enough funds. ${count > 1 ? `${count} cuttings cost ${money(totalCost)} in total` : `${detail.label} propagation costs ${money(totalCost)}`}.`); return; }
    const usedIds = new Set(specimens.map((item) => item.id));
    const children: Specimen[] = Array.from({ length: count }, (_, index) => {
      const id = createUniqueSpecimenId(usedIds);
      usedIds.add(id);
      const child: Specimen = {
        id,
        speciesId: parent.speciesId,
        nickname: `${plant.name} ${detail.nickname}${count > 1 ? ` ${index + 1}` : ""}`,
        location: detail.location,
        health: detail.health,
        stage: "Juvenile",
        propagation: { method, phase: method === "corm" ? "Corm" : method === "cutting" ? "Cutting" : "Establishing", daysInPhase: 0, daysToSprout: method === "corm" ? 2 + Math.floor(propagationRandom() * 4) : method === "cutting" ? 2 + Math.floor(propagationRandom() * 3) : 0, daysToEstablish: 3 + Math.floor(propagationRandom() * 3), daysToJuvenile: method === "cutting" ? 4 + Math.floor(propagationRandom() * 3) : undefined },
        value: 0,
        protected: false,
        variegation: parent.variegation,
        discovered: false,
        genetics: parent.genetics ? { ...parent.genetics, genetics: { ...parent.genetics.genetics, mutationIds: [...parent.genetics.genetics.mutationIds] }, observations: [], research: { points: 0, observationCount: 0, analysisLevel: 0, discoveredTraits: [], mutations: parent.genetics.research.mutations.map((mutation) => ({ ...mutation, detected: false })) } } : createSpecimenGenetics(parent.variegation, propagationRandom),
      };
      if (mutationOccurs("propagation", child.genetics!.environment, researchUnlocks.includes("propagation-science") ? 1 : 0, researchUnlocks.includes("propagation-science") ? 0.005 : 0, propagationRandom)) {
        const mutation = createMutation(propagationRandom, { origin: "propagation", tissueDistribution: method === "tissue-culture" ? "meristematic" : method === "division" ? "whole-plant" : "sectoral", originDay: day });
        mutation.detected = false;
        child.genetics = { ...child.genetics!, genetics: { ...child.genetics!.genetics, mutationIds: [...new Set([...child.genetics!.genetics.mutationIds, mutation.id])] }, research: { ...child.genetics!.research, mutations: [...child.genetics!.research.mutations, mutation] } };
      }
      child.value = specimenValue(child);
      return child;
    });
    const parentAfterCutting = method === "cutting" ? {
      ...parent,
      stage: "Juvenile" as const,
      stageDays: 0,
      health: Math.max(35, parent.health - 15 * count),
      location: "Recovery · Greenhouse",
      value: 0,
    } : parent;
    if (method === "cutting" || method === "tissue-culture") parentAfterCutting.value = specimenValue(parentAfterCutting);
    setCash((current) => current - totalCost);
    setSpecimens((current) => [...current.filter((item) => item.id !== parent.id), parentAfterCutting, ...children]);
    setSelected(children[0].id);
    announce(method === "cutting"
      ? `Took ${count} cutting${count === 1 ? "" : "s"} for ${money(totalCost)}. ${parent.nickname} is recovering and must regrow before reaching maturity again.`
      : `${detail.label} started for ${money(totalCost)}. ${children[0].nickname} has its own specimen record.`);
  }

  function sellSpecimen(specimen: Specimen) {
    if (projectStarted && analysisTargetSpecimenId === specimen.id) {
      announce("This specimen is reserved for Mutation Analysis and cannot be sold until the project finishes.");
      return;
    }
    if (specimen.protected) {
      announce("This specimen is protected. Remove its protection before selling.");
      return;
    }
    if (specimen.reservedByProjectId) {
      announce("This specimen is reserved by an active breeding project and cannot be sold until the project finishes.");
      return;
    }
    setCash((current) => current + specimen.value);
    const remaining = specimens.filter((item) => item.id !== specimen.id);
    setSpecimens(remaining);
    if (remaining.length > 0) {
      setSelected(remaining[0].id);
    } else {
      setSelected("");
      setPage("Plant Catalogue");
    }
    announce(`${specimen.nickname} sold for ${money(specimen.value)}.`);
  }

  function runCross(parentAId: string, parentBId: string, targetTrait?: TargetableTrait) {
    const parentA = specimens.find((item) => item.id === parentAId);
    const parentB = specimens.find((item) => item.id === parentBId);
    if (!parentA || !parentB || parentA.id === parentB.id) {
      announce("Choose two different available parent specimens.");
      return;
    }
    const speciesA = findSpecies(parentA.speciesId);
    const speciesB = findSpecies(parentB.speciesId);
    const eligibility = assessCrossEligibility(
      { id: parentA.id, genus: speciesA.latin.split(" ")[0], stage: parentA.stage, health: parentA.health, dead: parentA.dead, reserved: Boolean(parentA.reservedByProjectId) },
      { id: parentB.id, genus: speciesB.latin.split(" ")[0], stage: parentB.stage, health: parentB.health, dead: parentB.dead, reserved: Boolean(parentB.reservedByProjectId) },
    );
    if (!eligibility.eligible) { announce(eligibility.reason ?? "These parents cannot be crossed."); return; }
    const rarityA = (getSpeciesEconomy(speciesA.id)?.rarity ?? speciesA.rarity) as RarityTier;
    const rarityB = (getSpeciesEconomy(speciesB.id)?.rarity ?? speciesB.rarity) as RarityTier;
    const targeted = Boolean(targetTrait && researchUnlocks.includes("inheritance-mapping"));
    const baseCost = calculateBreedingCost(rarityA, rarityB, 1, researchUnlocks.includes("selective-breeding") ? 10 : 0);
    const cost = calculateTargetedBreedingCost(baseCost, targeted);
    if (cash < cost) {
      announce(`This breeding project costs ${money(cost)}. You currently have ${money(cash)}.`);
      return;
    }
    const identity = createBreedingIdentity(day, breedingProjects.length + 1, parentA.id, parentB.id);
    const id = identity.projectId;
    const condition = (greenhouseEnvironment.light + greenhouseEnvironment.nutrition + greenhouseEnvironment.humidity + parentA.health + parentB.health) / 5;
    const project: BreedingProject = {
      id, parentAId, parentBId, startedDay: day,
      completesOnDay: day + breedingDurationDays(5, researchUnlocks.includes("selective-breeding") ? 15 : 0),
      cost, status: "active",
      failureChance: calculateTargetedFailureChance(breedingFailureChance(researchUnlocks.includes("selective-breeding") ? 3 : 0, condition), targeted),
      lineId: identity.lineId,
      targetTrait: targeted ? targetTrait : undefined,
    };
    setCash((current) => current - cost);
    setBreedingProjects((current) => [...current, project]);
    setSpecimens((current) => current.map((item) =>
      item.id === parentAId || item.id === parentBId ? { ...item, reservedByProjectId: id } : item
    ));
    announce(`Breeding project started for ${money(cost)}. Parents are reserved until day ${project.completesOnDay}; research can reduce failure risk.`);
  }

  function unlockResearchNode(nodeId: string) {
    const result = unlockResearch(nodeId, { points: research, unlocked: researchUnlocks, completed: researchUnlocks });
    if (!result) { const node = RESEARCH_TREE.find((item) => item.id === nodeId); announce(node ? `Research requires ${node.cost} points and all listed prerequisites.` : "Research node not found."); return; }
    setResearch(result.points); setResearchUnlocks(result.unlocked);
    announce(`Research unlocked: ${nodeId.replaceAll("-", " ")}.`);
  }

  function startResearch(specimenId: string) {
    if (projectStarted) {
      announce("Mutation Analysis is already in progress.");
      return;
    }
    const target = specimens.find((item) => item.id === specimenId);
    if (!target || target.dead || target.health <= 0) {
      announce("Choose a living specimen for Mutation Analysis.");
      return;
    }
    if (target.mutationAnalysisCompleted) {
      announce("Mutation Analysis can only be performed once per specimen.");
      return;
    }
    if (cash < 25) {
      announce("Not enough funds to start Mutation Analysis.");
      return;
    }
    setCash((current) => current - 25);
    setProjectStarted(true);
    setAnalysisTargetSpecimenId(target.id);
    setAnalysisStartedDay(day);
    announce(`Mutation Analysis started for ${target.nickname}. It will finish after 3 in-game days.`);
  }

  const pageTitle = page === "Plant Catalogue" ? "Plant Catalogue" : page === "Specimen Record" ? activeSpecies.name : page;

  if (mainMenuOpen) {
    const hasSave = (() => { try { return Boolean(localStorage.getItem(SAVE_KEY)); } catch { return false; } })();
    const enterGame = (destination: Page = "Dashboard") => { setPage(destination); setMainMenuOpen(false); };
    return <div className="main-menu-screen" style={{ backgroundImage: "linear-gradient(90deg, rgba(5,10,6,.88) 0%, rgba(5,10,6,.56) 48%, rgba(5,10,6,.2) 100%), linear-gradient(0deg, rgba(5,10,6,.72), transparent 48%), url(https://lwaxzivcjzpmmantryor.supabase.co/storage/v1/object/public/Artwork/banner.png)" }}>
      <div className="main-menu-vignette" />
      <header className="main-menu-brand">
        <img src="https://lwaxzivcjzpmmantryor.supabase.co/storage/v1/object/public/Artwork/logo.png" alt="J2Grows" />
        <span>CULTIVATE <i>·</i> BREED <i>·</i> BUILD <i>·</i> DISCOVER</span>
      </header>
      <section className="main-menu-content">
        <div className="main-menu-eyebrow"><span /> BOTANICAL RESEARCH &amp; GENETICS <span /></div>
        <h1>Grow beyond<br /><em>the extraordinary.</em></h1>
        <p>Build your collection. Unlock hidden traits. Cultivate the next generation of botanical discoveries.</p>
        <div className="main-menu-actions">
          <button className="main-menu-primary" onClick={() => enterGame("Dashboard")}><Sprout size={18} /> {hasSave ? "CONTINUE" : "BEGIN YOUR JOURNEY"} <ArrowRight size={17} /></button>
          <button className="main-menu-secondary" onClick={() => { if (!preferences.confirmNewGame || window.confirm("Start a new game? This will replace your current local save.")) { try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(SAVE_BACKUP_KEY); if (preferences.showTutorial) localStorage.removeItem("j2grows.tutorial.completed.v1"); else localStorage.setItem("j2grows.tutorial.completed.v1", "true"); } catch {} window.location.reload(); } }}><Plus size={17} /> NEW GAME</button>
          <div className="main-menu-quicklinks">
            <button onClick={() => enterGame("Greenhouse")}><Leaf size={16} /> Greenhouse</button>
            <button onClick={() => enterGame("Research")}><Microscope size={16} /> Research</button>
            <button onClick={() => setMainMenuSettingsOpen(true)}><Settings size={16} /> Settings</button>
          </div>
        </div>
        <div className="main-menu-footer"><span><span className="main-menu-status-dot" /> YOUR PRIVATE BOTANICAL INSTITUTE</span><span>PROTOTYPE 0.1 <i>·</i> AUTOSAVE ENABLED</span></div>
      </section>
      <div className="main-menu-edition"><span>J2G</span><span>BOTANICAL<br />SIMULATION</span></div>
      {mainMenuSettingsOpen && <div className="main-menu-settings-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMainMenuSettingsOpen(false); }}>
        <section className="main-menu-settings main-menu-settings-expanded" role="dialog" aria-modal="true" aria-labelledby="main-menu-settings-title">
          <div className="main-menu-settings-heading"><div><span>J2GROWS · PRE-GAME CONFIGURATION</span><h2 id="main-menu-settings-title">Settings</h2><p>Your preferences are saved in this browser and apply before you start playing.</p></div><button className="main-menu-settings-close" aria-label="Close settings" onClick={() => setMainMenuSettingsOpen(false)}><X size={19} /></button></div>
          <div className="settings-workspace">
            <nav className="settings-tabs" aria-label="Settings categories">{([{label:"Audio",icon:Zap},{label:"Graphics & Display",icon:Sun},{label:"Accessibility",icon:ShieldCheck},{label:"Gameplay",icon:Gamepad2},{label:"Data & System",icon:Database}] as const).map(({label,icon:Icon}) => <button key={label} className={settingsTab===label?"active":""} onClick={()=>setSettingsTab(label)}><Icon size={17}/><span>{label}</span><ChevronRight size={14}/></button>)}</nav>
            <div className="settings-tab-content">
              {settingsTab==="Audio" && <><div className="settings-category-title"><h3>Audio</h3><p>Control volume preferences and preview your levels.</p></div>
                {([{key:"masterVolume",label:"Master volume",detail:"Overall output level"},{key:"musicVolume",label:"Music volume",detail:"Background music level"},{key:"effectsVolume",label:"Sound effects",detail:"Interface and gameplay effects"}] as const).map(({key,label,detail})=><label className="preference-slider" key={key}><span><strong>{label}</strong><small>{detail}</small></span><input aria-label={label} type="range" min="0" max="100" value={preferences[key]} onChange={e=>setPreferences(p=>({...p,[key]:Number(e.target.value)}))}/><output>{preferences[key]}%</output></label>)}
                <div className="preference-row"><div><strong>Mute audio</strong><small>Silence audio previews and future game audio.</small></div><button className={preferences.muted?"preference-toggle on":"preference-toggle"} role="switch" aria-checked={preferences.muted} onClick={()=>setPreferences(p=>({...p,muted:!p.muted}))}><span/></button></div>
                <div className="settings-audio-test"><button className="main-menu-settings-action" onClick={()=>{ try { const Ctx=window.AudioContext || (window as typeof window & {webkitAudioContext?: typeof AudioContext}).webkitAudioContext; if(!Ctx){setAudioTestMessage("Audio preview is not supported by this browser.");return;} const ctx=new Ctx(); const osc=ctx.createOscillator(); const gain=ctx.createGain(); const volume=preferences.muted?0:(preferences.masterVolume/100)*(preferences.effectsVolume/100)*0.16; osc.type="sine";osc.frequency.value=660;gain.gain.setValueAtTime(volume,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.35);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+0.36);osc.onended=()=>void ctx.close();setAudioTestMessage(volume===0?"Preview played at zero volume because audio is muted or set to 0%.":"Played a short audio test tone."); } catch { setAudioTestMessage("Could not play audio preview. Check browser audio permissions."); }}}><Zap size={15}/> Test sound</button><span>{audioTestMessage || "Use the test tone to check master and effects volume."}</span></div>
                <p className="settings-note">The prototype does not currently contain background music or gameplay sound effects; these levels are saved and the test tone demonstrates your current output settings.</p>
              </>}
              {settingsTab==="Graphics & Display" && <><div className="settings-category-title"><h3>Graphics & Display</h3><p>Adjust the presentation to suit your screen and device.</p></div>
                <div className="preference-row"><div><strong>Fullscreen</strong><small>Use the full browser display area.</small></div><button className="main-menu-settings-action" onClick={()=>{if(!document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(()=>setAudioTestMessage("Fullscreen was blocked by the browser."));else void document.exitFullscreen?.();}}>{typeof document!=="undefined"&&document.fullscreenElement?"Exit fullscreen":"Enter fullscreen"}</button></div>
                <div className="preference-row"><div><strong>Visual effects</strong><small>Lower the decorative animation and shadow workload.</small></div><select value={preferences.visualQuality} onChange={e=>setPreferences(p=>({...p,visualQuality:e.target.value as UserPreferences["visualQuality"]}))}><option value="high">High</option><option value="balanced">Balanced</option><option value="low">Low</option></select></div>
                <label className="preference-slider"><span><strong>Interface scale</strong><small>Scales the game interface</small></span><input type="range" min="80" max="120" step="5" value={preferences.uiScale} onChange={e=>setPreferences(p=>({...p,uiScale:Number(e.target.value)}))}/><output>{preferences.uiScale}%</output></label>
                <p className="settings-note">Resolution is controlled by your browser and display. Interface scale and visual-effects mode apply immediately.</p>
              </>}
              {settingsTab==="Accessibility" && <><div className="settings-category-title"><h3>Accessibility</h3><p>Make the interface more comfortable to read and use.</p></div>
                <div className="preference-row"><div><strong>Reduced motion</strong><small>Disable non-essential transitions and animations.</small></div><button className={preferences.reducedMotion?"preference-toggle on":"preference-toggle"} role="switch" aria-checked={preferences.reducedMotion} onClick={()=>setPreferences(p=>({...p,reducedMotion:!p.reducedMotion}))}><span/></button></div>
                <div className="preference-row"><div><strong>High contrast</strong><small>Strengthen text, borders and control contrast.</small></div><button className={preferences.highContrast?"preference-toggle on":"preference-toggle"} role="switch" aria-checked={preferences.highContrast} onClick={()=>setPreferences(p=>({...p,highContrast:!p.highContrast}))}><span/></button></div>
                <label className="preference-slider"><span><strong>Interface scale</strong><small>Increase or decrease text and controls</small></span><input type="range" min="80" max="120" step="5" value={preferences.uiScale} onChange={e=>setPreferences(p=>({...p,uiScale:Number(e.target.value)}))}/><output>{preferences.uiScale}%</output></label>
              </>}
              {settingsTab==="Gameplay" && <><div className="settings-category-title"><h3>Gameplay</h3><p>Choose how the prototype handles prompts and information.</p></div>
                <div className="preference-row"><div><strong>Show introduction tutorial</strong><small>Allow the first-play guide to appear on a fresh start.</small></div><button className={preferences.showTutorial?"preference-toggle on":"preference-toggle"} role="switch" aria-checked={preferences.showTutorial} onClick={()=>setPreferences(p=>({...p,showTutorial:!p.showTutorial}))}><span/></button></div>
                <div className="preference-row"><div><strong>Confirm starting a new game</strong><small>Ask before replacing your current local save.</small></div><button className={preferences.confirmNewGame?"preference-toggle on":"preference-toggle"} role="switch" aria-checked={preferences.confirmNewGame} onClick={()=>setPreferences(p=>({...p,confirmNewGame:!p.confirmNewGame}))}><span/></button></div>
                <div className="preference-row"><div><strong>Compact large numbers</strong><small>Use abbreviated numbers in economy displays.</small></div><button className={preferences.compactNumbers?"preference-toggle on":"preference-toggle"} role="switch" aria-checked={preferences.compactNumbers} onClick={()=>setPreferences(p=>({...p,compactNumbers:!p.compactNumbers}))}><span/></button></div>
                <div className="preference-row"><div><strong>Gameplay notifications</strong><small>Keep notifications enabled for game events.</small></div><button className={preferences.notifications?"preference-toggle on":"preference-toggle"} role="switch" aria-checked={preferences.notifications} onClick={()=>setPreferences(p=>({...p,notifications:!p.notifications}))}><span/></button></div>
              </>}
              {settingsTab==="Data & System" && <><div className="settings-category-title"><h3>Data & System</h3><p>Manage local preferences and keep a copy of your current save.</p></div>
                <div className="preference-row"><div><strong>Local save</strong><small>Game progress is stored in this browser, not synced between devices.</small></div><span className="settings-live-status">Autosave enabled</span></div>
                <div className="preference-row"><div><strong>Export save backup</strong><small>Download your current game, manual save slots and preferences to a portable JSON file.</small></div><button className="main-menu-settings-action" onClick={()=>{try{const save:GameSave={version:9,simulationSeed,specimens,breedingProjects,cash,research,day,projectStarted,analysisTargetSpecimenId,analysisStartedDay,analysisEquipmentLevel,greenhouseEnvironment,researchUnlocks,facilityLevels,staffState,offlineProgressEnabled:false,savedAt:Date.now()};const payload={format:"j2grows-save-backup",formatVersion:1,exportedAt:new Date().toISOString(),autosave:save,manualSlots:saveSlots,preferences,instituteName,tutorialCompleted:localStorage.getItem("j2grows.tutorial.completed.v1")==="true"};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="j2grows-save-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setAudioTestMessage("Save backup exported. Keep the JSON file somewhere safe.");}catch{setAudioTestMessage("Could not export save data from this browser.");}}}><Database size={15}/> Export backup</button></div>
                <div className="preference-row"><div><strong>Import save backup</strong><small>Restore a J2Grows JSON backup. This replaces the current game and browser save slots.</small></div><label className="main-menu-settings-action import-save-label"><input type="file" accept=".json,application/json" onChange={async e=>{const input=e.currentTarget;const file=input.files?.[0];if(!file)return;try{const parsed:unknown=JSON.parse(await file.text());const envelope=isRecord(parsed)&&parsed.format==="j2grows-save-backup"?parsed.autosave:parsed;const check=checkSaveEnvelope(envelope);if(!check.valid||!isRecord(envelope))throw new Error(check.reason||"Unsupported save file.");const recovered=normalizeSpecimens(envelope.specimens);if(!Array.isArray(envelope.specimens)||recovered.dropped>0||recovered.specimens.length!==envelope.specimens.length)throw new Error("The backup contains invalid or duplicate specimens. Your current save has not been changed.");const relationships=normalizeBreedingProjectRelations(recovered.specimens,envelope.breedingProjects);const projects=relationships.projects;if(!window.confirm("Import this backup and replace the current game save? Export a backup of your current game first if you want to keep it."))return;const save:GameSave={version:9,simulationSeed:typeof envelope.simulationSeed==="string"&&envelope.simulationSeed.length>0?envelope.simulationSeed:`migrated-${String(envelope.savedAt)}-${String(envelope.day)}`,specimens:relationships.specimens.map(item=>({...item,genetics:item.genetics??createSpecimenGenetics(item.variegation,createEventRandom(typeof envelope.simulationSeed==="string"?envelope.simulationSeed:"migrated-"+String(envelope.savedAt)+"-"+String(envelope.day),"import:"+item.id))})),breedingProjects:projects as BreedingProject[],cash:Math.max(0,Math.min(1_000_000_000,Number(envelope.cash))),research:Math.max(0,Math.min(1_000_000_000,Number(envelope.research))),day:Math.max(1,Math.floor(Number(envelope.day))),projectStarted:Boolean(envelope.projectStarted),analysisTargetSpecimenId:typeof envelope.analysisTargetSpecimenId==="string"?envelope.analysisTargetSpecimenId:undefined,analysisStartedDay:typeof envelope.analysisStartedDay==="number"?envelope.analysisStartedDay:undefined,analysisEquipmentLevel:Math.max(0,Math.min(3,Math.floor(Number(envelope.analysisEquipmentLevel)||0))),greenhouseEnvironment:isRecord(envelope.greenhouseEnvironment)?envelope.greenhouseEnvironment as unknown as PlantEnvironment:{...DEFAULT_ENVIRONMENT},researchUnlocks:Array.isArray(envelope.researchUnlocks)?envelope.researchUnlocks.filter((x:unknown):x is string=>typeof x==="string"):[],facilityLevels:normalizeFacilityLevels(isRecord(envelope.facilityLevels)?envelope.facilityLevels as unknown as Partial<FacilityLevels>:undefined),staffState:normalizeStaffState(isRecord(envelope.staffState)?envelope.staffState as unknown as Partial<StaffState>:undefined),offlineProgressEnabled:false,savedAt:Date.now()};if(!Number.isFinite(save.cash)||!Number.isFinite(save.research)||!Number.isFinite(save.day))throw new Error("The backup's economy or day fields are invalid.");const storageKeys=[SAVE_KEY,"j2grows.manual-save-slots.v1",PREFERENCES_KEY,"j2grows.institute.name.v1","j2grows.tutorial.completed.v1"];const previous=new Map(storageKeys.map(key=>[key,localStorage.getItem(key)]));try{const updates=new Map<string,string>([[SAVE_KEY,JSON.stringify(save)]]);if(isRecord(parsed)&&parsed.format==="j2grows-save-backup"){if(parsed.formatVersion!==1)throw new Error("This backup version is not supported.");if(isRecord(parsed.manualSlots))updates.set("j2grows.manual-save-slots.v1",JSON.stringify(normalizeManualSaveSlots(parsed.manualSlots)));if(isRecord(parsed.preferences)){const imported=parsed.preferences;const clean:UserPreferences={masterVolume:clampPreference(imported.masterVolume,DEFAULT_PREFERENCES.masterVolume,0,100),musicVolume:clampPreference(imported.musicVolume,DEFAULT_PREFERENCES.musicVolume,0,100),effectsVolume:clampPreference(imported.effectsVolume,DEFAULT_PREFERENCES.effectsVolume,0,100),muted:typeof imported.muted==="boolean"?imported.muted:DEFAULT_PREFERENCES.muted,visualQuality:["high","balanced","low"].includes(String(imported.visualQuality))?imported.visualQuality as UserPreferences["visualQuality"]:DEFAULT_PREFERENCES.visualQuality,uiScale:clampPreference(imported.uiScale,DEFAULT_PREFERENCES.uiScale,80,120),reducedMotion:typeof imported.reducedMotion==="boolean"?imported.reducedMotion:DEFAULT_PREFERENCES.reducedMotion,highContrast:typeof imported.highContrast==="boolean"?imported.highContrast:DEFAULT_PREFERENCES.highContrast,showTutorial:typeof imported.showTutorial==="boolean"?imported.showTutorial:DEFAULT_PREFERENCES.showTutorial,confirmNewGame:typeof imported.confirmNewGame==="boolean"?imported.confirmNewGame:DEFAULT_PREFERENCES.confirmNewGame,compactNumbers:typeof imported.compactNumbers==="boolean"?imported.compactNumbers:DEFAULT_PREFERENCES.compactNumbers,notifications:typeof imported.notifications==="boolean"?imported.notifications:DEFAULT_PREFERENCES.notifications};updates.set(PREFERENCES_KEY,JSON.stringify(clean));}if(typeof parsed.instituteName==="string")updates.set("j2grows.institute.name.v1",parsed.instituteName.slice(0,80));if(parsed.tutorialCompleted===true||parsed.tutorialCompleted===false)updates.set("j2grows.tutorial.completed.v1",parsed.tutorialCompleted?"true":"false");}const current=previous.get(SAVE_KEY);if(current)backupRawSave(current,"Before importing a save backup.");for(const [key,value] of updates)localStorage.setItem(key,value);setAudioTestMessage("Backup imported successfully. Reloading the game with the restored save…");window.location.reload();}catch(storageError){for(const [key,value] of previous){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}catch{/* Best-effort rollback if storage itself is unavailable. */}}if(storageError instanceof Error&&storageError.message==="This backup version is not supported.")throw storageError;throw new Error("Browser storage could not complete the import. Previous values were restored where possible.");}}catch(err){setAudioTestMessage(err instanceof Error?err.message:"Could not import this save file.");}finally{input.value="";}}}/><Database size={15}/> Choose backup file</label></div>
                <div className="preference-row"><div><strong>Reset preferences</strong><small>Restore settings to their defaults. Your game save is not affected.</small></div><button className="main-menu-settings-action" onClick={()=>{setPreferences(DEFAULT_PREFERENCES);setAudioTestMessage("Preferences restored to defaults.");}}>Reset preferences</button></div>
                <div className="preference-row"><div><strong>In-game settings</strong><small>Open the full simulation settings, save slots and reset controls.</small></div><button className="main-menu-settings-action" onClick={()=>{setMainMenuSettingsOpen(false);enterGame("Settings");}}>Open in-game settings <ArrowRight size={15}/></button></div>
                <div className="preference-row"><div><strong>Version</strong><small>J2Grows prototype 0.1</small></div><span className="settings-live-status">Local-first</span></div>
              </>}
            </div>
          </div>
          <div className="main-menu-settings-footer"><button className="main-menu-settings-back" onClick={()=>setMainMenuSettingsOpen(false)}>Back to main menu</button><span><Check size={14}/> Preferences save automatically</span></div>
        </section>
      </div>}
    </div>;
  }

  return <div className="app-shell">
    <aside className={`sidebar ${showMenu ? "sidebar-open" : ""}`}>
      <div className="brand"><img className="brand-logo-image" src="https://lwaxzivcjzpmmantryor.supabase.co/storage/v1/object/public/Artwork/logo.png" alt="J2Grows botanical logo" /><div className="brand-tagline">CULTIVATE<br />BREED · BUILD<br />DISCOVER</div></div>
      <div className="institution-switch"><div className="institution-emblem"><Sprout size={19} /></div><div><strong>{instituteName || "Unnamed Institute"}</strong><span>Home institution</span></div><ChevronDown size={14} /></div>
      <nav className="main-nav">{nav.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${page === label || (page === "Specimen Record" && label === "Plant Catalogue") ? "active" : ""}`} onClick={() => { setPage(label); setShowMenu(false); }}><Icon size={17} /><span>{label}</span>{label === "Research" && <span className="nav-dot" />}</button>)}</nav>
      <div className="sidebar-bottom"><div className="facility-mini"><div className="facility-mini-top"><span>STARTER FACILITY</span><span className="status-dot" /></div><strong>Home greenhouse</strong><div className="facility-progress"><span style={{ width: "36%" }} /></div><small>36% capacity used</small></div><div className="season-card"><Sun size={18} /><div><strong>Year 1 · Spring</strong><span>Day {day}</span></div><button onClick={tutorialOpen && tutorialStep === 3 ? growTutorialCutting : advanceDay} title="Advance one day" aria-label="New day">New day <ArrowRight size={16} /></button></div><div className="sidebar-footer"><span><span className="online-dot" /> Local save active</span><div className="sidebar-footer-actions"><button onClick={() => { setTutorialStep(0); setPage("Dashboard"); setTutorialOpen(true); }} aria-label="Open tutorial" title="Tutorial"><BookOpen size={16} /></button><button onClick={() => { setPage("Settings"); setShowMenu(false); }} aria-label="Settings" title="Settings"><Settings size={16} /></button></div></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <button className="mobile-menu icon-button" onClick={() => setShowMenu((value) => !value)} aria-label="Toggle navigation"><Menu size={18} /></button>
        <div className="top-institution"><img className="top-brand-logo" src="https://lwaxzivcjzpmmantryor.supabase.co/storage/v1/object/public/Artwork/logo.png" alt="" /><div><strong>J2Grows</strong><span>{instituteName || "Name your institute"}</span></div></div>
        <div className="top-resource"><span className="resource-symbol">£</span><div><strong>{money(cash)}</strong><small>Available funds</small></div></div>
        <div className="top-resource research-resource"><span className="resource-symbol"><Beaker size={17} /></span><div><strong>{research.toLocaleString("en-GB")}</strong><small>Research data</small></div></div>
        <div className="top-level"><div className="level-star"><Sprout size={18} /></div><div className="level-info"><div><strong>Institution level 1</strong><span>First roots</span></div><div className="progress-track"><span style={{ width: "28%" }} /></div></div></div>
        <div className="notification-menu">
          <button className="icon-button notification-button" onClick={() => setNotificationsOpen((open) => !open)} aria-label="Notifications" aria-expanded={notificationsOpen}><Bell size={17} />{notice && <i />}</button>
          {notificationsOpen && <section className="notification-card" role="status" aria-label="Nursery notifications">
            <div className="notification-card-heading"><strong>Notifications</strong>{notice && <button onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={15} /></button>}</div>
            <p>{notice || "You're all caught up on nursery alerts."}</p>
          </section>}
        </div>
        <button className="profile-chip" onClick={() => announce(instituteName || "Name your institute in the guided introduction.")}><div className="profile-avatar"><Leaf size={18} /></div><div><strong>Nursery Manager</strong><span>Founder</span></div><ChevronDown size={14} /></button>
      </header>

      <div className="page-content">
        {page !== "Dashboard" && (
          <section className="page-heading">
            <div><div className="eyebrow"><span className="eyebrow-line" /> YOUR BOTANICAL INSTITUTION</div><h1>{pageTitle}</h1><p>{page === "Plant Catalogue" ? "Browse your collection, compare traits and manage every individual specimen." : page === "Specimen Record" ? "An individual record of genetics, health, lineage and provenance." : page === "Breeding" ? "Choose parent plants, explore possibilities and build remarkable genetic lines." : page === "Research" ? "Turn observations into knowledge, methods and new capabilities." : page === "Greenhouse" ? "Keep your plants healthy and tune their growing environments." : page === "Facilities" ? "Grow from a home greenhouse into a specialist botanical institution." : page === "Staff" ? "Build a capable team and gradually automate your daily work." : page === "Shop" ? "Sell remarkable specimens and reinvest in your institution." : page === "Settings" ? "Manage your local save and game preferences." : "Understand your cash flow and plan sustainable expansion."}</p></div>
            <div className="heading-actions"><button className="button button-quiet" onClick={() => announce("Your collection has been saved locally in this session.")}><ShieldCheck size={15} /> Save status</button><button className="button button-primary" onClick={tutorialOpen && tutorialStep === 3 ? growTutorialCutting : advanceDay}><Zap size={15} /> Advance day <ArrowRight size={14} /></button></div>
          </section>
        )}

        {page === "Dashboard" && <Dashboard specimens={specimens} cash={cash} research={research} day={day} projectStarted={projectStarted} environment={greenhouseEnvironment} onNavigate={setPage} onSelect={(id) => { setSelected(id); setPage("Specimen Record"); }} onAdvance={tutorialStep === 3 ? growTutorialCutting : advanceDay} tutorialNameActive={tutorialOpen && tutorialStep === 0} instituteNameDraft={instituteNameDraft} onInstituteNameChange={setInstituteNameDraft} onSaveInstituteName={saveInstituteName} />}
        {page === "Plant Catalogue" && <Catalogue specimens={filteredSpecimens} allSpecimens={specimens} species={catalogSpecies} catalogSource={catalogSource} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} onSelect={(id) => { setSelected(id); setPage("Specimen Record"); }} onSell={sellSpecimen} onNavigate={setPage} />}
        {page === "Specimen Record" && <SpecimenPage specimen={activeSpecimen} plant={activeSpecies} onPropagate={(method) => tutorialOpen && tutorialStep === 2 ? takeTutorialCutting() : propagateSpecimen(activeSpecimen, method)} onSell={() => sellSpecimen(activeSpecimen)} onObserve={tutorialOpen && tutorialStep === 4 ? recordTutorialObservation : observeSelectedSpecimen} onAnalyse={analyseSelectedSpecimen} researchPoints={research} currentDay={day} mutationStabilityVisible={researchUnlocks.includes("mutation-screening") && analysisEquipmentLevel > 0} onToggleProtection={() => setSpecimens((current) => current.map((item) => item.id === activeSpecimen.id ? { ...item, protected: !item.protected } : item))} onBack={() => setPage("Plant Catalogue")} announce={announce} />}
        {page === "Breeding" && <BreedingPage specimens={specimens} researchUnlocks={researchUnlocks} projects={breedingProjects} day={day} traitTargetingUnlocked={researchUnlocks.includes("inheritance-mapping")} onCross={runCross} />}
        {page === "Research" && <ResearchPage specimens={specimens} cash={cash} research={research} day={day} projectStarted={projectStarted} analysisTargetSpecimenId={analysisTargetSpecimenId} analysisStartedDay={analysisStartedDay} onStart={startResearch} announce={announce} researchUnlocks={researchUnlocks} onUnlockResearch={unlockResearchNode} />}
        {page === "Greenhouse" && <GreenhousePage specimens={specimens} onSelect={(id) => { setSelected(id); setPage("Specimen Record"); }} onChangeEnvironment={(humidity, temperature, autoCare) => setGreenhouseEnvironment((current) => ({ ...current, humidity, temperature, autoCare, lightHours: 14, light: 70, nutrition: Math.max(20, 100 - Math.abs(temperature - 24) * 7) }))} environment={greenhouseEnvironment} autoCareUnlocked={researchUnlocks.includes("routine-automation")} />}
        {page === "Facilities" && <FacilitiesPage cash={cash} analysisEquipmentLevel={analysisEquipmentLevel} facilityLevels={facilityLevels} routineAutomationUnlocked={researchUnlocks.includes("routine-automation")} onBuy={(name) => { const cost = nextFacilityUpgradeCost(name, facilityLevels, analysisEquipmentLevel); if (cost === null || !canPurchaseFacilityUpgrade(name, facilityLevels, analysisEquipmentLevel, cash)) { announce(cost === null ? "That facility is already at its maximum level or is not available." : "Not enough funds for this upgrade."); return; } setCash((value) => value - cost); if (name === "Analysis workstation") setAnalysisEquipmentLevel((level) => level + 1); else setFacilityLevels((levels) => ({ ...levels, [name === "Propagation bench" ? "propagationBench" : "environmentalController"]: levels[name === "Propagation bench" ? "propagationBench" : "environmentalController"] + 1 })); announce(`${name} upgraded for ${money(cost)}. The benefit is active immediately; facility running costs apply every seventh day.`); }} />}
        {page === "Staff" && <StaffPage cash={cash} staffState={staffState} onToggleCare={() => setStaffState((current) => ({ ...current, routineCareEnabled: !current.routineCareEnabled }))} onStartTraining={() => { if (!canStartStaffTraining(cash, staffState)) { announce(cash < STAFF_TRAINING_COST ? `Training costs ${money(STAFF_TRAINING_COST)}.` : staffState.trainingLevel >= 3 ? "Your assistant has reached the maximum training level." : "Training is already in progress."); return; } const next = startStaffTraining(staffState); if (!next) return; setCash((current) => current - STAFF_TRAINING_COST); setStaffState(next); announce(`Basic plant-care training started for ${money(STAFF_TRAINING_COST)}. It completes after ${next.trainingDaysRemaining} simulated days.`); }} /> }
        {page === "Shop" && <ShopPage specimens={specimens} species={tutorialOpen && tutorialStep === 1 ? tutorialShopSpecies : catalogSpecies} tutorialMode={tutorialOpen && tutorialStep === 1} cash={cash} day={day} onSell={sellSpecimen} onBuy={(plant) => { if (tutorialOpen && tutorialStep === 1) { if (!catalogSpecies.some((item) => item.id === plant.id)) setSpeciesCatalog([...catalogSpecies, plant]); acquireSpecies(plant, true); } else purchaseSpecies(plant); }} />}
        {page === "Finances" && <FinancesPage cash={cash} day={day} specimens={specimens} onSell={sellSpecimen} weeklyOperatingCost={weeklyFacilityOperatingCost(facilityLevels, analysisEquipmentLevel, researchUnlocks.includes("routine-automation")) + weeklyStaffOperatingCost(staffState)} /> }
        {page === "Settings" && <SettingsPage onReplayTutorial={() => { setTutorialStep(0); setPage("Dashboard"); setTutorialOpen(true); }} onResetGame={resetGame} day={day} specimensCount={specimens.length} catalogSource={catalogSource} saveSlots={saveSlots} onSaveSlot={saveToSlot} onLoadSlot={loadFromSlot} />}
      </div>
      <footer className="app-footer"><span>J2Grows <span className="footer-separator">/</span> Prototype 0.1</span><span>All specimen and economic values are early prototype data.</span><span><span className="online-dot" /> Offline-first</span></footer>
    </main>
    {tutorialOpen && createPortal(<><div className="tutorial-backdrop" role="presentation" /><section className="tutorial-dialog" role="region" aria-labelledby="tutorial-title"><div className="tutorial-topline"><span className="tutorial-mark"><Sprout size={19} /></span><span>J2GROWS FIRST-GROW GUIDE</span><span className="tutorial-close" aria-hidden="true"><X size={17} /></span></div><div className="tutorial-progress-label"><span>YOUR FIRST DISCOVERY</span><span>{String(tutorialStep + 1).padStart(2, "0")} / {String(tutorialSteps.length).padStart(2, "0")}</span></div><div className="tutorial-progress-track"><span style={{ width: `${((tutorialStep + 1) / tutorialSteps.length) * 100}%` }} /></div><div className="tutorial-content"><div className="tutorial-eyebrow"><span className="eyebrow-line" /> GUIDED TUTORIAL</div><h2 id="tutorial-title">{tutorialSteps[tutorialStep].title}</h2><p>{tutorialSteps[tutorialStep].body}</p>
      {tutorialStep === 0 && <p className="tutorial-action-hint">Use the highlighted name field on your dashboard, then save it to continue.</p>}
      {tutorialStep === 1 && <p className="tutorial-action-hint">{page === "Shop" ? "All four prices and Buy buttons are highlighted. Compare the price with your available funds." : "Click Shop in the left menu, then choose an affordable plant."}</p>}
      {tutorialStep === 2 && <p className="tutorial-action-hint">{page === "Specimen Record" ? "Choose a propagation method in the highlighted section." : page === "Plant Catalogue" ? "Open the highlighted tutorial demonstration plant to view its record." : "Click Plant Catalogue in the left menu, then open the highlighted tutorial demonstration plant."}</p>}
      {tutorialStep === 3 && <p className="tutorial-action-hint">{page === "Greenhouse" ? "Click the highlighted New day button to grow your new plant." : "Click Greenhouse in the left menu, then click the highlighted New day button."}</p>}
      {tutorialStep === 4 && <p className="tutorial-action-hint">{page === "Specimen Record" ? "Click Record observation in the highlighted specimen controls." : page === "Plant Catalogue" ? "Open the highlighted new cutting or corm to view its record." : "Click Plant Catalogue in the left menu, then open the highlighted new cutting or corm."}</p>}
      <div className="tutorial-tip"><Leaf size={16} /><span>{tutorialSteps[tutorialStep].tip}</span></div></div><div className="tutorial-footer"><span>Press Esc to close the guide</span></div></section></>, document.body)}
  </div>;
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: string }) {
  return <div className="section-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action && <button className="text-action">{action}<ArrowRight size={14} /></button>}</div>;
}

function Dashboard({ specimens, cash, research, day, projectStarted, onNavigate, onSelect, onAdvance, environment, tutorialNameActive, instituteNameDraft, onInstituteNameChange, onSaveInstituteName }: { specimens: Specimen[]; cash: number; research: number; day: number; projectStarted: boolean; onNavigate: (page: Page) => void; onSelect: (id: string) => void; onAdvance: () => void; environment: PlantEnvironment; tutorialNameActive: boolean; instituteNameDraft: string; onInstituteNameChange: (value: string) => void; onSaveInstituteName: () => void }) {
  const needsAttention = specimens.filter((item) => item.health < 80);
  const averageHealth = Math.round(specimens.reduce((total, item) => total + item.health, 0) / Math.max(specimens.length, 1));
  const featured = specimens.slice(0, 4);
  const activeResearch = projectStarted;
  const temperature = environment.temperature ?? 24;
  const humidity = environment.humidity ?? 65;
  const lightHours = environment.lightHours ?? 14;
  const environmentStatus = temperature >= 18 && temperature <= 29 && humidity >= 50 && humidity <= 85 ? "Good" : "Review";
  const timeLabel = `Year ${Math.floor((day - 1) / 112) + 1} · ${["Spring", "Summer", "Autumn", "Winter"][Math.floor(((day - 1) % 112) / 28)]}`;
  const healthyCount = specimens.filter((item) => item.health >= 80).length;
  const healthPercent = specimens.length ? Math.round((healthyCount / specimens.length) * 100) : 0;
  return <>
    <section className="dash-feature-hero">
      <div className="dash-feature-copy">
        <div className="eyebrow"><span className="eyebrow-line" /> YOUR BOTANICAL INSTITUTION</div>
        <h2>Welcome to your nursery</h2>
        <p>Your nursery is growing. Here's an overview of your plants, facilities and progress.</p>
        {tutorialNameActive && <div className="tutorial-inline-name"><label htmlFor="institute-name">Institute name</label><div><input id="institute-name" maxLength={40} value={instituteNameDraft} onChange={(event) => onInstituteNameChange(event.target.value)} placeholder="e.g. Verdant Research Institute" /><button className="button button-primary" onClick={onSaveInstituteName}>Save name <ArrowRight size={15} /></button></div></div>}
        <div className="dash-hero-controls">
          <span className="dash-season"><Sun size={17} /> {timeLabel}<small>Day {day}</small></span>
          <button className="button button-quiet" onClick={() => onNavigate("Settings")}><Settings size={15} /> Settings</button>
          <button className="button button-primary" onClick={onAdvance}><Zap size={15} /> Advance day <ArrowRight size={14} /></button>
        </div>
      </div>
      <div className="dash-feature-photo" role="img" aria-label="J2Grows tropical botanical banner" style={{ backgroundImage: "url(https://lwaxzivcjzpmmantryor.supabase.co/storage/v1/object/public/Artwork/banner.png)" }}>
        <div className="dash-photo-caption"><span>J2GROWS · BOTANICAL JOURNAL</span><strong>New growth, new possibilities.</strong></div>
      </div>
    </section>

    <section className="dash-resource-grid" aria-label="Institution resources">
      <div className="dash-resource-card cash"><span className="dash-resource-icon"><Wallet size={23} /></span><div><small>Available funds</small><strong>{money(cash)}</strong><span>Operating balance</span></div></div>
      <div className="dash-resource-card"><span className="dash-resource-icon"><Sprout size={23} /></span><div><small>Total plants</small><strong>{specimens.length}</strong><span>Individual specimens</span></div></div>
      <div className="dash-resource-card"><span className="dash-resource-icon"><FlaskConical size={23} /></span><div><small>Research data</small><strong>{research.toLocaleString("en-GB")}</strong><span>{activeResearch ? "Programme active" : "Available to invest"}</span></div></div>
      <div className="dash-resource-card"><span className="dash-resource-icon"><Building2 size={23} /></span><div><small>Facilities</small><strong>1</strong><span>Home greenhouse</span></div></div>
      <div className="dash-resource-card"><span className="dash-resource-icon"><Users size={23} /></span><div><small>Staff</small><strong>1</strong><span>Founder-led nursery</span></div></div>
    </section>

    <section className="dash-three-columns dash-dashboard-main">
      <section className="panel dash-widget dash-greenhouse-widget">
        <SectionHeader title="Greenhouse conditions" subtitle="Your growing environment" action="View greenhouse" />
        <div className="dash-condition-grid">
          <div className="dash-condition"><span className="condition-icon temperature"><Thermometer size={21} /></span><div><small>Temperature</small><strong>{temperature}°C</strong><div className="condition-meter"><span style={{ width: `${Math.max(0, Math.min(100, (temperature / 35) * 100))}%` }} /></div></div></div>
          <div className="dash-condition"><span className="condition-icon humidity"><Droplets size={21} /></span><div><small>Humidity</small><strong>{humidity}%</strong><div className="condition-meter"><span style={{ width: `${Math.max(0, Math.min(100, humidity))}%` }} /></div></div></div>
          <div className="dash-condition"><span className="condition-icon sunlight"><Sun size={21} /></span><div><small>Light schedule</small><strong>{lightHours}h</strong><div className="condition-meter gold"><span style={{ width: `${Math.max(0, Math.min(100, (lightHours / 16) * 100))}%` }} /></div></div></div>
          <div className="dash-condition"><span className="condition-icon airflow"><Gauge size={21} /></span><div><small>Environment</small><strong>{environmentStatus}</strong><span>{environmentStatus === "Good" ? "Within target ranges" : "Check growing settings"}</span></div></div>
        </div>
        <button className="dash-widget-link" onClick={() => onNavigate("Greenhouse")}>Manage environment <ArrowRight size={14} /></button>
      </section>

      <section className="panel dash-widget dash-activity-widget">
        <SectionHeader title="Collection & activity" subtitle="Current priorities" action="View catalogue" />
        <div className="dash-activity-list">
          {needsAttention.length ? needsAttention.slice(0, 2).map((item) => <button className="dash-activity-row" key={item.id} onClick={() => onSelect(item.id)}><span className="dash-activity-icon warning"><Activity size={18} /></span><span className="dash-activity-copy"><strong>{item.nickname} needs a check</strong><small>{findSpecies(item.speciesId).name} · Health {item.health}%</small></span><ChevronRight size={16} /></button>) : <div className="dash-activity-row static"><span className="dash-activity-icon healthy"><ShieldCheck size={18} /></span><span className="dash-activity-copy"><strong>Collection health</strong><small>{averageHealth}% average health across {specimens.length} specimens</small></span></div>}
          <button className="dash-activity-row" onClick={() => onNavigate("Research")}><span className="dash-activity-icon research"><FlaskConical size={18} /></span><span className="dash-activity-copy"><strong>{activeResearch ? "Research programme active" : "Research ready"}</strong><small>{activeResearch ? "Continue your current programme" : "Invest in understanding promising traits"}</small></span><ChevronRight size={16} /></button>
          <button className="dash-activity-row" onClick={() => onNavigate("Breeding")}><span className="dash-activity-icon breeding"><Flower2 size={18} /></span><span className="dash-activity-copy"><strong>Genetic lines</strong><small>{specimens.length >= 2 ? "Review compatible breeding parents" : "Acquire another specimen to begin breeding"}</small></span><ChevronRight size={16} /></button>
        </div>
        <button className="dash-widget-link" onClick={() => onNavigate("Breeding")}>Explore breeding <ArrowRight size={14} /></button>
      </section>

      <section className="panel dash-widget dash-finance-widget">
        <SectionHeader title="Financial overview" subtitle="Current operating position" action="View finances" />
        <div className="dash-finance-total"><span>Available balance</span><strong>{money(cash)}</strong><small>Funds available to spend</small></div>
        <div className="dash-finance-breakdown"><div><span>Research data</span><strong>{research.toLocaleString("en-GB")}</strong></div><div><span>Collection size</span><strong>{specimens.length} plants</strong></div></div>
        <div className="dash-finance-note"><CircleDollarSign size={17} /><span>Transaction history will appear here when income and expense tracking is available.</span></div>
        <button className="dash-widget-link" onClick={() => onNavigate("Finances")}>Open finances <ArrowRight size={14} /></button>
      </section>
    </section>

    <section className="dash-lower-grid">
      <section className="panel dash-featured-panel">
        <SectionHeader title="Featured plants" subtitle="Your collection, specimen by specimen." action="Open catalogue" />
        <div className="dash-featured-grid">
          {featured.map((item) => { const plant = findSpecies(item.speciesId); return <button key={item.id} className="dash-plant-card" onClick={() => onSelect(item.id)}><div className="dash-plant-image"><PlantArt type={plant.image} fallbackType={getFallbackArtworkType(plant.id)} /><span className={item.health < 80 ? "dash-plant-status needs-care" : "dash-plant-status"}>{item.health < 80 ? "Needs attention" : "Healthy"}</span><span className="dash-plant-heart"><Leaf size={16} /></span></div><div className="dash-plant-copy"><small>{item.id}</small><strong>{item.nickname}</strong><span>{plant.name}</span><div><span>{item.health}% health</span><b>{money(item.value)}</b></div></div></button>; })}
          <button className="dash-plant-add" onClick={() => onNavigate("Shop")}><span><Plus size={22} /></span><strong>Grow your collection</strong><small>Explore plants available to acquire</small><ArrowRight size={15} /></button>
        </div>
      </section>
      <div className="dash-side-stack">
        <section className="panel dash-side-panel">
          <SectionHeader title="Research focus" subtitle="Knowledge that moves your nursery forward" action="View research" />
          <button className="dash-research-card" onClick={() => onNavigate("Research")}>
            <span className="dash-side-icon"><FlaskConical size={22} /></span>
            <span className="dash-side-copy"><strong>{activeResearch ? "Programme in progress" : "Discover your next breakthrough"}</strong><small>{activeResearch ? "Review your active research programme" : `${research.toLocaleString("en-GB")} research data available to invest`}</small><span className="dash-progress"><i style={{ width: activeResearch ? "42%" : "8%" }} /></span></span>
            <ArrowRight size={16} />
          </button>
        </section>
        <section className="panel dash-side-panel">
          <SectionHeader title="Current priorities" subtitle="Based on your collection" action="Open greenhouse" />
          <button className="dash-task-row" onClick={() => needsAttention[0] ? onSelect(needsAttention[0].id) : onNavigate("Greenhouse")}><span className="dash-task-icon"><ShieldCheck size={19} /></span><span><strong>{needsAttention.length ? "Check plant health" : "Maintain plant health"}</strong><small>{needsAttention.length ? `${needsAttention.length} specimen(s) below 80% health` : `${healthPercent}% of your collection is in good health`}</small></span><ChevronRight size={16} /></button>
          <button className="dash-task-row" onClick={() => onNavigate("Breeding")}><span className="dash-task-icon breeding"><Flower2 size={19} /></span><span><strong>Build a genetic line</strong><small>{specimens.length < 2 ? "Acquire a second specimen to begin" : "Review available parent combinations"}</small></span><ChevronRight size={16} /></button>
          <button className="dash-task-row" onClick={() => onNavigate("Plant Catalogue")}><span className="dash-task-icon research"><Sprout size={19} /></span><span><strong>Expand your collection</strong><small>Explore plants for your nursery</small></span><ChevronRight size={16} /></button>
        </section>
      </div>
    </section>
  </>;
}

function Catalogue({ specimens, allSpecimens, species, catalogSource, query, setQuery, filter, setFilter, onSelect, onSell, onNavigate }: { specimens: Specimen[]; allSpecimens: Specimen[]; species: Species[]; catalogSource: CatalogueSource; query: string; setQuery: (value: string) => void; filter: string; setFilter: (value: string) => void; onSelect: (id: string) => void; onSell: (specimen: Specimen) => void; onNavigate: (page: Page) => void }) {
  const [imageStates, setImageStates] = useState<Record<string, ArtworkState>>({});
  const imageSummary = getArtworkStatusSummary(species, imageStates);
  const sourceLabel = getCatalogueSourceLabel(catalogSource);
  const filters = [
    { label: "All plants", count: allSpecimens.length },
    { label: "Protected", count: allSpecimens.filter((item) => item.protected).length },
    { label: "Needs attention", count: allSpecimens.filter((item) => item.health < 80).length },
    { label: "Ready to sell", count: allSpecimens.filter((item) => !item.protected).length },
  ];
  const hasCollection = allSpecimens.length > 0;
  return <><div className="catalogue-layout"><aside className="panel catalogue-filters"><SectionHeader title="Collection filters" /><label className="search-field"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your collection" /></label><div className="filter-heading">QUICK VIEWS</div>{filters.map((item) => <button key={item.label} className={`filter-option ${filter === item.label ? "selected" : ""}`} onClick={() => setFilter(item.label)}><span>{item.label}<small>{item.count}</small></span>{filter === item.label && <Check size={14} />}</button>)}<div className="filter-note"><ShieldCheck size={16} /><p>Protected specimens are excluded from automated sale. Each plant retains its own identity and history.</p></div></aside><section className="catalogue-main"><div className="catalogue-toolbar"><div><h2>Your collection</h2><span>{specimens.length} of {allSpecimens.length} individual specimens</span></div><span className="pill subtle-pill">Owned specimens</span></div>{specimens.length ? <div className="catalogue-grid">{specimens.map((item) => { const plant = findSpecies(item.speciesId); return <article key={item.id} className="catalogue-card"><button className="catalogue-art-button" onClick={() => onSelect(item.id)} aria-label={`Open record for ${item.nickname}`}><PlantArt type={plant.image} large /><span className="art-label">{plant.rarity}</span></button><div className="catalogue-card-content"><span className="specimen-id">{item.id}</span><h3>{item.nickname}</h3><p>{plant.name}</p><div className="trait-pills">{plant.traits.slice(0, 2).map((trait) => <span key={trait}>{trait}</span>)}</div><div className="catalogue-card-stats"><span><Activity size={13} /> {item.health}% health</span><strong>{money(item.value)}</strong></div><div className="catalogue-card-actions"><button className="button button-quiet" onClick={() => onSelect(item.id)}>Record</button><button className="button button-primary" disabled={item.protected || Boolean(item.reservedByProjectId)} onClick={() => onSell(item)}>{item.protected ? "Protected" : "Sell"}</button></div></div></article>; })}</div> : <div className={`empty-panel ${hasCollection ? "filtered-empty" : "starter-empty"}`}>{hasCollection ? <><Search size={24} /><h3>No specimens match</h3><p>Try another search or clear the current filter.</p><button className="button button-quiet" onClick={() => { setQuery(""); setFilter("All plants"); }}>Clear filters</button></> : <><span className="empty-panel-icon"><Sprout size={24} /></span><h3>Your collection starts here</h3><p>You have not acquired any specimens yet. Browse the shop to bring your first plant into the nursery.</p><div className="empty-panel-actions"><button className="button button-primary" onClick={() => onNavigate("Shop")}><ShoppingBag size={14} /> Browse plant shop <ArrowRight size={14} /></button><button className="button button-quiet" onClick={() => document.querySelector(".species-library")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Explore species library</button></div></>}</div>}</section></div><section className="panel species-library"><div className="section-header"><div><h2>Species library</h2><p>{species.length} species · Source: {sourceLabel}</p><p className="muted-copy">Artwork: {imageSummary.loaded} remote images loaded · {imageSummary.fallback} using fallback artwork{imageSummary.pending ? ` · ${imageSummary.pending} not yet checked` : ""}{imageSummary.total === imageSummary.fallback && imageSummary.pending === 0 ? " · no remote images loaded" : ""}</p></div><span className={`pill subtle-pill`}>{catalogSource === "local" ? "Local fallback" : "Metadata loaded"}</span></div><div className="species-library-grid">{species.map((plant) => <article className={`species-library-card rarity-${plant.rarity.toLowerCase()}`} key={plant.id}><PlantArt type={plant.image} fallbackType={getFallbackArtworkType(plant.id)} onImageStatus={(status) => setImageStates((current) => current[plant.id] === status ? current : { ...current, [plant.id]: status })} /><div className="species-library-card-copy"><strong>{plant.name}</strong><span>{plant.latin === "Species details not yet recorded" ? plant.id : plant.latin}</span><span className="species-rarity">{plant.rarity}</span></div></article>)}</div></section></>;
}

function SpecimenPage({ specimen, plant, onSell, onToggleProtection, onBack, onPropagate, onObserve, onAnalyse, researchPoints, currentDay, mutationStabilityVisible, announce }: { specimen: Specimen; plant: ReturnType<typeof findSpecies>; onSell: () => void; onToggleProtection: () => void; onBack: () => void; onPropagate: (method: "cutting" | "division" | "corm" | "tissue-culture") => void; onObserve: () => void; onAnalyse: () => void; researchPoints: number; currentDay: number; mutationStabilityVisible: boolean; announce: (message: string) => void }) {
  const genus = plant.latin.split(" ")[0].toLowerCase();
  const isAlocasia = genus === "alocasia";
  const supportsCuttings = ["monstera", "philodendron", "anthurium"].includes(genus);
  const rarity = getSpeciesEconomy(plant.id)?.rarity ?? getSpeciesEconomy(plant.name)?.rarity ?? plant.rarity;
  const analysisLevel = specimen.genetics?.research.analysisLevel ?? 0;
  const analysisCost = 25;
  const specimenEvidence = specimen.genetics?.research.points ?? 0;
  const observationCount = specimen.genetics?.research.observationCount ?? 0;
  return <><button className="back-link" onClick={onBack}><ArrowRight size={14} /> Back to catalogue</button><div className="specimen-detail-grid"><section className="panel specimen-portrait"><PlantArt type={plant.image} large /><div className="portrait-overlay"><span className="eyebrow">INDIVIDUAL SPECIMEN</span><div className="portrait-title-row"><h2>{specimen.nickname}</h2><span className={`specimen-rarity-badge rarity-${rarity.toLowerCase()}`}>{rarity}</span></div><p>{plant.name}</p><span className="specimen-id">{specimen.id}</span></div></section><section className="panel specimen-detail-main"><SectionHeader title="Specimen overview" subtitle="Identity, condition and provenance." /><div className="detail-stat-grid"><div className="detail-health-stat"><span>Health</span><strong className={specimen.health < 80 ? "health-low" : "health-good"}>{specimen.health}%</strong><div className="specimen-health-track" role="progressbar" aria-label="Specimen health" aria-valuemin={0} aria-valuemax={100} aria-valuenow={specimen.health}><span style={{ width: `${Math.max(0, Math.min(100, specimen.health))}%` }} /></div></div><div><span>Stage</span><strong>{specimen.propagation?.phase ?? specimen.stage}</strong></div><div><span>Estimated value</span><strong>{money(specimen.value)}</strong></div><div><span>Variegation</span><strong>{specimen.variegation}%</strong></div></div><div className="detail-section"><h3>Species notes</h3><p>{plant.summary}</p><div className="care-grid"><div><Sun size={15} /><span>Light</span><strong>{plant.light}</strong></div><div><Droplets size={15} /><span>Humidity</span><strong>{plant.humidity}</strong></div></div></div><div className="detail-section"><h3>Current traits</h3><div className="trait-pills larger-pills">{plant.traits.map((trait) => <span key={trait}>{trait}</span>)}</div><p className="muted-copy">Visible expression is observed; stability and hidden potential are estimated until research reveals more.</p></div><div className="detail-section"><h3>Genetic profile</h3><div className="detail-stat-grid"><div><span>Variegation potential</span><strong>{specimen.genetics ? Math.round(specimen.genetics.research.analysisLevel >= 1 ? specimen.genetics.genetics.variegationPotential : Math.round(specimen.genetics.genetics.variegationPotential / 10) * 10) + "%" : "Unknown"}</strong></div><div><span>Stability estimate</span><strong>{specimen.genetics ? "~" + Math.round(specimen.genetics.genetics.stability) + "%" : "Unassessed"}</strong></div><div><span>Hidden potential</span><strong>{(specimen.genetics?.research.analysisLevel ?? 0) >= 2 ? Math.round(specimen.genetics?.genetics.hiddenPotential ?? 0) + "%" : "Unrevealed"}</strong></div><div><span>Research level</span><strong>{specimen.genetics?.research.analysisLevel ?? 0}</strong></div></div><p className="muted-copy">Observations: {specimen.genetics?.research.observationCount ?? 0} · Research data available: {researchPoints}</p><div className="propagation-actions"><button className="button button-quiet" disabled={specimen.lastObservedDay === currentDay} onClick={onObserve}><BookOpen size={15} /> Record observation (+2 research)</button><button className="button button-quiet" disabled={specimen.dead || researchPoints < analysisCost || specimenEvidence < analysisCost || observationCount < 3 || analysisLevel >= 3} onClick={onAnalyse}><Microscope size={15} /> {analysisLevel >= 3 ? "Analysis complete" : `Analyse genetics · ${analysisCost} data + evidence`}</button></div>{specimen.genetics?.research.mutations.filter((mutation) => mutation.detected).map((mutation) => <p className="muted-copy" key={mutation.id}>Detected mutation: {mutation.name} · {mutation.rarity} · {mutation.strength}% strength · {mutationStabilityVisible ? `${mutation.stability}% stability · ` : "Stability hidden · "} {mutation.inheritance} inheritance</p>)}</div><div className="detail-section"><h3>Propagation methods</h3><p className="muted-copy">Each method creates a separate juvenile specimen. Costs and outcomes are prototype values.</p><div className="propagation-actions">{supportsCuttings && <button className="button button-quiet" onClick={() => onPropagate("cutting")}><Sprout size={15} /> Stem cutting · {money(propagationCost("cutting", rarity))}</button>}<button className="button button-quiet" onClick={() => onPropagate("division")}><Sprout size={15} /> Division / offset · {money(propagationCost("division", rarity))}</button>{isAlocasia && <button className="button button-quiet" onClick={() => onPropagate("corm")}><Sprout size={15} /> Corm · {money(propagationCost("corm", rarity))}</button>}<button className="button button-quiet" onClick={() => onPropagate("tissue-culture")}><FlaskConical size={15} /> Tissue culture · {money(propagationCost("tissue-culture", rarity))}</button></div><p className="muted-copy">{isAlocasia ? "Alocasia can be propagated from corms, divisions / offsets or through tissue culture." : supportsCuttings ? "Stem cuttings, divisions / offsets and tissue culture are available for this plant group." : "Division / offsets and tissue culture are available for this species in the current prototype."}</p></div><div className="detail-actions"><button className="button button-quiet" onClick={onToggleProtection}><ShieldCheck size={15} /> {specimen.protected ? "Remove protection" : "Protect specimen"}</button><button className="button button-primary" disabled={specimen.protected} onClick={onSell}>{specimen.protected ? "Protected from sale" : `Sell for ${money(specimen.value)}`}</button></div></section><aside className="panel provenance-panel"><SectionHeader title="Record & provenance" /><div className="provenance-item"><span>Current location</span><strong>{specimen.location}</strong></div><div className="provenance-item"><span>Protection status</span><strong className={specimen.protected ? "health-good" : ""}>{specimen.protected ? "Protected" : "Sale eligible"}</strong></div><div className="provenance-item"><span>Lineage</span><strong>Founder collection</strong></div><div className="provenance-item"><span>Observation history</span><strong>{observationCount} {observationCount === 1 ? "field note" : "field notes"}</strong></div><button className="button button-quiet full-width" onClick={() => announce("The detailed lineage viewer is planned for a later milestone.")}>View family tree <ArrowRight size={14} /></button></aside></div></>;
}

function BreedingPage({ specimens, researchUnlocks, projects, day, traitTargetingUnlocked, onCross }: { specimens: Specimen[]; researchUnlocks: string[]; projects: BreedingProject[]; day: number; traitTargetingUnlocked: boolean; onCross: (parentA: string, parentB: string, targetTrait?: "variegationPotential" | "stability" | "growthPotential" | "hiddenPotential") => void }) {
  const eligible = specimens.filter((item) => item.stage === "Breeding-ready" && item.health > 0 && !item.dead && !item.reservedByProjectId);
  const [parentA, setParentA] = useState(eligible[0]?.id ?? "");
  const [parentB, setParentB] = useState(eligible.find((item) => item.id !== parentA && findSpecies(item.speciesId).latin.split(" ")[0] === (eligible[0] ? findSpecies(eligible[0].speciesId).latin.split(" ")[0] : ""))?.id ?? "");
  const [targetTrait, setTargetTrait] = useState<"variegationPotential" | "stability" | "growthPotential" | "hiddenPotential">("variegationPotential");
  const genus = (id: string) => { const item = specimens.find((specimen) => specimen.id === id); return item ? findSpecies(item.speciesId).latin.split(" ")[0] : ""; };
  const selectedA = specimens.find((item) => item.id === parentA);
  const selectedB = specimens.find((item) => item.id === parentB);
  const compatible = eligible.filter((item) => item.id !== parentA && genus(item.id) === genus(parentA));
  const rarityOf = (item: Specimen | undefined) => item ? (getSpeciesEconomy(item.speciesId)?.rarity ?? findSpecies(item.speciesId).rarity) as RarityTier : "Common" as RarityTier;
  const baseCost = selectedA && selectedB ? calculateBreedingCost(rarityOf(selectedA), rarityOf(selectedB), 1, researchUnlocks.includes("selective-breeding") ? 10 : 0) : 0;
  const targetingEnabled = traitTargetingUnlocked && Boolean(selectedA && selectedB);
  const cost = calculateTargetedBreedingCost(baseCost, targetingEnabled);
  const duration = breedingDurationDays(5, researchUnlocks.includes("selective-breeding") ? 15 : 0);
  return <div className="two-column-layout"><section className="panel"><SectionHeader title="Breeding workbench" subtitle="Only healthy, available breeding-ready plants can be committed to a timed project." />
    {eligible.length < 2 && <p className="muted-copy">You need at least two healthy breeding-ready specimens from the same genus. Grow plants through Mature and into Breeding-ready first.</p>}
    <div className="breeding-parent-grid">{[{ label: "Parent A", value: parentA, set: setParentA, options: eligible }, { label: "Parent B", value: parentB, set: setParentB, options: compatible }].map((parent) => <div className="parent-picker" key={parent.label}><span className="filter-heading">{parent.label.toUpperCase()}</span><select value={parent.value} onChange={(event) => parent.set(event.target.value)}><option value="">Choose a parent</option>{parent.options.map((item) => <option key={item.id} value={item.id}>{item.nickname} · {findSpecies(item.speciesId).name} · {item.stage}</option>)}</select>{parent.value && specimens.find((item) => item.id === parent.value) && <PlantArt type={findSpecies(specimens.find((item) => item.id === parent.value)!.speciesId).image} fallbackType={getFallbackArtworkType(specimens.find((item) => item.id === parent.value)!.speciesId)} large />}</div>)}</div>
    <div className="experiment-summary"><div><span>Method</span><strong>Timed genetic cross</strong></div><div><span>Project cost</span><strong>{money(cost)}</strong></div><div><span>Duration</span><strong>{duration} simulation days</strong></div>{targetingEnabled && <div><span>Targeting trade-off</span><strong>+25% cost · +8pp risk</strong></div>}</div>
    <p className="muted-copy">Traits follow defined inheritance rules with bounded variation. Mutations are rare, and discoveries require recorded evidence. Parents remain reserved until the project finishes.</p>{traitTargetingUnlocked ? <div className="control-row"><label htmlFor="trait-target">Research-unlocked target trait</label><select id="trait-target" value={targetTrait} onChange={(event) => setTargetTrait(event.target.value as typeof targetTrait)}><option value="variegationPotential">Variegation potential</option><option value="stability">Trait stability</option><option value="growthPotential">Growth potential</option><option value="hiddenPotential">Hidden potential</option></select><small>Targeting nudges the chosen trait upward in 70% of successful crosses, but never guarantees improvement. Trade-off: +25% project cost and +8 percentage points of failure risk.</small></div> : <p className="muted-copy">Trait targeting unlocks through Inheritance Mapping research.</p>}
    <button className="button button-primary" disabled={!selectedA || !selectedB || selectedA.id === selectedB.id || genus(parentA) !== genus(parentB) || eligible.length < 2} onClick={() => onCross(parentA, parentB, traitTargetingUnlocked ? targetTrait : undefined)}>Start breeding project · {money(cost)} <ArrowRight size={15} /></button>
  </section><section className="panel"><SectionHeader title="Genetic lineage" subtitle="Each completed cross creates a distinct line linked to both parents." /><div className="lineage-list">{specimens.filter((item) => item.lineParentIds?.length).map((item) => <div className="lineage-item" key={item.id}><strong>{item.nickname}</strong><span>Generation {item.generation ?? 1} · {item.lineParentIds!.map((id) => specimens.find((parent) => parent.id === id)?.nickname ?? id).join(" × ")}</span>{item.stableMutationIds?.length ? <small>Stable mutations: {item.stableMutationIds.length}</small> : null}</div>)}</div>{researchUnlocks.includes("batch-breeding") && <p className="muted-copy">Batch breeding unlocked: successful projects produce three offspring.</p>}<div className="active-projects"><h3>Breeding projects</h3>{projects.filter((project) => project.status === "active").length === 0 ? <p className="muted-copy">No active breeding projects.</p> : projects.filter((project) => project.status === "active").map((project) => <div className="lineage-item" key={project.id}><strong>{specimens.find((item) => item.id === project.parentAId)?.nickname ?? "Parent"} × {specimens.find((item) => item.id === project.parentBId)?.nickname ?? "Parent"}</strong><span>Completes on day {project.completesOnDay} · {Math.max(0, project.completesOnDay - day)} day(s) remaining</span></div>)}</div></section></div>;
}

function ResearchPage({ specimens, cash, research, day, projectStarted, analysisTargetSpecimenId, analysisStartedDay, onStart, announce, researchUnlocks, onUnlockResearch }: { specimens: Specimen[]; cash: number; research: number; day: number; projectStarted: boolean; analysisTargetSpecimenId?: string; analysisStartedDay?: number; onStart: (specimenId: string) => void; announce: (message: string) => void; researchUnlocks: string[]; onUnlockResearch: (id: string) => void }) {
  const [targetId, setTargetId] = useState("");
  const eligibleSpecimens = specimens.filter((item) => !item.dead && item.health > 0 && !item.mutationAnalysisCompleted);
  const selectedTarget = eligibleSpecimens.find((item) => item.id === targetId) ?? eligibleSpecimens[0];
  const activeTarget = specimens.find((item) => item.id === analysisTargetSpecimenId);
  const daysRemaining = analysisStartedDay === undefined ? 0 : Math.max(0, 3 - (day - analysisStartedDay));
  return <div className="research-layout"><section className="panel"><SectionHeader title="Research pathways" subtitle="Unlock permanent capabilities through a branching research tree." /><div className="research-tree">{RESEARCH_TREE.map((node) => { const unlocked = researchUnlocks.includes(node.id); const prerequisitesMet = node.prerequisites.every((id) => researchUnlocks.includes(id)); return <div className={`research-node ${unlocked ? "node-done" : prerequisitesMet && research >= node.cost ? "node-current" : "node-locked"}`} key={node.id}><div className="node-icon">{unlocked ? <Check size={18} /> : <Beaker size={18} />}</div><div><strong>{node.id.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ")}</strong><span>{node.description} · Cost: {node.cost} research</span></div><button className="button button-quiet" disabled={unlocked || !canUnlockResearch(node.id, { points: research, unlocked: researchUnlocks, completed: researchUnlocks })} onClick={() => onUnlockResearch(node.id)}>{unlocked ? "Unlocked" : prerequisitesMet ? "Unlock" : "Prerequisites"}</button></div>; })}</div></section><aside className="panel project-panel"><div className="eyebrow"><FlaskConical size={13} /> SPECIMEN PROJECT</div><h2>Mutation Analysis</h2><p>Spend three in-game days analysing one specimen. If it carries the latent mutation gene, the analysis detects one random mutation. Each specimen can be analysed only once.</p><div className="project-art"><PlantArt type={selectedTarget ? findSpecies(selectedTarget.speciesId).image : "philodendron"} fallbackType={selectedTarget ? getFallbackArtworkType(selectedTarget.speciesId) : "philodendron"} large /></div>{projectStarted ? <><div className="project-cost"><span>Specimen</span><strong>{activeTarget?.nickname ?? "Unavailable"}</strong></div><div className="project-cost"><span>Time remaining</span><strong>{daysRemaining} in-game day(s)</strong></div><div className="project-cost"><span>Completes on</span><strong>Day {(analysisStartedDay ?? day) + 3}</strong></div></> : <><label className="control-row" htmlFor="mutation-analysis-specimen">Specimen to analyse</label><select id="mutation-analysis-specimen" className="field-input" value={selectedTarget?.id ?? ""} onChange={(event) => setTargetId(event.target.value)} disabled={!eligibleSpecimens.length}>{eligibleSpecimens.map((item) => <option key={item.id} value={item.id}>{item.nickname} — {findSpecies(item.speciesId).name}</option>)}</select><div className="project-cost"><span>Project cost</span><strong>{money(25)}</strong></div><div className="project-cost"><span>Available funds</span><strong>{money(cash)}</strong></div><div className="project-cost"><span>Eligible specimens</span><strong>{eligibleSpecimens.length}</strong></div></>}<button className="button button-primary full-width" disabled={projectStarted || cash < 25 || !selectedTarget} onClick={() => selectedTarget && onStart(selectedTarget.id)}>{projectStarted ? "Analysis in progress" : !eligibleSpecimens.length ? "No eligible specimens" : cash < 25 ? "Insufficient funds" : "Begin 3-day analysis"}<ArrowRight size={15} /></button><button className="button button-quiet full-width" onClick={() => announce("Mutation Analysis is available once per living specimen. Plants without the mutation gene may yield no discovery.")}>How analysis works</button></aside></div>;
}
function GreenhousePage({ specimens, onSelect, onChangeEnvironment, environment, autoCareUnlocked }: { specimens: Specimen[]; onSelect: (id: string) => void; onChangeEnvironment: (humidity: number, temperature: number, autoCare: boolean) => void; environment: PlantEnvironment; autoCareUnlocked: boolean }) {
  const humidity = environment.humidity;
  const temperature = environment.temperature ?? 24;
  const autoCare = environment.autoCare ?? false;
  return <><div className="metric-grid"><Metric label="Temperature" value={`${temperature}°C`} detail="Target range 22–28°C" icon={Thermometer} /><Metric label="Humidity" value={`${humidity}%`} detail="Tropical zone" icon={Droplets} /><Metric label="Light schedule" value="14 hours" detail="Daily light period" icon={Sun} /><Metric label="Air circulation" value="Good" detail="Fans operating" icon={Activity} /></div><div className="two-column-layout"><section className="panel"><SectionHeader title="Growing zone · Tropical Aroids" subtitle="A simple first greenhouse zone." action="Zone details" /><div className="zone-visual"><PlantArt type="hero" large /><div><span className="pill">ACTIVE ZONE</span><h2>Home Greenhouse</h2><p>Species-specific controls will expand as equipment and research are unlocked.</p></div></div><div className="control-row"><label htmlFor="temp">Temperature <strong>{temperature}°C</strong></label><input id="temp" type="range" min="18" max="32" value={temperature} onChange={(event) => onChangeEnvironment(humidity, Number(event.target.value), autoCare)} /></div><div className="control-row"><label htmlFor="humidity">Humidity <strong>{humidity}%</strong></label><input id="humidity" type="range" min="40" max="95" value={humidity} onChange={(event) => onChangeEnvironment(Number(event.target.value), temperature, autoCare)} /></div><button className={`button ${autoCare ? "button-primary" : "button-quiet"}`} disabled={!autoCareUnlocked} onClick={() => onChangeEnvironment(humidity, temperature, !autoCare)}><Zap size={15} /> Auto-care {autoCare ? "enabled" : autoCareUnlocked ? "paused" : "locked"}</button><p className="muted-copy">Changes save automatically and affect the simulation immediately. Auto-care in this zone requires Routine Automation research; staff routine care is managed separately.</p></section><section className="panel"><SectionHeader title="Plants in this zone" subtitle="Select a specimen to inspect its record." />{specimens.map((item) => <button className="zone-plant-row" key={item.id} onClick={() => onSelect(item.id)}><PlantArt type={findSpecies(item.speciesId).image} fallbackType={getFallbackArtworkType(item.speciesId)} /><span><strong>{item.nickname}</strong><small>{findSpecies(item.speciesId).name}</small></span><span className={item.health < 80 ? "health-low" : "health-good"}>{item.health}%</span><ChevronRight size={15} /></button>)}</section></div></>;
}

function FacilitiesPage({ cash, analysisEquipmentLevel, facilityLevels, routineAutomationUnlocked, onBuy }: { cash: number; analysisEquipmentLevel: number; facilityLevels: FacilityLevels; routineAutomationUnlocked: boolean; onBuy: (name: FacilityName) => void }) {
  const upgrades: { name: FacilityName; description: string; icon: typeof Sprout; level: number; effect: string }[] = [
    { name: "Propagation bench", description: "Speed up cuttings, corms, divisions and tissue-culture phases.", icon: Sprout, level: facilityLevels.propagationBench, effect: "Each level removes one day from propagation phases, with a one-day minimum. Running cost: £3/week per level." },
    { name: "Environmental controller", description: "Improve light, nutrition and humidity values used by the simulation.", icon: Gauge, level: facilityLevels.environmentalController, effect: "Each level adds 5 points to simulated light, nutrition and humidity, up to 100. Running cost: £5/week per level." },
    { name: "Analysis workstation", description: "Improve mutation odds and support equipped mutation analysis.", icon: Microscope, level: analysisEquipmentLevel, effect: "Each level increases mutation chance and adds £5 to weekly running costs." },
  ];
  return <><div className="facility-hero"><div><div className="eyebrow">CURRENT FACILITY</div><h2>Home greenhouse</h2><p>Facility upgrades are optional. Each has a permanent level, a gameplay effect and a weekly running cost.</p><div className="facility-tags"><span><Check size={13} /> Local cultivation</span><span><Check size={13} /> Basic propagation</span></div></div><div className="facility-hero-art"><PlantArt type="hero" large /></div></div><section className="panel"><SectionHeader title="Available improvements" subtitle="Levels and purchases are saved locally. Costs increase with each level." /><div className="project-cost"><span>Current weekly facility costs</span><strong>{money(weeklyFacilityOperatingCost(facilityLevels, analysisEquipmentLevel, routineAutomationUnlocked))}</strong></div><div className="upgrade-grid">{upgrades.map(({ name, description, icon: Icon, level, effect }) => { const cost = nextFacilityUpgradeCost(name, facilityLevels, analysisEquipmentLevel); const maxed = cost === null; return <article className="upgrade-card" key={name}><div className="upgrade-icon"><Icon size={20} /></div><h3>{name}</h3><p>{description}</p><div className="provenance-item"><span>Current level</span><strong>{level} / 3</strong></div><p className="facility-effect">{effect}</p><div className="upgrade-cost">{maxed ? "Maximum level reached" : money(cost)}</div><button className="button button-primary full-width" disabled={maxed || !canPurchaseFacilityUpgrade(name, facilityLevels, analysisEquipmentLevel, cash)} onClick={() => onBuy(name)}>{maxed ? "Fully upgraded" : cash < cost! ? "Not enough funds" : "Purchase next level"}</button></article>; })}</div></section></>;
}

function StaffPage({ cash, staffState, onToggleCare, onStartTraining }: { cash: number; staffState: StaffState; onToggleCare: () => void; onStartTraining: () => void }) {
  const training = staffState.trainingDaysRemaining > 0;
  const maxed = staffState.trainingLevel >= 3;
  return <><div className="metric-grid"><Metric label="Team capacity" value="1 helper" detail="Starter workforce" icon={Users} /><Metric label="Care automation" value={staffState.routineCareEnabled ? "Active" : "Paused"} detail={staffState.routineCareEnabled ? "Buffers poor conditions" : "No automatic care buffer"} icon={Sprout} /><Metric label="Training level" value={`${staffState.trainingLevel} / 3`} detail={training ? `${staffState.trainingDaysRemaining} day(s) remaining` : maxed ? "Specialist trained" : "Training available"} icon={BookOpen} /></div><div className="two-column-layout"><section className="panel"><SectionHeader title="Your team" subtitle="Staff settings persist in your local save and affect plant care." /><div className="staff-profile"><div className="staff-avatar"><Sprout size={24} /></div><div><span className="eyebrow">STARTER ROLE</span><h2>Greenhouse Assistant</h2><p>Routine care buffers poor environmental conditions. Each completed training level improves the care safety floor by five points.</p><div className="trait-pills"><span>Plant care</span><span>Reliable</span><span>Level {staffState.trainingLevel}</span></div></div></div><div className="control-row"><label>Routine care automation <strong>{staffState.routineCareEnabled ? "On" : "Off"}</strong></label><button className={`button ${staffState.routineCareEnabled ? "button-primary" : "button-quiet"}`} onClick={onToggleCare}>{staffState.routineCareEnabled ? "Pause routine care" : "Enable routine care"}</button></div><div className="project-cost"><span>Routine care running cost</span><strong>{staffState.routineCareEnabled ? "£8 / week" : "£0 / week"}</strong></div><div className="project-cost"><span>Training cost</span><strong>£{STAFF_TRAINING_COST} · 3 days</strong></div><button className="button button-quiet" disabled={training || maxed || cash < STAFF_TRAINING_COST} onClick={onStartTraining}>{training ? `Training in progress · ${staffState.trainingDaysRemaining} day(s) left` : maxed ? "Training complete" : cash < STAFF_TRAINING_COST ? "Insufficient funds" : "Start basic plant-care training"}</button>{training && <p className="muted-copy">Training advances with each simulated day. Care improves when training completes; training is preserved when you leave this page or reload.</p>}</section><aside className="panel"><SectionHeader title="Future departments" subtitle="Specialist roles remain planned, not yet available." />{["Cultivation & Biosecurity", "Propagation & Tissue Culture", "Genetics & Analysis", "Automation & Production"].map((name, index) => <div className="department-row" key={name}><span className="department-index">0{index + 1}</span><strong>{name}</strong><span className="pill subtle-pill">Coming later</span></div>)}</aside></div></>;
}

function ShopPage({ specimens, species, cash, day, onBuy, onSell, tutorialMode = false }: { specimens: Specimen[]; species: Species[]; cash: number; day: number; onBuy: (plant: Species) => void; onSell: (specimen: Specimen) => void; tutorialMode?: boolean }) {
  const available = species.filter((plant) => {
    if (tutorialMode) return true;
    const roll = [...(plant.id + day)].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 1000, 7) / 1000;
    return getShopAvailability(plant.rarity, () => roll);
  });
  return <><div className="metric-grid"><Metric label="Available species" value={String(available.length)} detail="Stock varies by rarity and day" icon={ShoppingBag} /><Metric label="Your sale-ready specimens" value={String(specimens.filter((item) => !item.protected).length)} detail="Not protected or reserved" icon={TrendingUp} /><Metric label="Available funds" value={money(cash)} detail="Starting budget: £100" icon={Wallet} tone="gold" /></div><section className="panel"><SectionHeader title="Today's nursery stock" subtitle="Base prices apply to standard juvenile plants. Variegation, stability, health, maturity and genetics affect individual value." />{available.length ? available.map((plant) => { const price = getSpeciesEconomy(plant.id)?.basePrice ?? getSpeciesEconomy(plant.name)?.basePrice ?? plant.basePrice ?? 15; return <div className="shop-listing" key={plant.id}><PlantArt type={plant.image} /><div className="shop-listing-copy"><strong>{plant.name}</strong><span>{plant.rarity} · Juvenile base price</span></div><strong className={tutorialMode ? "tutorial-shop-price" : undefined}>{money(price)}</strong><button className="button button-primary" disabled={cash < price} onClick={() => onBuy(plant)}>{cash < price ? "Too expensive" : "Buy"}</button></div>; }) : <div className="empty-state">No plants available today. Advance a day to refresh stock.</div>}</section><section className="panel"><SectionHeader title="Your plant listings" subtitle="Review each specimen before listing it. Protected plants cannot be sold." />{specimens.map((item) => <div className="shop-listing" key={item.id}><PlantArt type={findSpecies(item.speciesId).image} /><div className="shop-listing-copy"><strong>{item.nickname} · {findSpecies(item.speciesId).name}</strong><span>{item.id} · {item.protected ? "Protected specimen" : "Eligible for sale"}</span></div><strong>{money(item.value)}</strong><button className="button button-primary" disabled={item.protected} onClick={() => onSell(item)}>{item.protected ? "Protected" : "Sell"}</button></div>)}</section></>;
}

function FinancesPage({ cash, day, specimens, weeklyOperatingCost, onSell }: { cash: number; day: number; specimens: Specimen[]; weeklyOperatingCost: number; onSell: (specimen: Specimen) => void }) {
  const inventory = specimens.reduce((sum, specimen) => sum + Math.max(0, specimen.value), 0);
  const protectedInventory = specimens.filter((specimen) => specimen.protected).reduce((sum, specimen) => sum + Math.max(0, specimen.value), 0);
  const saleEligibleInventory = Math.max(0, inventory - protectedInventory);
  const projections = [30, 60, 90].map((days) => projectOperatingCash(cash, day, days, weeklyOperatingCost));
  const monthProjection = projections[0];
  const recovery = estimateRecoverySales(monthProjection.deficit, saleEligibleInventory);
  const catalogueAudit = auditSpeciesEconomy();
  return <>
    <div className="metric-grid">
      <Metric label="Available funds" value={money(cash)} detail="Current local balance" icon={Wallet} tone="gold" />
      <Metric label="Plant inventory" value={money(inventory)} detail="Estimated specimen values" icon={Sprout} />
      <Metric label="Weekly running costs" value={money(weeklyOperatingCost)} detail="Facility and enabled staff care" icon={ArrowDownRight} tone="amber" />
      <Metric label="Net asset estimate" value={money(cash + inventory)} detail="Cash plus estimated inventory" icon={TrendingUp} tone="gold" />
    </div>
    <div className="two-column-layout">
      <section className="panel">
        <SectionHeader title="Financial outlook" subtitle="Cost projection follows the same day-7, day-14, day-21 operating-cost schedule as the simulation." />
        <div className="finance-projection">
          <div className="finance-projection-row"><span>Current cash · Day {day}</span><strong>{money(cash)}</strong></div>
          {projections.map((projection) => <div className={projection.days === 30 ? "finance-projection-row finance-projection-total" : "finance-projection-row"} key={projection.days}><span>{projection.days}-day outlook · {projection.charges} weekly charges</span><strong className={projection.projectedCash < 0 ? "health-low" : "health-good"}>{money(projection.projectedCash)}</strong></div>)}
        </div>
        <p className="muted-copy">This is a cost-only estimate: it excludes future purchases, sales, research spending, upgrades and uncertain income. Inventory values are estimates, not guaranteed proceeds.</p>
        {monthProjection.deficit > 0 && <p className="finance-warning"><AlertTriangle size={15} /> The 30-day outlook shows a £{Math.ceil(monthProjection.deficit)} shortfall. Consider reducing optional running costs or selling eligible stock.</p>}
        {monthProjection.deficit > 0 && <div className="finance-projection"><div className="finance-projection-row"><span>Estimated sale value to cover the shortfall (10% buffer)</span><strong>{money(recovery.targetSaleValue)}</strong></div><div className="finance-projection-row"><span>Additional stock value still needed</span><strong>{money(recovery.inventoryShortfall)}</strong></div></div>}
      </section>
      <aside className="panel">
        <SectionHeader title="Financial safeguards" />
        <div className="safeguard-item"><ShieldCheck size={18} /><div><strong>Upfront costs</strong><span>Shop and upgrade purchases check available funds before spending.</span></div></div>
        <div className="safeguard-item"><ShieldCheck size={18} /><div><strong>Protected stock</strong><span>{money(protectedInventory)} in estimated inventory is protected from manual sale.</span></div></div>
        <div className="safeguard-item"><Clock3 size={18} /><div><strong>Running costs</strong><span>Operating charges are deducted on simulated days divisible by seven.</span></div></div>
        <div className="safeguard-item"><Wallet size={18} /><div><strong>Sale-eligible inventory</strong><span>{money(saleEligibleInventory)} estimated value across unprotected specimens.</span></div></div>
        <div className="safeguard-item"><Database size={18} /><div><strong>Price catalogue review</strong><span>{catalogueAudit.total} economy entries · {catalogueAudit.lowConfidenceNames.length} low-confidence prices flagged for review · {catalogueAudit.duplicateNames.length} duplicate names detected.</span></div></div>
        <p className="muted-copy">The forecast does not assume plants will sell. Actual income depends on player actions; balances can still fall below zero if running costs exceed available funds.</p>
      </aside>
    </div>
  </>;
}
function SettingsPage({ onReplayTutorial, onResetGame, day, specimensCount, catalogSource, saveSlots, onSaveSlot, onLoadSlot }: { onReplayTutorial: () => void; onResetGame: () => void; day: number; specimensCount: number; catalogSource: CatalogueSource; saveSlots: Record<string, GameSave | null>; onSaveSlot: (slot: string) => void; onLoadSlot: (slot: string) => void }) {
  return <div className="settings-layout">
    <section className="panel settings-panel"><div className="settings-heading"><div className="settings-icon"><Settings size={21} /></div><div><h2>Game settings</h2><p>Manage your J2Grows prototype experience.</p></div></div>
      <div className="settings-row"><div><strong>Getting started guide</strong><p>Replay the seven-step introduction to the nursery, collection and gameplay systems.</p></div><button className="button button-quiet" onClick={onReplayTutorial}><BookOpen size={15} /> Replay tutorial</button></div>
      <div className="settings-row"><div><strong>Species catalogue</strong><p>Current catalogue source: <span className="settings-status">{catalogSource === "supabase-table" ? "Supabase species table" : catalogSource === "storage-folders" ? "Supabase Storage folders" : "Local prototype data"}</span></p></div><span className={`pill ${catalogSource === "local" ? "subtle-pill" : ""}`}>{catalogSource === "local" ? "Local fallback" : "Metadata loaded"}</span></div>
      <div className="settings-row"><div><strong>Local save</strong><p>Your progress is stored in this browser. It is not currently synced between devices.</p></div><span className="settings-status"><span className="online-dot" /> Autosaving</span></div>
      <div className="settings-row"><div><strong>Simulation clock</strong><p>Turn-based. Growth, breeding, staff training and weekly costs advance only when you choose to advance an in-game day. Your plants and finances will not change while the game is closed.</p></div><span className="pill">Player controlled</span></div>
      <div className="settings-row"><div><strong>Manual save slots</strong><p>Keep up to three named progression snapshots in this browser, including greenhouse settings and active breeding projects.</p></div><div className="save-slots">{["1","2","3"].map((slot) => <div className="save-slot" key={slot}><span>Slot {slot} · {saveSlots[slot] ? `Day ${saveSlots[slot]!.day}` : "Empty"}</span><button className="button button-quiet" onClick={() => onSaveSlot(slot)}>Save</button><button className="button button-quiet" disabled={!saveSlots[slot]} onClick={() => onLoadSlot(slot)}>Load</button></div>)}</div></div>
      <div className="settings-row"><div><strong>Current session</strong><p>Simulation day {day} · {specimensCount} individual specimens</p></div><span className="pill">Prototype 0.1</span></div>
    </section>
    <section className="panel settings-panel danger-panel"><div className="settings-heading"><div className="settings-icon danger-icon"><AlertTriangle size={21} /></div><div><h2>Reset game</h2><p>Start a new game from the original prototype state.</p></div></div><p className="danger-description">This will replace your current local save, start with £100, no plants and 0 research data, and show the tutorial again. This action cannot be undone.</p><button className="button button-danger" onClick={onResetGame}><AlertTriangle size={15} /> Reset all game progress</button></section>
  </div>;
}

export default App;

import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, Beaker, Bell,
  BookOpen, Building2, Check, ChevronDown, ChevronRight,
  CircleDollarSign, Clock3, Droplets, FlaskConical, Flower2, Gauge, Home, Leaf,
  Menu, Microscope, Plus, Search, Settings, ShieldCheck, ShoppingBag, Sparkles,
  Sprout, Sun, Thermometer, TrendingUp, Users, Wallet, X, Zap
} from "lucide-react";
import { findSpecies, initialSpecimens, setSpeciesCatalog, species as prototypeSpecies, type Species, type Specimen } from "./data";
import { loadSpeciesCatalog } from "./supabase";
import { getSpeciesEconomy, getShopAvailability, STARTING_CASH, type RarityTier } from "./game/catalog";
import { analyseGenetics, createMutation, createSpecimenGenetics, growVariegation, observePlant, calculateSpecimenValue, DEFAULT_ENVIRONMENT, type PlantEnvironment, type SpecimenGenetics } from "./game/genetics";
import { breedingDurationDays, breedingFailureChance, calculateBreedingCost, canBreed, inheritTraits, mutationOccurs, type BreedingProject, RESEARCH_TREE, canUnlockResearch, unlockResearch } from "./game/progression";

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
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
}

function PlantArt({ type, large = false }: { type: string; large?: boolean }) {
  if (type.startsWith("https://") || type.startsWith("http://")) {
    return <div className={`plant-art ${large ? "plant-art-large" : ""}`} role="img" aria-label="Plant species image"><img src={type} alt="" loading="lazy" /></div>;
  }
  return <div className={`plant-art art-${type} ${large ? "plant-art-large" : ""}`} aria-label="Botanical plant artwork">
    <span className="art-leaf leaf-one" /><span className="art-leaf leaf-two" /><span className="art-leaf leaf-three" /><span className="art-leaf leaf-four" /><span className="art-stem" />
    <span className="art-vein vein-one" /><span className="art-vein vein-two" /><span className="art-vein vein-three" />
    <span className="art-glow" />
  </div>;
}

function Metric({ label, value, detail, icon: Icon, tone = "green" }: { label: string; value: string; detail: string; icon: typeof Leaf; tone?: string }) {
  return <div className="metric-card"><div className={`metric-icon tone-${tone}`}><Icon size={19} /></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>;
}

type GameSave = {
  version: 1 | 2 | 3;
  specimens: Specimen[];
  breedingProjects: BreedingProject[];
  cash: number;
  research: number;
  day: number;
  projectStarted: boolean;
  savedAt: number;
  analysisEquipmentLevel: number;
  greenhouseEnvironment?: PlantEnvironment;
  researchUnlocks?: string[];
};

const SAVE_KEY = "j2grows.prototype.save.v1";

function loadGameSave(): GameSave & { offlineDays: number } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GameSave>;
      if ((parsed.version === 1 || parsed.version === 2 || parsed.version === 3) && Array.isArray(parsed.specimens) && typeof parsed.cash === "number" && typeof parsed.research === "number" && typeof parsed.day === "number" && typeof parsed.savedAt === "number") {
        const offlineDays = Math.min(14, Math.floor(Math.max(0, Date.now() - parsed.savedAt) / (10 * 60 * 1000)));
        const days = offlineDays;
        const savedEnvironment = parsed.greenhouseEnvironment && typeof parsed.greenhouseEnvironment === "object" ? parsed.greenhouseEnvironment as PlantEnvironment : { ...DEFAULT_ENVIRONMENT };
        const progressedSpecimens = parsed.specimens.map((specimen) => {
          let current = { ...specimen };
          if (current.dead || current.health <= 0) return { ...current, health: 0, dead: true };
          const genus = findSpecies(current.speciesId).latin.split(" ")[0].toLowerCase();
          const speciesFactor = genus === "anthurium" ? 1.25 : genus === "alocasia" ? 1.1 : ["monstera", "philodendron"].includes(genus) ? 0.9 : 1;
          for (let elapsed = 0; elapsed < days; elapsed += 1) {
            const condition = (savedEnvironment.light + savedEnvironment.nutrition + savedEnvironment.humidity) / 3;
            const effectiveCondition = savedEnvironment.autoCare ? Math.max(60, condition) : condition;
            const health = Math.max(0, Math.min(100, effectiveCondition < 35 ? current.health - 5 : effectiveCondition < 50 ? current.health - 2 : effectiveCondition >= 75 && current.health < 100 ? current.health + 2 : current.health));
            if (health <= 0) { current = { ...current, health: 0, dead: true }; break; }
            let stage = current.stage;
            let stageDays = (current.stageDays ?? 0) + 1;
            const conditionFactor = effectiveCondition < 45 ? 1.5 : effectiveCondition < 65 ? 1.2 : effectiveCondition >= 85 ? 0.85 : 1;
            if (stage === "Corm / Seedling" && health >= 40 && stageDays >= 5) { stage = "Juvenile"; stageDays = 0; }
            else if (stage === "Juvenile" && health >= 40 && stageDays >= Math.ceil(10 * speciesFactor * conditionFactor)) { stage = "Growing"; stageDays = 0; }
            else if (stage === "Growing" && health >= 50 && stageDays >= Math.ceil(21 * speciesFactor * conditionFactor)) { stage = "Mature"; stageDays = 0; }
            else if (stage === "Mature" && health >= 70 && stageDays >= Math.ceil(14 * speciesFactor * conditionFactor)) { stage = "Breeding-ready"; stageDays = 0; }
            current = { ...current, health, stage, stageDays };
          }
          return current;
        });
        return {
          version: 3,
          specimens: progressedSpecimens,
          breedingProjects: Array.isArray(parsed.breedingProjects) ? parsed.breedingProjects : [],
          researchUnlocks: Array.isArray(parsed.researchUnlocks) ? parsed.researchUnlocks.filter((item): item is string => typeof item === "string") : [],
          cash: parsed.cash,
          research: parsed.research,
          day: parsed.day + days,
          projectStarted: Boolean(parsed.projectStarted),
          savedAt: Date.now(),
          analysisEquipmentLevel: typeof parsed.analysisEquipmentLevel === "number" ? parsed.analysisEquipmentLevel : 0,
          greenhouseEnvironment: parsed.greenhouseEnvironment && typeof parsed.greenhouseEnvironment === "object" ? parsed.greenhouseEnvironment as PlantEnvironment : { ...DEFAULT_ENVIRONMENT },
          offlineDays,
        };
      }
    }
  } catch {
    // A malformed or unavailable local save falls back to a fresh prototype save.
  }
  return { version: 3, specimens: [], breedingProjects: [], cash: STARTING_CASH, research: 0, day: 1, projectStarted: false, savedAt: Date.now(), analysisEquipmentLevel: 0, greenhouseEnvironment: { ...DEFAULT_ENVIRONMENT }, offlineDays: 0 };
}

function App() {
  const loadedSave = useMemo(() => loadGameSave(), []);
  const [catalogSpecies, setCatalogSpecies] = useState<Species[]>(prototypeSpecies);
  const [catalogSource, setCatalogSource] = useState<"supabase" | "local">("local");
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
  const [specimens, setSpecimens] = useState<Specimen[]>(loadedSave.specimens.map((specimen) => ({ ...specimen, genetics: specimen.genetics ?? createSpecimenGenetics(specimen.variegation) })));
  const [breedingProjects, setBreedingProjects] = useState<BreedingProject[]>(loadedSave.breedingProjects ?? []);
  const [researchUnlocks, setResearchUnlocks] = useState<string[]>(loadedSave.researchUnlocks ?? []);
  const [cash, setCash] = useState(loadedSave.cash);
  const [research, setResearch] = useState(loadedSave.research);
  const [greenhouseEnvironment, setGreenhouseEnvironment] = useState<PlantEnvironment>(loadedSave.greenhouseEnvironment ?? { ...DEFAULT_ENVIRONMENT });
  const [saveSlots, setSaveSlots] = useState<Record<string, GameSave | null>>(() => {
    try { return JSON.parse(localStorage.getItem("j2grows.manual-save-slots.v1") || '{"1":null,"2":null,"3":null}') as Record<string, GameSave | null>; }
    catch { return { "1": null, "2": null, "3": null }; }
  });
  const [day, setDay] = useState(loadedSave.day);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All plants");
  const [selected, setSelected] = useState<string>(initialSpecimens[0].id);
  const [notice, setNotice] = useState(loadedSave.offlineDays > 0 ? `Welcome back. ${loadedSave.offlineDays} simulated day(s) of eligible offline progress applied.` : "");
  const [projectStarted, setProjectStarted] = useState(loadedSave.projectStarted);
  const [analysisEquipmentLevel, setAnalysisEquipmentLevel] = useState(loadedSave.analysisEquipmentLevel);
  const [showMenu, setShowMenu] = useState(false);
  const [instituteName, setInstituteName] = useState(() => {
    try { return localStorage.getItem("j2grows.institute.name.v1") || ""; } catch { return ""; }
  });
  const [instituteNameDraft, setInstituteNameDraft] = useState(() => {
    try { return localStorage.getItem("j2grows.institute.name.v1") || ""; } catch { return ""; }
  });
  const [starterSpeciesId, setStarterSpeciesId] = useState("alocasia-polly");
  const starterPlant = catalogSpecies.find((item) => item.id === starterSpeciesId) ?? prototypeSpecies.find((item) => item.id === starterSpeciesId) ?? prototypeSpecies[0];
  const starterPrice = getSpeciesEconomy(starterPlant.id)?.basePrice ?? starterPlant.basePrice ?? 15;
  const tutorialSteps: { page: Page; title: string; body: string; tip: string }[] = [
    { page: "Dashboard", title: "Name your institute", body: "Every great botanical institution starts with a name. Choose one that will appear throughout your nursery.", tip: "You can change this later by replaying the introduction or through the institution settings." },
    { page: "Plant Catalogue", title: "Acquire your first plant", body: "Choose an affordable starter species using its base price. This is your first living specimen and the source of your first propagation.", tip: "You start with £100 and can buy a common starter plant for around £10–£20." },
    { page: "Specimen Record", title: "Practise propagation", body: "Use the protected mature demonstration plant to practise propagation straight away. Your ordinary shop purchase remains juvenile, and every normal corm or cutting still requires a mature parent.", tip: "Stem cuttings reset their parent to juvenile and trigger recovery. The demonstration plant is protected so it cannot be accidentally sold." },
    { page: "Greenhouse", title: "Give your new plant time to establish", body: "Advance one simulated day to let your new specimen establish and record its first growth cycle.", tip: "Growing conditions affect new growth, but they do not guarantee a particular outcome." },
    { page: "Specimen Record", title: "Record your first observation", body: "Record the new growth on your propagated plant. Observations build research evidence and help reveal variegation stability over time.", tip: "Mutations are rare and not guaranteed. Research improves your understanding rather than forcing a result." },
  ];
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialOpen, setTutorialOpen] = useState(() => {
    try { return localStorage.getItem("j2grows.tutorial.completed.v1") !== "true"; }
    catch { return true; }
  });
  function saveInstituteName() {
    const name = instituteNameDraft.trim().slice(0, 40);
    if (!name) { announce("Enter a name for your institute to continue."); return; }
    setInstituteName(name);
    setInstituteNameDraft(name);
    try { localStorage.setItem("j2grows.institute.name.v1", name); } catch { /* Keep the name for this session. */ }
    setTutorialStep(1);
    setPage("Plant Catalogue");
    announce(`${name} is ready to grow.`);
  }

  function specimenValue(specimen: Specimen, plantName = findSpecies(specimen.speciesId).name): number {
    const economy = getSpeciesEconomy(specimen.speciesId) ?? getSpeciesEconomy(plantName);
    const record = specimen.genetics ?? createSpecimenGenetics(specimen.variegation);
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
    const id = `J2G-${plant.latin.split(" ")[0].slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const genetics = createSpecimenGenetics(0);
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
      const demoId = `J2G-DEMO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
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
        genetics: createSpecimenGenetics(0),
      };
      demonstration.value = specimenValue(demonstration, plant.name);
      setSpecimens((current) => [...current, specimen, demonstration]);
      setSelected(demoId);
      setTutorialStep(2);
      setPage("Specimen Record");
      announce(`${plant.name} acquired. A protected mature demonstration plant is ready for the tutorial; normal shop plants remain juvenile.`);
    } else {
      setSpecimens((current) => [...current, specimen]);
      setSelected(id);
      announce(`${plant.name} acquired for ${money(cost)}. Its base price is ${money(cost)}; individual value will change with growth and genetics.`);
    }
  }

  function acquireStarterPlant() {
    if (specimens.length > 0) { setTutorialStep(2); setSelected(specimens[0].id); setPage("Specimen Record"); return; }
    acquireSpecies(starterPlant, true);
  }

  function takeTutorialCutting() {
    const parent = specimens.find((item) => item.id === selected) ?? specimens[0];
    if (!parent) { setTutorialStep(1); setPage("Plant Catalogue"); announce("Acquire your first plant before propagating it."); return; }
    const existingOffspring = specimens.find((item) => ["First Cutting", "First Corm", "First Mutation"].includes(item.nickname));
    if (existingOffspring) {
      setTutorialStep(3); setSelected(existingOffspring.id); setPage("Greenhouse"); return;
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
    const offspring: Specimen = {
      id: `J2G-${isAlocasia ? "COR" : "CUT"}-${Date.now().toString().slice(-6)}`,
      speciesId: parent.speciesId, nickname: isAlocasia ? "First Corm" : "First Cutting",
      location: isAlocasia ? "Corm Nursery" : "Propagation Bench",
      health: isAlocasia ? 75 : 85, stage: "Juvenile",
      propagation: isAlocasia ? { method: "corm", phase: "Corm", daysInPhase: 0, daysToSprout: 2 + Math.floor(Math.random() * 4), daysToEstablish: 3 + Math.floor(Math.random() * 3) } : { method: "cutting", phase: "Establishing", daysInPhase: 0, daysToSprout: 0, daysToEstablish: 2 + Math.floor(Math.random() * 3) },
      value: 0,
      protected: false, variegation: parent.variegation, discovered: false, genetics: parent.genetics ? { ...parent.genetics, genetics: { ...parent.genetics.genetics, mutationIds: [...parent.genetics.genetics.mutationIds] }, observations: [], research: { points: 0, observationCount: 0, analysisLevel: 0, discoveredTraits: [], mutations: parent.genetics.research.mutations.map((mutation) => ({ ...mutation, detected: false })) } } : createSpecimenGenetics(parent.variegation),
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
    setPage("Greenhouse");
    announce(isAlocasia ? "First Alocasia corm started. It has its own specimen record." : "First cutting taken. The new specimen has its own identity and record.");
  }

  function growTutorialCutting() {
    const cutting = specimens.find((item) => ["First Cutting", "First Corm", "First Mutation"].includes(item.nickname));
    if (!cutting) { setTutorialStep(1); setPage("Plant Catalogue"); announce("Acquire a plant and propagate it first."); return; }
    const nextSpecimens = advanceDay();
    const nextCutting = nextSpecimens.find((item) => item.id === cutting.id);
    setSelected(cutting.id);
    if (nextCutting?.propagation) {
      setTutorialStep(3);
      setPage("Greenhouse");
      announce(nextCutting.propagation.phase === "Corm"
        ? "One day passed. The corm is still establishing; advance another day and check its conditions."
        : "One day passed. A shoot is developing; give it more time to establish.");
      return;
    }
    setTutorialStep(4);
    setPage("Specimen Record");
    announce("Your propagated specimen has established as a juvenile plant. Record an observation to begin building research evidence.");
  }

  function recordTutorialObservation() {
    const cutting = specimens.find((item) => ["First Cutting", "First Corm", "First Mutation"].includes(item.nickname));
    if (!cutting) { announce("Propagate your first plant before discovering a mutation."); return; }
    const record = cutting.genetics ?? createSpecimenGenetics(cutting.variegation);
    const observed = observePlant(record, cutting.variegation);
    const updated = { ...cutting, genetics: observed, value: specimenValue(cutting) };
    setSpecimens((current) => current.map((item) => item.id === cutting.id ? updated : item));
    setResearch((current) => current + 2);
    setSelected(cutting.id);
    setPage("Specimen Record");
    finishTutorial();
    announce("Growth observation recorded. Research evidence added; future mutations remain rare and uncertain.");
  }

  function finishTutorial() {
    setTutorialOpen(false);
    try { localStorage.setItem("j2grows.tutorial.completed.v1", "true"); } catch { /* Tutorial can still be dismissed for this session. */ }
  }
  function moveTutorial(direction: -1 | 1) {
    const next = tutorialStep + direction;
    if (next < 0) return;
    if (next >= tutorialSteps.length) { finishTutorial(); return; }
    setTutorialStep(next);
    setPage(tutorialSteps[next].page === "Specimen Record" && !specimens.length ? "Plant Catalogue" : tutorialSteps[next].page);
    if (tutorialSteps[next].page === "Specimen Record" && specimens.length) setSelected(specimens[0].id);
  }
  useEffect(() => {
    try {
      const save: GameSave = { version: 3, specimens, breedingProjects, cash, research, day, projectStarted, analysisEquipmentLevel, greenhouseEnvironment, researchUnlocks, savedAt: Date.now() };
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      setNotice("Local save unavailable. Your progress may not persist in this browser.");
    }
  }, [specimens, breedingProjects, cash, research, day, projectStarted, analysisEquipmentLevel, greenhouseEnvironment, researchUnlocks]);

  useEffect(() => {
    try { localStorage.setItem("j2grows.manual-save-slots.v1", JSON.stringify(saveSlots)); }
    catch { setNotice("Manual save slots could not be written to browser storage."); }
  }, [saveSlots]);

  function saveToSlot(slot: string) {
    const save: GameSave = { version: 3, specimens, breedingProjects, cash, research, day, projectStarted, analysisEquipmentLevel, greenhouseEnvironment, researchUnlocks, savedAt: Date.now() };
    setSaveSlots((current) => ({ ...current, [slot]: save }));
    announce(`Saved the current game to slot ${slot}.`);
  }

  function loadFromSlot(slot: string) {
    const save = saveSlots[slot];
    if (!save) { announce(`Save slot ${slot} is empty.`); return; }
    setSpecimens(save.specimens.map((item) => ({ ...item, genetics: item.genetics ?? createSpecimenGenetics(item.variegation) })));
    setBreedingProjects(save.breedingProjects ?? []);
    setResearchUnlocks(save.researchUnlocks ?? []);
    setCash(save.cash); setResearch(save.research); setDay(save.day);
    setProjectStarted(save.projectStarted); setAnalysisEquipmentLevel(save.analysisEquipmentLevel);
    setGreenhouseEnvironment(save.greenhouseEnvironment ?? { ...DEFAULT_ENVIRONMENT });
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
    window.setTimeout(() => setNotice(""), 3200);
  }

  function resetGame() {
    const confirmed = window.confirm("Reset J2Grows? This permanently replaces your current local save with a fresh game and cannot be undone.");
    if (!confirmed) return;
    try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem("j2grows.tutorial.completed.v1"); } catch { /* State can still reset for this session. */ }
    setSpecimens([]);
    setCash(STARTING_CASH);
    setResearch(0);
    setDay(1);
    setProjectStarted(false);
    setAnalysisEquipmentLevel(0);
    setSelected("");
    setInstituteName("");
    setInstituteNameDraft("");
    try { localStorage.removeItem("j2grows.institute.name.v1"); } catch { /* Session state is still reset. */ }
    setQuery("");
    setFilter("All plants");
    setPage("Dashboard");
    setTutorialStep(0);
    setTutorialOpen(true);
    announce(`New game started: ${money(STARTING_CASH)}, no plants, and 0 research data.`);
  }

  function advanceDay(): Specimen[] {
    const nextDay = day + 1;
    let mutationMessage = "";
    const nextSpecimens = specimens.map((specimen) => {
      if (specimen.dead || specimen.health <= 0) return { ...specimen, health: 0, dead: true, value: 0 };
      const rawEnvironmentalMean = (greenhouseEnvironment.light + greenhouseEnvironment.nutrition + greenhouseEnvironment.humidity) / 3;
      const environmentalMean = greenhouseEnvironment.autoCare ? Math.max(60, rawEnvironmentalMean) : rawEnvironmentalMean;
      const health = Math.max(0, Math.min(100, environmentalMean < 35 ? specimen.health - 5 : environmentalMean < 50 ? specimen.health - 2 : environmentalMean >= 75 && specimen.health < 100 ? specimen.health + 2 : specimen.health));
      const record = specimen.genetics ?? createSpecimenGenetics(specimen.variegation);
      const environment = { ...greenhouseEnvironment, health };
      const growth = growVariegation(record.genetics, environment, specimen.variegation);
      let nextRecord: SpecimenGenetics = { ...record, environment, expression: growth.expression };
      let nextVariegation = growth.expression;
      let discovered = specimen.discovered;
      if (mutationOccurs("growth", environment, Math.floor(research / 50), analysisEquipmentLevel * 0.001)) {
        const mutation = createMutation();
        mutation.detected = false;
        nextRecord = { ...nextRecord, genetics: { ...nextRecord.genetics, mutationIds: [...new Set([...nextRecord.genetics.mutationIds, mutation.id])] }, research: { ...nextRecord.research, mutations: [...nextRecord.research.mutations, mutation] } };
        if (mutation.category === "colour") { nextVariegation = Math.min(100, Math.max(nextVariegation, 35 + Math.round(Math.random() * 35))); nextRecord = { ...nextRecord, genetics: { ...nextRecord.genetics, variegationPotential: Math.max(nextRecord.genetics.variegationPotential, nextVariegation) } }; }
        if (mutation.detected) {
          discovered = true;
          mutationMessage = ` A ${mutation.rarity.toLowerCase()} ${mutation.category} mutation was detected in ${specimen.nickname}.`;
        }
      }
      let propagation = specimen.propagation;
      let stage = specimen.stage;
      let stageDays = specimen.stageDays ?? 0;
      let location = specimen.location;
      let growthMessage = "";
      const suitability = (greenhouseEnvironment.light + greenhouseEnvironment.nutrition + greenhouseEnvironment.humidity + health) / 4;
      const conditionFactor = suitability < 45 ? 1.5 : suitability < 65 ? 1.2 : suitability >= 85 ? 0.85 : 1;
      const genus = findSpecies(specimen.speciesId).latin.split(" ")[0].toLowerCase();
      const speciesFactor = genus === "anthurium" ? 1.25 : genus === "alocasia" ? 1.1 : ["monstera", "philodendron"].includes(genus) ? 0.9 : 1;
      if (propagation) {
        const delay = suitability < 45 ? 2 : suitability < 65 ? 1 : 0;
        propagation = { ...propagation, daysInPhase: propagation.daysInPhase + 1 };
        if (propagation.phase === "Cutting" && propagation.daysInPhase >= propagation.daysToSprout + delay) {
          propagation = { ...propagation, phase: "Rooting", daysInPhase: 0 };
          location = "Propagation Bench · Rooting";
          growthMessage = ` ${specimen.nickname} has begun rooting.`;
        } else if (propagation.phase === "Rooting" && propagation.daysInPhase >= propagation.daysToEstablish + delay) {
          propagation = { ...propagation, phase: "New Growth", daysInPhase: 0 };
          location = "Propagation Bench · New Growth";
          growthMessage = ` ${specimen.nickname} is showing new growth.`;
        } else if (propagation.phase === "New Growth" && propagation.daysInPhase >= (propagation.daysToJuvenile ?? 5) + delay) {
          propagation = undefined;
          stage = "Juvenile";
          stageDays = 0;
          location = "Greenhouse · Establishing";
          growthMessage = ` ${specimen.nickname} has established as a juvenile plant.`;
        } else if (propagation.phase === "Corm" && propagation.daysInPhase >= propagation.daysToSprout + delay) {
          propagation = { ...propagation, phase: "Sprouting", daysInPhase: 0 };
          location = "Corm Nursery · Sprouting";
          growthMessage = ` ${specimen.nickname} has started sprouting.`;
        } else if (propagation.phase === "Sprouting" && propagation.daysInPhase >= propagation.daysToEstablish + delay) {
          propagation = undefined;
          stage = "Juvenile";
          stageDays = 0;
          location = "Greenhouse · Establishing";
          growthMessage = ` ${specimen.nickname} has established as a juvenile plant.`;
        } else if (propagation.phase === "Establishing" && propagation.daysInPhase >= propagation.daysToEstablish + delay) {
          propagation = undefined;
          stage = "Juvenile";
          stageDays = 0;
          location = "Greenhouse";
          growthMessage = ` ${specimen.nickname} has established as a juvenile plant.`;
        }
        if (propagation?.phase === "Sprouting") stage = "Juvenile";
      } else {
        stageDays += 1;
        if (stage === "Corm / Seedling" && health >= 40 && stageDays >= 5) {
          stage = "Juvenile";
          stageDays = 0;
          growthMessage = ` ${specimen.nickname} has established from seedling to juvenile growth.`;
        } else if (stage === "Juvenile" && health >= 40 && stageDays >= Math.ceil(10 * speciesFactor * conditionFactor)) {
          stage = "Growing";
          stageDays = 0;
          growthMessage = ` ${specimen.nickname} has entered the growing stage.`;
        } else if (stage === "Growing" && health >= 50 && stageDays >= Math.ceil(21 * speciesFactor * conditionFactor)) {
          stage = "Mature";
          stageDays = 0;
          growthMessage = ` ${specimen.nickname} has reached maturity.`;
        } else if (stage === "Mature" && health >= 70 && stageDays >= Math.ceil(14 * speciesFactor * conditionFactor)) {
          stage = "Breeding-ready";
          stageDays = 0;
          growthMessage = ` ${specimen.nickname} is now breeding-ready.`;
        }
      }
      const updated = { ...specimen, health, dead: health <= 0, stage, stageDays, location, propagation, variegation: nextVariegation, discovered, genetics: { ...nextRecord, expression: nextVariegation, environment } };
      if (growthMessage) mutationMessage += growthMessage;
      return { ...updated, value: specimenValue(updated) };
    });
    const activeProjects = breedingProjects.filter((project) => project.status === "active");
    const finishedIds = new Set<string>();
    const completedChildren: Specimen[] = [];
    const completedProjects = activeProjects.map((project) => {
      if (project.completesOnDay > nextDay) return project;
      const parentA = nextSpecimens.find((item) => item.id === project.parentAId);
      const parentB = nextSpecimens.find((item) => item.id === project.parentBId);
      finishedIds.add(project.id);
      if (!parentA || !parentB || parentA.dead || parentB.dead || parentA.health <= 0 || parentB.health <= 0) {
        mutationMessage += ` Breeding project ${project.id} was cancelled because a parent died; its cost was lost.`;
        return { ...project, status: "cancelled" as const };
      }
      if (Math.random() < project.failureChance) {
        mutationMessage += ` Breeding project ${project.id} failed; its cost was lost, but both parents survived.`;
        return { ...project, status: "cancelled" as const };
      }
      const recordA = parentA.genetics ?? createSpecimenGenetics(parentA.variegation);
      const recordB = parentB.genetics ?? createSpecimenGenetics(parentB.variegation);
      const inherited = inheritTraits(recordA.genetics, recordB.genetics);
      const generation = Math.max(parentA.generation ?? 0, parentB.generation ?? 0) + 1;
      const inheritedMutationIds = inherited.mutationIds;
      const stabilityGenerations = Object.fromEntries(inheritedMutationIds.map((mutationId) => [mutationId, Math.max(parentA.stabilityGenerations?.[mutationId] ?? 0, parentB.stabilityGenerations?.[mutationId] ?? 0) + 1]));
      const stableMutationIds = inheritedMutationIds.filter((mutationId) => (stabilityGenerations[mutationId] ?? 0) >= 3);
      const inheritedMutationRecords = [...recordA.research.mutations, ...recordB.research.mutations]
        .filter((mutation, index, all) => inheritedMutationIds.includes(mutation.id) && all.findIndex((candidate) => candidate.id === mutation.id) === index)
        .map((mutation) => ({ ...mutation, detected: false, evidenceCount: 0 }));
      const childId = `J2G-LINE-${nextDay.toString().padStart(4, "0")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      const childVariation = Math.round(inherited.variegationPotential);
      const child: Specimen = {
        id: childId, speciesId: parentA.speciesId, nickname: `Genetic Line ${generation} · ${completedChildren.length + 1}`,
        location: "Propagation Bench", health: 88, stage: "Corm / Seedling", stageDays: 0,
        geneticLineId: project.lineId, lineParentIds: [parentA.id, parentB.id], generation, stabilityGenerations, stableMutationIds,
        value: 0, protected: false, variegation: childVariation, discovered: false,
        genetics: { ...createSpecimenGenetics(childVariation), genetics: inherited, research: { points: 0, observationCount: 0, analysisLevel: 0, discoveredTraits: stableMutationIds.length ? ["multi-generation-stability"] : [], mutations: inheritedMutationRecords } },
      };
      if (mutationOccurs("breeding", child.genetics!.environment, researchUnlocks.includes("mutation-screening") ? 2 : 0, researchUnlocks.includes("mutation-screening") ? 0.01 : 0)) {
        const mutation = createMutation();
        mutation.detected = false;
        child.genetics = { ...child.genetics!, genetics: { ...child.genetics!.genetics, mutationIds: [...new Set([...child.genetics!.genetics.mutationIds, mutation.id])] }, research: { ...child.genetics!.research, mutations: [...child.genetics!.research.mutations, mutation] } };
        mutationMessage += ` A potential mutation appeared in ${child.nickname}; recorded evidence is needed to confirm it.`;
      }
      child.value = specimenValue(child);
      completedChildren.push(child);
      if (researchUnlocks.includes("batch-breeding")) {
        for (let batchIndex = 2; batchIndex <= 3; batchIndex += 1) {
          const batchProfile = inheritTraits(recordA.genetics, recordB.genetics);
          const batchChild: Specimen = {
            ...child,
            id: `${childId}-B${batchIndex}`,
            nickname: `Genetic Line ${generation} · ${completedChildren.length}`,
            variegation: Math.round(batchProfile.variegationPotential),
            genetics: { ...createSpecimenGenetics(batchProfile.variegationPotential), genetics: batchProfile, research: { points: 0, observationCount: 0, analysisLevel: 0, discoveredTraits: [], mutations: inheritedMutationRecords.map((mutation) => ({ ...mutation, detected: false, evidenceCount: 0 })) } },
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
    const finalSpecimens = [...releasedSpecimens, ...completedChildren];
    const weeklyOperatingCost = analysisEquipmentLevel * 5 + (researchUnlocks.includes("routine-automation") ? 10 : 0);
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

  useEffect(() => {
    const timer = window.setInterval(() => advanceDay(), 10 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [day, specimens, greenhouseEnvironment, breedingProjects, research, analysisEquipmentLevel, researchUnlocks, projectStarted]);

  function observeSelectedSpecimen() {
    if (!activeSpecimen) return;
    if (activeSpecimen.lastObservedDay === day) {
      announce(`${activeSpecimen.nickname} has already been observed today. Advance a day before recording another observation.`);
      return;
    }
    const record = activeSpecimen.genetics ?? createSpecimenGenetics(activeSpecimen.variegation);
    const observed = observePlant(record, activeSpecimen.variegation);
    const updated = { ...activeSpecimen, genetics: observed, lastObservedDay: day, value: specimenValue(activeSpecimen) };
    setSpecimens((current) => current.map((item) => item.id === activeSpecimen.id ? updated : item));
    setResearch((current) => current + 2);
    announce(`Observation recorded for ${activeSpecimen.nickname}. Evidence added to its field record.`);
  }

  function analyseSelectedSpecimen() {
    if (!activeSpecimen) return;
    const record = activeSpecimen.genetics ?? createSpecimenGenetics(activeSpecimen.variegation);
    if (record.research.analysisLevel >= 3) {
      announce(`${activeSpecimen.nickname} has completed all available genetic analysis levels.`);
      return;
    }
    if (research < 25) { announce("Genetic analysis requires at least 25 global research data."); return; }
    const analysedRecord = { ...record, research: { ...record.research, points: Math.max(record.research.points, 25) } };
    const analysed = analyseGenetics(analysedRecord, 25);
    if (!analysed) { announce("More observation evidence is needed before analysis."); return; }
    setResearch((current) => current - analysisCost);
    setSpecimens((current) => current.map((item) => { if (item.id !== activeSpecimen.id) return item; const updated = { ...item, genetics: { ...analysed, research: { ...analysed.research, mutations: analysed.research.mutations.map((mutation) => ({ ...mutation, detected: mutation.detected })) } } }; return { ...updated, value: specimenValue(updated) }; }));
    announce(`Analysis complete for ${activeSpecimen.nickname}. Research level ${analysed.research.analysisLevel} unlocked.`);
  }

  function purchaseSpecies(plant: Species) {
    acquireSpecies(plant);
  }

  function propagateSpecimen(parent: Specimen, method: PropagationMethod) {
    const plant = findSpecies(parent.speciesId);
    const genus = plant.latin.split(" ")[0].toLowerCase();
    const allowed = !parent.dead && !parent.reservedByProjectId && (method === "division" || method === "tissue-culture"
      || (method === "cutting" && ["monstera", "philodendron", "anthurium"].includes(genus) && (parent.stage === "Mature" || parent.stage === "Breeding-ready"))
      || (method === "corm" && genus === "alocasia" && (parent.stage === "Mature" || parent.stage === "Breeding-ready")));
    if (!allowed) {
      announce(method === "cutting"
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
    const count = method === "cutting" ? 1 + Math.floor(Math.random() * 3) : 1;
    const totalCost = detail.cost * count;
    if (cash < totalCost) { announce(`Not enough funds. ${count > 1 ? `${count} cuttings cost ${money(totalCost)} in total` : `${detail.label} propagation costs ${money(totalCost)}`}.`); return; }
    const children: Specimen[] = Array.from({ length: count }, (_, index) => {
      const suffix = `${Date.now().toString(36).toUpperCase()}-${index}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      const child: Specimen = {
        id: `J2G-${detail.prefix}-${suffix}`,
        speciesId: parent.speciesId,
        nickname: `${plant.name} ${detail.nickname}${count > 1 ? ` ${index + 1}` : ""}`,
        location: detail.location,
        health: detail.health,
        stage: "Juvenile",
        propagation: { method, phase: method === "corm" ? "Corm" : method === "cutting" ? "Cutting" : "Establishing", daysInPhase: 0, daysToSprout: method === "corm" ? 2 + Math.floor(Math.random() * 4) : method === "cutting" ? 2 + Math.floor(Math.random() * 3) : 0, daysToEstablish: 3 + Math.floor(Math.random() * 3), daysToJuvenile: method === "cutting" ? 4 + Math.floor(Math.random() * 3) : undefined },
        value: 0,
        protected: false,
        variegation: parent.variegation,
        discovered: false,
        genetics: parent.genetics ? { ...parent.genetics, genetics: { ...parent.genetics.genetics, mutationIds: [...parent.genetics.genetics.mutationIds] }, observations: [], research: { points: 0, observationCount: 0, analysisLevel: 0, discoveredTraits: [], mutations: parent.genetics.research.mutations.map((mutation) => ({ ...mutation, detected: false })) } } : createSpecimenGenetics(parent.variegation),
      };
      if (mutationOccurs("propagation", child.genetics!.environment, researchUnlocks.includes("propagation-science") ? 1 : 0, researchUnlocks.includes("propagation-science") ? 0.005 : 0)) {
        const mutation = createMutation();
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
    if (specimen.protected) {
      announce("This specimen is protected. Remove its protection before selling.");
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

  function runCross(parentAId: string, parentBId: string) {
    const parentA = specimens.find((item) => item.id === parentAId);
    const parentB = specimens.find((item) => item.id === parentBId);
    if (!parentA || !parentB || parentA.id === parentB.id) {
      announce("Choose two different available parent specimens.");
      return;
    }
    if (!canBreed(parentA.stage, parentB.stage, parentA.health, parentB.health, Boolean(parentA.reservedByProjectId), Boolean(parentB.reservedByProjectId)) || parentA.dead || parentB.dead) {
      announce("Both parents must be healthy, alive, Breeding-ready and available.");
      return;
    }
    const speciesA = findSpecies(parentA.speciesId);
    const speciesB = findSpecies(parentB.speciesId);
    const genusA = speciesA.latin.split(" ")[0];
    const genusB = speciesB.latin.split(" ")[0];
    if (genusA !== genusB) {
      announce("This prototype supports crosses within the same genus.");
      return;
    }
    const rarityA = (getSpeciesEconomy(speciesA.id)?.rarity ?? speciesA.rarity) as RarityTier;
    const rarityB = (getSpeciesEconomy(speciesB.id)?.rarity ?? speciesB.rarity) as RarityTier;
    const cost = calculateBreedingCost(rarityA, rarityB, 1, researchUnlocks.includes("selective-breeding") ? 10 : 0);
    if (cash < cost) {
      announce(`This breeding project costs ${money(cost)}. You currently have ${money(cash)}.`);
      return;
    }
    const id = `BRD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const condition = (greenhouseEnvironment.light + greenhouseEnvironment.nutrition + greenhouseEnvironment.humidity + parentA.health + parentB.health) / 5;
    const project: BreedingProject = {
      id, parentAId, parentBId, startedDay: day,
      completesOnDay: day + breedingDurationDays(5, researchUnlocks.includes("selective-breeding") ? 15 : 0),
      cost, status: "active",
      failureChance: breedingFailureChance(researchUnlocks.includes("selective-breeding") ? 3 : 0, condition),
      lineId: `LINE-${Date.now().toString(36).toUpperCase()}`,
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

  function startResearch() {
    if (projectStarted) {
      announce("Mutation Analysis is already in progress.");
      return;
    }
    if (cash < 25) {
      announce("Not enough funds to start this research project.");
      return;
    }
    setCash((current) => current - 25);
    setProjectStarted(true);
    announce("Mutation Analysis started for £25. Your research team is on it.");
  }

  const pageTitle = page === "Plant Catalogue" ? "Plant Catalogue" : page === "Specimen Record" ? activeSpecies.name : page;

  return <div className="app-shell">
    <aside className={`sidebar ${showMenu ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark"><Leaf size={27} /></div><div className="brand-name">J2Grows</div><div className="brand-tagline">CULTIVATE · DISCOVER · BREED · BUILD</div></div>
      <div className="institution-switch"><div className="institution-emblem"><Sprout size={19} /></div><div><strong>{instituteName || "Unnamed Institute"}</strong><span>Home institution</span></div><ChevronDown size={14} /></div>
      <nav className="main-nav">{nav.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${page === label || (page === "Specimen Record" && label === "Plant Catalogue") ? "active" : ""}`} onClick={() => { setPage(label); setShowMenu(false); }}><Icon size={17} /><span>{label}</span>{label === "Research" && <span className="nav-dot" />}</button>)}</nav>
      <div className="sidebar-bottom"><div className="facility-mini"><div className="facility-mini-top"><span>STARTER FACILITY</span><span className="status-dot" /></div><strong>Home greenhouse</strong><div className="facility-progress"><span style={{ width: "36%" }} /></div><small>36% capacity used</small></div><div className="season-card"><Sun size={18} /><div><strong>Year 1 · Spring</strong><span>Day {day}</span></div><button onClick={advanceDay} title="Advance one day"><ArrowRight size={16} /></button></div><div className="sidebar-footer"><span><span className="online-dot" /> Local save active</span><div className="sidebar-footer-actions"><button onClick={() => { setTutorialStep(0); setPage("Dashboard"); setTutorialOpen(true); }} aria-label="Open tutorial" title="Tutorial"><BookOpen size={16} /></button><button onClick={() => { setPage("Settings"); setShowMenu(false); }} aria-label="Settings" title="Settings"><Settings size={16} /></button></div></div></div>
    </aside>

    <main className="main-area">
      {notice && <div className="notice-banner" role="status"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={15} /></button></div>}
      <header className="topbar">
        <button className="mobile-menu icon-button" onClick={() => setShowMenu((value) => !value)} aria-label="Toggle navigation"><Menu size={18} /></button>
        <div className="top-institution"><span className="top-leaf"><Leaf size={21} /></span><div><strong>J2Grows</strong><span>{instituteName || "Name your institute"}</span></div></div>
        <div className="top-resource"><span className="resource-symbol">£</span><div><strong>{money(cash)}</strong><small>Available funds</small></div></div>
        <div className="top-resource research-resource"><span className="resource-symbol"><Beaker size={17} /></span><div><strong>{research.toLocaleString("en-GB")}</strong><small>Research data</small></div></div>
        <div className="top-level"><div className="level-star"><Sprout size={18} /></div><div className="level-info"><div><strong>Institution level 1</strong><span>First roots</span></div><div className="progress-track"><span style={{ width: "28%" }} /></div></div></div>
        <button className="icon-button notification-button" onClick={() => announce("You're all caught up on nursery alerts.")} aria-label="Notifications"><Bell size={17} /><i /></button>
        <button className="profile-chip" onClick={() => announce(instituteName || "Name your institute in the guided introduction.")}><div className="profile-avatar"><Leaf size={18} /></div><div><strong>Nursery Manager</strong><span>Founder</span></div><ChevronDown size={14} /></button>
      </header>

      <div className="page-content">
        <section className="page-heading">
          <div><div className="eyebrow"><span className="eyebrow-line" /> YOUR BOTANICAL INSTITUTION</div><h1>{pageTitle}</h1><p>{page === "Dashboard" ? "A living collection. A growing body of knowledge. A nursery built by you." : page === "Plant Catalogue" ? "Browse your collection, compare traits and manage every individual specimen." : page === "Specimen Record" ? "An individual record of genetics, health, lineage and provenance." : page === "Breeding" ? "Choose parent plants, explore possibilities and build remarkable genetic lines." : page === "Research" ? "Turn observations into knowledge, methods and new capabilities." : page === "Greenhouse" ? "Keep your plants healthy and tune their growing environments." : page === "Facilities" ? "Grow from a home greenhouse into a specialist botanical institution." : page === "Staff" ? "Build a capable team and gradually automate your daily work." : page === "Shop" ? "Sell remarkable specimens and reinvest in your institution." : page === "Settings" ? "Manage your local save and game preferences." : "Understand your cash flow and plan sustainable expansion."}</p></div>
          <div className="heading-actions"><button className="button button-quiet" onClick={() => announce("Your collection has been saved locally in this session.")}><ShieldCheck size={15} /> Save status</button><button className="button button-primary" onClick={advanceDay}><Zap size={15} /> Advance day <ArrowRight size={14} /></button></div>
        </section>

        {page === "Dashboard" && <Dashboard specimens={specimens} cash={cash} research={research} day={day} projectStarted={projectStarted} onNavigate={setPage} onSelect={(id) => { setSelected(id); setPage("Specimen Record"); }} onAdvance={advanceDay} />}
        {page === "Plant Catalogue" && <Catalogue specimens={filteredSpecimens} species={catalogSpecies} catalogSource={catalogSource} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} onSelect={(id) => { setSelected(id); setPage("Specimen Record"); }} onSell={sellSpecimen} />}
        {page === "Specimen Record" && <SpecimenPage specimen={activeSpecimen} plant={activeSpecies} onPropagate={(method) => propagateSpecimen(activeSpecimen, method)} onSell={() => sellSpecimen(activeSpecimen)} onObserve={observeSelectedSpecimen} onAnalyse={analyseSelectedSpecimen} researchPoints={research} currentDay={day} onToggleProtection={() => setSpecimens((current) => current.map((item) => item.id === activeSpecimen.id ? { ...item, protected: !item.protected } : item))} onBack={() => setPage("Plant Catalogue")} announce={announce} />}
        {page === "Breeding" && <BreedingPage specimens={specimens} onCross={runCross} />}
        {page === "Research" && <ResearchPage cash={cash} research={research} projectStarted={projectStarted} onStart={startResearch} announce={announce} researchUnlocks={researchUnlocks} onUnlockResearch={unlockResearchNode} />}
        {page === "Greenhouse" && <GreenhousePage specimens={specimens} onSelect={(id) => { setSelected(id); setPage("Specimen Record"); }} onApplyEnvironment={(humidity, temperature, autoCare) => setGreenhouseEnvironment({ ...greenhouseEnvironment, humidity, temperature, autoCare, lightHours: 14, light: 70, nutrition: Math.max(20, 100 - Math.abs(temperature - 24) * 7) })} environment={greenhouseEnvironment} autoCareUnlocked={researchUnlocks.includes("routine-automation")} announce={announce} />}
        {page === "Facilities" && <FacilitiesPage cash={cash} analysisEquipmentLevel={analysisEquipmentLevel} onBuy={(name, cost) => { if (cash < cost) announce("Not enough funds for this upgrade."); else { setCash((value) => value - cost); if (name === "Analysis workstation") setAnalysisEquipmentLevel((level) => level + 1); announce(name === "Analysis workstation" ? "Analysis workstation upgraded. Mutation detection and research are more effective." : "Facility upgrade purchased. New capacity is being prepared."); } }} />}
        {page === "Staff" && <StaffPage />}
        {page === "Shop" && <ShopPage specimens={specimens} species={catalogSpecies} cash={cash} day={day} onBuy={purchaseSpecies} onSell={sellSpecimen} />}
        {page === "Finances" && <FinancesPage cash={cash} specimens={specimens} />}
        {page === "Settings" && <SettingsPage onReplayTutorial={() => { setTutorialStep(0); setPage("Dashboard"); setTutorialOpen(true); }} onResetGame={resetGame} day={day} specimensCount={specimens.length} catalogSource={catalogSource} saveSlots={saveSlots} onSaveSlot={saveToSlot} onLoadSlot={loadFromSlot} />}
      </div>
      <footer className="app-footer"><span>J2Grows <span className="footer-separator">/</span> Prototype 0.1</span><span>All specimen and economic values are early prototype data.</span><span><span className="online-dot" /> Offline-first</span></footer>
    </main>
    {tutorialOpen && <div className="tutorial-backdrop" role="presentation"><section className="tutorial-dialog" role="dialog" aria-modal="true" aria-labelledby="tutorial-title"><div className="tutorial-topline"><span className="tutorial-mark"><Sprout size={19} /></span><span>J2GROWS FIRST-GROW GUIDE</span><button className="tutorial-close" onClick={finishTutorial} aria-label="Close tutorial"><X size={17} /></button></div><div className="tutorial-progress-label"><span>YOUR FIRST DISCOVERY</span><span>{String(tutorialStep + 1).padStart(2, "0")} / {String(tutorialSteps.length).padStart(2, "0")}</span></div><div className="tutorial-progress-track"><span style={{ width: `${((tutorialStep + 1) / tutorialSteps.length) * 100}%` }} /></div><div className="tutorial-content"><div className="tutorial-eyebrow"><span className="eyebrow-line" /> GUIDED TUTORIAL</div><h2 id="tutorial-title">{tutorialSteps[tutorialStep].title}</h2><p>{tutorialSteps[tutorialStep].body}</p>
      {tutorialStep === 0 && <div className="guided-field"><label htmlFor="institute-name">Institute name</label><input id="institute-name" maxLength={40} value={instituteNameDraft} onChange={(event) => setInstituteNameDraft(event.target.value)} placeholder="e.g. Verdant Research Institute" autoFocus /><small>Up to 40 characters. You can rename it later.</small></div>}
      {tutorialStep === 1 && <div className="guided-field"><label htmlFor="starter-species">Choose your first plant · base price</label><select id="starter-species" value={starterSpeciesId} onChange={(event) => setStarterSpeciesId(event.target.value)}>{["alocasia-polly", "anthurium-clarinervium", "monstera-adansonii", "philodendron-birkin"].map((id) => { const plant = catalogSpecies.find((item) => item.id === id) ?? prototypeSpecies.find((item) => item.id === id); const labels: Record<string, string> = { "alocasia-polly": "Alocasia Polly", "anthurium-clarinervium": "Anthurium clarinervium", "monstera-adansonii": "Monstera Adansonii", "philodendron-birkin": "Philodendron Birkin" }; return <option key={id} value={id}>{labels[id]}{plant ? ` · ${plant.rarity}` : ""}</option>; })}</select><div className="guided-balance">Base price: <strong>{money(starterPrice)}</strong> · Available funds: <strong>{money(cash)}</strong></div></div>}
      {tutorialStep === 2 && <div className="guided-action-summary"><span className="guided-action-icon"><Sprout size={20} /></span><div><strong>{starterSpeciesId === "alocasia-polly" ? "Start an Alocasia corm" : "Take one healthy cutting"}</strong><p>Cost: {money(starterSpeciesId === "alocasia-polly" ? 2 : 4)} · Creates a separate specimen record.</p></div></div>}
      {tutorialStep === 3 && <div className="guided-action-summary"><span className="guided-action-icon"><Sun size={20} /></span><div><strong>Advance one simulated day</strong><p>Your plant will grow under current conditions. Mutations remain rare and uncertain.</p></div></div>}
      {tutorialStep === 4 && <div className="guided-action-summary mutation-summary"><span className="guided-action-icon"><Sparkles size={20} /></span><div><strong>First observation: variegation expression</strong><p>Record the current expression and add evidence to your specimen’s research record. Mutations are not guaranteed.</p></div></div>}
      <div className="tutorial-tip"><Leaf size={16} /><span>{tutorialSteps[tutorialStep].tip}</span></div></div><div className="tutorial-footer"><button className="button button-quiet" onClick={finishTutorial}>Skip guide</button><div>{tutorialStep > 0 && <button className="button button-quiet tutorial-back" onClick={() => moveTutorial(-1)}>Back</button>}{tutorialStep === 0 ? <button className="button button-primary" onClick={saveInstituteName}>Name institute <ArrowRight size={15} /></button> : tutorialStep === 1 ? <button className="button button-primary" onClick={acquireStarterPlant} disabled={cash < starterPrice}>Acquire plant · {money(starterPrice)} <ArrowRight size={15} /></button> : tutorialStep === 2 ? <button className="button button-primary" onClick={takeTutorialCutting} disabled={cash < (starterSpeciesId === "alocasia-polly" ? 2 : 4)}>{starterSpeciesId === "alocasia-polly" ? "Start corm · £2" : "Take cutting · £4"} <ArrowRight size={15} /></button> : tutorialStep === 3 ? <button className="button button-primary" onClick={growTutorialCutting}>Advance one day <ArrowRight size={15} /></button> : <button className="button button-primary" onClick={recordTutorialObservation}><Sparkles size={15} /> Record observation</button>}</div></div></section></div>}
  </div>;
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: string }) {
  return <div className="section-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action && <button className="text-action">{action}<ArrowRight size={14} /></button>}</div>;
}

function Dashboard({ specimens, cash, research, day, projectStarted, onNavigate, onSelect, onAdvance }: { specimens: Specimen[]; cash: number; research: number; day: number; projectStarted: boolean; onNavigate: (page: Page) => void; onSelect: (id: string) => void; onAdvance: () => void }) {
  const needsAttention = specimens.filter((item) => item.health < 80);
  const averageHealth = Math.round(specimens.reduce((total, item) => total + item.health, 0) / Math.max(specimens.length, 1));
  return <>
    <div className="hero-panel"><div className="hero-copy"><div className="eyebrow"><Sprout size={13} /> THE WORK OF GROWING SOMETHING EXTRAORDINARY</div><h2>Every discovery<br /><em>starts with a leaf.</em></h2><p>Your nursery is taking root. Tend your collection, learn from each generation, and build towards your first recognised cultivar.</p><div className="hero-actions"><button className="button button-primary" onClick={() => onNavigate("Plant Catalogue")}>Explore collection <ArrowRight size={15} /></button><button className="button button-quiet" onClick={() => onNavigate("Research")}><Microscope size={15} /> Open research</button></div></div><div className="hero-art"><div className="hero-art-glow" /><PlantArt type="hero" large /><div className="hero-caption"><span>SPECIMEN STUDY · 001</span><strong>New growth, new possibilities.</strong></div></div><div className="hero-index"><span>01</span><span className="index-line" /><span>BOTANICAL JOURNAL</span></div></div>
    <div className="metric-grid"><Metric label="Collection" value={String(specimens.length).padStart(2, "0")} detail="Individual specimens" icon={Sprout} /><Metric label="Average plant health" value={`${averageHealth}%`} detail={needsAttention.length ? `${needsAttention.length} need attention` : "Collection thriving"} icon={Activity} tone={needsAttention.length ? "amber" : "green"} /><Metric label="Research data" value={research.toLocaleString("en-GB")} detail={projectStarted ? "1 active programme" : "Ready to invest"} icon={Beaker} tone="gold" /><Metric label="Available funds" value={money(cash)} detail="Operating balance" icon={Wallet} tone="gold" /></div>
    <div className="dashboard-grid">
      <section className="panel attention-panel"><SectionHeader title="Needs your attention" subtitle="A considered routine keeps the collection thriving." action="View all" /><div className="attention-list">{needsAttention.length ? needsAttention.map((item) => <button className="attention-item" key={item.id} onClick={() => onSelect(item.id)}><div className="attention-icon"><AlertTriangle size={17} /></div><div className="attention-copy"><strong>{item.nickname} needs a check</strong><span>{findSpecies(item.speciesId).name} · Health at {item.health}%</span></div><span className="attention-priority">Review</span><ChevronRight size={15} /></button>) : <div className="empty-state"><ShieldCheck size={20} /><span>No urgent plant-health alerts. Keep up the good work.</span></div>}<button className="attention-item" onClick={() => onNavigate("Research")}><div className="attention-icon research-attention"><FlaskConical size={17} /></div><div className="attention-copy"><strong>{projectStarted ? "Mutation Analysis in progress" : "Your first research programme awaits"}</strong><span>{projectStarted ? "Review the current research programme" : "Invest in understanding a promising trait"}</span></div><span className="attention-priority calm">{projectStarted ? "Active" : "Available"}</span><ChevronRight size={15} /></button></div></section>
      <section className="panel activity-panel"><SectionHeader title="Institutional progress" subtitle="Small steps become a remarkable collection." action="View goals" /><div className="milestone-card"><div className="milestone-top"><span className="milestone-kicker">CURRENT MILESTONE</span><span className="milestone-count">01 / 05</span></div><h3>Establish your first growing space</h3><p>Build a healthy foundation before expanding your collection or research ambitions.</p><div className="milestone-progress"><span style={{ width: "60%" }} /></div><div className="milestone-bottom"><span>3 of 5 foundations in place</span><button onClick={onAdvance}>Make progress <ArrowRight size={13} /></button></div></div><div className="activity-row"><span className="activity-icon"><Leaf size={16} /></span><div><strong>Collection growing steadily</strong><span>Day {day} · Your plants are ready for another care cycle.</span></div><span className="activity-time">Now</span></div><div className="activity-row"><span className="activity-icon gold-icon"><BookOpen size={16} /></span><div><strong>Field journal updated</strong><span>Observations are preserved in each specimen record.</span></div><span className="activity-time">Today</span></div></section>
    </div>
    <section className="panel collection-panel"><SectionHeader title="Selected specimens" subtitle="Individual plants, each with a story and a genetic future." action="Open catalogue" /><div className="specimen-strip">{specimens.slice(0, 4).map((item) => { const plant = findSpecies(item.speciesId); return <button key={item.id} className="specimen-card" onClick={() => onSelect(item.id)}><PlantArt type={plant.image} /><div className="specimen-card-body"><span className="specimen-id">{item.id}</span><strong>{item.nickname}</strong><span>{plant.name}</span><div className="specimen-card-bottom"><span className={item.health < 80 ? "health-low" : "health-good"}><span className="status-dot" /> {item.health}% health</span><span>{money(item.value)}</span></div></div></button>; })}<button className="add-specimen-card" onClick={() => onNavigate("Plant Catalogue")}><span className="add-circle"><Plus size={19} /></span><strong>Explore the catalogue</strong><span>Discover your next specimen</span><ArrowRight size={15} /></button></div></section>
  </>;
}

function Catalogue({ specimens, species, catalogSource, query, setQuery, filter, setFilter, onSelect, onSell }: { specimens: Specimen[]; species: Species[]; catalogSource: "supabase" | "local"; query: string; setQuery: (value: string) => void; filter: string; setFilter: (value: string) => void; onSelect: (id: string) => void; onSell: (specimen: Specimen) => void }) {
  const filters = ["All plants", "Protected", "Needs attention", "Ready to sell"];
  return <><div className="catalogue-layout"><aside className="panel catalogue-filters"><SectionHeader title="Collection filters" /><label className="search-field"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search plants or specimen ID" /></label><div className="filter-heading">QUICK VIEWS</div>{filters.map((item) => <button key={item} className={`filter-option ${filter === item ? "selected" : ""}`} onClick={() => setFilter(item)}><span>{item}</span>{filter === item && <Check size={14} />}</button>)}<div className="filter-note"><ShieldCheck size={16} /><p>Protected specimens are excluded from automated sale. Each plant retains its own identity and history.</p></div></aside><section className="catalogue-main"><div className="catalogue-toolbar"><div><h2>Your collection</h2><span>{specimens.length} individual specimens</span></div><span className="pill subtle-pill">Specimen view</span></div>{specimens.length ? <div className="catalogue-grid">{specimens.map((item) => { const plant = findSpecies(item.speciesId); return <article key={item.id} className="catalogue-card"><button className="catalogue-art-button" onClick={() => onSelect(item.id)} aria-label={`Open ${item.nickname}`}><PlantArt type={plant.image} large /><span className="art-label">{plant.rarity}</span></button><div className="catalogue-card-content"><span className="specimen-id">{item.id}</span><h3>{item.nickname}</h3><p>{plant.name}</p><div className="trait-pills">{plant.traits.slice(0, 2).map((trait) => <span key={trait}>{trait}</span>)}</div><div className="catalogue-card-stats"><span><Activity size={13} /> {item.health}% health</span><strong>{money(item.value)}</strong></div><div className="catalogue-card-actions"><button className="button button-quiet" onClick={() => onSelect(item.id)}>Record</button><button className="button button-primary" disabled={item.protected} onClick={() => onSell(item)}>{item.protected ? "Protected" : "Sell"}</button></div></div></article>; })}</div> : <div className="empty-panel"><Search size={24} /><h3>No specimens match</h3><p>Try another search or clear the current filter.</p><button className="button button-quiet" onClick={() => { setQuery(""); setFilter("All plants"); }}>Clear filters</button></div>}</section></div><section className="panel species-library"><div className="section-header"><div><h2>Species library</h2><p>{species.length} species folders · {catalogSource === "supabase" ? "Loaded from Supabase storage" : "Using the local prototype catalogue"}</p></div><span className="pill subtle-pill">{catalogSource === "supabase" ? "Connected" : "Local fallback"}</span></div><div className="species-library-grid">{species.map((plant) => <article className="species-library-card" key={plant.id}><PlantArt type={plant.image} /><div><strong>{plant.name}</strong><span>{plant.latin === "Species details not yet recorded" ? plant.id : plant.latin}</span></div></article>)}</div></section></>;
}

function SpecimenPage({ specimen, plant, onSell, onToggleProtection, onBack, onPropagate, onObserve, onAnalyse, researchPoints, currentDay, announce }: { specimen: Specimen; plant: ReturnType<typeof findSpecies>; onSell: () => void; onToggleProtection: () => void; onBack: () => void; onPropagate: (method: "cutting" | "division" | "corm" | "tissue-culture") => void; onObserve: () => void; onAnalyse: () => void; researchPoints: number; currentDay: number; announce: (message: string) => void }) {
  const genus = plant.latin.split(" ")[0].toLowerCase();
  const isAlocasia = genus === "alocasia";
  const supportsCuttings = ["monstera", "philodendron", "anthurium"].includes(genus);
  const rarity = getSpeciesEconomy(plant.id)?.rarity ?? getSpeciesEconomy(plant.name)?.rarity ?? plant.rarity;
  return <><button className="back-link" onClick={onBack}><ArrowRight size={14} /> Back to catalogue</button><div className="specimen-detail-grid"><section className="panel specimen-portrait"><PlantArt type={plant.image} large /><div className="portrait-overlay"><span className="eyebrow">INDIVIDUAL SPECIMEN</span><h2>{specimen.nickname}</h2><p>{plant.name}</p><span className="specimen-id">{specimen.id}</span></div></section><section className="panel specimen-detail-main"><SectionHeader title="Specimen overview" subtitle="Identity, condition and provenance." /><div className="detail-stat-grid"><div><span>Health</span><strong className={specimen.health < 80 ? "health-low" : "health-good"}>{specimen.health}%</strong></div><div><span>Stage</span><strong>{specimen.propagation?.phase ?? specimen.stage}</strong></div><div><span>Estimated value</span><strong>{money(specimen.value)}</strong></div><div><span>Variegation</span><strong>{specimen.variegation}%</strong></div></div><div className="detail-section"><h3>Species notes</h3><p>{plant.summary}</p><div className="care-grid"><div><Sun size={15} /><span>Light</span><strong>{plant.light}</strong></div><div><Droplets size={15} /><span>Humidity</span><strong>{plant.humidity}</strong></div></div></div><div className="detail-section"><h3>Current traits</h3><div className="trait-pills larger-pills">{plant.traits.map((trait) => <span key={trait}>{trait}</span>)}</div><p className="muted-copy">Visible expression is observed; stability and hidden potential are estimated until research reveals more.</p></div><div className="detail-section"><h3>Genetic profile</h3><div className="detail-stat-grid"><div><span>Variegation potential</span><strong>{specimen.genetics ? Math.round(specimen.genetics.research.analysisLevel >= 1 ? specimen.genetics.genetics.variegationPotential : Math.round(specimen.genetics.genetics.variegationPotential / 10) * 10) + "%" : "Unknown"}</strong></div><div><span>Stability estimate</span><strong>{specimen.genetics ? "~" + Math.round(specimen.genetics.genetics.stability) + "%" : "Unassessed"}</strong></div><div><span>Hidden potential</span><strong>{(specimen.genetics?.research.analysisLevel ?? 0) >= 2 ? Math.round(specimen.genetics?.genetics.hiddenPotential ?? 0) + "%" : "Unrevealed"}</strong></div><div><span>Research level</span><strong>{specimen.genetics?.research.analysisLevel ?? 0}</strong></div></div><p className="muted-copy">Observations: {specimen.genetics?.research.observationCount ?? 0} · Research data available: {researchPoints}</p><div className="propagation-actions"><button className="button button-quiet" disabled={specimen.lastObservedDay === currentDay} onClick={onObserve}><BookOpen size={15} /> Record observation (+2 research)</button><button className="button button-quiet" disabled={researchPoints < 25 || (specimen.genetics?.research.analysisLevel ?? 0) >= 3} onClick={onAnalyse}><Microscope size={15} /> {(specimen.genetics?.research.analysisLevel ?? 0) >= 3 ? "Analysis complete" : "Analyse genetics · 25 data"}</button></div>{specimen.genetics?.research.mutations.filter((mutation) => mutation.detected).map((mutation) => <p className="muted-copy" key={mutation.id}>Detected mutation: {mutation.name} · {mutation.rarity} · {mutation.inheritance} inheritance</p>)}</div><div className="detail-section"><h3>Propagation methods</h3><p className="muted-copy">Each method creates a separate juvenile specimen. Costs and outcomes are prototype values.</p><div className="propagation-actions">{supportsCuttings && <button className="button button-quiet" onClick={() => onPropagate("cutting")}><Sprout size={15} /> Stem cutting · {money(propagationCost("cutting", rarity))}</button>}<button className="button button-quiet" onClick={() => onPropagate("division")}><Sprout size={15} /> Division / offset · {money(propagationCost("division", rarity))}</button>{isAlocasia && <button className="button button-quiet" onClick={() => onPropagate("corm")}><Sprout size={15} /> Corm · {money(propagationCost("corm", rarity))}</button>}<button className="button button-quiet" onClick={() => onPropagate("tissue-culture")}><FlaskConical size={15} /> Tissue culture · {money(propagationCost("tissue-culture", rarity))}</button></div><p className="muted-copy">{isAlocasia ? "Alocasia can be propagated from corms, divisions / offsets or through tissue culture." : supportsCuttings ? "Stem cuttings, divisions / offsets and tissue culture are available for this plant group." : "Division / offsets and tissue culture are available for this species in the current prototype."}</p></div><div className="detail-actions"><button className="button button-quiet" onClick={onToggleProtection}><ShieldCheck size={15} /> {specimen.protected ? "Remove protection" : "Protect specimen"}</button><button className="button button-primary" disabled={specimen.protected} onClick={onSell}>{specimen.protected ? "Protected from sale" : `Sell for ${money(specimen.value)}`}</button></div></section><aside className="panel provenance-panel"><SectionHeader title="Record & provenance" /><div className="provenance-item"><span>Current location</span><strong>{specimen.location}</strong></div><div className="provenance-item"><span>Protection status</span><strong className={specimen.protected ? "health-good" : ""}>{specimen.protected ? "Protected" : "Sale eligible"}</strong></div><div className="provenance-item"><span>Lineage</span><strong>Founder collection</strong></div><div className="provenance-item"><span>Observation history</span><strong>3 field notes</strong></div><button className="button button-quiet full-width" onClick={() => announce("The detailed lineage viewer is planned for a later milestone.")}>View family tree <ArrowRight size={14} /></button></aside></div></>;
}

function BreedingPage({ specimens, onCross }: { specimens: Specimen[]; onCross: (parentA: string, parentB: string) => void }) {
  const [parentA, setParentA] = useState(specimens.find((item) => findSpecies(item.speciesId).latin.startsWith("Philodendron"))?.id ?? specimens[0]?.id ?? "");
  const [parentB, setParentB] = useState(specimens.find((item) => findSpecies(item.speciesId).name === "Pink Princess")?.id ?? specimens[1]?.id ?? "");
  const genus = (id: string) => {
    const item = specimens.find((specimen) => specimen.id === id);
    return item ? findSpecies(item.speciesId).latin.split(" ")[0] : "";
  };
  const compatible = specimens.filter((item) => item.id !== parentA && genus(item.id) === genus(parentA));
  return <div className="two-column-layout"><section className="panel"><SectionHeader title="Breeding workbench" subtitle="Choose source specimens and review the experiment before committing resources." /><div className="breeding-parent-grid">{[{ label: "Parent A", value: parentA, set: setParentA, options: specimens }, { label: "Parent B", value: parentB, set: setParentB, options: compatible }].map((parent) => <div className="parent-picker" key={parent.label}><span className="filter-heading">{parent.label.toUpperCase()}</span><select value={parent.value} onChange={(event) => parent.set(event.target.value)}>{parent.options.map((item) => <option key={item.id} value={item.id}>{item.nickname} · {findSpecies(item.speciesId).name}</option>)}</select>{parent.value && specimens.find((item) => item.id === parent.value) && <PlantArt type={findSpecies(specimens.find((item) => item.id === parent.value)!.speciesId).image} large />}</div>)}</div><div className="experiment-summary"><div><span>Method</span><strong>Controlled cross · prototype</strong></div><div><span>Supplies cost</span><strong>£4</strong></div><div><span>Duration</span><strong>1 simulated day</strong></div></div><p className="muted-copy">Inheritance blends both parents, includes bounded variation and can occasionally produce mutations. Outcomes are never guaranteed.</p><button className="button button-primary" disabled={!parentA || !parentB || parentA === parentB || genus(parentA) !== genus(parentB)} onClick={() => onCross(parentA, parentB)}>Run cross · £4 <ArrowRight size={15} /></button></section><aside className="panel"><SectionHeader title="Outcome preview" subtitle="Possible outcomes, not guarantees." /><div className="outcome-art"><PlantArt type="monstera" large /></div><h3>Trait observation</h3><p className="muted-copy">Parent profiles influence offspring traits; research and equipment improve discovery, while mutation outcomes remain uncertain.</p><div className="provenance-item"><span>Parent A</span><strong>{specimens.find((item) => item.id === parentA)?.nickname ?? "Not selected"}</strong></div><div className="provenance-item"><span>Parent B</span><strong>{specimens.find((item) => item.id === parentB)?.nickname ?? "Not selected"}</strong></div></aside></div>;
}

function ResearchPage({ cash, research, projectStarted, onStart, announce, researchUnlocks, onUnlockResearch }: { cash: number; research: number; projectStarted: boolean; onStart: () => void; announce: (message: string) => void; researchUnlocks: string[]; onUnlockResearch: (id: string) => void }) {
  return <div className="research-layout"><section className="panel"><SectionHeader title="Research pathways" subtitle="Unlock permanent capabilities through a branching research tree." /><div className="research-tree">{RESEARCH_TREE.map((node) => { const unlocked = researchUnlocks.includes(node.id); const prerequisitesMet = node.prerequisites.every((id) => researchUnlocks.includes(id)); return <div className={`research-node ${unlocked ? "node-done" : prerequisitesMet && research >= node.cost ? "node-current" : "node-locked"}`} key={node.id}><div className="node-icon">{unlocked ? <Check size={18} /> : <Beaker size={18} />}</div><div><strong>{node.id.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ")}</strong><span>{node.description} · Cost: {node.cost} research</span></div><button className="button button-quiet" disabled={unlocked || !canUnlockResearch(node.id, { points: research, unlocked: researchUnlocks, completed: researchUnlocks })} onClick={() => onUnlockResearch(node.id)}>{unlocked ? "Unlocked" : prerequisitesMet ? "Unlock" : "Prerequisites"}</button></div>; })}</div></section><aside className="panel project-panel"><div className="eyebrow"><FlaskConical size={13} /> RECOMMENDED PROJECT</div><h2>Mutation Analysis</h2><p>Record unusual traits, gather specimen evidence and validate promising discoveries.</p><div className="project-art"><PlantArt type="philodendron" large /></div><div className="project-cost"><span>Estimated cost</span><strong>{money(25)}</strong></div><div className="project-cost"><span>Available funds</span><strong>{money(cash)}</strong></div><div className="project-cost"><span>Research data</span><strong>{research.toLocaleString("en-GB")}</strong></div><button className="button button-primary full-width" disabled={projectStarted || cash < 25} onClick={onStart}>{projectStarted ? "Project in progress" : cash < 25 ? "Insufficient funds" : "Begin project"}<ArrowRight size={15} /></button><button className="button button-quiet full-width" onClick={() => announce("Choose a research branch to unlock targeted capabilities.")}>Explore research branches</button></aside></div>;
}
function GreenhousePage({ specimens, onSelect, onApplyEnvironment, environment, autoCareUnlocked, announce }: { specimens: Specimen[]; onSelect: (id: string) => void; onApplyEnvironment: (humidity: number, temperature: number, autoCare: boolean) => void; environment: PlantEnvironment; autoCareUnlocked: boolean; announce: (message: string) => void }) {
  const [humidity, setHumidity] = useState(environment.humidity);
  const [temperature, setTemperature] = useState(environment.temperature ?? 24);
  const [autoCare, setAutoCare] = useState(environment.autoCare ?? false);
  return <><div className="metric-grid"><Metric label="Temperature" value={`${temperature}°C`} detail="Target range 22–28°C" icon={Thermometer} /><Metric label="Humidity" value={`${humidity}%`} detail="Tropical zone" icon={Droplets} /><Metric label="Light schedule" value="14 hours" detail="Daily light period" icon={Sun} /><Metric label="Air circulation" value="Good" detail="Fans operating" icon={Activity} /></div><div className="two-column-layout"><section className="panel"><SectionHeader title="Growing zone · Tropical Aroids" subtitle="A simple first greenhouse zone." action="Zone details" /><div className="zone-visual"><PlantArt type="hero" large /><div><span className="pill">ACTIVE ZONE</span><h2>Home Greenhouse</h2><p>Species-specific controls will expand as equipment and research are unlocked.</p></div></div><div className="control-row"><label htmlFor="temp">Temperature <strong>{temperature}°C</strong></label><input id="temp" type="range" min="18" max="32" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} /></div><div className="control-row"><label htmlFor="humidity">Humidity <strong>{humidity}%</strong></label><input id="humidity" type="range" min="40" max="95" value={humidity} onChange={(event) => setHumidity(Number(event.target.value))} /></div><button className={`button ${autoCare ? "button-primary" : "button-quiet"}`} disabled={!autoCareUnlocked} onClick={() => setAutoCare((value) => !value)}><Zap size={15} /> Auto-care {autoCare ? "enabled" : autoCareUnlocked ? "paused" : "locked"}</button><button className="button button-quiet" onClick={() => { onApplyEnvironment(humidity, temperature, autoCare); announce("Growing conditions applied. New growth and variegation stability will respond over time."); }}>Apply environment</button></section><section className="panel"><SectionHeader title="Plants in this zone" subtitle="Select a specimen to inspect its record." />{specimens.map((item) => <button className="zone-plant-row" key={item.id} onClick={() => onSelect(item.id)}><PlantArt type={findSpecies(item.speciesId).image} /><span><strong>{item.nickname}</strong><small>{findSpecies(item.speciesId).name}</small></span><span className={item.health < 80 ? "health-low" : "health-good"}>{item.health}%</span><ChevronRight size={15} /></button>)}</section></div></>;
}

function FacilitiesPage({ cash, analysisEquipmentLevel, onBuy }: { cash: number; analysisEquipmentLevel: number; onBuy: (name: string, cost: number) => void }) {
  const upgrades = [
    { name: "Propagation bench", description: "Increase space for cuttings and seedlings.", cost: 1200, icon: Sprout, level: 0 },
    { name: "Environmental controller", description: "Unlock more consistent greenhouse conditions.", cost: 2400, icon: Gauge, level: 0 },
    { name: "Analysis workstation", description: "Improve mutation detection and reveal genetic potential more effectively.", cost: 35, icon: Microscope, level: analysisEquipmentLevel },
  ];
  return <><div className="facility-hero"><div><div className="eyebrow">CURRENT FACILITY</div><h2>Home greenhouse</h2><p>Begin with a focused growing setup. Expansion is always your choice.</p><div className="facility-tags"><span><Check size={13} /> Local cultivation</span><span><Check size={13} /> Basic propagation</span></div></div><div className="facility-hero-art"><PlantArt type="hero" large /></div></div><section className="panel"><SectionHeader title="Available improvements" subtitle="Spend carefully; each upgrade should support your current goals." /><div className="upgrade-grid">{upgrades.map(({ name, description, cost, icon: Icon, level }) => <article className="upgrade-card" key={name}><div className="upgrade-icon"><Icon size={20} /></div><h3>{name}</h3><p>{description}</p>{name === "Analysis workstation" && <div className="provenance-item"><span>Current level</span><strong>{level}</strong></div>}<div className="upgrade-cost">{money(cost)}</div><button className="button button-primary full-width" disabled={cash < cost} onClick={() => onBuy(name, cost)}>{cash < cost ? "Not enough funds" : "Purchase upgrade"}</button></article>)}</div></section></>;
}

function StaffPage() {
  const [autoCare, setAutoCare] = useState(true);
  const [training, setTraining] = useState(false);
  return <><div className="metric-grid"><Metric label="Team capacity" value="1 helper" detail="Starter workforce" icon={Users} /><Metric label="Care automation" value={autoCare ? "Active" : "Paused"} detail="Routine greenhouse checks" icon={Sprout} /><Metric label="Training" value={training ? "In progress" : "Available"} detail="Develop specialist skills" icon={BookOpen} /></div><div className="two-column-layout"><section className="panel"><SectionHeader title="Your team" subtitle="Begin with practical help; specialist departments unlock later." /><div className="staff-profile"><div className="staff-avatar"><Sprout size={24} /></div><div><span className="eyebrow">STARTER ROLE</span><h2>Greenhouse Assistant</h2><p>Supports watering checks, routine observations and quarantine reminders.</p><div className="trait-pills"><span>Plant care</span><span>Reliable</span><span>Beginner</span></div></div></div><div className="control-row"><label>Routine care automation <strong>{autoCare ? "On" : "Off"}</strong></label><button className={`button ${autoCare ? "button-primary" : "button-quiet"}`} onClick={() => setAutoCare((value) => !value)}>{autoCare ? "Pause routine care" : "Enable routine care"}</button></div><button className="button button-quiet" onClick={() => setTraining((value) => !value)}>{training ? "Cancel training" : "Start basic plant-care training"}</button></section><aside className="panel"><SectionHeader title="Future departments" subtitle="Build towards goal-driven specialist teams." />{["Cultivation & Biosecurity", "Propagation & Tissue Culture", "Genetics & Analysis", "Automation & Production"].map((name, index) => <div className="department-row" key={name}><span className="department-index">0{index + 1}</span><strong>{name}</strong><span className="pill subtle-pill">Future</span></div>)}</aside></div></>;
}

function ShopPage({ specimens, species, cash, day, onBuy, onSell }: { specimens: Specimen[]; species: Species[]; cash: number; day: number; onBuy: (plant: Species) => void; onSell: (specimen: Specimen) => void }) {
  const available = species.filter((plant) => {
    const roll = [...(plant.id + day)].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 1000, 7) / 1000;
    return getShopAvailability(plant.rarity, () => roll);
  });
  return <><div className="metric-grid"><Metric label="Available species" value={String(available.length)} detail="Stock varies by rarity and day" icon={ShoppingBag} /><Metric label="Your sale-ready specimens" value={String(specimens.filter((item) => !item.protected).length)} detail="Not protected or reserved" icon={TrendingUp} /><Metric label="Available funds" value={money(cash)} detail="Starting budget: £100" icon={Wallet} tone="gold" /></div><section className="panel"><SectionHeader title="Today's nursery stock" subtitle="Base prices apply to standard juvenile plants. Variegation, stability, health, maturity and genetics affect individual value." />{available.length ? available.map((plant) => { const price = getSpeciesEconomy(plant.id)?.basePrice ?? getSpeciesEconomy(plant.name)?.basePrice ?? plant.basePrice ?? 15; return <div className="shop-listing" key={plant.id}><PlantArt type={plant.image} /><div className="shop-listing-copy"><strong>{plant.name}</strong><span>{plant.rarity} · Juvenile base price</span></div><strong>{money(price)}</strong><button className="button button-primary" disabled={cash < price} onClick={() => onBuy(plant)}>{cash < price ? "Too expensive" : "Buy"}</button></div>; }) : <div className="empty-state">No plants available today. Advance a day to refresh stock.</div>}</section><section className="panel"><SectionHeader title="Your plant listings" subtitle="Review each specimen before listing it. Protected plants cannot be sold." />{specimens.map((item) => <div className="shop-listing" key={item.id}><PlantArt type={findSpecies(item.speciesId).image} /><div className="shop-listing-copy"><strong>{item.nickname} · {findSpecies(item.speciesId).name}</strong><span>{item.id} · {item.protected ? "Protected specimen" : "Eligible for sale"}</span></div><strong>{money(item.value)}</strong><button className="button button-primary" disabled={item.protected} onClick={() => onSell(item)}>{item.protected ? "Protected" : "Sell"}</button></div>)}</section></>;
}

function FinancesPage({ cash, specimens }: { cash: number; specimens: Specimen[] }) {
  const inventory = specimens.reduce((sum, specimen) => sum + specimen.value, 0);
  return <><div className="metric-grid"><Metric label="Available funds" value={money(cash)} detail="Local prototype balance" icon={Wallet} tone="gold" /><Metric label="Plant inventory" value={money(inventory)} detail="Estimated specimen values" icon={Sprout} /><Metric label="Operating costs" value={money(85)} detail="Illustrative daily estimate" icon={ArrowDownRight} tone="amber" /><Metric label="Net asset estimate" value={money(cash + inventory)} detail="Cash plus plant inventory" icon={TrendingUp} tone="gold" /></div><div className="two-column-layout"><section className="panel"><SectionHeader title="Financial outlook" subtitle="A transparent view of your current institution." /><div className="finance-chart"><div className="chart-y-labels"><span>£50k</span><span>£35k</span><span>£20k</span><span>£5k</span></div><svg viewBox="0 0 560 190" role="img" aria-label="Illustrative cash balance trend"><defs><linearGradient id="cashFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#a5c76d" stopOpacity=".25" /><stop offset="100%" stopColor="#a5c76d" stopOpacity="0" /></linearGradient></defs><path d="M0 145 C55 132 70 150 112 112 S190 122 232 92 S310 98 352 66 S435 72 478 42 S530 35 560 18 L560 190 L0 190 Z" fill="url(#cashFill)" /><path d="M0 145 C55 132 70 150 112 112 S190 122 232 92 S310 98 352 66 S435 72 478 42 S530 35 560 18" fill="none" stroke="#a5c76d" strokeWidth="3" /></svg></div><div className="chart-months"><span>Current</span><span>Projection +30 days</span></div><p className="muted-copy">This is an illustrative balance trend, not yet a simulated forecast. Future versions will calculate operating costs, debt, sales and research spending.</p></section><aside className="panel"><SectionHeader title="Financial safeguards" /><div className="safeguard-item"><ShieldCheck size={18} /><div><strong>Upfront costs</strong><span>Upgrades show their price before purchase.</span></div></div><div className="safeguard-item"><AlertTriangle size={18} /><div><strong>Bankruptcy rules</strong><span>Not yet simulated. Warnings and recovery rules will be defined before financial failure is introduced.</span></div></div><div className="safeguard-item"><Clock3 size={18} /><div><strong>Offline expenses</strong><span>Daily running costs are not deducted in this prototype.</span></div></div></aside></div></>;
}


export default App;


function SettingsPage({ onReplayTutorial, onResetGame, day, specimensCount, catalogSource, saveSlots, onSaveSlot, onLoadSlot }: { onReplayTutorial: () => void; onResetGame: () => void; day: number; specimensCount: number; catalogSource: "supabase" | "local"; saveSlots: Record<string, GameSave | null>; onSaveSlot: (slot: string) => void; onLoadSlot: (slot: string) => void }) {
  return <div className="settings-layout">
    <section className="panel settings-panel"><div className="settings-heading"><div className="settings-icon"><Settings size={21} /></div><div><h2>Game settings</h2><p>Manage your J2Grows prototype experience.</p></div></div>
      <div className="settings-row"><div><strong>Getting started guide</strong><p>Replay the seven-step introduction to the nursery, collection and gameplay systems.</p></div><button className="button button-quiet" onClick={onReplayTutorial}><BookOpen size={15} /> Replay tutorial</button></div>
      <div className="settings-row"><div><strong>Species catalogue</strong><p>Current catalogue source: <span className="settings-status">{catalogSource === "supabase" ? "Supabase connected" : "Local prototype data"}</span></p></div><span className={`pill ${catalogSource === "supabase" ? "" : "subtle-pill"}`}>{catalogSource === "supabase" ? "Connected" : "Fallback mode"}</span></div>
      <div className="settings-row"><div><strong>Local save</strong><p>Your progress is stored in this browser. It is not currently synced between devices.</p></div><span className="settings-status"><span className="online-dot" /> Autosaving</span></div>
      <div className="settings-row"><div><strong>Manual save slots</strong><p>Keep up to three named progression snapshots in this browser, including greenhouse settings and active breeding projects.</p></div><div className="save-slots">{["1","2","3"].map((slot) => <div className="save-slot" key={slot}><span>Slot {slot} · {saveSlots[slot] ? `Day ${saveSlots[slot]!.day}` : "Empty"}</span><button className="button button-quiet" onClick={() => onSaveSlot(slot)}>Save</button><button className="button button-quiet" disabled={!saveSlots[slot]} onClick={() => onLoadSlot(slot)}>Load</button></div>)}</div></div>
      <div className="settings-row"><div><strong>Current session</strong><p>Simulation day {day} · {specimensCount} individual specimens</p></div><span className="pill">Prototype 0.1</span></div>
    </section>
    <section className="panel settings-panel danger-panel"><div className="settings-heading"><div className="settings-icon danger-icon"><AlertTriangle size={21} /></div><div><h2>Reset game</h2><p>Start a new game from the original prototype state.</p></div></div><p className="danger-description">This will replace your current local save, start with £100, no plants and 0 research data, and show the tutorial again. This action cannot be undone.</p><button className="button button-danger" onClick={onResetGame}><AlertTriangle size={15} /> Reset all game progress</button></section>
  </div>;
}

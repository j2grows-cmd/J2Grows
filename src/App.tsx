import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, Beaker, Bell,
  BookOpen, BriefcaseBusiness, Building2, Check, ChevronDown, ChevronRight,
  CircleDollarSign, Clock3, Droplets, FlaskConical, Flower2, Gauge, Home, Leaf,
  Menu, Microscope, Plus, Search, Settings, ShieldCheck, ShoppingBag, Sparkles,
  Sprout, Sun, Thermometer, TrendingUp, Users, Wallet, X, Zap
} from "lucide-react";
import { findSpecies, initialSpecimens, setSpeciesCatalog, species as prototypeSpecies, type Species, type Specimen } from "./data";
import { loadSpeciesCatalog } from "./supabase";
import { getSpeciesEconomy, getShopAvailability, STARTING_CASH, type RarityTier } from "./game/catalog";
import { analyseGenetics, createMutation, createSpecimenGenetics, growVariegation, inheritGenetics, observePlant, shouldDiscoverMutation, calculateSpecimenValue, DEFAULT_ENVIRONMENT, type PlantEnvironment, type SpecimenGenetics } from "./game/genetics";

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
  version: 1 | 2;
  specimens: Specimen[];
  cash: number;
  research: number;
  day: number;
  projectStarted: boolean;
  savedAt: number;
};

const SAVE_KEY = "j2grows.prototype.save.v1";

function loadGameSave(): GameSave & { offlineDays: number } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GameSave>;
      if ((parsed.version === 1 || parsed.version === 2) && Array.isArray(parsed.specimens) && typeof parsed.cash === "number" && typeof parsed.research === "number" && typeof parsed.day === "number" && typeof parsed.savedAt === "number") {
        const offlineDays = Math.min(14, Math.floor(Math.max(0, Date.now() - parsed.savedAt) / (10 * 60 * 1000)));
        const days = offlineDays;
        return {
          version: 1,
          specimens: parsed.specimens.map((specimen) => ({ ...specimen, health: Math.min(100, Math.max(0, specimen.health + (specimen.health < 90 ? days * 2 : 0))) })),
          cash: parsed.cash,
          research: parsed.research + days * 25,
          day: parsed.day + days,
          projectStarted: Boolean(parsed.projectStarted),
          savedAt: Date.now(),
          offlineDays,
        };
      }
    }
  } catch {
    // A malformed or unavailable local save falls back to a fresh prototype save.
  }
  return { version: 2, specimens: [], cash: STARTING_CASH, research: 0, day: 1, projectStarted: false, savedAt: Date.now(), offlineDays: 0 };
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
  const [cash, setCash] = useState(loadedSave.cash);
  const [research, setResearch] = useState(loadedSave.research);
  const [greenhouseEnvironment, setGreenhouseEnvironment] = useState<PlantEnvironment>({ ...DEFAULT_ENVIRONMENT });
  const [day, setDay] = useState(loadedSave.day);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All plants");
  const [selected, setSelected] = useState<string>(initialSpecimens[0].id);
  const [notice, setNotice] = useState(loadedSave.offlineDays > 0 ? `Welcome back. ${loadedSave.offlineDays} simulated day(s) of eligible offline progress applied.` : "");
  const [projectStarted, setProjectStarted] = useState(loadedSave.projectStarted);
  const [showMenu, setShowMenu] = useState(false);
  const [instituteName, setInstituteName] = useState(() => {
    try { return localStorage.getItem("j2grows.institute.name.v1") || ""; } catch { return ""; }
  });
  const [instituteNameDraft, setInstituteNameDraft] = useState(() => {
    try { return localStorage.getItem("j2grows.institute.name.v1") || ""; } catch { return ""; }
  });
  const [starterSpeciesId, setStarterSpeciesId] = useState("alocasia-polly");
  const starterPlant = catalogSpecies.find((item) => item.id === starterSpeciesId) ?? prototypeSpecies.find((item) => item.id === starterSpeciesId) ?? prototypeSpecies[0];
  const starterPrice = getSpeciesEconomy(starterPlant.name)?.basePrice ?? starterPlant.basePrice ?? 15;
  const tutorialSteps: { page: Page; title: string; body: string; tip: string }[] = [
    { page: "Dashboard", title: "Name your institute", body: "Every great botanical institution starts with a name. Choose one that will appear throughout your nursery.", tip: "You can change this later by replaying the introduction or through the institution settings." },
    { page: "Plant Catalogue", title: "Acquire your first plant", body: "Choose an affordable starter species using its base price. This is your first living specimen and the source of your first propagation.", tip: "You start with £100 and can buy a common starter plant for around £10–£20." },
    { page: "Specimen Record", title: "Propagate your first plant", body: "Create your first new specimen using a propagation method that fits your chosen plant. Costs vary by method and species rarity.", tip: "Most aroids can be propagated in several ways, but Alocasia uses corms rather than stem cuttings here." },
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
    const economy = getSpeciesEconomy(plantName);
    const record = specimen.genetics ?? createSpecimenGenetics(specimen.variegation);
    return calculateSpecimenValue({
      basePrice: economy?.basePrice ?? findSpecies(specimen.speciesId).basePrice ?? 15,
      health: specimen.health,
      stage: specimen.stage,
      variegationStrength: specimen.variegation,
      stability: record.genetics.stability,
      geneticsBonus: Math.min(2, 1 + Math.max(0, record.genetics.growthPotential - 50) / 100 + ((record.research.analysisLevel >= 2) ? record.genetics.hiddenPotential / 200 : 0)),
      discoveryBonus: specimen.discovered ? 1.1 : 1,
    });
  }

  function acquireSpecies(plant: Species, starter = false) {
    const cost = getSpeciesEconomy(plant.name)?.basePrice ?? plant.basePrice ?? 15;
    if (cash < cost) { announce(`Not enough funds. ${plant.name} costs ${money(cost)}.`); return; }
    const id = `J2G-${plant.latin.split(" ")[0].slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const genetics = createSpecimenGenetics(0);
    const specimen: Specimen = {
      id, speciesId: plant.id, nickname: plant.name, location: "Home greenhouse",
      health: 100, stage: "Juvenile", value: 0, protected: false,
      variegation: 0, discovered: false, genetics,
    };
    specimen.value = specimenValue(specimen, plant.name);
    setCash((current) => current - cost);
    setSpecimens((current) => [...current, specimen]);
    setSelected(id);
    if (starter) {
      setTutorialStep(2);
      setPage("Specimen Record");
    }
    announce(`${plant.name} acquired for ${money(cost)}. Its base price is ${money(cost)}; individual value will change with growth and genetics.`);
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
    const cost = isAlocasia ? 2 : 4;
    if (cash < cost) { announce(`You need ${money(cost)} for propagation supplies.`); return; }
    const offspring: Specimen = {
      id: `J2G-${isAlocasia ? "COR" : "CUT"}-${Date.now().toString().slice(-6)}`,
      speciesId: parent.speciesId, nickname: isAlocasia ? "First Corm" : "First Cutting",
      location: isAlocasia ? "Corm Nursery" : "Propagation Bench",
      health: isAlocasia ? 75 : 85, stage: "Juvenile", value: 0,
      protected: false, variegation: parent.variegation, discovered: false, genetics: parent.genetics ? { ...parent.genetics, genetics: { ...parent.genetics.genetics, mutationIds: [...parent.genetics.genetics.mutationIds] }, observations: [], research: { points: 0, observationCount: 0, analysisLevel: 0, discoveredTraits: [], mutations: [] } } : createSpecimenGenetics(parent.variegation),
    };
    offspring.value = specimenValue(offspring);
    setCash((current) => current - cost);
    setSpecimens((current) => [...current, offspring]);
    setSelected(offspring.id);
    setTutorialStep(3);
    setPage("Greenhouse");
    announce(isAlocasia ? "First Alocasia corm started. It has its own specimen record." : "First cutting taken. The new specimen has its own identity and record.");
  }

  function growTutorialCutting() {
    const cutting = specimens.find((item) => ["First Cutting", "First Corm", "First Mutation"].includes(item.nickname));
    if (!cutting) { setTutorialStep(1); setPage("Plant Catalogue"); announce("Acquire a plant and propagate it first."); return; }
    advanceDay();
    setSelected(cutting.id);
    setTutorialStep(4);
    setPage("Specimen Record");
    announce("One day passed. Your propagated specimen has grown; record an observation to begin building research evidence.");
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
      const save: GameSave = { version: 2, specimens, cash, research, day, projectStarted, savedAt: Date.now() };
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      setNotice("Local save unavailable. Your progress may not persist in this browser.");
    }
  }, [specimens, cash, research, day, projectStarted]);

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

  function advanceDay() {
    const nextDay = day + 1;
    let mutationMessage = "";
    const nextSpecimens = specimens.map((specimen) => {
      const health = Math.min(100, specimen.health + (specimen.health < 90 ? 2 : 0));
      const record = specimen.genetics ?? createSpecimenGenetics(specimen.variegation);
      const environment = { ...greenhouseEnvironment, health };
      const growth = growVariegation(record.genetics, environment, specimen.variegation);
      let nextRecord: SpecimenGenetics = observePlant({ ...record, environment, expression: growth.expression }, growth.expression);
      let nextVariegation = growth.expression;
      let discovered = specimen.discovered;
      if (shouldDiscoverMutation(record.genetics, environment, Math.max(record.research.analysisLevel, Math.floor(research / 100)))) {
        const mutation = createMutation();
        mutation.detected = research > 0 || record.research.analysisLevel > 0;
        nextRecord = { ...nextRecord, genetics: { ...nextRecord.genetics, mutationIds: [...new Set([...nextRecord.genetics.mutationIds, mutation.id])] }, research: { ...nextRecord.research, mutations: [...nextRecord.research.mutations, mutation] } };
        if (mutation.category === "colour") { nextVariegation = Math.min(100, Math.max(nextVariegation, 35 + Math.round(Math.random() * 35))); nextRecord = { ...nextRecord, genetics: { ...nextRecord.genetics, variegationPotential: Math.max(nextRecord.genetics.variegationPotential, nextVariegation) } }; }
        if (mutation.detected) {
          discovered = true;
          mutationMessage = ` A ${mutation.rarity.toLowerCase()} ${mutation.category} mutation was detected in ${specimen.nickname}.`;
        }
      }
      const updated = { ...specimen, health, variegation: nextVariegation, discovered, genetics: { ...nextRecord, expression: nextVariegation, environment } };
      return { ...updated, value: specimenValue(updated) };
    });
    setDay(nextDay);
    setSpecimens(nextSpecimens);
    setResearch((current) => current + 5);
    announce(`Day ${nextDay}: plants grew, observations added research evidence and environmental conditions influenced variegation.${mutationMessage}`);
  }

  function observeSelectedSpecimen() {
    if (!activeSpecimen) return;
    const record = activeSpecimen.genetics ?? createSpecimenGenetics(activeSpecimen.variegation);
    const observed = observePlant(record, activeSpecimen.variegation);
    const updated = { ...activeSpecimen, genetics: observed, value: specimenValue(activeSpecimen) };
    setSpecimens((current) => current.map((item) => item.id === activeSpecimen.id ? updated : item));
    setResearch((current) => current + 2);
    announce(`Observation recorded for ${activeSpecimen.nickname}. Evidence added to its field record.`);
  }

  function analyseSelectedSpecimen() {
    if (!activeSpecimen) return;
    if (research < 25) { announce("Genetic analysis costs 25 research data."); return; }
    const record = activeSpecimen.genetics ?? createSpecimenGenetics(activeSpecimen.variegation);
    const analysedRecord = { ...record, research: { ...record.research, points: Math.max(record.research.points, 25) } };
    const analysed = analyseGenetics(analysedRecord, 25);
    if (!analysed) { announce("More observation evidence is needed before analysis."); return; }
    setResearch((current) => current - 25);
    setSpecimens((current) => current.map((item) => { if (item.id !== activeSpecimen.id) return item; const updated = { ...item, genetics: { ...analysed, research: { ...analysed.research, mutations: analysed.research.mutations.map((mutation) => ({ ...mutation, detected: true })) } } }; return { ...updated, value: specimenValue(updated) }; }));
    announce(`Analysis complete for ${activeSpecimen.nickname}. Research level ${analysed.research.analysisLevel} unlocked.`);
  }

  function purchaseSpecies(plant: Species) {
    acquireSpecies(plant);
  }

  function propagateSpecimen(parent: Specimen, method: PropagationMethod) {
    const plant = findSpecies(parent.speciesId);
    const genus = plant.latin.split(" ")[0].toLowerCase();
    const allowed = method === "division" || method === "tissue-culture"
      || (method === "cutting" && ["monstera", "philodendron", "anthurium"].includes(genus))
      || (method === "corm" && genus === "alocasia");
    if (!allowed) {
      announce(method === "cutting"
        ? "Stem cuttings are available for Monstera, Philodendron and Anthurium in this game."
        : "Corm propagation is reserved for Alocasia.");
      return;
    }
    const rarity = (getSpeciesEconomy(plant.name)?.rarity ?? plant.rarity) as Species["rarity"];
    const details: Record<PropagationMethod, { prefix: string; label: string; location: string; health: number; nickname: string }> = {
      cutting: { prefix: "CUT", label: "Cutting", location: "Propagation Bench", health: 85, nickname: "Cutting" },
      division: { prefix: "DIV", label: "Division / offset", location: "Propagation Bench", health: 90, nickname: "Division" },
      corm: { prefix: "COR", label: "Corm", location: "Corm Nursery", health: 75, nickname: "Corm" },
      "tissue-culture": { prefix: "TC", label: "Tissue culture", location: "Tissue Culture Lab", health: 70, nickname: "Tissue Culture" },
    };
    const detail = { ...details[method], cost: propagationCost(method, rarity) };
    if (cash < detail.cost) { announce(`Not enough funds. ${detail.label} propagation costs ${money(detail.cost)}.`); return; }
    const suffix = `${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const child: Specimen = {
      id: `J2G-${detail.prefix}-${suffix}`,
      speciesId: parent.speciesId,
      nickname: `${plant.name} ${detail.nickname}`,
      location: detail.location,
      health: detail.health,
      stage: "Juvenile",
      value: 0,
      protected: false,
      variegation: parent.variegation,
      discovered: false,
      genetics: parent.genetics ? { ...parent.genetics, genetics: { ...parent.genetics.genetics, mutationIds: [...parent.genetics.genetics.mutationIds] }, observations: [], research: { points: 0, observationCount: 0, analysisLevel: 0, discoveredTraits: [], mutations: [] } } : createSpecimenGenetics(parent.variegation),
    };
    child.value = specimenValue(child);
    setCash((current) => current - detail.cost);
    setSpecimens((current) => [...current, child]);
    setSelected(child.id);
    announce(`${detail.label} started for ${money(detail.cost)}. ${child.nickname} has its own specimen record.`);
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
    const genusA = findSpecies(parentA.speciesId).latin.split(" ")[0];
    const genusB = findSpecies(parentB.speciesId).latin.split(" ")[0];
    if (genusA !== genusB) {
      announce("This prototype only supports crosses within the same genus.");
      return;
    }
    if (cash < 4) {
      announce("You need £4 for supplies to run this cross.");
      return;
    }
    const parentAGenetics = parentA.genetics ?? createSpecimenGenetics(parentA.variegation);
    const parentBGenetics = parentB.genetics ?? createSpecimenGenetics(parentB.variegation);
    const inherited = inheritGenetics(parentAGenetics.genetics, parentBGenetics.genetics);
    const inheritedMutations = [...parentAGenetics.research.mutations, ...parentBGenetics.research.mutations]
      .filter((mutation, index, all) => all.findIndex((candidate) => candidate.id === mutation.id) === index)
      .filter((mutation) => Math.random() < mutation.stability / 100);
    inherited.mutationIds = inheritedMutations.map((mutation) => mutation.id);
    const inheritedVariation = Math.max(0, Math.min(100, Math.round((parentA.variegation + parentB.variegation + inherited.variegationPotential) / 3)));
    const source = inherited.variegationPotential >= parentAGenetics.genetics.variegationPotential ? parentA : parentB;
    const childNumber = String(specimens.length + 1).padStart(4, "0");
    const child: Specimen = {
      id: `J2G-${genusA.slice(0, 3).toUpperCase()}-${childNumber}-${Date.now().toString(36).slice(-3).toUpperCase()}`,
      speciesId: source.speciesId,
      nickname: "Seedling " + childNumber,
      location: "Propagation Bench",
      health: 88,
      stage: "Juvenile",
      value: 0,
      protected: false,
      variegation: inheritedVariation,
      discovered: false,
      genetics: { ...createSpecimenGenetics(inheritedVariation), genetics: inherited, research: { points: 0, observationCount: 0, analysisLevel: 0, discoveredTraits: [], mutations: inheritedMutations.map((mutation) => ({ ...mutation, detected: false })) } },
    };
    child.value = specimenValue(child);
    setCash((current) => current - 4);
    setSpecimens((current) => [...current, child]);
    setSelected(child.id);
    setPage("Specimen Record");
    announce(`Cross completed. ${child.nickname} inherited a blended genetic profile with ${inheritedVariation}% visible variegation. Mutation is possible but not guaranteed.`);
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
        {page === "Specimen Record" && <SpecimenPage specimen={activeSpecimen} plant={activeSpecies} onPropagate={(method) => propagateSpecimen(activeSpecimen, method)} onSell={() => sellSpecimen(activeSpecimen)} onObserve={observeSelectedSpecimen} onAnalyse={analyseSelectedSpecimen} researchPoints={research} onToggleProtection={() => setSpecimens((current) => current.map((item) => item.id === activeSpecimen.id ? { ...item, protected: !item.protected } : item))} onBack={() => setPage("Plant Catalogue")} announce={announce} />}
        {page === "Breeding" && <BreedingPage specimens={specimens} onCross={runCross} />}
        {page === "Research" && <ResearchPage cash={cash} research={research} projectStarted={projectStarted} onStart={startResearch} announce={announce} />}
        {page === "Greenhouse" && <GreenhousePage specimens={specimens} onSelect={(id) => { setSelected(id); setPage("Specimen Record"); }} onApplyEnvironment={(humidity, temperature) => setGreenhouseEnvironment({ ...greenhouseEnvironment, humidity, light: 70, nutrition: Math.max(20, 100 - Math.abs(temperature - 24) * 7), health: 100 })} announce={announce} />}
        {page === "Facilities" && <FacilitiesPage cash={cash} onBuy={(cost) => { if (cash < cost) announce("Not enough funds for this upgrade."); else { setCash((value) => value - cost); announce("Facility upgrade purchased. New capacity is being prepared."); } }} />}
        {page === "Staff" && <StaffPage />}
        {page === "Shop" && <ShopPage specimens={specimens} species={catalogSpecies} cash={cash} day={day} onBuy={purchaseSpecies} onSell={sellSpecimen} />}
        {page === "Finances" && <FinancesPage cash={cash} specimens={specimens} />}
        {page === "Settings" && <SettingsPage onReplayTutorial={() => { setTutorialStep(0); setPage("Dashboard"); setTutorialOpen(true); }} onResetGame={resetGame} day={day} specimensCount={specimens.length} catalogSource={catalogSource} />}
      </div>
      <footer className="app-footer"><span>J2Grows <span className="footer-separator">/</span> Prototype 0.1</span><span>All specimen and economic values are early prototype data.</span><span><span className="online-dot" /> Offline-first</span></footer>
    </main>
    {tutorialOpen && <div className="tutorial-backdrop" role="presentation"><section className="tutorial-dialog" role="dialog" aria-modal="true" aria-labelledby="tutorial-title"><div className="tutorial-topline"><span className="tutorial-mark"><Sprout size={19} /></span><span>J2GROWS FIRST-GROW GUIDE</span><button className="tutorial-close" onClick={finishTutorial} aria-label="Close tutorial"><X size={17} /></button></div><div className="tutorial-progress-label"><span>YOUR FIRST DISCOVERY</span><span>{String(tutorialStep + 1).padStart(2, "0")} / {String(tutorialSteps.length).padStart(2, "0")}</span></div><div className="tutorial-progress-track"><span style={{ width: `${((tutorialStep + 1) / tutorialSteps.length) * 100}%` }} /></div><div className="tutorial-content"><div className="tutorial-eyebrow"><span className="eyebrow-line" /> GUIDED TUTORIAL</div><h2 id="tutorial-title">{tutorialSteps[tutorialStep].title}</h2><p>{tutorialSteps[tutorialStep].body}</p>
      {tutorialStep === 0 && <div className="guided-field"><label htmlFor="institute-name">Institute name</label><input id="institute-name" maxLength={40} value={instituteNameDraft} onChange={(event) => setInstituteNameDraft(event.target.value)} placeholder="e.g. Verdant Research Institute" autoFocus /><small>Up to 40 characters. You can rename it later.</small></div>}
      {tutorialStep === 1 && <div className="guided-field"><label htmlFor="starter-species">Choose your first plant · base price</label><select id="starter-species" value={starterSpeciesId} onChange={(event) => setStarterSpeciesId(event.target.value)}>{["alocasia-polly", "anthurium-clarinervium", "monstera-adansonii", "philodendron-birkin"].map((id) => { const plant = catalogSpecies.find((item) => item.id === id) ?? prototypeSpecies.find((item) => item.id === id); const labels: Record<string, string> = { "alocasia-polly": "Alocasia Polly", "anthurium-clarinervium": "Anthurium clarinervium", "monstera-adansonii": "Monstera Adansonii", "philodendron-birkin": "Philodendron Birkin" }; return <option key={id} value={id}>{labels[id]}{plant ? ` · ${plant.rarity}` : ""}</option>; })}</select><div className="guided-balance">Base price: <strong>{money(starterPrice)}</strong> · Available funds: <strong>{money(cash)}</strong></div></div>}
      {tutorialStep === 2 && <div className="guided-action-summary"><span className="guided-action-icon"><Sprout size={20} /></span><div><strong>{starterSpeciesId === "alocasia-polly" ? "Start an Alocasia corm" : "Take one healthy cutting"}</strong><p>Cost: {money(starterSpeciesId === "alocasia-polly" ? 2 : 4)} · Creates a separate specimen record.</p></div></div>}
      {tutorialStep === 3 && <div className="guided-action-summary"><span className="guided-action-icon"><Sun size={20} /></span><div><strong>Advance one simulated day</strong><p>Your plant will grow under current conditions. Mutations remain rare and uncertain.</p></div></div>}
      {tutorialStep === 4 && <div className="guided-action-summary mutation-summary"><span className="guided-action-icon"><Sparkles size={20} /></span><div><strong>First observation: variegation expression</strong><p>Record the current expression and add evidence to your specimen’s research record. Mutations are not guaranteed.</p></div></div>}
      <div className="tutorial-tip"><Leaf size={16} /><span>{tutorialSteps[tutorialStep].tip}</span></div></div><div className="tutorial-footer"><button className="button button-quiet" onClick={finishTutorial}>Skip guide</button><div>{tutorialStep > 0 && <button className="button button-quiet tutorial-back" onClick={() => moveTutorial(-1)}>Back</button>}{tutorialStep === 0 ? <button className="button button-primary" onClick={saveInstituteName}>Name institute <ArrowRight size={15} /></button> : tutorialStep === 1 ? <button className="button button-primary" onClick={acquireStarterPlant} disabled={cash < starterPrice}>Acquire plant · {money(starterPrice)} <ArrowRight size={15} /></button> : tutorialStep === 2 ? <button className="button button-primary" onClick={takeTutorialCutting} disabled={cash < 100}>{starterSpeciesId === "alocasia-polly" ? "Start corm · £100" : "Take cutting · £100"} <ArrowRight size={15} /></button> : tutorialStep === 3 ? <button className="button button-primary" onClick={growTutorialCutting}>Advance one day <ArrowRight size={15} /></button> : <button className="button button-primary" onClick={recordTutorialObservation}><Sparkles size={15} /> Record observation</button>}</div></div></section></div>}
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
  return <><div className="catalogue-layout"><aside className="panel catalogue-filters"><SectionHeader title="Collection filters" /><label className="search-field"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search plants or specimen ID" /></label><div className="filter-heading">QUICK VIEWS</div>{filters.map((item) => <button key={item} className={`filter-option ${filter === item ? "selected" : ""}`} onClick={() => setFilter(item)}><span>{item}</span>{filter === item && <Check size={14} />}</button>)}<div className="filter-note"><ShieldCheck size={16} /><p>Protected specimens are excluded from automated sale. Each plant retains its own identity and history.</p></div></aside><section className="catalogue-main"><div className="catalogue-toolbar"><div><h2>Your collection</h2><span>{specimens.length} individual specimens</span></div><span className="pill subtle-pill">Specimen view</span></div>{specimens.length ? <div className="catalogue-grid">{specimens.map((item) => { const plant = findSpecies(item.speciesId); return <article key={item.id} className="catalogue-card"><button className="catalogue-art-button" onClick={() => onSelect(item.id)} aria-label={`Open ${item.nickname}`}><PlantArt type={plant.image} large /><span className="art-label">{plant.rarity}</span></button><div className="catalogue-card-content"><span className="specimen-id">{item.id}</span><h3>{item.nickname}</h3><p>{plant.name}</p><div className="trait-pills">{plant.traits.slice(0, 2).map((trait) => <span key={trait}>{trait}</span>)}</div><div className="catalogue-card-stats"><span><Activity size={13} /> {item.health}% health</span><strong>{money(item.value)}</strong></div><div className="catalogue-card-actions"><button className="button button-quiet" onClick={() => onSelect(item.id)}>Record</button><button className="button button-primary" disabled={item.protected} onClick={() => onSell(item)}>{item.protected ? "Protected" : "Sell"}</button></div></div></article>; })}</div> : <div className="empty-panel"><Search size={24} /><h3>No specimens match</h3><p>Try another search or clear the current filter.</p><button className="button button-quiet" onClick={() => { setQuery(""); setFilter("All plants"); }}>Clear filters</button></div>}</section></div><section className="panel species-library"><div className="section-header"><div><h2>Species library</h2><p>{species.length} species folders · {catalogSource === "supabase" ? "Loaded from Supabase storage" : "Using the local prototype catalogue"}</p></div><span className="pill subtle-pill">{supabase && catalogSource === "supabase" ? "Connected" : "Local fallback"}</span></div><div className="species-library-grid">{species.map((plant) => <article className="species-library-card" key={plant.id}><PlantArt type={plant.image} /><div><strong>{plant.name}</strong><span>{plant.latin === "Species details not yet recorded" ? plant.id : plant.latin}</span></div></article>)}</div></section></>;
}

function SpecimenPage({ specimen, plant, onSell, onToggleProtection, onBack, onPropagate, onObserve, onAnalyse, researchPoints, announce }: { specimen: Specimen; plant: ReturnType<typeof findSpecies>; onSell: () => void; onToggleProtection: () => void; onBack: () => void; onPropagate: (method: "cutting" | "division" | "corm" | "tissue-culture") => void; onObserve: () => void; onAnalyse: () => void; researchPoints: number; announce: (message: string) => void }) {
  const genus = plant.latin.split(" ")[0].toLowerCase();
  const isAlocasia = genus === "alocasia";
  const supportsCuttings = ["monstera", "philodendron", "anthurium"].includes(genus);\n  const rarity = getSpeciesEconomy(plant.name)?.rarity ?? plant.rarity;
  return <><button className="back-link" onClick={onBack}><ArrowRight size={14} /> Back to catalogue</button><div className="specimen-detail-grid"><section className="panel specimen-portrait"><PlantArt type={plant.image} large /><div className="portrait-overlay"><span className="eyebrow">INDIVIDUAL SPECIMEN</span><h2>{specimen.nickname}</h2><p>{plant.name}</p><span className="specimen-id">{specimen.id}</span></div></section><section className="panel specimen-detail-main"><SectionHeader title="Specimen overview" subtitle="Identity, condition and provenance." /><div className="detail-stat-grid"><div><span>Health</span><strong className={specimen.health < 80 ? "health-low" : "health-good"}>{specimen.health}%</strong></div><div><span>Stage</span><strong>{specimen.stage}</strong></div><div><span>Estimated value</span><strong>{money(specimen.value)}</strong></div><div><span>Variegation</span><strong>{specimen.variegation}%</strong></div></div><div className="detail-section"><h3>Species notes</h3><p>{plant.summary}</p><div className="care-grid"><div><Sun size={15} /><span>Light</span><strong>{plant.light}</strong></div><div><Droplets size={15} /><span>Humidity</span><strong>{plant.humidity}</strong></div></div></div><div className="detail-section"><h3>Current traits</h3><div className="trait-pills larger-pills">{plant.traits.map((trait) => <span key={trait}>{trait}</span>)}</div><p className="muted-copy">Visible expression is observed; stability and hidden potential are estimated until research reveals more.</p></div><div className="detail-section"><h3>Genetic profile</h3><div className="detail-stat-grid"><div><span>Variegation potential</span><strong>{specimen.genetics ? ((specimen.genetics.research.analysisLevel >= 1 ? specimen.genetics.genetics.variegationPotential : Math.round(specimen.genetics.genetics.variegationPotential / 10) * 10) + "%") : "Unknown"}</strong></div><div><span>Stability estimate</span><strong>{specimen.genetics ? "~" + (Math.round(specimen.genetics.genetics.stability / 10) * 10) + "%" : "Unassessed"}</strong></div><div><span>Hidden potential</span><strong>{(specimen.genetics?.research.analysisLevel ?? 0) >= 2 ? specimen.genetics?.genetics.hiddenPotential + "%" : "Unrevealed"}</strong></div><div><span>Research level</span><strong>{specimen.genetics?.research.analysisLevel ?? 0}</strong></div></div><p className="muted-copy">Observations: {specimen.genetics?.research.observationCount ?? 0} · Research data available: {researchPoints}</p><div className="propagation-actions"><button className="button button-quiet" onClick={onObserve}><BookOpen size={15} /> Record observation (+2 research)</button><button className="button button-quiet" disabled={researchPoints < 25} onClick={onAnalyse}><Microscope size={15} /> Analyse genetics · 25 data</button></div>{specimen.genetics?.research.mutations.filter((mutation) => mutation.detected).map((mutation) => <p className="muted-copy" key={mutation.id}>Detected mutation: {mutation.name} · {mutation.rarity} · {mutation.inheritance} inheritance</p>)}</div><div className="detail-section"><h3>Propagation methods</h3><p className="muted-copy">Each method creates a separate juvenile specimen. Costs and outcomes are prototype values.</p><div className="propagation-actions">{supportsCuttings && <button className="button button-quiet" onClick={() => onPropagate("cutting")}><Sprout size={15} /> Stem cutting · {money(propagationCost("cutting", rarity))}</button>}<button className="button button-quiet" onClick={() => onPropagate("division")}><Sprout size={15} /> Division / offset · {money(propagationCost("division", rarity))}</button>{isAlocasia && <button className="button button-quiet" onClick={() => onPropagate("corm")}><Sprout size={15} /> Corm · {money(propagationCost("corm", rarity))}</button>}<button className="button button-quiet" onClick={() => onPropagate("tissue-culture")}><FlaskConical size={15} /> Tissue culture · {money(propagationCost("tissue-culture", rarity))}</button></div><p className="muted-copy">{isAlocasia ? "Alocasia can be propagated from corms, divisions / offsets or through tissue culture." : supportsCuttings ? "Stem cuttings, divisions / offsets and tissue culture are available for this plant group." : "Division / offsets and tissue culture are available for this species in the current prototype."}</p></div><div className="detail-actions"><button className="button button-quiet" onClick={onToggleProtection}><ShieldCheck size={15} /> {specimen.protected ? "Remove protection" : "Protect specimen"}</button><button className="button button-primary" disabled={specimen.protected} onClick={onSell}>{specimen.protected ? "Protected from sale" : `Sell for ${money(specimen.value)}`}</button></div></section><aside className="panel provenance-panel"><SectionHeader title="Record & provenance" /><div className="provenance-item"><span>Current location</span><strong>{specimen.location}</strong></div><div className="provenance-item"><span>Protection status</span><strong className={specimen.protected ? "health-good" : ""}>{specimen.protected ? "Protected" : "Sale eligible"}</strong></div><div className="provenance-item"><span>Lineage</span><strong>Founder collection</strong></div><div className="provenance-item"><span>Observation history</span><strong>3 field notes</strong></div><button className="button button-quiet full-width" onClick={() => announce("The detailed lineage viewer is planned for a later milestone.")}>View family tree <ArrowRight size={14} /></button></aside></div></>;
}

function BreedingPage({ specimens, onCross }: { specimens: Specimen[]; onCross: (parentA: string, parentB: string) => void }) {
  const [parentA, setParentA] = useState(specimens.find((item) => findSpecies(item.speciesId).latin.startsWith("Philodendron"))?.id ?? specimens[0]?.id ?? "");
  const [parentB, setParentB] = useState(specimens.find((item) => findSpecies(item.speciesId).name === "Pink Princess")?.id ?? specimens[1]?.id ?? "");
  const genus = (id: string) => {
    const item = specimens.find((specimen) => specimen.id === id);
    return item ? findSpecies(item.speciesId).latin.split(" ")[0] : "";
  };
  const compatible = specimens.filter((item) => item.id !== parentA && genus(item.id) === genus(parentA));
  return <div className="two-column-layout"><section className="panel"><SectionHeader title="Breeding workbench" subtitle="Choose source specimens and review the experiment before committing resources." /><div className="breeding-parent-grid">{[{ label: "Parent A", value: parentA, set: setParentA, options: specimens }, { label: "Parent B", value: parentB, set: setParentB, options: compatible }].map((parent) => <div className="parent-picker" key={parent.label}><span className="filter-heading">{parent.label.toUpperCase()}</span><select value={parent.value} onChange={(event) => parent.set(event.target.value)}>{parent.options.map((item) => <option key={item.id} value={item.id}>{item.nickname} · {findSpecies(item.speciesId).name}</option>)}</select>{parent.value && specimens.find((item) => item.id === parent.value) && <PlantArt type={findSpecies(specimens.find((item) => item.id === parent.value)!.speciesId).image} large />}</div>)}</div><div className="experiment-summary"><div><span>Method</span><strong>Controlled cross · prototype</strong></div><div><span>Research cost</span><strong>250 cash</strong></div><div><span>Duration</span><strong>1 simulated day</strong></div></div><p className="muted-copy">Inheritance blends both parents, includes bounded variation and can occasionally produce mutations. Outcomes are never guaranteed.</p><button className="button button-primary" disabled={!parentA || !parentB || parentA === parentB || genus(parentA) !== genus(parentB)} onClick={() => onCross(parentA, parentB)}>Run cross · £100 <ArrowRight size={15} /></button></section><aside className="panel"><SectionHeader title="Outcome preview" subtitle="Possible outcomes, not guarantees." /><div className="outcome-art"><PlantArt type="monstera" large /></div><h3>Trait observation</h3><p className="muted-copy">The next genetics milestone will model visible traits, hidden potential and inheritance confidence separately.</p><div className="provenance-item"><span>Parent A</span><strong>{specimens.find((item) => item.id === parentA)?.nickname ?? "Not selected"}</strong></div><div className="provenance-item"><span>Parent B</span><strong>{specimens.find((item) => item.id === parentB)?.nickname ?? "Not selected"}</strong></div></aside></div>;
}

function ResearchPage({ cash, research, projectStarted, onStart, announce }: { cash: number; research: number; projectStarted: boolean; onStart: () => void; announce: (message: string) => void }) {
  const nodes = [{ title: "Basic Genetics", desc: "Learn the foundations of inheritance.", done: true }, { title: "Mutation Analysis", desc: "Investigate unusual traits and uncertainty.", done: projectStarted }, { title: "Selective Breeding", desc: "Compare descendants across generations.", done: false }, { title: "Tissue Culture", desc: "Scale propagation and preserve selected traits.", done: false }];
  return <div className="research-layout"><section className="panel"><SectionHeader title="Research pathways" subtitle="Capabilities unlock tools; projects investigate individual genetic lines." /><div className="research-tree">{nodes.map((node, index) => <div className={`research-node ${node.done ? "node-done" : index === 1 ? "node-current" : "node-locked"}`} key={node.title}><div className="node-icon">{node.done ? <Check size={18} /> : index === 1 ? <Microscope size={18} /> : <Beaker size={18} />}</div><div><strong>{node.title}</strong><span>{node.desc}</span></div><span className="node-state">{node.done ? "Available" : index === 1 ? "Ready to begin" : "Locked"}</span></div>)}</div></section><aside className="panel project-panel"><div className="eyebrow"><FlaskConical size={13} /> RECOMMENDED PROJECT</div><h2>Mutation Analysis</h2><p>Begin recording unusual traits and build confidence in what your collection might inherit.</p><div className="project-art"><PlantArt type="philodendron" large /></div><div className="project-cost"><span>Estimated cost</span><strong>{money(25)}</strong></div><div className="project-cost"><span>Available funds</span><strong>{money(cash)}</strong></div><div className="project-cost"><span>Research data</span><strong>{research.toLocaleString("en-GB")}</strong></div><button className="button button-primary full-width" disabled={projectStarted || cash < 25} onClick={onStart}>{projectStarted ? "Project in progress" : cash < 25 ? "Insufficient funds" : "Begin project"}<ArrowRight size={15} /></button><button className="button button-quiet full-width" onClick={() => announce("Advanced research programmes will unlock as the prototype grows.")}>Explore future programmes</button></aside></div>;
}

function GreenhousePage({ specimens, onSelect, onApplyEnvironment, announce }: { specimens: Specimen[]; onSelect: (id: string) => void; onApplyEnvironment: (humidity: number, temperature: number) => void; announce: (message: string) => void }) {
  const [humidity, setHumidity] = useState(68);
  const [temperature, setTemperature] = useState(24);
  const [autoCare, setAutoCare] = useState(true);
  return <><div className="metric-grid"><Metric label="Temperature" value={`${temperature}°C`} detail="Target range 22–28°C" icon={Thermometer} /><Metric label="Humidity" value={`${humidity}%`} detail="Tropical zone" icon={Droplets} /><Metric label="Light schedule" value="14 hours" detail="Daily light period" icon={Sun} /><Metric label="Air circulation" value="Good" detail="Fans operating" icon={Activity} /></div><div className="two-column-layout"><section className="panel"><SectionHeader title="Growing zone · Tropical Aroids" subtitle="A simple first greenhouse zone." action="Zone details" /><div className="zone-visual"><PlantArt type="hero" large /><div><span className="pill">ACTIVE ZONE</span><h2>Home Greenhouse</h2><p>Species-specific controls will expand as equipment and research are unlocked.</p></div></div><div className="control-row"><label htmlFor="temp">Temperature <strong>{temperature}°C</strong></label><input id="temp" type="range" min="18" max="32" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} /></div><div className="control-row"><label htmlFor="humidity">Humidity <strong>{humidity}%</strong></label><input id="humidity" type="range" min="40" max="95" value={humidity} onChange={(event) => setHumidity(Number(event.target.value))} /></div><button className={`button ${autoCare ? "button-primary" : "button-quiet"}`} onClick={() => setAutoCare((value) => !value)}><Zap size={15} /> Auto-care {autoCare ? "enabled" : "paused"}</button><button className="button button-quiet" onClick={() => { onApplyEnvironment(humidity, temperature); announce("Growing conditions applied. New growth and variegation stability will respond over time."); }}>Apply environment</button></section><section className="panel"><SectionHeader title="Plants in this zone" subtitle="Select a specimen to inspect its record." />{specimens.map((item) => <button className="zone-plant-row" key={item.id} onClick={() => onSelect(item.id)}><PlantArt type={findSpecies(item.speciesId).image} /><span><strong>{item.nickname}</strong><small>{findSpecies(item.speciesId).name}</small></span><span className={item.health < 80 ? "health-low" : "health-good"}>{item.health}%</span><ChevronRight size={15} /></button>)}</section></div></>;
}

function FacilitiesPage({ cash, onBuy }: { cash: number; onBuy: (cost: number) => void }) {
  const upgrades = [{ name: "Propagation bench", description: "Increase space for cuttings and seedlings.", cost: 1200, icon: Sprout }, { name: "Environmental controller", description: "Unlock more consistent greenhouse conditions.", cost: 2400, icon: Gauge }, { name: "Analysis workstation", description: "Prepare for deeper specimen analysis.", cost: 5000, icon: Microscope }];
  return <><div className="facility-hero"><div><div className="eyebrow">CURRENT FACILITY</div><h2>Home greenhouse</h2><p>Begin with a focused growing setup. Expansion is always your choice.</p><div className="facility-tags"><span><Check size={13} /> Local cultivation</span><span><Check size={13} /> Basic propagation</span></div></div><div className="facility-hero-art"><PlantArt type="hero" large /></div></div><section className="panel"><SectionHeader title="Available improvements" subtitle="Spend carefully; each upgrade should support your current goals." /><div className="upgrade-grid">{upgrades.map(({ name, description, cost, icon: Icon }) => <article className="upgrade-card" key={name}><div className="upgrade-icon"><Icon size={20} /></div><h3>{name}</h3><p>{description}</p><div className="upgrade-cost">{money(cost)}</div><button className="button button-primary full-width" disabled={cash < cost} onClick={() => onBuy(cost)}>{cash < cost ? "Not enough funds" : "Purchase upgrade"}</button></article>)}</div></section></>;
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
  return <><div className="metric-grid"><Metric label="Available species" value={String(available.length)} detail="Stock varies by rarity and day" icon={ShoppingBag} /><Metric label="Your sale-ready specimens" value={String(specimens.filter((item) => !item.protected).length)} detail="Not protected or reserved" icon={TrendingUp} /><Metric label="Available funds" value={money(cash)} detail="Starting budget: £100" icon={Wallet} tone="gold" /></div><section className="panel"><SectionHeader title="Today's nursery stock" subtitle="Base prices apply to standard juvenile plants. Variegation, stability, health, maturity and genetics affect individual value." />{available.length ? available.map((plant) => { const price = getSpeciesEconomy(plant.name)?.basePrice ?? plant.basePrice ?? 15; return <div className="shop-listing" key={plant.id}><PlantArt type={plant.image} /><div className="shop-listing-copy"><strong>{plant.name}</strong><span>{plant.rarity} · Juvenile base price</span></div><strong>{money(price)}</strong><button className="button button-primary" disabled={cash < price} onClick={() => onBuy(plant)}>{cash < price ? "Too expensive" : "Buy"}</button></div>; }) : <div className="empty-state">No plants available today. Advance a day to refresh stock.</div>}</section><section className="panel"><SectionHeader title="Your plant listings" subtitle="Review each specimen before listing it. Protected plants cannot be sold." />{specimens.map((item) => <div className="shop-listing" key={item.id}><PlantArt type={findSpecies(item.speciesId).image} /><div className="shop-listing-copy"><strong>{item.nickname} · {findSpecies(item.speciesId).name}</strong><span>{item.id} · {item.protected ? "Protected specimen" : "Eligible for sale"}</span></div><strong>{money(item.value)}</strong><button className="button button-primary" disabled={item.protected} onClick={() => onSell(item)}>{item.protected ? "Protected" : "Sell"}</button></div>)}</section></>;
}

function FinancesPage({ cash, specimens }: { cash: number; specimens: Specimen[] }) {
  const inventory = specimens.reduce((sum, specimen) => sum + specimen.value, 0);
  return <><div className="metric-grid"><Metric label="Available funds" value={money(cash)} detail="Local prototype balance" icon={Wallet} tone="gold" /><Metric label="Plant inventory" value={money(inventory)} detail="Estimated specimen values" icon={Sprout} /><Metric label="Operating costs" value={money(85)} detail="Illustrative daily estimate" icon={ArrowDownRight} tone="amber" /><Metric label="Net asset estimate" value={money(cash + inventory)} detail="Cash plus plant inventory" icon={TrendingUp} tone="gold" /></div><div className="two-column-layout"><section className="panel"><SectionHeader title="Financial outlook" subtitle="A transparent view of your current institution." /><div className="finance-chart"><div className="chart-y-labels"><span>£50k</span><span>£35k</span><span>£20k</span><span>£5k</span></div><svg viewBox="0 0 560 190" role="img" aria-label="Illustrative cash balance trend"><defs><linearGradient id="cashFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#a5c76d" stopOpacity=".25" /><stop offset="100%" stopColor="#a5c76d" stopOpacity="0" /></linearGradient></defs><path d="M0 145 C55 132 70 150 112 112 S190 122 232 92 S310 98 352 66 S435 72 478 42 S530 35 560 18 L560 190 L0 190 Z" fill="url(#cashFill)" /><path d="M0 145 C55 132 70 150 112 112 S190 122 232 92 S310 98 352 66 S435 72 478 42 S530 35 560 18" fill="none" stroke="#a5c76d" strokeWidth="3" /></svg></div><div className="chart-months"><span>Current</span><span>Projection +30 days</span></div><p className="muted-copy">This is an illustrative balance trend, not yet a simulated forecast. Future versions will calculate operating costs, debt, sales and research spending.</p></section><aside className="panel"><SectionHeader title="Financial safeguards" /><div className="safeguard-item"><ShieldCheck size={18} /><div><strong>Upfront costs</strong><span>Upgrades show their price before purchase.</span></div></div><div className="safeguard-item"><AlertTriangle size={18} /><div><strong>Bankruptcy rules</strong><span>Not yet simulated. Warnings and recovery rules will be defined before financial failure is introduced.</span></div></div><div className="safeguard-item"><Clock3 size={18} /><div><strong>Offline expenses</strong><span>Daily running costs are not deducted in this prototype.</span></div></div></aside></div></>;
}


export default App;


function SettingsPage({ onReplayTutorial, onResetGame, day, specimensCount, catalogSource }: { onReplayTutorial: () => void; onResetGame: () => void; day: number; specimensCount: number; catalogSource: "supabase" | "local" }) {
  return <div className="settings-layout">
    <section className="panel settings-panel"><div className="settings-heading"><div className="settings-icon"><Settings size={21} /></div><div><h2>Game settings</h2><p>Manage your J2Grows prototype experience.</p></div></div>
      <div className="settings-row"><div><strong>Getting started guide</strong><p>Replay the seven-step introduction to the nursery, collection and gameplay systems.</p></div><button className="button button-quiet" onClick={onReplayTutorial}><BookOpen size={15} /> Replay tutorial</button></div>
      <div className="settings-row"><div><strong>Species catalogue</strong><p>Current catalogue source: <span className="settings-status">{catalogSource === "supabase" ? "Supabase connected" : "Local prototype data"}</span></p></div><span className={`pill ${catalogSource === "supabase" ? "" : "subtle-pill"}`}>{catalogSource === "supabase" ? "Connected" : "Fallback mode"}</span></div>
      <div className="settings-row"><div><strong>Local save</strong><p>Your progress is stored in this browser. It is not currently synced between devices.</p></div><span className="settings-status"><span className="online-dot" /> Autosaving</span></div>
      <div className="settings-row"><div><strong>Current session</strong><p>Simulation day {day} · {specimensCount} individual specimens</p></div><span className="pill">Prototype 0.1</span></div>
    </section>
    <section className="panel settings-panel danger-panel"><div className="settings-heading"><div className="settings-icon danger-icon"><AlertTriangle size={21} /></div><div><h2>Reset game</h2><p>Start a new game from the original prototype state.</p></div></div><p className="danger-description">This will replace your current local save, start with £100, no plants and 0 research data, and show the tutorial again. This action cannot be undone.</p><button className="button button-danger" onClick={onResetGame}><AlertTriangle size={15} /> Reset all game progress</button></section>
  </div>;
}

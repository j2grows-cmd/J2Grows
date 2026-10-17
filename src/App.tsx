import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, Beaker, Bell,
  BookOpen, BriefcaseBusiness, Building2, Check, ChevronDown, ChevronRight,
  CircleDollarSign, Clock3, Droplets, FlaskConical, Flower2, Gauge, Home, Leaf,
  Menu, Microscope, Plus, Search, Settings, ShieldCheck, ShoppingBag,
  Sprout, Sun, Thermometer, TrendingUp, Users, Wallet, X, Zap
} from "lucide-react";
import { findSpecies, initialSpecimens, type Specimen } from "./data";

type Page = "Dashboard" | "Plant Catalogue" | "Specimen Record" | "Breeding" | "Research" | "Greenhouse" | "Facilities" | "Staff" | "Shop" | "Finances";
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
  version: 1;
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
      if (parsed.version === 1 && Array.isArray(parsed.specimens) && typeof parsed.cash === "number" && typeof parsed.research === "number" && typeof parsed.day === "number" && typeof parsed.savedAt === "number") {
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
  return { version: 1, specimens: initialSpecimens, cash: 48250, research: 1320, day: 48, projectStarted: false, savedAt: Date.now(), offlineDays: 0 };
}

function App() {
  const loadedSave = useMemo(() => loadGameSave(), []);
  const [page, setPage] = useState<Page>("Dashboard");
  const [specimens, setSpecimens] = useState<Specimen[]>(loadedSave.specimens);
  const [cash, setCash] = useState(loadedSave.cash);
  const [research, setResearch] = useState(loadedSave.research);
  const [day, setDay] = useState(loadedSave.day);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All plants");
  const [selected, setSelected] = useState<string>(initialSpecimens[0].id);
  const [notice, setNotice] = useState(loadedSave.offlineDays > 0 ? `Welcome back. ${loadedSave.offlineDays} simulated day(s) of eligible offline progress applied.` : "");
  const [projectStarted, setProjectStarted] = useState(loadedSave.projectStarted);
  const [showMenu, setShowMenu] = useState(false);
  useEffect(() => {
    try {
      const save: GameSave = { version: 1, specimens, cash, research, day, projectStarted, savedAt: Date.now() };
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

  function advanceDay() {
    setDay((current) => current + 1);
    setSpecimens((current) => current.map((specimen) => ({ ...specimen, health: Math.min(100, specimen.health + (specimen.health < 90 ? 2 : 0)) })));
    setResearch((current) => current + 25);
    announce("A day passed. Eligible plants grew and research progressed.");
  }

  function sellSpecimen(specimen: Specimen) {
    if (specimen.protected) {
      announce("This specimen is protected. Remove its protection before selling.");
      return;
    }
    setCash((current) => current + specimen.value);
    setSpecimens((current) => current.filter((item) => item.id !== specimen.id));
    setSelected(specimens.find((item) => item.id !== specimen.id)?.id ?? "");
    announce(`${specimen.nickname} sold for ${money(specimen.value)}.`);
  }

  function startResearch() {
    if (projectStarted) {
      announce("Mutation Analysis is already in progress.");
      return;
    }
    if (cash < 250) {
      announce("Not enough funds to start this research project.");
      return;
    }
    setCash((current) => current - 250);
    setProjectStarted(true);
    announce("Mutation Analysis started. Your research team is on it.");
  }

  const pageTitle = page === "Plant Catalogue" ? "Plant Catalogue" : page === "Specimen Record" ? activeSpecies.name : page;

  return <div className="app-shell">
    <aside className={`sidebar ${showMenu ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark"><Leaf size={27} /></div><div className="brand-name">J2Grows</div><div className="brand-tagline">CULTIVATE · DISCOVER · BREED · BUILD</div></div>
      <div className="institution-switch"><div className="institution-emblem"><Sprout size={19} /></div><div><strong>Botanical Nursery</strong><span>Home institution</span></div><ChevronDown size={14} /></div>
      <nav className="main-nav">{nav.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${page === label || (page === "Specimen Record" && label === "Plant Catalogue") ? "active" : ""}`} onClick={() => { setPage(label); setShowMenu(false); }}><Icon size={17} /><span>{label}</span>{label === "Research" && <span className="nav-dot" />}</button>)}</nav>
      <div className="sidebar-bottom"><div className="facility-mini"><div className="facility-mini-top"><span>STARTER FACILITY</span><span className="status-dot" /></div><strong>Home greenhouse</strong><div className="facility-progress"><span style={{ width: "36%" }} /></div><small>36% capacity used</small></div><div className="season-card"><Sun size={18} /><div><strong>Year 2 · Spring</strong><span>Day {day}</span></div><button onClick={advanceDay} title="Advance one day"><ArrowRight size={16} /></button></div><div className="sidebar-footer"><span><span className="online-dot" /> Local save active</span><button onClick={() => announce("Settings will be added in a later milestone.")} aria-label="Settings"><Settings size={16} /></button></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <button className="mobile-menu icon-button" onClick={() => setShowMenu((value) => !value)} aria-label="Toggle navigation"><Menu size={18} /></button>
        <div className="top-institution"><span className="top-leaf"><Leaf size={21} /></span><div><strong>J2Grows</strong><span>Botanical Nursery</span></div></div>
        <div className="top-resource"><span className="resource-symbol">£</span><div><strong>{money(cash)}</strong><small>Available funds</small></div></div>
        <div className="top-resource research-resource"><span className="resource-symbol"><Beaker size={17} /></span><div><strong>{research.toLocaleString("en-GB")}</strong><small>Research data</small></div></div>
        <div className="top-level"><div className="level-star"><Sprout size={18} /></div><div className="level-info"><div><strong>Institution level 1</strong><span>First roots</span></div><div className="progress-track"><span style={{ width: "28%" }} /></div></div></div>
        <button className="icon-button notification-button" onClick={() => announce("You're all caught up on nursery alerts.")} aria-label="Notifications"><Bell size={17} /><i /></button>
        <button className="profile-chip" onClick={() => announce("Local prototype profile")}><div className="profile-avatar"><Leaf size={18} /></div><div><strong>Nursery Manager</strong><span>Founder</span></div><ChevronDown size={14} /></button>
      </header>

      <div className="page-content">
        <section className="page-heading">
          <div><div className="eyebrow"><span className="eyebrow-line" /> YOUR BOTANICAL INSTITUTION</div><h1>{pageTitle}</h1><p>{page === "Dashboard" ? "A living collection. A growing body of knowledge. A nursery built by you." : page === "Plant Catalogue" ? "Browse your collection, compare traits and manage every individual specimen." : page === "Specimen Record" ? "An individual record of genetics, health, lineage and provenance." : page === "Breeding" ? "Choose parent plants, explore possibilities and build remarkable genetic lines." : page === "Research" ? "Turn observations into knowledge, methods and new capabilities." : page === "Greenhouse" ? "Keep your plants healthy and tune their growing environments." : page === "Facilities" ? "Grow from a home greenhouse into a specialist botanical institution." : page === "Staff" ? "Build a capable team and gradually automate your daily work." : page === "Shop" ? "Sell remarkable specimens and reinvest in your institution." : "Understand your cash flow and plan sustainable expansion."}</p></div>
          <div className="heading-actions"><button className="button button-quiet" onClick={() => announce("Your collection has been saved locally in this session.")}><ShieldCheck size={15} /> Save status</button><button className="button button-primary" onClick={advanceDay}><Zap size={15} /> Advance day <ArrowRight size={14} /></button></div>
        </section>

        {page === "Dashboard" && <Dashboard specimens={specimens} cash={cash} research={research} day={day} projectStarted={projectStarted} onNavigate={setPage} onSelect={(id) => { setSelected(id); setPage("Specimen Record"); }} onAdvance={advanceDay} />}
        {page === "Plant Catalogue" && <Catalogue specimens={filteredSpecimens} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} onSelect={(id) => { setSelected(id); setPage("Specimen Record"); }} onSell={sellSpecimen} />}
        {page === "Specimen Record" && <SpecimenPage specimen={activeSpecimen} plant={activeSpecies} onSell={() => sellSpecimen(activeSpecimen)} onToggleProtection={() => setSpecimens((current) => current.map((item) => item.id === activeSpecimen.id ? { ...item, protected: !item.protected } : item))} onBack={() => setPage("Plant Catalogue")} announce={announce} />}
        {page === "Breeding" && <BreedingPage specimens={specimens} onResearch={startResearch} announce={announce} />}
        {page === "Research" && <ResearchPage cash={cash} research={research} projectStarted={projectStarted} onStart={startResearch} announce={announce} />}
        {page === "Greenhouse" && <GreenhousePage specimens={specimens} onSelect={(id) => { setSelected(id); setPage("Specimen Record"); }} announce={announce} />}
        {page === "Facilities" && <FacilitiesPage cash={cash} onBuy={(cost) => { if (cash < cost) announce("Not enough funds for this upgrade."); else { setCash((value) => value - cost); announce("Facility upgrade purchased. New capacity is being prepared."); } }} />}
        {page === "Staff" && <StaffPage />}
        {page === "Shop" && <ShopPage specimens={specimens} onSell={sellSpecimen} />}
        {page === "Finances" && <FinancesPage cash={cash} specimens={specimens} />}
      </div>
      <footer className="app-footer"><span>J2Grows <span className="footer-separator">/</span> Prototype 0.1</span><span>All specimen and economic values are early prototype data.</span><span><span className="online-dot" /> Offline-first</span></footer>
    </main>
    {notice && <div className="toast" role="status"><Check size={17} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={15} /></button></div>}
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

function Catalogue({ specimens, query, setQuery, filter, setFilter, onSelect, onSell }: { specimens: Specimen[]; query: string; setQuery: (value: string) => void; filter: string; setFilter: (value: string) => void; onSelect: (id: string) => void; onSell: (specimen: Specimen) => void }) {
  const filters = ["All plants", "Protected", "Needs attention", "Ready to sell"];
  return <div className="catalogue-layout"><aside className="panel catalogue-filters"><SectionHeader title="Collection filters" /><label className="search-field"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search plants or specimen ID" /></label><div className="filter-heading">QUICK VIEWS</div>{filters.map((item) => <button key={item} className={`filter-option ${filter === item ? "selected" : ""}`} onClick={() => setFilter(item)}><span>{item}</span>{filter === item && <Check size={14} />}</button>)}<div className="filter-note"><ShieldCheck size={16} /><p>Protected specimens are excluded from automated sale. Each plant retains its own identity and history.</p></div></aside><section className="catalogue-main"><div className="catalogue-toolbar"><div><h2>Your collection</h2><span>{specimens.length} individual specimens</span></div><span className="pill subtle-pill">Specimen view</span></div>{specimens.length ? <div className="catalogue-grid">{specimens.map((item) => { const plant = findSpecies(item.speciesId); return <article key={item.id} className="catalogue-card"><button className="catalogue-art-button" onClick={() => onSelect(item.id)} aria-label={`Open ${item.nickname}`}><PlantArt type={plant.image} large /><span className="art-label">{plant.rarity}</span></button><div className="catalogue-card-content"><span className="specimen-id">{item.id}</span><h3>{item.nickname}</h3><p>{plant.name}</p><div className="trait-pills">{plant.traits.slice(0, 2).map((trait) => <span key={trait}>{trait}</span>)}</div><div className="catalogue-card-stats"><span><Activity size={13} /> {item.health}% health</span><strong>{money(item.value)}</strong></div><div className="catalogue-card-actions"><button className="button button-quiet" onClick={() => onSelect(item.id)}>Record</button><button className="button button-primary" disabled={item.protected} onClick={() => onSell(item)}>{item.protected ? "Protected" : "Sell"}</button></div></div></article>; })}</div> : <div className="empty-panel"><Search size={24} /><h3>No specimens match</h3><p>Try another search or clear the current filter.</p><button className="button button-quiet" onClick={() => { setQuery(""); setFilter("All plants"); }}>Clear filters</button></div>}</section></div>;
}

function SpecimenPage({ specimen, plant, onSell, onToggleProtection, onBack, announce }: { specimen: Specimen; plant: ReturnType<typeof findSpecies>; onSell: () => void; onToggleProtection: () => void; onBack: () => void; announce: (message: string) => void }) {
  return <><button className="back-link" onClick={onBack}><ArrowRight size={14} /> Back to catalogue</button><div className="specimen-detail-grid"><section className="panel specimen-portrait"><PlantArt type={plant.image} large /><div className="portrait-overlay"><span className="eyebrow">INDIVIDUAL SPECIMEN</span><h2>{specimen.nickname}</h2><p>{plant.name}</p><span className="specimen-id">{specimen.id}</span></div></section><section className="panel specimen-detail-main"><SectionHeader title="Specimen overview" subtitle="Identity, condition and provenance." /><div className="detail-stat-grid"><div><span>Health</span><strong className={specimen.health < 80 ? "health-low" : "health-good"}>{specimen.health}%</strong></div><div><span>Stage</span><strong>{specimen.stage}</strong></div><div><span>Estimated value</span><strong>{money(specimen.value)}</strong></div><div><span>Variegation</span><strong>{specimen.variegation}%</strong></div></div><div className="detail-section"><h3>Species notes</h3><p>{plant.summary}</p><div className="care-grid"><div><Sun size={15} /><span>Light</span><strong>{plant.light}</strong></div><div><Droplets size={15} /><span>Humidity</span><strong>{plant.humidity}</strong></div></div></div><div className="detail-section"><h3>Current traits</h3><div className="trait-pills larger-pills">{plant.traits.map((trait) => <span key={trait}>{trait}</span>)}</div><p className="muted-copy">Trait values and inheritance are prototype placeholders; analysis mechanics will be added to the genetics simulation.</p></div><div className="detail-actions"><button className="button button-quiet" onClick={onToggleProtection}><ShieldCheck size={15} /> {specimen.protected ? "Remove protection" : "Protect specimen"}</button><button className="button button-primary" disabled={specimen.protected} onClick={onSell}>{specimen.protected ? "Protected from sale" : `Sell for ${money(specimen.value)}`}</button></div></section><aside className="panel provenance-panel"><SectionHeader title="Record & provenance" /><div className="provenance-item"><span>Current location</span><strong>{specimen.location}</strong></div><div className="provenance-item"><span>Protection status</span><strong className={specimen.protected ? "health-good" : ""}>{specimen.protected ? "Protected" : "Sale eligible"}</strong></div><div className="provenance-item"><span>Lineage</span><strong>Founder collection</strong></div><div className="provenance-item"><span>Observation history</span><strong>3 field notes</strong></div><button className="button button-quiet full-width" onClick={() => announce("The detailed lineage viewer is planned for a later milestone.")}>View family tree <ArrowRight size={14} /></button></aside></div></>;
}

function BreedingPage({ specimens, onResearch, announce }: { specimens: Specimen[]; onResearch: () => void; announce: (message: string) => void }) {
  const [parentA, setParentA] = useState(specimens[0]?.id ?? "");
  const [parentB, setParentB] = useState(specimens[1]?.id ?? "");
  return <div className="two-column-layout"><section className="panel"><SectionHeader title="Breeding workbench" subtitle="Choose source specimens and review the experiment before committing resources." /><div className="breeding-parent-grid">{[{ label: "Parent A", value: parentA, set: setParentA }, { label: "Parent B", value: parentB, set: setParentB }].map((parent) => <div className="parent-picker" key={parent.label}><span className="filter-heading">{parent.label.toUpperCase()}</span><select value={parent.value} onChange={(event) => parent.set(event.target.value)}>{specimens.map((item) => <option key={item.id} value={item.id}>{item.nickname} · {findSpecies(item.speciesId).name}</option>)}</select>{parent.value && <PlantArt type={findSpecies(specimens.find((item) => item.id === parent.value)!.speciesId).image} large />}</div>)}</div><div className="experiment-summary"><div><span>Method</span><strong>Controlled cross · prototype</strong></div><div><span>Research cost</span><strong>250 cash</strong></div><div><span>Duration</span><strong>1 simulated day</strong></div></div><p className="muted-copy">The first version records the experiment flow; actual genetic inheritance and offspring creation are next-stage work.</p><button className="button button-primary" onClick={() => { if (parentA === parentB) announce("Choose two different specimens for this cross."); else onResearch(); }}>Start a research-supported cross <ArrowRight size={15} /></button></section><aside className="panel"><SectionHeader title="Outcome preview" subtitle="Possible outcomes, not guarantees." /><div className="outcome-art"><PlantArt type="monstera" large /></div><h3>Trait observation</h3><p className="muted-copy">The next genetics milestone will model visible traits, hidden potential and inheritance confidence separately.</p><div className="provenance-item"><span>Parent A</span><strong>{specimens.find((item) => item.id === parentA)?.nickname ?? "Not selected"}</strong></div><div className="provenance-item"><span>Parent B</span><strong>{specimens.find((item) => item.id === parentB)?.nickname ?? "Not selected"}</strong></div></aside></div>;
}

function ResearchPage({ cash, research, projectStarted, onStart, announce }: { cash: number; research: number; projectStarted: boolean; onStart: () => void; announce: (message: string) => void }) {
  const nodes = [{ title: "Basic Genetics", desc: "Learn the foundations of inheritance.", done: true }, { title: "Mutation Analysis", desc: "Investigate unusual traits and uncertainty.", done: projectStarted }, { title: "Selective Breeding", desc: "Compare descendants across generations.", done: false }, { title: "Tissue Culture", desc: "Scale propagation and preserve selected traits.", done: false }];
  return <div className="research-layout"><section className="panel"><SectionHeader title="Research pathways" subtitle="Capabilities unlock tools; projects investigate individual genetic lines." /><div className="research-tree">{nodes.map((node, index) => <div className={`research-node ${node.done ? "node-done" : index === 1 ? "node-current" : "node-locked"}`} key={node.title}><div className="node-icon">{node.done ? <Check size={18} /> : index === 1 ? <Microscope size={18} /> : <Beaker size={18} />}</div><div><strong>{node.title}</strong><span>{node.desc}</span></div><span className="node-state">{node.done ? "Available" : index === 1 ? "Ready to begin" : "Locked"}</span></div>)}</div></section><aside className="panel project-panel"><div className="eyebrow"><FlaskConical size={13} /> RECOMMENDED PROJECT</div><h2>Mutation Analysis</h2><p>Begin recording unusual traits and build confidence in what your collection might inherit.</p><div className="project-art"><PlantArt type="philodendron" large /></div><div className="project-cost"><span>Estimated cost</span><strong>{money(250)}</strong></div><div className="project-cost"><span>Available funds</span><strong>{money(cash)}</strong></div><div className="project-cost"><span>Research data</span><strong>{research.toLocaleString("en-GB")}</strong></div><button className="button button-primary full-width" disabled={projectStarted || cash < 250} onClick={onStart}>{projectStarted ? "Project in progress" : cash < 250 ? "Insufficient funds" : "Begin project"}<ArrowRight size={15} /></button><button className="button button-quiet full-width" onClick={() => announce("Advanced research programmes will unlock as the prototype grows.")}>Explore future programmes</button></aside></div>;
}

function GreenhousePage({ specimens, onSelect, announce }: { specimens: Specimen[]; onSelect: (id: string) => void; announce: (message: string) => void }) {
  const [humidity, setHumidity] = useState(68);
  const [temperature, setTemperature] = useState(24);
  const [autoCare, setAutoCare] = useState(true);
  return <><div className="metric-grid"><Metric label="Temperature" value={`${temperature}°C`} detail="Target range 22–28°C" icon={Thermometer} /><Metric label="Humidity" value={`${humidity}%`} detail="Tropical zone" icon={Droplets} /><Metric label="Light schedule" value="14 hours" detail="Daily light period" icon={Sun} /><Metric label="Air circulation" value="Good" detail="Fans operating" icon={Activity} /></div><div className="two-column-layout"><section className="panel"><SectionHeader title="Growing zone · Tropical Aroids" subtitle="A simple first greenhouse zone." action="Zone details" /><div className="zone-visual"><PlantArt type="hero" large /><div><span className="pill">ACTIVE ZONE</span><h2>Home Greenhouse</h2><p>Species-specific controls will expand as equipment and research are unlocked.</p></div></div><div className="control-row"><label htmlFor="temp">Temperature <strong>{temperature}°C</strong></label><input id="temp" type="range" min="18" max="32" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} /></div><div className="control-row"><label htmlFor="humidity">Humidity <strong>{humidity}%</strong></label><input id="humidity" type="range" min="40" max="95" value={humidity} onChange={(event) => setHumidity(Number(event.target.value))} /></div><button className={`button ${autoCare ? "button-primary" : "button-quiet"}`} onClick={() => setAutoCare((value) => !value)}><Zap size={15} /> Auto-care {autoCare ? "enabled" : "paused"}</button><button className="button button-quiet" onClick={() => announce("Environmental values are prototype controls and do not yet affect plant health.")}>Apply environment</button></section><section className="panel"><SectionHeader title="Plants in this zone" subtitle="Select a specimen to inspect its record." />{specimens.map((item) => <button className="zone-plant-row" key={item.id} onClick={() => onSelect(item.id)}><PlantArt type={findSpecies(item.speciesId).image} /><span><strong>{item.nickname}</strong><small>{findSpecies(item.speciesId).name}</small></span><span className={item.health < 80 ? "health-low" : "health-good"}>{item.health}%</span><ChevronRight size={15} /></button>)}</section></div></>;
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

function ShopPage({ specimens, onSell }: { specimens: Specimen[]; onSell: (specimen: Specimen) => void }) {
  return <><div className="metric-grid"><Metric label="Sale-ready specimens" value={String(specimens.filter((item) => !item.protected).length)} detail="Not protected or reserved" icon={ShoppingBag} /><Metric label="Buyer interest" value="Moderate" detail="Illustrative market state" icon={TrendingUp} /><Metric label="Wholesale" value="Locked" detail="Unlock with facility growth" icon={BriefcaseBusiness} /></div><section className="panel"><SectionHeader title="Your plant listings" subtitle="Review each specimen before listing it. Protected plants cannot be sold." />{specimens.map((item) => <div className="shop-listing" key={item.id}><PlantArt type={findSpecies(item.speciesId).image} /><div className="shop-listing-copy"><strong>{item.nickname} · {findSpecies(item.speciesId).name}</strong><span>{item.id} · {item.protected ? "Protected specimen" : "Eligible for sale"}</span></div><strong>{money(item.value)}</strong><button className="button button-primary" disabled={item.protected} onClick={() => onSell(item)}>{item.protected ? "Protected" : "Sell"}</button></div>)}</section></>;
}

function FinancesPage({ cash, specimens }: { cash: number; specimens: Specimen[] }) {
  const inventory = specimens.reduce((sum, specimen) => sum + specimen.value, 0);
  return <><div className="metric-grid"><Metric label="Available funds" value={money(cash)} detail="Local prototype balance" icon={Wallet} tone="gold" /><Metric label="Plant inventory" value={money(inventory)} detail="Estimated specimen values" icon={Sprout} /><Metric label="Operating costs" value={money(85)} detail="Illustrative daily estimate" icon={ArrowDownRight} tone="amber" /><Metric label="Net asset estimate" value={money(cash + inventory)} detail="Cash plus plant inventory" icon={TrendingUp} tone="gold" /></div><div className="two-column-layout"><section className="panel"><SectionHeader title="Financial outlook" subtitle="A transparent view of your current institution." /><div className="finance-chart"><div className="chart-y-labels"><span>£50k</span><span>£35k</span><span>£20k</span><span>£5k</span></div><svg viewBox="0 0 560 190" role="img" aria-label="Illustrative cash balance trend"><defs><linearGradient id="cashFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#a5c76d" stopOpacity=".25" /><stop offset="100%" stopColor="#a5c76d" stopOpacity="0" /></linearGradient></defs><path d="M0 145 C55 132 70 150 112 112 S190 122 232 92 S310 98 352 66 S435 72 478 42 S530 35 560 18 L560 190 L0 190 Z" fill="url(#cashFill)" /><path d="M0 145 C55 132 70 150 112 112 S190 122 232 92 S310 98 352 66 S435 72 478 42 S530 35 560 18" fill="none" stroke="#a5c76d" strokeWidth="3" /></svg></div><div className="chart-months"><span>Current</span><span>Projection +30 days</span></div><p className="muted-copy">This is an illustrative balance trend, not yet a simulated forecast. Future versions will calculate operating costs, debt, sales and research spending.</p></section><aside className="panel"><SectionHeader title="Financial safeguards" /><div className="safeguard-item"><ShieldCheck size={18} /><div><strong>Upfront costs</strong><span>Upgrades show their price before purchase.</span></div></div><div className="safeguard-item"><AlertTriangle size={18} /><div><strong>Bankruptcy rules</strong><span>Not yet simulated. Warnings and recovery rules will be defined before financial failure is introduced.</span></div></div><div className="safeguard-item"><Clock3 size={18} /><div><strong>Offline expenses</strong><span>Daily running costs are not deducted in this prototype.</span></div></div></aside></div></>;
}


export default App;
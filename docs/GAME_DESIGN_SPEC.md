# J2Grows — Game Design Specification

**Document status:** Design baseline v1.0  
**Project status:** Discovery complete; implementation not yet started  
**Product type:** Botanical research, cultivation, genetics and management/incremental simulation  
**Target release:** Public early access after a coherent, substantial progression loop is playable

## 1. Product vision

J2Grows is a premium botanical research and business simulation. The player begins with a tiny home growing setup and gradually builds a profitable nursery, develops advanced plant genetics and tissue-culture capabilities, hires specialists, automates connected production chains, and grows into a recognised research institution spanning multiple scientific eras.

The game combines four pillars:
1. **Discovery:** uncover genetic traits, unusual phenotypes, rare variants and stable cultivars.
2. **Cultivation:** grow real plant species under detailed but configurable environmental and health systems.
3. **Automation:** progress from hands-on work to staff-operated and highly optimised autonomous facilities.
4. **Enterprise:** build a viable nursery, serve specialist buyers, fulfil contracts and invest earnings in research and capacity.

The experience should be approachable at the beginning, deep for players who want to optimise it, and rewarding over 100+ hours. It must not rely on repetitive clicking or pay-to-win mechanics.

## 2. Product principles

- **Single-player first.** The complete core game must be playable without an internet connection. Online features add recognition and social possibilities rather than gating core progression.
- **Guided freedom.** A main institutional progression gives structure, while players choose research specialisations, optional projects and their preferred route to success.
- **Readable depth.** Simple summaries are the default; detailed genetics, scientific records and simulation controls are available when wanted.
- **Automation is earned.** Repetitive care and production become automatable through research, equipment and staff.
- **Choices have trade-offs.** Costs, time, quality, risk, fidelity and throughput should create strategic decisions rather than arbitrary click limits.
- **Fictional genetics are clearly identified.** Genetics are a game system inspired by biology, not a claim to precisely simulate real plant inheritance or provide real-world botanical advice.
- **Modular, testable architecture.** Simulation logic remains separate from UI, 3D rendering, persistence and online services.
- **Premium scientific-luxury presentation.** Dark surfaces, botanical greens, glass, metal and cinematic lighting support a polished laboratory identity.

## 3. Target players and platforms

The game should serve casual players who enjoy steady progression and dedicated players who enjoy optimisation, collection completion and deep breeding systems.

- **Initial development target:** browser-playable application, runnable from a development environment such as GitHub Codespaces.
- **Planned desktop target:** Windows first; architecture should avoid unnecessarily preventing later macOS support.
- **Long-term target:** mobile-friendly interaction and cross-device progress.
- **Offline:** core gameplay and local saves must work without a network connection.
- **Online:** accounts, cloud synchronisation, rankings, events and social features are optional additions after the offline core is reliable.

Responsive layouts, resizable panels, accessibility settings and reduced-motion support are product requirements, not late polish.

## 4. Core gameplay loop

The high-level loop is:

1. **Acquire and grow plants** using available space, substrates, nutrients and environmental controls.
2. **Inspect specimens** to understand visible traits and gradually reveal hidden genetic information.
3. **Research and experiment** to unlock equipment, techniques, specialisations and improved protocols.
4. **Propagate and breed** through seeds, cuttings, cloning and tissue culture, each with distinct costs, speed, fidelity, mutation risk and output. Use propagation results to test whether a discovered mutation is stable, tissue-specific or likely to produce new variation.
5. **Record discoveries** in a scientific catalogue, preserving genotype/phenotype data, lineage, provenance and breeding history.
6. **Sell stock or fulfil contracts** to fund operations while retaining valuable specimens, genetic material and reserves.
7. **Invest in equipment, rooms and staff** to improve quality, throughput and reliability.
8. **Automate connected production chains** and choose priorities, target plants and minimum stock levels.
9. **Reach institutional milestones** that unlock new research eras, capabilities and eventually prestige resets.
10. **Repeat at greater scale and depth**, with permanent scientific knowledge and records supporting long-term progression.

Useful short sessions should allow players to inspect results, adjust priorities and collect completed work. Longer sessions should reward optimisation, planning and multi-generation programmes.

## 5. Plant catalogue and collection

J2Grows should reuse the existing J2Grows plant catalogue and artwork wherever practical, after validation. The first release should have moderate catalogue breadth and meaningful system depth; data structures should support hundreds or thousands of plant entries later.

The initial game uses real plant species with fictional genetic variations. Each plant record should support stable IDs, taxonomy, common names where available, care parameters, base growth characteristics and references to suitable artwork. Existing storage paths and file extensions must be validated before integration; do not assume a path or extension without checking the source data.

The scientific catalogue should track:
- taxonomy and species identity;
- genotype and observed phenotype;
- traits, rarity and stability;
- detected and suspected mutations, confidence level, tissue distribution where relevant, and propagation outcomes;
- parentage, lineage and breeding programme;
- discovery history, provenance and named cultivar records;
- collection completion and relevant milestones.

Players can name cultivars, manage breeding lines and feature notable plants in their lab. Collection rewards may unlock research, permanent bonuses, equipment or new taxonomy/diversity goals.

## 6. Genetics and breeding

Genetics are abstracted into traits, loci and alleles rather than literal DNA sequences. The system should support multiple loci, allele combinations, polygenic traits, linkage and epistasis as deeper mechanics become available through research.

### Progressive complexity
- **Early:** readable visible traits, straightforward crosses and clear result feedback.
- **Mid-game:** scans reveal hidden markers and alleles; players compare parents and plan crosses.
- **Advanced:** configurable breeding programmes, multi-generation selection, deeper inheritance rules and automated selection criteria.

### Traits
The initial trait families are yield, rarity, size, growth, colour and variegation. Additional traits may be introduced only when they create meaningful gameplay.

### Outcomes and discoveries
- The player begins with ordinary, recognisable species from genera such as Alocasia, Monstera and Philodendron. The early hook is that individual specimens can contain hidden genetic variation, not that every new species is automatically rare.
- Specimen analysis can first indicate that something unusual is present, then reveal candidate traits or markers, and eventually identify a mutation more precisely as equipment and research improve.
- Mutation discovery and mutation propagation are separate achievements: detecting a mutation does not guarantee every propagated offspring will preserve or express it.
- Model three useful gameplay categories: **stable mutations**, which are reliably preserved through compatible methods; **unstable or mosaic mutations**, where different tissues or growth points can yield different outcomes; and **new mutations**, which can arise during growth or propagation as a low-probability event.
- Propagation rules must depend on method and mutation type. Cuttings may preserve traits from the source tissue; cloning aims for high-fidelity copies; tissue culture enables scale but can introduce fidelity trade-offs and variation; seeds recombine inherited traits rather than simply copying a parent. These are simplified game rules inspired by biology, not universal claims about all plants.
- Natural mutations can occur, with advanced research improving the odds of targeted outcomes without guaranteeing them.
- An unsuccessful cross should still be capable of producing useful genetic data or research progress.
- Discovery tiers distinguish interesting offspring, novel phenotypes and formally established stable cultivars.
- Cultivar value considers appearance and performance alongside genetic stability, rarity, provenance and documented breeding history.
- Players should have both accessible early achievements and long-term multi-generation goals.
- Saved protocols and controlled conditions should make experiments reproducible where intended; random variation remains part of the game.

Detailed scientific records are available but optional. A simplified view is the default.

## 7. Cultivation, plant health and propagation

Cultivation uses an interacting simulation of environment, growth, health and species-specific life stages. Complexity must be adjustable so the default experience remains manageable.

Potential environmental variables include light, temperature, humidity, watering and other relevant conditions. Environmental controllers can later optimise these variables within player-defined targets and trade-offs.

Plant health can include deficiencies, pests, diseases and treatments. Plants can die, so propagation backups and risk management matter. Losses must be understandable and reasonably preventable through observation, research and sound procedures.

Substrates and nutrient regimes have different suitability rather than one universally optimal option. Growth and output depend on genetics, health, maturity, environment, equipment, staff and production-line optimisation.

Propagation methods include:
- seeds and sexual crosses;
- cuttings;
- cloning;
- tissue culture and acclimatisation;
- advanced methods unlocked through research.

Methods should have meaningful trade-offs in time, cost, genetic fidelity, mutation risk and quantity produced. The game should distinguish preserving an existing mutation from generating or discovering new variation. Tissue culture is a core pillar alongside breeding, with simple early workflows that expand into multi-stage protocols, specialised equipment and quality control.

## 8. Rooms, equipment, staff and production

The facility grows from an improvised home setup into a multi-room institution. Room dependencies, functional placement, environmental zones and equipment synergies affect efficiency. Customisation should be functional rather than purely cosmetic.

Equipment has tiers, specialisations, synergies and trade-offs. Multiple parallel queues can be expanded through upgrades.

Staff are specialists with skills, experience, traits, costs and progression. Hiring draws from a changing candidate pool. Staff operate processes, improve procedures, troubleshoot and optimise systems.

The main production chain is:

**Propagation → acclimatisation → growing/maturation → inventory → sale or research use**

Automation progresses from basic watering and routine care to propagation, breeding, research and connected production. Players configure priorities, target plants, minimum stock levels and other operational policies. Late-game play should focus on strategy and optimisation rather than constant manual intervention.

## 9. Research and progression

Research is split into specialisation trees for:
- genetics;
- cultivation;
- tissue culture;
- automation;
- business and commercial operations.

Research progress comes from passive generation, experiments, discoveries and automated research. A hybrid research tree expands through discoveries, specialisations and meaningful choices.

The primary progression path is institutional: establish a profitable nursery, prove reliable production, develop specialist laboratories, recruit expertise and reach major research milestones. Players can choose when to pursue optional systems and specialisations, rather than being forced through one narrow optimal route.

Upgrades include numerical improvements as well as capability unlocks. Early objectives gradually teach systems without requiring a long mandatory tutorial.

## 10. Economy and market

J2Grows combines a research institution with a commercial nursery. The economy begins understandable and believable, then scales into substantial late-game production and research.

Resources are layered and may include cash, research, biomass/plant material, genetic data and specialised supplies. Each resource should have a clear purpose.

Plants can be sold instantly or through market orders/contracts for better returns. Buyers include customers, institutions, contracts and specialist buyers. Demand changes with scarcity, discoveries, player progression and market events. Contracts are optional and request particular plants, traits or quantities.

Pricing combines a genetic/base value with market demand and documented qualities such as rarity, appearance, stability and provenance. Players must balance selling stock against retaining collections, reserves, genetic material and breeding lines.

NPC auctions can arrive before any player-to-player trading. Market progression introduces specialist buyers, market tiers, international distribution and more advanced commercial systems. Production costs and supply/demand create strategic trade-offs without arbitrary click limits.

## 11. Institutional eras and prestige

Prestige represents recognition, new research programmes and scientific eras. It is tied to a sequence of institutional milestones, with optional challenges granting extra rewards.

A prestige reset removes most operational progress, including facilities and staff, while preserving scientific records and permanent knowledge. Persistent elements include plant collections and discoveries, genetic research, cultivar records and lineage, achievements, permanent institutional upgrades and research unlocks.

Prestige rewards can include multipliers, new research branches, rooms, equipment and prestige-specific systems. New eras should add a combination of larger scale, new production chains and new scientific capabilities. Players can choose a research specialisation each era, changing the strongest strategies.

Prestige is required for some advanced technologies, but normal progression must remain rewarding for players who delay resetting. The long-term endgame combines research completion, cultivar establishment, autonomous operations and ongoing progression.

## 12. Presentation and user experience

The interface is management-first: panels, menus, dashboards, lists, filters and resizable layouts. The 3D laboratory provides immersion and visible evidence of progression rather than forcing direct manipulation of every plant.

Visual direction: premium scientific luxury, with dark surfaces, botanical greens, glass, metal and cinematic lighting. Significant discoveries receive cinematic presentation; routine results remain concise and informative.

The game should include:
- a sequence of early research objectives;
- optional advanced tutorials and scientific reference material;
- adjustable difficulty and extensive accessibility options;
- reduced motion and clear non-colour-only feedback;
- useful short-session actions and deeper long-session optimisation;
- clear costs, outcomes, risks and failure explanations.

## 13. Online and social features

Online features follow the offline core and should not make solo progress dependent on other players.

Planned optional features include multiple leaderboard categories, competitive discovery races, seasonal events and specialist challenges; asynchronous visits to other labs and collections; optional institutes/groups for sharing achievements and comparing progress; and eventually player-to-player trading.

Cultivar specimens, genetic records and lineage may be shared or traded with anti-duplication safeguards. Online rewards are limited to cosmetics and recognition. Personal discoveries remain personal; community events must not be required to unlock the single-player game.

**Fairness decision to resolve:** the discovery answers selected optional competitive events and leaderboards, but also selected “no competitive systems.” Until clarified, interpret this conservatively: no mandatory competition, no paid boosts and no online-exclusive progression advantages. Optional events should be non-blocking and may use separate categories or verified rules.

## 14. Saves, offline simulation and data

Support multiple save slots, cloud saves and sandbox mode eventually. Cross-device synchronisation requires conflict handling when two devices modify the same save.

Offline progress is calculated when the player returns, not by keeping a full simulation continuously running. The exact offline cap and which processes advance must be tuned and documented. Advanced options can expose additional simulation detail without making the default overwhelming.

Use a versioned save schema, validated loading, safe recovery and migrations. Simulation outcomes should be deterministic where appropriate and seeded randomness should make tests reliable. Do not implement cloud sync until save identity, conflict resolution, account trust boundaries and recovery behaviour are specified.

The game does not need player-facing data export in the initial design; keep game data within the game unless this decision is revisited.

## 15. Technical direction

Proposed starting stack:
- TypeScript;
- React and Vite for the browser application;
- Three.js / React Three Fiber for the 3D laboratory;
- a lightweight state store for UI state;
- Vitest or equivalent for deterministic tests;
- Electron for a later Windows desktop package.

Keep simulation logic independent of UI and rendering. Separate modules for genetics, cultivation, economy, progression, automation, save handling and presentation. Use validated data definitions and stable IDs for catalogue records.

No implementation stack is final until the first scaffold is tested. Do not claim build or deployment commands are verified until they have actually been run. Never expose Supabase service-role secrets in client code.

## 16. First playable milestone and roadmap

The first playable milestone should demonstrate all core pillars together at intentionally limited depth:
- starter home lab and a small curated plant set;
- growth, care and basic environmental controls;
- first research objectives and trait inspection;
- simple breeding and cloning;
- discovery journal and cultivar records;
- sale of plants and a meaningful upgrade decision;
- one initial automation capability;
- a polished management UI and a small 3D lab scene;
- reliable local save/load and bounded offline progression;
- deterministic tests for economy, genetics and save logic.

### Development phases
1. **Specification and validation:** review this document, resolve contradictions and define acceptance criteria.
2. **Runnable foundation:** scaffold browser app, scripts, tests and visual shell.
3. **Playable early loop:** grow, inspect, propagate/breed, discover, sell and upgrade.
4. **System depth:** genetics, cultivation, tissue culture, research and automation.
5. **Management scale:** rooms, staff, production chains, market and institutional progression.
6. **Polish and early access readiness:** balance, accessibility, performance, content, save recovery and documentation.
7. **Post-core features:** prestige depth, sandbox expansion, cloud sync, social features, trading, modding and desktop packaging.

## 17. Open decisions before implementation

1. Resolve the intended meaning of “no competitive systems” alongside optional competitive events and leaderboards.
2. Set the initial plant list and validate the existing catalogue schema, stable IDs and artwork paths.
3. Define concrete early-game economy values and offline progress cap through prototype testing rather than guessing.
4. Specify the first genetics model in a separate technical design, including locus representation, inheritance rules and mutation constraints.
5. Define save format and migration policy before persistent data ships.
6. Confirm the 3D scene’s performance budget and the minimum supported browser/device capabilities.
7. Decide the initial boundaries for sandbox mode and difficulty options.

## 18. Definition of design success

The design is ready to move into implementation when the owner approves the scope, open decisions are either resolved or explicitly deferred, and the first playable milestone has testable acceptance criteria. The first code milestone must be small enough to run and verify end-to-end; no attempt should be made to implement the entire game in one pass.

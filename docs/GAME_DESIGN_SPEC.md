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
- **Early:** readable visible traits and straightforward inheritance rules. Players can make basic crosses and understand the main reasons an offspring may or may not express a trait without needing to study a genetic diagram.
- **Mid-game:** scans reveal hidden markers and alleles. Players compare parents, investigate inheritance patterns and begin planning crosses around specific outcomes.
- **Advanced:** configurable breeding programmes, multi-generation selection, interacting loci, polygenic traits, linkage, epistasis and automated selection criteria.
- **Hybrid model:** use simple, legible rules for foundational traits, while allowing advanced anomalies and trait combinations to depend on multiple genes, modifiers and interactions. Complexity should be introduced progressively through research, equipment and optional detail views rather than imposed on every player at once.
- **Teach through experiments:** early crosses should provide understandable feedback; later experiments can reveal that a trait's inheritance is more complicated than first assumed. Research should help players discover the underlying model instead of merely unlocking unexplained percentage bonuses.
- **Separate expression from inheritance:** a plant's visible phenotype, its underlying genetic potential and the probability of passing or expressing a trait in offspring are related but distinct values.

### Traits
The initial trait families are yield, rarity, size, growth, colour and variegation. Additional traits may be introduced only when they create meaningful gameplay.

### Outcomes and discoveries
- The player begins with ordinary, recognisable species from genera such as Alocasia, Monstera and Philodendron. **Every specimen has hidden genetic potential**: no plant is automatically guaranteed to be ordinary, and no plant is guaranteed to contain a valuable mutation. This makes even common plants worth analysing.
- Potential traits include colour, variegation, leaf shape, size, growth characteristics and yield. A specimen's hidden profile can contain several possible traits with different probabilities and possible strengths.
- Analysis should communicate three distinct predictions for each potential trait: **what the trait is**, **the estimated likelihood that it will appear in propagated offspring**, and **the predicted strength or intensity if it appears**. These are separate values: a trait can be likely but subtle, or unlikely but spectacular.
- Analysis confidence improves with equipment, research, staff expertise and repeat experiments. Early tools might report broad clues and rough probability bands; advanced tools can identify likely traits and provide more precise estimates. Avoid presenting uncertain estimates as guarantees.
- Each individual specimen has a fixed underlying genetic profile and hidden potential. Analysis reveals information about that specimen; it does not change its genetics or create a mutation.
- Propagation creates a new specimen whose genetic profile is derived from its source according to the propagation method. The potential can therefore be preserved, expressed differently, reduced, lost or altered in the new specimen; occasional new variation may also arise during growth or propagation. Do not assume every propagation method behaves identically.
- Keep the parent specimen's profile and each descendant's profile as separate records. A parent does not change retroactively when an offspring develops a new trait. This makes lineage tracking and comparing generations central to the discovery loop.
- Advanced analysis and research can improve predictions and help players select methods or conditions, but should not turn uncertain outcomes into guaranteed results.
- Mutation discovery and mutation propagation are separate achievements: detecting or predicting a trait does not guarantee every propagated offspring will preserve or express it. Actual offspring outcomes are compared against the parent's analysis and the offspring's own analysis to improve the player's understanding.
- Model three useful gameplay categories: **stable mutations**, which are reliably preserved through compatible methods; **unstable or mosaic mutations**, where different tissues or growth points can yield different outcomes; and **new mutations**, which can arise during growth or propagation as a low-probability event.
- Propagation rules must depend on method and mutation type. Cuttings may preserve traits from the source tissue; cloning aims for high-fidelity copies; tissue culture enables scale but can introduce fidelity trade-offs and variation; seeds recombine inherited traits rather than simply copying a parent. These are simplified game rules inspired by biology, not universal claims about all plants.
- An unsuccessful cross should still be capable of producing useful genetic data or research progress.
- Discovery tiers distinguish interesting offspring, novel phenotypes and formally established stable cultivars.
- Cultivar value considers appearance and performance alongside genetic stability, rarity, provenance and documented breeding history.
- Players should have both accessible early achievements and long-term multi-generation goals.
- Saved protocols and controlled conditions should make experiments reproducible where intended; random variation remains part of the game.

Detailed scientific records are available but optional. A simplified view is the default.

## 7. Cultivation, plant health and propagation

Cultivation uses an interacting simulation of environment, growth, health and species-specific life stages. Complexity must be adjustable so the default experience remains manageable. Facility progression should make environmental control increasingly precise: the player begins with a basic propagation setup and gradually builds customisable growth chambers and specialist rooms.

### Cultivation facility progression
- **Starter propagation setup:** basic trays or shelves, simple grow lighting and manual watering. Environmental control is limited; players learn through observation and straightforward care feedback.
- **Upgraded propagation area:** better lights, shelving, humidity covers or small enclosures, and improved tools. Players can make a few meaningful adjustments without needing to configure every environmental variable.
- **Customisable growth chambers:** dedicated chambers with adjustable humidity, light intensity or schedule, temperature, airflow and other appropriate controls. The player can save or assign presets for different species, growth stages or research targets.
- **Specialist rooms and automated environments:** larger or multiple chambers, environmental zones, sensors, controllers and automated responses. Players set target ranges, priorities and acceptable trade-offs, while equipment and staff maintain conditions.
- **Research-grade environments:** advanced controlled conditions support reproducible experiments and targeted cultivation research. These capabilities improve experimental control and consistency but do not guarantee genetic outcomes.

Potential environmental variables include light, temperature, humidity, watering and other relevant conditions. Each species has its own tolerances, preferred ranges, growth patterns and vulnerabilities; the same environmental system applies across the catalogue, but species respond differently. Environmental controllers can later optimise variables within player-defined targets and trade-offs.

The interface should translate conditions into useful feedback. Beginners see clear indicators such as too dry, insufficient light or humidity outside the preferred range; advanced players can inspect detailed readings, histories and target ranges. Presets should reduce routine micromanagement, while manual controls remain available for players who enjoy fine tuning.

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
- genetics and specimen analysis;
- cultivation and environmental control;
- propagation and tissue culture;
- automation and production systems;
- business and commercial operations.

### Early research choice
Immediately after the first guided mutation discovery, introduce a small, readable research tree with three initial branches:
1. **Analysis:** improve specimen inspection, detect subtler traits and reveal more reliable estimates of inheritance likelihood and expression strength. This is the recommended first path because it directly follows the player's first discovery.
2. **Cultivation:** improve plant health, environmental control and growth reliability, preparing for customisable chambers and species-specific care.
3. **Propagation:** improve propagation efficiency, output, cost and method options, allowing the player to run more experiments and build stock more quickly.

Analysis should be clearly recommended, but not mandatory as the player's first investment. Each branch should provide an early useful benefit and later connect to the others, so the choice affects the player's route without locking them out of core systems.

Research progress comes from experiments, discoveries, objectives and later automation or passive generation. A hybrid research tree expands through discoveries, specialisations and meaningful choices.

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

The interface is catalogue-first and management-led: panels, menus, dashboards, lists, filters and resizable layouts are the primary way to play. Individual plants are represented mainly through catalogue artwork and specimen cards; continuous trait values map to a small number of representative visual tiers rather than requiring a unique image for every value.

Visual direction: premium scientific luxury, using dark surfaces, botanical greens, restrained glass-and-metal motifs and polished typography. Significant discoveries receive a strong visual reveal using available artwork and UI effects; routine results remain concise and informative. A 3D laboratory is not required for the initial release and must not be a dependency for core gameplay. It can be reconsidered later as an optional decorative feature if the core game is successful and scope allows.

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
- a polished catalogue-first management UI with representative plant artwork and a compelling discovery reveal;
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


## 19. Mutation research progression: home lab to specialist facility

Mutation discovery and targeted selection must develop alongside the player's facilities. The player begins with limited equipment and imperfect understanding, then earns the ability to investigate and pursue specific anomalies through investment, research and institutional growth.

### Stage 1: Home laboratory — observe and hope
- Start with basic propagation supplies, modest grow lighting, simple environmental controls and handwritten or basic digital records.
- The player can propagate, clone or grow plants, but has little or no reliable visibility into hidden genetic potential.
- Results are uncertain. An unusual trait may appear unexpectedly, and an apparently ordinary result can still provide useful material or experience.
- Players can keep promising specimens, compare visible outcomes and learn from results, but cannot yet reliably target a particular hidden trait.
- This stage should feel exciting and accessible, not punitive: limited control creates surprise, while early discoveries can remain valuable throughout the game.

### Stage 2: Analysis workstation — understand the specimen
- Invest in progressively better imaging, microscopy, trait-analysis and genetic-analysis equipment.
- Analysis reveals the possible anomaly, estimated likelihood of expression in relevant offspring, expected strength and the confidence of each estimate.
- Early equipment offers broad clues and ranges; research, specialist staff, improved instruments and repeated experiments refine the estimates.
- Players can compare parents, propagation methods and offspring, turning chance outcomes into usable evidence.
- Better analysis improves knowledge and decision-making; it does not guarantee a desired result or change the specimen's underlying genetics.

### Stage 3: Research laboratory — pursue a hypothesis
- Unlock controlled propagation protocols, tissue or growth-point selection, advanced cloning and tissue-culture facilities, and experiments designed around a target trait.
- Players can choose candidate specimens, select suitable source material where the method allows, define a protocol and set acceptable trade-offs such as cost, speed, fidelity and variation.
- Research improves the odds of obtaining a target outcome and helps distinguish stable, tissue-specific, weak, strong or newly arising variation.
- Targeted research remains probabilistic. Rare or complex anomalies may require multiple generations, several specimens, careful recordkeeping and substantial investment.
- Failed or unexpected results can still yield research data and reveal useful secondary traits.

### Stage 4: Specialist programmes — develop and reproduce anomalies
- Establish focused breeding programmes around specific traits or combinations, using archived lineages, specialist staff, dedicated rooms and automation.
- Advanced tools support more informed selection and repeatable protocols, but do not remove biological uncertainty or make every combination achievable.
- The player can maintain source specimens, compare lines, preserve valuable genotypes and scale successful propagation into commercial production.
- Endgame mastery is expressed through better experimental design, reproducibility, discovery quality and throughput—not simply a universal bonus to mutation chance.

### Design principles
1. **Control grows with knowledge.** Progression moves from chance-led experimentation to evidence-led selection and then to sophisticated programmes.
2. **Knowledge and probability are different.** A more accurate prediction does not itself increase the chance of an outcome; a suitable intervention or protocol may do so.
3. **Methods have distinct trade-offs.** Seeds recombine inherited traits; cuttings and cloning generally prioritise source fidelity; tissue culture supports scale but can introduce its own variation and acclimatisation risks. These are simplified game rules, not universal claims about every plant or protocol.
4. **Keep the original specimen intact.** Propagation produces descendants with their own records. Parent analysis remains a record of the parent, while offspring analysis reveals what was inherited or changed.
5. **Preserve surprise at every stage.** Advanced players can target and improve odds, but unexpected results and new discoveries remain possible.
6. **Make uncertainty legible.** Show estimates, confidence and relevant costs clearly; never imply that a probability is a promise.


## 20. Specimen suppliers, research partners and institutional access

Plant acquisition should progress through a network of suppliers and institutions rather than one universal shop. Access to sources is earned through institutional progression, scientific achievements, reputation and, where appropriate, relationships or completed research.

### Supplier tiers
1. **General plant supplier:** available from the beginning; sells common starter species and affordable specimens suitable for learning cultivation and basic propagation.
2. **Specialist nurseries and collectors:** unlock through progression and reputation; offer unusual cultivars, collector specimens and plants with valuable provenance.
3. **Research laboratories:** provide rare research material, selected genetic lines, tissue-cultured specimens and experiment-specific stock. Some listings may include partial analysis or research notes, while others retain uncertainty.
4. **Research societies and elite institutions:** later-game sources for exceptional specimens, exclusive breeding lines, specialist research partnerships and access to high-level programmes.

### Acquisition design principles
- Each source has a distinct catalogue, price range, availability pattern and unlock criteria. A source should feel like a meaningful new relationship or milestone, not merely a more expensive version of the previous shop.
- Price, rarity, provenance, visible phenotype and hidden genetic potential are separate dimensions. Expensive or rare specimens are not guaranteed to have the most valuable hidden potential.
- Common, affordable plants remain useful throughout the game because their hidden potential, suitability for experiments and role in breeding programmes can make them valuable.
- Suppliers may rotate stock or offer limited quantities, but time-limited stock must not become a pay-to-win or mandatory daily-login mechanic.
- Research institutions can offer specimens in exchange for money, research records, reputation, completed objectives or reciprocal discoveries.
- Listings must communicate what is known, what is estimated and what remains unknown. Seller-provided claims can have different confidence levels and should not replace the player's own analysis.
- Later multiplayer trading may complement these sources, but the single-player progression and core collection must remain viable without other players.



## 21. Basic species access and research-society specimen loans

### Guaranteed access to foundational species
- Every standard, non-variegated and non-mutated base species in the approved catalogue should be available for direct purchase from ordinary suppliers.
- Players should not need rare drops, research-society reputation, limited-time events or multiplayer trading to obtain a foundational species.
- This guarantee concerns access to the base species. Unusual cultivars, variegated specimens, mutated specimens and specimens with exceptional provenance may follow separate acquisition rules.
- Basic species remain useful as affordable experimental material throughout the game, including when investigating inherited traits and developing breeding lines.

### Reputation-gated research partnerships
- Research societies and specialist institutions become available through institutional progress, scientific achievements and reputation.
- Partnerships grant access to institutional specimen collections and potentially to research equipment, expertise, protocols and collaborative projects.
- Rare or unusual specimens may be loaned rather than sold. Loans allow the player to investigate material that would otherwise be inaccessible or prohibitively expensive.
- Each loan displays its permissions and obligations before acceptance, including whether analysis, propagation, cloning, breeding, tissue culture or keeping descendants is allowed, plus the return deadline where applicable.
- The borrowed original remains the institution's property and must be returned according to the loan terms. Permitted descendants are tracked separately with clear provenance and lineage records.
- Loan terms are defined by the society and the player's current reputation tier; the player does not negotiate bespoke terms. As reputation improves, societies automatically offer more generous loan perks, such as broader propagation rights, permission to retain offspring, longer loan periods or access to more valuable specimens.
- Society perks should be distinct and legible, so players have reasons to build relationships with multiple institutions rather than treating reputation as one universal score.
- Breaching a loan agreement may reduce reputation or restrict future access, but rules must be transparent and consequences proportionate. Never use hidden clauses or arbitrarily remove player-owned specimens.

The core principle is **buy foundational species freely; earn institutional trust to access exceptional research material**. Reputation unlocks increasingly generous, predefined loan benefits without adding a negotiation minigame or making basic collection progress depend on institutional access.


## 22. Mutation visibility, detection and trait-strengthening

Mutation discovery should progress from obvious visual observation to instrument-assisted detection and deliberate selection for stronger expression.

### Early game: visible anomalies
- With home-lab equipment, the player mainly notices conspicuous changes, such as clearly increased variegation, unusual leaf shape, striking colour changes or unusually large foliage.
- Subtle, low-expression or visually ambiguous traits can remain undetected. A specimen may look ordinary even while carrying hidden potential.
- Visual observation should create a prompt to investigate, not automatically reveal the full genetic explanation. The player may record a suspected anomaly before having the tools to confirm it.
- Obvious discoveries should be exciting, but not every unusual appearance must represent a stable, inheritable mutation.

### Mid game: equipment-assisted detection
- Better imaging and analysis equipment reveals less obvious changes, including weak variegation, small differences in leaf geometry, subtle growth patterns and traits that are difficult to distinguish by eye.
- Equipment and research unlock progressively finer detection thresholds. Some discoveries require more than one type of analysis or repeated observations across growth stages.
- Analysis distinguishes observed phenotype from inferred genetic potential and reports confidence. A visible trait is what the plant currently expresses; potential describes what may be inherited or expressed in descendants.
- Advanced tools can flag specimens whose measurements suggest an anomaly even when the difference is not immediately obvious in the 3D view.

### Late game: targeted selection and strengthening
- Once a subtle trait is detected and sufficiently understood, players can design propagation or breeding experiments to select for stronger expression.
- Players can compare descendants, retain promising individuals, choose suitable source material or parent combinations where the method allows, and repeat successful protocols across generations.
- Strengthening a trait is not a guaranteed direct upgrade to the source plant. It means selecting descendants that express the desired trait more strongly, while tracking other traits and possible trade-offs.
- Each generation has its own phenotype and genetic profile. The game should allow the trait to strengthen, remain similar, weaken, disappear or combine with other traits depending on the inheritance model and chosen method.
- The player should be able to set research targets such as “increase variegation intensity” or “select for broader leaves,” then compare outcomes against that goal. Sophisticated programmes improve the quality of decisions and odds of success, without eliminating uncertainty.

### Required distinction in the UI
The discovery record should separate:
1. **Observed trait:** what is visibly expressed on this specimen now.
2. **Detected anomaly:** what instruments or tests have found, with confidence.
3. **Inherited potential:** what the specimen may pass to descendants and estimated likelihood.
4. **Expression strength:** how strongly the trait appears in the specimen or may appear in offspring.
5. **Research target:** the trait expression the player is trying to select for in a programme.

The intended progression is **notice the obvious → detect the subtle → understand the potential → select for stronger expression**. This should reward both careful observation and investment in scientific capability.


## 23. Opening tutorial and first mutation

The first mutation is a deliberately guided onboarding experience. Its primary purpose is to teach the player the propagation route and the basic gameplay loop in context, not to test whether a new player happens to get lucky.

### Starter choice and tailored first discovery
At the beginning, the player chooses one of three starter species. Each option teaches the same propagation and discovery loop, but the guaranteed first anomaly is tailored to the selected species:
- **Philodendron — white variegation:** the first offspring displays a clear white-variegation trait. This introduces visible trait strength and the idea of selecting descendants with stronger expression.
- **Alocasia — mutated leaf shape:** the first offspring displays a clearly unusual leaf shape. This introduces phenotype comparison and selection for a desired shape.
- **Monstera — stronger fenestration:** the first offspring displays more pronounced leaf fenestration than the starter. This introduces comparing leaf-development traits across specimens.

These are scripted tutorial outcomes and fictionalised game-genetics events, not promises about real-world inheritance. Each starter option should use existing catalogue artwork where possible and a representative mutation image or tier where needed. All three options teach the same underlying systems, so the tutorial logic should be shared rather than implemented as three separate tutorials.

### Guided first-discovery sequence
1. **Choose a starter species.** The player selects one of the three options above, receives a common starter specimen and is introduced to its plant record and basic care needs.
2. **Prepare a propagation attempt.** A lightweight objective teaches the player to choose an available propagation method, select the source plant or suitable material, and commit the required time and resources.
3. **Grow and monitor the offspring.** The player sees that propagation takes time and that the new specimen receives its own identity and lineage record.
4. **Notice the first anomaly.** The tutorial guarantees the matching visible trait for the selected species, making the discovery exciting and reliable rather than dependent on a random roll.
5. **Record and inspect the result.** The player learns to compare the parent and offspring, record the observed phenotype, and understand that visible expression does not yet reveal the full inheritance profile.
6. **Repeat and learn.** The player propagates again or follows a simple follow-up objective to learn that not every offspring must express the same trait and that descendants should be compared rather than assumed identical.
7. **Set a first research goal.** The player receives an introduction to improving equipment and analysis, establishing the next progression step without revealing every genetic detail immediately.

### Tutorial design rules
- Guarantee the first clear mutation discovery through controlled onboarding, rather than requiring a random roll that could frustrate or confuse a new player.
- Keep the tutorial grounded in the normal propagation, growth, observation and recordkeeping systems. Avoid a disconnected minigame that teaches mechanics the player will not use later.
- Explain only the next useful action at each step. Deeper genetic concepts, probabilities and equipment options should be introduced as they become relevant.
- After the guided discovery, return to the standard probabilistic mutation system. Subsequent discoveries may be obvious, subtle, rare, inherited, unstable or newly arising.
- Preserve player agency: the guided sequence should establish a useful starting specimen and teach the process, not dictate the player's long-term breeding specialisation or make later outcomes predictable.
- The first discovery should feel like an exciting scientific breakthrough, with a clear visual reveal and a permanent entry in the player's discovery journal.


## 24. Specimen ownership, space, use and preservation

Plants are tangible management assets as well as scientific records. Specimens occupy growing space and can be retained, propagated, sold, retired or used in research, with clear rules about when a procedure risks or consumes the plant.

- **Keep and cultivate:** living specimens occupy suitable space and require appropriate care unless a later system explicitly automates or suspends those needs.
- **Sell or retire:** players may sell plants for income or retire/discard specimens to free capacity. The interface should clearly show the consequences before confirming an irreversible action.
- **Propagate and preserve:** where the method allows, players can create descendants before selling, retiring or risking a valuable source. Parent and descendant records remain distinct and linked by lineage.
- **Research risk:** most observation and non-destructive analysis should not consume a specimen. Certain advanced procedures may consume plant material, temporarily occupy the specimen, reduce its health or carry a disclosed risk of damage or loss.
- **Method-specific costs:** propagation methods differ in required source material, time, resource cost, output count, fidelity and risk. The game must not treat every experiment as if it consumes the entire parent plant.
- **Protect valuable genetics:** players should be able to maintain backups, reserve breeding stock and mark important specimens as protected from automated sale or disposal. Automation must respect those protections by default.
- **Scientific records persist:** selling or losing a plant does not erase its discovery entry, recorded analysis, lineage or provenance. However, a record is not a substitute for a living specimen when a future experiment requires biological material.
- **Transparent irreversible actions:** confirm destructive actions and clearly identify the affected specimen, expected outcome and any known risk. Avoid arbitrary losses or hidden consumption rules.

The intended decision is whether to preserve, propagate, sell or risk a specimen—not to force players to hoard every plant indefinitely. Space pressure should create meaningful collection and production choices without punishing players for making reasonable early-game decisions.


## 25. Continuous trait values with tiered representative artwork

Genetic and phenotype values should be more granular than the visual asset library. Trait strength is stored and simulated on a continuous scale where appropriate, while the game uses a small set of representative images or models to communicate broad visual tiers.

### Example: variegation strength
A specimen such as a Philodendron White Princess can have a variegation strength value from 1 to 100. The value affects gameplay calculations, inheritance, selection and valuation where appropriate, but does not require a unique image for every possible value.

The catalogue or specimen card can select representative artwork using configurable ranges, for example:
- **1–30:** low variegation representation;
- **31–60:** medium variegation representation;
- **61–100:** high variegation representation.

These bands are an initial illustrative proposal, not final balance or visual thresholds. The precise ranges and number of image tiers should be configurable per trait or species when visual behaviour differs.

### Rules
- Keep the underlying trait value separate from the chosen artwork tier. A change from 30 to 31 may switch the representative image, but should not cause a sudden discontinuity in the actual genetic value or simulation.
- Other continuous traits can use their own scales and visual bands, including leaf size, colour intensity, leaf shape and growth characteristics.
- Multiple mutations may coexist and interact in the simulation. Artwork can represent the dominant visible traits or use a small number of curated combinations where the combination is especially meaningful.
- Use the specimen's detailed values in records and analysis views, while the main collection interface stays visually readable.
- Artwork tiers should be deterministic and configurable, with sensible fallback assets where a specific species or combination has no bespoke image.
- Where practical, use existing J2Grows catalogue artwork and add representative variants selectively. Do not require a separate bespoke image for every possible trait value or combination.
- Rare or exceptional trait combinations can unlock special representative artwork as a discovery reward, without making visual asset count a bottleneck for the genetics system.

This approach preserves meaningful genetic granularity and breeding optimisation while keeping art production and asset storage practical.


## 26. First-game scope: catalogue-first, no required 3D rendering

J2Grows is the developer's first game, so the initial release must prioritise a complete, polished and maintainable management game over technically ambitious presentation features.

- Core gameplay must work entirely through 2D interface components, plant artwork, charts, records and management screens.
- Do not require custom 3D plant models, real-time leaf rendering or a navigable 3D laboratory for the first playable milestone or initial release.
- Reuse and validate the existing J2Grows plant catalogue and artwork where practical. Create a limited set of representative images for meaningful visual trait tiers rather than generating artwork for every continuous trait value.
- Use clear cards, icons, small charts, specimen comparisons and restrained transitions to make genetics and progression feel visual and premium.
- Major discoveries can use a dedicated reveal screen, before-and-after artwork, lineage highlights and concise scientific findings without needing 3D cinematics.
- Keep presentation components modular so a decorative 3D room could be explored in a later phase, but only after the core loop, save system, balance and usability are working.
- Scope decisions should favour a runnable, testable and polished game that a solo first-time developer can realistically build and maintain.



## 27. Accelerated simulation time, queues and offline progress

J2Grows uses a hybrid idle model with an accelerated simulation clock. Plants, propagation, analysis, research and production progress over time, but game timelines are compressed compared with real-world botany and laboratory work. The player should experience meaningful progress during normal play sessions without waiting real-world weeks for routine outcomes.

### Time model
- The simulation uses a consistent game-time model rather than requiring plant growth and research to mirror real-world durations.
- Growth stages, propagation cycles, specimen analysis, research projects and production tasks have tuned game durations appropriate to their importance and progression tier.
- Routine early-game tasks should complete quickly enough to teach the loop and provide regular feedback. Rare discoveries and major research milestones may take longer, but must remain understandable and worth the wait.
- Time compression is a gameplay abstraction, not a claim that real plants grow or mutate at these rates.
- The exact relationship between game time and real time, task durations and offline caps must be tuned through playtesting rather than fixed prematurely.

### Tasks, queues and efficiency
- Propagation, specimen analysis, research and later production use time-based tasks or queues. Starting a task commits its required resources and makes progress over time.
- Equipment, research, staff, protocols and environmental optimisation can improve speed, success rates, output, reliability or resource efficiency. These benefits should be distinct rather than collapsing every upgrade into a generic speed bonus.
- Multiple queues and parallel processing unlock gradually. Early players make a few meaningful choices; later institutions can operate several specialised processes at once.
- Equipment should create strategic trade-offs such as faster processing versus cost, precision, throughput or fidelity. Avoid upgrades that make earlier equipment instantly pointless unless that is an intentional tier transition.
- Show progress, expected completion and relevant modifiers clearly. Players should be able to understand why one task is faster or more efficient than another.

### Offline progression
- Growth, active propagation tasks, analysis, research and eligible production continue while the game is closed, subject to defined offline rules and caps.
- On return, the game calculates elapsed progress and presents a concise summary of completed tasks, growth changes, discoveries and issues requiring attention.
- Offline simulation must be bounded and deterministic enough for reliable saves and testing. Important irreversible events, health risks and queue behaviour must be transparent.
- Automation can reduce the number of decisions required while offline, but the player should retain control over protected specimens, queue priorities, resource budgets and sale/disposal rules.
- Exact task durations, simulation rate, offline cap and which hazards progress offline remain open balance decisions until tested in a playable build.

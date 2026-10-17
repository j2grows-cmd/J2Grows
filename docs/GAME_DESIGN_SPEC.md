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
9. **Reach institutional milestones** that unlock new research eras, capabilities and larger facilities. At each major milestone, choose whether to continue freeplay at the current scale or invest in a new facility; mandatory prestige resets are not part of the core progression model.
10. **Pursue several long-term goals in parallel:** scientific mastery and stable cultivar development; commercial growth and specialist-market reputation; collection completion and provenance; and increasingly autonomous operations. Players can specialise, switch focus or work towards multiple goals, with distinct milestones and rewards for each.

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
- **Player-led progression:** early breeding is a clear choice of parent specimens and propagation method, with the game presenting likely outcomes in accessible language. Research and facilities progressively unlock parent screening, target-trait priorities, controlled protocols, experimental conditions, multi-generation plans and automated breeding programmes.
- **Progressive breeding controls:** early crosses require only parent selection and a suitable method, with clear plain-language outcome expectations. As analysis tools and research unlock, players can select target traits, set desired expression ranges, prioritise inheritance stability, compare likely trade-offs and define acceptable costs or risks. Advanced programmes can coordinate multiple generations, screen offspring against criteria, retain promising candidates and use selected descendants as parents. The game presents estimates and uncertainty rather than guaranteeing a chosen outcome; advanced controls improve the quality of selection and planning, not certainty.
- **Progressive breeding control:** early on, the player chooses plants to cross or propagate and learns from the visible offspring. Later, analysis and research unlock target-trait selection, allowing the player to choose two parent specimens and specify a mutation or trait to pursue—for example, stronger variegation or a particular leaf shape.
- **Targeting improves odds, not certainty:** the breeding interface should show whether each parent has relevant visible traits or detected hidden potential, how confident the player is in that evidence, and an understandable estimate of the chance and likely strength of the desired outcome. A target may be impossible, unlikely or promising depending on the genetic profiles and available knowledge.
- **Advanced breeding programmes:** later facilities unlock multi-generation plans that grow and assess offspring, retain candidates matching target thresholds, and use selected descendants as parents for the next generation. Players can set priorities and trade-offs, such as trait strength, stability, growth rate or secondary characteristics. Automation may run the routine, but the player retains control of strategic goals and protected specimens.
- **Research-driven endgame:** advanced players can formulate hypotheses, compare expected outcomes, run controlled experiments, analyse offspring and refine the next generation. These tools improve understanding and the ability to influence probabilities; they do not guarantee an exact result.
- **Hybrid model:** use simple, legible rules for foundational traits, while allowing advanced anomalies and trait combinations to depend on multiple genes, modifiers and interactions. Complexity should be introduced progressively through research, equipment and optional detail views rather than imposed on every player at once.
- **Teach through experiments:** early crosses should provide understandable feedback; later experiments can reveal that a trait's inheritance is more complicated than first assumed. Research should help players discover the underlying model instead of merely unlocking unexplained percentage bonuses.
- **Separate expression from inheritance:** a plant's visible phenotype, its underlying genetic potential and the probability of passing or expressing a trait in offspring are related but distinct values.
- **Visual-first discovery:** at the start, players primarily notice what they can see—differences in colour, variegation strength, leaf shape, size, fenestration or growth. Early tools should not reveal a complete hidden genotype; players form hypotheses from visible plants and offspring.
- **Hidden traits are real before they are detected:** every specimen's genetic profile is set independently of what the player knows. Recessive traits, weakly expressed traits, low-strength variations and other subtle mutations may be present without obvious visual evidence. They should not be treated as newly created simply because the player later discovers them.
- **Research reveals rather than creates knowledge:** progressively better observation, comparison, analysis equipment and genetic research expose hidden potential. Early findings may be broad or uncertain; advanced analysis can identify likely recessive alleles, estimate expression strength and inheritance probabilities, and distinguish a trait that is absent from one that is merely not visibly expressed.
- **Progressive trait discovery:** at the start, players mostly rely on visible phenotype, basic observations and outcomes from growing or propagating specimens. Hidden potential is not directly exposed in the interface. Early tools provide clues rather than certainty; later analysis can estimate which traits may be present, how strongly they might express, and how likely they are to appear in descendants. Specialist research can refine confidence and inheritance estimates using comparisons across specimens and generations. Analysis reveals information about the existing genetic profile—it does not change that profile or create a mutation—and uncertainty remains where evidence is insufficient.
- **Teach through surprises:** a later-generation offspring may display a trait that neither parent visibly showed. This can prompt the player to investigate hidden inheritance, compare family records and test a hypothesis. The outcome should be explainable by the game's underlying genetic model, not arbitrary randomness.
- **Keep uncertainty legible:** the interface separates visible expression, suspected hidden traits, confirmed genetic findings and confidence in inheritance predictions. The player can enjoy discovery without needing full scientific detail, while advanced views expose the evidence and relevant genetic model.
- **Natural mutation discovery:** new variations can arise spontaneously during eligible growth or propagation from the beginning of the game. Early on, these appear as unexpected visible differences that the player can notice, record and investigate; they are not guaranteed and should remain relatively uncommon enough to feel exciting.
- **Research-driven mutation work:** later equipment, tissue-culture methods, specialist protocols and research projects can increase the chance of generating or detecting new variation, or focus experiments on a class of traits. These systems influence odds and experimental conditions rather than guaranteeing a chosen mutation.
- **Discovery versus creation:** a mutation may already exist as hidden genetic potential and become visible or detectable later, or it may arise as genuinely new variation during growth or propagation. The game's records and analysis should distinguish these possibilities when the available evidence supports doing so, while allowing uncertainty when it does not.
- **Progressive control and clear risk:** advanced mutation protocols display expected costs, likely outcomes, confidence and possible risks before the player commits. More specialised experiments may offer better odds or more informative results, but should not bypass the need to select, test and stabilise promising descendants.

### Traits
The initial trait families are yield, rarity, size, growth, colour and variegation. Additional traits may be introduced only when they create meaningful gameplay.

### Experiment failure, risk and scientific value

Experiments should be forgiving while players learn, then offer more meaningful risk/reward decisions as research becomes more advanced.

- **Early game:** failed or disappointing crosses primarily cost time and basic resources. Results explain what did not work, and players receive enough feedback to learn without losing irreplaceable progress.
- **Scientific value of failure:** unsuccessful crosses, unexpected phenotypes and inconclusive analyses can still produce research data. The amount and usefulness depend on the experiment, quality of records, available analysis tools and how informative the result is; repeated identical failures should not grant unlimited research.
- **Progressive failure analysis:** early in the game, a disappointing offspring or failed experiment usually gives little explanation beyond the observed outcome, and yields little or no useful research insight. This preserves the early sense of uncertainty and makes improved analysis equipment and expertise meaningful. As the player unlocks better instruments, records, staff and experimental methods, they can investigate possible causes—such as parent genetics, inheritance probabilities, environmental conditions, protocol choice or sample quality—and receive evidence with appropriate confidence levels. Advanced analysis may suggest a better next experiment, but should distinguish a likely explanation from a proven cause and should not retroactively guarantee that the original outcome was predictable.
- **Advanced experimental risk:** specialised protocols may carry explicit risks such as lower viability, specimen stress or loss of consumed plant material, while offering better throughput, more informative data or improved chances of a targeted outcome. The player sees the risk, resource cost and possible benefit before committing.
- **Unexpected outcomes:** experiments can reveal unanticipated traits or combinations. These may be valuable discoveries even when the original target was not achieved.
- **Risk mitigation:** better equipment, validated protocols, skilled staff, backups and pilot experiments reduce uncertainty or limit losses, but do not remove every risk.
- **Clear consent and recovery:** destructive or irreversible procedures require a clear confirmation showing what may be consumed or lost. Protecting valuable breeding stock and maintaining backups should be viable strategies. Scientific records and data already collected remain available even if a specimen is lost.
- **No arbitrary punishment:** outcomes should follow the stated experiment mechanics. Failure must be explainable, and an experiment should not destroy unrelated specimens or silently consume protected plants.

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
- **Starter greenhouse:** the player begins with one basic greenhouse or growing space. It can be configured around one primary plant type at a time, with a small set of understandable environmental controls. This creates an early strategic choice about which plant group to prioritise, rather than letting the player optimise every species immediately.
- **Upgraded greenhouse:** improved lights, shelving, humidity control, watering equipment and basic sensors allow more reliable cultivation. The player can refine the environment for the chosen plant type, but changing the setup for very different species can require trade-offs or a reconfiguration period.
- **Environmental chambers:** progression unlocks separate chambers that can be customised for different species and, later, particular subspecies, cultivars, growth stages or research targets. Each chamber can have its own humidity, light intensity and schedule, temperature, airflow, watering and other relevant controls. Players can save and reuse environment presets.
- **Multiple specialist zones:** larger facilities support several chambers and environmental zones running at once, letting the player cultivate different plant groups under suitable conditions without constantly changing one shared greenhouse.
- **Automated and research-grade environments:** sensors, controllers, specialist equipment and staff maintain target ranges, alert the player to deviations and support repeatable experiments. These systems improve control and consistency but do not guarantee genetic outcomes.

Potential environmental variables include light, temperature, humidity, watering and other relevant conditions. Each species has its own tolerances, preferred ranges, growth patterns and vulnerabilities; the same environmental system applies across the catalogue, but species respond differently. Environmental controllers can later optimise variables within player-defined targets and trade-offs.

The interface should translate conditions into useful feedback. Beginners see clear indicators such as too dry, insufficient light or humidity outside the preferred range; advanced players can inspect detailed readings, histories and target ranges. Presets should reduce routine micromanagement, while manual controls remain available for players who enjoy fine tuning.

- **Progressive cultivation mastery:** early care focuses on a small set of understandable controls and clear corrective advice. Research gradually unlocks more detailed species-specific readings, saved presets for species and growth stages, and controlled experiments that test how environmental conditions affect growth, health and trait expression. Advanced players can compare results across conditions and design repeatable protocols; staff and automation can maintain established targets, while the player remains responsible for meaningful trade-offs and research direction.

### Progressive plant health and biosecurity

Plant health systems grow in depth with the player's facilities, knowledge and collection size.

- **Early care:** begin with readable, common problems such as underwatering, overwatering, unsuitable light or humidity, and basic pest infestations. Clear symptoms and simple indicators teach players to inspect plants and correct care before damage becomes severe.
- **Early treatments:** learn basic responses such as adjusting watering and environment, removing affected foliage where appropriate, and using simple pest treatments. Recovery takes time and may require continued monitoring.
- **Advanced diagnosis:** research and equipment unlock more precise identification of deficiencies, pests and diseases, including problems that can look similar at first. Species and subspecies differ in susceptibility, symptoms and preferred treatment.
- **Spread and outbreaks:** later systems introduce diseases and pests that can spread between susceptible plants through plausible routes such as close proximity, shared tools, handling or contaminated growing areas. Spread depends on the problem, conditions, plant susceptibility and biosecurity practices rather than happening arbitrarily.
- **Quarantine and isolation:** dedicated quarantine space allows new arrivals and suspected cases to be separated from the main collection. Players can monitor quarantine periods and only move specimens into shared growing areas when appropriate checks are complete.
- **Decontamination and sanitation:** unlock cleaning procedures, equipment decontamination, waste handling and room-level biosecurity. These reduce the chance of spread but cost time or supplies and cannot guarantee zero risk.
- **Integrated control:** advanced facilities can use dedicated isolation zones, monitoring systems, staff protocols and automated alerts. Players must balance treatment costs, plant stress, spread risk and the value of the affected specimens.

**Pests and disease remain a genuine risk throughout the game**, including in advanced facilities. Better tools improve prevention, detection, containment and treatment but never make a collection completely immune. Plants can die, so losses should be understandable and manageable through observation, research, good procedures and backup specimens. Relaxed mode provides more warning and easier recovery; Challenging mode makes outbreaks, treatment choices and neglect more consequential without making losses arbitrary. Early on, symptoms and treatments should be simple, warnings generous and spread limited enough for players to learn the system. As collections and facilities grow, diagnosis, quarantine periods, cross-contamination, room-level sanitation and automated monitoring become more important. Diagnosing a problem can contribute research knowledge when it reveals useful evidence, but routine outbreaks should not become a repetitive resource-farming exploit.

Substrates and nutrient regimes have different suitability rather than one universally optimal option. Growth and output depend on genetics, health, maturity, environment, equipment, staff and production-line optimisation.

### Progressive propagation and tissue-culture production

Propagation grows from a straightforward early activity into a configurable production chain. Players unlock methods, substrates, nutrient regimes, growing conditions and equipment through research, facility milestones and supplier access.

- **Early propagation:** start with accessible methods such as cuttings, simple seed growing and basic rooting or growing media. The player chooses a plant and method, then manages a small number of understandable requirements.
- **Substrates and media:** unlock different growing and propagation media over time. Their suitability varies by species and method, with trade-offs in cost, moisture retention, aeration, nutrient availability, contamination risk and handling.
- **Nutrients and supplements:** unlock nutrient mixes and specialist inputs that affect suitable growth stages and species. Correct regimes can improve growth or success; unsuitable combinations can waste resources or stress plants. Avoid a single universally optimal recipe.
- **Growing conditions:** light, temperature, humidity, airflow, watering and other relevant environmental settings affect outcomes. Presets and recommendations help new players, while advanced players can tune protocols for species, subspecies, cultivar, growth stage or experimental goal.
- **Batch propagation:** unlock trays, racks, propagation stations and larger queues. Batch workflows improve throughput but still track each resulting specimen's identity, genetics and lineage.
- **Tissue culture laboratory:** introduce staged protocols such as initiation, multiplication, rooting and acclimatisation as appropriate to the game's abstraction. Equipment, media, nutrients, environmental conditions, staff skill and contamination controls affect cost, output, fidelity and success.
- **Contamination and acclimatisation:** contamination is a meaningful risk in advanced tissue culture. Better sanitation, sterile technique, equipment and validated protocols reduce risk without guaranteeing success. Newly propagated material may need a distinct acclimatisation phase before entering normal growing areas.
- **Production optimisation:** later facilities link propagation, acclimatisation, maturation, inventory and sale or research use. Players can set targets for quantity, cost, genetic fidelity, trait selection and acceptable risk, with automation respecting specimen protections and available capacity.

All methods should have meaningful trade-offs in time, cost, genetic fidelity, mutation risk and quantity produced. The system must distinguish preserving an existing mutation from generating or discovering new variation. Tissue culture is a core pillar alongside breeding, with simple early workflows expanding into multi-stage protocols, specialised equipment and quality control. No substrate, nutrient regime or environmental recipe should be universally best for every plant and objective.

### Progressive tissue-culture mastery

- **Early — cloning:** tissue culture begins as a straightforward way to produce copies of a plant. The player chooses a source specimen, commits basic supplies and waits for a batch of clones, with clear output and success feedback.
- **Intermediate — staged laboratory workflow:** unlock initiation, multiplication, rooting and acclimatisation stages, along with suitable equipment, media, sanitation and staff. Each stage creates useful decisions around speed, cost, contamination risk, survival and fidelity.
- **Advanced — mutation-aware propagation:** unlock protocols that target a known mutation or selected source tissue/growth point. The goal is to preserve a desired trait more reliably and scale a promising named line without confusing it with unrelated variation.
- **Expert — test and select expression strength:** compare multiple culture batches and descendants to investigate how strongly a mutation expresses. Players can select material from promising specimens, compare trait strength and stability, and retain candidates for further propagation or breeding. Different batches may vary; the protocol should not simply let the player set an exact strength slider and guarantee the result.
- **Separate fidelity from variation:** a high-fidelity cloning protocol aims to preserve the source specimen's traits, while specialised variation-focused experiments may accept greater uncertainty to investigate new outcomes. The interface makes clear whether the player is trying to copy an existing mutation, test its expression or seek new variation.
- **Record every batch:** link cultures and resulting plants to their source specimen, selected material, protocol, batch conditions and outcomes. Track individual descendants and their own trait strength, health and lineage even when produced in large batches.

## 5A. Specimen identity, collection management and scale

Every plant specimen remains an individually identifiable record, even when the collection grows to hundreds or thousands of plants. A record can include its species, visible phenotype, known and uncertain genetic traits, mutation type and strength, analysis confidence, health and growth state, location, lineage, propagation history, provenance and protection status. Selling or losing a living specimen does not erase its scientific history, while records alone do not replace living material needed for future experiments.

- **Unified specimen catalogue and detail page:** every individual specimen has a searchable catalogue entry. Selecting one opens a dedicated record linking its identity, species, visible traits, known and uncertain genetics, health, location, provenance, parentage and descendants, propagation history, and every experiment it has participated in or produced. From the record, players can navigate the family tree, inspect experiment results, compare relatives and descendants, review protection and sale status, and start eligible actions. Catalogue, room, inventory and research views all point to the same underlying specimen record, avoiding fragmented or contradictory histories.
- **Progressive relationship views:** each specimen record provides a family tree for ancestry and descendants, detailed linked records for exact parentage and experiment history, and—once suitable analysis and research tools are unlocked—a genetic relationship network that connects specimens by shared or suspected traits, mutations, markers and research lines. The network must distinguish confirmed relationships from hypotheses and show why specimens are connected. It should support filters and navigation back to individual specimen records, helping players find promising breeding candidates across large collections without replacing the authoritative lineage tree.

The collection interface must scale through progressive management tools rather than collapsing specimens into anonymous counts:
- **Search, sort and filters:** filter by species, genus, mutation/trait type, expression strength, rarity, health, growth stage, location, analysis status, lineage and intended use. Filters can combine, such as a species plus mutation type and minimum expression strength.
- **Saved views:** save useful collection views, such as breeding candidates, high-strength variegation, plants awaiting analysis, sale-ready stock or protected breeding lines.
- **Batch actions:** select multiple eligible specimens to move, label, queue for analysis, propagate, list for sale or assign to an operational group. Actions respect each method's costs, capacity and risk, with a summary before destructive or irreversible actions.
- **Individual detail:** each specimen retains its own identity, records, genetic profile, lineage and history. Similar plants may share a batch workflow, but unique genetics and provenance are never merged away.
- **Protection and priorities:** mark specimens as protected, reserve them for breeding or research, or exclude them from automated sale/disposal. Automation follows these rules and reports when a rule prevents an action.
- **Progressive automation:** early collection management is mostly manual; later research, equipment and staff unlock auto-sorting, monitoring, analysis queues, propagation rules and inventory policies. Automation removes repetitive work while leaving meaningful breeding, research and investment decisions to the player.

The interface remains approachable for small collections, with advanced filters and saved views introduced as the collection grows. Hundreds or thousands of specimens are a core use case, not a late-game edge case.

## 8. Rooms, equipment, staff and production

The facility grows from an improvised home setup into a multi-room institution. Room dependencies, functional placement, environmental zones and equipment synergies affect efficiency. Customisation should be functional rather than purely cosmetic.

### Physical facility journey

The player's facilities should feel like a believable journey from hobbyist to professional operator, not just a sequence of abstract upgrade menus.

1. **Garage and garden greenhouse/shed:** begin at home with a makeshift workbench in the garage and a small greenhouse or shed in the garden. Space, power, environmental control, storage and budget are limited. The player chooses what to prioritise and makes practical use of a tiny growing area.
2. **Improved home setup:** add shelving, lights, propagation equipment and a more capable greenhouse. The garage remains useful for basic analysis and administration, but space constraints start to limit larger projects and parallel workflows.
3. **Rented warehouse:** move into a warehouse or light-industrial unit with substantially more floor space, storage and room for production lines, staff and multiple growing zones. It is a scale-up step, not yet a fully equipped scientific laboratory; fit-out, utilities, environmental controls and suitable clean areas must be planned and funded.
4. **Dedicated laboratory and nursery:** establish specialist rooms for genetic analysis, tissue culture, cultivation, acclimatisation, breeding and commercial stock. Infrastructure supports better equipment, trained staff, controlled experiments and more reliable production.
5. **Advanced research institution:** expand into larger, interconnected specialist departments, research-grade environmental chambers, high-throughput propagation and increasingly automated operations. Further expansion can offer multiple buildings or dedicated facilities where useful.

Each step should unlock meaningful capacity or capabilities while introducing understandable rent, utilities, fit-out, staffing and maintenance costs. Milestones present opportunities rather than forcing a move: the player can remain at an earlier site and continue playing, while accepting that some advanced equipment or throughput may require later infrastructure. Moves clearly explain what can be transferred, what needs rebuilding and what ongoing costs will change.

Equipment has tiers, specialisations, synergies and trade-offs. Multiple parallel queues can be expanded through upgrades.

### Progressive workforce management

Workforce systems unlock gradually alongside facility and institutional growth:
Workforce progression follows the same journey as the player's facilities: simple practical help first, then specialist staff, and eventually goal-driven research teams and departments.

- **Home setup — practical helpers:** hire a small number of general employees to automate repetitive care and monitoring, such as watering, checking plant condition, flagging unusual symptoms and following quarantine procedures. Their abilities and available tasks are simple and easy to understand.
- **Growing operation — trained specialists:** unlock staff such as horticulturalists, cultivation technicians, propagation and tissue-culture technicians, genetic analysts, biosecurity specialists and commercial staff. Their expertise improves appropriate tasks but does not remove all risks or guarantee scientific outcomes.
- **Research facility — teams with defined objectives:** assemble specialists into teams and assign a clear goal, such as investigating a named mutation, increasing the strength of a trait across generations, testing inheritance, improving tissue-culture fidelity or developing a production protocol. A team uses suitable staff, equipment, specimens, supplies and time to produce results and evidence.
- **Departments — strategic direction:** at advanced institutional scale, organise teams into departments such as Genetics and Analysis, Cultivation and Biosecurity, Propagation and Tissue Culture, Automation and Production, and Commercial Operations. Give each department objectives, priorities and resource allocations, then review progress, costs, bottlenecks and findings through management dashboards.
- **Player control and oversight:** goals should be specific enough to guide work but flexible enough to support player priorities. Show expected costs, duration, required capacity, success uncertainty and outputs before assigning a team. Staff can carry out routine work and suggest next steps, but major discoveries, breeding targets, specimen protections and significant investments remain under player control.
- **Workforce progression and management:** staff gain experience, can be trained and have distinct skills or traits. Recruitment, wages, workloads and assignments matter, but sensible defaults and policies should avoid turning large departments into tedious shift-by-shift micromanagement.

- **Early helpers:** a small number of straightforward hires provide clear benefits to routine care or basic operations, with minimal administration.
- **Specialists:** later, hire geneticists, botanists, horticulturalists, tissue-culture technicians, cultivation specialists, automation engineers and commercial managers. Each role improves relevant work rather than providing identical generic bonuses.
- **Skills and development:** staff gain experience and develop strengths over time. Training can improve skills, while individual traits create understandable strengths and trade-offs. Recruitment offers a changing candidate pool, so building a strong team is a meaningful choice.
- **Assignments and facilities:** assign staff to rooms, equipment, research projects or production lines. Appropriate staffing can improve speed, quality, reliability, analysis confidence, resource use or risk control depending on the role.
- **Costs and management:** wages, training costs, workload and staff capacity matter. The interface should show what each hire and assignment contributes, and avoid excessive micromanagement.
- **Teams and automation:** advanced facilities unlock teams, specialist leadership and workforce policies. Players can set priorities and let staff run routine operations, while retaining control over important specimens, experimental goals and investment decisions.

Staff should complement equipment and research rather than replace them. Strong facilities still need suitable protocols and staffing, and skilled staff should not guarantee uncertain genetic outcomes.

The main production chain is:

**Propagation → acclimatisation → growing/maturation → inventory → sale or research use**

### Progressive automation system

Automation is built from three complementary parts: **research unlocks capabilities, equipment performs tasks, and staff operate and optimise the systems**.

- **Early automation:** unlock simple, discrete improvements such as scheduled watering, basic environmental control or reminders/queues for routine work. The player still makes most decisions directly.
- **Task automation:** research enables a capability; the player purchases and installs suitable equipment, then assigns staff or a simple operating policy where appropriate. Examples include automated watering, environmental regulation, propagation stations and sample-analysis equipment.
- **Connected production:** later facilities can link propagation, acclimatisation, growing, inventory and sales. Players set priorities, target species or traits, minimum stock levels, quality thresholds and specimen protection rules.
- **Research and staff synergy:** research improves available protocols and control; equipment determines capacity, precision and throughput; staff expertise affects setup, reliability, troubleshooting and efficiency. No one layer should make the others irrelevant.
- **Queues and bottlenecks:** automation has real capacity limits, inputs, maintenance needs and queues. Dashboards explain bottlenecks and let players decide whether to invest in equipment, staff, space or research.
- **Player safeguards:** automation respects protected specimens, breeding reserves, research commitments, facility capacity and sale/disposal rules. Destructive or irreversible actions need explicit permissions and transparent reporting.
- **Endgame autonomy:** advanced institutions can run most routine production and analysis with limited supervision. Players remain responsible for strategic priorities, experimental design, major purchases and responding to unusual results.

Automation should remove repetitive work rather than all meaningful decisions. Players can keep systems manual if they prefer, and automation upgrades should offer clear, distinct benefits instead of only generic speed multipliers.

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

Research uses a connected loop of **data, discoveries and dedicated projects**:

- **Research data:** experiments, analyses, cultivation trials, breeding results and documented failures can generate data. Different activities produce different kinds or quality of data, so players benefit from varied, well-recorded work rather than repeating one trivial action indefinitely.
- **Discoveries unlock possibilities:** new traits, stable lines, unexpected outcomes, validated techniques and institutional milestones can reveal research nodes, protocols, equipment plans or new project options. A discovery may be required to begin a specific project, but core progression should not depend on one extremely lucky random result.
- **Dedicated research projects:** players choose a goal, then allocate the appropriate data, specimens or plant material, equipment, staff and time. Projects can unlock capabilities, improve methods, validate inheritance hypotheses or develop new production systems. Requirements, risks, duration and expected outcomes are shown clearly before starting.
- **Project results feed back into the loop:** successful projects unlock technologies or stronger protocols; inconclusive or unsuccessful projects can still return useful data when the experiment was informative. Results may suggest follow-up projects or new lines of investigation.
- **Progression and automation:** early projects are small and understandable. Later facilities support multiple simultaneous projects, specialist staff, parallel queues and automation. Passive research or staff-generated data may supplement active experimentation, but should not make discoveries feel automatic or irrelevant.

Research remains organised into specialisation trees, with choices across genetics and analysis, cultivation, propagation and tissue culture, automation, and business. Projects can connect branches, encouraging the player to combine a strong specimen collection with the right facilities and expertise.

### Research trees, mutation programmes and departments

The game has two connected research layers with different purposes:

- **Technology research tree — unlock capabilities:** spend research data and meet visible prerequisites to unlock equipment, rooms, environmental chambers, laboratory methods, departments, automation systems and new project types. Nodes can require discoveries, facility milestones, staff expertise or progress in connected branches. The tree represents what the institution is capable of doing.
- **Specific mutation programmes — develop a genetic line:** use experiments and specialist departments to investigate a named mutation or trait. The player defines an objective such as detecting hidden inheritance, increasing expression strength, improving stability across generations, understanding tissue-specific variation or testing whether a trait can be reliably cloned.
- **Experiment design:** choose suitable specimens or source material, a propagation or testing method, the target trait, relevant conditions and acceptable trade-offs. Show required equipment, staff, supplies, duration, risks and likely evidence or outcomes before starting.
- **Department execution:** assign the project to a suitable department or team. Staff carry out analysis, breeding, cultivation trials or tissue-culture batches using available capacity and resources. Advanced departments can run multiple projects and use automation policies.
- **Evidence-driven progress:** results update the mutation's research record and may improve understanding of trait strength, inheritance, stability or the next best experiment. Unsuccessful or unexpected outcomes can still provide useful evidence when informative; they should not automatically advance a target just because time passed.
- **Clear separation of rewards:** technology research unlocks new tools and capabilities; mutation programmes produce knowledge about a specific line and help the player select or establish better descendants. The two layers can support one another without becoming the same progress bar.
- **Research goals and reporting:** projects show their objective, current evidence, remaining work, costs, uncertainties and next-step options. Department dashboards summarise progress, bottlenecks, resource use and results so the player directs the institution without micromanaging every task.
- **Progressive department autonomy and decision points:** early on, the player gives simple instructions and reviews straightforward results. As staff, equipment and departments develop, the player can assign durable goals such as stabilising a named mutation across generations, increasing its expression strength or improving tissue-culture fidelity. Teams carry out routine work within their budgets, specimen protections and assigned priorities, then surface meaningful discoveries, unexpected results, new hypotheses or trade-offs for the player to decide. Decisions might include which follow-up experiment to fund, whether to prioritise stronger expression or greater stability, whether to preserve a promising lineage, or whether to redirect the programme. Routine work should not require constant approval, but consequential scientific choices and resource commitments should return control to the player.
- **Discovery presentation:** routine observations and minor findings use concise notifications that explain what changed and whether action is needed. Important discoveries receive a more memorable visual reveal, followed by a scientific report showing the specimen and lineage, observed traits, supporting evidence, confidence/uncertainty, possible inheritance implications and relevant next steps. Major breakthroughs may open an interactive decision: for example, name and document a mutation, protect or propagate the source specimen, fund follow-up research, establish a breeding line, or consider commercial use. The report must distinguish confirmed findings from hypotheses, and choices should have clear costs, risks and consequences. Discovery moments should feel exciting without interrupting play for every routine result.
- **Strategic options for exceptional specimens:** a rare or valuable discovery should create several viable choices rather than a forced outcome. The player can sell it for immediate funding, retain it as a collection centrepiece with persistent provenance, research it, develop a stable named cultivar, or preserve the original while propagating and selling selected descendants. These choices can be combined where practical. The interface should make trade-offs clear: a sale may surrender access to that living specimen, retaining it occupies space and upkeep, and research or cultivar development takes time and resources but may create lasting scientific or commercial value. Discovery records persist if a specimen is sold or lost; living material remains necessary for experiments that require it.

The primary progression path is institutional: establish a profitable nursery, prove reliable production, develop specialist laboratories, recruit expertise and reach major research milestones. Players can choose when to pursue optional systems and specialisations, rather than being forced through one narrow optimal route.

Upgrades include numerical improvements as well as capability unlocks. Early objectives gradually teach systems without requiring a long mandatory tutorial.

## 10. Economy and market

J2Grows combines a research institution with a commercial nursery. The economy begins understandable and believable, then scales into substantial late-game production and research.

Resources are layered and may include cash, research, biomass/plant material, genetic data and specialised supplies. Each resource should have a clear purpose.

Sales should grow from simple online-style listings into a richer commercial ecosystem, without auctions. Early on, players list plants through a basic online marketplace and sell individual specimens for clear offers, with minimal business management. As the nursery develops, specialist buyers, market insights and optional contracts become available. At a later milestone, the player can choose a commercial specialisation: open and manage their own retail plant shop, or become a wholesaler supplying nurseries, retailers and other organisations through recurring or one-off contracts. These are distinct, viable paths rather than mutually exclusive permanent locks; progression may allow the player to expand into the other path later. Retail focuses on assortment, asking prices, customer demand, brand and individual sales. Wholesale focuses on reliable volume, production planning, contract specifications, delivery deadlines, quality thresholds and margins. Pricing and contracts should create understandable trade-offs in sale speed, workload, reliability and profit, without guaranteeing a sale at any chosen price. Demand changes with scarcity, discoveries, player progression and market events. Contracts remain optional, and player-to-player trading may be considered later; auctions are explicitly out of scope.

Pricing combines a base value with market demand and multiple documented qualities:
- **Appearance and phenotype:** visual appeal, trait strength and the desirability of the expressed combination.
- **Genetic potential:** the usefulness of hidden or confirmed traits for future breeding and research, weighted by analysis confidence.
- **Rarity and availability:** how difficult the specimen or trait is to obtain, including current supply.
- **Inheritance stability:** whether desirable traits are reliably preserved or expressed in descendants, without making unstable specimens worthless by default.
- **Provenance and discovery history:** notable lineage, documented first discoveries, institutional origin and recognised cultivar status.
- **Buyer demand and context:** collectors, breeders, research institutions and commercial buyers can value different qualities differently.

No single factor should determine every sale price. A spectacular-looking specimen may be valuable to collectors even if inheritance is unreliable; a visually subtle plant may be prized by breeders for its stable genetic potential; and a historically significant discovery may retain value because of provenance. These dimensions should influence different buyer types and market opportunities.

Players must balance selling stock against retaining collections, reserves, genetic material and breeding lines. The valuation UI should explain the main reasons behind an offer so prices feel understandable rather than arbitrary.

Commercial progression introduces specialist buyers, market tiers and eventually a choice between retail and wholesale specialisation. The player can open their own shop or focus on supplying contracts, with the possibility of developing both later. Shop management unlocks progressively:
1. **Passive storefront:** list plants at chosen prices and quantities; customers purchase over time, including during eligible offline progress.
2. **Commercial tools:** unlock price guidance, demand and stock insights, featured listings and optional promotions. Players can react to changing demand without needing constant attention.
3. **Specialist brand:** build a reputation around plant groups, desirable traits or research-grade specimens. Reputation attracts relevant customer segments and unlocks premium opportunities, while leaving players free to diversify.

The wholesale path should have its own progression loop: qualify for buyers, accept clearly specified orders, plan propagation and growing capacity, meet delivery windows and quality requirements, and reinvest margins into scale and reliability. Contract details must show quantity, grade/trait requirements, deadline, payment and consequences of non-fulfilment before acceptance. Wholesale should reward efficient, consistent production rather than simply paying more for the same plant. Retail and wholesale both remain compatible with research and collection goals.

The shop should remain useful as an idle system, with deeper management offering meaningful optimisation rather than mandatory repetitive micromanagement. Sales are not guaranteed at any asking price; demand, price, stock and reputation affect how quickly a plant sells. There are no auctions. Any future player-to-player trading is optional and must not be required for core progression. Production costs and supply/demand create strategic trade-offs without arbitrary click limits.

## 11. Institutional eras, milestones and laboratory expansion

Progression is organised around major institutional milestones. Reaching a milestone gives the player a meaningful choice rather than forcing a prestige reset.

At each major milestone, the player can:
- **Stay and freeplay:** continue running the current setup, growing the collection, improving the existing operation, completing optional goals and earning money without being forced into a new era.
- **Invest in a new facility:** purchase or move into a larger or more capable laboratory, nursery or research site. This opens room for new equipment, staff, production capacity and research capabilities, with a substantial but understandable investment cost.

### Facility access and financing

When a milestone is reached, it unlocks suitable facility opportunities; it does not force an immediate move. Each eligible site should show its purchase price, rent and recurring costs, capacity, available infrastructure, fit-out requirements and any milestone or reputation requirements before the player commits. Financing routes may include:
- **Buy outright:** pay the full cost and avoid ongoing rent, while tying up more cash that could otherwise fund research or stock.
- **Rent:** move in with a lower upfront cost but accept recurring payments and the terms shown in the agreement.
- **Borrow:** use a loan to fund a purchase or expansion, with clear repayment schedules, interest and total repayment shown in advance.

Availability and terms should depend on progression, finances and reputation, but borrowing should not become an unavoidable gate or a trap. The player should be able to compare options, understand the long-term costs and continue freeplay at their current facility. Financial difficulty can create meaningful pressure, but should be communicated early and provide reasonable recovery choices.

Moving to a new facility should feel like establishing the next chapter of the institution, not deleting the player's achievements. Scientific records, discoveries, genetic research, cultivar records and lineage, achievements and established knowledge persist. Plant collections and selected equipment should be carried forward according to the move's clearly stated logistics and capacity; any choices about what to transport, sell, store or replace must be shown before committing. The new facility can require fitting out, hiring and rebuilding some operational capacity, creating a satisfying transition without an arbitrary wipe.

Larger facilities introduce new space, equipment tiers, production chains, research programmes and staffing options. Milestones can unlock new facility offers and capabilities, but the player should retain the freedom to remain at an earlier scale. Some advanced technologies may require access to later facilities or research eras, while ordinary progression and freeplay remain rewarding for players who do not move immediately.

Optional milestone challenges can provide extra rewards. Permanent upgrades and era-specific bonuses may exist, but the core progression model is **facility expansion by choice**, not mandatory prestige. The long-term endgame combines research completion, cultivar establishment, autonomous operations, specialist commercial success and continued expansion where the player wants it.

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

Offline progress is calculated when the player returns, not by keeping a full simulation continuously running. Eligible growth, propagation, research, production, shop sales and automated tasks advance according to elapsed time and the state of the player's systems.

- **System-dependent progress:** a process advances only if its requirements were met: suitable equipment and space, available inputs, sufficient staffing where needed, and an active queue or operating rule. Manual tasks do not magically complete unless they were started or assigned before leaving.
- **Realistic limits:** queues, equipment throughput, inventory capacity, stock availability, resource shortages, maintenance and specimen health constrain results. Automation must not bypass the same rules that apply during active play.
- **Offline safeguards:** protected specimens remain protected; automatic sales, disposal and destructive procedures obey explicit player policies. Systems pause or report blocked work when they cannot continue safely, rather than silently producing impossible results.
- **Return summary:** show elapsed time, completed tasks, growth and research progress, sales and income, resource consumption, discoveries, blocked queues and any important risks or interventions needed.
- **Balance and tuning:** the intended default is generous offline progression rather than a short arbitrary cap. A configurable or system-specific cap may be introduced if playtesting demonstrates a balance or technical need; any cap must be clearly communicated and must not silently discard accrued progress.
- **Simulation consistency:** offline calculations should use the same core rules as active play as far as practical, with bounded, deterministic processing for long absences and clear handling of events that depend on order.

Advanced options can expose additional simulation detail without making the default overwhelming. Offline progress should make the institution feel productive while away without rendering active decisions, research planning or optimisation irrelevant.

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

## 17B. Difficulty modes

The game offers two clear difficulty modes, selected at the start of a save:

- **Relaxed:** designed for players who want to focus on plant discovery, collection, research and steady progression with less financial pressure. Growth and progression are more forgiving, plant losses and experimental setbacks are less punishing, and recovery from financial mistakes is easier. The mode still preserves meaningful decisions and uncertainty.
- **Challenging:** designed for players who enjoy optimisation and managing risk. Costs, resource constraints, plant-health consequences, experiment risks and financial decisions demand more planning. Mistakes can slow progress and create recovery work, but should not cause an unrecoverable dead end.

Both modes use the same core systems, catalogue, discoveries, research paths, facilities and endgame goals. Difficulty changes the pressure and forgiveness of the simulation rather than locking core content behind a mode. The game should communicate the practical differences before a save is created, and players should be able to review their selected mode later. Any option to change difficulty mid-save should be designed to avoid exploitative switching around risky outcomes or rewards.

## 17A. Long-term goals and endgame paths

J2Grows should offer several meaningful endgame paths rather than one mandatory victory condition. They can progress in parallel, and the player can change focus over time.

- **Scientific mastery:** investigate genetic systems, validate inheritance models, discover unusual combinations, stabilise valuable traits and establish recognised cultivars.
- **Commercial success:** grow a profitable nursery, build a specialist brand, serve demanding buyers, expand facilities and optimise sales and production.
- **Collection and provenance:** document species, mutations, trait combinations, lineages and historically significant discoveries. Collection goals should reward discovery and records, not require keeping every living specimen forever.
- **Operational mastery:** build reliable, highly automated production and research systems, reduce bottlenecks and manage large collections efficiently.
- **Institutional expansion:** reach milestones that unlock larger facilities and new capabilities, then choose whether to continue freeplay or invest in the next stage.

Each path should have its own milestones, achievements and rewards, with cross-path benefits where appropriate. No single path should be mandatory for enjoying the full core game. Major milestones can celebrate progress without ending the save or forcing a reset; optional challenges and prestige-like bonuses may be considered later, but must not replace the player-choice facility progression model.

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


### Discovery records, provenance and cultivar recognition

Discovery documentation should evolve alongside the player's scientific capability. The system begins as a personal, informal record and gradually becomes a formal route to validated cultivar recognition.

- **Beginner — handwritten field notes:** the player writes or selects simple notes about each plant, including observations, care experiences, unusual features, family/related plants and the specimen's personal history. Notes can be imperfect or subjective; they preserve the player's observations without pretending to be verified scientific findings.
- **Developing collection — organised plant histories:** unlock structured specimen records, linked family trees and lineage, propagation history, dated observations, photographs/representative artwork, and comparisons between parents and descendants. The game should make it easy to revisit an old note when a later result changes what the player understands.
- **Research stage — evidence-backed discovery journal:** discovered anomalies and genetic findings are recorded separately from personal notes, with analysis methods, confidence, supporting observations, propagation outcomes and links to related specimens. Scientific records persist even if the living specimen is sold or lost.
- **Advanced institution — cultivar registration:** unlock formal cultivar documentation and registration after the player has gathered the required evidence. The player must establish a sufficiently distinctive trait, document its lineage and demonstrate stability or predictable inheritance across appropriate generations/propagation tests. A striking one-off mutation is not automatically a registered cultivar.
- **Recognition and rewards:** validated discoveries and registered cultivars can contribute to institutional reputation, collection milestones and specialist opportunities. Registration requirements and benefits are visible in advance; the system should reward good documentation and reproducible evidence, not merely owning a rare-looking plant.

- **Player-named mutations and cultivars:** players can name a discovered mutation or trait line before it qualifies as a formal cultivar. For example, a White Princess may be recorded under its existing cultivar/species identity while the player names their particular variegation line and tracks its strength on a continuous scale. A named line may initially express weakly (for example, 1–50% variegation), fluctuate between descendants or prove unstable; naming it records the player's discovery and does not imply formal registration or guaranteed inheritance.
- **Establishing a new cultivar:** as the player selects descendants with stronger expression and demonstrates greater stability across generations or appropriate propagation tests, the line can qualify for formal cultivar establishment. The player then chooses its official cultivar name. Its parentage, defining traits, observed strength range, evidence of stability and originator are preserved in the register and lineage records.
- **Names must not erase taxonomy or evidence:** existing species and cultivar identities remain distinct from the player's custom mutation/line names. Names should be unique enough to distinguish records, with clear handling for duplicates and renaming. A weak or unstable line remains a legitimate named discovery, but its record clearly shows its current status and uncertainty.

Personal notes, scientific findings and formal cultivar status are distinct layers. The player can enjoy documenting plants from the start, while the more demanding register becomes a meaningful later achievement. Existing notes and lineage should feed into formal records rather than requiring the player to recreate their history from scratch.


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

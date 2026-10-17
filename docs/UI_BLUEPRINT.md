# J2Grows — UI Blueprint

**Status:** Pre-implementation screen and interaction plan  
**Design direction:** Premium botanical/scientific luxury; catalogue-first 2D management  
**Implementation status:** No UI code is authorised by this document.

## 1. Global design language

## Artwork production and asset standards

Plant artwork should use a consistent, scalable production pipeline. First audit and reuse suitable existing J2Grows assets; do not replace good assets merely for uniformity. Establish a visual reference and asset requirements for species identity, framing, lighting, silhouette readability, transparent-background handling where needed, file formats, naming and quality checks. Create missing artwork in batches using the approved style and validate each batch before import.

Use representative artwork for defined expression tiers of continuous trait values rather than generating an image for every numeric value or individual specimen. A specimen's simulation values remain precise; the selected artwork tier is a presentation choice. Multiple traits can coexist in the genetic model, while artwork should show the most relevant visible traits through curated combinations where justified. Maintain stable species IDs and a central asset manifest/resolver so code does not depend on guessed paths or scattered file-extension assumptions.

Before large-scale generation or import, inspect the actual catalogue and storage conventions, confirm asset rights/provenance, detect missing or duplicate files, and validate image dimensions, transparency, file size and visual consistency. Artwork generation should be batchable, repeatable and reviewable; generated assets must not be treated as verified until they have passed checks.



**Approved direction: premium botanical luxury + approachable management UI + detailed scientific views when useful.**

- Near-black/dark surfaces, botanical olive-green accents, elegant typography, refined plant artwork and restrained glass/metal details create the J2Grows premium identity.
- Everyday management uses clear cards, readable progress indicators, friendly explanations and a visible next action; scientific screens can become denser as the player unlocks expertise.
- Avoid both extremes: the game should not look like a sterile clinical instrument panel everywhere, nor a bright casual game that hides its scientific depth.
- Clear status is never communicated through colour alone; pair colour with labels, icons, patterns or text.
- Default views show the next useful action and the most important risks; advanced scientific values are available on demand.
- Every important object uses a stable identity and opens a consistent detail record.
- Avoid ornamental motion that delays interaction. Discovery reveals can be expressive but skippable and reduced-motion compatible.
- Layouts support resizable panels where practical, scalable text, keyboard navigation, contrast options and saved table views.
- Use representative artwork tiers linked to continuous simulation values; do not create a separate image for every trait strength.

## 2. Application shell

### Main navigation
1. **Overview** — institutional status, alerts, tasks and next goals.
2. **Collection** — all individual specimens, filters, saved views and batch actions.
3. **Cultivation** — greenhouse/rooms, zones, conditions, plant health and care tasks.
4. **Breeding & Propagation** — parent selection, method, experiments, offspring and lineage.
5. **Research** — capability tree, active projects, mutation programmes and results.
6. **Production** — propagation batches, acclimatisation, stock and automation.
7. **Shop & Contracts** — listings, pricing, buyers, retail/wholesale path as unlocked.
8. **Staff** — initially lightweight helpers; later specialists and departments.
9. **Institution** — facility, finance, milestones, suppliers, records and settings.

The initial prototype can expose only Overview, Collection, Cultivation, Breeding, Research and Shop, with other sections appearing as clearly marked locked/coming-later destinations only if they help teach progression. Avoid a navigation bar full of empty screens.

### Global header
- Institution name and current facility tier.
- Cash and other currently relevant resources; avoid showing every advanced resource before it exists.
- Current simulation speed/time status and offline-save indicator.
- Alert inbox with severity, plain-language cause and suggested action.
- Save state and settings access.

### Responsive layout
- Desktop: persistent navigation and multi-panel dashboards.
- Narrow screens: collapsible navigation and stacked cards; tables become labelled list rows rather than horizontally unusable grids.
- User can choose compact/detailed information density; critical warnings remain visible in both.

## 3. Screen specifications

### Overview dashboard
**Purpose:** Show what needs attention and what the institution is working towards.

Components:
- Institution summary: cash, operating trend, active facility and current milestone.
- “Needs attention” queue: sick plants, blocked tasks, research decisions, contract deadlines and capacity shortages.
- Active work: growth, propagation, research and production queues with progress and pause reasons.
- Recent discoveries/sales and a clear next-goal card.
- Quick actions only for common, safe operations.

Primary actions: open task, resume/reassign eligible work, inspect warning, navigate to relevant record. No high-risk destructive action is performed directly from a summary card.

### Collection catalogue
**Purpose:** Find and manage any individual specimen at scale.

Components:
- Search and composable filters: species, trait/mutation, expression strength, rarity, health, stage, location, analysis confidence, lineage and intended use.
- Saved views such as “Needs attention”, “Protected specimens”, “Breeding candidates”, “Ready to sell” and “Unanalysed”.
- Sortable columns or compact cards according to density setting.
- Batch selection and safe batch actions: move, queue analysis, propagate, list for sale. Every action previews affected specimens.
- Explicit badges/labels for protected, research-reserved, breeding-reserved and sale-eligible specimens.

Primary action: open specimen detail. Selection state must not merge specimen identity or genetics.

### Specimen detail record
**Purpose:** The canonical page for one plant, its current state and history.

Tabs/sections:
- **Overview:** artwork, stable specimen ID, species/cultivar identity, current phenotype, health, growth stage, location and status.
- **Genetics:** visible traits, hidden/predicted traits, analysis confidence, genotype data only when unlocked, and confirmed versus hypothesised conclusions.
- **Lineage:** parents, descendants, propagation method and links to related records.
- **History:** dated observations, care, transfers, experiments, treatment, sales and provenance.
- **Experiments:** past outcomes, failed/uncertain results and follow-up recommendations.
- **Commercial:** valuation factors, buyer fit, listing status and offer explanation.
- **Protection & use:** keep, breeding reserve, research reserve, propagation source or sale eligibility.

High-risk actions—sale of a protected specimen, destructive experiments, disposal—require clear warnings and confirmation. Automation eligibility must be visible.

### Cultivation and facility view
**Purpose:** Understand the environment and manage care without requiring a 3D scene.

Components:
- Room/zone cards or a simple 2D layout showing capacity, environmental preset and alerts.
- Species-specific target ranges presented as friendly indicators initially, detailed readings later.
- Plant-health queue with symptom, confidence, likely cause and treatment options.
- Quarantine/isolation and sanitation tasks as unlocked.
- Environmental preset selector by species, growth stage or research target.
- Facility capacity and constraints: space, power, environmental control, equipment and upkeep.

The starting greenhouse supports one plant type/preset. Later facilities introduce custom chambers, multiple zones and research-grade automation. Layout view is informational/functional, not a required 3D simulation.

### Breeding & propagation workbench
**Purpose:** Make experiments understandable and preserve scientific traceability.

Progressive workflow:
1. Choose parent/source specimens.
2. Choose method (basic propagation, seed cross, cutting, cloning, tissue culture as unlocked).
3. Choose a simple objective or target trait when the player has the capability.
4. Review inputs, costs, duration, capacity, risks and likely information gained.
5. Confirm and queue the experiment.
6. View progress, blocking reasons and result.
7. Compare offspring/source and decide whether to analyse, preserve, breed again, establish a line or sell.

Early play uses a compact guided workflow. Advanced play adds target expression/stability, multi-generation selection, conditions, tissue selection and automated breeding programmes. The UI must not imply a desired genetic outcome is guaranteed.

### Research hub
**Purpose:** Separate capability unlocks from questions about a specific mutation.

Two linked areas:
- **Technology tree:** unlock equipment, rooms, methods, departments and automation.
- **Projects/programmes:** investigate a named mutation, inheritance, expression strength, stability, tissue-culture fidelity or production method.

Each project shows its hypothesis/goal, specimens and materials, staff/equipment, cost, duration, risk/uncertainty, progress and decision points. Results distinguish confirmed findings from hypotheses and update linked specimen records. Failed experiments can contribute useful data only when the outcome is informative.

### Discovery reveal and report
**Purpose:** Make discoveries emotionally rewarding and scientifically legible.

- Routine changes use compact notifications.
- Important discoveries use a short, skippable reveal of the relevant representative artwork and visible trait changes.
- The report states what changed, what is known, confidence, possible causes and suggested next experiments.
- Major breakthroughs present choices: name, protect, propagate, research, establish a line or commercialise selected descendants.
- Keep the original specimen and selected descendants distinct. Discovery ownership/provenance is recorded; selling a specimen does not erase its history.

### Shop and commercial operations
**Purpose:** Provide clear, non-auction sales and later business specialisation.

Early:
- Eligible specimens, asking price/offer, expected sale speed and basic buyer type.
- Transparent reasons for valuation: phenotype, genetic potential, stability, rarity, provenance and buyer demand.
- Simple sales history and cash-flow summary.

Later:
- Retail assortment, brand, price and demand tools.
- Wholesale contract list with quantity, grade/trait requirements, deadline, payment, margin and consequences shown before acceptance.
- Forecasted stock and production capacity.
- Optional contract acceptance; no hidden terms and no auction mechanic.

### Production and automation
**Purpose:** Scale repetitive work without losing specimen-level control.

- Pipeline: propagation → acclimatisation → growing → listing/sale.
- Queue capacity, input requirements, bottlenecks and blocked-task reasons.
- Rule builder: eligible specimens, minimum stock, target location, action, priority and exclusions.
- Protected/reserved specimens are excluded by default and cannot be overridden silently.
- Show a preview of affected specimens and expected effects before enabling a new rule.
- Later department automation adds goals and surfaces decisions rather than making irreversible strategic choices silently.

### Staff and departments
**Purpose:** Introduce help gradually and prevent excessive micromanagement.

- Early: simple helper assignments for watering, checking plants, quarantine and routine care.
- Mid-game: skills, experience, wages, availability and specialist task capacity.
- Late-game: departments with goals, budget, active projects, findings, bottlenecks and decisions requiring player input.
- Show whether a project is delayed by staff, equipment, supplies, space or knowledge.
- Staff assist but do not guarantee mutations or remove the need to choose research priorities.

### Institution, facilities and finance
**Purpose:** Make growth and financial risk understandable.

- Current facility, capacity, available equipment and tier-locked capabilities.
- Milestone requirements and optional move/upgrade choices.
- Compare buy, rent and loan using upfront cost, recurring cost, interest/total repayment, fit-out and capacity.
- Cash flow, upcoming obligations, debt, runway and warnings.
- Clear recovery options before serious consequences where appropriate.
- No forced prestige reset. Moving facilities shows what transfers, what must be sold/stored and the logistics/costs.

### Journal, lineage and scientific records
**Purpose:** Preserve the player's history and support long-term goals.

- Beginner field notes and observations.
- Discovery timeline and evidence-backed reports.
- Cultivar/trait-line records, lineage tree and later genetic network.
- Confirmed links versus hypotheses clearly distinguished.
- Personal achievements and institution milestones.
- Formal cultivar registration only after evidence of distinctiveness, lineage and stability; early player naming remains available for discoveries.

### Save slots and settings
- Multiple local save slots, new/load/rename/delete with confirmation.
- Version and last-saved time; clear recovery/backup behaviour.
- Offline return summary with completed work, discoveries, sales, resource changes and blocked tasks.
- Settings for accessibility, display density, reduced motion, sound (if present), simulation notifications and difficulty.
- Cloud save controls only when cloud sync is implemented; never imply unavailable features exist.

## 4. Prototype navigation flow

New game → starter plant choice → specimen record → basic care/growth → propagation attempt → guaranteed tutorial anomaly → discovery report → first research branch → simple offspring comparison → sell or preserve specimen → purchase one upgrade → configure one safe automation rule → save and return/offline summary.

The tutorial must be skippable after the first guided run where practical, and its guaranteed mutation is a scripted onboarding event rather than the normal mutation probability model.

## 5. Shared interaction rules

- Any task with a duration shows time remaining and what may block it.
- Any cost is visible before confirmation.
- Any risk has a plain-language explanation; uncertainty is not presented as certainty.
- Batch operations preview the selected specimens and never collapse individual records.
- Protected specimens cannot be sold or discarded automatically.
- Destructive actions require explicit confirmation.
- Alerts link to the relevant screen/record.
- The player can distinguish simulation time, offline progress and real-world time.
- Important actions have keyboard-accessible controls and do not depend on colour alone.
- Empty/locked screens explain what unlocks them, without implying the player must rush or pay.

## 6. UI implementation order

1. Application shell, typography/tokens, navigation and responsive primitives.
2. Overview dashboard and collection catalogue with seeded sample data.
3. Specimen detail record and shared status/alert components.
4. Cultivation cards and timed-task queue.
5. Breeding/propagation workbench and discovery report.
6. Research hub and simple unlock tree.
7. Shop, sale confirmation and resource summary.
8. Local save/load and offline return summary.
9. Protected-stock automation rules and batch-action previews.
10. Accessibility review, keyboard flow, responsive testing and visual polish.

Build shared data contracts and interactions before adding advanced screens. The UI must consume simulation state through clear interfaces rather than owning gameplay rules itself.

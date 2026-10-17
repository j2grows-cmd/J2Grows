# J2Grows — Design Audit and Decisions

**Status:** Pre-implementation review  
**Purpose:** Consolidate the design baseline, identify contradictions and risks, and define the decisions that must be settled before broad implementation.  
**Implementation status:** Not started. This document does not authorise scaffolding or feature implementation.

## Executive assessment

J2Grows has a distinctive identity: a premium botanical collection and management game whose long-term hook is discovering, understanding, breeding, preserving and commercialising unusual plant genetics. The design has enough detail to begin technical planning, but it currently describes more systems than a first playable build can safely deliver at once.

The recommended strategy is to preserve the full vision while proving a compact end-to-end loop first. The catalogue, specimen identity, deterministic simulation, research, propagation, sales and local persistence are foundational. Departments, advanced research autonomy, social play and modding are later layers.

## Confirmed product baseline

- Browser-first, catalogue-first 2D management interface; no required 3D laboratory in the initial release.
- Premium scientific-luxury visual identity, with accessible defaults and customisable information density.
- Single-player and offline-first; optional online services come only after the offline core is reliable.
- One-time purchase for a complete core game; no microtransactions, paid progression boosts or paid genetic advantages.
- Hybrid idle simulation with accelerated in-game time, generous offline progress, transparent task blocking and a return summary.
- Every specimen retains its own identity, genetic profile, lineage, health, provenance and protection status.
- Continuous underlying trait values use a small set of representative artwork tiers; artwork is not generated for every numeric value.
- Progressive genetics: intuitive early crosses, then hidden alleles, analysis, interacting loci, targeted programmes and multi-generation selection.
- Research tree unlocks capabilities; mutation-specific projects produce evidence about particular genetic lines.
- Progression from garage/home greenhouse to improved home setup, warehouse, dedicated lab/nursery and advanced research institution. Expansion is optional, with clear constraints if the player stays.
- Retail and wholesale are distinct, viable commercial paths. Auctions are out of scope.
- Parallel long-term goals; no mandatory prestige reset.
- Modding is a post-launch capability, starting with validated catalogue/artwork content if feasible.
- Development proceeds through an internal prototype, substantial early access, then deeper systems.

## Audit findings and resolutions

### 1. 3D rendering conflicts with the selected first-release scope

**Finding:** The technical direction still names Three.js/React Three Fiber as a proposed starting component, while the product decisions explicitly choose catalogue-first 2D and no required 3D.

**Resolution:** Remove 3D rendering from the required initial stack. Build the interface with React and TypeScript using data-driven 2D components. A decorative 3D view can be reconsidered only after the core game has proven its value and performance budget.

### 2. Competition decision is stale

**Finding:** The open-decisions list still asks whether optional competitive events and leaderboards are compatible with the player's wish to avoid competitive systems. Subsequent decisions confirm offline-first optional social features, with opt-in comparison only.

**Resolution:** Core progression is never competitive or online-gated. Social features and any rankings are opt-in, non-essential and deferred. Do not build competitive discovery races or seasonal events into the first release.

### 3. Offline progress terminology is inconsistent

**Finding:** Some roadmap wording says “bounded offline progression” without reflecting the preference for generous full progress, while other sections promise substantial offline progression.

**Resolution:** Eligible tasks advance during absence when their requirements and capacity are met. Progress should be generous and transparent. Any technical or balance cap must be explicitly explained to the player. Blocked tasks do not magically complete; the return summary explains why they stopped.

### 4. Prestige terminology risks implying a forced reset

**Finding:** Some roadmap wording lists prestige as a general feature, but the established decision is milestone-based facility expansion with no mandatory reset.

**Resolution:** Use “institutional milestones and optional expansion” as the standard term. Any future prestige-like mechanic must be optional and must not erase scientific records, discoveries or core progression.

### 5. First playable milestone is too broad if interpreted literally

**Finding:** The first playable description includes every core pillar, which could be mistaken for a requirement to implement advanced genetics, full cultivation, tissue culture, staff, departments, offline simulation and complete commercial systems before the first test.

**Resolution:** The prototype should demonstrate simplified vertical slices of the loop: a small curated catalogue, specimen records, a basic growth timer, one propagation route, a deterministic breeding/discovery outcome, one research unlock, one sale, one upgrade, one automation rule and local save/load. Advanced systems can be represented by simple placeholders until the loop is fun and reliable.

### 6. Genetics need a bounded first technical model

**Finding:** The full design calls for loci, alleles, polygenic traits, linkage, epistasis, hidden potential, mutation categories and inheritance differences by propagation method. Implementing all of these at once increases debugging and balancing risk.

**Resolution:** Before genetics implementation, write a separate technical design with stable trait IDs, a deterministic seeded random source, genotype/phenotype separation, explicit inheritance rules, method-specific propagation fidelity, and test cases. Begin with a small number of loci and clear inheritance, then extend the model without changing save semantics casually. Do not claim scientific precision beyond the fictional rules.

### 7. Save format and offline simulation must be designed together

**Finding:** Multiple save slots, long offline progress, task queues, individual specimen records and future cloud sync create migration and time-accounting risks.

**Resolution:** Define a versioned save schema, stable entity IDs, validation, migration and recovery behaviour before saves ship. Store enough task state to calculate eligible offline progress deterministically and safely. Never rely on the UI to be the source of truth for simulation state. Cloud sync remains deferred until local saves are reliable.

### 8. Existing catalogue and artwork paths are not yet verified

**Finding:** The design expects reuse of the existing J2Grows plant catalogue and artwork, but the current schema, ID quality, completeness, licences and file paths have not been audited in this design review.

**Resolution:** Inspect the real catalogue before committing to an import schema. Create a data-quality report for duplicate IDs, taxonomy, missing fields, accepted names, image availability, extensions, provenance and usage rights. Use a central artwork resolver and stable IDs; do not hard-code guessed paths.

### 9. Content scope and production cost need a deliberate boundary

**Finding:** The vision combines thousands of specimens, advanced genetics, tissue culture, biosecurity, staff, dynamic markets, facility layouts, modding and optional online features. This is not a sensible initial release checklist.

**Resolution:** Prioritise reusable systems and a small representative set of species and traits. Expand catalogue quantity only when data quality and system performance are proven. Artwork should use curated representative tiers, not one asset per numeric trait value. Departments, online features and mods are later gates.

### 10. Financial failure needs an explicit fair-play specification

**Finding:** Bankruptcy can occur in both difficulty modes, but the design also calls for recovery options and offline operations. Unattended expenses could otherwise create an unfair surprise.

**Resolution:** Define clear cash-flow forecasts, debt and obligations dashboards, warnings before major consequences, transparent recovery options where appropriate, and a documented terminal-failure rule. Offline simulation must not silently cause an irreversible failure without clear rules and prior visibility.

### 11. Automation needs safety invariants before it scales

**Finding:** Automation will eventually operate while the player is offline across large collections and production chains.

**Resolution:** Establish system-wide invariants: protected specimens cannot be sold or disposed of automatically; reserved breeding/research stock is respected; batch actions preserve individual identity; destructive experiments require confirmation; failed/blocked tasks explain themselves; and automation obeys player priorities. These should be covered by tests, not only UI warnings.

### 12. The design document needs a single source of truth

**Finding:** The specification has accumulated appended sections, older open decisions and repeated topics. This is understandable during discovery but risks conflicting guidance for implementation.

**Resolution:** Treat the main specification as the canonical product baseline, this audit as the decision/risk register, the UI blueprint as the interface plan and the roadmap as the delivery sequence. Resolve stale open decisions and use links to detailed appendices rather than duplicating rules. A later editorial pass should normalise section numbering without changing approved mechanics.

## First-playable acceptance criteria

The prototype is ready for a design/playability review only when a tester can:

1. Start a new local save and choose one of the starter plants.
2. Open a unique specimen record and see its identity, condition and history.
3. Advance time and see a meaningful growth or propagation result.
4. Perform a simple cross or propagation experiment and receive a reproducible, explainable outcome when using the same saved random seed.
5. Record a discovery and unlock one useful research capability.
6. Sell an eligible specimen, see the money change and buy a useful upgrade.
7. Configure one safe automation rule and verify it respects protected stock.
8. Save, close/reload and retain the same valid institution state.
9. Simulate an absence and receive a transparent summary of eligible and blocked tasks.
10. Complete the loop without needing an internet connection or a 3D scene.

## Decisions required before feature implementation

- Inspect and validate the actual catalogue, stable IDs and artwork paths.
- Agree the first-playable species/trait subset.
- Approve a bounded first genetics model and deterministic random design.
- Approve a versioned local-save schema and offline time-accounting design.
- Define initial balance configuration as data, with values tuned in playtests.
- Choose the exact browser support/performance baseline.
- Write acceptance tests for the first playable milestone.

## Explicitly deferred

3D scenes; accounts and cloud sync; player trading; rankings/events; modding; advanced department autonomy; complex market simulation; large-scale facility layouts; broad multi-locus genetics beyond the first model; mobile and desktop packaging. These are not cancelled, but must not block the first playable loop.

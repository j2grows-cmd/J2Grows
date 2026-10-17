# J2Grows implementation roadmap

**Current status:** Design discovery complete. The Game Design Specification is the design baseline; implementation has not started.

## Phase 0 — specification and validation
- [ ] Review and approve `docs/GAME_DESIGN_SPEC.md`.
- [ ] Resolve the competition/events interpretation.
- [ ] Inspect and validate the existing plant catalogue, stable IDs and artwork paths.
- [ ] Define first-playable acceptance criteria and an initial balance configuration.
- [ ] Write the focused genetics and save-system technical designs.

## Phase 1 — runnable foundation
- [ ] Add React + TypeScript + Vite scaffold.
- [ ] Establish strict TypeScript, formatting and consistent scripts.
- [ ] Build the responsive premium-dark application shell.
- [ ] Add a deterministic test runner and smoke tests.
- [ ] Ensure the browser app starts in GitHub Codespaces.
- [ ] Verify installation, test and build commands before documenting them.

## Phase 2 — first playable loop
- [ ] Starter home lab and small curated plant set.
- [ ] Basic growth, care and environmental controls.
- [ ] Earn cash, research and plant material through understandable actions.
- [ ] Inspect specimens and reveal visible traits, then genetic markers.
- [ ] Clone and run simple crosses.
- [ ] Record discoveries and cultivar lineage.
- [ ] Sell specimens and invest in equipment.
- [ ] Include one initial automation capability.
- [ ] Provide clear costs, outcomes and failure reasons.

## Phase 3 — simulation systems
- [ ] Genetics modules: loci, alleles, inheritance, phenotype, mutation and breeding outcomes.
- [ ] Seeded random source and deterministic tests.
- [ ] Cultivation, plant health, species-specific growth and propagation trade-offs.
- [ ] Tissue-culture workflows and acclimatisation.
- [ ] Research trees, upgrades and objective progression.
- [ ] Document fictional rules; do not claim precise simulation of real plant genetics.

## Phase 4 — management and scale
- [ ] Multiple rooms, environmental zones and functional equipment placement.
- [ ] Staff candidates, skills, costs and process improvements.
- [ ] Connected propagation-to-sale production chains.
- [ ] Configurable automation priorities and minimum stock.
- [ ] Dynamic NPC buyers, contracts and market demand.
- [ ] Institutional milestones, eras and prestige.

## Phase 5 — saves, polish and content
- [ ] Versioned save schema, validation, migrations and recovery.
- [ ] Bounded offline progression calculated on return.
- [ ] Economy and progression balance tests.
- [ ] Import and validate existing catalogue records.
- [ ] Centralise artwork references and file-extension handling.
- [ ] Responsive layouts, accessibility and reduced-motion options.
- [ ] Performance and early-access readiness checks.

## Phase 6 — later features
- [ ] Sandbox mode and deeper simulation controls.
- [ ] Cloud saves with conflict resolution and clear recovery behaviour.
- [ ] Optional rankings, events, asynchronous lab visits and institutes.
- [ ] Trading with anti-duplication and economy safeguards.
- [ ] Extensible modding support.
- [ ] Windows desktop packaging; assess macOS and mobile support.

## Release gate
Do not begin broad implementation until the design baseline and first-playable acceptance criteria are approved. Keep the game runnable at each milestone, prefer small verifiable changes, and never describe an untested build or deployment as verified.

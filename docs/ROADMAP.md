# J2Grows — production roadmap

**Target:** premium single-player PC management game, Windows first, intended for Steam.
**Creative direction:** rich botanical environments paired with a sophisticated dark-luxury genetics laboratory UI.
**Scope:** ambitious, content-rich management and genetics game designed for long-term replayability.
**Current status:** playable web-based prototype 0.1. Keep it runnable while the game systems are separated, tested and expanded. Steam packaging is a later milestone, not something this browser prototype currently provides.

## Verified implementation status · 20 October 2026

The current branch has a seeded random utility, a turn-based clock, save recovery for breeding and lineage references, pure health/stage/propagation helpers, explicit diploid loci, mutation provenance, a 30/60/90-day cost forecast, local catalogue audits, Chromium smoke tests, and Windows x64 installer/portable packaging CI.

These are foundation slices, not evidence that the full game design is complete. The browser smoke tests cover starting a game, advancing a day, viewing financial projections, and manual save/load. Windows packaging has passed CI, but Steamworks, code signing, automatic updates, and browser-to-desktop save migration remain outstanding. Live Supabase content has not been exhaustively audited in this repository workflow.

## Product pillars

1. **Discovery:** investigate hidden traits, mutations, phenotype expression and cultivar stability.
2. **Cultivation:** grow a broad roster of real plant species in configurable environments; clearly label abstracted fictional genetics.
3. **Breeding:** plan crosses, track parentage, compare offspring, select candidates and run multi-generation programmes.
4. **Management:** operate rooms, equipment, staff, budgets and connected production chains.
5. **Automation:** earn reliable workflows through research, specialist staff and equipment, with player-defined priorities.
6. **Collection and enterprise:** build a scientifically documented collection, serve specialist buyers, fulfil contracts and expand the institute.
7. **Presentation:** deliver a premium botanical atmosphere, legible scientific UI, responsive controls, accessibility and useful audiovisual feedback.

## Production phases

### Phase 1 — reliable foundation (current priority)
- [x] Add a reproducible seeded random source and event-isolated streams for gameplay decisions.
- [ ] Move simulation rules out of the React application into focused, pure game modules.
- [ ] Add deterministic tests for day advancement, breeding outcomes, plant growth, economy and offline progress.
- [x] Strengthen save validation, legacy-genetics migration, breeding reservations, lineage references and recovery reporting.
- [ ] Expand browser smoke coverage beyond the implemented new-game, day-advance, finance and manual save/load journeys to cover shop, settings, import/export and tutorial completion.
- [ ] Establish formatting/linting and CI gates without making local development cumbersome.
- [ ] Document the supported prototype behaviours and remaining known limitations.

**Exit gate:** repeatable test runs; invalid saves cannot silently corrupt current progress; a new player can complete the core loop in a browser smoke test.

### Phase 2 — genetics and cultivation simulation
- [x] Define explicit diploid loci and seeded allele inheritance; versioned genome schema/API refinements remain.
- [ ] Keep genotype, expressed phenotype, player knowledge and mutation evidence separate.
- [ ] Implement parent compatibility, probability estimates, offspring generation and lineage records.
- [x] Add mutation category, origin, tissue distribution, parent-mutation provenance and evidence; deeper expression history and stability evidence remain.
- [ ] Implement species-aware growth, health, environmental tolerances, propagation and acclimatisation.
- [ ] Build deterministic fixtures and balance tests for expected outcome ranges.
- [ ] Make advanced breeding controls unlock progressively through research; targeting must improve odds, never guarantee outcomes.

**Exit gate:** players can explain a result, reproduce a simulation from its seed, and trace every offspring to its parents and breeding project.

### Phase 3 — management and production depth
- [ ] Add multiple rooms and environmental zones with functional capacity and equipment.
- [ ] Expand staff into candidates, skills, specialisations, schedules, training and wages.
- [ ] Connect growth, propagation, acclimatisation, quality checks, storage and sales into production chains.
- [ ] Add player-configurable automation priorities, minimum stock and exception handling.
- [ ] Implement buyers, market demand, contracts, reputation and seasonal/event-driven opportunities.
- [ ] Extend the 30/60/90-day operating-cost forecast into a full cash-flow model with transaction history, sales assumptions, tested recovery actions and affordability balancing.
- [ ] Add a branching research tree with meaningful trade-offs and specialisations.

**Exit gate:** more than one viable strategy exists; automation creates strategic capacity rather than simply removing clicks.

### Phase 4 — long-term progression and content
- [ ] Deliver a guided opening arc and a substantial mid-game progression path.
- [ ] Add institutional milestones, research eras, collection goals, cultivar registration and achievements.
- [ ] Add sandbox/freeplay and optional long-term challenge goals; no mandatory prestige reset.
- [ ] Expand the data-driven plant catalogue in reviewed content batches, validating taxonomy, stable IDs, artwork paths and usage rights.
- [ ] Add contracts, events and buyer archetypes that reward different specialisations.
- [ ] Add advanced multi-generation breeding programmes and selection criteria.
- [ ] Tune pacing for short check-ins and extended optimisation sessions, with a target of 100+ hours of optional mastery rather than artificial grind.

**Exit gate:** a complete start-to-late-game arc, several distinct play styles and enough content for repeated runs.

### Phase 5 — botanical environments and presentation
- [ ] Replace placeholder art systematically with consistent, licensed or original assets.
- [ ] Build rich room/greenhouse scenes that communicate climate, plant condition, equipment and production state.
- [ ] Preserve a clear information hierarchy in the laboratory UI; do not sacrifice readability for decoration.
- [ ] Add purposeful transitions, plant-state feedback, discovery moments and restrained sound design.
- [ ] Ensure reduced motion, high contrast, keyboard navigation, scalable UI and readable text.
- [ ] Profile catalogue, large collections, simulation updates and asset loading for performance.

**Exit gate:** coherent visual identity across every major screen, with feedback that makes actions and discoveries understandable.

### Phase 6 — desktop and Steam release
- [ ] Decide and implement the desktop wrapper/engine approach after a technical spike; preserve the TypeScript game core where viable.
- [ ] Add Windows builds, app identity, versioning, window/resolution handling and safe local save paths.
- [ ] Implement robust backups, migration and recovery for desktop saves; evaluate optional Steam Cloud only after local reliability.
- [ ] Add input handling, pause/focus behaviour, crash diagnostics and first-launch experience.
- [ ] Test clean installs, upgrades, save migration, offline play, performance and supported Windows configurations.
- [ ] Prepare Steam store assets, trailer/screenshots, accessibility disclosures, privacy notes, support route and release checklist.
- [ ] Run a limited external playtest and address blocking feedback before Early Access.

**Exit gate:** reproducible release builds, tested save migration, no known critical blockers, and a documented support/recovery process.

### Later, explicitly optional
- Cloud sync and conflict resolution.
- Opt-in social features, rankings or trading, only after offline progression is reliable.
- Mod support and additional desktop platforms.

These must never gate the single-player core loop.

## Delivery rules

- Work in small branches and reviewable pull requests; keep `main` releasable.
- Keep simulation logic independent of UI, rendering, storage and online services.
- Use seeded randomness for reproducible simulation tests and save enough state to reproduce important outcomes.
- Do not claim browser interaction, performance, packaging or release readiness without actually testing it.
- Prefer a smaller set of complete, balanced systems over many shallow screens.
- Never expose Supabase service-role credentials; the core game must remain playable offline.
- Use the acceptance checklist in `README.md` at each milestone.

## Immediate next actions

1. Land a small deterministic random utility and tests.
2. Refactor day advancement into a testable simulation module and replace direct `Math.random()` use in game decisions with a simulation random source.
3. Add regression coverage around breeding, plant growth, weekly costs and offline catch-up.
4. Add browser-level smoke tests and use them to identify real interaction failures.
5. Strengthen save migration and referential integrity before adding high-volume content.

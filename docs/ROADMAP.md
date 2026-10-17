# FLORALAB implementation roadmap

## Milestone 1 — foundation

- [ ] Add React + TypeScript + Vite scaffold.
- [ ] Establish strict TypeScript and consistent scripts.
- [ ] Build the responsive premium-dark application shell.
- [ ] Add a deterministic test runner and smoke tests.
- [ ] Ensure the browser app starts in GitHub Codespaces.
- [ ] Document commands only after they have been verified.

## Milestone 2 — playable game loop

- [ ] Starter lab and starter specimen.
- [ ] Earn research points and biomass over time.
- [ ] Inspect a specimen and reveal genetic markers.
- [ ] Clone and cross-breed specimens.
- [ ] Record first-time discoveries in a journal.
- [ ] Sell specimens and invest in equipment.
- [ ] Provide clear costs, outcomes, and failure reasons.

## Milestone 3 — genetics architecture

Separate modules for:
- genotype and allele representation;
- locus definitions and inheritance rules;
- phenotype expression;
- mutation generation;
- breeding outcomes;
- species/cultivar metadata;
- deterministic seeded random sources;
- validation and serialization.

The first implementation should use explicit, documented fictional rules. Avoid claiming that these rules model real plant genetics precisely.

## Milestone 4 — progression and saves

- [ ] Versioned save schema and migrations.
- [ ] Safe save loading with validation and recovery.
- [ ] Bounded offline progression.
- [ ] Meaningful upgrade choices and escalating costs.
- [ ] Economy tests and balance configuration.

## Milestone 5 — 3D laboratory

- [ ] Efficient React Three Fiber scene.
- [ ] Specimen display with selectable plants.
- [ ] Research equipment that reflects upgrades.
- [ ] Accessible UI overlays and reduced-motion options.
- [ ] Responsive layout and performance budget.

## Milestone 6 — catalogue and artwork

- [ ] Import existing catalogue through a validation script.
- [ ] Verify stable IDs and unique records.
- [ ] Centralize artwork URL construction and file-extension handling.
- [ ] Provide graceful local fallback artwork.
- [ ] Never expose Supabase service-role secrets in client code.

## Milestone 7 — desktop and online features

- [ ] Add Electron packaging after browser workflows are stable.
- [ ] Review Electron security settings.
- [ ] Add online accounts/cloud saves only with an explicit trust and data model.
- [ ] Add competitive research rankings after cheating and validation risks are considered.

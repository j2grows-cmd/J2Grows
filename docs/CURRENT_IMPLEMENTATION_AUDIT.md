# J2Grows implementation audit

**Audit date:** 20 October 2026  
**Audited branch:** `main`  
**Repository:** [j2grows-cmd/J2Grows](https://github.com/j2grows-cmd/J2Grows)

## Current verified repository state

The repository is a playable Prototype 0.1 built with React, TypeScript and Vite. It includes the plant catalogue, specimen collection, growth and propagation, breeding, genetics/research, mutation records, greenhouse controls, facilities, staff care, shop, sales, financial projections, browser-local autosave, manual save slots and backup import/export.

The current code includes seeded event randomness, extracted growth/propagation helpers, breeding eligibility and deterministic lineage identity, save recovery/relationship validation, explicit diploid genetic loci, mutation provenance, species-aware cultivation suitability, breeding-target forecasts, catalogue diagnostics, and tests for core rules.

Desktop packaging is configured through Electron and electron-builder for a Windows x64 NSIS installer and portable executable. GitHub Actions workflows exist for unit/type/build checks, Playwright browser smoke tests and Windows packaging.

## Important gaps that remain

1. **Simulation orchestration:** `src/App.tsx` still owns the end-to-end day-advance orchestration. A pure day reducer and deterministic whole-game replay fixtures are not complete.
2. **Browser acceptance coverage:** existing smoke tests cover the core flow, finance, save/load, shop purchase and backup export. Settings, full tutorial completion and backup import still need dedicated end-to-end coverage.
3. **Genetics domain boundaries:** genotype, phenotype, mutation evidence and player knowledge have separate fields, but do not yet have a sufficiently strict domain/API boundary. More complete lineage-level breeding programmes and expression history remain future work.
4. **Management depth:** multiple operational rooms, staff specialisations/schedules, configurable automation, production chains, market demand, buyers, contracts and a branching research tree remain incomplete.
5. **Content and balance:** the economy and species catalogue are still prototype data. Recent catalogue audit work identified records needing verified scientific names and species-specific care/trait data. Prototype care profiles and fictional genetics must not be represented as authoritative botanical science.
6. **Release readiness:** Windows package CI is configured, but Steamworks integration, code signing, automatic updates, robust desktop save migration, clean-install/upgrade testing and external playtesting remain outstanding.
7. **Quality gates:** add formatting/linting and CI gates after selecting a lightweight, repository-compatible toolchain; do not introduce a broad formatting churn without a dedicated review.

## Recommended implementation order

1. Extract the complete day-advance logic into a pure, deterministic simulation reducer while preserving current gameplay behaviour and save compatibility.
2. Add deterministic multi-day replay fixtures that cover growth, propagation, breeding completion/failure, mutation discovery, staff training and weekly costs together.
3. Extend browser smoke tests for tutorial completion, settings persistence and backup import/export.
4. Tighten genetics domain boundaries and add cross-outcome distribution tests.
5. Expand management systems in complete vertical slices rather than adding disconnected screens.
6. Improve catalogue completeness using verified data, preserving unknown values as unknown rather than inventing facts.
7. Finish desktop save migration, packaging validation and release-readiness work before Steam distribution.

## Validation limitations

This audit reads repository files and recent commit history. It does not claim that local tests, a browser session, Windows packaging, a live Supabase audit, or Steam release checks were executed during this audit. Check the latest GitHub Actions runs and run the repository acceptance checklist before treating any build as verified.
